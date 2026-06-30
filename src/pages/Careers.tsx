import { useState } from 'react';
import schoolLogo from '../assets/SchoolLogo.avif';
import schoolBuilding from '../assets/Career1.webp';
import Carrer1 from '../assets/Carrer1.webp';
import Carrer2 from '../assets/Career2.webp';

export default function Careers() {
  const [activeItem, setActiveItem] = useState('Camppus');

  const openings = [
    'Leadership',
    'Teacher Recruitment 2025-26',
    'JNPV Teaching',
    'Junior School',
  ];

  const benefits = [
    'Semi Furnished Accommodation to non-local staff.',
    'Joining and end-of-assignment travel for expatriate staff, and joining travel for national staff.',
    'Child education benefit as per the Education policy of the School.',
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
          margin: 0 0 22px;
        }

        /* ---------- video / cover ---------- */
        .dais-about .video-wrap {
          position: relative;
          margin-bottom: 30px;
          overflow: hidden;
        }

        .dais-about .video-wrap iframe {
          width: 100%;
          aspect-ratio: 18 / 7;
          display: block;
          border: none;
        }

        /* ---------- intro text + openings box ---------- */
        .dais-about .intro-row {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 36px;
          align-items: start;
          margin-bottom: 36px;
        }

        .dais-about .intro-col {
          display: flex;
          flex-direction: column;
        }

        .dais-about .intro-text {
          font-size: 14.5px;
          line-height: 1.85;
          color: #333;
          text-align: justify;
        }

        .dais-about .intro-text p {
          margin: 0 0 18px;
        }

        .dais-about .intro-text a {
          color: #1a6fb5;
          text-decoration: none;
        }

        .dais-about .intro-text a:hover {
          text-decoration: underline;
        }

        .dais-about .openings-box {
          background: #fff;
          border: 1px solid #cfe0ee;
        }

        .dais-about .openings-header {
          background: #eaf2fa;
          color: #1a3a6b;
          font-size: 14px;
          padding: 16px 20px;
          border-bottom: 1px solid #cfe0ee;
        }

        .dais-about .openings-header strong {
          font-weight: 700;
        }

        .dais-about .openings-item {
          display: flex;
          align-items: center;
          gap: 16px;
          background: #1569ad;
          color: #fff;
          font-size: 17px;
          font-weight: 500;
          padding: 22px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.18);
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .dais-about .openings-item:last-child {
          border-bottom: none;
        }

        .dais-about .openings-item:hover {
          background: #135f9c;
        }

        .dais-about .openings-icon {
          width: 34px;
          height: 34px;
          flex-shrink: 0;
          border: 2px solid rgba(255, 255, 255, 0.7);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ---------- section images ---------- */
        .dais-about .section-image {
          width: 100%;
          max-height: 380px;
          object-fit: cover;
          display: block;
          margin-bottom: 28px;
        }

        /* ---------- staff section ---------- */
        .dais-about .staff-title {
          font-weight: 700;
          font-size: 15px;
          color: #222;
          margin: 0 0 14px;
        }

        .dais-about .staff-text {
          font-size: 14.5px;
          line-height: 1.85;
          color: #333;
          text-align: justify;
          margin-bottom: 28px;
        }

        .dais-about .staff-text p {
          margin: 0 0 18px;
        }

        .dais-about .staff-text a {
          color: #1a6fb5;
          text-decoration: none;
        }

        .dais-about .staff-text a:hover {
          text-decoration: underline;
        }

        /* ---------- benefits ---------- */
        .dais-about .benefits-intro {
          font-size: 14.5px;
          color: #333;
          margin: 0 0 14px;
        }

        .dais-about .benefits-list {
          list-style: none;
          margin: 0 0 30px;
          padding: 0;
        }

        .dais-about .benefits-list li {
          position: relative;
          padding-left: 18px;
          margin-bottom: 14px;
          font-size: 14px;
          line-height: 1.65;
          color: #333;
        }

        .dais-about .benefits-list li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 6px;
          width: 7px;
          height: 7px;
          background: #e8a400;
        }

        .dais-about .benefits-list strong {
          font-weight: 700;
        }

        /* ---------- responsive ---------- */
        @media (max-width: 900px) {
          .dais-about .main-content {
            width: 90%;
            padding: 0 0 36px;
          }

          .dais-about .intro-row {
            grid-template-columns: 1fr;
          }

          .dais-about .openings-box {
            order: 2;
          }

          .dais-about .intro-col {
            order: 1;
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

          .dais-about .openings-item {
            font-size: 15px;
            padding: 18px 16px;
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
          <h1 className="page-title">Careers @ JNPV</h1>
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
          <h2 className="section-title">CAREERS @ JNPV</h2>

          <div className="video-wrap">
            <iframe
              src="https://www.youtube.com/embed/44V2RJ2oi60"
              title="JNPV Film"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

          <div className="intro-row">
            <div className="intro-col">
              <div className="intro-text">
                <p>
                  An LKG-12 school founded in 2003, Jawaharlal Nehru Port
                  Vidyalaya prepares students for the Indian Certificate of
                  Secondary Education (ICSE), Cambridge IGCSE and the IBDP
                  examinations. Current enrolment is 1058, with 204 taking
                  the IB Diploma (<a href="#">college profile</a>). The
                  school has 183 teachers, with most of them having
                  experience at leading schools in India and international
                  schools worldwide.
                </p>
                <p>
                  From day one, the focus has been on building a world-class
                  school with an Indian mind, an Indian heart and an Indian
                  soul - a school that offers a blend of nationally and
                  internationally acclaimed educational opportunities. JNPV
                  aims to provide an educational experience that engenders
                  excellence and children's all-round development, in an
                  environment that fosters the joy of learning. The School's
                  motto <strong>"Dare to Dream. Learn to Excel"</strong>{' '}
                  encapsulates our aspirations and the commitment and drive
                  required to bring about excellence in every facet of the
                  School's endeavours. In order to know more about our
                  School please see the{' '}
                  <a href="#">message from the Chairperson</a>,{' '}
                  <a href="#">Our Vision</a>, <a href="#">Our Mission</a> and{' '}
                  <a href="#">Our Objectives</a>.
                </p>
              </div>

              <img
                className="section-image"
                src={Carrer1}
                alt="Students in an art class at JNPV"
              />

              <p className="staff-title">Our Staff</p>
              <div className="staff-text">
                <p>
                  Our staff come from all parts of the World and also from
                  different parts of India. Most of our Expatriate staff come
                  from areas where IBDP is taught. We have staff members from
                  North America, Europe and Africa. We also have Teachers
                  teaching the IB curriculum come from other parts of India as
                  well. For our National Curriculum (ICSE), we have Teachers
                  come from Mumbai and its suburbs and also from other parts of
                  India as well (<a href="#">Teacher Recruitment 2026-27</a>).
                </p>
                <p>
                  Expatriate staff are generally hired on a two year contract
                  with attended benefits provided for extending contracts.
                  Indian staff are hired until their age of superannuation.
                  Staff are provided opportunities to learn and grow in their
                  profession and the School invests in their Professional
                  Growth and Development.
                </p>
              </div>

              <img
                className="section-image"
                src={Carrer2}
                alt="Teacher demonstrating a science experiment to students at JNPV"
              />
              <p className="benefits-intro">
                Apart from the compensation JNPV provides other benefits to our
                Teaching staff like:
              </p>
              <ul className="benefits-list">
                {benefits.map((item) => {
                  const [bold, ...rest] = item.split(':');
                  return (
                    <li key={item}>
                      {rest.length ? (
                        <>
                          <strong>{bold}</strong>: {rest.join(':')}
                        </>
                      ) : (
                        item
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="openings-box">
              <div className="openings-header">
                If you are interested please look at our{' '}
                <strong>current openings</strong> in various areas of the
                School.
              </div>
              {openings.map((item) => (
                <div className="openings-item" key={item}>
                  <span className="openings-icon">🌐</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}