export interface RemediationGuide {
  title: string;
  description: string;
  snippet: string;
}

export function getRemediationGuide(violationText: string): RemediationGuide {
  if (violationText.includes("runAsNonRoot")) {
    return {
      title: "Fix: Configure Container to Run as Non-Root",
      description:
        "แก้ไขไฟล์ Deployment Manifest YAML โดยเพิ่ม securityContext runAsNonRoot: true",
      snippet: `spec:
  template:
    spec:
      securityContext:
        runAsNonRoot: true`,
    };
  }
  if (
    violationText.includes("resource limits") ||
    violationText.includes("limits")
  ) {
    return {
      title: "Fix: Set CPU and Memory Resource Limits",
      description:
        "กำหนดขอบเขตการใช้งานทรัพยากร CPU และ Memory ให้แก่ Container ทุกตัว",
      snippet: `resources:
  limits:
    cpu: "500m"
    memory: "512Mi"`,
    };
  }
  if (
    violationText.includes("registry") ||
    violationText.includes("untrusted")
  ) {
    return {
      title: "Fix: Use Trusted Container Registry",
      description:
        "เปลี่ยนที่มาของ Container Image ให้มาจาก Registry ที่ได้รับอนุญาตเท่านั้น (เช่น docker.io/ หรือ ghcr.io/)",
      snippet: `containers:
  - name: app
    image: docker.io/myorg/myapp:latest`,
    };
  }
  if (violationText.includes("Unit test")) {
    return {
      title: "Fix: Resolve Unit Test Failures",
      description: "แก้ไขโค้ดที่ทำให้ Unit Test ไม่ผ่านในเครื่อง Local ก่อน Push ขึ้น Git",
      snippet: "npm test # Run tests locally to inspect failure traceback",
    };
  }
  return {
    title: "Fix: Review Security Policy Violation",
    description:
      "ตรวจสอบการตั้งค่าความปลอดภัยของไฟล์ Manifest และแพ็กเกจให้สอดคล้องกับข้อกำหนด",
    snippet: "# Refer to OPA Rego policy rules in /policies directory",
  };
}
