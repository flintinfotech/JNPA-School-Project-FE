import ResultsHero from "../assets/Academics1.webp";
import Alumni from "../assets/alumni.jpg";
import SchoolLogo from "../assets/SchoolLogo.avif";

const stats = [
  { label: "Grade X Pass %", value: "100%" },
  { label: "Grade XII Pass %", value: "98%" },
  { label: "Students Scoring 90%+", value: "64" },
  { label: "University Placements", value: "210+" },
];

const boardResults = [
  { grade: "Grade X (2026)", detail: "100% pass rate, with 38 students scoring above 90% and a school topper score of 98.4%" },
  { grade: "Grade XII - Science (2026)", detail: "98% pass rate, with 22 students securing admission into engineering and medical programs" },
  { grade: "Grade XII - Commerce (2026)", detail: "100% pass rate, with 14 students pursuing CA, CS, and undergraduate business programs" },
  { grade: "Grade XII - Humanities (2026)", detail: "97% pass rate, with several students pursuing law and design programs" },
];

const toppers = [
  { name: "Riya Deshmukh", score: "98.4%", stream: "Science", placement: "IIT Bombay - Computer Science" },
  { name: "Aarav Mehta", score: "97.8%", stream: "Commerce", placement: "St. Xavier's College, Mumbai" },
  { name: "Sanaya Kapoor", score: "96.2%", stream: "Humanities", placement: "Symbiosis Law School" },
];

export default function ExamandResult() {
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
          .results-page .results-hero-img-wrap {
            width: 92% !important;
            margin: -16px auto 14px !important;
          }
          .results-page .results-hero-img-wrap img {
            max-height: 220px !important;
          }
          .results-page .results-stats-strip {
            padding: 24px 20px !important;
          }
          .results-page .results-section {
            padding: 36px 20px !important;
          }
          .results-page .results-row {
            flex-direction: column !important;
            gap: 4px !important;
          }
          .results-page .results-row > div:first-child {
            width: auto !important;
          }
          .results-page .results-topper-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 6px !important;
            padding: 14px 16px !important;
          }
          .results-page .results-topper-row > div:last-child {
            text-align: left !important;
            max-width: none !important;
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

      {/* Hero image */}
      <div
        className="results-hero-img-wrap"
        style={{ width: "79%", margin: "-25px auto 20px", overflow: "hidden", position: "relative", zIndex: 10 }}
      >
        <img
          src={ResultsHero}
          alt="JNPV students celebrating results"
          style={{ width: "100%", display: "block", maxHeight: "460px", objectFit: "cover" }}
        />
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

      {/* Board results breakdown */}
      <div className="results-section" style={{ padding: "60px 80px", background: "#fffbee" }}>
        <h2 style={{ color: "#1a3a6b", fontSize: "26px", fontWeight: 800, marginBottom: "30px", textAlign: "center" }}>
          Board Exam Results
        </h2>
        <div style={{ border: "1px solid rgba(26,58,107,0.12)", borderRadius: "6px", overflow: "hidden", maxWidth: "900px", margin: "0 auto" }}>
          {boardResults.map((row, i) => (
            <div
              key={row.grade}
              className="results-row"
              style={{
                display: "flex",
                padding: "16px 20px",
                background: i % 2 === 0 ? "#fff" : "#fffbee",
                fontSize: "13px",
              }}
            >
              <div style={{ width: "220px", flexShrink: 0, color: "#1a3a6b", fontWeight: 700 }}>{row.grade}</div>
              <div style={{ color: "#555" }}>{row.detail}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Toppers */}
      <div className="results-section" style={{ padding: "60px 80px", background: "#fffbee" }}>
        <h2 style={{ color: "#1a3a6b", fontSize: "26px", fontWeight: 800, marginBottom: "30px", textAlign: "center" }}>
          This Year's Toppers
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", maxWidth: "700px", margin: "0 auto" }}>
          {toppers.map((t) => (
            <div
              key={t.name}
              className="results-topper-row"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 20px",
                background: "#fff",
                borderRadius: "6px",
                borderLeft: "4px solid #f5a800",
                boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
              }}
            >
              <div>
                <div style={{ color: "#1a3a6b", fontWeight: 700, fontSize: "15px" }}>{t.name}</div>
                <div style={{ color: "#777", fontSize: "12px" }}>{t.stream} • {t.score}</div>
              </div>
              <div style={{ color: "#555", fontSize: "13px", textAlign: "right", maxWidth: "220px" }}>
                {t.placement}
              </div>
            </div>
          ))}
        </div>
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