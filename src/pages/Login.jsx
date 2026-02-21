import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    const email = form.email.trim().toLowerCase();
    const password = form.password.trim();

    try {
      const user = await login(email, password);

      if (user.role === "Admin") {
        navigate("/admin");
      } else if (user.role === "Student") {
        navigate("/student");
      } else if (user.role === "Staff") {
        navigate("/staff");
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Invalid email or password');
    }
  };

  return (
    <div className="login-page">
      <div className="login-layout">
        <div className="login-hero-section">
          <div className="hero-content">
            <div className="logo-container">
              <span className="logo-icon">📊</span>
              <h2>Campus Poll Hub</h2>
            </div>

            <p className="subtitle">Welcome back! Sign in to access your dashboard and participate in campus activities.</p>

            {error && <div className="error-message" style={{ color: '#ef4444', padding: '10px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca', marginBottom: '20px', fontSize: '14px' }}>{error}</div>}

            <form onSubmit={handleLogin} className="login-form">
              <div className="input-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="name@campus.edu"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <button type="submit" className="login-btn">Secure Sign In</button>
            </form>
          </div>

          <div className="hero-image">
            <svg width="300" height="250" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" fill="#eff6ff"></rect>
              <circle cx="8.5" cy="8.5" r="1.5" fill="#3b82f6" stroke="none"></circle>
              <line x1="12" y1="8.5" x2="17" y2="8.5" stroke="#93c5fd" strokeWidth="2"></line>
              <circle cx="8.5" cy="15.5" r="1.5" fill="#3b82f6" stroke="none"></circle>
              <line x1="12" y1="15.5" x2="15" y2="15.5" stroke="#93c5fd" strokeWidth="2"></line>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
