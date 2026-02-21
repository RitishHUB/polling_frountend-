import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "./Staff.css";

const Staff = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showResultsModal, setShowResultsModal] = useState(false);
  const [pollResults, setPollResults] = useState(null);
  const [resultsLoading, setResultsLoading] = useState(false);

  const [newPoll, setNewPoll] = useState({
    title: "",
    description: "",
    visibility: "Both",
    startTime: "",
    endTime: "",
    anonymous: false,
    allowLiveResults: true,
    options: ["", ""],
  });

  const fetchPolls = async () => {
    try {
      setLoading(true);
      const res = await api.get('/polls');
      setPolls(res.data);
    } catch (err) {
      setError("Failed to fetch polls");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || (user.role !== 'Staff' && user.role !== 'Admin')) {
      navigate("/");
    } else {
      fetchPolls();
    }
  }, [user, navigate]);

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
      alert("Failed to fetch results. Ensure you are an Admin or Staff.");
      setShowResultsModal(false);
    } finally {
      setResultsLoading(false);
    }
  };

  const createPoll = async () => {
    if (!newPoll.title || newPoll.options.some(o => !o.trim()) || !newPoll.startTime || !newPoll.endTime) {
      alert("Please fill all required fields and ensure no empty options");
      return;
    }

    try {
      await api.post('/polls', newPoll);
      setShowModal(false);
      resetForm();
      fetchPolls();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create poll");
    }
  };

  const resetForm = () => {
    setNewPoll({
      title: "",
      description: "",
      visibility: "Both",
      startTime: "",
      endTime: "",
      anonymous: false,
      allowLiveResults: true,
      options: ["", ""],
    });
  };

  const updateOption = (i, val) => {
    const updated = [...newPoll.options];
    updated[i] = val;
    setNewPoll({ ...newPoll, options: updated });
  };

  const deleteOption = index => {
    if (newPoll.options.length <= 2) {
      alert("A poll must have at least 2 options");
      return;
    }
    const updated = newPoll.options.filter((_, i) => i !== index);
    setNewPoll({ ...newPoll, options: updated });
  };

  const activePollsCount = polls.filter(p => new Date() < new Date(p.endTime)).length;
  const closedPollsCount = polls.filter(p => new Date() >= new Date(p.endTime)).length;

  if (loading) return <div className="loading">Loading Staff Dashboard...</div>;

  return (
    <div className="staff-page">
      <div className="staff-layout">

        {/* Hero Section with Illustration matching Student Page */}
        <div className="hero-section">
          <div className="hero-content">
            <h1>Staff Dashboard</h1>
            <p>Welcome back, <strong>{user?.name}</strong>! Manage campus polling events and analyze voting data instantly.</p>
            <div className="header-actions">
              <button className="btn-primary" onClick={() => setShowModal(true)}>
                + Create New Poll
              </button>
              <button onClick={handleLogout} className="logout-btn">
                <LogOut size={18} /> Logout
              </button>
            </div>
          </div>
          <div className="hero-image">
            {/* Unique Staff dashboard SVG illustration */}
            <svg width="250" height="200" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" fill="#eff6ff"></rect>
              <path d="M3 9h18" stroke="#3b82f6"></path>
              <circle cx="8" cy="15" r="2" fill="#60a5fa" stroke="none"></circle>
              <path d="M12 15h5" stroke="#60a5fa" strokeWidth="2"></path>
              <circle cx="8" cy="19" r="2" fill="#dbeafe" stroke="none"></circle>
              <path d="M12 19h3" stroke="#93c5fd" strokeWidth="2"></path>
            </svg>
          </div>
        </div>

        {error && <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>}

        {/* STATS */}
        <div className="stats">
          <div className="stat-card">
            <p>Total Polls Managed</p>
            <h3>{polls.length}</h3>
          </div>
          <div className="stat-card">
            <p>Active Live Polls</p>
            <h3>{activePollsCount}</h3>
          </div>
          <div className="stat-card">
            <p>Closed Archive</p>
            <h3>{closedPollsCount}</h3>
          </div>
        </div>

        {/* POLLS */}
        <div className="poll-list">
          {polls.length === 0 ? <p style={{ color: '#64748b' }}>No polls created yet. Click above to start!</p> : polls.map(p => {
            const isActive = new Date() < new Date(p.endTime);
            const totalVotes = p.options.reduce((sum, opt) => sum + opt.voteCount, 0);

            return (
              <div className="poll-card" key={p._id}>
                <div className="poll-info">
                  <h4>{p.title}</h4>
                  <p>{p.description}</p>
                  <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                    <span className="badge" style={{ background: isActive ? '#ecfdf5' : '#f1f5f9', color: isActive ? '#10b981' : '#64748b', border: `1px solid ${isActive ? '#a7f3d0' : '#e2e8f0'}` }}>
                      {isActive ? '● ACTIVE' : 'CLOSED'}
                    </span>
                    <span className="badge" style={{ background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe' }}>
                      👁 {p.visibility}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '15px', color: '#475569', marginBottom: '10px' }}>Total Votes: <strong style={{ color: '#1e293b', fontSize: '18px' }}>{totalVotes}</strong></p>
                  <button className="btn-secondary" onClick={() => viewResults(p._id)}>View Results Details</button>
                </div>
              </div>
            )
          })}
        </div>

        {/* MODAL */}
        {showModal && (
          <div className="modal-bg">
            <div className="modal-box">
              <div className="modal-head">
                <h3>Create New Poll</h3>
                <span onClick={() => setShowModal(false)}>✕</span>
              </div>

              <div style={{ maxHeight: '65vh', overflowY: 'auto', paddingRight: '10px' }}>
                <label>Poll Title</label>
                <input
                  type="text"
                  value={newPoll.title}
                  onChange={e => setNewPoll({ ...newPoll, title: e.target.value })}
                  placeholder="e.g. Next Semester Electives"
                />

                <label>Description</label>
                <textarea
                  value={newPoll.description}
                  onChange={e =>
                    setNewPoll({ ...newPoll, description: e.target.value })
                  }
                  placeholder="Briefly describe what this poll is about..."
                />

                <label>Visibility Targeting</label>
                <select
                  value={newPoll.visibility}
                  onChange={e =>
                    setNewPoll({ ...newPoll, visibility: e.target.value })
                  }
                >
                  <option value="Student">Students Only</option>
                  <option value="Staff">Staff Only</option>
                  <option value="Both">Everyone (Students & Staff)</option>
                </select>

                <div className="time-grid">
                  <div>
                    <label>Start Voting Time</label>
                    <input
                      type="datetime-local"
                      value={newPoll.startTime}
                      onChange={e =>
                        setNewPoll({ ...newPoll, startTime: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label>End Voting Time</label>
                    <input
                      type="datetime-local"
                      value={newPoll.endTime}
                      onChange={e =>
                        setNewPoll({ ...newPoll, endTime: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="checks">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <input
                      type="checkbox"
                      checked={newPoll.anonymous}
                      onChange={e =>
                        setNewPoll({ ...newPoll, anonymous: e.target.checked })
                      }
                    />
                    Hide Voter Identities (Anonymous)
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={newPoll.allowLiveResults}
                      onChange={e =>
                        setNewPoll({ ...newPoll, allowLiveResults: e.target.checked })
                      }
                    />
                    Display Live Results to Voters
                  </label>
                </div>

                <label>Poll Options</label>

                <div className="options-list">
                  {newPoll.options.map((o, i) => (
                    <div className="option-row" key={i}>
                      <button
                        className="delete-option"
                        onClick={() => deleteOption(i)}
                      >
                        ✕
                      </button>
                      <input
                        type="text"
                        placeholder={`Option ${i + 1}`}
                        value={o}
                        onChange={e => updateOption(i, e.target.value)}
                        style={{ margin: 0 }}
                      />
                    </div>
                  ))}
                </div>

                <button
                  className="btn-outline"
                  onClick={() =>
                    setNewPoll({ ...newPoll, options: [...newPoll.options, ""] })
                  }
                >
                  + Add Another Option
                </button>
              </div>

              <div className="modal-actions">
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button className="btn-primary" style={{ flex: 1 }} onClick={createPoll}>
                  Launch Poll
                </button>
              </div>
            </div>
          </div>
        )}

        {/* RESULTS MODAL */}
        {showResultsModal && (
          <div className="modal-bg">
            <div className="modal-box">
              <div className="modal-head">
                <h3>Poll Results Breakdown</h3>
                <span onClick={() => setShowResultsModal(false)}>✕</span>
              </div>

              <div style={{ maxHeight: '65vh', overflowY: 'auto', paddingRight: '10px' }}>
                {resultsLoading ? (
                  <p style={{ textAlign: 'center', color: '#64748b' }}>Loading results...</p>
                ) : pollResults ? (
                  <div>
                    <h4 style={{ marginBottom: '5px', fontSize: '20px', color: '#0f172a' }}>{pollResults.pollTitle}</h4>
                    <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
                      Total Votes Cast: <strong>{pollResults.totalVotes}</strong>
                      {pollResults.anonymous && <span style={{ marginLeft: '10px', color: '#ef4444', background: '#fef2f2', padding: '4px 8px', borderRadius: '6px' }}>Anonymous Poll (Identities Hidden)</span>}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      {pollResults.results.map((opt, i) => (
                        <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
                            <strong style={{ fontSize: '16px', color: '#1e293b' }}>{opt.optionText}</strong>
                            <span className="badge" style={{ background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', fontSize: '14px' }}>
                              {opt.voteCount} votes
                            </span>
                          </div>

                          {/* Purely statistical representation with identities purged */}
                          <div style={{ marginTop: '5px' }}>
                            <p style={{ fontSize: '13px', color: '#64748b', fontStyle: 'italic', margin: 0 }}>
                              {opt.voteCount === 0 ? "No votes cast yet for this option." : "Voter identities strictly hidden by administrative privacy protocol."}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p style={{ color: '#ef4444' }}>No data found.</p>
                )}
              </div>

              <div className="modal-actions">
                <button className="btn-secondary" style={{ width: '100%' }} onClick={() => setShowResultsModal(false)}>
                  Close Results
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="staff-footer">
          Campus Poll Hub – Secure Digital Polling System © {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
};

export default Staff;
