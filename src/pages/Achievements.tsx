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

  // 🛠️ FIX — was `user?.division`, which is always undefined if your
  // userDTO's real field name is `section` (same mismatch Results.tsx
  // had). That silently drops the division from a teacher's locked
  // class scope on every load. Swap to whatever your actual `user`
  // field is named if it isn't `section`.
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

  const [pagination, setPagination] =
    useState({
      current: 1,
      pageSize: 10,
      total: 0,
    });

  // 🛠️ FIX — this used to be `const [filters] = useState(...)`, i.e. no
  // setter at all, so there was no way to ever change it (a search box
  // bound to it could never actually update it). Now a normal state pair,
  // same as Results.tsx, so First Name / Last Name / Roll No can be typed
  // in and searched.
  const [filters, setFilters] =
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
  // Search Bar
  // -------------------------------------------------------

  // Updates one filter field as the user types. Class scope fields
  // (standard/division/medium) are never touched here, so a teacher's
  // locked class scope always stays intact alongside whatever they search.
  const handleFilterChange = (
    field: keyof ResultFilters,
    value: string
  ) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  // Re-queries page 1 using whatever is currently typed into the
  // First Name / Last Name / Roll No boxes (plus the pinned class scope
  // for a teacher).
  const handleSearch = () => {
    loadAchievements(1, pagination.pageSize, filters);
  };

  // Pressing Enter in any of the search inputs searches too.
  const handleSearchKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleReset = () => {
    // Class scope (standard/division/medium) stays pinned for a teacher so
    // Reset can't be used to escape their assigned class.
    const cleared: ResultFilters = { ...classScope };
    setFilters(cleared);
    loadAchievements(1, pagination.pageSize, cleared);
  };

  // ---------------------------------------------------------------
  // 🛠️ FIX — client-side fallback filter for First Name / Last Name /
  // Roll No, same as Results.tsx.
  //
  // The backend's getAllCurrentYearStudentsData endpoint may only
  // filter on standard/division/medium and silently ignore
  // firstName/lastName/rollNo in the request body, which is why the
  // search boxes looked wired up but never visibly changed anything.
  // This filters whatever the API already returned for the current
  // page, so search visibly works regardless of what the backend
  // actually honors server-side.
  //
  // ⚠️ This only filters the CURRENT PAGE of results, not the whole
  // dataset. Once the backend is confirmed to filter on these fields
  // itself, this can be removed and `students` used directly again.
  // ---------------------------------------------------------------
  const displayedStudents = useMemo(() => {
    const first = filters.firstName?.trim().toLowerCase();
    const last = filters.lastName?.trim().toLowerCase();
    const roll = filters.rollNo?.trim().toLowerCase();

    if (!first && !last && !roll) return students;

    return students.filter((s) => {
      const matchesFirst = first
        ? (s.firstName || "").toLowerCase().includes(first)
        : true;
      const matchesLast = last
        ? (s.lastName || "").toLowerCase().includes(last)
        : true;
      const matchesRoll = roll
        ? getRollNo(s).toString().toLowerCase().includes(roll)
        : true;
      return matchesFirst && matchesLast && matchesRoll;
    });
  }, [students, filters.firstName, filters.lastName, filters.rollNo]);

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
  // Filter Bar (shared by desktop + mobile)
  // -------------------------------------------------------

  const renderFilterBar = () => (
    <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
      <Col xs={24} sm={12} md={6}>
        <Input
          placeholder="First Name"
          value={filters.firstName}
          onChange={(e) => handleFilterChange("firstName", e.target.value)}
          onKeyDown={handleSearchKeyDown}
          style={{ width: "100%" }}
          allowClear
        />
      </Col>

      <Col xs={24} sm={12} md={6}>
        <Input
          placeholder="Last Name"
          value={filters.lastName}
          onChange={(e) => handleFilterChange("lastName", e.target.value)}
          onKeyDown={handleSearchKeyDown}
          style={{ width: "100%" }}
          allowClear
        />
      </Col>

      <Col xs={24} sm={12} md={6}>
        <Input
          placeholder="Roll No"
          value={filters.rollNo}
          onChange={(e) => handleFilterChange("rollNo", e.target.value)}
          onKeyDown={handleSearchKeyDown}
          style={{ width: "100%" }}
          allowClear
        />
      </Col>

      <Col xs={24} sm={24} md={6}>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            Search
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            Reset
          </Button>
        </div>
      </Col>
    </Row>
  );

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
          {renderFilterBar()}

          {loading && (
            <div className="text-center text-sm text-gray-400 py-6">
              Loading...
            </div>
          )}

          {!loading &&
            displayedStudents.length === 0 && (
              <div className="text-center text-sm text-gray-400 py-6">
                No achievement data found
              </div>
            )}

          {!loading &&
            displayedStudents.map((record) => (
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
                    {/* Achievement */}
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
        {renderFilterBar()}

        <Table
          rowKey="studentId"
          columns={columns}
          dataSource={displayedStudents}
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