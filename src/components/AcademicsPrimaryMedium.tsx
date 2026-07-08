import { useNavigate } from "react-router-dom";

export default function AcademicsPrimaryMedium() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "70vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "30px",
      }}
    >
      <button
        onClick={() => navigate("/academics/primary/english")}
      >
        English Medium
      </button>

      <button
        onClick={() => navigate("/academics/primary/marathi")}
      >
        Marathi Medium
      </button>
    </div>
  );
}