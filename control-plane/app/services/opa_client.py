import os
import logging
from typing import Any, Dict, List, Optional, Set
import httpx
from pydantic import BaseModel

logger = logging.getLogger(__name__)

class OPAEvaluationResult(BaseModel):
    is_allowed: bool
    status_code: str  # 'passed', 'test_failed', 'scan_failed', 'policy_failed'
    violations: List[str]
    violation_details: List[Dict[str, Any]]

class OPAClientService:
    """Service to interact with Open Policy Agent (OPA) REST API."""

    def __init__(self, opa_url: Optional[str] = None):
        self.opa_url = (opa_url or os.getenv("OPA_URL", "http://localhost:8181/v1/data")).rstrip("/")

    async def evaluate_policy(
        self,
        package_name: str,
        input_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Sends evaluation request to OPA REST API for a specific package.
        URL format: POST {OPA_URL}/{package_name}
        Payload: {"input": input_data}
        """
        url = f"{self.opa_url}/{package_name}"
        payload = {"input": input_data}

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                return response.json().get("result", {})
        except Exception as e:
            if os.getenv("OPA_ALLOW_LOCAL_FALLBACK", "false").lower() == "true":
                logger.warning(
                    "OPA unavailable (%s); using explicitly enabled local fallback for '%s'",
                    e,
                    package_name,
                )
                return self._fallback_local_evaluation(package_name, input_data)
            logger.error("OPA server unavailable for '%s': %s", package_name, e)
            return {
                "allow": False,
                "violation": [f"OPA policy service unavailable for '{package_name}'"],
                "opa_unavailable": True,
            }

    def _fallback_local_evaluation(self, package_name: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Local Python evaluation fallback matching policies/*.rego rules when OPA REST server is offline."""
        test_status = input_data.get("test_status")
        scan_results = input_data.get("scan_results", [])
        manifest = input_data.get("manifest") or {}

        if package_name == "unit_test":
            is_pass = (test_status == "passed")
            return {
                "allow": is_pass,
                "violation": [] if is_pass else [f"Unit test status is '{test_status}' (expected 'passed')"]
            }

        if package_name == "cve_threshold":
            violations = []
            for item in scan_results:
                sev = str(item.get("severity", "")).upper()
                if sev in ["CRITICAL", "HIGH"]:
                    violations.append(f"Package '{item.get('package_name', 'unknown')}' has {sev} vulnerability ({item.get('cve_id', 'CVE-Unknown')})")
            return {
                "allow": len(violations) == 0,
                "violation": violations
            }

        containers = []
        security_context = {}
        try:
            pod_spec = manifest.get("spec", {}).get("template", {}).get("spec", {})
            containers = pod_spec.get("containers", [])
            security_context = pod_spec.get("securityContext", {})
        except Exception:
            pass

        if package_name == "run_as_non_root":
            pod_is_non_root = security_context.get("runAsNonRoot") is True
            containers_are_non_root = bool(containers) and all(
                container.get("securityContext", {}).get("runAsNonRoot") is True
                for container in containers
            )
            is_non_root = pod_is_non_root or containers_are_non_root
            return {
                "allow": is_non_root,
                "violation": []
                if is_non_root
                else ["Pod or every container must set 'runAsNonRoot' to true"],
            }

        if package_name == "resource_limits":
            missing = []
            for c in containers:
                limits = c.get("resources", {}).get("limits", {})
                if not limits.get("cpu") or not limits.get("memory"):
                    missing.append(c.get("name", "container"))
            return {
                "allow": len(missing) == 0,
                "violation": [f"Container '{c}' is missing CPU or memory resource limits" for c in missing]
            }

        if package_name == "trusted_registry":
            untrusted = []
            for c in containers:
                img = str(c.get("image", ""))
                if not (img.startswith("docker.io/") or img.startswith("ghcr.io/")):
                    untrusted.append((c.get("name", "container"), img))
            return {
                "allow": len(untrusted) == 0,
                "violation": [f"Container '{name}' uses image from untrusted registry: {img}" for name, img in untrusted]
            }

        return {"allow": True, "violation": []}

    async def evaluate_all_policies(
        self,
        test_status: Optional[str],
        scan_results: List[Dict[str, Any]],
        manifest_data: Optional[Dict[str, Any]],
        enabled_policies: Optional[Set[str]] = None,
    ) -> OPAEvaluationResult:
        """
        Evaluates input against all 5 core security policy rules:
        1. unit_test
        2. cve_threshold
        3. run_as_non_root
        4. resource_limits
        5. trusted_registry
        """
        input_payload = {
            "test_status": test_status,
            "scan_results": scan_results,
            "manifest": manifest_data or {},
        }

        enabled = (
            enabled_policies
            if enabled_policies is not None
            else {
                "unit_test",
                "cve_threshold",
                "run_as_non_root",
                "resource_limits",
                "trusted_registry",
            }
        )
        all_violations: List[str] = []
        violation_details: List[Dict[str, Any]] = []

        unit_res = (
            await self.evaluate_policy("unit_test", input_payload)
            if "unit_test" in enabled
            else {"allow": True}
        )
        if unit_res.get("opa_unavailable"):
            return self._opa_unavailable_result("unit_test", unit_res)
        if not unit_res.get("allow", False):
            violations = unit_res.get("violation", [f"Unit test status is '{test_status}'"])
            all_violations.extend(violations)
            return OPAEvaluationResult(
                is_allowed=False,
                status_code="test_failed",
                violations=all_violations,
                violation_details=[{"policy": "unit_test", "detail": v} for v in violations]
            )

        cve_res = (
            await self.evaluate_policy("cve_threshold", input_payload)
            if "cve_threshold" in enabled
            else {"allow": True}
        )
        if cve_res.get("opa_unavailable"):
            return self._opa_unavailable_result("cve_threshold", cve_res)
        if not cve_res.get("allow", False):
            violations = cve_res.get("violation", ["CVE threshold policy failed"])
            all_violations.extend(violations)
            return OPAEvaluationResult(
                is_allowed=False,
                status_code="scan_failed",
                violations=all_violations,
                violation_details=[{"policy": "cve_threshold", "detail": v} for v in violations]
            )

        manifest_policies = ["run_as_non_root", "resource_limits", "trusted_registry"]
        has_policy_failure = False

        for pol_name in manifest_policies:
            if pol_name not in enabled:
                continue
            pol_res = await self.evaluate_policy(pol_name, input_payload)
            if pol_res.get("opa_unavailable"):
                return self._opa_unavailable_result(pol_name, pol_res)
            if not pol_res.get("allow", False):
                has_policy_failure = True
                violations = pol_res.get("violation", [f"Policy '{pol_name}' evaluation failed"])
                all_violations.extend(violations)
                for v in violations:
                    violation_details.append({"policy": pol_name, "detail": v})

        if has_policy_failure:
            return OPAEvaluationResult(
                is_allowed=False,
                status_code="policy_failed",
                violations=all_violations,
                violation_details=violation_details
            )

        return OPAEvaluationResult(
            is_allowed=True,
            status_code="passed",
            violations=[],
            violation_details=[]
        )

    @staticmethod
    def _opa_unavailable_result(
        package_name: str,
        response: Dict[str, Any],
    ) -> OPAEvaluationResult:
        violations = response.get(
            "violation",
            [f"OPA policy service unavailable for '{package_name}'"],
        )
        return OPAEvaluationResult(
            is_allowed=False,
            status_code="failed",
            violations=violations,
            violation_details=[{"policy": package_name, "detail": violation} for violation in violations],
        )
