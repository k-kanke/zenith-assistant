import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";

type User = {
  email: string;
  nickname: string;
  affiliation: string;
};

type Props = {
  selected: string[];
  onSelect: (emails: string[]) => void;
};

const EmailSelector: React.FC<Props> = ({ selected, onSelect }) => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const list = snapshot.docs.map((doc) => doc.data() as User);
      setAllUsers(list);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setSelectedEmails(selected);
  }, [selected]);

  // フィルタリング（すでに選択済みは除外）
  const filteredUsers = allUsers.filter(
    (user) =>
      user.email.includes(inputValue) &&
      !selectedEmails.includes(user.email)
  );

  const handleAdd = (email: string) => {
    const newList = [...selectedEmails, email];
    setSelectedEmails(newList);
    setInputValue("");
    onSelect(newList);
  };

  const handleRemove = (email: string) => {
    const newList = selectedEmails.filter((e) => e !== email);
    setSelectedEmails(newList);
    onSelect(newList);
  };

  return (
    <div style={{ marginBottom: "1rem" }}>
      <label htmlFor="email-input">参加者メールアドレス:</label>
      <input
        id="email-input"
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="メールアドレスを入力"
        style={{
          width: "100%",
          padding: "0.5rem",
          marginBottom: "0.5rem",
          border: "1px solid #ccc",
          borderRadius: "0.4rem",
        }}
      />

      {filteredUsers.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, marginBottom: "0.5rem", maxHeight: "150px", overflowY: "auto" }}>
          {filteredUsers.map((user, idx) => (
            <li
              key={idx}
              onClick={() => handleAdd(user.email)}
              style={{
                cursor: "pointer",
                padding: "0.3rem",
                borderBottom: "1px solid #eee",
                backgroundColor: "#fafafa",
                borderRadius: "0.3rem",
              }}
            >
              <strong>{user.nickname || user.email}</strong>（{user.affiliation || "未所属"}）<br />
              <span style={{ color: "#666" }}>{user.email}</span>
            </li>
          ))}
        </ul>
      )}

      {/*
      {selectedEmails.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <strong>選択中の参加者:</strong>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
            {selectedEmails.map((email, i) => (
              <div
                key={i}
                style={{
                  background: "#f0f0f0",
                  borderRadius: "1rem",
                  padding: "0.4rem 0.8rem",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {email}
                <button
                  onClick={() => handleRemove(email)}
                  style={{
                    marginLeft: "0.5rem",
                    background: "none",
                    border: "none",
                    color: "#999",
                    cursor: "pointer",
                  }}
                >
                  ❌
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      */}
    </div>
  );
};

export default EmailSelector;
