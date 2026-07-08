import { useNavigate } from "react-router-dom";

export default function AcademicsSecondaryMedium() {
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
        onClick={() => navigate("/academics/secondary/english")}
      >
        English Medium
      </button>

      <button
        onClick={() => navigate("/academics/secondary/marathi")}
      >
        Marathi Medium
      </button>
    </div>
  );
}