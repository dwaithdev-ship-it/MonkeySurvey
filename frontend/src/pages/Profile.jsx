import React, { useState, useEffect } from "react";
import Layout from "./layout";
import "./Profile.css";

const Profile = () => {
    const [user, setUser] = useState({});
    const [formData, setFormData] = useState({
        accountCode: "167089",
        username: "",
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        timezone: "(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi",
        billingName: "",
        billingAddress: "",
        gstin: "",
        location: "Fetching location..."
    });

    const [selectedLanguages, setSelectedLanguages] = useState(["French"]);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                setFormData(prev => ({
                    ...prev,
                    username: parsedUser.username || parsedUser.email?.split('@')[0] || "akshitha@17",
                    name: parsedUser.firstName + (parsedUser.lastName ? " " + parsedUser.lastName : "") || "TATHA AKSHITHA",
                    email: parsedUser.email || "dwaith.devakshitha@gmail.com",
                    billingName: parsedUser.company || "dwaith infotech"
                }));
            } catch (e) {
                console.error("Failed to parse user data", e);
            }
        }

        // Fetch location automatically
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                        const data = await response.json();
                        setFormData(prev => ({ ...prev, location: data.display_name || `${latitude}, ${longitude}` }));
                    } catch (error) {
                        setFormData(prev => ({ ...prev, location: `${latitude}, ${longitude}` }));
                    }
                },
                (error) => {
                    setFormData(prev => ({ ...prev, location: "Permission denied or unavailable" }));
                }
            );
        } else {
            setFormData(prev => ({ ...prev, location: "Geolocation not supported" }));
        }
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLanguageToggle = (lang) => {
        setSelectedLanguages(prev =>
            prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
        );
    };

    const languages = [
        "French", "Portuguese", "Español", "Arabic", "Swedish",
        "Danish", "Persian", "Gujarati", "German", "Türkçe"
    ];

    return (
        <Layout user={user}>
            <div className="profile-container">
                <div className="profile-header">
                    <h1>My Profile</h1>
                    <button className="delete-btn">Delete Account</button>
                </div>

                <div className="profile-content">
                    <div className="profile-form-section">
                        <div className="form-row-static">
                            <label>Account Code</label>
                            <span>{formData.accountCode}</span>
                        </div>
                        <div className="form-row-static">
                            <label>Username</label>
                            <span>{formData.username}</span>
                        </div>

                        <div className="form-group">
                            <label>Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                readOnly
                                className="readonly-input"
                            />
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Re-enter Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Timezone</label>
                            <select name="timezone" value={formData.timezone} onChange={handleChange}>
                                <option>(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi</option>
                                <option>(UTC+00:00) UTC</option>
                                <option>(UTC-05:00) Eastern Time</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Location (Auto)</label>
                            <textarea
                                name="location"
                                value={formData.location}
                                readOnly
                                className="location-textarea"
                            />
                        </div>

                        <div className="form-group">
                            <label>Billing Name</label>
                            <input
                                type="text"
                                name="billingName"
                                value={formData.billingName}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Billing Address</label>
                            <textarea
                                name="billingAddress"
                                value={formData.billingAddress}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>GSTIN</label>
                            <input
                                type="text"
                                name="gstin"
                                value={formData.gstin}
                                onChange={handleChange}
                            />
                            <p className="help-text">If you are unregistered, enter "UNREGISTERED" above</p>
                        </div>

                        <button className="save-btn">Save</button>
                    </div>

                    <div className="profile-sidebar-section">
                        <div className="language-selector">
                            <h3>Choose Language</h3>
                            <div className="language-list">
                                {languages.map(lang => (
                                    <div key={lang} className="language-item" onClick={() => handleLanguageToggle(lang)}>
                                        <input
                                            type="checkbox"
                                            checked={selectedLanguages.includes(lang)}
                                            readOnly
                                        />
                                        <span>{lang}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Profile;
