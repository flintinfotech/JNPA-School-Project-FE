import Awards1 from "../assets/Awards1.jpg";
import Academics2 from "../assets/Academics2.webp";
import Academics3 from "../assets/Academics3.webp";
import SchoolLogo from "../assets/SchoolLogo.avif";

const stats = [
  { label: "National Awards", value: "12" },
  { label: "State Recognitions", value: "28" },
  { label: "Years of Excellence", value: "25+" },
  { label: "Student Achievers", value: "150+" },
];

const schoolAwards = [
  {
    title: "Best Emerging School 2024",
    org: "Maharashtra State Education Board",
    desc: "Recognized for outstanding academic results and infrastructure development across the campus.",
  },
  {
    title: "Excellence in Sports - District Level",
    org: "District Sports Authority",
    desc: "Awarded for consistent performance and participation across athletics, kabaddi, and football at the district level.",
  },
  {
    title: "Green School Certification",
    org: "Indian Green Building Council",
    desc: "Recognized for sustainable campus practices including rainwater harvesting and waste segregation initiatives.",
  },
  {
    title: "Top CBSE School - Mumbai Zone",
    org: "CBSE Regional Council",
    desc: "Ranked among the top performing CBSE-affiliated schools in the Mumbai zone for board exam results.",
  },
  {
    title: "Innovation in Teaching Award",
    org: "National Education Forum",
    desc: "Honored for adopting activity-based and technology-integrated teaching methods across grades.",
  },
  {
    title: "Community Outreach Recognition",
    org: "Mumbai Municipal Corporation",
    desc: "Acknowledged for student-led community service initiatives and civic awareness programs.",
  },
];

const studentAchievers = [
  { name: "Aditya Rane", grade: "Grade X", achievement: "Gold Medal, National Science Olympiad" },
  { name: "Ishita Patil", grade: "Grade IX", achievement: "State Level Chess Champion" },
  { name: "Kabir Shah", grade: "Grade XI", achievement: "1st Prize, Inter-School Debate Championship" },
  { name: "Myra Iyer", grade: "Grade VIII", achievement: "District Level Athletics - 100m Sprint" },
];

