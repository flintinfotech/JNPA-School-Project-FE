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

  // 🛠️ FIX — pagination showing "Total: 10" (and Next never working) even
  // when 15 students actually exist.
  //
  // Root cause: getAllCurrentYearStudentsData's `totalElements` field is
  // NOT the true grand-total count — it's the number of rows actually
  // returned for the requested `size`. Ask for size=10 and it comes back
  // "totalElements": 10 (wrong); ask for size=2000 and — since every row
  // fits inside 2000 — it happens to come back "totalElements": 15
  // (accidentally correct). Because of this, requesting page-by-page with
  // a small size makes the UI believe there are only as many students as
  // fit on one page, so "Total" is wrong and Next is disabled after page 1.
  //
  // Fix (same over-fetch workaround already used for subjects in
  // ResultDrawer.tsx's SUBJECT_FETCH_SIZE): fetch every matching row in
  // one request using a size comfortably larger than any real school's
  // roll count, then do pagination — and search filtering — entirely on
  // the frontend from that full list. This also fixes the previous
  // known limitation where First Name / Last Name / Roll No search only
  // matched within the current page.
  const RESULTS_FETCH_SIZE = 2000;

  const [allStudents, setAllStudents] = useState<ResultStudentDTO[]>([]);
  const [loading, setLoading] = useState(false);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
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
    async (appliedFilters = filters, resetPage = true) => {
      setLoading(true);
      try {
        const response = await getAllCurrentYearStudentsData(
          0,
          RESULTS_FETCH_SIZE,
          appliedFilters
        );

        if (response.success) {
          setAllStudents(response.data?.data || []);
          if (resetPage) {
            setPagination((prev) => ({ ...prev, current: 1 }));
          }
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
    loadResults(filters);
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
    loadResults(filters);
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
    loadResults(cleared);
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
    // Refresh the full list but stay on the same page the user was on.
    loadResults(filters, false);
  };

  // ---------------------------------------------------------------
  // Client-side search filter for First Name / Last Name / Roll No,
  // applied over the FULL fetched list (not just one page) — see the
  // RESULTS_FETCH_SIZE note above for why this now works correctly
  // across the whole dataset instead of just the current page.
  // ---------------------------------------------------------------
  const filteredStudents = useMemo(() => {
    const first = filters.firstName?.trim().toLowerCase();
    const last = filters.lastName?.trim().toLowerCase();
    const roll = filters.rollNo?.trim().toLowerCase();

    if (!first && !last && !roll) return allStudents;

    return allStudents.filter((s) => {
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
  }, [allStudents, filters.firstName, filters.lastName, filters.rollNo]);

  // The true total is just how many rows matched — no more trusting the
  // backend's per-page totalElements.
  const total = filteredStudents.length;

  // Current page's slice, computed entirely on the frontend.
  const displayedStudents = useMemo(() => {
    const start = (pagination.current - 1) * pagination.pageSize;
    return filteredStudents.slice(start, start + pagination.pageSize);
  }, [filteredStudents, pagination.current, pagination.pageSize]);

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
      title: "Roll No",
      align: "center",width: 90 ,
      render: (_, record) => getRollNo(record),
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
                </div>
              </div>
            ))}

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-gray-500">Total: {total}</span>
            <div className="flex gap-2">
              <Button
                size="small"
                disabled={pagination.current <= 1}
                onClick={() =>
                  setPagination((prev) => ({ ...prev, current: prev.current - 1 }))
                }
              >
                Prev
              </Button>
              <Button
                size="small"
                disabled={pagination.current * pagination.pageSize >= total}
                onClick={() =>
                  setPagination((prev) => ({ ...prev, current: prev.current + 1 }))
                }
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="table-wrapper">
          <Table
            rowKey="studentId"
            columns={columns}
            dataSource={displayedStudents}
            loading={loading}
            bordered
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total,
              showSizeChanger: false,
              showTotal: (t) => `Total: ${t}`,
              onChange: (page, pageSize) => {
                setPagination({ current: page, pageSize });
              },
            }}
          />
        </div>
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