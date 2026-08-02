import json
from typing import Any, Dict, List, Tuple
from app.models.scan_result import ScanResultCreate

class TrivyParserService:
    """Service to parse, summarize, and extract vulnerability data from Trivy JSON reports."""

    @staticmethod
    def parse_scan_report(
        pipeline_run_id: int,
        raw_report: Dict[str, Any]
    ) -> Tuple[Dict[str, int], List[ScanResultCreate]]:
        """
        Parses a Trivy JSON report dict.
        Returns:
            - scan_summary: Dict with vulnerability counts (critical, high, medium, low, total)
            - scan_results: List of ScanResultCreate model instances for database insertion
        """
        summary = {
            "critical": 0,
            "high": 0,
            "medium": 0,
            "low": 0,
            "total": 0,
        }
        extracted_vulnerabilities: List[ScanResultCreate] = []

        if not raw_report or "Results" not in raw_report:
            return summary, extracted_vulnerabilities

        results = raw_report.get("Results", [])
        if not isinstance(results, list):
            return summary, extracted_vulnerabilities

        for result in results:
            vulnerabilities = result.get("Vulnerabilities", [])
            if not isinstance(vulnerabilities, list):
                continue

            for vuln in vulnerabilities:
                cve_id = vuln.get("VulnerabilityID", "UNKNOWN")
                pkg_name = vuln.get("PkgName", "UNKNOWN")
                severity = str(vuln.get("Severity", "LOW")).upper()
                installed_ver = vuln.get("InstalledVersion")
                fixed_ver = vuln.get("FixedVersion")
                desc = vuln.get("Description")

                # Count severities
                if severity == "CRITICAL":
                    summary["critical"] += 1
                elif severity == "HIGH":
                    summary["high"] += 1
                elif severity == "MEDIUM":
                    summary["medium"] += 1
                elif severity == "LOW":
                    summary["low"] += 1
                summary["total"] += 1

                # Build ScanResultCreate model
                scan_item = ScanResultCreate(
                    pipeline_run_id=pipeline_run_id,
                    scanner_name="Trivy",
                    severity=severity,
                    cve_id=cve_id,
                    package_name=pkg_name,
                    installed_version=installed_ver,
                    fixed_version=fixed_ver,
                    description=desc,
                )
                extracted_vulnerabilities.append(scan_item)

        return summary, extracted_vulnerabilities

    @staticmethod
    def parse_from_json_string(
        pipeline_run_id: int,
        json_str: str
    ) -> Tuple[Dict[str, int], List[ScanResultCreate]]:
        """Parses a Trivy report from a JSON string."""
        try:
            raw_data = json.loads(json_str)
            return TrivyParserService.parse_scan_report(pipeline_run_id, raw_data)
        except Exception as e:
            # Fallback if invalid JSON
            summary = {"critical": 0, "high": 0, "medium": 0, "low": 0, "total": 0, "error": str(e)}
            return summary, []
