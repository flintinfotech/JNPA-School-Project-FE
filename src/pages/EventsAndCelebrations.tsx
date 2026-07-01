import { useState } from 'react';
import schoolLogo from '../assets/SchoolLogo.avif';
import EventsAndCelebration from '../assets/events_celebrations.jpg';
import eventcele1 from '../assets/eventcele1.jpg';
import eventcele2 from '../assets/eventcele2.jpg';
import eventcele3 from '../assets/eventcele3.jpg';

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

const YEAR_DATA = [
  { year: '2026', events: [] },
  {
    year: '2025',
    events: [
      'School Wins Annual Inter-School Math Meet',
      'Celebrating Excellence: Annual Awards Ceremony',
      '1st Annual Robotics Competition',
    ],
  },
  {
    year: '2024',
    events: [
      'Independence Day Celebrations',
      'Annual Sports Day Concludes Successfully',
      'Winners of Inter-House Quiz Announced',
    ],
  },
  {
    year: '2023',
    events: [
      'Grandparents Day Celebrations',
      'Annual Cultural Fest',
      'Science Exhibition Highlights',
    ],
  },
  {
    year: '2022',
    events: [
      'Teachers Day Special Assembly',
      'Diwali Celebrations at School',
      'Republic Day Programme',
    ],
  },
];

export default function EventsAndCelebrations() {
  const [navOpen, setNavOpen] = useState(false);
  const [openYear, setOpenYear] = useState('');

  const toggleYear = (year) => {
    setOpenYear((prev) => (prev === year ? null : year));
  };

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

        /* ---------- gallery rows ---------- */
        .dais-about .gallery-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
          align-items: stretch;
        }

        .dais-about .gallery-single,
        .dais-about .gallery-collage,
        .dais-about .gallery-pair {
          height: 100%;
        }

        .dais-about .gallery-single img,
        .dais-about .gallery-collage img,
        .dais-about .gallery-pair img {
          width: 100%;
          height: 100%;
          min-height: 260px;
          max-height: 320px;
          object-fit: cover;
          display: block;
        }

        .dais-about .gallery-collage .span-two {
          grid-column: 1 / -1;
        }

        .dais-about .gallery-pair img {
          min-height: 220px;
          max-height: 220px;
        }

        /* ---------- year accordion ---------- */
        .dais-about .year-accordion {
          border: 1px solid #cfe0ee;
        }

        .dais-about .year-block + .year-block {
          border-top: 1px solid rgba(255, 255, 255, 0.25);
        }

        .dais-about .year-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          background: #1569ad;
          color: #fff;
          font-size: 19px;
          font-weight: 500;
          padding: 16px 20px;
          border: none;
          cursor: pointer;
          text-align: left;
        }

        .dais-about .year-header:hover {
          background: #135f9c;
        }

        .dais-about .year-header .year-caret {
          font-size: 13px;
          transition: transform 0.2s ease;
        }

        .dais-about .year-header.open .year-caret {
          transform: rotate(180deg);
        }

        .dais-about .year-events {
          list-style: none;
          margin: 0;
          padding: 6px 0;
          background: #f5f8fb;
        }

        .dais-about .year-events li a {
          display: block;
          position: relative;
          padding: 10px 20px 10px 34px;
          color: #1a3a6b;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
        }

        .dais-about .year-events li a:hover {
          text-decoration: underline;
        }

        .dais-about .year-events li a::before {
          content: '';
          position: absolute;
          left: 20px;
          top: 16px;
          width: 7px;
          height: 7px;
          background: #e8a400;
        }

        .dais-about .year-events-empty {
          padding: 14px 20px;
          font-size: 13.5px;
          color: #7a8a9a;
          background: #f5f8fb;
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
          <h1 className="page-title">Events and Celebrations</h1>
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
                    <li key={item} className={item === 'Events and Celebrations' ? 'active' : ''}>
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
              <h2 className="section-title">EVENTS AND CELEBRATIONS</h2>

              <div className="intro-row">
                <div className="intro-text">
                  <p>
                    As part of our efforts to inculcate in students the appreciation of and
                    respect for India's rich heritage and diversity, and also to reinforce in
                    them national pride and respect for all, the school celebrates a number of
                    functions including Holi, Easter, Grandparents' Day, Raksha Bandhan,
                    Gokulashtami, Independence Day, Ganapathi Pooja and Visarjan, Teachers' Day,
                    Dassera, Diwali, Eid, Christmas, Makar Sankranti and Republic Day.
                  </p>
                </div>
                <div className="intro-text">
                  <p>
                    The Friday Assembly is an integral part of the calendar of activities at the
                    School. Each Friday morning the entire school gathers in the auditorium to
                    recite the school prayer, sing the school song and the National Anthem, and
                    watch a short presentation by one class. Throughout the year, each class
                    presents a programme on stage with the theme being either the festival that
                    is being celebrated at that time of the year or any thought-provoking idea
                    that can lend itself to drama, dance or music.
                  </p>
                </div>
              </div>

              <div className="gallery-row">
                <div className="gallery-single">
                  <img src={eventcele1} alt="School event celebration" />
                </div>
                <div className="gallery-collage">
                  <img src={eventcele3} alt="School event celebration" />
                </div>
              </div>

              <div className="gallery-row">
                <div className="gallery-pair">
                  <img src={eventcele2} alt="School event celebration" />
                </div>

                <div className="year-accordion">
                  {YEAR_DATA.map(({ year, events }) => {
                    const isOpen = openYear === year;
                    return (
                      <div className="year-block" key={year}>
                        <button
                          type="button"
                          className={`year-header${isOpen ? ' open' : ''}`}
                          onClick={() => toggleYear(year)}
                        >
                          <span>{year}</span>
                          <span className="year-caret">▲</span>
                        </button>

                        {isOpen && (
                          events.length > 0 ? (
                            <ul className="year-events">
                              {events.map((title) => (
                                <li key={title}>
                                  <a href="#!">{title}</a>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="year-events-empty">No events added yet.</div>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}