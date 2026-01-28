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
        initializeAnswers(response.data);
      } else {
        throw new Error('Survey not found');
      }
    } catch (err) {
      console.warn('API fetch failed, checking localStorage:', err);
      // Fallback to localStorage for prototype
      const localSurveys = JSON.parse(localStorage.getItem('local_surveys') || '[]');
      const found = localSurveys.find(s => s.id.toString() === surveyId.toString());

      if (found) {
        // Adapt mock structure to what TakeSurvey expects
        const adaptedSurvey = {
          title: found.name,
          description: found.description || 'Welcome to this survey.',
          questions: (found.questions || []).map(q => ({
            _id: q.id,
            question: q.displayTitle || q.type,
            type: mapType(q.type),
            required: q.required,
            mediaUrl: q.mediaUrl,
            mediaType: q.mediaType,
            optionMedia: q.optionMedia || {},
            options: q.options ? q.options.split('\n').map(o => ({ label: o, value: o })) : []
          }))
        };
        setSurvey(adaptedSurvey);
        initializeAnswers(adaptedSurvey);
      } else {
        setError(err.error?.message || err.message || 'Survey not found');
      }
    } finally {
      setLoading(false);
    }
  };

  const mapType = (type) => {
    const t = type.toLowerCase();
    if (t.includes('radio')) return 'multiple_choice';
    if (t.includes('checkbox')) return 'checkbox';
    if (t.includes('rating') || t.includes('net promoter score')) return 'rating';
    if (t.includes('date')) return 'date';
    if (t.includes('multiline') || t.includes('text block')) return 'textarea';
    if (t.includes('drop down') || t.includes('dropdown')) return 'dropdown';
    return 'text'; // Default
  };

  const initializeAnswers = (surveyData) => {
    const initialAnswers = {};
    (surveyData.questions || []).forEach(q => {
      initialAnswers[q._id || q.id] = '';
    });

    // Load saved progress if available
    const savedProgress = localStorage.getItem(`survey_progress_${surveyId}`);
    if (savedProgress) {
      try {
        const parsedProgress = JSON.parse(savedProgress);
        setAnswers({ ...initialAnswers, ...parsedProgress });
        return;
      } catch (err) {
        console.warn('Failed to load saved progress:', err);
      }
    }

    setAnswers(initialAnswers);
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
        // Clear saved progress after successful submission
        localStorage.removeItem(`survey_progress_${surveyId}`);
        alert('Thank you for completing the survey!');
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.error?.message || 'Failed to submit survey');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSave = () => {
    // Save current progress to localStorage
    localStorage.setItem(`survey_progress_${surveyId}`, JSON.stringify(answers));
    alert('Your progress has been saved!');
  };


  const renderQuestionMedia = (question) => {
    if (!question.mediaUrl) return null;

    const type = question.mediaType;
    if (type === 'Image') {
      return <img src={question.mediaUrl} alt="Question Media" className="question-media-img" />;
    } else if (type === 'Audio') {
      return <audio controls src={question.mediaUrl} className="question-media-audio" />;
    } else if (type === 'Video') {
      return <video controls src={question.mediaUrl} className="question-media-video" />;
    }
    return null;
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

      case 'radio':
        return (
          <div className="options-container">
            {(question.options || []).map((opt, idx) => (
              <label key={idx} className="option-label">
                <input
                  type="radio"
                  name={`question-${questionId}`}
                  value={opt.value}
                  checked={answers[questionId] === opt.value}
                  onChange={(e) => handleAnswerChange(questionId, e.target.value)}
                  required={question.required}
                />
                <div className="option-content">
                  {question.optionMedia?.[opt.label] && (
                    <img src={question.optionMedia[opt.label]} alt={opt.label} className="option-media-img" />
                  )}
                  <span>{opt.label}</span>
                </div>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="options-container">
            {(question.options || []).map((opt, idx) => (
              <label key={idx} className="option-label">
                <input
                  type="checkbox"
                  value={opt.value}
                  checked={(answers[questionId] || []).includes(opt.value)}
                  onChange={(e) => {
                    const currentAnswers = answers[questionId] || [];
                    const newAnswers = e.target.checked
                      ? [...currentAnswers, opt.value]
                      : currentAnswers.filter(a => a !== opt.value);
                    handleAnswerChange(questionId, newAnswers);
                  }}
                />
                <div className="option-content">
                  {question.optionMedia?.[opt.label] && (
                    <img src={question.optionMedia[opt.label]} alt={opt.label} className="option-media-img" />
                  )}
                  <span>{opt.label}</span>
                </div>
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
        {/* Header Block: First 3 questions in a row */}
        {survey?.questions?.length > 0 && (
          <div className="question-block header-group-block">
            <div className="inline-fields-row">
              {survey.questions.slice(0, 3).map((question, index) => {
                const questionId = question.id || question._id;
                return (
                  <div key={questionId} className="inline-field">
                    <div className="question-header compact">
                      <span className="question-number">Question {index + 1}</span>
                      {question.required && <span className="required-indicator">*</span>}
                    </div>
                    <label className="field-label-compact">{question.question}</label>
                    <div className="inline-render-box">
                      {renderQuestion(question, index)}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Progress Bar */}
            {survey?.questions?.length > 3 && (
              <div className="progress-bar-container">
                <div className="progress-bar-track">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${Math.round(
                        (Object.values(answers).filter(val =>
                          Array.isArray(val) ? val.length > 0 : (val !== '' && val !== null && val !== undefined)
                        ).length / (survey.questions.length || 1)) * 100
                      )}%`
                    }}
                  ></div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  {Math.round(
                    (Object.values(answers).filter(val =>
                      Array.isArray(val) ? val.length > 0 : (val !== '' && val !== null && val !== undefined)
                    ).length / (survey.questions.length || 1)) * 100
                  )}% Completed
                </div>
              </div>
            )}
          </div>
        )}

        {/* Individual Blocks: 4th question onwards */}
        {survey?.questions?.slice(3).map((question, index) => (
          <div key={question.id || question._id} className="question-block full-width-block">
            <div className="question-header">
              <span className="question-number">Question {index + 4}</span>
              {question.required && <span className="required-indicator">*</span>}
            </div>
            {renderQuestionMedia(question)}
            <h3 className="question-text">{question.question}</h3>
            <div className="question-answer">
              {renderQuestion(question, index + 3)}
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
            type="button"
            onClick={handleSave}
            className="btn-save"
          >
            Save Progress
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
