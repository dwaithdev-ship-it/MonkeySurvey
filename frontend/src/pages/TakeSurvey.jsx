import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { surveyAPI, responseAPI, parlConsAPI } from '../services/api';
import logo from '../assets/logo.png';
import './TakeSurvey.css';

export default function TakeSurvey() {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [responseCount, setResponseCount] = useState(0);

  const [location, setLocation] = useState(null);

  useEffect(() => {
    fetchSurvey();
    captureLocation();
  }, [surveyId]);

  const captureLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      }, (error) => {
        console.warn("Geolocation permission denied or error:", error);
      });
    }
  };

  const fetchSurvey = async () => {
    try {
      console.log('Fetching survey:', surveyId);
      const response = await surveyAPI.getById(surveyId);
      console.log('Survey response:', response);
      if (response.success) {
        setSurvey(response.data);
        initializeAnswers(response.data);

        // Fetch response count for current user
        try {
          const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
          const currentUserName = storedUser.name || storedUser.firstName;
          const resData = await responseAPI.getAll({
            surveyId,
            limit: 1,
            userName: currentUserName
          });
          if (resData.success) {
            setResponseCount(resData.data.pagination.total || 0);
          }
        } catch (cErr) {
          console.warn('Failed to fetch response count:', cErr);
        }
      } else {
        throw new Error('Survey not found');
      }
    } catch (err) {
      console.warn('API fetch failed, checking localStorage:', err);
      // Fallback to localStorage for prototype
      const localSurveys = JSON.parse(localStorage.getItem('local_surveys') || '[]');
      let found = localSurveys.find(s => s.id.toString() === surveyId.toString());

      // Emergency fallback for ID '1' (MSR Survey) if not in localStorage or API (or if empty)
      if (surveyId.toString() === "1" && (!found || !found.questions || found.questions.length === 0)) {
        // Fetch Parliaments to populate Q1
        let parlOptions = [];
        try {
          const pRes = await parlConsAPI.getParliaments();
          if (pRes.success) {
            parlOptions = pRes.data.map(p => ({ label: p, value: p }));
          }
        } catch (pErr) {
          console.error("Failed to fetch parliaments:", pErr);
        }

        found = {
          name: "MSR Survey",
          description: "MSR Municipal Survey - Prototype",
          branding: { logo: '/logo.png' },
          questions: [
            { id: "q1", displayTitle: "Select your Parliament", type: "dropdown", options: parlOptions.map(p => p.label).join('\n'), required: true },
            { id: "q2", displayTitle: "Select your Municipality", type: "dropdown", options: "Select Parliament first", required: true },
            { id: "q3", displayTitle: "Ward Number", type: "Singleline Text Input", required: true },
            { id: "q4", displayTitle: "మీ వార్డు కౌన్సిలర్ గా ఏ పార్టీ అభ్యర్థి గెలవాలనుకుంటున్నారు?", type: "Radio Button", options: "1. బీజేపీ\n2. కాంగ్రెస్\n3. బిఆర్ఎస్\n4. ఇతరులు", required: true }
          ]
        };
      }

      if (found) {
        // Adapt mock structure to what TakeSurvey expects
        const adaptedSurvey = {
          _id: surveyId,
          title: found.name,
          description: found.description || 'Welcome to this survey.',
          branding: found.branding || { logo: '/logo.png' },
          questions: (found.questions || []).map(q => ({
            _id: q._id || q.id,
            question: q.displayTitle || q.question || q.type,
            type: mapType(q.type),
            required: q.required,
            mediaUrl: q.mediaUrl,
            mediaType: q.mediaType,
            optionMedia: q.id === "q4" ? {
              "1. బీజేపీ": "/bjp.jpeg",
              "2. కాంగ్రెస్": "/congress.jpeg",
              "3. బిఆర్ఎస్": "/brs.jpeg",
              "4. ఇతరులు": "/others.jpeg"
            } : (q.optionMedia || {}),
            options: q.options ? (typeof q.options === 'string' ? q.options.split('\n').map(o => ({ label: o, value: o })) : q.options) : []
          }))
        };
        setSurvey(adaptedSurvey);
        initializeAnswers(adaptedSurvey);

        // Fetch response count for current user
        try {
          const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
          const currentUserName = storedUser.name || storedUser.firstName;
          const resData = await responseAPI.getAll({
            surveyId,
            limit: 1,
            userName: currentUserName
          });
          if (resData.success) {
            setResponseCount(resData.data.pagination.total || 0);
          }
        } catch (cErr) {
          console.warn('Failed to fetch response count:', cErr);
        }
      } else {
        setError(err.error?.message || err.message || 'Survey not found');
      }
    } finally {
      setLoading(false);
    }
  };

  const mapType = (type) => {
    const t = type.toLowerCase();
    if (t.includes('radio')) return 'radio';
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

  const handleAnswerChange = async (questionId, value) => {
    console.log('Answer change:', questionId, value);
    setAnswers(prev => ({ ...prev, [questionId]: value }));

    // Dynamic Municipality Fetch Logic for MSR Prototype
    const q1Id = survey?.questions?.[0]?._id || survey?.questions?.[0]?.id;
    const q2Id = survey?.questions?.[1]?._id || survey?.questions?.[1]?.id;

    if (questionId === q1Id && value) {
      try {
        const mRes = await parlConsAPI.getMunicipalities(value);
        if (mRes.success) {
          const newMuniOptions = mRes.data.map(m => ({ label: m, value: m }));

          // Update the survey definition's question 2 options
          setSurvey(prevSurvey => {
            const updatedQuestions = [...prevSurvey.questions];
            updatedQuestions[1] = {
              ...updatedQuestions[1],
              options: newMuniOptions
            };
            return { ...prevSurvey, questions: updatedQuestions };
          });

          // Clear previous municipality answer
          setAnswers(prev => ({ ...prev, [q2Id]: '' }));
        }
      } catch (err) {
        console.error("Failed to fetch municipalities:", err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Get user from localStorage if logged in
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userName = storedUser.name || storedUser.firstName || 'Anonymous';

      // Specifically target the "Ward Councilor" question for Question_1 storage
      const targetQuestionText = "మీ వార్డు కౌన్సిలర్ గా ఏ పార్టీ అభ్యర్థి గెలవాలనుకుంటున్నారు?";
      const wardCouncilorQuestion = survey?.questions?.find(q => q.question === targetQuestionText);
      const wardCouncilorId = wardCouncilorQuestion?._id || wardCouncilorQuestion?.id;

      let question1Value = answers[wardCouncilorId] || '';
      if (Array.isArray(question1Value)) {
        question1Value = question1Value.join(', ');
      }

      // Extract specific fields for Question 1, 2, 3 (Header Questions)
      const q1Id = survey?.questions?.[0]?._id || survey?.questions?.[0]?.id;
      const q2Id = survey?.questions?.[1]?._id || survey?.questions?.[1]?.id;
      const q3Id = survey?.questions?.[2]?._id || survey?.questions?.[2]?.id;

      // Question 4 is the first main content question
      const q4 = survey?.questions?.[3];
      const q4Id = q4?._id || q4?.id;

      const payload = {
        surveyId: survey?._id || surveyId, // Use real DB ID if available
        userName,
        parliament: answers[q1Id] || '',
        municipality: answers[q2Id] || '',
        ward_num: answers[q3Id] || '',
        Question_1_title: targetQuestionText,
        Question_1_answer: question1Value,
        location,
        answers: Object.entries(answers).map(([qId, value]) => ({
          questionId: qId,
          value
        }))
      };

      if (!navigator.onLine) {
        const offlineData = {
          id: Date.now(),
          payload,
          timestamp: new Date().toISOString()
        };
        const existing = JSON.parse(localStorage.getItem('offline_responses') || '[]');
        existing.push(offlineData);
        localStorage.setItem('offline_responses', JSON.stringify(existing));

        // Clear saved progress after offline save
        localStorage.removeItem(`survey_progress_${surveyId}`);
        alert('You are offline. Response saved locally and will be synced when online.');
        navigate('/dashboard');
        return;
      }

      const response = await responseAPI.submit(payload);

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
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

    switch (question.type.toLowerCase()) {
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
                    let newAnswers;

                    const isPartyQuestion = question.question === "మీ వార్డు కౌన్సిలర్ గా ఏ పార్టీ అభ్యర్థి గెలవాలనుకుంటున్నారు?";

                    // If maxSelect is 1 or it's the specific party question for MSR, treat it like a single choice
                    if (question.validation?.maxSelect === 1 || isPartyQuestion) {
                      newAnswers = e.target.checked ? [opt.value] : [];
                    } else {
                      newAnswers = e.target.checked
                        ? [...currentAnswers, opt.value]
                        : currentAnswers.filter(a => a !== opt.value);
                    }
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
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1rem' }}>
          <button onClick={handleLogout} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '14px' }}>
            Logout
          </button>
        </div>
        <div className="survey-title-row">
          <div className="title-left">
            <div className="survey-logo-wrapper">
              {survey?.branding?.logo ? (
                <img src={survey.branding.logo} alt="Survey Logo" className="survey-logo" />
              ) : (
                <img src={logo} alt="Default Logo" className="survey-logo" />
              )}
            </div>
            <h1>{survey?.title}</h1>
            {survey?.description && <p className="survey-description">{survey.description}</p>}
          </div>
          <div className="responses-count-box">
            <span className="responses-label">RESPONSES</span>
            <span className="responses-number">{responseCount}</span>
          </div>
        </div>
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
    </div >
  );
}
