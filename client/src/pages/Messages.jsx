import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MessageSquare, Send, Loader2, ArrowLeft, Phone, Video, Cast, Smile, MoreHorizontal, Briefcase, Users, Layout, MapPin, Code, Star, Hash, Paperclip } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import EmojiPicker from 'emoji-picker-react';
import Modal from '../components/Modal';

export default function Messages() {
    const { user: currentUser } = useAuth();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    
    const activeUserId = searchParams.get('user');
    const activeProjectId = searchParams.get('project');

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [attachmentPreview, setAttachmentPreview] = useState(null);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const messagesEndRef = useRef(null);
    const [socket, setSocket] = useState(null);

    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showAddProjectModal, setShowAddProjectModal] = useState(false);
    const fileInputRef = useRef(null);
    const emojiRef = useRef(null);

    // Initialize Socket
    useEffect(() => {
        const newSocket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000');
        setSocket(newSocket);
        return () => newSocket.close();
    }, []);

    // Socket Event Listeners
    useEffect(() => {
        if (!socket) return;
        
        if (activeProjectId) {
            socket.emit('joinProject', activeProjectId);
        }

        const handleReceive = (msg) => {
            if ((activeProjectId && msg.project_id === parseInt(activeProjectId)) || 
                (activeUserId && (msg.sender_id === parseInt(activeUserId) || msg.receiver_id === parseInt(activeUserId)))) {
                setMessages(prev => {
                    if (prev.find(m => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
            }
        };

        socket.on('receiveMessage', handleReceive);
        return () => socket.off('receiveMessage', handleReceive);
    }, [socket, activeProjectId, activeUserId]);

    // Close emoji picker on click outside
    useEffect(() => {
        function handleClickOutside(e) {
            if (emojiRef.current && !emojiRef.current.contains(e.target)) setShowEmojiPicker(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch Feeds
    useEffect(() => {
        Promise.all([
            api.get('/users').then(res => res.data ? setUsers(res.data.filter(u => u.id !== currentUser?.id)) : null),
            api.get('/projects').then(res => res.success ? setProjects(res.data) : null)
        ]).finally(() => setLoadingUsers(false));
    }, [currentUser]);

    // Fetch Messages
    const fetchMessages = () => {
        if (!activeUserId && !activeProjectId) return;
        const endpoint = activeProjectId ? `/messages/project/${activeProjectId}` : `/messages/${activeUserId}`;
        
        api.get(endpoint).then(res => {
            if (res.success) {
                setMessages(prev => {
                    if (prev.length !== res.data.length || JSON.stringify(prev[prev.length - 1]) !== JSON.stringify(res.data[res.data.length - 1])) {
                        return res.data;
                    }
                    return prev;
                });
            }
        }).catch(console.error);
    };

    useEffect(() => {
        if (activeUserId || activeProjectId) {
            setLoadingMessages(true);
            fetchMessages();
            setLoadingMessages(false);
            
            // Still poll as a fallback for missing sockets
            const interval = setInterval(fetchMessages, 5000);
            return () => clearInterval(interval);
        } else {
            setMessages([]);
        }
    }, [activeUserId, activeProjectId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !attachmentPreview) || (!activeUserId && !activeProjectId)) return;
        
        const isProject = !!activeProjectId;
        
        // Optimistic UI update
        const tempMsg = {
            id: 'temp-' + Date.now(),
            content: newMessage,
            created_at: new Date().toISOString(),
            sender_id: currentUser.id,
            receiver_id: isProject ? null : parseInt(activeUserId),
            project_id: isProject ? parseInt(activeProjectId) : null,
            sender_username: currentUser.username,
            sender_full_name: currentUser.full_name,
            attachment_url: attachmentPreview?.url,
            attachment_name: attachmentPreview?.name,
            attachment_type: attachmentPreview?.type
        };
        setMessages(prev => [...prev, tempMsg]);
        const msgToSend = newMessage;
        const msgAttachment = attachmentPreview;
        setNewMessage('');
        setAttachmentPreview(null);
        
        try {
            const endpoint = isProject ? `/messages/project/${activeProjectId}` : '/messages';
            const payload = isProject 
                ? { content: msgToSend, attachment: msgAttachment } 
                : { receiverId: activeUserId, content: msgToSend, attachment: msgAttachment };
            
            const res = await api.post(endpoint, payload);
            if (res.success) {
                fetchMessages();
            }
        } catch (error) { 
            console.error('Failed to send message', error);
            setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
            setNewMessage(msgToSend);
            setAttachmentPreview(msgAttachment);
        }
    };

    const handleQuickReply = (text) => {
        setNewMessage(prev => prev ? `${prev} ${text}` : text);
    };

    const handleEmojiClick = (emojiData) => {
        setNewMessage(prev => prev + emojiData.emoji);
        setShowEmojiPicker(false);
    };

    const handleFileChange = async (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const formData = new FormData();
            formData.append('file', file);
            
            setUploadingFile(true);
            try {
                const API_URL = import.meta?.env?.VITE_API_URL || 'http://localhost:5000/api';
                // Fetch using core browser fetch to easily pass FormData
                const res = await fetch(`${API_URL}/upload`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: formData
                });
                const data = await res.json();
                
                if (data.success) {
                    setAttachmentPreview(data.data); // { url, name, type }
                } else {
                    alert('Upload failed: ' + data.message);
                }
            } catch (err) {
                console.error(err);
                alert('Upload error');
            } finally {
                setUploadingFile(false);
            }
        }
    };

    const removeAttachment = () => {
        setAttachmentPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleAddToProject = async (projectId) => {
        try {
            await api.post(`/projects/${projectId}/members`, { userId: activeUser.id });
            setShowAddProjectModal(false);
            // Optional: alert success or fetch projects again
        } catch (err) {
            console.error('Failed to add member', err);
        }
    };

    const activeUser = users.find(u => u.id.toString() === activeUserId?.toString());
    const activeProject = projects.find(p => p.id.toString() === activeProjectId?.toString());
    const isProjectChat = !!activeProjectId;
    const titleName = isProjectChat ? activeProject?.title : (activeUser?.full_name || activeUser?.username);

    return (
        <div className="animate-fade-in" style={{ height: 'calc(100vh - 8rem)' }}>
            {!activeUserId && !activeProjectId ? (
                // ----------------- INBOX VIEW -----------------
                <div className="glass-card h-full flex flex-col p-6 overflow-hidden">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3" style={{ color: 'var(--text-heading)' }}>
                        <MessageSquare style={{ color: '#6366f1' }} /> All Messages
                    </h2>
                    <div className="flex-1 overflow-y-auto w-full max-w-4xl space-y-4 pr-4">
                        {loadingUsers ? (
                            <div className="flex justify-center p-10"><Loader2 className="animate-spin" style={{ color: '#6366f1' }} /></div>
                        ) : users.length === 0 && projects.length === 0 ? (
                            <p className="text-center mt-10" style={{ color: 'var(--text-muted)' }}>No contacts or projects found.</p>
                        ) : (
                            <>
                                {/* Projects List */}
                                {projects.map(p => (
                                    <div key={`proj-${p.id}`} onClick={() => navigate(`/messages?project=${p.id}`, { replace: true })}
                                         className="glass-card p-4 flex items-center gap-4 cursor-pointer hover:scale-[1.01] transition-transform"
                                         style={{ background: 'rgba(99, 102, 241, 0.05)' }}>
                                        <div className="h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white' }}>
                                            <Hash size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-lg leading-tight" style={{ color: 'var(--text-heading)' }}>{p.title}</h4>
                                            <p className="text-sm opacity-80 mt-0.5 font-semibold" style={{ color: '#10b981' }}>Project Channel</p>
                                        </div>
                                        <div className="btn-gradient text-sm px-4 py-2 rounded-xl font-semibold">Join Group</div>
                                     </div>
                                ))}

                                {/* Users List */}
                                {users.map(u => (
                                    <div key={`user-${u.id}`} onClick={() => navigate(`/messages?user=${u.id}`, { replace: true })}
                                         className="glass-card p-4 flex items-center gap-4 cursor-pointer hover:scale-[1.01] transition-transform">
                                        <div className="h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #60a5fa, #3b82f6)', color: 'white' }}>
                                            {(u.full_name || u.username).charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-lg leading-tight" style={{ color: 'var(--text-heading)' }}>{u.full_name || u.username}</h4>
                                            <p className="text-sm opacity-80 mt-0.5" style={{ color: 'var(--text-muted)' }}>{u.role || 'Developer'} • {u.location || 'Remote'}</p>
                                        </div>
                                        <div className="btn-gradient text-sm px-4 py-2 rounded-xl font-semibold">Message</div>
                                     </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            ) : (
                // ----------------- ACTIVE CONVERSATION TWO-COLUMN VIEW -----------------
                <div className="flex h-full gap-5 mx-auto max-w-6xl">
                    {/* LEFT PANEL: PROFILE */}
                    <div className="glass-card w-[320px] flex-shrink-0 flex flex-col p-0 overflow-hidden overflow-y-auto scrollbar-hide relative hidden md:flex rounded-3xl">
                        {/* Cover Image */}
                        <div className="h-28 w-full relative" style={{ background: isProjectChat ? 'linear-gradient(135deg, #064e3b, #0f172a)' : 'linear-gradient(135deg, #1e293b, #0f172a)' }}>
                            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(255,255,255,0.08) 20px, rgba(255,255,255,0.08) 40px)' }}></div>
                        </div>
                        {/* Avatar and Info Container */}
                        <div className="px-6 pb-6 space-y-5">
                            {/* Avatar */}
                            <div className="-mt-10 relative z-10 flex">
                                <div className="h-20 w-20 rounded-full border-[5px] flex items-center justify-center text-3xl font-bold shadow-md"
                                     style={{ borderColor: 'var(--bg-primary)', background: isProjectChat ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #60a5fa, #3b82f6)', color: 'white' }}>
                                    {isProjectChat ? <Hash size={32} /> : (activeUser?.full_name || activeUser?.username || '?').charAt(0).toUpperCase()}
                                    {!isProjectChat && <div className="absolute bottom-1 right-1 h-3.5 w-3.5 bg-green-500 rounded-full border-2" style={{ borderColor: 'var(--bg-primary)' }}></div>}
                                </div>
                            </div>
                            
                            {/* Header Info */}
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-heading)' }}>
                                    {titleName}
                                </h2>
                                <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                    {isProjectChat ? 'Project Group Channel' : `${activeUser?.username}@globalcollab.com`}
                                </p>
                            </div>
                            
                            {/* Action Buttons */}
                            {!isProjectChat ? (
                                <div className="flex gap-3">
                                    <button onClick={() => setShowAddProjectModal(true)} className="flex-1 btn-glass text-xs font-semibold py-2.5 rounded-xl justify-center shadow-sm">Add to project</button>
                                    <button onClick={() => navigate('/projects')} className="flex-1 btn-gradient text-xs font-semibold py-2.5 rounded-xl justify-center shadow-sm">View projects</button>
                                </div>
                            ) : (
                                <div className="flex gap-3">
                                    <button onClick={() => navigate(`/projects/${activeProject?.id}`)} className="flex-1 btn-gradient text-xs font-semibold py-2.5 rounded-xl justify-center shadow-sm">View Board</button>
                                </div>
                            )}

                            <hr className="border-t border-gray-400/20" />

                            {/* About Me */}
                            {(!isProjectChat && activeUser?.bio) ? (
                                <div>
                                    <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--text-heading)' }}>About me</h3>
                                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                                        {activeUser.bio}
                                    </p>
                                </div>
                            ) : !isProjectChat ? (
                                <div>
                                    <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--text-heading)' }}>About me</h3>
                                    <p className="text-xs leading-relaxed opacity-60 flex items-center justify-center p-4 rounded-xl border border-dashed border-gray-400 border-opacity-30" style={{ color: 'var(--text-muted)' }}>
                                        No bio provided.
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--text-heading)' }}>Project Details</h3>
                                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                                        {activeProject?.description || 'A collaborative workspace for your team.'}
                                    </p>
                                </div>
                            )}

                            {/* Work Experience / Skills */}
                            {!isProjectChat && (
                                <div>
                                    <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-heading)' }}>Background</h3>
                                    <div className="space-y-4">
                                        <div className="flex gap-3 items-start">
                                            <div className="p-2 rounded-xl mt-0.5" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
                                                <Briefcase size={14} />
                                            </div>
                                            <div>
                                                <h4 className="text-[13px] font-bold" style={{ color: 'var(--text-heading)' }}>{activeUser?.role || 'Member'}</h4>
                                                <p className="text-[11px] mb-0.5" style={{ color: 'var(--text-muted)' }}>{activeUser?.location || 'Remote'}</p>
                                            </div>
                                        </div>
                                        {activeUser?.skills && activeUser.skills.length > 0 && typeof activeUser.skills !== 'string' && (
                                            <div className="flex gap-3 items-start">
                                                <div className="p-2 rounded-xl mt-0.5" style={{ background: 'rgba(244,114,182,0.1)', color: '#f472b6' }}>
                                                    <Code size={14} />
                                                </div>
                                                <div>
                                                    <h4 className="text-[13px] font-bold" style={{ color: 'var(--text-heading)' }}>Core Skills</h4>
                                                    <p className="text-[11px] mt-1 mb-1 leading-snug" style={{ color: 'var(--text-muted)' }}>{Array.isArray(activeUser.skills) ? activeUser.skills.join(', ') : activeUser.skills}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT PANEL: CHAT INTERFACE */}
                    <div className="glass-card flex-1 flex flex-col p-0 overflow-hidden relative rounded-3xl">
                        {/* Header */}
                        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.4)' }}>
                            <div className="flex items-center gap-4">
                                <button onClick={() => navigate('/messages', { replace: true })}
                                        className="flex items-center gap-1.5 text-sm font-semibold hover:opacity-70 transition-opacity" style={{ color: '#6366f1' }}>
                                    <ArrowLeft size={16} /> All Channels
                                </button>
                                <h3 className="font-bold text-[15px] hidden sm:block border-l pl-4 border-gray-400/20" style={{ color: 'var(--text-heading)' }}>
                                    {isProjectChat ? 'Channel: ' : 'Conversation with '} {titleName}
                                </h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2 rounded-xl bg-white/40 hover:bg-white/60 transition-colors shadow-sm" style={{ color: '#475569' }}><Phone size={15} /></button>
                                <button className="p-2 rounded-xl bg-white/40 hover:bg-white/60 transition-colors shadow-sm" style={{ color: '#475569' }}><Video size={15} /></button>
                                <button className="p-2 rounded-xl bg-white/40 hover:bg-white/60 transition-colors shadow-sm" style={{ color: '#475569' }}><Cast size={15} /></button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ background: 'rgba(255,255,255,0.1)' }}>
                            {loadingMessages && messages.length === 0 ? (
                                <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin" style={{ color: '#6366f1' }} size={30} /></div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-sm opacity-50 space-y-3" style={{ color: 'var(--text-heading)' }}>
                                    <MessageSquare size={40} className="opacity-50" />
                                    No messages yet. Start the conversation!
                                </div>
                            ) : (
                                messages.map((msg, index) => {
                                    const isMine = msg.sender_id === currentUser?.id;
                                    const prevMsg = messages[index - 1];
                                    
                                    let showDateDivider = false;
                                    if (!prevMsg) showDateDivider = true;
                                    else {
                                        const date1 = new Date(prevMsg.created_at).toDateString();
                                        const date2 = new Date(msg.created_at).toDateString();
                                        if (date1 !== date2) showDateDivider = true;
                                    }

                                    return (
                                        <React.Fragment key={msg.id}>
                                            {showDateDivider && (
                                                <div className="flex justify-center my-6 relative">
                                                    <div className="absolute inset-x-0 top-1/2 h-px bg-white/20"></div>
                                                    <span className="relative z-10 text-[11px] font-semibold px-4 py-1 rounded-full shadow-sm" style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)' }}>
                                                        {new Date(msg.created_at).toLocaleDateString([], { weekday: 'long' })} {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            )}
                                            
                                            <div className={`flex items-end gap-3 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                                                {!isMine && (
                                                    <div className="h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold shadow-sm" style={{ background: 'linear-gradient(135deg, #60a5fa, #3b82f6)', color: 'white' }}>
                                                        {(msg.sender_full_name || msg.sender_username || '?').charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="flex flex-col max-w-[70%]">
                                                    {!isMine && (!prevMsg || prevMsg.sender_id !== msg.sender_id || showDateDivider) && (
                                                        <span className="text-[11px] ml-1 mb-1 block" style={{ color: 'var(--text-muted)' }}>{msg.sender_full_name || msg.sender_username}</span>
                                                    )}
                                                    {msg.content && (
                                                        <div className={`px-5 py-3.5 text-[14px] leading-relaxed shadow-sm`}
                                                             style={{
                                                                 background: isMine ? '#6366f1' : '#ffffff',
                                                                 color: isMine ? '#ffffff' : '#334155',
                                                                 borderRadius: isMine ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                                                                 border: isMine ? 'none' : '1px solid rgba(226,232,240,0.8)'
                                                             }}>
                                                            {msg.content}
                                                        </div>
                                                    )}
                                                    
                                                    {msg.attachment_url && (() => {
                                                        const BASE_URL = (import.meta?.env?.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
                                                        return (
                                                        <div className={`mt-2 flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                            {msg.attachment_type?.startsWith('image/') ? (
                                                                <a href={`${BASE_URL}${msg.attachment_url}`} target="_blank" rel="noreferrer" className="block max-w-[220px] overflow-hidden shadow-sm hover:opacity-90 transition-opacity" style={{ borderRadius: isMine ? '16px 16px 4px 16px' : '4px 16px 16px 16px', border: '2px solid rgba(99,102,241,0.2)' }}>
                                                                    <img src={`${BASE_URL}${msg.attachment_url}`} alt="attachment" className="w-full h-auto object-cover" />
                                                                </a>
                                                            ) : (
                                                                <a href={`${BASE_URL}${msg.attachment_url}`} target="_blank" rel="noreferrer" className={`flex items-center gap-3 px-4 py-3 shadow-sm border`} 
                                                                   style={{ 
                                                                       background: isMine ? '#eef2ff' : '#f8fafc',
                                                                       borderColor: isMine ? '#c7d2fe' : '#e2e8f0',
                                                                       color: isMine ? '#4338ca' : '#475569',
                                                                       borderRadius: isMine ? '16px 16px 4px 16px' : '4px 16px 16px 16px'
                                                                   }}>
                                                                    <div className="p-2 bg-white rounded-lg shadow-sm flex-shrink-0 text-indigo-500">
                                                                        <Paperclip size={18} />
                                                                    </div>
                                                                    <div className="overflow-hidden pr-2">
                                                                        <p className="text-[13px] font-bold truncate max-w-[160px]">{msg.attachment_name}</p>
                                                                        <p className="text-[10px] opacity-70 uppercase tracking-wider mt-0.5">{msg.attachment_type?.split('/')[1] || 'FILE'} • Click to view</p>
                                                                    </div>
                                                                </a>
                                                            )}
                                                        </div>
                                                        );
                                                    })()}

                                                    <div className={`text-[10px] mt-1.5 opacity-60 flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                        </React.Fragment>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 px-6 bg-white/20 backdrop-blur-md" style={{ borderTop: '1px solid rgba(255,255,255,0.4)' }}>
                            <div className="w-full">
                                {/* Quick Replies */}
                                <div className="flex gap-2 mb-3">
                                    {['Awesome', 'Great Design', 'Will do!'].map(reply => (
                                        <button key={reply} onClick={() => handleQuickReply(reply)}
                                                className="text-[12px] font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 bg-white/60 hover:bg-white border border-white/60 shadow-sm transition-all"
                                                style={{ color: '#475569' }}>
                                            {reply} <span className="opacity-50 hover:opacity-100 font-bold">✕</span>
                                        </button>
                                    ))}
                                </div>
                                {/* Message Input */}
                                <form onSubmit={handleSendMessage} className="relative flex items-center bg-white shadow-sm rounded-2xl p-1.5 border border-indigo-100 focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all">
                                    <div className="relative" ref={emojiRef}>
                                        <button 
                                            type="button" 
                                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                            className="p-2.5 ml-1 text-gray-400 hover:text-indigo-500 transition-colors focus:outline-none">
                                            <Smile size={18} />
                                        </button>
                                        {showEmojiPicker && (
                                            <div className="absolute bottom-12 left-0 z-50">
                                                <EmojiPicker onEmojiClick={handleEmojiClick} theme="light" />
                                {/* Attachment Preview Bubble */}
                                                {attachmentPreview && (() => {
                                                    const BASE_URL = (import.meta?.env?.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
                                                    return (
                                                    <div className="absolute -top-14 left-0 bg-white shadow-lg border border-indigo-100 rounded-xl p-2 flex items-center gap-3 z-50 animate-fade-in">
                                                        <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500 overflow-hidden">
                                                            {attachmentPreview.type.startsWith('image/') ? (
                                                                <img src={`${BASE_URL}${attachmentPreview.url}`} alt="preview" className="h-full w-full object-cover" />
                                                            ) : (
                                                                <Paperclip size={16} />
                                                            )}
                                                        </div>
                                                        <div className="max-w-[150px]">
                                                            <p className="text-xs font-bold text-gray-800 truncate">{attachmentPreview.name}</p>
                                                            <p className="text-[10px] text-gray-500">{attachmentPreview.type.split('/')[1]}</p>
                                                        </div>
                                                        <button type="button" onClick={removeAttachment} className="p-1 hover:bg-gray-100 rounded-md text-gray-400 transition-colors">
                                                            <span className="text-xl leading-none">&times;</span>
                                                        </button>
                                                    </div>
                                                    );
                                                })()}

                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        placeholder="Send a message"
                                        className="flex-1 bg-transparent border-none focus:outline-none px-2 text-[15px] text-gray-800 placeholder-gray-400"
                                    />
                                    
                                    {/* Attachment Button */}
                                    <button 
                                        type="button" 
                                        disabled={uploadingFile}
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-2.5 text-gray-400 hover:text-indigo-500 transition-colors focus:outline-none disabled:opacity-50">
                                        {uploadingFile ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
                                    </button>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        onChange={handleFileChange} 
                                    />
                                    
                                    <button type="submit" disabled={(!newMessage.trim() && !attachmentPreview) || uploadingFile}
                                        className="bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white h-[42px] px-6 rounded-xl text-sm font-semibold transition-all shadow-sm ml-1 disabled:opacity-50 disabled:pointer-events-none">
                                        Send
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            {showAddProjectModal && (
                <Modal title={`Add ${activeUser?.username} to Project`} onClose={() => setShowAddProjectModal(false)}>
                    <div className="p-4 space-y-3">
                        {projects.length === 0 ? (
                             <p className="text-sm text-center opacity-70">You don't have any projects to invite them to.</p>
                        ) : projects.map(p => (
                            <button key={p.id} onClick={() => handleAddToProject(p.id)}
                                    className="w-full text-left p-4 rounded-xl border hover:bg-indigo-50 transition-colors flex justify-between items-center shadow-sm bg-white">
                                <span className="font-semibold text-sm text-gray-800">{p.title}</span>
                                <span className="text-xs bg-indigo-500 text-white px-3 py-1.5 rounded-lg shadow-sm">Invite</span>
                            </button>
                        ))}
                    </div>
                </Modal>
            )}

        </div>
    );
}
