import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Checkbox,
  Col,
  Grid,
  Input,
  Popconfirm,
  Row,
  Select,
  Table,
  Tag,
  message,
} from "antd";
import { ArrowUpOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

import api from "../lib/axios";
import { apiEndpoints } from "../services/apiEndpoints";
import { getAllStaticData } from "../services/staticDataService";
import { getAllStudents } from "../services/studentService";
import type { ResultStudentDTO } from "../services/Resultservice";
import { useAuth } from "../hooks/useAuth";

/* ---------------------------------------------------------------
   Add this in apiEndpoints.ts:
     savePromoteStudents: () => `/jnpa-school-project/student/savePromoteStudents`,
---------------------------------------------------------------- */

const { useBreakpoint } = Grid;

// Fetch the full list once; pagination is done in the browser
// (same approach as the Achievements screen)
const MAX_FETCH_SIZE = 10000;

// ---------------------------------------------------------------
// Helpers (same as Achievements)
// ---------------------------------------------------------------
const getStandard = (r: ResultStudentDTO) =>
  r.academicInformation?.[0]?.standard || "-";
const getDivision = (r: ResultStudentDTO) =>
  r.academicInformation?.[0]?.division || "-";
const getRollNo = (r: ResultStudentDTO) =>
  r.academicInformation?.[0]?.rollNo || "-";
const getMedium = (r: ResultStudentDTO) =>
  r.academicInformation?.[0]?.medium || "-";
const getAcademicYear = (r: ResultStudentDTO) =>
  r.academicInformation?.[0]?.academicYear || "-";

// static data may come as plain strings or as objects -> always give the Select a string
const toOption = (item: any): { label: string; value: string } => {
  const v =
    typeof item === "string"
      ? item
      : String(item?.name ?? item?.value ?? item?.label ?? item);
  return { label: v, value: v };
};

// Login year as "2026-2027" (saved by useAuth in localStorage as { startDate, endDate })
const getLoginAcademicYear = (): string => {
  try {
    const raw = localStorage.getItem("academicYear");
    if (!raw) return "";
    const ay = JSON.parse(raw) as { startDate?: string; endDate?: string };
    if (!ay?.startDate || !ay?.endDate) return "";
    const s = new Date(ay.startDate).getFullYear();
    const e = new Date(ay.endDate).getFullYear();
    if (Number.isNaN(s) || Number.isNaN(e)) return "";
    return `${s}-${e}`;
  } catch {
    return "";
  }
};

// Login year -> NEXT year.  "2026-2027"  ->  "2027-2028"
// (login year is saved by useAuth in localStorage as { startDate, endDate })
const getNextAcademicYear = (): string => {
  try {
    const raw = localStorage.getItem("academicYear");
    if (raw) {
      const ay = JSON.parse(raw) as { startDate?: string; endDate?: string };
      if (ay?.startDate && ay?.endDate) {
        const s = new Date(ay.startDate).getFullYear();
        const e = new Date(ay.endDate).getFullYear();
        if (!Number.isNaN(s) && !Number.isNaN(e)) return `${s + 1}-${e + 1}`;
      }
    }
  } catch {
    /* ignore and use the fallback below */
  }
  // fallback: academic year starts in April
  const now = new Date();
  const start = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${start + 1}-${start + 2}`;
};

export default function PromoteStudents() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  // ---------- students ----------
  const [students, setStudents] = useState<ResultStudentDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  // ---------- the 2 cards: PROMOTE TO ----------
  const [targetStandard, setTargetStandard] = useState<string | undefined>();
  const targetAcademicYear = useMemo(() => getNextAcademicYear(), []);
  const [standardOptions, setStandardOptions] = useState<
    { label: string; value: string }[]
  >([]);

  // ---------- checkbox selection (studentIds) ----------
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [promoting, setPromoting] = useState(false);

  // Standard dropdown from the static data API
  useEffect(() => {
    getAllStaticData()
      .then((res) => {
        if (res?.success) {
          setStandardOptions((res.data.standard || []).map(toOption));
        }
      })
      .catch((e) => console.error("Failed to load standard", e));
  }, []);

  // ---------- load students ----------
  // Same API as the Student Attendance screen: POST student/getAllStudentsByFilter
  // payload: { academicYear, standard, division, medium }
  //   academicYear = login year, standard / division / medium = logged-in user's class
  //   (a value that is empty / null is NOT sent, so admin with no class still gets everything)
  const { user } = useAuth();

  const loadStudents = useCallback(() => {
    setLoading(true);

  
    const loginYear = getLoginAcademicYear();
    const payload: Record<string, string> = {};
    if (loginYear) payload.academicYear = loginYear;
    if (user?.standard) payload.standard = user.standard;
    if (user?.division) payload.division = user.division;
    if (user?.medium) payload.medium = user.medium;

    getAllStudents(0, MAX_FETCH_SIZE, payload as any)
      .then((res: any) => {
        if (res?.success) {
          const list = res.data?.Data || res.data?.data || res.data || [];
          setStudents(Array.isArray(list) ? (list as unknown as ResultStudentDTO[]) : []);
        } else {
          message.error(res?.message || "Failed to load students");
          setStudents([]);
        }
      })
      .catch((err: any) => {
        message.error(err?.response?.data?.message || "Failed to load students");
        setStudents([]);
      })
      .finally(() => setLoading(false));
  }, [user?.standard, user?.division, user?.medium]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // ---------- total + current page ----------
  const total = students.length;

  const displayedStudents = useMemo(() => {
    const start = (pagination.current - 1) * pagination.pageSize;
    return students.slice(start, start + pagination.pageSize);
  }, [students, pagination]);

  // ---------- selection helpers ----------
  // A student is "promoted" when he already has an academic information row
  // for the next academic year (e.g. 2027-2028)
  const isPromoted = (r: ResultStudentDTO) =>
    !!r.academicInformation?.some((a) => a.academicYear === targetAcademicYear);

  // promoted students are shown ticked + locked, so they are NOT part of the selection
  const isSelected = (id: number) => selectedIds.includes(id);

  const toggleOne = (id: number, checked: boolean) =>
    setSelectedIds((prev) =>
      checked ? (prev.includes(id) ? prev : [...prev, id]) : prev.filter((x) => x !== id),
    );

  // "Select All" = every NOT-yet-promoted student in the list (all pages)
  const allStudentIds = useMemo(
    () => students.filter((s) => !isPromoted(s)).map((s) => s.studentId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [students, targetAcademicYear],
  );

  const selectAll = () =>
    setSelectedIds((prev) => Array.from(new Set([...prev, ...allStudentIds])));
  const clearAll = () => setSelectedIds([]);

  // ---------- PROMOTE ----------
  // POST /student/savePromoteStudents
  // Body = array of the selected students (full objects, as they came from the list API)
  // where each student's "academicInformation" gets ONE NEW ROW for the next academic year:
  //   academicYear = next year (2027-2028), standard = the Standard chosen in the card,
  //   division / medium / admissionNo / admissionDate = copied from the current row,
  //   rollNo = null, no academicInformationId, auditDetails = null
  const buildPromotePayload = (student: ResultStudentDTO) => {
    const current: any = student.academicInformation?.[0] || {};
    return {
      ...student,
      academicInformation: [
        ...(student.academicInformation || []),
        {
          academicYear: targetAcademicYear,
          admissionDate: current.admissionDate ?? null,
          admissionNo: current.admissionNo ?? null,
          auditDetails: null,
          division: current.division ?? null,
          medium: current.medium ?? null,
          rollNo: null,
          standard: targetStandard,
          studentId: student.studentId,
        },
      ],
    };
  };

  const handlePromote = async () => {
    if (!targetStandard) {
      message.warning("Please select the Standard to promote to");
      return;
    }
    if (selectedIds.length === 0) {
      message.warning("Please select at least one student");
      return;
    }

    const selected = students.filter((s) => selectedIds.includes(s.studentId));

    // students that already have a row for the next academic year are skipped (no duplicate rows)
    const alreadyPromoted = selected.filter((s) =>
      s.academicInformation?.some((a) => a.academicYear === targetAcademicYear),
    );
    const toPromote = selected.filter((s) => !alreadyPromoted.includes(s));

    if (toPromote.length === 0) {
      message.warning(`Selected students are already promoted to ${targetAcademicYear}`);
      return;
    }

    setPromoting(true);
    try {
      const payload = toPromote.map(buildPromotePayload);
      const res = await api.post(apiEndpoints.savePromoteStudents(), payload);

      // backend can send "success": false with HTTP 200 -> check before showing success
      if (res.data?.success === false) {
        message.error(res.data?.message || "Failed to promote students");
        return;
      }

      message.success(res.data?.message || `${toPromote.length} student(s) promoted successfully`);
      if (alreadyPromoted.length > 0) {
        message.info(`${alreadyPromoted.length} student(s) skipped (already promoted)`);
      }
      setSelectedIds([]);
      loadStudents();
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to promote students");
    } finally {
      setPromoting(false);
    }
  };

  // ---------- the 2 top cards ----------
  const cardLabel = (text: string) => (
    <div style={{ color: "#8c8c8c", fontSize: 13, marginBottom: 6 }}>{text}</div>
  );

  const renderTopCards = () => (
    <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
      <Col xs={24} md={12}>
        <Card size="small">
          {cardLabel("Standard (promote to)")}
          <Select
            placeholder="Select Standard"
            value={targetStandard}
            onChange={setTargetStandard}
            options={standardOptions}
            style={{ width: "100%" }}
            allowClear
          />
        </Card>
      </Col>
      <Col xs={24} md={12}>
        <Card size="small">
          {cardLabel("Academic Year (next year)")}
          <Input value={targetAcademicYear} disabled />
        </Card>
      </Col>
    </Row>
  );

  // ---------- select all bar + Promote button ----------
  const renderSelectionBar = () => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
        marginBottom: 12,
      }}
    >
      <span style={{ fontSize: 13 }}>
        Total Students: {total} &nbsp;|&nbsp; Selected: {selectedIds.length}
      </span>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Button size="small" onClick={selectAll} disabled={allStudentIds.length === 0}>
          Select All
        </Button>
        <Button size="small" onClick={clearAll} disabled={selectedIds.length === 0}>
          Clear
        </Button>
        <Popconfirm
          title="Promote selected students?"
          description={`${selectedIds.length} student(s) will move to ${targetStandard || "-"} (${targetAcademicYear}).`}
          okText="Yes, promote"
          cancelText="No"
          onConfirm={handlePromote}
          disabled={selectedIds.length === 0 || !targetStandard}
        >
          <Button
            type="primary"
            size="small"
            icon={<ArrowUpOutlined />}
            loading={promoting}
            onClick={() => {
              // Popconfirm is disabled until everything is selected, so show the reason here
              if (!targetStandard) message.warning("Please select the Standard to promote to");
              else if (selectedIds.length === 0) message.warning("Please select at least one student");
            }}
          >
            Promote Selected
          </Button>
        </Popconfirm>
      </div>
    </div>
  );

  // ---------- table columns: same as Achievements, Action = checkbox ----------
  const columns: ColumnsType<ResultStudentDTO> = [
    {
      title: "Sr No",
      align: "center",
      width: 70,
      render: (_, __, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    { title: "Student Code", dataIndex: "studentCode", align: "center", render: (v) => v || "-" },
    { title: "First Name", dataIndex: "firstName", align: "center", render: (v) => v || "-" },
    { title: "Last Name", dataIndex: "lastName", align: "center", render: (v) => v || "-" },
    { title: "Roll No", align: "center", render: (_, r) => getRollNo(r) },
    { title: "Standard", align: "center", render: (_, r) => getStandard(r) },
    { title: "Division", align: "center", render: (_, r) => getDivision(r) },
    { title: "Gender", dataIndex: "gender", align: "center", render: (v) => v || "-" },
    { title: "Medium", align: "center", render: (_, r) => getMedium(r) },
    { title: "Academic Year", align: "center", render: (_, r) => getAcademicYear(r) },
    {
      title: "Status",
      dataIndex: "status",
      align: "center",
      render: (status: string) =>
        status ? <Tag color={status === "ACTIVE" ? "green" : "red"}>{status}</Tag> : "-",
    },
    {
      title: "Promoted",
      align: "center",
      render: (_, r) => (isPromoted(r) ? <Tag color="blue">Promoted</Tag> : "-"),
    },
    {
      title: "Action",
      align: "center",
      width: 110,
      render: (_, record) => (
        <Checkbox
          checked={isPromoted(record) || isSelected(record.studentId)}
          disabled={isPromoted(record)}
          onChange={(e) => toggleOne(record.studentId, e.target.checked)}
        />
      ),
    },
  ];

  // ---------- mobile: cards ----------
  const cardRow = (label: string, value?: string | null) => (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "4px 0" }}>
      <span style={{ color: "#8c8c8c", fontSize: 13 }}>{label}</span>
      <span style={{ fontSize: 13, textAlign: "right" }}>{value || "-"}</span>
    </div>
  );

  const renderMobileCards = () => (
    <>
      {loading && <div style={{ textAlign: "center", padding: 24, color: "#8c8c8c" }}>Loading...</div>}
      {!loading && displayedStudents.length === 0 && (
        <div style={{ textAlign: "center", padding: 24, color: "#8c8c8c" }}>No students found</div>
      )}
      {!loading &&
        displayedStudents.map((r) => (
          <Card
            key={r.studentId}
            size="small"
            style={{ marginBottom: 12 }}
            title={
              <span style={{ fontWeight: 600 }}>
                {r.firstName} {r.lastName}
              </span>
            }
            extra={
              <Checkbox
                checked={isPromoted(r) || isSelected(r.studentId)}
                disabled={isPromoted(r)}
                onChange={(e) => toggleOne(r.studentId, e.target.checked)}
              />
            }
          >
            {cardRow("Student Code", r.studentCode)}
            {cardRow("Roll No", String(getRollNo(r)))}
            {cardRow("Standard - Division", `${getStandard(r)} - ${getDivision(r)}`)}
            {cardRow("Gender", r.gender)}
            {cardRow("Medium", getMedium(r))}
            {cardRow("Academic Year", getAcademicYear(r))}
            {cardRow("Status", r.status)}
            {cardRow("Promoted", isPromoted(r) ? "Promoted" : "-")}
          </Card>
        ))}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8 }}>
        <span style={{ fontSize: 12, color: "#8c8c8c" }}>Total: {total}</span>
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            size="small"
            disabled={pagination.current <= 1}
            onClick={() => setPagination((p) => ({ ...p, current: p.current - 1 }))}
          >
            Prev
          </Button>
          <Button
            size="small"
            disabled={pagination.current * pagination.pageSize >= total}
            onClick={() => setPagination((p) => ({ ...p, current: p.current + 1 }))}
          >
            Next
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <Card title="Promote Students">
      {renderTopCards()}
      {renderSelectionBar()}

      {isMobile ? (
        renderMobileCards()
      ) : (
        <div style={{ width: "100%", overflowX: "auto" }}>
          <Table<ResultStudentDTO>
            rowKey="studentId"
            columns={columns}
            dataSource={displayedStudents}
            loading={loading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total,
              showSizeChanger: true,
              onChange: (current, pageSize) => setPagination({ current, pageSize }),
            }}
          />
        </div>
      )}
    </Card>
  );
}