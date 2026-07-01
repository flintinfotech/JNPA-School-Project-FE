import SchoolLogo from "../assets/SchoolLogo.avif";
import Admission1 from "../assets/Admission1.jpg";
import { useNavigate } from "react-router-dom";

const processSteps = [
  { step: "01", title: "Enquiry", desc: "Submit an enquiry online or visit the school office to learn about seat availability for Primary grades." },
  { step: "02", title: "Application Form", desc: "Fill out the admission form with required documents within the announced window." },
  { step: "03", title: "Document Verification", desc: "Original documents including previous school records are verified before confirmation." },
  { step: "04", title: "Fee Payment", desc: "Complete the admission fee payment to secure your child's seat." },
  { step: "05", title: "Confirmation", desc: "Receive your confirmation letter with orientation and academic calendar details." },
];

const eligibility = [
  { grade: "Grade 1", criteria: "Child must complete 6 years by 1st June of the academic year" },
  { grade: "Grade 2", criteria: "Passed Grade 1 with satisfactory report card" },
  { grade: "Grade 3", criteria: "Passed Grade 2 with satisfactory report card" },
  { grade: "Grade 4", criteria: "Passed Grade 3 with satisfactory report card" },
];

const importantDates = [
  { label: "Registration Opens", date: "1st November 2026" },
  { label: "Registration Closes", date: "15th December 2026" },
  { label: "Assessment Dates", date: "6th - 10th January 2027" },
  { label: "Result Announcement", date: "20th January 2027" },
  { label: "Fee Payment Deadline", date: "31st January 2027" },
];

const documents = [
  "Birth Certificate (original + photocopy)",
  "Aadhar Card of the child and parents",
  "Address Proof (utility bill / rental agreement)",
  "4 passport size photographs of the child",
  "Transfer Certificate from previous school",
  "Previous year's report card",
];

