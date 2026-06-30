import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";

import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import UserManagement from "./pages/userManagement";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import AboutUs from "./pages/AboutUs";
import Alumni from "./pages/Alumni";
import Academics from "./pages/Academics";
import Admissions from "./pages/Admissions";
import Awards from "./pages/Awards";
import Campus from "./pages/Campus";
import Careers from "./pages/Careers";
import Events from "./pages/Events";
import StudentLife from "./pages/StudentLife";
import ResultsAndUniversity from "./pages/ResultsAndUniversity";

export default function App() {
  const { isAuthenticated, login, logout } = useAuth();
  const location = useLocation();

  const isLoginPage = location.pathname === "/login";
  const isUsersPage = location.pathname === "/users";
  const isHomePage = location.pathname === "/";

  // Pages where footer should not appear
  const hideFooter = isLoginPage || isUsersPage || isHomePage;

  return (
    <div className="min-h-screen flex flex-col">
      {!isLoginPage && !isUsersPage && <Navbar />}

      <div className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route
            path="/login"
            element={
              isAuthenticated
                ? <Navigate to="/users" replace />
                : <LoginPage onLogin={login} />
            }
          />

          <Route
            path="/users"
            element={
              isAuthenticated
                ? <UserManagement onLogout={logout} />
                : <Navigate to="/login" replace />
            }
          />

          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />

          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/alumni" element={<Alumni />} />
          <Route path="/academics" element={<Academics />} />
          <Route path="/admissions" element={<Admissions />} />
          <Route path="/awards" element={<Awards />} />
          <Route path="/campus" element={<Campus />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/events" element={<Events />} />
          <Route path="/student-life" element={<StudentLife />} />
          <Route path="/results-and-university" element={<ResultsAndUniversity />} />
        </Routes>
      </div>

      {!hideFooter && <Footer />}
    </div>
  );
}