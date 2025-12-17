
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SurveyList from './pages/SurveyList';
import TakeSurvey from './pages/TakeSurvey';
import AdminPanel from './pages/admin/AdminPanel';
import SurveyBuilder from './pages/admin/SurveyBuilder';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/surveys" element={<SurveyList />} />
            <Route path="/survey/:id" element={<TakeSurvey />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/admin/survey/new" element={<SurveyBuilder />} />
            <Route path="/admin/survey/:id/edit" element={<SurveyBuilder />} />
            <Route path="/" element={<Navigate to="/surveys" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
