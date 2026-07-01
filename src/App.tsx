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
import AcademicsPrimary from "./pages/AcademicsPrimary";
import AcademicsSecondary from './pages/AcademicsSecondary'
import Admissions from "./pages/Admissions";
import AdmissionPrePrimary from "./pages/AdmissionPrePrimary";
import AdmissionPrimary from "./pages/AdmissionPrimary";
import AdmissionSecondary from "./pages/AdmissionSecondary";
import Awards from "./pages/Awards";
import Campus from "./pages/Campus";
import Careers from "./pages/Careers";
import Events from "./pages/Events";
import StudentLife from "./pages/StudentLife";
import ExamandResult from "./pages/ExamandResult";

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
              isAuthenticated ? (
                <Navigate to="/users" replace />
              ) : (
                <LoginPage onLogin={login} />
              )
            }
          />

          <Route
            path="/users"
            element={
              isAuthenticated ? (
                <UserManagement onLogout={logout} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route
            path="/terms-and-conditions"
            element={<TermsAndConditions />}
          />

          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/alumni" element={<Alumni />} />
          <Route path="/academics" element={<Academics />} />
          <Route path="/academics/primary" element={<AcademicsPrimary />} />
          <Route path="/academics/secondary" element={<AcademicsSecondary />} />

          <Route path="/admissions" element={<Admissions />} />
          <Route path="/admissions/pre-primary" element={<AdmissionPrePrimary />} />
          <Route path="/admissions/primary" element={<AdmissionPrimary />} />
          <Route path="/admissions/secondary" element={<AdmissionSecondary />} />
          <Route path="/awards" element={<Awards />} />
          <Route path="/campus" element={<Campus />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/events" element={<Events />} />
          <Route path="/student-life" element={<StudentLife />} />
          <Route path="/Exam-and-result" element={<ExamandResult />} />
        </Routes>
      </div>

      {!hideFooter && <Footer />}
    </div>
  );
}
