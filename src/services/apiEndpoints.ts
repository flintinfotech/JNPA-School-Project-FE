export const apiEndpoints = {
  login: () => `/jnpa-school-project/auth/login`,
  saveUser: () => `/jnpa-school-project/user/saveUser`,
  updateUser: () => `/jnpa-school-project/user/updateUser`,
  getUserById: (userId: number | string) => `/jnpa-school-project/user/getUserById/${userId}`,
  deleteUser: (userId: number | string) => `/jnpa-school-project/user/deleteUser/${userId}`,
  getAllUsers: (page: number, size: number) =>
    `/jnpa-school-project/user/getAllUsersByFilter?page=${page}&size=${size}&paginate=true`,
  saveStudent: () => `/jnpa-school-project/student/saveStudent`,
  updateStudent: () => `/jnpa-school-project/student/updateStudent`,
  getStudentById: (studentId: number | string) => `/jnpa-school-project/student/getStudentById/${studentId}`,
  deleteStudent: (studentId: number | string) => `/jnpa-school-project/student/deleteStudent/${studentId}`,
  getAllStudents: (page: number, size: number) =>
    `/jnpa-school-project/student/getAllStudentsByFilter?page=${page}&size=${size}&paginate=true`,
  getAllStaticData: () => `/jnpa-school-project/staticData/getAllStaticData`
};