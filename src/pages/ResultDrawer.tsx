import { useEffect, useState } from "react";
import {
  Drawer,
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Space,
  Card,
  Divider,
  Spin,
  Empty,
  Popconfirm,
  Tag,
  Row,
  Col,
  Table,
  message,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  LockOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import type { FormInstance } from "antd/es/form";

import {
  getStudentById,
  saveStudentResult,
  updateStudentResult,
  deleteStudentResult,
  getLastFiveAcademicYears,
  getAllStaticData,
  extractExamTypeOptions,
  getAllSubjects,
  extractSubjectNames,
  type StudentResultDTO,
  type ExamSubjectDTO,
  type SaveStudentResultPayload,
} from "../services/Resultservice"; // 👈 adjust path to match your project

const { Option } = Select;

// Shows the academic year the user is currently logged in under (selected
// on the login screen and stored by useAuth), e.g. "2026-2027" for
// { startDate: "2026-06-15", endDate: "2027-04-30" }. Falls back to a
// calendar-based guess only if nothing was stored (shouldn't normally
// happen since login always sets this). Same logic as StudentFrom.tsx.
const getCurrentAcademicYear = (): string => {
  try {
    const stored = localStorage.getItem("academicYear");
    if (stored) {
      const { startDate, endDate } = JSON.parse(stored) as {
        startDate?: string;
        endDate?: string;
      };
      const startYear = startDate ? new Date(startDate).getFullYear() : NaN;
      const endYear = endDate ? new Date(endDate).getFullYear() : NaN;
      if (!Number.isNaN(startYear) && !Number.isNaN(endYear)) {
        return `${startYear}-${endYear}`;
      }
    }
  } catch {
    // fall through to the calendar-based guess below
  }

  const now = new Date();
  const year = now.getFullYear();
  // School years typically start mid-year (e.g. June) — before that month,
  // treat it as still part of the previous academic year.
  const ACADEMIC_YEAR_START_MONTH = 5; // June (0-indexed)
  return now.getMonth() >= ACADEMIC_YEAR_START_MONTH
    ? `${year}-${year + 1}`
    : `${year - 1}-${year}`;
};

const RESULT_STATUS_OPTIONS = ["PASS", "FAIL"];

// getAllSubjectMasterByFilter is paginated with no "get everything" option —
// request one large page so the dropdown effectively shows "all" subjects.
const SUBJECT_FETCH_SIZE = 500;

// 👇 TODO: ideally this list comes from the student's subject/standard setup
// on the backend rather than being hardcoded here.
const DEFAULT_SUBJECTS = ["Mathematics", "Science", "English"];

// ===============================
// Auto-calc helpers (Obtained Marks / Percentage / Grade / Result Status)
// ===============================
// 👇 ASSUMPTION: standard Indian school grading bands + a 35% passing mark.
// Adjust these two to match your school's actual grading policy.
const GRADE_BANDS: { min: number; grade: string }[] = [
  { min: 90, grade: "A+" },
  { min: 80, grade: "A" },
  { min: 70, grade: "B+" },
  { min: 60, grade: "B" },
  { min: 50, grade: "C" },
  { min: 35, grade: "D" },
  { min: 0, grade: "F" },
];
const PASSING_PERCENTAGE = 35;

const calculateGrade = (percentage: number): string => {
  const band = GRADE_BANDS.find((b) => percentage >= b.min);
  return band ? band.grade : "F";
};

const calculateResultStatus = (percentage: number): string =>
  percentage >= PASSING_PERCENTAGE ? "PASS" : "FAIL";

const recalcDerivedFields = (
  subjects: ({ obtainedMarks?: number } | undefined)[] | undefined,
  totalMarks?: number
) => {
  const obtainedMarks = (subjects || []).reduce(
    (sum, s) => sum + (Number(s?.obtainedMarks) || 0),
    0
  );
  const total = Number(totalMarks) || 0;
  const percentage =
    total > 0 ? Math.round((obtainedMarks / total) * 10000) / 100 : 0;
  const grade = calculateGrade(percentage);
  const resultStatus = calculateResultStatus(percentage);
  return { obtainedMarks, percentage, grade, resultStatus };
};

// ===============================
// Splits Total Marks equally across every subject in the record, e.g.
// Total = 60 with 3 subjects -> [20, 20, 20]. When it doesn't divide evenly
// (e.g. 100 / 3), the remainder is added to the first N subjects so the
// split always sums back up to exactly Total Marks (e.g. [34, 33, 33]).
// ===============================
const distributeEqually = (total: number, count: number): number[] => {
  if (!count || count <= 0) return [];
  const safeTotal = Number(total) || 0;
  const base = Math.floor(safeTotal / count);
  const remainder = safeTotal - base * count;
  return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0));
};

