import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";

import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AdminLayout from "./components/layout/AdminLayout";

import AboutUs from "./pages/AboutUs";
import Alumni from "./pages/Alumni";
import Academics from "./pages/Academics";
import Admissions from "./pages/Admissions";
import AdmissionPrePrimary from "./pages/AdmissionPrePrimary";
import AdmissionPrimary from "./pages/AdmissionPrimary";
import AdmissionSecondary from "./pages/AdmissionSecondary";
import Awards from "./pages/Awards";
import Campus from "./pages/Campus";
import Careers from "./pages/Careers";
import Events from "./pages/Events";
import AnnualDay from "./pages/AnnualDay";
import StudentLife from "./pages/StudentLife";
import SportingActivities from "./pages/SportingActivities";
import CoCurricularActivities from "./pages/CoCurricularActivities";
import EnvironmentalInitiatives from "./pages/EnvironmentalInitiatives";
import StudentCouncil from "./pages/StudentCouncil";
import ExamandResult from "./pages/ExamandResult";
import EventsAndCelebrations from "./pages/EventsAndCelebrations";
import VisitsAndOutings from "./pages/VisitsAndOutings";
import LanguageDayAndCelebrations from "./pages/LanguageDayAndCele";
import LeadershipSeries from "./pages/LeadershipSeries";
import Visitors from "./pages/Visitors";
import StudentManagement from "./pages/studentModule.tsx/StudentManagement";
import UserManagement from "./pages/userModule/userManagement";
import AcademicsPrePrimary from "./pages/AcademicsPrePrimary";
import AcademicsPrimaryEnglish from "./pages/AcademicsPrimaryEnglish";
import AcademicsPrimaryMarathi from "./pages/AcademicsPrimaryMarathi";
import AcademicsSecondaryMarathi from "./pages/AcademicsSecondaryMarathi";
import AcademicsSecondaryEnglish from "./pages/AcademicsSecondaryEnglish";
import AcademicsAdmin from "./pages/AcademicsAdmin";
import EventsAndNewsAdmin from "./pages/Events&NewsAdmin";
import ExamAndResultsAdmin from "./pages/Exam&NewsAdmin";
import AdmissionAdmin from "./pages/AdmissionAdmin";

export default function App() {
  const { isAuthenticated, login, logout } = useAuth();
  const location = useLocation();

  const isLoginPage = location.pathname === "/login";
  const isUsersPage = location.pathname === "/users";
  const isStudentPage = location.pathname === "/students";
  const isAcademicAdminPage = location.pathname === "/academics-admin";
  const isEventsAndNewsAdminPage = location.pathname === "/events-and-news";
  const isExamAndResultsAdminPage = location.pathname === "/exam-and-results";
  const isAdmissionAdminPage = location.pathname === "/admissions-admin";
  const isHomePage = location.pathname === "/";
  const hideNavbarFooter = isLoginPage || isUsersPage || isStudentPage || isAcademicAdminPage || isEventsAndNewsAdminPage || isExamAndResultsAdminPage || isAdmissionAdminPage;
  const hideFooter = isHomePage || isLoginPage || isUsersPage || isStudentPage || isAcademicAdminPage || isEventsAndNewsAdminPage || isExamAndResultsAdminPage || isAdmissionAdminPage;

  return (
    <div className="min-h-screen flex flex-col">
      {!hideNavbarFooter && <Navbar />}

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

          {/* Admin section: Sidebar + Header, no Navbar/Footer.
              Add new admin screens as children here + entry in adminNav.ts */}
          <Route
            element={
              <AdminLayout isAuthenticated={isAuthenticated} onLogout={logout} />
            }
          >
            <Route path="/users" element={<UserManagement />} />
            <Route path="/students" element={<StudentManagement />} />
            <Route path="/academics-admin" element={<AcademicsAdmin />} />
            <Route path="/events-and-news" element={<EventsAndNewsAdmin />} />
            <Route path="/exam-and-results" element={<ExamAndResultsAdmin />} />
            <Route path="/admissions-admin" element={<AdmissionAdmin />} />
          </Route>

          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />

          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/alumni" element={<Alumni />} />
          <Route path="/academics" element={<Academics />} />
          <Route path="/academics/pre-primary" element={<AcademicsPrePrimary />} />
          <Route path="/academics/primary/english" element={<AcademicsPrimaryEnglish />} />
          <Route path="/academics/primary/marathi" element={<AcademicsPrimaryMarathi />} />
          <Route path="/academics/secondary/english" element={<AcademicsSecondaryEnglish />} />
          <Route path="/academics/secondary/marathi" element={<AcademicsSecondaryMarathi />} />

          <Route path="/admissions" element={<Admissions />} />
          <Route path="/admissions/pre-primary" element={<AdmissionPrePrimary />} />
          <Route path="/admissions/primary" element={<AdmissionPrimary />} />
          <Route path="/admissions/secondary" element={<AdmissionSecondary />} />
          <Route path="/awards" element={<Awards />} />
          <Route path="/campus" element={<Campus />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/annual-day" element={<AnnualDay />} />
          <Route path="/student-life" element={<StudentLife />} />
          <Route path="/student-life/sporting" element={<SportingActivities />} />
          <Route path="/student-life/co-curricular" element={<CoCurricularActivities />} />
          <Route path="/student-life/environmental" element={<EnvironmentalInitiatives />} />
          <Route path="/student-life/student-council" element={<StudentCouncil />} />
          <Route path="/Exam-and-result" element={<ExamandResult />} />
          <Route path="/events-and-celebrations" element={<EventsAndCelebrations />} />
          <Route path="/visits-and-outings" element={<VisitsAndOutings />} />
          <Route path="/language-day-celebrations" element={<LanguageDayAndCelebrations />} />
          <Route path="/leadership-series" element={<LeadershipSeries />} />
          <Route path="/visitors" element={<Visitors />} />
        </Routes>
      </div>

      {!hideFooter && <Footer />}
    </div>
  );
}