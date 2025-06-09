import React, { useState, useEffect, useRef, ChangeEvent, useMemo } from "react";
import { User } from "../types/types";
import { MentionsInput, Mention } from 'react-mentions';
import SlideInRegisterPanel from "../components/SlideInRegisterPanel";
 
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
  const [isLoading, setIsLoading] = useState(false);
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
  const calcEnd = (date: string, start: string, duration: string): string => {
    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute] = start.split(':').map(Number);
    const startDate = new Date(year, month - 1, day, hour, minute); // ← ローカルタイムで生成
  
    const min = duration.includes("時間")
      ? parseFloat(duration) * 60
      : parseInt(duration.replace("分", ""));
  
    startDate.setMinutes(startDate.getMinutes() + min);
  
    // JSTとしてISO形式で返す
    const yyyy = startDate.getFullYear();
    const mm = String(startDate.getMonth() + 1).padStart(2, '0');
    const dd = String(startDate.getDate()).padStart(2, '0');
    const hh = String(startDate.getHours()).padStart(2, '0');
    const minStr = String(startDate.getMinutes()).padStart(2, '0');
  
    return `${yyyy}-${mm}-${dd}T${hh}:${minStr}:00+09:00`;
  }
  

  // 空き時間ハンドラ
  const handleFreeSlot = async (
    emails: string[], 
    dateStr: string, 
    startTimeStr?: string,
    endTimeStr?: string
  ) => {
    const [year, month, day] = dateStr.split('-').map(Number);


    //const date = new Date(`${dateStr}T00:00:00+09:00`);
    //const start = new Date(date);
    //const end = new Date(date);
    //start.setHours(0, 0, 0, 0);
    //end.setHours(23, 59, 0, 0);

    // // const start = new Date(year, month - 1, day, 0, 0);
    // // const end = new Date(year, month - 1, day, 23, 59);

    // 開始日時
    const startHour = startTimeStr ? Number(startTimeStr.split(':')[0]) : 0;
    const startMinute = startTimeStr ? Number(startTimeStr.split(':')[1]) : 0;
    const start = new Date(year, month - 1, day, startHour, startMinute);

    // 終了日時
    let end: Date;
    if (endTimeStr) {
      const endHour = Number(endTimeStr.split(':')[0]);
      const endMinute = Number(endTimeStr.split(':')[1]);
      end = new Date(year, month - 1, day, endHour, endMinute);

      if (end <= start) {
        end.setDate(end.getDate() + 1);
      }
    } else {
      end = new Date(year, month - 1, day, 23, 59);
    }

    console.log("[end]: ", end)
    
    

    // start_time が指定されている場合
    {/* 
    if (startTimeStr) {
      const [startHour, startMinute] = startTimeStr.split(':').map(Number);
      start.setHours(startHour, startMinute, 0, 0);
      end.setTime(start.getTime() + 24 * 60 * 60 * 1000 - 60 * 1000);
    }

    const formatWithTZ = (d: Date) => {
        return d.toISOString().replace('Z', '+09:00');
    };
    */}

    const toJstISOString = (date: Date) => {
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

    setIsLoading(false); // ローディング終了
  };

  // Geminiの答えによって対応を変更
  const handleSend = async () => {
    if (!message.trim()) return;

    setIsLoading(true); // ローディング開始

    let cleanedMessage = message.replace(/@([\w.-]+@[\w.-]+\.\w+)/g, '$1');
    const userMessage = cleanedMessage;
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setMessage('');

    //let botReply = '';

    // 空き時間リクエストの処理
    //const isFreeSlotRequest = cleanedMessage.includes("空き時間");

    // #部署名 をメール展開
    Object.entries(departmentMap).forEach(([dep, emails]) => {
      const regex = new RegExp(`#${dep}\\b`, 'g');
      cleanedMessage = cleanedMessage.replace(regex, emails.join(', '));
    });

    const route = await routeByLLM(cleanedMessage);
    switch (route.intent) {
        case 'free_slot_request':
            return await handleFreeSlot(route.emails, route.date, route.start_time, route.end_time);

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
            setIsLoading(false); // ローディング終了
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
            setIsLoading(false); // ローディング終了
            return setMessages(prev => [...prev, { role: 'bot', text: "予定を登録しました！" }]);

        default:
            return setMessages(prev => [...prev, { role: 'bot', text: 'ごめんなさい、その指示はまだ理解できません。' }]);
    }
  }

  // 「#部署」でメンション
  const departmentMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    registeredUsers.forEach(user => {
      if (user.affiliation) {
        if (!map[user.affiliation]) map[user.affiliation] = [];
        map[user.affiliation].push(user.email);
      }
    });
    return map;
  }, [registeredUsers]);

  // 外側クリックでパネル閉じる処理
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
              setShowPanel(false);
          }
      };

      if (showPanel) {
          document.addEventListener('mousedown', handleClickOutside);
          } else {
          document.removeEventListener('mousedown', handleClickOutside);
          }
      
          // クリーンアップ
          return () => {
          document.removeEventListener('mousedown', handleClickOutside);
          };
  }, [showPanel]);

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

        {isLoading && (
          <div className="spinner-wrapper">
            <div className="spinner-circle"></div>
            <span>Zenithが考えています...</span>
          </div>
        )}
      </div>

      {/* 入力欄 */}
      <div style={{
        position: 'sticky',
        bottom: 0,
        width: '97%',
        padding: '0.5rem',
        display: 'flex',
        background: '#f4f4f4',
      }}>
        <div style={{
          flexShrink: 0,
          padding: '0.7rem 1rem',
          backgroundColor: '#fff',
          display: 'flex',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          borderRadius: '0.5rem',
          width: '95%',
          maxHeight: '10rem',
          border: 'none',
          position: 'relative',
        }}>
          <img
            src="/book.jpg" 
            alt="Book"
            onClick={() => setShowPanel(!showPanel)}
            style={{
                // position: 'relative',
                bottom: '1rem',
                left: 'calc(25% + 1rem)',
                width: '35px',
                height: '35px',
                borderRadius: '10%',
                objectFit: 'cover',
                // boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                cursor: 'pointer',
                backgroundColor: '#fff',
                padding: '1px',
                zIndex: 0,
                alignSelf: 'flex-end',
                marginRight: '1rem'
            }}
          />

          {showPanel && (
            <div
              ref={panelRef}
              style={{
              position: 'fixed',
              bottom: '6rem',
              left: '10%',
              width: '300px',
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              borderRadius: '0.5rem',
              padding: '1rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              zIndex: 999,
              }}
            >
              <SlideInRegisterPanel
                onClose={() => setShowPanel(false)}
                onSubmit={async (email, nickname, affiliation) => {
                  try {
                  const res = await fetch("http://localhost:8080/user/register", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email, nickname, affiliation }),
                  });
                  const data = await res.json();
                  console.log("登録成功:", data.message);
                  } catch (err) {
                  console.log("登録失敗", err);
                  }
                }}
              />
            </div>
          )}

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
          {/* @Nickname でメンション */}
          <Mention
            trigger="@"
            data={registeredUsers.map(user => ({
                id: user.email,
                display: user.nickname || user.email,
            }))}
            markup="@__id__"
            displayTransform={(id: string, display: string) => display}
          />
          {/* @Affiliation でメンション */}
          <Mention
            trigger="#"
            data={Object.keys(departmentMap).map(dep => ({
              id: dep,
              display: dep,
            }))}
            markup='#__id__'
            displayTransform={(id: string) => `#${id}`}
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
