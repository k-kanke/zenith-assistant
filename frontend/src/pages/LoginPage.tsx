import React, { useEffect, useState } from "react";
import ScheduleDetailPage from "./ScheduleDetailPage";
import ChatPage from "./ChatPage";
import { User } from "../types/types";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

const LoginPage: React.FC = () => {
    const [loggedIn, setLoggedIn] = useState(false);
    const [users, setUsers] = useState<User[]>([]);

    const [initialSchedule, setInitialSchedule] = useState<{
        title: string;
        start: string;
        end: string;
        emails: string[];
    } | null>(null);

    // Cookie内のアクセストークン確認
    useEffect(() => {
        const checkLogin = async () => {
            try {
                const res = await fetch("https://zenith-assistant-229406209956.asia-northeast1.run.app/api/auth/check", {
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

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
            const userList = snapshot.docs.map((doc) => doc.data() as User);
            setUsers(userList);
        });
        return () => unsubscribe();
    }, []);
    

    const handleLogin = () => {
        window.location.href = "https://zenith-assistant-229406209956.asia-northeast1.run.app/api/auth/google/login";
    };

    if (!loggedIn) {
        return (
            <div style={{ 
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100vh",
                background: "#f9f9f9",
                padding: "2rem",
                fontFamily: "'Segoe UI', sans-serif"
            }}>
            <div>
                <h1 style={{
                    fontSize: "3rem",
                    letterSpacing: "0.2rem",
                    marginBottom: "1rem",
                    color: "#333",
                    textAlign: "center"
                }}>
                    Zenith
                </h1>
                <p style={{
                    fontSize: "1.1rem",
                    color: "#33333",
                    maxWidth: "480px",
                    textAlign: "center",
                    marginBottom: "2rem"
                }}>
                    Zenithは、自然言語チャットから空き時間検索・予定登録ができるスマートなAIカレンダーアシスタントです。
                </p>
            </div>
            <button 
                onClick={handleLogin}
                style={{
                    backgroundColor: "#000000",
                    color: "#fff",
                    padding: "0.8rem 1.6rem",
                    fontSize: "1rem",
                    fontWeight: "bold",
                    border: "none",
                    borderRadius: "0.4rem",
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                    transition: "background-color 0.2s ease"
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = "#333333"; 
                    e.currentTarget.style.transform = "translateY(-2px)"; 
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "#000000";
                    e.currentTarget.style.transform = "translateY(0)";
                }}
            >
                Googleアカウントでログイン
            </button>
          </div>
        );
    }
    
    return (
        <div className="container">
          <div className="left-panel">
            <ScheduleDetailPage initialData={initialSchedule} />
          </div>
          <div className="right-panel">
            <ChatPage 
                setInitialSchedule={setInitialSchedule} 
                loggedIn={loggedIn} 
                registeredUsers={users} 
            />
          </div>
        </div>
    );
}

export default LoginPage;