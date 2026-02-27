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
import './CrossTab.css'; // Reusing base report styles
import './DailyReport.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const DailyReport = () => {
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
            const res = await responseAPI.getDailyReport(params);
            if (res.success) {
                setReportData(res.data);
            }
        } catch (err) {
            console.error("Daily report error:", err);
            alert("Error loading daily report.");
        } finally {
            setReportLoading(false);
        }
    };

    // Auto-load on mount once survey is here
    useEffect(() => {
        if (survey) handleApplyFilters();
    }, [survey]);

    const chartData = useMemo(() => {
        if (!reportData || !reportData.report.length) return null;

        // Aggregate by date for the chart (ignore surveyors in chart breakdown)
        const dateGroups = {};
        reportData.report.forEach(item => {
            dateGroups[item.date] = (dateGroups[item.date] || 0) + item.count;
        });

        const sortedDates = Object.keys(dateGroups).sort();

        return {
            labels: sortedDates,
            datasets: [{
                label: 'Total Responses',
                data: sortedDates.map(d => dateGroups[d]),
                backgroundColor: '#6366f1',
                borderRadius: 4
            }]
        };
    }, [reportData]);

    const exportToExcel = () => {
        if (!reportData || !window.XLSX) return;
        const wb = window.XLSX.utils.book_new();
        const sheetData = [
            ["Date", "Surveyor / User", "Total Responses", "Parliament", "Assembly", "Mandal"]
        ];

        reportData.report.forEach(item => {
            sheetData.push([item.date, item.userName, item.count, item.parliament, item.assembly, item.mandal]);
        });

        const ws = window.XLSX.utils.aoa_to_sheet(sheetData);
        window.XLSX.utils.book_append_sheet(wb, ws, "Daily Report");
        window.XLSX.writeFile(wb, `daily_report_${survey?.title || 'survey'}_${new Date().getTime()}.xlsx`);
    };

    const exportToCSV = () => {
        if (!reportData) return;
        let csv = "Date,Surveyor,Responses,Parliament,Assembly,Mandal\n";
        reportData.report.forEach(item => {
            csv += `${item.date},"${item.userName}",${item.count},"${item.parliament || ''}","${item.assembly || ''}","${item.mandal || ''}"\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `daily_report_${survey?.title || 'survey'}.csv`;
        link.click();
    };

    if (loading) return <Layout user={user || {}}><div className="loading-state">Loading survey details...</div></Layout>;

    return (
        <Layout user={user || {}}>
            <div className="crosstab-container">
                <div className="crosstab-header">
                    <button className="back-btn" onClick={() => navigate('/data')}>← Back to Surveys</button>
                    <h2>Daily Response Report: <span className="survey-highlight">{survey?.title}</span></h2>
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
                        {reportLoading ? 'Loading...' : 'Refresh Report'}
                    </button>
                    <div className="summary-actions" style={{ marginLeft: 'auto' }}>
                        <button className="export-action-btn xls" onClick={exportToExcel}>Export XLSX</button>
                        <button className="export-action-btn csv" style={{ backgroundColor: '#475569' }} onClick={exportToCSV}>Export CSV</button>
                    </div>
                </div>

                {!reportData || reportData.report.length === 0 ? (
                    <div className="empty-report-state">
                        <div className="empty-icon">📅</div>
                        <h3>No survey responses found for selected dates</h3>
                        <p>Try adjusting your date range to see daily activity.</p>
                    </div>
                ) : (
                    <div className="report-content">
                        <div className="report-summary">
                            <div className="summary-card">
                                <span className="card-label">Total Responses</span>
                                <span className="card-value">{reportData.summary.totalResponses}</span>
                            </div>
                            <div className="summary-card">
                                <span className="card-label">Avg / Day</span>
                                <span className="card-value">{reportData.summary.avgPerDay}</span>
                            </div>
                            <div className="summary-card" style={{ borderLeftColor: '#f59e0b' }}>
                                <span className="card-label">Top Performer</span>
                                <span className="card-value">{reportData.summary.topUser}</span>
                            </div>
                        </div>

                        {chartData && (
                            <div className="analytics-visualization-card">
                                <h3 className="group-title">Response Trend (Day-wise)</h3>
                                <div style={{ height: '300px' }}>
                                    <Bar
                                        data={chartData}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: { legend: { display: false } }
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="group-table-card">
                            <h3 className="group-title">Daily Activity Logs</h3>
                            <table className="report-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Surveyor / User</th>
                                        <th>Responses</th>
                                        <th>Parliament</th>
                                        <th>Assembly</th>
                                        <th>Mandal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.report.map((item, idx) => (
                                        <tr key={idx}>
                                            <td style={{ fontWeight: '600' }}>{item.date}</td>
                                            <td>{item.userName}</td>
                                            <td><span className="count-badge">{item.count}</span></td>
                                            <td>{item.parliament || '-'}</td>
                                            <td>{item.assembly || '-'}</td>
                                            <td>{item.mandal || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default DailyReport;
