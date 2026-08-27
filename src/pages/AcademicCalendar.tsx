import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Empty,
  message,
  Popconfirm,
} from "antd";
import { PlusOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";

import {
  saveAcademicCalendarEvent,
  getAllAcademicCalendarEvents,
  updateAcademicCalendarEvent,
  deleteAcademicCalendarEvent,
  type AcademicCalendarEventDTO,
  type AcademicCalendarEventType,
} from "../services/Academiccalendarservice";
import { useAuth } from "../hooks/useAuth";

const MANAGE_ROLES = ["ADMIN", "PRINCIPAL"];

const { Option } = Select;

const EVENT_TYPE_OPTIONS: AcademicCalendarEventType[] = [
  "EXAMINATION",
  "HOLIDAY",
  "EVENT",
  "MEETING",
  "VACATION",
  "OTHER",
];

const TYPE_META: Record<string, { label: string; dot: string }> = {
  EXAMINATION: { label: "Examination", dot: "#F97066" },
  HOLIDAY: { label: "Holiday", dot: "#22C55E" },
  EVENT: { label: "Event", dot: "#3B82F6" },
  MEETING: { label: "Meeting", dot: "#A855F7" },
  VACATION: { label: "Vacation", dot: "#06B6D4" },
  OTHER: { label: "Other", dot: "#94A3B8" },
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const ACADEMIC_YEAR_STORAGE_KEY = "academicYear";

// Same helper as the Student Fees page — reads the logged-in session's
// startDate and returns it as a Dayjs, so the calendar opens on the year
// the user is logged in under. Falls back to today's date if anything
// is missing or unparseable — never throws.
const getLoggedInSessionStartDate = (): Dayjs => {
  try {
    const stored = localStorage.getItem(ACADEMIC_YEAR_STORAGE_KEY);
    if (!stored) return dayjs();

    const { startDate } = JSON.parse(stored) as { startDate?: string };
    if (!startDate) return dayjs();

    const parsed = dayjs(startDate);
    return parsed.isValid() ? parsed : dayjs();
  } catch {
    return dayjs();
  }
};

interface EventFormValues {
  eventTitle: string;
  eventType: AcademicCalendarEventType;
  dateRange: [Dayjs, Dayjs];
  description?: string;
}

const BATCH_SIZE = 20;

export default function AcademicCalendar() {
  const { user } = useAuth();
  const canManage = MANAGE_ROLES.includes((user?.role || "").toUpperCase());

  const [events, setEvents] = useState<AcademicCalendarEventDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<EventFormValues>();
  const [editingEvent, setEditingEvent] =
    useState<AcademicCalendarEventDTO | null>(null);

  const [visibleMonth, setVisibleMonth] = useState<Dayjs>(() =>
    getLoggedInSessionStartDate()
  );
  const [selectedDate, setSelectedDate] = useState<Dayjs>(() =>
    getLoggedInSessionStartDate()
  );
  const [activeType, setActiveType] = useState<"ALL" | AcademicCalendarEventType>(
    "ALL"
  );
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (event: AcademicCalendarEventDTO) => {
    setDeletingId(event.academicCalendarId);
    try {
      const res = await deleteAcademicCalendarEvent(event.academicCalendarId);
      if (res.success) {
        message.success(res.message || "Event deleted successfully");
        fetchEvents();
      } else {
        message.error(res.message || "Failed to delete event");
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Failed to delete event");
    } finally {
      setDeletingId(null);
    }
  };

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllAcademicCalendarEvents(0, BATCH_SIZE);
      if (res.success) {
        setEvents(res.data?.["Academic calendar events"] || []);
      } else {
        message.error(res.message || "Failed to fetch events");
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Failed to fetch events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const openModal = () => {
    form.resetFields();
    setModalOpen(true);
  };

  const openEditModal = (event: AcademicCalendarEventDTO) => {
    setEditingEvent(event);
    form.setFieldsValue({
      eventTitle: event.eventTitle,
      eventType: event.eventType as AcademicCalendarEventType,
      dateRange: [dayjs(event.startDate), dayjs(event.endDate)],
      description: event.description,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    form.resetFields();
    setEditingEvent(null);
    setModalOpen(false);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const [startDate, endDate] = values.dateRange;

      setSaving(true);

      if (editingEvent) {
        const res = await updateAcademicCalendarEvent({
          academicCalendarId: editingEvent.academicCalendarId,
          eventTitle: values.eventTitle,
          eventType: values.eventType,
          startDate: startDate.format("YYYY-MM-DD"),
          endDate: endDate.format("YYYY-MM-DD"),
          description: values.description || "",
        });

        if (res.success) {
          message.success(res.message || "Event updated successfully");
          closeModal();
          fetchEvents();
        } else {
          message.error(res.message || "Failed to update event");
        }
      } else {
        const res = await saveAcademicCalendarEvent({
          eventTitle: values.eventTitle,
          eventType: values.eventType,
          startDate: startDate.format("YYYY-MM-DD"),
          endDate: endDate.format("YYYY-MM-DD"),
          description: values.description || "",
        });

        if (res.success) {
          message.success(res.message || "Event saved successfully");
          closeModal();
          fetchEvents();
        } else {
          message.error(res.message || "Failed to save event");
        }
      }
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err?.response?.data?.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const eventsOnDay = useCallback(
    (day: Dayjs) =>
      events.filter(
        (e) =>
          e.startDate &&
          e.endDate &&
          !day.isBefore(dayjs(e.startDate), "day") &&
          !day.isAfter(dayjs(e.endDate), "day")
      ),
    [events]
  );

  const calendarCells = useMemo(() => {
    const startOfMonth = visibleMonth.startOf("month");
    const gridStart = startOfMonth.subtract(startOfMonth.day(), "day");
    return Array.from({ length: 42 }, (_, i) => gridStart.add(i, "day"));
  }, [visibleMonth]);

  const typesPresent = useMemo(() => {
    const set = new Set(events.map((e) => e.eventType));
    return EVENT_TYPE_OPTIONS.filter((t) => set.has(t));
  }, [events]);

  const filteredEvents = useMemo(() => {
    const list =
      activeType === "ALL" ? events : events.filter((e) => e.eventType === activeType);
    return [...list].sort((a, b) => (a.startDate < b.startDate ? -1 : 1));
  }, [events, activeType]);

  return (
    <div className="bg-[#F3F4F7] p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        {canManage && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openModal}
            className="!bg-[#22C55E] hover:!bg-[#1EA34E] !border-none !rounded-full !h-9 !px-5 !font-medium"
          >
            Add New
          </Button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-5 items-start">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 w-full lg:w-[420px] shrink-0">
          <div className="flex items-center justify-between mb-4">
            <button
              aria-label="Previous month"
              onClick={() => setVisibleMonth((m) => m.subtract(1, "month"))}
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
            >
              <LeftOutlined style={{ fontSize: 12 }} />
            </button>
            <span className="font-semibold text-gray-800 tracking-wide">
              {visibleMonth.format("MMMM YYYY")}
            </span>
            <button
              aria-label="Next month"
              onClick={() => setVisibleMonth((m) => m.add(1, "month"))}
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
            >
              <RightOutlined style={{ fontSize: 12 }} />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-xs text-gray-400 py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-2">
            {calendarCells.map((day) => {
              const inMonth = day.month() === visibleMonth.month();
              const hasEvent = eventsOnDay(day).length > 0;
              const isSelected = day.isSame(selectedDate, "day");

              return (
                <div key={day.format("YYYY-MM-DD")} className="flex items-center justify-center">
                  <button
                    onClick={() => setSelectedDate(day)}
                    className={[
                      "w-9 h-9 rounded-full text-sm flex items-center justify-center transition",
                      !inMonth ? "text-gray-300" : "text-gray-700",
                      hasEvent && inMonth ? "bg-[#3B82F6] text-white font-medium" : "",
                      isSelected && !hasEvent ? "ring-1 ring-[#93C5FD]" : "",
                      !hasEvent ? "hover:bg-gray-100" : "",
                    ].join(" ")}
                  >
                    {day.date()}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex-1 w-full">
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setActiveType("ALL")}
              className={[
                "px-4 py-1.5 rounded-full text-sm font-medium border transition",
                activeType === "ALL"
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300",
              ].join(" ")}
            >
              All
            </button>
            {typesPresent.map((type) => (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={[
                  "px-4 py-1.5 rounded-full text-sm font-medium border transition",
                  activeType === type
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300",
                ].join(" ")}
              >
                {TYPE_META[type]?.label ?? type}
              </button>
            ))}
          </div>

          {!loading && filteredEvents.length === 0 ? (
            <Empty description="No events added yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-separate border-spacing-0">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="font-medium pb-3 pr-4">Date</th>
                    <th className="font-medium pb-3 pr-4">Event Name</th>
                    <th className="font-medium pb-3">Type</th>
                    {canManage && <th className="font-medium pb-3"></th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((event, idx) => (
                    <tr
                      key={event.academicCalendarId}
                      className={idx % 2 === 1 ? "bg-[#F8FAFC]" : "bg-white"}
                    >
                      <td className="py-3 pr-4 text-gray-500 rounded-l-lg whitespace-nowrap align-middle">
                        {dayjs(event.startDate).format("DD MMM, YYYY")}
                      </td>
                      <td className="py-3 pr-4 text-gray-800 font-medium align-middle">
                        {event.eventTitle}
                      </td>
                      <td className="py-3 pr-4 align-middle">
                        <span className="inline-flex items-center gap-1.5 text-gray-600">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              backgroundColor: TYPE_META[event.eventType]?.dot ?? "#94A3B8",
                            }}
                          />
                          {TYPE_META[event.eventType]?.label ?? event.eventType}
                        </span>
                      </td>
                      {canManage && (
                        <td className="py-3 rounded-r-lg text-right pr-2 align-middle">
                          <div className="inline-flex items-center gap-6">
                            <button
                              onClick={() => openEditModal(event)}
                              className="text-xs font-medium text-[#3B82F6] hover:underline"
                            >
                              Edit
                            </button>
                            <Popconfirm
                              title="Delete this event?"
                              description={`"${event.eventTitle}" will be permanently removed.`}
                              onConfirm={() => handleDelete(event)}
                              okText="Delete"
                              okButtonProps={{
                                danger: true,
                                loading: deletingId === event.academicCalendarId,
                              }}
                              cancelText="Cancel"
                            >
                              <button className="text-xs font-medium text-red-500 hover:underline">
                                Delete
                              </button>
                            </Popconfirm>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal
        title={editingEvent ? "Edit Academic Calendar Event" : "Add Academic Calendar Event"}
        open={modalOpen}
        onCancel={closeModal}
        onOk={handleSave}
        okText={editingEvent ? "Update" : "Save"}
        confirmLoading={saving}
        destroyOnHidden
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
                  {TYPE_META[opt]?.label ?? opt}
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
                    return Promise.reject(new Error("End date cannot be before start date"));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <DatePicker.RangePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="e.g. Mid-Term examination for all classes" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}