import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { surveyAPI, responseAPI } from '../services/api';
import Layout from './layout';
import './CrossTab.css';

const CrossTab = () => {
    const { surveyId } = useParams();
    const navigate = useNavigate();
    const [survey, setSurvey] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reportLoading, setReportLoading] = useState(false);
    const [reportData, setReportData] = useState(null);

    // Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedQuestionId, setSelectedQuestionId] = useState('');
    const [groupBy, setGroupBy] = useState('');
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    useEffect(() => {
        fetchSurveyDetails();
    }, [surveyId]);

    const fetchSurveyDetails = async () => {
        try {
            setLoading(true);
            const res = await surveyAPI.getById(surveyId);
            if (res.success) {
                setSurvey(res.data);
                // Pre-select first meaningful question if available
                if (res.data.questions && res.data.questions.length > 0) {
                    const firstQ = res.data.questions.find(q => !['text-block', 'line', 'pseudo-header'].includes(q.type));
                    if (firstQ) setSelectedQuestionId(firstQ._id || firstQ.id);
                }
            }
        } catch (err) {
            console.error("Failed to fetch survey:", err);
            alert("Error loading survey details.");
        } finally {
            setLoading(false);
        }
    };

    const handleApplyFilters = async () => {
        if (!selectedQuestionId) {
            alert("Please select a question first.");
            return;
        }

        try {
            setReportLoading(true);
            const params = {
                surveyId,
                questionId: selectedQuestionId,
                startDate,
                endDate,
                groupBy
            };
            const res = await responseAPI.getCrosstab(params);
            if (res.success) {
                setReportData(res.data);
            }
        } catch (err) {
            console.error("Failed to generate report:", err);
            alert("Error generating report.");
        } finally {
            setReportLoading(false);
        }
    };

    const exportToExcel = () => {
        if (!reportData || !window.XLSX) return;

        const wb = window.XLSX.utils.book_new();

        // Prepare data for sheets
        const sheetData = [];

        // Headers
        const isGrouped = groupBy && reportData.report.length > 1;
        if (isGrouped) {
            sheetData.push(["Group", "Option / Answer", "Count", "Percentage"]);
            reportData.report.forEach(group => {
                group.answers.forEach(ans => {
                    const pct = ((ans.count / group.totalGroupResponses) * 100).toFixed(1) + '%';
                    sheetData.push([group.group, ans.answer, ans.count, pct]);
                });
                sheetData.push(["", "Total for " + group.group, group.totalGroupResponses, "100%"]);
                sheetData.push([]); // Empty row
            });
        } else {
            sheetData.push(["Option / Answer", "Count", "Percentage"]);
            const total = reportData.totalResponses;
            if (reportData.report[0]) {
                reportData.report[0].answers.forEach(ans => {
                    const pct = ((ans.count / total) * 100).toFixed(1) + '%';
                    sheetData.push([ans.answer, ans.count, pct]);
                });
            }
            sheetData.push(["Total", total, "100%"]);
        }

        const ws = window.XLSX.utils.aoa_to_sheet(sheetData);
        window.XLSX.utils.book_append_sheet(wb, ws, "CrossTab Report");
        window.XLSX.writeFile(wb, `crosstab_${survey.title || 'survey'}_${new Date().getTime()}.xlsx`);
    };

    const exportToCSV = () => {
        if (!reportData) return;

        let csvContent = "";
        const isGrouped = groupBy && reportData.report.length > 1;

        if (isGrouped) {
            csvContent += "Group,Option / Answer,Count,Percentage\n";
            reportData.report.forEach(group => {
                group.answers.forEach(ans => {
                    const pct = ((ans.count / group.totalGroupResponses) * 100).toFixed(1) + '%';
                    csvContent += `"${group.group}","${ans.answer}",${ans.count},${pct}\n`;
                });
            });
        } else {
            csvContent += "Option / Answer,Count,Percentage\n";
            const total = reportData.totalResponses;
            if (reportData.report[0]) {
                reportData.report[0].answers.forEach(ans => {
                    const pct = ((ans.count / total) * 100).toFixed(1) + '%';
                    csvContent += `"${ans.answer}",${ans.count},${pct}\n`;
                });
            }
        }

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `crosstab_${survey.title || 'survey'}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <Layout user={user || {}}><div className="loading-state">Loading survey details...</div></Layout>;

    return (
        <Layout user={user || {}}>
            <div className="crosstab-container">
                <div className="crosstab-header">
                    <button className="back-btn" onClick={() => navigate('/data')}>← Back to Surveys</button>
                    <h2>Cross-Tab Report: <span className="survey-highlight">{survey?.title}</span></h2>
                </div>

                <div className="filters-panel">
                    <div className="filter-group">
                        <label>Date Range</label>
                        <div className="date-inputs">
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} placeholder="From" />
                            <span>to</span>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} placeholder="To" />
                        </div>
                    </div>

                    <div className="filter-group">
                        <label>Select Question</label>
                        <select value={selectedQuestionId} onChange={e => setSelectedQuestionId(e.target.value)}>
                            <option value="">-- Choose a Question --</option>
                            {survey?.questions?.filter(q => !['text-block', 'line', 'pseudo-header'].includes(q.type)).map((q, idx) => (
                                <option key={q._id || q.id} value={q._id || q.id}>
                                    Q{idx + 1}: {q.question || q.text || q.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Group By (Optional)</label>
                        <select value={groupBy} onChange={e => setGroupBy(e.target.value)}>
                            <option value="">None (Total Only)</option>
                            <optgroup label="Location Fields">
                                <option value="parliament">Parliament</option>
                                <option value="assembly">Assembly</option>
                                <option value="mandal">Mandal</option>
                            </optgroup>
                            <optgroup label="Survey Questions">
                                {survey?.questions?.filter(q => !['text-block', 'line', 'pseudo-header'].includes(q.type) && (q._id || q.id) !== selectedQuestionId).map((q, idx) => (
                                    <option key={q._id || q.id} value={q._id || q.id}>
                                        {q.question || q.text || q.title}
                                    </option>
                                ))}
                            </optgroup>
                        </select>
                    </div>

                    <button className="apply-btn" onClick={handleApplyFilters} disabled={reportLoading}>
                        {reportLoading ? 'Loading...' : 'Apply Filters'}
                    </button>
                </div>

                {!reportData ? (
                    <div className="empty-report-state">
                        <div className="empty-icon">📂</div>
                        <h3>Please select a question to view report</h3>
                        <p>Use the filters above to generate an advanced cross-tabulation report.</p>
                    </div>
                ) : (
                    <div className="report-content">
                        <div className="report-summary">
                            <div className="summary-card">
                                <span className="card-label">Total Responses</span>
                                <span className="card-value">{reportData.totalResponses}</span>
                            </div>
                            <div className="summary-actions">
                                <button className="export-action-btn xls" onClick={exportToExcel}>Export XLSX</button>
                                <button className="export-action-btn csv" onClick={exportToCSV}>Export CSV</button>
                            </div>
                        </div>

                        <div className="report-tables-container">
                            {reportData.report.map((group, gIdx) => (
                                <div className="group-table-card" key={gIdx}>
                                    <h3 className="group-title">{groupBy ? `Group: ${group.group}` : 'Overall Results'}</h3>
                                    <table className="report-table">
                                        <thead>
                                            <tr>
                                                <th>Option / Answer</th>
                                                <th>Count</th>
                                                <th>Percentage</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {group.answers.sort((a, b) => b.count - a.count).map((ans, aIdx) => (
                                                <tr key={aIdx}>
                                                    <td className="ans-label">{ans.answer}</td>
                                                    <td className="ans-count">{ans.count}</td>
                                                    <td className="ans-pct">
                                                        <div className="pct-bar-wrapper">
                                                            <div className="pct-bar" style={{ width: `${(ans.count / group.totalGroupResponses * 100)}%` }}></div>
                                                            <span>{(ans.count / group.totalGroupResponses * 100).toFixed(1)}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="total-row">
                                                <td>Total</td>
                                                <td>{group.totalGroupResponses}</td>
                                                <td>100%</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default CrossTab;
