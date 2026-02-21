import React, { useEffect, useState, useContext } from "react";
import { CheckCircle, Award, BarChart3, LogOut } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "./Student.css";

const Student = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("polls");
  const [polls, setPolls] = useState([]);
  const [votedPolls, setVotedPolls] = useState([]);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [pendingVotes, setPendingVotes] = useState({});
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({ rollNumber: "", department: "", profilePic: "" });

  const fetchData = async () => {
    try {
      const [pollsRes, dashboardRes] = await Promise.all([
        api.get('/polls'),
        api.get('/users/student/dashboard')
      ]);

      setPolls(pollsRes.data);
      setVotedPolls(dashboardRes.data.votes || []);
      setBadges(dashboardRes.data.badges || []);

      if (user) {
        setEditFormData({
          rollNumber: user.rollNumber || "",
          department: user.department || "",
          profilePic: user.profilePic || ""
        });
      }
    } catch (err) {
      if (!polls.length) setError("Failed to load data.");
      console.error(err);
    } finally {
      if (loading) setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/");
    } else {
      fetchData();
    }
  }, [user, navigate]);

  const handleVote = async (pollId, optionIndex) => {
    const hasVoted = votedPolls.some(v => v.pollId?._id === pollId || v.pollId === pollId);

    if (hasVoted || pendingVotes[pollId] !== undefined) {
      return;
    }

    setPendingVotes(prev => ({ ...prev, [pollId]: optionIndex }));

    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      const res = await api.post(`/polls/${pollId}/vote`, { optionIndex });

      if (res.data.newBadge) {
        alert(`🎉 Congratulations! You earned a new badge: ${res.data.newBadge}`);
      }

      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Error casting vote");
    } finally {
      setPendingVotes(prev => {
        const newState = { ...prev };
        delete newState[pollId];
        return newState;
      });
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleSaveProfile = async () => {
    try {
      const res = await api.put('/users/profile', editFormData);

      // We must merge these new fields into our local storage and Context
      const updatedUser = { ...user, ...res.data };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      // Force a hard reload to pick up the injected context (Or we could pass an update function down via context, but reload works flawlessly)
      window.location.reload();

    } catch (err) {
      alert(err.response?.data?.message || "Failed to save profile. Try again.");
    } finally {
      setIsEditingProfile(false);
      setShowProfileMenu(false);
    }
  };

  if (loading) return <div className="loading">Loading Dashboard...</div>;

  return (
    <div className="student-page">
      <div className="student-layout" style={{ position: 'relative' }}>

        {/* ===== TOP RIGHT ABSOLUTE PROFILE MENU ===== */}
        <div style={{ position: 'absolute', top: '20px', right: '10px', zIndex: 60 }}>
          <div className="profile-container" style={{ position: 'relative' }}>
            <div
              className="profile-trigger"
              onClick={() => { setShowProfileMenu(!showProfileMenu); setIsEditingProfile(false); }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#ffffff', padding: '2px', borderRadius: '50%', border: '2px solid #3b82f6', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', transition: 'all 0.2s ease', width: '48px', height: '48px' }}
            >
              <img
                src={user?.profilePic || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"}
                alt="Profile"
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
            </div>

            {showProfileMenu && (
              <div className="profile-dropdown" style={{ position: 'absolute', top: '55px', right: '0', background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', width: '260px', padding: '20px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', zIndex: 100, animation: 'dropdownSlide 0.2s ease-out' }}>
                <div style={{ textAlign: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px', marginBottom: '15px' }}>
                  {!isEditingProfile ? (
                    <>
                      <img
                        src={user?.profilePic || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"}
                        alt="Profile"
                        style={{ width: '65px', height: '65px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0', padding: '2px', marginBottom: '8px' }}
                      />
                      <h4 style={{ margin: 0, color: '#0f172a', fontSize: '18px', fontWeight: 700 }}>{user?.name}</h4>
                      <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' }}>{user?.email}</p>
                    </>
                  ) : (
                    <div style={{ textAlign: 'left' }}>
                      <label style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Avatar URL</label>
                      <input type="text" value={editFormData.profilePic} onChange={e => setEditFormData({ ...editFormData, profilePic: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', marginBottom: '10px', fontSize: '12px' }} placeholder="https://..." />
                    </div>
                  )}
                </div>

                <div style={{ paddingBottom: '15px', marginBottom: '15px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', fontWeight: 700 }}>Roll No.</span>
                      <span style={{ color: '#0f172a', fontSize: '14px', fontWeight: 600 }}>{user?.rollNumber || <span style={{ color: '#ef4444', fontSize: '12px' }}>Missing</span>}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', fontWeight: 700 }}>Dept.</span>
                      <span style={{ color: '#0f172a', fontSize: '14px', fontWeight: 600 }}>{user?.department || <span style={{ color: '#ef4444', fontSize: '12px' }}>Missing</span>}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                  {!isEditingProfile ? (
                    <button onClick={() => setIsEditingProfile(true)} style={{ width: '100%', background: '#f8fafc', color: '#334155', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s ease' }}>
                      Edit Profile Details
                    </button>
                  ) : (
                    <button onClick={handleSaveProfile} style={{ width: '100%', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s ease' }}>
                      Save to DB
                    </button>
                  )}
                  <button onClick={handleLogout} style={{ width: '100%', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 600, transition: 'all 0.2s ease' }}>
                    <LogOut size={16} /> Logout System
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hero Section with Illustration */}
        <div className="hero-section" style={{ marginTop: '30px' }}>
          <div className="hero-content">
            <h1>Student Dashboard</h1>
            <p>Welcome back! Make your voice heard by participating in active campus polls.</p>
          </div>

          <div className="hero-image" style={{ marginLeft: '30px' }}>
            <svg width="250" height="200" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
              <circle cx="16" cy="15" r="3" fill="#eff6ff" stroke="#3b82f6"></circle>
              <path d="M19 12l2-2" stroke="#60a5fa"></path>
              <path d="M22 15h2" stroke="#60a5fa"></path>
              <path d="M19 18l2 2" stroke="#60a5fa"></path>
            </svg>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <StatCard title="Active Polls" value={polls.length} icon={<BarChart3 size={28} />} />
          <StatCard title="Polls Voted" value={votedPolls.length} icon={<CheckCircle size={28} />} />
          <StatCard title="Badges Earned" value={badges.length} icon={<Award size={28} />} />
        </div>

        {/* Tabs */}
        <div className="tabs">
          <TabButton label="Active Polls" active={activeTab === "polls"} onClick={() => setActiveTab("polls")} />
          <TabButton label="Voting History" active={activeTab === "history"} onClick={() => setActiveTab("history")} />
          <TabButton label="My Badges" active={activeTab === "badges"} onClick={() => setActiveTab("badges")} />
        </div>

        {/* Content */}
        <div className="content-box">
          {error && <div className="error-message" style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}

          {activeTab === "polls" && (
            <div className="polls-list">
              {polls.length === 0 ? (
                <p className="empty-state">No active polls available right now. Check back later!</p>
              ) : (
                polls.map((poll) => {
                  const hasVoted = votedPolls.some(v => v.pollId?._id === poll._id || v.pollId === poll._id);
                  const mappedVote = votedPolls.find(v => v.pollId?._id === poll._id || v.pollId === poll._id);
                  const pendingVoteIdx = pendingVotes[poll._id];
                  const isPollLocked = hasVoted || pendingVoteIdx !== undefined;

                  return (
                    <div key={poll._id} className="poll-card">
                      <div className="poll-header">
                        <h3>{poll.title}</h3>
                        {hasVoted && <span className="voted-badge">✓ Voted</span>}
                      </div>
                      <p className="poll-desc">{poll.description}</p>
                      <div className="poll-meta">
                        <span><strong style={{ color: '#64748b' }}>By:</strong> {poll.createdBy?.name || 'Admin'}</span>
                        <span><strong style={{ color: '#64748b' }}>Ends:</strong> {new Date(poll.endTime).toLocaleDateString()}</span>
                      </div>

                      <div className="options-list">
                        {poll.options.map((opt, i) => {
                          const isThisOptionPending = pendingVoteIdx === i;
                          const isThisOptionVoted = mappedVote?.optionIndex === i;
                          const showSelectedLayer = isThisOptionPending || isThisOptionVoted;

                          let btnClass = "vote-btn";
                          if (isThisOptionPending) btnClass += " voting-active";
                          if (isPollLocked && !isThisOptionPending) btnClass += " disabled";
                          if (showSelectedLayer && !isThisOptionPending) btnClass += " selected-option";

                          return (
                            <button key={i} className={btnClass} onClick={() => handleVote(poll._id, i)} disabled={isPollLocked}>
                              <span>{opt.optionText}</span>
                              {(hasVoted && poll.allowLiveResults) && (
                                <span className="vote-count">{(isThisOptionVoted ? opt.voteCount : opt.voteCount)} votes</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {activeTab === "history" && (
            <div className="history-list">
              {votedPolls.length === 0 ? (
                <p className="empty-state">You haven't participated in any polls yet.</p>
              ) : (
                votedPolls.map((vote, idx) => (
                  <div key={idx} className="history-card">
                    <h4>{vote.pollId?.title || 'Unknown Poll'}</h4>
                    <p>You selected option {(vote.optionIndex + 1)}</p>
                    <small>{new Date(vote.createdAt).toLocaleString()}</small>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "badges" && (
            <div className="badges-list">
              {badges.length === 0 ? (
                <p className="empty-state">You haven't earned any badges yet. Vote in 5 polls to unlock your first achievement!</p>
              ) : (
                <div className="badge-grid">
                  {badges.map((badge, idx) => (
                    <div key={idx} className="badge-card">
                      <Award size={48} className="badge-icon" />
                      <h4>{badge.badgeName}</h4>
                      <small>Earned: {new Date(badge.createdAt).toLocaleDateString()}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="student-footer">
          Campus Poll Hub – Secure Digital Polling System © {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
};

/* ---------- Components ---------- */

const StatCard = ({ title, value, icon }) => (
  <div className="stat-card">
    <div>
      <p className="stat-title">{title}</p>
      <h2 className="stat-value">{value}</h2>
    </div>
    <div className="stat-icon">{icon}</div>
  </div>
);

const TabButton = ({ label, active, onClick }) => (
  <button className={`tab-btn ${active ? "active" : ""}`} onClick={onClick}>{label}</button>
);

export default Student;
