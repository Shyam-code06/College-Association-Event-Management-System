# Skyline Student Association Management System - Backend

A multi-college, role-hierarchy backend platform built with Node.js, Express, MySQL 8, and Knex.js, adhering to strict multi-tenant isolation, clean MVC + Service layer architecture, and relational database integrity.

---

## 1. Role Hierarchy

```
Super Admin (1, seeded in database.sql)
  └── College Admin (created, activated/deactivated, soft-deleted ONLY by Super Admin)
        └── Organizer (created/managed by College Admin, same college only)
              └── creates Events
Student (self-registers into one college) joins Events of their own college
```

### Hierarchy Rules
- **Super Admin**: Exactly 1 Super Admin seeded in `database.sql`. Manages College Admins and Colleges. Can NEVER touch or view operational college data (students, tickets, finance, etc. returns 403). Deactivating a College Admin disables the college and immediately blocks all users of that college from login and authenticated requests.
- **College Admin**: Belongs to exactly 1 college. Full administrative control over own college: organizers, membership plans, finance ledger, inventory, fundraisers, expense approvals, reports.
- **Organizer**: Belongs to same college. Creates/manages events, scans QR codes at the gate, views attendee reports. Cannot manage finances, plans, or approve expenses.
- **Student**: Self-registers into an active college. Belongs to 1 college. Buys memberships, registers for events, buys merchandise, submits reimbursement requests with receipts, completes assigned fundraiser tasks.

---

## 2. Permission Matrix

| Capability | super_admin | college_admin | organizer | student |
|---|---|---|---|---|
| Create/list/activate/delete college admins | Yes | No | No | No |
| Create/manage organizers | No | Yes | No | No |
| Membership plans, member list/verify | No | Yes | Verify only | Own only |
| Create/edit/cancel events | No | Yes | Yes (own) | No |
| View/register for events | No | Yes (view) | Yes (view) | Yes |
| Scan QR / check-in | No | Yes | Yes | No |
| Event reports | No | Yes | Yes (own) | No |
| Announcements create | No | Yes | Yes | Read |
| Merchandise manage | No | Yes | No | Browse/Order |
| Fundraisers and tasks manage | No | Yes | No | Own tasks |
| Expense approve/reject | No | Yes | No | Submit own |
| Finance ledger and pending payments | No | Yes | No | Own payments |

---

## 3. Database Schema & Tables

All 18 tables are defined in a single file `database.sql` with InnoDB, `utf8mb4`, composite tenant indexes, foreign keys, and integrity constraints:
- `colleges`: id, name, code, is_active, deleted_at, timestamps
- `users`: id, college_id (NULL only for super_admin), name, email, password_hash, role, created_by, is_active, deleted_at
- `membership_plans`: id, college_id, name, fee, duration_months, merch_discount_percent, ticket_discount_note, is_active
- `memberships`: id, college_id, user_id, plan_id, status, dues_status, start_date, expiry_date, reminder_sent_at
- `events`: id, college_id, name, description, event_date, start_time, location, capacity, is_paid, member_price, non_member_price, status, created_by
- `registrations`: id, college_id, event_id, user_id, price_charged, is_member_at_registration, status, qr_token, checked_in_at, checked_in_by
- `payments`: id, college_id, user_id, payable_type, payable_id, amount, status, method, transaction_ref, paid_at
- `announcements`: id, college_id, title, message, posted_by
- `products`: id, college_id, name, description, base_price, is_active
- `product_variants`: id, college_id, product_id, size, stock
- `orders`: id, college_id, user_id, total_amount, status
- `order_items`: id, college_id, order_id, product_id, variant_id, quantity, unit_price, discount_applied, final_price
- `fundraisers`: id, college_id, title, description, goal_amount, current_amount, start_date, end_date, status, created_by
- `fundraiser_tasks`: id, college_id, fundraiser_id, title, description, assignee_id, status, due_date
- `expense_requests`: id, college_id, submitter_id, amount, reason, event_id, fundraiser_id, receipt_path, status, reviewed_by, review_note
- `finance_categories`: id, college_id, name, type
- `financial_transactions`: id, college_id, type, category_id, amount, source_type, source_id, description, transaction_date
- `email_logs`: id, college_id, recipient, subject, status, error

---

## 4. Postman-Ready API Endpoints

### Base URL: `http://localhost:5000/api/v1`

#### Public & Authentication
- `GET /health`: Health check
- `GET /colleges/public`: Public active colleges for student signup
- `POST /auth/register`: Student self-registration (`{ college_id, name, email, password }`)
- `POST /auth/login`: User login (`{ email, password }`)
- `GET /auth/me`: Current user profile (Bearer token)
- `POST /auth/change-password`: Change password (`{ oldPassword, newPassword }`)

#### Super Admin (Super Admin Token Only)
- `POST /super-admin/college-admins`: Create College Admin & College (`{ collegeName, collegeCode, adminName, adminEmail, adminPassword }`)
- `GET /super-admin/college-admins`: List College Admins (`?page=1&limit=10&search=&isActive=`)
- `GET /super-admin/college-admins/:id`: View College Admin details
- `PATCH /super-admin/college-admins/:id/access`: Activate/deactivate College Admin (`{ isActive: true|false }`)
- `DELETE /super-admin/college-admins/:id`: Soft delete College Admin & disable college

