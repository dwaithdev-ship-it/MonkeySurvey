import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { surveyAPI, responseAPI, parlConsAPI } from '../services/api';
import { offlineSync } from '../utils/offlineSync';
import logo from '../assets/logo.png';
import './TakeSurvey.css';
import SignaturePad from '../components/SignaturePad';

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
  const [isReorderEnabled, setIsReorderEnabled] = useState(false);
  const [draggedQuestionIndex, setDraggedQuestionIndex] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

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
      if (res.success && res.data && res.data.length > 0) {
        setParliaments(res.data);
        localStorage.setItem('cached_parliaments', JSON.stringify(res.data));
        const newOptions = res.data.map(p => ({ label: p, value: p }));
        setSurvey(prev => {
          if (!prev || !prev.questions || prev.questions.length === 0) return prev;
          const updatedQs = [...prev.questions];
          // Only overwrite if current options are empty
          if (!updatedQs[0].options || updatedQs[0].options.length === 0) {
            updatedQs[0] = { ...updatedQs[0], options: newOptions };
          }
          return { ...prev, questions: updatedQs };
        });
      }
    } catch (err) {
      console.warn("Failed to fetch parliaments from API, trying cache");
      const cached = localStorage.getItem('cached_parliaments');
      if (cached) {
        const data = JSON.parse(cached);
        setParliaments(data);
        const newOptions = data.map(p => ({ label: p, value: p }));
        setSurvey(prev => {
          if (!prev || !prev.questions || prev.questions.length === 0) return prev;
          const updatedQs = [...prev.questions];
          if (!updatedQs[0].options || updatedQs[0].options.length === 0) {
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

  const normalizeOptions = (opts) => {
    if (!opts) return [];
    if (typeof opts === 'string') {
      return opts.split('\n')
        .filter(o => o.trim())
        .map(o => ({ label: o.trim(), value: o.trim() }));
    }
    if (Array.isArray(opts)) {
      return opts.map(o => {
        if (!o) return { label: '', value: '' };
        if (typeof o === 'string') return { label: o.trim(), value: o.trim() };
        if (typeof o === 'object') return {
          label: o.label || o.value || o.title || String(o),
          value: o.value || o.label || o.id || String(o)
        };
        return { label: String(o), value: String(o) };
      });
    }
    return [];
  };

  const saveNewOrder = async () => {
    if (!survey || !survey._id) return;

    try {
      // Show some visual indication or just proceed
      console.log('Saving new question order...');

      // We need to send the original types if possible, or ensure the backend handles adapted ones
      // Looking at adaptSurveyData, we have originalType. Let's use it if available.
      const questionsToSave = survey.questions.map(q => ({
        ...q,
        type: q.originalType || q.type // Favor original type for backend compatibility
      }));

      const response = await surveyAPI.update(surveyId, { questions: questionsToSave });

      if (response.success) {
        // Update local_surveys cache
        const localSurveys = JSON.parse(localStorage.getItem('local_surveys') || '[]');
        const index = localSurveys.findIndex(s => (s._id || s.id) == surveyId);
        if (index > -1) {
          localSurveys[index].questions = questionsToSave;
          localStorage.setItem('local_surveys', JSON.stringify(localSurveys));
        }
        console.log('Order saved successfully');
      } else {
        console.warn('Failed to save order to server, but state is updated locally');
      }
    } catch (err) {
      console.error('Error saving question order:', err);
    }
  };

  const handleDragStart = (e, index) => {
    if (hasSubmitted || !isReorderEnabled) return;
    setDraggedQuestionIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Add a ghost image or just styling
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
    setDraggedQuestionIndex(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (hasSubmitted || !isReorderEnabled || draggedQuestionIndex === null || draggedQuestionIndex === dropIndex) return;

    setSurvey(prev => {
      if (!prev || !prev.questions) return prev;
      const newQuestions = [...prev.questions];
      const [draggedItem] = newQuestions.splice(draggedQuestionIndex, 1);
      newQuestions.splice(dropIndex, 0, draggedItem);
      return { ...prev, questions: newQuestions };
    });
    setDraggedQuestionIndex(null);
  };

  const adaptSurveyData = (source, id) => {
    if (!source) return null;
    return {
      _id: source._id || source.id || id,
      title: source.name || source.title,
      description: source.description,
      branding: source.branding,
      questions: (source.questions || []).map((q, idx) => ({
        _id: q.id || q._id || `q-${idx}`,
        question: q.title || q.displayTitle || q.question,
        type: mapType(q.type),
        required: q.required,
        description: q.description || '',
        options: normalizeOptions(q.options),
        rowOptions: normalizeOptions(q.rowOptions),
        columnOptions: normalizeOptions(q.columnOptions),
        orientation: q.orientation || 'Vertical',
        numColumns: q.numColumns || 1,
        optionMedia: q.optionMedia || {},
        layout: q.layout || 'Horizontal',
        mediaUrl: q.mediaUrl,
        mediaType: q.mediaType,
        displayTitle: q.displayTitle || q.title,
        isOtherTextOptional: q.isOtherTextOptional || false,
        originalType: q.type,
        nsecHouseholdTitle: q.nsecHouseholdTitle,
        nsecAgricultureTitle: q.nsecAgricultureTitle,
        nsecEducationTitle: q.nsecEducationTitle,
        ruralWallTitle: q.ruralWallTitle,
        ruralWallOptions: q.ruralWallOptions,
        ruralRoofTitle: q.ruralRoofTitle,
        ruralRoofOptions: q.ruralRoofOptions,
        ruralEducationTitle: q.ruralEducationTitle,
        cascadeLevels: q.cascadeLevels || [],
        cascadeQuestionType: q.cascadeQuestionType || 'Dropdown',
        cascadeDataSource: q.cascadeDataSource
      }))
    };
  };

  const fetchSurvey = async () => {
    try {
      const response = await surveyAPI.getById(surveyId);
      if (response.success) {
        const adapted = adaptSurveyData(response.data, surveyId);
        setSurvey(adapted);
        const initializedAnswers = initializeAnswers(adapted);
        setupBatchAndAnswers(adapted, initializedAnswers);

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

        // Cache for offline
        const localSurveys = JSON.parse(localStorage.getItem('local_surveys') || '[]');
        const index = localSurveys.findIndex(s => (s._id || s.id) == surveyId);
        if (index > -1) localSurveys[index] = { ...response.data, id: surveyId };
        else localSurveys.push({ ...response.data, id: surveyId });
        localStorage.setItem('local_surveys', JSON.stringify(localSurveys));
      } else {
        throw new Error('Survey not found');
      }
    } catch (err) {
      console.warn('API fetch failed, checking fallback:', err);
      const localSurveys = JSON.parse(localStorage.getItem('local_surveys') || '[]');
      let found = localSurveys.find(s =>
        (s.id && s.id.toString() === surveyId.toString()) ||
        (s.name && s.name.toLowerCase().replace(/\s+/g, '-') === surveyId.toString())
      );

      // Fallback for demo survey
      if (surveyId.toString() === "1" || surveyId.toString() === "demo-pre-election") {
        if (!found || !found.questions || found.questions.length === 0) {
          found = {
            id: 1,
            name: "Demo-Pre Election",
            questions: [
              { id: "q1", displayTitle: "Select your Parliament", type: "Drop Down", options: "Chevella\nMalkajgiri\nHyderabad", required: true },
              { id: "q2", displayTitle: "Select your Municipality", type: "Drop Down", options: "Chevella\nManikonda\nNarsingi", required: true },
              { id: "q3", displayTitle: "Ward num", type: "Singleline Text Input", required: true },
              { id: "q4", displayTitle: "మీ వార్డు కౌన్సిలర్ గా ఏ పార్టీ అభ్యర్థి గెలవాలనుకుంటున్నారు?", type: "Radio Button", options: "1. బీజేపీ\n2. కాంగ్రెస్\n3. బిఆర్ఎస్\n4. ఇతరులు", required: true }
            ]
          };
        }
      }

      if (found) {
        const adapted = adaptSurveyData(found, surveyId);
        setSurvey(adapted);
        const initializedAnswers = initializeAnswers(adapted);
        setupBatchAndAnswers(adapted, initializedAnswers);
      } else {
        setError('Survey not found. Please verify the URL.');
      }
    } finally {
      setLoading(false);
    }
  };

  const mapType = (type) => {
    if (!type) return 'text';
    const t = type.toLowerCase().trim();
    if (t.includes('text block')) return 'text-block';
    if (t.includes('singleline text input')) return 'text';
    if (t.includes('multiline text input')) return 'textarea';
    if (t.includes('numeric input') || t.includes('number input') || t.includes('number with auto code')) return 'number';
    if (t.includes('decimal input')) return 'number';
    if (t.includes('dropdown') && t.includes('grid')) return 'dropdown-grid';
    if (t.includes('radio grid')) return 'radio-grid';
    if (t.includes('checkbox') && t.includes('grid')) return 'checkbox-grid';
    if (t.includes('checkbox') && t.includes('text')) return 'checkbox-grid';
    if (t.includes('number grid')) return 'number-grid';
    if (t.includes('decimal grid')) return 'number-grid';
    if (t.includes('singleline text grid')) return 'text-grid';
    if (t.includes('nps grid')) return 'nps-grid';
    if (t.includes('number point grid')) return 'number-grid';
    if (t.includes('grid')) return 'radio-grid';
    if (t.includes('radio button with text')) return 'radio-with-text';
    if (t.includes('radio button')) return 'radio';
    if (t.includes('radio btn')) return 'radio';
    if (t.includes('radio')) return 'radio';
    if (t.includes('multi choice')) return 'radio';
    if (t.includes('checkbox')) return 'checkbox';
    if (t.includes('rating')) return 'rating';
    if (t.includes('dropdown')) return 'dropdown';
    if (t.includes('photo') || t.includes('capture')) return 'photo';
    if (t.includes('video')) return 'video';
    if (t.includes('audio')) return 'audio';
    if (t.includes('nsec')) return 'nsec';
    if (t.includes('cascade')) return 'cascade';
    if (t.includes('rural sec')) return 'rural sec';
    if (t.includes('sec')) return 'sec';
    if (t.includes('ranking')) return 'ranking';
    if (t.includes('signature')) return 'signature';
    if (t.includes('date')) return 'date';
    if (t.includes('email')) return 'email';
    if (t === 'pseudo-header' || t === 'pseudo header' || t.includes('pseudo-header') || t.includes('pseudo header') || t.includes('boundary')) return 'pseudo-header';
    return 'text';
  };

  const initializeAnswers = (surveyData) => {
    const initialAnswers = {};
    (surveyData.questions || []).forEach(q => {
      initialAnswers[q._id || q.id] = '';
    });
    return initialAnswers;
  };

  const getHeaderIndices = (qs) => {
    if (!qs) return [];
    const indices = [];
    let inHeader = false;
    qs.forEach((q, idx) => {
      const type = (q.type || '').toLowerCase();
      // Boundary toggle logic
      if (type === 'pseudo-header' || type.includes('pseudo header')) {
        inHeader = !inHeader;
      } else if (inHeader) {
        indices.push(idx);
      }
    });
    return indices;
  };

  const getDisplayQuestions = (qs) => {
    if (!qs) return [];
    return qs.map((q, idx) => ({ ...q, originalIndex: idx }))
      .filter(q => {
        const type = (q.type || '').toLowerCase();
        // Filter out pseudo-headers
        if (type === 'pseudo-header' || type.includes('pseudo header') || type.includes('boundary')) return false;
        // Explicit hide
        if (q.displayInSurvey === false) return false;
        return true;
      });
  };

  const setupBatchAndAnswers = (surveyData, initialAnswers) => {
    const headerIndices = getHeaderIndices(surveyData.questions);
    const isPseudoSetup = headerIndices.length > 0;

    // Fallback to standard 3-question logic if no pseudo-header exists
    const isStandardBatch = !isPseudoSetup && surveyData.questions && surveyData.questions.length >= 4 &&
      surveyData.questions[0].question.toLowerCase().includes('parliament');

    const existingBatch = localStorage.getItem(`ward_batch_${surveyId}`);

    if (existingBatch) {
      try {
        const batch = JSON.parse(existingBatch);
        if (batch.count <= batch.limit) {
          setIsHeaderLocked(true);
          setWardBatch(batch);

          // Re-fill answers from batch
          const newAnswers = { ...initialAnswers };
          if (isPseudoSetup) {
            Object.assign(newAnswers, batch.headerAnswers || {});
          } else if (isStandardBatch) {
            newAnswers[surveyData.questions[0]._id || surveyData.questions[0].id] = batch.parliament;
            newAnswers[surveyData.questions[1]._id || surveyData.questions[1].id] = batch.municipality;
            newAnswers[surveyData.questions[2]._id || surveyData.questions[2].id] = batch.ward_num;
          }
          setAnswers(newAnswers);

          if (batch.parliament) {
            fetchMunis(batch.parliament);
          }
          return;
        }
      } catch (err) {
        console.warn('Failed to load batch:', err);
      }
    }

    if (isPseudoSetup || isStandardBatch) {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      setIsHeaderLocked(false);

      const newBatch = {
        parliament: storedUser.district || '',
        municipality: storedUser.municipality || '',
        ward_num: '',
        limit: 3,
        count: 1,
        headerAnswers: {}
      };

      if (isPseudoSetup) {
        headerIndices.forEach(idx => {
          const qId = surveyData.questions[idx]._id || surveyData.questions[idx].id;
          newBatch.headerAnswers[qId] = '';
        });
      }

      setWardBatch(newBatch);
      setAnswers(initialAnswers);
    } else {
      setIsHeaderLocked(true);
      setAnswers(initialAnswers);
    }
  };

  const startBatch = () => {
    const headerIndices = getHeaderIndices(survey?.questions);
    const isPseudo = headerIndices.length > 0;

    if (!isPseudo && (!wardBatch.parliament || !wardBatch.municipality || !wardBatch.ward_num)) {
      alert("Please select and enter all location details first.");
      return;
    }

    if (isPseudo) {
      // Check if all header answers are filled
      const missing = headerIndices.some(idx => {
        const qId = survey.questions[idx]._id || survey.questions[idx].id;
        return !answers[qId];
      });
      if (missing) {
        alert("Please fill all header questions before starting.");
        return;
      }
    }

    // Sync wardBatch with current answers for pseudo mode
    const finalBatch = { ...wardBatch };
    if (isPseudo) {
      finalBatch.headerAnswers = {};
      headerIndices.forEach(idx => {
        const qId = survey.questions[idx]._id || survey.questions[idx].id;
        finalBatch.headerAnswers[qId] = answers[qId];
      });
    }

    localStorage.setItem(`ward_batch_${surveyId}`, JSON.stringify(finalBatch));
    setIsHeaderLocked(true);

    if (!isPseudo) {
      const q1Id = survey?.questions?.[0]?._id || survey?.questions?.[0]?.id;
      const q2Id = survey?.questions?.[1]?._id || survey?.questions?.[1]?.id;
      const q3Id = survey?.questions?.[2]?._id || survey?.questions?.[2]?.id;

      setAnswers(prev => ({
        ...prev,
        [q1Id]: wardBatch.parliament,
        [q2Id]: wardBatch.municipality,
        [q3Id]: wardBatch.ward_num
      }));
    }
  };

  const updateBatchLimit = (newLimit) => {
    const updatedBatch = { ...wardBatch, limit: newLimit };
    setWardBatch(updatedBatch);
    localStorage.setItem(`ward_batch_${surveyId}`, JSON.stringify(updatedBatch));
  };

  const handleAnswerChange = (questionId, value) => {
    const qIndex = survey?.questions?.findIndex(q => (q._id || q.id) === questionId);
    if (qIndex === -1) return;

    const q = survey.questions[qIndex];
    const headerIndices = getHeaderIndices(survey.questions);
    const isPseudo = headerIndices.length > 0;
    const isStandard = !isPseudo && survey?.questions?.length >= 4 &&
      survey?.questions?.[0]?.question?.toLowerCase().includes('parliament') &&
      survey?.questions?.[1]?.question?.toLowerCase().includes('municipality');

    // Only lock if it's actually part of the header block and we are locked
    if (isHeaderLocked) {
      if (isPseudo && headerIndices.includes(qIndex)) return;
      if (isStandard && qIndex < 3) return;
    }

    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    // Auto-fetch municipalities if this is a Parliament dropdown
    if (q.question.toLowerCase().includes('parliament') && value) {
      fetchMunis(value);
    }

    // Auto-submit if it's the question immediately following the standard 3-question header
    if (isStandard && qIndex === 3) {
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
        setHasSubmitted(true);
        setIsReorderEnabled(false);
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
        setHasSubmitted(true);
        setIsReorderEnabled(false);
        alert('Survey saved locally (Offline). It will be synced when internet is restored.');

        // RE-INITIALIZE with locked values
        const freshAnswers = initializeAnswers(survey);
        const activeBatch = localStorage.getItem(`ward_batch_${surveyId}`);
        if (activeBatch) {
          const batch = JSON.parse(activeBatch);
          const headerIndices = getHeaderIndices(survey.questions);
          const isPseudo = headerIndices.length > 0;

          if (isPseudo) {
            setAnswers({
              ...freshAnswers,
              ...(batch.headerAnswers || {})
            });
          } else {
            const q1Id = survey?.questions?.[0]?._id || survey?.questions?.[0]?.id;
            const q2Id = survey?.questions?.[1]?._id || survey?.questions?.[1]?.id;
            const q3Id = survey?.questions?.[2]?._id || survey?.questions?.[2]?.id;
            setAnswers({
              ...freshAnswers,
              [q1Id]: batch.parliament,
              [q2Id]: batch.municipality,
              [q3Id]: batch.ward_num
            });
          }
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
    const headerIndices = getHeaderIndices(survey?.questions);
    const isPseudo = headerIndices.length > 0;
    const isStandard = !isPseudo && survey?.questions?.length >= 4 &&
      survey?.questions?.[0]?.question?.toLowerCase().includes('parliament') &&
      survey?.questions?.[1]?.question?.toLowerCase().includes('municipality');

    const isDisabled = isHeaderLocked && (
      (isPseudo && headerIndices.includes(index)) ||
      (isStandard && index < 3)
    );
    const value = answers[qId] || '';

    if (question.type === 'text-block') {
      return (
        <div className="text-block-content" dangerouslySetInnerHTML={{ __html: question.description }}></div>
      );
    }

    if (question.type === 'dropdown') {
      const opts = Array.isArray(question.options) ? question.options : [];
      return (
        <div style={{ display: 'flex', flexDirection: question.orientation === 'Horizontal' ? 'row' : 'column', gap: '8px' }}>
          <select value={value} onChange={(e) => handleAnswerChange(qId, e.target.value)} disabled={isDisabled} className="answer-select" style={{ flex: 1 }}>
            <option value="">Select an option</option>
            {opts.map((opt, i) => {
              const label = typeof opt === 'object' ? (opt.label || opt.value) : opt;
              const val = typeof opt === 'object' ? (opt.value || opt.label) : opt;
              return <option key={i} value={val}>{label}</option>;
            })}
          </select>
        </div>
      );
    }

    if (question.type === 'radio-grid' || question.type === 'checkbox-grid') {
      const rows = question.rowOptions || [];
      const cols = question.columnOptions || [];
      const isCheckbox = question.type === 'checkbox-grid';

      return (
        <div className="radio-grid-container" style={{ overflowX: 'auto', marginBottom: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
            <thead>
              <tr style={{ background: '#f8f9ff' }}>
                <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', color: '#374151', fontSize: '13px', fontWeight: '600' }}>Question</th>
                {cols.map((col, i) => (
                  <th key={i} style={{ padding: '12px 10px', textAlign: 'center', borderBottom: '2px solid #e5e7eb', color: '#374151', fontSize: '12px', fontWeight: '600' }}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#fcfcfd' }}>
                  <td style={{ padding: '12px 15px', borderBottom: '1px solid #f3f4f6', fontSize: '14px', color: '#1f2937' }}>{row.label}</td>
                  {cols.map((col, j) => {
                    const gridQId = `${qId}_${i}`;
                    const gridCellId = `${qId}_${i}_${j}`;
                    const currentValue = answers[gridQId] || '';
                    const isChecked = isCheckbox
                      ? (Array.isArray(currentValue) ? currentValue.includes(col.value || col.label) : currentValue === (col.value || col.label))
                      : currentValue === (col.value || col.label);

                    const isCheckboxWithText = question.originalType === 'Checkbox with Text';
                    const isCheckboxWithOther = question.originalType === 'Checkbox Grid with Other';
                    const showTextInput = (isCheckboxWithText || (isCheckboxWithOther && (col.label === 'Other' || col.value === 'Other'))) && isChecked;

                    return (
                      <td key={j} style={{ padding: '12px 10px', textAlign: 'center', borderBottom: '1px solid #f3f4f6' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                          <input
                            type={isCheckbox ? "checkbox" : "radio"}
                            name={`grid-${qId}-${i}`}
                            checked={isChecked}
                            onChange={() => {
                              if (isCheckbox) {
                                let newArr = Array.isArray(currentValue) ? [...currentValue] : (currentValue ? [currentValue] : []);
                                if (newArr.includes(col.value || col.label)) {
                                  newArr = newArr.filter(v => v !== (col.value || col.label));
                                } else {
                                  newArr.push(col.value || col.label);
                                }
                                handleAnswerChange(gridQId, newArr);
                              } else {
                                handleAnswerChange(gridQId, col.value || col.label);
                              }
                            }}
                            style={{
                              cursor: 'pointer',
                              width: '18px',
                              height: '18px',
                              accentColor: '#6366f1'
                            }}
                          />
                          {showTextInput && (
                            <input
                              type="text"
                              placeholder="Please specify..."
                              value={answers[`${gridCellId}_text`] || ''}
                              onChange={(e) => handleAnswerChange(`${gridCellId}_text`, e.target.value)}
                              disabled={isDisabled}
                              style={{ width: '100%', padding: '4px', fontSize: '11px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                            />
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    if (question.type === 'number-grid') {
      const rows = question.rowOptions || [];
      const cols = question.columnOptions || [];

      return (
        <div className="number-grid-container" style={{ overflowX: 'auto', marginBottom: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
            <thead>
              <tr style={{ background: '#f8f9ff' }}>
                <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', color: '#374151', fontSize: '13px', fontWeight: '600' }}>Question</th>
                {cols.map((col, i) => (
                  <th key={i} style={{ padding: '12px 10px', textAlign: 'center', borderBottom: '2px solid #e5e7eb', color: '#374151', fontSize: '12px', fontWeight: '600' }}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#fcfcfd' }}>
                  <td style={{ padding: '12px 15px', borderBottom: '1px solid #f3f4f6', fontSize: '14px', color: '#1f2937' }}>{row.label}</td>
                  {cols.map((col, j) => {
                    const gridCellId = `${qId}_${i}_${j}`;
                    const currentValue = answers[gridCellId] || '';
                    return (
                      <td key={j} style={{ padding: '8px 10px', textAlign: 'center', borderBottom: '1px solid #f3f4f6' }}>
                        <input
                          type="number"
                          placeholder="0"
                          value={currentValue}
                          step={question.precision ? (1 / Math.pow(10, parseInt(question.precision))).toString() : "any"}
                          min={question.limitFrom}
                          max={question.limitTo}
                          onChange={(e) => handleAnswerChange(gridCellId, e.target.value)}
                          disabled={isDisabled}
                          className="answer-input"
                          style={{
                            width: '100%',
                            maxWidth: '100px',
                            textAlign: 'center',
                            padding: '6px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '13px'
                          }}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    if (question.type === 'text-grid') {
      const rows = question.rowOptions || [];
      const cols = question.columnOptions || [];

      return (
        <div className="text-grid-container" style={{ overflowX: 'auto', marginBottom: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
            <thead>
              <tr style={{ background: '#f8f9ff' }}>
                <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', color: '#374151', fontSize: '13px', fontWeight: '600' }}>Question</th>
                {cols.map((col, i) => (
                  <th key={i} style={{ padding: '12px 10px', textAlign: 'center', borderBottom: '2px solid #e5e7eb', color: '#374151', fontSize: '12px', fontWeight: '600' }}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#fcfcfd' }}>
                  <td style={{ padding: '12px 15px', borderBottom: '1px solid #f3f4f6', fontSize: '14px', color: '#1f2937' }}>{row.label}</td>
                  {cols.map((col, j) => {
                    const gridCellId = `${qId}_${i}_${j}`;
                    const currentValue = answers[gridCellId] || '';
                    return (
                      <td key={j} style={{ padding: '8px 10px', textAlign: 'center', borderBottom: '1px solid #f3f4f6' }}>
                        <input
                          type="text"
                          placeholder="Type here..."
                          value={currentValue}
                          onChange={(e) => handleAnswerChange(gridCellId, e.target.value)}
                          disabled={isDisabled}
                          className="answer-input"
                          style={{
                            width: '100%',
                            maxWidth: '150px',
                            textAlign: 'left',
                            padding: '6px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '13px'
                          }}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    if (question.type === 'nps-grid') {
      const rows = question.rowOptions || [];
      const npsScale = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      return (
        <div className="nps-grid-container" style={{ overflowX: 'auto', marginBottom: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr style={{ background: '#f8f9ff' }}>
                <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', color: '#374151', fontSize: '13px', fontWeight: '600' }}>Question</th>
                {npsScale.map((num) => (
                  <th key={num} style={{ padding: '12px 5px', textAlign: 'center', borderBottom: '2px solid #e5e7eb', color: '#374151', fontSize: '11px', fontWeight: '600' }}>{num}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#fcfcfd' }}>
                  <td style={{ padding: '12px 15px', borderBottom: '1px solid #f3f4f6', fontSize: '14px', color: '#1f2937' }}>{row.label}</td>
                  {npsScale.map((num) => {
                    const gridCellId = `${qId}_${i}`;
                    const isSelected = answers[gridCellId] === num.toString();
                    return (
                      <td key={num} style={{ padding: '10px 5px', textAlign: 'center', borderBottom: '1px solid #f3f4f6' }}>
                        <div
                          onClick={() => !isDisabled && handleAnswerChange(gridCellId, num.toString())}
                          style={{
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            border: `1px solid ${isSelected ? '#4f46e5' : '#d1d5db'}`,
                            background: isSelected ? '#4f46e5' : 'transparent',
                            color: isSelected ? 'white' : '#4b5563',
                            fontSize: '12px',
                            fontWeight: isSelected ? '600' : '400',
                            cursor: isDisabled ? 'default' : 'pointer',
                            transition: 'all 0.2s ease',
                            margin: '0 auto'
                          }}
                        >
                          {num}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 15px', background: '#fcfcfd', fontSize: '12px', color: '#6b7280', borderTop: '1px solid #f3f4f6' }}>
            <span>Not likely</span>
            <span>Very likely</span>
          </div>
        </div>
      );
    }

    if (question.type === 'dropdown-grid') {
      const rows = question.rowOptions || [];
      const cols = question.columnOptions || [];
      const opts = question.options || [];
      const isOtherGrid = question.originalType === 'Dropdown with Other Grid';

      return (
        <div className="dropdown-grid-container" style={{ overflowX: 'auto', marginBottom: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
            <thead>
              <tr style={{ background: '#f8f9ff' }}>
                <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', color: '#374151', fontSize: '13px', fontWeight: '600' }}>Question</th>
                {cols.map((col, i) => (
                  <th key={i} style={{ padding: '12px 10px', textAlign: 'center', borderBottom: '2px solid #e5e7eb', color: '#374151', fontSize: '12px', fontWeight: '600' }}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#fcfcfd' }}>
                  <td style={{ padding: '12px 15px', borderBottom: '1px solid #f3f4f6', fontSize: '14px', color: '#1f2937' }}>{row.label}</td>
                  {cols.map((col, j) => {
                    const gridCellId = `${qId}_${i}_${j}`;
                    const currentValue = answers[gridCellId] || '';
                    const showOtherInput = isOtherGrid && (currentValue === 'Other' || currentValue.toLowerCase() === 'other');

                    return (
                      <td key={j} style={{ padding: '12px 10px', textAlign: 'center', borderBottom: '1px solid #f3f4f6' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <select
                            value={currentValue}
                            onChange={(e) => handleAnswerChange(gridCellId, e.target.value)}
                            disabled={isDisabled}
                            className="answer-select"
                            style={{ width: '100%', padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }}
                          >
                            <option value="">Select</option>
                            {opts.map((opt, k) => {
                              const label = typeof opt === 'object' ? (opt.label || opt.value) : opt;
                              const val = typeof opt === 'object' ? (opt.value || opt.label) : opt;
                              return <option key={k} value={val}>{label}</option>;
                            })}
                            {isOtherGrid && <option value="Other">Other</option>}
                          </select>
                          {showOtherInput && (
                            <input
                              type="text"
                              placeholder="Please specify..."
                              value={answers[`${gridCellId}_other`] || ''}
                              onChange={(e) => handleAnswerChange(`${gridCellId}_other`, e.target.value)}
                              disabled={isDisabled}
                              style={{ padding: '4px 8px', fontSize: '11px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                            />
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    if (question.type === 'ranking') {
      const rawOpts = (question.rowOptions && question.rowOptions.length > 0) ? question.rowOptions : (question.options || []);
      const items = Array.isArray(rawOpts) ? rawOpts : (typeof rawOpts === 'string' ? rawOpts.split('\n').filter(o => o.trim()).map(o => ({ label: o.trim(), value: o.trim() })) : []);
      const currentRanking = Array.isArray(answers[qId]) ? answers[qId] : [];

      const handleRankingToggle = (optLabel) => {
        let newRanking = [...currentRanking];
        if (newRanking.includes(optLabel)) {
          newRanking = newRanking.filter(item => item !== optLabel);
        } else {
          const max = parseInt(question.limitTo) || Infinity;
          if (newRanking.length < max) {
            newRanking.push(optLabel);
          } else {
            return;
          }
        }
        handleAnswerChange(qId, newRanking);
      };

      return (
        <div className="ranking-container" style={{ padding: '5px 0' }}>
          <div className="ranking-options" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {items.map((opt, i) => {
              const label = typeof opt === 'object' ? (opt.label || opt.value) : opt;
              const val = typeof opt === 'object' ? (opt.value || opt.label) : opt;
              const rank = currentRanking.indexOf(label) + 1;
              const isSelected = rank > 0;
              const imageUrl = question.optionMedia?.[label];

              return (
                <div
                  key={i}
                  onClick={() => !isDisabled && handleRankingToggle(label)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 15px',
                    background: isSelected ? '#f5f7ff' : '#fcfcfd',
                    border: `1px solid ${isSelected ? '#4f46e5' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    cursor: isDisabled ? 'default' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: `1px solid ${isSelected ? '#4f46e5' : '#d1d5db'}`,
                    background: isSelected ? '#4f46e5' : 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '15px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: isSelected ? 'white' : '#6b7280',
                    flexShrink: 0
                  }}>
                    {isSelected ? rank : ''}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                    {imageUrl && <img src={imageUrl} alt="" style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '4px' }} />}
                    <span style={{ fontSize: '14px', color: '#1f2937', fontWeight: isSelected ? '500' : '400' }}>{label}</span>
                  </div>
                </div>
              );
            })}
          </div>
          {question.limitTo && (
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '10px' }}>
              Select up to {question.limitTo} options in order of preference.
            </div>
          )}
        </div>
      );
    }
    if (question.type === 'cascade') {
      const cascadeLevelsSelection = answers[qId] || []; // Store as array of selected values
      const handleCascadeChange = (level, value) => {
        const newLevels = [...cascadeLevelsSelection];
        newLevels[level] = value;
        newLevels.splice(level + 1);
        handleAnswerChange(qId, newLevels);
      };

      const levelsConfig = question.cascadeLevels && question.cascadeLevels.length > 0
        ? question.cascadeLevels
        : [
          { label: 'Select Parliament', options: ['Chevella', 'Malkajgiri'] },
          { label: 'Select Assembly', options: ['Chevella', 'Maheshwaram'] },
          { label: 'Select Mandal', options: ['Mandal 1', 'Mandal 2'] }
        ];

      const isHorizontal = question.orientation === 'Horizontal';

      return (
        <div
          className="cascade-render-container"
          style={{
            display: 'flex',
            flexDirection: isHorizontal ? 'row' : 'column',
            flexWrap: 'wrap',
            gap: '15px',
            alignItems: 'flex-start',
            width: '100%'
          }}
        >
          {levelsConfig.map((lvl, idx) => {
            // Only show level if it's the first one OR the previous level has a selection
            if (idx > 0 && !cascadeLevelsSelection[idx - 1]) return null;

            let options = [];
            if (idx === 0) {
              if (lvl.options && lvl.options.length > 0) {
                options = lvl.options;
              } else if (question.options && question.options.length > 0) {
                options = question.options.map(o => o.label || o);
              } else if (lvl.label.toLowerCase().includes('parliament') || lvl.label.toLowerCase().includes('district')) {
                // Fallback to global parliaments if file is empty
                options = parliaments;
              }
            } else {
              const parentValue = cascadeLevelsSelection[idx - 1];
              options = lvl.parentMap?.[parentValue] || [];

              // If empty and it's Level 2 for Parliament, maybe fallback to municipalities?
              if (options.length === 0 && (lvl.label.toLowerCase().includes('assembly') || lvl.label.toLowerCase().includes('muni'))) {
                options = municipalities;
              }
            }

            // Final fallback to avoid empty selects
            if (options.length === 0) options = [];

            return (
              <div key={idx} className="cascade-level" style={{ flex: isHorizontal ? '1 1 180px' : 'none', minWidth: isHorizontal ? '150px' : 'auto', maxWidth: isHorizontal ? '250px' : 'none' }}>
                <label style={{ display: 'block', fontSize: '13px', borderBottom: isHorizontal ? 'none' : 'none', color: '#666', marginBottom: '5px' }}>{lvl.label}</label>
                {question.cascadeQuestionType === 'Radio' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {options.length === 0 ? <span style={{ fontSize: '12px', color: '#999' }}>No options available</span> : options.map(opt => (
                      <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                        <input
                          type="radio"
                          name={`${qId}_level_${idx}`}
                          checked={cascadeLevelsSelection[idx] === opt}
                          onChange={() => !isDisabled && handleCascadeChange(idx, opt)}
                          disabled={isDisabled}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                ) : (
                  <select
                    value={cascadeLevelsSelection[idx] || ''}
                    onChange={(e) => handleCascadeChange(idx, e.target.value)}
                    disabled={isDisabled}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                  >
                    <option value="">{lvl.label}</option>
                    {options.map((opt, i) => (
                      <option key={i} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    if (question.type === 'nsec') {
      const householdItems = typeof question.rowOptions === 'string' ? question.rowOptions.split('\n').filter(o => o.trim()) : [];
      const educationOptions = typeof question.options === 'string' ? question.options.split('\n').filter(o => o.trim()) : [];

      const householdAnswers = answers[`${qId}_household`] || [];
      const agriAnswer = answers[`${qId}_agri`] || '';
      const eduAnswer = answers[`${qId}_edu`] || '';

      const handleHouseholdToggle = (item) => {
        let newArr = [...householdAnswers];
        if (newArr.includes(item)) {
          newArr = newArr.filter(i => i !== item);
        } else {
          newArr.push(item);
        }
        handleAnswerChange(`${qId}_household`, newArr);
      };

      return (
        <div className="nsec-render-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Household Items Section */}
          <div className="nsec-sub-section">
            <h4 style={{ fontSize: '15px', color: '#374151', marginBottom: '10px', fontWeight: '600' }}>{question.nsecHouseholdTitle || 'Household Items'}</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
              {householdItems.map((item, idx) => (
                <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px' }}>
                  <input
                    type="checkbox"
                    checked={householdAnswers.includes(item)}
                    onChange={() => !isDisabled && handleHouseholdToggle(item)}
                    disabled={isDisabled}
                    style={{ accentColor: '#4f46e5' }}
                  />
                  {item}
                </label>
              ))}
            </div>
          </div>

          {/* Agricultural Land Section */}
          <div className="nsec-sub-section" style={{ borderTop: '1px solid #eee', paddingTop: '15px' }}>
            <h4 style={{ fontSize: '15px', color: '#374151', marginBottom: '10px', fontWeight: '600' }}>{question.nsecAgricultureTitle || 'Agricultural Land'}</h4>
            <div style={{ display: 'flex', gap: '20px' }}>
              {['Yes', 'No'].map((opt) => (
                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                  <input
                    type="radio"
                    name={`${qId}_agri`}
                    checked={agriAnswer === opt}
                    onChange={() => !isDisabled && handleAnswerChange(`${qId}_agri`, opt)}
                    disabled={isDisabled}
                    style={{ accentColor: '#4f46e5' }}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          {/* Education Section */}
          <div className="nsec-sub-section" style={{ borderTop: '1px solid #eee', paddingTop: '15px' }}>
            <h4 style={{ fontSize: '15px', color: '#374151', marginBottom: '10px', fontWeight: '600' }}>{question.nsecEducationTitle || 'Education'}</h4>
            <select
              value={eduAnswer}
              onChange={(e) => handleAnswerChange(`${qId}_edu`, e.target.value)}
              disabled={isDisabled}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
            >
              <option value="">Select Education</option>
              {educationOptions.map((opt, idx) => (
                <option key={idx} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>
      );
    }

    if (question.type === 'rural sec') {
      const wallOptions = typeof question.ruralWallOptions === 'string' ? question.ruralWallOptions.split('\n').filter(o => o.trim()) : [];
      const roofOptions = typeof question.ruralRoofOptions === 'string' ? question.ruralRoofOptions.split('\n').filter(o => o.trim()) : [];
      const educationOptions = typeof question.options === 'string' ? question.options.split('\n').filter(o => o.trim()) : [];

      const wallAnswer = answers[`${qId}_wall`] || '';
      const roofAnswer = answers[`${qId}_roof`] || '';
      const eduAnswer = answers[`${qId}_edu`] || '';

      return (
        <div className="rural-sec-render-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* House Wall Material Section */}
          <div className="rural-sec-sub-section">
            <h4 style={{ fontSize: '15px', color: '#374151', marginBottom: '10px', fontWeight: '600' }}>{question.ruralWallTitle || 'House Wall Material'}</h4>
            <select
              value={wallAnswer}
              onChange={(e) => handleAnswerChange(`${qId}_wall`, e.target.value)}
              disabled={isDisabled}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
            >
              <option value="">Select Wall Material</option>
              {wallOptions.map((opt, idx) => (
                <option key={idx} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* House Roof Material Section */}
          <div className="rural-sec-sub-section" style={{ borderTop: '1px solid #eee', paddingTop: '15px' }}>
            <h4 style={{ fontSize: '15px', color: '#374151', marginBottom: '10px', fontWeight: '600' }}>{question.ruralRoofTitle || 'House Roof Material'}</h4>
            <select
              value={roofAnswer}
              onChange={(e) => handleAnswerChange(`${qId}_roof`, e.target.value)}
              disabled={isDisabled}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
            >
              <option value="">Select Roof Material</option>
              {roofOptions.map((opt, idx) => (
                <option key={idx} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Education Section */}
          <div className="rural-sec-sub-section" style={{ borderTop: '1px solid #eee', paddingTop: '15px' }}>
            <h4 style={{ fontSize: '15px', color: '#374151', marginBottom: '10px', fontWeight: '600' }}>{question.ruralEducationTitle || 'Education'}</h4>
            <select
              value={eduAnswer}
              onChange={(e) => handleAnswerChange(`${qId}_edu`, e.target.value)}
              disabled={isDisabled}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
            >
              <option value="">Select Education</option>
              {educationOptions.map((opt, idx) => (
                <option key={idx} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>
      );
    }

    if (question.type === 'sec') {
      const occupationOptions = typeof question.rowOptions === 'string' ? question.rowOptions.split('\n').filter(o => o.trim()) : [];
      const educationOptions = typeof question.options === 'string' ? question.options.split('\n').filter(o => o.trim()) : [];

      const occAnswer = answers[`${qId}_occ`] || '';
      const eduAnswer = answers[`${qId}_edu`] || '';

      return (
        <div className="sec-render-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Occupation Section */}
          <div className="sec-sub-section">
            <h4 style={{ fontSize: '15px', color: '#374151', marginBottom: '10px', fontWeight: '600' }}>{question.secOccupationTitle || 'Occupation'}</h4>
            <select
              value={occAnswer}
              onChange={(e) => handleAnswerChange(`${qId}_occ`, e.target.value)}
              disabled={isDisabled}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
            >
              <option value="">Select Occupation</option>
              {occupationOptions.map((opt, idx) => (
                <option key={idx} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Education Section */}
          <div className="sec-sub-section" style={{ borderTop: '1px solid #eee', paddingTop: '15px' }}>
            <h4 style={{ fontSize: '15px', color: '#374151', marginBottom: '10px', fontWeight: '600' }}>{question.secEducationTitle || 'Education'}</h4>
            <select
              value={eduAnswer}
              onChange={(e) => handleAnswerChange(`${qId}_edu`, e.target.value)}
              disabled={isDisabled}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
            >
              <option value="">Select Education</option>
              {educationOptions.map((opt, idx) => (
                <option key={idx} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>
      );
    }

    if (question.type === 'radio-with-text') {
      const columns = parseInt(question.numColumns) || 1;
      const opts = Array.isArray(question.options) ? question.options : [];

      return (
        <div className="options-container" style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: '15px'
        }}>
          {opts.map((opt, i) => {
            const label = typeof opt === 'object' ? (opt.label || opt.value) : opt;
            const val = typeof opt === 'object' ? (opt.value || opt.label) : opt;
            const imageUrl = question.optionMedia?.[label];
            const isSelected = value === val;

            return (
              <div key={i} className="option-with-text-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: isSelected ? '#f5f7ff' : 'transparent', padding: '8px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <label className="option-label" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', margin: 0 }}>
                  <input
                    type="radio"
                    name={`q-${qId}`}
                    checked={isSelected}
                    onChange={() => handleAnswerChange(qId, val)}
                    disabled={isDisabled}
                    style={{ accentColor: '#3b82f6', cursor: 'pointer', transform: 'scale(1.1)' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                    {imageUrl && <img src={imageUrl} alt="" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />}
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>{label}</span>
                  </div>
                </label>
                <input
                  type="text"
                  placeholder="Please specify..."
                  value={answers[`${qId}_${label}`] || ''}
                  onChange={(e) => handleAnswerChange(`${qId}_${label}`, e.target.value)}
                  disabled={isDisabled}
                  style={{
                    marginLeft: '28px',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '13px',
                    width: 'calc(100% - 28px)',
                    background: isSelected ? 'white' : '#f9fafb',
                    transition: 'all 0.2s'
                  }}
                />
              </div>
            );
          })}
        </div>
      );
    }

    if (question.type === 'radio') {
      const optionImages = {
        "1. బీజేపీ": "/bjp.jpeg",
        "2. కాంగ్రెస్": "/congress.jpeg",
        "3. బిఆర్ఎస్": "/brs.jpeg",
        "4. ఇతరులు": "/others.jpeg"
      };

      const isHorizontal = question.orientation === 'Horizontal';
      const columns = parseInt(question.numColumns) || 1;
      const opts = Array.isArray(question.options) ? question.options : [];

      return (
        <div className="options-container" style={isHorizontal ? {
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px'
        } : {
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: '10px'
        }}>
          {opts.map((opt, i) => {
            const label = typeof opt === 'object' ? (opt.label || opt.value) : opt;
            const val = typeof opt === 'object' ? (opt.value || opt.label) : opt;
            const imageUrl = question.optionMedia?.[label] || optionImages[label];
            const isSelected = value === val;

            return (
              <label key={i} className="option-label" style={{
                background: isSelected ? '#eff6ff' : 'white',
                borderColor: isSelected ? '#3b82f6' : '#e5e7eb',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                padding: '10px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                ...(isHorizontal ? { flexShrink: 0 } : {})
              }}>
                <input
                  type="radio"
                  name={`q-${qId}`}
                  checked={isSelected}
                  onChange={() => handleAnswerChange(qId, val)}
                  disabled={isDisabled}
                  style={{ accentColor: '#3b82f6', transform: 'scale(1.2)' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                  {imageUrl && <img src={imageUrl} alt="" className="option-media-img" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />}
                  <span style={{ fontSize: '13px', fontWeight: isSelected ? '700' : '500', color: '#1f2937' }}>{label}</span>
                </div>
              </label>
            );
          })}
        </div>
      );
    }

    if (question.type === 'checkbox') {
      const isHorizontal = question.orientation === 'Horizontal';
      const columns = parseInt(question.numColumns) || 1;
      const opts = Array.isArray(question.options) ? question.options : [];
      const currentValues = Array.isArray(value) ? value : (value ? [value] : []);

      const handleCheckboxToggle = (val) => {
        let newArr = [...currentValues];
        if (newArr.includes(val)) {
          newArr = newArr.filter(v => v !== val);
        } else {
          newArr.push(val);
        }
        handleAnswerChange(qId, newArr);
      };

      return (
        <div className="options-container" style={isHorizontal ? {
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px'
        } : {
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: '10px'
        }}>
          {opts.map((opt, i) => {
            const label = typeof opt === 'object' ? (opt.label || opt.value) : opt;
            const val = typeof opt === 'object' ? (opt.value || opt.label) : opt;
            const imageUrl = question.optionMedia?.[label];
            const isChecked = currentValues.includes(val);

            return (
              <label key={i} className="option-label" style={{
                background: isChecked ? '#eff6ff' : 'white',
                borderColor: isChecked ? '#3b82f6' : '#e5e7eb',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                padding: '10px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                ...(isHorizontal ? { flexShrink: 0 } : {})
              }}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleCheckboxToggle(val)}
                  disabled={isDisabled}
                  style={{ accentColor: '#3b82f6', transform: 'scale(1.2)' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                  {imageUrl && <img src={imageUrl} alt="" className="option-media-img" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />}
                  <span style={{ fontSize: '13px', fontWeight: isChecked ? '700' : '500', color: '#1f2937' }}>{label}</span>
                </div>
              </label>
            );
          })}
        </div>
      );
    }


    if (question.type === 'Photo Capture' || question.type === 'photo') {
      const fileInputRef = useRef(null);

      return (
        <div className="photo-capture-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {!value && (
            <div className="camera-btn-wrapper">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      handleAnswerChange(qId, reader.result);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="btn-camera"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#f3f4f6',
                  border: '2px dashed #d1d5db',
                  borderRadius: '8px',
                  padding: '20px',
                  width: '100%',
                  cursor: 'pointer',
                  justifyContent: 'center',
                  color: '#4b5563'
                }}
              >
                <span style={{ fontSize: '24px' }}>📷</span>
                <span style={{ fontWeight: '500' }}>Tap to Take Photo</span>
              </button>
            </div>
          )}

          {value && (
            <div className="photo-preview" style={{ position: 'relative', width: 'fit-content' }}>
              <img
                src={value}
                alt="Captured"
                style={{
                  maxWidth: '100%',
                  maxHeight: '300px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <button
                type="button"
                onClick={() => handleAnswerChange(qId, '')}
                style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '-10px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                ×
              </button>
            </div>
          )}
        </div>
      );
    }

    if (question.type === 'video') {
      const videoInputRef = useRef(null);
      return (
        <div className="video-capture-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {!value && (
            <div className="camera-btn-wrapper">
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                capture="camcorder"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      handleAnswerChange(qId, reader.result);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="btn-camera"
                onClick={() => videoInputRef.current?.click()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#f3f4f6',
                  border: '2px dashed #d1d5db',
                  borderRadius: '8px',
                  padding: '20px',
                  width: '100%',
                  cursor: 'pointer',
                  justifyContent: 'center',
                  color: '#4b5563'
                }}
              >
                <span style={{ fontSize: '24px' }}>📹</span>
                <span style={{ fontWeight: '500' }}>Tap to Record Video</span>
              </button>
            </div>
          )}

          {value && (
            <div className="video-preview" style={{ position: 'relative', width: 'fit-content' }}>
              <video
                src={value}
                controls
                style={{
                  maxWidth: '100%',
                  maxHeight: '300px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <button
                type="button"
                onClick={() => handleAnswerChange(qId, '')}
                style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '-10px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                ×
              </button>
            </div>
          )}
        </div>
      );
    }

    if (question.type === 'audio') {
      const audioInputRef = useRef(null);
      return (
        <div className="audio-capture-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {!value && (
            <div className="camera-btn-wrapper">
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                capture="microphone"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      handleAnswerChange(qId, reader.result);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="btn-camera"
                onClick={() => audioInputRef.current?.click()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#f3f4f6',
                  border: '2px dashed #d1d5db',
                  borderRadius: '8px',
                  padding: '20px',
                  width: '100%',
                  cursor: 'pointer',
                  justifyContent: 'center',
                  color: '#4b5563'
                }}
              >
                <span style={{ fontSize: '24px' }}>🎙️</span>
                <span style={{ fontWeight: '500' }}>Tap to Record Audio</span>
              </button>
            </div>
          )}

          {value && (
            <div className="audio-preview" style={{ position: 'relative', width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
              <audio
                src={value}
                controls
                style={{ width: '100%' }}
              />
              <button
                type="button"
                onClick={() => handleAnswerChange(qId, '')}
                style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '-10px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                ×
              </button>
            </div>
          )}
        </div>
      );
    }

    if (question.type === 'signature') {
      return (
        <div className="signature-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <SignaturePad
            value={value}
            onChange={(newValue) => handleAnswerChange(qId, newValue)}
          />
        </div>
      );
    }

    if (question.type === 'textarea') {
      return (
        <textarea
          value={value}
          onChange={(e) => handleAnswerChange(qId, e.target.value)}
          disabled={isDisabled}
          className="answer-input"
          placeholder="Enter your response"
          style={{ minHeight: '120px', resize: 'vertical' }}
        />
      );
    }

    if (question.type === 'rating') {
      const maxStars = parseInt(question.ratingLimit) || 5;
      return (
        <div style={{ display: 'flex', gap: '8px', fontSize: '24px' }}>
          {[...Array(maxStars)].map((_, i) => {
            const starValue = i + 1;
            const isActive = value >= starValue;
            return (
              <span
                key={i}
                onClick={() => !isDisabled && handleAnswerChange(qId, starValue)}
                style={{ cursor: isDisabled ? 'default' : 'pointer', color: isActive ? '#fbbf24' : '#d1d5db', transition: 'color 0.1s' }}
              >
                ★
              </span>
            );
          })}
        </div>
      );
    }

    if (question.type === 'number') {
      return (
        <input type="number" value={value} onChange={(e) => handleAnswerChange(qId, e.target.value)} disabled={isDisabled} className="answer-input" placeholder="Enter number" />
      );
    }

    if (question.type === 'email') {
      return (
        <input type="email" value={value} onChange={(e) => handleAnswerChange(qId, e.target.value)} disabled={isDisabled} className="answer-input" placeholder="Enter email" />
      );
    }

    if (question.type === 'date') {
      return (
        <input type="date" value={value} onChange={(e) => handleAnswerChange(qId, e.target.value)} disabled={isDisabled} className="answer-input" />
      );
    }

    if (question.type === 'pseudo-header') {
      return (
        <div style={{ padding: '8px', background: 'rgba(99, 102, 241, 0.05)', border: '1px dashed #6366f1', color: '#6366f1', fontSize: '11px', fontWeight: 'bold', textAlign: 'center', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Boundary Marker
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
      <div className="survey-header-section" style={{ position: 'sticky', top: 0, zIndex: 1000, background: 'white', borderBottom: '1px solid #e5e7eb', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '10px' }}>
          <div className="survey-logo-wrapper" style={{ margin: 0, flex: '0 0 auto' }}>
            <img src={survey?.branding?.logo || logo} alt="Logo" className="survey-logo" style={{ maxHeight: '45px' }} />
          </div>
          <div style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minWidth: '120px' }}>
            <h1 style={{ margin: 0, fontSize: 'clamp(15px, 3.5vw, 19px)', fontWeight: '800', color: '#111827', textAlign: 'center', lineHeight: '1.2' }}>{survey?.title || survey?.name || "MSR SURVEY"}</h1>
            <img src="https://img.icons8.com/color/48/000000/marker.png" alt="Location" style={{ width: '20px', height: '20px' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '0 0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f0fdf4', padding: '4px 12px', borderRadius: '12px', border: '1px solid #dcfce7' }}>
              <img src="https://img.icons8.com/color/48/000000/checklist.png" alt="Responses" style={{ width: '20px', height: '20px' }} />
              <span style={{ fontSize: '18px', fontWeight: '800', color: '#10b981' }}>{responseCount}</span>
            </div>
            <button
              onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}
              className="btn-secondary"
              style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Logout"
            >
              <img src="https://img.icons8.com/material-outlined/32/000000/logout-rounded-left.png" alt="Logout" style={{ width: '24px', height: '24px' }} />
            </button>
          </div>
        </div>

      </div>

      <form onSubmit={handleSubmit} className="survey-form">
        {getDisplayQuestions(survey?.questions).map((q, i) => {
          const isDragging = draggedQuestionIndex === q.originalIndex;

          return (
            <div
              key={q._id || q.id}
              className={`question-block ${isReorderEnabled ? 'reorder-active' : ''}`}
              style={{
                padding: '1rem 2rem',
                marginBottom: '0.5rem',
                cursor: (isReorderEnabled && !hasSubmitted) ? 'move' : 'default',
                border: isReorderEnabled ? '2px dashed #6366f1' : 'none',
                opacity: isDragging ? 0.4 : 1,
                transition: 'all 0.2s ease',
                position: 'relative',
                background: isReorderEnabled ? '#f8f9ff' : 'white',
                flex: isReorderEnabled ? '1 1 45%' : '1 1 100%',
                minWidth: isReorderEnabled ? '300px' : '100%',
                boxSizing: 'border-box'
              }}
              draggable={isReorderEnabled && !hasSubmitted}
              onDragStart={(e) => handleDragStart(e, q.originalIndex)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, q.originalIndex)}
              onDoubleClick={() => {
                if (!hasSubmitted) {
                  if (isReorderEnabled) saveNewOrder();
                  setIsReorderEnabled(!isReorderEnabled);
                }
              }}
            >
              {isReorderEnabled && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 1,
                    cursor: 'move',
                    background: 'transparent'
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (!hasSubmitted) {
                      saveNewOrder();
                      setIsReorderEnabled(false);
                    }
                  }}
                />
              )}
              <div className="question-header" style={{ marginBottom: '0.5rem', position: 'relative', zIndex: 2 }}>
                <span className="question-number" style={{ fontSize: '11px' }}>
                  Question {i + 1}
                </span>
                {isReorderEnabled && (
                  <span style={{ float: 'right', fontSize: '10px', color: '#6366f1' }}>Double-click to save</span>
                )}
              </div>
              <h3 className="question-text" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>{q.question}</h3>

              {q.mediaUrl && (
                <div className="question-media" style={{ marginBottom: '1rem', textAlign: 'center', background: '#f9fafb', padding: '10px', borderRadius: '8px' }}>
                  {q.mediaType === 'Image' && <img src={q.mediaUrl} alt="Question Media" style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px', objectFit: 'contain' }} />}
                  {q.mediaType === 'Video' && <video src={q.mediaUrl} controls style={{ maxWidth: '100%', borderRadius: '8px' }} />}
                  {q.mediaType === 'Audio' && <audio src={q.mediaUrl} controls style={{ width: '100%' }} />}
                </div>
              )}

              {renderQuestion(q, q.originalIndex)}
            </div>
          );
        })}

        <div style={{ padding: '1rem 2rem' }}>
          <button type="submit" className="btn-primary" disabled={submitting} style={{ width: '100%', padding: '1rem', borderRadius: '12px', fontSize: '16px', fontWeight: '700' }}>
            {submitting ? 'Submitting...' : 'Submit Survey'}
          </button>
        </div>

        {submitting && (
          <div style={{ textAlign: 'center', padding: '0.5rem', color: '#6366f1', fontWeight: 'bold' }}>⌛ Submitting...</div>
        )}
      </form>
    </div>
  );
}
