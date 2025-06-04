import React, { useEffect, useState } from "react";
import Chat from "../components/Chat";
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

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
            const userList = snapshot.docs.map((doc) => doc.data() as User);
            setUsers(userList);
        });
        return () => unsubscribe();
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