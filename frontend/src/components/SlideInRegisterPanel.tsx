import { useState } from "react";

type Props = {
    onClose: () => void;
    onSubmit: (email: string, nickname: string, affiliation: string) => void;
};

const SlideInRegisterPanel: React.FC<Props> = ({ onClose, onSubmit }) => {
    const [email, setEmail] = useState('');
    const [nickname, setNickname] = useState('');
    const [affiliation, setAffiliation] = useState('');
  
    return (
      <div style={{
        position: 'fixed',
        bottom: '5rem',
        right: '1rem',
        width: '300px',
        backgroundColor: '#fff',
        borderRadius: '1rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        padding: '1.5rem',
        zIndex: 1000,
        transition: 'transform 0.3s ease-in-out',
      }}>
        <h3 style={{ marginBottom: '1rem' }}>ユーザー登録</h3>
        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width: '100%', marginBottom: '0.5rem' }}
        />
        <input
          type="text"
          placeholder="ニックネーム（例：@tanaka）"
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          style={{ width: '100%', marginBottom: '0.5rem' }}
        />
        <input
          type="text"
          placeholder="所属（例：@sales）"
          value={affiliation}
          onChange={e => setAffiliation(e.target.value)}
          style={{ width: '100%', marginBottom: '1rem' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button onClick={onClose}>キャンセル</button>
          <button
            onClick={() => onSubmit(email, nickname, affiliation)}
            style={{ backgroundColor: '#000', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '0.5rem' }}
          >
            保存
          </button>
        </div>
      </div>
    );
};
  

export default SlideInRegisterPanel;