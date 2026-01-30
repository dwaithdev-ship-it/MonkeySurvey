import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./layout";
import { responseAPI, parlConsAPI } from "../services/api";
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
import { Bar, Pie } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import "./Dashboard.css";

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

const Dashboard = () => {
  const [user, setUser] = useState({
    firstName: "Admin",
    role: "admin"
  });

  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState('column');
  const [filters, setFilters] = useState({
    parliament: true,
    municipality: true,
    ward_num: true,
    bjp: true,
    congress: true,
    brs: true,
    others: true
  });

  // Dropdown Filter States
  const [parliaments, setParliaments] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [selectedParl, setSelectedParl] = useState("all");
  const [selectedMuni, setSelectedMuni] = useState("all");
  const [selectedWard, setSelectedWard] = useState("all");

  const wardNumbers = Array.from({ length: 100 }, (_, i) => i + 1);

  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Redirect non-admins to survey page
        if (parsedUser.role !== 'admin') {
          navigate("/take-survey/1");
          return;
        }
        setUser(parsedUser);
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    } else {
      navigate("/login");
    }

    fetchInitialData();
  }, [navigate]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [responsesRes, parlRes] = await Promise.all([
        responseAPI.getAll({ limit: 10000 }),
        parlConsAPI.getParliaments()
      ]);

      if (responsesRes.success) {
        setResponses(responsesRes.data.responses || []);
      }
      if (parlRes.success) {
        setParliaments(parlRes.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch initial data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleParlChange = async (e) => {
    const val = e.target.value;
    setSelectedParl(val);
    setSelectedMuni("all");
    setMunicipalities([]);

    if (val !== "all") {
      try {
        const res = await parlConsAPI.getMunicipalities(val);
        if (res.success) {
          setMunicipalities(res.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch municipalities:", err);
      }
    }
  };

  const handleFilterChange = (key) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const aggregateData = () => {
    // Filter responses based on dropdowns
    const filteredResponses = responses.filter(res => {
      const parlMatch = selectedParl === "all" || res.parliament === selectedParl;
      const muniMatch = selectedMuni === "all" || res.municipality === selectedMuni;
      const wardMatch = selectedWard === "all" || res.ward_num === selectedWard.toString();
      return parlMatch && muniMatch && wardMatch;
    });

    const counts = {
      parliament: new Set(),
      municipality: new Set(),
      ward_num: new Set(),
      bjp: 0,
      congress: 0,
      brs: 0,
      others: 0
    };

    filteredResponses.forEach(res => {
      if (res.parliament) counts.parliament.add(res.parliament);
      if (res.municipality) counts.municipality.add(res.municipality);
      if (res.ward_num) counts.ward_num.add(res.ward_num);

      const q1 = res.Question_1 || '';
      if (q1.includes('బీజేపీ')) counts.bjp++;
      else if (q1.includes('కాంగ్రెస్')) counts.congress++;
      else if (q1.includes('బిఆర్ఎస్')) counts.brs++;
      else if (q1.includes('ఇతరులు')) counts.others++;
    });

    const labels = [];
    const data = [];
    const colors = [];

    const colorMap = {
      parliament: '#FF6384',
      municipality: '#36A2EB',
      ward_num: '#FFCE56',
      bjp: '#FF9933',
      congress: '#00AEF0',
      brs: '#FF00FF',
      others: '#999999'
    };

    if (filters.parliament) {
      labels.push('Total Parliaments');
      data.push(counts.parliament.size);
      colors.push(colorMap.parliament);
    }
    if (filters.municipality) {
      labels.push('Total Municipalities');
      data.push(counts.municipality.size);
      colors.push(colorMap.municipality);
    }
    if (filters.ward_num) {
      labels.push('Total Wards');
      data.push(counts.ward_num.size);
      colors.push(colorMap.ward_num);
    }
    if (filters.bjp) {
      labels.push('BJP Supporters');
      data.push(counts.bjp);
      colors.push(colorMap.bjp);
    }
    if (filters.congress) {
      labels.push('Congress Supporters');
      data.push(counts.congress);
      colors.push(colorMap.congress);
    }
    if (filters.brs) {
      labels.push('BRS Supporters');
      data.push(counts.brs);
      colors.push(colorMap.brs);
    }
    if (filters.others) {
      labels.push('Others');
      data.push(counts.others);
      colors.push(colorMap.others);
    }

    const total = data.reduce((a, b) => a + b, 0);

    return {
      labels,
      total,
      datasets: [
        {
          label: `Chart (Filtered: ${filteredResponses.length} Responses)`,
          data,
          backgroundColor: colors,
          borderColor: colors.map(c => c + 'CC'),
          borderWidth: 1,
        },
      ],
    };
  };

  const chartData = aggregateData();

  const options = {
    animation: false, // Disable animation to prevent delay/glitch
    responsive: true,
    indexAxis: chartType === 'bar' ? 'y' : 'x',
    plugins: {
      legend: {
        position: 'top',
        display: chartType === 'pie'
      },
      title: {
        display: true,
        text: 'Survey Response Distribution',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = chartData.total || 1;
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      },
      datalabels: {
        color: chartType === 'pie' ? '#fff' : '#444',
        // Dynamic anchor/align based on chart type
        anchor: chartType === 'pie' ? 'center' : 'end',
        align: chartType === 'pie' ? 'center' : 'end',
        offset: 4,
        clip: false, // Prevent labels from being clipped
        font: {
          weight: 'bold',
          size: 11
        },
        formatter: (value) => {
          const total = chartData.total || 1;
          const percentage = ((value / total) * 100).toFixed(1);
          return `${value} (${percentage}%)`;
        },
        display: (context) => {
          return context.dataset.data[context.dataIndex] > 0;
        }
      }
    },
    layout: {
      padding: {
        top: 30,
        right: 50, // Extra padding for right-aligned labels in horizontal bar
        left: 20,
        bottom: 20
      }
    },
    maintainAspectRatio: false
  };

  // Aggregate Ward Stats Memoized
  const wardStatsData = useMemo(() => {
    // Filter responses based on current selection
    const filtered = responses.filter(res => {
      const parlMatch = selectedParl === "all" || res.parliament === selectedParl;
      const muniMatch = selectedMuni === "all" || res.municipality === selectedMuni;
      // Ward filter is ignored for the ward-wise table as we want to show all wards or relevant wards
      return parlMatch && muniMatch;
    });

    const stats = {};

    filtered.forEach(res => {
      const ward = res.ward_num;
      const parl = res.parliament || 'N/A';
      const muni = res.municipality || 'N/A';

      if (!ward) return;

      // Composite key to distinguish same ward number in different areas
      const key = `${parl}_${muni}_${ward}`;

      if (!stats[key]) {
        stats[key] = {
          parliament: parl,
          municipality: muni,
          ward: ward,
          bjp: 0,
          congress: 0,
          brs: 0,
          others: 0,
          total: 0
        };
      }

      const q1 = res.Question_1 || '';
      if (q1.includes('బీజేపీ')) stats[key].bjp++;
      else if (q1.includes('కాంగ్రెస్')) stats[key].congress++;
      else if (q1.includes('బిఆర్ఎస్')) stats[key].brs++;
      else if (q1.includes('ఇతరులు')) stats[key].others++;

      stats[key].total++;
    });

    // Determine sort order: 
    // If specific Parliament/Muni selected, sort by Ward.
    // If All selected, sort by Parliament -> Municipality -> Ward.
    return Object.values(stats).sort((a, b) => {
      if (a.parliament !== b.parliament) return a.parliament.localeCompare(b.parliament);
      if (a.municipality !== b.municipality) return a.municipality.localeCompare(b.municipality);
      return parseInt(a.ward) - parseInt(b.ward);
    });
  }, [responses, selectedParl, selectedMuni]);

  const exportWardCSV = () => {
    if (wardStatsData.length === 0) return;

    const headers = ["Parliament", "Municipality", "Ward Number", "BJP", "Congress", "BRS", "Others", "Total Responses"];
    const rows = wardStatsData.map(row => [
      row.parliament, row.municipality, row.ward, row.bjp, row.congress, row.brs, row.others, row.total
    ]);

    let csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ward_stats_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportWardXLS = () => {
    if (wardStatsData.length === 0) return;

    // XML-based XLS template for better compatibility than simple CSV
    let xlsContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Ward Statistics</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
      </head>
      <body>
        <table>
          <thead>
            <tr>
              <th>Parliament</th>
              <th>Municipality</th>
              <th>Ward Number</th>
              <th>BJP</th>
              <th>Congress</th>
              <th>BRS</th>
              <th>Others</th>
              <th>Total Responses</th>
            </tr>
          </thead>
          <tbody>
            ${wardStatsData.map(row => `
              <tr>
                <td>${row.parliament}</td>
                <td>${row.municipality}</td>
                <td>${row.ward}</td>
                <td>${row.bjp}</td>
                <td>${row.congress}</td>
                <td>${row.brs}</td>
                <td>${row.others}</td>
                <td>${row.total}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([xlsContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ward_stats_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printWardStats = () => {
    // Create a printable window or use a specific print style
    // For simplicity and effectiveness in SPA, we can clone the node and print it, or just use window.print with CSS media queries
    window.print();
  };

  return (
    <Layout user={user}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Dashboard Analytics</h1>
        <button
          onClick={() => navigate('/take-survey/1')}
          className="btn-primary"
          style={{ padding: '0.8rem 2rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)' }}
        >
          🚀 Take MSR Survey
        </button>
      </div>

      <div className="dashboard-analytics">
        {/* DROPDOWN FILTERS */}
        <div className="controls-panel dropdown-filters-panel">
          <div className="dropdown-group">
            <div className="dropdown-item">
              <label>Parliament</label>
              <select value={selectedParl} onChange={handleParlChange}>
                <option value="all">All Parliaments</option>
                {parliaments.map((parl, idx) => (
                  <option key={idx} value={parl}>{parl}</option>
                ))}
              </select>
            </div>
            <div className="dropdown-item">
              <label>Municipality</label>
              <select
                value={selectedMuni}
                onChange={(e) => setSelectedMuni(e.target.value)}
                disabled={selectedParl === "all"}
              >
                <option value="all">All Municipalities</option>
                {municipalities.map((muni, idx) => (
                  <option key={idx} value={muni}>{muni}</option>
                ))}
              </select>
            </div>
            <div className="dropdown-item">
              <label>Ward Number</label>
              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
              >
                <option value="all">All Wards</option>
                {wardNumbers.map((num) => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* METRIC SELECTION */}
        <div className="controls-panel">
          <div className="control-group">
            <h3>Display Metrics (X-Axis)</h3>
            <div className="checkbox-group">
              {Object.keys(filters).map(key => (
                <label key={key} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={filters[key]}
                    onChange={() => handleFilterChange(key)}
                  />
                  {key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ')}
                </label>
              ))}
            </div>
          </div>

          <div className="control-group">
            <h3>Chart Type</h3>
            <div className="chart-type-group">
              {['column', 'bar', 'pie'].map(type => (
                <button
                  key={type}
                  className={`chart-type-btn ${chartType === type ? 'active' : ''}`}
                  onClick={() => setChartType(type)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)} Chart
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CHART DISPLAY */}
        <div className="chart-display-container">
          {loading ? (
            <div className="no-data-msg">Loading data...</div>
          ) : chartData.labels.length === 0 ? (
            <div className="no-data-msg">Select at least one metric to see the chart.</div>
          ) : (
            <div className="chart-wrapper">
              {chartType === 'pie' ? (
                <Pie
                  key={`${selectedParl}-${selectedMuni}-${selectedWard}-${chartType}`}
                  data={chartData}
                  options={options}
                  plugins={[ChartDataLabels]}
                />
              ) : (
                <Bar
                  key={`${selectedParl}-${selectedMuni}-${selectedWard}-${chartType}`}
                  data={chartData}
                  options={options}
                  plugins={[ChartDataLabels]}
                />
              )}
            </div>
          )}
        </div>

        {/* WARD STATISTICS TABLE */}
        <div className="ward-stats-container no-break">
          <div className="ward-stats-header">
            <h3>Ward-wise Statistics</h3>
            <div className="export-options">
              <button className="export-btn csv" onClick={exportWardCSV}>Export CSV</button>
              <button className="export-btn xls" onClick={exportWardXLS}>Export XLS</button>
              <button className="export-btn pdf" onClick={printWardStats}>Print PDF</button>
            </div>
          </div>
          <div className="data-table-wrapper">
            <table className="data-table ward-table">
              <thead>
                <tr>
                  <th>Parliament</th>
                  <th>Municipality</th>
                  <th>Ward Number</th>
                  <th style={{ color: '#FF9933' }}>BJP</th>
                  <th style={{ color: '#00AEF0' }}>Congress</th>
                  <th style={{ color: '#FF00FF' }}>BRS</th>
                  <th style={{ color: '#666' }}>Others</th>
                  <th>Total Responses</th>
                </tr>
              </thead>
              <tbody>
                {wardStatsData.length === 0 ? (
                  <tr><td colSpan="8" className="empty-cell">No data available for the current selection.</td></tr>
                ) : (
                  wardStatsData.map((row) => (
                    <tr key={`${row.parliament}-${row.municipality}-${row.ward}`}>
                      <td>{row.parliament}</td>
                      <td>{row.municipality}</td>
                      <td>{row.ward}</td>
                      <td>{row.bjp}</td>
                      <td>{row.congress}</td>
                      <td>{row.brs}</td>
                      <td>{row.others}</td>
                      <td><strong>{row.total}</strong></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
