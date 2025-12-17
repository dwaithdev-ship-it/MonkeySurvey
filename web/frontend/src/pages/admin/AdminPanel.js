import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { surveys as surveysAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

function AdminPanel() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAdmin } = useAuth();

  useEffect(() => {
    if (isAdmin) {
      loadSurveys();
    }
  }, [isAdmin]);

  const loadSurveys = async () => {
    try {
      const response = await surveysAPI.list();
      setSurveys(response.data.data.surveys);
    } catch (err) {
      setError('Failed to load surveys');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this survey?')) return;

    try {
      await surveysAPI.delete(id);
      setSurveys(surveys.filter(s => s._id !== id));
    } catch (err) {
      alert('Failed to delete survey');
    }
  };

  const handlePublish = async (id) => {
    try {
      await surveysAPI.publish(id);
      loadSurveys();
    } catch (err) {
      alert('Failed to publish survey');
    }
  };

  if (!isAdmin) {
    return (
      <div className="container">
        <div className="error">Access denied. Admin privileges required.</div>
      </div>
    );
  }

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>Admin Panel</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to="/admin/survey/new" className="btn btn-primary">Create Survey</Link>
          <Link to="/dashboard" className="btn btn-secondary">Dashboard</Link>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="card">
        <h2 style={{ marginBottom: '16px' }}>Surveys</h2>
        
        {surveys.length === 0 ? (
          <p style={{ color: '#6b7280' }}>No surveys yet. Create your first survey!</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>Title</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px' }}>Responses</th>
                <th style={{ padding: '12px' }}>Created</th>
                <th style={{ padding: '12px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {surveys.map((survey) => (
                <tr key={survey._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px' }}>{survey.title}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      backgroundColor: survey.status === 'active' ? '#d1fae5' : '#e5e7eb',
                      color: survey.status === 'active' ? '#065f46' : '#374151'
                    }}>
                      {survey.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>{survey.responseCount || 0}</td>
                  <td style={{ padding: '12px' }}>
                    {new Date(survey.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Link
                        to={`/admin/survey/${survey._id}/edit`}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        Edit
                      </Link>
                      {survey.status === 'draft' && (
                        <button
                          onClick={() => handlePublish(survey._id)}
                          className="btn btn-primary"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          Publish
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(survey._id)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: '#fee2e2', color: '#991b1b' }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
