import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  return (
    <div className="app">
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
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
              <PrivateRoute>
                <SurveyView />
              </PrivateRoute>
            }
          />
          <Route
            path="/surveys/:surveyId"
            element={
              <PrivateRoute>
                <SurveyView />
              </PrivateRoute>
            }
          />
          <Route
            path="/survey/:surveyId"
            element={
              <PrivateRoute>
                <SurveyView />
              </PrivateRoute>
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
              <PrivateRoute>
                <SurveyAnalytics />
              </PrivateRoute>
            }
          />
          <Route
            path="/data"
            element={
              <PrivateRoute>
                <SurveyData />
              </PrivateRoute>
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
              <PrivateRoute>
                <UsersPage />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
