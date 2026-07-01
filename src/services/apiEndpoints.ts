export const apiEndpoints = {
  login: () => `/jnpa-school-project/auth/login`,
  saveUser: () => `/jnpa-school-project/user/saveUser`,
  updateUser: () => `/jnpa-school-project/user/updateUser`,
  getUserById: (userId: number | string) => `/jnpa-school-project/user/getUserById/${userId}`,
  deleteUser: (userId: number | string) => `/jnpa-school-project/user/deleteUser/${userId}`,
  getAllUsers: (page: number, size: number) =>
    `/jnpa-school-project/user/getAllUsersByFilter?page=${page}&size=${size}&paginate=true`,
};