import { useEffect, useState } from 'react';
import { downloadFile, getUserFiles, uploadFile } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

import styles from '../styles/Dashboard.module.css';

export default function Dashboard() {
  const { username, logout } = useAuth();
  const [files, setFiles] = useState<{ id: number; name: string }[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const fetchFiles = async () => {
    if (!username) return;
    try {
      const data = await getUserFiles(username);
      setFiles(data);
    } catch (err: any) {
      setMsg(err?.response?.data ?? err.message);
    }
  };

  useEffect(() => {
    fetchFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

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
    if (!username) return;
    try {
      const arrayBuffer = await downloadFile(name, username);
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
        <h2 className={styles.sectionTitle}>Your Files</h2>
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
