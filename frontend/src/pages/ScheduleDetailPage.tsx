import React, { useEffect, useRef, useState } from "react";
import SlideInRegisterPanel from "../components/SlideInRegisterPanel";

type ScheduleData = {
  title: string;
  start: string;
  end: string;
  emails: string[];
};

type Props = {
  initialData: ScheduleData | null;
};

const ScheduleDetailPage: React.FC<Props> = ({ initialData }) => {
    console.log("[initialData]", initialData)
    const [title, setTitle] = useState('');
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [emails, setEmails] = useState('');
    
    const [showPanel, setShowPanel] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title || '');
            setStart(initialData.start || '');
            setEnd(initialData.end || '');
            setEmails(initialData.emails.join(', '));
        }
    }, [initialData]);

    const handleSubmit = async () => {
        const emailList = emails.split(',').map(e => e.trim()).filter(Boolean);

        try {
        const res = await fetch('http://localhost:8080/calendar/db/group/create', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
            title,
            start,
            end,
            emails: emailList,
            }),
        });

        const data = await res.json();

        if (res.ok) {
            alert('予定を登録しました');
        } else {
            alert(`エラー: ${data.error}`);
        }
        } catch (e) {
        console.error(e);
        alert('登録に失敗しました');
        }
    };

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
          padding: '2rem',
          backgroundColor: '#fafafa',
          borderRadius: '0.75rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          maxWidth: '500px',
          margin: '0 auto',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}>
          <h2 style={{
            marginBottom: '1.5rem',
            fontSize: '1.5rem',
            borderBottom: '1px solid #ddd',
            paddingBottom: '0.5rem'
          }}>
            📅 予定の詳細
          </h2>
    
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontWeight: 600 }}>タイトル</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                marginTop: '0.25rem',
                border: '1px solid #ccc',
                borderRadius: '0.4rem'
              }}
            />
          </div>
    
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontWeight: 600 }}>開始日時 (ISO形式)</label>
            <input
              value={start}
              onChange={(e) => setStart(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                marginTop: '0.25rem',
                border: '1px solid #ccc',
                borderRadius: '0.4rem'
              }}
            />
          </div>
    
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontWeight: 600 }}>終了日時 (ISO形式)</label>
            <input
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                marginTop: '0.25rem',
                border: '1px solid #ccc',
                borderRadius: '0.4rem'
              }}
            />
          </div>
    
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontWeight: 600 }}>参加者メールアドレス（カンマ区切り）</label>
            <textarea
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '0.5rem',
                marginTop: '0.25rem',
                border: '1px solid #ccc',
                borderRadius: '0.4rem',
                fontFamily: 'inherit'
              }}
            />
          </div>
    
          <button
            onClick={handleSubmit}
            style={{
              backgroundColor: '#000',
              color: '#fff',
              border: 'none',
              padding: '0.6rem 1.2rem',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#222')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#000')}
          >
            予定を登録
          </button>
        
          <img
                src="/book.jpg" 
                alt="Book"
                onClick={() => setShowPanel(!showPanel)}
                style={{
                    position: 'fixed',
                    bottom: '3rem',
                    left: 'calc(25% + 1rem)',
                    width: '48px',
                    height: '48px',
                    borderRadius: '10%',
                    objectFit: 'cover',
                    // boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                    cursor: 'pointer',
                    backgroundColor: '#fff',
                    padding: '6px',
                    zIndex: 10,
                }}
          />

          {showPanel && (
                <div
                    ref={panelRef}
                    style={{
                    position: 'fixed',
                    bottom: '6rem',
                    left: '3rem',
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
            
        </div>
    );
};

export default ScheduleDetailPage;
