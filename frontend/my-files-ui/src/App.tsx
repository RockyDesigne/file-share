import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function AppRoutes() {
  const { token } = useAuth();

  return (
    <Routes>
      <Route path="/" element={token ? <Dashboard /> : <Navigate to="/login" />} />
      <Route path="/login" element={token ? <Navigate to="/" /> : <Login />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App
