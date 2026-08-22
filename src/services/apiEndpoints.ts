export const apiEndpoints = {
  login: () => `/jnpa-school-project/auth/login`,
  getLastFiveAcademicYears: () => `/jnpa-school-project/auth/getLastFiveAcademicYears`,

  saveSubject: () => `/jnpa-school-project/subjectMaster/saveSubjectMaster`,
  updateSubject: () => `/jnpa-school-project/subjectMaster/updateSubjectMaster`,
  getSubjectById: (id: number | string) =>
    `/jnpa-school-project/subjectMaster/getSubjectMasterById/${id}`,
  deleteSubject: (subjectMasterId: number | string) =>
    `/jnpa-school-project/subjectMaster/deleteSubjectMaster/${subjectMasterId}`,
  getAllSubjects: (page: number, size: number) =>
    `/jnpa-school-project/subjectMaster/getAllSubjectMasterByFilter?page=${page}&size=${size}&paginate=true`,

  saveUser: () => `/jnpa-school-project/user/saveUser`,
  updateUser: () => `/jnpa-school-project/user/updateUser`,
  getUserById: (userId: number | string) => `/jnpa-school-project/user/getUserById/${userId}`,
  deleteUser: (userId: number | string) => `/jnpa-school-project/user/deleteUser/${userId}`,
  getAllUsers: (page: number, size: number) =>
    `/jnpa-school-project/user/getAllUsersByFilter?page=${page}&size=${size}&paginate=true`,

  saveStudent: () => `/jnpa-school-project/student/saveStudent`,
  updateStudent: () => `/jnpa-school-project/student/updateStudent`,
  getStudentById: (studentId: number | string) =>
    `/jnpa-school-project/student/getStudentById/${studentId}`,
  deleteStudent: (studentId: number | string) =>
    `/jnpa-school-project/student/deleteStudent/${studentId}`,
  getAllStudents: (page: number, size: number) =>
    `/jnpa-school-project/student/getAllStudentsByFilter?page=${page}&size=${size}&paginate=true`,

  saveClassRoom: () => `/jnpa-school-project/classRoom/saveClassRoom`,
  updateClassRoom: () => `/jnpa-school-project/classRoom/updateClassRoom`,
  getClassRoomById: (classRoomId: number | string) =>
    `/jnpa-school-project/classRoom/getClassRoomById/${classRoomId}`,
  deleteClassRoom: (classRoomId: number | string) =>
    `/jnpa-school-project/classRoom/deleteClassRoom/${classRoomId}`,
  getAllClassRooms: (page: number, size: number) =>
    `/jnpa-school-project/classRoom/getAllClassRoomsByFilter?page=${page}&size=${size}&paginate=true`,

  saveAcademicYear: () => `/jnpa-school-project/academicYear/saveAcademicYear`,
  updateAcademicYear: () => `/jnpa-school-project/academicYear/updateAcademicYear`,
  getAcademicYearById: (academicYearId: number | string) =>
    `/jnpa-school-project/academicYear/getAcademicYearById/${academicYearId}`,
  getAllAcademicYears: (page: number, size: number) =>
    `/jnpa-school-project/academicYear/getAllAcademicYearsByFilter?page=${page}&size=${size}&paginate=true`,

  getAllStaticData: () => `/jnpa-school-project/staticData/getAllStaticData`,

  saveNews: () => `/jnpa-school-project/news/saveNews`,
  updateNews: () => `/jnpa-school-project/news/updateNews`,
  deleteNews: (newsId: number | string) => `/jnpa-school-project/news/deleteNews/${newsId}`,
  getAllNewsByFilter: (page: number, size: number) =>
    `/jnpa-school-project/news/getAllNewsByFilter?page=${page}&size=${size}&paginate=true`,

  saveExam: () => `/jnpa-school-project/exam/saveExam`,
  updateExam: () => `/jnpa-school-project/exam/updateExam`,
  getAllExamsByFilter: (page: number, size: number) =>
    `/jnpa-school-project/exam/getAllExamsByFilter?page=${page}&size=${size}&paginate=true`,

  saveAdmission: () => `/jnpa-school-project/admission/saveAdmission`,
  updateAdmisson: () => `/jnpa-school-project/admission/updateAdmission`,
  getAllAdmissionsByFilter: (page: number, size: number) =>
    `/jnpa-school-project/admission/getAllAdmissionsByFilter?page=${page}&size=${size}&paginate=true`,

  saveClassMaster: () => `/jnpa-school-project/classMaster/saveClassMaster`,
  updateClassMaster: () => `/jnpa-school-project/classMaster/updateClassMaster`,
  getAllClassMaster: (page: number, size: number) =>
    `/jnpa-school-project/classMaster/getAllClassMasterByFilter?page=${page}&size=${size}&paginate=true`,
  getClassMasterById: (id: number | string) =>
    `/jnpa-school-project/classMaster/getClassMasterById/${id}`,
  deleteClassMaster: (id: number | string) =>
    `/jnpa-school-project/classMaster/deleteClassMaster/${id}`,

  saveEmployeeDetails: () => `/jnpa-school-project/employeeDetails/saveEmployeeDetails`,
  getEmployeeDetailsById: (id: number) =>
    `/jnpa-school-project/employeeDetails/getEmployeeDetailsByUserId/${id}`,
  updateEmployeeDetails: () => `/jnpa-school-project/employeeDetails/updateEmployeeDetails`,
  deleteEmployeeDetails: (employeeDetailsId: number) =>
    `/jnpa-school-project/employeeDetails/deleteEmployeeDetails/${employeeDetailsId}`,

  getSubjectsByClassId: (id: number) =>
    `/jnpa-school-project/subjectAssignment/getSubjectsByClassId/${id}`,

  assignOrUnassignSubjects: () =>
    "/jnpa-school-project/subjectAssignment/assignOrUnassignSubjects",

  getAllUsersByFilter: (page: number, size: number) =>
    `/jnpa-school-project/user/getAllUsersByFilter?page=${page}&size=${size}&paginate=true`,

  searchClass: (keyword: string) => `/jnpa-school-project/classMaster/search?keyword=${keyword}`,

  // ===============================
  // Teacher Subject Assignment
  // ===============================
  assignTeacherSubjects: () =>
    "/jnpa-school-project/teacherSubjectAssignment/assignOrUnassignSubjects",

  getAllemployeeDetails: (page: number, size: number) =>
    `/jnpa-school-project/employeeDetails/getAllEmployeeDetailsByFilter?page=${page}&size=${size}&paginate=true`,

  getSubjectsByEmployeeDetailsId: (employeeDetailsId: number | string) =>
    `/jnpa-school-project/teacherSubjectAssignment/getSubjectsByEmployeeDetailsId/${employeeDetailsId}`,

  // getAllUsersByFilter: (page: number, size: number) =>
  //   `/jnpa-school-project/user/getAllUsersByFilter?page=${page}&size=${size}&paginate=true`,

  // searchClass: (keyword: string) => `/jnpa-school-project/classMaster/search?keyword=${keyword}`,


  saveAdmissionInquiry: () =>
    `/jnpa-school-project/inquiry/saveAdmissionInquiry`,

  getAllAdmissionInquiryByFilter: (page: number, size: number) =>
  `/jnpa-school-project/inquiry/getAllAdmissionInquiryByFilter?page=${page}&size=${size}&paginate=true`,

  updateAdmissionInquiryById: (id: number | string) =>
  `/jnpa-school-project/inquiry/updateAdmissionInquiryById?id=${id}`,
  
  // ===============================
  // Screens
  // ===============================
  getAllScreens: () => `/jnpa-school-project/user/getAllScreens`,

  // ===============================
  // Teacher Subject Assignment
  // ===============================

  //Dashboard
  getAllStudentsCount: () =>
  `/jnpa-school-project/dashboard/getAllStudentsCount`,

   getAllUsersCount: () =>
  "/jnpa-school-project/dashboard/getAllUsersCount",
   
   // apiEndpoints.ts
getAllAdmissionInquiryCount: () =>
  "/jnpa-school-project/dashboard/getAllAdmissionInquiryCount",
  
getStudentByUserId: (userId: number | string) =>          
    `/jnpa-school-project/student/getStudentByUserId/${userId}`,

getAllCurrentYearStudentsData: (page: number, size: number) =>
  `/jnpa-school-project/student/getAllCurrentYearStudentsData?page=${page}&size=${size}&sort=studentId,desc&paginate=true`,

  // ===============================
  // Student Result
  // ===============================
  saveStudentResult: () => `/jnpa-school-project/studentResult/saveStudentResult`,
  updateStudentResult: () => `/jnpa-school-project/studentResult/updateStudentResult`,
  deleteStudentResult: (resultId: number | string) =>
    `/jnpa-school-project/studentResult/deleteStudentResult/${resultId}`,
};