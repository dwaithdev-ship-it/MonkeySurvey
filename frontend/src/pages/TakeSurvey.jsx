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

  // Batch Holding States
  const [isHeaderLocked, setIsHeaderLocked] = useState(false);
  const [wardBatch, setWardBatch] = useState(null);
  const [parliaments, setParliaments] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);

  const [location, setLocation] = useState(null);

  useEffect(() => {
    fetchSurvey();
    captureLocation();
    fetchParliaments();
  }, [surveyId]);

  const captureLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            method: 'gps'
          });
        },
        async () => {
          await getIPLocation();
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
      );
    } else {
      getIPLocation();
    }
  };

  const getIPLocation = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      if (data.latitude && data.longitude) {
        setLocation({
          latitude: data.latitude,
          longitude: data.longitude,
          method: 'ip'
        });
      }
    } catch (err) {
      setLocation({ latitude: 0, longitude: 0, method: 'none' });
    }
  };

  const fetchParliaments = async () => {
    try {
      const res = await parlConsAPI.getParliaments();
      if (res.success) {
        setParliaments(res.data);
        const newOptions = res.data.map(p => ({ label: p, value: p }));
        setSurvey(prev => {
          if (!prev) return prev;
          const updatedQs = [...prev.questions];
          if (updatedQs.length >= 1) {
            updatedQs[0] = { ...updatedQs[0], options: newOptions };
          }
          return { ...prev, questions: updatedQs };
        });
      }
    } catch (err) {
      console.error("Failed to fetch parliaments");
    }
  };

  const fetchMunis = async (parl) => {
    try {
      const res = await parlConsAPI.getMunicipalities(parl);
      if (res.success) {
        setMunicipalities(res.data);
        const newMuniOptions = res.data.map(m => ({ label: m, value: m }));
        setSurvey(prev => {
          if (!prev) return prev;
          const updatedQs = [...prev.questions];
          if (updatedQs.length >= 2) {
            updatedQs[1] = { ...updatedQs[1], options: newMuniOptions };
          }
          return { ...prev, questions: updatedQs };
        });
        return res.data;
      }
    } catch (err) {
      console.error("Failed to fetch municipalities");
    }
    return [];
  };

  const handleParlChange = async (val) => {
    setWardBatch(prev => ({ ...prev, parliament: val, municipality: '' }));
    await fetchMunis(val);
  };

  const fetchSurvey = async () => {
    try {
      const response = await surveyAPI.getById(surveyId);
      if (response.success) {
        const surveyData = response.data;
        setSurvey(surveyData);
        const initializedAnswers = initializeAnswers(surveyData);
        setupBatchAndAnswers(surveyData, initializedAnswers);

        try {
          const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
          const currentUserName = storedUser.name || storedUser.firstName;
          const resData = await responseAPI.getAll({ surveyId, limit: 1, userName: currentUserName });
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
      console.warn('API fetch failed, checking fallback:', err);
      const localSurveys = JSON.parse(localStorage.getItem('local_surveys') || '[]');
      let found = localSurveys.find(s => s.id.toString() === surveyId.toString());

      if (surveyId.toString() === "1" && (!found || !found.questions || found.questions.length === 0)) {
        found = {
          name: "MSR Survey",
          description: "MSR Municipal Survey - Prototype",
          branding: { logo: '/logo.png' },
          questions: [
            { id: "q1", displayTitle: "Select your Parliament", type: "dropdown", options: "Chevella\nMalkajgiri\nHyderabad", required: true },
            { id: "q2", displayTitle: "Select your Municipality", type: "dropdown", options: "Chevella\nManikonda\nNarsingi", required: true },
            { id: "q3", displayTitle: "Ward Number", type: "text", required: true },
            { id: "q4", displayTitle: "మీ వార్డు కౌన్సిలర్ గా ఏ పార్టీ అభ్యర్థి గెలవాలనుకుంటున్నారు?", type: "radio", options: "1. బీజేపీ\n2. కాంగ్రెస్\n3. బిఆర్ఎస్\n4. ఇతరులు", required: true }
          ]
        };
      }

      if (found) {
        const adaptedSurvey = {
          _id: surveyId,
          title: found.name,
          description: found.description,
          branding: found.branding,
          questions: (found.questions || []).map(q => ({
            _id: q._id || q.id,
            question: q.displayTitle || q.question,
            type: mapType(q.type),
            required: q.required,
            options: q.options ? (typeof q.options === 'string' ? q.options.split('\n').map(o => ({ label: o, value: o })) : q.options) : []
          }))
        };
        setSurvey(adaptedSurvey);
        const initializedAnswers = initializeAnswers(adaptedSurvey);
        setupBatchAndAnswers(adaptedSurvey, initializedAnswers);
      }
    } finally {
      setLoading(false);
    }
  };

  const mapType = (type) => {
    const t = type.toLowerCase();
    if (t.includes('radio')) return 'radio';
    if (t.includes('checkbox')) return 'checkbox';
    if (t.includes('rating')) return 'rating';
    if (t.includes('dropdown')) return 'dropdown';
    return 'text';
  };

  const initializeAnswers = (surveyData) => {
    const initialAnswers = {};
    (surveyData.questions || []).forEach(q => {
      initialAnswers[q._id || q.id] = '';
    });
    return initialAnswers;
  };

  const setupBatchAndAnswers = (surveyData, initialAnswers) => {
    const existingBatch = localStorage.getItem(`ward_batch_${surveyId}`);

    if (existingBatch) {
      try {
        const batch = JSON.parse(existingBatch);
        if (batch.count <= batch.limit) {
          setIsHeaderLocked(true);
          setWardBatch(batch);
          setAnswers({
            ...initialAnswers,
            [surveyData.questions[0]._id || surveyData.questions[0].id]: batch.parliament,
            [surveyData.questions[1]._id || surveyData.questions[1].id]: batch.municipality,
            [surveyData.questions[2]._id || surveyData.questions[2].id]: batch.ward_num
          });

          if (batch.parliament) {
            fetchMunis(batch.parliament);
          }
          return;
        }
      } catch (err) {
        console.warn('Failed to load batch:', err);
      }
    }

    // If no batch, show setup mode using user profile defaults
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    setIsHeaderLocked(false);
    setWardBatch({
      parliament: storedUser.district || '',
      municipality: storedUser.municipality || '',
      ward_num: '',
      limit: 3,
      count: 1
    });
    setAnswers(initialAnswers);
  };

  const startBatch = () => {
    if (!wardBatch.parliament || !wardBatch.municipality || !wardBatch.ward_num) {
      alert("Please select and enter all location details first.");
      return;
    }

    localStorage.setItem(`ward_batch_${surveyId}`, JSON.stringify(wardBatch));
    setIsHeaderLocked(true);

    // Pre-fill answers with locked values
    const q1Id = survey?.questions?.[0]?._id || survey?.questions?.[0]?.id;
    const q2Id = survey?.questions?.[1]?._id || survey?.questions?.[1]?.id;
    const q3Id = survey?.questions?.[2]?._id || survey?.questions?.[2]?.id;

    setAnswers(prev => ({
      ...prev,
      [q1Id]: wardBatch.parliament,
      [q2Id]: wardBatch.municipality,
      [q3Id]: wardBatch.ward_num
    }));
  };

  const updateBatchLimit = (newLimit) => {
    const updatedBatch = { ...wardBatch, limit: newLimit };
    setWardBatch(updatedBatch);
    localStorage.setItem(`ward_batch_${surveyId}`, JSON.stringify(updatedBatch));
  };

  const handleAnswerChange = (questionId, value) => {
    const qIndex = survey?.questions?.findIndex(q => (q._id || q.id) === questionId);
    // In locked mode, Question 1, 2, 3 are strictly blocked
    if (isHeaderLocked && qIndex !== -1 && qIndex < 3) {
      return;
    }
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userName = storedUser.name || storedUser.firstName || 'Anonymous';
      const q1Id = survey?.questions?.[0]?._id || survey?.questions?.[0]?.id;
      const q2Id = survey?.questions?.[1]?._id || survey?.questions?.[1]?.id;
      const q3Id = survey?.questions?.[2]?._id || survey?.questions?.[2]?.id;

      // Specifically target the "Ward Councilor" question for Question_1 storage (for records table)
      const targetQuestionText = "మీ వార్డు కౌన్సిలర్ గా ఏ పార్టీ అభ్యర్థి గెలవాలనుకుంటున్నారు?";
      const wardCouncilorQuestion = survey?.questions?.find(q => q.question === targetQuestionText) || survey?.questions?.[3];
      const wardCouncilorId = wardCouncilorQuestion?._id || wardCouncilorQuestion?.id;
      let question1Value = answers[wardCouncilorId] || '';
      if (Array.isArray(question1Value)) question1Value = question1Value.join(', ');

      const payload = {
        surveyId: survey?._id || surveyId,
        userName,
        parliament: answers[q1Id] || '',
        municipality: answers[q2Id] || '',
        ward_num: answers[q3Id] || '',
        Question_1_title: targetQuestionText,
        Question_1_answer: question1Value,
        Question_1: question1Value,
        location,
        answers: Object.entries(answers).map(([qId, val]) => ({ questionId: qId, value: val }))
      };

      const response = await responseAPI.submit(payload);
      if (response.success) {
        const currentBatch = JSON.parse(localStorage.getItem(`ward_batch_${surveyId}`) || 'null');
        if (currentBatch) {
          const newCount = (currentBatch.count || 0) + 1;
          if (newCount > currentBatch.limit) {
            localStorage.removeItem(`ward_batch_${surveyId}`);
            setIsHeaderLocked(false);
          } else {
            const updatedBatch = { ...currentBatch, count: newCount };
            localStorage.setItem(`ward_batch_${surveyId}`, JSON.stringify(updatedBatch));
            setWardBatch(updatedBatch);
          }
        }

        alert('Survey submitted successfully!');

        // RE-INITIALIZE with locked values
        const freshAnswers = initializeAnswers(survey);
        if (localStorage.getItem(`ward_batch_${surveyId}`)) {
          const batch = JSON.parse(localStorage.getItem(`ward_batch_${surveyId}`));
          setAnswers({
            ...freshAnswers,
            [q1Id]: batch.parliament,
            [q2Id]: batch.municipality,
            [q3Id]: batch.ward_num
          });
        } else {
          setAnswers(freshAnswers);
          setupBatchAndAnswers(survey, freshAnswers);
        }

        window.scrollTo(0, 0);
      }
    } catch (err) {
      setError('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question, index) => {
    const qId = question._id || question.id;
    const isDisabled = isHeaderLocked && index < 3;
    const value = answers[qId] || '';

    if (question.type === 'dropdown') {
      return (
        <select value={value} onChange={(e) => handleAnswerChange(qId, e.target.value)} disabled={isDisabled} className="answer-select">
          <option value="">Select an option</option>
          {(question.options || []).map((opt, i) => <option key={i} value={opt.value || opt.label}>{opt.label}</option>)}
        </select>
      );
    }

    if (question.type === 'radio') {
      const optionImages = {
        "1. బీజేపీ": "/bjp.jpeg",
        "2. కాంగ్రెస్": "/congress.jpeg",
        "3. బిఆర్ఎస్": "/brs.jpeg",
        "4. ఇతరులు": "/others.jpeg"
      };
      return (
        <div className="options-container">
          {(question.options || []).map((opt, i) => (
            <label key={i} className="option-label">
              <input type="radio" name={`q-${qId}`} checked={value === (opt.value || opt.label)} onChange={() => handleAnswerChange(qId, opt.value || opt.label)} disabled={isDisabled} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {optionImages[opt.label] && <img src={optionImages[opt.label]} alt="" className="option-media-img" />}
                <span>{opt.label}</span>
              </div>
            </label>
          ))}
        </div>
      );
    }

    return (
      <input type="text" value={value} onChange={(e) => handleAnswerChange(qId, e.target.value)} disabled={isDisabled} className="answer-input" placeholder="Enter your answer" />
    );
  };

  if (loading) return <div className="take-survey-container"><div className="loading">Loading Survey...</div></div>;

  return (
    <div className="take-survey-container">
      <div className="survey-header-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ color: '#6366f1', fontSize: '13px' }}>📍 Location Synced</div>
          <button onClick={() => { localStorage.removeItem('token'); navigate('/login'); }} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '14px' }}>Logout</button>
        </div>
        <div className="survey-title-row">
          <div className="title-left">
            <div className="survey-logo-wrapper">
              <img src={survey?.branding?.logo || logo} alt="Logo" className="survey-logo" />
            </div>
            <h1>{(survey?.title === '1' || survey?.title === '2' || survey?.title === 1 || survey?.title === 2 || !survey?.title) ? 'MSR Survey' : survey.title}</h1>
            <p className="survey-description">{survey?.description}</p>
          </div>
          <div className="responses-count-box">
            <span className="responses-label">RESPONSES</span>
            <span className="responses-number">{responseCount}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="survey-form">

        {/* SETUP MODE: Show when not locked */}
        {!isHeaderLocked && (
          <div className="question-block" style={{ border: '2px dashed #6366f1', background: '#f8f9ff', borderRadius: '16px' }}>
            <h2 style={{ color: '#4f46e5', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              ⚙️ Batch Holding Setup
            </h2>
            <p style={{ color: '#6366f1', marginBottom: '2rem' }}>
              Choose your location and how many surveys you want to hold these options for.
            </p>

            <div className="setup-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div className="setup-field">
                <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Parliament</label>
                <select
                  className="answer-select"
                  value={wardBatch?.parliament}
                  onChange={(e) => handleParlChange(e.target.value)}
                >
                  <option value="">Select Parliament</option>
                  {parliaments.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="setup-field">
                <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Municipality</label>
                <select
                  className="answer-select"
                  value={wardBatch?.municipality}
                  onChange={(e) => setWardBatch(prev => ({ ...prev, municipality: e.target.value }))}
                >
                  <option value="">Select Municipality</option>
                  {municipalities.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div className="setup-field">
                <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Ward Number</label>
                <input
                  type="text"
                  className="answer-input"
                  placeholder="e.g. 15"
                  value={wardBatch?.ward_num}
                  onChange={(e) => setWardBatch(prev => ({ ...prev, ward_num: e.target.value }))}
                />
              </div>

              <div className="setup-field">
                <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Holding Limit (Surveys)</label>
                <select
                  className="answer-select"
                  value={wardBatch?.limit}
                  onChange={(e) => setWardBatch(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
                >
                  {[1, 2, 3, 5, 10, 15, 20, 50].map(n => (
                    <option key={n} value={n}>{n} Surveys</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              className="btn-primary"
              style={{ width: '100%', padding: '1.2rem' }}
              onClick={startBatch}
            >
              Confirm & Start Surveying
            </button>
          </div>
        )}

        {/* SURVEY MODE: Show when locked */}
        {isHeaderLocked && (
          <>
            <div className={`question-block header-group-block is-locked`}>
              <div className="lock-indicator-bar" style={{ background: '#fffbeb', border: '2px solid #fbbf24', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>🔒</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', color: '#92400e' }}>Location Locked for {wardBatch?.limit} survey batch.</div>
                  <div style={{ fontSize: '12px', color: '#b45309' }}>Complete all {wardBatch?.limit} surveys to change location.</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.5)', padding: '4px 8px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#92400e', fontWeight: '700' }}>Change Limit:</span>
                    <select
                      style={{ border: '1px solid #fbbf24', borderRadius: '4px', fontSize: '11px', padding: '1px 4px', background: 'white', cursor: 'pointer' }}
                      value={wardBatch?.limit}
                      onChange={(e) => updateBatchLimit(parseInt(e.target.value))}
                    >
                      {[1, 2, 3, 5, 10, 15, 20, 50, 100].map(n => (
                        <option key={n} value={n}>{n} Surveys</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ background: '#fbbf24', color: '#92400e', padding: '4px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '13px' }}>
                      {wardBatch?.count} / {wardBatch?.limit}
                    </span>
                    <button
                      type="button"
                      onClick={() => { if (window.confirm("Reset batch?")) { localStorage.removeItem(`ward_batch_${surveyId}`); setupBatchAndAnswers(survey, initializeAnswers(survey)); } }}
                      style={{ background: 'none', border: 'none', color: '#92400e', fontSize: '11px', textDecoration: 'underline', cursor: 'pointer', fontWeight: '600' }}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
              <div className="inline-fields-row">
                {survey?.questions?.slice(0, 3).map((q, i) => (
                  <div key={q._id || q.id} className="inline-field">
                    <div className="question-header compact">
                      <span className="question-number">Question {i + 1}</span>
                      {q.required && <span className="required-indicator">*</span>}
                    </div>
                    <label className="field-label-compact">{q.question}</label>
                    {renderQuestion(q, i)}
                  </div>
                ))}
              </div>
            </div>

            {survey?.questions?.slice(3).map((q, i) => (
              <div key={q._id || q.id} className="question-block full-width-block">
                <div className="question-header">
                  <span className="question-number">Question {i + 4}</span>
                  {q.required && <span className="required-indicator">*</span>}
                </div>
                <h3 className="question-text">{q.question}</h3>
                {renderQuestion(q, i + 3)}
              </div>
            ))}

            <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Submitting...' : 'Submit Survey'}</button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
