import { useState } from 'react';
import schoolLogo from '../assets/SchoolLogo.avif';
import EventsAndCelebration from '../assets/leadership-series.jpg';

const SPEAKER_DATA = {
  '2023': [
    [
      { name: 'Mr. Arjun Mehta', blurb: 'On 12th September, the virtual JNPV Leadership Series welcomed Mr. Arjun Mehta, who spoke about building resilient teams in changing industries...' },
      { name: 'Ms. Priya Nair', blurb: 'On 24th October, students heard from Ms. Priya Nair on the journey from student council to entrepreneurship and the lessons learnt along the way...' },
    ],
    [
      { name: 'Mr. Rohan Kulkarni', blurb: 'On 8th November, Mr. Rohan Kulkarni shared insights on innovation in the maritime and logistics sector and what it takes to lead through change...' },
      { name: 'Dr. Sunita Rao', blurb: 'On 2nd December, Dr. Sunita Rao spoke about leadership in science and research, and the discipline needed to pursue long-term goals...' },
    ],
    [
      { name: 'Mr. Vikram Shah', blurb: 'On 15th January, Mr. Vikram Shah discussed decision-making under pressure and how young leaders can build lasting confidence...' },
      { name: 'Ms. Ananya Desai', blurb: 'On 3rd February, Ms. Ananya Desai spoke about creative leadership and finding one\u2019s own voice in a competitive world...' },
    ],
  ],
  Archives: [
    [
      { name: 'Mr. Sameer Joshi', blurb: '2019 \u2013 Mr. Sameer Joshi spoke to students about the early years of building a business from the ground up...' },
      { name: 'Ms. Kavita Iyer', blurb: '2018 \u2013 Ms. Kavita Iyer shared her experience leading large teams through periods of rapid growth...' },
    ],
    [
      { name: 'Mr. Aditya Rao', blurb: '2016 \u2013 Mr. Aditya Rao discussed the role of mentorship in shaping the next generation of leaders...' },
      { name: 'Ms. Neha Kapoor', blurb: '2014 \u2013 Ms. Neha Kapoor spoke about balancing ambition with integrity throughout a career...' },
    ],
  ],
};

