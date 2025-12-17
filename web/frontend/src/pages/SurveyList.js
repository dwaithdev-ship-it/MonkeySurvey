
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { surveys as surveysAPI } from '../services/api';

function SurveyList() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSurveys();
  }, []);

  const loadSurveys = async () => {
    try {
      const response = await surveysAPI.list({ status: 'active' });
      setSurveys(response.data.data.surveys);
    } catch (err) {
      setError('Failed to load surveys');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading surveys...</div>;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>Available Surveys</h1>
        <Link to="/dashboard" className="btn btn-secondary">Back to Dashboard</Link>
      </div>

      {error && <div className="error">{error}</div>}

      <div style={{ display: 'grid', gap: '16px' }}>
        {surveys.map((survey) => (
          <div key={survey._id} className="card">
            <h3>{survey.title}</h3>
            <p style={{ color: '#6b7280', margin: '12px 0' }}>{survey.description}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#9ca3af' }}>
                {survey.responseCount || 0} responses
              </span>
              <Link to={`/survey/${survey._id}`} className="btn btn-primary">
                Take Survey
              </Link>
            </div>
          </div>
        ))}

        {surveys.length === 0 && (
          <div className="card" style={{ textAlign: 'center', color: '#6b7280' }}>
            No surveys available at the moment.
          </div>
        )}
      </div>
    </div>
  );
}

export default SurveyList;
