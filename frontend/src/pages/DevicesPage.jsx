import React, { useState, useEffect } from 'react';
import Layout from './layout';
import { userAPI } from '../services/api';
import './DevicesPage.css';

export default function DevicesPage() {
    const [user, setUser] = useState(null);
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));
        fetchDevices();
    }, []);

    const fetchDevices = async () => {
        setLoading(true);
        try {
            const res = await userAPI.getDevices();
            if (res.success) {
                setDevices(res.data);
            }
        } catch (err) {
            console.error("Error fetching devices", err);
        }
        setLoading(false);
    };

    const toggleDeviceStatus = async (deviceId, currentStatus) => {
        try {
            const res = await userAPI.updateDeviceStatus(deviceId, !currentStatus);
            if (res.success) {
                setDevices(devices.map(d => d.deviceId === deviceId ? { ...d, isActive: !currentStatus } : d));
            }
        } catch (err) {
            console.error("Failed to toggle device status", err);
            alert("Failed to toggle device status");
        }
    };

    const filteredDevices = devices.filter(d => {
        const term = searchTerm.toLowerCase();
        return (
            (d.user && d.user.name && d.user.name.toLowerCase().includes(term)) ||
            (d.deviceId && d.deviceId.toLowerCase().includes(term)) ||
            (d.platform && d.platform.toLowerCase().includes(term))
        );
    });

    if (loading) return <Layout user={user || {}}><div className="loading">Loading Devices...</div></Layout>;

    return (
        <Layout user={user || {}}>
            <div className="devices-page-container">
                <div className="devices-header">
                    <div className="title-section">
                        <h2>Device Management</h2>
                        <p>Monitor and control mobile devices accessing Bodha Survey</p>
                    </div>
                </div>

                <div className="devices-controls">
                    <input
                        type="text"
                        placeholder="Search by User Name, Device ID, or Platform..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="devices-table-container">
                    <table className="devices-table">
                        <thead>
                            <tr>
                                <th>User Name</th>
                                <th>Email</th>
                                <th>Platform</th>
                                <th>Device ID</th>
                                <th>App Version</th>
                                <th>Last Login</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDevices.length > 0 ? filteredDevices.map(d => (
                                <tr key={d._id}>
                                    <td><strong>{d.user?.name || '-'}</strong></td>
                                    <td>{d.user?.companyEmail || d.user?.username || '-'}</td>
                                    <td>
                                        <span className={`platform-badge ${d.platform?.toLowerCase() || 'web'}`}>
                                            {d.platform || 'Web'}
                                        </span>
                                    </td>
                                    <td className="device-id-cell">{d.deviceId}</td>
                                    <td>{d.appVersion || '-'}</td>
                                    <td>{new Date(d.lastLoginAt).toLocaleString()}</td>
                                    <td>
                                        <span className={`status-badge ${d.isActive ? 'active' : 'inactive'}`}>
                                            {d.isActive ? 'Authorized' : 'Blocked'}
                                        </span>
                                    </td>
                                    <td className="actions-cell">
                                        <button
                                            className={`action-btn toggle ${d.isActive ? 'deactivate' : 'activate'}`}
                                            onClick={() => toggleDeviceStatus(d.deviceId, d.isActive)}
                                            title={d.isActive ? "Block Device" : "Authorize Device"}
                                        >
                                            {d.isActive ? '🚫 Block' : '✅ Authorize'}
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="8" className="empty-state">No devices found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
}
