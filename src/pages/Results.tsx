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

  // 🛠️ FIXED — this used to read `user?.division`, but the comment right
  // next to it already said the real userDTO field is `section`, not
  // `division`. That meant `user?.division` was always undefined, so a
  // teacher's class scope silently lost its division on every load —
  // which can make the whole filtered query return the wrong rows (or
  // none at all), independent of anything in the search bar.
  // ⚠️ CONFIRM: if your `user` object from useAuth() uses a different
  // field name than `section`, swap it in below.
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

  // 🛠️ Search bar — updates the relevant filter field as the user types.
  // Class scope fields (standard/division/medium) are never touched here,
  // so a teacher's locked class scope always stays intact alongside
  // whatever they search by.
  const handleFilterChange = (field: keyof ResultFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  // Search button — re-queries page 1 using whatever is currently typed
  // into the First Name / Last Name / Roll No boxes (plus the pinned
  // class scope for a teacher).
  const handleSearch = () => {
    loadResults(1, pagination.pageSize, filters);
  };

  // Pressing Enter in any of the search inputs searches too, so the user
  // isn't forced to reach for the button.
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

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

  // ---------------------------------------------------------------
  // 🛠️ FIX — client-side fallback filter for First Name / Last Name /
  // Roll No.
  //
  // The backend's getAllCurrentYearStudentsData endpoint may only
  // filter on standard/division/medium and silently ignore
  // firstName/lastName/rollNo in the request body — which is exactly
  // why the search boxes looked "wired up" but never changed the
  // results. This filters whatever the API already returned for the
  // current page, so search visibly works regardless of what the
  // backend actually honors server-side.
  //
  // ⚠️ This only filters the CURRENT PAGE of results, not the whole
  // dataset (e.g. searching for a student who's on page 2 while
  // viewing page 1 won't find them). Once the backend is confirmed to
  // filter on these fields itself, this can be removed and `students`
  // used directly again — it will already have been the right rows
  // for every page.
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
               type="primary"
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

      {isMobile ? (
        <div className="space-y-3">
          {loading && (
            <div className="text-center text-sm text-gray-400 py-6">Loading...</div>
          )}
          {!loading && displayedStudents.length === 0 && (
            <div className="text-center text-sm text-gray-400 py-6">No results found</div>
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
          dataSource={displayedStudents}
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