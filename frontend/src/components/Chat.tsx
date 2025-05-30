import React, { useState } from "react";

const Chat: React.FC = () => {
    const [message, setMessage] = useState('');
    const [reply, setReply] = useState('');

    const handleSend = async () => {
        if (!message.trim()) return;

        try {
            const res = await fetch('http://localhost:8080/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message }),
            });

            const data = await res.json();
            setReply(data.reply);
        } catch (err) {
            console.error('送信エラー: ', err);
            setReply('エラーが発生しました');
        }
    };

    return (
        <div>
            <h1>Zenith</h1>
            <input 
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="メッセージを入力"
                style={{ padding: '0.5rem', width: '300px' }}
            />
            <button onClick={handleSend} style={{ marginLeft: '1rem' }}>
                送信
            </button>
            <div style={{ marginTop: '1rem' }}>
                <strong>応答:</strong> {reply}
            </div>
        </div>
    );
};

export default Chat;