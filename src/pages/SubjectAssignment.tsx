import React, { useEffect, useState } from "react";
import {Card,Table,Typography,Button,Drawer,Input,Grid,Checkbox,message,} from "antd";
import type { ColumnsType } from "antd/es/table";
import { EditOutlined } from "@ant-design/icons";

import { getAllClassMaster } from "../services/classMasterService";
import { getSubjectsByClassId,assignOrUnassignSubjects,} from "../services/subjectAssignmentService";
import { getAllSubjects } from "../services/subjectService";

const { Title } = Typography;
const { useBreakpoint } = Grid;

interface ClassMasterDTO {
 classMasterId: number;
  standard: string;
  division: string;
  medium: string;
}

interface SubjectDTO {
  subjectMasterId: number;
  subjectCode: string;
  subjectName: string;
}

const SubjectAssignment: React.FC = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  // ================= STATES =================

  const [classList, setClassList] = useState<ClassMasterDTO[]>([]);
  const [loading, setLoading] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);

  const [selectedClass, setSelectedClass] =useState<ClassMasterDTO | null>(null);

  // Actual assigned subjects from API
  const [subjectList, setSubjectList] = useState<SubjectDTO[]>([]);

  // Display subjects (Assigned + newly checked)
  const [displaySubjects, setDisplaySubjects] = useState<SubjectDTO[]>([]);

  // All subjects
  const [allSubjects, setAllSubjects] = useState<SubjectDTO[]>([]);

  // Selected checkbox ids
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);

  // ================= PAGINATION =================

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // ================= LOAD CLASS =================

  const loadClassMaster = async (
    page = pagination.current,
    pageSize = pagination.pageSize
  ) => {
    try {
      setLoading(true);

      const response = await getAllClassMaster(
        page - 1,
        pageSize
      );

      setClassList(
        response.data.data.classMasterDTOS || []
      );

      setPagination({
        current: page,
        pageSize,
        total: response.data.data["total element"] || 0,
      });
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  // ================= LOAD ALL SUBJECTS =================

  const loadAllSubjects = async () => {
    try {
      const response = await getAllSubjects(0, 100);
      setAllSubjects(
        response.data.subjectMasterDTOS || []
      );
    } catch (error) {
      console.log(error);
    }
  };

  // ================= EDIT =================

  const handleEdit = async (
    record: ClassMasterDTO
  ) => {
    try {
      setSelectedClass(record);

      const response =
        await getSubjectsByClassId(
          record.classMasterId
        );

      const assigned = response.data || [];

      setSubjectList(assigned);

      // Show existing assigned subjects
      setDisplaySubjects(assigned);

      // Check already assigned subjects
      setSelectedSubjects(
        assigned.map(
          (item: SubjectDTO) =>
            item.subjectMasterId
        )
      );

      await loadAllSubjects();

      setDrawerOpen(true);
    } catch (error) {
      console.log(error);
    }
  };

  // ================= CHECKBOX =================

  const handleSubjectCheck = (
    subjectId: number
  ) => {
    const subject = allSubjects.find(
      (s) =>
        s.subjectMasterId === subjectId
    );

    if (!subject) return;

    if (
      selectedSubjects.includes(subjectId)
    ) {
      setSelectedSubjects((prev) =>
        prev.filter(
          (id) => id !== subjectId
        )
      );

      setDisplaySubjects((prev) =>
        prev.filter((item) => {
          if (
            item.subjectMasterId !==
            subjectId
          )
            return true;

          return subjectList.some(
            (a) =>
              a.subjectMasterId ===
              subjectId
          );
        })
      );
    } else {
      setSelectedSubjects((prev) => [
        ...prev,
        subjectId,
      ]);

      setDisplaySubjects((prev) => {
        const exists = prev.some(
          (s) =>
            s.subjectMasterId ===
            subjectId
        );

        if (exists) return prev;

        return [...prev, subject];
      });
    }
  };

  // ================= ASSIGN =================

  const handleAssign = async () => {
    if (!selectedClass) return;

    try {
      const payload = {
        classMasterId:
          selectedClass.classMasterId,
        subjectMasterIds:
          selectedSubjects,
      };

      const response =
        await assignOrUnassignSubjects(
          payload
        );

      message.success(response.message);

      const refresh =
        await getSubjectsByClassId(
          selectedClass.classMasterId
        );

      const assigned =
        refresh.data || [];

      setSubjectList(assigned);
      setDisplaySubjects(assigned);

      // Keep assigned subjects checked
      setSelectedSubjects(
        assigned.map(
          (item: SubjectDTO) =>
            item.subjectMasterId
        )
      );
      setDrawerOpen(false);
setSelectedClass(null);
    } catch (error) {
      console.log(error);
      message.error(
        "Unable to assign subjects"
      );
    }
  };

  useEffect(() => {
    loadClassMaster();
  }, []);

  // ================= MAIN TABLE =================
  // ================= MAIN TABLE =================

const columns: ColumnsType<ClassMasterDTO> = [
  {
    title: "Sr No",
    align: "center",
    render: (_, __, index) =>
      (pagination.current - 1) * pagination.pageSize +
      index +
      1,
  },
  {
    title: "Standard",
    dataIndex: "standard",
    align: "center",
  },
  {
    title: "Division",
    dataIndex: "division",
    align: "center",
  },
  {
    title: "Medium",
    dataIndex: "medium",
    align: "center",
  },
  {
    title: "Action",
    align: "center",
    render: (_, record) => (
      <Button
        type="primary"
        size="small"
        icon={<EditOutlined />}
        onClick={() => handleEdit(record)}
      />
    ),
  },
];

// ================= SUBJECT TABLE =================

const subjectColumns: ColumnsType<SubjectDTO> = [
  {
    title: "Sr No",
    width: 80,
    align: "center",
    render: (_, __, index) => index + 1,
  },
  {
    title: "Subject Code",
    dataIndex: "subjectCode",
    align: "center",
  },
  {
    title: "Subject Name",
    dataIndex: "subjectName",
    align: "center",
  },
];

return (
  <Card title={<Title level={4}>Subject Assignment</Title>}>

    {isMobile ? (
      <div>
        {classList.map((item, index) => (
          <Card
            key={item.classMasterId}
            style={{
              marginBottom: 18,
              borderRadius: 12,
              boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
              border: "1px solid #f0f0f0",
            }}
            bodyStyle={{
              padding: 18,
            }}
          >
            <div
              style={{
                borderBottom: "1px solid #f0f0f0",
                paddingBottom: 12,
                marginBottom: 15,
              }}
            >
              <Title level={5} style={{ margin: 0 }}>
                Class{" "}
                {(pagination.current - 1) *
                  pagination.pageSize +
                  index +
                  1}
              </Title>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <span style={{ color: "#8c8c8c" }}>
                Standard
              </span>
              <strong>{item.standard}</strong>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <span style={{ color: "#8c8c8c" }}>
                Division
              </span>
              <strong>{item.division}</strong>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <span style={{ color: "#8c8c8c" }}>
                Medium
              </span>
              <strong>{item.medium}</strong>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <Button
                type="primary"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(item)}
              />
            </div>
          </Card>
        ))}

        <Table
          style={{ display: "none" }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            onChange: (page, pageSize) =>
              loadClassMaster(page, pageSize),
          }}
        />
      </div>
    ) : (
      <Table
        rowKey="classMasterId"
        loading={loading}
        columns={columns}
        dataSource={classList}
        bordered
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          onChange: (page, pageSize) =>
            loadClassMaster(page, pageSize),
        }}
      />
    )}

    <Drawer
      title={
        <Title level={4} style={{ margin: 0 }}>
          Edit Subject Assignment
        </Title>
      }
      placement="right"
      width={700}
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
    >
      <Card
        title="Class Details"
        style={{ marginBottom: 20 }}
      >
        <div
          style={{
            display: "flex",
            gap: 20,
          }}
        >
          <div style={{ flex: 1 }}>
            <p>
              <b>Standard</b>
            </p>

            <Input
              value={selectedClass?.standard}
              readOnly
            />
          </div>

          <div style={{ flex: 1 }}>
            <p>
              <b>Division</b>
            </p>

            <Input
              value={selectedClass?.division}
              readOnly
            />
          </div>

          <div style={{ flex: 1 }}>
            <p>
              <b>Medium</b>
            </p>

            <Input
              value={selectedClass?.medium}
              readOnly
            />
          </div>
        </div>
      </Card>
            {/* ================= ASSIGNED SUBJECTS ================= */}

      <Card title="Assigned Subjects" bordered>
        <Table
          rowKey="subjectMasterId"
          columns={subjectColumns}
          dataSource={displaySubjects}
          pagination={false}
          bordered
        />
      </Card>

      {/* ================= ADD SUBJECTS ================= */}

      <Card title="Add Subjects" style={{ marginTop: 20 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2,1fr)",
            gap: 12,
          }}
        >
          {allSubjects.map((subject) => (
            <div
              key={subject.subjectMasterId}
              onClick={() =>
                handleSubjectCheck(subject.subjectMasterId)
              }
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px 15px",
                borderRadius: 10,
                cursor: "pointer",
                border: selectedSubjects.includes(
                  subject.subjectMasterId
                )
                  ? "1px solid #1677ff"
                  : "1px solid #f0f0f0",
                backgroundColor: selectedSubjects.includes(
                  subject.subjectMasterId
                )
                  ? "#e6f4ff"
                  : "#fff",
                boxShadow:
                  "0 2px 8px rgba(0,0,0,0.06)",
                transition: "0.3s",
              }}
            >
              <Checkbox
                checked={selectedSubjects.includes(
                  subject.subjectMasterId
                )}
                onChange={() =>
                  handleSubjectCheck(
                    subject.subjectMasterId
                  )
                }
              />

              <div style={{ marginLeft: 12 }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 15,
                  }}
                >
                  {subject.subjectName}
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: "#8c8c8c",
                    marginTop: 3,
                  }}
                >
                  {subject.subjectCode}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ================= FOOTER ================= */}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: 20,
        }}
      >
        <Button
          type="primary"
          onClick={handleAssign}
          disabled={selectedSubjects.length === 0}
        >
          Assign
        </Button>
      </div>
    </Drawer>
  </Card>
);

};

export default SubjectAssignment;