import React, { useState, useEffect, useRef } from 'react';
import Layout from './layout';
import './surveyview.css';
import './Questionnaire.css';
import { useParams, useNavigate } from 'react-router-dom';

const SurveyView = () => {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState({});
  const [showCopyPopup, setShowCopyPopup] = useState(false);
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [showDetailedCreate, setShowDetailedCreate] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [currentSurvey, setCurrentSurvey] = useState(null);
  const [activeTab, setActiveTab] = useState('Standard');
  const [expandedCategories, setExpandedCategories] = useState({
    'Textual': true, 'Input': true, 'Choice': true,
    'Capture': true, 'Matrix/Grid': true, 'Advanced Logic': true
  });
  const [syncOnMobile, setSyncOnMobile] = useState(false);
  const [selectedSurveyId, setSelectedSurveyId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [pages, setPages] = useState([1]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showPageOptions, setShowPageOptions] = useState(false);
  const [showMediaSelector, setShowMediaSelector] = useState(null);

  const welcomeImgRef = useRef(null);
  const thankYouImgRef = useRef(null);

  const [surveys, setSurveys] = useState([
    {
      id: 1,
      name: 'Demo-Pre Election',
      date: '22-Jan-2026',
      type: 'app',
      responses: 0,
      status: 'UnPublished'
    }
  ]);

  const [surveyForm, setSurveyForm] = useState({
    name: '',
    layoutType: 'portrait',
    surveyType: 'app',
    headerText: '',
    theme: 'Default',
    accessPin: '',
    loopSurvey: false,
    pdfShowAnswered: false,
    backgroundLocation: false,
    isLocationMandatory: false,
    thankYouDuration: 20,
    welcomeImageName: '',
    thankYouImageName: ''
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [editingSurveyId, setEditingSurveyId] = useState(null);

  // Cascade Popup State
  const [showCascadePopup, setShowCascadePopup] = useState(false);
  const [cascadeSources, setCascadeSources] = useState(['Select']);
  const [selectedCascadeSource, setSelectedCascadeSource] = useState('Select');
  const [currentCascadeId, setCurrentCascadeId] = useState(null);

  const standardItems = [
    { icon: 'T', label: 'Text Block', isTextIcon: true },
    { icon: '➖', label: 'Singleline Text Input' },
    { icon: '📋', label: 'Multiline Text Input' },
    { icon: '12', label: 'Number Input', isTextIcon: true },
    { icon: '12', label: 'Number with Auto Code', isTextIcon: true },
    { icon: '0.1', label: 'Decimal Input', isTextIcon: true },
    { icon: '✉️', label: 'Email' },
    { icon: '📞', label: 'Phone Number' },
    { icon: '⦿', label: 'Radio Button' },
    { icon: '⦿', label: 'Radio Button with Other' },
    { icon: '⫶', label: 'Drop Down' },
    { icon: '⫶', label: 'Drop Down with Other' },
    { icon: '☑️', label: 'Checkbox List' },
    { icon: '☑️', label: 'Checkbox List with Other' },
    { icon: '🔲', label: '2 Columns Checkbox' },
    { icon: '➀', label: 'Number Point' },
    { icon: '⭐', label: 'Rating' },
    { icon: '📅', label: 'Date' },
    { icon: '🕒', label: 'Time' },
    { icon: '📆', label: 'Date and Time' },
    { icon: '📈', label: 'Net Promoter Score' },
    { icon: '||||', label: 'Barcode Scanner' },
    { icon: '📍', label: 'Map Coordinates (GPS)' },
  ];

  const advanceItems = [
    { icon: '📷', label: 'Photo Capture' },
    { icon: '📹', label: 'Record Video' },
    { icon: '🎙️', label: 'Record Audio' },
    { icon: '✍️', label: 'Signature' },
    { icon: '🔢', label: 'Radio Grid' },
    { icon: '🔢', label: 'Radio Grid with Other' },
    { icon: '🔘', label: 'Radio Button with Text' },
    { icon: '▾', label: 'Dropdown Grid' },
    { icon: '▾', label: 'Dropdown with Other Grid' },
    { icon: '☑️', label: 'Checkbox Grid' },
    { icon: '☑️', label: 'Checkbox Grid with Other' },
    { icon: '☑️', label: 'Checkbox with Text' },
    { icon: '🔢', label: 'Number Grid' },
    { icon: '🔟', label: 'Decimal Grid' },
    { icon: '➖', label: 'Singleline Text Grid' },
    { icon: '📈', label: 'NPS Grid' },
    { icon: '➀', label: 'Number point Grid' },
    { icon: '📊', label: 'Ranking - Checkbox' },
    { icon: '📊', label: 'Ranking' },
    { icon: '📄', label: 'NSEC' },
    { icon: '📄', label: 'SEC' },
    { icon: '📄', label: 'Rural SEC' },
    { icon: '⫶⫶', label: 'Cascade Options' },
    { icon: '100', label: 'Running Total', isTextIcon: true },
    { icon: '0.1', label: 'Formula', isTextIcon: true },
    { icon: '👤', label: 'Contact Form' },
    { icon: '🏠', label: 'Address' },
    { icon: 'H', label: 'Pseudo Header', isTextIcon: true },
  ];

  // Load surveys from localStorage on mount
  useEffect(() => {
    const storedSurveys = localStorage.getItem('local_surveys');
    if (storedSurveys) {
      try {
        const parsed = JSON.parse(storedSurveys);
        setSurveys(parsed);
      } catch (e) {
        console.error('Failed to parse surveys from localStorage', e);
      }
    }
  }, []);

  // Load survey from URL if surveyId exists
  useEffect(() => {
    if (surveyId && surveys.length > 0 && !isEditMode) {
      const survey = surveys.find(s =>
        s.id === parseInt(surveyId) ||
        s.name.toLowerCase().replace(/\s+/g, '-') === surveyId
      );
      if (survey) {
        // Set edit mode directly without navigating (we're already at the right URL)
        setIsEditMode(true);
        setEditingSurveyId(survey.id);
        setSurveyForm({
          name: survey.name || '',
          layoutType: survey.layoutType || 'portrait',
          surveyType: survey.type || 'app',
          headerText: survey.headerText || '',
          theme: survey.theme || 'Default',
          accessPin: survey.accessPin || '',
          loopSurvey: survey.loopSurvey || false,
          pdfShowAnswered: survey.pdfShowAnswered || false,
          backgroundLocation: survey.backgroundLocation || false,
          isLocationMandatory: survey.isLocationMandatory || false,
          thankYouDuration: survey.thankYouDuration || 20,
          welcomeImageName: survey.welcomeImageName || '',
          thankYouImageName: survey.thankYouImageName || ''
        });
        setShowDetailedCreate(true);
        setCurrentSurvey(survey);
        setShowQuestionnaire(true);
      }
    }
  }, [surveyId, surveys]);

  // Sync questions and pages when currentSurvey changes
  useEffect(() => {
    if (currentSurvey) {
      setQuestions(currentSurvey.questions || []);
      setPages(currentSurvey.pages || [1]);
      setCurrentPage(1);
    } else {
      setQuestions([]);
      setPages([1]);
      setCurrentPage(1);
    }
  }, [currentSurvey]);

  const toggleCategory = (name) => {
    setExpandedCategories(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const handleDragStart = (e, qType) => {
    e.dataTransfer.setData("questionType", JSON.stringify(qType));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const qData = e.dataTransfer.getData("questionType");
    if (qData) {
      const q = JSON.parse(qData);
      const newQuestion = {
        id: Date.now(),
        type: q.label,
        icon: q.icon,
        isTextIcon: q.isTextIcon,
        title: q.label === 'Text Block' ? '' : 'Type your question here....',
        description: '',
        displayTitle: '',
        variableName: '',
        formula: '',
        defaultValue: '',
        mediaType: 'Include Media Type',
        mediaUrl: '',
        mediaFileName: '',
        optionMedia: {}, // New field for images per option
        suffix: '',
        limitFrom: '',
        limitTo: '',
        required: true,
        displayInSurvey: true,
        validationPattern: '',
        validationMessage: '',
        includeInPdf: false,
        includeInCrossTab: false,
        precision: (q.label === 'Decimal Input' || q.label === 'Decimal Grid') ? '2' : '',
        codeValues: Array(10).fill({ code: '', from: '', to: '' }),
        options: '',
        hiddenOptions: '',
        orientation: 'Vertical',
        numColumns: '1',
        randomizeOptions: false,
        imageGroup: '',
        isOtherTextOptional: false,
        enableTextSearch: false,
        checkAllOptions: '',
        startLabel: '',
        midLabel: '',
        endLabel: '',
        displayAs: 'Numbers',
        numRatings: '5',
        minDate: '',
        maxDate: '',
        currentDateAsAnswer: false,
        minTimeHH: '',
        minTimeMM: '',
        maxTimeHH: '',
        maxTimeMM: '',
        currentTimeAsAnswer: false,
        currentDateTimeAsAnswer: false,
        disallowManualEntry: false,
        preventDuplicateLocationCapture: false,
        page: currentPage,
        layout: 'Horizontal',
        randomizeRowOptions: false,
        randomizeColumnOptions: false,
        minQuestionsRequired: '',
        rowOptions: '',
        columnOptions: '',
        hiddenColumnOptions: '',
        rowOptionWidth: '',
        forwardRowFrom: '',
        forwardRowType: '',
        forwardRowAlwaysShow: '',
        forwardColumnFrom: '',
        forwardColumnType: '',
        forwardColumnAlwaysShow: '',
        forwardQuestionFrom: '',
        forwardQuestionType: '',
        forwardQuestionAlwaysShow: '',
        uniqueOptions: '',
        displayAsGridTablet: false,
        exportRawData: false,
        nsecHouseholdTitle: '',
        nsecAgricultureTitle: '',
        nsecEducationTitle: '',
        nsecGradeTitle: '',
        secOccupationTitle: '',
        secEducationTitle: '',
        secGradeTitle: '',
        secEduVariableName: '',
        ruralWallTitle: '',
        ruralRoofTitle: '',
        ruralHouseTypeTitle: '',
        ruralEducationTitle: '',
        ruralGradeTitle: '',
        ruralWallOptions: '',
        ruralRoofOptions: '',
        cascadeDataSource: '',
        cascadeQuestionType: 'Dropdown',
        cascadeAllRequired: true,
        cascadeLevels: []
      };

      if (q.label === 'Phone Number') {
        newQuestion.limitFrom = '1000000000';
        newQuestion.limitTo = '9999999999';
      }

      setQuestions(prev => [...prev, newQuestion]);
    }
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
  };

  const duplicatePage = () => {
    const newPageNum = pages.length + 1;
    const currentQuestions = questions.filter(q => (q.page || 1) === currentPage);
    const duplicatedQuestions = currentQuestions.map(q => ({
      ...q,
      id: Date.now() + Math.random(),
      page: newPageNum
    }));
    setQuestions([...questions, ...duplicatedQuestions]);
    setPages([...pages, newPageNum]);
    setCurrentPage(newPageNum);
    setShowPageOptions(false);
  };

  const insertPage = () => {
    const newPageNum = currentPage + 1;
    const updatedQuestions = questions.map(q => {
      if ((q.page || 1) >= newPageNum) {
        return { ...q, page: q.page + 1 };
      }
      return q;
    });
    setQuestions(updatedQuestions);
    setPages([...pages, pages.length + 1]);
    setCurrentPage(newPageNum);
    setShowPageOptions(false);
  };

  const deletePage = () => {
    if (pages.length === 1) return;
    const updatedQuestions = questions
      .filter(q => (q.page || 1) !== currentPage)
      .map(q => {
        if ((q.page || 1) > currentPage) {
          return { ...q, page: q.page - 1 };
        }
        return q;
      });
    setQuestions(updatedQuestions);
    setPages(pages.slice(0, -1));
    setCurrentPage(Math.max(1, currentPage - 1));
    setShowPageOptions(false);
  };

  const handleSaveQuestionnaire = () => {
    setSurveys(prevSurveys => {
      const updatedSurveys = prevSurveys.map(s =>
        s.id === currentSurvey.id
          ? { ...s, questions, pages }
          : s
      );
      localStorage.setItem('local_surveys', JSON.stringify(updatedSurveys));
      return updatedSurveys;
    });

    closeQuestionnaire();
    setShowSuccessPopup(true);
    setTimeout(() => setShowSuccessPopup(false), 2000);
  };

  const removeQuestion = (id) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const duplicateQuestion = (id) => {
    const index = questions.findIndex(q => q.id === id);
    if (index !== -1) {
      const q = questions[index];
      const newQ = { ...q, id: Date.now(), title: q.title ? `${q.title} (Copy)` : '' };
      const newQuestions = [...questions];
      newQuestions.splice(index + 1, 0, newQ);
      setQuestions(newQuestions);
    }
  };

  const toggleHideQuestion = (id) => {
    const q = questions.find(q => q.id === id);
    if (q) {
      // Toggle displayInSurvey
      updateQuestion(id, 'displayInSurvey', !q.displayInSurvey);
    }
  };

  const updateQuestion = (id, field, value) => {
    setQuestions(prevQuestions =>
      prevQuestions.map(q => q.id === id ? { ...q, [field]: value } : q)
    );
  };

  const renderOptionMediaSelector = (q) => {
    if (!q.options) return null;
    const optionList = q.options.split('\n').filter(opt => opt.trim() !== '');
    if (optionList.length === 0) return null;

    return (
      <div className="form-row align-start">
        <label>Option Media Assets</label>
        <div className="option-media-list">
          {optionList.map((opt, idx) => (
            <div key={idx} className="option-media-item">
              <span className="opt-name">{opt}</span>
              <div className="opt-upload-controls">
                <button
                  className="q-cyan-btn small"
                  onClick={() => document.getElementById(`opt-media-${q.id}-${idx}`).click()}
                >
                  {q.optionMedia?.[opt] ? 'Change' : 'Add Image'}
                </button>
                <input
                  type="file"
                  id={`opt-media-${q.id}-${idx}`}
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        const newOptionMedia = { ...(q.optionMedia || {}), [opt]: reader.result };
                        updateQuestion(q.id, 'optionMedia', newOptionMedia);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                {q.optionMedia?.[opt] && <span className="check-mark">✔️</span>}
              </div>
            </div>
          ))}
          <span className="help-text">Images will appear next to options in the survey.</span>
        </div>
      </div>
    );
  };

  const renderMediaTypeSelector = (q) => {
    return (
      <div className="form-row">
        <label>Question Media Type</label>
        <div className="media-input-wrapper">
          <select
            value={q.mediaType}
            onChange={(e) => updateQuestion(q.id, 'mediaType', e.target.value)}
          >
            <option value="Include Media Type">Include Media Type</option>
            <option value="Image">Image</option>
            <option value="Audio">Audio</option>
            <option value="Video">Video</option>
          </select>
          {q.mediaType !== 'Include Media Type' && (
            <div className="media-upload-controls">
              <button className="q-cyan-btn small" onClick={() => document.getElementById(`media-upload-${q.id}`).click()}>
                {q.mediaUrl ? 'Change File' : 'Select File'}
              </button>
              <input
                type="file"
                id={`media-upload-${q.id}`}
                style={{ display: 'none' }}
                accept={q.mediaType === 'Image' ? 'image/*' : q.mediaType === 'Audio' ? 'audio/*' : 'video/*'}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      updateQuestion(q.id, 'mediaUrl', reader.result);
                      updateQuestion(q.id, 'mediaFileName', file.name);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              {q.mediaFileName && <span className="file-name">{q.mediaFileName}</span>}
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const categories = [
    "Airline Service Evaluation", "Brand Performance Survey", "Clubs and Resorts",
    "Course Evaluation", "Customer Satisfaction Survey", "Customer Service Feedback Survey",
    "Department Evaluation Survey", "Elections and Political Survey", "Employee Exit Interview",
    "Employee Job Satisfaction Survey", "Employee Self Assessment", "Environment",
    "Evaluation of Event Planning Event Satisfaction for Visitors", "General",
    "Graduation Exit Survey", "Gym Member Feedback Survey", "Health Care well-being Survey",
    "Hospital Inspection Survey", "Hotel Customer Feedback", "Lead Capture",
    "Market Research", "Mystery Shopper Survey", "Parent Feedback", "Patient Satisfaction",
    "Physician Practices Survey", "Post Event Survey Evaluation", "Product Satisfaction",
    "Quick Lead Contact Information Survey", "Real Estate Enquiry", "Real Estate Maintenance Survey",
    "Real Estate Property Management", "Real Estate Satisfaction", "Restaurant Customer Feedback",
    "Retail - Mystery Shoppers Survey", "Retail Customer Satisfaction", "Retail Store Evaluation",
    "Salon & Spa Customer Feedback Survey", "Student Feedback", "Teacher Feedback",
    "Tourist Feedback", "Trade Show Customer Feedback"
  ];

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSurveyForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const startDetailedCreate = () => {
    setShowCreatePopup(false);
    setShowDetailedCreate(true);
  };

  const handleSaveSurvey = () => {
    const today = new Date();
    const formattedDate = `${today.getDate()}-${today.toLocaleString('en-US', { month: 'short' })}-${today.getFullYear()}`;

    const surveyData = {
      name: surveyForm.name || "Untitled Survey",
      type: surveyForm.surveyType,
      headerText: surveyForm.headerText,
      theme: surveyForm.theme,
      layoutType: surveyForm.layoutType,
      accessPin: surveyForm.accessPin,
      loopSurvey: surveyForm.loopSurvey,
      pdfShowAnswered: surveyForm.pdfShowAnswered,
      backgroundLocation: surveyForm.backgroundLocation,
      isLocationMandatory: surveyForm.isLocationMandatory,
      thankYouDuration: surveyForm.thankYouDuration,
      welcomeImageName: surveyForm.welcomeImageName,
      thankYouImageName: surveyForm.thankYouImageName
    };

    if (isEditMode && editingSurveyId) {
      // Update existing survey
      surveyAPI.update(editingSurveyId, surveyData)
        .then(response => {
          console.log('Survey updated on server', response);
          setSurveys(prevSurveys => {
            const updatedSurveys = prevSurveys.map(s =>
              s.id === editingSurveyId ? { ...s, ...surveyData } : s
            );
            localStorage.setItem('local_surveys', JSON.stringify(updatedSurveys));
            return updatedSurveys;
          });
        })
        .catch(err => {
          console.error('Failed to update survey on server', err);
          // Fallback to local update if server fails (optional, or show error)
          alert('Failed to save to server. Changes saved locally.');
          setSurveys(prevSurveys => {
            const updatedSurveys = prevSurveys.map(s =>
              s.id === editingSurveyId ? { ...s, ...surveyData } : s
            );
            localStorage.setItem('local_surveys', JSON.stringify(updatedSurveys));
            return updatedSurveys;
          });
        });

    } else {
      // Create new survey
      surveyAPI.create(surveyData)
        .then(response => {
          console.log('Survey created on server', response);
          const newSurvey = {
            ...surveyData,
            id: response.data?._id || response._id || (Date.now()), // Use server ID if available
            date: formattedDate,
            responses: 0,
            status: 'UnPublished',
            questions: [],
            pages: [1]
          };

          setSurveys(prevSurveys => {
            const newList = [newSurvey, ...prevSurveys];
            localStorage.setItem('local_surveys', JSON.stringify(newList));
            return newList;
          });
        })
        .catch(err => {
          console.error('Failed to create survey on server', err);
          alert('Failed to create on server. Created locally.');
          const newSurvey = {
            ...surveyData,
            id: Date.now(),
            date: formattedDate,
            responses: 0,
            status: 'UnPublished',
            questions: [],
            pages: [1]
          };
          setSurveys(prevSurveys => {
            const newList = [newSurvey, ...prevSurveys];
            localStorage.setItem('local_surveys', JSON.stringify(newList));
            return newList;
          });
        });
    }

    setShowDetailedCreate(false);
    setIsEditMode(false);
    setEditingSurveyId(null);
    setShowSuccessPopup(true);

    setTimeout(() => {
      setShowSuccessPopup(false);
    }, 3000);
  };

  const openEditSurvey = (survey) => {
    setIsEditMode(true);
    setEditingSurveyId(survey.id);
    setSurveyForm({
      name: survey.name || '',
      layoutType: survey.layoutType || 'portrait',
      surveyType: survey.type || 'app',
      headerText: survey.headerText || '',
      theme: survey.theme || 'Default',
      accessPin: survey.accessPin || '',
      loopSurvey: survey.loopSurvey || false,
      pdfShowAnswered: survey.pdfShowAnswered || false,
      backgroundLocation: survey.backgroundLocation || false,
      isLocationMandatory: survey.isLocationMandatory || false,
      thankYouDuration: survey.thankYouDuration || 20,
      welcomeImageName: survey.welcomeImageName || '',
      thankYouImageName: survey.thankYouImageName || ''
    });
    setShowDetailedCreate(true);

    // Update URL to include survey name and open questionnaire
    const urlSlug = survey.name.toLowerCase().replace(/\s+/g, '-');
    navigate(`/surveys/${urlSlug}`);
    setCurrentSurvey(survey);
    setShowQuestionnaire(true);
  };

  const toggleStatus = (id, currentStatus) => {
    if (currentStatus === 'UnPublished') {
      setSelectedSurveyId(id);
      setSyncOnMobile(false);
      setShowConfirmPopup(true);
    } else {
      setSurveys(surveys.map(s => s.id === id ? { ...s, status: 'UnPublished' } : s));
    }
  };

  const confirmPublish = () => {
    if (!syncOnMobile) return;

    setSurveys(surveys.map(s => s.id === selectedSurveyId ? { ...s, status: 'Published' } : s));
    setShowConfirmPopup(false);
  };

  const deleteSurvey = (id) => {
    if (window.confirm("Are you sure you want to delete this survey?")) {
      const updatedSurveys = surveys.filter(s => s.id !== id);
      setSurveys(updatedSurveys);
      localStorage.setItem('local_surveys', JSON.stringify(updatedSurveys));
    }
  };

  const closeQuestionnaire = () => {
    setShowQuestionnaire(false);
    setCurrentSurvey(null);
  };

  const openCascadePopup = (qId) => {
    const q = questions.find(q => q.id === qId);

    if (q) {
      const currentSource = q.cascadeDataSource || 'Select';
      setSelectedCascadeSource(currentSource);

      if (currentSource !== 'Select' && !cascadeSources.includes(currentSource)) {
        setCascadeSources(prev => [...prev, currentSource]);
      }

      setCurrentCascadeId(qId);
      setShowCascadePopup(true);
    }
  };

  const updateCascadeLevel = (qId, levelIndex, field, value) => {
    setQuestions(prev => prev.map(q => {
      if (q.id === qId) {
        const newLevels = [...(q.cascadeLevels || [])];
        newLevels[levelIndex] = { ...newLevels[levelIndex], [field]: value };
        return { ...q, cascadeLevels: newLevels };
      }
      return q;
    }));
  };

  const handleCascadeSave = () => {
    if (currentCascadeId) {
      updateQuestion(currentCascadeId, 'cascadeDataSource', selectedCascadeSource);

      // Initialize levels if they don't exist and source matches keywords
      const q = questions.find(q => q.id === currentCascadeId);
      if (q && (!q.cascadeLevels || q.cascadeLevels.length === 0)) {
        const sourceLower = selectedCascadeSource.toLowerCase();
        if (sourceLower.includes('survey4') ||
          sourceLower.includes('parliament') ||
          sourceLower.includes('assembly') ||
          sourceLower.includes('mandal') ||
          sourceLower.includes('cascade')) {
          const mockLevels = [
            { label: 'Parliament', displayOnMain: false },
            { label: 'Assembly', displayOnMain: false },
            { label: 'Mandal', displayOnMain: false }
          ];
          updateQuestion(currentCascadeId, 'cascadeLevels', mockLevels);
        }
      }
    }
    setShowCascadePopup(false);
  };

  const handleCascadeFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && currentCascadeId) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          if (!window.XLSX) {
            console.error("XLSX library not loaded");
            return;
          }
          const data = new Uint8Array(e.target.result);
          const workbook = window.XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = window.XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (json.length < 2) {
            alert("File is empty or invalid structure.");
            return;
          }

          // Header row defines the labels
          const headers = json[0];
          const rows = json.slice(1);

          // Build hierarchy
          const levels = headers.map((header, colIdx) => {
            const levelData = {
              label: header,
              displayOnMain: false,
              options: [],
              parentMap: {}
            };

            if (colIdx === 0) {
              // Top level unique options
              levelData.options = [...new Set(rows.map(r => r[0]).filter(Boolean))];
            } else {
              // Nested levels: map from parent value -> list of children
              rows.forEach(row => {
                const parentValue = row[colIdx - 1];
                const currentValue = row[colIdx];
                if (parentValue && currentValue) {
                  if (!levelData.parentMap[parentValue]) {
                    levelData.parentMap[parentValue] = new Set();
                  }
                  levelData.parentMap[parentValue].add(currentValue);
                }
              });
              // Convert Sets to Arrays
              Object.keys(levelData.parentMap).forEach(key => {
                levelData.parentMap[key] = [...levelData.parentMap[key]];
              });
            }
            return levelData;
          });

          updateQuestion(currentCascadeId, 'cascadeLevels', levels);
          updateQuestion(currentCascadeId, 'cascadeDataSource', file.name);

          // Also populate standard options as a secondary string fallback
          if (levels.length > 0 && levels[0].options.length > 0) {
            updateQuestion(currentCascadeId, 'options', levels[0].options.join('\n'));
          }

          if (!cascadeSources.includes(file.name)) {
            setCascadeSources(prev => [...prev, file.name]);
          }
          setSelectedCascadeSource(file.name);
          alert(`Successfully parsed ${levels.length} levels from ${rows.length} data rows.`);
        } catch (err) {
          console.error("Error parsing Excel file", err);
          alert("Failed to parse Excel file.");
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // QUESTIONNAIRE VIEW
  if (showQuestionnaire) {
    return (
      <Layout user={user}>
        <div className="questionnaire-container">
          <div className="questionnaire-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button className="back-btn-circle" onClick={closeQuestionnaire} title="Back to Surveys">←</button>
              <h2>Questionnaire : {currentSurvey?.name || ''}</h2>
            </div>
            <div className="header-toolbar">
              <button className="toolbar-btn teal">Questionnaire</button>
              <button className="toolbar-btn">ReSequence</button>
              <button className="toolbar-btn">Conditional Display</button>
              <button className="toolbar-btn">Page Expression</button>
              <button className="toolbar-btn">Answer Filtering</button>
              <button className="toolbar-btn">Randomization</button>
              <button className="toolbar-btn">Scoring</button>
              <button className="toolbar-btn orange">Preview</button>
            </div>
          </div>

          <div className="questionnaire-main">
            {/* SIDEBAR */}
            <div className="q-sidebar">
              <div className="q-tabs">
                <div
                  className={`q-tab ${activeTab === 'Standard' ? 'active' : ''}`}
                  onClick={() => setActiveTab('Standard')}
                >
                  Standard
                </div>
                <div
                  className={`q-tab ${activeTab === 'Advance' ? 'active' : ''}`}
                  onClick={() => setActiveTab('Advance')}
                >
                  Advance
                </div>
              </div>
              <div className="q-question-list-container">
                <div className="q-question-list">
                  {(activeTab === 'Standard' ? standardItems : advanceItems).map((q, i) => (
                    <div
                      key={i}
                      className="q-item"
                      draggable
                      onDragStart={(e) => handleDragStart(e, q)}
                    >
                      <div className="q-item-left">
                        <span className={`q-icon-box ${q.isTextIcon ? 'text-icon' : ''}`}>
                          {q.icon}
                        </span>
                        <span className="q-item-label">{q.label}</span>
                      </div>
                      <span className="q-item-info-box">i</span>
                    </div>
                  ))}
                </div>
                <div className="q-scroll-arrow">▾</div>
              </div>
            </div>

            {/* CANVAS */}
            <div className="q-canvas-container">
              <div className="q-canvas-toolbar">
                <div className="inner-toolbar-left">
                  <button className="inner-btn">🔲 Add Group</button>
                  <button className="inner-btn secondary">📑 Questionnaire ▾</button>
                </div>
                <button className="toolbar-btn teal">Disable Mandatory Validation</button>
              </div>
              <div
                className="q-canvas"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {questions.filter(q => (q.page || 1) === currentPage).length === 0 ? (
                  <div className="empty-canvas">
                    <p>Drop your Question here...</p>
                  </div>
                ) : (
                  <div className="questions-list">
                    {questions.filter(q => (q.page || 1) === currentPage).map((q) => (
                      <div key={q.id} className="question-item-expanded">
                        <div className="q-card-header">
                          <div className="header-left">
                            <span className="drag-handle">≡</span>
                            <span className={`q-icon-box small ${q.isTextIcon ? 'text-icon' : ''}`}>{q.icon}</span>
                            {q.type === 'Text Block' ? null : (
                              <input
                                type="text"
                                className="q-header-input"
                                value={q.title}
                                placeholder="Type your question here...."
                                onChange={(e) => updateQuestion(q.id, 'title', e.target.value)}
                              />
                            )}
                          </div>
                          <div className="header-right">
                            <span
                              className="action-btn"
                              onClick={() => updateQuestion(q.id, 'collapsed', !q.collapsed)}
                              style={{ transform: q.collapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}
                              title={q.collapsed ? "Expand" : "Collapse"}
                            >
                              ˄
                            </span>
                            <span
                              className="action-btn"
                              title={q.displayInSurvey ? "Hide Question" : "Show Question"}
                              onClick={() => toggleHideQuestion(q.id)}
                              style={{ opacity: q.displayInSurvey ? 1 : 0.5 }}
                            >
                              {q.displayInSurvey ? '👁️' : '🚫'}
                            </span>
                            <span
                              className="action-btn"
                              title="Duplicate Question"
                              onClick={() => duplicateQuestion(q.id)}
                            >
                              📄
                            </span>
                            <span className="action-btn delete" onClick={() => removeQuestion(q.id)}>🗑️</span>
                          </div>
                        </div>

                        {!q.collapsed && (
                          <div className="q-card-body">
                            {q.type === 'Text Block' && (
                              <div className="text-block-editor">
                                <div className="editor-toolbar">
                                  <button className="tool-btn" onClick={() => execCommand('bold')}><b>B</b></button>
                                  <button className="tool-btn" onClick={() => execCommand('italic')}><i>I</i></button>
                                  <button className="tool-btn" onClick={() => execCommand('underline')}><u>U</u></button>
                                  <div className="color-picker-box" onClick={() => document.getElementById(`color-input-${q.id}`).click()}>
                                    <div className="color-indicator" style={{ backgroundColor: q.textColor || '#444' }}></div>
                                    <span className="arrow-down">▴A</span>
                                    <input
                                      type="color"
                                      id={`color-input-${q.id}`}
                                      style={{ display: 'none' }}
                                      onChange={(e) => {
                                        execCommand('foreColor', e.target.value);
                                        updateQuestion(q.id, 'textColor', e.target.value);
                                      }}
                                    />
                                  </div>
                                  <button className="tool-btn" onClick={() => execCommand('insertUnorderedList')}>T↕</button>
                                  <button className="tool-btn" onClick={() => execCommand('justifyLeft')}>≣</button>
                                  <button className="tool-btn" onClick={() => {
                                    const size = prompt('Enter font size (1-7):', '3');
                                    if (size) execCommand('fontSize', size);
                                  }}>⩓</button>
                                  <button className="tool-btn" onClick={() => {
                                    const url = prompt('Enter URL:');
                                    if (url) execCommand('createLink', url);
                                  }}>🔗</button>
                                  <button className="tool-btn" onClick={() => {
                                    const url = prompt('Enter Image URL:');
                                    if (url) execCommand('insertImage', url);
                                  }}>🖼️</button>
                                </div>
                                <div
                                  className="editor-contenteditable"
                                  contentEditable
                                  dangerouslySetInnerHTML={{ __html: q.description }}
                                  onBlur={(e) => updateQuestion(q.id, 'description', e.target.innerHTML)}
                                  placeholder="Type your text here..."
                                ></div>
                                <div className="pdf-export-row">
                                  <span>Include in PDF Export</span>
                                  <input
                                    type="checkbox"
                                    checked={q.includeInPdf}
                                    onChange={(e) => updateQuestion(q.id, 'includeInPdf', e.target.checked)}
                                  />
                                </div>
                              </div>
                            )}

                            {(q.type === 'Number Input' || q.type === 'Number with Auto Code' || q.type === 'Decimal Input') && (
                              <div className="question-form">
                                <div className="form-row">
                                  <label>Description</label>
                                  <input
                                    type="text"
                                    placeholder="Type help information for question here...."
                                    value={q.description}
                                    onChange={(e) => updateQuestion(q.id, 'description', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Display Title</label>
                                  <input
                                    type="text"
                                    placeholder="Display Title"
                                    value={q.displayTitle}
                                    onChange={(e) => updateQuestion(q.id, 'displayTitle', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Variable Name</label>
                                  <input
                                    type="text"
                                    placeholder="Define variable name"
                                    value={q.variableName}
                                    onChange={(e) => updateQuestion(q.id, 'variableName', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Default Value</label>
                                  <input
                                    type="text"
                                    placeholder="Set default value"
                                    value={q.defaultValue}
                                    onChange={(e) => updateQuestion(q.id, 'defaultValue', e.target.value)}
                                  />
                                </div>
                                {renderMediaTypeSelector(q)}
                                <div className="form-row">
                                  <label>Suffix</label>
                                  <input
                                    type="text"
                                    value={q.suffix}
                                    onChange={(e) => updateQuestion(q.id, 'suffix', e.target.value)}
                                  />
                                </div>
                                {q.type === 'Decimal Input' && (
                                  <div className="form-row">
                                    <label>Precision</label>
                                    <input
                                      type="text"
                                      value={q.precision}
                                      onChange={(e) => updateQuestion(q.id, 'precision', e.target.value)}
                                    />
                                  </div>
                                )}
                                <div className="form-row">
                                  <label>Limit Value between</label>
                                  <div className="limit-inputs">
                                    <input
                                      type="text"
                                      value={q.limitFrom}
                                      placeholder=""
                                      onChange={(e) => updateQuestion(q.id, 'limitFrom', e.target.value)}
                                    />
                                    <span>-</span>
                                    <input
                                      type="text"
                                      value={q.limitTo}
                                      placeholder=""
                                      onChange={(e) => updateQuestion(q.id, 'limitTo', e.target.value)}
                                    />
                                  </div>
                                </div>
                                <div className="form-row-compact">
                                  <label>Is Question Required?</label>
                                  <input
                                    type="checkbox"
                                    checked={q.required}
                                    onChange={(e) => updateQuestion(q.id, 'required', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Validation Pattern</label>
                                  <input
                                    type="text"
                                    placeholder="Define validation pattern"
                                    value={q.validationPattern}
                                    onChange={(e) => updateQuestion(q.id, 'validationPattern', e.target.value)}
                                  />
                                </div>
                                <div className="validation-help">
                                  This field should contain the Regular Expression to validate the answer of this question.
                                  For more details, refer: <a href="https://en.wikipedia.org/wiki/Regular_expression" target="_blank">https://en.wikipedia.org/wiki/Regular_expression</a>
                                </div>
                                <div className="form-row">
                                  <label>Validation Message</label>
                                  <input
                                    type="text"
                                    placeholder="Define validation message"
                                    value={q.validationMessage}
                                    onChange={(e) => updateQuestion(q.id, 'validationMessage', e.target.value)}
                                  />
                                </div>
                                <div className="form-row-compact">
                                  <label>Include In CrossTab</label>
                                  <input
                                    type="checkbox"
                                    checked={q.includeInCrossTab}
                                    onChange={(e) => updateQuestion(q.id, 'includeInCrossTab', e.target.checked)}
                                  />
                                </div>

                                {q.type === 'Number with Auto Code' && (
                                  <div className="form-row align-start">
                                    <label>Code Values</label>
                                    <div className="code-values-table-container">
                                      <table className="code-values-table">
                                        <thead>
                                          <tr>
                                            <th>Code</th>
                                            <th>From</th>
                                            <th>To</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {q.codeValues.map((row, rIdx) => (
                                            <tr key={rIdx}>
                                              <td><input type="text" placeholder="Code" value={row.code} onChange={(e) => {
                                                const newCodes = [...q.codeValues];
                                                newCodes[rIdx] = { ...row, code: e.target.value };
                                                updateQuestion(q.id, 'codeValues', newCodes);
                                              }} /></td>
                                              <td><input type="text" value={row.from} onChange={(e) => {
                                                const newCodes = [...q.codeValues];
                                                newCodes[rIdx] = { ...row, from: e.target.value };
                                                updateQuestion(q.id, 'codeValues', newCodes);
                                              }} /></td>
                                              <td><input type="text" value={row.to} onChange={(e) => {
                                                const newCodes = [...q.codeValues];
                                                newCodes[rIdx] = { ...row, to: e.target.value };
                                                updateQuestion(q.id, 'codeValues', newCodes);
                                              }} /></td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {q.type === 'Number Point' && (
                              <div className="question-form">
                                <div className="form-row">
                                  <label>Display Title</label>
                                  <input
                                    type="text"
                                    placeholder="Display Title"
                                    value={q.displayTitle}
                                    onChange={(e) => updateQuestion(q.id, 'displayTitle', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Variable Name</label>
                                  <input
                                    type="text"
                                    placeholder="Define variable name"
                                    value={q.variableName}
                                    onChange={(e) => updateQuestion(q.id, 'variableName', e.target.value)}
                                  />
                                </div>
                                {renderMediaTypeSelector(q)}
                                <div className="form-row">
                                  <label>Limit Value between</label>
                                  <div className="range-inputs">
                                    <input
                                      type="text"
                                      value={q.limitFrom}
                                      onChange={(e) => updateQuestion(q.id, 'limitFrom', e.target.value)}
                                    />
                                    <span>-</span>
                                    <input
                                      type="text"
                                      value={q.limitTo}
                                      onChange={(e) => updateQuestion(q.id, 'limitTo', e.target.value)}
                                    />
                                  </div>
                                </div>
                                <div className="form-row">
                                  <label>Start Value Label</label>
                                  <input
                                    type="text"
                                    value={q.startLabel}
                                    onChange={(e) => updateQuestion(q.id, 'startLabel', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Mid Value Label</label>
                                  <input
                                    type="text"
                                    value={q.midLabel}
                                    onChange={(e) => updateQuestion(q.id, 'midLabel', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>End Value Label</label>
                                  <input
                                    type="text"
                                    value={q.endLabel}
                                    onChange={(e) => updateQuestion(q.id, 'endLabel', e.target.value)}
                                  />
                                </div>
                                <div className="form-row-compact">
                                  <label>Is Question Required?</label>
                                  <input
                                    type="checkbox"
                                    checked={q.required}
                                    onChange={(e) => updateQuestion(q.id, 'required', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Display As</label>
                                  <div className="radio-group-horizontal">
                                    <label>
                                      <input
                                        type="radio"
                                        name={`displayAs-${q.id}`}
                                        checked={q.displayAs === 'Numbers'}
                                        onChange={() => updateQuestion(q.id, 'displayAs', 'Numbers')}
                                      />
                                      Numbers
                                    </label>
                                    <label>
                                      <input
                                        type="radio"
                                        name={`displayAs-${q.id}`}
                                        checked={q.displayAs === 'Slider'}
                                        onChange={() => updateQuestion(q.id, 'displayAs', 'Slider')}
                                      />
                                      Slider
                                    </label>
                                  </div>
                                </div>
                              </div>
                            )}

                            {q.type === 'Rating' && (
                              <div className="question-form">
                                <div className="form-row">
                                  <label>Display Title</label>
                                  <input
                                    type="text"
                                    placeholder="Display Title"
                                    value={q.displayTitle}
                                    onChange={(e) => updateQuestion(q.id, 'displayTitle', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Variable Name</label>
                                  <input
                                    type="text"
                                    placeholder="Define variable name"
                                    value={q.variableName}
                                    onChange={(e) => updateQuestion(q.id, 'variableName', e.target.value)}
                                  />
                                </div>
                                {renderMediaTypeSelector(q)}
                                <div className="form-row">
                                  <label>Number of ratings</label>
                                  <input
                                    type="text"
                                    className="compact-input"
                                    value={q.numRatings}
                                    onChange={(e) => updateQuestion(q.id, 'numRatings', e.target.value)}
                                  />
                                </div>
                                <div className="form-row-compact">
                                  <label>Is Question Required?</label>
                                  <input
                                    type="checkbox"
                                    checked={q.required}
                                    onChange={(e) => updateQuestion(q.id, 'required', e.target.checked)}
                                  />
                                </div>
                              </div>
                            )}

                            {q.type === 'Date and Time' && (
                              <div className="question-form">
                                <div className="form-row">
                                  <label>Description</label>
                                  <input
                                    type="text"
                                    placeholder="Type help information for question here...."
                                    value={q.description}
                                    onChange={(e) => updateQuestion(q.id, 'description', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Display Title</label>
                                  <input
                                    type="text"
                                    placeholder="Display Title"
                                    value={q.displayTitle}
                                    onChange={(e) => updateQuestion(q.id, 'displayTitle', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Variable Name</label>
                                  <input
                                    type="text"
                                    placeholder="Define variable name"
                                    value={q.variableName}
                                    onChange={(e) => updateQuestion(q.id, 'variableName', e.target.value)}
                                  />
                                </div>
                                {renderMediaTypeSelector(q)}
                                <div className="form-row-compact">
                                  <label>Is Question Required?</label>
                                  <input
                                    type="checkbox"
                                    checked={q.required}
                                    onChange={(e) => updateQuestion(q.id, 'required', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row-compact">
                                  <label>Current DateTime as answer</label>
                                  <input
                                    type="checkbox"
                                    checked={q.currentDateTimeAsAnswer}
                                    onChange={(e) => updateQuestion(q.id, 'currentDateTimeAsAnswer', e.target.checked)}
                                  />
                                </div>
                              </div>
                            )}

                            {q.type === 'Time' && (
                              <div className="question-form">
                                <div className="form-row">
                                  <label>Description</label>
                                  <input
                                    type="text"
                                    placeholder="Type help information for question here...."
                                    value={q.description}
                                    onChange={(e) => updateQuestion(q.id, 'description', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Display Title</label>
                                  <input
                                    type="text"
                                    placeholder="Display Title"
                                    value={q.displayTitle}
                                    onChange={(e) => updateQuestion(q.id, 'displayTitle', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Variable Name</label>
                                  <input
                                    type="text"
                                    placeholder="Define variable name"
                                    value={q.variableName}
                                    onChange={(e) => updateQuestion(q.id, 'variableName', e.target.value)}
                                  />
                                </div>
                                {renderMediaTypeSelector(q)}
                                <div className="form-row">
                                  <label>Minimum Time</label>
                                  <div className="time-input-group">
                                    <select value={q.minTimeHH} onChange={(e) => updateQuestion(q.id, 'minTimeHH', e.target.value)}>
                                      <option>HH</option>
                                      {[...Array(24)].map((_, i) => (
                                        <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>
                                      ))}
                                    </select>
                                    <span>:</span>
                                    <select value={q.minTimeMM} onChange={(e) => updateQuestion(q.id, 'minTimeMM', e.target.value)}>
                                      <option>MM</option>
                                      {[...Array(60)].map((_, i) => (
                                        <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                                <div className="form-row">
                                  <label>Maximum Time</label>
                                  <div className="time-input-group">
                                    <select value={q.maxTimeHH} onChange={(e) => updateQuestion(q.id, 'maxTimeHH', e.target.value)}>
                                      <option>HH</option>
                                      {[...Array(24)].map((_, i) => (
                                        <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>
                                      ))}
                                    </select>
                                    <span>:</span>
                                    <select value={q.maxTimeMM} onChange={(e) => updateQuestion(q.id, 'maxTimeMM', e.target.value)}>
                                      <option>MM</option>
                                      {[...Array(60)].map((_, i) => (
                                        <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                                <div className="form-row-compact">
                                  <label>Is Question Required?</label>
                                  <input
                                    type="checkbox"
                                    checked={q.required}
                                    onChange={(e) => updateQuestion(q.id, 'required', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row-compact">
                                  <label>Current Time as answer</label>
                                  <input
                                    type="checkbox"
                                    checked={q.currentTimeAsAnswer}
                                    onChange={(e) => updateQuestion(q.id, 'currentTimeAsAnswer', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row-compact">
                                  <label>Display In Survey</label>
                                  <input
                                    type="checkbox"
                                    checked={q.displayInSurvey}
                                    onChange={(e) => updateQuestion(q.id, 'displayInSurvey', e.target.checked)}
                                  />
                                </div>
                              </div>
                            )}

                            {q.type === 'Date' && (
                              <div className="question-form">
                                <div className="form-row">
                                  <label>Description</label>
                                  <input
                                    type="text"
                                    placeholder="Type help information for question here...."
                                    value={q.description}
                                    onChange={(e) => updateQuestion(q.id, 'description', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Display Title</label>
                                  <input
                                    type="text"
                                    placeholder="Display Title"
                                    value={q.displayTitle}
                                    onChange={(e) => updateQuestion(q.id, 'displayTitle', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Variable Name</label>
                                  <input
                                    type="text"
                                    placeholder="Define variable name"
                                    value={q.variableName}
                                    onChange={(e) => updateQuestion(q.id, 'variableName', e.target.value)}
                                  />
                                </div>
                                {renderMediaTypeSelector(q)}
                                <div className="form-row">
                                  <label>Minimum Date</label>
                                  <div className="input-with-icon">
                                    <input
                                      type="text"
                                      value={q.minDate}
                                      onChange={(e) => updateQuestion(q.id, 'minDate', e.target.value)}
                                    />
                                    <button className="icon-btn">📅</button>
                                  </div>
                                </div>
                                <div className="form-row">
                                  <label>Maximum Date</label>
                                  <div className="input-with-icon">
                                    <input
                                      type="text"
                                      value={q.maxDate}
                                      onChange={(e) => updateQuestion(q.id, 'maxDate', e.target.value)}
                                    />
                                    <button className="icon-btn">📅</button>
                                  </div>
                                </div>
                                <div className="form-row-compact">
                                  <label>Is Question Required?</label>
                                  <input
                                    type="checkbox"
                                    checked={q.required}
                                    onChange={(e) => updateQuestion(q.id, 'required', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row-compact">
                                  <label>Current Date as answer</label>
                                  <input
                                    type="checkbox"
                                    checked={q.currentDateAsAnswer}
                                    onChange={(e) => updateQuestion(q.id, 'currentDateAsAnswer', e.target.checked)}
                                  />
                                </div>
                              </div>
                            )}

                            {q.type === 'Net Promoter Score' && (
                              <div className="question-form">
                                {renderMediaTypeSelector(q)}
                                <div className="form-row">
                                  <label>Display Title</label>
                                  <input
                                    type="text"
                                    placeholder="Display Title"
                                    value={q.displayTitle}
                                    onChange={(e) => updateQuestion(q.id, 'displayTitle', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Variable Name</label>
                                  <input
                                    type="text"
                                    placeholder="Define variable name"
                                    value={q.variableName}
                                    onChange={(e) => updateQuestion(q.id, 'variableName', e.target.value)}
                                  />
                                </div>
                                <div className="form-row-compact">
                                  <label>Is Question Required?</label>
                                  <input
                                    type="checkbox"
                                    checked={q.required}
                                    onChange={(e) => updateQuestion(q.id, 'required', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Start Value Label</label>
                                  <input
                                    type="text"
                                    value={q.startLabel}
                                    onChange={(e) => updateQuestion(q.id, 'startLabel', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Mid Value Label</label>
                                  <input
                                    type="text"
                                    value={q.midLabel}
                                    onChange={(e) => updateQuestion(q.id, 'midLabel', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>End Value Label</label>
                                  <input
                                    type="text"
                                    value={q.endLabel}
                                    onChange={(e) => updateQuestion(q.id, 'endLabel', e.target.value)}
                                  />
                                </div>
                              </div>
                            )}

                            {q.type === 'Barcode Scanner' && (
                              <div className="question-form">
                                <div className="form-row-compact">
                                  <label>Is Question Required?</label>
                                  <input
                                    type="checkbox"
                                    checked={q.required}
                                    onChange={(e) => updateQuestion(q.id, 'required', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row-compact">
                                  <label>Disallow Manual Entry</label>
                                  <input
                                    type="checkbox"
                                    checked={q.disallowManualEntry}
                                    onChange={(e) => updateQuestion(q.id, 'disallowManualEntry', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Variable Name</label>
                                  <input
                                    type="text"
                                    placeholder="Define variable name"
                                    value={q.variableName}
                                    onChange={(e) => updateQuestion(q.id, 'variableName', e.target.value)}
                                  />
                                </div>
                              </div>
                            )}

                            {q.type === 'Map Coordinates (GPS)' && (
                              <div className="question-form">
                                <div className="form-row">
                                  <label>Display Title</label>
                                  <input
                                    type="text"
                                    placeholder="Display Title"
                                    value={q.displayTitle}
                                    onChange={(e) => updateQuestion(q.id, 'displayTitle', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Variable Name</label>
                                  <input
                                    type="text"
                                    placeholder="Define variable name"
                                    value={q.variableName}
                                    onChange={(e) => updateQuestion(q.id, 'variableName', e.target.value)}
                                  />
                                </div>
                                <div className="form-row-compact">
                                  <label>Is Question Required?</label>
                                  <input
                                    type="checkbox"
                                    checked={q.required}
                                    onChange={(e) => updateQuestion(q.id, 'required', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row-compact">
                                  <label>Prevent duplicate location capture</label>
                                  <input
                                    type="checkbox"
                                    checked={q.preventDuplicateLocationCapture}
                                    onChange={(e) => updateQuestion(q.id, 'preventDuplicateLocationCapture', e.target.checked)}
                                  />
                                </div>
                              </div>
                            )}

                            {q.type === 'Photo Capture' && (
                              <div className="question-form">
                                <div className="form-row">
                                  <label>Display Title</label>
                                  <input
                                    type="text"
                                    placeholder="Display Title"
                                    value={q.displayTitle}
                                    onChange={(e) => updateQuestion(q.id, 'displayTitle', e.target.value)}
                                  />
                                </div>
                                <div className="form-row-compact">
                                  <label>Is Question Required?</label>
                                  <input
                                    type="checkbox"
                                    checked={q.required}
                                    onChange={(e) => updateQuestion(q.id, 'required', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row-compact">
                                  <label>Disable Text Annotation</label>
                                  <input
                                    type="checkbox"
                                    checked={q.disableTextAnnotation || false}
                                    onChange={(e) => updateQuestion(q.id, 'disableTextAnnotation', e.target.checked)}
                                  />
                                </div>
                              </div>
                            )}

                            {q.type === 'Record Video' && (
                              <div className="question-form">
                                <div className="form-row-compact">
                                  <label>Is Question Required?</label>
                                  <input
                                    type="checkbox"
                                    checked={q.required}
                                    onChange={(e) => updateQuestion(q.id, 'required', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Max.Length (60 seconds)</label>
                                  <input
                                    type="text"
                                    value={q.maxLength || ''}
                                    onChange={(e) => updateQuestion(q.id, 'maxLength', e.target.value)}
                                  />
                                </div>
                              </div>
                            )}

                            {q.type === 'Record Audio' && (
                              <div className="question-form">
                                <div className="form-row-compact">
                                  <label>Is Question Required?</label>
                                  <input
                                    type="checkbox"
                                    checked={q.required}
                                    onChange={(e) => updateQuestion(q.id, 'required', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Max.Length (60 seconds)</label>
                                  <input
                                    type="text"
                                    value={q.maxLength || ''}
                                    onChange={(e) => updateQuestion(q.id, 'maxLength', e.target.value)}
                                  />
                                </div>
                              </div>
                            )}

                            {q.type === 'Signature' && (
                              <div className="question-form">
                                <div className="form-row-compact">
                                  <label>Is Question Required?</label>
                                  <input
                                    type="checkbox"
                                    checked={q.required}
                                    onChange={(e) => updateQuestion(q.id, 'required', e.target.checked)}
                                  />
                                </div>
                              </div>
                            )}

                            {q.type === 'Checkbox List' && (
                              <div className="question-form">
                                <div className="form-row">
                                  <label>Display Title</label>
                                  <input
                                    type="text"
                                    placeholder="Display Title"
                                    value={q.displayTitle}
                                    onChange={(e) => updateQuestion(q.id, 'displayTitle', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Variable Name</label>
                                  <input
                                    type="text"
                                    placeholder="Define variable name"
                                    value={q.variableName}
                                    onChange={(e) => updateQuestion(q.id, 'variableName', e.target.value)}
                                  />
                                </div>
                                {renderMediaTypeSelector(q)}
                                <div className="form-row align-start">
                                  <label>Options</label>
                                  <div className="input-column">
                                    <textarea
                                      className="form-textarea"
                                      value={q.options}
                                      onChange={(e) => updateQuestion(q.id, 'options', e.target.value)}
                                    ></textarea>
                                    <span className="help-text">One option per line</span>
                                  </div>
                                </div>
                                {renderOptionMediaSelector(q)}
                                <div className="form-row">
                                  <label>Image as Option</label>
                                  <div className="input-with-button">
                                    <input type="text" value={q.imageGroup} readOnly />
                                    <button className="q-cyan-btn">Select Group</button>
                                  </div>
                                </div>
                                <div className="form-row-compact">
                                  <label>Is Question Required?</label>
                                  <input
                                    type="checkbox"
                                    checked={q.required}
                                    onChange={(e) => updateQuestion(q.id, 'required', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Minimum Options Required</label>
                                  <input
                                    type="text"
                                    value={q.minOptions}
                                    onChange={(e) => updateQuestion(q.id, 'minOptions', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Maximum Options Selectable</label>
                                  <input
                                    type="text"
                                    value={q.maxOptions}
                                    onChange={(e) => updateQuestion(q.id, 'maxOptions', e.target.value)}
                                  />
                                </div>
                                <div className="form-row align-start">
                                  <label>Unique Options</label>
                                  <div className="input-column">
                                    <textarea
                                      className="form-textarea"
                                      value={q.uniqueOptions}
                                      onChange={(e) => updateQuestion(q.id, 'uniqueOptions', e.target.value)}
                                    ></textarea>
                                    <span className="help-text">One option per line</span>
                                  </div>
                                </div>
                                {renderOptionMediaSelector(q)}
                                <div className="form-row">
                                  <label>Check All Options</label>
                                  <input
                                    type="text"
                                    value={q.checkAllOptions}
                                    onChange={(e) => updateQuestion(q.id, 'checkAllOptions', e.target.value)}
                                  />
                                </div>
                                <div className="form-row-compact">
                                  <label>Enable Text Search</label>
                                  <input
                                    type="checkbox"
                                    checked={q.enableTextSearch}
                                    onChange={(e) => updateQuestion(q.id, 'enableTextSearch', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row-compact">
                                  <label>Randomize Options</label>
                                  <input
                                    type="checkbox"
                                    checked={q.randomizeOptions}
                                    onChange={(e) => updateQuestion(q.id, 'randomizeOptions', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Layout</label>
                                  <div className="orientation-group">
                                    <label><input type="radio" checked={q.orientation === 'Vertical'} onChange={() => updateQuestion(q.id, 'orientation', 'Vertical')} /> Vertical</label>
                                    <label><input type="radio" checked={q.orientation === 'Horizontal'} onChange={() => updateQuestion(q.id, 'orientation', 'Horizontal')} /> Horizontal</label>
                                  </div>
                                </div>
                              </div>
                            )}

                            {q.type === '2 Columns Checkbox' && (
                              <div className="question-form">
                                <div className="form-row">
                                  <label>Display Title</label>
                                  <input
                                    type="text"
                                    placeholder="Display Title"
                                    value={q.displayTitle}
                                    onChange={(e) => updateQuestion(q.id, 'displayTitle', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Variable Name</label>
                                  <input
                                    type="text"
                                    placeholder="Define variable name"
                                    value={q.variableName}
                                    onChange={(e) => updateQuestion(q.id, 'variableName', e.target.value)}
                                  />
                                </div>
                                {renderMediaTypeSelector(q)}
                                <div className="form-row align-start">
                                  <label>Options</label>
                                  <div className="input-column">
                                    <textarea
                                      className="form-textarea"
                                      value={q.options}
                                      onChange={(e) => updateQuestion(q.id, 'options', e.target.value)}
                                    ></textarea>
                                    <span className="help-text">One option per line</span>
                                  </div>
                                </div>
                                {renderOptionMediaSelector(q)}
                                <div className="form-row">
                                  <label>Image as Option</label>
                                  <div className="input-with-button">
                                    <input type="text" value={q.imageGroup} readOnly />
                                    <button className="q-cyan-btn">Select Group</button>
                                  </div>
                                </div>
                                <div className="form-row-compact">
                                  <label>Is Question Required?</label>
                                  <input
                                    type="checkbox"
                                    checked={q.required}
                                    onChange={(e) => updateQuestion(q.id, 'required', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Minimum Options Required</label>
                                  <input
                                    type="text"
                                    value={q.minOptions}
                                    onChange={(e) => updateQuestion(q.id, 'minOptions', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Maximum Options Selectable</label>
                                  <input
                                    type="text"
                                    value={q.maxOptions}
                                    onChange={(e) => updateQuestion(q.id, 'maxOptions', e.target.value)}
                                  />
                                </div>
                                <div className="form-row align-start">
                                  <label>Unique Options</label>
                                  <div className="input-column">
                                    <textarea
                                      className="form-textarea"
                                      value={q.uniqueOptions}
                                      onChange={(e) => updateQuestion(q.id, 'uniqueOptions', e.target.value)}
                                    ></textarea>
                                    <span className="help-text">One option per line</span>
                                  </div>
                                </div>
                                {renderOptionMediaSelector(q)}
                                <div className="form-row">
                                  <label>Check All Options</label>
                                  <input
                                    type="text"
                                    value={q.checkAllOptions}
                                    onChange={(e) => updateQuestion(q.id, 'checkAllOptions', e.target.value)}
                                  />
                                </div>
                                <div className="form-row-compact">
                                  <label>Enable Text Search</label>
                                  <input
                                    type="checkbox"
                                    checked={q.enableTextSearch}
                                    onChange={(e) => updateQuestion(q.id, 'enableTextSearch', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row-compact">
                                  <label>Randomize Options</label>
                                  <input
                                    type="checkbox"
                                    checked={q.randomizeOptions}
                                    onChange={(e) => updateQuestion(q.id, 'randomizeOptions', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Layout</label>
                                  <div className="orientation-group">
                                    <label><input type="radio" checked={q.orientation === 'Vertical'} onChange={() => updateQuestion(q.id, 'orientation', 'Vertical')} /> Vertical</label>
                                    <label><input type="radio" checked={q.orientation === 'Horizontal'} onChange={() => updateQuestion(q.id, 'orientation', 'Horizontal')} /> Horizontal</label>
                                  </div>
                                </div>
                              </div>
                            )}

                            {q.type === 'Checkbox List with Other' && (
                              <div className="question-form">
                                <div className="form-row">
                                  <label>Display Title</label>
                                  <input
                                    type="text"
                                    placeholder="Display Title"
                                    value={q.displayTitle}
                                    onChange={(e) => updateQuestion(q.id, 'displayTitle', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Variable Name</label>
                                  <input
                                    type="text"
                                    placeholder="Define variable name"
                                    value={q.variableName}
                                    onChange={(e) => updateQuestion(q.id, 'variableName', e.target.value)}
                                  />
                                </div>
                                {renderMediaTypeSelector(q)}
                                <div className="form-row align-start">
                                  <label>Options</label>
                                  <div className="input-column">
                                    <textarea
                                      className="form-textarea"
                                      value={q.options}
                                      onChange={(e) => updateQuestion(q.id, 'options', e.target.value)}
                                    ></textarea>
                                    <span className="help-text">One option per line</span>
                                  </div>
                                </div>
                                {renderOptionMediaSelector(q)}
                                <div className="form-row">
                                  <label>Image as Option</label>
                                  <div className="input-with-button">
                                    <input type="text" value={q.imageGroup} readOnly />
                                    <button className="q-cyan-btn">Select Group</button>
                                  </div>
                                </div>
                                <div className="form-row-compact">
                                  <label>Is Question Required?</label>
                                  <input
                                    type="checkbox"
                                    checked={q.required}
                                    onChange={(e) => updateQuestion(q.id, 'required', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row-compact">
                                  <label>Is Other Text Optional?</label>
                                  <input
                                    type="checkbox"
                                    checked={q.isOtherTextOptional}
                                    onChange={(e) => updateQuestion(q.id, 'isOtherTextOptional', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Minimum Options Required</label>
                                  <input
                                    type="text"
                                    value={q.minOptions}
                                    onChange={(e) => updateQuestion(q.id, 'minOptions', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Maximum Options Selectable</label>
                                  <input
                                    type="text"
                                    value={q.maxOptions}
                                    onChange={(e) => updateQuestion(q.id, 'maxOptions', e.target.value)}
                                  />
                                </div>
                                <div className="form-row align-start">
                                  <label>Unique Options</label>
                                  <div className="input-column">
                                    <textarea
                                      className="form-textarea"
                                      value={q.uniqueOptions}
                                      onChange={(e) => updateQuestion(q.id, 'uniqueOptions', e.target.value)}
                                    ></textarea>
                                    <span className="help-text">One option per line</span>
                                  </div>
                                </div>
                                {renderOptionMediaSelector(q)}
                                <div className="form-row">
                                  <label>Check All Options</label>
                                  <input
                                    type="text"
                                    value={q.checkAllOptions}
                                    onChange={(e) => updateQuestion(q.id, 'checkAllOptions', e.target.value)}
                                  />
                                </div>
                                <div className="form-row-compact">
                                  <label>Enable Text Search</label>
                                  <input
                                    type="checkbox"
                                    checked={q.enableTextSearch}
                                    onChange={(e) => updateQuestion(q.id, 'enableTextSearch', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row-compact">
                                  <label>Randomize Options</label>
                                  <input
                                    type="checkbox"
                                    checked={q.randomizeOptions}
                                    onChange={(e) => updateQuestion(q.id, 'randomizeOptions', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Layout</label>
                                  <div className="orientation-group">
                                    <label><input type="radio" checked={q.orientation === 'Vertical'} onChange={() => updateQuestion(q.id, 'orientation', 'Vertical')} /> Vertical</label>
                                    <label><input type="radio" checked={q.orientation === 'Horizontal'} onChange={() => updateQuestion(q.id, 'orientation', 'Horizontal')} /> Horizontal</label>
                                  </div>
                                </div>
                              </div>
                            )}

                            {q.type === 'Drop Down' && (
                              <div className="question-form">
                                <div className="form-row">
                                  <label>Description</label>
                                  <input
                                    type="text"
                                    placeholder="Type help information for question here...."
                                    value={q.description}
                                    onChange={(e) => updateQuestion(q.id, 'description', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Display Title</label>
                                  <input
                                    type="text"
                                    placeholder="Display Title"
                                    value={q.displayTitle}
                                    onChange={(e) => updateQuestion(q.id, 'displayTitle', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Variable Name</label>
                                  <input
                                    type="text"
                                    placeholder="Define variable name"
                                    value={q.variableName}
                                    onChange={(e) => updateQuestion(q.id, 'variableName', e.target.value)}
                                  />
                                </div>
                                {renderMediaTypeSelector(q)}
                                <div className="form-row align-start">
                                  <label>Options</label>
                                  <div className="input-column">
                                    <textarea
                                      className="form-textarea"
                                      value={q.options}
                                      onChange={(e) => updateQuestion(q.id, 'options', e.target.value)}
                                    ></textarea>
                                    <span className="help-text">One option per line</span>
                                  </div>
                                </div>
                                {renderOptionMediaSelector(q)}
                                <div className="form-row">
                                  <label>Default Value</label>
                                  <input
                                    type="text"
                                    placeholder="Set default value"
                                    value={q.defaultValue}
                                    onChange={(e) => updateQuestion(q.id, 'defaultValue', e.target.value)}
                                  />
                                </div>
                                <div className="form-row align-start">
                                  <label>Hidden Options</label>
                                  <div className="input-column">
                                    <textarea
                                      className="form-textarea"
                                      value={q.hiddenOptions}
                                      onChange={(e) => updateQuestion(q.id, 'hiddenOptions', e.target.value)}
                                    ></textarea>
                                    <span className="help-text">One option per line</span>
                                  </div>
                                </div>
                                {renderOptionMediaSelector(q)}
                                <div className="form-row">
                                  <label>SPSS Codes</label>
                                  <div className="input-column">
                                    <button className="q-cyan-btn">Define</button>
                                    <span className="help-text">Default code values will be in sequence of 1,2,3...</span>
                                  </div>
                                </div>
                                <div className="form-row-compact">
                                  <label>Is Question Required?</label>
                                  <input
                                    type="checkbox"
                                    checked={q.required}
                                    onChange={(e) => updateQuestion(q.id, 'required', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row-compact">
                                  <label>Enable Text Search</label>
                                  <input
                                    type="checkbox"
                                    checked={q.enableTextSearch}
                                    onChange={(e) => updateQuestion(q.id, 'enableTextSearch', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row-compact">
                                  <label>Randomize Options</label>
                                  <input
                                    type="checkbox"
                                    checked={q.randomizeOptions}
                                    onChange={(e) => updateQuestion(q.id, 'randomizeOptions', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Layout</label>
                                  <div className="orientation-group">
                                    <label><input type="radio" checked={q.orientation === 'Vertical'} onChange={() => updateQuestion(q.id, 'orientation', 'Vertical')} /> Vertical</label>
                                    <label><input type="radio" checked={q.orientation === 'Horizontal'} onChange={() => updateQuestion(q.id, 'orientation', 'Horizontal')} /> Horizontal</label>
                                  </div>
                                </div>
                              </div>
                            )}

                            {q.type === 'Drop Down with Other' && (
                              <div className="question-form">
                                <div className="form-row">
                                  <label>Description</label>
                                  <input
                                    type="text"
                                    placeholder="Type help information for question here...."
                                    value={q.description}
                                    onChange={(e) => updateQuestion(q.id, 'description', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Display Title</label>
                                  <input
                                    type="text"
                                    placeholder="Display Title"
                                    value={q.displayTitle}
                                    onChange={(e) => updateQuestion(q.id, 'displayTitle', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Variable Name</label>
                                  <input
                                    type="text"
                                    placeholder="Define variable name"
                                    value={q.variableName}
                                    onChange={(e) => updateQuestion(q.id, 'variableName', e.target.value)}
                                  />
                                </div>
                                {renderMediaTypeSelector(q)}
                                <div className="form-row align-start">
                                  <label>Options</label>
                                  <div className="input-column">
                                    <textarea
                                      className="form-textarea"
                                      value={q.options}
                                      onChange={(e) => updateQuestion(q.id, 'options', e.target.value)}
                                    ></textarea>
                                    <span className="help-text">One option per line</span>
                                  </div>
                                </div>
                                {renderOptionMediaSelector(q)}
                                <div className="form-row">
                                  <label>Default Value</label>
                                  <input
                                    type="text"
                                    placeholder="Set default value"
                                    value={q.defaultValue}
                                    onChange={(e) => updateQuestion(q.id, 'defaultValue', e.target.value)}
                                  />
                                </div>
                                <div className="form-row align-start">
                                  <label>Hidden Options</label>
                                  <div className="input-column">
                                    <textarea
                                      className="form-textarea"
                                      value={q.hiddenOptions}
                                      onChange={(e) => updateQuestion(q.id, 'hiddenOptions', e.target.value)}
                                    ></textarea>
                                    <span className="help-text">One option per line</span>
                                  </div>
                                </div>
                                {renderOptionMediaSelector(q)}
                                <div className="form-row">
                                  <label>SPSS Codes</label>
                                  <div className="input-column">
                                    <button className="q-cyan-btn">Define</button>
                                    <span className="help-text">Default code values will be in sequence of 1,2,3...</span>
                                  </div>
                                </div>
                                <div className="form-row-compact">
                                  <label>Is Question Required?</label>
                                  <input
                                    type="checkbox"
                                    checked={q.required}
                                    onChange={(e) => updateQuestion(q.id, 'required', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row-compact">
                                  <label>Is Other Text Optional?</label>
                                  <input
                                    type="checkbox"
                                    checked={q.isOtherTextOptional}
                                    onChange={(e) => updateQuestion(q.id, 'isOtherTextOptional', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row-compact">
                                  <label>Enable Text Search</label>
                                  <input
                                    type="checkbox"
                                    checked={q.enableTextSearch}
                                    onChange={(e) => updateQuestion(q.id, 'enableTextSearch', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row-compact">
                                  <label>Randomize Options</label>
                                  <input
                                    type="checkbox"
                                    checked={q.randomizeOptions}
                                    onChange={(e) => updateQuestion(q.id, 'randomizeOptions', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Layout</label>
                                  <div className="orientation-group">
                                    <label><input type="radio" checked={q.orientation === 'Vertical'} onChange={() => updateQuestion(q.id, 'orientation', 'Vertical')} /> Vertical</label>
                                    <label><input type="radio" checked={q.orientation === 'Horizontal'} onChange={() => updateQuestion(q.id, 'orientation', 'Horizontal')} /> Horizontal</label>
                                  </div>
                                </div>
                              </div>
                            )}

                            {q.type === 'Radio Button with Other' && (
                              <div className="question-form">
                                <div className="form-row">
                                  <label>Display Title</label>
                                  <input
                                    type="text"
                                    placeholder="Display Title"
                                    value={q.displayTitle}
                                    onChange={(e) => updateQuestion(q.id, 'displayTitle', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Variable Name</label>
                                  <input
                                    type="text"
                                    placeholder="Define variable name"
                                    value={q.variableName}
                                    onChange={(e) => updateQuestion(q.id, 'variableName', e.target.value)}
                                  />
                                </div>
                                {renderMediaTypeSelector(q)}
                                <div className="form-row align-start">
                                  <label>Options</label>
                                  <div className="input-column">
                                    <textarea
                                      className="form-textarea"
                                      value={q.options}
                                      onChange={(e) => updateQuestion(q.id, 'options', e.target.value)}
                                    ></textarea>
                                    <div className="textarea-footer">
                                      <span className="help-text">One option per line</span>
                                      <button className="q-cyan-btn small-btn">Advance</button>
                                    </div>
                                  </div>
                                </div>
                                {renderOptionMediaSelector(q)}
                                <div className="form-row">
                                  <label>Default Value</label>
                                  <input
                                    type="text"
                                    placeholder="Set default value"
                                    value={q.defaultValue}
                                    onChange={(e) => updateQuestion(q.id, 'defaultValue', e.target.value)}
                                  />
                                </div>
                                <div className="form-row align-start">
                                  <label>Hidden Options</label>
                                  <div className="input-column">
                                    <textarea
                                      className="form-textarea"
                                      value={q.hiddenOptions}
                                      onChange={(e) => updateQuestion(q.id, 'hiddenOptions', e.target.value)}
                                    ></textarea>
                                    <span className="help-text">One option per line</span>
                                  </div>
                                </div>
                                {renderOptionMediaSelector(q)}
                                <div className="form-row">
                                  <label>SPSS Codes</label>
                                  <div className="input-column">
                                    <button className="q-cyan-btn">Define</button>
                                    <span className="help-text">Default code values will be in sequence of 1,2,3...</span>
                                  </div>
                                </div>
                                <div className="form-row">
                                  <label>Image as Option</label>
                                  <div className="input-with-button">
                                    <input type="text" value={q.imageGroup} readOnly />
                                    <button className="q-cyan-btn">Select Group</button>
                                  </div>
                                </div>
                                <div className="form-row">
                                  <label>Is Question Required?</label>
                                  <input
                                    type="checkbox"
                                    checked={q.required}
                                    onChange={(e) => updateQuestion(q.id, 'required', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Number of Columns</label>
                                  <div className="input-with-suffix-text">
                                    <input type="text" className="small-input" value={q.numColumns} onChange={(e) => updateQuestion(q.id, 'numColumns', e.target.value)} />
                                    <span className="suffix-text">(Web Survey Only)</span>
                                  </div>
                                </div>
                                <div className="form-row">
                                  <label>Randomize Options</label>
                                  <input
                                    type="checkbox"
                                    checked={q.randomizeOptions}
                                    onChange={(e) => updateQuestion(q.id, 'randomizeOptions', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Layout</label>
                                  <div className="orientation-group">
                                    <label><input type="radio" checked={q.orientation === 'Vertical'} onChange={() => updateQuestion(q.id, 'orientation', 'Vertical')} /> Vertical</label>
                                    <label><input type="radio" checked={q.orientation === 'Horizontal'} onChange={() => updateQuestion(q.id, 'orientation', 'Horizontal')} /> Horizontal</label>
                                  </div>
                                </div>
                              </div>
                            )}


                            {(q.type === 'Radio Button' || q.type === 'Radio Button with Text') && (
                              <div className="question-form">
                                <div className="form-row">
                                  <label>Display Title</label>
                                  <input
                                    type="text"
                                    placeholder="Display Title"
                                    value={q.displayTitle}
                                    onChange={(e) => updateQuestion(q.id, 'displayTitle', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Variable Name</label>
                                  <input
                                    type="text"
                                    placeholder="Define variable name"
                                    value={q.variableName}
                                    onChange={(e) => updateQuestion(q.id, 'variableName', e.target.value)}
                                  />
                                </div>
                                {renderMediaTypeSelector(q)}
                                <div className="form-row align-start">
                                  <label>Options</label>
                                  <div className="input-column">
                                    <textarea
                                      className="form-textarea"
                                      value={q.options}
                                      onChange={(e) => updateQuestion(q.id, 'options', e.target.value)}
                                    ></textarea>
                                    <div className="textarea-footer">
                                      <span className="help-text">One option per line</span>
                                      <button className="q-cyan-btn small-btn">Advance</button>
                                    </div>
                                  </div>
                                </div>
                                {renderOptionMediaSelector(q)}
                                <div className="form-row">
                                  <label>Default Value</label>
                                  <input
                                    type="text"
                                    placeholder="Set default value"
                                    value={q.defaultValue}
                                    onChange={(e) => updateQuestion(q.id, 'defaultValue', e.target.value)}
                                  />
                                </div>
                                <div className="form-row align-start">
                                  <label>Hidden Options</label>
                                  <div className="input-column">
                                    <textarea
                                      className="form-textarea"
                                      value={q.hiddenOptions}
                                      onChange={(e) => updateQuestion(q.id, 'hiddenOptions', e.target.value)}
                                    ></textarea>
                                    <span className="help-text">One option per line</span>
                                  </div>
                                </div>
                                {renderOptionMediaSelector(q)}
                                <div className="form-row">
                                  <label>SPSS Codes</label>
                                  <div className="input-column">
                                    <button className="q-cyan-btn">Define</button>
                                    <span className="help-text">Default code values will be in sequence of 1,2,3...</span>
                                  </div>
                                </div>
                                <div className="form-row">
                                  <label>Image as Option</label>
                                  <div className="input-with-button">
                                    <input type="text" value={q.imageGroup} readOnly />
                                    <button className="q-cyan-btn">Select Group</button>
                                  </div>
                                </div>
                                <div className="form-row">
                                  <label>Is Question Required?</label>
                                  <input
                                    type="checkbox"
                                    checked={q.required}
                                    onChange={(e) => updateQuestion(q.id, 'required', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Number of Columns</label>
                                  <div className="input-with-suffix-text">
                                    <input type="text" className="small-input" value={q.numColumns} onChange={(e) => updateQuestion(q.id, 'numColumns', e.target.value)} />
                                    <span className="suffix-text">(Web Survey Only)</span>
                                  </div>
                                </div>
                                <div className="form-row">
                                  <label>Randomize Options</label>
                                  <input
                                    type="checkbox"
                                    checked={q.randomizeOptions}
                                    onChange={(e) => updateQuestion(q.id, 'randomizeOptions', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Layout</label>
                                  <div className="orientation-group">
                                    <label><input type="radio" checked={q.orientation === 'Vertical'} onChange={() => updateQuestion(q.id, 'orientation', 'Vertical')} /> Vertical</label>
                                    <label><input type="radio" checked={q.orientation === 'Horizontal'} onChange={() => updateQuestion(q.id, 'orientation', 'Horizontal')} /> Horizontal</label>
                                  </div>
                                </div>
                              </div>
                            )}


                            {q.type === 'Email' && (
                              <div className="question-form">
                                <div className="form-row">
                                  <label>Description</label>
                                  <input
                                    type="text"
                                    placeholder="Type help information for question here...."
                                    value={q.description}
                                    onChange={(e) => updateQuestion(q.id, 'description', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Display Title</label>
                                  <input
                                    type="text"
                                    placeholder="Display Title"
                                    value={q.displayTitle}
                                    onChange={(e) => updateQuestion(q.id, 'displayTitle', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Variable Name</label>
                                  <input
                                    type="text"
                                    placeholder="Define variable name"
                                    value={q.variableName}
                                    onChange={(e) => updateQuestion(q.id, 'variableName', e.target.value)}
                                  />
                                </div>
                                {renderMediaTypeSelector(q)}
                                <div className="form-row-compact">
                                  <label>Is Question Required?</label>
                                  <input
                                    type="checkbox"
                                    checked={q.required}
                                    onChange={(e) => updateQuestion(q.id, 'required', e.target.checked)}
                                  />
                                </div>
                              </div>
                            )}

                            {q.type === 'Phone Number' && (
                              <div className="question-form">
                                <div className="form-row">
                                  <label>Description</label>
                                  <input
                                    type="text"
                                    placeholder="Type help information for question here...."
                                    value={q.description}
                                    onChange={(e) => updateQuestion(q.id, 'description', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Display Title</label>
                                  <input
                                    type="text"
                                    placeholder="Display Title"
                                    value={q.displayTitle}
                                    onChange={(e) => updateQuestion(q.id, 'displayTitle', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Variable Name</label>
                                  <input
                                    type="text"
                                    placeholder="Define variable name"
                                    value={q.variableName}
                                    onChange={(e) => updateQuestion(q.id, 'variableName', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Limit Value between</label>
                                  <div className="limit-inputs">
                                    <input
                                      type="text"
                                      value={q.limitFrom}
                                      placeholder=""
                                      onChange={(e) => updateQuestion(q.id, 'limitFrom', e.target.value)}
                                    />
                                    <span>-</span>
                                    <input
                                      type="text"
                                      value={q.limitTo}
                                      placeholder=""
                                      onChange={(e) => updateQuestion(q.id, 'limitTo', e.target.value)}
                                    />
                                  </div>
                                </div>
                                {renderMediaTypeSelector(q)}
                                <div className="form-row-compact">
                                  <label>Is Question Required?</label>
                                  <input
                                    type="checkbox"
                                    checked={q.required}
                                    onChange={(e) => updateQuestion(q.id, 'required', e.target.checked)}
                                  />
                                </div>
                              </div>
                            )}

                            {(q.type === 'Singleline Text Input' || q.type === 'Multiline Text Input') && (
                              <div className="question-form">
                                <div className="form-row">
                                  <label>Description</label>
                                  <input
                                    type="text"
                                    placeholder="Type help information for question here...."
                                    value={q.description}
                                    onChange={(e) => updateQuestion(q.id, 'description', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Display Title</label>
                                  <input
                                    type="text"
                                    placeholder="Display Title"
                                    value={q.displayTitle}
                                    onChange={(e) => updateQuestion(q.id, 'displayTitle', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Variable Name</label>
                                  <input
                                    type="text"
                                    placeholder="Define variable name"
                                    value={q.variableName}
                                    onChange={(e) => updateQuestion(q.id, 'variableName', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Formula</label>
                                  <input
                                    type="text"
                                    placeholder="Define Formula"
                                    value={q.formula}
                                    onChange={(e) => updateQuestion(q.id, 'formula', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Default Value</label>
                                  <input
                                    type="text"
                                    placeholder="Set default value"
                                    value={q.defaultValue}
                                    onChange={(e) => updateQuestion(q.id, 'defaultValue', e.target.value)}
                                  />
                                </div>
                                {renderMediaTypeSelector(q)}
                                <div className="form-row">
                                  <label>Suffix</label>
                                  <input
                                    type="text"
                                    value={q.suffix}
                                    onChange={(e) => updateQuestion(q.id, 'suffix', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Limit Length</label>
                                  <div className="limit-inputs">
                                    <input
                                      type="text"
                                      value={q.limitFrom}
                                      placeholder=""
                                      onChange={(e) => updateQuestion(q.id, 'limitFrom', e.target.value)}
                                    />
                                    <span>To</span>
                                    <input
                                      type="text"
                                      value={q.limitTo}
                                      placeholder=""
                                      onChange={(e) => updateQuestion(q.id, 'limitTo', e.target.value)}
                                    />
                                  </div>
                                </div>
                                <div className="form-row-compact">
                                  <label>Is Question Required?</label>
                                  <input
                                    type="checkbox"
                                    checked={q.required}
                                    onChange={(e) => updateQuestion(q.id, 'required', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row-compact">
                                  <label>Display In Survey</label>
                                  <input
                                    type="checkbox"
                                    checked={q.displayInSurvey}
                                    onChange={(e) => updateQuestion(q.id, 'displayInSurvey', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Validation Pattern</label>
                                  <input
                                    type="text"
                                    placeholder="Define validation pattern"
                                    value={q.validationPattern}
                                    onChange={(e) => updateQuestion(q.id, 'validationPattern', e.target.value)}
                                  />
                                </div>
                                <div className="validation-help">
                                  This field should contain the Regular Expression to validate the answer of this question.
                                  For more details, refer: <a href="https://en.wikipedia.org/wiki/Regular_expression" target="_blank">https://en.wikipedia.org/wiki/Regular_expression</a>
                                </div>
                                <div className="form-row">
                                  <label>Validation Message</label>
                                  <input
                                    type="text"
                                    placeholder="Define validation message"
                                    value={q.validationMessage}
                                    onChange={(e) => updateQuestion(q.id, 'validationMessage', e.target.value)}
                                  />
                                </div>
                              </div>
                            )}

                            {(q.type === 'Radio Grid' || q.type === 'Radio Grid with Other') && (
                              <div className="question-form">
                                <div className="form-row">
                                  <label>Display Title</label>
                                  <input
                                    type="text"
                                    placeholder="Display Title"
                                    value={q.displayTitle}
                                    onChange={(e) => updateQuestion(q.id, 'displayTitle', e.target.value)}
                                  />
                                </div>
                                {renderMediaTypeSelector(q)}
                                <div className="form-row align-start">
                                  <label>Row Options (One per line)</label>
                                  <div className="input-column">
                                    <textarea
                                      className="form-textarea"
                                      value={q.rowOptions}
                                      onChange={(e) => updateQuestion(q.id, 'rowOptions', e.target.value)}
                                    ></textarea>
                                    <span className="help-text">One question per line. Maximum 100 character length.</span>
                                  </div>
                                </div>
                                <div className="form-row align-start">
                                  <label>Column Options (One per line)</label>
                                  <div className="input-column">
                                    <textarea
                                      className="form-textarea"
                                      value={q.columnOptions}
                                      onChange={(e) => updateQuestion(q.id, 'columnOptions', e.target.value)}
                                    ></textarea>
                                    <span className="help-text">One option per line</span>
                                  </div>
                                </div>
                                <div className="form-row align-start">
                                  <label>Hidden Column Options</label>
                                  <div className="input-column">
                                    <textarea
                                      className="form-textarea"
                                      value={q.hiddenColumnOptions}
                                      onChange={(e) => updateQuestion(q.id, 'hiddenColumnOptions', e.target.value)}
                                    ></textarea>
                                    <span className="help-text">One option per line</span>
                                  </div>
                                </div>
                                <div className="form-row">
                                  <label>Variable Name</label>
                                  <input
                                    type="text"
                                    placeholder="Define variable name"
                                    value={q.variableName}
                                    onChange={(e) => updateQuestion(q.id, 'variableName', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>SPSS Codes</label>
                                  <div className="input-column">
                                    <button className="q-cyan-btn">Update</button>
                                    <span className="help-text">Default code values will be in sequence of 1,2,3...</span>
                                  </div>
                                </div>
                                <div className="form-row-compact">
                                  <label>Are All Questions Required?</label>
                                  <input
                                    type="checkbox"
                                    checked={q.required}
                                    onChange={(e) => updateQuestion(q.id, 'required', e.target.checked)}
                                  />
                                </div>
                                {q.type === 'Radio Grid with Other' && (
                                  <div className="form-row-compact">
                                    <label>Is Other Text Optional?</label>
                                    <input
                                      type="checkbox"
                                      checked={q.isOtherTextOptional}
                                      onChange={(e) => updateQuestion(q.id, 'isOtherTextOptional', e.target.checked)}
                                    />
                                  </div>
                                )}
                                <div className="form-row">
                                  <label>Minimum Questions Required</label>
                                  <input
                                    type="text"
                                    value={q.minQuestionsRequired}
                                    onChange={(e) => updateQuestion(q.id, 'minQuestionsRequired', e.target.value)}
                                  />
                                </div>
                                {q.minQuestionsRequired && (
                                  <div className="validation-help" style={{ color: 'red' }}>
                                    If "Minimum Questions Required" is specified, "Are All Questions Required" will be ignored.
                                  </div>
                                )}
                                <div className="form-row">
                                  <label>Layout</label>
                                  <div className="orientation-group">
                                    <label><input type="radio" checked={q.orientation === 'Vertical'} onChange={() => updateQuestion(q.id, 'orientation', 'Vertical')} /> Vertical</label>
                                    <label><input type="radio" checked={q.orientation === 'Horizontal'} onChange={() => updateQuestion(q.id, 'orientation', 'Horizontal')} /> Horizontal</label>
                                  </div>
                                </div>
                                <div className="form-row-compact">
                                  <label>Randomize Row Options</label>
                                  <input
                                    type="checkbox"
                                    checked={q.randomizeRowOptions}
                                    onChange={(e) => updateQuestion(q.id, 'randomizeRowOptions', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row-compact">
                                  <label>Randomize Column Options</label>
                                  <input
                                    type="checkbox"
                                    checked={q.randomizeColumnOptions}
                                    onChange={(e) => updateQuestion(q.id, 'randomizeColumnOptions', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Row Option Width</label>
                                  <input
                                    type="text"
                                    placeholder="Define width in pixel"
                                    value={q.rowOptionWidth}
                                    onChange={(e) => updateQuestion(q.id, 'rowOptionWidth', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Forward Row Options From</label>
                                  <input
                                    type="text"
                                    placeholder="Variable Name"
                                    value={q.forwardRowFrom}
                                    onChange={(e) => updateQuestion(q.id, 'forwardRowFrom', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Forward Row Options Type</label>
                                  <select value={q.forwardRowType} onChange={(e) => updateQuestion(q.id, 'forwardRowType', e.target.value)}>
                                    <option value="">Select Type</option>
                                    <option value="Selected">Selected</option>
                                    <option value="Unselected">Unselected</option>
                                  </select>
                                </div>
                                <div className="form-row align-start">
                                  <label>Forward Row Options Always Show (One per line)</label>
                                  <div className="input-column">
                                    <textarea
                                      className="form-textarea"
                                      value={q.forwardRowAlwaysShow}
                                      onChange={(e) => updateQuestion(q.id, 'forwardRowAlwaysShow', e.target.value)}
                                    ></textarea>
                                    <span className="help-text">One option per line</span>
                                  </div>
                                </div>
                                <div className="form-row">
                                  <label>Forward Column Options From</label>
                                  <input
                                    type="text"
                                    placeholder="Variable Name"
                                    value={q.forwardColumnFrom}
                                    onChange={(e) => updateQuestion(q.id, 'forwardColumnFrom', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Forward Column Options Type</label>
                                  <select value={q.forwardColumnType} onChange={(e) => updateQuestion(q.id, 'forwardColumnType', e.target.value)}>
                                    <option value="">Select Type</option>
                                    <option value="Selected">Selected</option>
                                    <option value="Unselected">Unselected</option>
                                  </select>
                                </div>
                                <div className="form-row align-start">
                                  <label>Forward Column Options Always Show (One per line)</label>
                                  <div className="input-column">
                                    <textarea
                                      className="form-textarea"
                                      value={q.forwardColumnAlwaysShow}
                                      onChange={(e) => updateQuestion(q.id, 'forwardColumnAlwaysShow', e.target.value)}
                                    ></textarea>
                                    <span className="help-text">One option per line</span>
                                  </div>
                                </div>
                                <div className="validation-help" style={{ color: 'red' }}>
                                  If number of rows or columns are more, it might not fit in single view of the mobile device. This depends on the screen size of the mobile device also. In this scenario, please scroll to right in columns area to view all columns and scroll to bottom to view all the rows.
                                </div>
                              </div>
                            )}

                            {(q.type === 'Checkbox Grid' || q.type === 'Checkbox Grid with Other' || q.type === 'Checkbox with Text') && (
                              <div className="question-form">
                                <div className="form-row">
                                  <label>Display Title</label>
                                  <input
                                    type="text"
                                    placeholder="Display Title"
                                    value={q.displayTitle}
                                    onChange={(e) => updateQuestion(q.id, 'displayTitle', e.target.value)}
                                  />
                                </div>
                                {renderMediaTypeSelector(q)}
                                <div className="form-row align-start">
                                  <label>Row Options (One per line)</label>
                                  <div className="input-column">
                                    <textarea
                                      className="form-textarea"
                                      value={q.rowOptions}
                                      onChange={(e) => updateQuestion(q.id, 'rowOptions', e.target.value)}
                                    ></textarea>
                                    <span className="help-text">One question per line. Maximum 100 character length.</span>
                                  </div>
                                </div>
                                <div className="form-row align-start">
                                  <label>Column Options (One per line)</label>
                                  <div className="input-column">
                                    <textarea
                                      className="form-textarea"
                                      value={q.columnOptions}
                                      onChange={(e) => updateQuestion(q.id, 'columnOptions', e.target.value)}
                                    ></textarea>
                                    <span className="help-text">One option per line</span>
                                  </div>
                                </div>
                                <div className="form-row align-start">
                                  <label>Unique Options (One per line)</label>
                                  <div className="input-column">
                                    <textarea
                                      className="form-textarea"
                                      value={q.uniqueOptions}
                                      onChange={(e) => updateQuestion(q.id, 'uniqueOptions', e.target.value)}
                                    ></textarea>
                                    <span className="help-text">One option per line</span>
                                  </div>
                                </div>
                                <div className="form-row align-start">
                                  <label>Hidden Column Options (One per line)</label>
                                  <div className="input-column">
                                    <textarea
                                      className="form-textarea"
                                      value={q.hiddenColumnOptions}
                                      onChange={(e) => updateQuestion(q.id, 'hiddenColumnOptions', e.target.value)}
                                    ></textarea>
                                    <span className="help-text">One option per line</span>
                                  </div>
                                </div>
                                <div className="form-row">
                                  <label>Variable Name</label>
                                  <input
                                    type="text"
                                    placeholder="Define variable name"
                                    value={q.variableName}
                                    onChange={(e) => updateQuestion(q.id, 'variableName', e.target.value)}
                                  />
                                </div>
                                <div className="form-row-compact">
                                  <label>Are All Questions Required?</label>
                                  <input
                                    type="checkbox"
                                    checked={q.required}
                                    onChange={(e) => updateQuestion(q.id, 'required', e.target.checked)}
                                  />
                                </div>
                                {(q.type === 'Checkbox Grid with Other' || q.type === 'Checkbox with Text') && (
                                  <div className="form-row-compact">
                                    <label>Is Other Text Optional?</label>
                                    <input
                                      type="checkbox"
                                      checked={q.isOtherTextOptional}
                                      onChange={(e) => updateQuestion(q.id, 'isOtherTextOptional', e.target.checked)}
                                    />
                                  </div>
                                )}
                                <div className="form-row">
                                  <label>Minimum Questions Required</label>
                                  <input
                                    type="text"
                                    value={q.minQuestionsRequired}
                                    onChange={(e) => updateQuestion(q.id, 'minQuestionsRequired', e.target.value)}
                                  />
                                </div>
                                {q.minQuestionsRequired && (
                                  <div className="validation-help" style={{ color: 'red' }}>
                                    If "Minimum Questions Required" is specified, "Are All Questions Required" will be ignored.
                                  </div>
                                )}
                                <div className="form-row">
                                  <label>Layout</label>
                                  <div className="orientation-group">
                                    <label><input type="radio" checked={q.orientation === 'Vertical'} onChange={() => updateQuestion(q.id, 'orientation', 'Vertical')} /> Vertical</label>
                                    <label><input type="radio" checked={q.orientation === 'Horizontal'} onChange={() => updateQuestion(q.id, 'orientation', 'Horizontal')} /> Horizontal</label>
                                  </div>
                                </div>
                                <div className="form-row-compact">
                                  <label>Randomize Row Options</label>
                                  <input
                                    type="checkbox"
                                    checked={q.randomizeRowOptions}
                                    onChange={(e) => updateQuestion(q.id, 'randomizeRowOptions', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row-compact">
                                  <label>Randomize Column Options</label>
                                  <input
                                    type="checkbox"
                                    checked={q.randomizeColumnOptions}
                                    onChange={(e) => updateQuestion(q.id, 'randomizeColumnOptions', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Row Option Width</label>
                                  <input
                                    type="text"
                                    placeholder="Define width in pixel"
                                    value={q.rowOptionWidth}
                                    onChange={(e) => updateQuestion(q.id, 'rowOptionWidth', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Forward Row Options From</label>
                                  <input
                                    type="text"
                                    placeholder="Variable Name"
                                    value={q.forwardRowFrom}
                                    onChange={(e) => updateQuestion(q.id, 'forwardRowFrom', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Forward Row Options Type</label>
                                  <select value={q.forwardRowType} onChange={(e) => updateQuestion(q.id, 'forwardRowType', e.target.value)}>
                                    <option value="">Select Type</option>
                                    <option value="Selected">Selected</option>
                                    <option value="Unselected">Unselected</option>
                                  </select>
                                </div>
                                <div className="form-row align-start">
                                  <label>Forward Row Options Always Show (One per line)</label>
                                  <div className="input-column">
                                    <textarea
                                      className="form-textarea"
                                      value={q.forwardRowAlwaysShow}
                                      onChange={(e) => updateQuestion(q.id, 'forwardRowAlwaysShow', e.target.value)}
                                    ></textarea>
                                    <span className="help-text">One option per line</span>
                                  </div>
                                </div>
                                <div className="form-row">
                                  <label>Forward Column Options From</label>
                                  <input
                                    type="text"
                                    placeholder="Variable Name"
                                    value={q.forwardColumnFrom}
                                    onChange={(e) => updateQuestion(q.id, 'forwardColumnFrom', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Forward Column Options Type</label>
                                  <select value={q.forwardColumnType} onChange={(e) => updateQuestion(q.id, 'forwardColumnType', e.target.value)}>
                                    <option value="">Select Type</option>
                                    <option value="Selected">Selected</option>
                                    <option value="Unselected">Unselected</option>
                                  </select>
                                </div>
                                <div className="form-row align-start">
                                  <label>Forward Column Options Always Show (One per line)</label>
                                  <div className="input-column">
                                    <textarea
                                      className="form-textarea"
                                      value={q.forwardColumnAlwaysShow}
                                      onChange={(e) => updateQuestion(q.id, 'forwardColumnAlwaysShow', e.target.value)}
                                    ></textarea>
                                    <span className="help-text">One option per line</span>
                                  </div>
                                </div>
                                <div className="form-row-compact">
                                  <label>Display As Grid in Tablet/iPad</label>
                                  <input
                                    type="checkbox"
                                    checked={q.displayAsGridTablet}
                                    onChange={(e) => updateQuestion(q.id, 'displayAsGridTablet', e.target.checked)}
                                  />
                                </div>
                                <div className="validation-help" style={{ color: 'red' }}>
                                  If number of rows or columns are more, it might not fit in single view of the mobile device. This depends on the screen size of the mobile device also. In this scenario, please scroll to right in columns area to view all columns and scroll to bottom to view all the rows.
                                </div>
                              </div>
                            )}

                            {(q.type === 'Number Grid' || q.type === 'Decimal Grid') && (
                              <div className="question-form">
                                <div className="form-row">
                                  <label>Display Title</label>
                                  <input
                                    type="text"
                                    placeholder="Display Title"
                                    value={q.displayTitle}
                                    onChange={(e) => updateQuestion(q.id, 'displayTitle', e.target.value)}
                                  />
                                </div>
                                {renderMediaTypeSelector(q)}
                                <div className="form-row align-start">
                                  <label>Row Options (One per line)</label>
                                  <div className="input-column">
                                    <textarea
                                      className="form-textarea"
                                      value={q.rowOptions}
                                      onChange={(e) => updateQuestion(q.id, 'rowOptions', e.target.value)}
                                    ></textarea>
                                    <span className="help-text">One question per line. Maximum 100 character length.</span>
                                  </div>
                                </div>
                                <div className="form-row align-start">
                                  <label>Column Options (One per line)</label>
                                  <div className="input-column">
                                    <textarea
                                      className="form-textarea"
                                      value={q.columnOptions}
                                      onChange={(e) => updateQuestion(q.id, 'columnOptions', e.target.value)}
                                    ></textarea>
                                    <span className="help-text">One option per line</span>
                                  </div>
                                </div>
                                {q.type === 'Decimal Grid' && (
                                  <div className="form-row">
                                    <label>Precision</label>
                                    <input
                                      type="text"
                                      value={q.precision}
                                      onChange={(e) => updateQuestion(q.id, 'precision', e.target.value)}
                                    />
                                  </div>
                                )}
                                <div className="form-row">
                                  <label>Variable Name</label>
                                  <input
                                    type="text"
                                    placeholder="Define variable name"
                                    value={q.variableName}
                                    onChange={(e) => updateQuestion(q.id, 'variableName', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Limit Value between</label>
                                  <div className="limit-inputs">
                                    <input
                                      type="text"
                                      value={q.limitFrom}
                                      placeholder=""
                                      onChange={(e) => updateQuestion(q.id, 'limitFrom', e.target.value)}
                                    />
                                    <span>-</span>
                                    <input
                                      type="text"
                                      value={q.limitTo}
                                      placeholder=""
                                      onChange={(e) => updateQuestion(q.id, 'limitTo', e.target.value)}
                                    />
                                  </div>
                                </div>
                                <div className="form-row-compact">
                                  <label>Are All Questions Required?</label>
                                  <input
                                    type="checkbox"
                                    checked={q.required}
                                    onChange={(e) => updateQuestion(q.id, 'required', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Row Option Width</label>
                                  <input
                                    type="text"
                                    placeholder="Define width in pixel"
                                    value={q.rowOptionWidth}
                                    onChange={(e) => updateQuestion(q.id, 'rowOptionWidth', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Forward Row Options From</label>
                                  <input
                                    type="text"
                                    placeholder="Variable Name"
                                    value={q.forwardRowFrom}
                                    onChange={(e) => updateQuestion(q.id, 'forwardRowFrom', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Forward Row Options Type</label>
                                  <select value={q.forwardRowType} onChange={(e) => updateQuestion(q.id, 'forwardRowType', e.target.value)}>
                                    <option value="">Select Type</option>
                                    <option value="Selected">Selected</option>
                                    <option value="Unselected">Unselected</option>
                                  </select>
                                </div>
                                <div className="form-row">
                                  <label>Layout</label>
                                  <div className="orientation-group">
                                    <label><input type="radio" checked={q.orientation === 'Vertical'} onChange={() => updateQuestion(q.id, 'orientation', 'Vertical')} /> Vertical</label>
                                    <label><input type="radio" checked={q.orientation === 'Horizontal'} onChange={() => updateQuestion(q.id, 'orientation', 'Horizontal')} /> Horizontal</label>
                                  </div>
                                </div>
                                <div className="form-row align-start">
                                  <label>Forward Row Options Always Show (One per line)</label>
                                  <div className="input-column">
                                    <textarea
                                      className="form-textarea"
                                      value={q.forwardRowAlwaysShow}
                                      onChange={(e) => updateQuestion(q.id, 'forwardRowAlwaysShow', e.target.value)}
                                    ></textarea>
                                    <span className="help-text">One option per line</span>
                                  </div>
                                </div>
                                <div className="form-row">
                                  <label>Forward Column Options From</label>
                                  <input
                                    type="text"
                                    placeholder="Variable Name"
                                    value={q.forwardColumnFrom}
                                    onChange={(e) => updateQuestion(q.id, 'forwardColumnFrom', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Forward Column Options Type</label>
                                  <select value={q.forwardColumnType} onChange={(e) => updateQuestion(q.id, 'forwardColumnType', e.target.value)}>
                                    <option value="">Select Type</option>
                                    <option value="Selected">Selected</option>
                                    <option value="Unselected">Unselected</option>
                                  </select>
                                </div>
                                <div className="form-row align-start">
                                  <label>Forward Column Options Always Show (One per line)</label>
                                  <div className="input-column">
                                    <textarea
                                      className="form-textarea"
                                      value={q.forwardColumnAlwaysShow}
                                      onChange={(e) => updateQuestion(q.id, 'forwardColumnAlwaysShow', e.target.value)}
                                    ></textarea>
                                    <span className="help-text">One option per line</span>
                                  </div>
                                </div>
                                <div className="form-row-compact">
                                  <label>Display As Grid in Tablet/iPad</label>
                                  <input
                                    type="checkbox"
                                    checked={q.displayAsGridTablet}
                                    onChange={(e) => updateQuestion(q.id, 'displayAsGridTablet', e.target.checked)}
                                  />
                                </div>
                                <div className="validation-help" style={{ color: 'red' }}>
                                  If number of rows or columns are more, it might not fit in single view of the mobile device. This depends on the screen size of the mobile device also. In this scenario, please scroll to right in columns area to view all columns and scroll to bottom to view all the rows.
                                </div>
                              </div>
                            )}

                            {q.type === 'Singleline Text Grid' && (
                              <div className="question-form">
                                <div className="form-row">
                                  <label>Display Title</label>
                                  <input
                                    type="text"
                                    placeholder="Display Title"
                                    value={q.displayTitle}
                                    onChange={(e) => updateQuestion(q.id, 'displayTitle', e.target.value)}
                                  />
                                </div>
                                {renderMediaTypeSelector(q)}
                                <div className="form-row align-start">
                                  <label>Row Options (One per line)</label>
                                  <div className="input-column">
                                    <textarea
                                      className="form-textarea"
                                      value={q.rowOptions}
                                      onChange={(e) => updateQuestion(q.id, 'rowOptions', e.target.value)}
                                    ></textarea>
                                    <span className="help-text">One question per line. Maximum 100 character length.</span>
                                  </div>
                                </div>
                                <div className="form-row align-start">
                                  <label>Column Options (One per line)</label>
                                  <div className="input-column">
                                    <textarea
                                      className="form-textarea"
                                      value={q.columnOptions}
                                      onChange={(e) => updateQuestion(q.id, 'columnOptions', e.target.value)}
                                    ></textarea>
                                    <span className="help-text">One option per line</span>
                                  </div>
                                </div>
                                <div className="form-row">
                                  <label>Variable Name</label>
                                  <input
                                    type="text"
                                    placeholder="Define variable name"
                                    value={q.variableName}
                                    onChange={(e) => updateQuestion(q.id, 'variableName', e.target.value)}
                                  />
                                </div>
                                <div className="form-row-compact">
                                  <label>Are All Questions Required?</label>
                                  <input
                                    type="checkbox"
                                    checked={q.required}
                                    onChange={(e) => updateQuestion(q.id, 'required', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Row Option Width</label>
                                  <input
                                    type="text"
                                    placeholder="Define width in pixel"
                                    value={q.rowOptionWidth}
                                    onChange={(e) => updateQuestion(q.id, 'rowOptionWidth', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Forward Row Options From</label>
                                  <input
                                    type="text"
                                    placeholder="Variable Name"
                                    value={q.forwardRowFrom}
                                    onChange={(e) => updateQuestion(q.id, 'forwardRowFrom', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Forward Row Options Type</label>
                                  <select value={q.forwardRowType} onChange={(e) => updateQuestion(q.id, 'forwardRowType', e.target.value)}>
                                    <option value="">Select Type</option>
                                    <option value="Selected">Selected</option>
                                    <option value="Unselected">Unselected</option>
                                  </select>
                                </div>
                                <div className="form-row align-start">
                                  <label>Forward Row Options Always Show (One per line)</label>
                                  <div className="input-column">
                                    <textarea
                                      className="form-textarea"
                                      value={q.forwardRowAlwaysShow}
                                      onChange={(e) => updateQuestion(q.id, 'forwardRowAlwaysShow', e.target.value)}
                                    ></textarea>
                                    <span className="help-text">One option per line</span>
                                  </div>
                                </div>
                                <div className="form-row">
                                  <label>Forward Column Options From</label>
                                  <input
                                    type="text"
                                    placeholder="Variable Name"
                                    value={q.forwardColumnFrom}
                                    onChange={(e) => updateQuestion(q.id, 'forwardColumnFrom', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Forward Column Options Type</label>
                                  <select value={q.forwardColumnType} onChange={(e) => updateQuestion(q.id, 'forwardColumnType', e.target.value)}>
                                    <option value="">Select Type</option>
                                    <option value="Selected">Selected</option>
                                    <option value="Unselected">Unselected</option>
                                  </select>
                                </div>
                                <div className="form-row align-start">
                                  <label>Forward Column Options Always Show (One per line)</label>
                                  <div className="input-column">
                                    <textarea
                                      className="form-textarea"
                                      value={q.forwardColumnAlwaysShow}
                                      onChange={(e) => updateQuestion(q.id, 'forwardColumnAlwaysShow', e.target.value)}
                                    ></textarea>
                                    <span className="help-text">One option per line</span>
                                  </div>
                                </div>
                                <div className="form-row">
                                  <label>Layout</label>
                                  <div className="orientation-group">
                                    <label><input type="radio" checked={q.orientation === 'Vertical'} onChange={() => updateQuestion(q.id, 'orientation', 'Vertical')} /> Vertical</label>
                                    <label><input type="radio" checked={q.orientation === 'Horizontal'} onChange={() => updateQuestion(q.id, 'orientation', 'Horizontal')} /> Horizontal</label>
                                  </div>
                                </div>
                                <div className="form-row-compact">
                                  <label>Display As Grid in Tablet/iPad</label>
                                  <input
                                    type="checkbox"
                                    checked={q.displayAsGridTablet}
                                    onChange={(e) => updateQuestion(q.id, 'displayAsGridTablet', e.target.checked)}
                                  />
                                </div>
                                <div className="validation-help" style={{ color: 'red' }}>
                                  If number of rows or columns are more, it might not fit in single view of the mobile device. This depends on the screen size of the mobile device also. In this scenario, please scroll to right in columns area to view all columns and scroll to bottom to view all the rows.
                                </div>
                              </div>
                            )}

                            {q.type === 'NPS Grid' && (
                              <div className="question-form">
                                <div className="form-row">
                                  <label>Display Title</label>
                                  <input
                                    type="text"
                                    placeholder="Display Title"
                                    value={q.displayTitle}
                                    onChange={(e) => updateQuestion(q.id, 'displayTitle', e.target.value)}
                                  />
                                </div>
                                {renderMediaTypeSelector(q)}
                                <div className="form-row align-start">
                                  <label>Row Options (One per line)</label>
                                  <div className="input-column">
                                    <textarea
                                      className="form-textarea"
                                      value={q.rowOptions}
                                      onChange={(e) => updateQuestion(q.id, 'rowOptions', e.target.value)}
                                    ></textarea>
                                    <span className="help-text">One question per line. Maximum 100 character length.</span>
                                  </div>
                                </div>
                                <div className="form-row">
                                  <label>Variable Name</label>
                                  <input
                                    type="text"
                                    placeholder="Define variable name"
                                    value={q.variableName}
                                    onChange={(e) => updateQuestion(q.id, 'variableName', e.target.value)}
                                  />
                                </div>
                                <div className="form-row-compact">
                                  <label>Are All Questions Required?</label>
                                  <input
                                    type="checkbox"
                                    checked={q.required}
                                    onChange={(e) => updateQuestion(q.id, 'required', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Minimum Questions Required</label>
                                  <input
                                    type="text"
                                    value={q.minQuestionsRequired}
                                    onChange={(e) => updateQuestion(q.id, 'minQuestionsRequired', e.target.value)}
                                  />
                                </div>
                                {q.minQuestionsRequired && (
                                  <div className="validation-help" style={{ color: 'red' }}>
                                    If "Minimum Questions Required" is specified, "Are All Questions Required" will be ignored.
                                  </div>
                                )}
                                <div className="form-row-compact">
                                  <label>Randomize Row Options</label>
                                  <input
                                    type="checkbox"
                                    checked={q.randomizeRowOptions}
                                    onChange={(e) => updateQuestion(q.id, 'randomizeRowOptions', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Row Option Width</label>
                                  <input
                                    type="text"
                                    placeholder="Define width in pixel"
                                    value={q.rowOptionWidth}
                                    onChange={(e) => updateQuestion(q.id, 'rowOptionWidth', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Forward Row Options From</label>
                                  <input
                                    type="text"
                                    placeholder="Variable Name"
                                    value={q.forwardRowFrom}
                                    onChange={(e) => updateQuestion(q.id, 'forwardRowFrom', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Forward Row Options Type</label>
                                  <select value={q.forwardRowType} onChange={(e) => updateQuestion(q.id, 'forwardRowType', e.target.value)}>
                                    <option value="">Select Type</option>
                                    <option value="Selected">Selected</option>
                                    <option value="Unselected">Unselected</option>
                                  </select>
                                </div>
                                <div className="form-row">
                                  <label>Layout</label>
                                  <div className="orientation-group">
                                    <label><input type="radio" checked={q.orientation === 'Vertical'} onChange={() => updateQuestion(q.id, 'orientation', 'Vertical')} /> Vertical</label>
                                    <label><input type="radio" checked={q.orientation === 'Horizontal'} onChange={() => updateQuestion(q.id, 'orientation', 'Horizontal')} /> Horizontal</label>
                                  </div>
                                </div>
                                <div className="form-row align-start">
                                  <label>Forward Row Options Always Show (One per line)</label>
                                  <div className="input-column">
                                    <textarea
                                      className="form-textarea"
                                      value={q.forwardRowAlwaysShow}
                                      onChange={(e) => updateQuestion(q.id, 'forwardRowAlwaysShow', e.target.value)}
                                    ></textarea>
                                    <span className="help-text">One option per line</span>
                                  </div>
                                </div>
                                <div className="validation-help" style={{ color: 'red' }}>
                                  If number of rows are more, it might not fit in single view of the mobile device. This depends on the screen size of the mobile device also. In this scenario, please scroll to bottom to view all the rows.
                                </div>
                              </div>
                            )}

                            {q.type === 'Number point Grid' && (
                              <div className="question-form">
                                <div className="form-row">
                                  <label>Display Title</label>
                                  <input
                                    type="text"
                                    placeholder="Display Title"
                                    value={q.displayTitle}
                                    onChange={(e) => updateQuestion(q.id, 'displayTitle', e.target.value)}
                                  />
                                </div>
                                {renderMediaTypeSelector(q)}
                                <div className="form-row align-start">
                                  <label>Row Options (One per line)</label>
                                  <div className="input-column">
                                    <textarea
                                      className="form-textarea"
                                      value={q.rowOptions}
                                      onChange={(e) => updateQuestion(q.id, 'rowOptions', e.target.value)}
                                    ></textarea>
                                    <span className="help-text">One question per line. Maximum 100 character length.</span>
                                  </div>
                                </div>
                                <div className="form-row align-start">
                                  <label>Column Options (One per line)</label>
                                  <div className="input-column">
                                    <textarea
                                      className="form-textarea"
                                      value={q.columnOptions}
                                      onChange={(e) => updateQuestion(q.id, 'columnOptions', e.target.value)}
                                    ></textarea>
                                    <span className="help-text">One option per line</span>
                                  </div>
                                </div>
                                <div className="form-row">
                                  <label>Variable Name</label>
                                  <input
                                    type="text"
                                    placeholder="Define variable name"
                                    value={q.variableName}
                                    onChange={(e) => updateQuestion(q.id, 'variableName', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Limit Value between</label>
                                  <div className="limit-inputs">
                                    <input
                                      type="text"
                                      value={q.limitFrom}
                                      placeholder=""
                                      onChange={(e) => updateQuestion(q.id, 'limitFrom', e.target.value)}
                                    />
                                    <span>-</span>
                                    <input
                                      type="text"
                                      value={q.limitTo}
                                      placeholder=""
                                      onChange={(e) => updateQuestion(q.id, 'limitTo', e.target.value)}
                                    />
                                  </div>
                                </div>
                                <div className="form-row-compact">
                                  <label>Are All Questions Required?</label>
                                  <input
                                    type="checkbox"
                                    checked={q.required}
                                    onChange={(e) => updateQuestion(q.id, 'required', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row-compact">
                                  <label>Display As Grid in Tablet/iPad</label>
                                  <input
                                    type="checkbox"
                                    checked={q.displayAsGridTablet}
                                    onChange={(e) => updateQuestion(q.id, 'displayAsGridTablet', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Row Option Width</label>
                                  <input
                                    type="text"
                                    placeholder="Define width in pixel"
                                    value={q.rowOptionWidth}
                                    onChange={(e) => updateQuestion(q.id, 'rowOptionWidth', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Forward Row Options From</label>
                                  <input
                                    type="text"
                                    placeholder="Variable Name"
                                    value={q.forwardRowFrom}
                                    onChange={(e) => updateQuestion(q.id, 'forwardRowFrom', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Forward Row Options Type</label>
                                  <select value={q.forwardRowType} onChange={(e) => updateQuestion(q.id, 'forwardRowType', e.target.value)}>
                                    <option value="">Select Type</option>
                                    <option value="Selected">Selected</option>
                                    <option value="Unselected">Unselected</option>
                                  </select>
                                </div>
                                <div className="form-row align-start">
                                  <label>Forward Row Options Always Show (One per line)</label>
                                  <div className="input-column">
                                    <textarea
                                      className="form-textarea"
                                      value={q.forwardRowAlwaysShow}
                                      onChange={(e) => updateQuestion(q.id, 'forwardRowAlwaysShow', e.target.value)}
                                    ></textarea>
                                    <span className="help-text">One option per line</span>
                                  </div>
                                </div>
                                <div className="form-row">
                                  <label>Forward Column Options From</label>
                                  <input
                                    type="text"
                                    placeholder="Variable Name"
                                    value={q.forwardColumnFrom}
                                    onChange={(e) => updateQuestion(q.id, 'forwardColumnFrom', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Forward Column Options Type</label>
                                  <select value={q.forwardColumnType} onChange={(e) => updateQuestion(q.id, 'forwardColumnType', e.target.value)}>
                                    <option value="">Select Type</option>
                                    <option value="Selected">Selected</option>
                                    <option value="Unselected">Unselected</option>
                                  </select>
                                </div>
                                <div className="form-row align-start">
                                  <label>Forward Column Options Always Show (One per line)</label>
                                  <div className="input-column">
                                    <textarea
                                      className="form-textarea"
                                      value={q.forwardColumnAlwaysShow}
                                      onChange={(e) => updateQuestion(q.id, 'forwardColumnAlwaysShow', e.target.value)}
                                    ></textarea>
                                    <span className="help-text">One option per line</span>
                                  </div>
                                </div>
                                <div className="validation-help" style={{ color: 'red' }}>
                                  If number of rows or columns are more, it might not fit in single view of the mobile device. This depends on the screen size of the mobile device also. In this scenario, please scroll to right in columns area to view all columns and scroll to bottom to view all the rows.
                                </div>
                              </div>
                            )}

                            {q.type === 'Ranking - Checkbox' && (
                              <div className="question-form">
                                <div className="form-row">
                                  <label>Display Title</label>
                                  <input
                                    type="text"
                                    placeholder="Display Title"
                                    value={q.displayTitle}
                                    onChange={(e) => updateQuestion(q.id, 'displayTitle', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Variable Name</label>
                                  <input
                                    type="text"
                                    placeholder="Define variable name"
                                    value={q.variableName}
                                    onChange={(e) => updateQuestion(q.id, 'variableName', e.target.value)}
                                  />
                                </div>
                                <div className="form-row align-start">
                                  <label>Options (One per line)</label>
                                  <div className="input-column">
                                    <textarea
                                      className="form-textarea"
                                      value={q.options}
                                      onChange={(e) => updateQuestion(q.id, 'options', e.target.value)}
                                    ></textarea>
                                    <span className="help-text">One option per line</span>
                                  </div>
                                </div>
                                <div className="form-row">
                                  <label>Image as Option</label>
                                  <div className="input-column-row">
                                    <input
                                      type="text"
                                      value={q.imageGroup}
                                      onChange={(e) => updateQuestion(q.id, 'imageGroup', e.target.value)}
                                      readOnly
                                    />
                                    <button className="q-cyan-btn" onClick={() => setShowMediaSelector(q.id)}>Select Group</button>
                                  </div>
                                </div>
                                <div className="help-text-row">
                                  <span className="help-text">Select Image Group to display images as a options.</span>
                                </div>
                                <div className="form-row-compact">
                                  <label>Is Question Required?</label>
                                  <input
                                    type="checkbox"
                                    checked={q.required}
                                    onChange={(e) => updateQuestion(q.id, 'required', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Minimum Options Required</label>
                                  <input
                                    type="text"
                                    value={q.limitFrom}
                                    onChange={(e) => updateQuestion(q.id, 'limitFrom', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Maximum Options Selectable</label>
                                  <input
                                    type="text"
                                    value={q.limitTo}
                                    onChange={(e) => updateQuestion(q.id, 'limitTo', e.target.value)}
                                  />
                                </div>
                                <div className="form-row-compact">
                                  <label>Randomize Options</label>
                                  <input
                                    type="checkbox"
                                    checked={q.randomizeOptions}
                                    onChange={(e) => updateQuestion(q.id, 'randomizeOptions', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row-compact">
                                  <label>Export raw data instead of rank</label>
                                  <input
                                    type="checkbox"
                                    checked={q.exportRawData}
                                    onChange={(e) => updateQuestion(q.id, 'exportRawData', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Layout</label>
                                  <div className="orientation-group">
                                    <label><input type="radio" checked={q.orientation === 'Vertical'} onChange={() => updateQuestion(q.id, 'orientation', 'Vertical')} /> Vertical</label>
                                    <label><input type="radio" checked={q.orientation === 'Horizontal'} onChange={() => updateQuestion(q.id, 'orientation', 'Horizontal')} /> Horizontal</label>
                                  </div>
                                </div>
                              </div>
                            )}

                            {q.type === 'NSEC' && (
                              <div className="question-form">
                                <div className="nsec-section" style={{ border: '1px solid #eee', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                                  <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Household Items</h4>
                                  <div className="form-row">
                                    <label>Question</label>
                                    <input
                                      type="text"
                                      placeholder="e.g. Items owned/have access at home"
                                      value={q.nsecHouseholdTitle}
                                      onChange={(e) => updateQuestion(q.id, 'nsecHouseholdTitle', e.target.value)}
                                    />
                                  </div>
                                  <div className="form-row align-start">
                                    <label>Items</label>
                                    <div className="input-column">
                                      <textarea
                                        className="form-textarea"
                                        value={q.rowOptions}
                                        onChange={(e) => updateQuestion(q.id, 'rowOptions', e.target.value)}
                                      ></textarea>
                                      <span className="help-text">One option per line At least 10 items are required</span>
                                    </div>
                                  </div>
                                  <div className="form-row">
                                    <label>Variable Name</label>
                                    <input
                                      type="text"
                                      placeholder="Define variable name"
                                      value={q.variableName}
                                      onChange={(e) => updateQuestion(q.id, 'variableName', e.target.value)}
                                    />
                                  </div>
                                </div>

                                <div className="nsec-section" style={{ border: '1px solid #eee', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                                  <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Agricultural Land</h4>
                                  <div className="form-row">
                                    <label>Question</label>
                                    <input
                                      type="text"
                                      placeholder="e.g. Do you own agricultural land?"
                                      value={q.nsecAgricultureTitle}
                                      onChange={(e) => updateQuestion(q.id, 'nsecAgricultureTitle', e.target.value)}
                                    />
                                  </div>
                                  <div style={{ textAlign: 'left', marginTop: '10px' }}>
                                    <button
                                      className="btn-secondary"
                                      style={{ background: '#00a8a8', border: 'none', color: 'white', padding: '5px 15px', borderRadius: '4px' }}
                                      onClick={() => updateQuestion(q.id, 'nsecAgricultureTitle', '')}
                                    >
                                      Remove Question
                                    </button>
                                  </div>
                                </div>

                                <div className="nsec-section" style={{ border: '1px solid #eee', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                                  <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Education</h4>
                                  <div className="form-row">
                                    <label>Question</label>
                                    <input
                                      type="text"
                                      placeholder="e.g. Education of Chief Earner"
                                      value={q.nsecEducationTitle}
                                      onChange={(e) => updateQuestion(q.id, 'nsecEducationTitle', e.target.value)}
                                    />
                                  </div>
                                  <div className="form-row align-start">
                                    <label>Options</label>
                                    <div className="input-column">
                                      <textarea
                                        className="form-textarea"
                                        value={q.options}
                                        onChange={(e) => updateQuestion(q.id, 'options', e.target.value)}
                                      ></textarea>
                                      <span className="help-text">One option per line</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="nsec-section" style={{ border: '1px solid #eee', padding: '15px', borderRadius: '8px' }}>
                                  <div className="form-row">
                                    <label>Grade Question</label>
                                    <input
                                      type="text"
                                      placeholder="e.g. NSEC Grade"
                                      value={q.nsecGradeTitle}
                                      onChange={(e) => updateQuestion(q.id, 'nsecGradeTitle', e.target.value)}
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {q.type === 'SEC' && (
                              <div className="question-form">
                                <div className="nsec-section" style={{ border: '1px solid #eee', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                                  <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Occupation</h4>
                                  <div className="form-row">
                                    <label>Question</label>
                                    <input
                                      type="text"
                                      placeholder="e.g. Please tell us the occupation of Chief wage Earner (CWE)?"
                                      value={q.secOccupationTitle}
                                      onChange={(e) => updateQuestion(q.id, 'secOccupationTitle', e.target.value)}
                                    />
                                  </div>
                                  <div className="form-row align-start">
                                    <label>Items</label>
                                    <div className="input-column">
                                      <textarea
                                        className="form-textarea"
                                        value={q.rowOptions}
                                        onChange={(e) => updateQuestion(q.id, 'rowOptions', e.target.value)}
                                      ></textarea>
                                      <span className="help-text">One option per line At least 10 items are required</span>
                                    </div>
                                  </div>
                                  <div className="form-row">
                                    <label>Variable Name</label>
                                    <input
                                      type="text"
                                      placeholder="Define variable name"
                                      value={q.variableName}
                                      onChange={(e) => updateQuestion(q.id, 'variableName', e.target.value)}
                                    />
                                  </div>
                                </div>

                                <div className="nsec-section" style={{ border: '1px solid #eee', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                                  <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Education</h4>
                                  <div className="form-row">
                                    <label>Question</label>
                                    <input
                                      type="text"
                                      placeholder="e.g. Please tell us the highest education of Chief wage Earner (CWE)?"
                                      value={q.secEducationTitle}
                                      onChange={(e) => updateQuestion(q.id, 'secEducationTitle', e.target.value)}
                                    />
                                  </div>
                                  <div className="form-row align-start">
                                    <label>Options</label>
                                    <div className="input-column">
                                      <textarea
                                        className="form-textarea"
                                        value={q.options}
                                        onChange={(e) => updateQuestion(q.id, 'options', e.target.value)}
                                      ></textarea>
                                      <span className="help-text">One option per line</span>
                                    </div>
                                  </div>
                                  <div className="form-row">
                                    <label>Variable Name</label>
                                    <input
                                      type="text"
                                      placeholder="Define variable name"
                                      value={q.secEduVariableName}
                                      onChange={(e) => updateQuestion(q.id, 'secEduVariableName', e.target.value)}
                                    />
                                  </div>
                                </div>

                                <div className="nsec-section" style={{ border: '1px solid #eee', padding: '15px', borderRadius: '8px' }}>
                                  <div className="form-row">
                                    <label>Grade Question</label>
                                    <input
                                      type="text"
                                      placeholder="e.g. SEC Grade"
                                      value={q.secGradeTitle}
                                      onChange={(e) => updateQuestion(q.id, 'secGradeTitle', e.target.value)}
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {q.type === 'Rural SEC' && (
                              <div className="question-form">
                                <div className="nsec-section" style={{ border: '1px solid #eee', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                                  <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>House Wall Material</h4>
                                  <div className="form-row">
                                    <label>Question</label>
                                    <input
                                      type="text"
                                      placeholder="e.g. Select Material for Walls"
                                      value={q.ruralWallTitle}
                                      onChange={(e) => updateQuestion(q.id, 'ruralWallTitle', e.target.value)}
                                    />
                                  </div>
                                  <div className="form-row align-start">
                                    <label>Items</label>
                                    <div className="input-column">
                                      <textarea
                                        className="form-textarea"
                                        value={q.ruralWallOptions}
                                        onChange={(e) => updateQuestion(q.id, 'ruralWallOptions', e.target.value)}
                                      ></textarea>
                                      <span className="help-text">One option per line</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="nsec-section" style={{ border: '1px solid #eee', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                                  <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>House Roof Material</h4>
                                  <div className="form-row">
                                    <label>Question</label>
                                    <input
                                      type="text"
                                      placeholder="e.g. Select Material for Roof"
                                      value={q.ruralRoofTitle}
                                      onChange={(e) => updateQuestion(q.id, 'ruralRoofTitle', e.target.value)}
                                    />
                                  </div>
                                  <div className="form-row align-start">
                                    <label>Items</label>
                                    <div className="input-column">
                                      <textarea
                                        className="form-textarea"
                                        value={q.ruralRoofOptions}
                                        onChange={(e) => updateQuestion(q.id, 'ruralRoofOptions', e.target.value)}
                                      ></textarea>
                                      <span className="help-text">One option per line</span>
                                    </div>
                                  </div>
                                  <div className="form-row">
                                    <label>Variable Name</label>
                                    <input
                                      type="text"
                                      placeholder="Define variable name"
                                      value={q.variableName}
                                      onChange={(e) => updateQuestion(q.id, 'variableName', e.target.value)}
                                    />
                                  </div>
                                </div>

                                <div className="nsec-section" style={{ border: '1px solid #eee', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                                  <div className="form-row">
                                    <label>House Type Question</label>
                                    <input
                                      type="text"
                                      placeholder="e.g. House Type"
                                      value={q.ruralHouseTypeTitle}
                                      onChange={(e) => updateQuestion(q.id, 'ruralHouseTypeTitle', e.target.value)}
                                    />
                                  </div>
                                </div>

                                <div className="nsec-section" style={{ border: '1px solid #eee', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                                  <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Education</h4>
                                  <div className="form-row">
                                    <label>Question</label>
                                    <input
                                      type="text"
                                      placeholder="e.g. Level of Education"
                                      value={q.ruralEducationTitle}
                                      onChange={(e) => updateQuestion(q.id, 'ruralEducationTitle', e.target.value)}
                                    />
                                  </div>
                                  <div className="form-row align-start">
                                    <label>Options</label>
                                    <div className="input-column">
                                      <textarea
                                        className="form-textarea"
                                        value={q.options}
                                        onChange={(e) => updateQuestion(q.id, 'options', e.target.value)}
                                      ></textarea>
                                      <span className="help-text">One option per line</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="nsec-section" style={{ border: '1px solid #eee', padding: '15px', borderRadius: '8px' }}>
                                  <div className="form-row">
                                    <label>Grade Question</label>
                                    <input
                                      type="text"
                                      placeholder="e.g. Grade"
                                      value={q.ruralGradeTitle}
                                      onChange={(e) => updateQuestion(q.id, 'ruralGradeTitle', e.target.value)}
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {q.type === 'Cascade Options' && (
                              <div className="question-form" style={{ background: '#f0fbff', padding: '20px', borderRadius: '8px', border: '1px solid #c8eefd' }}>
                                <div className="form-row">
                                  <label>Cascade Data Source</label>
                                  <div className="media-input-wrapper">
                                    <input type="text" value={q.cascadeDataSource} readOnly placeholder="Select source..." />
                                    <button type="button" className="q-cyan-btn" onClick={() => openCascadePopup(q.id)}>
                                      {q.cascadeDataSource && q.cascadeDataSource !== 'Select' ? 'View Data Source' : 'Select Data Source'}
                                    </button>
                                  </div>
                                </div>
                                <div className="form-row">
                                  <label>Variable Name</label>
                                  <input
                                    type="text"
                                    placeholder="Define variable name"
                                    value={q.variableName}
                                    onChange={(e) => updateQuestion(q.id, 'variableName', e.target.value)}
                                  />
                                </div>

                                {/* Dynamic Levels mapped from cascadeLevels */}
                                {(q.cascadeLevels || []).map((level, idx) => (
                                  <React.Fragment key={idx}>
                                    <div className="form-row">
                                      <label>Question {idx + 1}</label>
                                      <input
                                        type="text"
                                        value={level.label}
                                        onChange={(e) => updateCascadeLevel(q.id, idx, 'label', e.target.value)}
                                      />
                                    </div>
                                    <div className="form-row-compact">
                                      <label>Display On Main Form?</label>
                                      <input
                                        type="checkbox"
                                        checked={level.displayOnMain}
                                        onChange={(e) => updateCascadeLevel(q.id, idx, 'displayOnMain', e.target.checked)}
                                      />
                                    </div>
                                  </React.Fragment>
                                ))}

                                <div className="form-row">
                                  <label>Question Type</label>
                                  <div className="type-options" style={{ gap: '20px', display: 'flex', fontSize: '14px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <input
                                        type="radio"
                                        name={`cascadeType-${q.id}`}
                                        checked={q.cascadeQuestionType === 'Dropdown'}
                                        onChange={() => updateQuestion(q.id, 'cascadeQuestionType', 'Dropdown')}
                                      /> Dropdown
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <input
                                        type="radio"
                                        name={`cascadeType-${q.id}`}
                                        checked={q.cascadeQuestionType === 'Radio'}
                                        onChange={() => updateQuestion(q.id, 'cascadeQuestionType', 'Radio')}
                                      /> Radio
                                    </label>
                                  </div>
                                </div>
                                <div className="form-row">
                                  <label>Layout</label>
                                  <div className="orientation-group">
                                    <label><input type="radio" checked={q.orientation === 'Vertical'} onChange={() => updateQuestion(q.id, 'orientation', 'Vertical')} /> Vertical</label>
                                    <label><input type="radio" checked={q.orientation === 'Horizontal'} onChange={() => updateQuestion(q.id, 'orientation', 'Horizontal')} /> Horizontal</label>
                                  </div>
                                </div>
                                <div className="form-row-compact">
                                  <label>Enable Text Search</label>
                                  <input
                                    type="checkbox"
                                    checked={q.enableTextSearch}
                                    onChange={(e) => updateQuestion(q.id, 'enableTextSearch', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row-compact">
                                  <label>Are All Questions Required?</label>
                                  <input
                                    type="checkbox"
                                    checked={q.cascadeAllRequired}
                                    onChange={(e) => updateQuestion(q.id, 'cascadeAllRequired', e.target.checked)}
                                  />
                                </div>
                              </div>
                            )}

                            {q.type === 'Ranking' && (
                              <div className="question-form">
                                <div className="form-row">
                                  <label>Display Title</label>
                                  <input
                                    type="text"
                                    placeholder="Display Title"
                                    value={q.displayTitle}
                                    onChange={(e) => updateQuestion(q.id, 'displayTitle', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Variable Name</label>
                                  <input
                                    type="text"
                                    placeholder="Define variable name"
                                    value={q.variableName}
                                    onChange={(e) => updateQuestion(q.id, 'variableName', e.target.value)}
                                  />
                                </div>
                                <div className="form-row align-start">
                                  <label>Questions (One per line)</label>
                                  <div className="input-column">
                                    <textarea
                                      className="form-textarea"
                                      value={q.rowOptions}
                                      onChange={(e) => updateQuestion(q.id, 'rowOptions', e.target.value)}
                                    ></textarea>
                                    <span className="help-text">One option per line</span>
                                  </div>
                                </div>
                                <div className="form-row-compact">
                                  <label>Randomize Rows</label>
                                  <input
                                    type="checkbox"
                                    checked={q.randomizeRowOptions}
                                    onChange={(e) => updateQuestion(q.id, 'randomizeRowOptions', e.target.checked)}
                                  />
                                </div>
                                <div className="validation-help" style={{ color: 'red' }}>
                                  If number of rows or columns are more, it might not fit in single view of the mobile device. This depends on the screen size of the mobile device also. In this scenario, please scroll to right in columns area to view all columns and scroll to bottom to view all the rows.
                                </div>
                                <div className="form-row">
                                  <label>Layout</label>
                                  <div className="orientation-group">
                                    <label><input type="radio" checked={q.orientation === 'Vertical'} onChange={() => updateQuestion(q.id, 'orientation', 'Vertical')} /> Vertical</label>
                                    <label><input type="radio" checked={q.orientation === 'Horizontal'} onChange={() => updateQuestion(q.id, 'orientation', 'Horizontal')} /> Horizontal</label>
                                  </div>
                                </div>
                              </div>
                            )}

                            {(q.type === 'Dropdown Grid' || q.type === 'Dropdown with Other Grid') && (
                              <div className="question-form">
                                <div className="form-row">
                                  <label>Display Title</label>
                                  <input
                                    type="text"
                                    placeholder="Display Title"
                                    value={q.displayTitle}
                                    onChange={(e) => updateQuestion(q.id, 'displayTitle', e.target.value)}
                                  />
                                </div>
                                <div className="form-row align-start">
                                  <label>Row Options (One per line)</label>
                                  <div className="input-column">
                                    <textarea
                                      className="form-textarea"
                                      value={q.rowOptions}
                                      onChange={(e) => updateQuestion(q.id, 'rowOptions', e.target.value)}
                                    ></textarea>
                                    <span className="help-text">One question per line. Maximum 100 character length.</span>
                                  </div>
                                </div>
                                <div className="form-row align-start">
                                  <label>Column Options (One per line)</label>
                                  <div className="input-column">
                                    <textarea
                                      className="form-textarea"
                                      value={q.columnOptions}
                                      onChange={(e) => updateQuestion(q.id, 'columnOptions', e.target.value)}
                                    ></textarea>
                                    <span className="help-text">One option per line</span>
                                  </div>
                                </div>
                                <div className="form-row align-start">
                                  <label>Question Options (One per line)</label>
                                  <div className="input-column">
                                    <textarea
                                      className="form-textarea"
                                      value={q.options}
                                      onChange={(e) => updateQuestion(q.id, 'options', e.target.value)}
                                    ></textarea>
                                    <span className="help-text">One option per line</span>
                                  </div>
                                </div>
                                <div className="form-row">
                                  <label>Variable Name</label>
                                  <input
                                    type="text"
                                    placeholder="Define variable name"
                                    value={q.variableName}
                                    onChange={(e) => updateQuestion(q.id, 'variableName', e.target.value)}
                                  />
                                </div>
                                <div className="form-row-compact">
                                  <label>Are All Questions Required?</label>
                                  <input
                                    type="checkbox"
                                    checked={q.required}
                                    onChange={(e) => updateQuestion(q.id, 'required', e.target.checked)}
                                  />
                                </div>
                                {q.type === 'Dropdown with Other Grid' && (
                                  <div className="form-row-compact">
                                    <label>Is Other Text Optional?</label>
                                    <input
                                      type="checkbox"
                                      checked={q.isOtherTextOptional}
                                      onChange={(e) => updateQuestion(q.id, 'isOtherTextOptional', e.target.checked)}
                                    />
                                  </div>
                                )}
                                <div className="form-row">
                                  <label>SPSS Codes</label>
                                  <div className="input-column">
                                    <button className="q-cyan-btn">Update</button>
                                    <span className="help-text">Default code values will be in sequence of 1,2,3...</span>
                                  </div>
                                </div>
                                <div className="form-row">
                                  <label>Row Option Width</label>
                                  <input
                                    type="text"
                                    placeholder="Define width in pixel"
                                    value={q.rowOptionWidth}
                                    onChange={(e) => updateQuestion(q.id, 'rowOptionWidth', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Forward Row Options From</label>
                                  <input
                                    type="text"
                                    placeholder="Variable Name"
                                    value={q.forwardRowFrom}
                                    onChange={(e) => updateQuestion(q.id, 'forwardRowFrom', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Forward Row Options Type</label>
                                  <select value={q.forwardRowType} onChange={(e) => updateQuestion(q.id, 'forwardRowType', e.target.value)}>
                                    <option value="">Select Type</option>
                                    <option value="Selected">Selected</option>
                                    <option value="Unselected">Unselected</option>
                                  </select>
                                </div>
                                <div className="form-row align-start">
                                  <label>Forward Row Options Always Show (One per line)</label>
                                  <div className="input-column">
                                    <textarea
                                      className="form-textarea"
                                      value={q.forwardRowAlwaysShow}
                                      onChange={(e) => updateQuestion(q.id, 'forwardRowAlwaysShow', e.target.value)}
                                    ></textarea>
                                    <span className="help-text">One option per line</span>
                                  </div>
                                </div>
                                <div className="form-row">
                                  <label>Forward Column Options From</label>
                                  <input
                                    type="text"
                                    placeholder="Variable Name"
                                    value={q.forwardColumnFrom}
                                    onChange={(e) => updateQuestion(q.id, 'forwardColumnFrom', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Forward Column Options Type</label>
                                  <select value={q.forwardColumnType} onChange={(e) => updateQuestion(q.id, 'forwardColumnType', e.target.value)}>
                                    <option value="">Select Type</option>
                                    <option value="Selected">Selected</option>
                                    <option value="Unselected">Unselected</option>
                                  </select>
                                </div>
                                <div className="form-row align-start">
                                  <label>Forward Column Options Always Show (One per line)</label>
                                  <div className="input-column">
                                    <textarea
                                      className="form-textarea"
                                      value={q.forwardColumnAlwaysShow}
                                      onChange={(e) => updateQuestion(q.id, 'forwardColumnAlwaysShow', e.target.value)}
                                    ></textarea>
                                    <span className="help-text">One option per line</span>
                                  </div>
                                </div>
                                <div className="form-row">
                                  <label>Forward Question Options From</label>
                                  <input
                                    type="text"
                                    placeholder="Variable Name"
                                    value={q.forwardQuestionFrom}
                                    onChange={(e) => updateQuestion(q.id, 'forwardQuestionFrom', e.target.value)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Forward Question Options Type</label>
                                  <select value={q.forwardQuestionType} onChange={(e) => updateQuestion(q.id, 'forwardQuestionType', e.target.value)}>
                                    <option value="">Select Type</option>
                                    <option value="Selected">Selected</option>
                                    <option value="Unselected">Unselected</option>
                                  </select>
                                </div>
                                <div className="form-row-compact">
                                  <label>Display As Grid in Tablet/iPad</label>
                                  <input
                                    type="checkbox"
                                    checked={q.displayAsGridTablet}
                                    onChange={(e) => updateQuestion(q.id, 'displayAsGridTablet', e.target.checked)}
                                  />
                                </div>
                                <div className="form-row">
                                  <label>Layout</label>
                                  <div className="orientation-group">
                                    <label><input type="radio" checked={q.orientation === 'Vertical'} onChange={() => updateQuestion(q.id, 'orientation', 'Vertical')} /> Vertical</label>
                                    <label><input type="radio" checked={q.orientation === 'Horizontal'} onChange={() => updateQuestion(q.id, 'orientation', 'Horizontal')} /> Horizontal</label>
                                  </div>
                                </div>
                                <div className="validation-help" style={{ color: 'red', marginTop: '10px' }}>
                                  If number of rows or columns are more, it might not fit in single view of the mobile device. This depends on the screen size of the mobile device also. In this scenario, please scroll to right in columns area to view all columns and scroll to bottom to view all the rows.
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="q-bottom-bar">
                <div className="q-pagination">
                  <div className="page-label">Pages</div>
                  {pages.map(pageNum => (
                    <div
                      key={pageNum}
                      className={`page-num ${currentPage === pageNum ? 'active' : ''}`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </div>
                  ))}
                  <button
                    className="add-page-btn"
                    onClick={() => {
                      const newPage = pages.length + 1;
                      setPages([...pages, newPage]);
                      setCurrentPage(newPage);
                    }}
                  >
                    +
                  </button>
                </div>
                <div className="q-actions">
                  <div className="page-options-wrapper">
                    <button className="btn-options" onClick={() => setShowPageOptions(!showPageOptions)}>
                      Page Options ▾
                    </button>
                    {showPageOptions && (
                      <div className="page-options-menu">
                        <div className="menu-item" onClick={duplicatePage}>Duplicate Page</div>
                        <div className="menu-item" onClick={insertPage}>Insert Page</div>
                        <div className="menu-item" onClick={deletePage}>Delete Page</div>
                      </div>
                    )}
                  </div>
                  <button className="btn-save" onClick={handleSaveQuestionnaire}>Save</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* MEDIA SELECTOR POPUP */}
        {
          showMediaSelector && (
            <div className="share-modal-overlay" style={{ zIndex: 100001 }}>
              <div className="modal" style={{ maxWidth: '400px', background: 'white', padding: '20px', borderRadius: '8px' }}>
                <h3>Select Image Group</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                  {['Political Parties', 'Brand Logos', 'Social Icons', 'Custom Assets'].map(group => (
                    <button
                      key={group}
                      className="modal-btn"
                      style={{ textAlign: 'left', padding: '12px' }}
                      onClick={() => {
                        updateQuestion(showMediaSelector, 'imageGroup', group);
                        setShowMediaSelector(null);
                      }}
                    >
                      {group}
                    </button>
                  ))}
                </div>
                <button className="modal-btn cancel" style={{ marginTop: '15px' }} onClick={() => setShowMediaSelector(null)}>Cancel</button>
              </div>
            </div>
          )
        }

        {/* CASCADE DATA SOURCE POPUP */}
        {
          showCascadePopup && (
            <div className="modal-overlay" style={{ zIndex: 999999, display: 'flex', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
              <div className="modal" style={{ maxWidth: '500px', width: '90%', background: 'white', padding: '20px', borderRadius: '8px' }}>
                <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0 }}>Cascade Data Source</h3>
                  <button
                    className="close-btn"
                    onClick={() => setShowCascadePopup(false)}
                    style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
                  >
                    &times;
                  </button>
                </div>

                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Select Data Source</label>
                    <select
                      className="form-control"
                      value={selectedCascadeSource}
                      onChange={(e) => setSelectedCascadeSource(e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    >
                      {cascadeSources.map((source, idx) => (
                        <option key={idx} value={source}>{source}</option>
                      ))}
                    </select>
                  </div>

                  <div className="action-buttons" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button className="q-cyan-btn small" disabled={selectedCascadeSource === 'Select'}>Download</button>
                    <button className="q-cyan-btn small" disabled={selectedCascadeSource === 'Select'}>Update Data</button>
                    <button
                      className="q-cyan-btn small"
                      onClick={() => document.getElementById('cascade-file-upload').click()}
                    >
                      Add New Data Source
                    </button>
                    <input
                      type="file"
                      id="cascade-file-upload"
                      accept=".xls,.xlsx"
                      style={{ display: 'none' }}
                      onChange={handleCascadeFileUpload}
                    />
                  </div>
                </div>

                <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    className="btn-save"
                    onClick={handleCascadeSave}
                    style={{ padding: '8px 20px', background: '#00bfa5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Save
                  </button>
                  <button
                    className="btn-cancel"
                    onClick={() => setShowCascadePopup(false)}
                    style={{ padding: '8px 20px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )
        }
      </Layout >
    );
  }

  // DETAILED VIEW
  if (showDetailedCreate) {
    return (
      <Layout user={user}>
        <div className="detailed-create-container">
          <div className="detailed-header">
            <h2>{isEditMode ? 'Edit Survey' : 'Create Surveys'}</h2>
            <button className="back-btn" onClick={() => {
              setShowDetailedCreate(false);
              setIsEditMode(false);
              setEditingSurveyId(null);
            }}>Back</button>
          </div>
          <div className="detailed-body">
            {/* LEFT COLUMN */}
            <div className="detailed-column">
              <div className="detailed-form-group">
                <label>Name<span className="asterisk">*</span></label>
                <div className="input-wrapper">
                  <input type="text" name="name" value={surveyForm.name} onChange={handleInputChange} />
                </div>
              </div>

              <div className="detailed-form-group">
                <label>Layout Type</label>
                <div className="layout-options">
                  <label className="layout-item">
                    <input type="radio" name="layoutType" value="portrait" checked={surveyForm.layoutType === 'portrait'} onChange={handleInputChange} />
                    <div className="layout-icon"></div>
                  </label>
                  <label className="layout-item">
                    <input type="radio" name="layoutType" value="landscape" checked={surveyForm.layoutType === 'landscape'} onChange={handleInputChange} />
                    <div className="layout-icon landscape"></div>
                  </label>
                </div>
              </div>

              <div className="detailed-form-group">
                <label>Survey Type</label>
                <div className="type-options">
                  <label className="layout-item">
                    <input type="radio" name="surveyType" value="app" checked={surveyForm.surveyType === 'app'} onChange={handleInputChange} />
                    <span>App Survey</span>
                  </label>
                  <label className="layout-item">
                    <input type="radio" name="surveyType" value="web" checked={surveyForm.surveyType === 'web'} onChange={handleInputChange} />
                    <span>Web Survey</span>
                  </label>
                </div>
              </div>

              <div className="detailed-form-group">
                <label>Header Text<span className="asterisk">*</span> <span className="info-help">?</span></label>
                <div className="input-wrapper">
                  <input type="text" name="headerText" value={surveyForm.headerText} onChange={handleInputChange} />
                </div>
              </div>

              <div className="detailed-form-group">
                <label>Welcome Image <span className="info-help">?</span></label>
                <div className="input-wrapper">
                  <input
                    type="file"
                    ref={welcomeImgRef}
                    style={{ display: 'none' }}
                    onChange={(e) => setSurveyForm({ ...surveyForm, welcomeImageName: e.target.files[0]?.name })}
                  />
                  <div className="image-preview-box" onClick={() => welcomeImgRef.current.click()} style={{ cursor: 'pointer' }}>
                    <div className="upload-overlay">📁 {surveyForm.welcomeImageName || 'Choose file'}</div>
                    <p>1200 x 1600 pixels</p>
                  </div>
                </div>
              </div>

              <div className="detailed-form-group">
                <label>Thank you Image<span className="asterisk">*</span> <span className="info-help">?</span></label>
                <div className="input-wrapper">
                  <input
                    type="file"
                    ref={thankYouImgRef}
                    style={{ display: 'none' }}
                    onChange={(e) => setSurveyForm({ ...surveyForm, thankYouImageName: e.target.files[0]?.name })}
                  />
                  <div className="thank-you-preview-box" onClick={() => thankYouImgRef.current.click()} style={{ cursor: 'pointer' }}>
                    {surveyForm.thankYouImageName || 'Thank You'}
                  </div>
                  <p style={{ fontSize: '11px', color: '#888', marginTop: '5px' }}>1200 x 1600 pixels</p>
                </div>
              </div>

              <div className="detailed-form-group">
                <label>Thank You Duration (Seconds) <span className="info-help">?</span></label>
                <div className="input-wrapper">
                  <input type="text" name="thankYouDuration" value={surveyForm.thankYouDuration} onChange={handleInputChange} />
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="detailed-column">
              <div className="detailed-form-group">
                <label>Theme <span className="info-help">?</span></label>
                <div className="input-wrapper">
                  <select name="theme" value={surveyForm.theme} onChange={handleInputChange}>
                    <option value="Default">Default</option>
                    <option value="Political Survey">Political Survey</option>
                  </select>
                </div>
              </div>

              <div className="detailed-form-group">
                <label>Access Pin <span className="info-help">?</span></label>
                <div className="input-wrapper">
                  <input type="text" name="accessPin" value={surveyForm.accessPin} onChange={handleInputChange} />
                </div>
              </div>

              <div className="form-row-checkbox">
                <label>Loop Survey</label>
                <span className="info-help">?</span>
                <input type="checkbox" name="loopSurvey" checked={surveyForm.loopSurvey} onChange={handleInputChange} />
              </div>

              <div className="form-row-checkbox">
                <label>PDF - Show Answered Questions Only</label>
                <span className="info-help">?</span>
                <input type="checkbox" name="pdfShowAnswered" checked={surveyForm.pdfShowAnswered} onChange={handleInputChange} />
              </div>

              <div className="form-row-checkbox">
                <label>Background Location Capture</label>
                <span className="info-help">?</span>
                <input type="checkbox" name="backgroundLocation" checked={surveyForm.backgroundLocation} onChange={handleInputChange} />
              </div>

              <div className="form-row-checkbox">
                <label>Is Location Capture Mandatory?</label>
                <span className="info-help">?</span>
                <input type="checkbox" name="isLocationMandatory" checked={surveyForm.isLocationMandatory} onChange={handleInputChange} />
              </div>
            </div>

            <div className="detailed-footer">
              <button className="btn-teal" onClick={handleSaveSurvey}>Save</button>
              <button className="btn-red" onClick={() => setShowDetailedCreate(false)}>Cancel</button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // MAIN SURVEY LIST
  return (
    <Layout user={user}>
      <div className="survey-view-content">
        <div className="survey-toolbar">
          <div className="survey-search">
            <input type="text" placeholder="Survey Name" className="survey-input" />
            <button className="btn primary">Search</button>
            <button className="btn secondary">Reset</button>
          </div>
          <div className="survey-actions">
            <button className="btn outline">Help</button>
            <button className="btn outline" onClick={() => setShowCopyPopup(true)}>Copy Template</button>
            <button className="btn primary" onClick={() => setShowCreatePopup(true)}>Create Survey</button>
          </div>
        </div>

        <div className="survey-filters">
          <div>
            <label>Show</label>
            <select>
              <option>10</option>
              <option>20</option>
              <option>50</option>
              <option>100</option>
            </select>
            <span>entries</span>
          </div>
          <div>
            <label>Sort By:</label>
            <select defaultValue="Date DESC">
              <option>Name ASC</option>
              <option>Name DESC</option>
              <option>Date ASC</option>
              <option>Date DESC</option>
              <option>Responses ASC</option>
              <option>Responses DESC</option>
            </select>
          </div>
        </div>

        <div className="survey-table-wrapper">
          <table className="survey-table">
            <thead>
              <tr>
                <th>#</th><th>Name</th><th>Questionnaire</th><th>Web URL</th><th>Responses</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {surveys.map((survey, index) => (
                <tr key={survey.id}>
                  <td>{index + 1}</td>
                  <td className="survey-name">
                    <div className="survey-name-box">
                      <span className="survey-icon">{survey.type === 'app' ? '📱' : '🌐'}</span>
                      <div>
                        <a
                          href="#"
                          className="survey-link"
                          onClick={(e) => {
                            e.preventDefault();
                            setIsEditMode(true);
                            setEditingSurveyId(survey.id);
                            setSurveyForm({
                              name: survey.name || '',
                              layoutType: survey.layoutType || 'portrait',
                              surveyType: survey.type || 'app',
                              headerText: survey.headerText || '',
                              theme: survey.theme || 'Default',
                              accessPin: survey.accessPin || '',
                              loopSurvey: survey.loopSurvey || false,
                              pdfShowAnswered: survey.pdfShowAnswered || false,
                              backgroundLocation: survey.backgroundLocation || false,
                              isLocationMandatory: survey.isLocationMandatory || false,
                              thankYouDuration: survey.thankYouDuration || 20,
                              welcomeImageName: survey.welcomeImageName || '',
                              thankYouImageName: survey.thankYouImageName || ''
                            });
                            setShowDetailedCreate(true);
                            setShowQuestionnaire(false);
                          }}
                        >
                          {survey.name}
                        </a>
                        <div className="survey-date">{survey.date}</div>
                      </div>
                    </div>
                  </td>
                  <td className="center">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <span
                        className="edit-icon"
                        style={{ cursor: 'pointer' }}
                        onClick={() => { setCurrentSurvey(survey); setShowQuestionnaire(true); }}
                        title="Edit Questionnaire"
                      >
                        📝
                      </span>
                      <span
                        className="copy-link-icon"
                        style={{ cursor: 'pointer', fontSize: '14px' }}
                        title="Copy Public Link"
                        onClick={() => {
                          const slug = survey.name.toLowerCase().replace(/\s+/g, '-');
                          const url = `${window.location.origin}/take-survey/${slug}`;
                          navigator.clipboard.writeText(url);
                          alert('Survey link copied to clipboard!');
                        }}
                      >
                        🔗
                      </span>
                    </div>
                  </td>
                  <td className="center">
                    <span
                      style={{ cursor: 'pointer', fontSize: '18px' }}
                      onClick={() => {
                        const slug = survey.name.toLowerCase().replace(/\s+/g, '-');
                        window.open(`/take-survey/${slug}`, '_blank');
                      }}
                      title="Access Live Survey URL"
                    >
                      🌐
                    </span>
                  </td>
                  <td className="center">{survey.responses}</td>
                  <td className="center">
                    <button
                      className={survey.status === 'Published' ? 'status-btn publish' : 'status-btn unpublish'}
                      onClick={() => toggleStatus(survey.id, survey.status)}
                    >
                      {survey.status}
                    </button>
                  </td>
                  <td className="center actions">
                    <span title="Edit Settings" onClick={() => openEditSurvey(survey)}>⚙️</span>
                    <span title="Profile">👤</span><span title="Copy">📄</span>
                    <span title="Delete" onClick={() => deleteSurvey(survey.id)}>🗑️</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUPS */}
      {showSuccessPopup && (
        <div className="success-toast">
          Survey Created Successfully!
        </div>
      )}

      {showConfirmPopup && (
        <div className="modal-overlay">
          <div className="confirm-publish-modal">
            <div className="confirm-icon-wrapper">
              <span className="confirm-icon">!</span>
            </div>
            <p className="confirm-msg">Are you sure you want to Publish this survey?</p>
            <div className="confirm-checkbox">
              <input
                type="checkbox"
                id="sync-mobile"
                checked={syncOnMobile}
                onChange={(e) => setSyncOnMobile(e.target.checked)}
              />
              <label htmlFor="sync-mobile">Sync configuration on mobile devices?</label>
            </div>
            <div className="confirm-footer">
              <button className="btn-confirm no" onClick={() => setShowConfirmPopup(false)}>No</button>
              <button
                className={`btn-confirm yes ${!syncOnMobile ? 'disabled' : ''}`}
                onClick={confirmPublish}
                disabled={!syncOnMobile}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {showCopyPopup && (
        <div className="modal-overlay">
          <div className="copy-template-modal">
            <div className="modal-header">
              <h3>Copy Survey Template</h3>
              <button className="close-btn" onClick={() => setShowCopyPopup(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group-inline">
                <label>CategoryList</label>
                <select className="template-select" defaultValue="">
                  <option value="">Select Category</option>
                  {categories.map((cat, i) => <option key={i} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-modal copy" onClick={() => setShowCopyPopup(false)}>Copy</button>
              <button className="btn-modal cancel" onClick={() => setShowCopyPopup(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showCreatePopup && (
        <div className="modal-overlay">
          <div className="copy-template-modal">
            <div className="modal-header">
              <h3>Create Survey</h3>
              <button className="close-btn" onClick={() => setShowCreatePopup(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detailed-form-group" style={{ alignItems: 'center' }}>
                <label style={{ textAlign: 'left', width: '100px' }}>Name<span className="asterisk">*</span></label>
                <input type="text" name="name" value={surveyForm.name} onChange={handleInputChange} style={{ flex: 1 }} />
              </div>
              <div className="detailed-form-group">
                <label style={{ textAlign: 'left', width: '100px' }}>Layout Type</label>
                <div className="layout-options">
                  <label className="layout-item">
                    <input type="radio" name="layoutType" value="portrait" checked={surveyForm.layoutType === 'portrait'} onChange={handleInputChange} />
                    <div className="layout-icon"></div>
                  </label>
                  <label className="layout-item">
                    <input type="radio" name="layoutType" value="landscape" checked={surveyForm.layoutType === 'landscape'} onChange={handleInputChange} />
                    <div className="layout-icon landscape"></div>
                  </label>
                </div>
              </div>
              <div className="detailed-form-group">
                <label style={{ textAlign: 'left', width: '100px' }}>Survey Type</label>
                <div className="type-options" style={{ fontSize: '14px', gap: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="radio" name="surveyType" value="app" checked={surveyForm.surveyType === 'app'} onChange={handleInputChange} /> App Survey
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="radio" name="surveyType" value="web" checked={surveyForm.surveyType === 'web'} onChange={handleInputChange} /> Web Survey
                  </label>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button className="btn-teal" onClick={startDetailedCreate}>Create Survey</button>
              <button className="btn-red" onClick={() => setShowCreatePopup(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}


    </Layout>
  );
};

export default SurveyView;
