
import React, { useEffect, useState, useRef } from 'react';
import MessageComposer from './MessageComposer';
import { getMessages, sendMessage, markMessagesRead, searchUsers, getConversations } from '../api';

export default function Messages({ users: propUsers, currentUser, socket }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [pendingMedia, setPendingMedia] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadCounts, setUnreadCounts] = useState({});
  const [conversations, setConversations] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConversationList, setShowConversationList] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimerRef = useRef(null);
  const [typingUsers, setTypingUsers] = useState({});
  const scrollRef = useRef();

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const res = await getConversations();
      const convos = res.data || [];
      setConversations(convos);
      
      const counts = {};
      convos.forEach((c) => {
        const oderId = c.user._id || c.user.id;
        counts[oderId] = c.unreadCount || 0;
      });
      setUnreadCounts(counts);
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!socket) return;
    
    const handleNewMessage = (m) => {
      const oderId = m.from === currentUser.id ? m.to : m.from;
      
      if (selectedUser && (selectedUser._id === oderId || selectedUser.id === oderId)) {
        setMessages((prev) => {
          if (prev.some((msg) => msg._id === m._id)) return prev;
          return [...prev, m];
        });
        if (m.from !== currentUser.id) {
          markMessagesRead(oderId).catch(() => {});
        }
      } else if (m.to === currentUser.id) {
        setUnreadCounts((p) => ({ ...p, [m.from]: (p[m.from] || 0) + 1 }));
      }
      
      loadConversations();
    };
    
    const typingHandler = (p) => {
      if (!p || !p.from) return;
      setTypingUsers((prev) => ({ ...prev, [p.from]: !!p.typing }));
      setTimeout(() => {
        setTypingUsers((prev) => ({ ...prev, [p.from]: false }));
      }, 3000);
    };
    
    const readHandler = (p) => {
      if (!p || !p.from) return;
      setUnreadCounts((prev) => ({ ...prev, [p.from]: 0 }));
      setMessages((prev) => prev.map((m) => 
        m.to === p.from ? { ...m, read: true } : m
      ));
    };
    
    socket.on('message:new', handleNewMessage);
    socket.on('typing', typingHandler);
    socket.on('message:read', readHandler);
    
    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('typing', typingHandler);
      socket.off('message:read', readHandler);
    };
  }, [socket, selectedUser, currentUser.id]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await searchUsers(searchTerm);
        const filtered = (res.data || []).filter(
          (u) => u._id !== currentUser.id && u._id !== currentUser._id
        );
        setSearchResults(filtered);
      } catch (err) {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchTerm, currentUser.id]);

  useEffect(() => {
    try { 
      scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); 
    } catch {}
  }, [messages]);

  const openConversation = async (u) => {
    const oderId = u._id || u.id;
    setSelectedUser(u);
    setShowConversationList(false);
    setSearchTerm('');
    setSearchResults([]);
    
    try {
      const res = await getMessages(oderId);
      setMessages(res.data || []);
      await markMessagesRead(oderId);
      setUnreadCounts((p) => ({ ...p, [oderId]: 0 }));
      setConversations((prev) => 
        prev.map((c) => 
          (c.user._id || c.user.id) === oderId ? { ...c, unreadCount: 0 } : c
        )
      );
    } catch (err) {
      console.error('Failed to load messages:', err);
      setMessages([]);
    }
  };

  const handleSend = async () => {
    if (!selectedUser) return;
    const toId = selectedUser._id || selectedUser.id;
    if (!text.trim() && !pendingMedia) return;
    
    const body = { text: text.trim() };
    if (pendingMedia) body.mediaUrl = pendingMedia;
    
    setText('');
    setPendingMedia(null);
    
    try {
      await sendMessage(toId, body);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return d.toLocaleDateString([], { weekday: 'short' });
    } else {
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const totalUnread = Object.values(unreadCounts).reduce((sum, n) => sum + (n || 0), 0);
  const displayList = searchTerm.trim() ? searchResults : conversations;

  return (
    <div className="h-[100dvh] md:h-[650px] w-full max-w-6xl mx-auto flex flex-col-reverse md:flex-row bg-white md:rounded-lg overflow-hidden shadow-sm border border-slate-200">
      
      {/* Chat Area - Now on the LEFT on desktop */}
      <div className="flex-1 flex flex-col h-full bg-white order-1 md:order-2">
        
        {selectedUser && !showConversationList && (
          <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-slate-200 px-4 py-3">
            <button 
              type="button" 
              onClick={() => setShowConversationList(true)} 
              className="flex items-center gap-2 text-blue-600 font-medium text-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to chats
            </button>
          </div>
        )}

        {selectedUser ? (
          <>
            {/* Header - Bottom aligned info */}
            <div className="flex-shrink-0 px-6 py-5 bg-white border-b border-slate-200 mt-12 md:mt-0">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`
                    h-12 w-12 rounded-full overflow-hidden flex items-center justify-center text-lg font-semibold border-2 border-blue-100
                    ${selectedUser.avatarUrl ? '' : 'bg-blue-600 text-white'}
                  `}>
                    {selectedUser.avatarUrl 
                      ? <img src={selectedUser.avatarUrl} alt="" className="h-full w-full object-cover" /> 
                      : (selectedUser.username || '?')[0]?.toUpperCase()
                    }
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-900 text-lg">{selectedUser.username}</h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {typingUsers[selectedUser._id || selectedUser.id] ? (
                        <span className="text-blue-600 font-medium">Typing...</span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Active now
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-full text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </button>
                  <button className="p-2 rounded-full text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button className="p-2 rounded-full text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-6 py-6 bg-slate-50">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-slate-800 mb-1">No messages yet</h3>
                  <p className="text-sm text-slate-500">Send a message to start chatting with {selectedUser.username}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((m, idx) => {
                    const mine = m.from === currentUser.id || m.from === currentUser._id;
                    const showAvatar = !mine && (idx === 0 || messages[idx - 1].from !== m.from);
                    
                    return (
                      <div key={m._id || m.createdAt || idx} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex items-end gap-2 max-w-[75%] ${mine ? 'flex-row-reverse' : 'flex-row'}`}>
                          {!mine && (
                            <div className="flex-shrink-0 mb-5">
                              {showAvatar ? (
                                <div className={`
                                  h-8 w-8 rounded-full overflow-hidden flex items-center justify-center text-xs font-semibold
                                  ${selectedUser.avatarUrl ? '' : 'bg-blue-600 text-white'}
                                `}>
                                  {selectedUser.avatarUrl 
                                    ? <img src={selectedUser.avatarUrl} alt="" className="h-full w-full object-cover" /> 
                                    : (selectedUser.username || '?')[0]?.toUpperCase()
                                  }
                                </div>
                              ) : (
                                <div className="w-8" />
                              )}
                            </div>
                          )}
                          
                          <div>
                            {m.post && (
                              <div className={`mb-2 p-3 rounded-lg border ${mine ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'}`}>
                                {m.post.imageUrl && (
                                  <img src={m.post.imageUrl} alt="" className="w-full max-w-48 h-24 object-cover rounded mb-2" />
                                )}
                                <p className="text-xs text-slate-600 line-clamp-2">{m.post.caption || 'Shared post'}</p>
                              </div>
                            )}
                            
                            {m.mediaUrl && (
                              <div className="mb-2 rounded-lg overflow-hidden border border-slate-200">
                                <img src={m.mediaUrl} alt="" className="max-h-64 w-auto object-cover" />
                              </div>
                            )}
                            
                            {m.text && (
                              <div className={`
                                px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                                ${mine 
                                  ? 'bg-blue-600 text-white rounded-br-sm' 
                                  : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm'
                                }
                              `}>
                                <p className="break-words whitespace-pre-wrap">{m.text}</p>
                              </div>
                            )}
                            
                            <div className={`flex items-center gap-1.5 mt-1.5 text-xs text-slate-400 ${mine ? 'justify-end' : 'justify-start'}`}>
                              <span>{formatTime(m.createdAt)}</span>
                              {mine && (
                                <span className={m.read ? 'text-blue-500' : 'text-slate-400'}>
                                  {m.read ? '✓✓' : '✓'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div ref={scrollRef} />
            </div>

            {/* Message Input - Clean bottom bar */}
            <div className="flex-shrink-0 px-6 py-4 bg-white border-t border-slate-200">
              <MessageComposer 
                currentUser={currentUser} 
                toUser={selectedUser} 
                onSend={handleSend} 
                pendingMedia={pendingMedia} 
                setPendingMedia={setPendingMedia} 
                value={text} 
                onChange={setText} 
                socket={socket} 
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">Select a conversation</h2>
              <p className="text-slate-500 text-sm">Choose from your existing conversations or search for someone new to chat with.</p>
            </div>
          </div>
        )}
      </div>

      {/* Conversation List - Now on the RIGHT on desktop */}
      {(showConversationList || !selectedUser) && (
        <div className={`
          ${selectedUser ? 'absolute md:relative' : 'relative'} 
          z-20 w-full md:w-[340px] h-full 
          bg-white
          md:border-l border-slate-200
          flex flex-col
          order-2 md:order-1
        `}>
          {/* Search Header - Top aligned */}
          <div className="p-5 border-b border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900">Messages</h1>
                {totalUnread > 0 && (
                  <p className="text-sm text-blue-600 font-medium mt-0.5">{totalUnread} unread</p>
                )}
              </div>
              <button 
                onClick={() => setSearchTerm(searchTerm ? '' : ' ')}
                className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-100 border-0 rounded-full text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {loading && !searchTerm ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              </div>
            ) : isSearching ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              </div>
            ) : displayList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-700 mb-1">
                  {searchTerm ? 'No results found' : 'No conversations'}
                </p>
                <p className="text-xs text-slate-500">
                  {searchTerm ? 'Try a different search term' : 'Start a new conversation'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {displayList.map((item) => {
                  const user = item.user || item;
                  const oderId = user._id || user.id;
                  const isSelected = selectedUser && (selectedUser._id === oderId || selectedUser.id === oderId);
                  const unread = unreadCounts[oderId] || item.unreadCount || 0;
                  const isTyping = typingUsers[oderId];
                  const lastMessage = item.lastMessage;
                  
                  return (
                    <button
                      key={oderId}
                      onClick={() => openConversation(user)}
                      className={`
                        w-full px-5 py-4 flex items-center gap-3 transition-colors text-left
                        ${isSelected 
                          ? 'bg-blue-50 border-l-4 border-l-blue-600' 
                          : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                        }
                      `}
                    >
                      <div className="relative flex-shrink-0">
                        <div className={`
                          h-12 w-12 rounded-full overflow-hidden flex items-center justify-center text-base font-semibold
                          ${user.avatarUrl ? '' : 'bg-blue-600 text-white'}
                        `}>
                          {user.avatarUrl 
                            ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> 
                            : (user.username || '?')[0]?.toUpperCase()
                          }
                        </div>
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className={`font-semibold truncate ${unread > 0 ? 'text-slate-900' : 'text-slate-700'}`}>
                            {user.username}
                          </span>
                          {lastMessage && (
                            <span className="text-xs text-slate-400 flex-shrink-0">
                              {formatTime(lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm truncate ${unread > 0 ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>
                            {isTyping ? (
                              <span className="text-blue-600 font-medium">Typing...</span>
                            ) : lastMessage ? (
                              <>
                                {lastMessage.post ? (
                                  <span className="flex items-center gap-1">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Shared a post
                                  </span>
                                ) : lastMessage.mediaUrl ? (
                                  <span className="flex items-center gap-1">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Image
                                  </span>
                                ) : (
                                  <>
                                    {lastMessage.fromMe && <span className="text-slate-400">You: </span>}
                                    {lastMessage.text}
                                  </>
                                )}
                              </>
                            ) : (
                              <span className="text-slate-400">{user.role || 'New conversation'}</span>
                            )}
                          </p>
                          {unread > 0 && (
                            <span className="flex-shrink-0 h-5 min-w-5 px-1.5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                              {unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}