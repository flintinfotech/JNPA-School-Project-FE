import Admission1 from "../assets/Admission1.jpg";
import Admission2 from "../assets/Admission2.webp";
import SchoolLogo from "../assets/SchoolLogo.avif";

const processSteps = [
  {
    step: "01",
    title: "Enquiry",
    desc: "Submit an enquiry online or visit the school office to learn about available seats and grade-wise requirements.",
  },
  {
    step: "02",
    title: "Application Form",
    desc: "Fill out and submit the admission form along with the required documents within the announced window.",
  },
  {
    step: "03",
    title: "Document Verification",
    desc: "Original documents are verified at the school office before the admission is confirmed.",
  },
  {
    step: "04",
    title: "Fee Payment",
    desc: "Complete the admission fee payment to secure your child's seat for the academic year.",
  },
  {
    step: "05",
    title: "Confirmation",
    desc: "Receive your confirmation letter and welcome kit, and join us for the orientation session.",
  },
];

const eligibility = [
  { grade: "Nursery", criteria: "Child must complete 3 years by 1st June of the academic year" },
  { grade: "LKG", criteria: "Child must complete 4 years by 1st June of the academic year" },
  { grade: "UKG", criteria: "Child must complete 5 years by 1st June of the academic year" },
  { grade: "Grade I", criteria: "Child must complete 6 years by 1st June of the academic year" },
  { grade: "Grade II - VIII", criteria: "Based on previous school's transfer certificate and report card" },
  { grade: "Grade IX - XI", criteria: "Subject to seat availability and an academic assessment" },
];

const importantDates = [
  { label: "Registration Opens", date: "1st November 2026" },
  { label: "Registration Closes", date: "15th December 2026" },
  { label: "Entrance Interaction", date: "5th - 10th January 2027" },
  { label: "Result Announcement", date: "20th January 2027" },
  { label: "Fee Payment Deadline", date: "31st January 2027" },
];

const documents = [
  "Birth Certificate (original + photocopy)",
  "Aadhar Card of the child and parents",
  "Address Proof (utility bill / rental agreement)",
  "Passport size photographs of the child",
  "Transfer Certificate (for Grade II and above)",
  "Previous academic year's report card (if applicable)",
];