interface NewSubjectFormValues {
  subjectName?: string;
  maximumMarks?: number;
  obtainedMarks?: number;
  status?: string;
}

interface NewRecordFormValues {
  standard?: string;
  division?: string;
  academicYear?: string;
  examType?: string;
  startDate?: Dayjs;
  endDate?: Dayjs;
  grade?: string;
  obtainedMarks?: number;
  totalMarks?: number;
  percentage?: number;
  resultStatus?: string;
  subjects?: NewSubjectFormValues[];
}

export interface ResultDrawerProps {
  open: boolean;
  mode: "view" | "edit";
  studentId: number | null;
  // used only to prefill a brand-new record's standard/division
  studentInfo?: { standard?: string; division?: string; academicYear?: string };
  onClose: () => void;
  onSaved?: () => void;
}

// Table column header row for the subject-marks section
const SubjectTableHeader = () => (
  <Row
    gutter={[8, 0]}
    style={{
      background: "#f0f2f5",
      padding: "8px 10px",
      borderRadius: 6,
      marginBottom: 8,
      fontSize: 12,
      fontWeight: 600,
      color: "#595959",
      letterSpacing: 0.2,
    }}
  >
    <Col span={8}>Subject</Col>
    <Col span={5}>Max Marks</Col>
    <Col span={5}>Obtained</Col>
    <Col span={5}>Status</Col>
    <Col span={1} />
  </Row>
);

