import React, { useEffect, useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import {
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { message, Popconfirm } from "antd";

import {
  saveClassMaster,
  getAllClassMaster,
  getClassMasterById,
  updateClassMaster,
  deleteClassMaster,
  getAllStaticData,
} from "../services/classMasterService";

interface ClassMasterModel {
  id: number;
  standard: string;
  division: string;
  medium: string;
}

const emptyForm: Omit<ClassMasterModel, "id"> = {
  standard: "",
  division: "",
  medium: "",
};

const ClassMaster: React.FC = () => {

  // ===========================
  // States
  // ===========================

  const [classes, setClasses] = useState<ClassMasterModel[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalRecords, setTotalRecords] = useState(0);

  // Dropdowns
  const [standards, setStandards] = useState<string[]>([]);
  const [divisions, setDivisions] = useState<string[]>([]);
  const [mediums, setMediums] = useState<string[]>([]);

  // Mobile View
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // ===========================
  // Fetch Class Master
  // ===========================

  const fetchClassMaster = () => {
    getAllClassMaster(page - 1, pageSize)
      .then((response) => {
        if (response.data.success) {

          const data = response.data.data;

          const classData = data.classMasterDTOS.map((item: any) => ({
            id: item.classMasterId,
            standard: item.standard,
            division: item.division,
            medium: item.medium,
          }));

          setClasses(classData);

          setTotalRecords(data["total element"] || 0);
        }
      })
      .catch((error) => {
        console.log(error);
        message.error("Failed to fetch class data");
      });
  };

  // ===========================
  // Fetch Dropdown Data
  // ===========================

  const fetchStaticData = () => {
    getAllStaticData()
      .then((response) => {
        if (response.data.success) {

          const data = response.data.data;

          setStandards(data.standard || []);
          setDivisions(data.division || []);
          setMediums(data.medium || []);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  // ===========================
  // useEffect
  // ===========================

  useEffect(() => {
    fetchClassMaster();
  }, [page]);

  useEffect(() => {
    fetchStaticData();
  }, []);

  useEffect(() => {

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };

  }, []);

  // ===========================
  // Pagination
  // ===========================

  const totalPages = Math.max(
    1,
    Math.ceil(totalRecords / pageSize)
  );

  const paginated = classes;
  // ===========================
  // Open Add Drawer
  // ===========================

  const openAddModal = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  // ===========================
  // Open Edit Drawer
  // ===========================

  const openEditModal = (row: ClassMasterModel) => {
    getClassMasterById(row.id)
      .then((response) => {
        if (response.data.success) {
          const data = response.data.data;

          setEditId(data.classMasterId);

          setForm({
            standard: data.standard,
            division: data.division,
            medium: data.medium,
          });

          setShowModal(true);
        }
      })
      .catch((error) => {
        console.log(error);
        message.error("Failed to fetch class details");
      });
  };

  // ===========================
  // Delete
  // ===========================

  const handleDelete = (id: number) => {
    deleteClassMaster(id)
      .then((response) => {
        if (response.data.success) {
          message.success(response.data.message);

          fetchClassMaster();

          // If last record on last page is deleted,
          // automatically move to previous page.
          if (classes.length === 1 && page > 1) {
            setPage(page - 1);
          }
        }
      })
      .catch((error) => {
        console.log(error);
        message.error("Failed to delete class");
      });
  };

  // ===========================
  // Form Change
  // ===========================

  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ===========================
  // Save / Update
  // ===========================

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.standard || !form.division || !form.medium) {
      message.warning("Please fill all fields.");
      return;
    }

    // -------------------------
    // UPDATE
    // -------------------------

    if (editId !== null) {
      const payload = {
        classMasterId: editId,
        standard: form.standard,
        division: form.division,
        medium: form.medium,
      };

      updateClassMaster(payload)
        .then((response) => {
          if (response.data.success) {
            message.success(response.data.message);

            fetchClassMaster();

            setForm(emptyForm);
            setEditId(null);
            setShowModal(false);
          } else {
            message.error(response.data.message);
          }
        })
        .catch((error) => {
          console.log(error);
          message.error("Failed to update class.");
        });

      return;
    }

    // -------------------------
    // SAVE
    // -------------------------

    saveClassMaster(form)
      .then((response) => {
        if (response.data.success) {
          message.success(response.data.message);

          fetchClassMaster();

          setForm(emptyForm);
          setShowModal(false);

          // Optional:
          // Go to first page after adding a record.
          setPage(1);
        } else {
          message.error(response.data.message);
        }
      })
      .catch((error) => {
        console.log(error);
        message.error("Something went wrong.");
      });
  };
  // ===========================
  // Mobile View
  // ===========================

  if (isMobile) {
    return (
      <div className="space-y-3 p-4">

        {paginated.length === 0 ? (
          <div className="text-center text-gray-400 py-10">
            No classes found.
          </div>
        ) : (
          paginated.map((row) => (
            <div
              key={row.id}
              className="bg-white rounded-xl border shadow-sm p-4"
            >
              <div className="flex justify-between items-start">

                <div>
                  <h3 className="font-semibold text-gray-800">
                    {row.standard}
                  </h3>

                  <p className="text-sm text-gray-500 mt-1">
                    Division : {row.division}
                  </p>

                  <p className="text-sm text-gray-500">
                    Medium : {row.medium}
                  </p>
                </div>

              </div>

              <div className="flex justify-end gap-2 mt-4">

                <button
                  onClick={() => openEditModal(row)}
                  className="bg-blue-600 text-white w-9 h-9 rounded flex items-center justify-center"
                >
                  <Pencil size={16} />
                </button>

                <button
                  onClick={() => handleDelete(row.id)}
                  className="border border-red-500 text-red-500 w-9 h-9 rounded flex items-center justify-center"
                >
                  <Trash2 size={16} />
                </button>

              </div>
            </div>
          ))
        )}


        <div className="flex items-center justify-between mt-6">

          <span className="text-sm text-gray-500">
            Total: {totalRecords}
          </span>

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
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Main Content */}
      <div className="px-6 py-4">

        {/* Add Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            <Plus size={16} />
            Add Class
          </button>
        </div>

        {/* Table */}
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">

          <table className="w-full border-collapse">

            <thead className="bg-gray-100">
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-sm font-semibold text-gray-700 text-center">
                  Sr.No
                </th>

                <th className="px-4 py-3 text-sm font-semibold text-gray-700 text-center">
                  Standard
                </th>

                <th className="px-4 py-3 text-sm font-semibold text-gray-700 text-center">
                  Division
                </th>

                <th className="px-4 py-3 text-sm font-semibold text-gray-700 text-center">
                  Medium
                </th>

                <th className="px-4 py-3 text-sm font-semibold text-gray-700 text-center">
                  Action
                </th>

              </tr>
            </thead>

            <tbody>

              {paginated.length === 0 ? (

                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-8 text-gray-400"
                  >
                    No classes found
                  </td>
                </tr>

              ) : (

                paginated.map((row, index) => (

                  <tr

                    key={row.id}
                    className="border-b border-gray-200 last:border-none hover:bg-gray-50">

                    <td className="text-center px-3 py-1 text-sm text-gray-700">
                      {(page - 1) * pageSize + index + 1}
                    </td>

                    <td className="text-center px-3 py-1 text-sm text-gray-700">
                      {row.standard}
                    </td>

                    <td className="text-center px-3 py-1 text-sm text-gray-700">
                      {row.division}
                    </td>

                    <td className="text-center px-3 py-1 text-sm text-gray-700">
                      {row.medium}
                    </td>

                    <td className="py-1.5">

                      <div className="flex justify-center gap-2">

                        <button
                          onClick={() => openEditModal(row)}
                          className="bg-blue-600 hover:bg-blue-700 text-white w-7 h-7 rounded flex items-center justify-center"
                        >
                          <EditOutlined />
                        </button>

                        <Popconfirm
                          title="Delete Class"
                          description="Are you sure?"
                          okText="Yes"
                          cancelText="No"
                          onConfirm={() => handleDelete(row.id)}
                        >
                          <button
                            className="border border-red-500 text-red-500 hover:bg-red-50 w-7 h-7 rounded flex items-center justify-center"
                          >
                            <DeleteOutlined />
                          </button>
                        </Popconfirm>

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

          <span className="text-sm text-gray-700">
            Total: {totalRecords}
          </span>

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
      {showModal && (
        <>
          {/* Background */}
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setShowModal(false)}
          />

          {/* Right Drawer */}
          <div className="fixed top-0 right-0 h-screen w-[360px] bg-white shadow-xl z-50 overflow-y-auto">

            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200">
              <button
                onClick={() => setShowModal(false)}
                className="text-2xl text-gray-500 hover:text-gray-700"
              >
                ×
              </button>

              <h2 className="text-lg font-semibold">
                {editId ? "Edit Class" : "Add New Class"}
              </h2>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">

              {/* Standard */}
              <div>
                <label className="block mb-2">
                  <span className="text-red-500">*</span> Standard
                </label>

                <select
                  name="standard"
                  value={form.standard}
                  onChange={handleChange}
                  className="w-full h-10 border border-gray-300 rounded-md px-3"
                  required
                >
                  <option value="">Select Standard</option>

                  {standards.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              {/* Division */}
              <div>
                <label className="block mb-2">
                  <span className="text-red-500">*</span> Division
                </label>

                <select
                  name="division"
                  value={form.division}
                  onChange={handleChange}
                  className="w-full h-10 border border-gray-300 rounded-md px-3"
                  required
                >
                  <option value="">Select Division</option>

                  {divisions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              {/* Medium */}
              <div>
                <label className="block mb-2">
                  <span className="text-red-500">*</span> Medium
                </label>

                <select
                  name="medium"
                  value={form.medium}
                  onChange={handleChange}
                  className="w-full h-10 border border-gray-300 rounded-md px-3"
                  required
                >
                  <option value="">Select Medium</option>

                  {mediums.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md"
              >
                {editId ? "Update" : "Add"}
              </button>

            </form>
          </div>
        </>
      )}

    </div>
  );
};

export default ClassMaster;


