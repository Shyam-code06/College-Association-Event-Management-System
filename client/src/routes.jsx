import React, { Suspense, lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Spinner } from '@/components/ui/Spinner';
import { ROLES } from '@/utils/constants';

// Loading fallback
const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <Spinner size="lg" />
  </div>
);

// Lazy Loaded Pages
const Home = lazy(() => import('@/pages/public/Home'));
const Login = lazy(() => import('@/pages/public/Login'));
const Register = lazy(() => import('@/pages/public/Register'));
const EventsBrowse = lazy(() => import('@/pages/public/EventsBrowse'));
const Forbidden = lazy(() => import('@/pages/public/Forbidden'));
const NotFound = lazy(() => import('@/pages/public/NotFound'));

// App Launcher
const Apps = lazy(() => import('@/pages/launcher/Apps'));

// Student Pages
const StudentDashboard = lazy(() => import('@/pages/student/Dashboard'));
const Membership = lazy(() => import('@/pages/student/Membership'));
const MyTickets = lazy(() => import('@/pages/student/MyTickets'));
const EventRegister = lazy(() => import('@/pages/student/EventRegister'));
const MerchandiseStore = lazy(() => import('@/pages/student/MerchandiseStore'));
const MyOrders = lazy(() => import('@/pages/student/MyOrders'));
const MyExpenses = lazy(() => import('@/pages/student/MyExpenses'));
const MyTasks = lazy(() => import('@/pages/student/MyTasks'));
const StudentAnnouncements = lazy(() => import('@/pages/student/Announcements'));

// Organizer Pages
const EventsManager = lazy(() => import('@/pages/organizer/EventsManager'));
const EventCreate = lazy(() => import('@/pages/organizer/EventCreate'));
const GateScanner = lazy(() => import('@/pages/organizer/GateScanner'));
const EventReport = lazy(() => import('@/pages/organizer/EventReport'));

// College Admin Pages
const CollegeOverview = lazy(() => import('@/pages/college_admin/Overview'));
const Organizers = lazy(() => import('@/pages/college_admin/Organizers'));
const AdminStudents = lazy(() => import('@/pages/college_admin/Students'));
const Members = lazy(() => import('@/pages/college_admin/Members'));
const Plans = lazy(() => import('@/pages/college_admin/Plans'));
const AdminEvents = lazy(() => import('@/pages/college_admin/Events'));
const FinanceLedger = lazy(() => import('@/pages/college_admin/FinanceLedger'));
const PendingPayments = lazy(() => import('@/pages/college_admin/PendingPayments'));
const AdminProducts = lazy(() => import('@/pages/college_admin/Products'));
const AdminOrders = lazy(() => import('@/pages/college_admin/Orders'));
const AdminFundraisers = lazy(() => import('@/pages/college_admin/Fundraisers'));
const ExpenseReview = lazy(() => import('@/pages/college_admin/ExpenseReview'));
const AdminAnnouncements = lazy(() => import('@/pages/college_admin/Announcements'));
const Reports = lazy(() => import('@/pages/college_admin/Reports'));

// Super Admin Pages
const CollegeAdmins = lazy(() => import('@/pages/super_admin/CollegeAdmins'));
const CreateCollegeAdmin = lazy(() => import('@/pages/super_admin/CreateCollegeAdmin'));

