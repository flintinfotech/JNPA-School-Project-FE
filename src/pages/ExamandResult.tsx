import { useState } from "react";
import Alumni from "../assets/alumni.jpg";
import SchoolLogo from "../assets/SchoolLogo.avif";

const stats = [
  { label: "Grade X Pass %", value: "100%" },
  { label: "Grade XII Pass %", value: "98%" },
  { label: "Students Scoring 90%+", value: "64" },
  { label: "University Placements", value: "210+" },
];

// TODO: Replace with API data -> columns: Notice Name, Notice Link
const noticesData = [
  { name: "Grade X Preliminary Exam Notice", link: "#" },
  { name: "Grade XII Practical Exam Schedule", link: "#" },
  { name: "Mid-Term Assessment Notification", link: "#" },
  { name: "Annual Exam Hall Ticket Release", link: "#" },
  { name: "Re-Exam / Improvement Exam Notice", link: "#" },
];

// TODO: Replace with API data -> columns: Exam Name, Result Link
const examResults = [
  { examName: "1st Quarter", resultLink: "#" },
  { examName: "1st Semester", resultLink: "#" },
  { examName: "2nd Quarter", resultLink: "#" },
  { examName: "Annual Exam", resultLink: "#" },
];

// TODO: Replace with API data.
// Each topper is tagged with level ("pre-primary" | "primary" | "secondary") and medium ("marathi" | "english").
// Admin uploads EITHER a photo OR a PDF marksheet per topper - only one of `photo` / `pdf` will be set.
const LEVELS = [
  { key: "pre-primary", label: "Pre-Primary" },
  { key: "primary", label: "Primary" },
  { key: "secondary", label: "Secondary" },
];
const MEDIUMS = [
  { key: "english", label: "English Medium" },
  { key: "marathi", label: "Marathi Medium" },
];

const toppersData = [
  { id: 1, level: "primary", medium: "english", standard: "Std 4", name: "Aditi Sharma", score: "96%", photo: "https://i.pravatar.cc/150?img=47", pdf: null, note: "Topper - English Medium Primary" },
  { id: 2, level: "primary", medium: "english", standard: "Std 4", name: "Karan Joshi", score: "94%", photo: "https://i.pravatar.cc/150?img=12", pdf: null, note: "2nd Rank" },
  { id: 3, level: "primary", medium: "marathi", standard: "इयत्ता ४ थी", name: "ओम पाटील", score: "95%", photo: null, pdf: "#", note: "Topper - Marathi Medium Primary" },
  { id: 4, level: "primary", medium: "marathi", standard: "इयत्ता ४ थी", name: "साक्षी शिंदे", score: "93%", photo: null, pdf: "#", note: "2nd Rank" },
  { id: 5, level: "secondary", medium: "english", standard: "Std 10", name: "Riya Deshmukh", score: "98.4%", photo: "https://i.pravatar.cc/150?img=32", pdf: null, note: "IIT Bombay - Computer Science" },
  { id: 6, level: "secondary", medium: "english", standard: "Std 10", name: "Aarav Mehta", score: "97.8%", photo: null, pdf: "#", note: "St. Xavier's College, Mumbai" },
  { id: 7, level: "secondary", medium: "marathi", standard: "इयत्ता १० वी", name: "सान्वी कुलकर्णी", score: "96.5%", photo: "https://i.pravatar.cc/150?img=45", pdf: null, note: "Symbiosis Law School" },
  { id: 8, level: "secondary", medium: "marathi", standard: "इयत्ता १० वी", name: "रोहन गायकवाड", score: "95.9%", photo: null, pdf: "#", note: "3rd Rank" },
  { id: 9, level: "pre-primary", medium: "english", standard: "Sr. KG", name: "Ishaan Verma", score: "A+ Grade", photo: "https://i.pravatar.cc/150?img=15", pdf: null, note: "Best All-Rounder" },
  { id: 10, level: "pre-primary", medium: "english", standard: "Sr. KG", name: "Myra Kapoor", score: "A+ Grade", photo: "https://i.pravatar.cc/150?img=25", pdf: null, note: "Excellence in Activities" },
  { id: 11, level: "pre-primary", medium: "marathi", standard: "ज्युनियर केजी", name: "अर्णव जाधव", score: "A+ श्रेणी", photo: null, pdf: "#", note: "सर्वोत्कृष्ट विद्यार्थी" },
  { id: 12, level: "pre-primary", medium: "marathi", standard: "ज्युनियर केजी", name: "अनया मोरे", score: "A+ श्रेणी", photo: null, pdf: "#", note: "उपक्रमांमध्ये उत्कृष्टता" },
];

