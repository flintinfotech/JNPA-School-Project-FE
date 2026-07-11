
import schoolLogo from '../assets/SchoolLogo.avif';
import AnnaulDay from '../assets/EventsImages/AnnualD.png';
import GraduationDay from '../assets/EventsImages/FairsExhibitions.png';
import EventsandCelebrations from '../assets/EventsImages/Events.png';
import VisitsandOutings from '../assets/EventsImages/Visits&Outings.png';
import Visitors from '../assets/EventsImages/Visitor.png';
import LanguageDayCelebrations from '../assets/EventsImages/LanguageD.png';
import InterHouseEvents from '../assets/EventsImages/InterHoseEvents.png';
import LeadershipSeries from '../assets/EventsImages/Leadership.png';
import { useEffect, useState } from 'react';
import { base64ToBlobUrl, newsService, sanitizeNewsData, type NewsDTO } from '../services/NewsService';

export default function Events() {
  const events = [
    { title: 'Annual Day', icon: '🎭', image: AnnaulDay, href: '/events/annual-day' },
    { title: 'Fairs & Exhibitions', icon: '🎪', image: GraduationDay, href: '#' },
    { title: 'Events and Celebrations', icon: '🎉', image: EventsandCelebrations, href: '/events-and-celebrations' },
    { title: 'Visits and Outings', icon: '🚶', image: VisitsandOutings, href: '/visits-and-outings' },
    { title: 'Visitors', icon: '🧑‍💼', image: Visitors, href: '/visitors' },
    { title: 'Language Day Celebrations', icon: '🅰️', image: LanguageDayCelebrations, href: '/language-day-celebrations' },
    { title: 'Inter - House Events', icon: '🏠', image: InterHouseEvents, href: '#' },
    { title: 'Leadership Series', icon: '🌐', image: LeadershipSeries, href: '/leadership-series' },
  ];

  const [newsList, setNewsList] = useState<NewsDTO[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await newsService.getAllNews(0, 50, controller.signal);
        setNewsList(res?.data?.newsDTOS ?? []);
      } catch (err: any) {
        if (err?.name !== 'CanceledError' && err?.code !== 'ERR_CANCELED') {
          console.error('Failed to load news', err);
        }
      } finally {
        if (!controller.signal.aborted) setNewsLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  const handleNewsLinkClick = (item: NewsDTO) => {
    const validBase64 = sanitizeNewsData(item.newsData);
    if (!validBase64) return;
    const blobUrl = base64ToBlobUrl(validBase64);
    window.open(blobUrl, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
  };

  const colDivider = { borderRight: "1px solid #e2e2e2" };

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

        /* ---------- Mobile Event Table ---------- */
@media (max-width: 768px) {

  .dais-about .event-table-wrap {
    width: 100%;
    border: none !important;
    background: transparent !important;
    overflow: visible !important;
  }

  .dais-about .event-table-header {
    display: none !important;
  }

  .dais-about .event-table-row {
    display: flex !important;
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 12px;
    margin-bottom: 16px;
    padding: 18px !important;
    background: #fff !important;
    border: 1px solid #e9e9e9;
    border-left: 5px solid #1569ad;
    border-radius: 10px;
    box-shadow: 0 4px 14px rgba(0,0,0,.08);
  }

  .dais-about .event-table-row > div {
    width: 100% !important;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    font-size: 14px;
  }

  .dais-about .event-table-row > div:nth-child(1)::before {
  content: "Sr. No.";
  font-weight: 700;
  color: #1569ad;
}

.dais-about .event-table-row > div:nth-child(2)::before {
  content: "News";
  font-weight: 700;
  color: #1569ad;
  flex-shrink: 0;
}

.dais-about .event-table-row > div:nth-child(3)::before {
  content: "Description";
  font-weight: 700;
  color: #1569ad;
}

.dais-about .event-table-row > div:nth-child(4)::before {
  content: "Link";
  font-weight: 700;
  color: #1569ad;
}

  .dais-about .event-table-row a {
    display: inline-block;
    background: #1569ad;
    color: #fff !important;
    text-decoration: none;
    padding: 7px 14px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 700;
  }

  .dais-about .event-table-row a:hover {
    background: #0f5b97;
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
          <h1 className="page-title">Events & News</h1>
        </div>
      </header>

      <div
        style={{
          padding: "50px 0 40px",
          background: "#fff",
        }}
      >
        <div
          style={{
            width: "79%",
            margin: "0 auto",
          }}
        >
          <h2
            style={{
              color: "#1a3a6b",
              fontSize: "28px",
              fontWeight: 600,
              marginBottom: "28px",
            }}
          >
            {/* Events */}
          </h2>

          <div
            className="event-table-wrap"
            style={{
              border: "1px solid rgba(26,58,107,0.12)",
              borderRadius: "6px",
              overflow: "hidden",
              background: "#fff",
            }}
          >
            {/* Header */}
            <div
              className="event-table-header"
              style={{
                display: "grid",
                gridTemplateColumns: "80px 1fr 1.4fr 180px",
                gap: "16px",
                background: "#1a3a6b",
                color: "#fff",
                fontWeight: 700,
                fontSize: "14px",
                padding: "14px 20px",
              }}
            >
              <div style={{ borderRight: "1px solid rgba(255,255,255,0.25)", paddingRight: "16px" }}>Sr. No.</div>
              <div style={{ borderRight: "1px solid rgba(255,255,255,0.25)", paddingRight: "16px" }}>News</div>
              <div style={{ borderRight: "1px solid rgba(255,255,255,0.25)", paddingRight: "16px" }}>Description</div>
              <div>News Link</div>
            </div>

            {newsLoading ? (
              <div style={{ padding: "20px", textAlign: "center", color: "#667085" }}>Loading news…</div>
            ) : newsList.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: "#667085" }}>No news available.</div>
            ) : (
              newsList.map((item, index) => {
                const hasAttachment = Boolean(sanitizeNewsData(item.newsData));
                return (
                  <div
                    key={item.newsId ?? index}
                    className="event-table-row"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "80px 1fr 1.4fr 180px",
                      alignItems: "center",
                      gap: "16px",
                      padding: "16px 20px",
                      background: index % 2 === 0 ? "#fff" : "#fffbee",
                      borderBottom: index !== newsList.length - 1 ? "1px solid #d8d8d8" : "none",
                    }}
                  >
                    <div style={{ fontWeight: 600, ...colDivider, paddingRight: "16px" }}>{index + 1}</div>

                    <div style={{ color: "#333", fontWeight: 600, minWidth: 0, overflowWrap: "break-word", ...colDivider, paddingRight: "16px" }}>
                      {item.news}
                    </div>

                    <div style={{ color: "#555", minWidth: 0, overflowWrap: "break-word", wordBreak: "break-word", ...colDivider, paddingRight: "16px" }}>
                      {item.newsDescription || "-"}
                    </div>

                    <div>
                      {hasAttachment ? (
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handleNewsLinkClick(item);
                          }}
                          style={{ color: "#1569ad", fontWeight: 700, textDecoration: "none" }}
                        >
                          View News
                        </a>
                      ) : (
                        <span style={{ color: "#999" }}>No attachment</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
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
    </div >
  );
}