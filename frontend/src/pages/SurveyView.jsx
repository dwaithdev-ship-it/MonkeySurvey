import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { surveyAPI } from '../services/api';
import './Dashboard.css';

export default function SurveyView() {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSurvey();
  }, [surveyId]);

  const fetchSurvey = async () => {
    try {
      const response = await surveyAPI.getById(surveyId);
      if (response.success) {
        setSurvey(response.data);
      }
    } catch (err) {
      setError('Failed to load survey');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="dashboard">
        <nav className="navbar">
          <div className="nav-brand">
            <h2>MonkeySurvey</h2>
          </div>
        </nav>
        <div className="dashboard-content">
          <div className="loading">Loading survey...</div>
        </div>
      </div>
    );
  }

  if (error || !survey) {
    return (
      <div className="dashboard">
        <nav className="navbar">
          <div className="nav-brand">
            <h2>MonkeySurvey</h2>
          </div>
        </nav>
        <div className="dashboard-content">
          <div className="error-state">
            <h3>Error</h3>
            <p>{error || 'Survey not found'}</p>
            <button onClick={() => navigate('/dashboard')} className="btn-primary">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="nav-brand">
          <h2>MonkeySurvey</h2>
        </div>
        <div className="nav-actions">
          <button onClick={() => navigate('/dashboard')} className="btn-secondary">
            Back to Dashboard
          </button>
          <button onClick={handleLogout} className="btn-secondary">Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="survey-view-container">
          <div className="survey-header-with-meta">
            <h1 className="survey-title-left">{survey.title}</h1>
            <div className="survey-meta-inline">
              <div className="meta-item">
                <strong>Category:</strong> {survey.category || 'N/A'}
              </div>
              <div className="meta-item">
                <strong>Total Questions:</strong> {survey.questions?.length || 0}
              </div>
              <div className="meta-item">
                <strong>Responses:</strong> {survey.responseCount || 0}
              </div>
              <div className="meta-item">
                <strong>Completion Rate:</strong> {Math.round((survey.completionRate || 0) * 100)}%
              </div>
              <div className="meta-item">
                <strong>Created:</strong> {new Date(survey.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          {survey.description && (
            <div className="survey-description-section">
              <p>{survey.description}</p>
            </div>
          )}

          <div className="survey-questions-section">
            <h2>Questions</h2>
            {survey.questions && survey.questions.length > 0 ? (
              <div className="questions-preview">
                {/* First 5 fields inline without question numbers */}
                <div className="question-preview-item inline-fields-container">
                  <div className="inline-fields-display">
                    {survey.questions.slice(0, 5).map((question, index) => (
                      <div key={question._id} className="inline-field-item">
                        <p className="question-text">
                          {question.question.replace(':', '')}
                          {question.required && <span style={{color: '#ff0000', marginLeft: '4px', fontWeight: 'bold'}}>*</span>}
                        </p>
                        <div style={{marginTop: '8px', padding: '8px', border: '2px solid #e0e0e0', borderRadius: '4px', background: '#f9f9f9', fontSize: '0.85rem', color: '#999'}}>
                          Text input (max {question.maxLength || 'unlimited'} characters)
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Remaining questions with question numbers starting from 1 */}
                {survey.questions.slice(5).map((question, index) => (
                  <div key={question._id} className="question-preview-item">
                    <div className="question-preview-header">
                      <span className="question-number">Question {index + 1}</span>
                      <span className="question-type-badge">{question.type}</span>
                      {question.required && <span className="required-badge">Required</span>}
                    </div>
                    <p className="question-text">{question.question}</p>
                    {question.description && (
                      <p className="question-description">{question.description}</p>
                    )}
                    {question.options && question.options.length > 0 && (
                      <div className="question-options">
                        <strong>Options:</strong>
                        <ul>
                          {question.options.map((option, idx) => (
                            <li key={option._id || idx}>{option.label}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p>No questions added yet.</p>
            )}
          </div>

          <div className="survey-actions-section">
            {survey.status === 'active' && (
              <button
                onClick={() => navigate(`/take-survey/${surveyId}`)}
                className="btn-primary"
              >
                Take Survey
              </button>
            )}
            <button onClick={() => navigate('/dashboard')} className="btn-secondary">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
