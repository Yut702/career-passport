import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginRequest } from "../api/auth";

export default function UsrSignIn() {
    const nav = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const submit = async () => {
        try {
            const res = await loginRequest(email, password);
            const token = res.data.token;
            const user = res.data.user || { email };
            localStorage.setItem("token", token);
            const displayName = user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
            nav("/usr-home", { state: { name: displayName, email: user.email } });
        } catch (err) {
            alert("ログインに失敗しました");
        }
    };

    return (
        <div style={{ padding: 20 }}>
            <h2>Sign In</h2>
            <input placeholder="email" value={email} onChange={e => setEmail(e.target.value)} /><br />
            <input placeholder="password" type="password" value={password} onChange={e => setPassword(e.target.value)} /><br />
            <button onClick={submit}>Login</button>
            <div style={{ marginTop: 12 }}>
                <button onClick={() => nav('/usr-signup')}>新規登録へ</button>
            </div>
        </div>
    );
}
