import React, { useEffect,useState } from "react";
import { Pencil, Trash2, Plus,  } from "lucide-react";
import {
  saveClassMaster,
  getAllClassMaster,
  getClassMasterById,
  updateClassMaster,
  deleteClassMaster,
  getAllStaticData,
} from "../services/classMasterService";
import { message,Popconfirm } from "antd";

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
  const [classes, setClasses] = useState<ClassMasterModel[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [page, setPage] = useState(1);
  const [standards, setStandards] = useState<string[]>([]);
const [divisions, setDivisions] = useState<string[]>([]);
const [mediums, setMediums] = useState<string[]>([]);
  const pageSize = 5;
  
  const fetchClassMaster = () => {
  getAllClassMaster(0, 10)
    .then((response) => {
      console.log("API Response:", response.data);

      if (response.data.success) {
        const classData = response.data.data.classMasterDTOS.map((item: any) => ({
          id: item.classMasterId,
          standard: item.standard,
          division: item.division,
          medium: item.medium,
        }));

        setClasses(classData);
      }
    })
    .catch((error) => {
      console.log("API Error:", error);
    });
};
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
      console.log("Static Data Error", error);
    });
};


  useEffect(() => {
  fetchClassMaster();
  fetchStaticData();
}, []);

  const totalPages = Math.max(1, Math.ceil(classes.length / pageSize));
  const paginated = classes.slice((page - 1) * pageSize, page * pageSize);

  const openAddModal = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (row: ClassMasterModel) => {
  getClassMasterById(row.id)
    .then((response) => {
      const data = response.data.data;

      setEditId(data.classMasterId);

      setForm({
        standard: data.standard,
        division: data.division,
        medium: data.medium,
      });

      setShowModal(true);
    })
    .catch((error) => {
      console.log(error);
      message.warning("Failed to fetch class details");
    });
};

  const handleDelete = (id: number) => {
  deleteClassMaster(id)
    .then((response) => {
      if (response.data.success) {
        message.success(response.data.message);

        setClasses((prev) => prev.filter((item) => item.id !== id));
      }
    })
    .catch((error) => {
      console.log(error);
      message.warning("Failed to delete class");
    });
};
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();

  if (!form.standard || !form.division || !form.medium) {
    message.warning("Please fill all fields");
    return;
  }

  // ================= UPDATE =================
  if (editId !== null) {
    const updatePayload = {
      classMasterId: editId,
      standard: form.standard,
      division: form.division,
      medium: form.medium,
      
    };

    updateClassMaster(updatePayload)
      .then((response) => {
        if (response.data.success) {
          message.success(response.data.message);

          fetchClassMaster(); // Refresh table

          setForm(emptyForm);
          setEditId(null);
          setShowModal(false);
        }
      })
      .catch((error) => {
        console.log(error);
        message.warning("Failed to update class");
      });

    return;
  }

  // ================= SAVE =================
  saveClassMaster(form)
  .then((response) => {

    if (response.data.success) {

      message.success(response.data.message);

      fetchClassMaster();

      setForm(emptyForm);
      setShowModal(false);

    } else {

      message.error(response.data.message);

    }

  })
  .catch((error) => {
    console.log(error);
    message.error("Something went wrong");
  });
};
const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

