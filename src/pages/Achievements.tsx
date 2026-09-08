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

// 🛠️ FIX — same issue as Results.tsx: the backend only filters on
// standard/division/medium and ignores firstName/lastName/rollNo, so
// search was only ever filtering whatever 10 rows were already loaded
// for the CURRENT page — page 2/3 never showed matches.
// Fix: fetch every row matching the class scope ONCE (large page size),
// then filter + paginate entirely on the client over the FULL dataset.
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

  // Holds EVERY row matching the class scope (not just one page) so
  // search/pagination below can work over the full dataset.
  const [students, setStudents] =
    useState<ResultStudentDTO[]>([]);

  const [loading, setLoading] =
    useState(false);

  // current/pageSize are now purely a client-side "which slice to show"
  // cursor — no network call is needed just to change page anymore.
  const [pagination, setPagination] =
    useState({
      current: 1,
      pageSize: 10,
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
    (appliedFilters = filters) => {
      setLoading(true);

      // Always pull the full class-scoped set (page 0, MAX_FETCH_SIZE) —
      // firstName/lastName/rollNo are filtered client-side below, so
      // there's no need to ask the backend to re-page on every search.
      getAllCurrentYearStudentsData(
        0,
        MAX_FETCH_SIZE,
        appliedFilters
      )
        .then((response) => {
          if (response.success) {
            setStudents(
              response.data?.data || []
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

  // Updates one filter field as the user types. Class scope fields
  // (standard/division/medium) are never touched here, so a teacher's
  // locked class scope always stays intact alongside whatever they search.
  const handleFilterChange = (
    field: keyof ResultFilters,
    value: string
  ) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  // Jumps back to page 1 of the (already fully loaded) filtered results
  // for whatever is currently typed into the First Name / Last Name /
  // Roll No boxes (plus the pinned class scope for a teacher). No
  // refetch needed — filtering happens client-side below.
  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }));
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
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  // ---------------------------------------------------------------
  // 🛠️ FIX — search now runs over the FULL fetched dataset (`students`,
  // which holds every class-scoped row, not just one page), so a match
  // on any page is found. The result is then sliced below for whichever
  // page is currently selected.
  // ---------------------------------------------------------------
  const filteredStudents = useMemo(() => {
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

  const total = filteredStudents.length;

  // The slice actually rendered for the current page/pageSize — this is
  // the client-side pagination step that replaces the old server paging.
  const displayedStudents = useMemo(() => {
    const start = (pagination.current - 1) * pagination.pageSize;
    return filteredStudents.slice(start, start + pagination.pageSize);
  }, [filteredStudents, pagination.current, pagination.pageSize]);

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
              {total}
            </span>

            <div className="flex gap-2">
              <button
                className="px-3 py-1 border rounded text-sm"
                disabled={
                  pagination.current <=
                  1
                }
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    current: prev.current - 1,
                  }))
                }
              >
                Prev
              </button>

              <button
                className="px-3 py-1 border rounded text-sm"
                disabled={
                  pagination.current *
                    pagination.pageSize >=
                  total
                }
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    current: prev.current + 1,
                  }))
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
            loadAchievements(filters);
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

        <div className="table-wrapper">
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

              total: total,

              showSizeChanger: false,

              showTotal: (t) => `Total: ${t}`,

              onChange: (
                page,
                pageSize
              ) => {
                setPagination({ current: page, pageSize });
              },
            }}
          />
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
          loadAchievements(filters);
        }}
      />
    </>
  );
}