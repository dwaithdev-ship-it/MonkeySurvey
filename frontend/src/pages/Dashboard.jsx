import React from "react";
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

  React.useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Ensure we preserve defaults if keys are missing in localStorage
        setUser(prev => ({ ...prev, ...parsedUser }));
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }
  }, []);

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
