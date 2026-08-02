import json
import hmac
import hashlib
import urllib.request
import os

BASE_URL = os.getenv("CONTROL_PLANE_URL", "http://localhost:8000")
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "your-webhook-secret-key")

# Sample Valid Manifest
VALID_MANIFEST = """
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sample-app
spec:
  template:
    spec:
      securityContext:
        runAsNonRoot: true
      containers:
        - name: sample-app
          image: docker.io/myorg/sample-app:v1.0.0
          resources:
            limits:
              cpu: "500m"
              memory: "512Mi"
"""

# Scenario D: Missing Limits Manifest
NO_LIMITS_MANIFEST = """
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sample-app
spec:
  template:
    spec:
      securityContext:
        runAsNonRoot: true
      containers:
        - name: sample-app
          image: docker.io/myorg/sample-app:v1.0.0
"""

# Scenario E: Root Container Manifest
ROOT_MANIFEST = """
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sample-app
spec:
  template:
    spec:
      securityContext:
        runAsNonRoot: false
      containers:
        - name: sample-app
          image: docker.io/myorg/sample-app:v1.0.0
          resources:
            limits:
              cpu: "500m"
              memory: "512Mi"
"""

def send_webhook(name: str, payload: dict) -> dict:
    url = f"{BASE_URL.rstrip('/')}/api/v1/pipeline/webhook"
    raw_bytes = json.dumps(payload).encode("utf-8")
    signature = "sha256=" + hmac.new(WEBHOOK_SECRET.encode("utf-8"), raw_bytes, hashlib.sha256).hexdigest()

    req = urllib.request.Request(
        url,
        data=raw_bytes,
        headers={
            "Content-Type": "application/json",
            "X-Hub-Signature-256": signature
        },
        method="POST"
    )

    print(f"\n=======================================================")
    print(f"🧪 Testing {name}")
    print(f"=======================================================")
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            print(f"✅ Response HTTP {resp.status}:")
            print(json.dumps(data, indent=2))
            return data
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        print(f"❌ HTTPError {e.code}: {body}")
        try:
            return json.loads(body)
        except Exception:
            return {"error": body}
    except Exception as e:
        print(f"⚠️ Failed to connect to Control Plane ({BASE_URL}): {e}")
        return {"status": "connection_error", "message": str(e)}

def run_all_scenarios():
    results = {}

    # Scenario A: All Pass
    results["A"] = send_webhook("Scenario A: All Passed (Clean Test + Clean Scan + Valid Manifest)", {
        "repository_url": "https://github.com/myorg/sample-app.git",
        "commit_hash": "a1b2c3d4e5f67890123456789012345678901234",
        "image_tag": "docker.io/myorg/sample-app:v1.0.0",
        "test_status": "passed",
        "test_output": "PASS src/app.test.js\n  ✓ GET /health (15ms)\n  ✓ GET /api/hello (8ms)",
        "trivy_report": {
            "Results": [{
                "Target": "sample-app",
                "Vulnerabilities": []
            }]
        },
        "manifest_yaml": VALID_MANIFEST
    })

    # Scenario B: Unit Test Failed
    results["B"] = send_webhook("Scenario B: Unit Test Failed", {
        "repository_url": "https://github.com/myorg/sample-app.git",
        "commit_hash": "b2c3d4e5f678901234567890123456789012345a",
        "image_tag": "docker.io/myorg/sample-app:v1.0.1",
        "test_status": "failed",
        "test_output": "FAIL src/app.test.js\n  ✕ GET /health - expected 200 received 500",
        "trivy_report": {"Results": []},
        "manifest_yaml": VALID_MANIFEST
    })

    # Scenario C: Critical CVE Found
    results["C"] = send_webhook("Scenario C: Critical/High CVE Found", {
        "repository_url": "https://github.com/myorg/sample-app.git",
        "commit_hash": "c3d4e5f67890123456789012345678901234567b",
        "image_tag": "docker.io/myorg/sample-app:v1.0.2",
        "test_status": "passed",
        "test_output": "PASS src/app.test.js",
        "trivy_report": {
            "Results": [{
                "Target": "sample-app:v1.0.2",
                "Vulnerabilities": [{
                    "VulnerabilityID": "CVE-2024-9999",
                    "PkgName": "express",
                    "InstalledVersion": "4.16.0",
                    "FixedVersion": "4.19.2",
                    "Severity": "CRITICAL",
                    "Description": "Remote Code Execution vulnerability in Express.js middleware"
                }]
            }]
        },
        "manifest_yaml": VALID_MANIFEST
    })

    # Scenario D: Missing Resource Limits
    results["D"] = send_webhook("Scenario D: Missing Resource Limits", {
        "repository_url": "https://github.com/myorg/sample-app.git",
        "commit_hash": "d4e5f6789012345678901234567890123456789c",
        "image_tag": "docker.io/myorg/sample-app:v1.0.3",
        "test_status": "passed",
        "test_output": "PASS src/app.test.js",
        "trivy_report": {"Results": []},
        "manifest_yaml": NO_LIMITS_MANIFEST
    })

    # Scenario E: Container Runs as Root
    results["E"] = send_webhook("Scenario E: Container Configured to Run as Root", {
        "repository_url": "https://github.com/myorg/sample-app.git",
        "commit_hash": "e5f678901234567890123456789012345678901d",
        "image_tag": "docker.io/myorg/sample-app:v1.0.4",
        "test_status": "passed",
        "test_output": "PASS src/app.test.js",
        "trivy_report": {"Results": []},
        "manifest_yaml": ROOT_MANIFEST
    })

    print("\n=======================================================")
    print("📊 SCENARIOS EVALUATION SUMMARY")
    print("=======================================================")
    for scenario_id, data in results.items():
        status = data.get("status") or data.get("error") or "Unknown"
        violations = data.get("violations", [])
        v_str = f" Violations: {violations}" if violations else ""
        print(f"Scenario {scenario_id}: Status = '{status}'{v_str}")

if __name__ == "__main__":
    run_all_scenarios()
