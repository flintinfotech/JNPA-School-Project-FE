import Academics1 from "../assets/Academics1.webp";
import Academics2 from "../assets/Academics2.webp";
import Academics3 from "../assets/Academics3.webp";
import SchoolLogo from "../assets/SchoolLogo.avif";

const stats = [
  { label: "CBSE Affiliated", value: "100%" },
  { label: "Avg. Pass Percentage", value: "98%" },
  { label: "Subjects Offered", value: "20+" },
  { label: "Student-Teacher Ratio", value: "15:1" },
];

const stages = [
  {
    title: "Primary School",
    grades: "Grades I - V",
    desc: "A nurturing foundation focused on literacy, numeracy, and curiosity-driven learning. Activity-based teaching helps young learners build strong fundamentals while developing social and motor skills through play and exploration.",
  },
  {
    title: "Middle School",
    grades: "Grades VI - VIII",
    desc: "Students move toward structured subject learning across Math, Science, Social Studies, and Languages, alongside project-based assessments, computer literacy, and the start of co-curricular specialization.",
  },
  {
    title: "Senior Secondary",
    grades: "Grades IX - XII",
    desc: "Rigorous CBSE board preparation with Science, Commerce, and Humanities streams. Career counselling, competitive exam coaching, and lab-based practicals prepare students for university and beyond.",
  },
];

const achievements = [
  "Multiple students recognized at National Science Olympiad",
  "Consistent 95%+ board exam results over the last 5 years",
  "Strong representation in state-level Math and Science fairs",
  "Active NCC, debate, and quiz club participation across grades",
];

