import { useEffect, useState, useCallback, useMemo } from "react";

import {
  Card,
  Button,
  Table,
  Tag,
  Grid,
  message,
  Space,
  Row,
  Col,
  Input,
} from "antd";

import {
  EditOutlined,
  SearchOutlined,
  ReloadOutlined,
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
// Fetch full dataset so search + pagination
// can work on complete student list.
// ---------------------------------------------------------

const MAX_FETCH_SIZE = 10000;

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
        division: "",
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

  // -------------------------------------------------------
  // Pagination
  // -------------------------------------------------------

  const [pagination, setPagination] =
    useState({
      current: 1,
      pageSize: 10,
    });

  // -------------------------------------------------------
  // Filters
  // -------------------------------------------------------

  const [filters, setFilters] =
    useState<ResultFilters>({
      ...classScope,
    });

  // -------------------------------------------------------
  // Achievement Drawer State
  // -------------------------------------------------------

  const [
    achievementDrawerOpen,
    setAchievementDrawerOpen,
  ] = useState(false);

  const [selectedStudent, setSelectedStudent] =
    useState<ResultStudentDTO | null>(null);

  // -------------------------------------------------------
  // Load Students
  // -------------------------------------------------------

  const loadAchievements = useCallback(
    (appliedFilters = filters) => {
      setLoading(true);

      // -----------------------------------------------------
      // Get all students for the selected class.
      // Search and pagination are handled on frontend.
      // -----------------------------------------------------

      getAllCurrentYearStudentsData(
        0,
        MAX_FETCH_SIZE,
        appliedFilters
      )
        .then((response) => {
          if (response.success) {
            const students =
              response.data?.data || [];

            // =================================================
            // IMPORTANT FIX
            // =================================================
            //
            // Backend returns newly added student FIRST.
            //
            // Example API response:
            //
            // Student 5  <- NEW
            // Student 4
            // Student 3
            // Student 2
            // Student 1  <- OLD
            //
            // We need:
            //
            // Student 1
            // Student 2
            // Student 3
            // Student 4
            // Student 5  <- NEW
            //
            // [...students] creates a copy before reverse()
            // so the original API array is not mutated.
            // =================================================

            setStudents(
              [...students].reverse()
            );
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

    // Keep existing behavior
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // -------------------------------------------------------
  // Initial API Call
  // -------------------------------------------------------

  useEffect(() => {
    loadAchievements(filters);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------
  // Search Bar
  // -------------------------------------------------------

  const handleFilterChange = (
    field: keyof ResultFilters,
    value: string
  ) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // -------------------------------------------------------
  // Search
  // -------------------------------------------------------

  const handleSearch = () => {
    setPagination((prev) => ({
      ...prev,
      current: 1,
    }));
  };

  // -------------------------------------------------------
  // Search on Enter
  // -------------------------------------------------------

  const handleSearchKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // -------------------------------------------------------
  // Reset
  // -------------------------------------------------------

  const handleReset = () => {
    // Teacher's class scope remains fixed.

    const cleared: ResultFilters = {
      ...classScope,
    };

    setFilters(cleared);

    setPagination((prev) => ({
      ...prev,
      current: 1,
    }));
  };

  // -------------------------------------------------------
  // Search over FULL dataset
  // -------------------------------------------------------

  const filteredStudents = useMemo(() => {
    const first =
      filters.firstName
        ?.trim()
        .toLowerCase();

    const last =
      filters.lastName
        ?.trim()
        .toLowerCase();

    const roll =
      filters.rollNo
        ?.trim()
        .toLowerCase();

    // No search
    if (!first && !last && !roll) {
      return students;
    }

    return students.filter((student) => {
      const matchesFirst = first
        ? (student.firstName || "")
            .toLowerCase()
            .includes(first)
        : true;

      const matchesLast = last
        ? (student.lastName || "")
            .toLowerCase()
            .includes(last)
        : true;

      const matchesRoll = roll
        ? getRollNo(student)
            .toString()
            .toLowerCase()
            .includes(roll)
        : true;

      return (
        matchesFirst &&
        matchesLast &&
        matchesRoll
      );
    });
  }, [
    students,
    filters.firstName,
    filters.lastName,
    filters.rollNo,
  ]);

  // -------------------------------------------------------
  // Total
  // -------------------------------------------------------

  const total =
    filteredStudents.length;

  // -------------------------------------------------------
  // Current page data
  // -------------------------------------------------------

  const displayedStudents = useMemo(() => {
    const start =
      (pagination.current - 1) *
      pagination.pageSize;

    return filteredStudents.slice(
      start,
      start + pagination.pageSize
    );
  }, [
    filteredStudents,
    pagination.current,
    pagination.pageSize,
  ]);

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
  // Filter Bar
  // -------------------------------------------------------

  const renderFilterBar = () => (
    <Row
      gutter={[12, 12]}
      style={{
        marginBottom: 20,
      }}
    >
      {/* First Name */}
      <Col
        xs={24}
        sm={12}
        md={6}
      >
        <Input
          placeholder="First Name"
          value={filters.firstName}
          onChange={(e) =>
            handleFilterChange(
              "firstName",
              e.target.value
            )
          }
          onKeyDown={
            handleSearchKeyDown
          }
          style={{
            width: "100%",
          }}
          allowClear
        />
      </Col>

      {/* Last Name */}
      <Col
        xs={24}
        sm={12}
        md={6}
      >
        <Input
          placeholder="Last Name"
          value={filters.lastName}
          onChange={(e) =>
            handleFilterChange(
              "lastName",
              e.target.value
            )
          }
          onKeyDown={
            handleSearchKeyDown
          }
          style={{
            width: "100%",
          }}
          allowClear
        />
      </Col>

      {/* Roll No */}
      <Col
        xs={24}
        sm={12}
        md={6}
      >
        <Input
          placeholder="Roll No"
          value={filters.rollNo}
          onChange={(e) =>
            handleFilterChange(
              "rollNo",
              e.target.value
            )
          }
          onKeyDown={
            handleSearchKeyDown
          }
          style={{
            width: "100%",
          }}
          allowClear
        />
      </Col>

      {/* Buttons */}
      <Col
        xs={24}
        sm={24}
        md={6}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "flex-end",
            gap: 8,
          }}
        >
          <Button
            type="primary"
            icon={
              <SearchOutlined />
            }
            onClick={
              handleSearch
            }
          >
            Search
          </Button>

          <Button
            icon={
              <ReloadOutlined />
            }
            onClick={
              handleReset
            }
          >
            Reset
          </Button>
        </div>
      </Col>
    </Row>
  );

  // -------------------------------------------------------
  // Table Columns
  // -------------------------------------------------------

  const columns: ColumnsType<ResultStudentDTO> =
    [
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

      // ---------------------------------------------------
      // Actions
      // ---------------------------------------------------

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

  // =========================================================
  // MOBILE VIEW
  // =========================================================

  if (isMobile) {
    return (
      <>
        <Card title="Achievements">
          {renderFilterBar()}

          {/* Loading */}
          {loading && (
            <div className="text-center text-sm text-gray-400 py-6">
              Loading...
            </div>
          )}

          {/* No Data */}
          {!loading &&
            displayedStudents.length ===
              0 && (
              <div className="text-center text-sm text-gray-400 py-6">
                No achievement data found
              </div>
            )}

          {/* Student Cards */}
          {!loading &&
            displayedStudents.map(
              (record) => (
                <div
                  key={
                    record.studentId
                  }
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {
                          record.firstName
                        }{" "}
                        {
                          record.lastName
                        }
                      </p>

                      <p className="text-xs text-gray-500">
                        Code:{" "}
                        {record.studentCode ||
                          "-"}
                      </p>

                      <p className="text-xs text-gray-500">
                        {
                          getStandard(
                            record
                          )
                        }{" "}
                        -{" "}
                        {
                          getDivision(
                            record
                          )
                        }
                      </p>

                      <p className="text-xs text-gray-500">
                        Roll No:{" "}
                        {
                          getRollNo(
                            record
                          )
                        }
                      </p>
                    </div>

                    {/* Status */}
                    {record.status && (
                      <Tag
                        color={
                          record.status ===
                          "ACTIVE"
                            ? "green"
                            : "red"
                        }
                      >
                        {
                          record.status
                        }
                      </Tag>
                    )}
                  </div>

                  {/* Details */}
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>
                      Gender:{" "}
                      {record.gender ||
                        "-"}
                    </p>

                    <p>
                      Medium:{" "}
                      {
                        getMedium(
                          record
                        )
                      }
                    </p>

                    <p>
                      Academic Year:{" "}
                      {
                        getAcademicYear(
                          record
                        )
                      }
                    </p>
                  </div>

                  {/* Action */}
                  <div className="flex justify-end mt-3">
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
                    >
                      Achievement
                    </Button>
                  </div>
                </div>
              )
            )}

          {/* Mobile Pagination */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-gray-500">
              Total:{" "}
              {total}
            </span>

            <div className="flex gap-2">
              {/* Previous */}
              <button
                className="px-3 py-1 border rounded text-sm"
                disabled={
                  pagination.current <=
                  1
                }
                onClick={() =>
                  setPagination(
                    (prev) => ({
                      ...prev,
                      current:
                        prev.current -
                        1,
                    })
                  )
                }
              >
                Prev
              </button>

              {/* Next */}
              <button
                className="px-3 py-1 border rounded text-sm"
                disabled={
                  pagination.current *
                    pagination.pageSize >=
                  total
                }
                onClick={() =>
                  setPagination(
                    (prev) => ({
                      ...prev,
                      current:
                        prev.current +
                        1,
                    })
                  )
                }
              >
                Next
              </button>
            </div>
          </div>
        </Card>

        {/* =====================================================
            Achievement Drawer
        ===================================================== */}

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

            standard:
              selectedStudent
                ? getStandard(
                    selectedStudent
                  )
                : undefined,

            division:
              selectedStudent
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
            // Refresh the list after achievement save.
            // Reverse is automatically applied inside
            // loadAchievements().
            loadAchievements(
              filters
            );
          }}
        />
      </>
    );
  }

  // =========================================================
  // DESKTOP VIEW
  // =========================================================

  return (
    <>
      <Card>
        {renderFilterBar()}

        <div className="table-wrapper">
          <Table
            rowKey="studentId"
            columns={columns}
            dataSource={
              displayedStudents
            }
            loading={loading}
            bordered
            scroll={{
              x: "max-content",
            }}
            pagination={{
              current:
                pagination.current,

              pageSize:
                pagination.pageSize,

              total: total,

              showSizeChanger: false,

              showTotal: (t) =>
                `Total: ${t}`,

              onChange: (
                page,
                pageSize
              ) => {
                setPagination({
                  current: page,
                  pageSize,
                });
              },
            }}
          />
        </div>
      </Card>

      {/* =====================================================
          Achievement Drawer
      ===================================================== */}

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

          standard:
            selectedStudent
              ? getStandard(
                  selectedStudent
                )
              : undefined,

          division:
            selectedStudent
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
          // Refresh the list after achievement save.
          // Reverse is automatically applied inside
          // loadAchievements().
          loadAchievements(
            filters
          );
        }}
      />
    </>
  );
}