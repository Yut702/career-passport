import { useState } from "react";
import { post } from "../api/usr";
import { useNavigate } from "react-router-dom";

export default function UsrSignUp() {
    const nav = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const submit = async () => {
        const res = await post("/register", { email, password });
        if (!res.error) {
            nav("/usr-init", { state: { email } });
        } else {
            alert("登録に失敗しました");
        }
    };

    return (
        <div style={{ padding: 20 }}>
            <h2>Sign Up</h2>
            <input placeholder="email" value={email} onChange={e => setEmail(e.target.value)} /><br />
            <input placeholder="password" type="password" value={password} onChange={e => setPassword(e.target.value)} /><br />
            <button onClick={submit}>Register</button>
            <div style={{ marginTop: 12 }}>
                <button onClick={() => nav('/usr-signin')}>すでにアカウントをお持ちの方（ログイン）</button>
            </div>
        </div>
    );
}
