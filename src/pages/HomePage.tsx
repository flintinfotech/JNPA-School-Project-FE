import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SchoolLogo from "../assets/SchoolLogo.avif";
import Img1 from "../assets/Img1.webp";
import Img2 from "../assets/Img2.webp";
import Img3 from "../assets/Img3.webp";
import Img4 from "../assets/Img4.webp";

// ── Sidebar data ─────────────────────────────────────────────────────────────

const sidebarSections = [
  {
    id: "about",
    title: "Jawaharlal Nehru Port Vidyalaya",
    subtitle:
      "A premier institution dedicated to excellence in education, nurturing young minds with values, knowledge, and leadership.",
    highlights: [
      "Affiliated with CBSE",
      "Established campus in Mumbai",
      "Focus on holistic development",
    ],
    link: "/about-us",
    linkLabel: "Learn More",
  },
  {
    id: "alumni",
    title: "Exam and result",
    subtitle:
      "An initiative to help our students, present and past, to —",
    highlights: ["NETWORK", "LEARN", "GROW"],
    link: "/exam-and-result",
    linkLabel: "Click Here",
    accentHighlights: true,
  },
  {
    id: "news",
    title: "News & Events",
    news: [
      {
        label: "JNPV student wins Gold at National Science Olympiad",
        href: "/events",
      },
      {
        label: "Annual Day 2025 — A grand celebration of talent",
        href: "/events",
      },
      {
        label: "Admissions open for academic year 2025–26",
        href: "/admissions",
      },
    ],
  },
];

// const quickNavLinks = [
//   { label: "About Us", href: "/about-us" },
//   { label: "Academics", href: "/academics" },
//   { label: "Admissions", href: "/admissions" },
//   { label: "Campus", href: "/campus" },
//   { label: "Events", href: "/events" },
//   { label: "Student Life", href: "/student-life" },
//   { label: "Exam and Result", href: "/exam-and-result" },
// ];

