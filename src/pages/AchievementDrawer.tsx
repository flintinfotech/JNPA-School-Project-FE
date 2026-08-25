import { useEffect, useState } from "react";

import {
    Drawer,
    Button,
    Form,
    Input,
    DatePicker,
    Card,
    Divider,
    Spin,
    Empty,
    message,
    Row,
    Col,
    Space,
} from "antd";

import {
    PlusOutlined,
    EditOutlined,
    SaveOutlined,
    CloseOutlined,
    DeleteOutlined,
} from "@ant-design/icons";

import dayjs, { Dayjs } from "dayjs";

import {
    getStudentById,
   
} from "../services/Resultservice";

import {
    saveStudentAchievement,
    updateStudentAchievement,
    deleteStudentAchievement,
    type SaveStudentAchievementPayload,
    type UpdateStudentAchievementPayload,
} from "../services/StudentAchievementService";
// =========================================================
// TYPES
// =========================================================

interface StudentAchievementDTO {
    academicYear?: string;

    achievementDescription?: string;

    achievementName?: string;

    studentAchievementId?: number;

    studentId?: number;
}

interface AchievementDrawerProps {
    open: boolean;

    studentId: number | null;

    onClose: () => void;

    onSaved?: () => void;
}

interface NewAchievementFormValues {
    achievementName?: string;

    achievementDescription?: string;

    academicYear?: Dayjs;
}

// =========================================================
// COMPONENT
// =========================================================

