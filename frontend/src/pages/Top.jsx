import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Top() {
    const nav = useNavigate();

    return (
        <div style={{ padding: 20 }}>
            <h2>Top page</h2>
            <div style={{ marginTop: 12 }}>
                <button onClick={() => nav('/usr-signin')}>個人ログイン</button>
            </div>
            <div style={{ marginTop: 12 }}>
                <button onClick={() => nav('/org-login')}>組織ログイン</button>
            </div>            
        </div>
    );
}
