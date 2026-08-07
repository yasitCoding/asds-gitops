# AGENTS.md — CSC492 AI Project Rules

## Architecture
- Decoupled services: `/dashboard` (Next.js + Drizzle read path) และ `/control-plane` (FastAPI write path)
- Shared Database Pattern: Dashboard อ่าน PostgreSQL ผ่าน Drizzle; Control Plane เป็นผู้เขียนหลักจาก webhook/OPA/GitOps
- ห้ามใส่ business/policy evaluation logic ใน React UI — อยู่ที่ Control Plane / OPA / `dashboard/src/lib` helpers เท่านั้น

## Must-read Context
- ก่อนงานใหญ่: อ่าน `context.md` และตรวจ `task.md`
- เมื่อจบ task: อัปเดต `[ ]` → `[x]` และ Progressive Log ใน `task.md`
- Planner เขียน `plan.md`; Actor ทำตามแล้วลบ `plan.md` เมื่อเสร็จ

## Database
- ห้ามแก้ schema ตรงใน DB production
- Dashboard schema/migrations: Drizzle Kit
- Control Plane: ปัจจุบันใช้ `db_init.sql` / seed; อย่า `CREATE` แบบ ad-hoc ใน request path
- Alembic เป็นเป้าหมายถัดไปสำหรับ migration ของ Control Plane

## Security
- Webhook ต้องตรวจ `X-Hub-Signature-256` ทุกครั้ง; ห้าม bypass เมื่อไม่มี header/secret
- ห้าม hardcode secrets; ห้ามคืน `webhook_secret` แบบเต็มใน list API
- CORS ห้าม default `*` คู่กับ `allow_credentials=True`
- OPA down → fail-closed (deny) เว้นแต่เปิด fallback ด้วย env ชัดเจน

## Tooling
- Dashboard: TypeScript + Biome (`dashboard/`)
- Control Plane: Python type hints + Pydantic + Ruff (`control-plane/`)
