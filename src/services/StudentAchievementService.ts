import config from "../config/config";
import { apiEndpoints } from "./apiEndpoints";

// =========================================================
// SAVE ACHIEVEMENT PAYLOAD
// =========================================================

export interface SaveStudentAchievementPayload {
  studentId: number;
  achievementName: string;
  achievementDescription: string;
  academicYear: string;
}

// =========================================================
// UPDATE ACHIEVEMENT PAYLOAD
// =========================================================

export interface UpdateStudentAchievementPayload {
  studentId: number;
  studentAchievementId: number;
  achievementName: string;
  achievementDescription: string;
  academicYear: string;
}

// =========================================================
// ACHIEVEMENT DTO
// =========================================================

export interface StudentAchievementDTO {
  academicYear: string;
  achievementDescription: string;
  achievementName: string;
  studentAchievementId: number;
  studentId: number;
}

// =========================================================
// SAVE RESPONSE
// =========================================================

export interface SaveStudentAchievementResponse {
  success: boolean;
  message: string;
  data: StudentAchievementDTO;
  timestamp?: string;
}

// =========================================================
// UPDATE RESPONSE
// =========================================================

export interface UpdateStudentAchievementResponse {
  success: boolean;
  message: string;
  data: StudentAchievementDTO;
  timestamp?: string;
}

// =========================================================
// SAVE STUDENT ACHIEVEMENT
// POST
// =========================================================

export const saveStudentAchievement = (
  payload: SaveStudentAchievementPayload
): Promise<SaveStudentAchievementResponse> => {
  const token = localStorage.getItem("token");

  return fetch(
    `${config.baseURL}${apiEndpoints.saveStudentAchievement()}`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",

        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),
      },

      body: JSON.stringify(payload),
    }
  ).then((response) => {
    if (!response.ok) {
      return response.json().then((error) => {
        throw new Error(
          error?.message ||
            "Failed to save student achievement"
        );
      });
    }

    return response.json();
  });
};

// =========================================================
// UPDATE STUDENT ACHIEVEMENT
// PUT
// =========================================================

export const updateStudentAchievement = (
  payload: UpdateStudentAchievementPayload
): Promise<UpdateStudentAchievementResponse> => {
  const token = localStorage.getItem("token");

  return fetch(
    `${config.baseURL}${apiEndpoints.updateStudentAchievement()}`,
    {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",

        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),
      },

      body: JSON.stringify(payload),
    }
  ).then((response) => {
    if (!response.ok) {
      return response.json().then((error) => {
        throw new Error(
          error?.message ||
            "Failed to update student achievement"
        );
      });
    }

    return response.json();
  });
};
// =========================================================
// DELETE STUDENT ACHIEVEMENT RESPONSE
// =========================================================

export interface DeleteStudentAchievementResponse {
  success: boolean;
  message: string;
  data: null;
  timestamp?: string;
}

// =========================================================
// DELETE STUDENT ACHIEVEMENT
// =========================================================

export const deleteStudentAchievement = (
  studentAchievementId: number
): Promise<DeleteStudentAchievementResponse> => {
  const token = localStorage.getItem("token");

  return fetch(
    `${config.baseURL}${apiEndpoints.deleteStudentAchievement(
      studentAchievementId
    )}`,
    {
      method: "DELETE",

      headers: {
        "Content-Type": "application/json",

        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),
      },
    }
  ).then((response) => {
    if (!response.ok) {
      return response.json().then((error) => {
        throw new Error(
          error?.message ||
            "Failed to delete student achievement"
        );
      });
    }

    return response.json();
  });
};