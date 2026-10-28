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

### 2. Environment Configuration
Create `server/.env` with the following example values. These are placeholders, not real credentials; update the database settings for your local MySQL instance.
```env
NODE_ENV=development
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_USER=example_user
DB_PASSWORD=example_password
DB_NAME=skyline_db
DB_NAME_TEST=skyline_test_db
DB_POOL_MIN=2
DB_POOL_MAX=10

JWT_SECRET=replace_with_a_long_random_local_development_secret
JWT_EXPIRES_IN=7d

SMTP_HOST=localhost
SMTP_PORT=2525
SMTP_USER=
SMTP_PASS=
SMTP_FROM=Skyline Student Association <noreply@example.test>

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=500
AUTH_RATE_LIMIT_MAX=30
```

Create `client/.env` for the frontend API URL:
```env
VITE_API_URL=http://localhost:5000/api/v1
```

Use a unique, securely generated `JWT_SECRET` and real SMTP credentials only in your own deployment environment. Never commit actual secrets.

### 3. Backend Setup
```bash
cd server
npm install
npm run dev
```
Backend will be live at `http://localhost:5000`.

### 4. Frontend Setup
In a new terminal window:
```bash
cd client
npm install
npm run dev
```
Frontend will be live at `http://localhost:5173`.
