import { useCallback, useEffect, useState } from "react";
import {Button,  Card,  Col,  DatePicker,  Drawer,  Empty,  Form,  Input,InputNumber,  Pagination,  Popconfirm,  Row,  Select,  Spin,  Table,  Tabs,  Tag,  Upload,message,} from "antd";
import {DeleteOutlined,  EditOutlined,  EyeOutlined,  LockOutlined,  PlusOutlined,  ReloadOutlined,  SearchOutlined,  UploadOutlined,} from "@ant-design/icons";
import dayjs from "dayjs";

import api from "../lib/axios";
import { apiEndpoints } from "../services/apiEndpoints";

const { Option } = Select;

// ============================================================
// TYPES — mirrors the"Former Student Data" objects returned by
// getAllFormerStudentByFilter/ getFormerStudent.
// ============================================================
interface FormerStudentDTO {
  formerStudentId?: number;
  firstName: string;
  lastName: string;
  gender: string;
  DOB: string; // e.g. "15-06-2008" or ISO "2026-09-01" (backend has sent both)
  address: string;
  bloodGroup?: string | null;
  category?: string | null;
  caste?: string | null;
  religion?: string | null;
  nationality?: string | null;
  aadhaarCard?: string | null;
  phone: string;
  admissionNo?: string | null;
  studentCode?: string | null;
  status: string; // e.g. "PASSED_OUT"
  paymentStatus?: string | null; // e.g. "PAID"
  totalFeeAmount?: number | null;
  pendingFeeAmount?: number | null;
  profileImg?: string | null;
  formerStudentDocuments?: any[];
  formerStudentResultDTOS?: any[] | null;
  auditDetails?: {
    createTime?: string;
    createUser?: string;
    modifyTime?: string;
    modifyUser?: string;
  };
}

// 🆕 Shape of each entry inside formerStudentDocuments (from the
// getFormerStudent response you shared — Leaving Certificate, Marksheet,
// Bonafide, etc. all use this same document object shape).
interface FormerStudentDocumentDTO {
  formerStudentDocumentId?: number;
  formerStudentId?: number;
  documentName?: string | null;
  documentType?: string | null; // e.g. "LC" | "MARKSHEET" | "BONAFIDE"
  documentDate?: string | null;
  uploadDate?: string | null;
  academicYear?: string | null;
  standard?: string | null;
  remark?: string | null;
  documentStatus?: string | null;
  collectedBy?: string | null;
  collectedDate?: string | null;
  collectedRelation?: string | null;
  document?: string | null; // base64, not edited here
}

// 🆕 Shape of each entry inside formerStudentResultDTOS' subject list
// (backend key: formerExamSubjectsDTOS — see the Result tab below, which
// reads this shape directly as returned, purely for read-only display).
// 🆕 Shape of formerStudentLCDTO — the Leaving Certificate record. Unlike
// documents/results, a former student has at most ONE of these (not a
// list), so the LC tab below manages it as a single object, not a
// Form.List.
interface FormerStudentLCDTO {
  formerStudentLCId?: number | null;
  lcNumber?: string | null;
  lcDate?: string | null;
  admissionNumber?: string | null;
  admissionDate?: string | null;
  studentName?: string | null;
  fatherName?: string | null;
  motherName?: string | null;
  surname?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  placeOfBirth?: string | null;
  nationality?: string | null;
  motherTongue?: string | null;
  religion?: string | null;
  caste?: string | null;
  standardAtLeaving?: string | null;
  division?: string | null;
  medium?: string | null;
  academicYear?: string | null;
  dateOfLeaving?: string | null;
  reasonForLeaving?: string | null;
  result?: string | null;
  conduct?: string | null;
  remark?: string | null;
}

interface FormerExamSubjectDTO {
  examSubjectsId?: number;
  formerResultId?: number;
  subjectName: string;
  maximumMarks: number;
  obtainedMarks: number;
  status: string; // "PASS" | "FAIL"
}

interface FormerStudentFilters {
  firstName?: string;
  lastName?: string;
  gender?: string;
  status?: string;
}

const GENDER_OPTIONS = ["Male", "Female", "Other"];
const STATUS_OPTIONS = ["PASSED_OUT", "TRANSFERRED", "DROPPED_OUT"];
const PAYMENT_STATUS_OPTIONS = ["PAID", "PENDING", "PARTIALLY_PAID"];

// 🆕 Document type options — "LC" (Leaving Certificate) first since that's
// the one being worked on right now; extend this list as more document
// types come up.
const DOCUMENT_TYPE_OPTIONS = ["LC", "MARKSHEET", "BONAFIDE", "OTHER"];

// 🆕 Document status options — adjust these to match whatever exact values
// the backend expects for documentStatus (guessed here as a simple
// ready/collected/pending lifecycle).
const DOCUMENT_STATUS_OPTIONS = ["READY", "COLLECTED", "PENDING"];

// 🆕 Reads a File selected via the Upload control and resolves to its
// base64 string (matching how the "document" field is sent/received —
// see profileImg/document handling elsewhere in this app). Strips the
// "data:<mime>;base64," prefix, keeping only the raw base64 payload.
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] ?? result;
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });

// ============================================================
// RESPONSE EXTRACTOR — the list lives under the "Former Student Data"
// key, and total count under "Total Element" (same odd-key pattern as
// the other *ByFilter endpoints in this app).
// ============================================================
const extractFormerStudentListAndTotal = (
  raw: any
): { list: FormerStudentDTO[]; total: number } => {
  const body = raw?.data ?? raw ?? {};
  const data = body?.data ?? body;

  const list =
    data?.["Former Student Data"] ??
    data?.["formerStudentData"] ??
    data?.["Data"] ??
    data?.["data"];

  const total = Number(
    data?.["Total Element"] ??
      data?.["Total Elements"] ??
      data?.["total"] ??
      (Array.isArray(list) ? list.length : 0)
  );

  return {
    list: Array.isArray(list) ? list : [],
    total: total || 0,
  };
};

// Normalizes DOB for display — backend has sent both "DD-MM-YYYY" and
// ISO ("YYYY-MM-DD") shapes, so try a couple of parse formats.
const formatDob = (dob?: string | null): string => {
  if (!dob) return "-";
  const parsed = dayjs(dob, ["DD-MM-YYYY", "YYYY-MM-DD"], true);
  return parsed.isValid() ? parsed.format("DD-MM-YYYY") : dob;
};

