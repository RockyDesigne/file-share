import { useState } from 'react';
import type { FormEvent } from 'react';
import { loginUser, registerUser } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

import styles from '../styles/Login.module.css';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (isRegister) {
        const res = await registerUser({ username, password });
        setMessage(res);
      } else {
        const jwt = await loginUser({ username, password });
        // Decode JWT payload to extract role
        const payload = JSON.parse(atob(jwt.split('.')[1]));
        const role = payload.role as 'ROLE_ADMIN' | 'ROLE_USER';
        login(username, jwt, role);
      }
    } catch (err: any) {
      setMessage(err?.response?.data ?? err.message);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <h1 className={styles.title}>{isRegister ? 'Create Account' : 'Welcome Back'}</h1>
        
        {message && <div className={styles.errorMessage}>{message}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={styles.input}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              required
            />
          </div>
          
          <button type="submit" className={styles.button}>
            {isRegister ? 'Register' : 'Login'}
          </button>
        </form>
        
        <p className={styles.toggleText}>
          {isRegister ? 'Already have an account?' : "Don't have an account?"}
          <button
            type="button"
            className={styles.toggleButton}
            onClick={() => {
              setIsRegister(!isRegister);
              setMessage(null);
            }}
          >
            {isRegister ? ' Login' : ' Register'}
          </button>
        </p>
      </div>
    </div>
  );
}
