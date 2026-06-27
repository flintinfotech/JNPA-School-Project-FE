import { useState } from 'react'

const navLinks = [
  { label: 'Home', href: '#' },
  { label: 'About JNPV', href: '#' },
  { label: 'Why JNPV', href: '#' },
  { label: 'Admission', href: '#' },
  { label: 'Blog', href: '#' },
  { label: 'Alumni', href: '#' },
  { label: 'Contact Us', href: '#' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="navbar-root">
      <style>{`
        .navbar-root {
          position: sticky;
          top: 0;
          z-index: 100;
          background: linear-gradient(135deg, #0f1c3f 0%, #1a2f6b 100%);
          box-shadow: 0 2px 16px rgba(0, 0, 0, 0.25);
          font-family: 'Segoe UI', system-ui, sans-serif;
        }

        .navbar-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
          height: 68px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        /* Logo */
        .navbar-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }

        .navbar-logo-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, #f5c518, #e8a800);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(245, 197, 24, 0.4);
          flex-shrink: 0;
        }

        .navbar-logo-text {
          font-size: 18px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: 0.3px;
        }

        .navbar-logo-text span {
          color: #f5c518;
        }

        /* Desktop links */
        .navbar-links {
          display: flex;
          align-items: center;
          gap: 4px;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .navbar-links li a {
          display: block;
          padding: 8px 14px;
          color: #cbd5e1;
          text-decoration: none;
          font-size: 17px;
          font-weight: 500;
          border-radius: 6px;
          transition: color 0.2s, background 0.2s;
          letter-spacing: 0.2px;
          white-space: nowrap;
        }

        .navbar-links li a:hover {
          color: #f5c518;
          background: rgba(245, 197, 24, 0.08);
        }

        .navbar-links li:last-child a {
          background: linear-gradient(135deg, #f5c518, #e8a800);
          color: #0f1c3f;
          font-weight: 700;
          padding: 8px 18px;
          border-radius: 6px;
          transition: transform 0.15s, box-shadow 0.15s;
        }

        .navbar-links li:last-child a:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(245, 197, 24, 0.45);
          color: #0f1c3f;
          background: linear-gradient(135deg, #f5c518, #e8a800);
        }

        /* Gold accent line */
        .navbar-accent {
          height: 3px;
          background: linear-gradient(90deg, transparent 0%, #f5c518 30%, #e8a800 70%, transparent 100%);
          opacity: 0.7;
        }

        /* Hamburger */
        .navbar-hamburger {
          display: none;
          flex-direction: column;
          gap: 5px;
          cursor: pointer;
          padding: 6px;
          background: none;
          border: none;
        }

        .navbar-hamburger span {
          display: block;
          width: 24px;
          height: 2px;
          background: #cbd5e1;
          border-radius: 2px;
          transition: all 0.25s;
        }

        .navbar-hamburger.open span:nth-child(1) {
          transform: translateY(7px) rotate(45deg);
          background: #f5c518;
        }

        .navbar-hamburger.open span:nth-child(2) {
          opacity: 0;
        }

        .navbar-hamburger.open span:nth-child(3) {
          transform: translateY(-7px) rotate(-45deg);
          background: #f5c518;
        }

        /* Mobile menu */
        .navbar-mobile {
          display: none;
          flex-direction: column;
          padding: 8px 16px 16px;
          border-top: 1px solid rgba(255,255,255,0.08);
          background: linear-gradient(180deg, #1a2f6b 0%, #0f1c3f 100%);
        }

        .navbar-mobile.open {
          display: flex;
        }

        .navbar-mobile a {
          display: block;
          padding: 12px 10px;
          color: #cbd5e1;
          text-decoration: none;
          font-size: 15px;
          font-weight: 500;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          transition: color 0.2s;
        }

        .navbar-mobile a:hover {
          color: #f5c518;
        }

        .navbar-mobile a:last-child {
          border-bottom: none;
          color: #f5c518;
          font-weight: 700;
          margin-top: 8px;
        }

        @media (max-width: 900px) {
          .navbar-links {
            display: none;
          }
          .navbar-hamburger {
            display: flex;
          }
        }
      `}</style>

      <div className="navbar-inner">
        {/* Logo */}
        <a href="#" className="navbar-logo">
          <div className="navbar-logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 3L4 7v5c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V7L12 3z" fill="#0f1c3f" />
            </svg>
          </div>
          <span className="navbar-logo-text">JNPV <span>Education</span></span>
        </a>

        {/* Desktop Nav */}
        <ul className="navbar-links">
          {navLinks.map((link) => (
            <li key={link.label}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
        </ul>

        {/* Hamburger */}
        <button
          className={`navbar-hamburger${menuOpen ? ' open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* Gold accent line */}
      <div className="navbar-accent" />

      {/* Mobile Menu */}
      <div className={`navbar-mobile${menuOpen ? ' open' : ''}`}>
        {navLinks.map((link) => (
          <a key={link.label} href={link.href} onClick={() => setMenuOpen(false)}>
            {link.label}
          </a>
        ))}
      </div>
    </nav>
  )
}