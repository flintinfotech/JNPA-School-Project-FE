import React, { useEffect, useState } from "react";
import { message, Modal, Select } from "antd";
import { EditOutlined } from "@ant-design/icons";

import {
  saveAdmissionInquiry,
  getAllAdmissionInquiryByFilter,
  updateAdmissionInquiryById,
  getAllStaticData,
  type AdmissionInquiryDTO,
  type AdmissionInquiryResponseData,
} from "../services/InquiryService";
// ===========================
// Static dropdown options
// ===========================

const STANDARD_OPTIONS = [
  "Nursery",
  "LKG",
  "UKG",
  ...Array.from({ length: 12 }, (_, i) => `${i + 1}th`),
];

const MEDIUM_OPTIONS = ["English", "Hindi", "Marathi"];

const STATUS_OPTIONS = ["NEW", "CONTACTED", "ADMITTED", "REJECTED", "CLOSED"];

const emptyForm: AdmissionInquiryDTO = {
  firstName: "",
  lastName: "",
  contactNumber: "",
  standard: "",
  medium: "",
  status: "NEW",
};

// Badge colors per status, falling back to gray for anything unrecognised.
const statusStyles: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  CONTACTED: "bg-amber-100 text-amber-700",
  ADMITTED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  CLOSED: "bg-gray-200 text-gray-700",
};

