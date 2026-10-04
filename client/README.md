# Skyline Student Association Management System — Frontend

A comprehensive, production-grade frontend client for the **Skyline Student Association Management System**, designed with the clean, professional, and calm aesthetic of **Odoo Web and Odoo App UI**.

---

## 🎨 Theme Tokens & Design System

Defined strictly in `@theme` inside `src/index.css`:

| Token | Class Utility | Value | Purpose |
| :--- | :--- | :--- | :--- |
| `--color-primary` | `bg-primary`, `text-primary` | `#714B67` | Primary brand purple for buttons, active steppers, and shells |
| `--color-primary-hover` | `hover:bg-primary-hover` | `#5E3D55` | Primary hover state |
| `--color-primary-dark` | `bg-primary-dark` | `#4A2F43` | Dark topbar accents |
| `--color-primary-soft` | `bg-primary-soft`, `ring-primary-soft` | `#F3ECF1` | Soft tint for active rings, pills, and backgrounds |
| `--color-secondary` | `text-secondary`, `bg-secondary` | `#017E84` | Calming teal accent for perks and links |
| `--color-accent` | `bg-accent` | `#F2BB62` | Yellow highlight for hero accents and decorative markers |
| `--color-success` | `text-success`, `bg-success` | `#28A745` | Confirmations, active tickets, and positive balances |
| `--color-danger` | `text-danger`, `bg-danger` | `#DC3545` | Cancellations, deletions, and gate pass rejections |
| `--color-warning` | `text-warning`, `bg-warning` | `#F0AD4E` | Pending review alerts and high-priority notices |
| `--color-info` | `text-info`, `bg-info` | `#17A2B8` | General campus announcements |
| `--color-ink` | `text-ink` | `#212529` | Deep charcoal for sharp typography |
| `--color-muted` | `text-muted` | `#6C757D` | Secondary descriptive text and timestamps |
| `--color-line` | `border-line` | `#DEE2E6` | Subtle 1px borders on cards, tables, and inputs |
| `--color-canvas` | `bg-canvas` | `#F8F9FA` | Main application background |
| `--color-canvas-2` | `bg-canvas-2` | `#E9ECEF` | Hover rows, disabled states, and skeleton loaders |
| `--color-surface` | `bg-surface` | `#FFFFFF` | Elevated cards, tables, and modal backgrounds |

---

## 🚀 Key Features & Highlights

1. **Odoo-Style App Launcher**:
   - Post-login `/apps` grid featuring rounded application tiles with icons, titles, and descriptions.
   - Dynamically filtered based on user roles (`super_admin`, `college_admin`, `organizer`, `student`).

2. **Universal Step Wizard (`<Wizard>` + `<Stepper>`)**:
   - Reusable, config-driven 48px circle stepper connected with Zustand store factory.
   - Built-in per-step Zod validation, review step, and submission clearance.
   - Implemented across 7 key flows:
     1. Student sign-up
     2. Join membership
     3. Register for event with QR issuance
     4. Merchandise order with size variants & automatic member discount
     5. Reimbursement expense claim with receipt upload
     6. Organizer event publication
     7. Super Admin college administrator provisioning

3. **Live Gate Scanner**:
   - Responsive mobile-first QR camera scanner powered by `html5-qrcode` alongside manual token lookup.
   - Instant validation with clear visual feedback:
     - `ALREADY_USED`
     - `WRONG_EVENT`
     - `PAYMENT_PENDING`
     - `INVALID_TICKET`

4. **Multi-Tenant College Isolation**:
   - Super Admin strictly restricted to college-admin provisioning; college association data is isolated from them.
   - College Admins manage members, ledger, merchandise, and claims for their campus.
   - Organizers manage their events and gate scanners.
   - Students access personal event passes, QR codes, apparel orders, and volunteer tasks.

---

## 🔑 Demo Credentials

Demo chips on the `/login` page autofill the following credentials in development:

| Role | Email | Password | Scope |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@odoo.com` | `123456` | College Admins provisioning only |
| **College Admin** | `collegeadmin@skyline.edu` | `CollegeAdmin@123` | College Association overview & apps |
| **Organizer** | `organizer@skyline.edu` | `Organizer@123` | Event creation & gate scanner |
| **Student** | `aarav@skyline.edu` | `Student@123` | Tickets, membership & merch |

---

## 🛠️ Tech Stack

- **Framework**: React 18, Vite 6, React Router v6
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`), `clsx`, `tailwind-merge`, `class-variance-authority`
- **Primitives**: `@headlessui/react` (Dialog, Switch, Menu, Tabs)
- **Forms & Validation**: `react-hook-form`, `zod`
- **State Management**: `zustand` (auth persistence, UI state, wizard store factory)
- **HTTP Client**: `axios` with interceptors (401 clear/redirect, 403 route guard, error envelope mapping)
- **Icons & Visuals**: `lucide-react`, `recharts`
- **Hardware Integration**: `html5-qrcode` (camera gate scanner)
- **Testing**: `vitest`, `@testing-library/react`, `msw`

---

## 📦 Getting Started

### 1. Ensure Backend is Running
The Express backend should be running on port `5000`:
```bash
cd ../server
npm run dev
```

### 2. Configure Client Environment
```bash
cp .env.example .env
```
Default `VITE_API_URL`: `http://localhost:5000/api/v1`

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```
Open `http://localhost:3000` (or the port Vite outputs) in your browser.

### 5. Run Test Suite
```bash
npm test
```

### 6. Build for Production
```bash
npm run build
```