export default function AchievementDrawer({
    open,
    studentId,
    onClose,
    onSaved,
}: AchievementDrawerProps) {
    // -------------------------------------------------------
    // Loading
    // -------------------------------------------------------

    const [loading, setLoading] =
        useState(false);

    const [saving, setSaving] =
        useState(false);

    // -------------------------------------------------------
    // Existing achievements
    // -------------------------------------------------------

    const [
        existingAchievements,
        setExistingAchievements,
    ] = useState<StudentAchievementDTO[]>(
        []
    );

    // -------------------------------------------------------
    // Edit state
    // -------------------------------------------------------

    const [editingIndex, setEditingIndex] =
        useState<number | null>(null);

    const [editDraft, setEditDraft] =
        useState<StudentAchievementDTO | null>(
            null
        );

    const [savingEdit, setSavingEdit] =
        useState(false);

    // -------------------------------------------------------
    // New achievement form
    // -------------------------------------------------------

    const [form] =
        Form.useForm<{
            newRecords: NewAchievementFormValues[];
        }>();

    // =======================================================
    // LOAD STUDENT DATA
    // =======================================================

    useEffect(() => {
        if (!open || !studentId) {
            return;
        }

        setLoading(true);

        setExistingAchievements([]);

        setEditingIndex(null);

        setEditDraft(null);

        form.resetFields();

        // -----------------------------------------------------
        // Call getStudentById + getAllStaticData
        // -----------------------------------------------------

        Promise.all([
            getStudentById(studentId),

           
        ])
            .then(
                ([
                    studentResponse,
                    
                ]) => {
                    // -------------------------------------------------
                    // STUDENT API
                    // -------------------------------------------------

                    if (studentResponse.success) {
                        const studentData =
                            studentResponse.data;

                        /*
                         * IMPORTANT:
                         *
                         * Your actual response contains:
                         *
                         * studentAchievementsDTOS
                         *
                         * So we use exactly that.
                         */

                        const achievements =
                            studentData
                                ?.studentAchievementsDTOS ||
                            [];

                        setExistingAchievements(
                            achievements
                        );
                    } else {
                        message.error(
                            studentResponse.message ||
                            "Failed to load student data"
                        );
                    }

                    // -------------------------------------------------
                    // STATIC DATA
                    // -------------------------------------------------

                  
                }
            )
            .catch((error: any) => {
                message.error(
                    error?.message ||
                    "Failed to load achievement data"
                );
            })
            .finally(() => {
                setLoading(false);
            });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, studentId]);

    // =======================================================
    // CLOSE DRAWER
    // =======================================================

    const handleClose = () => {
        form.resetFields();

        setExistingAchievements([]);

        setEditingIndex(null);

        setEditDraft(null);

        onClose();
    };

    // =======================================================
    // ADD NEW ACHIEVEMENT
    // =======================================================

    const addNewAchievement = (
        add: (
            defaultValue?: NewAchievementFormValues
        ) => void
    ) => {
        add({
            achievementName: "",

            achievementDescription: "",

            academicYear: dayjs(),
        });
    };

    // =======================================================
    // SAVE NEW ACHIEVEMENT
    // =======================================================

    const handleSaveNewAchievements =
        async () => {
            if (!studentId) {
                message.error(
                    "Student not selected"
                );

                return;
            }

            try {
                const values =
                    await form.validateFields();

                const records =
                    values.newRecords || [];

                if (records.length === 0) {
                    message.warning(
                        "Please add an achievement first"
                    );

                    return;
                }

                setSaving(true);

                // -------------------------------------------------
                // Save every new achievement
                // -------------------------------------------------

                for (const record of records) {
                    const payload: SaveStudentAchievementPayload =
                    {
                        studentId,

                        achievementName:
                            record.achievementName?.trim() ||
                            "",

                        achievementDescription:
                            record.achievementDescription?.trim() ||
                            "",

                        academicYear:
                            record.academicYear
                                ? record.academicYear.format(
                                    "YYYY-MM-DD"
                                )
                                : "",
                    };

                    const response =
                        await saveStudentAchievement(
                            payload
                        );

                    if (!response.success) {
                        message.error(
                            response.message ||
                            "Failed to save achievement"
                        );

                        return;
                    }
                }

                message.success(
                    "Achievement saved successfully"
                );

                form.resetFields();

                onSaved?.();

                // -------------------------------------------------
                // Reload existing records
                // -------------------------------------------------

                if (studentId) {
                    const response =
                        await getStudentById(
                            studentId
                        );

                    if (response.success) {
                        setExistingAchievements(
                            response.data
                                ?.studentAchievementsDTOS ||
                            []
                        );
                    }
                }
            } catch (error: any) {
                if (error?.errorFields) {
                    return;
                }

                message.error(
                    error?.message ||
                    "Failed to save achievement"
                );
            } finally {
                setSaving(false);
            }
        };
    // =======================================================
    // DELETE EXISTING ACHIEVEMENT
    // =======================================================

    const handleDeleteAchievement = async () => {
        if (!editDraft) {
            message.error(
                "Achievement not selected"
            );

            return;
        }

        if (!editDraft.studentAchievementId) {
            message.error(
                "Achievement ID not found"
            );

            return;
        }

        try {
            setSavingEdit(true);

            // ---------------------------------------------------
            // DELETE API
            // ---------------------------------------------------

            const response =
                await deleteStudentAchievement(
                    editDraft.studentAchievementId
                );

            // ---------------------------------------------------
            // SUCCESS
            // ---------------------------------------------------

            if (response.success) {
                message.success(
                    response.message ||
                    "Record deleted successfully"
                );

                // -----------------------------------------------
                // Remove deleted record from UI
                // -----------------------------------------------

                setExistingAchievements(
                    (previous) =>
                        previous.filter(
                            (achievement) =>
                                achievement.studentAchievementId !==
                                editDraft.studentAchievementId
                        )
                );

                // -----------------------------------------------
                // Exit edit mode
                // -----------------------------------------------

                setEditingIndex(null);

                setEditDraft(null);

                // -----------------------------------------------
                // Refresh parent/table
                // -----------------------------------------------

                onSaved?.();
            } else {
                message.error(
                    response.message ||
                    "Failed to delete achievement"
                );
            }
        } catch (error: any) {
            message.error(
                error?.message ||
                "Failed to delete achievement"
            );
        } finally {
            setSavingEdit(false);
        }
    };

    // =======================================================
    // EDIT EXISTING ACHIEVEMENT
    // =======================================================

    const handleEdit = (
        index: number
    ) => {
        const record =
            existingAchievements[index];

        if (!record) {
            return;
        }

        setEditingIndex(index);

        setEditDraft({
            ...record,
        });
    };

    // =======================================================
    // CANCEL EDIT
    // =======================================================

    const handleCancelEdit = () => {
        setEditingIndex(null);

        setEditDraft(null);
    };

    // =======================================================
    // CHANGE EDIT FIELD
    // =======================================================

    const handleEditChange = (
        field: keyof StudentAchievementDTO,
        value: string
    ) => {
        setEditDraft((previous) => {
            if (!previous) {
                return previous;
            }

            return {
                ...previous,

                [field]: value,
            };
        });
    };

    // =======================================================
    // SAVE EDITED ACHIEVEMENT
    // =======================================================
    const handleSaveEditedAchievement =
        async () => {
            if (!editDraft) {
                message.error(
                    "Achievement not selected"
                );

                return;
            }

            if (
                !studentId ||
                !editDraft.studentAchievementId
            ) {
                message.error(
                    "Student or achievement not selected"
                );

                return;
            }

            // ---------------------------------------------------
            // Validation
            // ---------------------------------------------------

            if (
                !editDraft.achievementName?.trim()
            ) {
                message.error(
                    "Please enter achievement name"
                );

                return;
            }

            if (
                !editDraft.achievementDescription?.trim()
            ) {
                message.error(
                    "Please enter achievement description"
                );

                return;
            }

            if (!editDraft.academicYear) {
                message.error(
                    "Please select academic year"
                );

                return;
            }

            try {
                setSavingEdit(true);

                // -------------------------------------------------
                // UPDATE PAYLOAD
                // -------------------------------------------------

                const payload: UpdateStudentAchievementPayload =
                {
                    studentId,

                    studentAchievementId:
                        editDraft.studentAchievementId,

                    achievementName:
                        editDraft.achievementName.trim(),

                    achievementDescription:
                        editDraft.achievementDescription.trim(),

                    academicYear:
                        editDraft.academicYear,
                };

                console.log(
                    "Update Achievement Payload:",
                    payload
                );

                // -------------------------------------------------
                // CALL UPDATE API
                // -------------------------------------------------

                const response =
                    await updateStudentAchievement(
                        payload
                    );

                // -------------------------------------------------
                // SUCCESS
                // -------------------------------------------------

                if (response.success) {
                    message.success(
                        response.message ||
                        "Student achievement updated successfully"
                    );

                    // -----------------------------------------------
                    // Update the record in UI immediately
                    // -----------------------------------------------

                    setExistingAchievements(
                        (previous) =>
                            previous.map(
                                (achievement, index) =>
                                    index === editingIndex
                                        ? {
                                            ...achievement,

                                            ...response.data,
                                        }
                                        : achievement
                            )
                    );

                    // -----------------------------------------------
                    // Exit edit mode
                    // -----------------------------------------------

                    setEditingIndex(null);

                    setEditDraft(null);

                    // -----------------------------------------------
                    // Parent refresh
                    // -----------------------------------------------

                    onSaved?.();
                } else {
                    message.error(
                        response.message ||
                        "Failed to update achievement"
                    );
                }
            } catch (error: any) {
                message.error(
                    error?.message ||
                    "Failed to update achievement"
                );
            } finally {
                setSavingEdit(false);
            }
        };

    // =======================================================
    // RENDER EXISTING ACHIEVEMENT
    // =======================================================

    const renderAchievement = (
        record: StudentAchievementDTO,
        index: number
    ) => {
        const isEditing =
            editingIndex === index;

        const draft =
            isEditing
                ? editDraft
                : null;

        return (
            <Card
                key={
                    record.studentAchievementId ??
                    index
                }
                size="small"
                style={{
                    marginBottom: 16,

                    background: "#ffffff",

                    border: isEditing
                        ? "1px solid #1677ff"
                        : "1px solid #eef0f3",

                    borderRadius: 10,

                    boxShadow:
                        "0 1px 3px rgba(16,24,40,0.04)",
                }}
                title={`Achievement ${index + 1
                    }`}
                extra={
                    !isEditing ? (
                        <Button
                            size="small"
                            icon={
                                <EditOutlined />
                            }
                            onClick={() =>
                                handleEdit(index)
                            }
                        >
                            Edit
                        </Button>
                    ) : (
                        <Space>
                            {/* Cancel */}

                            <Button
                                size="small"
                                icon={<CloseOutlined />}
                                onClick={handleCancelEdit}
                                disabled={savingEdit}
                            >
                                Cancel
                            </Button>
                             {/* Save */}

                            <Button
                                size="small"
                                type="primary"
                                icon={<SaveOutlined />}
                                loading={savingEdit}
                                onClick={
                                    handleSaveEditedAchievement
                                }
                            >
                                Save
                            </Button>

                            {/* Delete */}

                            <Button
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                loading={savingEdit}
                                onClick={handleDeleteAchievement}
                            >
                                Delete
                            </Button>

                           
                        </Space>
                    )
                }
            >
                {/* =================================================
            READ ONLY MODE
        ================================================== */}

                {!isEditing && (
                    <Row
                        gutter={[
                            16,
                            16,
                        ]}
                    >
                        {/* Achievement Name */}

                        <Col span={24}>
                            <div>
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: "#8c8c8c",
                                        marginBottom: 5,
                                    }}
                                >
                                    Achievement Name
                                </div>

                                <div
                                    style={{
                                        fontSize: 15,
                                        fontWeight: 500,
                                        color: "#1f1f1f",
                                    }}
                                >
                                    {record.achievementName ||
                                        "-"}
                                </div>
                            </div>
                        </Col>

                        {/* Achievement Description */}

                        <Col span={24}>
                            <div>
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: "#8c8c8c",
                                        marginBottom: 5,
                                    }}
                                >
                                    Achievement Description
                                </div>

                                <div
                                    style={{
                                        fontSize: 14,
                                        color: "#1f1f1f",
                                        whiteSpace:
                                            "pre-wrap",
                                    }}
                                >
                                    {record.achievementDescription ||
                                        "-"}
                                </div>
                            </div>
                        </Col>

                        {/* Academic Year */}

                        <Col span={12}>
                            <div>
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: "#8c8c8c",
                                        marginBottom: 5,
                                    }}
                                >
                                    Academic Year
                                </div>

                                <div
                                    style={{
                                        fontSize: 14,
                                        fontWeight: 500,
                                        color: "#1f1f1f",
                                    }}
                                >
                                    {record.academicYear ||
                                        "-"}
                                </div>
                            </div>
                        </Col>
                    </Row>
                )}

                {/* =================================================
            EDIT MODE
        ================================================== */}

                {isEditing && draft && (
                    <Row
                        gutter={[
                            16,
                            0,
                        ]}
                    >
                        {/* Achievement Name */}

                        <Col span={24}>
                            <Form.Item
                                label="Achievement Name"
                                required
                            >
                                <Input
                                    value={
                                        draft.achievementName ||
                                        ""
                                    }
                                    onChange={(event) =>
                                        handleEditChange(
                                            "achievementName",
                                            event.target.value
                                        )
                                    }
                                    maxLength={100}
                                />
                            </Form.Item>
                        </Col>

                        {/* Achievement Description */}

                        <Col span={24}>
                            <Form.Item
                                label="Achievement Description"
                                required
                            >
                                <Input.TextArea
                                    rows={4}
                                    value={
                                        draft.achievementDescription ||
                                        ""
                                    }
                                    onChange={(event) =>
                                        handleEditChange(
                                            "achievementDescription",
                                            event.target.value
                                        )
                                    }
                                    maxLength={500}
                                    showCount
                                />
                            </Form.Item>
                        </Col>

                        {/* Academic Year */}

                        <Col span={12}>
                            <Form.Item
                                label="Academic Year"
                                required
                            >
                                <DatePicker
                                    style={{
                                        width: "100%",
                                    }}
                                    format="YYYY-MM-DD"
                                    value={
                                        draft.academicYear
                                            ? dayjs(
                                                draft.academicYear
                                            )
                                            : null
                                    }
                                    onChange={(
                                        value
                                    ) =>
                                        handleEditChange(
                                            "academicYear",
                                            value
                                                ? value.format(
                                                    "YYYY-MM-DD"
                                                )
                                                : ""
                                        )
                                    }
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                )}
            </Card>
        );
    };

    // =======================================================
    // UI
    // =======================================================

    return (
        <>
            <Drawer
                title="Edit Achievement"
                width={680}
                open={open}
                onClose={handleClose}
                destroyOnClose
                className="achievement-drawer"
                styles={{
                    body: {
                        background:
                            "#fff6ed",

                        padding:
                            "20px 24px",
                    },
                }}
            >
                <Spin
                    spinning={loading}
                >
                    {/* =================================================
              EXISTING ACHIEVEMENTS
          ================================================== */}

                    <h4
                        style={{
                            marginBottom: 16,

                            fontWeight: 600,

                            color: "#1f1f1f",
                        }}
                    >
                        Existing Achievements
                    </h4>

                    {existingAchievements.length ===
                        0 ? (
                        <Empty
                            description="No achievements found"
                        />
                    ) : (
                        existingAchievements.map(
                            renderAchievement
                        )
                    )}

                    {/* =================================================
              ADD NEW ACHIEVEMENT
          ================================================== */}

                    <Divider
                        style={{
                            margin:
                                "24px 0",
                        }}
                    />

                    <h4
                        style={{
                            marginBottom: 16,

                            fontWeight: 600,

                            color: "#1f1f1f",
                        }}
                    >
                        Add New Achievement
                    </h4>

                    <Form
                        form={form}
                        layout="vertical"
                    >
                        <Form.List
                            name="newRecords"
                        >
                            {(
                                fields,
                                { add, remove }
                            ) => (
                                <>
                                    {/* Add another */}

                                    <Button
                                        type="dashed"
                                        icon={
                                            <PlusOutlined />
                                        }
                                        onClick={() =>
                                            addNewAchievement(
                                                add
                                            )
                                        }
                                        block
                                        style={{
                                            marginBottom: 16,
                                        }}
                                    >
                                        Add Another Achievement
                                    </Button>

                                    {/* New records */}

                                    {fields.map(
                                        (field) => (
                                            <Card
                                                key={
                                                    field.key
                                                }
                                                size="small"
                                                style={{
                                                    marginBottom: 16,

                                                    background:
                                                        "#ffffff",

                                                    border:
                                                        "1px solid #eef0f3",

                                                    borderRadius: 10,

                                                    boxShadow:
                                                        "0 1px 3px rgba(16,24,40,0.04)",
                                                }}
                                                title={`New Achievement ${field.name +
                                                    1
                                                    }`}
                                                extra={
                                                    <Button
                                                        type="text"
                                                        danger
                                                        icon={
                                                            <DeleteOutlined />
                                                        }
                                                        onClick={() =>
                                                            remove(
                                                                field.name
                                                            )
                                                        }
                                                    />
                                                }
                                            >
                                                <Row
                                                    gutter={[
                                                        16,
                                                        0,
                                                    ]}
                                                >
                                                    {/* Name */}

                                                    <Col
                                                        span={24}
                                                    >
                                                        <Form.Item
                                                            name={[
                                                                field.name,
                                                                "achievementName",
                                                            ]}
                                                            label="Achievement Name"
                                                            rules={[
                                                                {
                                                                    required:
                                                                        true,

                                                                    message:
                                                                        "Please enter achievement name",
                                                                },
                                                            ]}
                                                        >
                                                            <Input
                                                                placeholder="Enter achievement name"
                                                                maxLength={
                                                                    100
                                                                }
                                                            />
                                                        </Form.Item>
                                                    </Col>

                                                    {/* Description */}

                                                    <Col
                                                        span={24}
                                                    >
                                                        <Form.Item
                                                            name={[
                                                                field.name,
                                                                "achievementDescription",
                                                            ]}
                                                            label="Achievement Description"
                                                            rules={[
                                                                {
                                                                    required:
                                                                        true,

                                                                    message:
                                                                        "Please enter achievement description",
                                                                },
                                                            ]}
                                                        >
                                                            <Input.TextArea
                                                                rows={
                                                                    4
                                                                }
                                                                placeholder="Enter achievement description"
                                                                maxLength={
                                                                    500
                                                                }
                                                                showCount
                                                            />
                                                        </Form.Item>
                                                    </Col>

                                                    {/* Academic Year */}

                                                    <Col
                                                        span={12}
                                                    >
                                                        <Form.Item
                                                            name={[
                                                                field.name,
                                                                "academicYear",
                                                            ]}
                                                            label="Academic Year"
                                                            rules={[
                                                                {
                                                                    required:
                                                                        true,

                                                                    message:
                                                                        "Please select academic year",
                                                                },
                                                            ]}
                                                        >
                                                            <DatePicker
                                                                style={{
                                                                    width:
                                                                        "100%",
                                                                }}
                                                                format="YYYY-MM-DD"
                                                            />
                                                        </Form.Item>
                                                    </Col>
                                                </Row>
                                            </Card>
                                        )
                                    )}

                                    {/* Save */}

                                    {fields.length >
                                        0 && (
                                            <div
                                                style={{
                                                    display:
                                                        "flex",

                                                    justifyContent:
                                                        "flex-end",

                                                    gap: 8,

                                                    marginTop: 16,
                                                }}
                                            >
                                                <Button
                                                    onClick={() =>
                                                        form.resetFields()
                                                    }
                                                >
                                                    Clear
                                                </Button>

                                                <Button
                                                    type="primary"
                                                    icon={
                                                        <SaveOutlined />
                                                    }
                                                    loading={
                                                        saving
                                                    }
                                                    onClick={
                                                        handleSaveNewAchievements
                                                    }
                                                >
                                                    Save Achievement
                                                </Button>
                                            </div>
                                        )}
                                </>
                            )}
                        </Form.List>
                    </Form>
                </Spin>
            </Drawer>
        </>
    );
}