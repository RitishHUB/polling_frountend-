import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { LogOut, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [polls, setPolls] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalPolls: 0, totalVotes: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showResultsModal, setShowResultsModal] = useState(false);
  const [pollResults, setPollResults] = useState(null);
  const [resultsLoading, setResultsLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, pollsRes, statsRes] = await Promise.all([
        api.get('/users'),
        api.get('/polls'),
        api.get('/users/admin/stats')
      ]);

      setUsers(usersRes.data);
      setPolls(pollsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      setError("Failed to load admin data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'Admin') {
      navigate("/");
    } else {
      fetchData();
    }
  }, [user, navigate]);

  const handleDeletePoll = async (id) => {
    if (window.confirm("Are you sure you want to permanently delete this poll? All related votes will be lost.")) {
      try {
        await api.delete(`/polls/${id}`);
        fetchData(); // Refresh data
      } catch (err) {
        alert(err.response?.data?.message || "Error deleting poll");
      }
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm("Are you sure you want to permanently delete this user profile?")) {
      try {
        await api.delete(`/users/${id}`);
        fetchData();
      } catch (err) {
        alert(err.response?.data?.message || "Error deleting user");
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const viewResults = async (pollId) => {
    try {
      setShowResultsModal(true);
      setResultsLoading(true);
      setPollResults(null);
      const res = await api.get(`/polls/${pollId}/results`);
      setPollResults(res.data);
    } catch (err) {
      alert("Failed to fetch results. Ensure you are an Admin.");
      setShowResultsModal(false);
    } finally {
      setResultsLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading Admin Control Panel...</div>;

  const activePolls = polls.filter(p => new Date() < new Date(p.endTime));

  return (
    <div className="admin-page">
      <div className="admin-layout">

        {/* ===== Hero Section ===== */}
        <div className="hero-section">
          <div className="hero-content">
            <h1>Admin Control Panel</h1>
            <p>Welcome back, <strong>{user?.name}</strong>! Ensure system integrity, manage active polls, and oversee user access levels comprehensively.</p>
            <button onClick={handleLogout} className="logout-btn">
              <LogOut size={18} /> Logout
            </button>
          </div>
          <div className="hero-image">
            {/* Unique Admin dashboard SVG illustration (Database / Control theme) */}
            <svg width="250" height="200" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="18" rx="2" fill="#eff6ff"></rect>
              <line x1="2" y1="9" x2="22" y2="9" stroke="#93c5fd"></line>
              <line x1="2" y1="15" x2="22" y2="15" stroke="#93c5fd"></line>
              <circle cx="6" cy="6" r="1.5" fill="#3b82f6" stroke="none"></circle>
              <circle cx="6" cy="12" r="1.5" fill="#60a5fa" stroke="none"></circle>
              <circle cx="6" cy="18" r="1.5" fill="#3b82f6" stroke="none"></circle>
              <line x1="10" y1="6" x2="20" y2="6" stroke="#bfdbfe" strokeWidth="2"></line>
              <line x1="10" y1="12" x2="16" y2="12" stroke="#bfdbfe" strokeWidth="2"></line>
              <line x1="10" y1="18" x2="18" y2="18" stroke="#bfdbfe" strokeWidth="2"></line>
            </svg>
          </div>
        </div>

        {error && <div className="error-message" style={{ color: 'red', margin: '15px 0' }}>{error}</div>}

        {/* ===== Stats Cards ===== */}
        <div className="stats-grid">
          <div className="stat-card">
            <span>Total Polls Logged</span>
            <h3>{stats.totalPolls}</h3>
            <div className="stat-icon blue">📄</div>
          </div>

          <div className="stat-card">
            <span>Live Polls Online</span>
            <h3>{activePolls.length}</h3>
            <div className="stat-icon green">📈</div>
          </div>

          <div className="stat-card">
            <span>Registered Users</span>
            <h3>{stats.totalUsers}</h3>
            <div className="stat-icon purple">👥</div>
          </div>

          <div className="stat-card">
            <span>Lifetime Vote Submissions</span>
            <h3>{stats.totalVotes}</h3>
            <div className="stat-icon orange">🗳️</div>
          </div>
        </div>

        {/* ===== Content Section ===== */}
        <div className="content-grid">

          {/* ===== Poll History ===== */}
          <div className="polls-section">
            <h3>Global Poll Registry</h3>

            {polls.length === 0 ? (
              <p className="empty">No polls created exist within the cluster boundary.</p>
            ) : (
              polls.map((poll) => {
                const isActive = new Date() < new Date(poll.endTime);
                return (
                  <div className="poll-card" key={poll._id}>
                    <div>
                      <strong>{poll.title}</strong>
                      <span className={`badge ${isActive ? 'active' : ''}`} style={!isActive ? { background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' } : {}}>
                        {isActive ? '● ACTIVE' : 'CLOSED'}
                      </span>
                      <p className="small">Visibility: <strong>{poll.visibility}</strong> | Creator: {poll.createdBy?.name || 'Unknown'}</p>
                    </div>

                    <div className="actions">
                      <button className="view" onClick={() => viewResults(poll._id)} title="View Detailed Results">👁 View Details</button>
                      <button className="delete" onClick={() => handleDeletePoll(poll._id)} title="Delete Poll"><Trash2 size={18} /></button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* ===== Users History ===== */}
          <div className="users-section">
            <h3>User Directory</h3>

            <table>
              <thead>
                <tr>
                  <th>Identity</th>
                  <th>Role</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div>{u.name}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>{u.email}</div>
                    </td>
                    <td>
                      <span className={`role ${u.role.toLowerCase()}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      {u.role !== 'Admin' && (
                        <button onClick={() => handleDeleteUser(u._id)} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', padding: '6px', display: 'flex' }} title="Delete User">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

        {/* ===== RESULTS MODAL ===== */}
        {showResultsModal && (
          <div className="modal-bg" style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
            <div className="modal-box" style={{ background: '#ffffff', width: '100%', maxWidth: '600px', borderRadius: '24px', padding: '35px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', animation: 'modal-slide-up 0.3s ease-out forwards' }}>
              <div className="modal-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}>
                <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#1e293b' }}>Detailed Poll Analytics</h3>
                <span onClick={() => setShowResultsModal(false)} style={{ fontSize: '20px', color: '#94a3b8', cursor: 'pointer' }}>✕</span>
              </div>

              <div style={{ maxHeight: '65vh', overflowY: 'auto', paddingRight: '10px' }}>
                {resultsLoading ? (
                  <p style={{ textAlign: 'center', color: '#64748b' }}>Querying identity matrices...</p>
                ) : pollResults ? (
                  <div>
                    <h4 style={{ marginBottom: '5px', fontSize: '20px', color: '#0f172a' }}>{pollResults.pollTitle}</h4>
                    <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
                      Total Votes Cast: <strong style={{ color: '#1e293b' }}>{pollResults.totalVotes}</strong>
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      {pollResults.results.map((opt, i) => (
                        <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
                            <strong style={{ fontSize: '16px', color: '#1e293b' }}>{opt.optionText}</strong>
                            <span className="badge" style={{ background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', fontSize: '14px', padding: '4px 12px', borderRadius: '20px' }}>
                              {opt.voteCount} votes
                            </span>
                          </div>

                          {/* Voter Display for Admins */}
                          {opt.voters && opt.voters.length > 0 ? (
                            <div>
                              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Voter Identities:</p>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {opt.voters.map((voter, idx) => (
                                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px' }}>
                                    <span style={{ color: '#334155', fontWeight: '500' }}>{voter.name}</span>
                                    <span style={{ color: '#94a3b8' }}>{voter.email} • {voter.role}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>No votes logged for this option yet.</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p style={{ color: '#ef4444' }}>No data object returned from server.</p>
                )}
              </div>

              <div className="modal-actions" style={{ marginTop: '30px', paddingTop: '25px', borderTop: '2px solid #f1f5f9' }}>
                <button
                  onClick={() => setShowResultsModal(false)}
                  style={{ width: '100%', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Close Analytics
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="admin-footer">
          Campus Poll Hub – Secure Digital Layer Control © {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