export const router = createBrowserRouter([
  // Public Routes with PublicLayout
  {
    element: <PublicLayout />,
    children: [
      {
        path: '/',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Home />
          </Suspense>
        ),
      },
      {
        path: '/events',
        element: (
          <Suspense fallback={<PageLoader />}>
            <EventsBrowse />
          </Suspense>
        ),
      },
      {
        path: '/login',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Login />
          </Suspense>
        ),
      },
      {
        path: '/register',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Register />
          </Suspense>
        ),
      },
      {
        path: '/forbidden',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Forbidden />
          </Suspense>
        ),
      },
    ],
  },

  // Authenticated App Shell Routes
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      // App Launcher (accessible by all authenticated roles)
      {
        path: '/apps',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Apps />
          </Suspense>
        ),
      },

      // Student Routes
      {
        path: '/student/dashboard',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <Suspense fallback={<PageLoader />}>
              <StudentDashboard />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/student/membership',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <Suspense fallback={<PageLoader />}>
              <Membership />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/student/tickets',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <Suspense fallback={<PageLoader />}>
              <MyTickets />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/student/events/:id/register',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <Suspense fallback={<PageLoader />}>
              <EventRegister />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/student/store',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <Suspense fallback={<PageLoader />}>
              <MerchandiseStore />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/student/orders',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <Suspense fallback={<PageLoader />}>
              <MyOrders />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/student/expenses',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.STUDENT, ROLES.ORGANIZER]}>
            <Suspense fallback={<PageLoader />}>
              <MyExpenses />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/student/tasks',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <Suspense fallback={<PageLoader />}>
              <MyTasks />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/student/announcements',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.STUDENT, ROLES.ORGANIZER]}>
            <Suspense fallback={<PageLoader />}>
              <StudentAnnouncements />
            </Suspense>
          </ProtectedRoute>
        ),
      },

      // Organizer Routes
      {
        path: '/organizer/events',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.ORGANIZER]}>
            <Suspense fallback={<PageLoader />}>
              <EventsManager />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/organizer/events/new',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.ORGANIZER, ROLES.COLLEGE_ADMIN]}>
            <Suspense fallback={<PageLoader />}>
              <EventCreate />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/organizer/scanner',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.ORGANIZER, ROLES.COLLEGE_ADMIN]}>
            <Suspense fallback={<PageLoader />}>
              <GateScanner />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/organizer/reports',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.ORGANIZER, ROLES.COLLEGE_ADMIN]}>
            <Suspense fallback={<PageLoader />}>
              <EventReport />
            </Suspense>
          </ProtectedRoute>
        ),
      },

      // College Admin Routes
      {
        path: '/admin/overview',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.COLLEGE_ADMIN]}>
            <Suspense fallback={<PageLoader />}>
              <CollegeOverview />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/organizers',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.COLLEGE_ADMIN]}>
            <Suspense fallback={<PageLoader />}>
              <Organizers />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/students',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.COLLEGE_ADMIN]}>
            <Suspense fallback={<PageLoader />}>
              <AdminStudents />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/members',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.COLLEGE_ADMIN]}>
            <Suspense fallback={<PageLoader />}>
              <Members />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/plans',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.COLLEGE_ADMIN]}>
            <Suspense fallback={<PageLoader />}>
              <Plans />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/events',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.COLLEGE_ADMIN]}>
            <Suspense fallback={<PageLoader />}>
              <AdminEvents />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/finance',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.COLLEGE_ADMIN]}>
            <Suspense fallback={<PageLoader />}>
              <FinanceLedger />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/payments',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.COLLEGE_ADMIN]}>
            <Suspense fallback={<PageLoader />}>
              <PendingPayments />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/products',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.COLLEGE_ADMIN]}>
            <Suspense fallback={<PageLoader />}>
              <AdminProducts />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/orders',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.COLLEGE_ADMIN]}>
            <Suspense fallback={<PageLoader />}>
              <AdminOrders />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/fundraisers',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.COLLEGE_ADMIN, ROLES.ORGANIZER]}>
            <Suspense fallback={<PageLoader />}>
              <AdminFundraisers />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/organizer/fundraisers',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.ORGANIZER, ROLES.COLLEGE_ADMIN]}>
            <Suspense fallback={<PageLoader />}>
              <AdminFundraisers />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/expenses',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.COLLEGE_ADMIN]}>
            <Suspense fallback={<PageLoader />}>
              <ExpenseReview />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/announcements',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.COLLEGE_ADMIN]}>
            <Suspense fallback={<PageLoader />}>
              <AdminAnnouncements />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/reports',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.COLLEGE_ADMIN]}>
            <Suspense fallback={<PageLoader />}>
              <Reports />
            </Suspense>
          </ProtectedRoute>
        ),
      },

      // Super Admin Routes (Strictly isolated)
      {
        path: '/super-admin/college-admins',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <Suspense fallback={<PageLoader />}>
              <CollegeAdmins />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/super-admin/college-admins/new',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <Suspense fallback={<PageLoader />}>
              <CreateCollegeAdmin />
            </Suspense>
          </ProtectedRoute>
        ),
      },
    ],
  },

  // 404 Route
  {
    path: '*',
    element: (
      <PublicLayout>
        <Suspense fallback={<PageLoader />}>
          <NotFound />
        </Suspense>
      </PublicLayout>
    ),
  },
]);

export default router;
