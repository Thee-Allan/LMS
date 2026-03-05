import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, MessageCircle, Minimize2, Maximize2, Bot } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface MercyChatProps {
  isOpen: boolean;
  onClose: () => void;
}

const MercyChat: React.FC<MercyChatProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I'm **Mercy**, your AI assistant for the NANYUKI LAW FIRM Management System. I can help you with:\n\n- Navigating the system\n- Managing clients and matters\n- Understanding billing and invoicing\n- Document management tips\n- Calendar and task guidance\n- Kenyan legal procedures\n\nHow can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && !minimized) inputRef.current?.focus();
  }, [isOpen, minimized]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      const resp = await fetch('https://lms-loxl.onrender.com/api/mercy-chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('nlf_token')}` },
        body: JSON.stringify({ message: userMessage, history }),
      });
      const data = await resp.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data?.reply || "I'm here to help! Could you try rephrasing your question?" }]);
    } catch (err) {
      console.error('Mercy chat error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having a moment - let me help you with some quick tips instead:\n\n- **Dashboard**: See your overview and key metrics\n- **Sidebar**: Navigate between all modules\n- **Search**: Find clients, matters, or documents instantly\n- **Theme**: Toggle dark/light mode with the sun/moon icon\n\nPlease try again in a moment!"
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessage = (text: string) => {
    return text.split('\n').map((line, i) => {
      let formatted = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^- /, '• ');
      return <p key={i} className={`${line === '' ? 'h-2' : ''}`} dangerouslySetInnerHTML={{ __html: formatted }} />;
    });
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed z-50 transition-all duration-300 ${minimized ? 'bottom-4 right-4 w-72' : 'bottom-4 right-4 w-96 h-[600px] max-h-[80vh]'}`}>
      <div className={`bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl shadow-2xl flex flex-col overflow-hidden ${minimized ? '' : 'h-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]"
          style={{ background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Mercy AI</h3>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] text-blue-200">Online</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setMinimized(!minimized)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors">
              {minimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!minimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-[var(--hover-bg)] text-[var(--text-primary)] rounded-bl-md'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div className="space-y-1 [&_strong]:font-semibold [&_em]:italic">
                        {formatMessage(msg.content)}
                      </div>
                    ) : msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-[var(--hover-bg)] rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
              {['How do I add a client?', 'Show me billing tips', 'Explain matter status'].map(q => (
                <button key={q} onClick={() => { setInput(q); }}
                  className="text-[10px] px-2.5 py-1 rounded-full border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] whitespace-nowrap transition-colors">
                  {q}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="px-4 pb-4 pt-2">
              <div className="flex items-center gap-2 p-2 rounded-xl border border-[var(--border-color)] bg-[var(--input-bg)] focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500/50">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Mercy anything..."
                  className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
                />
                <button onClick={sendMessage} disabled={!input.trim() || loading}
                  className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MercyChat;
