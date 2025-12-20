import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { surveyAPI } from '../services/api';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [surveyForm, setSurveyForm] = useState({
    title: '',
    description: '',
    category: 'customer_feedback',
    questions: []
  });
  const [questionForm, setQuestionForm] = useState({
    type: 'text',
    question: '',
    required: true,
    options: ''
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      const response = await surveyAPI.getAll();
      if (response.success) {
        setSurveys(response.data.surveys || []);
      }
    } catch (err) {
      console.error('Failed to fetch surveys:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const addQuestion = () => {
    if (questionForm.question.trim()) {
      const newQuestion = {
        type: questionForm.type,
        question: questionForm.question,
        required: questionForm.required,
        id: Date.now()
      };

      // Format options for multiple_choice, checkbox, dropdown
      if (['multiple_choice', 'checkbox', 'dropdown'].includes(questionForm.type) && questionForm.options) {
        const optionsArray = questionForm.options.split(',').map((opt, idx) => ({
          value: opt.trim().toLowerCase().replace(/\s+/g, '_'),
          label: opt.trim(),
          order: idx + 1
        }));
        newQuestion.options = optionsArray;
      }

      setSurveyForm({
        ...surveyForm,
        questions: [...surveyForm.questions, newQuestion]
      });
      setQuestionForm({ type: 'text', question: '', required: true, options: '' });
    }
  };

  const removeQuestion = (id) => {
    setSurveyForm({
      ...surveyForm,
      questions: surveyForm.questions.filter(q => q.id !== id)
    });
  };

  const handleCreateSurvey = async (e) => {
    e.preventDefault();
    
    // Format questions by removing temporary id field
    const formattedQuestions = surveyForm.questions.map(q => {
      const { id, ...questionData } = q;
      return questionData;
    });

    const surveyData = {
      ...surveyForm,
      questions: formattedQuestions
    };
    
    console.log('Creating survey with data:', surveyData);
    
    try {
      const response = await surveyAPI.create(surveyData);
      console.log('Survey creation response:', response);
      
      if (response.success) {
        setShowCreateModal(false);
        setSurveyForm({ title: '', description: '', category: 'customer_feedback', questions: [] });
        fetchSurveys();
        alert('Survey created successfully!');
      }
    } catch (err) {
      console.error('Survey creation error:', err);
      alert(err.error?.message || err.message || 'Failed to create survey');
    }
  };

  const handlePublishSurvey = async (surveyId) => {
    if (confirm('Are you sure you want to publish this survey?')) {
      try {
        console.log('Publishing survey:', surveyId);
        const response = await surveyAPI.publish(surveyId);
        console.log('Publish response:', response);
        fetchSurveys();
        alert('Survey published successfully!');
      } catch (err) {
        console.error('Publish error:', err);
        alert(err.error?.message || err.message || 'Failed to publish survey');
      }
    }
  };

  const handleDeleteSurvey = async (surveyId) => {
    if (confirm('Are you sure you want to delete this survey?')) {
      try {
        await surveyAPI.delete(surveyId);
        fetchSurveys();
        alert('Survey deleted successfully!');
      } catch (err) {
        alert('Failed to delete survey');
      }
    }
  };

  const viewSurvey = (surveyId) => {
    navigate(`/survey/${surveyId}`);
  };

  const takeSurvey = (surveyId) => {
    navigate(`/take-survey/${surveyId}`);
  };

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="nav-brand">
          <h2>MonkeySurvey</h2>
        </div>
        <div className="nav-actions">
          <span className="user-name">Welcome, {user?.firstName || user?.email}</span>
          <button onClick={handleLogout} className="btn-secondary">Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>My Surveys</h1>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            + Create New Survey
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading surveys...</div>
        ) : surveys.length === 0 ? (
          <div className="empty-state">
            <h3>No surveys yet</h3>
            <p>Create your first survey to get started!</p>
          </div>
        ) : (
          <div className="surveys-grid">
            {surveys.map((survey) => (
              <div key={survey._id} className="survey-card">
                <div className="survey-header">
                  <h3>{survey.title}</h3>
                  <span className={`status-badge status-${survey.status}`}>
                    {survey.status}
                  </span>
                </div>
                <div className="survey-stats">
                  <div className="stat">
                    <span className="stat-label">Responses</span>
                    <span className="stat-value">{survey.responseCount || 0}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Completion Rate</span>
                    <span className="stat-value">
                      {Math.round((survey.completionRate || 0) * 100)}%
                    </span>
                  </div>
                </div>
                <div className="survey-actions">
                  <button onClick={() => viewSurvey(survey._id)} className="btn-small">View</button>
                  <button onClick={() => navigate(`/analytics/${survey._id}`)} className="btn-small" style={{background: '#28a745'}}>
                    Analytics
                  </button>
                  {survey.status === 'draft' && (
                    <button onClick={() => handlePublishSurvey(survey._id)} className="btn-small btn-success">
                      Publish
                    </button>
                  )}
                  {survey.status === 'active' && (
                    <button onClick={() => takeSurvey(survey._id)} className="btn-small btn-info">
                      Take Survey
                    </button>
                  )}
                  <button onClick={() => handleDeleteSurvey(survey._id)} className="btn-small btn-danger">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Survey</h2>
              <button onClick={() => setShowCreateModal(false)} className="close-btn">&times;</button>
            </div>
            
            <form onSubmit={handleCreateSurvey} className="modal-content">
              <div className="form-group">
                <label>Survey Title *</label>
                <input
                  type="text"
                  value={surveyForm.title}
                  onChange={(e) => setSurveyForm({ ...surveyForm, title: e.target.value })}
                  required
                  placeholder="Enter survey title"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={surveyForm.description}
                  onChange={(e) => setSurveyForm({ ...surveyForm, description: e.target.value })}
                  placeholder="Enter survey description"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  value={surveyForm.category}
                  onChange={(e) => setSurveyForm({ ...surveyForm, category: e.target.value })}
                >
                  <option value="customer_feedback">Customer Feedback</option>
                  <option value="employee_engagement">Employee Engagement</option>
                  <option value="market_research">Market Research</option>
                  <option value="event_feedback">Event Feedback</option>
                  <option value="product_feedback">Product Feedback</option>
                </select>
              </div>

              <div className="questions-section">
                <h3>Questions</h3>
                
                <div className="add-question-form">
                  <select
                    value={questionForm.type}
                    onChange={(e) => setQuestionForm({ ...questionForm, type: e.target.value })}
                    className="question-type-select"
                  >
                    <option value="text">Short Text</option>
                    <option value="textarea">Long Text</option>
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="checkbox">Checkbox</option>
                    <option value="rating">Rating</option>
                    <option value="scale">Scale</option>
                    <option value="date">Date</option>
                  </select>
                  
                  <input
                    type="text"
                    value={questionForm.question}
                    onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                    placeholder="Enter question text"
                    className="question-input"
                  />

                  {['multiple_choice', 'checkbox', 'dropdown'].includes(questionForm.type) && (
                    <div>
                      <input
                        type="text"
                        value={questionForm.options}
                        onChange={(e) => setQuestionForm({ ...questionForm, options: e.target.value })}
                        placeholder="YouTube, Facebook, Instagram, WhatsApp, Others"
                        className="question-input"
                      />
                      <small style={{color: '#666', fontSize: '12px'}}>
                        Separate each option with a comma (e.g., Option 1, Option 2, Option 3)
                      </small>
                    </div>
                  )}
                  
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={questionForm.required}
                      onChange={(e) => setQuestionForm({ ...questionForm, required: e.target.checked })}
                    />
                    Required
                  </label>
                  
                  <button type="button" onClick={addQuestion} className="btn-small">Add</button>
                </div>

                {surveyForm.questions.length > 0 && (
                  <div className="questions-list">
                    {surveyForm.questions.map((q, index) => (
                      <div key={q.id} className="question-item">
                        <div className="question-details">
                          <span className="question-number">Q{index + 1}</span>
                          <span className="question-type-badge">{q.type}</span>
                          <span className="question-text">{q.question}</span>
                          {q.required && <span className="required-badge">Required</span>}
                        </div>
                        {q.options && q.options.length > 0 && (
                          <div className="question-options-preview">
                            <small>Options: {q.options.map(opt => opt.label).join(', ')}</small>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeQuestion(q.id)}
                          className="btn-small btn-danger"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={!surveyForm.title || surveyForm.questions.length === 0}
                >
                  Create Survey
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
