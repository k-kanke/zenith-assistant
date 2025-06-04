import { useEffect, useState } from "react";

type ScheduleDetailProps = {
    initialData: {
      title: string;
      start: string;
      end: string;
      emails: string[];
    } | null;
  };

  const ScheduleDetailPage: React.FC<ScheduleDetailProps> = ({ initialData }) => {
    const [title, setTitle] = useState('');
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [emails, setEmails] = useState<string[]>([]);
  
    useEffect(() => {
      if (initialData) {
        setTitle(initialData.title);
        setStart(initialData.start);
        setEnd(initialData.end);
        setEmails(initialData.emails);
      }
    }, [initialData]);
  
    return (
      <div>
        <h3>予定詳細</h3>
        <input value={title} onChange={e => setTitle(e.target.value)} />
        <input value={start} onChange={e => setStart(e.target.value)} />
        <input value={end} onChange={e => setEnd(e.target.value)} />
        <textarea value={emails.join('\n')} onChange={e => setEmails(e.target.value.split('\n'))} />
        {/* 予定登録ボタンなど */}
      </div>
    );
  };

export default ScheduleDetailPage