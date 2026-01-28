import React from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./layout";
import "./Dashboard.css";

const Dashboard = () => {
  const [user, setUser] = React.useState({
    firstName: "Guest",
    package: "Free",
    totalDevices: 1,
    activeDevices: 0,
    expiresOn: "Never"
  });

  const navigate = useNavigate();

  React.useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);

        // Redirect non-admins away from dashboard
        if (parsedUser.role !== 'admin') {
          navigate("/take-survey/1");
          return;
        }

        // Ensure we preserve defaults if keys are missing in localStorage
        setUser(prev => ({ ...prev, ...parsedUser }));
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    } else {
      // If no user is logged in, redirect to login
      navigate("/login");
    }
  }, [navigate]);

  return (
    <Layout user={user}>
      <h1 className="page-title">Dashboard</h1>

      <div className="empty-dashboard">
        <p>
          No reports have been configured.
          Go to <strong>Analytics</strong> and click
          <strong> “Pin to Dashboard”</strong>.
        </p>
      </div>
    </Layout>
  );
};

export default Dashboard;
