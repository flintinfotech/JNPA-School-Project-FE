import Admission1 from "../assets/Admission1.jpg";
import SchoolLogo from "../assets/SchoolLogo.avif";
import { useNavigate } from "react-router-dom";

const sections = [
  {
    label: "Pre Primary",
    grades: ["Playgroup", "Nursery", "Junior KG (LKG)", "Senior KG (UKG)"],
    color: "#c0392b",
    route: "/admissions/pre-primary",
  },
  {
    label: "Primary",
    grades: ["1st Standard", "2nd Standard", "3rd Standard", "4th Standard"],
    color: "#1569ad", 
    route: "/admissions/primary",
  },
  {
    label: "Secondary",
    grades: ["5th Standard", "6th Standard", "7th Standard", "8th Standard", "9th Standard", "10th Standard"],
    color: "#1f4d3d",
    route: "/admissions/secondary",
  },
];

export default function Admissions() {
  const navigate = useNavigate();

  return (
    <div
      className="admissions-page"
      style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}
    >
      <style>{`
        @media (max-width: 768px) {
          .admissions-page .admissions-header-inner { padding: 14px 20px 0 !important; }
          .admissions-page .admissions-header-inner img { height: 56px !important; }
          .admissions-page .admissions-title-wrap { padding: 0 20px 18px !important; }
          .admissions-page .admissions-title-wrap h1 { font-size: 26px !important; }
          .admissions-page .admissions-hero-img-wrap { width: 92% !important; margin: -16px auto 14px !important; }
          .admissions-page .admissions-hero-img-wrap img { max-height: 220px !important; }
          .admissions-page .admissions-cards-grid { grid-template-columns: 1fr !important; gap: 20px !important; }
          .admissions-page .admissions-body { padding: 36px 20px !important; }
          .admissions-page .admissions-contact-box { padding: 24px 20px !important; flex-direction: column !important; gap: 14px !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: "#1569ad", position: "relative" }}>
        <div
          className="admissions-header-inner"
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "18px 40px 0",
          }}
        >
          <img
            src={SchoolLogo}
            alt="JNPV Logo"
            onClick={() => navigate("/")}
            style={{
              height: "78px",
              width: "auto",
              display: "block",
              cursor: "pointer",
            }}
          />
        </div>
        <div
          className="admissions-title-wrap"
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 40px 26px",
          }}
        >
          <h1
            style={{
              color: "#fff",
              fontSize: "34px",
              fontWeight: 500,
              margin: 0,
            }}
          >
            Admissions
          </h1>
        </div>
      </div>

      {/* Hero image */}
      <div
        className="admissions-hero-img-wrap"
        style={{
          width: "79%",
          margin: "-25px auto 20px",
          overflow: "hidden",
          position: "relative",
          zIndex: 10,
        }}
      >
        <img
          src={Admission1}
          alt="JNPV Campus"
          style={{
            width: "100%",
            display: "block",
            maxHeight: "460px",
            objectFit: "cover",
          }}
        />
      </div>

      {/* Body */}
      <div className="admissions-body" style={{ padding: "50px 80px" }}>
        <h2
          style={{
            color: "#1a3a6b",
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "2px",
            textTransform: "uppercase",
            marginBottom: "8px",
          }}
        >
          ADMISSIONS
        </h2>
        <p
          style={{
            color: "#333",
            fontSize: "20px",
            fontWeight: 500,
            marginBottom: "36px",
          }}
        >
          Admissions for Academic Year 2026 – 27
        </p>

        {/* 3 cards */}
        <div
          className="admissions-cards-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "28px",
            marginBottom: "48px",
          }}
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
                  style={{
                    width: "90px",
                    height: "90px",
                    objectFit: "contain",
                    display: "block",
                    margin: "0 auto 18px",
                  }}
                />

                <h3
                  style={{
                    color: "#fff",
                    fontSize: "20px",
                    fontWeight: 800,
                    marginBottom: "16px",
                    letterSpacing: "0.5px",
                  }}
                >
                  {s.label}
                </h3>

                <div style={{ marginBottom: "20px" }}>
                  {s.grades.map((g) => (
                    <p
                      key={g}
                      style={{
                        color: "rgba(255,255,255,0.9)",
                        fontSize: "15px",
                        margin: "4px 0",
                        fontWeight: 500,
                      }}
                    >
                      {g}
                    </p>
                  ))}
                </div>
              </div>

              {s.label === "Pre Primary" ? (
                <button
                  onClick={() => navigate("/admissions/pre-primary")}
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
                  }}
                >
                  Click Here to Proceed
                </button>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    width: "100%",
                    alignItems: "center",
                  }}
                >
                  <button
                    onClick={() =>
                      navigate(
                        s.label === "Primary"
                          ? "/admissions/primary/english"
                          : "/admissions/secondary/english"
                      )
                    }
                    style={{
                      background: "#fff",
                      color: s.color,
                      border: "2px solid #fff",
                      padding: "10px 24px",
                      borderRadius: "30px",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                      width: "220px",
                    }}
                  >
                    English Medium
                  </button>

                  <button
                    onClick={() =>
                      navigate(
                        s.label === "Primary"
                          ? "/admissions/primary/marathi"
                          : "/admissions/secondary/marathi"
                      )
                    }
                    style={{
                      background: "transparent",
                      color: "#fff",
                      border: "2px solid #fff",
                      padding: "10px 24px",
                      borderRadius: "30px",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                      width: "220px",
                    }}
                  >
                    मराठी माध्यम
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact box */}
        <div
          className="admissions-contact-box"
          style={{
            background: "#fef6e4",
            borderRadius: "8px",
            padding: "32px 40px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "24px",
          }}
        >
          <div>
            <h3
              style={{
                color: "#1569ad",
                fontSize: "18px",
                fontWeight: 700,
                marginBottom: "16px",
              }}
            >
              For admission enquiries, please contact:
            </h3>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                marginBottom: "12px",
              }}
            >
              <span style={{ color: "#f5a800", fontSize: "18px" }}>📍</span>
              <p
                style={{
                  color: "#444",
                  fontSize: "14px",
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                Admissions Office, JNPV Centre,
                <br />
                85, Chamarbaug Post Office Lane,
                <br />
                Dr. Ambedkar Road, Parel, Mumbai - 400012
              </p>
            </div>
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ color: "#f5a800", fontSize: "18px" }}>📞</span>
              <p style={{ color: "#444", fontSize: "14px", margin: 0 }}>
                022 43330000 (9:00 a.m. to 5:00 p.m.)
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ color: "#f5a800", fontSize: "18px" }}>✉️</span>
              <p style={{ color: "#444", fontSize: "14px", margin: 0 }}>
                admissions@jnpv.org
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
