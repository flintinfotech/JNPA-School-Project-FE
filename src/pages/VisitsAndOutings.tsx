import { useState } from 'react';
import schoolLogo from '../assets/SchoolLogo.avif';
import VisitAndOutings from '../assets/visitsAndOutings.jpg';
import visitsoting1 from '../assets/visitsouting1.jpg';
import visitsouting2 from '../assets/visitsoutings2.jpg';

const TRIP_CATEGORIES = [
  {
    name: 'IAYP',
    trips: [
      { title: 'Bronze Trip 18th - 20th October 2019', year: '2019', img: visitsoting1 },
      { title: 'Silver Trip 13th - 15th Feb 2019', year: '2019', img: visitsouting2 },
      { title: 'Bronze Trip - 25th -27th October 2018', year: '2018', img: visitsoting1 },
      { title: 'A Remarkable Journey of Self Discovery', year: '2018', img: visitsouting2 },
      { title: 'Qualifying Adventure Trip For Silver Level', year: '2014', img: visitsoting1 },
      { title: 'Class 10 Trip', year: '2013', img: visitsouting2 },
      { title: 'Grade 9 Trip - The Great Outdoors', year: '2012', img: visitsoting1 },
      { title: 'Grade 11 Trip - Uphill... Frogs... Orange Whistle... Ropes', year: '2012', img: visitsouting2 },
    ],
  },
  {
    name: 'Class Trips',
    trips: [
      { title: 'Grade 6 Trip - Nature Camp', year: '2019', img: visitsouting2 },
      { title: 'Grade 8 Trip - Heritage Walk', year: '2018', img: visitsoting1 },
      { title: 'Grade 10 Trip - Adventure Camp', year: '2017', img: visitsouting2 },
    ],
  },
  {
    name: 'School Trips',
    trips: [
      { title: 'Annual Educational Tour - Hill Station Visit', year: '2019', img: visitsoting1 },
      { title: 'Inter-School Exchange Programme', year: '2016', img: visitsouting2 },
    ],
  },
];

function TripIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" strokeWidth="1.6">
      <circle cx="9" cy="7" r="2.4" />
      <path d="M4.5 18c0-2.6 2-4.5 4.5-4.5s4.5 1.9 4.5 4.5" />
      <circle cx="17" cy="8.5" r="1.9" />
      <path d="M14 18c0-2 1.6-3.6 3.6-3.6" />
    </svg>
  );
}

