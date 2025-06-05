import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import { User } from "../types/types";
import { MentionsInput, Mention } from 'react-mentions';
 
type basicScheduleInfo = {
    title: string;
    start: string;
    end: string;
    emails: string[];
};

type ChatProps = {
    registeredUsers: User[];
    setInitialSchedule: (schedule: basicScheduleInfo) => void;
    loggedIn: boolean;
};

const ChatPage: React.FC<ChatProps> = ({ registeredUsers, setInitialSchedule, loggedIn }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [showPanel, setShowPanel] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const maxHeight = 8 * 24;
      textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
    }
  }, [message]);

  // Geminiで自然言語処理させる
  const routeByLLM = async (message: string) => {
    try {
        const res = await fetch("http://localhost:8080/gemini/route", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message }),
        });
        return await res.json();
    } catch (err) {
        console.error("Gemini routing error", err);
        return { intent: "unknown" };
    }
  };

  // End時間を計算
  const calcEnd = (date: string | null, start: string | null, duration: string | null): string => {
    if (!date || !start || !duration) {
      throw new Error("日付、開始時刻、所要時間のいずれかが不足しています。")
    }
    const startTime = new Date(`${date}T${start}:00+09:00`);
    let minutes: number;
    if (duration.includes("時間")) {
      minutes = parseFloat(duration) * 60;
    } else if (duration.includes("分")) {
      minutes = parseInt(duration.replace("分", ""));
    } else {
      throw new Error("所要時間の形式が不正です（例：「1時間」または「30分」）");
    }
    startTime.setMinutes(startTime.getMinutes() + minutes);
    return startTime.toISOString();
  }

  // 空き時間ハンドラ
  const handleFreeSlot = async (emails: string[], dateStr: string) => {
    const date = new Date(`${dateStr}T00:00:00+09:00`);
    const start = new Date(date);
    const end = new Date(date);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 0, 0);

    const formatWithTZ = (d: Date) => {
        return d.toISOString().replace('Z', '+09:00');
    };

    function toJstISOString(date: Date) {
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}+09:00`;
    }

    const query = new URLSearchParams();
    emails.forEach(email => query.append("email", email));
    query.append("start", toJstISOString(start));
    query.append("end", toJstISOString(end));

    try {
        const res = await fetch(`http://localhost:8080/calendar/db/group/free?${query}`, {
            method: 'GET',
            credentials: 'include',
        });
        const data = await res.json();
        const slots = data.free_slots || [];

        if (slots.length === 0) {
            setMessages(prev => [...prev, { role: 'bot', text: "空き時間が見つかりませんでした。" }]);
        } else {
            const lines = slots.map((slot: any, i: number) => {
                const s = new Date(slot.start).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', hour12: false });
                const e = new Date(slot.end).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', hour12: false });
                return `${i + 1}. ${s} ～ ${e}`;
        });
        setMessages(prev => [...prev, { role: 'bot', text: `以下の空き時間が見つかりました:\n${lines.join('\n')}` }]);
      }
    } catch (err) {
        console.error(err);
        setMessages(prev => [...prev, { role: 'bot', text: "空き時間の取得中にエラーが発生しました。" }]);
    }
  };

  // Geminiの答えによって対応を変更
  const handleSend = async () => {
    if (!message.trim()) return;

    const cleanedMessage = message.replace(/@([\w.-]+@[\w.-]+\.\w+)/g, '$1');
    const userMessage = cleanedMessage;
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setMessage('');

    //let botReply = '';

    // 空き時間リクエストの処理
    //const isFreeSlotRequest = cleanedMessage.includes("空き時間");

    const route = await routeByLLM(cleanedMessage);
    switch (route.intent) {
        case 'free_slot_request':
            return await handleFreeSlot(route.emails, route.date);

        case 'schedule_register':
            setInitialSchedule({
                title: route.title || '',
                emails: route.emails || [],
                start: route.start_time && route.date
                  ? `${route.date}T${route.start_time}:00+09:00`
                  : '',
                end: route.start_time && route.duration && route.date
                  ? calcEnd(route.date, route.start_time, route.duration)
                  : '',
            });
            return setMessages(prev => [...prev, { role: 'bot', text: "予定の詳細を左側に表示しました。" }]);

        case 'schedule_register_direct':
            let end = '';
            try {
              end = calcEnd(route.date, route.start_time, route.duration);
            } catch (err) {
              setMessages(prev => [
                ...prev,
                { role: 'bot', text: "所要時間が見つからなかったため、予定の終了時刻を計算できませんでした。" },
              ]);
              return;
            }

            await fetch('http://localhost:8080/calendar/db/group/create', {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: route.title || '予定',
                    emails: route.emails || [],
                    start: route.date && route.start_time
                      ? `${route.date}T${route.start_time}:00+09:00`
                      : '',
                    end: end,
                    
                }),
                credentials: 'include',
            });
            return setMessages(prev => [...prev, { role: 'bot', text: "予定を登録しました！" }]);

        default:
            return setMessages(prev => [...prev, { role: 'bot', text: 'ごめんなさい、その指示はまだ理解できません。' }]);
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '92vh',
      overflow: 'hidden',
      padding: '10px',
      backgroundColor: '#f4f4f4',
      borderRadius: '0.5rem',
    }}>
      {/* ヘッダー */}
      <div style={{
        flexShrink: 0,
        padding: '0.5rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #eee',
        backgroundColor: '#ffffff',
        borderRadius: '0.5rem',
      }}>
        <h1 style={{ textAlign: 'center' }}>Zenith</h1>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.8rem' }}>
          {!loggedIn && (
            <button
              onClick={() => {}}
              style={{
                backgroundColor: '#000',
                color: '#fff',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.4rem 1rem',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                transition: 'background-color 0.2s ease',
              }}
            >
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
            会話をリセット
          </button>
        </div>
      </div>

      {/* チャット欄 */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1rem',
        position: 'relative',
        backgroundColor: '#fff',
        borderRadius: '0.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}>
        {messages.map((m, i) => (
          <div 
            key={i} 
            style={{
                textAlign: m.role === 'user' ? 'right' : 'left',
                marginBottom: '0.75rem',
                display: 'flex',
                flexDirection: 'column', 
                alignItems: m.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <strong 
                style={{ 
                    marginBottom: '0.2rem', 
                    fontWeight: m.role === 'bot' ? 700 : 500,          
                    color: m.role === 'bot' ? '#222' : '#555',         
                    fontSize: '0.9rem',
                }}
            >
                {m.role === 'user' ? 'You' : 'Zenith'}
            </strong>
            <div 
                style={{ 
                    whiteSpace: 'pre-wrap',
                    display: 'inline-block',
                    backgroundColor: m.role === 'user' ? '#f1f1f1' : 'transparent',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '0.5rem',
                    maxWidth: '80%',
                }}
            >
                {m.text}
            </div>
          </div>
        ))}
      </div>

      {/* 入力欄 */}
      <div style={{
        position: 'sticky',
        bottom: 0,
        width: '100%',
        padding: '0.5rem',
        display: 'flex',
        background: '#f4f4f4',
      }}>
        <div style={{
          flexShrink: 0,
          padding: '0.7rem 1rem',
          backgroundColor: '#fff',
          display: 'flex',
          // alignItems: 'flex-end',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          borderRadius: '0.5rem',
          width: '95%',
          // overflow: 'hidden',
          maxHeight: '12rem',
          border: 'none',
        }}>
          <MentionsInput
            value={message}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
            placeholder="Please ask Questions about Schedule"
            allowSuggestionsAboveCursor={true}
            className="chat-input"
            style={{
                suggestions: {
                    list: {
                      backgroundColor: '#fff',
                      border: '1px solid #ccc',
                      fontSize: '1rem',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      width: '250px', 
                      position: 'absolute',
                      zIndex: 1000,
                      bottom: '100%',
                      top: 'auto',
                    },
                    item: {
                      padding: '8px 12px',
                      borderBottom: '1px solid #eee',
                      cursor: 'pointer',
                    },
                },
            }}
          >
          <Mention
            trigger="@"
            data={registeredUsers.map(user => ({
                id: user.email,
                display: user.nickname || user.email,
            }))}
            markup="@__id__"
            displayTransform={(id: string, display: string) => display}
          />
          </MentionsInput>
          <button
            onClick={handleSend}
            style={{
              marginLeft: '1rem',
              backgroundColor: message.trim() ? '#000' : '#fff',  
              color: message.trim() ? '#fff' : '#000',
              borderColor: '#000',
              borderRadius: '0.5rem',
              padding: '0.5rem 1rem',
              cursor: message.trim() ? 'pointer' : 'not-allowed',
              fontWeight: 'bold',
              alignSelf: 'flex-end',
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
