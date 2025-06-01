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

        try {
            const res = await fetch('http://localhost:8080/chat/schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ message }),
            });

            const data = await res.json();

            if (res.ok) {
                setReply(`${data.message}`);        
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