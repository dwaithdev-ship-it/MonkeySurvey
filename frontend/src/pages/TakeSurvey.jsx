import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { surveyAPI, responseAPI, parlConsAPI } from '../services/api';
import { offlineSync } from '../utils/offlineSync';
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
        localStorage.setItem('cached_parliaments', JSON.stringify(res.data));
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
      const cached = localStorage.getItem('cached_parliaments');
      if (cached) {
        const data = JSON.parse(cached);
        setParliaments(data);
        const newOptions = data.map(p => ({ label: p, value: p }));
        setSurvey(prev => {
          if (!prev) return prev;
          const updatedQs = [...prev.questions];
          if (updatedQs.length >= 1) {
            updatedQs[0] = { ...updatedQs[0], options: newOptions };
          }
          return { ...prev, questions: updatedQs };
        });
      }
    }
  };

  const fetchMunis = async (parl) => {
    try {
      const res = await parlConsAPI.getMunicipalities(parl);
      if (res.success) {
        setMunicipalities(res.data);
        localStorage.setItem(`cached_munis_${parl}`, JSON.stringify(res.data));
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
      const cached = localStorage.getItem(`cached_munis_${parl}`);
      if (cached) {
        const data = JSON.parse(cached);
        setMunicipalities(data);
        const newMuniOptions = data.map(m => ({ label: m, value: m }));
        setSurvey(prev => {
          if (!prev) return prev;
          const updatedQs = [...prev.questions];
          if (updatedQs.length >= 2) {
            updatedQs[1] = { ...updatedQs[1], options: newMuniOptions };
          }
          return { ...prev, questions: updatedQs };
        });
        return data;
      }
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

        // Cache the successful response for offline use
        if (response.data) {
          const localSurveys = JSON.parse(localStorage.getItem('local_surveys') || '[]');
          const index = localSurveys.findIndex(s => (s._id || s.id) == surveyId);
          const surveyToCache = { ...response.data, id: surveyId };
          if (index > -1) localSurveys[index] = surveyToCache;
          else localSurveys.push(surveyToCache);
          localStorage.setItem('local_surveys', JSON.stringify(localSurveys));
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
            { id: "q3", displayTitle: "Ward num", type: "text", required: true },
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
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    // Auto-submit if it's question 4 (the final party question)
    if (qIndex === 3) {
      performSubmit(newAnswers);
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    performSubmit(answers);
  };

  const performSubmit = async (currentAnswers) => {
    if (submitting) return;
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
      let question1Value = currentAnswers[wardCouncilorId] || '';
      if (Array.isArray(question1Value)) question1Value = question1Value.join(', ');

      const payload = {
        surveyId: survey?._id || surveyId,
        userName,
        parliament: currentAnswers[q1Id] || '',
        municipality: currentAnswers[q2Id] || '',
        ward_num: currentAnswers[q3Id] || '',
        Question_1_title: targetQuestionText,
        Question_1_answer: question1Value,
        Question_1: question1Value,
        location,
        answers: Object.entries(currentAnswers).map(([qId, val]) => ({ questionId: qId, value: val }))
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

        setResponseCount(prev => prev + 1);
        alert('Survey submitted successfully!');

        // RE-INITIALIZE with locked values
        const freshAnswers = initializeAnswers(survey);
        const activeBatch = localStorage.getItem(`ward_batch_${surveyId}`);
        if (activeBatch) {
          const batch = JSON.parse(activeBatch);
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
      console.warn('Submission failed, checking for offline mode:', err);

      // If network error OR offline, queue it
      const isNetworkError =
        !navigator.onLine ||
        err === 'Network Error' ||
        err?.message === 'Network Error' ||
        (typeof err === 'string' && err.includes('Network Error')) ||
        err?.code === 'ERR_NETWORK';

      if (isNetworkError) {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const userName = storedUser.name || storedUser.firstName || 'Anonymous';
        const q1Id = survey?.questions?.[0]?._id || survey?.questions?.[0]?.id;
        const q2Id = survey?.questions?.[1]?._id || survey?.questions?.[1]?.id;
        const q3Id = survey?.questions?.[2]?._id || survey?.questions?.[2]?.id;

        const targetQuestionText = "మీ వార్డు కౌన్సిలర్ గా ఏ పార్టీ అభ్యర్థి గెలవాలనుకుంటున్నారు?";
        const wardCouncilorQuestion = survey?.questions?.find(q => q.question === targetQuestionText) || survey?.questions?.[3];
        const wardCouncilorId = wardCouncilorQuestion?._id || wardCouncilorQuestion?.id;
        let question1Value = currentAnswers[wardCouncilorId] || '';
        if (Array.isArray(question1Value)) question1Value = question1Value.join(', ');

        const payload = {
          surveyId: survey?._id || surveyId,
          userName,
          parliament: currentAnswers[q1Id] || '',
          municipality: currentAnswers[q2Id] || '',
          ward_num: currentAnswers[q3Id] || '',
          Question_1_title: targetQuestionText,
          Question_1_answer: question1Value,
          Question_1: question1Value,
          location,
          answers: Object.entries(currentAnswers).map(([qId, val]) => ({ questionId: qId, value: val }))
        };

        offlineSync.queueResponse(payload);

        // Proceed with local batch logic as if it succeeded
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

        setResponseCount(prev => prev + 1);
        alert('Survey saved locally (Offline). It will be synced when internet is restored.');

        // RE-INITIALIZE with locked values
        const freshAnswers = initializeAnswers(survey);
        const activeBatch = localStorage.getItem(`ward_batch_${surveyId}`);
        if (activeBatch) {
          const batch = JSON.parse(activeBatch);
          const q1Id = survey?.questions?.[0]?._id || survey?.questions?.[0]?.id;
          const q2Id = survey?.questions?.[1]?._id || survey?.questions?.[1]?.id;
          const q3Id = survey?.questions?.[2]?._id || survey?.questions?.[2]?.id;
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
        return;
      }

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
            <label key={i} className="option-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px' }}>
              <input
                type="radio"
                name={`q-${qId}`}
                checked={value === (opt.value || opt.label)}
                onChange={() => handleAnswerChange(qId, opt.value || opt.label)}
                disabled={isDisabled}
                style={{ accentColor: '#6366f1', cursor: 'pointer', transform: 'scale(1.2)' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                {optionImages[opt.label] && <img src={optionImages[opt.label]} alt="" className="option-media-img" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />}
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1f2937' }}>{opt.label}</span>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div className="survey-logo-wrapper" style={{ margin: 0, flex: '0 0 auto' }}>
            <img src={survey?.branding?.logo || logo} alt="Logo" className="survey-logo" />
          </div>
          <div style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minWidth: '120px' }}>
            <h1 style={{ margin: 0, fontSize: 'clamp(16px, 4vw, 22px)', fontWeight: 'bold', color: '#333', whiteSpace: 'nowrap' }}>MSR SURVEY</h1>
            <img src="https://img.icons8.com/color/48/000000/marker.png" alt="Location" style={{ width: 'clamp(18px, 4vw, 22px)', height: 'clamp(18px, 4vw, 22px)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '0 0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f0fdf4', padding: 'clamp(3px, 1vw, 5px) clamp(8px, 2vw, 15px)', borderRadius: '12px', border: '1px solid #dcfce7' }}>
              <img src="https://img.icons8.com/color/48/000000/checklist.png" alt="Responses" style={{ width: 'clamp(18px, 4vw, 24px)', height: 'clamp(18px, 4vw, 24px)' }} />
              <span style={{ fontSize: 'clamp(16px, 4vw, 22px)', fontWeight: 'bold', color: '#10b981' }}>{responseCount}</span>
            </div>
            <button
              onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}
              className="btn-secondary"
              style={{
                background: 'none',
                border: 'none',
                padding: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Logout"
            >
              <img
                src="https://img.icons8.com/material-outlined/32/000000/logout-rounded-left.png"
                alt="Logout"
                style={{ width: 'clamp(22px, 4vw, 28px)', height: 'clamp(22px, 4vw, 28px)' }}
              />
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="survey-form">
        {!isHeaderLocked && (
          <div className="question-block" style={{ border: '1.5px dashed #6366f1', background: '#f8f9ff', borderRadius: '12px', padding: '1rem 2rem', marginBottom: '0.75rem' }}>
            <h2 style={{ color: '#4f46e5', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>⚙️ Batch Holding Setup</h2>
            <div className="setup-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
              <div className="setup-field">
                <label style={{ fontWeight: 600, display: 'block', marginBottom: '4px', fontSize: '12px' }}>Parliament</label>
                <select className="answer-select" style={{ padding: '0.5rem', fontSize: '13px' }} value={wardBatch?.parliament} onChange={(e) => handleParlChange(e.target.value)}>
                  <option value="">Select Parliament</option>
                  {parliaments.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="setup-field">
                <label style={{ fontWeight: 600, display: 'block', marginBottom: '4px', fontSize: '12px' }}>Municipality</label>
                <select className="answer-select" style={{ padding: '0.5rem', fontSize: '13px' }} value={wardBatch?.municipality} onChange={(e) => setWardBatch(prev => ({ ...prev, municipality: e.target.value }))}>
                  <option value="">Select Municipality</option>
                  {municipalities.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="setup-field">
                <label style={{ fontWeight: 600, display: 'block', marginBottom: '4px', fontSize: '12px' }}>Ward num</label>
                <input type="text" className="answer-input" style={{ padding: '0.5rem', fontSize: '13px' }} placeholder="e.g. 15" value={wardBatch?.ward_num} onChange={(e) => setWardBatch(prev => ({ ...prev, ward_num: e.target.value }))} />
              </div>
              <div className="setup-field">
                <label style={{ fontWeight: 600, display: 'block', marginBottom: '4px', fontSize: '12px' }}>Holding Limit</label>
                <input
                  type="number"
                  className="answer-input"
                  style={{ padding: '0.5rem', fontSize: '13px' }}
                  placeholder="e.g. 20"
                  value={wardBatch?.limit}
                  onChange={(e) => setWardBatch(prev => ({ ...prev, limit: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <button type="button" className="btn-primary" style={{ width: '100%', padding: '0.75rem', fontSize: '14px' }} onClick={startBatch}>Confirm & Start Surveying</button>
          </div>
        )}

        {isHeaderLocked && (
          <div className={`question-block header-group-block is-locked`} style={{ padding: '0.75rem 2rem', marginBottom: '0.75rem' }}>
            <div className="lock-indicator-bar" style={{ padding: '0.5rem 0.75rem', marginBottom: '0.75rem', fontSize: '13px' }}>
              <span style={{ fontSize: '16px' }}>🔒</span>
              <div style={{ flex: 1 }}><div style={{ fontWeight: '700', color: '#92400e' }}>Location Locked</div></div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.5)', padding: '2px 6px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '10px', color: '#92400e', fontWeight: '700' }}>Limit:</span>
                  <input
                    type="number"
                    style={{ border: '1px solid #fbbf24', borderRadius: '4px', fontSize: '12px', padding: '0 4px', background: 'white', width: '40px', textAlign: 'center' }}
                    value={wardBatch?.limit}
                    onChange={(e) => updateBatchLimit(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ background: '#fbbf24', color: '#92400e', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold', fontSize: '11px' }}>{wardBatch?.count} / {wardBatch?.limit}</span>
                  <button type="button" onClick={() => { if (window.confirm("Reset batch?")) { localStorage.removeItem(`ward_batch_${surveyId}`); setupBatchAndAnswers(survey, initializeAnswers(survey)); } }} style={{ background: 'none', border: 'none', color: '#92400e', fontSize: '10px', textDecoration: 'underline', cursor: 'pointer', fontWeight: '600' }}>Reset</button>
                </div>
              </div>
            </div>
            <div className="inline-fields-row" style={{ gap: '0.75rem' }}>
              {survey?.questions?.slice(0, 3).map((q, i) => (
                <div key={q._id || q.id} className="inline-field">
                  <label className="field-label-compact" style={{ fontSize: '11px', marginBottom: '4px' }}>{q.question}</label>
                  {renderQuestion(q, i)}
                </div>
              ))}
            </div>
          </div>
        )}

        {isHeaderLocked && survey?.questions?.slice(3).map((q, i) => (
          <div key={q._id || q.id} className="question-block full-width-block" style={{ padding: '1rem 2rem', marginBottom: '0.5rem' }}>
            <div className="question-header" style={{ marginBottom: '0.5rem' }}>
              <span className="question-number" style={{ fontSize: '11px' }}>Question {i + 4}</span>
            </div>
            <h3 className="question-text" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>{q.question}</h3>
            {renderQuestion(q, i + 3)}
          </div>
        ))}

        {submitting && (
          <div style={{ textAlign: 'center', padding: '0.5rem', color: '#6366f1', fontWeight: 'bold' }}>⌛ Submitting...</div>
        )}
      </form>
    </div>
  );
}
