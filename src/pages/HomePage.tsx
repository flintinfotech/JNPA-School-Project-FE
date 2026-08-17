import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SchoolLogo from "../assets/SchoolLogo.avif";
import Img1 from "../assets/Img1.webp";
import Img2 from "../assets/Img2.webp";
import Img3 from "../assets/Img3.webp";
import Img4 from "../assets/Img4.webp";
import newsService, { type NewsDTO, sanitizeNewsData, base64ToBlobUrl } from "../services/NewsService";

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
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const images = [Img1, Img2, Img3, Img4];

  const [currentImage, setCurrentImage] = useState(0);
  const [newsItems, setNewsItems] = useState<NewsDTO[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 4000); // Change image every 4 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchNews() {
      try {
        const res = await newsService.getAllNews(
          0,
          5,
          controller.signal
        );

        const list = res.data?.newsDTOS ?? [];
        setNewsItems(list.slice(0, 3));
      } catch (err: any) {
        if (
          err.name !== "CanceledError" &&
          err.code !== "ERR_CANCELED"
        ) {
          setNewsItems([]);
          console.error("Failed to fetch news:", err);
        }
      }
    }

    fetchNews();

    return () => controller.abort();
  }, []);

  const handleNewsClick = (item: NewsDTO) => {
    const validData = sanitizeNewsData(item.newsData);
    if (!validData) return;
    const url = base64ToBlobUrl(validData);
    window.open(url, "_blank");
  };

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
          cursor: pointer;
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

        /* ── Fixed bottom-right quick actions (Admission Inquiry + Parent's Login) ── */
        .hp-quick-actions {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 100;
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: flex-end;
        }

        .hp-admission-Inquiry {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 11px;
          background:#983929;
          color: #ffffff;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-decoration: none;
          box-shadow: 0 4px 20px rgba(21,105,173,0.35);
          border-left: 3px solid #f5a800;
          transition: background 0.18s;
        }

        .hp-admission-Inquiry:hover { background: #f5a800; color:#983929; }

        .hp-admission-Inquiry-icon { font-size: 14px; }

        /* Parent login badge (mirrors DAIS) */
        .hp-parent-login {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 23px;
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

            .hp-quick-actions {
              bottom: 16px;
              right: 16px;
            }
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

              {sec.link && (
                <Link to={sec.link} className="hp-sb-link" onClick={(e) => e.stopPropagation()}>
                  {sec.linkLabel} →
                </Link>
              )}
            </div>
          ))}

          {/* News & Events (live data) */}
          <div className="hp-sb-section">
            <div className="hp-sb-section-title">News & Events</div>
            <div style={{ marginTop: "4px" }}>
              {newsItems.map((item, i) => (
                <span
                  key={item.newsId ?? i}
                  className="hp-sb-news-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNewsClick(item);
                  }}
                >
                  <span className="hp-sb-news-dot" />
                  {item.news}
                </span>
              ))}
            </div>
            <Link to="/events" className="hp-sb-link" onClick={(e) => e.stopPropagation()}>
              Read More →
            </Link>
          </div>

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
        </main>
      </div>

      {/* Fixed quick-action buttons: Admission Inquiry (top) + Parent's Login (bottom) */}
      <div className="hp-quick-actions">
        <Link to="/admissions" className="hp-admission-Inquiry">
          <span className="hp-admission-Inquiry-icon">📝</span>
          Admission Inquiry
        </Link>
        <Link to="" className="hp-parent-login">
          <span className="hp-parent-login-icon">🔒</span>
          Parent's Login
        </Link>
      </div>
    </div>
  );
}
