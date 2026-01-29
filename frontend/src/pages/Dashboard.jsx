import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./layout";
import { responseAPI } from "../services/api";
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
  LineElement
);

const Dashboard = () => {
  const [user, setUser] = useState({
    firstName: "Admin",
    role: "admin"
  });

  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState('column'); // 'column' (vertical bar), 'pie', 'bar' (horizontal bar)
  const [filters, setFilters] = useState({
    parliament: true,
    municipality: true,
    ward_num: true,
    bjp: true,
    congress: true,
    brs: true,
    others: true
  });

  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
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

    fetchAllResponses();
  }, [navigate]);

  const fetchAllResponses = async () => {
    try {
      setLoading(true);
      // Fetch with a large limit to get all data for analytics
      const res = await responseAPI.getAll({ limit: 10000 });
      if (res.success) {
        setResponses(res.data.responses || []);
      }
    } catch (err) {
      console.error("Failed to fetch responses:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const aggregateData = () => {
    const counts = {
      parliament: new Set(),
      municipality: new Set(),
      ward_num: new Set(),
      bjp: 0,
      congress: 0,
      brs: 0,
      others: 0
    };

    responses.forEach(res => {
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
      bjp: '#FF9933', // Saffron
      congress: '#00AEF0', // Blue
      brs: '#FF00FF', // Pink
      others: '#999999' // Gray
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

    return {
      labels,
      datasets: [
        {
          label: 'MSR Survey Analytics',
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
    },
    maintainAspectRatio: false
  };

  return (
    <Layout user={user}>
      <h1 className="page-title">Dashboard Analytics</h1>

      <div className="dashboard-analytics">
        {/* FILTERS PANEL */}
        <div className="controls-panel">
          <div className="control-group">
            <h3>Search Inputs (Select to compare)</h3>
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
              <button
                className={`chart-type-btn ${chartType === 'column' ? 'active' : ''}`}
                onClick={() => setChartType('column')}
              >
                Column Chart
              </button>
              <button
                className={`chart-type-btn ${chartType === 'bar' ? 'active' : ''}`}
                onClick={() => setChartType('bar')}
              >
                Bar Chart
              </button>
              <button
                className={`chart-type-btn ${chartType === 'pie' ? 'active' : ''}`}
                onClick={() => setChartType('pie')}
              >
                Pie Chart
              </button>
            </div>
          </div>
        </div>

        {/* CHART DISPLAY */}
        <div className="chart-display-container">
          {loading ? (
            <div className="no-data-msg">Loading data...</div>
          ) : responses.length === 0 ? (
            <div className="no-data-msg">No responses found in msr_responses.</div>
          ) : chartData.labels.length === 0 ? (
            <div className="no-data-msg">Select at least one filter to see the chart.</div>
          ) : (
            <div className="chart-wrapper">
              {chartType === 'pie' ? (
                <Pie data={chartData} options={options} />
              ) : (
                <Bar data={chartData} options={options} />
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
