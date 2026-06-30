import { useState } from 'react';
import schoolLogo from '../assets/SchoolLogo.avif';
import schoolBuilding from '../assets/Img1.webp';

const sidebarItems = [
  'About Us',
  'Our Inspiration',
  'Message from Founder & Chairperson and Vice-Chairperson',
  'Vision, Mission, Motto, Values & Objectives',
  'DAIS Philosophy',
  'DAIS Strategic Plan',
  'Unique Features',
];


export default function AboutUs() {
  const [activeItem, setActiveItem] = useState('About Us');

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
        .dais-about .content-wrap {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: flex-start;
        }

        .dais-about .sidebar {
          width: 280px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
        }

        .dais-about .sidebar-item {
          display: flex;
          align-items: center;
          gap: 10px;
          text-align: left;
          background: linear-gradient(180deg, #f9bb3c, #eb9d00);
          color: #1a3a6b;
          font-weight: 600;
          font-size: 15px;
          border: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.6);
          padding: 16px 22px;
          cursor: pointer;
          transition: filter 0.15s ease;
        }

        .dais-about .sidebar-item:hover {
          filter: brightness(1.05);
        }

        .dais-about .sidebar-item.active {
          filter: brightness(0.94);
        }

        .dais-about .chevron {
          color: #1a3a6b;
          font-size: 18px;
          font-weight: 700;
          line-height: 1;
        }

        .dais-about .main-content {
          flex: 1;
          padding: 44px 50px;
        }

        .dais-about .section-title {
          color: #2a78b5;
          font-size: 30px;
          font-weight: 500;
          letter-spacing: 0.5px;
          margin: 0 0 22px;
        }

        .dais-about .text-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 36px;
          font-family: Georgia, 'Times New Roman', serif;
          color: #444;
          font-size: 15px;
          line-height: 1.85;
          text-align: justify;
        }

        .dais-about .text-columns p {
          margin: 0 0 18px;
        }

        /* ---------- parent login ---------- */
        .dais-about .parent-login {
          position: fixed;
          bottom: 24px;
          right: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          background: #9c8563;
          color: #fff;
          border: none;
          padding: 12px 22px 12px 16px;
          border-radius: 6px 0 0 6px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
          z-index: 80;
        }

        .dais-about .parent-login svg {
          width: 16px;
          height: 16px;
        }

        /* ---------- responsive ---------- */
        @media (max-width: 900px) {
          .dais-about .content-wrap {
            flex-direction: column;
          }

          .dais-about .sidebar {
            width: 100%;
          }

          .dais-about .text-columns {
            grid-template-columns: 1fr;
          }

          .dais-about .main-content {
            padding: 32px 24px;
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

          .dais-about .sidebar-item {
            font-size: 14px;
            padding: 15px 18px;
          }

          .dais-about .parent-login {
            bottom: 16px;
            padding: 10px 18px 10px 14px;
            font-size: 13px;
          }
        }
      `}</style>

      <header className="dais-header">
        <div className="header-inner">
          <div className="brand">
            <img
              src={schoolLogo}
              alt="Dhirubhai Ambani International School"
              className="brand-logo"
            />
          </div>

        </div>

        <div className="breadcrumb-wrap">
          <h1 className="page-title">About Us</h1>
        </div>
      </header>

      <div className="hero-image">
        <img
          src={schoolBuilding}
          alt="Dhirubhai Ambani International School building"
        />
      </div>

      <div className="content-wrap">
        <aside className="sidebar">
          {sidebarItems.map((item) => (
            <button
              key={item}
              className={`sidebar-item ${item === activeItem ? 'active' : ''}`}
              onClick={() => setActiveItem(item)}
            >
              <span className="chevron">›</span>
              {item}
            </button>
          ))}
        </aside>

        <main className="main-content">
          <h2 className="section-title">THE SCHOOL</h2>

          <div className="text-columns">
            <div>
              <p>
                Dhirubhai Ambani International School is a K-12
                co-educational International Day School established in 2003,
                with a view to offering world-class educational opportunities
                in the city of Mumbai.
              </p>
              <p>
                The School is affiliated to the CISCE{' '}
                <em>(Council for the Indian School Certificate Examinations)</em>{' '}
                and CAIE <em>(Cambridge Assessment International Education)</em>,
                and prepares students for the ICSE{' '}
                <em>(Indian Certificate of Secondary Education)</em> and the
                IGCSE{' '}
                <em>
                  (International General Certificate of Secondary Education)
                </em>{' '}
                Year 10 examinations. For Years 11 and 12, we are authorised
                by the IB <em>(International Baccalaureate)</em> to offer the
                IB Diploma Programme.
              </p>
            </div>

            <div>
              <p>
                DAIS is recognised as a Microsoft Showcase School, thus
                joining a select league of schools globally for their vision
                and innovation in teaching, learning, and preparing students
                for the future.
              </p>
              <p>
                The student body, comprising 1,087 students, reflects the
                cultural diversity of India. The school has 187 teachers,
                with 27 being expatriates. With a teacher-student ratio of
                1:6, every child enjoys individualised attention.
              </p>
              <p>
                The School is recognised as India's premier international
                school, and is also among the top IB schools globally.
              </p>
            </div>
          </div>
        </main>
      </div>

      <button className="parent-login">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12zm0 2.4c-3.5 0-9.8 1.8-9.8 5.4v2.4h19.6v-2.4c0-3.6-6.3-5.4-9.8-5.4z" />
        </svg>
        Parent's Log in
      </button>
    </div>
  );
}