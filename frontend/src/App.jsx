import React, { useState, useEffect } from 'react';
import { 
  User, 
  Lock, 
  Plus, 
  Trash2, 
  Mail, 
  Phone, 
  Search, 
  LogOut, 
  Users, 
  X, 
  AlertTriangle, 
  CheckCircle,
  Calendar,
  Heart,
  Smile,
  Coffee,
  Sparkles,
  LayoutGrid,
  Columns
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GET_FRIENDS, ADD_FRIEND, DELETE_FRIEND } from './queries';

const EXPRESS_URL = import.meta.env.VITE_EXPRESS_URL || 'http://localhost:5000';
const HASURA_URL = import.meta.env.VITE_HASURA_URL || 'http://localhost:8080';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const [isLogin, setIsLogin] = useState(true);
  
  // Auth Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // App UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Friends Data State
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Add Friend Form State
  const [friendName, setFriendName] = useState('');
  const [friendEmail, setFriendEmail] = useState('');
  const [friendPhone, setFriendPhone] = useState('');
  const [friendshipType, setFriendshipType] = useState('friend'); // bestie, friend, hangout
  const [friendGender, setFriendGender] = useState('female'); // female (girl), male (boy)
  const [addLoading, setAddLoading] = useState(false);

  // Dashboard View & Filter State
  const [viewMode, setViewMode] = useState('split'); // split, all, girls, boys
  const [filterType, setFilterType] = useState('all'); // all, bestie, friend, hangout

  // Toast helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Fetch Friends function using standard HTTP Post request to Hasura
  const fetchFriends = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${HASURA_URL}/v1/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query: GET_FRIENDS })
      });

      const json = await response.json();
      if (json.errors) {
        throw new Error(json.errors[0].message);
      }
      setFriends(json.data.friends || []);
    } catch (err) {
      console.error('Error fetching friends:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchFriends();
    }
  }, [token]);

  // Auth Handlers
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    const endpoint = isLogin ? 'login' : 'signup';

    try {
      const response = await fetch(`${EXPRESS_URL}/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // Save credentials
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      
      showToast(`Welcome, ${data.user.username}!`);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
    setFriends([]);
    showToast('Logged out successfully.');
  };

  // Add Friend Handler
  const handleAddFriendSubmit = async (e) => {
    e.preventDefault();
    if (!friendName.trim()) {
      showToast('Please enter a name', 'error');
      return;
    }
    
    setAddLoading(true);
    try {
      const response = await fetch(`${HASURA_URL}/v1/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: ADD_FRIEND,
          variables: {
            name: friendName,
            email: friendEmail || null,
            phone: friendPhone || null,
            user_id: user.id,
            friendship_type: friendshipType,
            gender: friendGender
          }
        })
      });

      const json = await response.json();
      if (json.errors) {
        throw new Error(json.errors[0].message);
      }

      showToast('Friend added successfully!');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f472b6', '#3b82f6', '#a855f7']
      });

      setIsModalOpen(false);
      setFriendName('');
      setFriendEmail('');
      setFriendPhone('');
      setFriendshipType('friend');
      setFriendGender('female');
      fetchFriends(); // Reload list
    } catch (err) {
      showToast(err.message || 'Failed to add friend', 'error');
    } finally {
      setAddLoading(false);
    }
  };

  // Delete Friend Handler
  const handleDeleteFriend = async (id) => {
    if (!confirm('Are you sure you want to remove this friend?')) {
      return;
    }

    try {
      const response = await fetch(`${HASURA_URL}/v1/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: DELETE_FRIEND,
          variables: { id }
        })
      });

      const json = await response.json();
      if (json.errors) {
        throw new Error(json.errors[0].message);
      }

      showToast('Friend removed.', 'success');
      fetchFriends(); // Reload list
    } catch (err) {
      showToast(err.message || 'Failed to delete friend', 'error');
    }
  };

  // Initials for avatar
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Format date
  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filter friends list based on search query and other filters
  const getFilteredAndSearched = (genderFilter) => {
    return friends.filter(friend => {
      const matchesSearch = friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (friend.email && friend.email.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesGender = !genderFilter || friend.gender === genderFilter;
      const matchesType = filterType === 'all' || friend.friendship_type === filterType;
      return matchesSearch && matchesGender && matchesType;
    });
  };

  const girlsList = getFilteredAndSearched('female');
  const boysList = getFilteredAndSearched('male');
  const allFilteredList = getFilteredAndSearched(
    viewMode === 'girls' ? 'female' : viewMode === 'boys' ? 'male' : null
  );

  // Statistics
  const totalCount = friends.length;
  const girlsCount = friends.filter(f => f.gender === 'female').length;
  const boysCount = friends.filter(f => f.gender === 'male').length;
  const bestiesCount = friends.filter(f => f.friendship_type === 'bestie').length;
  const girlsPercentage = totalCount > 0 ? Math.round((girlsCount / totalCount) * 100) : 50;
  const boysPercentage = totalCount > 0 ? Math.round((boysCount / totalCount) * 100) : 50;

  // Render Friend Card Helper
  const renderFriendCard = (friend) => {
    const isGirl = friend.gender === 'female';
    return (
      <div key={friend.id} className={`friend-card glass animate-fade-in ${isGirl ? 'gender-girl' : 'gender-boy'}`}>
        <div className="friend-avatar">
          {getInitials(friend.name)}
        </div>
        <div className="friend-info">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>{friend.name}</h3>
            {friend.friendship_type === 'bestie' && (
              <span className="badge badge-bestie"><Heart size={12} fill="currentColor" /> Bestie</span>
            )}
            {friend.friendship_type === 'friend' && (
              <span className="badge badge-friend"><Smile size={12} /> Friend</span>
            )}
            {friend.friendship_type === 'hangout' && (
              <span className="badge badge-hangout"><Coffee size={12} /> Hangout</span>
            )}
          </div>
          <div className="friend-meta">
            {friend.email && (
              <div className="friend-meta-item">
                <Mail size={14} />
                <a href={`mailto:${friend.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                  {friend.email}
                </a>
              </div>
            )}
            {friend.phone && (
              <div className="friend-meta-item">
                <Phone size={14} />
                <a href={`tel:${friend.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                  {friend.phone}
                </a>
              </div>
            )}
            <div className="friend-meta-item" style={{ marginTop: '4px', fontSize: '0.8rem', opacity: 0.8 }}>
              <Calendar size={12} />
              <span>Connected since {formatDate(friend.created_at)}</span>
            </div>
          </div>
        </div>
        <div className="friend-card-footer">
          <button className="btn-delete-icon" onClick={() => handleDeleteFriend(friend.id)} title="Remove Friend">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    );
  };

  // Authentication View
  if (!token) {
    return (
      <div className="app-container">
        {toast && (
          <div className={`toast glass ${toast.type}`} style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 24px',
            borderRadius: '8px',
            borderLeft: toast.type === 'error' ? '4px solid hsl(0, 84%, 60%)' : '4px solid hsl(142, 70%, 45%)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: 'var(--shadow-md)'
          }}>
            {toast.type === 'error' ? <AlertTriangle size={18} color="red"/> : <CheckCircle size={18} color="green"/>}
            <span>{toast.message}</span>
          </div>
        )}
        <div className="auth-wrapper">
          <div className="auth-card glass">
            <div className="auth-header">
              <div className="auth-title">Adnu's Lover</div>
              <div className="auth-subtitle">
                {isLogin ? 'Sign in to access your friends list' : 'Create an account to start cataloging friends'}
              </div>
            </div>

            {authError && (
              <div className="error-banner">
                <AlertTriangle size={18} />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <div className="input-wrapper">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary glow-btn" disabled={authLoading}>
                {authLoading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="auth-footer">
              {isLogin ? (
                <>
                  Don't have an account?{' '}
                  <span className="auth-link" onClick={() => { setIsLogin(false); setAuthError(''); }}>
                    Sign up
                  </span>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <span className="auth-link" onClick={() => { setIsLogin(true); setAuthError(''); }}>
                    Log in
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard / Friends List View
  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toast && (
        <div className="glass" style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '12px 24px',
          borderRadius: '8px',
          borderLeft: toast.type === 'error' ? '4px solid hsl(0, 84%, 60%)' : '4px solid hsl(142, 70%, 45%)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: 'var(--shadow-md)'
        }}>
          {toast.type === 'error' ? <AlertTriangle size={18} color="red"/> : <CheckCircle size={18} color="green"/>}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Navigation */}
      <nav className="navbar glass">
        <div className="logo-section">
          <Users className="logo-icon" size={24} />
          <span className="logo-text">Adnu's Lover</span>
        </div>
        <div className="nav-user">
          <div className="username-tag">
            <User size={14} />
            <span>{user?.username}</span>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Statistics Banner */}
        {!loading && !error && friends.length > 0 && (
          <div className="stats-bar animate-fade-in">
            <div className="stat-card glass">
              <div className="stat-icon-wrapper" style={{ background: 'hsla(var(--primary), 0.15)', color: 'hsl(var(--primary))' }}>
                <Users size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{totalCount}</span>
                <span className="stat-label">Total Connections</span>
              </div>
            </div>

            <div className="stat-card glass">
              <div className="stat-icon-wrapper" style={{ background: 'hsla(350, 85%, 55%, 0.15)', color: 'hsl(350, 85%, 50%)' }}>
                <Heart size={24} fill="currentColor" />
              </div>
              <div className="stat-info">
                <span className="stat-value">{bestiesCount}</span>
                <span className="stat-label">Besties</span>
              </div>
            </div>

            <div className="stat-card glass gender-ratio-container">
              <div className="ratio-label-row">
                <span style={{ color: 'hsl(330, 85%, 50%)' }}>Girls: {girlsCount} ({girlsPercentage}%)</span>
                <span style={{ color: 'hsl(210, 85%, 45%)' }}>Boys: {boysCount} ({boysPercentage}%)</span>
              </div>
              <div className="ratio-bar-track">
                <div className="ratio-bar-girls" style={{ width: `${girlsPercentage}%` }}></div>
                <div className="ratio-bar-boys" style={{ width: `${boysPercentage}%` }}></div>
              </div>
            </div>
          </div>
        )}

        <div className="dashboard-header">
          <div className="dashboard-title-section">
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              My Circle <Sparkles size={24} style={{ color: 'hsl(var(--primary))' }} />
            </h1>
            <p>Grouped by gender and relationship categories with a fully interactive view</p>
          </div>

          <div className="dashboard-actions" style={{ flexWrap: 'wrap', gap: '16px' }}>
            {/* View Mode Switching Tabs */}
            <div className="view-tabs">
              <button 
                className={`tab-btn ${viewMode === 'split' ? 'active' : ''}`}
                onClick={() => setViewMode('split')}
              >
                <Columns size={16} />
                Split View
              </button>
              <button 
                className={`tab-btn ${viewMode === 'all' ? 'active' : ''}`}
                onClick={() => setViewMode('all')}
              >
                <LayoutGrid size={16} />
                All
              </button>
              <button 
                className={`tab-btn ${viewMode === 'girls' ? 'active' : ''}`}
                onClick={() => setViewMode('girls')}
              >
                <Heart size={16} fill={viewMode === 'girls' ? 'currentColor' : 'none'} style={{ color: 'hsl(330, 85%, 50%)' }} />
                Girls
              </button>
              <button 
                className={`tab-btn ${viewMode === 'boys' ? 'active' : ''}`}
                onClick={() => setViewMode('boys')}
              >
                <User size={16} style={{ color: 'hsl(210, 85%, 45%)' }} />
                Boys
              </button>
            </div>

            {/* Relationship Category Filter */}
            <div className="view-tabs" style={{ background: 'hsla(var(--border-color), 0.2)' }}>
              <button 
                className={`tab-btn ${filterType === 'all' ? 'active' : ''}`}
                onClick={() => setFilterType('all')}
              >
                All Levels
              </button>
              <button 
                className={`tab-btn ${filterType === 'bestie' ? 'active' : ''}`}
                style={filterType === 'bestie' ? { color: 'hsl(350, 85%, 45%)' } : {}}
                onClick={() => setFilterType('bestie')}
              >
                Besties
              </button>
              <button 
                className={`tab-btn ${filterType === 'friend' ? 'active' : ''}`}
                style={filterType === 'friend' ? { color: 'hsl(260, 80%, 50%)' } : {}}
                onClick={() => setFilterType('friend')}
              >
                Friends
              </button>
              <button 
                className={`tab-btn ${filterType === 'hangout' ? 'active' : ''}`}
                style={filterType === 'hangout' ? { color: 'hsl(35, 90%, 40%)' } : {}}
                onClick={() => setFilterType('hangout')}
              >
                Hangouts
              </button>
            </div>

            {/* Search Bar */}
            <div className="search-bar" style={{ margin: 0 }}>
              <Search size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'hsl(var(--text-muted))' }} />
              <input
                type="text"
                className="search-input"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '10px 14px 10px 40px' }}
              />
            </div>

            {/* Add Friend Button */}
            <button className="btn btn-primary btn-add-friend glow-btn" onClick={() => setIsModalOpen(true)} style={{ padding: '10px 20px' }}>
              <Plus size={18} />
              <span>Add Friend</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading-wrapper">
            <div className="spinner"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="error-banner">
            <AlertTriangle size={18} />
            <span>Error fetching friends: {error.message}. Please check if the Hasura engine is running.</span>
          </div>
        )}

        {/* Friends View rendering */}
        {!loading && !error && (
          <>
            {viewMode === 'split' ? (
              <div className="split-view-container animate-fade-in">
                {/* Girls Column */}
                <div className="split-column girls-column">
                  <div className="column-header">
                    <h2><Heart size={20} fill="currentColor" /> Girls Side</h2>
                    <span className="column-count-badge">{girlsList.length} Girls</span>
                  </div>
                  <div className="friends-grid-column">
                    {girlsList.length > 0 ? (
                      girlsList.map(renderFriendCard)
                    ) : (
                      <div className="empty-state" style={{ padding: '40px 20px', borderStyle: 'dashed', background: 'transparent' }}>
                        <Heart size={24} style={{ color: 'hsl(330, 85%, 65%)', opacity: 0.5, marginBottom: '8px' }} />
                        <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.9rem' }}>No girls in this section</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Boys Column */}
                <div className="split-column boys-column">
                  <div className="column-header">
                    <h2><User size={20} /> Boys Side</h2>
                    <span className="column-count-badge">{boysList.length} Boys</span>
                  </div>
                  <div className="friends-grid-column">
                    {boysList.length > 0 ? (
                      boysList.map(renderFriendCard)
                    ) : (
                      <div className="empty-state" style={{ padding: '40px 20px', borderStyle: 'dashed', background: 'transparent' }}>
                        <User size={24} style={{ color: 'hsl(210, 85%, 55%)', opacity: 0.5, marginBottom: '8px' }} />
                        <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.9rem' }}>No boys in this section</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="friends-grid">
                {allFilteredList.length > 0 ? (
                  allFilteredList.map(renderFriendCard)
                ) : (
                  <div className="empty-state">
                    <Users size={48} className="empty-state-icon" />
                    <h2>No matches found</h2>
                    <p>
                      We couldn't find any friends matching your current search or filters.
                    </p>
                    {(searchQuery || filterType !== 'all') && (
                      <button className="btn btn-primary glow-btn" onClick={() => { setSearchQuery(''); setFilterType('all'); }} style={{ width: 'auto', marginTop: '12px' }}>
                        Reset Filters
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Zero Friends Global Empty State */}
            {friends.length === 0 && (
              <div className="empty-state">
                <Users size={48} className="empty-state-icon" />
                <h2>Your circle is empty</h2>
                <p>Start building your inner circle today! Click below to add your first friend.</p>
                <button className="btn btn-primary glow-btn" onClick={() => setIsModalOpen(true)} style={{ width: 'auto' }}>
                  <Plus size={18} />
                  <span>Add First Friend</span>
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Add Friend Glass Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content glass" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                Add New Friend <Sparkles size={18} style={{ color: 'hsl(var(--primary))' }} />
              </h2>
              <button className="btn-close-modal" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddFriendSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. John Doe"
                  value={friendName}
                  onChange={(e) => setFriendName(e.target.value)}
                  style={{ paddingLeft: '14px' }}
                  required
                />
              </div>

              {/* Gender Segmented Control */}
              <div className="form-group">
                <label className="form-label">Gender (Section Selection)</label>
                <div className="segmented-control">
                  <button
                    type="button"
                    className={`segmented-btn ${friendGender === 'female' ? 'active girl' : ''}`}
                    onClick={() => setFriendGender('female')}
                  >
                    <Heart size={14} fill={friendGender === 'female' ? 'currentColor' : 'none'} />
                    Girls Side (Pink)
                  </button>
                  <button
                    type="button"
                    className={`segmented-btn ${friendGender === 'male' ? 'active boy' : ''}`}
                    onClick={() => setFriendGender('male')}
                  >
                    <User size={14} />
                    Boys Side (Blue)
                  </button>
                </div>
              </div>

              {/* Relationship Type Segmented Control */}
              <div className="form-group">
                <label className="form-label">Friendship Category</label>
                <div className="segmented-control">
                  <button
                    type="button"
                    className={`segmented-btn ${friendshipType === 'bestie' ? 'active primary' : ''}`}
                    onClick={() => setFriendshipType('bestie')}
                  >
                    <Heart size={14} fill={friendshipType === 'bestie' ? 'currentColor' : 'none'} style={{ color: 'red' }} />
                    Bestie
                  </button>
                  <button
                    type="button"
                    className={`segmented-btn ${friendshipType === 'friend' ? 'active primary' : ''}`}
                    onClick={() => setFriendshipType('friend')}
                  >
                    <Smile size={14} />
                    Friend
                  </button>
                  <button
                    type="button"
                    className={`segmented-btn ${friendshipType === 'hangout' ? 'active primary' : ''}`}
                    onClick={() => setFriendshipType('hangout')}
                  >
                    <Coffee size={14} />
                    Hang Out
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address (Optional)</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. john@example.com"
                  value={friendEmail}
                  onChange={(e) => setFriendEmail(e.target.value)}
                  style={{ paddingLeft: '14px' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number (Optional)</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="e.g. +1 (555) 000-0000"
                  value={friendPhone}
                  onChange={(e) => setFriendPhone(e.target.value)}
                  style={{ paddingLeft: '14px' }}
                />
              </div>

              <div className="modal-footer-actions">
                <button type="button" className="btn btn-danger" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary glow-btn" disabled={addLoading}>
                  {addLoading ? 'Adding...' : 'Add Friend'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
