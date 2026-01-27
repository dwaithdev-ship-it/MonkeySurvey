import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import "./Dashboard.css";

const Layout = ({ user = {}, children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [showDownloads, setShowDownloads] = useState(false);

    // Default values if user object is incomplete
    const userName = user.firstName || user.name || "User";
    const plan = user.package || "Free";
    const totalDevices = user.totalDevices ?? 1;
    const activeDevices = user.activeDevices ?? 0;
    const expiresOn = user.expiresOn || "N/A";

    return (
        <div className="app-layout">
            {/* TOP NAVBAR */}
            <header className="topbar">
                <div className="logo">Bodha Survey</div>

                <div className="topbar-right">
                    <span className="welcome-text">
                        Welcome, <strong>{userName}</strong>
                    </span>
                    {/* ... buttons ... */}
                    <button className="icon-btn" title="Downloads" onClick={() => setShowDownloads(true)}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                    </button>
                    <button className="icon-btn" title="Profile" onClick={() => navigate('/profile')}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    </button>
                    <button className="icon-btn" title="Logout" onClick={() => navigate('/login')}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                    </button>
                </div>
            </header>

            {/* BODY */}
            <div className="body-area">
                {/* SIDEBAR */}
                <aside className="sidebar">
                    <ul className="nav-list">
                        <li
                            className={location.pathname === '/dashboard' ? 'active' : ''}
                            onClick={() => navigate('/dashboard')}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                            <span>Dashboard</span>
                        </li>
                        <li
                            className={location.pathname === '/surveys' ? 'active' : ''}
                            onClick={() => navigate('/surveys')}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                            <span>Surveys</span>
                        </li>
                        <li>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                            <span>Data</span>
                        </li>
                        <li>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                            <span>Users</span>
                        </li>
                        <li>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                            <span>Themes</span>
                        </li>
                        <li>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                            <span>Devices</span>
                        </li>
                        <li>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                            <span>Purchase History</span>
                        </li>
                        <li>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                            <span>Support</span>
                        </li>
                        <li>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                            <span>Help Guide</span>
                        </li>
                    </ul>

                    <div className="account-box">
                        <div className="account-header">Account Detail</div>
                        <div className="account-info">
                            <div className="info-row">
                                <span className="label">Package</span>
                                <span className="value">{plan}</span>
                            </div>
                            <div className="info-row">
                                <span className="label">Device(s)</span>
                                <span className="value">{totalDevices}</span>
                            </div>
                            <div className="info-row">
                                <span className="label">Active Device(s)</span>
                                <span className="value">{activeDevices}</span>
                            </div>
                            <div className="info-row">
                                <span className="label">Expires On</span>
                                <span className="value">{expiresOn}</span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* MAIN CONTENT */}
                <main className="content">{children}</main>
            </div>

            {/* DOWNLOADS MODAL */}
            {showDownloads && (
                <div className="modal-overlay">
                    <div className="download-modal">
                        <div className="modal-header">
                            <h3>Download File</h3>
                            <button className="close-btn" onClick={() => setShowDownloads(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <p>No Data Available.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Layout;
