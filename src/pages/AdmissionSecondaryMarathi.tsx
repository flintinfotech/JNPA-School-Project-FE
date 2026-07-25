import { useEffect, useState } from "react";
import SchoolLogo from "../assets/SchoolLogo.avif";
import Admission1 from "../assets/Admission1.jpg";
import { useNavigate } from "react-router-dom";
import { getAllAdmissionsByFilter } from "../services/AdmissionService";

// ---------------------------------------------------------------------------
// base64 -> blob preview helpers (same approach as AdmissionAdmin)
// ---------------------------------------------------------------------------
const base64ToByteArray = (base64: string): Uint8Array => {
  const cleaned = base64.includes(",") && base64.trim().startsWith("data:")
    ? base64.split(",")[1]
    : base64;

  const byteCharacters = atob(cleaned);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  return new Uint8Array(byteNumbers);
};

const detectMimeType = (bytes: Uint8Array): string => {
  const hex = Array.from(bytes.slice(0, 4))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (hex.startsWith("25504446")) return "application/pdf";
  if (hex.startsWith("89504e47")) return "image/png";
  if (hex.startsWith("ffd8ff")) return "image/jpeg";
  if (hex.startsWith("47494638")) return "image/gif";
  return "application/octet-stream";
};

export default function AdmissionSecondarMarathi() {
  const navigate = useNavigate();

  const [processSteps, setProcessSteps] = useState<{ step: string; title: string; desc: string }[]>([]);
  const [eligibility, setEligibility] = useState<{ grade: string; criteria: string }[]>([]);
  const [importantDates, setImportantDates] = useState<{ label: string; date: string }[]>([]);
  const [documents, setDocuments] = useState<string[]>([]);
  const [brochure, setBrochure] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchAdmissions() {
      try {
        setLoading(true);

        const res = await getAllAdmissionsByFilter(
          0,
          10,
          {
            classRoomName: "Secondary",
            medium: "Marathi",
          },
          controller.signal
        );

        const list = res.data?.data?.AdmissionDTOS ?? [];
        const existing = list[0] ?? null;

        if (existing) {
          setProcessSteps(
            (existing.admissionProcessDTOS ?? [])
              .slice()
              .sort((a: any, b: any) => Number(a.stepNo) - Number(b.stepNo))
              .map((p: any) => ({
                step: p.stepNo,
                title: p.heading,
                desc: p.description,
              }))
          );

          setEligibility(
            (existing.eligibilityCriteriaDTOS ?? []).map((e: any) => ({
              grade: e.title,
              criteria: e.description,
            }))
          );

          setImportantDates(
            (existing.importantDateDTOS ?? []).map((d: any) => ({
              label: d.eventName,
              date: d.eventDate,
            }))
          );

          setDocuments(
            (existing.requiredDocumentDTOS ?? []).map(
              (r: any) => r.documentName
            )
          );

          setBrochure(existing.brochure ?? null);
        }
      } catch (err: any) {
        if (
          err.name !== "CanceledError" &&
          err.code !== "ERR_CANCELED"
        ) {
          console.error("Failed to fetch admissions:", err);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchAdmissions();

    return () => controller.abort();
  }, []);

  const handleBrochurePreview = () => {
    if (!brochure) return;
    const byteArray = base64ToByteArray(brochure);
    const mimeType = detectMimeType(byteArray);
    const blob = new Blob([byteArray], { type: mimeType });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  return (
    <div className="adm-sec-page" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        @media (max-width: 768px) {
          .adm-sec-page .adm-header-inner { padding: 14px 20px 0 !important; }
          .adm-sec-page .adm-header-inner img { height: 56px !important; }
          .adm-sec-page .adm-title-wrap { padding: 0 20px 18px !important; }
          .adm-sec-page .adm-title-wrap h1 { font-size: 24px !important; }
          .adm-sec-page .adm-hero-wrap { width: 92% !important; margin: -16px auto 14px !important; }
          .adm-sec-page .adm-hero-wrap img { max-height: 200px !important; }
          .adm-sec-page .adm-section { padding: 32px 20px !important; }
          .adm-sec-page .adm-process-grid { grid-template-columns: 1fr !important; }
          .adm-sec-page .adm-split { grid-template-columns: 1fr !important; gap: 28px !important; }
          .adm-sec-page .adm-bottom-cta { padding: 36px 20px !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: "#1f4d3d", position: "relative" }}>
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
          <h1 style={{ color: "#fff", fontSize: "34px", fontWeight: 500, margin: 0 }}>Secondary Admissions</h1>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "14px", marginTop: "6px" }}>
            5th Standard · 6th Standard · 7th Standard · 8th Standard · 9th Standard · 10th Standard
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
            <div key={s.step} style={{ background: "#fff", borderRadius: "6px", padding: "24px", boxShadow: "0 4px 14px rgba(0,0,0,0.06)", borderLeft: "4px solid #1f4d3d" }}>
              <div style={{ color: "#1f4d3d", fontSize: "22px", fontWeight: 800, marginBottom: "8px" }}>{s.step}</div>
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
                  <div style={{ width: "100px", flexShrink: 0, color: "#1a3a6b", fontWeight: 700 }}>{row.grade}</div>
                  <div style={{ color: "#555" }}>{row.criteria}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 style={{ color: "#1a3a6b", fontSize: "20px", fontWeight: 800, marginBottom: "18px" }}>Important Dates</h2>
            <div style={{ background: "#1f4d3d", borderRadius: "6px", padding: "8px 0" }}>
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
              <span style={{ color: "#1f4d3d", fontWeight: 800, fontSize: "16px", lineHeight: 1 }}>✓</span>
              {doc}
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom CTA */}
      <div className="adm-bottom-cta" style={{ padding: "50px 80px", background: "#1f4d3d", textAlign: "center" }}>
        <h2 style={{ color: "#fff", fontSize: "22px", fontWeight: 800, marginBottom: "10px" }}>Ready to Begin?</h2>
        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "14px", marginBottom: "22px" }}>
          Contact our admissions office to get started with your Secondary application.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "14px", flexWrap: "wrap" }}>
          <button
            onClick={handleBrochurePreview}
            disabled={!brochure}
            style={{ background: "#fff", color: "#1f4d3d", border: "none", padding: "12px 28px", fontSize: "13px", fontWeight: 800, letterSpacing: "0.5px", textTransform: "uppercase", borderRadius: "4px", cursor: brochure ? "pointer" : "not-allowed", opacity: brochure ? 1 : 0.6 }}
          >
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