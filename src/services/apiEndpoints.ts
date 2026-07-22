

export const apiEndpoints = {
  login: () => `/jnpa-school-project/auth/login`,

  saveSubject: () => `/jnpa-school-project/subjectMaster/saveSubjectMaster`,
  updateSubject: () =>`/jnpa-school-project/subjectMaster/updateSubjectMaster`,
  getSubjectById: (id: number | string) =>`/jnpa-school-project/subjectMaster/getSubjectMasterById/${id}`,
deleteSubject: (subjectMasterId: number | string) =>`/jnpa-school-project/subjectMaster/deleteSubjectMaster/${subjectMasterId}`,
getAllSubjects: (page: number, size: number) =>`/jnpa-school-project/subjectMaster/getAllSubjectMasterByFilter?page=${page}&size=${size}&paginate=true`,



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
  getAllExamsByFilter: (page: number, size: number) => `/jnpa-school-project/exam/getAllExamsByFilter?page=${page}&size=${size}&paginate=true`,

  saveAdmission: () => `/jnpa-school-project/admission/saveAdmission`,
  updateAdmisson: () => `/jnpa-school-project/admission/updateAdmission`,
  getAllAdmissionsByFilter: (page: number, size: number) => `/jnpa-school-project/admission/getAllAdmissionsByFilter?page=${page}&size=${size}&paginate=true`,

  saveClassMaster: () =>`/jnpa-school-project/classMaster/saveClassMaster`,
  
  updateClassMaster: () =>`/jnpa-school-project/classMaster/updateClassMaster`,
  getAllClassMaster: (page: number, size: number) =>`/jnpa-school-project/classMaster/getAllClassMasterByFilter?page=${page}&size=${size}&paginate=true`,
  getClassMasterById: (id: number | string) =>
  `/jnpa-school-project/classMaster/getClassMasterById/${id}`,
  deleteClassMaster: (id: number | string) =>
  `/jnpa-school-project/classMaster/deleteClassMaster/${id}`,
  saveUserInformation: () =>
  `/jnpa-school-project/userInformation/saveUserInformation`,
  getUserInformationById: (id: number) =>
  `/jnpa-school-project/userInformation/getUserInformationByUserId/${id}`,
  updateUserInformation: () =>
  `/jnpa-school-project/userInformation/updateUserInformation`,




  getSubjectsByClassId: (id:number) =>
`/jnpa-school-project/subjectAssignment/getSubjectsByClassId/${id}`,

  assignOrUnassignSubjects: () =>"/jnpa-school-project/subjectAssignment/assignOrUnassignSubjects",

};


