import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { surveyAPI, responseAPI } from '../services/api';
import './TakeSurvey.css';

export default function TakeSurvey() {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSurvey();
  }, [surveyId]);

  const fetchSurvey = async () => {
    try {
      console.log('Fetching survey:', surveyId);
      const response = await surveyAPI.getById(surveyId);
      console.log('Survey response:', response);
      if (response.success) {
        setSurvey(response.data);
        // Initialize answers object
        const initialAnswers = {};
        response.data.questions?.forEach(q => {
          initialAnswers[q._id] = '';
        });
        setAnswers(initialAnswers);
      } else {
        setError('Survey not found');
      }
    } catch (err) {
      console.error('Failed to load survey:', err);
      setError(err.error?.message || err.message || 'Failed to load survey');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    console.log('Answer change:', questionId, value);
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Convert answers object to array format
      const answersArray = Object.entries(answers).map(([questionId, value]) => ({
        questionId,
        value
      }));

      const response = await responseAPI.submit({
        surveyId,
        answers: answersArray
      });

      if (response.success) {
        alert('Thank you for completing the survey!');
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.error?.message || 'Failed to submit survey');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question, index) => {
    const questionId = question.id || question._id;
    
    switch (question.type) {
      case 'text':
        return (
          <input
            type="text"
            value={answers[questionId] || ''}
            onChange={(e) => handleAnswerChange(questionId, e.target.value)}
            required={question.required}
            placeholder="Enter your answer"
            className="answer-input"
          />
        );
      
      case 'textarea':
        return (
          <textarea
            value={answers[questionId] || ''}
            onChange={(e) => handleAnswerChange(questionId, e.target.value)}
            required={question.required}
            placeholder="Enter your answer"
            rows="4"
            className="answer-textarea"
          />
        );
      
      case 'multiple_choice':
        return (
          <div className="options-list">
            {(question.options || []).map((option, i) => (
              <label key={option._id || i} className="option-label">
                <input
                  type="radio"
                  name={questionId}
                  value={option.value}
                  checked={answers[questionId] === option.value}
                  onChange={(e) => handleAnswerChange(questionId, e.target.value)}
                  required={question.required}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        );
      
      case 'checkbox':
        return (
          <div className="options-list">
            {(question.options || []).map((option, i) => (
              <label key={option._id || i} className="option-label">
                <input
                  type="checkbox"
                  value={option.value}
                  checked={(answers[questionId] || []).includes(option.value)}
                  onChange={(e) => {
                    const current = answers[questionId] || [];
                    const updated = e.target.checked
                      ? [...current, option.value]
                      : current.filter(v => v !== option.value);
                    handleAnswerChange(questionId, updated);
                  }}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        );
      
      case 'rating':
        return (
          <div className="rating-scale">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                className={`rating-button ${answers[questionId] === value ? 'active' : ''}`}
                onClick={() => handleAnswerChange(questionId, value)}
              >
                {value}
              </button>
            ))}
          </div>
        );
      
      case 'scale':
        return (
          <div className="scale-container">
            <input
              type="range"
              min="1"
              max="10"
              value={answers[questionId] || 5}
              onChange={(e) => handleAnswerChange(questionId, parseInt(e.target.value))}
              className="scale-slider"
            />
            <div className="scale-labels">
              <span>1</span>
              <span className="scale-value">{answers[questionId] || 5}</span>
              <span>10</span>
            </div>
          </div>
        );
      
      case 'date':
        return (
          <input
            type="date"
            value={answers[questionId] || ''}
            onChange={(e) => handleAnswerChange(questionId, e.target.value)}
            required={question.required}
            className="answer-input"
          />
        );
      
      case 'dropdown':
        return (
          <select
            value={answers[questionId] || ''}
            onChange={(e) => handleAnswerChange(questionId, e.target.value)}
            required={question.required}
            className="answer-select"
          >
            <option value="">Select an option</option>
            {(question.options || []).map((option, i) => (
              <option key={option._id || i} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      default:
        return (
          <input
            type="text"
            value={answers[questionId] || ''}
            onChange={(e) => handleAnswerChange(questionId, e.target.value)}
            required={question.required}
            placeholder="Enter your answer"
            className="answer-input"
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="take-survey-container">
        <div className="loading">Loading survey...</div>
      </div>
    );
  }

  if (error && !survey) {
    return (
      <div className="take-survey-container">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="take-survey-container">
      <div className="survey-header-section">
        <button onClick={() => navigate('/dashboard')} className="back-button">
          ← Back
        </button>
        <h1>{survey?.title}</h1>
        {survey?.description && <p className="survey-description">{survey.description}</p>}
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="survey-form">
        {/* First 5 fields in a single row without question numbers */}
        <div className="question-block">
          <div className="inline-fields-row">
            {survey?.questions?.slice(0, 5).map((question, index) => {
              const questionId = question.id || question._id;
              return (
                <div key={questionId} className="inline-field">
                  <label className="field-label">
                    {question.question.replace(':', '')}
                    {question.required && <span className="required-indicator">*</span>}
                  </label>
                  <input
                    type="text"
                    value={answers[questionId] || ''}
                    onChange={(e) => handleAnswerChange(questionId, e.target.value)}
                    onInput={(e) => handleAnswerChange(questionId, e.target.value)}
                    required={question.required}
                    maxLength={question.maxLength || undefined}
                    placeholder="Enter text here"
                    className="answer-input"
                    autoComplete="off"
                    disabled={false}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Remaining questions with question numbers */}
        {survey?.questions?.slice(5).map((question, index) => (
          <div key={question.id || question._id} className="question-block">
            <div className="question-header">
              <span className="question-number">Question {index + 1}</span>
              {question.required && <span className="required-indicator">*</span>}
            </div>
            <h3 className="question-text">{question.question}</h3>
            <div className="question-answer">
              {renderQuestion(question, index + 5)}
            </div>
          </div>
        ))}

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary"
          >
            {submitting ? 'Submitting...' : 'Submit Survey'}
          </button>
        </div>
      </form>
    </div>
  );
}
