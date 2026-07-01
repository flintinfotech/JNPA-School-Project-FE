
import schoolLogo from '../assets/SchoolLogo.avif';
import schoolBuilding from '../assets/Eventss.jpg';
import AnnaulDay from '../assets/EventsImages/AnnualD.png';
import GraduationDay from '../assets/EventsImages/FairsExhibitions.png';
import EventsandCelebrations from '../assets/EventsImages/Events.png';
import VisitsandOutings from '../assets/EventsImages/Visits&Outings.png';
import Visitors from '../assets/EventsImages/Visitor.png';
import LanguageDayCelebrations from '../assets/EventsImages/LanguageD.png';
import InterHouseEvents from '../assets/EventsImages/InterHoseEvents.png';
import LeadershipSeries from '../assets/EventsImages/Leadership.png';

export default function Events() {
  const events = [
    { title: 'Annual Day', icon: '🎭', image: AnnaulDay, href: '#' },
    { title: 'Fairs & Exhibitions', icon: '🎪', image: GraduationDay, href: '#' },
    { title: 'Events and Celebrations', icon: '🎉', image: EventsandCelebrations, href: '/events-and-celebrations' },
    { title: 'Visits and Outings', icon: '🚶', image: VisitsandOutings, href: '/visits-and-outings' },
    { title: 'Visitors', icon: '🧑‍💼', image: Visitors, href: '/visitors' },
    { title: 'Language Day Celebrations', icon: '🅰️', image: LanguageDayCelebrations, href: '/language-day-celebrations' },
    { title: 'Inter - House Events', icon: '🏠', image: InterHouseEvents, href: '#' },
    { title: 'Leadership Series', icon: '🌐', image: LeadershipSeries, href: '/leadership-series' },
  ];

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
          margin: 0 0 32px;
        }

        /* ---------- event cards ---------- */
        .dais-about .event-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }

        .dais-about .event-card {
          display: block;
          text-decoration: none;
          color: inherit;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
          overflow: hidden;
        }

        .dais-about .event-image {
          width: 100%;
          aspect-ratio: 4 / 3;
          overflow: hidden;
        }

        .dais-about .event-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.25s ease;
        }

        .dais-about .event-card:hover .event-image img {
          transform: scale(1.05);
        }

        .dais-about .event-footer {
          position: relative;
          background: linear-gradient(180deg, #f9bb3c, #e89500);
          padding: 34px 16px 18px;
          text-align: center;
        }

        .dais-about .event-icon {
          position: absolute;
          top: -28px;
          left: 50%;
          transform: translateX(-50%);
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18);
        }

        .dais-about .event-name {
          color: #fff;
          font-size: 17px;
          font-weight: 600;
          margin: 6px 0 0;
          line-height: 1.3;
        }

        /* ---------- responsive ---------- */
        @media (max-width: 1024px) {
          .dais-about .event-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 900px) {
          .dais-about .main-content {
            width: 90%;
            padding: 0 0 36px;
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

          .dais-about .event-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 18px;
          }
        }

        @media (max-width: 480px) {
          .dais-about .main-content {
            width: 100%;
            padding: 0 16px 30px;
          }

          .dais-about .event-grid {
            grid-template-columns: 1fr;
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
          <h1 className="page-title">Events</h1>
        </div>
      </header>

      <div className="hero-image">
        <img
          src={schoolBuilding}
          alt="Jawaharlal Nehru Port Vidyalaya building"
        />
      </div>

      <div className="content-wrap">
        <main className="main-content">
          <h2 className="section-title">Events</h2>

          <div className="event-grid">
            {events.map((event) => (
              <a className="event-card" href={event.href} key={event.title}>
                <div className="event-image">
                  <img src={event.image} alt={event.title} />
                </div>
                <div className="event-footer">
                  <div className="event-icon">{event.icon}</div>
                  <p className="event-name">{event.title}</p>
                </div>
              </a>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}