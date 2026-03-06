import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { matters, clients } from '@/data/mockData';
import {
  Send, Search, Phone, Video, MoreVertical, Paperclip,
  Check, CheckCheck, Clock, Circle, X, ChevronDown,
  Briefcase, MessageCircle, User
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  attachment?: { name: string; size: string; type: string };
}

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar: string;
  participantRole: string;
  participantStatus: 'online' | 'offline' | 'away';
  matterId?: string;
  matterTitle?: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  messages: Message[];
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const SEED_CONVERSATIONS: Conversation[] = [
  {
    id: 'cv1',
    participantId: 'c3', participantName: 'David Kimani Njoroge',
    participantAvatar: 'DK', participantRole: 'Client', participantStatus: 'online',
    matterId: 'm2', matterTitle: 'Kimani Land Title Dispute',
    lastMessage: 'Thank you for the update on the hearing date.',
    lastTime: '10:32 AM', unread: 2,
    messages: [
      { id: 'msg1', conversationId: 'cv1', senderId: 'c3', senderName: 'David Kimani', senderAvatar: 'DK', content: 'Good morning. I wanted to check on the status of my land case.', timestamp: '2026-03-05T09:00:00', status: 'read' },
      { id: 'msg2', conversationId: 'cv1', senderId: '2', senderName: 'Grace Wanjiku', senderAvatar: 'GW', content: 'Good morning David. Your matter NLF/2024/0002 is progressing well. The next hearing is scheduled for March 15, 2026 at the Environment & Land Court, Nanyuki.', timestamp: '2026-03-05T09:15:00', status: 'read' },
      { id: 'msg3', conversationId: 'cv1', senderId: 'c3', senderName: 'David Kimani', senderAvatar: 'DK', content: 'What documents should I bring to the hearing?', timestamp: '2026-03-05T09:30:00', status: 'read' },
      { id: 'msg4', conversationId: 'cv1', senderId: '2', senderName: 'Grace Wanjiku', senderAvatar: 'GW', content: 'Please bring your original title document, national ID, and any correspondence with the opposing party. I will send you a full checklist shortly.', timestamp: '2026-03-05T09:45:00', status: 'read' },
      { id: 'msg5', conversationId: 'cv1', senderId: 'c3', senderName: 'David Kimani', senderAvatar: 'DK', content: 'Thank you for the update on the hearing date.', timestamp: '2026-03-05T10:32:00', status: 'delivered' },
    ],
  },
  {
    id: 'cv2',
    participantId: 'c5', participantName: 'Jane Achieng Ouma',
    participantAvatar: 'JA', participantRole: 'Client', participantStatus: 'away',
    matterId: 'm4', matterTitle: 'Ouma v. TechCorp — Wrongful Termination',
    lastMessage: 'Can we schedule a call to discuss the settlement offer?',
    lastTime: 'Yesterday', unread: 1,
    messages: [
      { id: 'msg6', conversationId: 'cv2', senderId: '2', senderName: 'Grace Wanjiku', senderAvatar: 'GW', content: 'Hello Jane. I have received a settlement offer from TechCorp Kenya. They are proposing KES 1.8M as full and final settlement.', timestamp: '2026-03-04T14:00:00', status: 'read' },
      { id: 'msg7', conversationId: 'cv2', senderId: 'c5', senderName: 'Jane Ouma', senderAvatar: 'JA', content: 'That seems low given what they put me through. What do you think?', timestamp: '2026-03-04T14:20:00', status: 'read' },
      { id: 'msg8', conversationId: 'cv2', senderId: '2', senderName: 'Grace Wanjiku', senderAvatar: 'GW', content: 'I agree it is below what we can argue for. Your case has merit — we can push for KES 3M. However, litigation takes time. I recommend we counter-offer at KES 2.8M.', timestamp: '2026-03-04T14:35:00', status: 'read' },
      { id: 'msg9', conversationId: 'cv2', senderId: 'c5', senderName: 'Jane Ouma', senderAvatar: 'JA', content: 'Can we schedule a call to discuss the settlement offer?', timestamp: '2026-03-04T15:00:00', status: 'delivered' },
    ],
  },
  {
    id: 'cv3',
    participantId: 'c1', participantName: 'Safaricom PLC',
    participantAvatar: 'SP', participantRole: 'Client', participantStatus: 'online',
    matterId: 'm1', matterTitle: 'Safaricom v. Communications Authority',
    lastMessage: 'Please confirm receipt of the filed documents.',
    lastTime: 'Monday', unread: 0,
    messages: [
      { id: 'msg10', conversationId: 'cv3', senderId: '3', senderName: 'Peter Kamau', senderAvatar: 'PK', content: 'Good afternoon. We have successfully filed the Notice of Motion at Milimani Commercial Court today. Court has assigned it Case No. HC/COMM/E234/2026.', timestamp: '2026-03-02T15:00:00', status: 'read' },
      { id: 'msg11', conversationId: 'cv3', senderId: 'c1', senderName: 'John Odhiambo', senderAvatar: 'SP', content: 'Please confirm receipt of the filed documents.', timestamp: '2026-03-02T15:30:00', status: 'read' },
    ],
  },
  {
    id: 'cv4',
    participantId: 'c9', participantName: 'Florence Wangari Mwangi',
    participantAvatar: 'FW', participantRole: 'Client', participantStatus: 'offline',
    matterId: 'm8', matterTitle: 'Wangari Divorce Proceedings',
    lastMessage: 'I understand. I will wait for your call.',
    lastTime: 'Last week', unread: 0,
    messages: [
      { id: 'msg12', conversationId: 'cv4', senderId: '2', senderName: 'Grace Wanjiku', senderAvatar: 'GW', content: 'Florence, the Family Court has scheduled the case conference for March 25, 2026. This is an important session — both parties and their counsel will discuss the key issues.', timestamp: '2026-02-28T10:00:00', status: 'read' },
      { id: 'msg13', conversationId: 'cv4', senderId: 'c9', senderName: 'Florence Wangari', senderAvatar: 'FW', content: 'I understand. I will wait for your call.', timestamp: '2026-02-28T10:30:00', status: 'read' },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const StatusDot: React.FC<{ status: Conversation['participantStatus'] }> = ({ status }) => {
  const color = status === 'online' ? '#10b981' : status === 'away' ? '#f59e0b' : '#6b7280';
  return <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color, boxShadow: status === 'online' ? `0 0 0 2px ${color}33` : 'none' }} />;
};

const MessageStatus: React.FC<{ status: Message['status'] }> = ({ status }) => {
  if (status === 'read')      return <CheckCheck className="w-3.5 h-3.5" style={{ color: '#3b82f6' }} />;
  if (status === 'delivered') return <CheckCheck className="w-3.5 h-3.5 text-[var(--text-secondary)]" />;
  return <Check className="w-3.5 h-3.5 text-[var(--text-secondary)]" />;
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
};

// ─── Main Component ───────────────────────────────────────────────────────────

const MessagingModule: React.FC = () => {
  const { user } = useAuth();
  const isClient = user?.role === 'client';

  const [conversations, setConversations] = useState<Conversation[]>(SEED_CONVERSATIONS);
  const [activeConvId, setActiveConvId] = useState<string>(SEED_CONVERSATIONS[0].id);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [showAttach, setShowAttach] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [selectedNewClient, setSelectedNewClient] = useState('');
  const [selectedNewMatter, setSelectedNewMatter] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeConv = conversations.find(c => c.id === activeConvId)!;

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages]);

  // Mark as read when opening
  useEffect(() => {
    if (activeConvId) {
      setConversations(prev => prev.map(c =>
        c.id === activeConvId
          ? { ...c, unread: 0, messages: c.messages.map(m => ({ ...m, status: 'read' as const })) }
          : c
      ));
    }
  }, [activeConvId]);

  const filteredConvs = useMemo(() => {
    if (!search) return conversations;
    return conversations.filter(c =>
      c.participantName.toLowerCase().includes(search.toLowerCase()) ||
      c.matterTitle?.toLowerCase().includes(search.toLowerCase())
    );
  }, [conversations, search]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      conversationId: activeConvId,
      senderId: user?.id || '1',
      senderName: user?.name || 'You',
      senderAvatar: user?.avatar || 'U',
      content: input.trim(),
      timestamp: new Date().toISOString(),
      status: 'sent',
    };
    setConversations(prev => prev.map(c =>
      c.id === activeConvId
        ? { ...c, messages: [...c.messages, newMsg], lastMessage: input.trim(), lastTime: 'Just now' }
        : c
    ));
    setInput('');
    inputRef.current?.focus();

    // Simulate delivery after 1s
    setTimeout(() => {
      setConversations(prev => prev.map(c =>
        c.id === activeConvId
          ? { ...c, messages: c.messages.map(m => m.id === newMsg.id ? { ...m, status: 'delivered' } : m) }
          : c
      ));
    }, 1000);
  };

  const startNewConversation = () => {
    if (!selectedNewClient) return;
    const client = clients.find(c => c.id === selectedNewClient);
    const matter = matters.find(m => m.id === selectedNewMatter);
    const existing = conversations.find(c => c.participantId === selectedNewClient);
    if (existing) { setActiveConvId(existing.id); setNewChatOpen(false); return; }

    const newConv: Conversation = {
      id: `cv_${Date.now()}`,
      participantId: selectedNewClient,
      participantName: client?.name || 'Client',
      participantAvatar: (client?.name || 'C').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
      participantRole: 'Client',
      participantStatus: 'offline',
      matterId: matter?.id,
      matterTitle: matter?.title,
      lastMessage: 'Conversation started',
      lastTime: 'Just now',
      unread: 0,
      messages: [],
    };
    setConversations(prev => [newConv, ...prev]);
    setActiveConvId(newConv.id);
    setNewChatOpen(false);
    setSelectedNewClient('');
    setSelectedNewMatter('');
  };

  const ATTACH_TYPES = ['Court Filing', 'Invoice', 'Document', 'Evidence', 'Photo'];

  const sendAttachment = (type: string) => {
    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      conversationId: activeConvId,
      senderId: user?.id || '1',
      senderName: user?.name || 'You',
      senderAvatar: user?.avatar || 'U',
      content: '',
      timestamp: new Date().toISOString(),
      status: 'sent',
      attachment: { name: `${type.replace(' ', '_')}_${Date.now()}.pdf`, size: `${(Math.random() * 3 + 0.5).toFixed(1)} MB`, type },
    };
    setConversations(prev => prev.map(c =>
      c.id === activeConvId
        ? { ...c, messages: [...c.messages, newMsg], lastMessage: `📎 ${type}`, lastTime: 'Just now' }
        : c
    ));
    setShowAttach(false);
  };

  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);

  return (
    <div className="animate-fade-in" style={{ height: 'calc(100vh - 130px)' }}>

      {/* Page Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            Messages
            {totalUnread > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: '#ef4444', color: '#fff' }}>{totalUnread}</span>
            )}
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-0.5">
            Direct communication between clients and advocates
          </p>
        </div>
        {!isClient && (
          <button onClick={() => setNewChatOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', color: '#fff' }}>
            <MessageCircle className="w-4 h-4" /> New Message
          </button>
        )}
      </div>

      <div className="flex gap-0 rounded-2xl border overflow-hidden"
        style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)', height: 'calc(100% - 60px)' }}>

        {/* ── Left: Conversation List ───────────────────────────────────── */}
        <div className="w-80 flex-shrink-0 flex flex-col border-r" style={{ borderColor: 'var(--border-color)' }}>

          {/* Search */}
          <div className="p-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-secondary)]" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-9 pr-3 py-2 rounded-lg text-sm bg-[var(--hover-bg)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]" />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {filteredConvs.map(conv => (
              <button key={conv.id} onClick={() => setActiveConvId(conv.id)}
                className="w-full flex items-start gap-3 p-4 text-left transition-all border-b"
                style={{
                  background: conv.id === activeConvId ? 'rgba(59,130,246,0.08)' : 'transparent',
                  borderColor: 'var(--border-color)',
                  borderLeft: conv.id === activeConvId ? '3px solid #3b82f6' : '3px solid transparent',
                }}>
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                    style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', color: '#fff' }}>
                    {conv.participantAvatar}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5">
                    <StatusDot status={conv.participantStatus} />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="font-semibold text-sm text-[var(--text-primary)] truncate">{conv.participantName}</p>
                    <span className="text-[10px] text-[var(--text-secondary)] flex-shrink-0 ml-2">{conv.lastTime}</span>
                  </div>
                  {conv.matterTitle && (
                    <p className="text-[10px] mb-1 truncate flex items-center gap-1" style={{ color: '#3b82f6' }}>
                      <Briefcase className="w-2.5 h-2.5" /> {conv.matterTitle}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[var(--text-secondary)] truncate">{conv.lastMessage}</p>
                    {conv.unread > 0 && (
                      <span className="text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ml-1"
                        style={{ background: '#3b82f6', color: '#fff' }}>
                        {conv.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}

            {filteredConvs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <MessageCircle className="w-10 h-10 text-[var(--text-secondary)] opacity-30 mb-3" />
                <p className="text-sm text-[var(--text-secondary)]">No conversations found</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Chat Window ────────────────────────────────────────── */}
        {activeConv ? (
          <div className="flex-1 flex flex-col min-w-0">

            {/* Chat Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b"
              style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                    style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', color: '#fff' }}>
                    {activeConv.participantAvatar}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5">
                    <StatusDot status={activeConv.participantStatus} />
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-sm text-[var(--text-primary)]">{activeConv.participantName}</p>
                  <p className="text-[10px] capitalize"
                    style={{ color: activeConv.participantStatus === 'online' ? '#10b981' : 'var(--text-secondary)' }}>
                    {activeConv.participantStatus === 'online' ? '● Online' :
                     activeConv.participantStatus === 'away' ? '● Away' : '● Offline'}
                    {activeConv.matterTitle && ` · ${activeConv.matterTitle}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-[var(--hover-bg)]"
                  title="Voice call (coming soon)">
                  <Phone className="w-4 h-4 text-[var(--text-secondary)]" />
                </button>
                <button className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-[var(--hover-bg)]"
                  title="Video call (coming soon)">
                  <Video className="w-4 h-4 text-[var(--text-secondary)]" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

              {/* Date divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
                <span className="text-[10px] text-[var(--text-secondary)] px-2">March 2026</span>
                <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
              </div>

              {activeConv.messages.map((msg, i) => {
                const isMe = msg.senderId === user?.id ||
                  (!isClient && msg.senderId !== activeConv.participantId);
                const showAvatar = i === 0 || activeConv.messages[i - 1].senderId !== msg.senderId;

                return (
                  <div key={msg.id}
                    className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>

                    {/* Avatar */}
                    {!isMe && (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mb-1"
                        style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', color: '#fff', opacity: showAvatar ? 1 : 0 }}>
                        {msg.senderAvatar}
                      </div>
                    )}

                    {/* Bubble */}
                    <div className={`max-w-[65%] space-y-1 ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                      {showAvatar && !isMe && (
                        <p className="text-[10px] text-[var(--text-secondary)] px-1">{msg.senderName}</p>
                      )}

                      {msg.attachment ? (
                        <div className="px-4 py-3 rounded-2xl border flex items-center gap-3"
                          style={{
                            background: isMe ? 'rgba(59,130,246,0.12)' : 'var(--hover-bg)',
                            borderColor: isMe ? 'rgba(59,130,246,0.25)' : 'var(--border-color)',
                            borderBottomRightRadius: isMe ? 4 : undefined,
                            borderBottomLeftRadius: !isMe ? 4 : undefined,
                          }}>
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(59,130,246,0.15)' }}>
                            <Paperclip className="w-4 h-4" style={{ color: '#3b82f6' }} />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-[var(--text-primary)]">{msg.attachment.name}</p>
                            <p className="text-[10px] text-[var(--text-secondary)]">{msg.attachment.size} · {msg.attachment.type}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                          style={{
                            background: isMe ? 'linear-gradient(135deg,#3b82f6,#6366f1)' : 'var(--hover-bg)',
                            color: isMe ? '#fff' : 'var(--text-primary)',
                            borderBottomRightRadius: isMe ? 4 : undefined,
                            borderBottomLeftRadius: !isMe ? 4 : undefined,
                          }}>
                          {msg.content}
                        </div>
                      )}

                      <div className={`flex items-center gap-1 px-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        <span className="text-[10px] text-[var(--text-secondary)]">{formatTime(msg.timestamp)}</span>
                        {isMe && <MessageStatus status={msg.status} />}
                      </div>
                    </div>
                  </div>
                );
              })}

              {activeConv.messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <MessageCircle className="w-12 h-12 text-[var(--text-secondary)] opacity-20 mb-3" />
                  <p className="text-sm text-[var(--text-secondary)]">No messages yet</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Send a message to start the conversation</p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border-color)' }}>

              {/* Attachment picker */}
              {showAttach && (
                <div className="flex flex-wrap gap-2 mb-3 p-3 rounded-xl border animate-fade-in"
                  style={{ background: 'var(--hover-bg)', borderColor: 'var(--border-color)' }}>
                  <p className="w-full text-xs font-medium text-[var(--text-secondary)] mb-1">Send attachment:</p>
                  {ATTACH_TYPES.map(t => (
                    <button key={t} onClick={() => sendAttachment(t)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{ background: 'var(--card-bg)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}>
                      <Paperclip className="w-3 h-3" /> {t}
                    </button>
                  ))}
                  <button onClick={() => setShowAttach(false)} className="ml-auto text-[var(--text-secondary)] hover:text-red-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex items-end gap-2">
                <button onClick={() => setShowAttach(!showAttach)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
                  style={{ background: showAttach ? 'rgba(59,130,246,0.12)' : 'var(--hover-bg)', color: showAttach ? '#3b82f6' : 'var(--text-secondary)' }}>
                  <Paperclip className="w-4 h-4" />
                </button>

                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                    placeholder={`Message ${activeConv.participantName}...`}
                    className="w-full px-4 py-2.5 rounded-xl text-sm border bg-[var(--hover-bg)] text-[var(--text-primary)] border-[var(--border-color)] placeholder-[var(--text-secondary)]"
                  />
                </div>

                <button onClick={sendMessage} disabled={!input.trim()}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
                  style={{
                    background: input.trim() ? 'linear-gradient(135deg,#3b82f6,#6366f1)' : 'var(--hover-bg)',
                    color: input.trim() ? '#fff' : 'var(--text-secondary)',
                    cursor: input.trim() ? 'pointer' : 'not-allowed',
                  }}>
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <MessageCircle className="w-16 h-16 text-[var(--text-secondary)] opacity-20 mb-4" />
            <p className="font-semibold text-[var(--text-primary)]">Select a conversation</p>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Choose from the list on the left</p>
          </div>
        )}
      </div>

      {/* ── New Conversation Modal ─────────────────────────────────────────── */}
      {newChatOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl border shadow-2xl animate-fade-in"
            style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <h3 className="font-bold text-[var(--text-primary)]">New Conversation</h3>
              <button onClick={() => setNewChatOpen(false)} className="text-[var(--text-secondary)] hover:text-red-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Select Client</label>
                <select value={selectedNewClient} onChange={e => setSelectedNewClient(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm border bg-[var(--input-bg)] text-[var(--text-primary)] border-[var(--border-color)]">
                  <option value="">Choose client...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Link to Matter (optional)</label>
                <select value={selectedNewMatter} onChange={e => setSelectedNewMatter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm border bg-[var(--input-bg)] text-[var(--text-primary)] border-[var(--border-color)]">
                  <option value="">Select matter...</option>
                  {matters.filter(m => !selectedNewClient || m.clientId === selectedNewClient).map(m => (
                    <option key={m.id} value={m.id}>{m.matterNumber} — {m.title}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setNewChatOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: 'var(--hover-bg)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                  Cancel
                </button>
                <button onClick={startNewConversation} disabled={!selectedNewClient}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: selectedNewClient ? 'linear-gradient(135deg,#3b82f6,#8b5cf6)' : 'var(--hover-bg)',
                    color: selectedNewClient ? '#fff' : 'var(--text-secondary)',
                    opacity: selectedNewClient ? 1 : 0.5,
                  }}>
                  Start Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagingModule;
