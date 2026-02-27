import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './layout';
import { userAPI, surveyAPI } from '../services/api';
import './UsersPage.css';

export default function UsersPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [usersList, setUsersList] = useState([]);
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(true);

    // Search state
    const [searchTerm, setSearchTerm] = useState('');

    // Modal / Form state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        companyEmail: '',
        phoneNumber: '',
        password: '',
        demoTemplate: 'surveys'
    });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const [usersRes, surveysRes] = await Promise.all([
                userAPI.getMSRUsers(),
                surveyAPI.getAll()
            ]);

            if (usersRes.success) {
                setUsersList(usersRes.data);
            }
            if (surveysRes.success) {
                const srvs = surveysRes.data.surveys || surveysRes.data || [];
                setSurveys(Array.isArray(srvs) ? srvs : []);
            }
        } catch (err) {
            console.error("Error fetching users data", err);
        }
        setLoading(false);
    };

    const handleOpenModal = (userToEdit = null) => {
        setEditingUser(userToEdit);
        if (userToEdit) {
            setFormData({
                name: userToEdit.name || '',
                username: userToEdit.username || '',
                companyEmail: userToEdit.companyEmail || '',
                phoneNumber: userToEdit.phoneNumber || '',
                password: '', // Kept empty for edit
                demoTemplate: userToEdit.demoTemplate || 'surveys'
            });
        } else {
            setFormData({
                name: '',
                username: '',
                companyEmail: '',
                phoneNumber: '',
                password: '',
                demoTemplate: 'surveys'
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingUser) {
                // Update user
                const res = await userAPI.updateMSRUser(editingUser._id, formData);
                if (res.success) {
                    alert('User updated successfully');
                }
            } else {
                // Create user
                if (!formData.password) return alert("Password is required for new users");
                const res = await userAPI.createMSRUser(formData);
                if (res.success) {
                    alert('User created successfully');
                }
            }
            handleCloseModal();
            fetchUsers();
        } catch (err) {
            console.error("Failed to save user", err);
            alert(err?.response?.data?.error?.message || "Failed to save user");
        }
    };

    const toggleUserStatus = async (id, currentStatus) => {
        try {
            const res = await userAPI.updateMSRStatus(id, !currentStatus);
            if (res.success) {
                setUsersList(usersList.map(u => u._id === id ? { ...u, isActive: !currentStatus } : u));
            }
        } catch (err) {
            console.error("Failed to toggle status", err);
            alert("Failed to toggle status");
        }
    };

    const filteredUsers = usersList.filter(u =>
        (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.companyEmail && u.companyEmail.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) return <Layout user={user || {}}><div className="loading">Loading Users...</div></Layout>;

    return (
        <Layout user={user || {}}>
            <div className="users-page-container">

                <div className="users-header">
                    <div className="title-section">
                        <h2>User Management</h2>
                        <p>Manage MSR survey application users</p>
                    </div>
                    <button className="create-user-btn" onClick={() => handleOpenModal()}>
                        + Add New User
                    </button>
                </div>

                <div className="users-controls">
                    <input
                        type="text"
                        placeholder="Search by name, username, or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="users-table-container">
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length > 0 ? filteredUsers.map(u => (
                                <tr key={u._id}>
                                    <td><strong>{u.name || '-'}</strong></td>
                                    <td>{u.username}</td>
                                    <td>{u.companyEmail || '-'}</td>
                                    <td>{u.phoneNumber || '-'}</td>
                                    <td>
                                        <span className={`status-badge ${u.isActive ? 'active' : 'inactive'}`}>
                                            {u.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                                    <td className="actions-cell">
                                        <button className="action-btn edit" onClick={() => handleOpenModal(u)} title="Edit User">
                                            ✏️ Edit
                                        </button>
                                        <button
                                            className={`action-btn toggle ${u.isActive ? 'deactivate' : 'activate'}`}
                                            onClick={() => toggleUserStatus(u._id, u.isActive)}
                                            title={u.isActive ? "Deactivate User" : "Activate User"}
                                        >
                                            {u.isActive ? '🚫 Deactivate' : '✅ Activate'}
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="7" className="empty-state">No users found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Modal */}
                {isModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h3>{editingUser ? 'Edit User' : 'Create New User'}</h3>
                            <form onSubmit={handleSubmit} className="user-form">
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                                </div>

                                <div className="form-group row">
                                    <div className="half">
                                        <label>Username *</label>
                                        <input type="text" name="username" value={formData.username} onChange={handleChange} required disabled={!!editingUser} />
                                    </div>
                                    <div className="half">
                                        <label>Email *</label>
                                        <input type="email" name="companyEmail" value={formData.companyEmail} onChange={handleChange} required />
                                    </div>
                                </div>

                                <div className="form-group row" style={{ marginBottom: '16px' }}>
                                    <div className="half">
                                        <label>Phone Number</label>
                                        <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
                                    </div>
                                    <div className="half">
                                        <label>Password {editingUser && '(Leave blank to keep)'}</label>
                                        <input type="password" name="password" value={formData.password} onChange={handleChange} />
                                        {editingUser && <small>Note: Backend doesn't support changing password via this PUT route unless we modify it, so password might be ignored.</small>}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Assigned Survey (Demo Template)</label>
                                    <select name="demoTemplate" value={formData.demoTemplate} onChange={handleChange} required>
                                        <option value="">-- Assign a Survey or Template --</option>
                                        <optgroup label="Live Surveys">
                                            {surveys.map(s => (
                                                <option key={s._id || s.id} value={s.title || s.name}>{s.title || s.name}</option>
                                            ))}
                                        </optgroup>
                                        <optgroup label="Existing Templates">
                                            {Array.from(new Set(usersList.map(u => u.demoTemplate).filter(Boolean))).filter(dt => !surveys.some(s => (s.title || s.name) === dt)).map((dt, idx) => (
                                                <option key={idx} value={dt}>{dt}</option>
                                            ))}
                                            <option value="surveys">General Default (surveys)</option>
                                        </optgroup>
                                    </select>
                                </div>

                                <div className="modal-actions">
                                    <button type="button" className="cancel-btn" onClick={handleCloseModal}>Cancel</button>
                                    <button type="submit" className="save-btn">{editingUser ? 'Save Changes' : 'Create User'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </Layout>
    );
}