useEffect(() => {
  const handleResize = () => {
    setIsMobile(window.innerWidth < 768);
  };

  window.addEventListener("resize", handleResize);

  return () => window.removeEventListener("resize", handleResize);
}, []);
      if (isMobile) {
  return (
    <div className="space-y-3 p-4">

      {paginated.length === 0 && (
        <div className="text-center text-sm text-gray-400 py-6">
          No classes found
        </div>
      )}

      {paginated.map((row) => (
        <div
          key={row.id}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
        >
          <div className="flex justify-between items-start mb-2">

            <div>
              <p className="text-base font-semibold text-gray-800">
                {row.standard}
              </p>

              <p className="text-sm text-gray-500">
                Division : {row.division}
              </p>
            </div>

            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium">
              {row.medium}
            </span>

          </div>

          <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">

            <button
              onClick={() => openEditModal(row)}
              className="bg-blue-600 text-white p-2 rounded"
            >
              <Pencil size={16} />
            </button>

            <button
              onClick={() => handleDelete(row.id)}
              className="border border-red-400 text-red-500 p-2 rounded"
            >
              <Trash2 size={16} />
            </button>

          </div>
        </div>
      ))}

      <div className="flex items-center justify-between pt-2">
        <span className="text-sm text-gray-600">
          Total : {classes.length}
        </span>

        <div className="flex gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="border px-3 py-1 rounded disabled:opacity-40"
          >
            Prev
          </button>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="border px-3 py-1 rounded disabled:opacity-40"
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
    {/* //   <div className="flex items-center justify-between bg-[#c0553a] px-6 py-4">
    //     <h1 className="text-white text-xl font-semibold">Class Master</h1>
    //     <UserCircle className="text-white" size={32} />
    //   </div> */}

      <div className="px-6 pt-2 pb-6">
        <div className="flex justify-end mb-4">
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition"
          >
            <Plus size={16} /> Add Class
          </button>
        </div>

        <div className="bg-white rounded-md shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              
                <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-sm font-semibold text-gray-700">Standard</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700">Division</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700">Medium</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((row) => (
                <tr key={row.id}className="border-b border-gray-200 last:border-none">
                  <td className="px-4 py-3 text-sm text-gray-800">{row.standard}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{row.division}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{row.medium}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(row)}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded"
                        aria-label="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <Popconfirm
                           title="Delete Class"
                           description="Are you sure you want to delete this class?"
                           onConfirm={() => handleDelete(row.id)}
                           okText="Yes"
                            cancelText="No"
                        >
                       <button
                        className="border border-red-400 text-red-500 hover:bg-red-50 p-1.5 rounded"
                           aria-label="Delete"
                           >
                          <Trash2 size={14} />
                          </button>
                      </Popconfirm>
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-400 text-sm">
                    No classes found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-600">Total: {classes.length}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center rounded border text-gray-500 disabled:opacity-40"
            >
              &lt;
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 flex items-center justify-center rounded border text-sm ${
                  p === page ? "bg-blue-600 text-white border-blue-600" : "text-gray-600"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded border text-gray-500 disabled:opacity-40"
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
    ></div>

    {/* Right Drawer */}
    <div className="fixed top-0 right-0 h-screen w-[360px] bg-white shadow-xl z-50 overflow-y-auto">

      {/* Header */}
      <div className="flex  items-center gap-3 px-5 py-4 border-b border-gray-200">
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

      <form
         onSubmit={handleSubmit}
            className="p-4 space-y-4">

        <div>

            <label className="block mb-2  ">
            <span className="text-red-500">*</span> Standard
            </label>

           <select
            name="standard"
            value={form.standard}
            onChange={handleChange}
            className="w-full h-[40px] border border-gray-300 rounded-md px-3"
            required>
             <option value="">Select Standard</option>

{standards.map((item) => (
  <option key={item} value={item}>
    {item}
  </option>
))}
            </select>

        </div>

        <div>

           <label className="block mb-2">
            <span className="text-red-500">*</span> Division
              </label>

          {/* <input
            name="division"
            value={form.division}
            onChange={handleChange}
            placeholder="Enter Division"
            className="w-full h-[40px] border border-gray-300 rounded-md px-3"
            required
          /> */}
          <select
            name="division"
            value={form.division}
            onChange={handleChange}
            className="w-full h-[40px] border border-gray-300 rounded-md px-3"
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

        <div>

          <label className="block mb-2">
            <span className="text-red-500">*</span> Medium
          </label>

          <select
            name="medium"
            value={form.medium}
            onChange={handleChange}
            className="w-full h-[40px] border border-gray-300 rounded-md px-3"
            required
          >
         <option value="">Select Medium</option>

{mediums.map((item) => (
  <option key={item} value={item}>
    {item}
  </option>
))}
            {/* <option value="Hindi">Hindi</option> */}
            {/* <option value="Semi-English">Semi-English</option> */}
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

      {/* {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-md shadow-lg w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">
              {editId !== null ? "Edit Class" : "Add Class"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Standard</label>
                <input
                  name="standard"
                  value={form.standard}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="e.g. 10"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Division</label>
                <input
                  name="division"
                  value={form.division}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="e.g. A"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Medium</label>
                <select
                  name="medium"
                  value={form.medium}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                  required
                >
                  <option value="">Select medium</option>
                  <option value="English">English</option>
                  <option value="Marathi">Marathi</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Semi-English">Semi-English</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm rounded border text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {editId !== null ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )} */}
      
        
    </div>
  );
};

export default ClassMaster;