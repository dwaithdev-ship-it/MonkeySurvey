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
      }
    }
  }, [surveyId, surveys]);

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
        precision: q.label === 'Decimal Input' ? '2' : '',
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
        page: currentPage
      };

      if (q.label === 'Phone Number') {
        newQuestion.limitFrom = '1000000000';
        newQuestion.limitTo = '9999999999';
      }

      setQuestions([...questions, newQuestion]);
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
    const updatedSurveys = surveys.map(s =>
      s.id === currentSurvey.id
        ? { ...s, questions, pages }
        : s
    );
    setSurveys(updatedSurveys);
    localStorage.setItem('local_surveys', JSON.stringify(updatedSurveys));
    setShowQuestionnaire(false);
    setShowSuccessPopup(true);
    setTimeout(() => setShowSuccessPopup(false), 2000);
  };

  const removeQuestion = (id) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestion = (id, field, value) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
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

    if (isEditMode && editingSurveyId) {
      // Update existing survey
      const updatedSurveys = surveys.map(s =>
        s.id === editingSurveyId
          ? {
            ...s,
            name: surveyForm.name || s.name,
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
          }
          : s
      );
      setSurveys(updatedSurveys);
      localStorage.setItem('local_surveys', JSON.stringify(updatedSurveys));
    } else {
      // Create new survey
      const newSurvey = {
        id: surveys.length + 1,
        name: surveyForm.name || "Untitled Survey",
        date: formattedDate,
        type: surveyForm.surveyType,
        responses: 0,
        status: 'UnPublished',
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
      setSurveys([newSurvey, ...surveys]);
      localStorage.setItem('local_surveys', JSON.stringify([newSurvey, ...surveys]));
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

    // Update URL to include survey name
    const urlSlug = survey.name.toLowerCase().replace(/\s+/g, '-');
    navigate(`/surveys/${urlSlug}`);
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

  // QUESTIONNAIRE VIEW
  if (showQuestionnaire) {
    return (
      <Layout user={user}>
        <div className="questionnaire-container">
          <div className="questionnaire-header">
            <h2>Questionnaire : {currentSurvey?.name || 'c'}</h2>
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
                            <span className="action-btn">˄</span>
                            <span className="action-btn">👁️</span>
                            <span className="action-btn">📄</span>
                            <span className="action-btn delete" onClick={() => removeQuestion(q.id)}>🗑️</span>
                          </div>
                        </div>

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
                            </div>
                          )}

                          {q.type === 'Radio Button with Other' && (
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
                                <label>Number of Columns</label>
                                <div className="input-with-suffix-text">
                                  <input type="text" className="small-input" value={q.numColumns} onChange={(e) => updateQuestion(q.id, 'numColumns', e.target.value)} />
                                  <span className="suffix-text">(Web Survey Only)</span>
                                </div>
                              </div>
                              <div className="form-row-compact">
                                <label>Randomize Options</label>
                                <input
                                  type="checkbox"
                                  checked={q.randomizeOptions}
                                  onChange={(e) => updateQuestion(q.id, 'randomizeOptions', e.target.checked)}
                                />
                              </div>
                            </div>
                          )}

                          {q.type === 'Radio Button' && (
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
                              <div className="form-row">
                                <label>Image as Option</label>
                                <div className="input-with-button">
                                  <input type="text" value={q.imageGroup} readOnly />
                                  <button className="q-cyan-btn">Select Group</button>
                                </div>
                              </div>
                              <div className="form-row">
                                <label>Orientation</label>
                                <div className="orientation-group">
                                  <label><input type="radio" checked={q.orientation === 'Vertical'} onChange={() => updateQuestion(q.id, 'orientation', 'Vertical')} /> Vertical</label>
                                  <label><input type="radio" checked={q.orientation === 'Top'} onChange={() => updateQuestion(q.id, 'orientation', 'Top')} /> Top</label>
                                  <label><input type="radio" checked={q.orientation === 'Bottom'} onChange={() => updateQuestion(q.id, 'orientation', 'Bottom')} /> Bottom</label>
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
                                <label>Number of Columns</label>
                                <div className="input-with-suffix-text">
                                  <input type="text" className="small-input" value={q.numColumns} onChange={(e) => updateQuestion(q.id, 'numColumns', e.target.value)} />
                                  <span className="suffix-text">(Web Survey Only)</span>
                                </div>
                              </div>
                              <div className="form-row-compact">
                                <label>Randomize Options</label>
                                <input
                                  type="checkbox"
                                  checked={q.randomizeOptions}
                                  onChange={(e) => updateQuestion(q.id, 'randomizeOptions', e.target.checked)}
                                />
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
                        </div>
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
      </Layout>
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
                          href={`/take-survey/${survey.id}`}
                          className="survey-link"
                          onClick={(e) => {
                            e.preventDefault();
                            navigate(`/take-survey/${survey.id}`);
                          }}
                        >
                          {survey.name}
                        </a>
                        <div className="survey-date">{survey.date}</div>
                      </div>
                    </div>
                  </td>
                  <td className="center">
                    <span
                      className="edit-icon"
                      style={{ cursor: 'pointer' }}
                      onClick={() => { setCurrentSurvey(survey); setShowQuestionnaire(true); }}
                    >
                      📝
                    </span>
                  </td>
                  <td className="center">
                    <span
                      style={{ cursor: 'pointer', fontSize: '18px' }}
                      onClick={() => window.open(`/take-survey/${survey.id}`, '_blank')}
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
                    <span title="Profile">👤</span><span title="Copy">📄</span><span title="Delete">🗑️</span>
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
