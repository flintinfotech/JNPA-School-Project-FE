import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Card,
  Button,
  Table,
  Tag,
  Grid,
  message,
  Space,
  Tooltip,
  Row,
  Col,
  Input,
} from "antd";
import {
  EyeOutlined,
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
import { useAuth } from "../hooks/useAuth";
import ResultDrawer from "./ResultDrawer";

const { useBreakpoint } = Grid;

// Teacher role
const TEACHER_ROLE = "TEACHER";

// ---------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------

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

// ---------------------------------------------------------------
// Results Component
// ---------------------------------------------------------------

export default function Results() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const { user } = useAuth();

  // -------------------------------------------------------------
  // Teacher check
  // -------------------------------------------------------------

  const isTeacher = user?.role === TEACHER_ROLE;

  // -------------------------------------------------------------
  // Teacher class scope
  // -------------------------------------------------------------

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

  // -------------------------------------------------------------
  // Fetch size
  // -------------------------------------------------------------

  const RESULTS_FETCH_SIZE = 2000;

  // -------------------------------------------------------------
  // State
  // -------------------------------------------------------------

  const [allStudents, setAllStudents] = useState<ResultStudentDTO[]>([]);
  const [loading, setLoading] = useState(false);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  const [filters, setFilters] = useState<ResultFilters>({
    ...classScope,
  });

  // -------------------------------------------------------------
  // Drawer state
  // -------------------------------------------------------------

  const [drawerOpen, setDrawerOpen] = useState(false);

  const [drawerMode, setDrawerMode] = useState<
    "view" | "edit"
  >("view");

  const [selectedStudent, setSelectedStudent] =
    useState<ResultStudentDTO | null>(null);

  // -------------------------------------------------------------
  // Load Results
  // -------------------------------------------------------------

  const loadResults = useCallback(
    async (
      appliedFilters = filters,
      resetPage = true
    ) => {
      setLoading(true);

      try {
        const response =
          await getAllCurrentYearStudentsData(
            0,
            RESULTS_FETCH_SIZE,
            appliedFilters
          );

        if (response.success) {
          const students = response.data?.data || [];

          // -----------------------------------------------------
          // IMPORTANT FIX
          //
          // API is returning latest student first.
          //
          // Example API:
          //
          // Student 5  <- Newly added
          // Student 4
          // Student 3
          // Student 2
          // Student 1  <- Oldest
          //
          // We reverse it so UI becomes:
          //
          // Student 1
          // Student 2
          // Student 3
          // Student 4
          // Student 5  <- Newly added
          //
          // [...students] prevents mutation of original API array.
          // -----------------------------------------------------

          setAllStudents([...students].reverse());

          if (resetPage) {
            setPagination((prev) => ({
              ...prev,
              current: 1,
            }));
          }
        } else {
          message.error(
            response.message ||
              "Failed to load results"
          );
        }
      } catch (error: any) {
        message.error(
          error?.response?.data?.message ||
            "Failed to load results"
        );
      } finally {
        setLoading(false);
      }
    },

    // Existing behavior
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // -------------------------------------------------------------
  // Initial Load
  // -------------------------------------------------------------

  useEffect(() => {
    loadResults(filters);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------
  // Filter Change
  // -------------------------------------------------------------

  const handleFilterChange = (
    field: keyof ResultFilters,
    value: string
  ) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // -------------------------------------------------------------
  // Search
  // -------------------------------------------------------------

  const handleSearch = () => {
    loadResults(filters);
  };

  // -------------------------------------------------------------
  // Search on Enter
  // -------------------------------------------------------------

  const handleSearchKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // -------------------------------------------------------------
  // Reset
  // -------------------------------------------------------------

  const handleReset = () => {
    const cleared: ResultFilters = {
      ...classScope,
    };

    setFilters(cleared);

    loadResults(cleared);
  };

  // -------------------------------------------------------------
  // Open Drawer
  // -------------------------------------------------------------

  const openDrawer = (
    record: ResultStudentDTO,
    mode: "view" | "edit"
  ) => {
    setSelectedStudent(record);
    setDrawerMode(mode);
    setDrawerOpen(true);
  };

  // -------------------------------------------------------------
  // Close Drawer
  // -------------------------------------------------------------

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedStudent(null);
  };

  // -------------------------------------------------------------
  // After Save
  // -------------------------------------------------------------

  const handleSaved = () => {
    closeDrawer();

    // Refresh list but stay on current page
    loadResults(filters, false);
  };

  // -------------------------------------------------------------
  // Client-side Search
  // -------------------------------------------------------------

  const filteredStudents = useMemo(() => {
    const first =
      filters.firstName?.trim().toLowerCase();

    const last =
      filters.lastName?.trim().toLowerCase();

    const roll =
      filters.rollNo?.trim().toLowerCase();

    // No search values
    if (!first && !last && !roll) {
      return allStudents;
    }

    return allStudents.filter((student) => {
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
    allStudents,
    filters.firstName,
    filters.lastName,
    filters.rollNo,
  ]);

  // -------------------------------------------------------------
  // Total
  // -------------------------------------------------------------

  const total = filteredStudents.length;

  // -------------------------------------------------------------
  // Pagination
  // -------------------------------------------------------------

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

  // -------------------------------------------------------------
  // Table Columns
  // -------------------------------------------------------------

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

      render: (value) => value || "-",
    },

    {
      title: "Roll No",
      align: "center",
      width: 90,

      render: (_, record) =>
        getRollNo(record),
    },

    {
      title: "First Name",
      dataIndex: "firstName",
      align: "center",
    },

    {
      title: "Last Name",
      dataIndex: "lastName",
      align: "center",
    },

    {
      title: "Standard",
      align: "center",

      render: (_, record) =>
        getStandard(record),
    },

    {
      title: "Gender",
      dataIndex: "gender",
      align: "center",

      render: (value) => value || "-",
    },

    {
      title: "Medium",
      align: "center",

      render: (_, record) =>
        getMedium(record),
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

    // -----------------------------------------------------------
    // Actions
    // -----------------------------------------------------------

    {
      title: "Actions",
      align: "center",
      width: 100,

      render: (_, record) => (
        <Space>
          {/* View */}
          <Tooltip title="View Result">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() =>
                openDrawer(
                  record,
                  "view"
                )
              }
            />
          </Tooltip>

          {/* Edit */}
          <Tooltip title="Edit Result">
            <Button
              size="small"
              type="primary"
              icon={<EditOutlined />}
              onClick={() =>
                openDrawer(
                  record,
                  "edit"
                )
              }
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // -------------------------------------------------------------
  // UI
  // -------------------------------------------------------------

  return (
    <Card>
      {/* =========================================================
          FILTER BAR
      ========================================================= */}

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

      {/* =========================================================
          MOBILE VIEW
      ========================================================= */}

      {isMobile ? (
        <div className="space-y-3">
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
                No results found
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
                  {/* Student Header */}
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
                        }{" "}
                        | Roll No:{" "}
                        {
                          getRollNo(
                            record
                          )
                        }
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
                        {
                          record.status
                        }
                      </Tag>
                    )}
                  </div>

                  {/* Student Details */}
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
                  </div>

                  {/* Mobile Actions */}
                  <div className="flex justify-end gap-2 mt-3">
                    {/* View */}
                    <Tooltip title="View Result">
                      <Button
                        size="small"
                        icon={
                          <EyeOutlined />
                        }
                        onClick={() =>
                          openDrawer(
                            record,
                            "view"
                          )
                        }
                      />
                    </Tooltip>

                    {/* Edit */}
                    <Tooltip title="Edit Result">
                      <Button
                        size="small"
                        type="primary"
                        icon={
                          <EditOutlined />
                        }
                        onClick={() =>
                          openDrawer(
                            record,
                            "edit"
                          )
                        }
                      />
                    </Tooltip>
                  </div>
                </div>
              )
            )}

          {/* Mobile Pagination */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-gray-500">
              Total: {total}
            </span>

            <div className="flex gap-2">
              {/* Previous */}
              <Button
                size="small"
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
              </Button>

              {/* Next */}
              <Button
                size="small"
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
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* =======================================================
           DESKTOP TABLE
        ======================================================= */

        <div className="table-wrapper">
          <Table
            rowKey="studentId"
            columns={columns}
            dataSource={
              displayedStudents
            }
            loading={loading}
            bordered
            pagination={{
              current:
                pagination.current,

              pageSize:
                pagination.pageSize,

              total,

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
      )}

      {/* =========================================================
          RESULT DRAWER
      ========================================================= */}

      <ResultDrawer
        open={drawerOpen}
        mode={drawerMode}
        studentId={
          selectedStudent?.studentId ??
          null
        }
        studentInfo={{
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
        onClose={closeDrawer}
        onSaved={handleSaved}
      />
    </Card>
  );
}