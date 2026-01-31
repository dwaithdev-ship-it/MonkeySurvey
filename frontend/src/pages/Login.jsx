import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { userAPI } from "../services/api";
import "./Login.css";
import logo from "../assets/logo.png";

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Generate or retrieve device ID
  const getDeviceId = () => {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      // Generate a unique device ID based on browser fingerprint
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Determine if identifier is email or phone number
      const cleanIdentifier = identifier.trim();
      const isEmail = cleanIdentifier.includes('@');
      const deviceId = getDeviceId();

      const loginData = isEmail
        ? { email: cleanIdentifier, password, deviceId }
        : { phoneNumber: cleanIdentifier, password, deviceId };

      const response = await userAPI.login(loginData);

      if (response.success) {
        const authData = {
          token: response.data.token,
          user: response.data.user
        };

        localStorage.setItem("token", authData.token);
        if (authData.user) {
          localStorage.setItem("user", JSON.stringify(authData.user));
        }

        // Notify Mobile App if running in WebView
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'AUTH_SUCCESS',
            payload: authData
          }));
        }

        if (response.data.user?.role === 'admin') {
          navigate("/dashboard");
        } else {
          navigate("/take-survey/1");
        }
      } else {
        setError(response.error?.message || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);

      // Handle specific error codes
      const errorData = err.error || err;
      const errorCode = errorData.code;
      const errorMessage = errorData.message;

      if (errorCode === 'ALREADY_LOGGED_IN') {
        setError('You are already logged in on another device. Please logout from that device first or contact admin.');
      } else if (errorCode === 'DEVICE_MISMATCH') {
        setError('Your account is locked to a different device. Please use the phone you registered with.');
      } else if (errorCode === 'DEVICE_OWNED') {
        setError('This device is already registered to another user. You cannot use this device with this account.');
      } else if (errorCode === 'ACCOUNT_DISABLED') {
        setError('Your account has been disabled. Please contact admin.');
      } else if (errorCode === 'INVALID_CREDENTIALS') {
        setError('Invalid phone number or password. Please try again.');
      } else {
        setError(errorMessage || "Invalid credentials. Please try again.");
      }
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
              type="text"
              placeholder="Email or Phone Number"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
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
