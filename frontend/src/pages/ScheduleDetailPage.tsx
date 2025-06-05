import React, { useEffect, useState } from "react";

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

  return (
    <div style={{ padding: '2rem' }}>
      <h2>予定の詳細</h2>
      <label>タイトル:</label><br />
      <input value={title} onChange={(e) => setTitle(e.target.value)} /><br />

      <label>開始日時 (ISO形式):</label><br />
      <input value={start} onChange={(e) => setStart(e.target.value)} /><br />

      <label>終了日時 (ISO形式):</label><br />
      <input value={end} onChange={(e) => setEnd(e.target.value)} /><br />

      <label>参加者メールアドレス（カンマ区切り）:</label><br />
      <textarea
        value={emails}
        onChange={(e) => setEmails(e.target.value)}
        rows={3}
      /><br /><br />

      <button onClick={handleSubmit}>予定を登録</button>
    </div>
  );
};

export default ScheduleDetailPage;