// ── Component ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const images = [Img1, Img2, Img3, Img4];

  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 4000); // Change image every 4 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 68px)", background: "#f4f6fa" }}>
      <style>{`
      /* For HOme Page Images*/
     .hp-main {
        flex: 1;
        overflow: hidden;
        position: relative;
      }

      .hp-slider {
        width: 100%;
        height: 100vh;
        overflow: hidden;
        background: #000;
      }

      .hp-slider-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        transition: opacity 0.8s ease-in-out;
      }
        /* ── Layout ── */
        .hp-root {
          display: flex;
          width: 100%;
          min-height: calc(100vh - 68px);
        }

        /* ── Sidebar ── */
        .hp-sidebar {
          width: 300px;
          min-width: 300px;
          background: #983929;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          position: sticky;
          top: 0;
          left: 0;
          height: 100vh;
          box-shadow: 3px 0 20px rgba(0,0,0,0.18);
          flex-shrink: 0;
          scrollbar-width: none;
        }

        .hp-sidebar::-webkit-scrollbar { display: none; }

        /* Sidebar logo block */
        .hp-sb-logo {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 32px 24px 24px;
          border-bottom: 1px solid rgba(245,168,0,0.25);
          text-decoration: none;
          transition: background 0.18s;
        }

        .hp-sb-logo:hover { background: rgba(255,255,255,0.04); }

       .hp-sb-logo-circle {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 12px rgba(0,0,0,.25);
        }

        .hp-sb-logo-img {
          max-width: 80%;
          max-height: 80%;
          width: auto;
          height: auto;
          object-fit: contain;
        }
        .hp-sb-logo-name {
          font-size: 20px;
          font-weight: 900;
          color: #ffffff;
          letter-spacing: 1px;
          margin-top: 14px;
          text-align: center;
        }

        .hp-sb-logo-sub {
          font-size: 9px;
          font-weight: 700;
          color: #f5a800;
          letter-spacing: 3px;
          text-transform: uppercase;
          margin-top: 4px;
          text-align: center;
        }

        /* Sidebar section cards */
        .hp-sb-section {
          border-bottom: 1px solid rgba(245,168,0,0.15);
          padding: 20px 24px;
          cursor: pointer;
          transition: background 0.18s;
        }

        .hp-sb-section:hover,
        .hp-sb-section.active {
          background: rgba(245,168,0,0.08);
        }

        .hp-sb-section-title {
          font-size: 13px;
          font-weight: 800;
          color: #ffffff;
          line-height: 1.35;
          margin-bottom: 8px;
          letter-spacing: 0.2px;
        }

        .hp-sb-section-sub {
          font-size: 12px;
          color: rgba(255,255,255,0.65);
          line-height: 1.55;
          margin-bottom: 10px;
        }

        .hp-sb-highlight {
          font-size: 11px;
          font-weight: 700;
          color: rgba(255,255,255,0.55);
          letter-spacing: 0.3px;
          line-height: 1.6;
        }

        .hp-sb-highlight.accent {
          color: #f5a800;
          letter-spacing: 2px;
          font-size: 10px;
        }

        .hp-sb-link {
          display: inline-block;
          margin-top: 10px;
          font-size: 11px;
          font-weight: 700;
          color: #f5a800;
          letter-spacing: 0.5px;
          text-decoration: none;
          text-transform: uppercase;
          transition: color 0.15s;
        }

        .hp-sb-link:hover { color: #ffffff; }

        /* News items in sidebar */
        .hp-sb-news-item {
          display: block;
          padding: 7px 0;
          font-size: 12px;
          color: rgba(255,255,255,0.7);
          text-decoration: none;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          line-height: 1.4;
          transition: color 0.15s, padding-left 0.15s;
        }

        .hp-sb-news-item:last-child { border-bottom: none; }

        .hp-sb-news-item:hover {
          color: #f5a800;
          padding-left: 4px;
        }

        .hp-sb-news-dot {
          display: inline-block;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #f5a800;
          margin-right: 8px;
          vertical-align: middle;
          flex-shrink: 0;
        }

        /* Sidebar connect block */
        .hp-sb-connect {
          padding: 20px 24px 28px;
          margin-top: auto;
          border-top: 1px solid rgba(245,168,0,0.2);
        }

        .hp-sb-connect-label {
          font-size: 9px;
          font-weight: 700;
          color: #f5a800;
          letter-spacing: 3px;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .hp-sb-connect-links {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .hp-sb-connect-link {
          font-size: 12px;
          font-weight: 600;
          color: rgba(255,255,255,0.6);
          text-decoration: none;
          transition: color 0.15s;
        }

        .hp-sb-connect-link:hover { color: #f5a800; }

        /* ── Main content ── */
        .hp-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }

        /* Hero image area */
        .hp-hero {
          position: relative;
          width: 100%;
          height: 480px;
          background: linear-gradient(135deg, #0f1c3f 0%, #983929 60%, #983929 100%);
          overflow: hidden;
          display: flex;
          align-items: flex-end;
        }

        .hp-hero-bg {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(160deg, rgba(26,58,107,0.85) 0%, rgba(15,28,63,0.5) 100%),
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 40px,
              rgba(245,168,0,0.03) 40px,
              rgba(245,168,0,0.03) 41px
            );
        }

        /* Animated geometric accent */
        .hp-hero-circle {
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(245,168,0,0.12);
          animation: pulseRing 6s ease-in-out infinite;
        }

        @keyframes pulseRing {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.05); opacity: 1; }
        }

        .hp-hero-content {
          position: relative;
          z-index: 2;
          padding: 40px 48px;
          width: 100%;
        }

        .hp-hero-eyebrow {
          font-size: 10px;
          font-weight: 700;
          color: #f5a800;
          letter-spacing: 3.5px;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .hp-hero-title {
          font-size: 38px;
          font-weight: 900;
          color: #ffffff;
          line-height: 1.1;
          letter-spacing: -0.5px;
          margin-bottom: 16px;
          max-width: 560px;
        }

        .hp-hero-title em {
          font-style: normal;
          color: #f5a800;
        }

        .hp-hero-sub {
          font-size: 14px;
          color: rgba(255,255,255,0.65);
          max-width: 420px;
          line-height: 1.6;
          margin-bottom: 28px;
        }

        .hp-hero-cta {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 13px 28px;
          background: #f5a800;
          color: #983929;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          text-decoration: none;
          transition: background 0.18s, transform 0.15s;
        }

        .hp-hero-cta:hover {
          background: #e09500;
          transform: translateX(3px);
        }

        .hp-hero-cta-arrow {
          font-size: 16px;
          transition: transform 0.15s;
        }

        .hp-hero-cta:hover .hp-hero-cta-arrow { transform: translateX(4px); }

        /* Quick nav strip */
        .hp-quicknav {
          background: #ffffff;
          border-bottom: 3px solid #f5a800;
          padding: 0 48px;
          display: flex;
          gap: 0;
          overflow-x: auto;
          scrollbar-width: none;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }

        .hp-quicknav::-webkit-scrollbar { display: none; }

        .hp-quicknav-link {
          display: flex;
          align-items: center;
          padding: 16px 20px;
          font-size: 11px;
          font-weight: 700;
          color: #983929;
          text-decoration: none;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          white-space: nowrap;
          border-bottom: 3px solid transparent;
          margin-bottom: -3px;
          transition: color 0.15s, border-color 0.15s;
        }

        .hp-quicknav-link:hover {
          color: #f5a800;
          border-bottom-color: #f5a800;
        }

        /* Content cards grid */
        .hp-cards {
          padding: 40px 48px;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        .hp-card {
          background: #ffffff;
          border-radius: 2px;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(0,0,0,0.07);
          transition: transform 0.18s, box-shadow 0.18s;
          text-decoration: none;
          display: block;
        }

        .hp-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        }

        .hp-card-accent {
          height: 4px;
          background: #f5a800;
        }

        .hp-card-body {
          padding: 24px 26px 26px;
        }

        .hp-card-eyebrow {
          font-size: 9px;
          font-weight: 700;
          color: #f5a800;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .hp-card-title {
          font-size: 17px;
          font-weight: 800;
          color: #983929;
          margin-bottom: 10px;
          line-height: 1.25;
        }

        .hp-card-desc {
          font-size: 13px;
          color: #64748b;
          line-height: 1.6;
        }

        .hp-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 26px;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
        }

        .hp-card-link {
          font-size: 11px;
          font-weight: 700;
          color:#983929;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          text-decoration: none;
          transition: color 0.15s;
        }

        .hp-card-link:hover { color: #f5a800; }

        .hp-card-arrow {
          font-size: 18px;
          color: #f5a800;
        }

        /* Parent login badge (mirrors DAIS) */
        .hp-parent-login {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 100;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: #983929;
          color: #ffffff;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-decoration: none;
          box-shadow: 0 4px 20px rgba(26,58,107,0.35);
          border-left: 3px solid #f5a800;
          transition: background 0.18s;
        }

        .hp-parent-login:hover { background: #f5a800; color: #983929; }

        .hp-parent-login-icon { font-size: 14px; }

        /* ── Responsive ── */
        @media (max-width: 860px) {
          .hp-sidebar {
              display: flex;
              width: 100%;
              min-width: 100%;
              height: auto;
              position: relative;
            }

            .hp-main {
              display: none;
            }

            .hp-root {
              flex-direction: column;
            }

            .hp-parent-login {
              bottom: 16px;
              right: 16px;
            }

          .hp-hero { height: 320px; }
          .hp-hero-title { font-size: 26px; }
          .hp-hero-content { padding: 28px 24px; }
          .hp-quicknav { padding: 0 16px; }
          .hp-cards { padding: 24px 16px; grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="hp-root">
        {/* ── SIDEBAR ── */}
        <aside className="hp-sidebar">
          {/* Logo block */}
          <Link to="/" className="hp-sb-logo">
            <div className="hp-sb-logo-circle">
              <img src={SchoolLogo} alt="JNPV Logo" className="hp-sb-logo-img" />
            </div>
            <div className="hp-sb-logo-name">JNPV</div>
            <div className="hp-sb-logo-sub">Education</div>
          </Link>

          {/* Sections */}
          {sidebarSections.map((sec) => (
            <div
              key={sec.id}
              className={`hp-sb-section${activeSection === sec.id ? " active" : ""}`}
              onClick={() => setActiveSection(activeSection === sec.id ? null : sec.id)}
            >
              <div className="hp-sb-section-title">{sec.title}</div>
              <div className="hp-sb-section-sub">{sec.subtitle}</div>

              {sec.highlights && (
                <div className={`hp-sb-highlight${sec.accentHighlights ? " accent" : ""}`}>
                  {sec.accentHighlights
                    ? sec.highlights.join("  •  ")
                    : sec.highlights.map((h, i) => (
                      <div key={i}>· {h}</div>
                    ))}
                </div>
              )}

              {sec.news && (
                <div style={{ marginTop: "4px" }}>
                  {sec.news.map((n, i) => (
                    <Link key={i} to={n.href} className="hp-sb-news-item" onClick={(e) => e.stopPropagation()}>
                      <span className="hp-sb-news-dot" />
                      {n.label}
                    </Link>
                  ))}
                </div>
              )}

              {sec.link && (
                <Link to={sec.link} className="hp-sb-link" onClick={(e) => e.stopPropagation()}>
                  {sec.linkLabel} →
                </Link>
              )}
            </div>
          ))}

          {/* Connect block */}
          <div className="hp-sb-connect">
            <div className="hp-sb-connect-label">Connect with us</div>
            <div className="hp-sb-connect-links">
              <a href="#" className="hp-sb-connect-link">YouTube</a>
              <a href="#" className="hp-sb-connect-link">Facebook</a>
              <a href="#" className="hp-sb-connect-link">Instagram</a>
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="hp-main">
          <div className="hp-slider">
            <img
              src={images[currentImage]}
              alt={`Slide ${currentImage + 1}`}
              className="hp-slider-image"
            />
          </div>
          {/* Hero */}
          {/* <div className="hp-hero">
            <div className="hp-hero-bg" />
            <div className="hp-hero-circle" style={{ width: 500, height: 500, top: -150, right: -100 }} />
            <div className="hp-hero-circle" style={{ width: 320, height: 320, top: -60, right: 40, animationDelay: "2s" }} />
            <div className="hp-hero-circle" style={{ width: 160, height: 160, top: 30, right: 180, animationDelay: "4s" }} />

            <div className="hp-hero-content">
              <div className="hp-hero-eyebrow">Welcome to JNPV Education</div>
              <h1 className="hp-hero-title">
                Shaping <em>Leaders</em> of<br />Tomorrow
              </h1>
              <p className="hp-hero-sub">
                A legacy of academic excellence, holistic growth, and values-driven education in the heart of Mumbai.
              </p>
              <Link to="/about-us" className="hp-hero-cta">
                Discover Our Story
                <span className="hp-hero-cta-arrow">→</span>
              </Link>
            </div>
          </div> */}

          {/* Quick nav strip */}
          {/* <nav className="hp-quicknav">
            {quickNavLinks.map((link) => (
              <Link key={link.label} to={link.href} className="hp-quicknav-link">
                {link.label}
              </Link>
            ))}
          </nav> */}

          {/* Cards grid */}
          {/* <div className="hp-cards">
            {[
              {
                eyebrow: "Academics",
                title: "World-Class Curriculum",
                desc: "CBSE-affiliated programmes designed to challenge, inspire, and prepare students for global opportunities.",
                href: "/academics",
                label: "Explore Academics",
              },
              {
                eyebrow: "Admissions",
                title: "Join the JNPV Family",
                desc: "Applications now open for the 2025–26 academic year. Start your journey with us today.",
                href: "/admissions",
                label: "Apply Now",
              },
              {
                eyebrow: "Campus Life",
                title: "A Campus Built to Inspire",
                desc: "State-of-the-art facilities, sprawling green spaces, and a vibrant community at our Mumbai campus.",
                href: "/campus",
                label: "See the Campus",
              },
              {
                eyebrow: "Results",
                title: "Outstanding Achievements",
                desc: "Year after year, our students excel at board exams and secure placements at top universities worldwide.",
                href: "/results-and-university",
                label: "View Results",
              },
            ].map((card) => (
              <Link key={card.title} to={card.href} className="hp-card">
                <div className="hp-card-accent" />
                <div className="hp-card-body">
                  <div className="hp-card-eyebrow">{card.eyebrow}</div>
                  <div className="hp-card-title">{card.title}</div>
                  <div className="hp-card-desc">{card.desc}</div>
                </div>
                <div className="hp-card-footer">
                  <span className="hp-card-link">{card.label}</span>
                  <span className="hp-card-arrow">→</span>
                </div>
              </Link>
            ))}
          </div> */}
        </main>
      </div>

      {/* Parent login badge */}
      <Link to="/login" className="hp-parent-login">
        <span className="hp-parent-login-icon">🔒</span>
        Parent's Login
      </Link>
    </div>
  );
}