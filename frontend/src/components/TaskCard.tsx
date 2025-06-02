const TaskCard: React.FC<{ title: string; status: string; due?: string}> = ({ title, status, due }) => (
    <div style={{
        border: '1px solid #ccc',
        borderRadius: '8px',
        padding: '0.75rem',
        marginBottom: '0.5rem',
        backgroundColor: status === 'completed' ? '#e0ffe0' : '#fff',
    }}>
        <strong>{title}</strong>
        <div>status: {status}</div>
        {due && <div>期限: {new Date(due).toLocaleString('ja-JP') }</div>}
    </div>
);

export default TaskCard;