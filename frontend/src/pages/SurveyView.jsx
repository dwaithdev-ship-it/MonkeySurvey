import React, { useState, useEffect, useRef } from 'react';
import Layout from './layout';
import './surveyview.css';
import './Questionnaire.css';
import { useParams } from 'react-router-dom';

const SurveyView = () => {
  const { surveyId } = useParams();
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

  const standardCategories = [
    {
      name: 'Textual',
      items: [
        { icon: '📝', label: 'Text Block' },
        { icon: '➖', label: 'Singleline Text Input' },
        { icon: '📋', label: 'Multiline Text Input' },
      ]
    },
    {
      name: 'Input',
      items: [
        { icon: '🔢', label: 'Number Input' },
        { icon: '🔢', label: 'Number with Auto Code' },
        { icon: '🔟', label: 'Decimal Input' },
        { icon: '📧', label: 'Email' },
        { icon: '📞', label: 'Phone Number' },
        { icon: '➀', label: 'Number Point' },
        { icon: '⭐', label: 'Rating' },
        { icon: '📅', label: 'Date' },
        { icon: '🕒', label: 'Time' },
        { icon: '📆', label: 'Date & Time' },
      ]
    },
    {
      name: 'Choice',
      items: [
        { icon: '🔘', label: 'Radio Button' },
        { icon: '🔘', label: 'Radio Button With Other' },
        { icon: '▾', label: 'Drop Down' },
        { icon: '▾', label: 'Drop Down With Other' },
        { icon: '☑️', label: 'Checkbox List' },
        { icon: '☑️', label: 'Checkbox List With Other' },
        { icon: '🔲', label: '2 Columns Checkbox' },
      ]
    }
  ];

  const advanceCategories = [
    {
      name: 'Capture',
      items: [
        { icon: '📷', label: 'Photo Capture' },
        { icon: '📹', label: 'Record Video' },
        { icon: '🎙️', label: 'Record Audio' },
        { icon: '✍️', label: 'Signature' },
      ]
    },
    {
      name: 'Matrix/Grid',
      items: [
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
      ]
    },
    {
      name: 'Advanced Logic',
      items: [
        { icon: '📊', label: 'Ranking - Checkbox' },
        { icon: '📊', label: 'Ranking' },
        { icon: '📄', label: 'NSEC' },
        { icon: '📄', label: 'SEC' },
        { icon: '📄', label: 'Rural SEC' },
        { icon: '➕', label: 'Running Total' },
        { icon: '➗', label: 'Formula' },
        { icon: '👤', label: 'Contact Form' },
        { icon: '🏠', label: 'Address' },
        { icon: '📈', label: 'Net Promoter Score' },
        { icon: '||||', label: 'Barcode Scanner' },
        { icon: '📍', label: 'Map Coordinates (GPS)' },
      ]
    }
  ];

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
      alert(`Dropped: ${q.label}`);
      // Future: Add question to survey state
    }
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

    const newSurvey = {
      id: surveys.length + 1,
      name: surveyForm.name || "Untitled Survey",
      date: formattedDate,
      type: surveyForm.surveyType,
      responses: 0,
      status: 'UnPublished'
    };

    setSurveys([newSurvey, ...surveys]);
    setShowDetailedCreate(false);
    setShowSuccessPopup(true);

    setTimeout(() => {
      setShowSuccessPopup(false);
    }, 3000);
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
              <div className="q-sidebar-header">
                Questions
                <span>ℹ️</span>
              </div>
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
                {(activeTab === 'Standard' ? standardCategories : advanceCategories).map((cat, idx) => (
                  <div key={idx} className="q-category-group">
                    <div
                      className="q-category-header"
                      onClick={() => toggleCategory(cat.name)}
                    >
                      {cat.name} <span>{expandedCategories[cat.name] ? '▾' : '▸'}</span>
                    </div>
                    {expandedCategories[cat.name] && (
                      <div className="q-question-list">
                        {cat.items.map((q, i) => (
                          <div
                            key={i}
                            className="q-item"
                            draggable
                            onDragStart={(e) => handleDragStart(e, q)}
                          >
                            <span>{q.icon} {q.label}</span>
                            <span className="q-item-info-box">i</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
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
                <div className="q-placeholder">
                  To define a question please double click or drag & drop a question from the left column
                </div>
              </div>
              <div className="q-bottom-bar">
                <div className="q-pagination">
                  <div className="page-label">Pages</div>
                  <div className="page-num">1</div>
                  <button className="add-page-btn">+</button>
                </div>
                <div className="q-actions">
                  <button className="btn-options">Page Options ▾</button>
                  <button className="btn-save" onClick={() => setShowQuestionnaire(false)}>Save</button>
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
            <h2>Create Surveys</h2>
            <button className="back-btn" onClick={() => setShowDetailedCreate(false)}>Back</button>
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
                        <a href="#" className="survey-link">{survey.name}</a>
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
                  <td className="center"></td>
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
