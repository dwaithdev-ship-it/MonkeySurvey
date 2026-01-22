import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { surveys as surveysAPI, responses as responsesAPI, auth as authAPI } from '../../services/api';
import DashboardView from './DashboardView';

function SurveyResults() {
    const { id } = useParams();
    const [survey, setSurvey] = useState(null);
    const [responses, setResponses] = useState([]);
    const [users, setUsers] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'dashboard'

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            // Load survey details and responses in parallel
            const [surveyRes, responsesRes, usersRes] = await Promise.all([
                surveysAPI.get(id),
                responsesAPI.list({ surveyId: id, limit: 100 }), // Load up to 100 responses for now
                authAPI.list().catch(() => ({ data: { data: [] } })) // Soft fail if not admin or error
            ]);

            setSurvey(surveyRes.data.data);
            setResponses(responsesRes.data.data.responses);

            // Create a lookup for users
            const userMap = {};
            if (usersRes?.data?.data) {
                usersRes.data.data.forEach(u => {
                    userMap[u._id || u.id] = `${u.firstName} ${u.lastName}`;
                });
            }
            setUsers(userMap);
        } catch (err) {
            setError('Failed to load results');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Loading results...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!survey) return <div className="error">Survey not found</div>;

    // Helper to safely get answer value
    const getAnswerValue = (response, questionId) => {
        const answer = response.answers.find(a => a.questionId === questionId);
        if (!answer) return '-';

        // Find the question to get options
        const question = survey.questions.find(q => q._id === questionId);

        const val = answer.value;

        // For questions with options (multiple_choice, checkbox, dropdown), map value to label
        if (question && question.options && question.options.length > 0) {
            if (Array.isArray(val)) {
                // For checkbox (multiple values)
                return val.map(v => {
                    const option = question.options.find(opt => opt.value === v);
                    return option ? option.label : v;
                }).join(', ');
            } else {
                // For single value (multiple_choice, dropdown)
                const option = question.options.find(opt => opt.value === val);
                return option ? option.label : val.toString();
            }
        }

        // For other question types (text, textarea, etc.)
        if (Array.isArray(val)) return val.join(', ');
        if (typeof val === 'object') return JSON.stringify(val);
        return val.toString();
    };

    return (
        <div className="container" style={{ maxWidth: '1200px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ marginBottom: '8px' }}>{survey.title}</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <p style={{ color: '#6b7280', margin: 0 }}>Total Responses: {responses.length}</p>
                        <div style={styles.viewToggle}>
                            <button
                                onClick={() => setViewMode('table')}
                                style={{
                                    ...styles.toggleBtn,
                                    ...(viewMode === 'table' ? styles.toggleBtnActive : {})
                                }}
                            >
                                Table View
                            </button>
                            <button
                                onClick={() => setViewMode('dashboard')}
                                style={{
                                    ...styles.toggleBtn,
                                    ...(viewMode === 'dashboard' ? styles.toggleBtnActive : {})
                                }}
                            >
                                Dashboard View
                            </button>
                        </div>
                    </div>
                </div>
                <Link to="/admin" className="btn btn-secondary">Back to Admin</Link>
            </div>

            {viewMode === 'table' ? (
                <div className="card" style={{ overflowX: 'auto' }}>
                    {responses.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>No responses yet.</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                            <thead>
                                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                    <th style={{ padding: '12px', textAlign: 'left', minWidth: '150px' }}>Submitted At</th>
                                    <th style={{ padding: '12px', textAlign: 'left', minWidth: '150px' }}>Created By</th>
                                    {survey.questions.map(q => (
                                        <th key={q._id} style={{ padding: '12px', textAlign: 'left', minWidth: '200px' }}>
                                            {q.question}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {responses.map(response => (
                                    <tr key={response._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                        <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                                            {new Date(response.createdAt).toLocaleString()}
                                        </td>
                                        <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                                            {users[response.userId] || 'Anonymous'}
                                        </td>
                                        {survey.questions.map(q => (
                                            <td key={q._id} style={{ padding: '12px' }}>
                                                {getAnswerValue(response, q._id)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            ) : (
                <DashboardView survey={survey} responses={responses} />
            )}
        </div>
    );
}

const styles = {
    viewToggle: {
        display: 'flex',
        background: '#f3f4f6',
        padding: '4px',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
    },
    toggleBtn: {
        padding: '6px 12px',
        borderRadius: '6px',
        border: 'none',
        background: 'transparent',
        fontSize: '13px',
        fontWeight: '600',
        color: '#6b7280',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    toggleBtnActive: {
        background: 'white',
        color: '#4f46e5',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }
};

export default SurveyResults;
