import { useState } from "react";
import { loginRequest } from "../api/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const onLogin = async () => {
    try {
      const res = await loginRequest(email, password);
      localStorage.setItem("token", res.data.token);
      setMessage("ログイン成功");
    } catch (err) {
      setMessage("失敗: " + err.response.data.message);
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>ログイン</h2>

      <input
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      /><br />

      <input
        type="password"
        placeholder="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      /><br />

      <button onClick={onLogin}>ログイン</button>

      <p>{message}</p>
    </div>
  );
}