export default function Awards() {
  return (
    <div className="awards-page" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", overflowX: "hidden" }}>
      <style>{`
        /* ===== Mobile responsiveness ===== */
        @media (max-width: 768px) {
          .awards-page .awards-header-inner {
            padding: 14px 20px 0 !important;
          }
          .awards-page .awards-header-inner img {
            height: 56px !important;
          }
          .awards-page .awards-title-wrap {
            padding: 0 20px 18px !important;
          }
          .awards-page .awards-title-wrap h1 {
            font-size: 26px !important;
          }
          .awards-page .awards-hero-img-wrap {
            width: 92% !important;
            margin: -16px auto 14px !important;
          }
          .awards-page .awards-hero-img-wrap img {
            max-height: 220px !important;
          }
          .awards-page .awards-stats-strip {
            padding: 24px 20px !important;
          }
          .awards-page .awards-section {
            padding: 36px 20px !important;
          }
          .awards-page .awards-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .awards-page .awards-split-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
          .awards-page .awards-split-grid > div:first-child {
            order: 2;
          }
          .awards-page .awards-split-grid > div:last-child {
            order: 1;
          }
          .awards-page .awards-achiever-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 6px !important;
            padding: 12px 14px !important;
          }
          .awards-page .awards-achiever-row > div:last-child {
            text-align: left !important;
            max-width: none !important;
          }
          .awards-page .awards-banner-overlay {
            padding: 24px 20px !important;
          }
          .awards-page .awards-banner-img {
            height: 260px !important;
          }
        }

        @media (max-width: 460px) {
          .awards-page .awards-title-wrap h1 {
            font-size: 22px !important;
          }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: "#1569ad", position: "relative" }}>
        <div className="awards-header-inner" style={{ maxWidth: "1200px", margin: "0 auto", padding: "18px 40px 0" }}>
          <img src={SchoolLogo} alt="JNPV Logo" style={{ height: "78px", width: "auto", display: "block" }} />
        </div>
        <div className="awards-title-wrap" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 40px 26px" }}>
          <h1 style={{ color: "#fff", fontSize: "34px", fontWeight: 500, margin: 0 }}>Awards</h1>
        </div>
      </div>

      {/* Hero image */}
      <div
        className="awards-hero-img-wrap"
        style={{ width: "79%", margin: "-25px auto 20px", overflow: "hidden", position: "relative", zIndex: 10 }}
      >
        <img
          src={Awards1}
          alt="JNPV School Assembly"
          style={{ width: "100%", display: "block", maxHeight: "460px", objectFit: "cover" }}
        />
      </div>

      {/* Stats strip */}
      <div
        className="awards-stats-strip"
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

      {/* School awards grid */}
      <div className="awards-section" style={{ padding: "60px 80px", background: "#fffbee" }}>
        <h2 style={{ color: "#1a3a6b", fontSize: "26px", fontWeight: 800, marginBottom: "10px", textAlign: "center" }}>
          School Recognitions
        </h2>
        <p style={{ color: "#777", fontSize: "14px", textAlign: "center", marginBottom: "40px" }}>
          Honored by institutions and authorities for excellence across academics, sports, and community work
        </p>
        <div className="awards-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "28px" }}>
          {schoolAwards.map((award) => (
            <div
              key={award.title}
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
                e.currentTarget.style.boxShadow = "0 10px 24px rgba(0,0,0,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.06)";
              }}
            >
              <h3 style={{ color: "#1a3a6b", fontSize: "17px", fontWeight: 700, marginBottom: "4px" }}>
                {award.title}
              </h3>
              <p style={{ color: "#f5a800", fontSize: "12px", fontWeight: 700, marginBottom: "12px" }}>
                {award.org}
              </p>
              <p style={{ color: "#555", fontSize: "14px", lineHeight: 1.6, margin: 0 }}>{award.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Student achievers */}
      <div className="awards-section" style={{ padding: "60px 80px" }}>
        <div className="awards-split-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "center" }}>
          <div style={{ borderRadius: "8px", overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>
            <img
              src={Academics2}
              alt="Students felicitated for achievements"
              style={{ width: "100%", display: "block", objectFit: "cover" }}
            />
          </div>
          <div>
            <h2 style={{ color: "#1a3a6b", fontSize: "26px", fontWeight: 800, marginBottom: "18px" }}>
              Student Achievers
            </h2>
            <p style={{ color: "#555", fontSize: "14px", lineHeight: 1.7, marginBottom: "20px" }}>
              Every year, our students bring laurels to JNPV across academics, sports, and the arts. Here
              are a few who shone this year.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {studentAchievers.map((s) => (
                <div
                  key={s.name}
                  className="awards-achiever-row"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 18px",
                    background: "#fffbee",
                    borderRadius: "6px",
                    borderLeft: "4px solid #f5a800",
                  }}
                >
                  <div>
                    <div style={{ color: "#1a3a6b", fontWeight: 700, fontSize: "14px" }}>{s.name}</div>
                    <div style={{ color: "#777", fontSize: "12px" }}>{s.grade}</div>
                  </div>
                  <div style={{ color: "#555", fontSize: "13px", textAlign: "right", maxWidth: "220px" }}>
                    {s.achievement}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Closing banner */}
      <div style={{ position: "relative" }}>
        <img
          className="awards-banner-img"
          src={Academics3}
          alt="JNPV community gathering"
          style={{ width: "100%", height: "380px", objectFit: "cover", display: "block" }}
        />
        <div
          className="awards-banner-overlay"
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
              Excellence, Every Single Day
            </h2>
            <p style={{ color: "#cbd5e1", fontSize: "14px", maxWidth: "560px", margin: 0, lineHeight: 1.6 }}>
              These recognitions reflect the dedication of our students, teachers, and the wider JNPV
              community working together toward a shared standard of excellence.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}