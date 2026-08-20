import React, { useEffect, useState } from "react";
import {
  Card,
  Table,
  Button,
  Drawer,
  Modal,
  Input,
  Select,
  Grid,
  Checkbox,
  message,
  Typography,
  Space,
  Empty,
  Spin,
  Row,
  Col,
} from "antd";
import {
  EditOutlined,
  EyeOutlined,
  SearchOutlined,
  ReloadOutlined,
  BookOutlined,
  SaveOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

import {
  getAllTeachers,
  searchClass,
  assignTeacherSubjects,
  getSubjectsByEmployeeDetailsId,
} from "../services/teacherSubjectService";

import { getSubjectsByClassId } from "../services/subjectAssignmentService";
import { getAllStaticData, type StaticDataResponse } from "../services/staticDataService";
import { getEmployeeDetailsById } from "../services/userService";

import type {
  TeacherDTO,
  ClassSearchDTO,
} from "../services/teacherSubjectService";

const { useBreakpoint } = Grid;
const { Title, Text } = Typography;
const { Option } = Select;

interface SubjectDTO {
  subjectMasterId: number;
  subjectName: string;
  subjectCode: string;
}

interface ParsedClassSubjectGroup {
  classMasterId: string;
  standard: string;
  division: string;
  medium: string;
  subjects: SubjectDTO[];
}

interface TeacherSearchFilters {
  firstName?: string;
  lastName?: string;
  section?: string;
  medium?: string;
}

const parseClassMasterKey = (key: string) => {
  const idMatch = key.match(/classMasterId=([^,]+)/);
  const standardMatch = key.match(/standard=([^,]+)/);
  const divisionMatch = key.match(/division=([^,]+)/);
  const mediumMatch = key.match(/medium=([^)]+)/);

  return {
    classMasterId: idMatch ? idMatch[1].trim() : "-",
    standard: standardMatch ? standardMatch[1].trim() : "-",
    division: divisionMatch ? divisionMatch[1].trim() : "-",
    medium: mediumMatch ? mediumMatch[1].trim() : "-",
  };
};

