const ROLES = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  COLLEGE_ADMIN: 'college_admin',
  ORGANIZER: 'organizer',
  STUDENT: 'student'
});

const ALL_ROLES = Object.values(ROLES);

module.exports = {
  ROLES,
  ALL_ROLES
};
