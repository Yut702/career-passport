import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Top from "./pages/Top"
import Login from "./pages/Login";
import OrgLogin from "./pages/OrgLogin";
import UsrSignUp from "./pages/UsrSignUp";
import UsrSignIn from "./pages/UsrSignIn";
import UsrInitStng from "./pages/UsrInitStng";
import UsrHome from "./pages/UsrHome";
import UserTypeSelection from "./pages/UserTypeSelection";
import StudentLayout from "./components/StudentLayout";
import OrgLayout from "./components/OrgLayout";
import Home from "./pages/Home";
import MyPage from "./pages/MyPage";
import MyNFTs from "./pages/MyNFTs";
import NFTDetail from "./pages/NFTDetail";
import ZKProof from "./pages/ZKProof";
import OrgDashboard from "./pages/OrgDashboard";
import OrgStampIssuance from "./pages/OrgStampIssuance";

export default function RouterComponent() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Top/入り口画面 */}
        <Route path="/" element={<Top />} />
        <Route path="/top" element={<Top />} />
        <Route path="/user-type" element={<UserTypeSelection />} />

        {/* ユーザー向けルート */}
        <Route path="/usr-signup" element={<UsrSignUp />} />
        <Route path="/usr-signin" element={<UsrSignIn />} />
        <Route path="/usr-init" element={<UsrInitStng />} />        
        <Route path="/usr-home" element={<UsrHome />} />

        {/* 学生向けルート（旧UI） */}
        <Route path="/student" element={<Home />} />
        <Route path="/student/mypage" element={<MyPage />} />
        <Route path="/student/nfts" element={<MyNFTs />} />
        <Route path="/student/nft/:id" element={<NFTDetail />} />
        <Route path="/student/zk-proof" element={<ZKProof />} />

        {/* 企業向けルート */}
        <Route path="/org-login" element={<OrgLogin />} />
        <Route path="/org" element={<OrgDashboard />} />
        <Route path="/org/stamp-issuance" element={<OrgStampIssuance />} />

        {/* 旧ルートのリダイレクト（後方互換性のため） */}
        <Route path="/mypage" element={<Navigate to="/student/mypage" replace />} />
        <Route path="/nfts" element={<Navigate to="/student/nfts" replace />} />
        <Route path="/nft/:id" element={<Navigate to="/student/nft/:id" replace />} />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/top" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
