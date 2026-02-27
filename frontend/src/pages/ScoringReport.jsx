import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { surveyAPI, responseAPI } from '../services/api';
import Layout from './layout';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import './SpatialReport.css'; // Reusing base report styles
import './ScoringReport.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Heuristic to auto-assign default scores to known sentiment words
const guessScore = (optionStr) => {
    if (!optionStr) return 0;
    const str = String(optionStr).toLowerCase().trim();

    // Check if it's already a number
    const num = parseFloat(str);
    if (!isNaN(num) && num > 0 && num <= 100) return num;

    const scoreMap = {
        'very poor': 1, 'strongly disagree': 1, 'terrible': 1, 'bad': 1, 'బాగాలేదు': 1, 'అందటం లేదు': 1, 'వేయడం లేదు': 1,
        'poor': 2, 'disagree': 2,
        'average': 3, 'neutral': 3, 'ok': 3,
        'good': 4, 'agree': 4,
        'very good': 5, 'excellent': 5, 'strongly agree': 5, 'బాగుంది': 5, 'బాగున్నాయి': 5, 'అందుతున్నాయి': 5, 'వేస్తున్నారు': 5
    };

    for (const [key, val] of Object.entries(scoreMap)) {
        if (str.includes(key)) return val;
    }
    return 0;
};

