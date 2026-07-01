import { useState } from 'react';
import schoolLogo from '../assets/SchoolLogo.avif';
import EventsAndCelebration from '../assets/visitors.jpg';

const NAV_ITEMS = [
  'Annual Day',
  'Graduation Day',
  'Events and Celebrations',
  'Visits and Outings',
  'Visitors',
  'Language Day Celebrations',
  'Inter House Events',
  'Leadership Series',
  'Community Service',
];

export default function Visitors() {
  const [navOpen, setNavOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  return (
    <div className="dais-about">
      <style>{`
        .dais-about {
          font-family: 'Segoe UI', system-ui, sans-serif;
          color: #333;
          background: #fff;
        }

        /* ---------- header ---------- */
        .dais-about .dais-header {
          position: relative;
          background: #1569ad;
        }

        .dais-about .header-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 40px 10px;
        }

        .dais-about .brand {
          display: flex;
          align-items: center;
        }

        .dais-about .brand-logo {
          height: 78px;
          width: auto;
          display: block;
        }

        .dais-about .menu-wrapper {
          position: absolute;
          top: 12px;
          right: 0;
        }

        .dais-about .menu-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(180deg, #f9bb3c, #e89500);
          color: #1a2a40;
          border: none;
          font-weight: 700;
          font-size: 14px;
          letter-spacing: 0.5px;
          padding: 10px 18px;
          cursor: pointer;
        }

        .dais-about .menu-caret {
          font-size: 11px;
          transition: transform 0.2s ease;
        }

        .dais-about .menu-btn.open .menu-caret {
          transform: rotate(180deg);
        }

        .dais-about .menu-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          min-width: 220px;
          background: #fff;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18);
          z-index: 50;
          overflow: hidden;
        }

        .dais-about .menu-dropdown a {
          display: block;
          padding: 12px 20px;
          color: #1a3a6b;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          border-bottom: 1px solid #eee;
        }

        .dais-about .menu-dropdown a:hover {
          background: #f5f8fb;
        }

        .dais-about .breadcrumb-wrap {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 40px 26px;
        }

        .dais-about .breadcrumb {
          color: rgba(255, 255, 255, 0.85);
          font-size: 13px;
          margin-bottom: 6px;
        }

        .dais-about .page-title {
          color: #fff;
          font-size: 34px;
          font-weight: 500;
          margin: 0;
        }

        /* ---------- hero image ---------- */
        .dais-about .hero-image {
          width: 79%;
          overflow: hidden;
          margin: 0 auto;
          margin-top: -25px; /* overlap */
          margin-bottom: 20px;
          position: relative;
          z-index: 10; /* bring above header */
        }

        .dais-about .hero-image img {
          width: 100%;
          display: block;
          max-height: 460px;
          object-fit: cover;
        }

        /* ---------- content layout ---------- */

        .dais-about .main-content {
          width: 79%;
          margin: 0 auto;
          padding: 0 0 50px;
        }

        .dais-about .section-title {
          color: #2a78b5;
          font-size: 30px;
          font-weight: 500;
          letter-spacing: 0.5px;
          margin: 0 0 22px;
        }

        /* ---------- page body: nav sidebar + content ---------- */
        .dais-about .page-body {
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 36px;
          align-items: start;
        }

        /* ---------- Open Navigation ---------- */
        .dais-about .nav-sidebar {
          display: flex;
          flex-direction: column;
        }

        .dais-about .nav-toggle-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          background: linear-gradient(180deg, #f9bb3c, #e89500);
          color: #1a2a40;
          border: none;
          font-weight: 700;
          font-size: 15px;
          letter-spacing: 0.3px;
          padding: 14px 20px;
          cursor: pointer;
          text-align: left;
        }

        .dais-about .nav-toggle-icon {
          font-size: 16px;
          font-weight: 700;
          line-height: 1;
        }

        .dais-about .nav-list {
          list-style: none;
          margin: 0;
          padding: 0;
          border: 1px solid #e89500;
          border-top: none;
        }

        .dais-about .nav-list li a {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f6a821;
          color: #fff;
          font-size: 14.5px;
          font-weight: 500;
          padding: 13px 18px;
          text-decoration: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.35);
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .dais-about .nav-list li:last-child a {
          border-bottom: none;
        }

        .dais-about .nav-list li a:hover,
        .dais-about .nav-list li.active a {
          background: #e08e00;
        }

        .dais-about .nav-list li a .nav-chevron {
          font-size: 12px;
        }

        /* ---------- content column ---------- */
        .dais-about .content-main {
          min-width: 0;
        }

        /* ---------- intro text ---------- */
        .dais-about .visitors-intro {
          font-size: 14.5px;
          line-height: 1.85;
          color: #333;
          text-align: justify;
          margin: 0 0 30px;
        }

        /* ---------- year grid (visitors by year) — masonry columns ---------- */
        .dais-about .year-grid {
          column-count: 2;
          column-gap: 28px;
        }

        .dais-about .year-card {
          break-inside: avoid;
          -webkit-column-break-inside: avoid;
          background: #ececec;
          padding: 14px;
          margin-bottom: 28px;
          display: inline-block;
          width: 100%;
        }

        .dais-about .year-card-inner {
          background: #fff;
          padding: 20px 22px 22px;
        }

        .dais-about .year-title {
          color: #1569ad;
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 12px;
        }

        .dais-about .visitor-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .dais-about .visitor-list li {
          position: relative;
          padding-left: 16px;
          margin-bottom: 10px;
          font-size: 14.5px;
          line-height: 1.5;
          color: #1569ad;
        }

        .dais-about .visitor-list li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 4px;
          width: 2px;
          height: 14px;
          background: #f5a800;
        }

        .dais-about .card-photo {
          position: relative;
          overflow: hidden;
          margin-top: 16px;
          margin-left: -22px;
          margin-right: -22px;
          margin-bottom: -22px;
          cursor: pointer;
        }

        .dais-about .card-photo img {
          width: 100%;
          display: block;
          object-fit: cover;
        }

        .dais-about .photo-gallery-tag {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: #1569ad;
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          padding: 12px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .dais-about .photo-gallery-icon {
          font-size: 14px;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ---------- lightbox ---------- */
        .dais-about .lightbox-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 30px;
        }

        .dais-about .lightbox-box {
          position: relative;
          max-width: 900px;
          max-height: 85vh;
          width: 100%;
        }

        .dais-about .lightbox-box img {
          width: 100%;
          height: 100%;
          max-height: 85vh;
          object-fit: contain;
          display: block;
        }

        .dais-about .lightbox-close {
          position: absolute;
          top: -40px;
          right: 0;
          background: transparent;
          border: none;
          color: #fff;
          font-size: 30px;
          line-height: 1;
          cursor: pointer;
        }

        /* ---------- responsive ---------- */
        @media (max-width: 900px) {
          .dais-about .main-content {
            width: 90%;
            padding: 0 0 36px;
          }

          .dais-about .page-body {
            grid-template-columns: 1fr;
          }

          .dais-about .year-grid {
            column-count: 1;
          }
        }

        @media (max-width: 768px) {
          .dais-about .header-inner {
            flex-direction: column;
            justify-content: center;
            padding: 16px 16px 14px;
          }

          .dais-about .brand {
            justify-content: center;
            width: 100%;
            margin-bottom: 20px;
          }

          .dais-about .brand-logo {
            height: 64px;
          }

          .dais-about .menu-wrapper {
            top: 8px;
            right: 8px;
          }

          .dais-about .breadcrumb-wrap {
            display: none;
          }

          .dais-about .main-content {
            width: 92%;
          }
        }

        @media (max-width: 480px) {
          .dais-about .main-content {
            width: 100%;
            padding: 0 16px 30px;
          }
        }
      `}</style>

      <header className="dais-header">
        <div className="header-inner">
          <div className="brand">
            <img
              src={schoolLogo}
              alt="Jawahar Navodaya Parishad Vidyalaya building"
              className="brand-logo"
            />
          </div>
        </div>

        <div className="breadcrumb-wrap">
          <h1 className="page-title">Visitors</h1>
        </div>
      </header>

      <div className="hero-image">
        <img
          src={EventsAndCelebration}
          alt="Jawahar Navodaya Parishad Vidyalaya building"
        />
      </div>

      <div className="content-wrap">
        <main className="main-content">
          <div className="page-body">
            {/* ---------- Open Navigation sidebar ---------- */}
            <aside className="nav-sidebar">
              <button
                type="button"
                className="nav-toggle-btn"
                onClick={() => setNavOpen((prev) => !prev)}
              >
                <span>Open Navigation</span>
                <span className="nav-toggle-icon">{navOpen ? '−' : '+'}</span>
              </button>

              {navOpen && (
                <ul className="nav-list">
                  {NAV_ITEMS.map((item) => (
                    <li key={item} className={item === 'Visitors' ? 'active' : ''}>
                      <a href="#!">
                        <span className="nav-chevron">›</span>
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </aside>

            {/* ---------- main content column ---------- */}
            <div className="content-main">
              <h2 className="section-title">VISITORS</h2>

              <p className="visitors-intro">
                We welcome distinguished guests from various walks of life to visit our school
                and share their knowledge and experience with our students and faculty. Over
                the years, JNPV has hosted educators, scientists, artists, sports personalities
                and community leaders who have enriched our students&apos; learning journey
                through their presence and interaction.
              </p>

              <div className="year-grid">
                <div className="year-card">
                  <div className="year-card-inner">
                    <h3 className="year-title">2025 - 2026</h3>
                    <ul className="visitor-list">
                      <li>Nikkolas Smith visit</li>
                    </ul>
                  </div>
                </div>

                <div className="year-card">
                  <div className="year-card-inner">
                    <h3 className="year-title">2024 - 2025</h3>
                    <ul className="visitor-list">
                      <li>IACAC President visit</li>
                      <li>Visit by Anglia Ruskin University for DAIS Art students</li>
                      <li>PYP Consultant Visit- Ms Sharon Bailey</li>
                    </ul>
                    <div
                      className="card-photo"
                      onClick={() => setLightboxImage(EventsAndCelebration)}
                    >
                      <img src={EventsAndCelebration} alt="Visitor session" />
                      <div className="photo-gallery-tag">
                        Photo Gallery
                        <span className="photo-gallery-icon">🔍</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="year-card">
                  <div className="year-card-inner">
                    <h3 className="year-title">2023 - 2024</h3>
                    <ul className="visitor-list">
                      <li>A Poet in our Midst</li>
                      <li>Dr Jean Lou Chameau</li>
                      <li>A Poet in our Midst</li>
                    </ul>
                    <div
                      className="card-photo"
                      onClick={() => setLightboxImage(EventsAndCelebration)}
                    >
                      <img src={EventsAndCelebration} alt="Visitor session" />
                      <div className="photo-gallery-tag">
                        Photo Gallery
                        <span className="photo-gallery-icon">🔍</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="year-card">
                  <div className="year-card-inner">
                    <h3 className="year-title">2022 - 2023</h3>
                    <ul className="visitor-list">
                      <li>Nikkolas Smith visit</li>
                    </ul>
                    <div
                      className="card-photo"
                      onClick={() => setLightboxImage(EventsAndCelebration)}
                    >
                      <img src={EventsAndCelebration} alt="Visitor session" />
                      <div className="photo-gallery-tag">
                        Photo Gallery
                        <span className="photo-gallery-icon">🔍</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {lightboxImage && (
        <div
          className="lightbox-overlay"
          onClick={() => setLightboxImage(null)}
        >
          <div className="lightbox-box" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="lightbox-close"
              onClick={() => setLightboxImage(null)}
            >
              ×
            </button>
            <img src={lightboxImage} alt="Visitor session enlarged" />
          </div>
        </div>
      )}
    </div>
  );
}