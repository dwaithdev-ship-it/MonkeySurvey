import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { surveyAPI, responseAPI } from '../services/api';
import './Dashboard.css';

export default function SurveyAnalytics() {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [surveyId]);

  const fetchData = async () => {
    try {
      console.log('Fetching analytics for survey:', surveyId);
      
      const [surveyRes, responsesRes] = await Promise.all([
        surveyAPI.getById(surveyId),
        responseAPI.getAll({ surveyId })
      ]);

      console.log('Survey response:', surveyRes);
      console.log('Responses response:', responsesRes);

      if (surveyRes.success) {
        setSurvey(surveyRes.data);
      }
      
      if (responsesRes.success) {
        console.log('Setting responses:', responsesRes.data.responses);
        setResponses(responsesRes.data.responses || []);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err.error?.message || err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const calculateQuestionStats = (question) => {
    const questionId = question._id;
    const stats = {};
    let totalAnswers = 0;

    responses.forEach(response => {
      const answer = response.answers?.find(a => a.questionId === questionId);
      if (answer && answer.value) {
        if (Array.isArray(answer.value)) {
          // Checkbox - multiple values
          answer.value.forEach(val => {
            stats[val] = (stats[val] || 0) + 1;
            totalAnswers++;
          });
        } else {
          stats[answer.value] = (stats[answer.value] || 0) + 1;
          totalAnswers++;
        }
      }
    });

    return { stats, totalAnswers };
  };

  const renderQuestionAnalytics = (question, index) => {
    const { stats, totalAnswers } = calculateQuestionStats(question);

    if (['multiple_choice', 'checkbox', 'dropdown'].includes(question.type)) {
      return (
        <div key={question._id} className="analytics-question">
          <div className="analytics-question-header">
            <h3>Q{index + 1}: {question.question}</h3>
            <span className="response-count">{totalAnswers} responses</span>
          </div>
          
          <div className="analytics-chart">
            {question.options?.map(option => {
              const count = stats[option.value] || 0;
              const percentage = totalAnswers > 0 ? (count / totalAnswers * 100).toFixed(1) : 0;
              
              return (
                <div key={option._id} className="chart-bar-container">
                  <div className="chart-label">
                    <span>{option.label}</span>
                    <span className="chart-value">{count} ({percentage}%)</span>
                  </div>
                  <div className="chart-bar-wrapper">
                    <div 
                      className="chart-bar" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    } else if (['text', 'textarea'].includes(question.type)) {
      const textAnswers = responses
        .map(r => r.answers?.find(a => a.questionId === question._id))
        .filter(a => a && a.value);

      return (
        <div key={question._id} className="analytics-question">
          <div className="analytics-question-header">
            <h3>Q{index + 1}: {question.question}</h3>
            <span className="response-count">{textAnswers.length} responses</span>
          </div>
          
          <div className="text-responses">
            {textAnswers.length > 0 ? (
              textAnswers.map((answer, idx) => (
                <div key={idx} className="text-response-item">
                  <p>"{answer.value}"</p>
                </div>
              ))
            ) : (
              <p className="no-responses">No responses yet</p>
            )}
          </div>
        </div>
      );
    } else if (question.type === 'rating') {
      const ratings = Object.keys(stats).map(Number).sort((a, b) => a - b);
      const avgRating = ratings.length > 0 
        ? (ratings.reduce((sum, rating) => sum + (rating * stats[rating]), 0) / totalAnswers).toFixed(1)
        : 0;

      return (
        <div key={question._id} className="analytics-question">
          <div className="analytics-question-header">
            <h3>Q{index + 1}: {question.question}</h3>
            <span className="response-count">{totalAnswers} responses</span>
          </div>
          
          <div className="rating-summary">
            <div className="avg-rating">
              <span className="rating-value">{avgRating}</span>
              <span className="rating-label">Average Rating</span>
            </div>
            
            <div className="rating-distribution">
              {[1, 2, 3, 4, 5].map(star => (
                <div key={star} className="rating-bar-container">
                  <span>{star} ⭐</span>
                  <div className="chart-bar-wrapper">
                    <div 
                      className="chart-bar" 
                      style={{ 
                        width: `${totalAnswers > 0 ? ((stats[star] || 0) / totalAnswers * 100) : 0}%` 
                      }}
                    />
                  </div>
                  <span>{stats[star] || 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return null;
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
          <div className="loading">Loading analytics...</div>
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
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="analytics-container">
          <div className="analytics-header">
            <div>
              <h1>{survey.title} - Analytics</h1>
              {survey.description && <p className="survey-description">{survey.description}</p>}
            </div>
          </div>

          <div className="analytics-summary">
            <div className="summary-card">
              <div className="summary-value">{responses.length}</div>
              <div className="summary-label">Total Responses</div>
            </div>
            <div className="summary-card">
              <div className="summary-value">{survey.questions?.length || 0}</div>
              <div className="summary-label">Total Questions</div>
            </div>
            <div className="summary-card">
              <div className="summary-value">
                {survey.completionRate ? `${Math.round(survey.completionRate * 100)}%` : '0%'}
              </div>
              <div className="summary-label">Completion Rate</div>
            </div>
            <div className="summary-card">
              <div className="summary-value">{survey.status.toUpperCase()}</div>
              <div className="summary-label">Status</div>
            </div>
          </div>

          <div className="analytics-questions">
            <h2>Question Results</h2>
            {survey.questions && survey.questions.length > 0 ? (
              survey.questions.map((question, index) => 
                renderQuestionAnalytics(question, index)
              )
            ) : (
              <p>No questions in this survey</p>
            )}
          </div>

          <div className="individual-responses">
            <h2>Individual Responses ({responses.length})</h2>
            {responses.length > 0 ? (
              <div className="responses-table">
                {responses.map((response, idx) => (
                  <div key={response._id} className="response-card">
                    <div className="response-header">
                      <strong>Response #{idx + 1}</strong>
                      <span className="response-date">
                        {new Date(response.submittedAt || response.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="response-answers">
                      {response.answers?.map((answer, qIdx) => {
                        const question = survey.questions.find(q => q._id === answer.questionId);
                        if (!question) return null;
                        
                        return (
                          <div key={qIdx} className="response-answer">
                            <div className="answer-question">{question.question}</div>
                            <div className="answer-value">
                              {Array.isArray(answer.value) 
                                ? answer.value.join(', ') 
                                : answer.value}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-responses">No responses yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
