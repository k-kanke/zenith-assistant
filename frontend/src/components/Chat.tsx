import React, { useState, useEffect } from "react";

const Chat: React.FC = () => {
    const [message, setMessage] = useState('');
    const [loggedIn, setLoggedIn] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([]);

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

        const userMessage = message;
        setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
        setMessage('');

        // AI組み込むまでの簡易的なルールベース判定
        const isGetEvent = message.includes("予定") && !message.includes("で");

        const endpoint = isGetEvent
            ? 'http://localhost:8080/calendar/events'
            : 'http://localhost:8080/calendar/events/create';


        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ message: userMessage }),
            });

            const rawText = await res.text();
            const data = JSON.parse(rawText);

            let botReply = '';

            if (res.ok) {
                if (isGetEvent) {
                    const events = data.events || [];
                    if (events.length === 0) {
                        botReply = "予定が見つかりませんでした";
                    } else {
                        const summaries = events.map((e: any) => {
                            const start = new Date(e.start?.dateTime || e.start?.date);
                            const timeStr = start.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
                            return `・${e.summary}（${timeStr}〜）`;
                        });
                        botReply = `${events.length}件の予定があります:\n${summaries.join('\n')}`;
                    }
                } else {
                    botReply = data.message;
                }       
            } else {
                botReply = data.error || 'エラーが発生しました';
            }

            setMessages(prev => [...prev, { role: 'bot', text: botReply }]);
        
        } catch (err) {
            console.error('送信エラー: ', err);
            setMessages(prev => [...prev, { role: 'bot', text: 'エラーが発生しました' }]);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: 100 }}>
            <h1 style={{ textAlign: 'center' }}>Zenith</h1>

            {!loggedIn ? (
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                    <button onClick={handleLogin}>Googleアカウントでログイン</button>
                    <button onClick={() => window.location.reload()} style={{ marginLeft: '1rem' }}>
                        ログイン後に反映
                    </button>
                </div>
            ): (
                <>
                    <div>
                        {messages.map((m, i) => (
                            <div key={i} style={{
                                textAlign: m.role === 'user' ? 'right' : 'left',
                                marginBottom: '0.5rem',
                            }}>
                                <strong>{m.role === 'user' ? 'あなた' : 'Zenith'}:</strong>
                                <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
                            </div>
                        ))}
                    </div>

                    <div>
                        <input 
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                            placeholder="メッセージを入力"
                            style={{ padding: '0.5rem', flex: 1, marginRight: '1rem' }}
                        />
                        <button onClick={handleSend}>
                            送信
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default Chat;