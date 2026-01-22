
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { surveys as surveysAPI, responses as responsesAPI } from '../services/api';

function TakeSurvey() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [otherDetails, setOtherDetails] = useState({});
  const [step, setStep] = useState('filling'); // 'filling' or 'review'
  const [location, setLocation] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (err) => console.log('Geolocation not supported or denied.'),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  // Helper to identify "Other" type options
  const isOtherOption = (option) => {
    if (!option) return false;
    const value = (option.value || '').toLowerCase();
    const label = (option.label || '').toLowerCase();
    return value === 'others' ||
      value.includes('other') ||
      label.includes('other') ||
      label.includes('indi');
  };
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadSurvey();
  }, [id]);

  useEffect(() => {
    if (survey && user && isAuthenticated) {
      console.log('DEBUG: Auto-populating. User:', user);
      setAnswers(prev => {
        const next = { ...prev };
        let changed = false;

        survey.questions.forEach(q => {
          const qText = q.question.trim().toLowerCase();
          console.log(`DEBUG: Checking question: "${qText}" against user data.`);

          if ((qText === 'district:' || qText === 'district') && user.district && !next[q._id]) {
            console.log(`DEBUG: Matched DISTRICT. Setting to ${user.district}`);
            next[q._id] = user.district;
            changed = true;
          }
          if ((qText === 'municipality:' || qText === 'municipality') && user.municipality && !next[q._id]) {
            console.log(`DEBUG: Matched MUNICIPALITY. Setting to ${user.municipality}`);
            next[q._id] = user.municipality;
            changed = true;
          }
        });

        return changed ? next : prev;
      });
    } else {
      console.log('DEBUG: Skipping auto-populate. Survey:', !!survey, 'User:', !!user, 'Auth:', isAuthenticated);
    }
  }, [survey, user, isAuthenticated]);

  const loadSurvey = async () => {
    try {
      const response = await surveysAPI.get(id);
      const surveyData = response.data.data;
      setSurvey(surveyData);

      if (surveyData.settings?.requireLogin && !isAuthenticated) {
        // Redirect to login with return URL
        navigate('/login', { state: { from: `/survey/${id}` } });
      }
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

  const handleReview = (e) => {
    e.preventDefault();
    setStep('review');
    window.scrollTo(0, 0);
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    setError('');

    try {
      const answersArray = Object.entries(answers).map(([questionId, value]) => {
        let finalValue = value;
        // Check if we have other details for this question
        if (otherDetails[questionId]) {
          const question = survey.questions.find(q => q._id === questionId);
          if (question) {
            if (question.type === 'multiple_choice') {
              finalValue = `${value}: ${otherDetails[questionId]}`;
            } else if (question.type === 'checkbox') {
              // value is an array here
              finalValue = value.map(val => {
                const option = question.options.find(o => o.value === val);
                if (isOtherOption(option)) {
                  return `${option.label}: ${otherDetails[questionId]}`;
                }
                return option ? option.label : val;
              });
            }
          }
        } else {
          // Store labels instead of values for questions 13 and 14 (order 12, 13)
          const question = survey.questions.find(q => q._id === questionId);
          if (question && (question.order === 12 || question.order === 13)) {
            if (Array.isArray(value)) {
              finalValue = value.map(val => {
                const option = question.options.find(o => o.value === val);
                return option ? option.label : val;
              });
            } else {
              const option = question.options.find(o => o.value === value);
              finalValue = option ? option.label : value;
            }
          }
        }
        return {
          questionId,
          value: finalValue
        };
      });

      await responsesAPI.submit({
        surveyId: id,
        answers: answersArray,
        location: location
      });

      setSuccess(true);
      setTimeout(() => navigate('/surveys'), 2000);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to submit survey');
      setStep('filling');
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

  if (step === 'review') {
    return (
      <div className="container">
        <div className="card shadow-lg">
          <h1 className="text-2xl font-bold mb-4">Review Your Answers</h1>
          <p className="text-gray-600 mb-6">Please verify your responses before submitting.</p>

          <div className="space-y-6">
            {survey.questions.map((question, index) => {
              const answer = answers[question._id];
              let displayValue = answer || 'Not answered';

              if (Array.isArray(answer)) {
                displayValue = answer.join(', ');
              }

              // Check if it's an "Other" option answer
              if (otherDetails[question._id]) {
                displayValue = `${answer}: ${otherDetails[question._id]}`;
              }

              return (
                <div key={question._id} className="border-b pb-4 last:border-0">
                  <p className="font-semibold text-gray-800">
                    {index + 1}. {question.question}
                  </p>
                  <p className="mt-1 text-blue-600 font-medium">
                    {String(displayValue)}
                  </p>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
            <button
              onClick={handleFinalSubmit}
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Confirm & Submit'}
            </button>
            <button
              onClick={() => setStep('filling')}
              className="btn btn-secondary"
              disabled={submitting}
            >
              Back to Edit
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{survey.title}</h1>
        {survey.description && <p className="text-gray-600 mb-8">{survey.description}</p>}

        {error && <div className="p-4 mb-6 text-red-700 bg-red-100 rounded-lg">{error}</div>}

        <form onSubmit={handleReview}>
          {survey.questions?.map((question, index) => (
            <div key={question._id} className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-100">
              <label className="block text-lg font-medium text-gray-800 mb-4">
                {index + 1}. {question.question}
                {question.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {question.type === 'text' && (
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required={question.required}
                  value={answers[question._id] || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const isCellNo = question.question.includes('సెల్ నం') || question.question.toLowerCase().includes('cell no');
                    if (isCellNo && val.length > 10) return;
                    handleAnswerChange(question._id, val);
                  }}
                  maxLength={question.question.includes('సెల్ నం') || question.question.toLowerCase().includes('cell no') ? 10 : undefined}
                />
              )}

              {question.type === 'textarea' && (
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  rows="4"
                  required={question.required}
                  value={answers[question._id] || ''}
                  onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                />
              )}

              {question.type === 'multiple_choice' && question.options && (
                <div className="space-y-3">
                  {question.options.map((option) => (
                    <div key={option.value}>
                      <label className="flex items-center p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                        <input
                          type="radio"
                          name={question._id}
                          value={option.value}
                          required={question.required}
                          checked={answers[question._id] === option.value}
                          onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="ml-3 text-gray-700">{option.label}</span>
                      </label>
                      {isOtherOption(option) && answers[question._id] === option.value && (
                        <input
                          type="text"
                          className="w-full mt-2 p-3 border border-gray-300 rounded-lg"
                          placeholder="Please specify..."
                          value={otherDetails[question._id] || ''}
                          onChange={(e) => setOtherDetails(prev => ({ ...prev, [question._id]: e.target.value }))}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {question.type === 'checkbox' && question.options && (
                <div className="space-y-3">
                  {question.options.map((option) => (
                    <div key={option.value}>
                      <label className="flex items-center p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                        <input
                          type="checkbox"
                          value={option.value}
                          checked={(answers[question._id] || []).includes(option.value)}
                          onChange={(e) => {
                            const currentAnswers = answers[question._id] || [];
                            const maxSelect = question.validation?.maxSelect;

                            if (e.target.checked) {
                              if (maxSelect === 1) {
                                handleAnswerChange(question._id, [option.value]);
                              } else {
                                handleAnswerChange(question._id, [...currentAnswers, option.value]);
                              }
                            } else {
                              handleAnswerChange(question._id, currentAnswers.filter(v => v !== option.value));
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="ml-3 text-gray-700">{option.label}</span>
                      </label>
                      {isOtherOption(option) && (answers[question._id] || []).includes(option.value) && (
                        <input
                          type="text"
                          className="w-full mt-2 p-3 border border-gray-300 rounded-lg"
                          placeholder="Please specify..."
                          value={otherDetails[question._id] || ''}
                          onChange={(e) => setOtherDetails(prev => ({ ...prev, [question._id]: e.target.value }))}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {question.type === 'rating' && (
                <div className="flex gap-3">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => handleAnswerChange(question._id, rating)}
                      className={`w-12 h-12 rounded-full border-2 transition-all ${answers[question._id] === rating
                          ? 'bg-blue-600 border-blue-600 text-white transform scale-110 shadow-md'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-blue-400'
                        }`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              )}

              {question.type === 'dropdown' && question.options && (
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  required={question.required}
                  value={answers[question._id] || ''}
                  onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                >
                  <option value="">Select an option...</option>
                  {question.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}

          <div className="flex gap-4 mt-12 bg-gray-50 p-6 rounded-xl border border-gray-200">
            <button type="submit" className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg transition-all active:transform active:scale-95">
              Review My Answers
            </button>
            <button
              type="button"
              className="px-8 py-3 bg-white text-gray-600 font-bold border border-gray-300 rounded-lg hover:bg-gray-100 transition-all"
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
