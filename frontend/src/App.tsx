import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import DashboardPage from './pages/DashboardPage';
import UserList from './pages/users/UserList'; // Force-refresh TS mapping
import UserFormPage from './pages/users/UserFormPage';
import UserSettings from './pages/settings/UserSettings';

function App() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Login />;

  return (
    <Router>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/users" element={<UserList />} />
        <Route path="/users/add" element={<UserFormPage />} />
        <Route path="/users/edit/:id" element={<UserFormPage />} />
        <Route path="/settings" element={<UserSettings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
 