export default function AdmissionPrimary() {
  const navigate = useNavigate();

  return (
    <div className="adm-pr-page" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        @media (max-width: 768px) {
          .adm-pr-page .adm-header-inner { padding: 14px 20px 0 !important; }
          .adm-pr-page .adm-header-inner img { height: 56px !important; }
          .adm-pr-page .adm-title-wrap { padding: 0 20px 18px !important; }
          .adm-pr-page .adm-title-wrap h1 { font-size: 24px !important; }
          .adm-pr-page .adm-hero-wrap { width: 92% !important; margin: -16px auto 14px !important; }
          .adm-pr-page .adm-hero-wrap img { max-height: 200px !important; }
          .adm-pr-page .adm-section { padding: 32px 20px !important; }
          .adm-pr-page .adm-process-grid { grid-template-columns: 1fr !important; }
          .adm-pr-page .adm-split { grid-template-columns: 1fr !important; gap: 28px !important; }
          .adm-pr-page .adm-bottom-cta { padding: 36px 20px !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: "#1569ad", position: "relative" }}>
        <div className="adm-header-inner" style={{ maxWidth: "1200px", margin: "0 auto", padding: "18px 40px 0" }}>
          <img src={SchoolLogo} alt="JNPV Logo" style={{ height: "78px", width: "auto", display: "block" }} />
        </div>
        <div className="adm-title-wrap" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 40px 26px" }}>
          <button
            onClick={() => navigate("/admissions")}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", fontSize: "13px", cursor: "pointer", padding: 0, marginBottom: "8px" }}
          >
            ← Back to Admissions
          </button>
          <h1 style={{ color: "#fff", fontSize: "34px", fontWeight: 500, margin: 0 }}>Primary Admissions</h1>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "14px", marginTop: "6px" }}>
            Grade 1 · Grade 2 · Grade 3 · Grade 4
          </p>
        </div>
      </div>

      {/* Hero */}
      <div className="adm-hero-wrap" style={{ width: "79%", margin: "-25px auto 20px", overflow: "hidden", position: "relative", zIndex: 10 }}>
        <img src={Admission1} alt="JNPV Campus" style={{ width: "100%", display: "block", maxHeight: "400px", objectFit: "cover" }} />
      </div>

      {/* Process */}
      <div className="adm-section" style={{ padding: "50px 80px", background: "#fffbee" }}>
        <h2 style={{ color: "#1a3a6b", fontSize: "24px", fontWeight: 800, marginBottom: "32px", textAlign: "center" }}>Admission Process</h2>
        <div className="adm-process-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
          {processSteps.map((s) => (
            <div key={s.step} style={{ background: "#fff", borderRadius: "6px", padding: "24px", boxShadow: "0 4px 14px rgba(0,0,0,0.06)", borderLeft: "4px solid #1569ad" }}>
              <div style={{ color: "#1569ad", fontSize: "22px", fontWeight: 800, marginBottom: "8px" }}>{s.step}</div>
              <h3 style={{ color: "#1a3a6b", fontSize: "15px", fontWeight: 700, marginBottom: "8px" }}>{s.title}</h3>
              <p style={{ color: "#555", fontSize: "13px", lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Eligibility + Dates */}
      <div className="adm-section" style={{ padding: "50px 80px" }}>
        <div className="adm-split" style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "48px" }}>
          <div>
            <h2 style={{ color: "#1a3a6b", fontSize: "20px", fontWeight: 800, marginBottom: "18px" }}>Eligibility Criteria</h2>
            <div style={{ border: "1px solid rgba(26,58,107,0.12)", borderRadius: "6px", overflow: "hidden" }}>
              {eligibility.map((row, i) => (
                <div key={row.grade} style={{ display: "flex", padding: "14px 18px", background: i % 2 === 0 ? "#fff" : "#fffbee", fontSize: "13px" }}>
                  <div style={{ width: "110px", flexShrink: 0, color: "#1a3a6b", fontWeight: 700 }}>{row.grade}</div>
                  <div style={{ color: "#555" }}>{row.criteria}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 style={{ color: "#1a3a6b", fontSize: "20px", fontWeight: 800, marginBottom: "18px" }}>Important Dates</h2>
            <div style={{ background: "#1569ad", borderRadius: "6px", padding: "8px 0" }}>
              {importantDates.map((d) => (
                <div key={d.label} style={{ display: "flex", justifyContent: "space-between", padding: "13px 20px", borderBottom: "1px solid rgba(255,255,255,0.12)", fontSize: "13px" }}>
                  <span style={{ color: "rgba(255,255,255,0.85)" }}>{d.label}</span>
                  <span style={{ color: "#ffe08a", fontWeight: 700 }}>{d.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="adm-section" style={{ padding: "50px 80px", background: "#fffbee" }}>
        <h2 style={{ color: "#1a3a6b", fontSize: "20px", fontWeight: 800, marginBottom: "20px" }}>Documents Required</h2>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" }}>
          {documents.map((doc) => (
            <li key={doc} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "14px", color: "#333", background: "#fff", padding: "14px 16px", borderRadius: "6px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              <span style={{ color: "#1569ad", fontWeight: 800, fontSize: "16px", lineHeight: 1 }}>✓</span>
              {doc}
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom CTA */}
      <div className="adm-bottom-cta" style={{ padding: "50px 80px", background: "#1569ad", textAlign: "center" }}>
        <h2 style={{ color: "#fff", fontSize: "22px", fontWeight: 800, marginBottom: "10px" }}>Ready to Begin?</h2>
        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "14px", marginBottom: "22px" }}>
          Contact our admissions office to get started with your Primary application.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "14px", flexWrap: "wrap" }}>
          <button style={{ background: "#fff", color: "#1569ad", border: "none", padding: "12px 28px", fontSize: "13px", fontWeight: 800, letterSpacing: "0.5px", textTransform: "uppercase", borderRadius: "4px", cursor: "pointer" }}>
            Download Brochure
          </button>
          <button
            onClick={() => navigate("/admissions")}
            style={{ background: "transparent", color: "#fff", border: "2px solid #fff", padding: "12px 28px", fontSize: "13px", fontWeight: 800, letterSpacing: "0.5px", textTransform: "uppercase", borderRadius: "4px", cursor: "pointer" }}
          >
            ← Back to Admissions
          </button>
        </div>
      </div>
    </div>
  );
}