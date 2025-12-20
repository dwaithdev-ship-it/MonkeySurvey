import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TakeSurvey from './pages/TakeSurvey';
import SurveyView from './pages/SurveyView';
import SurveyAnalytics from './pages/SurveyAnalytics';
import './App.css';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

function App() {
  return (
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
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;
