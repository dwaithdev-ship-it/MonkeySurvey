import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const districtsData = {
    "Mahabubanagar": [
        "Alampur", "Ieeja", "Gadwal", "Waddepalle", "Bhoothpur", "Devarakadra",
        "Kalwakurthy", "Kollapur", "Nagarkurnool", "Kosgi", "Maddur", "Kodangal",
        "Narayanpet", "Parigi", "Tandur", "Vikarabad", "Amarchinta", "Atmakur",
        "Makthal", "Kothakota", "Pebbair", "Wanaparthy"
    ],
    "Medak": [
        "Medak", "Ramayampet", "Narsapur", "Thoopran", "Gajwel", "Andol-Jogipet",
        "Gaddapotaram", "Gumadidala", "Indresham", "Isnapur", "Jinnaram", "Kohir",
        "Zaheerabad", "Narayankhed", "Sadasivapet", "Sangareddy", "Dubbaka", "Cherial"
    ],
    "Rangareddy": [
        "Amangal", "Aliyabad", "Muduchintalapally", "Yellampet", "Chevella",
        "Moinabad", "Shankarpally", "Ibrahimpatnam", "Shadnagar"
    ]
};

function Register() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        district: '',
        municipality: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            return setError('Passwords do not match');
        }

        setError('');
        setLoading(true);

        try {
            await register({
                email: formData.email,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName,
                district: formData.district,
                municipality: formData.municipality
            });
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Failed to create an account');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ maxWidth: '400px', paddingTop: '60px' }}>
            <div className="card">
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <img src={require('../assets/logo.png')} alt="MonkeySurvey" style={{ maxWidth: '100%', height: 'auto', maxHeight: '100px' }} />
                </div>
                <h3 style={{ marginBottom: '24px', textAlign: 'center', color: '#6b7280' }}>Sign Up</h3>

                {error && <div className="error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">First Name</label>
                        <input
                            type="text"
                            name="firstName"
                            className="form-input"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Last Name</label>
                        <input
                            type="text"
                            name="lastName"
                            className="form-input"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">District</label>
                        <select
                            name="district"
                            className="form-input"
                            value={formData.district}
                            onChange={(e) => {
                                setFormData({
                                    ...formData,
                                    district: e.target.value,
                                    municipality: '' // Reset municipality when district changes
                                });
                            }}
                            required
                        >
                            <option value="">Select District</option>
                            {Object.keys(districtsData).map(dist => (
                                <option key={dist} value={dist}>{dist}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Municipality</label>
                        <select
                            name="municipality"
                            className="form-input"
                            value={formData.municipality}
                            onChange={handleChange}
                            required
                            disabled={!formData.district}
                        >
                            <option value="">Select Municipality</option>
                            {formData.district && districtsData[formData.district].map(mun => (
                                <option key={mun} value={mun}>{mun}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            name="email"
                            className="form-input"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                            Password
                            <span
                                onClick={togglePasswordVisibility}
                                style={{ cursor: 'pointer', fontSize: '12px', color: '#6366f1', userSelect: 'none' }}
                            >
                                {showPassword ? 'Hide' : 'Show'}
                            </span>
                        </label>
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            className="form-input"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Confirm Password</label>
                        <input
                            type={showPassword ? "text" : "password"}
                            name="confirmPassword"
                            className="form-input"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        disabled={loading}
                    >
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                    Already have an account? <Link to="/login">Log In</Link>
                </div>
            </div>
        </div>
    );
}

export default Register;
