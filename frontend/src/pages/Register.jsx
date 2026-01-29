import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { userAPI } from "../services/api";
import "./Register.css";

const demoTemplates = [
  "Airline Service Evaluation",
  "Brand Performance Survey",
  "Clubs and Resorts",
  "Course Evaluation",
  "Customer Satisfaction Survey",
  "Customer Service Feedback Survey",
  "Department Evaluation Survey",
  "Elections and Political Survey",
  "Employee Exit Interview",
  "Employee Job Satisfaction Survey",
  "Employee Self Assessment",
  "Environment",
  "Evaluation of Event Planning Event Satisfaction for Visitors",
  "General",
  "Graduation Exit Survey",
  "Gym Member Feedback Survey",
  "Health Care well-being Survey",
  "Hospital Inspection Survey",
  "Hotel Customer Feedback",
  "Lead Capture",
  "Market Research",
  "Mystery Shopper Survey",
  "Parent Feedback",
  "Patient Satisfaction",
  "Physician Practices Survey",
  "Post Event Survey Evaluation",
  "Product Satisfaction",
  "Quick Lead Contact Information Survey",
  "Real Estate Enquiry",
  "Real Estate Maintenance Survey",
  "Real Estate Property Management",
  "Real Estate Satisfaction",
  "Restaurant Customer Feedback",
  "Retail - Mystery Shoppers Survey",
  "Retail Customer Satisfaction",
  "Retail Store Evaluation",
  "Salon & Spa Customer Feedback Survey",
  "Student Feedback",
  "Teacher Feedback",
  "Tourist Feedback",
  "Trade Show Customer Feedback",
];

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    companyEmail: "",
    company: "",
    phoneNumber: "",
    demoTemplate: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Basic Validation
    if (!formData.username || !formData.password || !formData.companyEmail || !formData.demoTemplate || !formData.phoneNumber) {
      setError("Please fill in all required fields (*)");
      return;
    }

    // Phone number validation
    if (formData.phoneNumber && !/^[0-9]{10}$/.test(formData.phoneNumber)) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    try {
      setLoading(true);
      const response = await userAPI.msrRegister(formData);

      if (response.success) {
        alert("Account created successfully! Please login with your phone number and password.");
        navigate("/login");
      }
    } catch (err) {
      console.error('Registration error:', err);

      // Handle specific errors
      const errorMessage = err.error?.message || err.message || "Registration failed";

      if (errorMessage.includes('duplicate') || errorMessage.includes('already exists')) {
        if (errorMessage.toLowerCase().includes('phone')) {
          setError("This phone number is already registered. Please login or use a different phone number.");
        } else {
          setError("Username or email already exists. Please use different credentials.");
        }
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-wrapper">
      {/* Background Decorations */}
      <div className="bg-dots"></div>
      <div className="bg-circle-outline"></div>
      <div className="bg-circle-left"></div>
      <div className="bg-circle-right"></div>

      {/* HEADER */}
      <h1 className="app-title">Offline Survey App</h1>
      <p className="app-subtitle">
        Conduct surveys without internet connection on mobile devices.
      </p>

      {/* CARD */}
      <form className="register-card" onSubmit={handleSubmit}>
        <h2 className="register-title">Create Your MSRSurvey</h2>

        {error && <div className="error-message" style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

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
          <label>
            Username <span>*</span>
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group password-group">
          <label>
            Password <span>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <span
              className="eye"
              style={{ cursor: 'pointer', position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🔒" : "👁"}
            </span>
          </div>
        </div>

        <div className="form-group">
          <label>
            Company Email <span>*</span>
          </label>
          <input
            type="email"
            name="companyEmail"
            value={formData.companyEmail}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Company</label>
          <input
            type="text"
            name="company"
            value={formData.company}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Phone Number <span>*</span></label>
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            required
            pattern="[0-9]{10}"
            placeholder="10 digit mobile number"
            title="Enter a valid 10-digit phone number"
          />
          <small style={{ fontSize: '12px', color: '#666', marginTop: '4px', display: 'block' }}>
            You will use this number to login to the survey
          </small>
        </div>

        <div className="form-group">
          <label>
            Demo Template <span>*</span>
          </label>
          <select
            name="demoTemplate"
            value={formData.demoTemplate}
            onChange={handleChange}
            required
          >
            <option value="">Select Demo Template</option>
            {demoTemplates.map((item, index) => (
              <option key={index} value={item}>{item}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="create-btn"
          disabled={loading}
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>

        <p className="login-link">
          Already have an account? <span onClick={() => navigate('/login')}>Login</span>
        </p>
      </form>

      {/* BOTTOM SECTION */}
      <div className="store-section">
        <div className="ratings">
          <span>★★★★★ Capterra</span>
          <span>★★★★★ GetApp</span>
          <span>★★★★★ Google Play</span>
          <span>★★★★★ App Store</span>
        </div>

        <div className="store-buttons">
          <button className="store-btn"> App Store</button>
          <button className="store-btn">▶ Google Play</button>
        </div>

        <p className="footer-text">
          © 2026 Techgrains Technologies Pvt. Ltd. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Register;
