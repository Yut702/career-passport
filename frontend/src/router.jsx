import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
        {/* 入り口画面 */}
        <Route path="/" element={<UserTypeSelection />} />

        {/* 学生向けルート */}
        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<Home />} />
          <Route path="mypage" element={<MyPage />} />
          <Route path="nfts" element={<MyNFTs />} />
          <Route path="nft/:id" element={<NFTDetail />} />
          <Route path="zk-proof" element={<ZKProof />} />
        </Route>

        {/* 企業向けルート */}
        <Route path="/org" element={<OrgLayout />}>
          <Route index element={<OrgDashboard />} />
          <Route path="stamp-issuance" element={<OrgStampIssuance />} />
        </Route>

        {/* 旧ルートのリダイレクト（後方互換性のため） */}
        <Route path="/mypage" element={<Navigate to="/student/mypage" replace />} />
        <Route path="/nfts" element={<Navigate to="/student/nfts" replace />} />
        <Route path="/nft/:id" element={<Navigate to="/student/nft/:id" replace />} />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