const TeacherSubject: React.FC = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  // ===========================
  // Teacher List
  // ===========================

  const [teachers, setTeachers] = useState<TeacherDTO[]>([]);
  const [loading, setLoading] = useState(false);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // ===========================
  // Static Data
  // ===========================

  const [staticData, setStaticData] = useState<StaticDataResponse | null>(null);

  // ===========================
  // Search Bar (Teacher list)
  // ===========================

  const [searchFilters, setSearchFilters] = useState<TeacherSearchFilters>({
    firstName: "",
    lastName: "",
    section: "",
    medium: "",
  });

  // ===========================
  // Edit Drawer
  // ===========================

  const [drawerOpen, setDrawerOpen] = useState(false);

  const [selectedTeacher, setSelectedTeacher] = useState<TeacherDTO | null>(null);

  // ===========================
  // Search Class (inside drawer, unrelated to teacher search bar)
  // ===========================

  const [searchText, setSearchText] = useState("");

  const [classOptions, setClassOptions] = useState<ClassSearchDTO[]>([]);

  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

  // ===========================
  // Subjects (Edit Drawer)
  // ===========================

  const [subjects, setSubjects] = useState<SubjectDTO[]>([]);

  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([]);

  // ===========================
  // View Modal
  // ===========================

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewTeacher, setViewTeacher] = useState<TeacherDTO | null>(null);
  const [viewEmployeeDetailsId, setViewEmployeeDetailsId] = useState<number | null>(null);
  const [viewGroups, setViewGroups] = useState<ParsedClassSubjectGroup[]>([]);

  // Editing (unassign) state for the View modal — only relevant to subjects
  const [viewEditMode, setViewEditMode] = useState(false);
  const [viewSaving, setViewSaving] = useState(false);
  // classMasterId -> currently selected subjectMasterId[]
  const [viewSelectedSubjects, setViewSelectedSubjects] = useState<
    Record<string, number[]>
  >({});

  // ===========================
  // Load Static Data
  // ===========================

  useEffect(() => {
    const loadStaticData = async () => {
      try {
        const response: any = await getAllStaticData();
        const body = response?.data?.success !== undefined ? response.data : response;
        if (body?.success) {
          setStaticData(body.data);
        }
      } catch (err) {
        message.error("Failed to load static data");
      }
    };

    loadStaticData();
  }, []);

  // ===========================
  // Load Teachers
  // ===========================

  const loadTeachers = async (
    page = pagination.current,
    pageSize = pagination.pageSize,
    filters: TeacherSearchFilters = searchFilters
  ) => {
    try {
      setLoading(true);

      const response = await getAllTeachers(page - 1, pageSize, {
        firstName: filters.firstName || undefined,
        lastName: filters.lastName || undefined,
        section: filters.section || undefined,
        medium: filters.medium || undefined,
      });

      console.log("Teacher Response", response);

      setTeachers(response.data.data.Data || []);

      setPagination({
        current: page,
        pageSize,
        total: response.data.data.total,
      });
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  // ===========================
  // Search Handlers
  // ===========================

  const handleFilterChange = (field: keyof TeacherSearchFilters, value: string) => {
    setSearchFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    loadTeachers(1, pagination.pageSize, searchFilters);
  };

  const handleResetFilters = () => {
    const cleared: TeacherSearchFilters = {
      firstName: "",
      lastName: "",
      section: "",
      medium: "",
    };
    setSearchFilters(cleared);
    loadTeachers(1, pagination.pageSize, cleared);
  };

  // ===========================
  // Resolve employeeDetailsId
  // ===========================
  // The teacher list comes from the USER endpoint (role=Teacher), whose
  // records only carry userId — not employeeDetailsId. Assign/View both
  // need employeeDetailsId, so we resolve it here before using it.
  const resolveEmployeeDetailsId = async (
    teacher: TeacherDTO
  ): Promise<number | null> => {
    if (teacher.employeeDetailsId) return teacher.employeeDetailsId;

    if (!teacher.userId) {
      console.error("Teacher record has no userId to resolve from:", teacher);
      return null;
    }

    try {
      const response: any = await getEmployeeDetailsById(teacher.userId);
      const body = response?.data?.success !== undefined ? response.data : response;

      if (body?.success && body?.data?.employeeDetailsId) {
        return body.data.employeeDetailsId;
      }

      console.error("Could not resolve employeeDetailsId for userId:", teacher.userId, body);
      return null;
    } catch (error) {
      console.error("Failed to resolve employeeDetailsId:", error);
      return null;
    }
  };

  // ===========================
  // Edit
  // ===========================

  const handleEdit = async (teacher: TeacherDTO) => {
    const employeeDetailsId = await resolveEmployeeDetailsId(teacher);

    if (!employeeDetailsId) {
      message.error("Unable to load this teacher's employee record");
      return;
    }

    setSelectedTeacher({ ...teacher, employeeDetailsId });

    setDrawerOpen(true);

    setSearchText("");
    setSubjects([]);
    setSelectedSubjectIds([]);
    setSelectedClassId(null);
    setClassOptions([]);
  };

  // ===========================
  // View (Eye Icon)
  // ===========================

  const handleView = async (teacher: TeacherDTO) => {
    setViewTeacher(teacher);
    setViewModalOpen(true);
    setViewGroups([]);
    setViewLoading(true);
    setViewEditMode(false);
    setViewSelectedSubjects({});

    try {
      const employeeDetailsId = await resolveEmployeeDetailsId(teacher);

      if (!employeeDetailsId) {
        message.error("Unable to load this teacher's employee record");
        setViewLoading(false);
        return;
      }

      setViewEmployeeDetailsId(employeeDetailsId);

      const response = await getSubjectsByEmployeeDetailsId(employeeDetailsId);

      console.log("View Subjects RAW response:", response);
      console.log("View Subjects response.data:", response.data);

      // Some endpoints return { success, message, data }, others may
      // return the map directly at the top level — handle both shapes
      // so we don't silently render an empty state.
      const body: any = response.data;
      const data =
        body?.data && typeof body.data === "object"
          ? body.data
          : body && typeof body === "object" && !("success" in body)
          ? body
          : {};

      console.log("View Subjects parsed data object:", data);
      console.log("View Subjects keys:", Object.keys(data));

      if (!data || Object.keys(data).length === 0) {
        console.warn(
          "No class/subject data found for employeeDetailsId:",
          employeeDetailsId
        );
      }

      const groups: ParsedClassSubjectGroup[] = Object.keys(data).map(
        (key) => {
          const parsed = parseClassMasterKey(key);
          console.log("Parsed key:", key, "->", parsed);

          return {
            ...parsed,
            subjects: data[key] || [],
          };
        }
      );

      setViewGroups(groups);
    } catch (error) {
      console.error("View Subjects error:", error);
      message.error("Unable to load teacher subject details");
    } finally {
      setViewLoading(false);
    }
  };

  const closeViewModal = () => {
    setViewModalOpen(false);
    setViewTeacher(null);
    setViewEmployeeDetailsId(null);
    setViewGroups([]);
    setViewEditMode(false);
    setViewSelectedSubjects({});
  };

  // ===========================
  // View Modal — Update / Unassign Subjects
  // ===========================

  const enterViewEditMode = () => {
    // Seed the editable selection from what's currently assigned per class
    const initial: Record<string, number[]> = {};
    viewGroups.forEach((group) => {
      initial[group.classMasterId] = group.subjects.map(
        (s) => s.subjectMasterId
      );
    });
    setViewSelectedSubjects(initial);
    setViewEditMode(true);
  };

  const cancelViewEditMode = () => {
    setViewEditMode(false);
    setViewSelectedSubjects({});
  };

  const toggleViewSubject = (classMasterId: string, subjectMasterId: number) => {
    setViewSelectedSubjects((prev) => {
      const current = prev[classMasterId] || [];
      const isSelected = current.includes(subjectMasterId);
      return {
        ...prev,
        [classMasterId]: isSelected
          ? current.filter((id) => id !== subjectMasterId)
          : [...current, subjectMasterId],
      };
    });
  };

  const handleSaveViewChanges = async () => {
    if (!viewEmployeeDetailsId) {
      message.error("Missing teacher reference, please reopen and try again");
      return;
    }

    setViewSaving(true);

    try {
      // Only push an update for classes whose subject selection actually changed
      const changedGroups = viewGroups.filter((group) => {
        const original = group.subjects
          .map((s) => s.subjectMasterId)
          .slice()
          .sort();
        const updated = (viewSelectedSubjects[group.classMasterId] || [])
          .slice()
          .sort();
        return JSON.stringify(original) !== JSON.stringify(updated);
      });

      if (changedGroups.length === 0) {
        message.info("No changes to save");
        setViewEditMode(false);
        return;
      }

      for (const group of changedGroups) {
        const payload = {
          employeeDetailsId: viewEmployeeDetailsId,
          classMasterId: Number(group.classMasterId),
          subjectIds: viewSelectedSubjects[group.classMasterId] || [],
        };

        console.log("Updating subjects for class", payload);

        await assignTeacherSubjects(payload);
      }

      message.success("Subjects updated successfully");

      setViewEditMode(false);

      // Refresh the view with the latest assigned subjects
      if (viewTeacher) {
        await handleView(viewTeacher);
      }
    } catch (error) {
      console.error("Failed to update subjects:", error);
      message.error("Something went wrong while updating subjects");
    } finally {
      setViewSaving(false);
    }
  };

  // ===========================
  // Search Class (drawer)
  // ===========================

  const handleSearchClass = async (value: string) => {
    setSearchText(value);

    if (value.length < 2) {
      setClassOptions([]);
      return;
    }

    try {
      const response = await searchClass(value);

      console.log("Search Class", response);

      setClassOptions(response.data.data || []);
    } catch (error) {
      console.log(error);
    }
  };

  // ===========================
  // Select Class (drawer)
  // ===========================

  const handleSelectClass = async (item: ClassSearchDTO) => {
    setSelectedClassId(item.classMasterId);

    setSearchText(item.displayName);

    setClassOptions([]);

    try {
      const response = await getSubjectsByClassId(item.classMasterId);

      console.log("Subjects", response);

      setSubjects(response.data || []);

      setSelectedSubjectIds([]);
    } catch (error) {
      console.log(error);
    }
  };

  // ===========================
  // Checkbox
  // ===========================

  const handleSubjectChange = (checked: boolean, id: number) => {
    if (checked) {
      setSelectedSubjectIds((prev) => [...prev, id]);
    } else {
      setSelectedSubjectIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const toggleSubjectCard = (id: number) => {
    const isSelected = selectedSubjectIds.includes(id);
    handleSubjectChange(!isSelected, id);
  };

  // ===========================
  // Assign Subjects
  // ===========================

  const handleAssignSubjects = async () => {
    if (!selectedTeacher) {
      message.warning("Please select teacher");
      return;
    }

    if (!selectedClassId) {
      message.warning("Please select class");
      return;
    }

    if (selectedSubjectIds.length === 0) {
      message.warning("Please select subject");
      return;
    }

    try {
      const payload = {
        employeeDetailsId: selectedTeacher.employeeDetailsId,
        classMasterId: selectedClassId,
        subjectIds: selectedSubjectIds,
      };

      console.log(payload);

      await assignTeacherSubjects(payload);

      message.success("Subjects assigned successfully");

      setDrawerOpen(false);

      setSearchText("");
      setSubjects([]);
      setSelectedSubjectIds([]);
      setSelectedClassId(null);
      setClassOptions([]);
    } catch (error) {
      console.log(error);

      message.error("Something went wrong");
    }
  };

  // ===========================
  // Table Columns
  // ===========================

  const columns: ColumnsType<TeacherDTO> = [
    {
      title: "Sr No",
      align: "center",
      width: 80,
      render: (_, __, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
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
      title: "Designation",
      dataIndex: "designation",
      align: "center",
      render: (value) => value || "-",
    },

    {
      title: "Experience",
      dataIndex: "experience",
      align: "center",
      render: (value) => (value ? `${value} Years` : "-"),
    },

    {
      title: "Action",
      key: "action",
      align: "center",
      width: 140,

      render: (_, record) => (
        <Space size="middle">
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handleView(record)}
          />

          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          />
        </Space>
      ),
    },
  ];

  // ===========================
  // JSX
  // ===========================

  return (
    <>
      <Card >
        {/* Search Bar */}
        <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="First Name"
              value={searchFilters.firstName}
              onChange={(e) => handleFilterChange("firstName", e.target.value)}
              style={{ width: "100%" }}
              allowClear
            />
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Last Name"
              value={searchFilters.lastName}
              onChange={(e) => handleFilterChange("lastName", e.target.value)}
              style={{ width: "100%" }}
              allowClear
            />
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Section"
              value={searchFilters.section || undefined}
              onChange={(value) => handleFilterChange("section", value || "")}
              style={{ width: "100%" }}
              allowClear
            >
              {staticData?.["class name"]?.map((sec) => (
                <Option key={sec} value={sec}>
                  {sec}
                </Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Medium"
              value={searchFilters.medium || undefined}
              onChange={(value) => handleFilterChange("medium", value || "")}
              style={{ width: "100%" }}
              allowClear
            >
              {staticData?.medium?.map((m) => (
                <Option key={m} value={m}>
                  {m}
                </Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={24} md={24}>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                Search
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleResetFilters}>
                Reset
              </Button>
            </div>
          </Col>
        </Row>

        {isMobile ? (
          <>
            {teachers.map((teacher, index) => (
              <Card
                key={teacher.employeeDetailsId}
                style={{
                  marginBottom: 16,
                  borderRadius: 12,
                  boxShadow: "0 3px 12px rgba(0,0,0,0.08)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <Title level={5} style={{ margin: 0 }}>
                    Teacher {index + 1}
                  </Title>
                </div>

                <div style={{ marginBottom: 8 }}>
                  <Text strong>First Name : </Text>
                  <Text>{teacher.firstName}</Text>
                </div>

                <div style={{ marginBottom: 8 }}>
                  <Text strong>Last Name : </Text>
                  <Text>{teacher.lastName}</Text>
                </div>

                <div style={{ marginBottom: 8 }}>
                  <Text strong>Designation : </Text>
                  <Text>{teacher.designation || "-"}</Text>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <Text strong>Experience : </Text>
                  <Text>
                    {teacher.experience ? `${teacher.experience} Years` : "-"}
                  </Text>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 10,
                  }}
                >
                  <Button
                    icon={<EyeOutlined />}
                    size="small"
                    onClick={() => handleView(teacher)}
                  />

                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    size="small"
                    onClick={() => handleEdit(teacher)}
                  />
                </div>
              </Card>
            ))}
          </>
        ) : (
          <Table
            rowKey="employeeDetailsId"
            columns={columns}
            dataSource={teachers}
            loading={loading}
            bordered
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,

              onChange: (page, pageSize) => {
                loadTeachers(page, pageSize);
              },
            }}
          />
        )}
      </Card>

      {/* ===========================
              EDIT DRAWER
      ============================ */}

      <Drawer
        title={
          <Title level={4} style={{ margin: 0 }}>
            Edit Teacher Subject
          </Title>
        }
        placement="right"
        width={isMobile ? "100%" : 720}
        open={drawerOpen}
        destroyOnClose
        onClose={() => {
          setDrawerOpen(false);

          setSearchText("");
          setClassOptions([]);
          setSelectedClassId(null);
          setSubjects([]);
          setSelectedSubjectIds([]);
        }}
      >
        {/* Search Card */}

        <Card
          bordered={false}
          style={{
            marginBottom: 20,
            borderRadius: 12,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <Text strong>Search Class</Text>

          <Input
            size="large"
            placeholder="Type class name..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => handleSearchClass(e.target.value)}
            style={{
              marginTop: 10,
            }}
          />

          {classOptions.length > 0 && (
            <Card
              size="small"
              style={{
                marginTop: 10,
                maxHeight: 220,
                overflowY: "auto",
                padding: 0,
              }}
            >
              {classOptions.map((item) => (
                <div
                  key={item.classMasterId}
                  onClick={() => handleSelectClass(item)}
                  style={{
                    padding: "12px",
                    cursor: "pointer",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  {item.displayName}
                </div>
              ))}
            </Card>
          )}
        </Card>

        {/* Subject Card - Add Subjects Design */}

        {subjects.length > 0 && (
          <Card
            title="Add Subjects"
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
                gap: 16,
              }}
            >
              {subjects.map((subject) => {
                const isSelected = selectedSubjectIds.includes(
                  subject.subjectMasterId
                );

                return (
                  <div
                    key={subject.subjectMasterId}
                    onClick={() => toggleSubjectCard(subject.subjectMasterId)}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      padding: "14px 16px",
                      borderRadius: 10,
                      cursor: "pointer",
                      border: isSelected
                        ? "1px solid #1677ff"
                        : "1px solid #d9d9d9",
                      backgroundColor: isSelected ? "#e6f4ff" : "#fff",
                      transition: "all 0.2s",
                    }}
                  >
                    <Checkbox
                      checked={isSelected}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        handleSubjectChange(
                          e.target.checked,
                          subject.subjectMasterId
                        )
                      }
                    />

                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>
                        {subject.subjectName}
                      </div>

                      <div
                        style={{
                          fontSize: 12,
                          color: "#8c8c8c",
                          marginTop: 2,
                        }}
                      >
                        {subject.subjectCode}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <Button
              type="primary"
              block
              size="large"
              style={{
                marginTop: 20,
              }}
              onClick={handleAssignSubjects}
            >
              Assign
            </Button>
          </Card>
        )}
      </Drawer>

      {/* ===========================
          VIEW MODAL (Eye Icon)
      ============================ */}

      <Modal
        title={
          <Title level={4} style={{ margin: 0 }}>
            Teacher Subject Details
          </Title>
        }
        open={viewModalOpen}
        onCancel={closeViewModal}
        width={isMobile ? "100%" : 950}
        destroyOnClose
        footer={
          viewLoading || viewGroups.length === 0
            ? null
            : viewEditMode
            ? [
                <Button
                  key="cancel"
                  icon={<CloseOutlined />}
                  onClick={cancelViewEditMode}
                  disabled={viewSaving}
                >
                  Cancel
                </Button>,
                <Button
                  key="save"
                  type="primary"
                  icon={<SaveOutlined />}
                  loading={viewSaving}
                  onClick={handleSaveViewChanges}
                >
                  Save Changes
                </Button>,
              ]
            : [
                <Button
                  key="update"
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={enterViewEditMode}
                >
                  Update
                </Button>,
              ]
        }
      >
        {viewLoading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Spin tip="Loading details..." />
          </div>
        ) : viewGroups.length === 0 ? (
          <Empty description="No class or subject assigned yet" />
        ) : (
          <Space direction="vertical" style={{ width: "100%" }} size={20}>
            {viewEditMode && (
              <Text type="secondary">
                Uncheck a subject to unassign it, then click{" "}
                <Text strong>Save Changes</Text>.
              </Text>
            )}

            {viewGroups.map((group) => (
              <Card
                key={group.classMasterId}
                bordered
                style={{
                  border: "1px solid #615959",
                  borderRadius: 10,
                }}
              >
                <Title level={5} style={{ marginTop: 0, marginBottom: 16 }}>
                  Class Details
                </Title>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                    gap: 16,
                    marginBottom: 24,
                  }}
                >
                  <div>
                    <Text strong>Standard</Text>
                    <Input value={group.standard} disabled style={{ marginTop: 6, color: "#383232" }} />
                  </div>

                  <div>
                    <Text strong>Division</Text>
                    <Input value={group.division} disabled style={{ marginTop: 6, color: "#383232" }} />
                  </div>

                  <div>
                    <Text strong>Medium</Text>
                    <Input value={group.medium} disabled style={{ marginTop: 6, color: "#383232" }} />
                  </div>
                </div>

                <Title level={5} style={{ marginBottom: 16 }}>
                  Assigned Subjects
                </Title>

                {viewEditMode ? (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobile
                        ? "1fr"
                        : "repeat(2, 1fr)",
                      gap: 12,
                    }}
                  >
                    {group.subjects.map((subject) => {
                      const isSelected = (
                        viewSelectedSubjects[group.classMasterId] || []
                      ).includes(subject.subjectMasterId);

                      return (
                        <div
                          key={subject.subjectMasterId}
                          onClick={() =>
                            toggleViewSubject(
                              group.classMasterId,
                              subject.subjectMasterId
                            )
                          }
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 12,
                            padding: "10px 12px",
                            borderRadius: 8,
                            cursor: "pointer",
                            border: isSelected
                              ? "1px solid #1677ff"
                              : "1px solid #d9d9d9",
                            backgroundColor: isSelected ? "#e6f4ff" : "#fafafa",
                            transition: "all 0.2s",
                          }}
                        >
                          <Checkbox
                            checked={isSelected}
                            onClick={(e) => e.stopPropagation()}
                            onChange={() =>
                              toggleViewSubject(
                                group.classMasterId,
                                subject.subjectMasterId
                              )
                            }
                          />

                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>
                              {subject.subjectName}
                            </div>

                            <div
                              style={{
                                fontSize: 12,
                                color: "#8c8c8c",
                                marginTop: 2,
                              }}
                            >
                              {subject.subjectCode}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {group.subjects.length === 0 && (
                      <Text type="secondary">No subjects assigned</Text>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobile
                        ? "repeat(2, 1fr)"
                        : "repeat(4, 1fr)",
                      gap: 12,
                    }}
                  >
                    {group.subjects.map((subject) => (
                      <div
                        key={subject.subjectMasterId}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 8,
                          border: "1px solid #d9d9d9",
                          backgroundColor: "#fafafa",
                          textAlign: "center",
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: 14 }}>
                          {subject.subjectName}
                        </div>

                        <div
                          style={{
                            fontSize: 12,
                            color: "#383232",
                            marginTop: 2,
                          }}
                        >
                          {subject.subjectCode}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </Space>
        )}
      </Modal>
    </>
  );
};

export default TeacherSubject;