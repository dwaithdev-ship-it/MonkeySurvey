import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { userAPI } from "../services/api";
import "./Login.css";
import logo from "../assets/logo.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await userAPI.login({ email, password });

      if (response.success) {
        localStorage.setItem("token", response.data.token);
        if (response.data.user) {
          localStorage.setItem("user", JSON.stringify(response.data.user));
          // Direct survey access for all except admin
          if (response.data.user.role === 'admin') {
            navigate("/dashboard");
          } else {
            navigate("/survey/1");
          }
        } else {
          navigate("/dashboard");
        }
      } else {
        setError(response.error?.message || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.error?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* LEFT SIDE */}
      <div className="login-left">
        <h4 className="welcome-small">Nice to see you again</h4>
        <h1 className="welcome-title">WELCOME</h1>
        <p className="welcome-desc">
          Login to manage your surveys, view responses, and analyze reports
          easily with Bodha Survey.
        </p>
      </div>

      {/* RIGHT SIDE */}
      <div className="login-right">
        <img src={logo} alt="Bodha Survey" className="login-logo" />
        <h2 className="login-title">Login Account</h2>

        <div className="login-card">
          {error && <div style={{ color: "red", marginBottom: "15px", fontSize: "14px", textAlign: "left" }}>{error}</div>}

          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email ID"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="login-options">
              <label>
                <input type="checkbox" /> Keep me signed in
              </label>
              <span className="link">Already a member?</span>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "LOGGING IN..." : "Login"}
            </button>
          </form>

          <p className="signup-text">
            Don’t have an account? <span className="link" onClick={() => navigate('/register')}>Sign Up</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
