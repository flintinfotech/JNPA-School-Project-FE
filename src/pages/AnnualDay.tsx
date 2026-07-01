import { useState } from 'react';
import schoolLogo from '../assets/SchoolLogo.avif';
import annual1 from '../assets/annual1.png';
import annual2 from '../assets/annual2.jpg';
import annual3 from '../assets/annual3.jpg';
import annual4 from '../assets/annual4.jpg';

export default function AnnualDay() {
  const images = [annual4, annual2, annual3];
  const [activeImage, setActiveImage] = useState<string | null>(null);

  const highlights = [
    {
      icon: '🎭',
      title: 'Dance & Drama',
      desc: 'Students from every grade come together to perform classical, folk and contemporary dance pieces alongside short theatrical acts.',
    },
    {
      icon: '🎤',
      title: 'Music Performances',
      desc: 'Solo and group singing performances, along with instrumental showcases, celebrate the musical talent nurtured across the school.',
    },
    {
      icon: '🏆',
      title: 'Awards & Recognition',
      desc: 'The evening also honours students for academic excellence, sportsmanship and outstanding contributions through the year.',
    },
    {
      icon: '🎇',
      title: 'Grand Finale',
      desc: 'A spectacular closing act featuring the entire school community, complete with lights, music and a fitting send-off to the year.',
    },
  ];

  return (
    <div className="dais-annual-day">
      <style>{`
        .dais-annual-day {
          font-family: 'Segoe UI', system-ui, sans-serif;
          color: #333;
          background: #fff;
        }

        /* ---------- header ---------- */
        .dais-annual-day .dais-header {
          position: relative;
          background: #1569ad;
        }

        .dais-annual-day .header-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 40px 10px;
        }

        .dais-annual-day .brand {
          display: flex;
          align-items: center;
        }

        .dais-annual-day .brand-logo {
          height: 78px;
          width: auto;
          display: block;
        }

        .dais-annual-day .breadcrumb-wrap {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 40px 26px;
        }

        .dais-annual-day .breadcrumb {
          color: rgba(255, 255, 255, 0.85);
          font-size: 13px;
          margin-bottom: 6px;
        }

        .dais-annual-day .breadcrumb a {
          color: rgba(255, 255, 255, 0.85);
          text-decoration: none;
        }

        .dais-annual-day .breadcrumb a:hover {
          text-decoration: underline;
        }

        .dais-annual-day .page-title {
          color: #fff;
          font-size: 34px;
          font-weight: 500;
          margin: 0;
        }

        /* ---------- hero image ---------- */
        .dais-annual-day .hero-image {
          width: 79%;
          overflow: hidden;
          margin: 0 auto;
          margin-top: -25px;
          margin-bottom: 20px;
          position: relative;
          z-index: 10;
        }

        .dais-annual-day .hero-image img {
          width: 100%;
          display: block;
          max-height: 460px;
          object-fit: cover;
        }

        /* ---------- content layout ---------- */
        .dais-annual-day .main-content {
          width: 79%;
          margin: 0 auto;
          padding: 0 0 50px;
        }

        .dais-annual-day .section-title {
          color: #2a78b5;
          font-size: 30px;
          font-weight: 500;
          letter-spacing: 0.5px;
          margin: 0 0 12px;
        }

        .dais-annual-day .section-desc {
          color: #555;
          font-size: 16px;
          line-height: 1.7;
          max-width: 900px;
          margin: 0 0 18px;
        }

        .dais-annual-day .section-desc:last-of-type {
          margin-bottom: 36px;
        }

        /* ---------- event info bar ---------- */
        .dais-annual-day .info-bar {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          background: #f4f8fb;
          border-left: 4px solid #2a78b5;
          padding: 22px 26px;
          margin-bottom: 40px;
        }

        .dais-annual-day .info-item .info-label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          color: #2a78b5;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .dais-annual-day .info-item .info-value {
          font-size: 15px;
          color: #333;
          font-weight: 600;
        }

        /* ---------- highlights ---------- */
        .dais-annual-day .highlights-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
          margin-bottom: 48px;
        }

        .dais-annual-day .highlight-card {
          display: flex;
          gap: 16px;
          padding: 22px;
          background: #fff;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
          border-radius: 6px;
        }

        .dais-annual-day .highlight-icon {
          flex: 0 0 auto;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(180deg, #f9bb3c, #e89500);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
        }

        .dais-annual-day .highlight-title {
          font-size: 17px;
          font-weight: 700;
          color: #1a3a6b;
          margin: 0 0 6px;
        }

        .dais-annual-day .highlight-desc {
          font-size: 14px;
          color: #666;
          line-height: 1.6;
          margin: 0;
        }

        /* ---------- gallery ---------- */
        .dais-annual-day .gallery-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-bottom: 48px;
        }

        .dais-annual-day .gallery-item {
          position: relative;
          aspect-ratio: 4 / 3;
          overflow: hidden;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
          cursor: pointer;
        }

        .dais-annual-day .gallery-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.3s ease;
        }

        .dais-annual-day .gallery-item:hover img {
          transform: scale(1.06);
        }

        /* ---------- quote ---------- */
        .dais-annual-day .quote-block {
          background: linear-gradient(180deg, #1569ad, #0f5590);
          color: #fff;
          padding: 40px;
          text-align: center;
          border-radius: 6px;
        }

        .dais-annual-day .quote-text {
          font-size: 20px;
          font-style: italic;
          line-height: 1.6;
          max-width: 760px;
          margin: 0 auto 14px;
        }

        .dais-annual-day .quote-author {
          font-size: 14px;
          font-weight: 700;
          color: #f9bb3c;
          letter-spacing: 0.5px;
        }

        /* ---------- lightbox ---------- */
        .dais-annual-day .lightbox-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 24px;
        }

        .dais-annual-day .lightbox-overlay img {
          max-width: 90vw;
          max-height: 85vh;
          object-fit: contain;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        }

        .dais-annual-day .lightbox-close {
          position: absolute;
          top: 24px;
          right: 32px;
          background: linear-gradient(180deg, #f9bb3c, #e89500);
          color: #1a2a40;
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          font-size: 20px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ---------- responsive ---------- */
        @media (max-width: 900px) {
          .dais-annual-day .main-content {
            width: 90%;
            padding: 0 0 36px;
          }

          .dais-annual-day .info-bar {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 768px) {
          .dais-annual-day .header-inner {
            flex-direction: column;
            justify-content: center;
            padding: 16px 16px 14px;
          }

          .dais-annual-day .brand {
            justify-content: center;
            width: 100%;
            margin-bottom: 20px;
          }

          .dais-annual-day .brand-logo {
            height: 64px;
          }

          .dais-annual-day .breadcrumb-wrap {
            display: none;
          }

          .dais-annual-day .main-content {
            width: 92%;
          }

          .dais-annual-day .info-bar {
            grid-template-columns: 1fr;
          }

          .dais-annual-day .highlights-grid {
            grid-template-columns: 1fr;
          }

          .dais-annual-day .gallery-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 18px;
          }
        }

        @media (max-width: 480px) {
          .dais-annual-day .main-content {
            width: 100%;
            padding: 0 16px 30px;
          }

          .dais-annual-day .gallery-grid {
            grid-template-columns: 1fr;
          }

          .dais-annual-day .quote-block {
            padding: 28px 20px;
          }

          .dais-annual-day .quote-text {
            font-size: 17px;
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
          <p className="breadcrumb">
            <a href="/events">Events</a> / Annual Day
          </p>
          <h1 className="page-title">Annual Day</h1>
        </div>
      </header>

      <div className="hero-image">
        <img src={annual1} alt="Annual Day performance on stage" />
      </div>

      <div className="content-wrap">
        <main className="main-content">
          <h2 className="section-title">Annual Day</h2>
          <p className="section-desc">
            Annual Day at Jawaharlal Nehru Port Vidyalaya is one of the most
            anticipated events on the school calendar — a celebration of
            talent, creativity and the spirit of our students, brought to
            life through dance, music and drama performances each year.
          </p>
          <p className="section-desc">
            Every class contributes to the evening's programme, with months
            of rehearsals culminating in a vibrant showcase attended by
            parents, staff and special guests. The event reflects the
            school's commitment to nurturing well-rounded individuals who
            excel both inside and outside the classroom.
          </p>

          <div className="info-bar">
            <div className="info-item">
              <div className="info-label">Date</div>
              <div className="info-value">15th December</div>
            </div>
            <div className="info-item">
              <div className="info-label">Venue</div>
              <div className="info-value">School Amphitheatre</div>
            </div>
            <div className="info-item">
              <div className="info-label">Theme</div>
              <div className="info-value">Unity in Diversity</div>
            </div>
          </div>

          <div className="highlights-grid">
            {highlights.map((h) => (
              <div className="highlight-card" key={h.title}>
                <div className="highlight-icon">{h.icon}</div>
                <div>
                  <p className="highlight-title">{h.title}</p>
                  <p className="highlight-desc">{h.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="gallery-grid">
            {images.map((img, idx) => (
              <div
                className="gallery-item"
                key={idx}
                onClick={() => setActiveImage(img)}
              >
                <img src={img} alt={`Annual Day highlight ${idx + 1}`} />
              </div>
            ))}
          </div>

          <div className="quote-block">
            <p className="quote-text">
              "Annual Day is more than a performance — it is where our
              students discover their confidence, creativity and love for
              the stage."
            </p>
            <p className="quote-author">— Principal, JNPV School</p>
          </div>
        </main>
      </div>

      {activeImage && (
        <div
          className="lightbox-overlay"
          onClick={() => setActiveImage(null)}
        >
          <button
            className="lightbox-close"
            onClick={() => setActiveImage(null)}
          >
            ×
          </button>
          <img src={activeImage} alt="Annual Day enlarged" />
        </div>
      )}
    </div>
  );
}