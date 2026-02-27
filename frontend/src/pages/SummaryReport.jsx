import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { surveyAPI, responseAPI } from '../services/api';
import Layout from './layout';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import './CrossTab.css'; // Reusing base report styles
import './SummaryReport.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const SummaryReport = () => {
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
            const params = {
                surveyId,
                startDate,
                endDate
            };
            const res = await responseAPI.getSummaryReport(params);
            if (res.success) {
                setReportData(res.data);
            }
        } catch (err) {
            console.error("Summary report error:", err);
            alert("Error loading summary report.");
        } finally {
            setReportLoading(false);
        }
    };

    useEffect(() => {
        if (survey) handleApplyFilters();
    }, [survey]);

    const questionSummaries = useMemo(() => {
        if (!survey || !reportData) return [];

        return survey.questions
            .filter(q => !['text-block', 'line', 'pseudo-header'].includes(q.type))
            .map(q => {
                const qId = (q._id || q.id).toString();
                const stat = reportData.questions.find(s => s.questionId.toLowerCase() === qId.toLowerCase());

                return {
                    ...q,
                    stats: stat || { distribution: [], totalQuestionResponses: 0 }
                };
            });
    }, [survey, reportData]);

    const exportToExcel = () => {
        if (!reportData || !window.XLSX) return;
        const wb = window.XLSX.utils.book_new();

        const allRows = [];
        questionSummaries.forEach((q, idx) => {
            allRows.push([`Q${idx + 1}: ${q.question || q.title || q.text}`]);
            allRows.push(["Option / Answer", "Count", "Percentage"]);

            q.stats.distribution.forEach(item => {
                const pct = q.stats.totalQuestionResponses > 0
                    ? ((item.count / q.stats.totalQuestionResponses) * 100).toFixed(1) + '%'
                    : '0%';
                allRows.push([item.option, item.count, pct]);
            });

            allRows.push(["Total Responses", q.stats.totalQuestionResponses, "100%"]);
            allRows.push([]); // Empty row
        });

        const ws = window.XLSX.utils.aoa_to_sheet(allRows);
        window.XLSX.utils.book_append_sheet(wb, ws, "Summary Report");
        window.XLSX.writeFile(wb, `summary_report_${survey?.title || 'survey'}_${new Date().getTime()}.xlsx`);
    };

    const renderChart = (q) => {
        const data = {
            labels: q.stats.distribution.map(d => Array.isArray(d.option) ? d.option.join(', ') : d.option),
            datasets: [{
                data: q.stats.distribution.map(d => d.count),
                backgroundColor: [
                    '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'
                ]
            }]
        };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } }
            }
        };

        return (
            <div className="summary-chart-box">
                {q.stats.distribution.length > 5 ? (
                    <Bar data={data} options={{ ...options, plugins: { legend: { display: false } } }} />
                ) : (
                    <Pie data={data} options={options} />
                )}
            </div>
        );
    };

    if (loading) return <Layout user={user || {}}><div className="loading-state">Loading survey details...</div></Layout>;

    return (
        <Layout user={user || {}}>
            <div className="summary-report-container">
                <div className="crosstab-header">
                    <button className="back-btn" onClick={() => navigate('/data')}>← Back to Surveys</button>
                    <h2>Summary Report: <span className="survey-highlight">{survey?.title}</span></h2>
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
                        {reportLoading ? 'Analyzing...' : 'Refresh Summary'}
                    </button>
                    <div className="summary-actions" style={{ marginLeft: 'auto' }}>
                        <button className="export-action-btn xls" onClick={exportToExcel}>Export XLSX</button>
                    </div>
                </div>

                {!reportData || reportData.totalResponses === 0 ? (
                    <div className="empty-report-state">
                        <div className="empty-icon">📊</div>
                        <h3>No responses available for selected criteria</h3>
                        <p>Try adjusting your date range to see aggregated results.</p>
                    </div>
                ) : (
                    <div className="summary-grid">
                        <div className="overall-stats-bar">
                            <span>Total Responses: <strong>{reportData.totalResponses}</strong></span>
                        </div>

                        {questionSummaries.map((q, idx) => (
                            <div key={idx} className="question-summary-card">
                                <div className="question-header">
                                    <h3>Q{idx + 1}: {q.question || q.title || q.text}</h3>
                                    <span className="q-total">Responses: {q.stats.totalQuestionResponses}</span>
                                </div>

                                <div className="question-body">
                                    <div className="table-side">
                                        <table className="summary-table">
                                            <thead>
                                                <tr>
                                                    <th>Option</th>
                                                    <th>Count</th>
                                                    <th>%</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {q.stats.distribution.sort((a, b) => b.count - a.count).map((item, i) => {
                                                    const displayOption = Array.isArray(item.option) ? item.option.join(', ') : (item.option || 'No Answer');
                                                    return (
                                                        <tr key={i}>
                                                            <td>{displayOption}</td>
                                                            <td>{item.count}</td>
                                                            <td>{q.stats.totalQuestionResponses > 0 ? ((item.count / q.stats.totalQuestionResponses) * 100).toFixed(1) : 0}%</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="chart-side">
                                        {q.stats.distribution.length > 0 ? renderChart(q) : <div className="no-data-msg">No answers recorded</div>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default SummaryReport;
