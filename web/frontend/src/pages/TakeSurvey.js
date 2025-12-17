
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { surveys as surveysAPI, responses as responsesAPI } from '../services/api';

function TakeSurvey() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadSurvey();
  }, [id]);

  const loadSurvey = async () => {
    try {
      const response = await surveysAPI.get(id);
      setSurvey(response.data.data);
    } catch (err) {
      setError('Failed to load survey');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const answersArray = Object.entries(answers).map(([questionId, value]) => ({
        questionId,
        value
      }));

      await responsesAPI.submit({
        surveyId: id,
        answers: answersArray
      });

      setSuccess(true);
      setTimeout(() => navigate('/surveys'), 2000);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to submit survey');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading">Loading survey...</div>;
  if (!survey) return <div className="error">Survey not found</div>;
  if (success) return (
    <div className="container">
      <div className="success" style={{ textAlign: 'center', padding: '40px' }}>
        <h2>Thank you for your response!</h2>
        <p>Redirecting...</p>
      </div>
    </div>
  );

  return (
    <div className="container">
      <div className="card">
        <h1>{survey.title}</h1>
        {survey.description && <p style={{ color: '#6b7280', marginBottom: '24px' }}>{survey.description}</p>}

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {survey.questions?.map((question, index) => (
            <div key={question._id} className="form-group" style={{ marginBottom: '32px' }}>
              <label className="form-label">
                {index + 1}. {question.question}
                {question.required && <span style={{ color: '#ef4444' }}> *</span>}
              </label>

              {question.type === 'text' && (
                <input
                  type="text"
                  className="form-input"
                  required={question.required}
                  onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                />
              )}

              {question.type === 'textarea' && (
                <textarea
                  className="form-input"
                  rows="4"
                  required={question.required}
                  onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                />
              )}

              {question.type === 'multiple_choice' && question.options && (
                <div>
                  {question.options.map((option) => (
                    <label key={option.value} style={{ display: 'block', marginBottom: '8px' }}>
                      <input
                        type="radio"
                        name={question._id}
                        value={option.value}
                        required={question.required}
                        onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                        style={{ marginRight: '8px' }}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              )}

              {question.type === 'checkbox' && question.options && (
                <div>
                  {question.options.map((option) => (
                    <label key={option.value} style={{ display: 'block', marginBottom: '8px' }}>
                      <input
                        type="checkbox"
                        value={option.value}
                        onChange={(e) => {
                          const currentAnswers = answers[question._id] || [];
                          if (e.target.checked) {
                            handleAnswerChange(question._id, [...currentAnswers, option.value]);
                          } else {
                            handleAnswerChange(question._id, currentAnswers.filter(v => v !== option.value));
                          }
                        }}
                        style={{ marginRight: '8px' }}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              )}

              {question.type === 'rating' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => handleAnswerChange(question._id, rating)}
                      style={{
                        padding: '8px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        background: answers[question._id] === rating ? '#6366f1' : 'white',
                        color: answers[question._id] === rating ? 'white' : '#374151',
                        cursor: 'pointer'
                      }}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Survey'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/surveys')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TakeSurvey;
