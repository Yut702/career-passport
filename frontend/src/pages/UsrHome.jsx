import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { get } from "../api/usr";

export default function UsrHome() {
  const location = useLocation();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (location.state && location.state.name) {
      setName(location.state.name);
      return;
    }

    // fallback: try fetch from server using provided email in state
    (async () => {
      const email = location.state?.email;
      if (!email) return;
      const res = await get(`/me?email=${encodeURIComponent(email)}`, token);
      if (res && !res.error) {
        const n = res.name || `${res.firstName || ""} ${res.lastName || ""}`.trim();
        setName(n || "ユーザー");
      }
    })();
  }, [location, token]);

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-12">
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-5xl">👤</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">ようこそ！</h1>
          <p className="text-2xl text-gray-700 font-semibold">{name || "ユーザー"} さん</p>
        </div>

        <div className="space-y-4 mb-8">
          <Link
            to="/student"
            className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            🎓 学生ダッシュボードへ
          </Link>

          <Link
            to="/student/zk-proof"
            className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            🔐 ゼロ知識証明（VC）
          </Link>

          <Link
            to="/student/mypage"
            className="block w-full bg-gradient-to-r from-green-600 to-teal-600 text-white text-center px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            👤 マイページ
          </Link>

          <Link
            to="/student/nfts"
            className="block w-full bg-gradient-to-r from-yellow-600 to-orange-600 text-white text-center px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            🏆 NFT証明書
          </Link>
        </div>

        <div className="text-center">
          <button
            onClick={logout}
            className="text-gray-500 hover:text-gray-700 font-medium"
          >
            ログアウト
          </button>
        </div>
      </div>
    </div>
  );
}
