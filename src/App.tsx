import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";

import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import UserManagement from "./pages/userManagement";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

export default function App() {
  const { isAuthenticated, login, logout } = useAuth();
  const location = useLocation();

  const isLoginPage = location.pathname === "/login";
  const isUsersPage = location.pathname === "/users";

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
        </Routes>
      </div>

      {!isLoginPage && !isUsersPage && <Footer />}
    </div>
  );
}