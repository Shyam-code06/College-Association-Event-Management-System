# Skyline Student Association Management System

## Features

- **Role-Based Access Control**: Multi-tenant architecture supporting Super Admin, College Admin, Organizer, and Student roles with strict data isolation.
- **Membership Management**: Configurable tier plans, dues tracking, expiration dates, and automatic renewal reminders.
- **Event Management & Ticketing**: Event scheduling, attendee capacity management, tiered ticket pricing (member vs. non-member), and digital QR-code pass generation.
- **Live QR Gate Check-in**: Mobile camera-ready and manual token verification scanner for event gates.
- **Merchandise Store**: Inventory and product catalog with multi-size variants, cart checkout, and automatic membership discounts.
- **Fundraising & Task Tracking**: Goal-based donation campaigns with milestone tracking and organizer/student task assignments.
- **Reimbursement & Expense Claims**: Expense requests with digital receipt attachment uploads and multi-stage administrative review.
- **Financial Ledger & Analytics**: Income and expense tracking, category breakdown, cash flow reports, and balance summaries.
- **Campus Announcements & Reporting**: Real-time broadcast notices and event analytics reports.

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Zustand, React Router, React Hook Form, Zod, Lucide Icons, Axios, HTML5-QRCode, Recharts
- **Backend**: Node.js, Express.js, Knex.js, JWT, Bcrypt, Joi, Multer, Nodemailer, QRCode
- **Database**: MySQL 8.0

## How to Run

### Prerequisites
- Node.js (v18+)
- MySQL (v8.0+)

### 1. Database Setup
Create your database and import the schema:
```bash
mysql -u root -p < server/database.sql
```

### 2. Backend Setup
```bash
cd server
npm install
npm run dev
```
Backend will be live at `http://localhost:5000`.

### 3. Frontend Setup
In a new terminal window:
```bash
cd client
npm install
npm run dev
```
Frontend will be live at `http://localhost:5173`.
