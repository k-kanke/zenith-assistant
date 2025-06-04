import React, { useState, useEffect, useRef } from "react";
import TaskCard from "./TaskCard";

type Task = {
    title: string;
    status: string;
    dueDate?: string;
};

type ChatProps = {
    loggedIn: boolean;
};

// 初期チャット欄（タスク要素あり）
const Chat: React.FC<ChatProps> = ({ loggedIn }) => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);

    const handleSend = async () => {
        if (!message.trim()) return;

        const userMessage = message;
        setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
        setMessage('');

        // AI組み込むまでの簡易的なルールベース判定
        const isGetEvent = message.includes("予定") && !message.includes("で");
        const isCreateTask = message.includes("タスク") && message.includes("追加");
        const isGetTask = message.includes("タスク") && message.includes("教えて");

        const isCompleteTask = /^\d+\s*完了$/.test(message.trim());
        const isFreeSlotRequest = message.includes("空き時間");


        let endpoint = "";
        if (isGetEvent) {
            endpoint = 'http://localhost:8080/calendar/events';
        } else if (isCreateTask) {
            endpoint = 'http://localhost:8080/tasks/create';
        } else if (isGetTask) {
            endpoint = 'http://localhost:8080/tasks/upcoming';
        } else if (isCompleteTask) {
            const match = message.trim().match(/^(\d+)\s*完了$/);
            const idx = match ? parseInt(match[1], 10) - 1 : -1;

            if (idx >= 0 && idx < tasks.length) {
                const target = tasks[idx];
                endpoint = 'http://localhost:8080/tasks/complete';

                try {
                    const res = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        credentials: 'include',
                        body: JSON.stringify({ message: `${idx + 1}完了` }),
                    });
                    const data = await res.json();
                    const msg = data.message || 'タスクを完了しました';
                    setMessages(prev => [...prev, { role: 'bot', text: msg }]);
                    setTasks(prev => prev.filter((_, i) => i !== idx)); // タスクをリストから除外
                    return;
                } catch (err) {
                    console.error(err);
                    setMessages(prev => [...prev, { role: 'bot', text: '完了処理に失敗しました' }]);
                    return;
                }
            } else {
                setMessages(prev => [...prev, { role: 'bot', text: '該当する番号のタスクが見つかりません' }]);
                return;
            }
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
                } else if (isCompleteTask) {
                    botReply = data.message || "完了しました";
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
                    const lines = taskList.map((task: Task, idx: string) => {
                        const due = task.dueDate
                            ? new Date(task.dueDate).toLocaleString('ja-JP', { dateStyle: 'short', timeStyle: 'short' })
                            : '期限未設定';
                        return `${idx + 1}. ${task.title}（期限: ${due}）`;
                    });
                    botReply = `現在のタスクは以下の通りです:\n${lines.join('\n')}`;
                }
            }

            

            setMessages(prev => [...prev, { role: 'bot', text: botReply }]);
        
        } catch (err) {
            console.error('送信エラー: ', err);
            setMessages(prev => [...prev, { role: 'bot', text: 'エラーが発生しました' }]);
        }
    };

    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto'; 
            const maxHeight = 8 * 24; 
            textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
        }
    }, [message]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '92vh',
            overflow: 'hidden',
            padding: '10px'
        }}>
            {/* ヘッダー */}
            <div style={{
                flexShrink: 0,
                padding: '0.5rem 2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #eee',
                backgroundColor: '#fff',
            }}>
                <h1 style={{ textAlign: 'center' }}>Zenith</h1>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.8rem' }}>
                    {!loggedIn && (
                        <button
                            onClick={() => {}}
                            style={{
                                backgroundColor: '#000',     // 黒背景
                                color: '#fff',               // 白文字
                                border: 'none',
                                borderRadius: '0.5rem',
                                padding: '0.4rem 1rem',
                                fontSize: '0.85rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                                transition: 'background-color 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#222';
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#000';
                            }}
                        >
                            {/* ログインしていない時だけ表示するように後で変更 */}
                            ログイン 
                        </button>
                    )}

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
            </div>

            {/* チャット欄（スクロール） */}
            <div style={{
                flex: 1, 
                overflowY: 'auto',
                padding: '1rem',
                // backgroundColor: '#f9f9f9',
                position: 'relative',
            }}>
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

            {/* チャット入力欄 */}
            <div style={{
                position: 'sticky',
                bottom: 0,
                width: '100%',
                padding: '0.5rem',
                display: 'flex',
                background: 'transparent', 
            }}>
                <div style={{
                    flexShrink: 0,
                    padding: '0.7rem 1rem',
                    backgroundColor: '#fff',
                    display: 'flex',
                    alignItems: 'flex-end',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    borderRadius: '0.5rem',
                    width: '60%',
                }}>
                    <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="メッセージを入力（Shift + Enterで改行）"
                        rows={1}
                        style={{
                          flex: 1,
                          padding: '0.1rem',
                          border: 'none',
                          outline: 'none',
                          fontSize: '1rem',
                          resize: 'none',
                          overflow: 'auto',
                            lineHeight: '24px',
                            maxHeight: '192px',
                        }}
                    />
                    <button onClick={handleSend}style={{
                        marginLeft: '1rem',
                        backgroundColor: '#000',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '0.5rem',
                        padding: '0.5rem 1rem',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        alignSelf: 'flex-end', 
                    }}>
                        送信
                    </button>
                </div>
            </div>

            <button onClick={() => {}} style={{
                position: 'fixed',
                bottom: '3rem',
                right: '3rem',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: '#000',
                color: '#fff',
                fontSize: '1.5rem',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            }}>
                🗒️
            </button>

            
        </div>
    );
};

export default Chat;