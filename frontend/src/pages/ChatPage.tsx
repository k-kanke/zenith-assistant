import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import UserRegisterModal from "../components/UserRegisterModal";
import SlideInRegisterPanel from "../components/SlideInRegisterPanel";
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

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const maxHeight = 8 * 24;
      textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
    }
  }, [message]);

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMessage = message;
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setMessage('');

    let botReply = '';

    // 空き時間リクエストの処理
    const isFreeSlotRequest = message.includes("空き時間");

    if (isFreeSlotRequest) {
        // ユーザーの入力から設定できるように（後々ここはAIで）
        const args = message.replace("空き時間", "").trim();
        const tokens = args.split(" ")

        let date = new Date(); // デフォルトで今日を設定
        let emails: string[] = [];

        if (tokens.length > 0) {
            const datePattern = /^\d{4}-\d{2}-\d{2}$/;
            if (datePattern.test(tokens[0])) {
                date = new Date(`${tokens[0]}T00:00:00+09:00`);
                emails = tokens.slice(1).join(" ").split(",").map(e => e.trim());
              } else {
                emails = args.split(",").map(e => e.trim());
              }
        }

        if (emails.length === 0 || emails.some(e => !e.includes("@"))) {
            setMessages(prev => [...prev, { role: 'bot', text: "正しいメールアドレスを1つ以上入力してください。" }]);
            return;
          }      

        const start = new Date(date);
        start.setHours(0, 0, 0, 0)
        const end = new Date(date);
        end.setHours(23, 59, 0, 0)

        const query = new URLSearchParams();
        emails.forEach(email => query.append("email", email));
        query.append("start", start.toISOString());
        query.append("end", end.toISOString());

        try {
        const res = await fetch(`http://localhost:8080/calendar/db/group/free?${query}`, {
            method: 'GET',
            credentials: 'include',
        });

        const data = await res.json();
        const slots = data.free_slots || [];

        if (slots.length === 0) {
            botReply = "空き時間が見つかりませんでした。";
        } else {
            const lines = slots.map((slot: any, idx: number) => {
            const startTime = new Date(slot.start).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
            const endTime = new Date(slot.end).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
            return `${idx + 1}. ${startTime} ～ ${endTime}`;
            });
            botReply = `以下の空き時間が見つかりました:\n${lines.join('\n')}`;
        }
        } catch (err) {
        console.error("空き時間取得エラー:", err);
        botReply = "空き時間の取得中にエラーが発生しました。";
        }

        setMessages(prev => [...prev, { role: 'bot', text: botReply }]);
        return;
    }

    // 会議情報をパーズして初期値にセット
    if (message.includes("会議")) {
        try {
            const res = await fetch("http://localhost:8080/calendar/db/parse", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message }),
            });

            const data = await res.json()

            setInitialSchedule({
                title: data.title,
                start: data.start,
                end: data.end,
                emails: data.emails,
            });

            setMessages(prev => [
                ...prev,
                { role: 'bot', text: "予定の詳細を左側に表示しました。" }
            ]);
        } catch (e) {
            console.error(e);
            setMessages(prev => [
                ...prev,
                { role: 'bot', text: "予定の解析に失敗しました。" }
            ]);
        }

        return;
    }

    // 未定義時の応答
    setMessages(prev => [...prev, { role: 'bot', text: 'ごめんなさい、その指示はまだ理解できません。' }]);
  };

  const handleUserRegister = (email: string, nickname: string, affiliation: string) => {
    console.log("登録データ:", email, nickname, affiliation);
    // Firestore保存ロジックここに追加予定
    setShowPanel(false);
  };

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
            リセット
          </button>
        </div>
      </div>

      {/* チャット欄 */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1rem',
        position: 'relative',
      }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            textAlign: m.role === 'user' ? 'right' : 'left',
            marginBottom: '0.5rem',
          }}>
            <strong>{m.role === 'user' ? 'You' : 'Zenith'}:</strong>
            <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
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
          {/*
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
          */}
          <MentionsInput
            value={message}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
            style={{
              width: '100%',
              minHeight: '40px',
              fontSize: '1rem',
              padding: '0.2rem',
            }}
          >
          <Mention
            trigger="@"
            data={registeredUsers.map(user => ({
                id: user.email,
                display: user.nickname || user.email,
              }))}
              markup="@__id__"
              displayTransform={(id: string, display: string) => `@${display}`}
            />
          </MentionsInput>
          <button
            onClick={handleSend}
            style={{
              marginLeft: '1rem',
              backgroundColor: '#000',
              color: '#fff',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontWeight: 'bold',
              alignSelf: 'flex-end',
            }}
          >
            送信
          </button>
        </div>
      </div>

      <button onClick={() => setShowPanel(!showPanel)} style={{
                position: 'fixed',
                bottom: '3rem',
                right: '3rem',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                border: 'none',
                background: 'linear-gradient(145deg, #222, #000)',
                color: '#fff',
                fontSize: '1.5rem',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(5, 5, 5, 0.2)',
                transition: 'all 0.3s ease-in-out',
      }}>
        🖊️
      </button>

      {/* パネル表示 */}
      {showPanel && (
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
                console.log("登録失敗", err)
            }
          }}
        />
      )}

      

    </div>
  );
};

export default ChatPage;
