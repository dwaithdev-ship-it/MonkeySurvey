import React, { useState, useEffect } from 'react';
import Layout from './layout';
import { userAPI } from '../services/api';
import './UsersPage.css';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentUser, setCurrentUser] = useState({});

    // Modals state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    const [createForm, setCreateForm] = useState({
        name: '',
        username: '',
        password: '',
        companyEmail: '',
        company: '',
        phoneNumber: '',
        demoTemplate: 'Political Survey'
    });

    const [editForm, setEditForm] = useState({
        name: '',
        companyEmail: '',
        company: '',
        phoneNumber: '',
        demoTemplate: ''
    });
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError('');

            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            if (storedUser.role !== 'admin') {
                setError('Access Denied: Admin privileges required.');
                setLoading(false);
                return;
            }

            const response = await userAPI.getMSRUsers();
            if (response.success) {
                setUsers(response.data);
            }
        } catch (err) {
            setError(err.error?.message || err.message || 'Failed to fetch users');
            console.error('Fetch users error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await userAPI.createMSRUser(createForm);
            if (response.success) {
                setUsers([response.data, ...users]);
                setShowCreateModal(false);

                // Ask to send WhatsApp
                if (window.confirm('User created successfully! Do you want to send credentials via WhatsApp?')) {
                    sendWhatsAppCredentials(createForm);
                }

                setCreateForm({
                    name: '',
                    username: '',
                    password: '',
                    companyEmail: '',
                    company: '',
                    phoneNumber: '',
                    demoTemplate: 'Political Survey'
                });
            }
        } catch (err) {
            alert(err.error?.message || err.message || 'Failed to create user');
        }
    };

    const sendWhatsAppCredentials = (userData) => {
        const loginUrl = window.location.origin + '/login';
        const message = `*Welcome to Bodha Survey!*%0A%0AHello ${userData.name}, your account has been created.%0A%0A*Login Details:*%0AURL: ${loginUrl}%0AUsername: ${userData.username}%0APassword: ${userData.password}%0A%0APlease login and change your password.`;

        // Clean phone number (remove non-digits, add country code if missing)
        let phone = userData.phoneNumber.replace(/\D/g, '');
        if (phone.length === 10) phone = '91' + phone; // Default to India prefix if 10 digits

        const whatsappUrl = `https://wa.me/${phone}?text=${message}`;
        window.open(whatsappUrl, '_blank');
    };

    const handleToggleStatus = async (user) => {
        try {
            const response = await userAPI.updateMSRStatus(user._id, !user.isActive);
            if (response.success) {
                setUsers(users.map(u => u._id === user._id ? { ...u, isActive: !user.isActive } : u));
            }
        } catch (err) {
            alert(err.message || 'Failed to update status');
        }
    };

    const openEditModal = (user) => {
        setSelectedUser(user);
        setEditForm({
            name: user.name,
            companyEmail: user.companyEmail,
            company: user.company,
            phoneNumber: user.phoneNumber,
            demoTemplate: user.demoTemplate
        });
        setShowEditModal(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await userAPI.updateMSRUser(selectedUser._id, editForm);
            if (response.success) {
                setUsers(users.map(u => u._id === selectedUser._id ? { ...u, ...editForm } : u));
                setShowEditModal(false);
            }
        } catch (err) {
            alert(err.message || 'Failed to update user');
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (!newPassword) return;
        try {
            const response = await userAPI.updateMSRPassword(selectedUser._id, newPassword);
            if (response.success) {
                alert('Password updated successfully');
                setShowPasswordModal(false);
                setNewPassword('');
            }
        } catch (err) {
            alert(err.message || 'Failed to update password');
        }
    };

    return (
        <Layout user={currentUser}>
            <div className="users-page-container">
                <div className="users-header">
                    <h1>MSR Registered Users</h1>
                    <div className="header-actions">
                        <button className="btn-create" onClick={() => setShowCreateModal(true)}>+ Create New User</button>
                        <button className="btn-refresh" onClick={fetchUsers}>Refresh List</button>
                    </div>
                </div>

                {error && <div className="error-banner">{error}</div>}

                <div className="users-table-wrapper">
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Company</th>
                                <th>Phone</th>
                                <th>Template</th>
                                <th>Status</th>
                                <th className="center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="center">Loading users...</td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="center">No users found.</td>
                                </tr>
                            ) : (
                                users.map((user, index) => (
                                    <tr key={user._id}>
                                        <td>{index + 1}</td>
                                        <td className="user-name-cell"><strong>{user.name}</strong></td>
                                        <td>{user.companyEmail}</td>
                                        <td>{user.company}</td>
                                        <td>{user.phoneNumber}</td>
                                        <td><span className="template-badge">{user.demoTemplate}</span></td>
                                        <td>
                                            <div className="status-toggle-wrapper">
                                                <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                                                    {user.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                                <label className="switch">
                                                    <input
                                                        type="checkbox"
                                                        checked={user.isActive}
                                                        onChange={() => handleToggleStatus(user)}
                                                    />
                                                    <span className="slider round"></span>
                                                </label>
                                            </div>
                                        </td>
                                        <td className="center actions-cell">
                                            <button className="icon-btn-action edit" title="Edit User" onClick={() => openEditModal(user)}>
                                                ✏️
                                            </button>
                                            <button className="icon-btn-action password" title="Change Password" onClick={() => { setSelectedUser(user); setShowPasswordModal(true); }}>
                                                🔑
                                            </button>
                                            <button className="icon-btn-action whatsapp" title="Send WhatsApp" onClick={() => sendWhatsAppCredentials({
                                                name: user.name,
                                                username: user.username,
                                                password: 'YourPassword', // Password hashing prevents us from showing the real one here
                                                phoneNumber: user.phoneNumber
                                            })}>
                                                💬
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Create Modal */}
                {showCreateModal && (
                    <div className="modal-overlay">
                        <div className="user-modal">
                            <div className="modal-header">
                                <h3>Create New User</h3>
                                <button className="close-btn" onClick={() => setShowCreateModal(false)}>&times;</button>
                            </div>
                            <form onSubmit={handleCreateSubmit}>
                                <div className="modal-body-form scrollable">
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <input type="text" placeholder="e.g. Dwaith Dev" value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Username (Login ID)</label>
                                        <input type="text" placeholder="e.g. dwaith123" value={createForm.username} onChange={e => setCreateForm({ ...createForm, username: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Password</label>
                                        <input type="password" placeholder="Min 6 characters" value={createForm.password} onChange={e => setCreateForm({ ...createForm, password: e.target.value })} required minLength="6" />
                                    </div>
                                    <div className="form-group">
                                        <label>Company Email</label>
                                        <input type="email" placeholder="email@company.com" value={createForm.companyEmail} onChange={e => setCreateForm({ ...createForm, companyEmail: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Company Name</label>
                                        <input type="text" placeholder="e.g. MSR Corp" value={createForm.company} onChange={e => setCreateForm({ ...createForm, company: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Phone Number (for WhatsApp)</label>
                                        <input type="text" placeholder="e.g. 9876543210" value={createForm.phoneNumber} onChange={e => setCreateForm({ ...createForm, phoneNumber: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Assign Template</label>
                                        <select value={createForm.demoTemplate} onChange={e => setCreateForm({ ...createForm, demoTemplate: e.target.value })}>
                                            <option value="Political Survey">Political Survey</option>
                                            <option value="Municipal Survey">Municipal Survey</option>
                                            <option value="General Research">General Research</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-footer-btns">
                                    <button type="submit" className="btn-primary-action">Create and Inform</button>
                                    <button type="button" className="btn-secondary-action" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Modal */}
                {showEditModal && (
                    <div className="modal-overlay">
                        <div className="user-modal">
                            <div className="modal-header">
                                <h3>Edit User: {selectedUser.username}</h3>
                                <button className="close-btn" onClick={() => setShowEditModal(false)}>&times;</button>
                            </div>
                            <form onSubmit={handleEditSubmit}>
                                <div className="modal-body-form">
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Company Email</label>
                                        <input type="email" value={editForm.companyEmail} onChange={e => setEditForm({ ...editForm, companyEmail: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Company</label>
                                        <input type="text" value={editForm.company} onChange={e => setEditForm({ ...editForm, company: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Phone Number</label>
                                        <input type="text" value={editForm.phoneNumber} onChange={e => setEditForm({ ...editForm, phoneNumber: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Demo Template</label>
                                        <select value={editForm.demoTemplate} onChange={e => setEditForm({ ...editForm, demoTemplate: e.target.value })} required>
                                            <option value="Political Survey">Political Survey</option>
                                            <option value="Municipal Survey">Municipal Survey</option>
                                            <option value="Market Research">Market Research</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-footer-btns">
                                    <button type="submit" className="btn-primary-action">Update User</button>
                                    <button type="button" className="btn-secondary-action" onClick={() => setShowEditModal(false)}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Password Modal */}
                {showPasswordModal && (
                    <div className="modal-overlay">
                        <div className="user-modal password-modal">
                            <div className="modal-header">
                                <h3>Change Password: {selectedUser.username}</h3>
                                <button className="close-btn" onClick={() => setShowPasswordModal(false)}>&times;</button>
                            </div>
                            <form onSubmit={handlePasswordSubmit}>
                                <div className="modal-body-form">
                                    <div className="form-group">
                                        <label>New Password</label>
                                        <input
                                            type="password"
                                            placeholder="Enter new password"
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            required
                                            minLength="6"
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer-btns">
                                    <button type="submit" className="btn-primary-action">Reset Password</button>
                                    <button type="button" className="btn-secondary-action" onClick={() => setShowPasswordModal(false)}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default UsersPage;
