import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Dashboard() {
  const { user, isAdmin, logout } = useAuth();

  return (
    <div className="container">
      <div className="card">
        <h1>Welcome, {user?.firstName || 'User'}!</h1>
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>
          Role: {user?.role || 'N/A'}
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link to="/surveys" className="btn btn-primary">View Surveys</Link>
          {isAdmin && (
            <Link to="/admin" className="btn btn-primary">Admin Panel</Link>
          )}
          <button onClick={logout} className="btn btn-secondary">Logout</button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
