import React, { useEffect, useState } from "react";
import Chat from "../components/Chat";
import ScheduleDetailPage from "./ScheduleDetailPage";

const LoginPage: React.FC = () => {
    const [loggedIn, setLoggedIn] = useState(false);

    // Cookie内のアクセストークン確認
    useEffect(() => {
        const checkLogin = async () => {
            try {
                const res = await fetch("http://localhost:8080/auth/check", {
                    method: "GET",
                    credentials: "include",
                });
                const data = await res.json();
                setLoggedIn(data.loggedIn);
            } catch (err) {
                console.error("ログイン確認エラー", err);
                setLoggedIn(false);
            }
        };
    
        checkLogin();
    }, []);
    

    const handleLogin = () => {
        window.location.href = "http://localhost:8080/auth/google/login";
    };

    if (!loggedIn) {
        return (
          <div style={{ textAlign: "center", marginTop: "2rem" }}>
            <div>
                <h1>Zenith</h1>
            </div>
            <button onClick={handleLogin}>Googleアカウントでログイン</button>
          </div>
        );
    }
    
    return (
        <div className="container">
          <div className="left-panel">
            <ScheduleDetailPage />
          </div>
          <div className="right-panel">
            <Chat loggedIn={loggedIn} />
          </div>
        </div>
    );
}

export default LoginPage;