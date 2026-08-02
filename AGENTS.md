# Project Rules & Customizations for AI Agent

## 1. Context & Task Management (สำคัญมาก)
* **Read Context & Task First:** ก่อนเริ่มทำงานหรือตอบคำถามทุกครั้ง ต้องอ่านข้อมูลใน `context.md` และ `task.md` เพื่อทำความเข้าใจภาพรวมและติดตามงานปัจจุบนเสมอ
* **Automatic Task Tracking Update:** ทุกครั้งที่ดำเนินการพัฒนา หรือแก้ปัญหาในข้อใดข้อหนึ่งตามรายการใน `task.md` สำเร็จแล้ว **ต้องทำการอัปเดตไฟล์ `task.md` โดยเปลี่ยนเครื่องหมาย `[ ]` เป็น `[x]` และเพิ่มบันทึกในหัวข้อ `Recent Progress Log` ทันที** โดยไม่ต้องรอให้ผู้ใช้เตือน
* **No Assumptions:** หากข้อมูลในคำสั่งไม่เพียงพอ ให้ถามผู้ใช้ก่อน ห้ามคาดเดาโครงสร้างหรือเขียนโค้ดขึ้นมาเองโดยไม่มีแหล่งอ้างอิง

## 2. Architecture & Code Quality
* **Decoupled Microservices:** แยกหน้าที่อย่างเด็ดขาดระหว่าง Frontend Dashboard (`/dashboard` - Next.js) และ Control Plane Gateway (`/control-plane` - FastAPI)
* **Separation of Concerns:** ห้ามนำ Business Logic / OPA Policy Check ไปเขียนปนใน UI Component ของ Next.js
* **Respect Folder Structure:** ห้ามสร้างโฟลเดอร์ใหม่นอกเหนือจากที่กำหนดไว้ใน `context.md` Section 3.1 เว้นแต่จะได้รับอนุญาตจากผู้ใช้
* **Database Migration Safety:** ห้ามแก้ไข Database Schema โดยตรง ต้องผ่าน Migration Tool เสมอ (Drizzle Kit สำหรับ Dashboard / Alembic สำหรับ Control Plane) เพื่อป้องกัน Data Loss
* **Type Safety & Linting:** 
  * ใช้ TypeScript สำหรับ Next.js ทุกไฟล์
  * ใช้ Biome ในการ Format และตรวจความถูกต้องของโค้ดฝั่ง JS/TS
* **Python Code Style (Control Plane):**
  * ใช้ Ruff เป็น Linter/Formatter สำหรับโค้ด Python ทุกไฟล์ใน `/control-plane`
  * ทุก Function ต้องมี Type Hints สำหรับ Parameters และ Return Type
  * ใช้ Pydantic Models สำหรับ Request/Response Validation
* **File Length Guideline:** พยายามเขียนไฟล์/Component ไม่เกิน 300 - 500 บรรทัด หากเริ่มยาวให้แยกออกเป็นไฟล์ย่อย

## 3. Security & Error Handling
* **No Hardcoded Secrets:** ห้าม Hardcode API Keys, Database Connection String หรือ Password ลงในโค้ด ให้เรียกใช้ผ่าน `.env` เสมอ
* **Robust Error Handling:** ห้ามปล่อย Catch Error ว่างเปล่า (`catch (error) {}`) ทุก Error ต้องมีการจัดการ บันทึก Log ลง `pipeline_runs` หรือ DB เสมอ

## 4. Communication Style
* **Language:** ใช้ภาษาไทยในการอธิบายและพูดคุย และใช้ภาษาอังกฤษสำหรับตัวแปร ข้อความในโค้ด หรือ Technical Terms
* **Conciseness:** แสดงเฉพาะโค้ดส่วนที่ต้องแก้ไข หรือโค้ดบล็อกใหม่ที่สมบูรณ์

## 5. Edit Review Workflow (การแบ่งงานระหว่าง AI Models)
* **Check `edit.md` First:** ก่อนเริ่มทำงานใหม่ทุกครั้ง ให้ตรวจสอบว่ามีไฟล์ `edit.md` อยู่ที่ root ของโปรเจกต์หรือไม่ — ถ้ามี ให้ดำเนินการแก้ไขตามคำสั่งในไฟล์นั้นให้เสร็จก่อน แล้วลบไฟล์ `edit.md` ทิ้งเมื่อทำครบทุกข้อ
* **Opus = Review Only:** หากใช้ Model ระดับ Opus (หรือ Model ราคาสูง) ให้ทำเฉพาะการ **Review, วางแผน และสร้างไฟล์ `edit.md`** เพื่อบันทึกรายการแก้ไข — ห้ามแก้โค้ดเอง ให้ AI Model ที่ถูกกว่า (เช่น Flash/Sonnet) เป็นผู้ดำเนินการแก้ไขตาม `edit.md` แทน เพื่อประหยัด Token
