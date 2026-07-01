import { useState } from 'react';
import schoolLogo from '../assets/SchoolLogo.avif';
import EventsAndCelebration from '../assets/laanguagedaycelebration.jpg';
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
export default function LanguageDayAndCelebrations() {
  const [navOpen, setNavOpen] = useState(false);

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
        .dais-about .intro-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 36px;
          align-items: start;
          margin-bottom: 30px;
        }

        .dais-about .intro-text {
          font-size: 14.5px;
          line-height: 1.85;
          color: #333;
          text-align: justify;
        }

        .dais-about .intro-text p {
          margin: 0;
        }

        /* ---------- language day text + list ---------- */
        .dais-about .language-text {
          font-size: 14.5px;
          line-height: 1.85;
          color: #333;
          text-align: justify;
          margin-bottom: 20px;
        }

        .dais-about .language-list {
          list-style: none;
          margin: 26px 0 0;
          padding: 0;
        }

        .dais-about .language-list li {
          position: relative;
          padding: 16px 0 16px 22px;
          border-bottom: 1px solid #f0d9a8;
          font-size: 16px;
          color: #333;
        }

        .dais-about .language-list li:last-child {
          border-bottom: none;
        }

        .dais-about .language-list li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 24px;
          width: 8px;
          height: 8px;
          background: #e8a400;
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

          .dais-about .intro-row {
            grid-template-columns: 1fr;
          }

          .dais-about .gallery-row {
            grid-template-columns: 1fr;
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
              alt="Jawaharlal Nehru Port Vidyalaya building"
              className="brand-logo"
            />
          </div>
        </div>

        <div className="breadcrumb-wrap">
          <h1 className="page-title">Language Day Celebrations</h1>
        </div>
      </header>

      <div className="hero-image">
        <img
          src={EventsAndCelebration}
          alt="Jawaharlal Nehru Port Vidyalaya building"
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
                    <li key={item} className={item === 'Language Day Celebrations' ? 'active' : ''}>
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
              <h2 className="section-title">LANGUAGE DAY CELEBRATIONS</h2>

              <div className="language-text">
                <p>
                  The world today is a melting pot of cultural diversity, which makes foreign
                  languages a key part of growing up ready to understand and engage with this
                  globally connected domain. JNPV makes earnest efforts to build a student
                  community that is not only knowledgeable but also culturally aware, through
                  an early introduction to foreign languages.
                </p>
              </div>

              <div className="language-text">
                <p>
                  Our school places emphasis on teaching a second language from an early age.
                  Students are taught Hindi right from the Primary Level, with the option of
                  studying Gujarati or Marathi through to the Secondary Level. Foreign
                  languages such as French and Spanish are introduced at the Middle School
                  Level. We believe that exposing students to multiple languages widens their
                  access to people and resources, and supports better communication and richer
                  travel experiences.
                </p>
              </div>

              <div className="language-text">
                <p>
                  Learning different languages, both native and foreign, helps our students
                  build a deeper understanding of varied cultures and unfamiliar customs. Our
                  students and teachers take an active part in Language Day celebrations, where
                  they showcase an appreciation of the multi-cultural world. Students take part
                  in a range of activities that promote international mindedness.
                </p>
              </div>

              <ul className="language-list">
                <li>International Mother Language Day - 2024</li>
                <li>Hindi Divas Samaroh - 2015</li>
                <li>Hindi Divas Samaroh - 2014</li>
                <li>Hindi Divas Samaroh - 2013</li>
                <li>Spanish Day Celebrations - 2014</li>
                <li>Spanish Day Video</li>
                <li>French Workshop 2014</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}