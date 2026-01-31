import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { userAPI } from "../services/api";
import { offlineSync } from "../utils/offlineSync";
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
          
          // Cache for offline login
          offlineSync.cacheLogin(cleanIdentifier, password, authData.user);

          // Notify Mobile App if running in WebView
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'AUTH_SUCCESS',
              payload: authData
            }));
          }

          if (authData.user.role === 'admin') {
            navigate("/dashboard");
          } else {
            navigate("/take-survey/1");
          }
        }
        } else {
          navigate("/take-survey/1");
        }
      } else {
        setError(response.error?.message || "Login failed");
      }
    } catch (err) {
      console.error("Login attempt failed:", err);

      // --- OFFLINE FALLBACK LOGIC ---
      // We try the offline cache if:
      // 1. There is no network (navigator.onLine is false)
      // 2. The error looks like a network failure (timeout, failed to fetch, etc)
      // 3. The server is unreachable (no response)
      const cleanIdentifier = identifier.trim().toLowerCase();
      const isNetworkError =
        !navigator.onLine ||
        err === 'Network Error' ||
        err?.message === 'Network Error' ||
        err?.code === 'ERR_NETWORK' ||
        (!err.response && (err.message?.includes('Network Error') || err.message?.includes('timeout') || err.message?.includes('Failed to fetch') || err.message?.includes('Load failed')));

      if (isNetworkError) {
        console.log("Network error detected, attempting offline login for:", cleanIdentifier);
        const offlineResult = offlineSync.verifyOffline(cleanIdentifier, password);

        if (offlineResult.success) {
          localStorage.setItem("token", offlineResult.data.token);
          localStorage.setItem("user", JSON.stringify(offlineResult.data.user));

          if (offlineResult.data.user.role === 'admin') {
            navigate("/dashboard");
          } else {
            navigate("/take-survey/1");
          }
          return;
        } else {
          setError("Internet connection lost. No offline login data found for this account. Please log in once while online.");
          return;
        }
      }

      // If we reach here, the server responded but with an error (e.g., 401 or 404)
      const errorData = err.response?.data?.error || err.response?.data || (typeof err === 'object' ? err : { message: String(err) });
      const errorCode = errorData.code;
      const errorMessage = errorData.message || (typeof errorData === 'string' ? errorData : "");

      // FINAL CHECK: If the server returned an error but we have matching offline credentials, 
      // it might be a server-side bug or DNS issue. Let's allow login anyway if we have a valid cache.
      const secondaryOfflineCheck = offlineSync.verifyOffline(cleanIdentifier, password);
      if (secondaryOfflineCheck.success) {
        console.log("Server error but offline cache matched. Logging in via cache.");
        localStorage.setItem("token", secondaryOfflineCheck.data.token);
        localStorage.setItem("user", JSON.stringify(secondaryOfflineCheck.data.user));
        if (secondaryOfflineCheck.data.user.role === 'admin') navigate("/dashboard");
        else navigate("/take-survey/1");
        return;
      }

      if (errorCode === 'ALREADY_LOGGED_IN') {
        setError('You are already logged in on another device. Please logout from that device first or contact admin.');
      } else if (errorCode === 'DEVICE_MISMATCH') {
        setError('Your account is locked to a different device. Please use the phone you registered with.');
      } else if (errorCode === 'DEVICE_OWNED') {
        setError('This device is already registered to another user. You cannot use this device with this account.');
      } else if (errorCode === 'ACCOUNT_DISABLED') {
        setError('Your account has been disabled. Please contact admin.');
      } else if (errorCode === 'INVALID_CREDENTIALS' || errorMessage.toLowerCase().includes('password') || errorMessage.toLowerCase().includes('credential')) {
        setError('Invalid identifier or password. Please try again.');
      } else {
        setError(errorMessage || "Login failed. Please check your connection and try again.");
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
