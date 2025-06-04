import React, { useState } from 'react';

type Props = {
  onClose: () => void;
  onSubmit: (email: string, nickname: string, affiliation: string) => void;
};

const UserRegisterModal: React.FC<Props> = ({ onClose, onSubmit }) => {
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [affiliation, setAffiliation] = useState('');

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: '#fff',
        padding: '2rem',
        borderRadius: '1rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        minWidth: '320px'
      }}>
        <h2>ユーザー登録</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            type="text"
            placeholder="ニックネーム（例：@tanaka）"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
          />
          <input
            type="text"
            placeholder="所属（例：@sales）"
            value={affiliation}
            onChange={e => setAffiliation(e.target.value)}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={onClose} style={{ padding: '0.5rem 1rem' }}>キャンセル</button>
            <button
              onClick={() => onSubmit(email, nickname, affiliation)}
              style={{ padding: '0.5rem 1rem', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '0.5rem' }}
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserRegisterModal;
