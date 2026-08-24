import { useState } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Tag,
  Empty,
  message,
  Space,
  Grid,
} from "antd";
import { PlusOutlined, CalendarOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs, { Dayjs } from "dayjs";

import {
  saveAcademicCalendarEvent,
  type AcademicCalendarEventDTO,
  type AcademicCalendarEventType,
} from "../services/Academiccalendarservice"; 

const { Option } = Select;
const { useBreakpoint } = Grid;

// 👇 TODO: confirm this matches the backend enum exactly (see service file note)
const EVENT_TYPE_OPTIONS: AcademicCalendarEventType[] = [
  "EXAMINATION",
  "HOLIDAY",
  "EVENT",
  "MEETING",
  "OTHER",
];

const EVENT_TYPE_COLORS: Record<string, string> = {
  EXAMINATION: "volcano",
  HOLIDAY: "green",
  EVENT: "blue",
  MEETING: "purple",
  OTHER: "default",
};

interface EventFormValues {
  eventTitle: string;
  eventType: AcademicCalendarEventType;
  dateRange: [Dayjs, Dayjs];
  description?: string;
}

export default function AcademicCalendar() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [events, setEvents] = useState<AcademicCalendarEventDTO[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<EventFormValues>();

  const openModal = () => {
    form.resetFields();
    setModalOpen(true);
  };

  const closeModal = () => {
    form.resetFields();
    setModalOpen(false);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const [startDate, endDate] = values.dateRange;

      setSaving(true);
      const res = await saveAcademicCalendarEvent({
        eventTitle: values.eventTitle,
        eventType: values.eventType,
        startDate: startDate.format("YYYY-MM-DD"),
        endDate: endDate.format("YYYY-MM-DD"),
        description: values.description || "",
      });

      if (res.success) {
        message.success(res.message || "Event saved successfully");
        // Prepend so the newest event shows first.
        setEvents((prev) => [res.data, ...prev]);
        closeModal();
      } else {
        message.error(res.message || "Failed to save event");
      }
    } catch (err: any) {
      if (err?.errorFields) return; // antd validation error already shown inline
      message.error(err?.response?.data?.message || "Failed to save event");
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<AcademicCalendarEventDTO> = [
    {
      title: "Event Title",
      dataIndex: "eventTitle",
    },
    {
      title: "Type",
      dataIndex: "eventType",
      align: "center",
      render: (type: string) => (
        <Tag color={EVENT_TYPE_COLORS[type] || "default"}>{type}</Tag>
      ),
    },
    {
      title: "Start Date",
      dataIndex: "startDate",
      align: "center",
      render: (d: string) => (d ? dayjs(d).format("DD MMM YYYY") : "-"),
    },
    {
      title: "End Date",
      dataIndex: "endDate",
      align: "center",
      render: (d: string) => (d ? dayjs(d).format("DD MMM YYYY") : "-"),
    },
    {
      title: "Description",
      dataIndex: "description",
      render: (d: string) => d || "-",
    },
  ];

  return (
    <Card
     
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openModal}>
          Add Event
        </Button>
      }
    >
      {isMobile ? (
        <div className="space-y-3">
          {events.length === 0 ? (
            <Empty description="No events added yet" />
          ) : (
            events.map((event) => (
              <div
                key={event.academicCalendarId}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3"
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-semibold text-gray-800">
                    {event.eventTitle}
                  </p>
                  <Tag color={EVENT_TYPE_COLORS[event.eventType] || "default"}>
                    {event.eventType}
                  </Tag>
                </div>
                <p className="text-xs text-gray-500">
                  {dayjs(event.startDate).format("DD MMM YYYY")} —{" "}
                  {dayjs(event.endDate).format("DD MMM YYYY")}
                </p>
                {event.description && (
                  <p className="text-xs text-gray-500 mt-1">
                    {event.description}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <Table
          rowKey="academicCalendarId"
          columns={columns}
          dataSource={events}
          bordered
          pagination={false}
          locale={{ emptyText: <Empty description="No events added yet" /> }}
        />
      )}

      <Modal
        title="Add Academic Calendar Event"
        open={modalOpen}
        onCancel={closeModal}
        onOk={handleSave}
        okText="Save"
        confirmLoading={saving}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="eventTitle"
            label="Event Title"
            rules={[{ required: true, message: "Please enter an event title" }]}
          >
            <Input placeholder="e.g. Mid-Term Examination" />
          </Form.Item>

          <Form.Item
            name="eventType"
            label="Event Type"
            rules={[{ required: true, message: "Please select an event type" }]}
          >
            <Select placeholder="Select event type">
              {EVENT_TYPE_OPTIONS.map((opt) => (
                <Option key={opt} value={opt}>
                  {opt}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="Event Dates"
            rules={[
              { required: true, message: "Please select start and end dates" },
              {
                validator: (_, value: [Dayjs, Dayjs]) => {
                  if (!value || value.length < 2) return Promise.resolve();
                  const [start, end] = value;
                  if (end.isBefore(start, "day")) {
                    return Promise.reject(
                      new Error("End date cannot be before start date")
                    );
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <DatePicker.RangePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea
              rows={3}
              placeholder="e.g. Mid-Term examination for all classes"
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}