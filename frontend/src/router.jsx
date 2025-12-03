import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import OrgLogin from "./pages/OrgLogin";
import OrgDashboard from "./pages/OrgDashboard";

export default function RouterComponent() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/org-login" element={<OrgLogin />} />
        <Route path="/org-dashboard" element={<OrgDashboard />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
