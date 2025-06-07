// frontend/src/components/UserList.tsx
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";

type User = {
  email: string;
  nickname: string;
  affiliation: string;
};

const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const userList: User[] = snapshot.docs.map((doc) => ({
        ...(doc.data() as User),
      }));
      setUsers(userList);
    });

    return () => unsubscribe(); // cleanup
  }, []);

  return (
    <div style={{ padding: '1rem', backgroundColor: '#fff', borderRadius: '0.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h3>登録ユーザー一覧</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <thead>
          <tr>
            <th style={{ borderBottom: '1px solid #ddd', textAlign: 'left', padding: '0.5rem' }}>ニックネーム</th>
            <th style={{ borderBottom: '1px solid #ddd', textAlign: 'left', padding: '0.5rem' }}>所属</th>
            <th style={{ borderBottom: '1px solid #ddd', textAlign: 'left', padding: '0.5rem' }}>メールアドレス</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, idx) => (
            <tr key={idx}>
              <td style={{ borderBottom: '1px solid #eee', padding: '0.5rem' }}>{user.nickname || '-'}</td>
              <td style={{ borderBottom: '1px solid #eee', padding: '0.5rem' }}>{user.affiliation || '-'}</td>
              <td style={{ borderBottom: '1px solid #eee', padding: '0.5rem' }}>{user.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserList;
