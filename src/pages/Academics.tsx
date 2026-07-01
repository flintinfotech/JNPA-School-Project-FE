import Academics1 from "../assets/Academics1.webp";
import SchoolLogo from "../assets/SchoolLogo.avif";
import { useNavigate } from "react-router-dom";

const sections = [
  {
    label: "Primary School",
    grades: ["Grade I", "Grade II", "Grade III", "Grade IV"],
    color: "#1569ad",
    route: "/academics/primary",
  },
  {
    label: "Secondary School",
    grades: ["Grade V", "Grade VI", "Grade VII", "Grade VIII", "Grade IX", "Grade X"],
    color: "#1f4d3d",
    route: "/academics/secondary",
  },
];

const stats = [
  { label: "CBSE Affiliated", value: "100%" },
  { label: "Avg. Pass Percentage", value: "98%" },
  { label: "Subjects Offered", value: "20+" },
  { label: "Student-Teacher Ratio", value: "15:1" },
];

export default function Academics() {
  const navigate = useNavigate();

  return (
    <div className="academics-page" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        @media (max-width: 768px) {
          .academics-page .academics-header-inner { padding: 14px 20px 0 !important; }
          .academics-page .academics-header-inner img { height: 56px !important; }
          .academics-page .academics-title-wrap { padding: 0 20px 18px !important; }
          .academics-page .academics-title-wrap h1 { font-size: 26px !important; }
          .academics-page .academics-hero-img-wrap { width: 92% !important; margin: -16px auto 14px !important; }
          .academics-page .academics-hero-img-wrap img { max-height: 220px !important; }
          .academics-page .academics-stats-strip { padding: 24px 20px !important; grid-template-columns: repeat(2, 1fr) !important; }
          .academics-page .academics-body { padding: 36px 20px !important; }
          .academics-page .academics-cards-grid { grid-template-columns: 1fr !important; gap: 20px !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: "#1569ad", position: "relative" }}>
        <div className="academics-header-inner" style={{ maxWidth: "1200px", margin: "0 auto", padding: "18px 40px 0" }}>
          <img src={SchoolLogo} alt="JNPV Logo" style={{ height: "78px", width: "auto", display: "block" }} />
        </div>
        <div className="academics-title-wrap" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 40px 26px" }}>
          <h1 style={{ color: "#fff", fontSize: "34px", fontWeight: 500, margin: 0 }}>Academics</h1>
        </div>
      </div>

      {/* Hero image */}
      <div className="academics-hero-img-wrap" style={{ width: "79%", margin: "-25px auto 20px", overflow: "hidden", position: "relative", zIndex: 10 }}>
        <img src={Academics1} alt="JNPV Campus" style={{ width: "100%", display: "block", maxHeight: "460px", objectFit: "cover" }} />
      </div>

      {/* Stats strip */}
      <div
        className="academics-stats-strip"
        style={{ background: "#f5a800", padding: "32px 80px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "20px", textAlign: "center" }}
      >
        {stats.map((stat) => (
          <div key={stat.label}>
            <div style={{ fontSize: "30px", fontWeight: 800, color: "#1a3a6b" }}>{stat.value}</div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#1a3a6b", letterSpacing: "0.5px", marginTop: "4px" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="academics-body" style={{ padding: "50px 80px" }}>
        <h2 style={{ color: "#1a3a6b", fontSize: "13px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>
          ACADEMICS
        </h2>
        <p style={{ color: "#333", fontSize: "20px", fontWeight: 500, marginBottom: "36px" }}>
          Our Curriculum — Academic Year 2026–27
        </p>

        {/* 3 cards */}
        <div
          className="academics-cards-grid"
          style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "28px" }}
        >
          {sections.map((s) => (
            <div
              key={s.label}
              style={{
                background: s.color,
                borderRadius: "8px",
                padding: "40px 28px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                minHeight: "340px",
                justifyContent: "space-between",
              }}
            >
              <div>
                <img
                  src={SchoolLogo}
                  alt="JNPV Logo"
                  style={{ width: "90px", height: "90px", objectFit: "contain", display: "block", margin: "0 auto 18px" }}
                />
                <h3 style={{ color: "#fff", fontSize: "20px", fontWeight: 800, marginBottom: "16px", letterSpacing: "0.5px" }}>
                  {s.label}
                </h3>
                <div style={{ marginBottom: "20px" }}>
                  {s.grades.map((g) => (
                    <p key={g} style={{ color: "rgba(255,255,255,0.9)", fontSize: "15px", margin: "4px 0", fontWeight: 500 }}>
                      {g}
                    </p>
                  ))}
                </div>
              </div>
              <button
                onClick={() => navigate(s.route)}
                style={{
                  background: "transparent",
                  border: "2px solid #fff",
                  color: "#fff",
                  padding: "11px 28px",
                  borderRadius: "30px",
                  fontSize: "13px",
                  fontWeight: 700,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "background 0.2s, color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#fff";
                  e.currentTarget.style.color = s.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#fff";
                }}
              >
                Click Here to Proceed
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}