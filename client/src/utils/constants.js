export const ROLES = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  COLLEGE_ADMIN: 'college_admin',
  ORGANIZER: 'organizer',
  STUDENT: 'student',
});

export const DEMO_CREDENTIALS = [
  {
    role: 'Super Admin',
    email: 'superadmin@skyline.edu',
    password: 'SuperAdmin@123',
    badge: 'bg-primary-soft text-primary',
  },
  {
    role: 'College Admin',
    email: 'collegeadmin@skyline.edu',
    password: 'CollegeAdmin@123',
    badge: 'bg-secondary/10 text-secondary',
  },
  {
    role: 'Organizer',
    email: 'organizer@skyline.edu',
    password: 'Organizer@123',
    badge: 'bg-accent/20 text-ink',
  },
  {
    role: 'Student',
    email: 'aarav@skyline.edu',
    password: 'Student@123',
    badge: 'bg-info/10 text-info',
  },
];
