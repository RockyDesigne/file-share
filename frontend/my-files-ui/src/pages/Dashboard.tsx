import { useEffect, useState } from 'react';
import { downloadFile, getUserFiles, uploadFile, getAllUsers, type UserDTO } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

import styles from '../styles/Dashboard.module.css';

export default function Dashboard() {
  const { username, role, logout } = useAuth();
  const [files, setFiles] = useState<{ id: number; name: string }[]>([]);
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [viewUsername, setViewUsername] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const fetchFiles = async () => {
    const targetUser = role === 'ROLE_ADMIN' ? viewUsername ?? username : username;
    if (!targetUser) return;
    try {
      const data = await getUserFiles(targetUser);
      setFiles(data);
    } catch (err: any) {
      setMsg(err?.response?.data ?? err.message);
    }
  };

  useEffect(() => {
    fetchFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, role, viewUsername]);

  // Fetch users if admin
  useEffect(() => {
    const fetchUsers = async () => {
      if (role !== 'ROLE_ADMIN') return;
      try {
        const list = await getAllUsers();
        setUsers(list);
      } catch (err: any) {
        setMsg(err?.response?.data ?? err.message);
      }
    };
    fetchUsers();
  }, [role]);

  const handleUpload = async () => {
    if (!selectedFile || !username) return;
    try {
      const res = await uploadFile(selectedFile, username);
      setMsg(res);
      setSelectedFile(null);
      await fetchFiles();
    } catch (err: any) {
      setMsg(err?.response?.data ?? err.message);
    }
  };

  const handleDownload = async (name: string) => {
    const targetUser = role === 'ROLE_ADMIN' ? viewUsername ?? username : username;
    if (!targetUser) return;
    try {
      const arrayBuffer = await downloadFile(name, targetUser);
      const blob = new Blob([arrayBuffer]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setMsg(err?.response?.data ?? err.message);
    }
  };

  if (!username) return null;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Welcome, {username}</h1>
        <button onClick={logout} className={styles.logoutButton}>
          Logout
        </button>
      </header>

      {msg && (
        <div className={msg.includes('success') ? styles.messageSuccess : styles.messageError}>
          {msg}
        </div>
      )}

      {role === 'ROLE_ADMIN' && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Users</h2>
          {users.length === 0 ? (
            <p>No users found.</p>
          ) : (
            <ul className={styles.userList}>
              {users.map((u) => (
                <li key={u.username} className={styles.userItem}>
                  <button
                    onClick={() => {
                      setViewUsername(u.username);
                    }}
                    className={`${styles.userButton} ${viewUsername === u.username ? styles.activeUser : ''}`}
                  >
                    {u.username}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Upload File</h2>
        <div className={styles.uploadContainer}>
          <input
            type="file"
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            className={styles.fileInput}
          />
          <button
            onClick={handleUpload}
            disabled={!selectedFile}
            className={`${styles.uploadButton} ${!selectedFile ? styles.disabled : ''}`}
          >
            Upload File
          </button>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{role === 'ROLE_ADMIN' ? `${viewUsername ?? username}'s Files` : 'Your Files'}</h2>
        {files.length === 0 ? (
          <p>No files uploaded yet.</p>
        ) : (
          <ul className={styles.fileList}>
            {files.map((file) => (
              <li key={file.id} className={styles.fileItem}>
                <span className={styles.fileName}>{file.name}</span>
                <button
                  onClick={() => handleDownload(file.name)}
                  className={styles.downloadButton}
                >
                  Download
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
