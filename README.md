# University Grades Platform (starter MVP)

Arabic-first web app starter for university grade management.

## Architecture
- `frontend/`: React + Vite user interface.
- `backend/`: Express REST API, SQLite, JWT authentication and role checks.
- `blockchain/`: Hardhat + Solidity audit contract.
- **Personal grades stay in SQLite.** The blockchain receives only a randomised SHA-256 audit commitment, never student names, IDs, course names, or numeric grades.
- The backend is a learning starter, not production-ready. Before real student data: use HTTPS, secure secrets, backups, rate limiting, audit monitoring, institutional approval, and a security review.

## Requirements
- Node.js 20+ (Node 22 LTS recommended)
- npm
- VS Code (recommended)

## 1) Start the backend
Open a terminal in `backend/`:
```bash
cp .env.example .env
npm install
npm run dev
```
On Windows PowerShell, copy the file with:
```powershell
Copy-Item .env.example .env
```
Default demo admin: `admin@university.local` / `ChangeMe123!`
Change `JWT_SECRET` and `ADMIN_PASSWORD` in `.env` before use. The demo admin is created on first startup.

Backend listens at `http://localhost:4000`.

## 2) Start the frontend
Open a second terminal in `frontend/`:
```bash
npm install
npm run dev
```
Open the Vite URL shown, normally `http://localhost:5173`.

## 3) Demo workflow
1. Log in as the admin.
2. Create a teacher and a student from the account management form.
3. Create a course.
4. Assign the teacher and enroll the student using the API examples below.
5. Log in as the teacher and enter a grade. Log in as the student to view their own grades.

### API helpers (use an API client such as curl or Postman)
First login to get a token:
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@university.local","password":"ChangeMe123!"}'
```
Copy the `token` from the response and set `TOKEN` in the following examples.

Create users (admin only):
```bash
curl -X POST http://localhost:4000/api/admin/users \
  -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Teacher One","email":"teacher@university.local","password":"Teacher123!","role":"teacher"}'

curl -X POST http://localhost:4000/api/admin/users \
  -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Student One","email":"student@university.local","password":"Student123!","role":"student","studentNumber":"ST-001"}'
```
Create a course:
```bash
curl -X POST http://localhost:4000/api/admin/courses \
  -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" \
  -d '{"code":"CS101","name":"Introduction to Computing","semester":"2026-Fall"}'
```
The response contains a course `id`. Assign teacher and enroll student:
```bash
curl -X POST http://localhost:4000/api/admin/courses/COURSE_ID/teachers \
  -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" \
  -d '{"teacherId":2}'

curl -X POST http://localhost:4000/api/admin/courses/COURSE_ID/students \
  -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" \
  -d '{"studentId":3}'
```
Replace `COURSE_ID`, `teacherId`, and `studentId` with actual IDs from the API responses. Admin IDs can differ if you've already created users.

## 4) Local Hardhat audit contract (optional)
In a third terminal:
```bash
cd blockchain
npm install
npx hardhat test
npx hardhat node
```
In another terminal, deploy to the local node:
```bash
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```
Copy the printed contract address to `backend/.env` as `AUDIT_CONTRACT_ADDRESS`. Add the first Hardhat account private key as `AUDIT_PRIVATE_KEY` (local development only). Restart the backend.
The backend will submit a salted hash to the local chain when a teacher creates a grade. If blockchain settings are absent, the grade is still saved in SQLite and the audit transaction is skipped.

**Never use the sample Hardhat private key or local chain for real funds or production.** Never expose `AUDIT_PRIVATE_KEY` in the frontend.

## Roles
- `admin`: creates accounts/courses and assigns teachers/students.
- `teacher`: can enter grades only for courses assigned to them.
- `student`: can only read their own grades.
- No public self-registration.

## Important limitations
This starter intentionally does not include password reset, email verification, MFA, university SSO, grade appeals, or production deployment. It uses a local SQLite database for development. Have your institution review privacy and academic policy before real deployment.
