import {
  FaFacebookF,
  FaLinkedinIn,
  FaInstagram,
  FaYoutube,
  FaXTwitter,
} from "react-icons/fa6";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer style={{ background: '#9C4131', borderTop: '3px solid #f5c518', marginTop: '40px' }}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-2 gap-10">
          {/* Contact */}
          <div>
            <h3 className="text-2xl font-semibold mb-4" style={{ color: '#f5c518' }}>
              Contact Us
            </h3>

            <p style={{ color: '#cbd5e1' }} className="leading-relaxed">
              JNPV Centre, 85, Chamarbaug Post Office Lane,
              <br />
              Dr. Ambedkar Road, Parel,
              <br />
              Mumbai - 400012, Maharashtra, India
            </p>

            <div className="mt-4 space-y-2" style={{ color: '#cbd5e1' }}>
              <p>
                <span className="font-semibold" style={{ color: '#f5c518' }}>Email:</span>{" "}
                admissions@jnpv.org
              </p>
              <p>
                <span className="font-semibold" style={{ color: '#f5c518' }}>Telephone:</span>{" "}
                022 43330000
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-2xl font-semibold mb-4" style={{ color: '#f5c518' }}>
              Quick Links
            </h3>

            <div className="grid grid-cols-2 gap-y-3 gap-x-8" style={{ color: '#cbd5e1' }}>
              {['About Us', 'Admissions', 'Why JNPV', 'FAQs', 'Download Brochure', 'Blogs', 'Transport Policy'].map((item) => (
                <a
                  key={item}
                  href="#"
                  style={{ color: '#cbd5e1', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#f5c518')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#cbd5e1')}
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-6" style={{ borderTop: '1px solid rgba(245, 197, 24, 0.25)' }}></div>

        {/* Social Icons */}
        <div className="flex justify-center gap-4 mb-4">
          {[FaFacebookF, FaXTwitter, FaLinkedinIn, FaInstagram, FaYoutube].map((Icon, i) => (
            <a
              key={i}
              href="#"
              className="w-10 h-10 rounded-full flex items-center justify-center transition"
              style={{ background: 'linear-gradient(135deg, #f5c518, #e8a800)', color: '#0f1c3f' }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 197, 24, 0.45)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
            >
              <Icon />
            </a>
          ))}
        </div>

        {/* Copyright */}
        <div className="text-center text-sm" style={{ color: '#94a3b8' }}>
          © Copyright 2026 |
          <Link to="/privacy-policy" className="mx-2" style={{ color: '#f5c518' }}>
            Privacy Policy
          </Link>
          |
          <Link to="/terms-and-conditions" className="mx-2" style={{ color: '#f5c518' }}>
            Terms & Conditions
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;