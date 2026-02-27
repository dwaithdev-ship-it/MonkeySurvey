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
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import './CrossTab.css'; // Reusing some base styles

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  ChartDataLabels
);

const SurveyAnalytics = () => {
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
  const [chartType, setChartType] = useState('column'); // column, bar, pie, doughnut
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
      alert("Please select a field or question.");
      return;
    }

    try {
      setReportLoading(true);
      const params = {
        surveyId,
        questionId: selectedQuestionId,
        startDate,
        endDate
      };
      const res = await responseAPI.getAnalytics(params);
      if (res.success) {
        setReportData(res.data);
      }
    } catch (err) {
      console.error("Failed to generate analytics:", err);
      alert("Error generating analytics.");
    } finally {
      setReportLoading(false);
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: chartType === 'bar' ? 'y' : 'x',
    plugins: {
      legend: {
        display: ['pie', 'doughnut'].includes(chartType),
        position: 'right'
      },
      datalabels: {
        color: '#fff',
        font: { weight: 'bold' },
        formatter: (value, ctx) => {
          const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
          const pct = ((value / total) * 100).toFixed(1);
          return `${value} (${pct}%)`;
        },
        display: (ctx) => ctx.dataset.data[ctx.dataIndex] > 0
      }
    }
  };

  const getChartData = () => {
    if (!reportData) return null;

    const sortedData = [...reportData.distribution].sort((a, b) => b.count - a.count);
    const labels = sortedData.map(item => item.option);
    const counts = sortedData.map(item => item.count);

    const colors = [
      '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
      '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#475569'
    ];

    return {
      labels,
      datasets: [{
        label: 'Responses',
        data: counts,
        backgroundColor: colors.slice(0, labels.length),
        borderRadius: chartType === 'column' || chartType === 'bar' ? 6 : 0
      }]
    };
  };

  const exportToExcel = () => {
    if (!reportData || !window.XLSX) return;
    const wb = window.XLSX.utils.book_new();
    const sheetData = [
      ["Option / Value", "Responses", "Percentage"]
    ];

    reportData.distribution.forEach(item => {
      const pct = ((item.count / reportData.totalResponses) * 100).toFixed(1) + '%';
      sheetData.push([item.option, item.count, pct]);
    });

    sheetData.push(["Total", reportData.totalResponses, "100%"]);

    const ws = window.XLSX.utils.aoa_to_sheet(sheetData);
    window.XLSX.utils.book_append_sheet(wb, ws, "Analytics Report");
    window.XLSX.writeFile(wb, `analytics_${survey.title}_${new Date().getTime()}.xlsx`);
  };

  const exportChartImage = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `chart_${survey.title}.png`;
    link.href = url;
    link.click();
  };

  const pinToDashboard = () => {
    const pins = JSON.parse(localStorage.getItem('dashboard_pins') || '[]');
    const newPin = {
      id: Date.now(),
      surveyId,
      surveyTitle: survey.title,
      questionId: selectedQuestionId,
      questionText: survey.questions.find(q => (q._id || q.id) === selectedQuestionId)?.question || selectedQuestionId,
      chartType,
      pinnedAt: new Date().toISOString()
    };
    localStorage.setItem('dashboard_pins', JSON.stringify([...pins, newPin]));
    alert("Report pinned to dashboard!");
  };

  if (loading) return <Layout user={user || {}}><div className="loading-state">Loading survey details...</div></Layout>;

  return (
    <Layout user={user || {}}>
      <div className="crosstab-container">
        <div className="crosstab-header">
          <button className="back-btn" onClick={() => navigate('/data')}>← Back to Surveys</button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Survey Analytics: <span className="survey-highlight">{survey?.title}</span></h2>
            <div className="chart-controls">
              <span style={{ fontSize: '14px', color: '#64748b' }}>Chart Type:</span>
              <select value={chartType} onChange={e => setChartType(e.target.value)} className="chart-type-select">
                <option value="column">Column Chart</option>
                <option value="bar">Bar Chart</option>
                <option value="pie">Pie Chart</option>
                <option value="doughnut">Doughnut Chart</option>
              </select>
              <button className="pin-btn" onClick={pinToDashboard} title="Pin to Dashboard">Pin to Dashboard</button>
            </div>
          </div>
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

          <div className="filter-group">
            <label>Select Question / Field</label>
            <select value={selectedQuestionId} onChange={e => setSelectedQuestionId(e.target.value)}>
              <option value="">-- Choose --</option>
              <optgroup label="Metadata Fields">
                <option value="parliament">Parliament</option>
                <option value="assembly">Assembly</option>
                <option value="mandal">Mandal</option>
                <option value="userName">Surveyor</option>
              </optgroup>
              <optgroup label="Survey Questions">
                {survey?.questions?.filter(q => !['text-block', 'line', 'pseudo-header'].includes(q.type)).map((q, idx) => (
                  <option key={q._id || q.id} value={q._id || q.id}>
                    Q{idx + 1}: {q.question || q.text || q.title}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <button className="apply-btn" onClick={handleApplyFilters} disabled={reportLoading}>
            {reportLoading ? 'Analyzing...' : 'Refresh Analytics'}
          </button>
        </div>

        {!reportData ? (
          <div className="empty-report-state">
            <div className="empty-icon">📊</div>
            <h3>No data available for selected criteria</h3>
            <p>Please select a question and click refresh to see the visualization.</p>
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
                <button className="export-action-btn csv" style={{ backgroundColor: '#6366f1' }} onClick={exportChartImage}>Export Image</button>
              </div>
            </div>

            <div className="analytics-visualization-card">
              <div className="chart-container" style={{ height: '400px', position: 'relative' }}>
                {chartType === 'column' || chartType === 'bar' ? (
                  <Bar data={getChartData()} options={chartOptions} />
                ) : chartType === 'pie' ? (
                  <Pie data={getChartData()} options={chartOptions} />
                ) : (
                  <Doughnut data={getChartData()} options={chartOptions} />
                )}
              </div>
            </div>

            <div className="group-table-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
              <h3 className="group-title">Frequency Distribution</h3>
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Option / Value</th>
                    <th>Responses</th>
                    <th>Percent</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.distribution.sort((a, b) => b.count - a.count).map((item, idx) => (
                    <tr key={idx}>
                      <td className="ans-label">{item.option || 'N/A'}</td>
                      <td className="ans-count">{item.count}</td>
                      <td className="ans-pct">
                        <div className="pct-bar-wrapper">
                          <div className="pct-bar" style={{ width: `${(item.count / reportData.totalResponses * 100)}%` }}></div>
                          <span>{(item.count / reportData.totalResponses * 100).toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="total-row">
                    <td>Total</td>
                    <td>{reportData.totalResponses}</td>
                    <td>100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SurveyAnalytics;
