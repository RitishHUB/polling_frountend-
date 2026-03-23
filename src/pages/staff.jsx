import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { LogOut, Download, Sparkles, MonitorPlay, Brain, TrendingUp, ShieldCheck, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { QRCodeCanvas } from 'qrcode.react';
import api from "../api";
import "./staff.css";

const CATEGORY_COLORS = {
  Academics: { bg: '#e0e7ff', text: '#4338ca', border: '#c7d2fe' },
  Events: { bg: '#fef3c7', text: '#b45309', border: '#fde68a' },
  General: { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  Urgent: { bg: '#fee2e2', text: '#b91c1c', border: '#fecaca' },
  Facilities: { bg: '#fae8ff', text: '#86198f', border: '#f0abfc' },
};

const CHART_COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

const SENTIMENT_COLORS = {
  'Very Positive': { bg: '#dcfce7', text: '#15803d', bar: '#22c55e' },
  'Positive': { bg: '#ecfdf5', text: '#059669', bar: '#34d399' },
  'Neutral': { bg: '#f8fafc', text: '#64748b', bar: '#94a3b8' },
  'Negative': { bg: '#fef2f2', text: '#dc2626', bar: '#f87171' },
  'Very Negative': { bg: '#fee2e2', text: '#b91c1c', bar: '#ef4444' },
};

const RISK_COLORS = {
  Low: { bg: '#dcfce7', text: '#15803d', glow: '#22c55e' },
  Moderate: { bg: '#fef3c7', text: '#b45309', glow: '#f59e0b' },
  High: { bg: '#fee2e2', text: '#dc2626', glow: '#ef4444' },
  Critical: { bg: '#fce7f3', text: '#be185d', glow: '#ec4899' },
};

const MOMENTUM_ICONS = {
  Accelerating: '🚀',
  Increasing: '📈',
  Stable: '➡️',
  Slowing: '📉',
  Declining: '⬇️'
};

// Helper: format date for datetime-local input
const toLocalDatetime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
};

// Helper: get current datetime string for default
const getNowDatetime = () => toLocalDatetime(new Date().toISOString());

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

  const [showPresentationModal, setShowPresentationModal] = useState(false);
  const [activePresentationPoll, setActivePresentationPoll] = useState(null);

  // Edit Poll
  const [showEditModal, setShowEditModal] = useState(false);
  const [editPollData, setEditPollData] = useState(null);

  // AI States
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  const [forecastData, setForecastData] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [activeAiTab, setActiveAiTab] = useState('sentiment');

  const [newPoll, setNewPoll] = useState({
    title: "",
    description: "",
    category: "General",
    visibility: "Both",
    startTime: getNowDatetime(),
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
      setAiAnalysis(null);
      setForecastData(null);
      setActiveAiTab('sentiment');

      const res = await api.get(`/polls/${pollId}/results`);
      setPollResults(res.data);

      setAiAnalysisLoading(true);
      setForecastLoading(true);

      Promise.all([
        api.get(`/polls/${pollId}/ai-analysis`).catch(() => null),
        api.get(`/polls/${pollId}/forecast`).catch(() => null),
      ]).then(([aiRes, forecastRes]) => {
        if (aiRes) setAiAnalysis(aiRes.data);
        if (forecastRes) setForecastData(forecastRes.data);
        setAiAnalysisLoading(false);
        setForecastLoading(false);
      });
    } catch (err) {
      alert("Failed to fetch results.");
      setShowResultsModal(false);
    } finally {
      setResultsLoading(false);
    }
  };

  const createPoll = async () => {
    if (!newPoll.title || newPoll.options.some(o => !o.trim()) || !newPoll.endTime) {
      alert("Please fill all required fields and ensure no empty options");
      return;
    }

    try {
      // Default startTime to NOW if empty
      const pollData = {
        ...newPoll,
        startTime: newPoll.startTime || new Date().toISOString(),
      };
      await api.post('/polls', pollData);
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
      category: "General",
      visibility: "Both",
      startTime: getNowDatetime(),
      endTime: "",
      anonymous: false,
      allowLiveResults: true,
      options: ["", ""],
    });
  };

  // Edit Poll
  const openEditModal = (poll) => {
    setEditPollData({
      _id: poll._id,
      title: poll.title,
      description: poll.description || '',
      category: poll.category || 'General',
      visibility: poll.visibility || 'Both',
      startTime: toLocalDatetime(poll.startTime),
      endTime: toLocalDatetime(poll.endTime),
      anonymous: poll.anonymous || false,
      allowLiveResults: poll.allowLiveResults !== false,
      options: poll.options.map(o => o.optionText),
    });
    setShowEditModal(true);
  };

  const saveEditPoll = async () => {
    if (!editPollData) return;
    try {
      await api.put(`/polls/${editPollData._id}`, {
        title: editPollData.title,
        description: editPollData.description,
        category: editPollData.category,
        visibility: editPollData.visibility,
        startTime: editPollData.startTime,
        endTime: editPollData.endTime,
        anonymous: editPollData.anonymous,
        allowLiveResults: editPollData.allowLiveResults,
        options: editPollData.options,
      });
      setShowEditModal(false);
      setEditPollData(null);
      fetchPolls();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update poll");
    }
  };

  const exportCSV = () => {
    if (!pollResults) return;
    const headers = ["Option", "Votes"];
    const rows = pollResults.results.map(r => [r.optionText, r.voteCount]);
    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${pollResults.pollTitle.replace(/\s+/g, '_')}_results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateAIInsight = () => {
    if (!pollResults || pollResults.totalVotes === 0) return "No votes cast yet to generate insights.";
    const sorted = [...pollResults.results].sort((a, b) => b.voteCount - a.voteCount);
    const winner = sorted[0];
    const second = sorted.length > 1 ? sorted[1] : null;

    if (winner.voteCount === pollResults.totalVotes) {
      return `Unanimous agreement! 100% of the ${pollResults.totalVotes} voters chose "${winner.optionText}".`;
    }

    const margin = second ? winner.voteCount - second.voteCount : winner.voteCount;
    if (margin > (pollResults.totalVotes * 0.3)) {
      return `Clear consensus detected. "${winner.optionText}" is dominating by a significant margin.`;
    } else {
      return `It's a tight race! "${winner.optionText}" is currently leading narrowly over "${second.optionText}".`;
    }
  };

  const presentPoll = (poll) => {
    setActivePresentationPoll(poll);
    setShowPresentationModal(true);
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

        {/* Hero Section */}
        <div className="hero-section">
          <div className="hero-content">
            <h1>Staff Dashboard</h1>
            <p>Welcome back, <strong>{user?.name}</strong>! Manage campus polling events and analyze voting data instantly.</p>
            <div className="header-actions">
              <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                + Create New Poll
              </button>
              <button onClick={handleLogout} className="logout-btn">
                <LogOut size={18} /> Logout
              </button>
            </div>
          </div>
          <div className="hero-image">
            <svg width="250" height="200" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" fill="#eef2ff"></rect>
              <path d="M3 9h18" stroke="#6366f1"></path>
              <circle cx="8" cy="15" r="2" fill="#818cf8" stroke="none"></circle>
              <path d="M12 15h5" stroke="#818cf8" strokeWidth="2"></path>
              <circle cx="8" cy="19" r="2" fill="#c7d2fe" stroke="none"></circle>
              <path d="M12 19h3" stroke="#a5b4fc" strokeWidth="2"></path>
            </svg>
          </div>
        </div>

        {error && <div style={{ color: '#ef4444', marginBottom: '20px', background: '#fef2f2', padding: '12px', borderRadius: '12px', border: '1px solid #fecaca' }}>{error}</div>}

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
          {polls.length === 0 ? <p style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>No polls created yet. Click above to start!</p> : polls.map(p => {
            const isActive = new Date() >= new Date(p.startTime) && new Date() < new Date(p.endTime);
            const isNotStarted = new Date() < new Date(p.startTime);
            const totalVotes = p.options.reduce((sum, opt) => sum + opt.voteCount, 0);

            return (
              <div className="poll-card" key={p._id}>
                <div className="poll-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span className="badge" style={{
                      background: CATEGORY_COLORS[p.category || 'General'].bg,
                      color: CATEGORY_COLORS[p.category || 'General'].text,
                      border: `1px solid ${CATEGORY_COLORS[p.category || 'General'].border}`
                    }}>
                      {p.category || 'General'}
                    </span>
                    <h4>{p.title}</h4>
                  </div>
                  <p>{p.description}</p>
                  <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <span className="badge" style={{
                      background: isActive ? '#dcfce7' : isNotStarted ? '#fef3c7' : '#f1f5f9',
                      color: isActive ? '#059669' : isNotStarted ? '#b45309' : '#64748b',
                      border: `1px solid ${isActive ? '#a7f3d0' : isNotStarted ? '#fde68a' : '#e2e8f0'}`
                    }}>
                      {isActive ? '● ACTIVE' : isNotStarted ? '⏳ NOT STARTED' : 'CLOSED'}
                    </span>
                    <span className="badge" style={{ background: '#eef2ff', color: '#6366f1', border: '1px solid #c7d2fe' }}>
                      👁 {p.visibility}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                  <p style={{ fontSize: '15px', color: '#475569', margin: '0 0 5px 0' }}>Total Votes: <strong style={{ color: '#6366f1', fontSize: '18px' }}>{totalVotes}</strong></p>
                  <button className="btn-secondary" onClick={() => viewResults(p._id)}>View Results</button>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-secondary" onClick={() => openEditModal(p)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px' }}>
                      <Pencil size={14} /> Edit
                    </button>
                    <button className="btn-outline" onClick={() => presentPoll(p)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'linear-gradient(135deg, #1e1b4b, #312e81)', color: 'white', border: 'none', borderRadius: '10px', marginTop: 0, width: 'auto' }}>
                      <MonitorPlay size={16} /> Present
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* CREATE POLL MODAL */}
        {showModal && (
          <div className="modal-bg">
            <div className="modal-box">
              <div className="modal-head">
                <h3>Create New Poll</h3>
                <span onClick={() => setShowModal(false)}>✕</span>
              </div>

              <div style={{ maxHeight: '65vh', overflowY: 'auto', paddingRight: '10px' }}>
                <label>Poll Title</label>
                <input type="text" value={newPoll.title} onChange={e => setNewPoll({ ...newPoll, title: e.target.value })} placeholder="e.g. Next Semester Electives" />

                <label>Description</label>
                <textarea value={newPoll.description} onChange={e => setNewPoll({ ...newPoll, description: e.target.value })} placeholder="Briefly describe what this poll is about..." />

                <div className="time-grid">
                  <div>
                    <label>Visibility</label>
                    <select value={newPoll.visibility} onChange={e => setNewPoll({ ...newPoll, visibility: e.target.value })}>
                      <option value="Student">Students Only</option>
                      <option value="Staff">Staff Only</option>
                      <option value="Both">Everyone</option>
                    </select>
                  </div>
                  <div>
                    <label>Category</label>
                    <select value={newPoll.category} onChange={e => setNewPoll({ ...newPoll, category: e.target.value })}>
                      <option value="Academics">Academics</option>
                      <option value="Events">Events</option>
                      <option value="General">General</option>
                      <option value="Urgent">Urgent</option>
                      <option value="Facilities">Facilities</option>
                    </select>
                  </div>
                </div>

                <div className="time-grid">
                  <div>
                    <label>Start Time (default: NOW)</label>
                    <input type="datetime-local" value={newPoll.startTime} onChange={e => setNewPoll({ ...newPoll, startTime: e.target.value })} />
                  </div>
                  <div>
                    <label>End Time *</label>
                    <input type="datetime-local" value={newPoll.endTime} onChange={e => setNewPoll({ ...newPoll, endTime: e.target.value })} />
                  </div>
                </div>

                <div className="checks">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <input type="checkbox" checked={newPoll.anonymous} onChange={e => setNewPoll({ ...newPoll, anonymous: e.target.checked })} />
                    Hide Voter Identities (Anonymous)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" checked={newPoll.allowLiveResults} onChange={e => setNewPoll({ ...newPoll, allowLiveResults: e.target.checked })} />
                    Display Live Results to Voters
                  </label>
                </div>

                <label>Poll Options</label>
                <div className="options-list">
                  {newPoll.options.map((o, i) => (
                    <div className="option-row" key={i}>
                      <button className="delete-option" onClick={() => deleteOption(i)}>✕</button>
                      <input type="text" placeholder={`Option ${i + 1}`} value={o} onChange={e => updateOption(i, e.target.value)} style={{ margin: 0 }} />
                    </div>
                  ))}
                </div>
                <button className="btn-outline" onClick={() => setNewPoll({ ...newPoll, options: [...newPoll.options, ""] })}>+ Add Another Option</button>
              </div>

              <div className="modal-actions">
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn-primary" style={{ flex: 1 }} onClick={createPoll}>Launch Poll</button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT POLL MODAL */}
        {showEditModal && editPollData && (
          <div className="modal-bg">
            <div className="modal-box">
              <div className="modal-head">
                <h3>Edit Poll</h3>
                <span onClick={() => setShowEditModal(false)}>✕</span>
              </div>

              <div style={{ maxHeight: '65vh', overflowY: 'auto', paddingRight: '10px' }}>
                <label>Poll Title</label>
                <input type="text" value={editPollData.title} onChange={e => setEditPollData({ ...editPollData, title: e.target.value })} />

                <label>Description</label>
                <textarea value={editPollData.description} onChange={e => setEditPollData({ ...editPollData, description: e.target.value })} />

                <div className="time-grid">
                  <div>
                    <label>Visibility</label>
                    <select value={editPollData.visibility} onChange={e => setEditPollData({ ...editPollData, visibility: e.target.value })}>
                      <option value="Student">Students Only</option>
                      <option value="Staff">Staff Only</option>
                      <option value="Both">Everyone</option>
                    </select>
                  </div>
                  <div>
                    <label>Category</label>
                    <select value={editPollData.category} onChange={e => setEditPollData({ ...editPollData, category: e.target.value })}>
                      <option value="Academics">Academics</option>
                      <option value="Events">Events</option>
                      <option value="General">General</option>
                      <option value="Urgent">Urgent</option>
                      <option value="Facilities">Facilities</option>
                    </select>
                  </div>
                </div>

                <div className="time-grid">
                  <div>
                    <label>Start Time</label>
                    <input type="datetime-local" value={editPollData.startTime} onChange={e => setEditPollData({ ...editPollData, startTime: e.target.value })} />
                  </div>
                  <div>
                    <label>End Time</label>
                    <input type="datetime-local" value={editPollData.endTime} onChange={e => setEditPollData({ ...editPollData, endTime: e.target.value })} />
                  </div>
                </div>

                <div className="checks">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <input type="checkbox" checked={editPollData.anonymous} onChange={e => setEditPollData({ ...editPollData, anonymous: e.target.checked })} />
                    Anonymous
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" checked={editPollData.allowLiveResults} onChange={e => setEditPollData({ ...editPollData, allowLiveResults: e.target.checked })} />
                    Live Results
                  </label>
                </div>

                <label>Poll Options (editable only if no votes yet)</label>
                <div className="options-list">
                  {editPollData.options.map((o, i) => (
                    <div className="option-row" key={i}>
                      <button className="delete-option" onClick={() => {
                        if (editPollData.options.length <= 2) return;
                        setEditPollData({ ...editPollData, options: editPollData.options.filter((_, j) => j !== i) });
                      }}>✕</button>
                      <input type="text" value={o} onChange={e => {
                        const updated = [...editPollData.options];
                        updated[i] = e.target.value;
                        setEditPollData({ ...editPollData, options: updated });
                      }} style={{ margin: 0 }} />
                    </div>
                  ))}
                </div>
                <button className="btn-outline" onClick={() => setEditPollData({ ...editPollData, options: [...editPollData.options, ""] })}>+ Add Option</button>
              </div>

              <div className="modal-actions">
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowEditModal(false)}>Cancel</button>
                <button className="btn-primary" style={{ flex: 1 }} onClick={saveEditPoll}>Save Changes</button>
              </div>
            </div>
          </div>
        )}

        {/* RESULTS MODAL */}
        {showResultsModal && (
          <div className="modal-bg">
            <div className="modal-box" style={{ maxWidth: '750px' }}>
              <div className="modal-head">
                <h3>Poll Results</h3>
                <span onClick={() => setShowResultsModal(false)}>✕</span>
              </div>

              <div style={{ maxHeight: '75vh', overflowY: 'auto', paddingRight: '10px' }}>
                {resultsLoading ? (
                  <p style={{ textAlign: 'center', color: '#6366f1' }}>Loading results...</p>
                ) : pollResults ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                      <div>
                        <h4 style={{ marginBottom: '5px', fontSize: '20px', color: '#1e1b4b' }}>{pollResults.pollTitle}</h4>
                        <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
                          Total Votes: <strong style={{ color: '#6366f1' }}>{pollResults.totalVotes}</strong>
                          {pollResults.anonymous && <span style={{ marginLeft: '10px', color: '#ef4444', background: '#fef2f2', padding: '4px 8px', borderRadius: '6px' }}>Anonymous</span>}
                        </p>
                      </div>
                      <button className="btn-outline" onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', fontSize: '13px', width: 'auto', marginTop: 0 }}>
                        <Download size={14} /> CSV
                      </button>
                    </div>

                    <div style={{ background: 'linear-gradient(135deg, #eef2ff, #faf5ff)', padding: '12px 16px', borderRadius: '12px', border: '1px solid #c7d2fe', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <Sparkles size={18} color="#6366f1" style={{ marginTop: '2px' }} />
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#6366f1', margin: '0 0 2px 0' }}>AI Insight</p>
                        <p style={{ fontSize: '14px', color: '#334155', margin: 0 }}>{generateAIInsight()}</p>
                      </div>
                    </div>

                    {pollResults.totalVotes > 0 && (
                      <div style={{ height: '250px', marginBottom: '20px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={pollResults.results} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" allowDecimals={false} />
                            <YAxis dataKey="optionText" type="category" width={100} tick={{ fontSize: 12 }} />
                            <Tooltip cursor={{ fill: '#eef2ff' }} />
                            <Bar dataKey="voteCount" name="Votes" radius={[0, 6, 6, 0]}>
                              {pollResults.results.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {pollResults.results.map((opt, i) => (
                        <div key={i} style={{ background: '#fff', border: '1px solid #e0e7ff', borderRadius: '10px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: CHART_COLORS[i % CHART_COLORS.length] }}></div>
                            <strong style={{ fontSize: '15px', color: '#1e1b4b' }}>{opt.optionText}</strong>
                          </div>
                          <span className="badge" style={{ background: '#eef2ff', color: '#6366f1', border: '1px solid #c7d2fe', fontSize: '14px' }}>
                            {opt.voteCount} votes ({pollResults.totalVotes > 0 ? Math.round((opt.voteCount / pollResults.totalVotes) * 100) : 0}%)
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Demographics Donut */}
                    {pollResults.demographics && pollResults.demographics.length > 0 && (
                      <div style={{ marginTop: '25px', background: '#fff', border: '1px solid #e0e7ff', borderRadius: '12px', padding: '16px' }}>
                        <h4 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#1e1b4b' }}>Voter Demographics</h4>
                        <div style={{ height: '220px' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={pollResults.demographics} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                {pollResults.demographics.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {/* AI/ML Section */}
                    <div className="ai-section">
                      <div className="ai-section-header">
                        <div className="ai-section-title">
                          <Brain size={20} />
                          <h4>AI/ML Intelligence Engine</h4>
                        </div>
                        <div className="ai-tabs">
                          <button className={`ai-tab ${activeAiTab === 'sentiment' ? 'active' : ''}`} onClick={() => setActiveAiTab('sentiment')}>
                            <Sparkles size={14} /> Sentiment
                          </button>
                          <button className={`ai-tab ${activeAiTab === 'forecast' ? 'active' : ''}`} onClick={() => setActiveAiTab('forecast')}>
                            <TrendingUp size={14} /> Forecast
                          </button>
                          <button className={`ai-tab ${activeAiTab === 'anomaly' ? 'active' : ''}`} onClick={() => setActiveAiTab('anomaly')}>
                            <ShieldCheck size={14} /> Integrity
                          </button>
                        </div>
                      </div>

                      {/* SENTIMENT TAB */}
                      {activeAiTab === 'sentiment' && (
                        <div className="ai-panel">
                          {aiAnalysisLoading ? (
                            <div className="ai-loading"><div className="ai-loading-spinner"></div><p>Running NLP Sentiment Analysis...</p></div>
                          ) : aiAnalysis ? (
                            <div className="sentiment-content">
                              <div className="sentiment-gauge-container">
                                <div className="sentiment-gauge" style={{ background: SENTIMENT_COLORS[aiAnalysis.overallSentiment]?.bg || '#f8fafc' }}>
                                  <div className="sentiment-label">{aiAnalysis.overallSentiment}</div>
                                  <div className="sentiment-score-bar">
                                    <div className="sentiment-bar-track">
                                      <div className="sentiment-bar-fill" style={{
                                        width: `${Math.abs(aiAnalysis.sentimentScore) * 100}%`,
                                        background: SENTIMENT_COLORS[aiAnalysis.overallSentiment]?.bar || '#94a3b8',
                                        marginLeft: aiAnalysis.sentimentScore < 0 ? `${50 - Math.abs(aiAnalysis.sentimentScore) * 50}%` : '50%',
                                      }}></div>
                                      <div className="sentiment-bar-center"></div>
                                    </div>
                                    <div className="sentiment-bar-labels"><span>Negative</span><span>Neutral</span><span>Positive</span></div>
                                  </div>
                                  <p className="sentiment-score-text">Score: {aiAnalysis.sentimentScore}</p>
                                </div>
                              </div>
                              {aiAnalysis.keywords && aiAnalysis.keywords.length > 0 && (
                                <div className="ai-card">
                                  <h5>🔑 Keywords (TF-IDF)</h5>
                                  <div className="keyword-tags">
                                    {aiAnalysis.keywords.map((kw, i) => (
                                      <span key={i} className="keyword-tag">{kw.word}<span className="keyword-score">{kw.relevance}</span></span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {aiAnalysis.optionAnalysis && (
                                <div className="ai-card">
                                  <h5>📊 Per-Option Sentiment</h5>
                                  <div className="option-sentiments">
                                    {aiAnalysis.optionAnalysis.map((opt, i) => (
                                      <div key={i} className="option-sentiment-row">
                                        <span className="option-name">{opt.optionText}</span>
                                        <span className="option-sent-badge" style={{ background: SENTIMENT_COLORS[opt.sentiment]?.bg, color: SENTIMENT_COLORS[opt.sentiment]?.text }}>
                                          {opt.sentiment} ({opt.sentimentScore})
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {aiAnalysis.engagementPrediction && (
                                <div className="ai-card engagement-card">
                                  <h5>🎯 Engagement Prediction</h5>
                                  <div className="engagement-score-container">
                                    <div className="engagement-circle">
                                      <svg viewBox="0 0 36 36" className="engagement-svg">
                                        <path className="engagement-bg-ring" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                        <path className="engagement-fg-ring" strokeDasharray={`${aiAnalysis.engagementPrediction.score}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                      </svg>
                                      <div className="engagement-score-text">
                                        <span className="score-num">{aiAnalysis.engagementPrediction.score}</span>
                                        <span className="score-label">{aiAnalysis.engagementPrediction.level}</span>
                                      </div>
                                    </div>
                                    <div className="engagement-factors">
                                      {aiAnalysis.engagementPrediction.factors.map((f, i) => (
                                        <div key={i} className="engagement-factor">{f}</div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : <p className="ai-no-data">Sentiment analysis unavailable.</p>}
                        </div>
                      )}

                      {/* FORECAST TAB */}
                      {activeAiTab === 'forecast' && (
                        <div className="ai-panel">
                          {forecastLoading ? (
                            <div className="ai-loading"><div className="ai-loading-spinner"></div><p>Running Linear Regression...</p></div>
                          ) : forecastData?.forecast ? (
                            <div className="forecast-content">
                              {forecastData.forecast.predictedWinner && (
                                <div className="forecast-winner-card">
                                  <div className="forecast-winner-header">
                                    <span className="trophy-icon">🏆</span>
                                    <div>
                                      <h5>Predicted Winner</h5>
                                      <p className="winner-name">{forecastData.forecast.predictedWinner.optionText}</p>
                                    </div>
                                  </div>
                                  <div className="winner-stats">
                                    <div className="winner-stat"><span className="stat-num">{forecastData.forecast.predictedWinner.confidence}%</span><span className="stat-lbl">Confidence</span></div>
                                    <div className="winner-stat"><span className="stat-num">{forecastData.forecast.predictedWinner.projectedVotes}</span><span className="stat-lbl">Proj. Votes</span></div>
                                    <div className="winner-stat"><span className="stat-num">{forecastData.forecast.modelConfidence}</span><span className="stat-lbl">Model Fit</span></div>
                                  </div>
                                </div>
                              )}
                              <div className="ai-card">
                                <h5>{MOMENTUM_ICONS[forecastData.forecast.momentum?.direction] || '➡️'} Momentum: {forecastData.forecast.momentum?.direction || 'Unknown'}</h5>
                                <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0 0' }}>{forecastData.forecast.momentum?.description}</p>
                              </div>
                              <div className="ai-card">
                                <h5>📊 Projected Finals</h5>
                                <div className="projected-options">
                                  {forecastData.forecast.projectedOptions?.map((opt, i) => (
                                    <div key={i} className="projected-option-row">
                                      <div className="projected-option-info">
                                        <div className="proj-color" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}></div>
                                        <span>{opt.optionText}</span>
                                      </div>
                                      <div className="projected-bars">
                                        <div className="proj-bar-container">
                                          <div className="proj-bar current" style={{ width: `${opt.currentPercent}%`, background: CHART_COLORS[i % CHART_COLORS.length] + '80' }}></div>
                                          <div className="proj-bar projected" style={{ width: `${opt.projectedPercent}%`, background: CHART_COLORS[i % CHART_COLORS.length], opacity: 0.3 }}></div>
                                        </div>
                                        <span className="proj-nums">{opt.currentVotes} → {opt.projectedVotes}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              {forecastData.forecast.hourlyTrend && forecastData.forecast.hourlyTrend.length > 1 && (
                                <div className="ai-card">
                                  <h5>📈 Hourly Activity</h5>
                                  <div style={{ height: '180px', marginTop: '10px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                      <AreaChart data={forecastData.forecast.hourlyTrend}>
                                        <defs>
                                          <linearGradient id="colorVotes" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                          </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                                        <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="votes" stroke="#6366f1" fillOpacity={1} fill="url(#colorVotes)" strokeWidth={2} />
                                      </AreaChart>
                                    </ResponsiveContainer>
                                  </div>
                                </div>
                              )}
                              <div className="forecast-meta">
                                <span>R² = {forecastData.forecast.rSquared}</span><span>•</span>
                                <span>{forecastData.forecast.percentTimeElapsed}% elapsed</span><span>•</span>
                                <span>{forecastData.forecast.hoursRemaining}h left</span>
                              </div>
                            </div>
                          ) : <p className="ai-no-data">Forecast unavailable.</p>}
                        </div>
                      )}

                      {/* ANOMALY TAB */}
                      {activeAiTab === 'anomaly' && (
                        <div className="ai-panel">
                          {forecastLoading ? (
                            <div className="ai-loading"><div className="ai-loading-spinner"></div><p>Running Z-Score Analysis...</p></div>
                          ) : forecastData?.anomalies ? (
                            <div className="anomaly-content">
                              <div className="integrity-card" style={{ background: RISK_COLORS[forecastData.anomalies.riskLevel]?.bg, borderColor: RISK_COLORS[forecastData.anomalies.riskLevel]?.glow }}>
                                <div className="integrity-header">
                                  <div className="integrity-score-big">
                                    <span className="integrity-num">{forecastData.anomalies.integrityScore}</span>
                                    <span className="integrity-max">/100</span>
                                  </div>
                                  <div>
                                    <div className="integrity-label">Integrity Score</div>
                                    <div className="risk-badge" style={{ background: RISK_COLORS[forecastData.anomalies.riskLevel]?.glow, color: 'white' }}>
                                      {forecastData.anomalies.riskLevel} Risk
                                    </div>
                                  </div>
                                </div>
                                <p className="integrity-summary">{forecastData.anomalies.summary}</p>
                              </div>
                              {forecastData.anomalies.alerts && forecastData.anomalies.alerts.length > 0 ? (
                                <div className="anomaly-alerts">
                                  <h5>⚠️ Anomalies ({forecastData.anomalies.totalAlerts})</h5>
                                  {forecastData.anomalies.alerts.map((alert, i) => (
                                    <div key={i} className={`anomaly-alert-card severity-${alert.severity.toLowerCase()}`}>
                                      <div className="alert-icon">{alert.icon}</div>
                                      <div className="alert-body">
                                        <div className="alert-title">{alert.title}<span className={`severity-badge sev-${alert.severity.toLowerCase()}`}>{alert.severity}</span></div>
                                        <p className="alert-message">{alert.message}</p>
                                        <p className="alert-detail">{alert.detail}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="ai-card" style={{ textAlign: 'center', padding: '30px' }}>
                                  <div style={{ fontSize: '48px', marginBottom: '10px' }}>✅</div>
                                  <h5 style={{ margin: '0 0 5px 0' }}>All Clear</h5>
                                  <p style={{ color: '#64748b', margin: 0 }}>No anomalies detected.</p>
                                </div>
                              )}
                            </div>
                          ) : <p className="ai-no-data">Anomaly detection unavailable.</p>}
                        </div>
                      )}
                    </div>
                  </div>
                ) : <p style={{ color: '#ef4444' }}>No data found.</p>}
              </div>

              <div className="modal-actions">
                <button className="btn-secondary" style={{ width: '100%' }} onClick={() => setShowResultsModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* PRESENTATION MODAL */}
        {showPresentationModal && activePresentationPoll && (
          <div className="presentation-bg">
            <div className="presentation-content">
              <button className="close-presentation" onClick={() => setShowPresentationModal(false)}>✕ Exit</button>
              <div className="presentation-main">
                <div className="presentation-left">
                  <span className="presentation-badge">{activePresentationPoll.category || 'General'}</span>
                  <h1 className="presentation-title">{activePresentationPoll.title}</h1>
                  <p className="presentation-desc">{activePresentationPoll.description}</p>
                  <div className="qr-container">
                    <p className="qr-hint">Scan to vote</p>
                    <div className="qr-box">
                      <QRCodeCanvas value={`${window.location.origin}/`} size={220} bgColor={"#ffffff"} fgColor={"#1e1b4b"} level={"Q"} />
                    </div>
                    <p className="qr-url">{window.location.origin}</p>
                  </div>
                </div>
                <div className="presentation-right">
                  <h3>Poll Options</h3>
                  <div className="presentation-options">
                    {activePresentationPoll.options.map((opt, i) => (
                      <div key={i} className="presentation-option-card">
                        <div className="option-color" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}></div>
                        <span className="option-text">{opt.optionText}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="staff-footer">
          Campus Poll Hub – Secure Digital Polling System © {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
};

export default Staff;