export default function Admissions() {
  return (
    <div className="admissions-page" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        /* ===== Mobile responsiveness ===== */
        @media (max-width: 768px) {
          .admissions-page .admissions-header-inner {
            padding: 14px 20px 0 !important;
          }
          .admissions-page .admissions-header-inner img {
            height: 56px !important;
          }
          .admissions-page .admissions-title-wrap {
            padding: 0 20px 18px !important;
          }
          .admissions-page .admissions-title-wrap h1 {
            font-size: 26px !important;
          }
          .admissions-page .admissions-hero-img-wrap {
            width: 92% !important;
            margin: -16px auto 14px !important;
          }
          .admissions-page .admissions-hero-img-wrap img {
            max-height: 220px !important;
          }
          .admissions-page .admissions-intro {
            padding: 36px 20px 24px !important;
          }
          .admissions-page .admissions-intro h2 {
            font-size: 21px !important;
          }
          .admissions-page .admissions-intro p {
            font-size: 14px !important;
          }
          .admissions-page .admissions-intro button {
            width: 100% !important;
            padding: 13px 20px !important;
          }
          .admissions-page .admissions-section {
            padding: 36px 20px !important;
          }
          .admissions-page .admissions-section-title {
            font-size: 21px !important;
            margin-bottom: 24px !important;
          }
          .admissions-page .admissions-process-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .admissions-page .admissions-split-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
          .admissions-page .admissions-eligibility-row {
            flex-direction: column !important;
            gap: 4px !important;
          }
          .admissions-page .admissions-eligibility-row > div:first-child {
            width: auto !important;
          }
          .admissions-page .admissions-docs-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .admissions-page .admissions-docs-grid > div:first-child {
            order: 2;
          }
          .admissions-page .admissions-docs-grid > div:last-child {
            order: 1;
          }
          .admissions-page .admissions-bottom-cta {
            padding: 40px 20px !important;
          }
          .admissions-page .admissions-bottom-cta h2 {
            font-size: 20px !important;
          }
        }

        @media (max-width: 460px) {
          .admissions-page .admissions-title-wrap h1 {
            font-size: 22px !important;
          }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: "#1569ad", position: "relative" }}>
        <div
          className="admissions-header-inner"
          style={{ maxWidth: "1200px", margin: "0 auto", padding: "18px 40px 0" }}
        >
          <img src={SchoolLogo} alt="JNPV Logo" style={{ height: "78px", width: "auto", display: "block" }} />
        </div>
        <div
          className="admissions-title-wrap"
          style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 40px 26px" }}
        >
          <h1 style={{ color: "#fff", fontSize: "34px", fontWeight: 500, margin: 0 }}>Admissions</h1>
        </div>
      </div>

      {/* Hero image */}
      <div
        className="admissions-hero-img-wrap"
        style={{ width: "79%", margin: "-25px auto 20px", overflow: "hidden", position: "relative", zIndex: 10 }}
      >
        <img
          src={Admission1}
          alt="JNPV Campus"
          style={{ width: "100%", display: "block", maxHeight: "460px", objectFit: "cover" }}
        />
      </div>

      {/* Intro + CTAs */}
      <div className="admissions-intro" style={{ padding: "50px 80px 30px", textAlign: "center" }}>
        <h2 style={{ color: "#1a3a6b", fontSize: "26px", fontWeight: 800, marginBottom: "14px" }}>
          Join the JNPV Family
        </h2>
        <p style={{ color: "#555", fontSize: "15px", lineHeight: 1.7, maxWidth: "680px", margin: "0 auto 28px" }}>
          We welcome young learners who are curious, kind, and ready to grow. Our admissions process is
          designed to be simple and transparent, helping families understand each step clearly before
          their child joins us.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
          <button
            style={{
              background: "#f5a800",
              color: "#1a3a6b",
              border: "none",
              padding: "13px 28px",
              fontSize: "14px",
              fontWeight: 800,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Download Brochure
          </button>
          <button
            style={{
              background: "#1a3a6b",
              color: "#fff",
              border: "none",
              padding: "13px 28px",
              fontSize: "14px",
              fontWeight: 800,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Contact Admissions Office
          </button>
        </div>
      </div>

      {/* Process steps */}
      <div className="admissions-section" style={{ padding: "50px 80px", background: "#fffbee" }}>
        <h2
          className="admissions-section-title"
          style={{ color: "#1a3a6b", fontSize: "26px", fontWeight: 800, marginBottom: "36px", textAlign: "center" }}
        >
          Admission Process
        </h2>
        <div
          className="admissions-process-grid"
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px" }}
        >
          {processSteps.map((s) => (
            <div
              key={s.step}
              style={{
                background: "#fff",
                borderRadius: "6px",
                padding: "26px",
                boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
                borderLeft: "4px solid #f5a800",
              }}
            >
              <div style={{ color: "#f5a800", fontSize: "22px", fontWeight: 800, marginBottom: "8px" }}>{s.step}</div>
              <h3 style={{ color: "#1a3a6b", fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>{s.title}</h3>
              <p style={{ color: "#555", fontSize: "13px", lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Eligibility + Important Dates */}
      <div className="admissions-section" style={{ padding: "60px 80px" }}>
        <div className="admissions-split-grid" style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "48px" }}>
          {/* Eligibility table */}
          <div>
            <h2 style={{ color: "#1a3a6b", fontSize: "22px", fontWeight: 800, marginBottom: "20px" }}>
              Eligibility Criteria
            </h2>
            <div style={{ border: "1px solid rgba(26,58,107,0.12)", borderRadius: "6px", overflow: "hidden" }}>
              {eligibility.map((row, i) => (
                <div
                  key={row.grade}
                  className="admissions-eligibility-row"
                  style={{
                    display: "flex",
                    padding: "14px 18px",
                    background: i % 2 === 0 ? "#fff" : "#fffbee",
                    fontSize: "13px",
                  }}
                >
                  <div style={{ width: "120px", flexShrink: 0, color: "#1a3a6b", fontWeight: 700 }}>{row.grade}</div>
                  <div style={{ color: "#555" }}>{row.criteria}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Important dates */}
          <div>
            <h2 style={{ color: "#1a3a6b", fontSize: "22px", fontWeight: 800, marginBottom: "20px" }}>
              Important Dates
            </h2>
            <div style={{ background: "#1a3a6b", borderRadius: "6px", padding: "8px 0" }}>
              {importantDates.map((d) => (
                <div
                  key={d.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "14px 22px",
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                    fontSize: "13px",
                  }}
                >
                  <span style={{ color: "#cbd5e1" }}>{d.label}</span>
                  <span style={{ color: "#f5a800", fontWeight: 700 }}>{d.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Documents required */}
      <div className="admissions-section" style={{ padding: "60px 80px", background: "#fffbee" }}>
        <div
          className="admissions-docs-grid"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "center" }}
        >
          <div style={{ borderRadius: "8px", overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>
            <img
              src={Admission2}
              alt="JNPV students"
              style={{ width: "100%", display: "block", objectFit: "cover" }}
            />
          </div>
          <div>
            <h2 style={{ color: "#1a3a6b", fontSize: "22px", fontWeight: 800, marginBottom: "18px" }}>
              Documents Required
            </h2>
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {documents.map((doc) => (
                <li
                  key={doc}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    marginBottom: "12px",
                    fontSize: "14px",
                    color: "#333",
                  }}
                >
                  <span style={{ color: "#f5a800", fontWeight: 800, fontSize: "16px", lineHeight: 1 }}>✓</span>
                  {doc}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="admissions-bottom-cta" style={{ padding: "50px 80px", background: "#1a3a6b", textAlign: "center" }}>
        <h2 style={{ color: "#fff", fontSize: "24px", fontWeight: 800, marginBottom: "12px" }}>
          Have Questions About Admissions?
        </h2>
        <p style={{ color: "#cbd5e1", fontSize: "14px", marginBottom: "24px" }}>
          Our admissions team is happy to guide you through the process.
        </p>
        <button
          style={{
            background: "#f5a800",
            color: "#1a3a6b",
            border: "none",
            padding: "13px 32px",
            fontSize: "14px",
            fontWeight: 800,
            letterSpacing: "0.5px",
            textTransform: "uppercase",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Get in Touch
        </button>
      </div>
    </div>
  );
}