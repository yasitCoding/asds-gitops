# 🐙 ArgoCD GitOps Controller Integration

> คู่มือการติดตั้งและตั้งค่า ArgoCD บน Local Kubernetes (`minikube`, `k3s`, `kind`, หรือ `Docker Desktop`) สำหรับสอดส่อง (Pull-based Sync) Git Manifest Repository (`gitops-manifests`)

## 📋 ไฟล์การตั้งค่า
- `argocd-app.yaml`: ArgoCD `Application` Custom Resource Definition (CRD) ผูกการสอดส่อง repository `gitops-manifests` เข้ากับ Kubernetes cluster
- `setup-argocd.sh`: Bash script อัตโนมัติสำหรับติดตั้ง ArgoCD และดึง Initial Admin Password

## 🛠️ ขั้นตอนการใช้งาน
1. **เตรียม Local Kubernetes Cluster** (เช่น Minikube):
   ```bash
   minikube start
   ```

2. **รัน Script ติดตั้ง ArgoCD และสร้าง Application CRD**:
   ```bash
   chmod +x argocd/setup-argocd.sh
   ./argocd/setup-argocd.sh
   ```

3. **เปิดหน้า ArgoCD Web Dashboard (Port Forwarding)**:
   ```bash
   kubectl port-forward svc/argocd-server -n argocd 8080:443
   ```
   เข้าใช้งานที่ `https://localhost:8080` (Username: `admin`)

4. **การทำงานของ GitOps Sync**:
   - เมื่อ FastAPI Control Plane Gateway ประเมินผล OPA Policy สำเร็จ จะทำการ Commit & Push อัปเดต Image Tag ใน repository `gitops-manifests`
   - ArgoCD จะตรวจพบความเปลี่ยนแปลงและสั่ง Sync นำ Manifest ล่าสุดมา Apply บน Kubernetes Cluster โดยอัตโนมัติ (Automated Self-healing & Pruning)
