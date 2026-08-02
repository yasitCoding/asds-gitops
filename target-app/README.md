# 🎯 Target Application (DevSecOps Demo Application)

> ตัวอย่าง Target Application (Express.js) สำหรับจำลองขั้นตอนการทำ CI/CD Pipeline (Build ➔ Test ➔ Trivy Scan ➔ Post Webhook) มายัง FastAPI Control Plane Gateway

## 📂 โครงสร้างไฟล์
- `src/app.js`: Express.js Application Server
- `src/app.test.js`: Jest Unit Tests
- `Dockerfile`: Multi-stage Docker build config (Non-root `USER node`)
- `deployment.yaml`: Kubernetes Deployment Manifest ส่งไปยัง Control Plane Webhook
- `.github/workflows/ci.yml`: GitHub Actions CI Workflow

## 🚀 การรัน Unit Tests ภายในเครื่อง
```bash
npm install
npm test
```
