import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { surveyAPI, responseAPI, userAPI } from "../services/api";
import Layout from "./layout";
import "./SurveyData.css";

const SurveyData = () => {
    const navigate = useNavigate();
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("Date DESC");
    const [user, setUser] = useState({});
    const [viewingResponsesFor, setViewingResponsesFor] = useState(null);
    const [responses, setResponses] = useState([]);
    const [loadingResponses, setLoadingResponses] = useState(false);
    const [filteredSurveys, setFilteredSurveys] = useState([]);
    const [selectedSurvey, setSelectedSurvey] = useState(null);
    const [admins, setAdmins] = useState([]);
    const [selectedAdmin, setSelectedAdmin] = useState(null);
    const [emailScheduleEnabled, setEmailScheduleEnabled] = useState(false);
    const [emailFrequency, setEmailFrequency] = useState("24h");

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        setUser(storedUser);
        setSelectedAdmin(storedUser);
        if (storedUser.settings) {
            setEmailScheduleEnabled(storedUser.settings.emailScheduleEnabled || false);
            setEmailFrequency(storedUser.settings.reportFrequency || "24h");
        }
        fetchSurveysWithCounts();
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        try {
            const res = await userAPI.getUsers();
            if (res.success) {
                const adminList = res.data.filter(u => u.role === 'admin');
                setAdmins(adminList);
            }
        } catch (err) {
            console.error("Failed to fetch admins:", err);
        }
    };

    const handleAdminChange = async (adminId) => {
        try {
            const res = await userAPI.getUserById(adminId);
            if (res.success) {
                const adminData = res.data;
                setSelectedAdmin(adminData);
                setEmailScheduleEnabled(adminData.settings?.emailScheduleEnabled || false);
                setEmailFrequency(adminData.settings?.reportFrequency || "24h");
            }
        } catch (err) {
            console.error("Failed to fetch admin details:", err);
        }
    };

    // Also poll for selected admin updates to show status changes
    useEffect(() => {
        let interval;
        if (emailScheduleEnabled && selectedAdmin) {
            interval = setInterval(async () => {
                try {
                    const res = await userAPI.getUserById(selectedAdmin._id || selectedAdmin.id);
                    if (res.success) {
                        setSelectedAdmin(res.data);
                        // If selected admin is the current user, update local user state too
                        if ((res.data._id || res.data.id) === (user._id || user.id)) {
                            setUser(res.data);
                            localStorage.setItem('user', JSON.stringify(res.data));
                        }
                    }
                } catch (err) {
                    console.warn("Status poll failed:", err);
                }
            }, 30000); // 30 seconds
        }
        return () => clearInterval(interval);
    }, [emailScheduleEnabled, selectedAdmin, user]);

    const updateEmailSchedule = async (enabled, frequency) => {
        if (!selectedAdmin) return;
        try {
            const updatedSettings = {
                ...selectedAdmin.settings,
                emailScheduleEnabled: enabled,
                reportFrequency: frequency
            };

            const adminId = selectedAdmin._id || selectedAdmin.id;
            await userAPI.updateProfileById(adminId, { settings: updatedSettings });

            // Update local state
            const updatedAdmin = { ...selectedAdmin, settings: updatedSettings };
            setSelectedAdmin(updatedAdmin);

            // If updating current user, update storage
            if (adminId === (user._id || user.id)) {
                setUser(updatedAdmin);
                localStorage.setItem('user', JSON.stringify(updatedAdmin));
            }

            setEmailScheduleEnabled(enabled);
            setEmailFrequency(frequency);
        } catch (error) {
            console.error("Failed to update email schedule:", error);
            alert("Failed to update email schedule settings.");
        }
    };

    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredSurveys(surveys);
        } else {
            const filtered = surveys.filter(s =>
                s.title.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredSurveys(filtered);
        }
    }, [searchTerm, surveys]);

    const fetchResponses = async (surveyOriginalId) => {
        try {
            setLoadingResponses(true);
            setViewingResponsesFor(surveyOriginalId);

            let searchId = surveyOriginalId;
            const survey = surveys.find(s => (s._id || s.id).toString() === surveyOriginalId.toString());
            const displayTitle = survey ? (survey.title || survey.name) : "";

            // Map to specific IDs requested by user
            if (displayTitle.includes("MSR Survey")) searchId = "1";
            if (displayTitle.includes("Prajābhiprāya")) searchId = "2";

            // 1. Fetch the survey details (always use the real ID for survey-service)
            const sRes = await surveyAPI.getById(surveyOriginalId);
            if (sRes.success) {
                setSelectedSurvey(sRes.data);
            }

            // 2. Fetch all responses (use mapped searchId for response-service)
            let res = await responseAPI.getAll({ surveyId: searchId, limit: 1000 });

            if (res.success) {
                setResponses(res.data.responses);
            }
        } catch (error) {
            console.error("Error fetching responses:", error);
            alert("Error fetching records for this survey.");
        } finally {
            setLoadingResponses(false);
        }
    };

    const getAnswerValue = (response, qId, qType, qIndex) => {
        if (!response) return "";

        const qIdStr = String(qId || '').toLowerCase();

        // --- 1. SEARCH BY ID (Most Accurate) ---
        if (response.answers && Array.isArray(response.answers)) {
            const ans = response.answers.find(a => String(a.questionId).toLowerCase() === qIdStr);
            if (ans && ans.value !== undefined && ans.value !== null && ans.value !== "") {
                return formatAns(ans.value, qType);
            }
        }

        // --- 2. SEARCH BY Question_N (Flattened Key) ---
        // Try qId match: "q23" -> Question_23
        if (qIdStr.startsWith('q')) {
            const num = qIdStr.replace('q', '');
            if (response[`Question_${num}`] !== undefined && response[`Question_${num}`] !== "") {
                return formatAns(response[`Question_${num}`], qType);
            }
        }
        // Try index match: index 0 -> Question_1
        const indexKey = `Question_${qIndex + 1}`;
        if (response[indexKey] !== undefined && response[indexKey] !== "") {
            return formatAns(response[indexKey], qType);
        }

        // --- 3. SEARCH BY POSITION (Answers Array) ---
        if (response.answers?.[qIndex]) {
            const ans = response.answers[qIndex];
            if (ans && ans.value !== undefined && ans.value !== null && ans.value !== "") {
                return formatAns(ans.value, qType);
            }
        }

        // --- 4. FALLBACK TO TOP-LEVEL FIELDS (For common mapping questions) ---
        // Usually Q1-Q4 for both MSR and Prajab map to these:
        if (qIndex === 0) return response.parliament || response.respondentName || "";
        if (qIndex === 1) return response.municipality || response.assembly || "";
        if (qIndex === 2) return response.ward_num || response.mandal || "";
        if (qIndex === 3) return response.village_or_street || "";

        return "";
    };

    const formatAns = (val, type) => {
        if (val === undefined || val === null) return "";
        const t = String(type || '').toLowerCase();

        if (t.includes('grid') && typeof val === 'object') {
            return Object.entries(val).map(([k, v]) => `${k}: ${v}`).join(", ");
        }
        if (Array.isArray(val)) {
            if (val.length === 0) return "";
            return val.join(", ");
        }
        return String(val);
    };

    const fetchSurveysWithCounts = async () => {
        try {
            setLoading(true);
            const res = await surveyAPI.getAll();
            if (res.success) {
                const fetchedSurveys = res.data.surveys || [];

                const surveysWithCounts = await Promise.all(
                    fetchedSurveys.map(async (survey) => {
                        try {
                            const originalId = (survey._id || survey.id).toString();
                            let searchId = originalId;

                            // Rename specifically for the client request
                            let displayTitle = survey.title || survey.name || "";
                            if (displayTitle.includes("MSR Municipal")) {
                                displayTitle = "MSR Survey";
                            }

                            // Map to specific IDs requested by user
                            if (displayTitle.includes("MSR Survey")) searchId = "1";
                            if (displayTitle.includes("Prajābhiprāya")) searchId = "2";

                            const countRes = await responseAPI.getAll({ surveyId: searchId, limit: 1 });

                            let count = countRes.success ? countRes.data.pagination.total : 0;

                            return {
                                ...survey,
                                title: displayTitle,
                                searchId: searchId, // Response search ID (1 or 2)
                                originalId: originalId, // Mongo ID (hidden)
                                responseCount: count,
                                lastResponseAt: countRes.success && countRes.data.responses.length > 0
                                    ? new Date(countRes.data.responses[0].createdAt).toLocaleString()
                                    : null
                            };
                        } catch (err) {
                            return { ...survey, responseCount: 0 };
                        }
                    })
                );

                setSurveys(surveysWithCounts);
            }
        } catch (error) {
            console.error("Error fetching surveys:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        const filtered = surveys.filter(s =>
            s.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredSurveys(filtered);
    };

    const handleReset = () => {
        setSearchTerm("");
        setFilteredSurveys(surveys);
    };

    const exportToCSV = () => {
        if (responses.length === 0 || !selectedSurvey) return;

        const questions = selectedSurvey.questions || [];
        const headers = [
            "Timestamp",
            "Surveyor",
            "Respondent Name",
            "Respondent Phone",
            "Parliament",
            "Municipality / Assembly",
            "Ward / Mandal",
            "Village / Street",
            ...questions.map((q, idx) => q.question || q.text || q.title || q.label || `Question ${idx + 1}`),
            "Maps Link"
        ];

        const rows = responses.map(r => [
            new Date(r.createdAt).toLocaleString(),
            r.userName || 'Anonymous',
            r.respondentName || '',
            r.respondentPhone || '',
            r.parliament || '',
            r.municipality || r.assembly || '',
            r.ward_num || r.mandal || '',
            r.village_or_street || '',
            ...questions.map((q, idx) => getAnswerValue(r, q.id || q._id, q.type, idx)),
            r.googleMapsLink || (r.location?.latitude ? `https://www.google.com/maps?q=${r.location.latitude},${r.location.longitude}` : (r.latitude ? `https://www.google.com/maps?q=${r.latitude},${r.longitude}` : ''))
        ]);

        let csvContent = "data:text/csv;charset=utf-8,"
            + headers.map(h => `"${h}"`).join(",") + "\n"
            + rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `survey_responses_${viewingResponsesFor}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToPDF = () => {
        window.print();
    };

    return (
        <Layout user={user}>
            <div className={`survey-data-container ${viewingResponsesFor ? 'viewing-responses' : ''}`}>

                {viewingResponsesFor ? (
                    <div className="responses-details-view">
                        <div className="details-header">
                            <button className="back-link-btn" onClick={() => setViewingResponsesFor(null)}>← Back to Surveys</button>
                            <h3>Survey Records: {surveys.find(s => (s._id || s.id).toString() === viewingResponsesFor.toString())?.title}</h3>
                            <div className="export-options">
                                <button className="export-btn csv" onClick={exportToCSV}>Export CSV</button>
                                <button className="export-btn xls" onClick={exportToCSV}>Export XLS</button>
                                <button className="export-btn pdf" onClick={exportToPDF}>Print PDF</button>
                            </div>
                        </div>

                        <div className="data-table-wrapper">
                            <table className="data-table printable">
                                <thead>
                                    <tr>
                                        <th>Timestamp</th>
                                        <th>Surveyor</th>
                                        <th>Respondent Name</th>
                                        <th>Respondent Phone</th>
                                        <th>Parliament</th>
                                        <th>Assembly</th>
                                        <th>Mandal</th>
                                        <th>Village/Street</th>
                                        {selectedSurvey?.questions?.map((q, idx) => (
                                            <th key={q._id || q.id || idx}>
                                                {q.question || q.text || q.title || q.label || `Question ${idx + 1}`}
                                            </th>
                                        ))}
                                        <th>Location (Link)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingResponses ? (
                                        <tr><td colSpan={9 + (selectedSurvey?.questions?.length || 0)} className="loading-cell">Loading records...</td></tr>
                                    ) : responses.length === 0 ? (
                                        <tr><td colSpan={9 + (selectedSurvey?.questions?.length || 0)} className="empty-cell">No records found for this survey.</td></tr>
                                    ) : (
                                        responses.map((resp, idx) => (
                                            <tr key={resp._id || idx}>
                                                <td>{new Date(resp.createdAt).toLocaleString()}</td>
                                                <td>{resp.userName || 'Anonymous'}</td>
                                                <td>{resp.respondentName || '-'}</td>
                                                <td>{resp.respondentPhone || '-'}</td>
                                                <td>{resp.parliament || '-'}</td>
                                                <td>{(resp.municipality || resp.assembly) || '-'}</td>
                                                <td>{(resp.ward_num || resp.mandal) || '-'}</td>
                                                <td>{resp.village_or_street || '-'}</td>
                                                {selectedSurvey?.questions?.map((q, qIdx) => (
                                                    <td key={q._id || q.id || qIdx}>
                                                        {getAnswerValue(resp, q.id || q._id, q.type, qIdx)}
                                                    </td>
                                                ))}
                                                <td>
                                                    {resp.googleMapsLink ? (
                                                        <a href={resp.googleMapsLink} target="_blank" rel="noreferrer" className="map-link">View Map</a>
                                                    ) : (resp.location && resp.location.latitude && resp.location.longitude) ? (
                                                        <a href={`https://www.google.com/maps?q=${resp.location.latitude},${resp.location.longitude}`} target="_blank" rel="noreferrer" className="map-link">View Map</a>
                                                    ) : (resp.latitude && resp.longitude) ? (
                                                        <a href={`https://www.google.com/maps?q=${resp.latitude},${resp.longitude}`} target="_blank" rel="noreferrer" className="map-link">View Map</a>
                                                    ) : 'N/A'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="page-header">
                            <div className="header-left-group">
                                <h2>Survey Data</h2>
                                <div className="email-schedule-wrapper">
                                    <div className="toggle-container">
                                        <select
                                            className="admin-select"
                                            value={selectedAdmin?._id || selectedAdmin?.id || ""}
                                            onChange={(e) => handleAdminChange(e.target.value)}
                                        >
                                            {admins.map(admin => (
                                                <option key={admin._id || admin.id} value={admin._id || admin.id}>
                                                    {admin.email}
                                                </option>
                                            ))}
                                        </select>
                                        <label className="switch">
                                            <input
                                                type="checkbox"
                                                checked={emailScheduleEnabled}
                                                onChange={(e) => updateEmailSchedule(e.target.checked, emailFrequency)}
                                            />
                                            <span className="slider round"></span>
                                        </label>
                                        <span className="toggle-label">
                                            {emailScheduleEnabled ? "Disable" : "Enable"}
                                        </span>
                                    </div>

                                    <select
                                        className="email-freq-select"
                                        value={emailFrequency}
                                        onChange={(e) => updateEmailSchedule(emailScheduleEnabled, e.target.value)}
                                        disabled={!emailScheduleEnabled}
                                        style={{ opacity: emailScheduleEnabled ? 1 : 0.6 }}
                                    >
                                        <option value="1m">1 min</option>
                                        <option value="1h">1 hour</option>
                                        <option value="24h">24 hours</option>
                                    </select>

                                    <div className="tooltip-icon-wrapper">
                                        <span className="info-icon-box">ℹ️</span>
                                        <div className="tooltip-text">
                                            Email Schedule allows you to automatically receive survey response updates by email without revisiting the dashboard. When enabled, you can choose to receive updates every 1 minute, every 1 hour, or every 24 hours, including response counts, key insights, and summary information for the selected survey. Emails will be sent to your registered email address ({user.email || 'Admin'}), and you can disable this option at any time to stop receiving updates.
                                        </div>
                                    </div>

                                    {selectedAdmin?.settings?.lastReportStatus && (
                                        <div className={`email-status-tag ${selectedAdmin.settings.lastReportStatus.toLowerCase()}`}>
                                            Email Status: <span>{selectedAdmin.settings.lastReportStatus}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button className="upload-summary-btn">Upload Summary</button>
                        </div>

                        <div className="filter-section">
                            <div className="search-box">
                                <input
                                    type="text"
                                    placeholder="Survey Name"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <button className="search-btn" onClick={handleSearch}>Search</button>
                                <button className="reset-btn" onClick={handleReset}>Reset</button>
                            </div>
                            <div className="sort-box">
                                <label>Sort By:</label>
                                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                    <option>Date DESC</option>
                                    <option>Date ASC</option>
                                    <option>Name ASC</option>
                                </select>
                            </div>
                        </div>

                        <div className="data-table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Name</th>
                                        <th>Responses</th>
                                        <th>Cross Tab</th>
                                        <th>Analytics</th>
                                        <th>NPS</th>
                                        <th>Daily Report</th>
                                        <th>Summary Report</th>
                                        <th>Spatial Report</th>
                                        <th>Scoring Report</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="10" className="loading-cell">Loading survey data...</td></tr>
                                    ) : filteredSurveys.length === 0 ? (
                                        <tr><td colSpan="10" className="empty-cell">No surveys found.</td></tr>
                                    ) : (
                                        filteredSurveys.map((survey, index) => (
                                            <tr key={survey._id || survey.id}>
                                                <td>{index + 1}</td>
                                                <td>
                                                    <div className="survey-info">
                                                        <div className="survey-icon-small">
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                                                        </div>
                                                        <div className="survey-name-date">
                                                            <span className="name">{survey.title}</span>
                                                            <span className="date">{new Date(survey.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="response-status">
                                                        <button
                                                            className="link-style-btn"
                                                            onClick={() => fetchResponses(survey.originalId || (survey._id || survey.id).toString())}
                                                            title="Click to view records"
                                                        >
                                                            {survey.responseCount}
                                                        </button>
                                                        {survey.lastResponseAt && <span className="last-at">{survey.lastResponseAt}</span>}
                                                    </div>
                                                </td>
                                                <td><button className="table-icon-btn"><i className="icon-crosstab"></i>📑</button></td>
                                                <td><button className="table-icon-btn" onClick={() => navigate(`/analytics/${survey._id || survey.id}`)}>📊</button></td>
                                                <td><button className="table-icon-btn">⏲️</button></td>
                                                <td><button className="table-icon-btn">📄</button></td>
                                                <td><button className="table-icon-btn">📋</button></td>
                                                <td><button className="table-icon-btn">🗺️</button></td>
                                                <td><button className="table-icon-btn">📝</button></td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="pagination-info">
                            <select className="row-select">
                                <option>10</option>
                                <option>20</option>
                                <option>50</option>
                            </select>
                            <span>Showing 1 to {filteredSurveys.length} of {filteredSurveys.length} Surveys</span>
                        </div>
                    </>
                )}
            </div>
        </Layout>
    );
};

export default SurveyData;
