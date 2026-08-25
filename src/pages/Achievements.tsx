import { useEffect, useState, useCallback } from "react";

import {
  Card,
  Button,
  Table,
  Tag,
  Grid,
  message,
  Space,
  Tooltip,
} from "antd";

import {
  EditOutlined,
} from "@ant-design/icons";

import type { ColumnsType } from "antd/es/table";

import {
  getAllCurrentYearStudentsData,
  type ResultStudentDTO,
  type ResultFilters,
} from "../services/Resultservice";

import AchievementDrawer from "./AchievementDrawer";

import { useAuth } from "../hooks/useAuth";

const { useBreakpoint } = Grid;

const TEACHER_ROLE = "TEACHER";

// ---------------------------------------------------------
// Helper functions
// ---------------------------------------------------------

const getStandard = (record: ResultStudentDTO) =>
  record.academicInformation?.[0]?.standard || "-";

const getDivision = (record: ResultStudentDTO) =>
  record.academicInformation?.[0]?.division || "-";

const getRollNo = (record: ResultStudentDTO) =>
  record.academicInformation?.[0]?.rollNo || "-";

const getMedium = (record: ResultStudentDTO) =>
  record.academicInformation?.[0]?.medium || "-";

const getAcademicYear = (record: ResultStudentDTO) =>
  record.academicInformation?.[0]?.academicYear || "-";

// ---------------------------------------------------------
// Component
// ---------------------------------------------------------

