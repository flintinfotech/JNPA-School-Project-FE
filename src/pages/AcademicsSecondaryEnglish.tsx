import Academics1 from "../assets/Academics1.webp";
import Academics2 from "../assets/Academics2.webp";
import SchoolLogo from "../assets/SchoolLogo.avif";
import { useNavigate } from "react-router-dom";

const streams = [
  {
    name: "Science",
    subjects: ["Physics", "Chemistry", "Biology / Computer Science", "Mathematics", "English"],
    desc: "Prepares students for engineering, medicine, and research. Strong lab component and competitive exam coaching for JEE and NEET.",
  },
  {
    name: "Commerce",
    subjects: ["Accountancy", "Business Studies", "Economics", "Mathematics / IP", "English"],
    desc: "Ideal for students aiming for CA, MBA, or undergraduate business programs. Focus on financial literacy and analytical skills.",
  },
  {
    name: "Humanities",
    subjects: ["History", "Political Science", "Geography / Psychology", "Economics", "English"],
    desc: "Suited for students interested in law, journalism, design, and social sciences. Develops critical thinking and communication skills.",
  },
];

const highlights = [
  "Dedicated board exam preparation with mock tests and revision schedules",
  "Career counselling and university guidance from Grade XI",
  "Individual mentoring for competitive exams — JEE, NEET, CLAT",
  "Guest lectures by professionals across fields",
  "Lab-based practicals for all Science stream students",
  "100% board exam results over the last 5 consecutive years",
];

const stats = [
  { label: "CBSE Affiliated", value: "100%" },
  { label: "Avg. Pass Percentage", value: "98%" },
  { label: "Subjects Offered", value: "20+" },
  { label: "Student-Teacher Ratio", value: "15:1" },
];