const StatusBadge = ({ status }: { status: string }) => (
  <span
    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles[status] || "bg-gray-200 text-gray-700"
      }`}
  >
    {status}
  </span>
);

const AdmissionInquiry: React.FC = () => {
  // ===========================
  // States
  // ===========================

  const [inquiries, setInquiries] = useState<AdmissionInquiryResponseData[]>(
    []
  );
  const [loading, setLoading] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalRecords, setTotalRecords] = useState(0);

  const [showDrawer, setShowDrawer] = useState(false);
  const [form, setForm] = useState<AdmissionInquiryDTO>(emptyForm);
  const [submitting, setSubmitting] = useState(false);


  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedInquiry, setSelectedInquiry] =
    useState<AdmissionInquiryResponseData | null>(null);

  const [selectedStatus, setSelectedStatus] = useState("");

  const [statusOptions, setStatusOptions] = useState<string[]>([]);
  // Mobile view
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ===========================
  // Fetch Admission Inquiries
  // ===========================
  // The payload for this filter endpoint is currently just {} (no filters
  // supported yet on the backend). Swap the {} below for real filter
  // fields (status, standard, medium, etc.) once the backend accepts them.

  const fetchInquiries = () => {
    setLoading(true);

    getAllAdmissionInquiryByFilter(page - 1, pageSize, {})
      .then((response) => {
        if (response.data.success) {
          const data = response.data.data;
          setInquiries(data.Data || []);
          setTotalRecords(data.Total || 0);
        } else {
          message.error(response.data.message || "Failed to fetch inquiries");
        }
      })
      .catch((error) => {
        console.log(error);
        message.error("Failed to fetch admission inquiries.");
      })
      .finally(() => setLoading(false));
  };

  const fetchStaticData = () => {
    getAllStaticData()
      .then((response) => {
        console.log("Static Data Response:", response.data);

        if (response.data.success) {
          setStatusOptions(
            response.data.data["admission enquiry"] || []
          );
        }
      })
      .catch((error) => {
        console.log(error);
        message.error("Failed to load static data");
      });
  };
  // Fetch whenever the screen opens and whenever the page changes.
  useEffect(() => {
    fetchInquiries();
    fetchStaticData();
  }, [page]);

  // ===========================
  // Pagination
  // ===========================

  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

  // ===========================
  // Drawer open / close
  // ===========================

  const openAddDrawer = () => {
    setForm(emptyForm);
    setShowDrawer(true);
  };

  const closeDrawer = () => setShowDrawer(false);

  // ===========================
  // Form change
  // ===========================

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ===========================
  // Submit
  // ===========================

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !form.firstName ||
      !form.lastName ||
      !form.contactNumber ||
      !form.standard ||
      !form.medium
    ) {
      message.warning("Please fill all required fields.");
      return;
    }

    if (!/^\d{10}$/.test(form.contactNumber)) {
      message.warning("Contact number must be exactly 10 digits.");
      return;
    }

    setSubmitting(true);

    saveAdmissionInquiry(form)
      .then((response) => {
        if (response.data.success) {
          message.success(response.data.message || "Inquiry submitted successfully");

          setForm(emptyForm);
          setShowDrawer(false);

          // Jump to page 1 and refetch so the new record is visible.
          if (page === 1) {
            fetchInquiries();
          } else {
            setPage(1);
          }
        } else {
          message.error(response.data.message || "Failed to submit inquiry");
        }
      })
      .catch((error) => {
        console.log(error);
        message.error("Failed to submit inquiry.");
      })
      .finally(() => setSubmitting(false));
  };

  const handleEditStatus = (record: AdmissionInquiryResponseData) => {
    setSelectedInquiry(record);
    setSelectedStatus(record.status);
    setIsModalOpen(true);
  };
  const handleUpdateStatus = () => {
    if (!selectedInquiry) return;

    const payload = {
      firstName: selectedInquiry.firstName,
      lastName: selectedInquiry.lastName,
      contactNumber: selectedInquiry.contactNumber,
      standard: selectedInquiry.standard,
      medium: selectedInquiry.medium,
      status: selectedStatus,
    };

    updateAdmissionInquiryById(
      selectedInquiry.admissionInquiryId,
      payload
    )
      .then((response) => {
        if (response.data.success) {
          message.success("Status Updated Successfully");

          setIsModalOpen(false);

          fetchInquiries();
        }
      })
      .catch(() => {
        message.error("Update Failed");
      });
  };


  // ===========================
  // Mobile view
  // ===========================

  if (isMobile) {
    return (
      <div className="space-y-3 p-4">


        {loading ? (
          <div className="text-center text-gray-400 py-10">Loading...</div>
        ) : inquiries.length === 0 ? (
          <div className="text-center text-gray-400 py-10">
            No admission inquiries found.
          </div>
        ) : (
          inquiries.map((row) => (
            <div
              key={row.admissionInquiryId}
              className="bg-white rounded-xl border shadow-sm p-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {row.firstName} {row.lastName}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Contact: {row.contactNumber}
                  </p>
                  <p className="text-sm text-gray-500">
                    Standard: {row.standard} &middot; Medium: {row.medium}
                  </p>
                  {/* <p className="text-sm text-gray-500">
                    Stream: {row.stream ?? "-"}
                  </p> */}
                </div>
                <StatusBadge status={row.status} />
              </div>
            </div>
          ))
        )}

        <div className="flex items-center justify-between mt-6">
          <span className="text-sm text-gray-500">Total: {totalRecords}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-3 py-1 rounded-md border border-gray-300 bg-white
                 text-gray-700 text-sm
                 hover:border-blue-500 hover:text-blue-600
                 disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="px-3 py-1 rounded-md border border-blue-500 bg-white
                 text-blue-600 text-sm
                 hover:bg-blue-50
                 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

        {/* {showDrawer && (
          <InquiryDrawer
            form={form}
            submitting={submitting}
            onChange={handleChange}
            onClose={closeDrawer}
            onSubmit={handleSubmit}
          />
        )} */}
      </div>
    );
  }

  // ===========================
  // Desktop view
  // ===========================

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-2 py-2">


        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full border-collapse">
            <thead className="bg-gray-100">
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-sm font-semibold text-gray-700 text-center">
                  Sr.No
                </th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700 text-center">
                  First Name
                </th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700 text-center">
                  Last Name
                </th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700 text-center">
                  Contact Number
                </th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700 text-center">
                  Standard
                </th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700 text-center">
                  Medium
                </th>
                {/* <th className="px-4 py-3 text-sm font-semibold text-gray-700 text-center">
                  Stream
                </th> */}
                <th className="px-4 py-3 text-sm font-semibold text-gray-700 text-center">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : inquiries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-400">
                    No admission inquiries found.
                  </td>
                </tr>
              ) : (
                inquiries.map((row, index) => (
                  <tr
                    key={row.admissionInquiryId}
                    className="border-b border-gray-200 last:border-none hover:bg-gray-50"
                  >
                    <td className="text-center px-3 py-2 text-sm text-gray-700">
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td className="text-center px-3 py-2 text-sm text-gray-700">
                      {row.firstName}
                    </td>
                    <td className="text-center px-3 py-2 text-sm text-gray-700">
                      {row.lastName}
                    </td>
                    <td className="text-center px-3 py-2 text-sm text-gray-700">
                      {row.contactNumber}
                    </td>
                    <td className="text-center px-3 py-2 text-sm text-gray-700">
                      {row.standard}
                    </td>
                    <td className="text-center px-3 py-2 text-sm text-gray-700">
                      {row.medium}
                    </td>
                    {/* <td className="text-center px-3 py-2 text-sm text-gray-700">
                      {row.stream ?? "-"}
                    </td> */}
                    <td className="text-center px-3 py-2">
                      <div className="flex items-center justify-center gap-3">
                        <StatusBadge status={row.status} />

                        <button
                          onClick={() => handleEditStatus(row)}
                          className="w-6 h-6 bg-blue-600 hover:bg-blue-700 rounded text-white"
                        >
                          <div className="w-full h-full flex items-center justify-center">
                            <EditOutlined />
                          </div>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <span className="text-sm text-gray-700">Total: {totalRecords}</span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="w-6 h-6 rounded border border-transparent
               text-gray-600
               hover:border-blue-600 hover:text-blue-600
               transition-all duration-200
               disabled:opacity-40
               disabled:hover:border-transparent
               disabled:hover:text-gray-600"
            >
              &lt;
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-6 h-6 rounded-md border text-sm transition-all duration-200 ${p === page
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:border-blue-600 hover:text-blue-600"
                  }`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="w-5 h-5 rounded border border-transparent
               text-gray-600
               hover:border-blue-600 hover:text-blue-600
               transition-all duration-200
               disabled:opacity-40
               disabled:hover:border-transparent
               disabled:hover:text-gray-600"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>
      <Modal
        title="Update Admission Inquiry Status"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleUpdateStatus}
        okText="Save"
      >
        <div className="mt-4">
          <label className="block mb-2 font-medium">
            Status
          </label>

          <Select
            style={{ width: "100%" }}
            value={selectedStatus}
            onChange={(value) => setSelectedStatus(value)}
            options={statusOptions.map((item) => ({
              label: item,
              value: item,
            }))}
          />
        </div>
      </Modal>
    </div>
  );
};


export default AdmissionInquiry;
