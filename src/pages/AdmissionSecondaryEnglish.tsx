import { useEffect, useState } from "react";
import SchoolLogo from "../assets/SchoolLogo.avif";
import Admission1 from "../assets/Admission1.jpg";
import { useNavigate } from "react-router-dom";
import { getAllAdmissionsByFilter } from "../services/AdmissionService";
import { saveAdmissionInquiry } from "../services/InquiryService";
import { message } from "antd";

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

export default function AdmissionSecondaryEnglish() {
  const navigate = useNavigate();

  const [processSteps, setProcessSteps] = useState<{ step: string; title: string; desc: string }[]>([]);
  const [eligibility, setEligibility] = useState<{ grade: string; criteria: string }[]>([]);
  const [importantDates, setImportantDates] = useState<{ label: string; date: string }[]>([]);
  const [documents, setDocuments] = useState<string[]>([]);
  const [brochure, setBrochure] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // const [successMessage, setSuccessMessage] = useState("");
  // ── Inquiry modal state ──────────────────────────────────────────────
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [InquiryForm, setInquiryForm] = useState({
    firstName: "",
    lastName: "",
    contactNumber: "",
    standard: "",
    medium: "",
  });
  const [InquiryStatus, setInquiryStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleInquiryChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setInquiryForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInquiryStatus("sending");

    try {
      await saveAdmissionInquiry({
        firstName: InquiryForm.firstName,
        lastName: InquiryForm.lastName,
        contactNumber: InquiryForm.contactNumber,
        standard: InquiryForm.standard,
        medium: InquiryForm.medium,
        status: "NEW",
      });

      // Show success message
      message.success("Inquiry submitted successfully!");

      // Reset form
      setInquiryForm({
        firstName: "",
        lastName: "",
        contactNumber: "",
        standard: "",
        medium: "",
      });

      setInquiryStatus("sent");

      // Close modal after 1 second
      setTimeout(() => {
        setShowInquiryModal(false);
        setInquiryStatus("idle");
      }, 1000);

    } catch (err) {
      console.error("Failed to send Inquiry:", err);
      message.error("Failed to submit inquiry.");
      setInquiryStatus("error");
    }
  };
  // ──────────────────────────────────────────────────────────────────────

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
            medium: "English",
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
          .adm-sec-page .adm-Inquiry-cta { padding: 40px 20px !important; }
          .adm-sec-page .adm-Inquiry-cta h2 { font-size: 24px !important; }
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

      {/* Admission Inquiry CTA */}
      <div
        className="adm-Inquiry-cta"
        style={{
          padding: "25px 80px",
          background: "linear-gradient(135deg, #1E66A8 0%, #983929 100%)",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          marginTop: "24px",
        }}
      >
        <div style={{ position: "relative", zIndex: 2, maxWidth: "800px", margin: "0 auto" }}>
          <div
            style={{
              display: "inline-block",
              color: "#F5A800",
              fontSize: "13px",
              fontWeight: 800,
              letterSpacing: "3px",
              textTransform: "uppercase",
              marginBottom: "18px",
            }}
          >
            Every Great Journey Starts Here
          </div>

          <h2 style={{ color: "#FFFFFF", fontSize: "38px", fontWeight: 800, marginBottom: "18px", lineHeight: "1.3" }}>
            Your Child's Future Begins With One Inquiry
          </h2>

          <button
            onClick={() => setShowInquiryModal(true)}
            style={{
              background: "#F5A800",
              color: "#1E66A8",
              border: "none",
              padding: "16px 42px",
              fontSize: "14px",
              fontWeight: 700,
              letterSpacing: "1px",
              textTransform: "uppercase",
              borderRadius: "50px",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 10px 30px rgba(245,168,0,0.35)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 15px 35px rgba(245,168,0,0.45)";
              e.currentTarget.style.background = "#FFD34D";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 10px 30px rgba(245,168,0,0.35)";
              e.currentTarget.style.background = "#F5A800";
            }}
          >
            Enquire Now →
          </button>
        </div>

        <div style={{ position: "absolute", top: "-80px", right: "-80px", width: "260px", height: "260px", borderRadius: "50%", background: "rgba(255,255,255,0.08)", zIndex: 1 }} />
        <div style={{ position: "absolute", bottom: "-100px", left: "-70px", width: "220px", height: "220px", borderRadius: "50%", background: "rgba(245,168,0,0.10)", zIndex: 1 }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "420px", height: "420px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.08)", zIndex: 1 }} />
      </div>

      {/* ── Admission Inquiry Modal ────────────────────────────────────── */}
      {showInquiryModal && (
        <div
          onClick={() => setShowInquiryModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: "10px",
              width: "100%",
              maxWidth: "560px",
              maxHeight: "90vh",
              overflowY: "auto",
              position: "relative",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            {/* Header */}
            <div
              style={{
                background: "#1f4d3d",
                padding: "24px 32px",
                borderRadius: "10px 10px 0 0",
                position: "relative",
              }}
            >
              <button
                onClick={() => setShowInquiryModal(false)}
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "20px",
                  background: "none",
                  border: "none",
                  color: "#fff",
                  fontSize: "22px",
                  cursor: "pointer",
                  lineHeight: 1,
                }}
                aria-label="Close"
              >
                ×
              </button>
              <h2 style={{ color: "#fff", fontSize: "20px", fontWeight: 800, margin: 0 }}>
                Admission Inquiry
              </h2>
              <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "13px", marginTop: "6px" }}>
                Fill in the details and our admissions team will get back to you.
              </p>
            </div>

            {/* Form */}
            <div style={{ padding: "28px 32px 32px" }}>
              <form onSubmit={handleInquirySubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#555", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "6px" }}>
                      First Name
                    </label>
                    <input
                      name="firstName"
                      type="text"
                      value={InquiryForm.firstName}
                      onChange={handleInquiryChange}
                      required
                      style={{ border: "1.5px solid #e0e0e0", borderRadius: "6px", padding: "10px 12px", fontSize: "13px", outline: "none" }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#555", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "6px" }}>
                      Last Name
                    </label>
                    <input
                      name="lastName"
                      type="text"
                      value={InquiryForm.lastName}
                      onChange={handleInquiryChange}
                      required
                      style={{ border: "1.5px solid #e0e0e0", borderRadius: "6px", padding: "10px 12px", fontSize: "13px", outline: "none" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#555", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "6px" }}>
                      Contact Number
                    </label>
                    <input
                      name="contactNumber"
                      type="tel"
                      value={InquiryForm.contactNumber}
                      onChange={handleInquiryChange}
                      required
                      style={{ border: "1.5px solid #e0e0e0", borderRadius: "6px", padding: "10px 12px", fontSize: "13px", outline: "none" }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#555", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "6px" }}>
                      Standard
                    </label>
                    <select
                      name="standard"
                      value={InquiryForm.standard}
                      onChange={handleInquiryChange}
                      required
                      style={{ border: "1.5px solid #e0e0e0", borderRadius: "6px", padding: "10px 12px", fontSize: "13px", outline: "none", background: "#fff" }}
                    >
                      <option value="">Select Standard</option>
                      <option value="Nursery">Nursery</option>
                      <option value="LKG">LKG</option>
                      <option value="UKG">UKG</option>
                      <option value="1st Standard">1st Standard</option>
                      <option value="2nd Standard">2nd Standard</option>
                      <option value="3rd Standard">3rd Standard</option>
                      <option value="4th Standard">4th Standard</option>
                      <option value="5th Standard">5th Standard</option>
                      <option value="6th Standard">6th Standard</option>
                      <option value="7th Standard">7th Standard</option>
                      <option value="8th Standard">8th Standard</option>
                      <option value="9th Standard">9th Standard</option>
                      <option value="10th Standard">10th Standard</option>
                      <option value="11th Standard">11th Standard</option>
                      <option value="12th Standard">12th Standard</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", marginBottom: "22px" }}>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#555", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "6px" }}>
                    Medium
                  </label>
                  <select
                    name="medium"
                    value={InquiryForm.medium}
                    onChange={handleInquiryChange}
                    required
                    style={{ border: "1.5px solid #e0e0e0", borderRadius: "6px", padding: "10px 12px", fontSize: "13px", outline: "none", background: "#fff" }}
                  >
                    <option value="">Select Medium</option>
                    <option value="English">English</option>
                    <option value="Marathi">Marathi</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={InquiryStatus === "sending"}
                >
                  {InquiryStatus === "sending"
                    ? "Submitting..."
                    : "Submit Inquiry"}
                </button>

                {/* {InquiryStatus === "sent" && (
                  <div style={{ marginTop: "14px", fontSize: "12px", fontWeight: 600, color: "#2e7d32", textAlign: "center" }}>
                    Inquiry submitted successfully! We'll be in touch soon.
                  </div>
                )} */}
                {InquiryStatus === "error" && (
                  <div style={{ marginTop: "14px", fontSize: "12px", fontWeight: 600, color: "#c62828", textAlign: "center" }}>
                    Something went wrong. Please try again.
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
      {/* ──────────────────────────────────────────────────────────────── */}
    </div>
  );
}