function initials(name) {
  return name
    .split(' ')
    .filter((w) => w.length > 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export default function LeadershipSeries() {
  const [activeTab, setActiveTab] = useState('2023');
  const [pageIndex, setPageIndex] = useState(0);

  const pages = SPEAKER_DATA[activeTab];
  const totalPages = pages.length;

  const changeTab = (tab) => {
    setActiveTab(tab);
    setPageIndex(0);
  };

  const goPrev = () => {
    setPageIndex((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const goNext = () => {
    setPageIndex((prev) => (prev + 1) % totalPages);
  };

  return (
    <div className="dais-about">
      <style>{`
        .dais-about,
        .dais-about * {
          box-sizing: border-box;
        }

        .dais-about {
          font-family: 'Segoe UI', system-ui, sans-serif;
          color: #333;
          background: #fff;
          overflow-x: hidden;
          width: 100%;
        }

        .dais-about img {
          max-width: 100%;
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

        /* ---------- page body: content ---------- */
        .dais-about .page-body {
          display: grid;
          grid-template-columns: 1fr;
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

        /* ---------- leadership body ---------- */
        .dais-about .leadership-body {
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          gap: 40px;
          align-items: start;
        }

        .dais-about .leadership-subtitle {
          color: #e0871f;
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 18px;
        }

        .dais-about .leadership-text {
          font-size: 14.5px;
          line-height: 1.85;
          color: #333;
          text-align: justify;
          margin-bottom: 20px;
        }

        /* ---------- yellow speakers box ---------- */
        .dais-about .speakers-box {
          background: #fbeecb;
          padding: 20px;
          width: 100%;
        }

        .dais-about .speakers-tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 18px;
        }

        .dais-about .speakers-tab {
          flex: 1;
          background: #f9d99a;
          border: none;
          color: #b5651d;
          font-size: 16px;
          font-weight: 600;
          padding: 12px 10px;
          cursor: pointer;
        }

        .dais-about .speakers-tab.active {
          background: #fff;
          color: #b5651d;
        }

        .dais-about .speakers-carousel {
          position: relative;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dais-about .speakers-arrow {
          flex-shrink: 0;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1.5px solid #e0871f;
          background: transparent;
          color: #e0871f;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .dais-about .speakers-arrow:hover {
          background: #e0871f;
          color: #fff;
        }

        .dais-about .speakers-cards {
          flex: 1;
          min-width: 0;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .dais-about .speaker-card {
          min-width: 0;
        }

        .dais-about .speaker-card-photo {
          width: 100%;
          aspect-ratio: 1 / 1;
          background: linear-gradient(135deg, #2a78b5, #1a3a6b);
          color: #fff;
          font-size: 32px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }

        .dais-about .speaker-name {
          display: block;
          color: #1a6fb5;
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .dais-about .speaker-blurb {
          font-size: 13.5px;
          line-height: 1.6;
          color: #333;
          margin: 0 0 10px;
          word-break: break-word;
        }

        .dais-about .speaker-link {
          color: #c0392b;
          font-size: 13.5px;
          font-weight: 600;
          text-decoration: none;
        }

        .dais-about .speaker-link:hover {
          text-decoration: underline;
        }

        .dais-about .speakers-dots {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          justify-content: center;
          margin-top: 20px;
        }

        .dais-about .speakers-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #fff;
          border: 1px solid #e0c07f;
          padding: 0;
          cursor: pointer;
        }

        .dais-about .speakers-dot.active {
          background: #e0871f;
          border-color: #e0871f;
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

          .dais-about .leadership-body {
            grid-template-columns: 1fr;
            gap: 30px;
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

          .dais-about .section-title {
            font-size: 26px;
          }
        }

        @media (max-width: 640px) {
          .dais-about .speakers-cards {
            grid-template-columns: 1fr;
            gap: 18px;
          }

          .dais-about .speaker-card-photo {
            max-width: 180px;
            margin: 0 auto 12px;
          }

          .dais-about .speaker-card {
            text-align: center;
          }

          .dais-about .speaker-blurb {
            text-align: left;
          }

          .dais-about .speakers-carousel {
            gap: 4px;
          }

          .dais-about .speakers-arrow {
            width: 30px;
            height: 30px;
            font-size: 15px;
          }
        }

        @media (max-width: 480px) {
          .dais-about .main-content {
            width: 100%;
            padding: 0 16px 30px;
          }

          .dais-about .hero-image {
            width: 92%;
            margin-top: -14px;
          }

          .dais-about .hero-image img {
            max-height: 220px;
          }

          .dais-about .section-title {
            font-size: 22px;
          }

          .dais-about .leadership-subtitle {
            font-size: 19px;
            margin-bottom: 12px;
          }

          .dais-about .leadership-text {
            font-size: 13.5px;
            line-height: 1.7;
            text-align: left;
          }

          .dais-about .speakers-box {
            padding: 14px;
          }

          .dais-about .speakers-tabs {
            gap: 8px;
            margin-bottom: 14px;
          }

          .dais-about .speakers-tab {
            font-size: 14px;
            padding: 10px 8px;
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
          <h1 className="page-title">JNPV Leadership Series</h1>
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
            {/* ---------- main content column ---------- */}
            <div className="content-main">
              <h2 className="section-title">JNPV LEADERSHIP SERIES</h2>

              <div className="leadership-body">
                {/* ---------- left column: text ---------- */}
                <div>
                  <h3 className="leadership-subtitle">Talks on Leadership and Innovation</h3>

                  <div className="leadership-text">
                    <p>
                      Students in high school face many challenging questions about the future:
                      choosing the right university, the right course of study, and even the
                      right career path. This task is not limited to making these life-changing
                      decisions alone, it is supplemented by a genuine desire to contribute
                      meaningfully to society. The leader within every student yearns to come
                      forward and make an impact, first locally and eventually on a wider scale.
                    </p>
                  </div>

                  <div className="leadership-text">
                    <p>
                      This path, however, is difficult to walk without guidance and support. To
                      provide this, our students can look to the life lessons of leaders from
                      many walks of life: their experiences offer answers to the questions that
                      lie ahead, and their stories inspire students to become the leaders they
                      hope to be.
                    </p>
                  </div>

                  <div className="leadership-text">
                    <p>
                      A true leader motivates others to lead. The most successful leaders are
                      able to challenge convention within their industries while holding on to
                      time-tested principles. They adapt to an ever-changing environment and are
                      constantly innovating, drawing inspiration from pioneering business and
                      community leaders who have shaped India's growth story.
                    </p>
                  </div>

                  <div className="leadership-text">
                    <p>
                      With the pressures of adolescence and the spirit of leadership in mind, the
                      Leadership Series was started by a group of student leaders in the year
                      2012. Their efforts created a platform that has given JNPV students
                      invaluable insights from leaders across India. Successive batches of
                      student coordinators have carried the series forward each year, bringing
                      new speakers and fresh perspectives. As students are exposed to case
                      studies from business, science, culture, sport, and many other
                      professional domains, they come away with practical lessons and lasting
                      wisdom that will guide them as life-long learners.
                    </p>
                  </div>
                </div>

                {/* ---------- right column: yellow speakers box ---------- */}
                <div className="speakers-box">
                  <div className="speakers-tabs">
                    {Object.keys(SPEAKER_DATA).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        className={`speakers-tab${activeTab === tab ? ' active' : ''}`}
                        onClick={() => changeTab(tab)}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  <div className="speakers-carousel">
                    <button type="button" className="speakers-arrow" onClick={goPrev} aria-label="Previous">
                      ‹
                    </button>

                    <div className="speakers-cards">
                      {pages[pageIndex].map((speaker) => (
                        <div className="speaker-card" key={speaker.name}>
                          <div className="speaker-card-photo">{initials(speaker.name)}</div>
                          <span className="speaker-name">{speaker.name}</span>
                          <p className="speaker-blurb">{speaker.blurb}</p>
                          <a className="speaker-link" href="#!">Click Here...</a>
                        </div>
                      ))}
                    </div>

                    <button type="button" className="speakers-arrow" onClick={goNext} aria-label="Next">
                      ›
                    </button>
                  </div>

                  <div className="speakers-dots">
                    {pages.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`speakers-dot${i === pageIndex ? ' active' : ''}`}
                        onClick={() => setPageIndex(i)}
                        aria-label={`Go to slide ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}