export default function ExamandResult() {
  const [activeLevel, setActiveLevel] = useState("primary");
  const [activeMedium, setActiveMedium] = useState("english");
  const [expandedStandards, setExpandedStandards] = useState<Record<string, boolean>>({});
  const VISIBLE_COUNT = 4; // cards shown before "View All"

  const filteredToppers = toppersData.filter(
    (t) => t.level === activeLevel && t.medium === activeMedium
  );

  const groupedByStandard = filteredToppers.reduce<Record<string, typeof toppersData>>((acc, t) => {
    if (!acc[t.standard]) acc[t.standard] = [];
    acc[t.standard].push(t);
    return acc;
  }, {});

  return (
    <div className="results-page" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", overflowX: "hidden" }}>
      <style>{`
        @media (max-width: 768px) {
          .results-page .results-header-inner {
            padding: 14px 20px 0 !important;
          }
          .results-page .results-header-inner img {
            height: 56px !important;
          }
          .results-page .results-title-wrap {
            padding: 0 20px 18px !important;
          }
          .results-page .results-title-wrap h1 {
            font-size: 26px !important;
          }
          .results-page .results-stats-strip {
            padding: 24px 20px !important;
            gap: 12px !important;
          }
          .results-page .results-stats-strip > div {
            background: rgba(255,255,255,0.35) !important;
            border-radius: 10px !important;
            padding: 14px 6px !important;
          }
          .results-page .results-section {
            padding: 36px 20px !important;
          }
          .results-page .results-section h2 {
            font-size: 20px !important;
            margin-bottom: 18px !important;
          }
          .results-page .results-row {
            flex-direction: column !important;
            gap: 4px !important;
          }
          .results-page .results-row > div:first-child {
            width: auto !important;
          }
          .results-page .results-table-header {
            display: none !important;
          }
          .results-page .results-table-wrap {
            border: none !important;
            overflow: visible !important;
            background: transparent !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 10px !important;
          }
          .results-page .notice-item-row,
          .results-page .examresult-item-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 10px !important;
            padding: 16px !important;
            border-radius: 8px !important;
            background: #fff !important;
            box-shadow: 0 3px 12px rgba(0,0,0,0.07) !important;
          }
          .results-page .notice-item-row {
            border-left: 4px solid #1569ad !important;
          }
          .results-page .examresult-item-row {
            border-left: 4px solid #f5a800 !important;
          }
          .results-page .notice-item-row > div:first-child,
          .results-page .examresult-item-row > div:first-child {
            width: auto !important;
            font-size: 14px !important;
          }
          .results-page .notice-item-row a {
            display: inline-block !important;
            width: auto !important;
          }
          .results-page .examresult-item-row a {
            display: inline-block !important;
          }
          .results-page .toppers-filters button {
            padding: 7px 14px !important;
            font-size: 12px !important;
          }
          .results-page .toppers-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
          }
          .results-page .topper-card {
            padding: 14px !important;
          }
          .results-page .topper-card img,
          .results-page .topper-card a[title="View marksheet PDF"] {
            width: 64px !important;
            height: 64px !important;
          }
          .results-page .results-banner-overlay {
            padding: 24px 20px !important;
          }
          .results-page .results-banner-img {
            height: 260px !important;
          }
        }

        @media (max-width: 460px) {
          .results-page .results-title-wrap h1 {
            font-size: 22px !important;
          }
          .results-page .toppers-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: "#1569ad", position: "relative" }}>
        <div className="results-header-inner" style={{ maxWidth: "1200px", margin: "0 auto", padding: "18px 40px 0" }}>
          <img src={SchoolLogo} alt="JNPV Logo" style={{ height: "78px", width: "auto", display: "block" }} />
        </div>
        <div className="results-title-wrap" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 40px 26px" }}>
          <h1 style={{ color: "#fff", fontSize: "34px", fontWeight: 500, margin: 0 }}>Exam and Result</h1>
        </div>
      </div>

      {/* Exam Notices / Notifications */}
      <div className="results-section" style={{ padding: "50px 80px 40px", background: "#fff" }}>
        <h2 style={{ color: "#1a3a6b", fontSize: "24px", fontWeight: 800, marginBottom: "24px", textAlign: "center" }}>
          Exam Notices / Notifications
        </h2>
        <div className="results-table-wrap" style={{ border: "1px solid rgba(26,58,107,0.12)", borderRadius: "6px", overflow: "hidden", maxWidth: "900px", margin: "0 auto" }}>
          {/* Table header */}
          <div
            className="results-row results-table-header"
            style={{
              display: "flex",
              padding: "12px 20px",
              background: "#1a3a6b",
              fontSize: "13px",
              fontWeight: 700,
              color: "#fff",
            }}
          >
            <div style={{ width: "70%" }}>Notice Name</div>
            <div style={{ width: "30%" }}>Notice Link</div>
          </div>

          {noticesData.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "#777", fontSize: "13px" }}>
              No notices available right now.
            </div>
          ) : (
            noticesData.map((notice, i) => (
              <div
                key={notice.name}
                className="results-row notice-item-row"
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "14px 20px",
                  background: i % 2 === 0 ? "#fff" : "#fffbee",
                  fontSize: "13px",
                }}
              >
                <div style={{ width: "70%", color: "#333", fontWeight: 600 }}>{notice.name}</div>
                <div style={{ width: "30%" }}>
                  <a
                    href={notice.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#1569ad",
                      fontWeight: 700,
                      textDecoration: "none",
                      borderBottom: "1px solid #1569ad",
                    }}
                  >
                    View Notice
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Stats strip */}
      <div
        className="results-stats-strip"
        style={{
          background: "#f5a800",
          padding: "32px 80px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "20px",
          textAlign: "center",
        }}
      >
        {stats.map((stat) => (
          <div key={stat.label}>
            <div style={{ fontSize: "30px", fontWeight: 800, color: "#1a3a6b" }}>{stat.value}</div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#1a3a6b", letterSpacing: "0.5px", marginTop: "4px" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Board results - Exam Name / Result Link */}
      <div className="results-section" style={{ padding: "60px 80px", background: "#fffbee" }}>
        <h2 style={{ color: "#1a3a6b", fontSize: "26px", fontWeight: 800, marginBottom: "30px", textAlign: "center" }}>
          Exam Results
        </h2>
        <div className="results-table-wrap" style={{ border: "1px solid rgba(26,58,107,0.12)", borderRadius: "6px", overflow: "hidden", maxWidth: "900px", margin: "0 auto" }}>
          {/* Table header */}
          <div
            className="results-row results-table-header"
            style={{
              display: "flex",
              padding: "12px 20px",
              background: "#1a3a6b",
              fontSize: "13px",
              fontWeight: 700,
              color: "#fff",
            }}
          >
            <div style={{ width: "220px", flexShrink: 0 }}>Exam Name</div>
            <div>Result Link</div>
          </div>

          {examResults.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "#777", fontSize: "13px" }}>
              Results not published yet.
            </div>
          ) : (
            examResults.map((row, i) => (
              <div
                key={row.examName}
                className="results-row examresult-item-row"
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "16px 20px",
                  background: i % 2 === 0 ? "#fff" : "#fffbee",
                  fontSize: "13px",
                }}
              >
                <div style={{ width: "220px", flexShrink: 0, color: "#1a3a6b", fontWeight: 700 }}>{row.examName}</div>
                <div>
                  <a
                    href={row.resultLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#fff",
                      background: "#f5a800",
                      fontWeight: 700,
                      textDecoration: "none",
                      padding: "6px 14px",
                      borderRadius: "4px",
                      fontSize: "12px",
                    }}
                  >
                    View Result
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Toppers */}
      <div className="results-section" style={{ padding: "60px 80px", background: "#fffbee" }}>
        <h2 style={{ color: "#1a3a6b", fontSize: "26px", fontWeight: 800, marginBottom: "20px", textAlign: "center" }}>
          This Year's Toppers
        </h2>

        {/* Level + Medium filters */}
        <div className="toppers-filters" style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap", marginBottom: "10px" }}>
          {LEVELS.map((lvl) => (
            <button
              key={lvl.key}
              onClick={() => setActiveLevel(lvl.key)}
              style={{
                padding: "8px 20px",
                borderRadius: "20px",
                border: activeLevel === lvl.key ? "2px solid #1a3a6b" : "1px solid #ccc",
                background: activeLevel === lvl.key ? "#1a3a6b" : "#fff",
                color: activeLevel === lvl.key ? "#fff" : "#1a3a6b",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              {lvl.label}
            </button>
          ))}
        </div>
        <div className="toppers-filters" style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap", marginBottom: "34px" }}>
          {MEDIUMS.map((med) => (
            <button
              key={med.key}
              onClick={() => setActiveMedium(med.key)}
              style={{
                padding: "6px 18px",
                borderRadius: "20px",
                border: activeMedium === med.key ? "2px solid #f5a800" : "1px solid #ccc",
                background: activeMedium === med.key ? "#f5a800" : "#fff",
                color: activeMedium === med.key ? "#1a3a6b" : "#555",
                fontWeight: 700,
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              {med.label}
            </button>
          ))}
        </div>

        {/* Topper cards - grouped by standard */}
        {Object.keys(groupedByStandard).length === 0 ? (
          <div style={{ textAlign: "center", color: "#777", fontSize: "13px", padding: "20px" }}>
            No toppers published yet for this selection.
          </div>
        ) : (
          Object.entries(groupedByStandard).map(([standard, students]) => {
            const isExpanded = expandedStandards[standard];
            const visibleStudents = isExpanded ? students : students.slice(0, VISIBLE_COUNT);

            return (
              <div key={standard} style={{ marginBottom: "36px" }}>
                <h3 style={{ color: "#1a3a6b", fontSize: "16px", fontWeight: 700, marginBottom: "14px", textAlign: "center" }}>
                  {standard}
                </h3>
                <div
                  className="toppers-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "18px",
                    maxWidth: "900px",
                    margin: "0 auto",
                  }}
                >
                  {visibleStudents.map((t) => (
                    <div
                      key={t.id}
                      className="topper-card"
                      style={{
                        background: "#fff",
                        borderRadius: "10px",
                        padding: "20px",
                        textAlign: "center",
                        boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
                        borderTop: "4px solid #f5a800",
                      }}
                    >
                      {t.photo ? (
                        <img
                          src={t.photo}
                          alt={t.name}
                          style={{
                            width: "84px",
                            height: "84px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            margin: "0 auto 12px",
                            display: "block",
                            border: "3px solid #fffbee",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                          }}
                        />
                      ) : (
                        <a
                          href={t.pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View marksheet PDF"
                          style={{
                            width: "84px",
                            height: "84px",
                            borderRadius: "50%",
                            margin: "0 auto 12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "#1a3a6b",
                            color: "#fff",
                            fontSize: "11px",
                            fontWeight: 800,
                            textDecoration: "none",
                          }}
                        >
                          PDF
                        </a>
                      )}
                      <div style={{ color: "#1a3a6b", fontWeight: 700, fontSize: "15px" }}>{t.name}</div>
                      <div style={{ color: "#777", fontSize: "12px", margin: "4px 0" }}>{t.standard} • {t.score}</div>
                      <div style={{ color: "#555", fontSize: "12px", marginBottom: t.pdf ? "10px" : 0 }}>{t.note}</div>
                      {t.pdf && (
                        <a
                          href={t.pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "#1569ad",
                            fontWeight: 700,
                            fontSize: "12px",
                            textDecoration: "none",
                            borderBottom: "1px solid #1569ad",
                          }}
                        >
                          View Marksheet (PDF)
                        </a>
                      )}
                    </div>
                  ))}
                </div>
                {students.length > VISIBLE_COUNT && (
                  <div style={{ textAlign: "center", marginTop: "14px" }}>
                    <button
                      onClick={() =>
                        setExpandedStandards((prev) => ({ ...prev, [standard]: !isExpanded }))
                      }
                      style={{
                        border: "1px solid #1a3a6b",
                        background: "#fff",
                        color: "#1a3a6b",
                        padding: "6px 16px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {isExpanded ? "Show Less" : `View All (${students.length})`}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Closing banner */}
      <div style={{ position: "relative" }}>
        <img
          className="results-banner-img"
          src={Alumni}
          alt="JNPV alumni"
          style={{ width: "100%", height: "380px", objectFit: "cover", display: "block" }}
        />
        <div
          className="results-banner-overlay"
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(26,58,107,0.1) 0%, rgba(26,58,107,0.75) 100%)",
            display: "flex",
            alignItems: "flex-end",
            padding: "40px 80px",
          }}
        >
          <div>
            <h2 style={{ color: "#fff", fontSize: "26px", fontWeight: 800, margin: "0 0 8px" }}>
              Building Futures Beyond the Classroom
            </h2>
            <p style={{ color: "#cbd5e1", fontSize: "14px", maxWidth: "560px", margin: 0, lineHeight: 1.6 }}>
              From board exam excellence to admissions at India's top universities, JNPV students carry
              forward the values and rigor instilled here into the next chapter of their lives.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}