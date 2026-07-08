import Img1 from "../assets/alumni.jpg";
import SchoolLogo from "../assets/SchoolLogo.avif";

const stats = [
  { label: "Alumni Worldwide", value: "5,000+" },
  { label: "Countries", value: "32" },
  { label: "Years of Legacy", value: "25+" },
  { label: "Active Mentors", value: "180+" },
];

const impactCards = [
  {
    title: "Network",
    desc: "Connect with fellow alumni across industries, batches, and cities. Build relationships that last beyond the classroom.",
  },
  {
    title: "Learn",
    desc: "Get access to mentorship, webinars, and career guidance from alumni who have walked the path before you.",
  },
  {
    title: "Grow",
    desc: "Find internship and job referrals, collaborate on ideas, and give back by mentoring current students.",
  },
];

const notableAlumni = [
  {
    name: "Aarav Mehta",
    batch: "Batch of 2010",
    role: "Senior Software Engineer, Google",
    initials: "AM",
    color: "#1a3a6b",
  },
  {
    name: "Priya Sharma",
    batch: "Batch of 2008",
    role: "Founder, GreenLeaf Foods",
    initials: "PS",
    color: "#b8472f",
  },
  {
    name: "Rohan Deshmukh",
    batch: "Batch of 2012",
    role: "IAS Officer, Maharashtra Cadre",
    initials: "RD",
    color: "#2e7d5b",
  },
  {
    name: "Sneha Kulkarni",
    batch: "Batch of 2015",
    role: "Product Designer, Microsoft",
    initials: "SK",
    color: "#7a4fb5",
  },
  {
    name: "Vikram Joshi",
    batch: "Batch of 2005",
    role: "Cardiologist, Tata Memorial Hospital",
    initials: "VJ",
    color: "#c98a1f",
  },
];

const testimonials = [
  {
    quote:
      "JNPV didn't just teach me subjects — it taught me discipline and curiosity that I still carry into every project I lead today. The teachers pushed us to ask questions instead of just memorizing answers, and that habit has shaped my entire career. Even now, whenever I'm stuck on a hard problem, I think back to the way my class teacher used to break things down step by step.",
    name: "Aarav Mehta",
    batch: "Batch of 2010",
  },
  {
    quote:
      "The teachers at JNPV believed in me before I believed in myself. That confidence is the reason I started my own company. I still remember failing my first business plan presentation in school, and instead of marking me down, my teacher sat with me for an hour after class to help me rebuild it from scratch. That kind of patience is rare, and it stuck with me.",
    name: "Priya Sharma",
    batch: "Batch of 2008",
  },
  {
    quote:
      "Coming back to mentor current students has been one of the most rewarding things I have done. The community here never really lets go. Walking the same corridors years later, hearing the same morning assembly songs, talking to kids who remind me of who I used to be — it brings everything full circle in a way I did not expect when I first signed up to volunteer.",
    name: "Vikram Joshi",
    batch: "Batch of 2005",
  },
  {
    quote:
      "I came from a small town and JNPV gave me the exposure and confidence to dream bigger than I thought possible. The science labs, the debate club, the annual exhibitions — every bit of it pushed me toward research. Today when I look back, I realize how much of my curiosity about space and technology was first sparked in a classroom at JNPV.",
    name: "Ananya Rao",
    batch: "Batch of 2018",
  },
  {
    quote:
      "What stayed with me long after graduation was not the syllabus but the values — honesty, discipline, and respect for everyone regardless of their background. As a doctor now, I deal with people from every walk of life every single day, and I genuinely believe the empathy I learned at JNPV makes me better at my job than any textbook ever could.",
    name: "Sneha Kulkarni",
    batch: "Batch of 2015",
  },
  {
    quote:
      "Being part of the JNPV alumni network has opened doors I never expected — from mentorship to actual job referrals. But more than the opportunities, what I value most is the sense of belonging. No matter how many years pass or how far we move, there is always someone from our batch ready to help, and that says everything about the kind of community this school built.",
    name: "Rohan Deshmukh",
    batch: "Batch of 2012",
  },
];

