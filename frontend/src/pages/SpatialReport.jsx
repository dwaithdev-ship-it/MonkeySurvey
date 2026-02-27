import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { surveyAPI, responseAPI } from '../services/api';
import Layout from './layout';
import './SpatialReport.css';

const UserMap = ({ userName, data, showPopups }) => {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);

    useEffect(() => {
        if (!window.L || !mapRef.current) return;

        // Ensure cleanup of any previous instance
        if (mapInstance.current) {
            mapInstance.current.remove();
            mapInstance.current = null;
        }

        const L = window.L;
        const center = data.length > 0 ? [data[0].lat, data[0].lng] : [15.9129, 79.7400];

        mapInstance.current = L.map(mapRef.current).setView(center, 7);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(mapInstance.current);

        const group = L.featureGroup();
        const coordMap = {};

        data.forEach(loc => {
            const coordKey = `${loc.lat.toFixed(6)}_${loc.lng.toFixed(6)}`;
            if (!coordMap[coordKey]) coordMap[coordKey] = 0;
            const overlapCount = coordMap[coordKey];
            coordMap[coordKey]++;

            const jitterLat = overlapCount > 0 ? (Math.random() - 0.5) * 0.0006 : 0;
            const jitterLng = overlapCount > 0 ? (Math.random() - 0.5) * 0.0006 : 0;
            const finalLat = loc.lat + jitterLat;
            const finalLng = loc.lng + jitterLng;

            const marker = L.marker([finalLat, finalLng]);

            if (showPopups) {
                const popupContent = `
                    <div class="map-popup">
                        <h4>Survey Response</h4>
                        <p><strong>ID:</strong> ${loc.surveyId || 'N/A'}</p>
                        <p><strong>Date:</strong> ${new Date(loc.createdAt).toLocaleString()}</p>
                        <p><strong>Location Details:</strong> ${loc.parliament || '-'}, ${loc.assembly || '-'}, ${loc.mandal || '-'}</p>
                        <p><strong>GPS:</strong> ${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}</p>
                    </div>
                `;
                marker.bindPopup(popupContent);
            }

            marker.addTo(group);
        });

        group.addTo(mapInstance.current);

        if (data.length > 0) {
            // maxZoom prevents zooming in too much if there's only 1 point
            mapInstance.current.fitBounds(group.getBounds(), { padding: [30, 30], maxZoom: 15 });
        }

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, [data, showPopups]);

    return (
        <div className="user-map-card">
            <div className="user-map-header">
                <h3>{userName}</h3>
                <span className="user-map-badge">{data.length} Response{data.length !== 1 ? 's' : ''}</span>
            </div>
            <div ref={mapRef} style={{ height: '350px', width: '100%', borderRadius: '0 0 12px 12px', zIndex: 1 }}></div>
        </div>
    );
};

const SpatialReport = () => {
    const { surveyId } = useParams();
    const navigate = useNavigate();
    const [survey, setSurvey] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reportLoading, setReportLoading] = useState(false);
    const [locations, setLocations] = useState([]);
    const [user, setUser] = useState(null);

    // Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showPopups, setShowPopups] = useState(true);
    const [leafletLoaded, setLeafletLoaded] = useState(typeof window.L !== 'undefined');

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        fetchSurveyDetails();
        loadLeaflet();
    }, [surveyId]);

    const loadLeaflet = () => {
        if (window.L) {
            setLeafletLoaded(true);
            return;
        }

        // Load CSS if not already there
        if (!document.getElementById('leaflet-css')) {
            const link = document.createElement('link');
            link.id = 'leaflet-css';
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
        }

        // Load JS if not already there
        if (!document.getElementById('leaflet-js')) {
            const script = document.createElement('script');
            script.id = 'leaflet-js';
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.async = true;
            script.onload = () => {
                console.log('Leaflet loaded');
                setLeafletLoaded(true);
            };
            document.body.appendChild(script);
        }
    };

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
            const params = { surveyId, startDate, endDate };
            const res = await responseAPI.getSpatialReport(params);
            if (res.success) {
                setLocations(res.data);
            }
        } catch (err) {
            console.error("Spatial report error:", err);
        } finally {
            setReportLoading(false);
        }
    };

    useEffect(() => {
        if (survey && leafletLoaded) {
            handleApplyFilters();
        }
    }, [survey, leafletLoaded]);

    const groupedLocations = useMemo(() => {
        const groups = {};
        locations.forEach(loc => {
            const name = loc.userName || 'Anonymous';
            if (!groups[name]) {
                groups[name] = [];
            }
            groups[name].push(loc);
        });
        return groups;
    }, [locations]);

    if (loading) return <Layout user={user || {}}><div className="loading-state">Loading survey details...</div></Layout>;

    return (
        <Layout user={user || {}}>
            <div className="spatial-report-container">
                <div className="crosstab-header">
                    <button className="back-btn" onClick={() => navigate('/data')}>← Back to Surveys</button>
                    <h2>Spatial Report: <span className="survey-highlight">{survey?.title}</span></h2>
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

                    <div className="filter-group toggle-group" style={{ marginLeft: '20px' }}>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={showPopups}
                                onChange={e => setShowPopups(e.target.checked)}
                            />
                            <span className="slider round"></span>
                        </label>
                        <span style={{ fontSize: '14px', color: '#64748b' }}>Show Info Popups</span>
                    </div>

                    <button className="apply-btn" onClick={handleApplyFilters} disabled={reportLoading} style={{ marginLeft: 'auto' }}>
                        {reportLoading ? 'Refreshing Maps...' : 'Refresh Maps'}
                    </button>
                </div>

                {locations.length > 0 ? (
                    <div className="user-maps-grid">
                        <div className="map-overall-stats">
                            <span>Total Unique Surveyors: <strong>{Object.keys(groupedLocations).length}</strong></span>
                            <span>Total GPS Responses: <strong>{locations.length}</strong></span>
                        </div>

                        {Object.entries(groupedLocations).map(([userName, userLocs]) => (
                            <UserMap
                                key={userName}
                                userName={userName}
                                data={userLocs}
                                showPopups={showPopups}
                            />
                        ))}
                    </div>
                ) : (
                    !reportLoading && (
                        <div className="empty-report-state" style={{ marginTop: '20px' }}>
                            <div className="empty-icon">📍</div>
                            <h3>No GPS responses found for selected criteria</h3>
                            <p>Verify that your survey collects location data and responses exist for these dates.</p>
                        </div>
                    )
                )}
            </div>
        </Layout>
    );
};

export default SpatialReport;