export default function Achievements() {
  const screens = useBreakpoint();

  const isMobile = !screens.md;

  const { user } = useAuth();

  // -------------------------------------------------------
  // Teacher restriction
  // -------------------------------------------------------

  const isTeacher = user?.role === TEACHER_ROLE;

  const classScope: Pick<
    ResultFilters,
    "standard" | "division" | "medium"
  > = isTeacher
    ? {
        standard: user?.standard || "",
        division: user?.division || "",
        medium: user?.medium || "",
      }
    : {};

  // -------------------------------------------------------
  // State
  // -------------------------------------------------------

  const [students, setStudents] =
    useState<ResultStudentDTO[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [pagination, setPagination] =
    useState({
      current: 1,
      pageSize: 10,
      total: 0,
    });

  const [filters] =
    useState<ResultFilters>({
      ...classScope,
    });

  // -------------------------------------------------------
  // Achievement Drawer State
  // -------------------------------------------------------

  const [achievementDrawerOpen, setAchievementDrawerOpen] =
    useState(false);

  const [selectedStudent, setSelectedStudent] =
    useState<ResultStudentDTO | null>(null);

  // -------------------------------------------------------
  // Load Students
  // -------------------------------------------------------

  const loadAchievements = useCallback(
    (
      page = pagination.current,
      pageSize = pagination.pageSize,
      appliedFilters = filters
    ) => {
      setLoading(true);

      getAllCurrentYearStudentsData(
        page - 1,
        pageSize,
        appliedFilters
      )
        .then((response) => {
          if (response.success) {
            setStudents(
              response.data?.data || []
            );

            setPagination({
              current: page,
              pageSize,
              total:
                response.data?.totalElements ||
                0,
            });
          } else {
            message.error(
              response.message ||
                "Failed to load achievement data"
            );
          }
        })
        .catch((error) => {
          message.error(
            error?.message ||
              "Failed to load achievement data"
          );
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [
      filters,
      pagination.current,
      pagination.pageSize,
    ]
  );

  // -------------------------------------------------------
  // Initial API Call
  // -------------------------------------------------------

  useEffect(() => {
    loadAchievements(
      1,
      pagination.pageSize,
      filters
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------
  // Open Achievement Drawer
  // -------------------------------------------------------

  const openAchievementDrawer = (
    record: ResultStudentDTO
  ) => {
    setSelectedStudent(record);

    setAchievementDrawerOpen(true);
  };

  // -------------------------------------------------------
  // Close Achievement Drawer
  // -------------------------------------------------------

  const closeAchievementDrawer = () => {
    setAchievementDrawerOpen(false);

    setSelectedStudent(null);
  };

  // -------------------------------------------------------
  // Table Columns
  // -------------------------------------------------------

  const columns: ColumnsType<ResultStudentDTO> = [
    {
      title: "Sr No",
      align: "center",
      width: 70,

      render: (_, __, index) =>
        (pagination.current - 1) *
          pagination.pageSize +
        index +
        1,
    },

    {
      title: "Student Code",
      dataIndex: "studentCode",
      align: "center",

      render: (value) =>
        value || "-",
    },

    {
      title: "First Name",
      dataIndex: "firstName",
      align: "center",

      render: (value) =>
        value || "-",
    },

    {
      title: "Last Name",
      dataIndex: "lastName",
      align: "center",

      render: (value) =>
        value || "-",
    },

    {
      title: "Roll No",
      align: "center",

      render: (_, record) =>
        getRollNo(record),
    },

    {
      title: "Standard",
      align: "center",

      render: (_, record) =>
        getStandard(record),
    },

    {
      title: "Division",
      align: "center",

      render: (_, record) =>
        getDivision(record),
    },

    {
      title: "Gender",
      dataIndex: "gender",
      align: "center",

      render: (value) =>
        value || "-",
    },

    {
      title: "Medium",
      align: "center",

      render: (_, record) =>
        getMedium(record),
    },

    {
      title: "Academic Year",
      align: "center",

      render: (_, record) =>
        getAcademicYear(record),
    },

    {
      title: "Status",
      dataIndex: "status",
      align: "center",

      render: (status: string) =>
        status ? (
          <Tag
            color={
              status === "ACTIVE"
                ? "green"
                : "red"
            }
          >
            {status}
          </Tag>
        ) : (
          "-"
        ),
    },

    // -----------------------------------------------------
    // ACTIONS
    // -----------------------------------------------------

    {
      title: "Actions",
      align: "center",
      width: 100,

      render: (_, record) => (
        <Space>
          
            <Button
              size="small"
               type="primary"
              icon={
                <EditOutlined />
              }
              onClick={() =>
                openAchievementDrawer(
                  record
                )
              }
            />
          
        </Space>
      ),
    },
  ];

  // -------------------------------------------------------
  // Mobile View
  // -------------------------------------------------------

  if (isMobile) {
    return (
      <>
        <Card title="Achievements">
          {loading && (
            <div className="text-center text-sm text-gray-400 py-6">
              Loading...
            </div>
          )}

          {!loading &&
            students.length === 0 && (
              <div className="text-center text-sm text-gray-400 py-6">
                No achievement data found
              </div>
            )}

          {!loading &&
            students.map((record) => (
              <div
                key={record.studentId}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {record.firstName}{" "}
                      {record.lastName}
                    </p>

                    <p className="text-xs text-gray-500">
                      Code:{" "}
                      {record.studentCode ||
                        "-"}
                    </p>

                    <p className="text-xs text-gray-500">
                      {getStandard(record)} -{" "}
                      {getDivision(record)}
                    </p>

                    <p className="text-xs text-gray-500">
                      Roll No:{" "}
                      {getRollNo(record)}
                    </p>
                  </div>

                  {record.status && (
                    <Tag
                      color={
                        record.status ===
                        "ACTIVE"
                          ? "green"
                          : "red"
                      }
                    >
                      {record.status}
                    </Tag>
                  )}
                </div>

                <div className="text-xs text-gray-500 space-y-1">
                  <p>
                    Gender:{" "}
                    {record.gender || "-"}
                  </p>

                  <p>
                    Medium:{" "}
                    {getMedium(record)}
                  </p>

                  <p>
                    Academic Year:{" "}
                    {getAcademicYear(
                      record
                    )}
                  </p>
                </div>

                <div className="flex justify-end mt-3">
                  <Button
                    size="small"
                    icon={
                      <EditOutlined />
                    }
                    onClick={() =>
                      openAchievementDrawer(
                        record
                      )
                    }
                  >
                    Achievement
                  </Button>
                </div>
              </div>
            ))}

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-gray-500">
              Total:{" "}
              {pagination.total}
            </span>

            <div className="flex gap-2">
              <button
                className="px-3 py-1 border rounded text-sm"
                disabled={
                  pagination.current <=
                  1
                }
                onClick={() =>
                  loadAchievements(
                    pagination.current -
                      1,
                    pagination.pageSize,
                    filters
                  )
                }
              >
                Prev
              </button>

              <button
                className="px-3 py-1 border rounded text-sm"
                disabled={
                  pagination.current *
                    pagination.pageSize >=
                  pagination.total
                }
                onClick={() =>
                  loadAchievements(
                    pagination.current +
                      1,
                    pagination.pageSize,
                    filters
                  )
                }
              >
                Next
              </button>
            </div>
          </div>
        </Card>

        {/* ---------------------------------------------
            Achievement Drawer
        ---------------------------------------------- */}

        <AchievementDrawer
          open={
            achievementDrawerOpen
          }
          studentId={
            selectedStudent?.studentId ||
            null
          }
          studentInfo={{
            studentCode:
              selectedStudent?.studentCode,

            firstName:
              selectedStudent?.firstName,

            lastName:
              selectedStudent?.lastName,

            standard: selectedStudent
              ? getStandard(
                  selectedStudent
                )
              : undefined,

            division: selectedStudent
              ? getDivision(
                  selectedStudent
                )
              : undefined,

            academicYear:
              selectedStudent
                ? getAcademicYear(
                    selectedStudent
                  )
                : undefined,
          }}
          onClose={
            closeAchievementDrawer
          }
          onSaved={() => {
            loadAchievements(
              pagination.current,
              pagination.pageSize,
              filters
            );
          }}
        />
      </>
    );
  }

  // -------------------------------------------------------
  // Desktop View
  // -------------------------------------------------------

  return (
    <>
      <Card >
        <Table
          rowKey="studentId"
          columns={columns}
          dataSource={students}
          loading={loading}
          bordered
          pagination={{
            current:
              pagination.current,

            pageSize:
              pagination.pageSize,

            total:
              pagination.total,

            showSizeChanger: true,

            onChange: (
              page,
              pageSize
            ) => {
              loadAchievements(
                page,
                pageSize,
                filters
              );
            },
          }}
        />
      </Card>

      {/* ---------------------------------------------
          Achievement Drawer
      ---------------------------------------------- */}

      <AchievementDrawer
        open={
          achievementDrawerOpen
        }
        studentId={
          selectedStudent?.studentId ||
          null
        }
        studentInfo={{
          studentCode:
            selectedStudent?.studentCode,

          firstName:
            selectedStudent?.firstName,

          lastName:
            selectedStudent?.lastName,

          standard: selectedStudent
            ? getStandard(
                selectedStudent
              )
            : undefined,

          division: selectedStudent
            ? getDivision(
                selectedStudent
              )
            : undefined,

          academicYear:
            selectedStudent
              ? getAcademicYear(
                  selectedStudent
                )
              : undefined,
        }}
        onClose={
          closeAchievementDrawer
        }
        onSaved={() => {
          loadAchievements(
            pagination.current,
            pagination.pageSize,
            filters
          );
        }}
      />
    </>
  );
}