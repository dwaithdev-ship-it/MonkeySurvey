import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './layout';
import { themeAPI, surveyAPI } from '../services/api';
import './ThemesPage.css';

export default function ThemesPage() {
    const navigate = useNavigate();
    const [themes, setThemes] = useState([]);
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    const [isEditing, setIsEditing] = useState(false);
    const [currentTheme, setCurrentTheme] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        surveyId: '',
        themeName: '',
        layoutType: 'mobile',
        headerBackgroundColor: '#09C1D8',
        headerTextColor: '#FFFFFF',
        bodyBackgroundColor: '#FFFFFF',
        bodyTextColor: '#444444',
        bodyIconColor: '#09C1D8',
        inputTextColor: '#444444',
        groupBackgroundColor: '#09C1D8',
        groupTextColor: '#FFFFFF',
        formBackgroundImage: ''
    });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [themesRes, surveysRes] = await Promise.all([
                themeAPI.getAllThemes(),
                surveyAPI.getAll()
            ]);

            if (themesRes.success) setThemes(themesRes.data);
            if (surveysRes.success) {
                // Only active surveys or all? Just keep what API gives, handle gracefully
                const srvs = surveysRes.data.surveys || surveysRes.data || [];
                setSurveys(Array.isArray(srvs) ? srvs : []);
            }
        } catch (err) {
            console.error("Error fetching themes data", err);
        }
        setLoading(false);
    };

    const handleEdit = (theme) => {
        setCurrentTheme(theme);
        setFormData({
            surveyId: theme.surveyId || '',
            themeName: theme.themeName || '',
            layoutType: theme.layoutType || 'mobile',
            headerBackgroundColor: theme.headerBackgroundColor || '#09C1D8',
            headerTextColor: theme.headerTextColor || '#FFFFFF',
            bodyBackgroundColor: theme.bodyBackgroundColor || '#FFFFFF',
            bodyTextColor: theme.bodyTextColor || '#444444',
            bodyIconColor: theme.bodyIconColor || '#09C1D8',
            inputTextColor: theme.inputTextColor || '#444444',
            groupBackgroundColor: theme.groupBackgroundColor || '#09C1D8',
            groupTextColor: theme.groupTextColor || '#FFFFFF',
            formBackgroundImage: theme.formBackgroundImage || ''
        });
        setIsEditing(true);
    };

    const handleAddNew = () => {
        setCurrentTheme(null);
        setFormData({
            surveyId: '',
            themeName: 'New Theme',
            layoutType: 'mobile',
            headerBackgroundColor: '#09C1D8',
            headerTextColor: '#FFFFFF',
            bodyBackgroundColor: '#FFFFFF',
            bodyTextColor: '#444444',
            bodyIconColor: '#09C1D8',
            inputTextColor: '#444444',
            groupBackgroundColor: '#09C1D8',
            groupTextColor: '#FFFFFF',
            formBackgroundImage: ''
        });
        setIsEditing(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.surveyId) return alert('Survey ID is required');
        try {
            const res = await themeAPI.saveTheme(formData);
            if (res.success) {
                alert("Theme saved successfully!");
                setIsEditing(false);
                fetchData();
            }
        } catch (err) {
            console.error("Error saving theme", err);
            alert("Failed to save theme.");
        }
    };

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, formBackgroundImage: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const getSurveyName = (id) => {
        const s = surveys.find(surv => surv._id === id || surv.id === id);
        return s ? s.title || s.name : String(id);
    };

    if (loading) return <Layout user={user || {}}><div className="loading">Loading Themes...</div></Layout>;

    return (
        <Layout user={user || {}}>
            <div className="themes-page-container">

                {!isEditing ? (
                    <>
                        <div className="themes-header">
                            <div className="themes-title-section">
                                <h2>Survey Themes configuration</h2>
                                <p>Customize and assign layouts and colors to your published surveys.</p>
                            </div>
                            <button className="create-theme-btn" onClick={handleAddNew}>
                                + Create Theme
                            </button>
                        </div>

                        <div className="themes-grid">
                            {themes.length === 0 ? (
                                <div className="empty-state">No themes configured yet. Create one!</div>
                            ) : (
                                themes.map(theme => (
                                    <div key={theme._id || theme.surveyId} className="theme-card">
                                        <div className="theme-preview" style={{ background: theme.bodyBackgroundColor }}>
                                            <div className="preview-header" style={{ background: theme.headerBackgroundColor, color: theme.headerTextColor }}>Header</div>
                                            <div className="preview-body" style={{ color: theme.bodyTextColor }}>
                                                <div className="preview-block" style={{ background: theme.groupBackgroundColor, color: theme.groupTextColor }}>
                                                    Q Block
                                                </div>
                                            </div>
                                        </div>
                                        <div className="theme-info">
                                            <h3>{theme.themeName}</h3>
                                            <a href={`/take-survey/${theme.surveyId}`} target="_blank" rel="noopener noreferrer" className="survey-link" title="Open live Survey view">
                                                🔗 {getSurveyName(theme.surveyId)}
                                            </a>
                                            <button className="edit-theme-btn" onClick={() => handleEdit(theme)}>Edit Theme</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                ) : (
                    <div className="theme-editor-section">
                        <div className="editor-header">
                            <h2>{currentTheme ? 'Edit Theme Configuration' : 'Create New Theme Context'}</h2>
                            <button className="back-btn" onClick={() => setIsEditing(false)}>← Back</button>
                        </div>

                        <form onSubmit={handleSave} className="theme-form">

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Apply to Survey *</label>
                                    <select name="surveyId" value={formData.surveyId} onChange={handleChange} required>
                                        <option value="">-- Select Survey --</option>
                                        {surveys.map(s => (
                                            <option key={s._id || s.id} value={s._id || s.id}>{s.title || s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Theme Nickname *</label>
                                    <input type="text" name="themeName" value={formData.themeName} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Layout Type</label>
                                    <select name="layoutType" value={formData.layoutType} onChange={handleChange}>
                                        <option value="mobile">Mobile Centric</option>
                                        <option value="tablet">Tablet Centric</option>
                                        <option value="desktop">Desktop Centric</option>
                                    </select>
                                </div>
                            </div>

                            <h3>Color Properties</h3>
                            <div className="color-grid">
                                <div className="color-control">
                                    <label>Header Background</label>
                                    <div className="color-input-wrapper">
                                        <input type="color" name="headerBackgroundColor" value={formData.headerBackgroundColor} onChange={handleChange} />
                                        <span>{formData.headerBackgroundColor}</span>
                                    </div>
                                </div>
                                <div className="color-control">
                                    <label>Header Text</label>
                                    <div className="color-input-wrapper">
                                        <input type="color" name="headerTextColor" value={formData.headerTextColor} onChange={handleChange} />
                                        <span>{formData.headerTextColor}</span>
                                    </div>
                                </div>

                                <div className="color-control">
                                    <label>Page Background</label>
                                    <div className="color-input-wrapper">
                                        <input type="color" name="bodyBackgroundColor" value={formData.bodyBackgroundColor} onChange={handleChange} />
                                        <span>{formData.bodyBackgroundColor}</span>
                                    </div>
                                </div>
                                <div className="color-control">
                                    <label>Page Main Text</label>
                                    <div className="color-input-wrapper">
                                        <input type="color" name="bodyTextColor" value={formData.bodyTextColor} onChange={handleChange} />
                                        <span>{formData.bodyTextColor}</span>
                                    </div>
                                </div>

                                <div className="color-control">
                                    <label>Icons & Primary Btns</label>
                                    <div className="color-input-wrapper">
                                        <input type="color" name="bodyIconColor" value={formData.bodyIconColor} onChange={handleChange} />
                                        <span>{formData.bodyIconColor}</span>
                                    </div>
                                </div>
                                <div className="color-control">
                                    <label>Questions Block Bg</label>
                                    <div className="color-input-wrapper">
                                        <input type="color" name="groupBackgroundColor" value={formData.groupBackgroundColor} onChange={handleChange} />
                                        <span>{formData.groupBackgroundColor}</span>
                                    </div>
                                </div>

                                <div className="color-control">
                                    <label>Questions Block Text</label>
                                    <div className="color-input-wrapper">
                                        <input type="color" name="groupTextColor" value={formData.groupTextColor} onChange={handleChange} />
                                        <span>{formData.groupTextColor}</span>
                                    </div>
                                </div>
                                <div className="color-control">
                                    <label>Input Text Color</label>
                                    <div className="color-input-wrapper">
                                        <input type="color" name="inputTextColor" value={formData.inputTextColor} onChange={handleChange} />
                                        <span>{formData.inputTextColor}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginTop: '20px' }}>
                                <label>Background Image Upload (Optional)</label>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        style={{ border: '1px solid #cbd5e1', padding: '8px', borderRadius: '6px', background: '#f8fafc', flex: 1 }}
                                    />
                                    {formData.formBackgroundImage && (
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, formBackgroundImage: '' }))}
                                            style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
                                        >
                                            Remove Image
                                        </button>
                                    )}
                                </div>
                                {formData.formBackgroundImage && (
                                    <div style={{ marginTop: '10px' }}>
                                        <img src={formData.formBackgroundImage} alt="Background Preview" style={{ maxHeight: '100px', borderRadius: '8px', border: '1px solid #cbd5e1', objectFit: 'contain' }} />
                                    </div>
                                )}
                                <span style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px', display: 'block' }}>An image upload overrides the Page Background color entirely.</span>
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="save-theme-btn">Save Active Theme</button>
                            </div>

                        </form>
                    </div>
                )}

            </div>
        </Layout>
    );
}
