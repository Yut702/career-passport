import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import UserTypeSelection from "./pages/UserTypeSelection";
import StudentLayout from "./components/StudentLayout";
import OrgLayout from "./components/OrgLayout";
import Home from "./pages/Home";
import MyPage from "./pages/MyPage";
import MyNFTs from "./pages/MyNFTs";
import NFTDetail from "./pages/NFTDetail";
import OrgDashboard from "./pages/OrgDashboard";
import OrgStampIssuance from "./pages/OrgStampIssuance";

// 個人ユーザー向けページ
import VCAndZKP from "./pages/VCAndZKP";
import StudentEvents from "./pages/StudentEvents";
import StudentEventApply from "./pages/StudentEventApply";
import StudentJobConditions from "./pages/StudentJobConditions";
import StudentJobSearch from "./pages/StudentJobSearch";
import StudentMatchedCompanies from "./pages/StudentMatchedCompanies";
import StudentMessages from "./pages/StudentMessages";

// 企業ユーザー向けページ
import OrgSettings from "./pages/OrgSettings";
import OrgNFTs from "./pages/OrgNFTs";
import OrgNFTDetail from "./pages/OrgNFTDetail";
import OrgEvents from "./pages/OrgEvents";
import OrgEventCollaborate from "./pages/OrgEventCollaborate";
import OrgRecruitmentConditions from "./pages/OrgRecruitmentConditions";
import OrgCandidateSearch from "./pages/OrgCandidateSearch";
import OrgMatchedCandidates from "./pages/OrgMatchedCandidates";
import OrgMessages from "./pages/OrgMessages";

export default function RouterComponent() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 入り口画面 */}
        <Route path="/" element={<UserTypeSelection />} />

        {/* 個人ユーザー向けルート */}
        <Route
          path="/student"
          element={
            <StudentLayout>
              <Home />
            </StudentLayout>
          }
        />
        <Route
          path="/student/login"
          element={<Navigate to="/student" replace />}
        />
        <Route
          path="/student/settings"
          element={
            <StudentLayout>
              <VCAndZKP />
            </StudentLayout>
          }
        />
        <Route
          path="/student/vc-management"
          element={<Navigate to="/student/settings" replace />}
        />
        <Route
          path="/student/zk-proof"
          element={<Navigate to="/student/settings" replace />}
        />
        <Route
          path="/student/mypage"
          element={
            <StudentLayout>
              <MyPage />
            </StudentLayout>
          }
        />
        <Route
          path="/student/nfts"
          element={
            <StudentLayout>
              <MyNFTs />
            </StudentLayout>
          }
        />
        <Route
          path="/student/nft/:id"
          element={
            <StudentLayout>
              <NFTDetail />
            </StudentLayout>
          }
        />
        <Route
          path="/student/events"
          element={
            <StudentLayout>
              <StudentEvents />
            </StudentLayout>
          }
        />
        <Route
          path="/student/events/:id/apply"
          element={
            <StudentLayout>
              <StudentEventApply />
            </StudentLayout>
          }
        />
        <Route
          path="/student/job-conditions"
          element={
            <StudentLayout>
              <StudentJobConditions />
            </StudentLayout>
          }
        />
        <Route
          path="/student/job-search"
          element={
            <StudentLayout>
              <StudentJobSearch />
            </StudentLayout>
          }
        />
        <Route
          path="/student/matched-companies"
          element={
            <StudentLayout>
              <StudentMatchedCompanies />
            </StudentLayout>
          }
        />
        <Route
          path="/student/messages"
          element={
            <StudentLayout>
              <StudentMessages />
            </StudentLayout>
          }
        />

        {/* 企業ユーザー向けルート */}
        <Route
          path="/org"
          element={
            <OrgLayout>
              <OrgDashboard />
            </OrgLayout>
          }
        />
        <Route path="/org/login" element={<Navigate to="/org" replace />} />
        <Route
          path="/org/settings"
          element={
            <OrgLayout>
              <OrgSettings />
            </OrgLayout>
          }
        />
        <Route
          path="/org/stamp-issuance"
          element={
            <OrgLayout>
              <OrgStampIssuance />
            </OrgLayout>
          }
        />
        <Route
          path="/org/nfts"
          element={
            <OrgLayout>
              <OrgNFTs />
            </OrgLayout>
          }
        />
        <Route
          path="/org/nft/:id"
          element={
            <OrgLayout>
              <OrgNFTDetail />
            </OrgLayout>
          }
        />
        <Route
          path="/org/events"
          element={
            <OrgLayout>
              <OrgEvents />
            </OrgLayout>
          }
        />
        <Route
          path="/org/events/:id/collaborate"
          element={
            <OrgLayout>
              <OrgEventCollaborate />
            </OrgLayout>
          }
        />
        <Route
          path="/org/recruitment-conditions"
          element={
            <OrgLayout>
              <OrgRecruitmentConditions />
            </OrgLayout>
          }
        />
        <Route
          path="/org/candidate-search"
          element={
            <OrgLayout>
              <OrgCandidateSearch />
            </OrgLayout>
          }
        />
        <Route
          path="/org/matched-candidates"
          element={
            <OrgLayout>
              <OrgMatchedCandidates />
            </OrgLayout>
          }
        />
        <Route
          path="/org/messages"
          element={
            <OrgLayout>
              <OrgMessages />
            </OrgLayout>
          }
        />

        {/* 旧ルートのリダイレクト（後方互換性のため） */}
        <Route
          path="/mypage"
          element={<Navigate to="/student/mypage" replace />}
        />
        <Route path="/nfts" element={<Navigate to="/student/nfts" replace />} />
        <Route
          path="/nft/:id"
          element={<Navigate to="/student/nft/:id" replace />}
        />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