const statusColor = (status?: string | null) => {
  switch (status) {
    case "PASSED_OUT":
      return "green";
    case "TRANSFERRED":
      return "blue";
    case "DROPPED_OUT":
      return "red";
    default:
      return "default";
  }
};

const PAGE_SIZE = 10;

export default function FormerStudents() {
  // ============================================================
  // TABLE STATE — server-side pagination, same as Students page
  // (getAllFormerStudentByFilter already returns Page Number/Page Size/
  // Total Element/Total Pages, so no need to over-fetch here).
  // ============================================================
  const [rows, setRows] = useState<FormerStudentDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0); // 0-indexed, matches backend "page" param
  const [tableLoading, setTableLoading] = useState(false);

  // Filters — typed into the search bar, only actually applied to the
  // request when "Search" is clicked (Reset clears + reloads).
  const [filters, setFilters] = useState<FormerStudentFilters>({});
  const [appliedFilters, setAppliedFilters] = useState<FormerStudentFilters>({});

  // Drawer state — Add / Edit / View (view uses the same drawer, read-only)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"add" | "edit" | "view">("add");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();

  // 🆕 Result section is READ-ONLY display data (not Form fields) — see
  // the "result" tab below. Kept in plain state so it round-trips
  // untouched into the Update payload (backend expects the full
  // formerStudentResultDTOS array back, even though nothing here is
  // editable in this UI).
  const [viewResults, setViewResults] = useState<any[]>([]);

  // 🆕 Leaving Certificate — a former student has at most ONE LC record.
  // lcAdded controls whether the field grid is shown (revealed by the "+
  // Add Leaving Certificate" button) or just the button. lcId preserves
  // formerStudentLCId across edits so updates target the same record
  // instead of creating a duplicate.
  const [lcAdded, setLcAdded] = useState(false);
  const [lcId, setLcId] = useState<number | null>(null);

  const [drawerWidth, setDrawerWidth] = useState(
    typeof window !== "undefined" && window.innerWidth < 768 ? "100%" : 520
  );

  useEffect(() => {
    const handleResize = () =>
      setDrawerWidth(window.innerWidth < 768 ? "100%" : 520);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ============================================================
  // FETCH LIST
  //   POST /jnpa-school-project/formerStudents/getAllFormerStudentByFilter?page=&size=&paginate=true
  //   payload: { firstName?, lastName?, gender?, status? }
  // Only non-empty filter fields are sent, so an unset filter never gets
  // sent as "" (which some backends here treat as an exact-match filter).
  // ============================================================
  const fetchFormerStudents = useCallback(
    async (pageToLoad: number, activeFilters: FormerStudentFilters) => {
      setTableLoading(true);
      try {
        const payload: Record<string, string> = {};
        if (activeFilters.firstName) payload.firstName = activeFilters.firstName;
        if (activeFilters.lastName) payload.lastName = activeFilters.lastName;
        if (activeFilters.gender) payload.gender = activeFilters.gender;
        if (activeFilters.status) payload.status = activeFilters.status;

        const res = await api.post(
          apiEndpoints.getAllFormerStudentByFilter(pageToLoad, PAGE_SIZE),
          payload
        );

        if (res?.data?.success === false) {
          message.error(res?.data?.message || "Failed to load former students");
          setRows([]);
          setTotal(0);
          return;
        }

        const { list, total: totalCount } = extractFormerStudentListAndTotal(res);
        setRows(list);
        setTotal(totalCount);
      } catch (error: any) {
        console.error("Former students fetch error:", error);
        message.error(
          error?.response?.data?.message || "Failed to load former students"
        );
      } finally {
        setTableLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchFormerStudents(page, appliedFilters);
  }, [fetchFormerStudents, page, appliedFilters]);

  // ============================================================
  // FILTER HANDLERS
  // ============================================================
  const handleFilterChange = (field: keyof FormerStudentFilters, value?: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    setPage(0);
    setAppliedFilters(filters);
  };

  const handleReset = () => {
    setFilters({});
    setAppliedFilters({});
    setPage(0);
  };

  // ============================================================
  // ADD
  // ============================================================
  const openAddDrawer = () => {
    setDrawerMode("add");
    setEditingId(null);
    form.resetFields();
    setViewResults([]); // 🆕 no results yet for a brand-new former student
    setLcAdded(false); // 🆕 no LC yet either
    setLcId(null);
    // 🆕 formerStudentDocuments starts empty on Add — the "+ Add Document"
    // button inside the drawer lets the user attach one (e.g. Leaving
    // Certificate) before saving.
    form.setFieldsValue({ status: "PASSED_OUT", formerStudentDocuments: [] });
    setDrawerOpen(true);
  };

  // ============================================================
  // VIEW / EDIT — both call getFormerStudent to load full details first,
  // same as the "click edit icon" flow described for this screen.
  //   GET /jnpa-school-project/formerStudents/getFormerStudent/{formerStudentId}
  // ============================================================
  const openViewOrEditDrawer = async (
    record: FormerStudentDTO,
    mode: "view" | "edit"
  ) => {
    setDrawerMode(mode);
    setEditingId(record.formerStudentId ?? null);
    setDrawerOpen(true);
    setDrawerLoading(true);

    try {
      const res = await api.get(
        apiEndpoints.getFormerStudent(record.formerStudentId as number)
      );

      if (res?.data?.success === false) {
        message.error(res?.data?.message || "Failed to load former student");
        return;
      }

      const data: FormerStudentDTO = res?.data?.data ?? record;

      const dobParsed = data.DOB
        ? dayjs(data.DOB, ["DD-MM-YYYY", "YYYY-MM-DD"], true)
        : null;

      // 🆕 Map each formerStudentDocuments entry into the form, parsing its
      // date fields into dayjs objects so the DatePicker fields below can
      // display them (mirrors how DOB is parsed just above).
      const documents = (data.formerStudentDocuments || []).map(
        (doc: FormerStudentDocumentDTO) => {
          const documentDateParsed = doc.documentDate
            ? dayjs(doc.documentDate, ["DD-MM-YYYY", "YYYY-MM-DD"], true)
            : null;
          const uploadDateParsed = doc.uploadDate
            ? dayjs(doc.uploadDate, ["DD-MM-YYYY", "YYYY-MM-DD"], true)
            : null;
          // 🆕 collectedDate parsed the same way as the other document dates.
          const collectedDateParsed = doc.collectedDate
            ? dayjs(doc.collectedDate, ["DD-MM-YYYY", "YYYY-MM-DD"], true)
            : null;

          return {
            ...doc,
            documentDate:
              documentDateParsed && documentDateParsed.isValid()
                ? documentDateParsed
                : null,
            uploadDate:
              uploadDateParsed && uploadDateParsed.isValid()
                ? uploadDateParsed
                : null,
            collectedDate:
              collectedDateParsed && collectedDateParsed.isValid()
                ? collectedDateParsed
                : null,
          };
        }
      );

      // 🆕 formerStudentResultDTOS is read-only display data — store the
      // raw array exactly as the backend returned it (no dayjs parsing
      // needed since nothing here is edited; dates are formatted only at
      // render time via formatDob). This same raw array is sent back
      // untouched inside the Update payload later (see handleFinish).
      setViewResults(data.formerStudentResultDTOS || []);

      // 🆕 Leaving Certificate — if the backend already has real values for
      // this former student (not just a blank/all-null object, as seen in
      // the "no LC yet" example response), show the fields immediately;
      // otherwise start collapsed behind the "+ Add" button.
      const lcData: FormerStudentLCDTO | undefined = (data as any).formerStudentLCDTO;
      const hasLcData =
        !!lcData &&
        Object.entries(lcData).some(
          ([key, value]) => key !== "formerStudentLCId" && value !== null && value !== undefined && value !== ""
        );

      setLcAdded(hasLcData);
      setLcId(lcData?.formerStudentLCId ?? null);

      if (hasLcData) {
        const parseLcDate = (value?: string | null) => {
          if (!value) return null;
          const parsed = dayjs(value, ["DD-MM-YYYY", "YYYY-MM-DD"], true);
          return parsed.isValid() ? parsed : null;
        };

        form.setFieldsValue({
          formerStudentLCDTO: {
            ...lcData,
            lcDate: parseLcDate(lcData?.lcDate),
            admissionDate: parseLcDate(lcData?.admissionDate),
            dateOfBirth: parseLcDate(lcData?.dateOfBirth),
            dateOfLeaving: parseLcDate(lcData?.dateOfLeaving),
          },
        });
      }


      form.setFieldsValue({
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender,
        DOB: dobParsed && dobParsed.isValid() ? dobParsed : null,
        address: data.address,
        bloodGroup: data.bloodGroup,
        category: data.category,
        caste: data.caste,
        religion: data.religion,
        nationality: data.nationality,
        aadhaarCard: data.aadhaarCard,
        phone: data.phone,
        admissionNo: data.admissionNo,
        studentCode: data.studentCode,
        status: data.status,
        paymentStatus: data.paymentStatus,
        totalFeeAmount: data.totalFeeAmount,
        pendingFeeAmount: data.pendingFeeAmount,
        formerStudentDocuments: documents, // 🆕
      });
    } catch (error: any) {
      console.error("Former student detail error:", error);
      message.error(
        error?.response?.data?.message || "Failed to load former student"
      );
    } finally {
      setDrawerLoading(false);
    }
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    form.resetFields();
    setEditingId(null);
  };

  // ============================================================
  // SAVE / UPDATE
  //   POST /jnpa-school-project/formerStudents/saveFormerStudent
  //   PUT  /jnpa-school-project/formerStudents/updateFormerStudent
  // ============================================================
  const handleFinish = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      // 🆕 formerStudentDocuments' documentDate/uploadDate are dayjs
      // objects while the form is open (so the DatePicker can show them) —
      // convert them back to plain "YYYY-MM-DD" strings before sending,
      // same as DOB just below.
      const formattedDocuments = (values.formerStudentDocuments || []).map(
        (doc: any) => ({
          ...doc,
          documentDate: doc?.documentDate ? doc.documentDate.format("YYYY-MM-DD") : null,
          uploadDate: doc?.uploadDate ? doc.uploadDate.format("YYYY-MM-DD") : null,
          // 🆕 collectedDate converted back to a plain string the same way.
          collectedDate: doc?.collectedDate ? doc.collectedDate.format("YYYY-MM-DD") : null,
        })
      );

      // 🆕 formerStudentResultDTOS is READ-ONLY in this UI (see the
      // "Result" tab) — never derived from form values. Send back exactly
      // what was loaded (viewResults), unmodified, since the backend's
      // update payload still expects the full results array even though
      // this screen doesn't let anyone edit it.
      // 🆕 formerStudentLCDTO — only included in the payload when the user
      // actually clicked "+ Add Leaving Certificate" (or it already
      // existed). Its date fields are dayjs objects while the form is
      // open, same conversion pattern as everything else here.
      const lcValues = values.formerStudentLCDTO;
      const formattedLC = lcAdded
        ? {
            ...lcValues,
            lcDate: lcValues?.lcDate ? lcValues.lcDate.format("YYYY-MM-DD") : null,
            admissionDate: lcValues?.admissionDate
              ? lcValues.admissionDate.format("YYYY-MM-DD")
              : null,
            dateOfBirth: lcValues?.dateOfBirth
              ? lcValues.dateOfBirth.format("YYYY-MM-DD")
              : null,
            dateOfLeaving: lcValues?.dateOfLeaving
              ? lcValues.dateOfLeaving.format("YYYY-MM-DD")
              : null,
            ...(lcId ? { formerStudentLCId: lcId } : {}),
          }
        : undefined;

      const payload = {
        ...values,
        DOB: values.DOB ? values.DOB.format("YYYY-MM-DD") : null,
        formerStudentDocuments: formattedDocuments, // 🆕
        formerStudentResultDTOS: viewResults, // 🆕 pass-through, unedited
        ...(formattedLC ? { formerStudentLCDTO: formattedLC } : {}), // 🆕
        ...(drawerMode === "edit" ? { formerStudentId: editingId } : {}),
      };

      try {
        if (drawerMode === "edit") {
          const res = await api.put(apiEndpoints.updateFormerStudent(), payload);
          if (res?.data?.success === false) {
            message.error(res?.data?.message || "Failed to update former student");
            return;
          }
          message.success(res?.data?.message || "Former student updated successfully");
        } else {
          const res = await api.post(apiEndpoints.saveFormerStudent(), payload);
          if (res?.data?.success === false) {
            message.error(res?.data?.message || "Failed to save former student");
            return;
          }
          message.success(res?.data?.message || "Former student saved successfully");
        }

        closeDrawer();
        fetchFormerStudents(page, appliedFilters);
      } catch (error: any) {
        console.error("Save/Update former student error:", error);
        message.error(
          error?.response?.data?.message || "Failed to save former student"
        );
      } finally {
        setSubmitting(false);
      }
    } catch {
      // Ant Design validation errors are automatically displayed.
    }
  };
 const handleDelete = async (formerStudentId?: number) => {
    if (!formerStudentId) return;
    try {
      const res = await api.delete(apiEndpoints.deleteFormerStudent(formerStudentId));
      if (res?.data?.success === false) {
        message.error(res?.data?.message || "Failed to delete former student");
        return;
      }
      message.success(res?.data?.message || "Former student deleted successfully");

      // If this was the last row on the page, step back a page.
      if (rows.length === 1 && page > 0) {
        setPage(page - 1);
      } else {
        fetchFormerStudents(page, appliedFilters);
      }
    } catch (error: any) {
      console.error("Delete former student error:", error);
      message.error(
        error?.response?.data?.message || "Failed to delete former student"
      );
    }
  };

  // ============================================================
  // TABLE COLUMNS — same field set/order as the Students screen
  // (Student Code, First Name, Last Name, Gender, DOB, Address, Blood
  // Group, Category, Status, Action), plus view/edit/delete icons.
  // ============================================================
  const columns = [
    {
      title: "Student Code",
      dataIndex: "studentCode",
      key: "studentCode",
      render: (value: string | null) => value || "-",
    },
    { title: "First Name", dataIndex: "firstName", key: "firstName" },
    { title: "Last Name", dataIndex: "lastName", key: "lastName" },
    { title: "Gender", dataIndex: "gender", key: "gender" },
    {
      title: "DOB",
      dataIndex: "DOB",
      key: "DOB",
      render: (value: string) => formatDob(value),
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
      render: (value: string) => value || "-",
    },
    {
      title: "Blood Group",
      dataIndex: "bloodGroup",
      key: "bloodGroup",
      render: (value: string | null) => value || "-",
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (value: string | null) => value || "-",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={statusColor(status)}>{status ? status.replace(/_/g, " ") : "-"}</Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      align: "center" as const,
      render: (_: any, record: FormerStudentDTO) => (
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => openViewOrEditDrawer(record, "view")}
          />
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => openViewOrEditDrawer(record, "edit")}
          />
          <Popconfirm
            title="Delete this former student?"
            description="Are you sure you want to delete this record?"
            onConfirm={() => handleDelete(record.formerStudentId)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </div>
      ),
    },
  ];

  const isViewMode = drawerMode === "view";

  return (
    <div className="p-4 md:p-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:justify-end md:items-center gap-3 mb-4">
       
        {/* <Button type="primary" icon={<PlusOutlined />} onClick={openAddDrawer}>
          Add Former Student
        </Button> */}
      </div>

      {/* SEARCH FILTER BAR — First Name / Last Name / Gender / Status */}
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={5}>
          <Input
            placeholder="First Name"
            value={filters.firstName}
            onChange={(e) => handleFilterChange("firstName", e.target.value)}
            allowClear
          />
        </Col>
        <Col xs={24} sm={12} md={5}>
          <Input
            placeholder="Last Name"
            value={filters.lastName}
            onChange={(e) => handleFilterChange("lastName", e.target.value)}
            allowClear
          />
        </Col>
        <Col xs={24} sm={12} md={5}>
          <Select
            placeholder="Gender"
            value={filters.gender}
            onChange={(v) => handleFilterChange("gender", v)}
            allowClear
            style={{ width: "100%" }}
          >
            {GENDER_OPTIONS.map((g) => (
              <Option key={g} value={g}>
                {g}
              </Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} sm={12} md={5}>
          <Select
            placeholder="Status"
            value={filters.status}
            onChange={(v) => handleFilterChange("status", v)}
            allowClear
            style={{ width: "100%" }}
          >
            {STATUS_OPTIONS.map((s) => (
              <Option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} md={4}>
          <div style={{ display: "flex", gap: 8 }}>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              Search
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset} />
          </div>
        </Col>
      </Row>

      {/* ============================================================
          🆕 RESPONSIVE TABLE — a proper bordered Table on desktop, and a
          stacked card list on mobile (same pattern used elsewhere in this
          app for narrow screens), instead of relying only on horizontal
          scroll for a wide table with many columns.
      ============================================================ */}

      {/* DESKTOP TABLE */}
      <div className="hidden md:block">
        {!tableLoading && rows.length === 0 ? (
          <Card>
            <Empty description="No former students found" />
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <Table
              rowKey={(record) => record.formerStudentId as number}
              columns={columns}
              dataSource={rows}
              loading={tableLoading}
              bordered
              pagination={false}
            />
          </div>
        )}
      </div>

      {/* MOBILE CARDS */}
      <div className="block md:hidden">
        {tableLoading ? (
          <Card>
            <div className="flex justify-center py-8">
              <Spin />
            </div>
          </Card>
        ) : rows.length === 0 ? (
          <Card>
            <Empty description="No former students found" />
          </Card>
        ) : (
          <div className="space-y-3">
            {rows.map((record) => (
              <Card key={record.formerStudentId} size="small">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-xs text-gray-400">
                      {record.studentCode || "-"}
                    </div>
                    <div className="font-semibold text-base">
                      {record.firstName} {record.lastName}
                    </div>
                  </div>
                  <Tag color={statusColor(record.status)}>
                    {record.status ? record.status.replace(/_/g, " ") : "-"}
                  </Tag>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div>
                    <span className="text-gray-500">Gender: </span>
                    {record.gender || "-"}
                  </div>
                  <div>
                    <span className="text-gray-500">DOB: </span>
                    {formatDob(record.DOB)}
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Address: </span>
                    {record.address || "-"}
                  </div>
                  <div>
                    <span className="text-gray-500">Blood Group: </span>
                    {record.bloodGroup || "-"}
                  </div>
                  <div>
                    <span className="text-gray-500">Category: </span>
                    {record.category || "-"}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    icon={<EyeOutlined />}
                    size="small"
                    onClick={() => openViewOrEditDrawer(record, "view")}
                  />
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    size="small"
                    onClick={() => openViewOrEditDrawer(record, "edit")}
                  />
                  <Popconfirm
                    title="Delete this former student?"
                    description="Are you sure you want to delete this record?"
                    onConfirm={() => handleDelete(record.formerStudentId)}
                    okText="Delete"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true }}
                  >
                    <Button danger icon={<DeleteOutlined />} size="small" />
                  </Popconfirm>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ============================================================
          🆕 TOTAL (left) + PAGINATION (right) — moved out of the Table's
          own built-in pagination footer into its own row so Total sits on
          the opposite side from the page controls, same layout as the
          reference screenshot.
      ============================================================ */}
      {!tableLoading && rows.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mt-4">
          <div className="text-sm text-slate-500">
            Total:{" "}
            <span className="font-semibold text-slate-700">{total}</span>
          </div>
          <Pagination
            current={page + 1}
            pageSize={PAGE_SIZE}
            total={total}
            onChange={(newPage) => setPage(newPage - 1)}
            showSizeChanger={false}
          />
        </div>
      )}
  {/* ADD / EDIT / VIEW DRAWER */}
      <Drawer
        title={
          isViewMode
            ? "View Former Student"
            : drawerMode === "edit"
            ? "Update Former Student"
            : "Add Former Student"
        }
        open={drawerOpen}
        onClose={closeDrawer}
        width={drawerWidth}
        destroyOnClose
        maskClosable={!submitting}
        closable={!submitting}
        footer={
          !isViewMode && (
            <div className="flex justify-end gap-2">
              <Button onClick={closeDrawer} disabled={submitting}>
                Cancel
              </Button>
              <Button type="primary" loading={submitting} onClick={handleFinish}>
                {drawerMode === "edit" ? "Update" : "Save"}
              </Button>
            </div>
          )
        }
      >
        <Spin spinning={drawerLoading} tip="Loading...">
          {/* ============================================================
              🆕 VIEW MODE — DARK TEXT
              When viewing (isViewMode), the whole Form is `disabled`,
              which makes every Input/Select/DatePicker/TextArea render
              with Ant Design's default grayed-out disabled text — hard to
              read. This override forces that text back to a normal dark
              color while still keeping every field non-editable (disabled
              behavior itself is untouched, only its text color changes),
              scoped to just this drawer via the "view-mode-dark" class so
              it never affects editable Add/Edit mode elsewhere.
          ============================================================ */}
          {isViewMode && (
            <style>{`
              .view-mode-dark .ant-input[disabled],
              .view-mode-dark .ant-input-disabled,
              .view-mode-dark textarea.ant-input[disabled],
              .view-mode-dark .ant-input-number-disabled .ant-input-number-input,
              .view-mode-dark .ant-select-disabled .ant-select-selector .ant-select-selection-item,
              .view-mode-dark .ant-select-disabled .ant-select-selector .ant-select-selection-placeholder,
              .view-mode-dark .ant-picker-disabled .ant-picker-input > input,
              .view-mode-dark .ant-upload-disabled {
                color: #1e293b !important;
                -webkit-text-fill-color: #1e293b !important;
              }
            `}</style>
          )}
          {/* 🆕 Result tab's fields are ALWAYS disabled (Add/Edit/View all),
              so this override is not tied to isViewMode — it always keeps
              that tab's text dark. */}
          <style>{`
            .always-dark-disabled .ant-input[disabled],
            .always-dark-disabled .ant-input-disabled,
            .always-dark-disabled .ant-select-disabled .ant-select-selector .ant-select-selection-item,
            .always-dark-disabled .ant-select-disabled .ant-select-selector .ant-select-selection-placeholder {
              color: #1e293b !important;
              -webkit-text-fill-color: #1e293b !important;
            }
          `}</style>
          <Form
            form={form}
            layout="vertical"
            disabled={isViewMode}
            className={isViewMode ? "view-mode-dark" : ""}
          >
            {/* ============================================================
                🆕 TABS — "Former Student" (all the original fields, exactly
                as before, untouched) and "Documents" (the new section) now
                live in their own tabs instead of one long scrolling form,
                same as the Student page's Student Details / Documents tabs.
                Both tabs belong to the SAME Form, so one Save/Update button
                still submits everything together.
            ============================================================ */}
            <Tabs
              defaultActiveKey="details"
              items={[
                {
                  key: "details",
                  label: "Former Student",
                  forceRender: true,
                  children: (
                    <>
            <Row gutter={12}>
                <Col span={12}>
                <Form.Item label="Admission No" name="admissionNo">
                  <Input placeholder="Admission number" disabled />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Student Code" name="studentCode">
                  <Input placeholder="Student code" disabled />
                </Form.Item>
              </Col>
              
            </Row>

            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  label="First Name"
                  name="firstName"
                  rules={[{ required: true, message: "First name is required" }]}
                >
                  <Input placeholder="First name" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Last Name"
                  name="lastName"
                  rules={[{ required: true, message: "Last name is required" }]}
                >
                  <Input placeholder="Last name" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Gender"
                  name="gender"
                  rules={[{ required: true, message: "Gender is required" }]}
                >
                  <Select placeholder="Select gender" allowClear>
                    {GENDER_OPTIONS.map((g) => (
                      <Option key={g} value={g}>
                        {g}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Date of Birth"
                  name="DOB"
                  rules={[{ required: true, message: "DOB is required" }]}
                >
                  <DatePicker className="w-full" format="DD-MM-YYYY" />
                </Form.Item>
              </Col>
             
            </Row>

            <Form.Item label="Address" name="address">
              <Input.TextArea placeholder="Address" rows={2} />
            </Form.Item>

            <Row gutter={12}>
              <Col span={12}>
                <Form.Item label="Phone" name="phone">
                  <Input placeholder="Phone number" maxLength={10} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Aadhaar Card" name="aadhaarCard">
                  <Input placeholder="Aadhaar number" maxLength={12} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={12}>
              <Col span={12}>
                <Form.Item label="Blood Group" name="bloodGroup">
                  <Input placeholder="e.g. O+" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Category" name="category">
                  <Input placeholder="e.g. General / OBC" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={12}>
              <Col span={12}>
                <Form.Item label="Caste" name="caste">
                  <Input placeholder="Caste" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Religion" name="religion">
                  <Input placeholder="Religion" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={12}>
              <Col span={12}>
                <Form.Item label="Nationality" name="nationality">
                  <Input placeholder="Nationality" />
                </Form.Item>
              </Col>
               
            
            </Row>

            <Row gutter={12}>
              



              <Col span={12}>
                <Form.Item
                  label="Status"
                  name="status"
                 
                >
                 <Select
             placeholder="Select status"
               disabled={drawerMode === "edit"}
                         >
                    {STATUS_OPTIONS.map((s) => (
                      <Option key={s} value={s}>
                        {s.replace(/_/g, " ")}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={12}>
              <Col span={12}>
                <Form.Item label="Payment Status" name="paymentStatus">
                  <Select placeholder="Select payment status" allowClear>
                    {PAYMENT_STATUS_OPTIONS.map((s) => (
                      <Option key={s} value={s}>
                        {s.replace(/_/g, " ")}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12} />
            </Row>

            <Row gutter={12}>
              <Col span={12}>
                <Form.Item label="Total Fee Amount" name="totalFeeAmount">
                  <InputNumber className="w-full" min={0} precision={2} prefix="₹" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Pending Fee Amount" name="pendingFeeAmount">
                  <InputNumber className="w-full" min={0} precision={2} prefix="₹" />
                </Form.Item>
              </Col>
            </Row>
                    </>
                  ),
                },
                {
                  key: "result",
                  label: "Result",
                  forceRender: true,
                  children: (
                    <div className="always-dark-disabled">
                      {/* 🆕 Result fields are always `disabled` (never
                          editable, regardless of Add/Edit/View mode) — the
                          "always-dark-disabled" class (styled once, near
                          the Documents/LC dark-text override above) keeps
                          their text dark even outside View mode, matching
                          the reference screenshot. */}
                      {/* ============================================================
                          🆕 RESULT — read-only, matches the "View Result"
                          screenshot style exactly: "Existing Records"
                          heading, each result as its own card titled
                          "Record N — {academicYear}" with a PASS/FAIL tag
                          and a "Read only" badge, all fields shown as
                          disabled boxes, followed by a real Subject-wise
                          Marks table. Nothing here is editable and there is
                          no Add/Remove — this tab only ever DISPLAYS
                          whatever formerStudentResultDTOS the backend sent
                          back for this former student. viewResults is kept
                          in plain component state (not Form fields) and is
                          sent back untouched inside the Update payload (see
                          handleFinish) so results always round-trip exactly
                          as the backend gave them.
                      ============================================================ */}
                      <div className="text-sm font-semibold text-slate-700 mb-3">
                        Existing Records
                      </div>

                      {viewResults.length === 0 ? (
                        <div className="text-xs text-slate-400">
                          No results available for this student.
                        </div>
                      ) : (
                        viewResults.map((result: any, idx: number) => {
                          // 🛠️ FIX — backend's subject list key is
                          // "formerExamSubjectsDTOS" (confirmed from the
                          // actual updateFormerStudent response), not
                          // "examSubjectsDTOS" — fall back to the old name
                          // too, just in case an older response ever uses it.
                          const subjects =
                            result.formerExamSubjectsDTOS ??
                            result.examSubjectsDTOS ??
                            [];

                          return (
                            <Card
                              key={result.formerResultId ?? result.resultId ?? idx}
                              size="small"
                              className="mb-4"
                              style={{ background: "#fff7ed", border: "1px solid #f2e2c4" }}
                            >
                              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                                <span className="font-semibold text-slate-800">
                                  Record {idx + 1} — {result.academicYear || "-"}
                                </span>
                                <div className="flex items-center gap-2">
                                  <Tag color={result.resultStatus === "PASS" ? "green" : "red"}>
                                    {result.resultStatus || "-"}
                                  </Tag>
                                  <Tag icon={<LockOutlined />} color="default">
                                    Read only
                                  </Tag>
                                </div>
                              </div>

                              <Row gutter={[12, 12]}>
                                <Col xs={24} sm={12}>
                                  <div className="text-xs font-medium text-slate-800 mb-1">Standard</div>
                                  <Input value={result.standard || "-"} disabled />
                                </Col>
                                <Col xs={24} sm={12}>
                                  <div className="text-xs font-medium text-slate-800 mb-1">Division</div>
                                  <Input value={result.division || "-"} disabled />
                                </Col>

                                <Col xs={24} sm={12}>
                                  <div className="text-xs font-medium text-slate-800 mb-1">Academic Year</div>
                                  <Input value={result.academicYear || "-"} disabled />
                                </Col>
                                <Col xs={24} sm={12}>
                                  <div className="text-xs font-medium text-slate-800 mb-1">Exam Type</div>
                                  <Input value={result.examType || "-"} disabled />
                                </Col>

                                <Col xs={24} sm={12}>
                                  <div className="text-xs font-medium text-slate-800 mb-1">Start Date</div>
                                  <Input value={formatDob(result.startDate)} disabled />
                                </Col>
                                <Col xs={24} sm={12}>
                                  <div className="text-xs font-medium text-slate-800 mb-1">End Date</div>
                                  <Input value={formatDob(result.endDate)} disabled />
                                </Col>

                                <Col xs={24} sm={12}>
                                  <div className="text-xs font-medium text-slate-800 mb-1">Total Marks</div>
                                  <Input value={result.totalMarks ?? "-"} disabled />
                                </Col>
                                <Col xs={24} sm={12}>
                                  <div className="text-xs font-medium text-slate-800 mb-1">Obtained Marks</div>
                                  <Input value={result.obtainedMarks ?? "-"} disabled />
                                </Col>

                                <Col xs={24} sm={8}>
                                  <div className="text-xs font-medium text-slate-800 mb-1">Percentage</div>
                                  <Input value={result.percentage ?? "-"} disabled />
                                </Col>
                                <Col xs={24} sm={8}>
                                  <div className="text-xs font-medium text-slate-800 mb-1">Grade</div>
                                  <Input value={result.grade || "-"} disabled />
                                </Col>
                                <Col xs={24} sm={8}>
                                  <div className="text-xs font-medium text-slate-800 mb-1">Result Status</div>
                                  <Input value={result.resultStatus || "-"} disabled />
                                </Col>
                              </Row>

                              <div className="text-xs font-semibold text-slate-600 mt-4 mb-2">
                                Subject-wise Marks
                              </div>

                              <Table
                                size="small"
                                bordered
                                pagination={false}
                                dataSource={subjects}
                                rowKey={(s: any, i: number) => s.examSubjectsId ?? i}
                                columns={[
                                  { title: "Subject", dataIndex: "subjectName", key: "subjectName" },
                                  { title: "Max Marks", dataIndex: "maximumMarks", key: "maximumMarks" },
                                  { title: "Obtained", dataIndex: "obtainedMarks", key: "obtainedMarks" },
                                  {
                                    title: "Status",
                                    dataIndex: "status",
                                    key: "status",
                                    render: (s: string) => (
                                      <Tag color={s === "PASS" ? "green" : "red"}>{s || "-"}</Tag>
                                    ),
                                  },
                                ]}
                                locale={{ emptyText: "No subjects" }}
                              />
                            </Card>
                          );
                        })
                      )}
                    </div>
                  ),
                },
                {
                  key: "documents",
                  label: "Documents",
                  forceRender: true,
                  children: (
                    <>
            {/* ============================================================
                🆕 DOCUMENTS — shows every entry from formerStudentDocuments
                (Leaving Certificate, Marksheet, Bonafide, etc. all use this
                same shape). Backed by a Form.List so each row's fields are
                real form fields — they travel with the rest of the form and
                get sent back as formerStudentDocuments in the Save/Update
                payload (see handleFinish above), no separate API needed.

                Starting point per your request: the section + "Add
                Document" button are wired up now; the first real workflow
                to build on top of this is Leaving Certificate (documentType
                "LC") — just pick that option in the Document Type dropdown
                below when adding one.
            ============================================================ */}
            <div className="mt-2 mb-2 text-sm font-semibold text-slate-700">
              Documents
            </div>

            <Form.List name="formerStudentDocuments">
              {(docFields, { add, remove }) => (
                <>
                  {docFields.length === 0 && (
                    <div className="text-xs text-slate-400 mb-3">
                      No documents added yet.
                    </div>
                  )}

                  {docFields.map((docField) => (
                    <Card
                      key={docField.key}
                      size="small"
                      className="mb-3"
                      style={{ background: "#fafafa" }}
                      extra={
                        !isViewMode && (
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => remove(docField.name)}
                          />
                        )
                      }
                    >
                      <Row gutter={12}>
                        <Col span={12}>
                          <Form.Item
                            label="Document Name"
                            name={[docField.name, "documentName"]}
                            rules={[{ required: true, message: "Required" }]}
                          >
                            <Input placeholder="e.g. Leaving Certificate" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label="Document Type"
                            name={[docField.name, "documentType"]}
                            rules={[{ required: true, message: "Required" }]}
                          >
                            <Select placeholder="Select type" allowClear>
                              {DOCUMENT_TYPE_OPTIONS.map((t) => (
                                <Option key={t} value={t}>
                                  {t}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={12}>
                        <Col span={12}>
                          <Form.Item
                            label="Document Date"
                            name={[docField.name, "documentDate"]}
                          >
                            <DatePicker className="w-full" format="DD-MM-YYYY" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label="Upload Date"
                            name={[docField.name, "uploadDate"]}
                          >
                            <DatePicker className="w-full" format="DD-MM-YYYY" />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={12}>
                        <Col span={12}>
                          <Form.Item
                            label="Academic Year"
                            name={[docField.name, "academicYear"]}
                          >
                            <Input placeholder="e.g. 2025-2026" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item label="Standard" name={[docField.name, "standard"]}>
                            <Input placeholder="e.g. 10" />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item label="Remark" name={[docField.name, "remark"]}>
                        <Input.TextArea rows={2} placeholder="Remark" />
                      </Form.Item>

                      {/* 🆕 Document Status */}
                      <Row gutter={12}>
                        <Col span={12}>
                          <Form.Item
                            label="Document Status"
                            name={[docField.name, "documentStatus"]}
                          >
                            <Select placeholder="Select status" allowClear>
                              {DOCUMENT_STATUS_OPTIONS.map((s) => (
                                <Option key={s} value={s}>
                                  {s}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label="Collected Date"
                            name={[docField.name, "collectedDate"]}
                          >
                            <DatePicker className="w-full" format="DD-MM-YYYY" />
                          </Form.Item>
                        </Col>
                      </Row>

                      {/* 🆕 Collected By / Collected Relation */}
                      <Row gutter={12}>
                        <Col span={12}>
                          <Form.Item
                            label="Collected By"
                            name={[docField.name, "collectedBy"]}
                          >
                            <Input placeholder="Name of person who collected it" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label="Collected Relation"
                            name={[docField.name, "collectedRelation"]}
                          >
                            <Input placeholder="e.g. Father, Mother, Self" />
                          </Form.Item>
                        </Col>
                      </Row>

                      {/* 🆕 Document Upload — converts the selected file to
                          base64 and stores it on this document's "document"
                          field, same key the backend already sends back
                          (currently null in every example response, but the
                          field name/shape matches). */}
                      <Form.Item
                        label="Upload Document"
                        name={[docField.name, "document"]}
                        valuePropName="fileValue"
                      >
                        <Upload
                          maxCount={1}
                          beforeUpload={() => false}
                          showUploadList={false}
                          onChange={async (info) => {
                            const file = info.fileList[0]?.originFileObj as File | undefined;
                            if (!file) return;
                            try {
                              const base64 = await fileToBase64(file);
                              const current = form.getFieldValue("formerStudentDocuments") || [];
                              current[docField.name] = {
                                ...current[docField.name],
                                document: base64,
                              };
                              form.setFieldsValue({ formerStudentDocuments: current });
                            } catch (err) {
                              console.error("Failed to read file:", err);
                              message.error("Could not read the selected file.");
                            }
                          }}
                        >
                          <Button icon={<UploadOutlined />} disabled={isViewMode}>
                            {form.getFieldValue([
                              "formerStudentDocuments",
                              docField.name,
                              "document",
                            ])
                              ? "Replace File"
                              : "Select File"}
                          </Button>
                        </Upload>
                      </Form.Item>
                    </Card>
                  ))}

                  {!isViewMode && (
                    <Button
                      type="dashed"
                      block
                      icon={<PlusOutlined />}
                      className="mb-4"
                      onClick={() => add({ documentType: undefined })}
                    >
                      Add Document
                    </Button>
                  )}
                </>
              )}
            </Form.List>
                    </>
                  ),
                },
                {
                  key: "lc",
                  label: "Leaving Certificate",
                  forceRender: true,
                  children: (
                    <>
                      {/* ============================================================
                          🆕 LC (Leaving Certificate) — a former student has
                          at most ONE of these, so unlike Documents/Result
                          this is NOT a Form.List. Before anything is added,
                          only a "+ Add Leaving Certificate" button shows.
                          Clicking it once reveals every field below (all
                          backed by real Form.Item fields under the
                          "formerStudentLCDTO" object) and the button never
                          reappears for this record — only one LC per
                          former student.
                      ============================================================ */}
                      {!lcAdded ? (
                        !isViewMode ? (
                          <Button
                            type="dashed"
                            block
                            icon={<PlusOutlined />}
                            onClick={() => setLcAdded(true)}
                          >
                            Add Leaving Certificate
                          </Button>
                        ) : (
                          <div className="text-xs text-slate-400">
                            No leaving certificate record for this student.
                          </div>
                        )
                      ) : (
                        <>
                          <Row gutter={12}>
                            <Col span={12}>
                              <Form.Item label="LC Number" name={["formerStudentLCDTO", "lcNumber"]}>
                                <Input placeholder="e.g. LC20260020" />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item label="LC Date" name={["formerStudentLCDTO", "lcDate"]}>
                                <DatePicker className="w-full" format="DD-MM-YYYY" />
                              </Form.Item>
                            </Col>
                          </Row>

                          <Row gutter={12}>
                            <Col span={12}>
                              <Form.Item
                                label="Admission Number"
                                name={["formerStudentLCDTO", "admissionNumber"]}
                              >
                                <Input placeholder="Admission number" />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                label="Admission Date"
                                name={["formerStudentLCDTO", "admissionDate"]}
                              >
                                <DatePicker className="w-full" format="DD-MM-YYYY" />
                              </Form.Item>
                            </Col>
                          </Row>

                          <Row gutter={12}>
                            <Col span={12}>
                              <Form.Item label="Student Name" name={["formerStudentLCDTO", "studentName"]}>
                                <Input placeholder="Student's first name" />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item label="Surname" name={["formerStudentLCDTO", "surname"]}>
                                <Input placeholder="Surname" />
                              </Form.Item>
                            </Col>
                          </Row>

                          <Row gutter={12}>
                            <Col span={12}>
                              <Form.Item label="Father's Name" name={["formerStudentLCDTO", "fatherName"]}>
                                <Input placeholder="Father's name" />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item label="Mother's Name" name={["formerStudentLCDTO", "motherName"]}>
                                <Input placeholder="Mother's name" />
                              </Form.Item>
                            </Col>
                          </Row>

                          <Row gutter={12}>
                            <Col span={12}>
                              <Form.Item label="Gender" name={["formerStudentLCDTO", "gender"]}>
                                <Select placeholder="Select gender" allowClear>
                                  {GENDER_OPTIONS.map((g) => (
                                    <Option key={g} value={g}>
                                      {g}
                                    </Option>
                                  ))}
                                </Select>
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item label="Date of Birth" name={["formerStudentLCDTO", "dateOfBirth"]}>
                                <DatePicker className="w-full" format="DD-MM-YYYY" />
                              </Form.Item>
                            </Col>
                          </Row>

                          <Row gutter={12}>
                            <Col span={12}>
                              <Form.Item label="Place of Birth" name={["formerStudentLCDTO", "placeOfBirth"]}>
                                <Input placeholder="Place of birth" />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item label="Nationality" name={["formerStudentLCDTO", "nationality"]}>
                                <Input placeholder="Nationality" />
                              </Form.Item>
                            </Col>
                          </Row>

                          <Row gutter={12}>
                            <Col span={12}>
                              <Form.Item label="Mother Tongue" name={["formerStudentLCDTO", "motherTongue"]}>
                                <Input placeholder="Mother tongue" />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item label="Religion" name={["formerStudentLCDTO", "religion"]}>
                                <Input placeholder="Religion" />
                              </Form.Item>
                            </Col>
                          </Row>

                          <Row gutter={12}>
                            <Col span={12}>
                              <Form.Item label="Caste" name={["formerStudentLCDTO", "caste"]}>
                                <Input placeholder="Caste" />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                label="Standard at Leaving"
                                name={["formerStudentLCDTO", "standardAtLeaving"]}
                              >
                                <Input placeholder="e.g. 1st Standard" />
                              </Form.Item>
                            </Col>
                          </Row>

                          <Row gutter={12}>
                            <Col span={12}>
                              <Form.Item label="Division" name={["formerStudentLCDTO", "division"]}>
                                <Input placeholder="e.g. A" />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item label="Medium" name={["formerStudentLCDTO", "medium"]}>
                                <Input placeholder="e.g. English" />
                              </Form.Item>
                            </Col>
                          </Row>

                          <Row gutter={12}>
                            <Col span={12}>
                              <Form.Item label="Academic Year" name={["formerStudentLCDTO", "academicYear"]}>
                                <Input placeholder="e.g. 2026-2027" />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item label="Date of Leaving" name={["formerStudentLCDTO", "dateOfLeaving"]}>
                                <DatePicker className="w-full" format="DD-MM-YYYY" />
                              </Form.Item>
                            </Col>
                          </Row>

                          <Form.Item
                            label="Reason for Leaving"
                            name={["formerStudentLCDTO", "reasonForLeaving"]}
                          >
                            <Input placeholder="e.g. Transfer" />
                          </Form.Item>

                          <Row gutter={12}>
                            <Col span={12}>
                              <Form.Item label="Result" name={["formerStudentLCDTO", "result"]}>
                                <Select placeholder="Select result" allowClear>
                                  <Option value="PASS">PASS</Option>
                                  <Option value="FAIL">FAIL</Option>
                                </Select>
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item label="Conduct" name={["formerStudentLCDTO", "conduct"]}>
                                <Input placeholder="e.g. Good" />
                              </Form.Item>
                            </Col>
                          </Row>

                          <Form.Item label="Remark" name={["formerStudentLCDTO", "remark"]}>
                            <Input.TextArea rows={2} placeholder="Remark" />
                          </Form.Item>
                        </>
                      )}
                    </>
                  ),
                },
              ]}
            />
          </Form>
        </Spin>
      </Drawer>
    </div>
  );
}