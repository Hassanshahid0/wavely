import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import {
  signup,
  login,
  getMe,
  getFeed,
  createPost,
  likePost,
  commentOnPost,
  sharePost,
  searchUsers,
  getUserProfile,
  getMessages,
  sendMessage,
  updateMe,
  getAdminStats,
  toggleFollow,
  deletePost,
  markMessagesRead,
  getConversations
} from './api';
import Messages from './components/Messages';

const VIEW_HOME = 'home';
const VIEW_CREATE = 'create';
const VIEW_SAVED = 'saved';
const VIEW_MESSAGES = 'messages';
const VIEW_PROFILE = 'profile';
const VIEW_ADMIN = 'admin';

const UI = {
  card: 'bg-white border-2 border-slate-200 rounded-xl',
  cardHover: 'bg-white border-2 border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-lg transition-all duration-200',
  surface: 'bg-slate-50 border-2 border-slate-200 rounded-xl',
  btnPrimary: 'inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold border-2 border-blue-600 text-white bg-blue-600 hover:bg-blue-700 hover:border-blue-700 active:bg-blue-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
  btnSecondary: 'inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold border-2 border-blue-600 text-blue-600 bg-white hover:bg-blue-50 active:bg-blue-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
  btnGhost: 'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
  btnDanger: 'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold border-2 border-red-500 text-red-600 bg-white hover:bg-red-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
  btnSmallPrimary: 'inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold border-2 border-blue-600 text-white bg-blue-600 hover:bg-blue-700 hover:border-blue-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
  btnSmallSecondary: 'inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold border-2 border-blue-600 text-blue-600 bg-white hover:bg-blue-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
  btnIcon: 'inline-flex items-center justify-center w-10 h-10 rounded-lg border-2 border-blue-600 text-blue-600 font-bold hover:bg-blue-50 transition-all duration-200',
  input: 'w-full rounded-lg bg-white border-2 border-blue-600 px-4 py-3 text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all',
  label: 'block text-sm font-bold text-blue-600 mb-2',
};

