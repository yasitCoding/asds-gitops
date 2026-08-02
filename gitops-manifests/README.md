# 📦 GitOps Manifests Repository

> Repository สำหรับเก็บ Kubernetes Declarative Manifests (`deployment.yaml`, `service.yaml`) ที่ ArgoCD Controller จะทำการสอดส่อง (Watch & Pull-based Sync) เพื่อนำไปปรับปรุงบน Kubernetes Cluster โดยอัตโนมัติเมื่อมีการอัปเดตแท็กอิมเมจจาก FastAPI Control Plane Gateway

## 📂 โครงสร้างไฟล์
- `deployment.yaml`: Kubernetes Deployment Object ของ Application (รองรับการทำ Regex Patch image tag จาก FastAPI Control Plane และผ่านการตรวจสอบ OPA Security Standards)
- `service.yaml`: Kubernetes Service Object สำหรับเปิดช่องทางสื่อสารภายใน Cluster

## 🔒 Policy Compliance Standards Verification
- **RunAsNonRoot:** `spec.template.spec.securityContext.runAsNonRoot: true`
- **Resource Limits:** `spec.template.spec.containers[].resources.limits` (CPU & Memory)
- **Trusted Registry:** `docker.io/myorg/sample-app:<tag>`
