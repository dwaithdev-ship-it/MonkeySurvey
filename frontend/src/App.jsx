import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { responseAPI } from './services/api';
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
    const syncOfflineResponses = async () => {
      if (navigator.onLine) {
        const offlineResponses = JSON.parse(localStorage.getItem('offline_responses') || '[]');
        if (offlineResponses.length > 0) {
          console.log('Found offline responses, syncing...');
          const remaining = [];
          for (const item of offlineResponses) {
            try {
              const res = await responseAPI.submit(item.payload);
              if (res.success) {
                console.log(`Synced response ${item.id}`);
              } else {
                remaining.push(item);
              }
            } catch (err) {
              console.error(`Failed to sync response ${item.id}`, err);
              remaining.push(item);
            }
          }

          // Update storage with remaining items (failed ones)
          if (remaining.length !== offlineResponses.length) {
            if (remaining.length === 0) {
              localStorage.removeItem('offline_responses');
              alert('Offline responses have been successfully synced to the server.');
            } else {
              localStorage.setItem('offline_responses', JSON.stringify(remaining));
            }
          } else if (remaining.length === 0 && offlineResponses.length > 0) {
            // Handle case where loop finished and all succeeded but logic skipped 'if' above? 
            // actually the logic covers it. if remaining.length (0) != offlineResponses.length (N) -> remove all.
            localStorage.removeItem('offline_responses');
            alert('Offline responses have been successfully synced to the server.');
          }
        }
      }
    };

    window.addEventListener('online', syncOfflineResponses);
    syncOfflineResponses(); // Check on load/mount

    return () => window.removeEventListener('online', syncOfflineResponses);
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
              <AdminRoute>
                <Dashboard />
              </AdminRoute>
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
