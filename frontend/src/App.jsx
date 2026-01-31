import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { responseAPI } from './services/api';
import { offlineSync } from './utils/offlineSync';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TakeSurvey from './pages/TakeSurvey';
import SurveyView from './pages/SurveyView';
import SurveyAnalytics from './pages/SurveyAnalytics';
import SurveyData from './pages/SurveyData';
import Profile from './pages/Profile';
import UsersPage from './pages/UsersPage';
import './App.css';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) return <Navigate to="/login" />;
  if (user.role !== 'admin') return <Navigate to="/take-survey/1" />;

  return children;
}

function App() {
  useEffect(() => {
    const runSync = async () => {
      if (navigator.onLine) {
        const result = await offlineSync.syncQueue(responseAPI.submit);
        if (result.synced > 0) {
          alert(`Success: ${result.synced} offline surveys have been synced to the server.`);
        }
      }
    };

    window.addEventListener('online', runSync);
    runSync(); // Check on load/mount

    // Periodic check every 5 minutes in case 'online' event is missed
    const interval = setInterval(runSync, 5 * 60 * 1000);

    return () => {
      window.removeEventListener('online', runSync);
      clearInterval(interval);
    };
  }, []);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <div className="app">
      <Router>
        <Routes>
          <Route path="/login" element={
            isAuthenticated ? (
              user.role === 'admin' ? <Navigate to="/dashboard" /> : <Navigate to="/take-survey/1" />
            ) : <Login />
          } />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/surveys"
            element={
              <AdminRoute>
                <SurveyView />
              </AdminRoute>
            }
          />
          <Route
            path="/surveys/:surveyId"
            element={
              <AdminRoute>
                <SurveyView />
              </AdminRoute>
            }
          />
          <Route
            path="/survey/:surveyId"
            element={
              <AdminRoute>
                <SurveyView />
              </AdminRoute>
            }
          />
          <Route
            path="/take-survey/:surveyId"
            element={
              <PrivateRoute>
                <TakeSurvey />
              </PrivateRoute>
            }
          />
          <Route
            path="/analytics/:surveyId"
            element={
              <AdminRoute>
                <SurveyAnalytics />
              </AdminRoute>
            }
          />
          <Route
            path="/data"
            element={
              <AdminRoute>
                <SurveyData />
              </AdminRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/users"
            element={
              <AdminRoute>
                <UsersPage />
              </AdminRoute>
            }
          />
          <Route path="/" element={
            isAuthenticated ? (
              user.role === 'admin' ? <Navigate to="/dashboard" /> : <Navigate to="/take-survey/1" />
            ) : <Navigate to="/login" />
          } />
          <Route path="*" element={
            isAuthenticated ? (
              user.role === 'admin' ? <Navigate to="/dashboard" /> : <Navigate to="/take-survey/1" />
            ) : <Navigate to="/login" />
          } />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
