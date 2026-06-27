export const apiEndpoints = {
  login: () => `/sample/auth/login`,
  saveUser: () => `/sample/user/saveUser`,
  updateUser: () => `/sample/user/updateUser`,
  getUserById: (userId: number | string) => `/sample/user/getUserById/${userId}`,
  deleteUser: (userId: number | string) => `/sample/user/deleteUser/${userId}`,
  getAllUsers: (page: number, size: number) =>
    `/sample/user/getAllUsersByFilter?page=${page}&size=${size}&paginate=true`,
};