export default function VisitsAndOutings() {
  const [openCategory, setOpenCategory] = useState('');

  const toggleCategory = (name) => {
    setOpenCategory((prev) => (prev === name ? null : name));
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

        /* ---------- content column ---------- */
        .dais-about .content-main {
          min-width: 0;
        }

        /* ---------- two column body ---------- */
        .dais-about .visits-body {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 36px;
          align-items: start;
        }

        .dais-about .visits-col {
          display: flex;
          flex-direction: column;
        }

        .dais-about .intro-text {
          font-size: 14.5px;
          line-height: 1.85;
          color: #333;
          text-align: justify;
          margin: 0 0 22px;
        }

        .dais-about .intro-text p {
          margin: 0;
        }

        .dais-about .visits-image {
          width: 100%;
          margin-bottom: 22px;
        }

        .dais-about .visits-image img {
          width: 100%;
          max-height: 300px;
          object-fit: cover;
          display: block;
        }

        /* ---------- trips accordion ---------- */
        .dais-about .trips-accordion {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .dais-about .trip-category-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          gap: 16px;
          background: #1569ad;
          color: #fff;
          border: none;
          padding: 18px 24px;
          cursor: pointer;
          text-align: left;
        }

        .dais-about .trip-category-header:hover {
          background: #135f9c;
        }

        .dais-about .trip-category-header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .dais-about .trip-icon {
          width: 46px;
          height: 46px;
          flex-shrink: 0;
          border: 2px solid rgba(255, 255, 255, 0.7);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .dais-about .trip-category-text .trip-eyebrow {
          display: block;
          font-size: 13px;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.85);
          margin-bottom: 2px;
        }

        .dais-about .trip-category-text .trip-category-name {
          display: block;
          font-size: 19px;
          font-weight: 600;
        }

        .dais-about .trip-caret {
          font-size: 13px;
          transition: transform 0.2s ease;
        }

        .dais-about .trip-category-header.open .trip-caret {
          transform: rotate(180deg);
        }

        .dais-about .trip-list {
          background: #eef2f6;
        }

        .dais-about .trip-row {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 10px 20px;
          border-bottom: 1px solid #fff;
        }

        .dais-about .trip-row:last-child {
          border-bottom: none;
        }

        .dais-about .trip-thumb {
          width: 76px;
          height: 58px;
          object-fit: cover;
          border: 2px solid #fff;
          flex-shrink: 0;
          display: block;
        }

        .dais-about .trip-row-text {
          flex: 1;
          min-width: 0;
        }

        .dais-about .trip-row-eyebrow {
          display: block;
          font-size: 12.5px;
          color: #1a6fb5;
        }

        .dais-about .trip-row-title {
          display: block;
          font-size: 14.5px;
          font-weight: 700;
          color: #1a3a6b;
          line-height: 1.4;
        }

        .dais-about .trip-row-year {
          font-size: 15px;
          font-weight: 600;
          color: #8a97a3;
          flex-shrink: 0;
        }

        /* ---------- responsive ---------- */
        @media (max-width: 900px) {
          .dais-about .main-content {
            width: 90%;
            padding: 0 0 36px;
          }

          .dais-about .visits-body {
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
          <h1 className="page-title">Visits and Outings</h1>
        </div>
      </header>

      <div className="hero-image">
        <img
          src={VisitAndOutings}
          alt="Jawaharlal Nehru Port Vidyalaya building"
        />
      </div>

      <div className="content-wrap">
        <main className="main-content">
          <div className="page-body">
            <div className="content-main">
              <h2 className="section-title">VISITS AND OUTINGS</h2>

              <div className="visits-body">
                {/* ---------- left column: text + images ---------- */}
                <div className="visits-col">
                  <div className="intro-text">
                    <p>
                      Students of all ages enjoy and benefit from outings, visits and field
                      trips, the many varied ways their learning can be enriched by exploring
                      something new outside the classroom. Students are encouraged to widen
                      their horizons through a range of activities and outings that differ in
                      purpose and in length.
                    </p>
                  </div>

                  <div className="visits-image">
                    <img src={visitsoting1} alt="Students on an outdoor outing" />
                  </div>

                  <div className="intro-text">
                    <p>
                      Older students seek information for their history, geography or science
                      projects, or travel on a sporting or cultural exchange. For younger
                      students, visits to local institutions and places of interest offer
                      similar opportunities on a smaller scale. Educational tours take place at
                      least once every academic year, with detailed preparation and a venue
                      chosen to match the learning objectives of the topic being studied.
                      Students are briefed ahead of the trip with a talk and a short film
                      highlighting the key features of the venue.
                    </p>
                  </div>

                  <div className="visits-image">
                    <img src={visitsouting2} alt="Students on a school outing" />
                  </div>
                </div>

                {/* ---------- right column: text + trips box ---------- */}
                <div className="visits-col">
                  <div className="intro-text">
                    <p>
                      During the visit, students record their own impressions and observations
                      in a journal, and at the end of the tour they are assessed through a
                      presentation of everything they have learnt. Every educational tour is
                      designed to be a thorough and in-depth learning experience for students.
                    </p>
                  </div>

                  <div className="trips-accordion">
                    {TRIP_CATEGORIES.map(({ name, trips }) => {
                      const isOpen = openCategory === name;
                      return (
                        <div className="trip-category" key={name}>
                          <button
                            type="button"
                            className={`trip-category-header${isOpen ? ' open' : ''}`}
                            onClick={() => toggleCategory(name)}
                          >
                            <div className="trip-category-header-left">
                              <div className="trip-icon">
                                <TripIcon />
                              </div>
                              <div className="trip-category-text">
                                <span className="trip-eyebrow">Visits &amp; Outings</span>
                                <span className="trip-category-name">{name}</span>
                              </div>
                            </div>
                            <span className="trip-caret">▲</span>
                          </button>

                          {isOpen && (
                            <div className="trip-list">
                              {trips.map((trip) => (
                                <div className="trip-row" key={trip.title}>
                                  <img className="trip-thumb" src={trip.img} alt={trip.title} />
                                  <div className="trip-row-text">
                                    <span className="trip-row-eyebrow">{name}</span>
                                    <span className="trip-row-title">{trip.title}</span>
                                  </div>
                                  <span className="trip-row-year">{trip.year}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
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