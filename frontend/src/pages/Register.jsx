import React from "react";
import { useNavigate } from "react-router-dom";
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
      <div className="register-card">
        <h2 className="register-title">Create Your GoSurvey Account</h2>

        <div className="form-group">
          <label>Name</label>
          <input type="text" />
        </div>

        <div className="form-group">
          <label>
            Username <span>*</span>
          </label>
          <input type="text" />
        </div>

        <div className="form-group password-group">
          <label>
            Password <span>*</span>
          </label>
          <input type="password" />
          <span className="eye">👁</span>
        </div>

        <div className="form-group">
          <label>
            Company Email <span>*</span>
          </label>
          <input type="email" />
        </div>

        <div className="form-group">
          <label>Company</label>
          <input type="text" />
        </div>

        <div className="form-group">
          <label>Phone Number</label>
          <input type="text" />
        </div>

        <div className="form-group">
          <label>
            Demo Template <span>*</span>
          </label>
          <select>
            <option value="">Select Demo Template</option>
            {demoTemplates.map((item, index) => (
              <option key={index}>{item}</option>
            ))}
          </select>
        </div>

        <button className="create-btn">Create Account</button>

        <p className="login-link">
          Already have an account? <span onClick={() => navigate('/login')}>Login</span>
        </p>
      </div>

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