#### Organizers Management (College Admin Only)
- `POST /organizers`: Create Organizer (`{ name, email, password }`)
- `GET /organizers`: List college organizers
- `GET /organizers/:id`: Get organizer by ID
- `PATCH /organizers/:id`: Update organizer details
- `PATCH /organizers/:id/access`: Toggle organizer access (`{ isActive: true|false }`)
- `DELETE /organizers/:id`: Soft delete organizer

#### Memberships & Plans
- `GET /memberships/plans`: List active plans (All roles)
- `POST /memberships/plans`: Create plan (College Admin)
- `PATCH /memberships/plans/:id`: Update plan (College Admin)
- `POST /memberships/join`: Join association (`{ planId }`) (Student)
- `GET /memberships/me`: View own membership status (Student)
- `GET /memberships`: List all members (College Admin)
- `GET /memberships/verify?identifier=`: Verify member status (College Admin, Organizer)

#### Events
- `GET /events`: List college events (`?upcomingOnly=true&status=`) (All roles)
- `GET /events/:id`: Get event details and live available seats (All roles)
- `POST /events`: Create event + triggers asynchronous email batch to students (College Admin, Organizer)
- `PATCH /events/:id`: Update event (College Admin, Organizer for own events)
- `POST /events/:id/cancel`: Cancel event (College Admin, Organizer for own events)

#### Registrations & Tickets
- `POST /registrations`: Register for event (`{ eventId }`) (Student)
- `GET /registrations/me`: Student's event registrations (Student)
- `GET /registrations/event/:eventId`: Event attendee list (College Admin, Organizer)
- `GET /tickets/:registrationId/qr`: Get QR code Data URL (Ticket owner only)
- `POST /tickets/scan`: Scan ticket QR code at gate (`{ qrToken, eventId }`) (College Admin, Organizer)

#### Payments
- `POST /payments/:id/process`: Mock gateway trigger (`{ shouldSucceed: true|false }`)
- `GET /payments/pending`: List pending payments (College Admin)
- `GET /payments/me`: View personal payments (Student)
- `GET /payments/:id`: View payment details

#### Announcements
- `GET /announcements`: List announcements (All roles)
- `GET /announcements/:id`: View announcement details
- `POST /announcements`: Create immutable announcement (College Admin, Organizer)

#### Merchandise & Orders
- `GET /products`: Browse products & size variants (All roles)
- `GET /products/inventory/summary`: Inventory report (College Admin)
- `GET /products/:id`: Get product details
- `POST /products`: Create product with variants (College Admin)
- `PATCH /products/:id`: Update product (College Admin)
- `POST /products/:id/variants`: Add size variant (College Admin)
- `PATCH /products/variants/:variantId/stock`: Update stock (College Admin)
- `POST /orders`: Place merchandise order (`{ variantId, quantity }`) (Student)
- `GET /orders/me`: View own orders (Student)
- `GET /orders`: View all college orders (College Admin)
- `GET /orders/:id`: View order details

#### Fundraisers & Tasks
- `GET /fundraisers`: List fundraisers with progress percentage (All roles)
- `GET /fundraisers/:id`: Fundraiser details with tasks
- `POST /fundraisers`: Create fundraiser (College Admin)
- `PATCH /fundraisers/:id`: Update fundraiser (College Admin)
- `POST /fundraisers/:id/tasks`: Create & assign task (`{ title, description, assignee_id, due_date }`) (College Admin)
- `GET /fundraisers/tasks/me`: View assigned tasks (Student)
- `PATCH /fundraisers/tasks/:taskId/status`: Update task status (`{ status: 'pending'|'in_progress'|'completed' }`) (Student assignee)

#### Expenses & Reimbursements
- `POST /expenses`: Submit reimbursement with receipt file upload (`multipart/form-data`) (Student)
- `GET /expenses/me`: View own expense submissions (Student)
- `GET /expenses`: View all expense requests (College Admin)
- `GET /expenses/:id`: View single expense request
- `PATCH /expenses/:id/review`: Approve/reject request (`{ status: 'approved'|'rejected', review_note }`) (College Admin)

#### Finance & Ledger (College Admin Only)
- `GET /finance/categories`: List categories
- `POST /finance/categories`: Create category (`{ name, type: 'income'|'expense' }`)
- `GET /finance/transactions`: List transactions (`?type=&categoryId=&startDate=&endDate=`)
- `POST /finance/transactions`: Manual transaction entry (`{ type, category_id, amount, description, transaction_date }`)
- `GET /finance/summary`: Financial summary (totalIncome, totalExpenses, balance, category breakdown)

#### Reports
- `GET /reports/events/:eventId`: Event report (registrations, attendees, member vs non-member, revenue) (College Admin, Organizer for own event)
- `GET /reports/college/overview`: Dashboard summary report (College Admin)

---

## 5. Getting Started & Running the Project

### Prerequisites
- Node.js LTS (v18+)
- MySQL 8 (Running on port 3306)

### Database Setup
Run the single schema file into MySQL:
```bash
mysql -u root -pshyam123 < database.sql
```

### Installation & Execution
```bash
# Install dependencies
npm install

# Start development server
npm run dev
# Or production server
npm start
```

### Initial Seed Logins

1. **Super Admin**:
   - Email: `superadmin@skyline.edu`
   - Password: `SuperAdmin@123`
2. **Demo College Admin** (Skyline Institute of Technology):
   - Email: `collegeadmin@skyline.edu`
   - Password: `CollegeAdmin@123`
3. **Demo Organizer**:
   - Email: `organizer@skyline.edu`
   - Password: `Organizer@123`
4. **Demo Student**:
   - Email: `aarav@skyline.edu`
   - Password: `Student@123`
