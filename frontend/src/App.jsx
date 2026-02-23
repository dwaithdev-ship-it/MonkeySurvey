import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { responseAPI, surveyAPI } from './services/api';
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

const getMostRecentSurveyId = () => {
  const localSurveys = JSON.parse(localStorage.getItem('local_surveys') || '[]');
  // Prefer a published survey from cache, then any survey
  const published = localSurveys.find(s => s.status === 'Published' || s.status === 'active');
  const target = published || localSurveys[0];
  if (target) return target._id || target.id || '6997e719071aea1670643e21';
  return '6997e719071aea1670643e21';
};

// Redirect component that fetches the latest published survey and navigates there
function PublishedSurveyRedirect() {
  const [ready, setReady] = useState(false);
  const [surveyId, setSurveyId] = useState(getMostRecentSurveyId());

  useEffect(() => {
    (async () => {
      try {
        const res = await surveyAPI.getAll();
        if (res.success && res.data?.surveys?.length > 0) {
          // Backend already returns only active/published for non-admin users
          const first = res.data.surveys[0];
          const id = first._id || first.id;
          // Update localStorage so other components stay in sync
          const cached = JSON.parse(localStorage.getItem('local_surveys') || '[]');
          if (!cached.find(s => (s._id || s.id) === id)) {
            localStorage.setItem('local_surveys', JSON.stringify([first, ...cached]));
          }
          setSurveyId(id);
        }
      } catch (e) {
        console.warn('Could not fetch published survey, using cached ID', e);
      }
      setReady(true);
    })();
  }, []);

  if (!ready) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#666' }}>Loading survey...</div>;
  return <Navigate to={`/take-survey/${surveyId}`} replace />;
}

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  const location = useLocation();
  return token ? children : <Navigate to="/login" state={{ from: location }} />;
}

function AdminRoute({ children }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const location = useLocation();

  if (!token) return <Navigate to="/login" state={{ from: location }} />;
  if (user.role !== 'admin') return <Navigate to="/survey-redirect" />;

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
              user.role === 'admin' ? <Navigate to="/dashboard" /> : <Navigate to="/survey-redirect" />
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
          <Route path="/users"
            element={
              <AdminRoute>
                <UsersPage />
              </AdminRoute>
            }
          />
          {/* Published Survey Redirect for non-admin users */}
          <Route
            path="/survey-redirect"
            element={
              <PrivateRoute>
                <PublishedSurveyRedirect />
              </PrivateRoute>
            }
          />
          <Route path="/" element={
            isAuthenticated ? (
              user.role === 'admin' ? <Navigate to="/dashboard" /> : <Navigate to="/survey-redirect" />
            ) : <Navigate to="/login" />
          } />
          <Route path="*" element={
            isAuthenticated ? (
              user.role === 'admin' ? <Navigate to="/dashboard" /> : <Navigate to="/survey-redirect" />
            ) : <Navigate to="/login" />
          } />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