export default function Alumni() {
  return (
    <div className="alumni-page" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        /* ===== Mobile responsiveness ===== */
        @media (max-width: 768px) {
          .alumni-page .alumni-header-inner {
            padding: 14px 20px 0 !important;
          }
          .alumni-page .alumni-header-inner img {
            height: 56px !important;
          }
          .alumni-page .alumni-title-wrap {
            padding: 0 20px 18px !important;
          }
          .alumni-page .alumni-title-wrap h1 {
            font-size: 26px !important;
          }
          .alumni-page .alumni-hero-img-wrap {
            width: 92% !important;
            margin: -16px auto 14px !important;
          }
          .alumni-page .alumni-hero-img-wrap img {
            max-height: 220px !important;
          }
          .alumni-page .alumni-stats-strip {
            padding: 24px 20px !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 16px !important;
          }
          .alumni-page .alumni-stats-strip > div > div:first-child {
            font-size: 22px !important;
          }
          .alumni-page .alumni-section {
            padding: 36px 20px !important;
          }
          .alumni-page .alumni-section-title {
            font-size: 21px !important;
            margin-bottom: 22px !important;
          }
          .alumni-page .alumni-impact-grid {
            grid-template-columns: 1fr !important;
            gap: 18px !important;
          }
          .alumni-page .alumni-notable-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 14px !important;
          }
          .alumni-page .alumni-testimonials-grid {
            grid-template-columns: 1fr !important;
            gap: 18px !important;
          }
        }

        @media (max-width: 460px) {
          .alumni-page .alumni-title-wrap h1 {
            font-size: 22px !important;
          }
          .alumni-page .alumni-stats-strip {
            grid-template-columns: 1fr 1fr !important;
          }
          .alumni-page .alumni-notable-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: "#1569ad", position: "relative" }}>
        <div
          className="alumni-header-inner"
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
          className="alumni-title-wrap"
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
            Alumni
          </h1>
        </div>
      </div>

      {/* Hero image - overlapping the header, like About Us */}
      <div
        className="alumni-hero-img-wrap"
        style={{
          width: "79%",
          margin: "-25px auto 20px",
          overflow: "hidden",
          position: "relative",
          zIndex: 10,
        }}
      >
        <img
          src={Img1}
          alt="JNPV Campus"
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
        className="alumni-stats-strip"
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

      {/* Network / Learn / Grow */}
      <div className="alumni-section" style={{ padding: "60px 80px", background: "#fffbee" }}>
        <h2
          className="alumni-section-title"
          style={{
            color: "#1a3a6b",
            fontSize: "26px",
            fontWeight: 800,
            marginBottom: "36px",
            textAlign: "center",
          }}
        >
          Exam and result
        </h2>
        <div
          className="alumni-impact-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "28px",
          }}
        >
          {impactCards.map((card) => (
            <div
              key={card.title}
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
                  marginBottom: "10px",
                }}
              >
                {card.title}
              </h3>
              <p
                style={{
                  color: "#555",
                  fontSize: "14px",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Notable Alumni */}
      <div className="alumni-section" style={{ padding: "60px 80px" }}>
        <h2
          className="alumni-section-title"
          style={{
            color: "#1a3a6b",
            fontSize: "26px",
            fontWeight: 800,
            marginBottom: "10px",
            textAlign: "center",
          }}
        >
          Notable Alumni
        </h2>
        <p
          style={{
            color: "#777",
            fontSize: "14px",
            textAlign: "center",
            marginBottom: "40px",
          }}
        >
          A few names from our growing community of changemakers
        </p>
        <div
          className="alumni-notable-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "24px",
          }}
        >
          {notableAlumni.map((alum) => (
            <div
              key={alum.name}
              style={{
                textAlign: "center",
                padding: "28px 18px",
                border: "1px solid rgba(26,58,107,0.12)",
                borderRadius: "8px",
                background: "#fff",
                transition:
                  "transform 0.2s, box-shadow 0.2s, border-color 0.2s",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow =
                  "0 10px 22px rgba(0,0,0,0.10)";
                e.currentTarget.style.borderColor = "#f5a800";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = "rgba(26,58,107,0.12)";
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: alum.color,
                  margin: "0 auto 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: "22px",
                  fontWeight: 700,
                  letterSpacing: "0.5px",
                  border: "3px solid #f5a800",
                }}
              >
                {alum.initials}
              </div>
              <h4
                style={{
                  color: "#1a3a6b",
                  fontSize: "15px",
                  fontWeight: 700,
                  margin: "0 0 4px",
                }}
              >
                {alum.name}
              </h4>
              <p
                style={{
                  color: "#f5a800",
                  fontSize: "12px",
                  fontWeight: 600,
                  margin: "0 0 6px",
                }}
              >
                {alum.batch}
              </p>
              <p
                style={{
                  color: "#777",
                  fontSize: "12px",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {alum.role}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div className="alumni-section" style={{ padding: "60px 80px", background: "#1a3a6b" }}>
        <h2
          className="alumni-section-title"
          style={{
            color: "#fff",
            fontSize: "26px",
            fontWeight: 800,
            marginBottom: "40px",
            textAlign: "center",
          }}
        >
          In Their Words
        </h2>
        <div
          className="alumni-testimonials-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "28px",
          }}
        >
          {testimonials.map((t) => (
            <div
              key={t.name}
              style={{
                background: "#fffbee",
                borderRadius: "8px",
                padding: "28px",
                position: "relative",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  fontSize: "40px",
                  color: "#f5a800",
                  lineHeight: 1,
                  fontWeight: 800,
                  marginBottom: "4px",
                }}
              >
                "
              </div>
              <p
                style={{
                  color: "#333",
                  fontSize: "14px",
                  lineHeight: 1.7,
                  marginBottom: "18px",
                  flex: 1,
                }}
              >
                {t.quote}
              </p>
              <div
                style={{
                  borderTop: "1px solid rgba(26,58,107,0.15)",
                  paddingTop: "12px",
                }}
              >
                <div
                  style={{
                    color: "#1a3a6b",
                    fontWeight: 700,
                    fontSize: "14px",
                  }}
                >
                  {t.name}
                </div>
                <div
                  style={{
                    color: "#f5a800",
                    fontWeight: 600,
                    fontSize: "12px",
                  }}
                >
                  {t.batch}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}