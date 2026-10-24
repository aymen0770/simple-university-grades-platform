# Simple University Grades Platform

**A simple project for blockchain development and testing.**

## About the Project

This project is a development and testing environment for exploring blockchain integration in a university grades management application.

It combines a web frontend, a backend API, an SQLite database, and a Solidity smart contract developed using Hardhat.

The main goal is to experiment with recording and tracking grade-related audit events on a local blockchain.

## Technologies

- React and Vite
- Node.js and Express
- SQLite
- Solidity
- Hardhat
- Ethers.js

## Project Structure

- `frontend/` — Web interface
- `backend/` — API and database
- `blockchain/` — Smart contracts, deployment scripts, and tests

## Getting Started

### 1. Install dependencies

Install dependencies inside each project directory:

```bash
cd backend
npm install

cd ../frontend
npm install

cd ../blockchain
npm install
```

### 2. Start the local blockchain

```bash
cd blockchain
npx hardhat node
```

### 3. Compile and deploy the smart contract

In another terminal:

```bash
cd blockchain
npx hardhat compile
npx hardhat run scripts/deploy.js --network localhost
```

Configure the backend environment variables using `backend/.env.example` and the contract address printed by the deployment script.

### 4. Start the backend and frontend

In separate terminals:

```bash
cd backend
npm run dev
```

```bash
cd frontend
npm run dev
```

Open the frontend URL displayed by Vite, usually `http://localhost:5173`.

## Notes

- This project is intended for local development and blockchain testing.
- The local Hardhat blockchain resets when its node is restarted.

---

# منصة بسيطة لإدارة درجات الجامعة

**مشروع بسيط لتطوير واختبار تقنيات البلوكشين.**

## حول المشروع

يهدف هذا المشروع إلى تجربة دمج تقنية البلوكشين مع تطبيق لإدارة درجات الجامعة.

يتكون من واجهة ويب، وخادم خلفي، وقاعدة بيانات SQLite، وعقد ذكي مكتوب بلغة Solidity باستخدام Hardhat.

الهدف الأساسي هو اختبار تسجيل وتتبع أحداث تدقيق الدرجات على شبكة بلوكشين محلية.

## التقنيات المستخدمة

- React وVite للواجهة الأمامية
- Node.js وExpress للخادم الخلفي
- SQLite لقاعدة البيانات
- Solidity لكتابة العقود الذكية
- Hardhat لتطوير واختبار البلوكشين
- Ethers.js للتفاعل مع شبكة البلوكشين

## بنية المشروع

- `frontend/` — واجهة المستخدم
- `backend/` — الخادم الخلفي وقاعدة البيانات
- `blockchain/` — العقود الذكية وسكربتات النشر والاختبارات

## طريقة التشغيل

### 1. تثبيت المكتبات

نفّذ الأوامر التالية داخل مجلد المشروع الرئيسي:

```bash
cd backend
npm install

cd ../frontend
npm install

cd ../blockchain
npm install
```

### 2. تشغيل شبكة البلوكشين المحلية

```bash
cd blockchain
npx hardhat node
```

اترك هذه النافذة مفتوحة.

### 3. ترجمة العقد الذكي ونشره

افتح نافذة أخرى ونفّذ:

```bash
cd blockchain
npx hardhat compile
npx hardhat run scripts/deploy.js --network localhost
```

اضبط متغيرات البيئة في `backend/.env` بالاعتماد على `backend/.env.example`، وأضف عنوان العقد الذكي الناتج عن النشر.

### 4. تشغيل الخادم والواجهة

في نافذتين منفصلتين:

```bash
cd backend
npm run dev
```

وفي النافذة الأخرى:

```bash
cd frontend
npm run dev
```

افتح رابط الواجهة الذي يظهر في الطرفية، وغالبًا يكون:

`http://localhost:5173`

## ملاحظات

- المشروع مخصص للتطوير المحلي وتجارب البلوكشين.
- عند إعادة تشغيل شبكة Hardhat المحلية، تُمسح حالتها السابقة، ويجب نشر العقد الذكي من جديد.
