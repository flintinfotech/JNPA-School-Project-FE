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
import { EyeOutlined, EditOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

import {
  getAllCurrentYearStudentsData,
  type ResultStudentDTO,
  type ResultFilters,
} from "../services/Resultservice"; // 👈 adjust path to match where you place resultService.ts
import { useAuth } from "../hooks/useAuth"; // 👈 adjust path to match your project
import ResultDrawer from "./ResultDrawer"; // 👈 adjust path to wherever you place ResultDrawer.tsx

const { useBreakpoint } = Grid;

// 👇 TODO: confirm this matches the exact role string your backend sends
const TEACHER_ROLE = "TEACHER";

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

export default function Results() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const { user } = useAuth();

  // A teacher's Results screen is locked to their own class.
  // Admins (or anyone without a role match) fall through to unscoped filters.
  const isTeacher = user?.role === TEACHER_ROLE;
  const classScope: Pick<ResultFilters, "standard" | "division" | "medium"> = isTeacher
    ? {
        standard: user?.standard || "",
        division: user?.division || "", // 👈 userDTO field is "section"; payload key must be "division"
        medium: user?.medium || "",
      }
    : {};

  const [students, setStudents] = useState<ResultStudentDTO[]>([]);
  const [loading, setLoading] = useState(false);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const [filters, setFilters] = useState<ResultFilters>({
    ...classScope,
  });

  // --- Drawer state (View / Edit) ---
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"view" | "edit">("view");
  const [selectedStudent, setSelectedStudent] = useState<ResultStudentDTO | null>(
    null
  );

  const loadResults = useCallback(
    async (
      page = pagination.current,
      pageSize = pagination.pageSize,
      appliedFilters = filters
    ) => {
      setLoading(true);
      try {
        const response = await getAllCurrentYearStudentsData(
          page - 1,
          pageSize,
          appliedFilters
        );

        if (response.success) {
          setStudents(response.data?.data || []);
          setPagination({
            current: page,
            pageSize,
            total: response.data?.totalElements || 0,
          });
        } else {
          message.error(response.message || "Failed to load results");
        }
      } catch (error: any) {
        message.error(error?.response?.data?.message || "Failed to load results");
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    loadResults(1, pagination.pageSize, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReset = () => {
    // Class scope (standard/division/medium) stays pinned for a teacher so
    // Reset can't be used to escape their assigned class.
    const cleared: ResultFilters = { ...classScope };
    setFilters(cleared);
    loadResults(1, pagination.pageSize, cleared);
  };

  const openDrawer = (record: ResultStudentDTO, mode: "view" | "edit") => {
    setSelectedStudent(record);
    setDrawerMode(mode);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedStudent(null);
  };

  const handleSaved = () => {
    closeDrawer();
    loadResults(pagination.current, pagination.pageSize, filters);
  };

  const columns: ColumnsType<ResultStudentDTO> = [
    {
      title: "Sr No",
      align: "center",
      width: 70,
      render: (_, __, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: "Student Code",
      dataIndex: "studentCode",
      align: "center",
      render: (value) => value || "-",
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
      title: "Roll No",
      align: "center",
      render: (_, record) => getRollNo(record),
    },
    {
      title: "Standard",
      align: "center",
      render: (_, record) => getStandard(record),
    },
    // {
    //   title: "Division",
    //   align: "center",
    //   render: (_, record) => getDivision(record),
    // },
    {
      title: "Gender",
      dataIndex: "gender",
      align: "center",
      render: (value) => value || "-",
    },
    {
      title: "Medium",
      align: "center",
      render: (_, record) => getMedium(record),
    },
    {
      title: "Status",
      dataIndex: "status",
      align: "center",
      render: (status: string) =>
        status ? (
          <Tag color={status === "ACTIVE" ? "green" : "red"}>{status}</Tag>
        ) : (
          "-"
        ),
    },
    {
      title: "Actions",
      align: "center",
      width: 100,
      render: (_, record) => (
        <Space>
          <Tooltip title="View Result">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => openDrawer(record, "view")}
            />
          </Tooltip>
          <Tooltip title="Edit Result">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => openDrawer(record, "edit")}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      {/* Filter Bar */}
      {/* <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={6}>
          <Input
            placeholder="Roll No"
            value={filters.rollNo}
            onChange={(e) => handleFilterChange("rollNo", e.target.value)}
            style={{ width: "100%" }}
            allowClear
          />
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Input
            placeholder="First Name"
            value={filters.firstName}
            onChange={(e) => handleFilterChange("firstName", e.target.value)}
            style={{ width: "100%" }}
            allowClear
          />
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Input
            placeholder="Last Name"
            value={filters.lastName}
            onChange={(e) => handleFilterChange("lastName", e.target.value)}
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
      </Row> */}

      {isMobile ? (
        <div className="space-y-3">
          {loading && (
            <div className="text-center text-sm text-gray-400 py-6">Loading...</div>
          )}
          {!loading && students.length === 0 && (
            <div className="text-center text-sm text-gray-400 py-6">No results found</div>
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
                      {record.firstName} {record.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      Code: {record.studentCode || "-"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {getStandard(record)} - {getDivision(record)} | Roll No:{" "}
                      {getRollNo(record)}
                    </p>
                  </div>
                  {record.status && (
                    <Tag color={record.status === "ACTIVE" ? "green" : "red"}>
                      {record.status}
                    </Tag>
                  )}
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Gender: {record.gender || "-"}</p>
                  <p>Medium: {getMedium(record)}</p>
                </div>

                <div className="flex justify-end gap-2 mt-3">
                  <Button
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => openDrawer(record, "view")}
                  >
                    View
                  </Button>
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => openDrawer(record, "edit")}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            ))}

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-gray-500">Total: {pagination.total}</span>
            <div className="flex gap-2">
              <Button
                size="small"
                disabled={pagination.current <= 1}
                onClick={() =>
                  loadResults(pagination.current - 1, pagination.pageSize, filters)
                }
              >
                Prev
              </Button>
              <Button
                size="small"
                disabled={pagination.current * pagination.pageSize >= pagination.total}
                onClick={() =>
                  loadResults(pagination.current + 1, pagination.pageSize, filters)
                }
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Table
          rowKey="studentId"
          columns={columns}
          dataSource={students}
          loading={loading}
          bordered
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            onChange: (page, pageSize) => {
              loadResults(page, pageSize, filters);
            },
          }}
        />
      )}

      <ResultDrawer
        open={drawerOpen}
        mode={drawerMode}
        studentId={selectedStudent?.studentId ?? null}
        studentInfo={{
          standard: selectedStudent ? getStandard(selectedStudent) : undefined,
          division: selectedStudent ? getDivision(selectedStudent) : undefined,
          academicYear: selectedStudent ? getAcademicYear(selectedStudent) : undefined,
        }}
        onClose={closeDrawer}
        onSaved={handleSaved}
      />
    </Card>
  );
}