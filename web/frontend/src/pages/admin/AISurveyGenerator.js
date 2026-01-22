import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ai as aiAPI, surveys as surveysAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

function AISurveyGenerator() {
    const [source, setSource] = useState('');
    const [sourceType, setSourceType] = useState('text');
    const [loading, setLoading] = useState(false);
    const [generatedSurvey, setGeneratedSurvey] = useState(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { isAdmin } = useAuth();

    const handleGenerate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setGeneratedSurvey(null);

        try {
            const response = await aiAPI.generate({ source, sourceType });
            setGeneratedSurvey(response.data.data);
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Failed to generate survey');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const response = await surveysAPI.create(generatedSurvey);
            navigate(`/admin/survey/${response.data.data.survey._id}/edit`);
        } catch (err) {
            setError('Failed to save survey');
        }
    };

    if (!isAdmin) {
        return <div className="container"><div className="error">Access denied. Admin required.</div></div>;
    }

    return (
        <div className="container">
            <h1>AI Survey Generator</h1>
            <p style={{ marginBottom: '24px', color: '#6b7280' }}>
                Fetch a document or paste text to automatically generate survey questions and options.
            </p>

            <div className="card" style={{ marginBottom: '24px' }}>
                <form onSubmit={handleGenerate}>
                    <div className="form-group">
                        <label>Source Type</label>
                        <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input type="radio" checked={sourceType === 'text'} onChange={() => setSourceType('text')} /> Text Content
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input type="radio" checked={sourceType === 'url'} onChange={() => setSourceType('url')} /> Document URL
                            </label>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>{sourceType === 'text' ? 'Paste Text Content' : 'Enter Document URL'}</label>
                        {sourceType === 'text' ? (
                            <textarea
                                value={source}
                                onChange={(e) => setSource(e.target.value)}
                                placeholder="Paste the document content here..."
                                rows="10"
                                required
                            />
                        ) : (
                            <input
                                type="url"
                                value={source}
                                onChange={(e) => setSource(e.target.value)}
                                placeholder="https://example.com/document"
                                required
                            />
                        )}
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
                        {loading ? 'Generating Survey...' : 'Generate Survey'}
                    </button>
                </form>
            </div>

            {error && <div className="error" style={{ marginBottom: '24px' }}>{error}</div>}

            {generatedSurvey && (
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2>Preview: {generatedSurvey.title}</h2>
                        <button onClick={handleSave} className="btn btn-primary" style={{ backgroundColor: '#059669' }}>
                            Save and Edit Survey
                        </button>
                    </div>
                    <p style={{ marginBottom: '24px' }}>{generatedSurvey.description}</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {generatedSurvey.questions.map((q, idx) => (
                            <div key={idx} style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                                <p style={{ fontWeight: '600' }}>{idx + 1}. {q.question}</p>
                                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Type: {q.type}</p>
                                {q.options && q.options.length > 0 && (
                                    <ul style={{ marginTop: '8px', listStyleType: 'circle', paddingLeft: '24px' }}>
                                        {q.options.map((opt, oIdx) => (
                                            <li key={oIdx}>{opt.label}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default AISurveyGenerator;
