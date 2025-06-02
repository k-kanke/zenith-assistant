import React, { useState, useEffect } from "react";
import TaskCard from "./TaskCard";

const Chat: React.FC = () => {
    const [message, setMessage] = useState('');
    const [loggedIn, setLoggedIn] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);

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
        const isCreateTask = message.includes("タスク") && message.includes("追加");
        const isGetTask = message.includes("タスク") && message.includes("教えて");

        let endpoint = "";
        if (isGetEvent) {
            endpoint = 'http://localhost:8080/calendar/events';
        } else if (isCreateTask) {
            endpoint = 'http://localhost:8080/tasks/create';
        } else if (isGetTask) {
            endpoint = 'http://localhost:8080/tasks/upcoming';
        } else {
            endpoint = 'http://localhost:8080/calendar/events/create';
        }

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
            // console.log("[rawText]: ", rawText)
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
                } else if (isCreateTask) {
                    botReply = data.message || "タスクを登録しました";
                } else {
                    botReply = data.message;
                }
            } else {
                botReply = data.error || 'エラーが発生しました';
            }

            if (isGetTask) {
                const taskList = data.tasks || [];
                setTasks(taskList);
                if (taskList.length === 0) {
                    botReply = "タスクはありません";
                } else {
                    botReply = `${taskList.length}件のタスクがあります。`;
                }
            }

            setMessages(prev => [...prev, { role: 'bot', text: botReply }]);
        
        } catch (err) {
            console.error('送信エラー: ', err);
            setMessages(prev => [...prev, { role: 'bot', text: 'エラーが発生しました' }]);
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            padding: 50
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem 1rem',
                borderBottom: '1px solid #eee',
            }}>
                <h1 style={{ textAlign: 'center' }}>Zenith</h1>
                <button
                    onClick={() => setMessages([])}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#888',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                    }}
                >
                    リセット
                </button>
            </div>

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

                    {tasks.length > 0 && (
                        <div>
                            <h3>タスク一覧</h3>
                            {tasks.map((task, i) => (
                                <TaskCard
                                    key={i}
                                    title={task.title}
                                    status={task.status}
                                    due={task.dueDate}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Chat;