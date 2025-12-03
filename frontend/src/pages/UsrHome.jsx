import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { get } from "../api/usr";

export default function UsrHome() {
  const location = useLocation();
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

  return (
    <div style={{ padding: 20 }}>
      <h2>ホーム</h2>
      <p>ようこそ、{name} さん</p>
    </div>
  );
}