export default function Academics() {
  return (
    <div className="academics-page" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        /* ===== Mobile responsiveness ===== */
        @media (max-width: 768px) {
          .academics-page .academics-header-inner {
            padding: 14px 20px 0 !important;
          }
          .academics-page .academics-header-inner img {
            height: 56px !important;
          }
          .academics-page .academics-title-wrap {
            padding: 0 20px 18px !important;
          }
          .academics-page .academics-title-wrap h1 {
            font-size: 26px !important;
          }
          .academics-page .academics-hero-img-wrap {
            width: 92% !important;
            margin: -16px auto 14px !important;
          }
          .academics-page .academics-hero-img-wrap img {
            max-height: 220px !important;
          }
          .academics-page .academics-stats-strip {
            padding: 24px 20px !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 16px !important;
          }
          .academics-page .academics-stats-strip > div > div:first-child {
            font-size: 22px !important;
          }
          .academics-page .academics-section {
            padding: 36px 20px !important;
          }
          .academics-page .academics-section-title {
            font-size: 21px !important;
            margin-bottom: 22px !important;
          }
          .academics-page .academics-stages-grid {
            grid-template-columns: 1fr !important;
            gap: 18px !important;
          }
          .academics-page .academics-achievements-grid {
            grid-template-columns: 1fr !important;
            gap: 28px !important;
          }
          .academics-page .academics-achievements-grid > div:first-child {
            order: 2;
          }
          .academics-page .academics-achievements-grid > div:last-child {
            order: 1;
          }
          .academics-page .academics-banner {
            height: 280px !important;
          }
          .academics-page .academics-banner-overlay {
            padding: 24px 20px !important;
          }
          .academics-page .academics-banner-overlay h2 {
            font-size: 21px !important;
          }
        }

        @media (max-width: 460px) {
          .academics-page .academics-title-wrap h1 {
            font-size: 22px !important;
          }
          .academics-page .academics-stats-strip {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: "#1569ad", position: "relative" }}>
        <div
          className="academics-header-inner"
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "18px 40px 0",
          }}
        >
          <img
            src={SchoolLogo}
            alt="JNPV Logo"
            style={{ height: "78px", width: "auto", display: "block" }}
          />
        </div>
        <div
          className="academics-title-wrap"
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
            Academics
          </h1>
        </div>
      </div>

      {/* Hero image - overlapping the header */}
      <div
        className="academics-hero-img-wrap"
        style={{
          width: "79%",
          margin: "-25px auto 20px",
          overflow: "hidden",
          position: "relative",
          zIndex: 10,
        }}
      >
        <img
          src={Academics1}
          alt="JNPV Flag Hoisting Assembly"
          style={{
            width: "100%",
            display: "block",
            maxHeight: "460px",
            objectFit: "cover",
          }}
        />
      </div>

      {/* Stats strip */}
      <div
        className="academics-stats-strip"
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
            <div
              style={{ fontSize: "30px", fontWeight: 800, color: "#1a3a6b" }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "#1a3a6b",
                letterSpacing: "0.5px",
                marginTop: "4px",
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Curriculum stages */}
      <div className="academics-section" style={{ padding: "60px 80px", background: "#fffbee" }}>
        <h2
          className="academics-section-title"
          style={{
            color: "#1a3a6b",
            fontSize: "26px",
            fontWeight: 800,
            marginBottom: "10px",
            textAlign: "center",
          }}
        >
          Our Curriculum
        </h2>
        <p
          style={{
            color: "#777",
            fontSize: "14px",
            textAlign: "center",
            marginBottom: "40px",
          }}
        >
          A CBSE-aligned journey built around strong fundamentals and steady growth
        </p>
        <div
          className="academics-stages-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "28px",
          }}
        >
          {stages.map((stage) => (
            <div
              key={stage.title}
              style={{
                background: "#fff",
                borderTop: "4px solid #f5a800",
                borderRadius: "6px",
                padding: "28px",
                boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-6px)";
                e.currentTarget.style.boxShadow =
                  "0 10px 24px rgba(0,0,0,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.06)";
              }}
            >
              <h3
                style={{
                  color: "#1a3a6b",
                  fontSize: "18px",
                  fontWeight: 700,
                  marginBottom: "4px",
                }}
              >
                {stage.title}
              </h3>
              <p
                style={{
                  color: "#f5a800",
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "0.5px",
                  marginBottom: "12px",
                }}
              >
                {stage.grades}
              </p>
              <p
                style={{
                  color: "#555",
                  fontSize: "14px",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {stage.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div className="academics-section" style={{ padding: "60px 80px" }}>
        <div
          className="academics-achievements-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "48px",
            alignItems: "center",
          }}
        >
          <div>
            <h2
              style={{
                color: "#1a3a6b",
                fontSize: "26px",
                fontWeight: 800,
                marginBottom: "18px",
              }}
            >
              Academic Excellence
            </h2>
            <p
              style={{
                color: "#555",
                fontSize: "14px",
                lineHeight: 1.7,
                marginBottom: "20px",
              }}
            >
              Our students are encouraged to go beyond the syllabus —
              competing at olympiads, science fairs, and inter-school
              competitions year after year. Dedicated faculty and structured
              mentoring ensure every learner gets the attention they need to
              thrive.
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {achievements.map((item) => (
                <li
                  key={item}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    marginBottom: "12px",
                    fontSize: "14px",
                    color: "#333",
                  }}
                >
                  <span
                    style={{
                      color: "#f5a800",
                      fontWeight: 800,
                      fontSize: "16px",
                      lineHeight: 1,
                    }}
                  >
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div
            style={{
              borderRadius: "8px",
              overflow: "hidden",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            }}
          >
            <img
              src={Academics2}
              alt="Students felicitated for academic achievements"
              style={{ width: "100%", display: "block", objectFit: "cover" }}
            />
          </div>
        </div>
      </div>

      {/* School life banner */}
      <div
        className="academics-banner"
        style={{ position: "relative", height: "380px", overflow: "hidden" }}
      >
        <img
          src={Academics3}
          alt="JNPV school assembly"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
        <div
          className="academics-banner-overlay"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "linear-gradient(180deg, rgba(26,58,107,0.1) 0%, rgba(26,58,107,0.75) 100%)",
            display: "flex",
            alignItems: "flex-end",
            padding: "40px 80px",
          }}
        >
          <div>
            <h2
              style={{
                color: "#fff",
                fontSize: "26px",
                fontWeight: 800,
                margin: "0 0 8px",
              }}
            >
              A Community Built on Values
            </h2>
            <p
              style={{
                color: "#cbd5e1",
                fontSize: "14px",
                maxWidth: "560px",
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              Academics at JNPV go hand in hand with discipline, civic
              responsibility, and community — reflected in our assemblies,
              celebrations, and everyday school life.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}