const ScoringReport = () => {
    const { surveyId } = useParams();
    const navigate = useNavigate();
    const [survey, setSurvey] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reportLoading, setReportLoading] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [user, setUser] = useState(null);

    // Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Scoring Config
    const [scoringConfig, setScoringConfig] = useState({});

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        fetchSurveyDetails();
    }, [surveyId]);

    const fetchSurveyDetails = async () => {
        try {
            setLoading(true);
            const res = await surveyAPI.getById(surveyId);
            if (res.success) {
                setSurvey(res.data);
                try {
                    const savedConfig = localStorage.getItem(`scoring_config_${surveyId}`);
                    if (savedConfig && savedConfig !== 'undefined') {
                        setScoringConfig(JSON.parse(savedConfig));
                    }
                } catch (configErr) {
                    console.error("Failed to parse local scoring config", configErr);
                    // Reset invalid config
                    localStorage.removeItem(`scoring_config_${surveyId}`);
                }
            }
        } catch (err) {
            console.error("Failed to fetch survey:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleApplyFilters = async () => {
        try {
            setReportLoading(true);
            const params = { surveyId, startDate, endDate };
            const res = await responseAPI.getSummaryReport(params);
            if (res.success) {
                setReportData(res.data);
                autoInitConfig(res.data.questions, survey);
            }
        } catch (err) {
            console.error("Scoring report error:", err);
        } finally {
            setReportLoading(false);
        }
    };

    useEffect(() => {
        if (survey) handleApplyFilters();
    }, [survey]);

    const autoInitConfig = (questionsData, surveyData) => {
        try {
            setScoringConfig(prev => {
                let newConfig = { ...prev };

                if (surveyData && Array.isArray(surveyData.questions)) {
                    surveyData.questions.forEach(q => {
                        if (!q) return;
                        const qId = q._id ? q._id.toString() : (q.id ? q.id.toString() : (q.name || 'unknown_q'));
                        if (Array.isArray(q.options)) {
                            q.options.forEach(opt => {
                                if (!opt) return;
                                const key = `${qId}_${opt.value || opt.label}`;
                                if (newConfig[key] === undefined) {
                                    newConfig[key] = guessScore(opt.value || opt.label);
                                }
                            });
                        }
                    });
                }

                if (Array.isArray(questionsData)) {
                    questionsData.forEach(q => {
                        if (!q) return;
                        const qId = q.questionId || 'unknown_q';
                        if (Array.isArray(q.distribution)) {
                            q.distribution.forEach(d => {
                                if (!d) return;
                                const optionStr = Array.isArray(d.option) ? d.option.join(', ') : (d.option || '');
                                const key = `${qId}_${optionStr}`;
                                if (newConfig[key] === undefined) {
                                    newConfig[key] = guessScore(optionStr);
                                }
                            });
                        }
                    });
                }

                if (Object.keys(newConfig).length > 0) {
                    localStorage.setItem(`scoring_config_${surveyId}`, JSON.stringify(newConfig));
                }
                return newConfig;
            });
        } catch (e) {
            console.error("Error heavily initializing config", e);
        }
    };

    const handleScoreChange = (qId, option, val) => {
        const optionStr = Array.isArray(option) ? option.join(', ') : (option || '');
        const key = `${qId}_${optionStr}`;
        const numericVal = parseFloat(val) || 0;

        const nextConfig = { ...scoringConfig, [key]: numericVal };
        setScoringConfig(nextConfig);
        localStorage.setItem(`scoring_config_${surveyId}`, JSON.stringify(nextConfig));
    };

    // Calculate Scores based on Config and ReportData
    const scoringAnalysis = useMemo(() => {
        if (!survey || !reportData || !reportData.questions || !Array.isArray(survey.questions)) return { overallAvg: 0, highest: 0, lowest: 0, questions: [] };

        let totalScoreSum = 0;
        let totalScoredResponses = 0;
        let highest = -Infinity;
        let lowest = Infinity;

        const processedQuestions = survey.questions
            .filter(q => q && !['text-block', 'line', 'pseudo-header'].includes(q.type))
            .map(q => {
                const qId = q._id ? q._id.toString() : (q.id ? q.id.toString() : (q.name || 'unknown_q'));
                const stat = reportData.questions.find(s => s.questionId && s.questionId.toLowerCase() === qId.toLowerCase()) || { distribution: [], totalQuestionResponses: 0 };

                let qTotalScore = 0;
                let qScorableResponses = 0;

                const distributionWithScores = stat.distribution.map(d => {
                    const optionStr = Array.isArray(d.option) ? d.option.join(', ') : (d.option || '');
                    const key = `${qId}_${optionStr}`;
                    const score = scoringConfig[key] || 0;

                    if (score > 0) {
                        qTotalScore += (score * d.count);
                        qScorableResponses += d.count;
                    }

                    return { ...d, optionStr, score };
                });

                const qAvg = qScorableResponses > 0 ? (qTotalScore / qScorableResponses) : 0;

                if (qAvg > 0) {
                    highest = Math.max(highest, qAvg);
                    lowest = Math.min(lowest, qAvg);
                }

                totalScoreSum += qTotalScore;
                totalScoredResponses += qScorableResponses;

                return {
                    ...q,
                    qId,
                    title: q.question || q.title || q.text,
                    distribution: distributionWithScores.sort((a, b) => b.count - a.count),
                    totalResponses: stat.totalQuestionResponses,
                    scorableResponses: qScorableResponses,
                    averageScore: qAvg
                };
            }).filter(q => q.distribution.length > 0); // Only show questions that have responses

        const overallAvg = totalScoredResponses > 0 ? (totalScoreSum / totalScoredResponses).toFixed(2) : 0;

        return {
            overallAvg,
            totalResponses: reportData.totalResponses,
            highest: highest !== -Infinity ? highest.toFixed(2) : 0,
            lowest: lowest !== Infinity ? lowest.toFixed(2) : 0,
            questions: processedQuestions
        };

    }, [survey, reportData, scoringConfig]);

    const exportToExcel = () => {
        if (!scoringAnalysis || !window.XLSX) return;
        const wb = window.XLSX.utils.book_new();

        const allRows = [
            ["Scoring Report Summary"],
            ["Total Responses", scoringAnalysis.totalResponses],
            ["Overall Average Score", scoringAnalysis.overallAvg],
            ["Highest Question Avg", scoringAnalysis.highest],
            ["Lowest Question Avg", scoringAnalysis.lowest],
            [],
            ["Question Analysis"]
        ];

        scoringAnalysis.questions.forEach((q, idx) => {
            allRows.push([]);
            allRows.push([`Q${idx + 1}: ${q.title}`]);
            allRows.push(["Average Score", q.averageScore.toFixed(2)]);
            allRows.push(["Option", "Count", "Configured Score", "Contribution"]);

            q.distribution.forEach(d => {
                allRows.push([d.optionStr, d.count, d.score, (d.score * d.count)]);
            });
        });

        const ws = window.XLSX.utils.aoa_to_sheet(allRows);
        window.XLSX.utils.book_append_sheet(wb, ws, "Scoring Report");
        window.XLSX.writeFile(wb, `scoring_report_${survey?.title || 'survey'}_${new Date().getTime()}.xlsx`);
    };

    const chartData = useMemo(() => {
        const scorableQs = scoringAnalysis.questions.filter(q => q.averageScore > 0);
        return {
            labels: scorableQs.map((q, i) => `Q${i + 1}`),
            datasets: [
                {
                    label: 'Average Score',
                    data: scorableQs.map(q => q.averageScore),
                    backgroundColor: 'rgba(99, 102, 241, 0.8)',
                    borderRadius: 4
                }
            ]
        };
    }, [scoringAnalysis.questions]);

    if (loading) return <Layout user={user || {}}><div className="loading-state">Loading survey details...</div></Layout>;

    return (
        <Layout user={user || {}}>
            <div className="scoring-report-container">
                <div className="crosstab-header">
                    <button className="back-btn" onClick={() => navigate('/data')}>← Back to Surveys</button>
                    <h2>Scoring Report: <span className="survey-highlight">{survey?.title}</span></h2>
                </div>

                <div className="filters-panel">
                    <div className="filter-group">
                        <label>Date Range</label>
                        <div className="date-inputs">
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                            <span>to</span>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                        </div>
                    </div>

                    <button className="apply-btn" onClick={handleApplyFilters} disabled={reportLoading}>
                        {reportLoading ? 'Analyzing...' : 'Refresh Scoring'}
                    </button>

                    <button className="export-action-btn xls" onClick={exportToExcel} style={{ marginLeft: 'auto' }}>
                        Export XLSX
                    </button>
                </div>

                {!reportData || reportData.totalResponses === 0 ? (
                    <div className="empty-report-state">
                        <div className="empty-icon">📊</div>
                        <h3>No responses available for selected criteria</h3>
                        <p>Verify that your survey collects data to calculate scores.</p>
                    </div>
                ) : (
                    <>
                        <div className="scoring-summary-cards">
                            <div className="score-card">
                                <h4>Total Responses</h4>
                                <div className="score-val">{scoringAnalysis.totalResponses}</div>
                            </div>
                            <div className="score-card primary">
                                <h4>Overall Average Score</h4>
                                <div className="score-val">{scoringAnalysis.overallAvg}</div>
                            </div>
                            <div className="score-card">
                                <h4>Highest Question Avg</h4>
                                <div className="score-val">{scoringAnalysis.highest}</div>
                            </div>
                            <div className="score-card">
                                <h4>Lowest Question Avg</h4>
                                <div className="score-val">{scoringAnalysis.lowest}</div>
                            </div>
                        </div>

                        <div className="scoring-content-grid">
                            {/* Left Side: Score Configuration per Question */}
                            <div className="scoring-details-section">
                                <h3>Question Analysis & Configuration</h3>
                                <p className="config-help">Assign a numeric score to options to include them in the average calculation. Unscored options (0) do not impact the average.</p>

                                <div className="scoring-questions-list">
                                    {scoringAnalysis.questions.map((q, idx) => (
                                        <div key={q.qId} className="scoring-q-card">
                                            <div className="sq-head">
                                                <h4>Q{idx + 1}: {q.title}</h4>
                                                <div className="sq-avg">Avg Score: <strong>{q.averageScore.toFixed(2)}</strong></div>
                                            </div>
                                            <table className="scoring-table">
                                                <thead>
                                                    <tr>
                                                        <th>Option Answered</th>
                                                        <th>Count</th>
                                                        <th>Assigned Score</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {q.distribution.map((d, i) => (
                                                        <tr key={i}>
                                                            <td>{d.optionStr || 'No Answer'}</td>
                                                            <td>{d.count}</td>
                                                            <td>
                                                                <input
                                                                    type="number"
                                                                    className="score-input"
                                                                    value={d.score === 0 ? '' : d.score}
                                                                    placeholder="0"
                                                                    onChange={(e) => handleScoreChange(q.qId, d.optionStr, e.target.value)}
                                                                />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right Side: Charts */}
                            <div className="scoring-charts-section">
                                <div className="chart-wrapper">
                                    <h3>Average Score per Question</h3>
                                    <div className="bar-chart-container">
                                        <Bar
                                            data={chartData}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                scales: { y: { beginAtZero: true, suggestedMax: 5 } }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </Layout>
    );
};

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, errorStr: '' };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, errorStr: error.toString() };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Scoring Report crashed:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '40px', textAlign: 'center', background: '#fee2e2', color: '#991b1b', margin: '20px', borderRadius: '12px' }}>
                    <h2>Something went wrong displaying the Scoring Report.</h2>
                    <p style={{ fontFamily: 'monospace', background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #fca5a5' }}>
                        {this.state.errorStr}
                    </p>
                    <button onClick={() => window.location.reload()} style={{ padding: '8px 16px', marginTop: '15px', cursor: 'pointer' }}>Reload Report</button>
                </div>
            );
        }
        return this.props.children;
    }
}

const SafeScoringReport = (props) => (
    <ErrorBoundary>
        <ScoringReport {...props} />
    </ErrorBoundary>
);

export default SafeScoringReport;
