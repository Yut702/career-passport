import { useState } from "react";
import { post } from "../api/usr";
import { useNavigate, useLocation } from "react-router-dom";

export default function UsrInitStng() {
    const location = useLocation();
    const initialEmail = location.state?.email || "";
    const [email, setEmail] = useState(initialEmail);
    const [lastName, setLastName] = useState("");
    const [firstName, setFirstName] = useState("");
    const [dob, setDob] = useState("");
    const [gender, setGender] = useState("");
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const submit = async () => {
        const payload = { email, lastName, firstName, dob, gender };
        const res = await post("/profile", payload, token);
        if (res && !res.error) {
            const displayName = `${firstName} ${lastName}`.trim();
            navigate("/usr-home", { state: { name: displayName, email } });
        } else {
            alert("保存に失敗しました: " + (res.error || "unknown"));
        }
    };

    return (
        <div style={{ padding: 20 }}>
            <h2>ユーザー情報登録</h2>
            <div>
                <label style={{ fontSize: 12, color: '#666' }}>ユーザーID（メールアドレス）</label>
                <div style={{ padding: '8px 0', fontWeight: 600 }}>{email || '（未設定）'}</div>
                <div style={{ fontSize: 12, color: '#666' }}>このメールアドレスがユーザーID（PK）になります</div>
            </div>
            <br />
            <input placeholder="姓 (Last Name)" value={lastName} onChange={(e) => setLastName(e.target.value)} /><br />
            <input placeholder="名 (First Name)" value={firstName} onChange={(e) => setFirstName(e.target.value)} /><br />
            <input placeholder="生年月日 (YYYY-MM-DD)" value={dob} onChange={(e) => setDob(e.target.value)} /><br />
            <select value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="">性別を選択</option>
                <option value="male">男性</option>
                <option value="female">女性</option>
                <option value="other">その他</option>
            </select>
            <br />
            <button onClick={submit}>登録して進む</button>
        </div>
    );
}