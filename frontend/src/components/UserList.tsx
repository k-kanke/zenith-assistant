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
    <div>
      <h3>登録ユーザー一覧</h3>
      <ul>
        {users.map((user) => (
          <li key={user.email}>
            {user.nickname}（{user.email} / {user.affiliation}）
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserList;