export default function AcademicsSecondaryEnglish() {
  const navigate = useNavigate();

  return (
    <div className="acad-sec-page" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        @media (max-width: 768px) {
          .acad-sec-page .acad-header-inner { padding: 14px 20px 0 !important; }
          .acad-sec-page .acad-header-inner img { height: 56px !important; }
          .acad-sec-page .acad-title-wrap { padding: 0 20px 18px !important; }
          .acad-sec-page .acad-title-wrap h1 { font-size: 24px !important; }
          .acad-sec-page .acad-hero-wrap { width: 92% !important; margin: -16px auto 14px !important; }
          .acad-sec-page .acad-hero-wrap img { max-height: 200px !important; }
          .acad-sec-page .acad-section { padding: 32px 20px !important; }
          .acad-sec-page .acad-streams-grid { grid-template-columns: 1fr !important; }
          .acad-sec-page .acad-split { grid-template-columns: 1fr !important; gap: 28px !important; }
          .acad-sec-page .academics-stats-strip { padding: 24px 20px !important; grid-template-columns: repeat(2, 1fr) !important; }
          .acad-sec-page .acad-banner { height: 260px !important; }
          .acad-sec-page .acad-banner-overlay { padding: 24px 20px !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: "#1f4d3d", position: "relative" }}>
        <div className="acad-header-inner" style={{ maxWidth: "1200px", margin: "0 auto", padding: "18px 40px 0" }}>
          <img src={SchoolLogo} alt="JNPV Logo" style={{ height: "78px", width: "auto", display: "block" }} />
        </div>
        <div className="acad-title-wrap" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 40px 26px" }}>
          <button onClick={() => navigate("/academics")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", fontSize: "13px", cursor: "pointer", padding: 0, marginBottom: "8px" }}>
            ← Back to Academics
          </button>
          <h1 style={{ color: "#fff", fontSize: "34px", fontWeight: 500, margin: 0 }}>Secondary School</h1>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "14px", marginTop: "6px" }}>
            Grade V · Grade VI · Grade VII · Grade VIII · Grade IX · Grade X
          </p>
        </div>
      </div>

      {/* Hero */}
      <div className="acad-hero-wrap" style={{ width: "79%", margin: "-25px auto 20px", overflow: "hidden", position: "relative", zIndex: 10 }}>
        <img src={Academics1} alt="JNPV Secondary School" style={{ width: "100%", display: "block", maxHeight: "400px", objectFit: "cover" }} />
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

      {/* Streams */}
      <div className="acad-section" style={{ padding: "50px 80px", background: "#fffbee" }}>
        <h2 style={{ color: "#1a3a6b", fontSize: "24px", fontWeight: 800, marginBottom: "10px", textAlign: "center" }}>Streams Available</h2>
        <p style={{ color: "#777", fontSize: "14px", textAlign: "center", marginBottom: "36px" }}>
          Choose a stream that aligns with your goals and strengths
        </p>
        <div className="acad-streams-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "24px" }}>
          {streams.map((s) => (
            <div key={s.name} style={{ background: "#fff", borderTop: "4px solid #1f4d3d", borderRadius: "6px", padding: "28px", boxShadow: "0 4px 14px rgba(0,0,0,0.06)" }}>
              <h3 style={{ color: "#1f4d3d", fontSize: "18px", fontWeight: 800, marginBottom: "12px" }}>{s.name}</h3>
              <ul style={{ margin: "0 0 14px", padding: "0 0 0 16px", color: "#555", fontSize: "13px", lineHeight: 1.8 }}>
                {s.subjects.map((sub) => <li key={sub}>{sub}</li>)}
              </ul>
              <p style={{ color: "#777", fontSize: "13px", lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Highlights + image */}
      <div className="acad-section" style={{ padding: "50px 80px" }}>
        <div className="acad-split" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "center" }}>
          <div>
            <h2 style={{ color: "#1a3a6b", fontSize: "22px", fontWeight: 800, marginBottom: "18px" }}>What Makes It Special</h2>
            <p style={{ color: "#555", fontSize: "14px", lineHeight: 1.7, marginBottom: "20px" }}>
              Secondary School at JNPV is where preparation meets ambition. Our dedicated faculty, structured revision programs, and individual mentoring ensure every student is ready — not just for board exams, but for the challenges ahead.
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {highlights.map((h) => (
                <li key={h} style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "12px", fontSize: "14px", color: "#333" }}>
                  <span style={{ color: "#1f4d3d", fontWeight: 800, fontSize: "16px", lineHeight: 1 }}>✓</span>
                  {h}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ borderRadius: "8px", overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>
            <img src={Academics2} alt="Secondary School students" style={{ width: "100%", display: "block", objectFit: "cover" }} />
          </div>
        </div>
      </div>

      {/* Banner */}
      <div className="acad-banner" style={{ position: "relative", height: "320px", overflow: "hidden" }}>
        <img src={Academics1} alt="JNPV Senior" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <div className="acad-banner-overlay" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(180deg, rgba(31,77,61,0.2) 0%, rgba(31,77,61,0.88) 100%)", display: "flex", alignItems: "flex-end", padding: "40px 80px" }}>
          <div>
            <h2 style={{ color: "#fff", fontSize: "24px", fontWeight: 800, margin: "0 0 8px" }}>Prepared for What Comes Next</h2>
            <p style={{ color: "#d1fae5", fontSize: "14px", maxWidth: "560px", margin: 0, lineHeight: 1.6 }}>
              Our Secondary School students leave JNPV not just with strong results but with the confidence, values, and vision to succeed at university and in life.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div style={{ padding: "50px 80px", background: "#1f4d3d", textAlign: "center" }}>
        <h2 style={{ color: "#fff", fontSize: "22px", fontWeight: 800, marginBottom: "10px" }}>Want to Know More?</h2>
        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "14px", marginBottom: "22px" }}>
          Reach out to our academic team for more details about Secondary School streams and preparation.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "14px", flexWrap: "wrap" }}>
          <button style={{ background: "#fff", color: "#1f4d3d", border: "none", padding: "12px 28px", fontSize: "13px", fontWeight: 800, letterSpacing: "0.5px", textTransform: "uppercase", borderRadius: "4px", cursor: "pointer" }}>
            Download Brochure
          </button>
          <button onClick={() => navigate("/academics")} style={{ background: "transparent", color: "#fff", border: "2px solid #fff", padding: "12px 28px", fontSize: "13px", fontWeight: 800, letterSpacing: "0.5px", textTransform: "uppercase", borderRadius: "4px", cursor: "pointer" }}>
            ← Back to Academics
          </button>
        </div>
      </div>
    </div>
  );
}