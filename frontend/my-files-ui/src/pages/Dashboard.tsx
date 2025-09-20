import { useEffect, useState } from 'react';
import { downloadFile, getUserFiles, uploadFile, getAllUsers, type UserDTO, type Page, type FileDataDTO, updateUser, registerUser } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

import styles from '../styles/Dashboard.module.css';

export default function Dashboard() {
  const { username, role, logout } = useAuth();
  const [files, setFiles] = useState<Page<FileDataDTO>>();
  const [users, setUsers] = useState<Page<UserDTO>>();
  const [viewUserInfo, setViewUserInfo] = useState<UserDTO | null>(null);
  const [viewUsername, setViewUsername] = useState<string | null>(null);
  const [viewAddUser, setAddUserView] = useState<UserDTO | null>(null);
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

  useEffect(() => {
    if (!msg) return; // 1️⃣ If there's no message, do nothing

    const timer = setTimeout(() => {
      setMsg(null);   // 2️⃣ After 3 seconds, clear the message
    }, 3000);

    return () => clearTimeout(timer); // 3️⃣ Cleanup if msg changes or component unmounts
  }, [msg]); // 4️⃣ Run this effect whenever msg changes

  const handlerUserInfoEdit = async (userInfo: UserDTO) => {
    try {
      const res = await updateUser(userInfo);
      const list = await getAllUsers();
      setUsers(list);
      setMsg(res);
    } catch (err: any) {
      setMsg(err?.response?.data ?? err.message);
    }
  }

  const handleAddNewUser = async (userInfo: UserDTO) => {
    try {
      const res = await registerUser(userInfo);
      const list = await getAllUsers();
      setUsers(list);
      setMsg(res);
    } catch (err: any) {
      setMsg(err?.response?.data ?? err.message);
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !username) return;
    try {
      const res = await uploadFile(selectedFile, viewUsername ?? username);
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

  const isAdmin = role === 'ROLE_ADMIN';
  const hasSelectedUser = !isAdmin || !!viewUsername;
  // non-admins always have a user (themselves); admins only after clicking a row

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
        <div className={styles.adminToolbar}>
          <button
            onClick={() => {
              setViewUsername(null);
              setViewUserInfo(null);
              setAddUserView(null);
            }}
            className={styles.usersButton}
          >
            Users
          </button>
          <button
            onClick={() => {
              setViewUsername(null);
              setViewUserInfo(null);
              setAddUserView({
                username: "",
                password: "",
                address: "",
              });
            }}
            className={styles.usersButton}
          >
            Add user
          </button>
          <button
            className={styles.usersButton}
          >
            Export
          </button>
        </div>
      )}

      {isAdmin && !hasSelectedUser && !viewUserInfo && !viewAddUser && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Users</h2>
          {users?.totalElements === 0 ? (
            <p>No users found.</p>
          ) : (
            <table className={styles.userTable}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Documents</th>
                </tr>
              </thead>
              <tbody>
                {users?.content.map((u) => (
                  <tr
                    key={u.username}
                    //onClick={() => setViewUsername(u.username)}
                    className={`${styles.userRow} ${viewUsername === u.username ? styles.activeRow : ''}`}
                  >
                    <td
                      onClick={() => setViewUserInfo(u)} className={styles.clickableCell}
                    >{u.username}</td>
                    <td
                      onClick={() => setViewUsername(u.username)} className={styles.clickableCell}
                    >Documents</td>
                  </tr>
                ))}
              </tbody>
            </table>

          )}
        </section>
      )}

      {viewAddUser && !viewUsername && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Add User</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddNewUser(viewAddUser);
            }}
            className={styles.form}
          >
            <div className={styles.formField}>
              <label>Username</label>
              <input
                type="text"
                value={viewAddUser.username}
                onChange={(e) =>
                  setAddUserView({ ...viewAddUser, username: e.target.value })
                }
              />
            </div>

            <div className={styles.formField}>
              <label>Password</label>
              <input
                type="text"
                value={viewAddUser.password}
                onChange={(e) =>
                  setAddUserView({ ...viewAddUser, password: e.target.value })
                }
              />
            </div>

            <div className={styles.formField}>
              <label>Address</label>
              <input
                type="address"
                value={viewAddUser.address ?? ""}
                onChange={(e) =>
                  setAddUserView({ ...viewAddUser, address: e.target.value })
                }
              />
            </div>
            <button type="submit" className={styles.saveButton}>
              Save
            </button>
            <button
              type="button"
              onClick={() => setViewUserInfo(null)}
              className={styles.cancelButton}
            >
              Cancel
            </button>
          </form>
        </section>
      )}

      {viewUserInfo && !viewUsername && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Edit User</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handlerUserInfoEdit(viewUserInfo);
            }}
            className={styles.form}
          >
            <div className={styles.formField}>
              <label>Username</label>
              <input
                type="text"
                value={viewUserInfo.username}
                onChange={(e) =>
                  setViewUserInfo({ ...viewUserInfo, username: e.target.value })
                }
              />
            </div>

            <div className={styles.formField}>
              <label>Address</label>
              <input
                type="address"
                value={viewUserInfo.address ?? ""}
                onChange={(e) =>
                  setViewUserInfo({ ...viewUserInfo, address: e.target.value })
                }
              />
            </div>
            <button type="submit" className={styles.saveButton}>
              Save
            </button>
            <button
              type="button"
              onClick={() => setViewUserInfo(null)}
              className={styles.cancelButton}
            >
              Cancel
            </button>
          </form>
        </section>
      )}

      {hasSelectedUser && !viewUserInfo && (
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
      )}

      {hasSelectedUser && !viewUserInfo && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{role === 'ROLE_ADMIN' ? `${viewUsername ?? username}'s Files` : 'Your Files'}</h2>
          {files?.totalElements === 0 ? (
            <p>No files uploaded yet.</p>
          ) : (
            <ul className={styles.fileList}>
              {files?.content.map((file) => (
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
        </section>)}

    </div>
  );
}