// ===============================
// Watches a single "new record" card's subjects + totalMarks and
// auto-fills:
//  - each subject's Maximum Marks (Total Marks split equally)
//  - Obtained Marks (sum of subject Obtained Marks)
//  - Percentage / Grade / Result Status
// All of those rendered fields are disabled so they're never typed manually.
// ===============================
function NewRecordAutoCalculator({
  form,
  name,
}: {
  form: FormInstance<{ newRecords: NewRecordFormValues[] }>;
  name: number;
}) {
  const subjectsWatch = Form.useWatch(["newRecords", name, "subjects"], form) as
    | NewSubjectFormValues[]
    | undefined;
  const totalMarksWatch = Form.useWatch(["newRecords", name, "totalMarks"], form) as
    | number
    | undefined;

  const subjectCount = subjectsWatch?.length || 0;
  // Only re-run on obtainedMarks changes and subject count changes — NOT on
  // maximumMarks changes, since we're the ones setting maximumMarks below.
  // Watching it too would create a feedback loop.
  const obtainedMarksSignal = JSON.stringify(
    (subjectsWatch || []).map((s) => s?.obtainedMarks)
  );

  useEffect(() => {
    const total = Number(totalMarksWatch) || 0;
    const currentSubjects: NewSubjectFormValues[] =
      form.getFieldValue(["newRecords", name, "subjects"]) || [];
    const maxMarksDistribution = distributeEqually(total, currentSubjects.length);
    const updatedSubjects = currentSubjects.map((s, i) => ({
      ...s,
      maximumMarks: maxMarksDistribution[i] ?? 0,
    }));
    const derived = recalcDerivedFields(updatedSubjects, total);
    const current = form.getFieldValue(["newRecords", name]) || {};
    form.setFields([
      {
        name: ["newRecords", name],
        value: { ...current, subjects: updatedSubjects, ...derived },
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalMarksWatch, subjectCount, obtainedMarksSignal]);

  return null;
}

export default function ResultDrawer({
  open,
  mode,
  studentId,
  studentInfo,
  onClose,
  onSaved,
}: ResultDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [existingRecords, setExistingRecords] = useState<StudentResultDTO[]>(
    []
  );
  const [academicYears, setAcademicYears] = useState<string[]>([]);
  const [examTypeOptions, setExamTypeOptions] = useState<string[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);
  // Student's own standard/division/academicYear, straight from getStudentById.
  // Used to prefill + lock those fields — they belong to the student, not
  // something typed per result record.
  const [studentProfile, setStudentProfile] = useState<{
    standard?: string;
    division?: string;
    academicYear?: string;
  }>({});
  const [form] = Form.useForm<{ newRecords: NewRecordFormValues[] }>();

  // Inline editing of an existing record
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<StudentResultDTO | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const isView = mode === "view";

  useEffect(() => {
    if (!open || !studentId) return;

    form.resetFields();
    setExistingRecords([]);
    setEditingIndex(null);
    setEditDraft(null);
    setStudentProfile({});
    setLoading(true);

    Promise.all([
      getStudentById(studentId),
      getLastFiveAcademicYears(),
      getAllStaticData(),
      getAllSubjects(0, SUBJECT_FETCH_SIZE),
    ])
      .then(([studentRes, years, staticData, subjectsRes]) => {
        if (studentRes.success) {
          setExistingRecords(studentRes.data?.studentResultDTOS || []);

          // Prefer standard/division/academicYear straight from
          // getStudentById; fall back to the studentInfo prop (passed from
          // the Results list) if the API doesn't return them directly.
          const data = studentRes.data;
          const academicInfo = data?.academicInformation?.[0];
          setStudentProfile({
            standard: data?.standard || academicInfo?.standard || studentInfo?.standard,
            division: data?.division || academicInfo?.division || studentInfo?.division,
            academicYear:
              data?.academicYear || academicInfo?.academicYear || studentInfo?.academicYear,
          });
        } else {
          message.error(studentRes.message || "Failed to load student result");
        }
        setAcademicYears(years);
        setExamTypeOptions(extractExamTypeOptions(staticData));
        setSubjectOptions(extractSubjectNames(subjectsRes));
      })
      .catch((error: any) => {
        message.error(
          error?.response?.data?.message || "Failed to load student result"
        );
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, studentId]);

  const handleClose = () => {
    form.resetFields();
    setExistingRecords([]);
    setEditingIndex(null);
    setEditDraft(null);
    onClose();
  };

  const defaultNewRecord = (): NewRecordFormValues => ({
    standard: studentProfile.standard,
    division: studentProfile.division,
    // New results default to the academic year the user is currently
    // logged in under (set on the login screen), not the student's own
    // profile year — that's what "give from login year" means here.
    academicYear:
      getCurrentAcademicYear() ||
      studentProfile.academicYear ||
      academicYears[0],
    subjects: DEFAULT_SUBJECTS.map((subjectName) => ({ subjectName })),
  });

  // ---------------- Add-new-records save ----------------

  const handleSave = async () => {
    if (!studentId) return;
    try {
      const values = await form.validateFields();
      const newRecords = values.newRecords || [];

      if (newRecords.length === 0) {
        message.warning("Add at least one new record before saving");
        return;
      }

      setSaving(true);

      // The API saves one record per call, so submit each newly added
      // record in sequence. If one fails, stop and let the user retry
      // rather than silently dropping records.
      for (const r of newRecords) {
        const payload: SaveStudentResultPayload = {
          studentId,
          standard: r.standard || "",
          division: r.division || "",
          examType: r.examType || "",
          academicYear: r.academicYear || "",
          startDate: r.startDate ? r.startDate.format("YYYY-MM-DD") : "",
          endDate: r.endDate ? r.endDate.format("YYYY-MM-DD") : "",
          examSubjectsDTOS: (r.subjects || []).map((s) => ({
            subjectName: s.subjectName || "",
            maximumMarks: s.maximumMarks ?? 0,
            obtainedMarks: s.obtainedMarks ?? 0,
            status: s.status || "",
          })),
          totalMarks: r.totalMarks ?? 0,
          obtainedMarks: r.obtainedMarks ?? 0,
          percentage: r.percentage ?? 0,
          grade: r.grade || "",
          resultStatus: r.resultStatus || "",
        };

        const res = await saveStudentResult(payload);
        if (!res.success) {
          message.error(res.message || "Failed to save a result record");
          setSaving(false);
          return;
        }
      }

      message.success("Result(s) saved successfully");
      onSaved?.();
      handleClose();
    } catch (err: any) {
      if (err?.errorFields) {
        setSaving(false);
        return; // antd validation error already shown inline
      }
      message.error(err?.response?.data?.message || "Failed to save result");
    } finally {
      setSaving(false);
    }
  };

  // ---------------- Existing-record inline edit ----------------

  const startEditRecord = (idx: number) => {
    const record = existingRecords[idx];
    setEditingIndex(idx);
    setEditDraft({
      ...record,
      examSubjectsDTOS: (record.examSubjectsDTOS || []).map((s) => ({ ...s })),
    });
  };

  const cancelEditRecord = () => {
    setEditingIndex(null);
    setEditDraft(null);
  };

  // Splits editDraft.totalMarks equally across editDraft.examSubjectsDTOS —
  // same rule as the "Add New Record" section above.
  const redistributeMaxMarks = (
    subjects: ExamSubjectDTO[],
    totalMarks?: number
  ): ExamSubjectDTO[] => {
    const dist = distributeEqually(Number(totalMarks) || 0, subjects.length);
    return subjects.map((s, i) => ({ ...s, maximumMarks: dist[i] ?? 0 }));
  };

  const updateDraftField = <K extends keyof StudentResultDTO>(
    field: K,
    value: StudentResultDTO[K]
  ) => {
    setEditDraft((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [field]: value };
      // Total Marks drives both the equal max-marks split AND the
      // percentage calc, so recompute both whenever it changes.
      if (field === "totalMarks") {
        const redistributed = redistributeMaxMarks(
          next.examSubjectsDTOS || [],
          value as unknown as number
        );
        const derived = recalcDerivedFields(redistributed, value as unknown as number);
        return { ...next, examSubjectsDTOS: redistributed, ...derived };
      }
      return next;
    });
  };

  const updateDraftSubject = (
    subIdx: number,
    field: keyof ExamSubjectDTO,
    value: any
  ) => {
    setEditDraft((prev) => {
      if (!prev) return prev;
      const subjects = [...(prev.examSubjectsDTOS || [])];
      subjects[subIdx] = { ...subjects[subIdx], [field]: value };
      const derived = recalcDerivedFields(subjects, prev.totalMarks);
      return { ...prev, examSubjectsDTOS: subjects, ...derived };
    });
  };

  const addDraftSubject = () => {
    setEditDraft((prev) => {
      if (!prev) return prev;
      const subjects = [
        ...(prev.examSubjectsDTOS || []),
        { subjectName: "", maximumMarks: 0, obtainedMarks: 0, status: "" },
      ];
      const redistributed = redistributeMaxMarks(subjects, prev.totalMarks);
      const derived = recalcDerivedFields(redistributed, prev.totalMarks);
      return { ...prev, examSubjectsDTOS: redistributed, ...derived };
    });
  };

  const removeDraftSubject = (subIdx: number) => {
    setEditDraft((prev) => {
      if (!prev) return prev;
      const subjects = [...(prev.examSubjectsDTOS || [])];
      subjects.splice(subIdx, 1);
      const redistributed = redistributeMaxMarks(subjects, prev.totalMarks);
      const derived = recalcDerivedFields(redistributed, prev.totalMarks);
      return { ...prev, examSubjectsDTOS: redistributed, ...derived };
    });
  };

  const saveEditedRecord = async () => {
    if (!editDraft || !studentId || editingIndex === null) return;

    if (
      !editDraft.standard ||
      !editDraft.division ||
      !editDraft.academicYear ||
      !editDraft.examType ||
      !editDraft.startDate ||
      !editDraft.endDate ||
      !editDraft.resultStatus
    ) {
      message.warning("Please fill all required fields before saving");
      return;
    }

    try {
      setSavingEdit(true);
      const payload: SaveStudentResultPayload = {
        resultId: editDraft.resultId,
        studentId,
        standard: editDraft.standard,
        division: editDraft.division,
        examType: editDraft.examType,
        academicYear: editDraft.academicYear,
        startDate: editDraft.startDate,
        endDate: editDraft.endDate,
        examSubjectsDTOS: (editDraft.examSubjectsDTOS || []).map((s) => ({
          ExamSubjectsId: s.ExamSubjectsId,
          resultId: s.resultId,
          subjectName: s.subjectName,
          maximumMarks: s.maximumMarks,
          obtainedMarks: s.obtainedMarks,
          status: s.status,
        })),
        totalMarks: editDraft.totalMarks,
        obtainedMarks: editDraft.obtainedMarks,
        percentage: editDraft.percentage,
        grade: editDraft.grade,
        resultStatus: editDraft.resultStatus,
      };

      const res = await updateStudentResult(payload);
      if (res.success) {
        message.success(res.message || "Record updated successfully");
        setExistingRecords((prev) => {
          const next = [...prev];
          next[editingIndex] = res.data;
          return next;
        });
        cancelEditRecord();
      } else {
        message.error(res.message || "Failed to update record");
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to update record");
    } finally {
      setSavingEdit(false);
    }
  };

  // ---------------- Delete an existing record ----------------

  const handleDeleteRecord = async (idx: number) => {
    const record = existingRecords[idx];
    if (!record?.resultId) return;

    try {
      setDeletingId(record.resultId);
      const res = await deleteStudentResult(record.resultId);
      if (res.success) {
        message.success(res.message || "Record deleted successfully");
        setExistingRecords((prev) => prev.filter((_, i) => i !== idx));
        if (editingIndex === idx) {
          cancelEditRecord();
        }
      } else {
        message.error(res.message || "Failed to delete record");
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to delete record");
    } finally {
      setDeletingId(null);
    }
  };

  // ---------------- Render: existing record card ----------------

  const renderExistingRecordCard = (record: StudentResultDTO, idx: number) => {
    const isEditingThis = editingIndex === idx;
    const draft = isEditingThis ? editDraft : null;

    return (
      <Card
        key={record.resultId ?? idx}
        size="small"
        style={{
          marginBottom: 16,
          background: "#ffffff",
          border: isEditingThis ? "1px solid #1677ff" : "1px solid #eef0f3",
          borderRadius: 10,
          boxShadow: isEditingThis
            ? "0 2px 10px rgba(22,119,255,0.12)"
            : "0 1px 3px rgba(16,24,40,0.04)",
        }}
        title={`Record ${idx + 1}${
          record.academicYear ? ` — ${record.academicYear}` : ""
        }`}
        extra={
          <Space>
            {!isEditingThis && record.resultStatus && (
              <Tag color={record.resultStatus === "PASS" ? "green" : "red"}>
                {record.resultStatus}
              </Tag>
            )}
            {isView && !isEditingThis && (
              <Tag icon={<LockOutlined />} color="default">
                Read only
              </Tag>
            )}
            {!isView && !isEditingThis && (
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => startEditRecord(idx)}
              />
            )}
            {!isView && isEditingThis && (
              <Space>
                <Button
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={cancelEditRecord}
                />
                <Popconfirm
                  title="Delete this record?"
                  description="This can't be undone."
                  onConfirm={() => handleDeleteRecord(idx)}
                >
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    loading={deletingId === record.resultId}
                  >
                    Delete
                  </Button>
                </Popconfirm>
                <Button
                  size="small"
                  type="primary"
                  icon={<SaveOutlined />}
                  loading={savingEdit}
                  onClick={saveEditedRecord}
                >
                  Update
                </Button>
              </Space>
            )}
          </Space>
        }
      >
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <div className="text-xs text-gray-500 mb-1">Standard</div>
            <Input
              value={isEditingThis ? draft?.standard : record.standard}
              disabled
            />
          </Col>
          <Col span={12}>
            <div className="text-xs text-gray-500 mb-1">Division</div>
            <Input
              value={isEditingThis ? draft?.division : record.division}
              disabled
            />
          </Col>
          <Col span={12}>
            <div className="text-xs text-gray-500 mb-1">Academic Year</div>
            <Input
              value={isEditingThis ? draft?.academicYear : record.academicYear}
              disabled
            />
          </Col>
          <Col span={12}>
            <div className="text-xs text-gray-500 mb-1">Exam Type</div>
            {isEditingThis ? (
              <Select
                style={{ width: "100%" }}
                value={draft?.examType}
                onChange={(v) => updateDraftField("examType", v)}
              >
                {examTypeOptions.map((opt) => (
                  <Option key={opt} value={opt}>
                    {opt}
                  </Option>
                ))}
              </Select>
            ) : (
              <Input value={record.examType} disabled />
            )}
          </Col>
          <Col span={12}>
            <div className="text-xs text-gray-500 mb-1">Start Date</div>
            {isEditingThis ? (
              <DatePicker
                style={{ width: "100%" }}
                value={draft?.startDate ? dayjs(draft.startDate) : undefined}
                onChange={(d) =>
                  updateDraftField("startDate", d ? d.format("YYYY-MM-DD") : "")
                }
              />
            ) : (
              <Input value={record.startDate} disabled />
            )}
          </Col>
          <Col span={12}>
            <div className="text-xs text-gray-500 mb-1">End Date</div>
            {isEditingThis ? (
              <DatePicker
                style={{ width: "100%" }}
                value={draft?.endDate ? dayjs(draft.endDate) : undefined}
                onChange={(d) =>
                  updateDraftField("endDate", d ? d.format("YYYY-MM-DD") : "")
                }
              />
            ) : (
              <Input value={record.endDate} disabled />
            )}
          </Col>
            <Col span={12}>
            <div className="text-xs text-gray-500 mb-1">Total Marks</div>
            {isEditingThis ? (
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                value={draft?.totalMarks}
                onChange={(v) => updateDraftField("totalMarks", v ?? 0)}
              />
            ) : (
              <Input value={record.totalMarks} disabled />
            )}
          </Col>
          <Col span={12}>
            {/* Auto-calculated: sum of subject Obtained Marks. Never manual. */}
            <div className="text-xs text-gray-500 mb-1">Obtained Marks</div>
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              value={isEditingThis ? draft?.obtainedMarks : record.obtainedMarks}
              disabled
            />
          </Col>
            <Col span={8}>
            {/* Auto-calculated: Obtained / Total x 100. Never manual. */}
            <div className="text-xs text-gray-500 mb-1">Percentage</div>
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              max={100}
              value={isEditingThis ? draft?.percentage : record.percentage}
              disabled
            />
          </Col>
       

            <Col span={8}>
            {/* Auto-calculated from Percentage. Never manual. */}
            <div className="text-xs text-gray-500 mb-1">Grade</div>
            <Input
              value={isEditingThis ? draft?.grade : record.grade}
              disabled
            />
          </Col>
           <Col span={8}>
            {/* Auto-calculated from Percentage. Never manual. */}
            <div className="text-xs text-gray-500 mb-1">Result Status</div>
            <Select
              style={{ width: "100%" }}
              value={isEditingThis ? draft?.resultStatus : record.resultStatus}
              disabled
            >
              {RESULT_STATUS_OPTIONS.map((opt) => (
                <Option key={opt} value={opt}>
                  {opt}
                </Option>
              ))}
            </Select>
          </Col>
         
          
        
        </Row>

        <Divider style={{ margin: "16px 0 12px" }} orientation="left" plain>
          Subject-wise Marks
        </Divider>

        {isEditingThis ? (
          <>
            <SubjectTableHeader />
            {(draft?.examSubjectsDTOS || []).map((s, i) => (
              <Row
                gutter={[8, 8]}
                key={s.ExamSubjectsId ?? i}
                align="middle"
                style={{ marginBottom: 8 }}
              >
                <Col span={8}>
                  <Select
                    style={{ width: "100%" }}
                    placeholder="Select subject"
                    value={s.subjectName || undefined}
                    onChange={(v) => updateDraftSubject(i, "subjectName", v)}
                  >
                    {subjectOptions.map((opt) => (
                      <Option key={opt} value={opt}>
                        {opt}
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col span={5}>
                  {/* Auto-calculated: Total Marks split equally across subjects */}
                  <InputNumber
                    style={{ width: "100%" }}
                    min={0}
                    value={s.maximumMarks}
                    // disabled
                  />
                </Col>
                <Col span={5}>
                  <InputNumber
                    style={{ width: "100%" }}
                    min={0}
                    value={s.obtainedMarks}
                    onChange={(v) => updateDraftSubject(i, "obtainedMarks", v ?? 0)}
                  />
                </Col>
                <Col span={5}>
                  <Select
                    style={{ width: "100%" }}
                    value={s.status}
                    onChange={(v) => updateDraftSubject(i, "status", v)}
                  >
                    {RESULT_STATUS_OPTIONS.map((opt) => (
                      <Option key={opt} value={opt}>
                        {opt}
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col span={1}>
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => removeDraftSubject(i)}
                  />
                </Col>
              </Row>
            ))}
            <Button
              type="dashed"
              size="small"
              icon={<PlusOutlined />}
              style={{ marginTop: 8 }}
              onClick={addDraftSubject}
            >
              Add Subject
            </Button>
          </>
        ) : (
          record.examSubjectsDTOS &&
          record.examSubjectsDTOS.length > 0 && (
            <Table
              size="small"
              bordered
              pagination={false}
              rowKey={(s) => s.ExamSubjectsId ?? s.subjectName}
              dataSource={record.examSubjectsDTOS}
              columns={[
                { title: "Subject", dataIndex: "subjectName" },
                { title: "Max Marks", dataIndex: "maximumMarks", align: "center" },
                { title: "Obtained", dataIndex: "obtainedMarks", align: "center" },
                {
                  title: "Status",
                  dataIndex: "status",
                  align: "center",
                  render: (status: string) => (
                    <Tag color={status === "PASS" ? "green" : "red"}>{status}</Tag>
                  ),
                },
              ]}
            />
          )
        )}
      </Card>
    );
  };

  return (
    <>
      {/* 👇 Overrides Ant Design's default faded/gray text on disabled
          Input / Select / DatePicker / InputNumber fields inside this
          drawer, so locked (read-only) fields stay dark and readable
          instead of looking washed out. Scoped to `.result-drawer` so it
          doesn't affect disabled fields elsewhere in the app. */}
      <style>{`
        .result-drawer .ant-input[disabled],
        .result-drawer .ant-input-disabled,
        .result-drawer textarea.ant-input-disabled {
          color: rgba(0, 0, 0, 0.88) !important;
          -webkit-text-fill-color: rgba(0, 0, 0, 0.88) !important;
        }

        .result-drawer .ant-select-disabled .ant-select-selector,
        .result-drawer .ant-select-disabled .ant-select-selection-item {
          color: rgba(0, 0, 0, 0.88) !important;
        }

        .result-drawer .ant-picker-disabled .ant-picker-input > input {
          color: rgba(0, 0, 0, 0.88) !important;
        }

        .result-drawer .ant-input-number-disabled .ant-input-number-input {
          color: rgba(0, 0, 0, 0.88) !important;
        }
      `}</style>

      <Drawer
        title={isView ? "View Result" : "Edit Result"}
        width={680}
        open={open}
        onClose={handleClose}
        destroyOnClose
        className="result-drawer"
        styles={{
          body: { background: "#fff6ed", padding: "20px 24px" },
        }}
      >
        <Spin spinning={loading}>
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ marginBottom: 16, fontWeight: 600, color: "#1f1f1f" }}>
              Existing Records
            </h4>
            {existingRecords.length === 0 && !loading ? (
              <Empty description="No results found" />
            ) : (
              existingRecords.map(renderExistingRecordCard)
            )}
          </div>

          {!isView && (
            <>
              <Divider style={{ margin: "24px 0" }} />
              <h4 style={{ marginBottom: 16, fontWeight: 600, color: "#1f1f1f" }}>
                Add New Record
              </h4>

              <Form
                form={form}
                layout="vertical"
                initialValues={{ newRecords: [] }}
              >
                <Form.List name="newRecords">
                  {(fields, { add, remove }) => (
                    <>
                      {/* top "Add" button */}
                      <Button
                        type="dashed"
                        icon={<PlusOutlined />}
                        onClick={() => add(defaultNewRecord())}
                        block
                        style={{ marginBottom: 16 }}
                      >
                        Add
                      </Button>

                      {fields.map((field) => (
                        <Card
                          key={field.key}
                          size="small"
                          style={{
                            marginBottom: 16,
                            background: "#ffffff",
                            border: "1px solid #eef0f3",
                            borderRadius: 10,
                            boxShadow: "0 1px 3px rgba(16,24,40,0.04)",
                          }}
                          extra={
                            <Popconfirm
                              title="Remove this record?"
                              onConfirm={() => remove(field.name)}
                            >
                              <Button
                                type="text"
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                              />
                            </Popconfirm>
                          }
                        >
                          {/* Watches this record's subjects + totalMarks and
                              auto-fills maximumMarks (equal split), obtainedMarks,
                              percentage, grade, resultStatus */}
                          <NewRecordAutoCalculator form={form} name={field.name} />

                          <Row gutter={[16, 0]}>
                            <Col span={12}>
                              <Form.Item
                                name={[field.name, "standard"]}
                                label="Standard"
                                rules={[{ required: true, message: "Required" }]}
                              >
                                <Input placeholder="e.g. 8th" disabled />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                name={[field.name, "division"]}
                                label="Division"
                                rules={[{ required: true, message: "Required" }]}
                              >
                                <Input placeholder="e.g. B" disabled />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                name={[field.name, "academicYear"]}
                                label="Academic Year"
                                rules={[{ required: true, message: "Required" }]}
                              >
                                <Select placeholder="Select academic year" disabled>
                                  {academicYears.map((y) => (
                                    <Option key={y} value={y}>
                                      {y}
                                    </Option>
                                  ))}
                                </Select>
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                name={[field.name, "examType"]}
                                label="Exam Type"
                                rules={[{ required: true, message: "Required" }]}
                              >
                                <Select placeholder="Select exam type">
                                  {examTypeOptions.map((opt) => (
                                    <Option key={opt} value={opt}>
                                      {opt}
                                    </Option>
                                  ))}
                                </Select>
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                name={[field.name, "startDate"]}
                                label="Start Date"
                                rules={[{ required: true, message: "Required" }]}
                              >
                                <DatePicker style={{ width: "100%" }} />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                name={[field.name, "endDate"]}
                                label="End Date"
                                rules={[{ required: true, message: "Required" }]}
                              >
                                <DatePicker style={{ width: "100%" }} />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                name={[field.name, "grade"]}
                                label="Grade"
                                rules={[{ required: true, message: "Required" }]}
                              >
                                {/* Auto-calculated from Percentage. Never manual. */}
                                <Input placeholder="e.g. A" disabled />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                name={[field.name, "resultStatus"]}
                                label="Result Status"
                                rules={[{ required: true, message: "Required" }]}
                              >
                                {/* Auto-calculated from Percentage. Never manual. */}
                                <Select placeholder="Select status" disabled>
                                  {RESULT_STATUS_OPTIONS.map((opt) => (
                                    <Option key={opt} value={opt}>
                                      {opt}
                                    </Option>
                                  ))}
                                </Select>
                              </Form.Item>
                            </Col>
                            <Col span={8}>
                              <Form.Item
                                name={[field.name, "obtainedMarks"]}
                                label="Obtained Marks"
                                rules={[{ required: true, message: "Required" }]}
                              >
                                {/* Auto-calculated: sum of subject Obtained Marks */}
                                <InputNumber style={{ width: "100%" }} min={0} disabled />
                              </Form.Item>
                            </Col>
                            <Col span={8}>
                              <Form.Item
                                name={[field.name, "totalMarks"]}
                                label="Total Marks"
                                rules={[{ required: true, message: "Required" }]}
                              >
                                <InputNumber style={{ width: "100%" }} min={0} />
                              </Form.Item>
                            </Col>
                            <Col span={8}>
                              <Form.Item
                                name={[field.name, "percentage"]}
                                label="Percentage"
                              >
                                {/* Auto-calculated: Obtained / Total x 100 */}
                                <InputNumber
                                  style={{ width: "100%" }}
                                  min={0}
                                  max={100}
                                  disabled
                                />
                              </Form.Item>
                            </Col>
                          </Row>

                          <Divider style={{ margin: "12px 0 16px" }} orientation="left" plain>
                            Subject-wise Marks
                          </Divider>

                          <Form.List name={[field.name, "subjects"]}>
                            {(subjectFields, { add: addSubject, remove: removeSubject }) => (
                              <>
                                {subjectFields.length > 0 && <SubjectTableHeader />}
                                {subjectFields.map((subjectField) => (
                                  <Row
                                    gutter={[8, 0]}
                                    key={subjectField.key}
                                    align="middle"
                                    style={{ marginBottom: 8 }}
                                  >
                                    <Col span={8}>
                                      <Form.Item
                                        name={[subjectField.name, "subjectName"]}
                                        rules={[{ required: true, message: "Required" }]}
                                        style={{ marginBottom: 0 }}
                                      >
                                        <Select placeholder="Select subject">
                                          {subjectOptions.map((opt) => (
                                            <Option key={opt} value={opt}>
                                              {opt}
                                            </Option>
                                          ))}
                                        </Select>
                                      </Form.Item>
                                    </Col>
                                    <Col span={5}>
                                      <Form.Item
                                        name={[subjectField.name, "maximumMarks"]}
                                        // rules={[{ required: true, message: "Required" }]}
                                        style={{ marginBottom: 0 }}
                                      >
                                        {/* Auto-calculated: Total Marks split equally
                                            across every subject in this record */}
                                        <InputNumber
                                          style={{ width: "100%" }}
                                          min={0}
                                          placeholder="Max"
                                        
                                        />
                                      </Form.Item>
                                    </Col>
                                    <Col span={5}>
                                      <Form.Item
                                        name={[subjectField.name, "obtainedMarks"]}
                                        rules={[{ required: true, message: "Required" }]}
                                        style={{ marginBottom: 0 }}
                                      >
                                        <InputNumber
                                          style={{ width: "100%" }}
                                          min={0}
                                          placeholder="Obtained"
                                        />
                                      </Form.Item>
                                    </Col>
                                    <Col span={5}>
                                      <Form.Item
                                        name={[subjectField.name, "status"]}
                                        rules={[{ required: true, message: "Required" }]}
                                        style={{ marginBottom: 0 }}
                                      >
                                        <Select placeholder="Status">
                                          {RESULT_STATUS_OPTIONS.map((opt) => (
                                            <Option key={opt} value={opt}>
                                              {opt}
                                            </Option>
                                          ))}
                                        </Select>
                                      </Form.Item>
                                    </Col>
                                    <Col span={1}>
                                      <Button
                                        type="text"
                                        danger
                                        size="small"
                                        icon={<DeleteOutlined />}
                                        onClick={() => removeSubject(subjectField.name)}
                                      />
                                    </Col>
                                  </Row>
                                ))}
                                <Button
                                  type="dashed"
                                  size="small"
                                  icon={<PlusOutlined />}
                                  onClick={() => addSubject({})}
                                >
                                  Add Subject
                                </Button>
                              </>
                            )}
                          </Form.List>
                        </Card>
                      ))}

                      {/* bottom "Add" button, appears once at least one record exists */}
                      {fields.length > 0 && (
                        <Button
                          type="dashed"
                          icon={<PlusOutlined />}
                          onClick={() => add(defaultNewRecord())}
                          block
                          style={{ marginBottom: 16 }}
                        >
                          Add
                        </Button>
                      )}
                    </>
                  )}
                </Form.List>
              </Form>

              <Divider style={{ margin: "24px 0" }} />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <Button onClick={handleClose}>Cancel</Button>
                <Button type="primary" loading={saving} onClick={handleSave}>
                  Save
                </Button>
              </div>
            </>
          )}
        </Spin>
      </Drawer>
    </>
  );
}