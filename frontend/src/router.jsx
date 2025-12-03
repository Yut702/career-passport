import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import OrgLogin from "./pages/OrgLogin";
import UsrSignUp from "./pages/UsrSignUp";
import UsrSignIn from "./pages/UsrSignIn";
import UsrInitStng from "./pages/UsrInitStng";
import UsrHome from "./pages/UsrHome";

export default function RouterComponent() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/usr-signup" element={<UsrSignUp />} />
        <Route path="/usr-signin" element={<UsrSignIn />} />
        <Route path="/usr-init" element={<UsrInitStng />} />        
        <Route path="/usr-home" element={<UsrHome />} />
        <Route path="/org-login" element={<OrgLogin />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
