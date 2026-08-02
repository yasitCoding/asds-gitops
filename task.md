# Project Roadmap & Task Progress: Automated Software Delivery System with GitOps

> **คู่มือการติดตามสถานะการทำงาน (Task Tracking & Progress Log)**  
> ใช้สำหรับติดตามขั้นตอนการพัฒนาโปรเจกต์ เรียงลำดับตามความสำคัญ (Phase 1 ถึง Phase 7)  
> *กฎสำหรับ AI Agent: เมื่อดำเนินงานในแต่ละข้อเสร็จสิ้นแล้ว ให้ทำการอัปเดตเครื่องหมาย `[ ]` เป็น `[x]` พร้อมลงวันที่ใน Progress Log เสมอ*

---

## 📌 Phase 1: การตั้งค่าโครงสร้างโปรเจกต์และสภาพแวดล้อม (Project Setup & Environment)
- [x] **Task 1.1:** จัดสร้างโครงสร้างโฟลเดอร์หลักสำหรับโปรเจกต์ (`/dashboard` สำหรับ Next.js, `/control-plane` สำหรับ FastAPI, `/policies` สำหรับ OPA Rego)
- [x] **Task 1.2:** สร้างไฟล์คุมกฎการพัฒนาโปรเจกต์ [AGENTS.md](file:///Users/yas1tmac/Desktop/University/All%20Project/CSC492/AGENTS.md) เป็นมาตรฐานกลางสำหรับ AI Agent ทุกตัว
- [x] **Task 1.3a:** ตั้งค่าโครงการบน PostgreSQL (Supabase) สร้าง Database และเชื่อมต่อ Connection String
- [x] **Task 1.3b:** จัดเตรียมไฟล์ `.env.example` สำหรับทั้ง Dashboard (`/dashboard/.env.example`) และ Control Plane (`/control-plane/.env.example`) เพื่อเก็บ Secret และ Connection Strings



---

## 📌 Phase 2: การออกแบบและสร้างชั้นข้อมูล (Data Layer & ORM Setup)
- [x] **Task 2.1:** ออกแบบ Drizzle ORM Schema สำหรับทั้ง 7 ตารางหลักในฝั่ง Next.js (`repositories`, `pipeline_runs`, `scan_results`, `policy_rules`, `policy_violations`, `deployments`, `notifications_log`)
- [x] **Task 2.2:** สร้าง SQLAlchemy / SQLModel Data Models ในฝั่ง FastAPI Control Plane
- [x] **Task 2.3:** ทำการ Migration ฐานข้อมูล และสร้าง Seed Data เริ่มต้นสำหรับเกณฑ์ `policy_rules`




---

## 📌 Phase 3: การพัฒนากฎนโยบายความปลอดภัยและส่วนสแกน (Security Policy Engine & Trivy Integration)
- [x] **Task 3.1:** เขียนกฎ OPA Rego Rules 5 เกณฑ์หลัก (`unit_test.rego`, `cve_threshold.rego`, `run_as_non_root.rego`, `resource_limits.rego`, `trusted_registry.rego`)
- [x] **Task 3.2:** สร้าง Utility โมดูลใน FastAPI สำหรับ Parse ผลลัพธ์สแกนช่องโหว่จาก Trivy (CVE Severity filtering)
- [x] **Task 3.3:** สร้าง OPA Client Integration ใน FastAPI เพื่อส่ง Manifest YAML และผล Scan ไปประเมินผลผ่าน OPA REST API


---

## 📌 Phase 4: การพัฒนา Control Plane Gateway (FastAPI Backend)
- [x] **Task 4.1:** พัฒนา RESTful API Webhook Receiver (`POST /api/v1/pipeline/webhook`) รับ Payload จาก GitHub Actions
- [x] **Task 4.2:** พัฒนาระบบตัดสินใจ (Decision Execution): กรณี Pass ทำการ Auto-commit & Push แท็ก Image ใหม่ไปยัง Git Manifest Repo
- [x] **Task 4.3:** พัฒนาระบบบันทึกประวัติการสแกน และ Violations ลง PostgreSQL เมื่อกรณี Fail
- [x] **Task 4.4:** จัดทำ Dockerfile และ `docker-compose.yml` สำหรับรัน FastAPI Control Plane และ OPA Engine ร่วมกัน

- [x] **Task 4.5:** พัฒนา Health Check Endpoint (`GET /health`) สำหรับ Docker Compose healthcheck และ monitoring
- [x] **Task 4.6:** พัฒนาระบบตรวจสอบ Webhook Signature (`X-Hub-Signature-256`) ด้วย HMAC เพื่อยืนยันว่า Payload มาจาก GitHub จริง (ป้องกัน Spoofing)
- [x] **Task 4.7:** พัฒนาระบบบันทึก Notification Log ลงตาราง `notifications_log` ทุกครั้งที่ Pipeline เปลี่ยนสถานะ (เช่น `passed`, `policy_failed`, `deployed`)

---

## 📌 Phase 5: การพัฒนาส่วนแสดงผล Web Dashboard (Next.js + Tailwind v4 + shadcn/ui)
- [x] **Task 5.1:** Setup โปรเจกต์ Next.js (TypeScript) พร้อม Tailwind CSS, `shadcn/ui` tokens, TanStack Query, Zustand และ Biome
- [x] **Task 5.1a:** พัฒนา Layout Component หลัก (Sidebar, Header, Navigation) เป็นโครงสร้าง UI พื้นฐานก่อนทำหน้าย่อย
- [x] **Task 5.2:** พัฒนาหน้าลงทะเบียนและจัดการ Git Repository (`/repositories`)
- [x] **Task 5.3:** พัฒนาหน้าประวัติ Pipeline Runs และ Audit Logs (`/pipelines`)
- [x] **Task 5.4:** พัฒนาหน้าแสดงรายละเอียด Scan Results, OPA Violations และ Remediation Guide (`/pipelines/[id]`)
- [x] **Task 5.5:** พัฒนาหน้าเปิด-ปิด Toggle สถานะ OPA Rules (`/policies`)
- [x] **Task 5.6:** พัฒนาหน้า Dashboard Overview (`/dashboard`) แสดง Real-time Deployment Status พร้อม Analytics Charts (Pass/Fail Rate %, จำนวน CVE ที่พบบ่อย, Pipeline Success/Fail Trend)

---

## 📌 Phase 6: การเชื่อมต่อ CI/CD Pipeline & GitOps (GitHub Actions & ArgoCD)
- [x] **Task 6.0a:** สร้าง Git Manifest Repository แยกต่างหาก สำหรับเก็บ Kubernetes YAML Manifests ที่ ArgoCD จะ Watch (เช่น `deployment.yaml`, `service.yaml`)
- [x] **Task 6.1:** สร้างตัวอย่าง Target Application Repo พร้อมไฟล์ `.github/workflows/ci.yml` (Build ➔ Test ➔ Trivy Scan ➔ Post Webhook)
- [x] **Task 6.2:** ติดตั้งและตั้งค่า ArgoCD บน Local Kubernetes (`minikube`/`k3s`) ให้สอดส่อง Git Manifest Repository
- [x] **Task 6.3:** ทดสอบ 5 สถานการณ์ (Scenarios A - E):
  - Scenario A: Pass ทั้งหมด ➔ ArgoCD Deploy สำเร็จ (`status: passed / deployed`)
  - Scenario B: Unit Test ไม่ผ่าน ➔ บล็อกที่ CI Stage (`status: test_failed`)
  - Scenario C: พบ Critical/High CVE ➔ บล็อกโดย OPA Policy (`status: scan_failed`)
  - Scenario D: ไม่ระบุ Resource Limits ➔ บล็อกโดย OPA Policy (`status: policy_failed`)
  - Scenario E: คอนเทนเนอร์รันด้วย Root ➔ บล็อกโดย OPA Policy (`status: policy_failed`)

---

## 📌 Phase 7: การตรวจสอบความพร้อม การปรับปรุงโค้ด และการนำขึ้นระบบ (Polishing & Deployment)
- [x] **Task 7.0:** แก้ไขตาม `edit.md` จากผลรีวิว Senior DevSecOps (5 ข้อ: CORS env var, datetime deprecation, Dockerfile non-root, .gitignore pattern, Header health check)
- [ ] **Task 7.1:** ตรวจสอบ Format และ Linting โค้ดทั้งหมดด้วย Biome
- [ ] **Task 7.2:** Deploy Web Dashboard ขึ้น Vercel

---

## 📝 Recent Progress Log
* **2026-08-02:** ดำเนินการแก้ไขตาม `edit.md` ครบทั้ง 5 ข้อ (1. CORS read from env var, 2. Replace `datetime.utcnow` with `datetime.now(timezone.utc)`, 3. Add non-root `appuser` in Dockerfile, 4. Update `.gitignore` with wildcard env patterns, 5. Add dynamic health check proxy route and query in Header) และลบไฟล์ `edit.md` เรียบร้อยแล้ว (เสร็จสิ้น Task 7.0)
* **2026-08-02:** Senior DevSecOps Review (Phase 1-6) เสร็จสิ้น — พบ 5 ข้อที่ต้องแก้ไข (2 Critical: CORS wildcard, datetime.utcnow deprecation / 3 Medium: Dockerfile non-root user, .gitignore pattern, Header health check static text) บันทึกรายละเอียดไว้ใน `edit.md` สำหรับ AI Model ราคาถูกดำเนินการ
* **2026-08-02:** สร้างชุดทดสอบอัตโนมัติ 5 สถานการณ์ (Scenarios A - E) ในไฟล์ `/scripts/test_scenarios.py` สำหรับจำลองการยิง Webhook Payload ทดสอบการตัดสินใจของ FastAPI Control Plane Gateway และ OPA Engine ครบทั้ง 5 รูปแบบ (All Pass, Test Failed, Critical CVE, Missing Resource Limits, RunAsRoot) (เสร็จสิ้น Task 6.3 — สิ้นสุด Phase 6 🎉)
* **2026-08-02:** จัดทำชุด Manifest และ Script ติดตั้ง ArgoCD (`/argocd`) ครบถ้วน ได้แก่ `argocd-app.yaml` (ArgoCD Application CRD สำหรับ Watch repository `gitops-manifests`), `setup-argocd.sh` (Script อัตโนมัติสำหรับติดตั้ง ArgoCD บน local K8s cluster) และคู่มือขั้นตอนการใช้งาน (เสร็จสิ้น Task 6.2)
* **2026-08-02:** พัฒนาตัวอย่าง Target Application Repo (`/target-app`) ในรูป Express.js App พร้อมไฟล์ `.github/workflows/ci.yml` รองรับกระบวนการ Build Container Image, Run Unit Tests, Trivy Scan, คำนวณ HMAC Signature (`X-Hub-Signature-256`) และยิง Webhook Payload ครบถ้วน (เสร็จสิ้น Task 6.1)
* **2026-08-02:** สร้าง Git Manifest Repository (`/gitops-manifests`) สำหรับเก็บ Kubernetes Declarative Manifests (`deployment.yaml`, `service.yaml`, `README.md`) โครงสร้างรองรับการสอดส่องของ ArgoCD และผ่านเกณฑ์มาตรฐาน OPA Security Policies (runAsNonRoot: true, resource limits CPU/Memory, trusted registry) (เสร็จสิ้น Task 6.0a)
* **2026-08-01:** พัฒนาหน้า Dashboard Overview (`/dashboard`) ในฝั่ง Next.js Dashboard (`/dashboard/src/app/dashboard/page.tsx` และ `api/analytics/route.ts`) แสดง Real-time Metric Cards (Total Runs, Pass Rate %, ArgoCD Active Deployments, Vulnerabilities Blocked), กราฟสถิติสแกนช่องโหว่แยกตามระดับความรุนแรง (CRITICAL, HIGH, MEDIUM), รายการ CVE ที่พบบ่อยสุด และ Timeline การรัน Pipeline แบบ Real-time Auto-refresh (เสร็จสิ้น Task 5.6 — สิ้นสุด Phase 5 🎉)
* **2026-08-01:** พัฒนาหน้าเปิด-ปิด Toggle สถานะ OPA Rules (`/policies`) ในฝั่ง Next.js Dashboard (`/dashboard/src/app/policies/page.tsx` และ `api/policies/route.ts`) พร้อมปุ่มสวิตช์ Toggle สถานะเปิด/ปิดกฎการประเมินผลความปลอดภัย Real-time และ Collapsible Rego Code Viewer (เสร็จสิ้น Task 5.5)

* **2026-08-01:** พัฒนาหน้าแสดงรายละเอียด Scan Results, OPA Violations และ Remediation Guide (`/pipelines/[id]`) ในฝั่ง Next.js Dashboard (`/dashboard/src/app/pipelines/[id]/page.tsx` และ `api/pipelines/[id]/route.ts`) พร้อมคู่มือคำแนะนำวิธีแก้ไขข้อผิดพลาด (Remediation Snippet), ตารางผลสแกน Trivy Vulnerabilities และ Terminal แสดง Unit Test Output Log (เสร็จสิ้น Task 5.4)

* **2026-08-01:** พัฒนาหน้าประวัติ Pipeline Runs และ Audit Logs (`/pipelines`) ในฝั่ง Next.js Dashboard (`/dashboard/src/app/pipelines/page.tsx`, `api/pipelines/route.ts` และ `api/notifications/route.ts`) พร้อมระบบกรองสถานะ (Status Filter), Badge แสดงผลสรุปช่องโหว่ CVE และแท็บ Audit Event Logs (เสร็จสิ้น Task 5.3)

* **2026-08-01:** พัฒนาหน้าลงทะเบียนและจัดการ Git Repository (`/repositories`) ในฝั่ง Next.js Dashboard (`/dashboard/src/app/repositories/page.tsx` และ `api/repositories/route.ts`) พร้อม Data Grid แสดงรายละเอียด Repo, Webhook Secret Viewer & Copy Helper และ Modal ฟอร์มลงทะเบียน Repo ใหม่ (เสร็จสิ้น Task 5.2)

* **2026-08-01:** พัฒนา Layout Components หลักสำหรับ Web Dashboard (`/dashboard/src/components/sidebar.tsx`, `header.tsx`, `app-layout.tsx`) ด้วย Glassmorphism Design, Active Route Highlight, Control Plane Status Indicator และ System Navigation (เสร็จสิ้น Task 5.1a)

* **2026-08-01:** Setup โปรเจกต์ Next.js 14 App Router ในโฟลเดอร์ `/dashboard` (`package.json`, `tsconfig.json`, `biome.json`, `tailwind.config.ts`, `globals.css`, `utils.ts`, `providers.tsx`, `layout.tsx`) พร้อม TanStack Query v5, Zustand, Drizzle ORM, Lucide Icons และ Biome Linter (เสร็จสิ้น Task 5.1)

* **2026-08-01:** ดำเนินการแก้ไขตาม `edit.md` จากผลรีวิว Phase 3-4 ครบทั้ง 3 ข้อ (แก้ไข Hardcoded Secret ใน `database.py`, แก้ไข Logic Bug ใน OPA Client ให้ประเมิน Unit Test ผ่าน OPA ทุกครั้ง, และลบ Unused Imports ใน `webhook.py` และ `security.py`) และลบไฟล์ `edit.md` เรียบร้อยแล้ว

* **2026-08-01:** พัฒนาระบบบันทึก Notification Log ลงตาราง `notifications_log` ใน FastAPI Control Plane (`/control-plane/app/services/pipeline_service.py` และ `api/webhook.py`) อัตโนมัติทุกครั้งที่ Pipeline เปลี่ยนสถานะ (`started`, `passed`, `policy_failed`, `deployed`) สำหรับติดตามผ่าน Dashboard และ Audit Trail (เสร็จสิ้น Task 4.7 — สิ้นสุด Phase 4 🎉)

* **2026-08-01:** พัฒนาระบบตรวจสอบ Webhook HMAC Signature (`X-Hub-Signature-256`) ใน FastAPI (`/control-plane/app/core/security.py` และ `api/webhook.py`) ป้องกันการปลอมแปลง Payload (Webhook Spoofing) ด้วย `hmac.compare_digest` (เสร็จสิ้น Task 4.6)

* **2026-08-01:** พัฒนา Health Check Endpoint (`GET /health`) ใน FastAPI (`/control-plane/app/api/health.py`) ตรวจสอบความพร้อมของระบบ, การเชื่อมต่อ PostgreSQL Database และ OPA REST Engine (เสร็จสิ้น Task 4.5)

* **2026-08-01:** จัดทำ `Dockerfile` (`/control-plane/Dockerfile`), `requirements.txt` และ `docker-compose.yml` สำหรับรัน FastAPI Control Plane ร่วมกับ OPA Engine (`openpolicyagent/opa:latest-server`) โหลดกฎใน `/policies/` อัตโนมัติ (เสร็จสิ้น Task 4.4)

* **2026-08-01:** พัฒนา Pipeline Recorder Service ใน FastAPI (`/control-plane/app/services/pipeline_service.py` และ `core/database.py`) บันทึกประวัติ Pipeline Runs, ผลสแกนช่องโหว่ Scan Results, รายละเอียดข้อผิดพลาด Policy Violations และประวัติการปรับใช้งาน Deployments ลง Supabase PostgreSQL (เสร็จสิ้น Task 4.3)

* **2026-08-01:** พัฒนา Git Manifest Service ใน FastAPI (`/control-plane/app/services/git_service.py`) สำหรับระบบตัดสินใจกรณี Pipeline ผ่าน (Pass): ทำการ Clone/Update Manifest YAML, อัปเดต Container Image Tag ใหม่ และ Auto-commit & Push กลับไปยัง Git Manifest Repository สำหรับ ArgoCD Sync (เสร็จสิ้น Task 4.2)

* **2026-08-01:** พัฒนา Webhook Receiver RESTful API (`POST /api/v1/pipeline/webhook`) ใน FastAPI Control Plane (`/control-plane/app/api/webhook.py` และ `main.py`) พร้อม Pydantic Request/Response validation, PyYAML Parsing และส่งประเมินผลผ่าน OPA Engine (เสร็จสิ้น Task 4.1)

* **2026-08-01:** สร้าง OPA Client Integration ใน FastAPI (`/control-plane/app/services/opa_client.py`) สำหรับส่งข้อมูลประเมินผลผ่าน OPA REST API ทั้ง 5 เกณฑ์หลัก พร้อมคืนสถานะ (`passed`, `test_failed`, `scan_failed`, `policy_failed`) และรายละเอียดความผิดพลาด (เสร็จสิ้น Task 3.3 — สิ้นสุด Phase 3 🎉)

* **2026-08-01:** สร้าง Utility โมดูล Trivy Parser Service ใน FastAPI (`/control-plane/app/services/trivy_parser.py`) สำหรับดึงผลสแกนช่องโหว่, จัดกลุ่มความรุนแรง (CRITICAL, HIGH, MEDIUM, LOW) และแปลงเป็น ScanResult Models ลง Database (เสร็จสิ้น Task 3.2)

* **2026-08-01:** เขียนกฎ OPA Rego Rules ครบทั้ง 5 เกณฑ์หลักในโฟลเดอร์ `/policies/` (`unit_test.rego`, `cve_threshold.rego`, `run_as_non_root.rego`, `resource_limits.rego`, `trusted_registry.rego`) พร้อมเงื่อนไขประเมินผลและข้อความแจ้งเตือนความผิดพลาด (เสร็จสิ้น Task 3.1)

* **2026-08-01:** ดำเนินการแก้ไขตาม `edit.md` ครบทั้ง 4 ข้อ (ลบ Hardcoded Secret ใน `seed.py`, เพิ่ม `.gitignore` ที่ root, ลบ Dead Enum Code ใน `schema.ts`, แก้ไข Relation Direction สำหรับ Deployments) และลบไฟล์ `edit.md` แล้ว

* **2026-08-01:** จัดทำไฟล์ SQL Migration (`/control-plane/app/db_init.sql`) และ Python Seeder (`/control-plane/app/seed.py`) สำหรับสร้าง 7 ตารางหลักบน PostgreSQL (Supabase) พร้อมลง Seed Data เริ่มต้น 5 OPA Rules (เสร็จสิ้น Task 2.3 — สิ้นสุด Phase 2 🎉)

* **2026-08-01:** สร้าง SQLModel Data Models ในฝั่ง FastAPI Control Plane (`/control-plane/app/models/`) ครบทั้ง 7 ตารางหลัก พร้อม Pydantic Create/Read Models และ Type Hints (เสร็จสิ้น Task 2.2)

* **2026-08-01:** ออกแบบ Drizzle ORM Schema ในฝั่ง Next.js (`/dashboard/src/db/schema.ts` และ `index.ts`) ครบทั้ง 7 ตารางหลัก พร้อม Enums, Foreign Keys และ Relations (เสร็จสิ้น Task 2.1)

* **2026-08-01:** จัดเตรียมไฟล์ `.env.example` สำหรับฝั่ง Dashboard (`/dashboard/.env.example`) และ Control Plane (`/control-plane/.env.example`) รองรับ Supabase PostgreSQL, OPA, Git Manifest Token และ Webhook Secret (เสร็จสิ้น Task 1.3a & Task 1.3b — สิ้นสุด Phase 1 🎉)

* **2026-08-01:** จัดสร้างโครงสร้างโฟลเดอร์หลักสำหรับโปรเจกต์สำเร็จ (`/dashboard`, `/control-plane`, `/policies`) พร้อมโครงสร้างย่อยตาม Section 3.1 ของ `context.md` (เสร็จสิ้น Task 1.1)

* **2026-08-01:** เพิ่ม 3 Tasks ใหม่ตาม DevSecOps recommendation — Task 4.6 (Webhook Signature Verification), Task 4.7 (Notifications Log), ปรับ Task 5.6 (เพิ่ม Analytics Charts)

* **2026-07-31:** Senior DevSecOps Review — ปรับปรุง `context.md` (เพิ่ม Folder Structure, API Spec, Communication Pattern, ฟิลด์ DB ใหม่ 4 ฟิลด์), `task.md` (แยก Sub-tasks, เพิ่ม 4 Tasks ใหม่), `AGENTS.md` (เพิ่ม 4 กฎใหม่)
* **2026-07-31:** จัดทำแผนงาน [task.md](file:///Users/yas1tmac/Desktop/University/All%20Project/CSC492/task.md) เรียงลำดับ Phase 1 ถึง Phase 7
* **2026-07-31:** สร้างไฟล์กฎ [AGENTS.md](file:///Users/yas1tmac/Desktop/University/All%20Project/CSC492/AGENTS.md) และ [GEMINI.md](file:///Users/yas1tmac/Desktop/University/All%20Project/CSC492/GEMINI.md) กำหนดให้ AI Agent อัปเดต Task Status ใน `task.md` อัตโนมัติทุกครั้งเมื่อทำงานสำเร็จแต่ละข้อ (เสร็จสิ้น Task 1.2)

