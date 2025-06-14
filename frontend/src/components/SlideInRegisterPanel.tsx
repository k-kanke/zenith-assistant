import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../firebase";

type Props = {
    onClose: () => void;
    onSubmit: (email: string, nickname: string, affiliation: string) => void;
};

type User = {
    email: string;
    nickname: string;
    affiliation: string;
};

const SlideInRegisterPanel: React.FC<Props> = ({ onClose, onSubmit }) => {
    const [email, setEmail] = useState('');
    const [nickname, setNickname] = useState('');
    const [affiliation, setAffiliation] = useState('');

    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
          const userList: User[] = snapshot.docs.map((doc) => doc.data() as User);
          setUsers(userList);
        });
      
        return () => unsubscribe(); // コンポーネントがアンマウントされた時に購読解除
    }, []);
  
    return (
      <div style={{
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: '1rem',
        // boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        // padding: '1.5rem',
        transition: 'transform 0.3s ease-in-out',
      }}>
        <h4 style={{ marginBottom: '0.5rem' }}>ユーザー登録</h4>
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
          placeholder="所属（例：#sales）"
          value={affiliation}
          onChange={e => setAffiliation(e.target.value)}
          style={{ width: '100%', marginBottom: '1rem' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button onClick={onClose}>Close</button>
          <button
            onClick={() => {
                onSubmit(email, nickname, affiliation);
                setEmail('');
                setNickname('');
                setAffiliation('');
            }}
            style={{ backgroundColor: '#000', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '0.5rem' }}
          >
            Save
          </button>
        </div>
        <hr style={{ margin: '0.5rem 0' }} />
        <h4>登録済みユーザー</h4>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr>
                <th style={{ borderBottom: '1px solid #ddd', textAlign: 'left', padding: '0.5rem' }}>Name</th>
                <th style={{ borderBottom: '1px solid #ddd', textAlign: 'left', padding: '0.5rem' }}>Aff</th>
                <th style={{ borderBottom: '1px solid #ddd', textAlign: 'left', padding: '0.5rem' }}>Email</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => (
                <tr key={i}>
                  <td style={{ borderBottom: '1px solid #eee', padding: '0.5rem' }}>{user.nickname || '-'}</td>
                  <td style={{ borderBottom: '1px solid #eee', padding: '0.5rem' }}>{user.affiliation || '-'}</td>
                  <td style={{ borderBottom: '1px solid #eee', padding: '0.5rem' }}>{user.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
};
  

export default SlideInRegisterPanel;