function AuthView({ onAuth }) {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'consumer' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!form.email || !form.password) {
      setError('Email and password are required');
      setLoading(false);
      return;
    }
    if (isSignup && !form.username) {
      setError('Username is required for signup');
      setLoading(false);
      return;
    }

    try {
      const fn = isSignup ? signup : login;
      const payload = isSignup
        ? { username: form.username, email: form.email, password: form.password, role: form.role }
        : { email: form.email, password: form.password };

      const res = await fn(payload);
      const { token, user } = res.data;
      if (!token || !user) {
        setError('Invalid auth response from server');
        setLoading(false);
        return;
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      onAuth(token, user);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Authentication failed.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 flex-col justify-between p-16">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-blue-600 font-black text-2xl">W</span>
          </div>
          <span className="text-white text-3xl font-black tracking-tight">Wavely</span>
        </div>
        
        <div className="space-y-8">
          <h1 className="text-6xl font-black text-white leading-none tracking-tight">
            Share Your<br />Story.
          </h1>
          <p className="text-blue-100 text-xl font-bold max-w-md leading-relaxed">
            Connect with creators and discover amazing content from around the world.
          </p>
          <div className="flex items-center gap-12 pt-6">
            <div>
              <div className="text-4xl font-black text-white">2M+</div>
              <div className="text-blue-200 font-bold text-sm uppercase tracking-wide">Users</div>
            </div>
            <div>
              <div className="text-4xl font-black text-white">50K+</div>
              <div className="text-blue-200 font-bold text-sm uppercase tracking-wide">Creators</div>
            </div>
            <div>
              <div className="text-4xl font-black text-white">10M+</div>
              <div className="text-blue-200 font-bold text-sm uppercase tracking-wide">Posts</div>
            </div>
          </div>
        </div>
        
        <div className="text-blue-200 text-sm font-bold">
          © {new Date().getFullYear()} Wavely. All rights reserved.
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-xl">W</span>
            </div>
            <span className="text-blue-600 text-2xl font-black">Wavely</span>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-black text-blue-600 tracking-tight">
              {isSignup ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-slate-500 mt-2 font-bold">
              {isSignup ? 'Start your journey today' : 'Sign in to continue'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignup && (
              <div>
                <label className={UI.label}>Username</label>
                <input 
                  name="username" 
                  value={form.username} 
                  onChange={handleChange} 
                  placeholder="johndoe" 
                  className={UI.input} 
                />
              </div>
            )}

            <div>
              <label className={UI.label}>Email Address</label>
              <input 
                type="email" 
                name="email" 
                value={form.email} 
                onChange={handleChange} 
                placeholder="you@example.com" 
                className={UI.input} 
              />
            </div>

            <div>
              <label className={UI.label}>Password</label>
              <input 
                type="password" 
                name="password" 
                value={form.password} 
                onChange={handleChange} 
                placeholder="••••••••" 
                className={UI.input} 
              />
            </div>

            {isSignup && (
              <div>
                <label className={UI.label}>Account Type</label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  {/* EXPLORER BUTTON */}
                  <button 
                    type="button" 
                    onClick={() => setForm(p => ({ ...p, role: 'consumer' }))} 
                    className={`p-4 rounded-xl border-2 border-blue-600 text-left transition-all duration-200 ${form.role === 'consumer' 
                      ? 'bg-blue-600 shadow-lg' 
                      : 'bg-white hover:bg-blue-50'}`}
                  >
                    <div className={`font-bold ${form.role === 'consumer' ? 'text-white' : 'text-blue-600'}`}>Explorer</div>
                    <div className={`text-xs mt-1 font-bold ${form.role === 'consumer' ? 'text-blue-100' : 'text-blue-400'}`}>Browse & discover</div>
                  </button>
                  
                  {/* CREATOR BUTTON */}
                  <button 
                    type="button" 
                    onClick={() => setForm(p => ({ ...p, role: 'creator' }))} 
                    className={`p-4 rounded-xl border-2 border-blue-600 text-left transition-all duration-200 ${form.role === 'creator' 
                      ? 'bg-blue-600 shadow-lg' 
                      : 'bg-white hover:bg-blue-50'}`}
                  >
                    <div className={`font-bold ${form.role === 'creator' ? 'text-white' : 'text-blue-600'}`}>Creator</div>
                    <div className={`text-xs mt-1 font-bold ${form.role === 'creator' ? 'text-blue-100' : 'text-blue-400'}`}>Share content</div>
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-xl bg-red-50 border-2 border-red-500">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-red-600 font-bold">{error}</span>
                </div>
              </div>
            )}

            {/* SUBMIT BUTTON - Create Account / Sign In */}
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-3.5 inline-flex items-center justify-center gap-2 rounded-lg px-5 text-base font-bold border-2 border-blue-600 text-blue-800 bg-blue-600 hover:bg-blue-700 hover:border-blue-700 active:bg-blue-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="font-bold text-blue-800">Please wait...</span>
                </>
              ) : (
                <span className="font-bold text-blue-800">{isSignup ? 'Create Account' : 'Sign In'}</span>
              )}
            </button>
          </form>

          {/* TOGGLE BUTTON - Sign In / Sign Up */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <span className="text-blue-800 font-bold">
              {isSignup ? 'Already have an account?' : "Don't have an account?"}
            </span>
            <button 
              type="button" 
              onClick={() => { setIsSignup(!isSignup); setError(''); }} 
              className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold border-2 border-blue-600 text-blue-600 bg-white hover:bg-blue-50 active:bg-blue-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <span className="font-bold text-blue-600">{isSignup ? 'Sign In' : 'Sign Up'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchUsers({ onSelect, me, onToggleFollow }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    let active = true;
    searchUsers(q).then(res => { if (active) setResults(res.data || []); }).catch(() => { if (active) setResults([]); });
    return () => { active = false; };
  }, [q]);

  return (
    <div className="space-y-4">
      <input 
        value={q} 
        onChange={e => setQ(e.target.value)} 
        placeholder="Search users..." 
        className={UI.input} 
      />
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {results.map(u => (
          <div key={u._id} className="flex items-center gap-3 p-3 rounded-xl border-2 border-blue-600 bg-white hover:bg-blue-50 transition-all">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0 border-2 border-blue-600">
              {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" /> : u.username?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-blue-600 text-sm truncate">{u.username}</div>
              <div className="text-xs text-blue-400 font-bold capitalize">{u.role}</div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                type="button" 
                onClick={e => { e.stopPropagation(); onToggleFollow?.(u._id); }} 
                className={me?.following?.includes(u._id) ? UI.btnSmallSecondary : UI.btnSmallPrimary}
              >
                {me?.following?.includes(u._id) ? 'Following' : 'Follow'}
              </button>
              <button 
                type="button" 
                onClick={e => { e.stopPropagation(); onSelect?.(u); }} 
                className={UI.btnIcon}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
            </div>
          </div>
        ))}
        {results.length === 0 && q && (
          <div className="text-center py-8 text-blue-400 font-bold">No users found</div>
        )}
      </div>
    </div>
  );
}

function AppShell({ user, onLogout, socket }) {
  const [view, setView] = useState(VIEW_HOME);
  const [feed, setFeed] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [me, setMe] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ username: user.username, email: user.email, password: '', bio: '' });
  const [savedIds, setSavedIds] = useState(() => { try { return JSON.parse(localStorage.getItem('wavely_saved') || '[]'); } catch { return []; } });
  const [createImageDataUrl, setCreateImageDataUrl] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [headerQ, setHeaderQ] = useState('');
  const [headerResults, setHeaderResults] = useState([]);
  const [headerLoading, setHeaderLoading] = useState(false);
  const [showHeaderResults, setShowHeaderResults] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [stats, setStats] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    getMe().then(res => {
      const normalized = { ...res.data, followers: (res.data.followers || []).map(id => id.toString()), following: (res.data.following || []).map(id => id.toString()) };
      setMe(normalized);
      setProfileForm(p => ({ ...p, username: normalized.username, email: normalized.email, bio: normalized.bio || '' }));
    }).catch(() => {});
  }, []);

  const refreshFeed = async () => {
    try { setLoadingFeed(true); const res = await getFeed(); setFeed(res.data || []); }
    catch { setFeed([]); }
    finally { setLoadingFeed(false); }
  };

  useEffect(() => { if ([VIEW_HOME, VIEW_SAVED, VIEW_PROFILE].includes(view)) refreshFeed(); }, [view]);

  useEffect(() => {
    let active = true, timer = setTimeout(async () => {
      if (!headerQ?.trim()) { setHeaderResults([]); setHeaderLoading(false); return; }
      try { setHeaderLoading(true); const res = await searchUsers(headerQ.trim()); if (active) setHeaderResults(res.data || []); }
      catch { if (active) setHeaderResults([]); }
      finally { if (active) setHeaderLoading(false); }
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [headerQ]);

  useEffect(() => { if (view === VIEW_ADMIN && user.role === 'admin') getAdminStats().then(res => setStats(res.data)).catch(() => setStats(null)); }, [view, user.role]);

  useEffect(() => {
    getConversations().then(res => {
      const counts = {};
      (res.data || []).forEach(c => { counts[c.user._id || c.user.id] = c.unreadCount || 0; });
      setUnreadCounts(counts);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handler = msg => {
      if (msg.to === user.id) setUnreadCounts(p => ({ ...p, [msg.from]: (p[msg.from] || 0) + 1 }));
    };
    const readHandler = p => { if (p?.from) setUnreadCounts(prev => ({ ...prev, [p.from]: 0 })); };
    socket.on('message:new', handler);
    socket.on('message:read', readHandler);
    return () => { socket.off('message:new', handler); socket.off('message:read', readHandler); };
  }, [socket, user.id]);

  const openProfile = async u => {
    try { const res = await getUserProfile(u._id || u.id); setProfileUser(res.data); setView(VIEW_PROFILE); }
    catch { alert('Failed to load profile'); }
  };

  const openChat = async u => {
    setUnreadCounts(p => ({ ...p, [u._id]: 0 }));
    try { await markMessagesRead(u._id || u.id); } catch {}
    setView(VIEW_MESSAGES);
  };

  const handleLike = async postId => { try { await likePost(postId); refreshFeed(); } catch {} };

  const handleToggleFollow = async targetId => {
    try { const res = await toggleFollow(targetId); setMe(p => p ? { ...p, following: res.data.following } : p); }
    catch {}
  };

  const handleShare = async post => {
    try {
      const full = me || (await getMe().then(r => r.data));
      if (!full?.following?.length) { alert('You are not following anyone yet.'); return; }
      if (!window.confirm(`Share with ${full.following.length} followers?`)) return;
      await Promise.all(full.following.map(id => sendMessage(id, { text: post.caption ? `Check this out: "${post.caption.slice(0, 50)}..."` : 'Shared a post', postId: post._id })));
      await sharePost(post._id);
      refreshFeed();
      alert('Shared successfully!');
    } catch { alert('Failed to share.'); }
  };

  const handleToggleSave = postId => {
    setSavedIds(prev => {
      const set = new Set(prev);
      set.has(postId) ? set.delete(postId) : set.add(postId);
      const arr = Array.from(set);
      localStorage.setItem('wavely_saved', JSON.stringify(arr));
      return arr;
    });
  };

  const handleCreatePost = async e => {
    e.preventDefault();
    const caption = new FormData(e.target).get('caption');
    if (!caption && !createImageDataUrl) return;
    try {
      const res = await createPost({ caption, imageUrl: createImageDataUrl || '' });
      setFeed(p => [res.data, ...p]);
      e.target.reset();
      setCreateImageDataUrl(null);
      alert('Post created!');
      setView(VIEW_HOME);
    } catch {}
  };

  const handleProfileSave = async e => {
    e.preventDefault();
    try {
      const payload = { username: profileForm.username, email: profileForm.email, bio: profileForm.bio };
      if (profileForm.password?.trim()) payload.password = profileForm.password.trim();
      const res = await updateMe(payload);
      setMe(res.data);
      localStorage.setItem('user', JSON.stringify({ ...user, username: res.data.username, email: res.data.email }));
      setIsEditingProfile(false);
    } catch { alert('Failed to update profile'); }
  };

  const handleAvatarChange = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => { try { const res = await updateMe({ avatarUrl: reader.result }); setMe(res.data); } catch { alert('Failed to update avatar'); } };
    reader.readAsDataURL(file);
  };

  const handleDeletePost = async postId => {
    if (!window.confirm('Delete this post?')) return;
    try { await deletePost(postId); setFeed(p => p.filter(x => x._id !== postId)); } catch {}
  };

  const currentUser = me || user;
  const safeFeed = (feed || []).filter(p => p?.author?._id);
  const savedPosts = safeFeed.filter(p => savedIds.includes(p._id));
  const displayedUser = profileUser?.user || me || user;
  const displayedFollowers = profileUser?.user?.followers || me?.followers || [];
  const displayedFollowing = profileUser?.user?.following || me?.following || [];
  const profilePosts = profileUser?.posts || safeFeed.filter(p => {
    const aid = p.author?._id || p.author;
    return aid && displayedUser && (aid.toString?.() === (displayedUser._id || displayedUser.id)?.toString());
  });
  const totalUnread = Object.values(unreadCounts).reduce((s, n) => s + (n || 0), 0);

  const navItems = [
    { id: VIEW_HOME, label: 'Home', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )},
    { id: VIEW_CREATE, label: 'Create', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
      </svg>
    )},
    { id: VIEW_SAVED, label: 'Saved', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    )},
    { id: VIEW_MESSAGES, label: 'Messages', badge: totalUnread, icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    )},
    { id: VIEW_PROFILE, label: 'Profile', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )}
  ];
  
  if (user.role === 'admin') navItems.push({ 
    id: VIEW_ADMIN, 
    label: 'Admin', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b-2 border-blue-600">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <button 
              onClick={() => { setProfileUser(null); setView(VIEW_HOME); }} 
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-black text-lg">W</span>
              </div>
              <span className="text-blue-600 text-2xl font-black tracking-tight hidden sm:block">Wavely</span>
            </button>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-2">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setProfileUser(null); setView(item.id); }}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border-2 border-blue-600 transition-all duration-200 ${
                    view === item.id 
                      ? 'text-white bg-blue-600' 
                      : 'text-blue-600 bg-white hover:bg-blue-50'
                  }`}
                >
                  {item.icon}
                  <span className="font-bold">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-black rounded-full flex items-center justify-center border-2 border-white">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative hidden sm:block">
                <input
                  value={headerQ}
                  onChange={e => { setHeaderQ(e.target.value); setShowHeaderResults(true); }}
                  onFocus={() => setShowHeaderResults(true)}
                  onBlur={() => setTimeout(() => setShowHeaderResults(false), 200)}
                  placeholder="Search..."
                  className="w-48 lg:w-64 rounded-xl bg-white border-2 border-blue-600 px-4 py-2.5 text-sm font-bold text-blue-600 placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                {showHeaderResults && (headerLoading || headerResults.length > 0 || headerQ) && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-white border-2 border-blue-600 rounded-xl shadow-xl z-50 max-h-80 overflow-hidden">
                    <div className="p-3">
                      {headerLoading && (
                        <div className="flex items-center justify-center py-6">
                          <svg className="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        </div>
                      )}
                      {!headerLoading && headerResults.length === 0 && headerQ && (
                        <div className="text-center py-6 text-blue-400 font-bold">No results found</div>
                      )}
                      {!headerLoading && headerResults.map(u => (
                        <div key={u._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 border-2 border-transparent hover:border-blue-300 transition-all">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border-2 border-blue-600">
                            {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" /> : u.username?.[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-blue-600 truncate">{u.username}</div>
                            <div className="text-xs text-blue-400 font-bold capitalize">{u.role}</div>
                          </div>
                          <button
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => { setShowHeaderResults(false); openProfile(u); }}
                            className={UI.btnSmallSecondary}
                          >
                            View
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User */}
              <div className="flex items-center gap-3 pl-4 border-l-2 border-blue-600">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border-2 border-blue-600">
                  {currentUser.avatarUrl ? <img src={currentUser.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" /> : currentUser.username?.[0]?.toUpperCase()}
                </div>
                <span className="text-sm font-bold text-blue-600 hidden lg:block">{currentUser.username}</span>
                <button onClick={onLogout} className={UI.btnDanger}>Logout</button>
              </div>

              {/* Mobile Menu */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`md:hidden ${UI.btnIcon}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t-2 border-blue-600 bg-white">
            <div className="p-4 space-y-2">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setProfileUser(null); setView(item.id); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold border-2 border-blue-600 transition-all ${
                    view === item.id 
                      ? 'text-white bg-blue-600' 
                      : 'text-blue-600 bg-white hover:bg-blue-50'
                  }`}
                >
                  {item.icon}
                  <span className="font-bold">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="ml-auto px-2.5 py-1 bg-red-500 text-white text-xs font-black rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {/* HOME */}
        {view === VIEW_HOME && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Feed */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-black text-blue-600">Your Feed</h1>
                <button onClick={refreshFeed} className={UI.btnSecondary}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="font-bold">Refresh</span>
                </button>
              </div>

              {loadingFeed ? (
                <div className="flex items-center justify-center py-20">
                  <svg className="animate-spin h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              ) : safeFeed.length === 0 ? (
                <div className={`${UI.card} p-16 text-center`}>
                  <svg className="w-16 h-16 text-blue-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <h3 className="text-xl font-bold text-blue-600 mb-2">No posts yet</h3>
                  <p className="text-blue-400 font-bold">Follow some creators to see their posts here!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {safeFeed.map(post => {
                    const isSaved = savedIds.includes(post._id);
                    return (
                      <article key={post._id} className={UI.card}>
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b-2 border-slate-100">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg border-2 border-blue-600">
                              {post.author?.avatarUrl ? <img src={post.author.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" /> : post.author?.username?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-blue-600">{post.author?.username}</div>
                              <div className="text-xs text-blue-400 font-bold capitalize">{post.author?.role}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {(post.author?._id === currentUser.id || currentUser.role === 'admin') && (
                              <button onClick={() => handleDeletePost(post._id)} className={UI.btnDanger}>
                                <span className="font-bold">Delete</span>
                              </button>
                            )}
                            {post.author?._id && post.author._id !== currentUser.id && (
                              <button 
                                onClick={() => handleToggleFollow(post.author._id)} 
                                className={me?.following?.includes(post.author._id) ? UI.btnSecondary : UI.btnPrimary}
                              >
                                <span className="font-bold">{me?.following?.includes(post.author._id) ? 'Following' : 'Follow'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {/* Image */}
                        {post.imageUrl && (
                          <div className="bg-slate-50">
                            <img src={post.imageUrl} alt="" className="w-full max-h-[500px] object-cover" />
                          </div>
                        )}
                        
                        {/* Content */}
                        <div className="p-5">
                          {/* Actions */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <button onClick={() => handleLike(post._id)} className={UI.btnGhost}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                <span className="font-bold">{post.likes?.length || 0}</span>
                              </button>
                              <button className={UI.btnGhost}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <span className="font-bold">{post.comments?.length || 0}</span>
                              </button>
                              <button onClick={() => handleShare(post)} className={UI.btnGhost}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                                <span className="font-bold">{post.shares || 0}</span>
                              </button>
                            </div>
                            <button onClick={() => handleToggleSave(post._id)} className={`${UI.btnGhost} ${isSaved ? 'bg-blue-600 text-white border-blue-600' : ''}`}>
                              <svg className="w-5 h-5" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                              </svg>
                            </button>
                          </div>
                          
                          {/* Caption */}
                          {post.caption && (
                            <p className="text-slate-700 mb-4">
                              <span className="font-bold text-blue-600 mr-2">{post.author?.username}</span>
                              <span className="font-medium">{post.caption}</span>
                            </p>
                          )}
                          
                          {/* Comments */}
                          {post.comments?.length > 0 && (
                            <div className="space-y-2 mb-4 max-h-32 overflow-y-auto">
                              {post.comments.slice(-3).map(c => (
                                <div key={c._id || c.createdAt} className="text-sm">
                                  <span className="font-bold text-blue-600 mr-2">{c.user?.username}</span>
                                  <span className="text-slate-600 font-medium">{c.text}</span>
                                </div>
                              ))}
                              {post.comments.length > 3 && (
                                <button className={UI.btnSmallSecondary}>
                                  <span className="font-bold">View all {post.comments.length} comments</span>
                                </button>
                              )}
                            </div>
                          )}
                          
                          {/* Comment Form */}
                          <form 
                            className="flex items-center gap-3 pt-4 border-t-2 border-slate-100" 
                            onSubmit={async e => {
                              e.preventDefault();
                              const text = new FormData(e.target).get('text');
                              if (!text) return;
                              try { 
                                const res = await commentOnPost(post._id, text); 
                                setFeed(p => p.map(x => x._id === post._id ? { ...x, comments: [...(x.comments || []), res.data] } : x)); 
                                e.target.reset(); 
                              } catch {}
                            }}
                          >
                            <input name="text" placeholder="Add a comment..." className="flex-1 text-sm font-bold bg-transparent border-2 border-blue-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-blue-300 text-blue-600" />
                            <button type="submit" className={UI.btnSmallPrimary}>
                              <span className="font-bold">Post</span>
                            </button>
                          </form>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="hidden lg:block lg:col-span-4 space-y-6">
              {/* Profile Card */}
              <div className={UI.card}>
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl border-2 border-blue-600">
                      {currentUser.avatarUrl ? <img src={currentUser.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" /> : currentUser.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-blue-600 text-lg">{currentUser.username}</div>
                      <div className="text-sm text-blue-400 font-bold capitalize">{currentUser.role}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center py-4 border-y-2 border-slate-100">
                    <div>
                      <div className="font-black text-xl text-blue-600">{safeFeed.filter(p => (p.author?._id || p.author)?.toString() === (currentUser._id || currentUser.id)?.toString()).length}</div>
                      <div className="text-xs text-blue-400 font-bold uppercase">Posts</div>
                    </div>
                    <div>
                      <div className="font-black text-xl text-blue-600">{me?.followers?.length || 0}</div>
                      <div className="text-xs text-blue-400 font-bold uppercase">Followers</div>
                    </div>
                    <div>
                      <div className="font-black text-xl text-blue-600">{me?.following?.length || 0}</div>
                      <div className="text-xs text-blue-400 font-bold uppercase">Following</div>
                    </div>
                  </div>
                  <button onClick={() => setView(VIEW_PROFILE)} className={`w-full mt-4 ${UI.btnSecondary}`}>
                    <span className="font-bold">View Profile</span>
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className={UI.card}>
                <div className="p-6">
                  <h3 className="font-bold text-blue-600 text-lg mb-4">Find People</h3>
                  <SearchUsers onSelect={openChat} me={me} onToggleFollow={handleToggleFollow} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CREATE */}
        {view === VIEW_CREATE && (
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-black text-blue-600 mb-8">Create New Post</h1>
            <div className={UI.card}>
              <div className="p-8">
                {user.role !== 'creator' && user.role !== 'admin' ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-blue-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <h3 className="text-xl font-bold text-blue-600 mb-2">Creator Access Only</h3>
                    <p className="text-blue-400 font-bold">Upgrade to a creator account to start posting</p>
                  </div>
                ) : (
                  <form onSubmit={handleCreatePost} className="space-y-6">
                    <div>
                      <label className={UI.label}>Caption</label>
                      <textarea 
                        name="caption" 
                        rows={4} 
                        placeholder="What's on your mind?" 
                        className={`${UI.input} resize-none`} 
                      />
                    </div>
                    <div>
                      <label className={UI.label}>Image</label>
                      <div className="mt-2">
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="block w-full text-sm font-bold text-blue-600 file:mr-4 file:py-2.5 file:px-5 file:rounded-lg file:border-2 file:border-blue-600 file:text-sm file:font-bold file:bg-white file:text-blue-600 hover:file:bg-blue-50 cursor-pointer" 
                          onChange={e => {
                            const f = e.target.files?.[0]; 
                            if (!f) { setCreateImageDataUrl(null); return; }
                            const r = new FileReader(); 
                            r.onload = () => setCreateImageDataUrl(r.result); 
                            r.readAsDataURL(f);
                          }} 
                        />
                        {createImageDataUrl && (
                          <div className="mt-4 relative">
                            <img src={createImageDataUrl} alt="Preview" className="w-full max-h-72 object-cover rounded-xl border-2 border-blue-600" />
                            <button 
                              type="button" 
                              onClick={() => setCreateImageDataUrl(null)} 
                              className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-white border-2 border-red-500 text-red-500 font-bold hover:bg-red-50 flex items-center justify-center transition-all"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button type="button" onClick={() => setView(VIEW_HOME)} className={UI.btnSecondary}>
                        <span className="font-bold">Cancel</span>
                      </button>
                      <button type="submit" className={`flex-1 ${UI.btnPrimary}`}>
                        <span className="font-bold">Publish Post</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SAVED */}
        {view === VIEW_SAVED && (
          <div>
            <h1 className="text-2xl font-black text-blue-600 mb-8">Saved Posts</h1>
            {savedPosts.length === 0 ? (
              <div className={`${UI.card} p-16 text-center`}>
                <svg className="w-16 h-16 text-blue-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <h3 className="text-xl font-bold text-blue-600 mb-2">No saved posts</h3>
                <p className="text-blue-400 font-bold">Save posts to view them here later</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedPosts.map(post => (
                  <article key={post._id} className={UI.cardHover}>
                    {post.imageUrl && (
                      <img src={post.imageUrl} alt="" className="w-full h-48 object-cover rounded-t-xl" />
                    )}
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold border-2 border-blue-600">
                          {post.author?.avatarUrl ? <img src={post.author.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" /> : post.author?.username?.[0]?.toUpperCase()}
                        </div>
                        <span className="font-bold text-blue-600">{post.author?.username}</span>
                      </div>
                      {post.caption && <p className="text-sm text-blue-500 line-clamp-2 font-bold">{post.caption}</p>}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MESSAGES */}
        {view === VIEW_MESSAGES && (
          <div>
            <h1 className="text-2xl font-black text-blue-600 mb-8">Messages</h1>
            <div className={`${UI.card} h-[calc(100vh-280px)] md:h-[600px] overflow-hidden`}>
              <Messages 
                currentUser={{ id: user.id || user._id, _id: user.id || user._id, username: user.username, avatarUrl: user.avatarUrl || me?.avatarUrl }} 
                socket={socket} 
              />
            </div>
          </div>
        )}

        {/* PROFILE */}
        {view === VIEW_PROFILE && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className={UI.card}>
              <div className="p-8">
                <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center">
                  <div className="relative">
                    <div className="w-28 h-28 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-4xl border-4 border-blue-600">
                      {displayedUser?.avatarUrl 
                        ? <img src={displayedUser.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" /> 
                        : displayedUser?.username?.[0]?.toUpperCase()
                      }
                    </div>
                    {me && displayedUser && (me._id || me.id)?.toString() === (displayedUser._id || displayedUser.id)?.toString() && (
                      <label className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center cursor-pointer hover:bg-blue-700 border-4 border-white shadow-lg transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                      </label>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-4 mb-6">
                      <h1 className="text-3xl font-black text-blue-600">{displayedUser?.username}</h1>
                      {me && displayedUser && (me._id || me.id)?.toString() === (displayedUser._id || displayedUser.id)?.toString() ? (
                        <button onClick={() => setIsEditingProfile(v => !v)} className={UI.btnSecondary}>
                          <span className="font-bold">{isEditingProfile ? 'Cancel' : 'Edit Profile'}</span>
                        </button>
                      ) : (
                        <div className="flex gap-3">
                          <button 
                            onClick={() => handleToggleFollow(displayedUser._id || displayedUser.id)} 
                            className={me?.following?.includes((displayedUser._id || displayedUser.id)?.toString()) ? UI.btnSecondary : UI.btnPrimary}
                          >
                            <span className="font-bold">{me?.following?.includes((displayedUser._id || displayedUser.id)?.toString()) ? 'Following' : 'Follow'}</span>
                          </button>
                          <button onClick={() => openChat(displayedUser)} className={UI.btnSecondary}>
                            <span className="font-bold">Message</span>
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-8 mb-6">
                      <div><span className="font-black text-blue-600 text-xl">{profilePosts?.length || 0}</span> <span className="text-blue-400 font-bold">posts</span></div>
                      <div><span className="font-black text-blue-600 text-xl">{displayedFollowers?.length || 0}</span> <span className="text-blue-400 font-bold">followers</span></div>
                      <div><span className="font-black text-blue-600 text-xl">{displayedFollowing?.length || 0}</span> <span className="text-blue-400 font-bold">following</span></div>
                    </div>
                    
                    {!isEditingProfile && (
                      <p className="text-blue-500 font-bold">{me?.bio || 'No bio yet.'}</p>
                    )}
                  </div>
                </div>
                
                {isEditingProfile && (
                  <form onSubmit={handleProfileSave} className="mt-8 pt-8 border-t-2 border-slate-200 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className={UI.label}>Username</label>
                        <input value={profileForm.username} onChange={e => setProfileForm(p => ({ ...p, username: e.target.value }))} className={UI.input} />
                      </div>
                      <div>
                        <label className={UI.label}>Email</label>
                        <input type="email" value={profileForm.email} onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))} className={UI.input} />
                      </div>
                    </div>
                    <div>
                      <label className={UI.label}>New Password</label>
                      <input type="password" value={profileForm.password} onChange={e => setProfileForm(p => ({ ...p, password: e.target.value }))} placeholder="Leave blank to keep current" className={UI.input} />
                    </div>
                    <div>
                      <label className={UI.label}>Bio</label>
                      <textarea rows={3} value={profileForm.bio} onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))} className={`${UI.input} resize-none`} />
                    </div>
                    <button type="submit" className={UI.btnPrimary}>
                      <span className="font-bold">Save Changes</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
            
            {/* Profile Posts */}
            <div>
              <h2 className="text-xl font-bold text-blue-600 mb-6">Posts</h2>
              {!profilePosts?.length ? (
                <div className={`${UI.card} p-16 text-center`}>
                  <svg className="w-16 h-16 text-blue-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="text-xl font-bold text-blue-600 mb-2">No posts yet</h3>
                  <p className="text-blue-400 font-bold">Posts will appear here</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {profilePosts.map(p => (
                    <div key={p._id} className="aspect-square bg-blue-100 rounded-xl overflow-hidden border-2 border-blue-200 hover:border-blue-600 transition-all">
                      {p.imageUrl 
                        ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" /> 
                        : <div className="w-full h-full flex items-center justify-center p-4 bg-blue-50"><p className="text-xs text-blue-500 text-center line-clamp-3 font-bold">{p.caption}</p></div>
                      }
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ADMIN */}
        {view === VIEW_ADMIN && user.role === 'admin' && (
          <div className="space-y-8">
            <h1 className="text-2xl font-black text-blue-600">Admin Dashboard</h1>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {stats ? (
                <>
                  <div className={UI.card}>
                    <div className="p-6">
                      <div className="text-4xl font-black text-blue-600">{stats.users}</div>
                      <div className="text-sm text-blue-400 font-bold uppercase mt-2">Total Users</div>
                    </div>
                  </div>
                  <div className={UI.card}>
                    <div className="p-6">
                      <div className="text-4xl font-black text-blue-600">{stats.posts}</div>
                      <div className="text-sm text-blue-400 font-bold uppercase mt-2">Total Posts</div>
                    </div>
                  </div>
                  <div className={UI.card}>
                    <div className="p-6">
                      <div className="text-4xl font-black text-blue-600">{stats.likes}</div>
                      <div className="text-sm text-blue-400 font-bold uppercase mt-2">Total Likes</div>
                    </div>
                  </div>
                  <div className={UI.card}>
                    <div className="p-6">
                      <div className="text-4xl font-black text-blue-600">{stats.messages}</div>
                      <div className="text-sm text-blue-400 font-bold uppercase mt-2">Messages</div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="col-span-4 flex items-center justify-center py-16">
                  <svg className="animate-spin h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              )}
            </div>
            
            {stats && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Users by Role */}
                <div className={UI.card}>
                  <div className="p-6">
                    <h3 className="font-bold text-blue-600 text-lg mb-6">Users by Role</h3>
                    <div className="space-y-5">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-blue-500 font-bold">Explorers</span>
                          <span className="font-bold text-blue-600">{stats.roles?.consumer || 0}</span>
                        </div>
                        <div className="w-full bg-blue-100 rounded-full h-3">
                          <div className="bg-blue-600 h-3 rounded-full transition-all" style={{width: `${stats.users ? ((stats.roles?.consumer || 0) / stats.users * 100) : 0}%`}}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-blue-500 font-bold">Creators</span>
                          <span className="font-bold text-blue-600">{stats.roles?.creator || 0}</span>
                        </div>
                        <div className="w-full bg-blue-100 rounded-full h-3">
                          <div className="bg-blue-600 h-3 rounded-full transition-all" style={{width: `${stats.users ? ((stats.roles?.creator || 0) / stats.users * 100) : 0}%`}}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-blue-500 font-bold">Admins</span>
                          <span className="font-bold text-blue-600">{stats.roles?.admin || 0}</span>
                        </div>
                        <div className="w-full bg-blue-100 rounded-full h-3">
                          <div className="bg-blue-600 h-3 rounded-full transition-all" style={{width: `${stats.users ? ((stats.roles?.admin || 0) / stats.users * 100) : 0}%`}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Engagement */}
                <div className={UI.card}>
                  <div className="p-6">
                    <h3 className="font-bold text-blue-600 text-lg mb-6">Engagement</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border-2 border-blue-600">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center border-2 border-blue-600">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </div>
                          <span className="text-blue-600 font-bold">Comments</span>
                        </div>
                        <span className="text-2xl font-black text-blue-600">{stats.comments || 0}</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border-2 border-blue-600">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center border-2 border-blue-600">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                          </div>
                          <span className="text-blue-600 font-bold">Shares</span>
                        </div>
                        <span className="text-2xl font-black text-blue-600">{stats.shares || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Actions */}
            {stats && (
              <div className={UI.card}>
                <div className="p-6">
                  <h3 className="font-bold text-blue-600 text-lg mb-6">Quick Actions</h3>
                  <div className="flex flex-wrap gap-4">
                    <button className={UI.btnSecondary}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span className="font-bold">Manage Users</span>
                    </button>
                    <button className={UI.btnSecondary}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="font-bold">View Reports</span>
                    </button>
                    <button className={UI.btnSecondary}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="font-bold">Settings</span>
                    </button>
                    <button className={UI.btnSecondary}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span className="font-bold">Export Data</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-blue-600 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-sm">W</span>
              </div>
              <span className="text-blue-600 font-bold">Wavely</span>
            </div>
            <div className="flex items-center gap-4">
              <button className={UI.btnSmallSecondary}>
                <span className="font-bold">About</span>
              </button>
              <button className={UI.btnSmallSecondary}>
                <span className="font-bold">Help</span>
              </button>
              <button className={UI.btnSmallSecondary}>
                <span className="font-bold">Privacy</span>
              </button>
              <button className={UI.btnSmallSecondary}>
                <span className="font-bold">Terms</span>
              </button>
            </div>
            <div className="text-sm text-blue-400 font-bold">
              © {new Date().getFullYear()} Wavely
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => { 
    try { 
      return JSON.parse(localStorage.getItem('user') || 'null'); 
    } catch { 
      localStorage.clear(); 
      return null; 
    } 
  });
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token) { 
      socket?.disconnect(); 
      setSocket(null); 
      return; 
    }
    const base = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
    const s = io(base, { auth: { token } });
    setSocket(s);
    return () => s.disconnect();
  }, [token]);

  const handleAuth = (tok, u) => { 
    setToken(tok); 
    setUser(u); 
  };
  
  const handleLogout = () => { 
    localStorage.clear(); 
    setToken(null); 
    setUser(null); 
  };

  if (!token || !user) return <AuthView onAuth={handleAuth} />;
  return <AppShell user={user} onLogout={handleLogout} socket={socket} />;
}

export default App;