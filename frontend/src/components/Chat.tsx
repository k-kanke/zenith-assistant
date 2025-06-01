import React, { useState, useEffect } from "react";

const Chat: React.FC = () => {
    const [message, setMessage] = useState('');
    const [reply, setReply] = useState('');
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

    const handleSend = async () => {
        if (!message.trim()) return;

        // AI組み込むまでの簡易的なルールベース判定
        const isGetEvent = message.includes("予定") && !message.includes("で");

        const endpoint = isGetEvent
            ? 'http://localhost:8080/calendar/events'
            : 'http://localhost:8080/calendar/events/create';

        console.log("[aaa]", endpoint) // デバッグ用(あとで消す)

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ message }),
            });

            // const data = await res.json();
            const rawText = await res.text();
            console.log("[DEBUG] Raw Response:", rawText);

            const data = JSON.parse(rawText);

            if (res.ok) {
                if (isGetEvent) {
                    const events = data.events || [];
                    if (events.length === 0) {
                        setReply("予定が見つかりませんでした")
                    } else {
                        const summaries = events.map((e: any) => {
                            const start = new Date(e.start?.dateTime || e.start?.date);
                            const timeStr = start.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
                            return `・${e.summary}（${timeStr}〜）`;
                        });
                        setReply(`${events.length}件の予定があります:\n${summaries.join('\n')}`);
                    }
                } else {
                    setReply(`${data.message}`);
                }       
            } else {
                setReply(`${data.error}`);
            }
        
        } catch (err) {
            console.error('送信エラー: ', err);
            setReply('エラーが発生しました');
        }
    };

    return (
        <div>
            <h1>Zenith</h1>

            {!loggedIn ? (
                <>
                    <button onClick={handleLogin}>Googleアカウントでログイン</button>
                    <button onClick={() => window.location.reload()}>ログイン後に反映</button>
                </>
            ): (
                <>
                    <input 
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="メッセージを入力 (例：6月5日の10時から11時でMTG）"
                        style={{ padding: '0.5rem', width: '300px' }}
                    />
                    <button onClick={handleSend} style={{ marginLeft: '1rem' }}>
                        送信
                    </button>
                    <div style={{ marginTop: '1rem' }}>
                        <strong>応答:</strong> {reply}
                    </div>
                </>
            )}
        </div>
    );
};

export default Chat;