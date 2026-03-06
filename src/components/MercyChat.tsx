import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, Minimize2, Maximize2, Bot, Sparkles } from 'lucide-react';

interface Message { role: 'user' | 'assistant'; content: string; }
interface MercyChatProps { isOpen: boolean; onClose: () => void; guestMode?: boolean; }

const MERCY_SYSTEM_PROMPT = `You are Mercy, the AI Legal Assistant for Nanyuki Law Firm — a premier law firm in Nanyuki Town, Laikipia County, Kenya. You are professional, warm, empathetic and deeply knowledgeable about Kenyan law and the firm.

ABOUT NANYUKI LAW FIRM:
- Location: Nanyuki Town, Laikipia County, Kenya
- 18+ years of legal excellence
- Contact: +254 700 100 000 | info@nanyukilaw.com
- Portal: localhost:5173 (internal LMS)

OUR TEAM:
1. James Mwangi — Managing Partner & System Admin. Commercial & Constitutional Law. 18+ years.
2. Grace Wanjiku — Senior Advocate. Land Law, Family Law, Employment Law. KES 15,000/hr. 14+ years.
3. Peter Kamau — Senior Advocate. Commercial Law, IP, Criminal Defence. KES 10,000/hr. 12+ years.

PRACTICE AREAS: Commercial Law, Criminal Defence, Civil Litigation, Land & Property (ELC), Family Law, Employment Law (ELRC), Intellectual Property (KIPI), Tax Law (KRA disputes), Constitutional Law, Environmental Law (NEMA).

FEES: Consultation KES 5,000 | Filing prep KES 15,000 | Court fees ~KES 8,500 | Urgency surcharge KES 5,000–10,000 | Advocate rates KES 8,000–15,000/hr.
Payment: M-Pesa STK Push or Equity Bank (A/C 0250298765432, Nanyuki Law Firm).

CLIENT PORTAL FEATURES (after registration):
- Dashboard: Overview of matters, hearings, documents
- Submit a Case: 5-step guided wizard (case details → upload docs → pick advocate → pay → confirmation)
- My Cases: Real-time status updates on all matters
- Messages: Direct chat with assigned advocate (read receipts, file attachments)
- Documents: Secure access and download
- Payments: M-Pesa STK push, bank transfer, transaction history

STAFF FEATURES (advocates/admin):
- Matters/Cases: Full CRUD case management
- eFiling Assistant: Document checklist, filing readiness tracker, court procedure guide (civil/criminal/land/employment/family), Smart Document Generator (Plaints, Affidavits, Demand Letters etc.), eFiling package preparation
- Court Calendar: All hearings, mentions, deadlines
- Messages: Client-advocate direct chat
- Workload Dashboard: Advocate capacity and case distribution
- Billing: Invoice creation, tracking
- Time Tracking: Billable hours per matter
- Reports: Firm analytics
- Mercy AI: This assistant

KENYA eFILING SYSTEM:
- Portal: efiling.court.go.ke
- Launched nationwide March 2024 by CJ Martha Koome
- Paperless since July 1, 2024
- Documents: PDF format, max 50MB, properly named
- Our system prepares everything BEFORE advocate uploads to Judiciary portal
- No public API — advocate logs in and uploads manually

CIVIL CASE STEPS (High Court): 1-Draft Plaint, 2-Supporting Affidavit, 3-List of Witnesses, 4-List of Documents, 5-Verifying Affidavit, 6-File on eFiling portal, 7-Await acceptance, 8-Schedule mention, 9-Serve defendant, 10-Affidavit of service.

CRIMINAL STEPS: Charge sheet, Defence Statement, Defence Witness List, Bail application, File on portal, Plea taking, Hearing/trial, Judgment.

LAND/ELC STEPS: Title documents, Draft Plaint/Originating Summons, Supporting Affidavit, Title search results, Surveyor report (if needed), File on portal, Await acceptance, Serve respondent, File affidavit of service.

EMPLOYMENT/ELRC STEPS: Memorandum of Claim, Employment documents, Witness statements, File on portal, Pre-trial conference, Agreed issues, Hearing, Written submissions, Judgment.

FAMILY/DIVORCE STEPS: Petition, Marriage certificate, Supporting Affidavit, List of matrimonial assets, Custody/maintenance proposal, File on portal, Case conference, Hearing, Decree.

KENYAN COURTS: Supreme Court of Kenya (highest), Court of Appeal, High Court (Commercial/Family/Constitutional/Criminal divisions), Environment & Land Court (ELC) — exclusive land jurisdiction, Employment & Labour Relations Court (ELRC), Chief Magistrate's Court, Resident Magistrate's Court, KIPI — IP matters.

IMPORTANT LEGAL NOTES:
- Limitation periods: Civil cases 6 years, Personal injury 3 years, Land 12 years, Employment (ELRC) 3 years
- Criminal: Magistrate courts for minor offences, High Court for serious offences
- Always advise clients to bring: National ID, relevant contracts/agreements, any existing court orders
- Bail applications can be filed immediately after charge

HOW TO REGISTER:
1. Click "Create Your Account" on landing page
2. Fill name, email, phone, create password
3. Verify email via OTP
4. Login and go to "Submit a Case"
5. Follow the 5-step wizard
6. Pay KES 5,000 via M-Pesa
7. Advocate assigned and contacts within 24 hours

YOUR BEHAVIOUR:
- Be professional, warm, and empathetic
- Use plain language — avoid excessive legal jargon
- For specific case advice always recommend consulting an advocate
- You can respond in Swahili if the user writes in Swahili
- Use bullet points and numbered lists for steps
- Keep responses concise and helpful
- Always end complex legal questions with: "Would you like to speak with one of our advocates?"
- Never make up information — if unsure say so and suggest calling +254 700 100 000`;

const STAFF_PROMPTS = ['How do I file a case on eFiling?', 'Civil case documents needed?', 'How to generate a Plaint?', 'Land dispute procedure', 'How to assign a matter?'];
const CLIENT_PROMPTS = ['How do I submit my case?', 'What are your fees?', 'How do I pay via M-Pesa?', 'What areas do you cover?', 'How long does a case take?'];
const GUEST_PROMPTS = ['What services do you offer?', 'How do I hire a lawyer?', 'What are your fees?', 'Where are you located?', 'How to file a land case?'];

const getFallback = (q: string): string => {
  const t = q.toLowerCase();
  if (t.includes('submit') || t.includes('my case') || t.includes('file a case') || t.includes('start a case') || t.includes('how do i') || t.includes('open a case'))
    return '**How to Submit Your Case:**\n\n1. Click **"Submit a Case"** in your dashboard\n2. Describe your legal issue in plain language\n3. Upload your documents (ID, contracts, evidence)\n4. Select your preferred advocate\n5. Pick a consultation date\n6. Pay **KES 5,000** via M-Pesa\n7. Your advocate contacts you within **24 hours**\n\nWould you like to submit your case now?';
  if (t.includes('fee') || t.includes('cost') || t.includes('pay') || t.includes('price') || t.includes('charge') || t.includes('mpesa') || t.includes('m-pesa'))
    return '**Our Fees:**\n\n- Consultation: KES 5,000\n- Filing preparation: KES 15,000\n- Court fees: ~KES 8,500\n- Advocate rates: KES 8,000–15,000/hr\n\nPayment via **M-Pesa** (STK push) or **Equity Bank** transfer.\n\nWould you like to book a consultation?';
  if (t.includes('land') || t.includes('title') || t.includes('plot') || t.includes('property') || t.includes('elc'))
    return '**Land/Property Disputes (ELC):**\n\n1. Gather your title documents\n2. We draft the Plaint/Originating Summons\n3. Supporting Affidavit + title search\n4. Filed at Environment & Land Court\n5. Serve respondent and attend hearing\n\nGrace Wanjiku specialises in land law.\n\n**Would you like to submit your case?**';
  if (t.includes('divorce') || t.includes('custody') || t.includes('family') || t.includes('marriage') || t.includes('matrimonial'))
    return '**Family Law:**\n\nWe handle divorce, child custody, maintenance, matrimonial property, and adoption — filed at the High Court Family Division.\n\nGrace Wanjiku handles family matters with care and expertise.\n\nWould you like to book a consultation?';
  if (t.includes('criminal') || t.includes('arrested') || t.includes('charge') || t.includes('bail') || t.includes('police'))
    return '**Criminal Defence — Act Immediately:**\n\n- Do NOT speak to police without a lawyer\n- We can apply for **bail immediately**\n- Peter Kamau is our criminal defence expert\n\nCall us now: **+254 700 100 000**\n\nWould you like to submit your case as urgent?';
  if (t.includes('employ') || t.includes('fired') || t.includes('terminat') || t.includes('dismiss') || t.includes('elrc'))
    return '**Wrongful Termination (ELRC):**\n\nYou have **3 years** to file at the Employment & Labour Relations Court.\n\nBring: Employment contract, termination letter, payslips.\n\nGrace Wanjiku handles employment matters.\n\n**Would you like to submit your case?**';
  if (t.includes('register') || t.includes('account') || t.includes('sign up') || t.includes('join') || t.includes('create'))
    return '**Getting Started:**\n\n1. Click **"Create Your Account"**\n2. Enter your name, email, phone\n3. Verify your email (OTP)\n4. Go to **"Submit a Case"**\n5. Follow the 5-step wizard\n6. Pay KES 5,000 via M-Pesa\n7. Advocate contacts you within **24 hours**\n\nReady to begin?';
  if (t.includes('contact') || t.includes('phone') || t.includes('location') || t.includes('where') || t.includes('address') || t.includes('email'))
    return '**Contact Nanyuki Law Firm:**\n\n📍 Nanyuki Town, Laikipia County, Kenya\n📞 +254 700 100 000\n✉️ info@nanyukilaw.com\n\n**Hours:** Mon–Fri 8AM–5PM | Sat 9AM–1PM\n\nOr use our **24/7 online portal**!';
  if (t.includes('efiling') || t.includes('efile') || t.includes('judiciary') || t.includes('court portal') || t.includes('civil') || t.includes('procedure') || t.includes('filing'))
    return '**Civil Case Filing Procedure (Kenya):**\n\n1. Draft Plaint\n2. Prepare Supporting Affidavit\n3. List of Witnesses\n4. List of Documents\n5. Verifying Affidavit\n6. File on **efiling.court.go.ke**\n7. Await court acceptance\n8. Schedule mention\n9. Serve defendant\n10. File Affidavit of Service\n\nOur system prepares steps 1–5 automatically. ✅\n\nWould you like to speak with one of our advocates?';
  if (t.includes('service') || t.includes('practice') || t.includes('area') || t.includes('speciali') || t.includes('what do you') || t.includes('offer') || t.includes('lawyer') || t.includes('advocate') || t.includes('hire'))
    return '**Our 10 Practice Areas:**\n\n1. Commercial Law\n2. Criminal Defence\n3. Civil Litigation\n4. Land & Property (ELC)\n5. Family Law\n6. Employment Law (ELRC)\n7. Intellectual Property (KIPI)\n8. Tax Law\n9. Constitutional Law\n10. Environmental Law\n\nWhich applies to your situation?';
  if (t.includes('commercial') || t.includes('contract') || t.includes('business') || t.includes('company'))
    return '**Commercial Law:**\n\nWe handle business contracts, mergers, acquisitions, corporate compliance, shareholder disputes, and commercial litigation.\n\nPeter Kamau leads our commercial practice.\n\n**Would you like a consultation?**';
  if (t.includes('how long') || t.includes('duration') || t.includes('long') || t.includes('when'))
    return '**Case Duration (approximate):**\n\n- Consultation: Same day / 24–48 hours\n- Simple civil matters: 3–6 months\n- Land disputes: 6–18 months\n- Criminal cases: 2–12 months\n- Employment claims: 4–12 months\n- Family/divorce: 3–9 months\n\nWe give you a realistic timeline at the first consultation.';
  if (t.includes('hello') || t.includes('hi') || t.includes('hii') || t.includes('hey') || t.includes('habari') || t.includes('mambo'))
    return 'Hello! 👋 Welcome to Nanyuki Law Firm.\n\nI\'m Mercy, your AI Legal Assistant. I can help you with:\n\n- **Submitting your case**\n- **Our fees and payment**\n- **Legal procedures** in Kenya\n- **Finding the right advocate**\n- **Contact and location info**\n\nWhat do you need help with today?';
  return '**Hello! I\'m Mercy** 👋\n\nI can help you with:\n\n- How to **submit your case**\n- Our **fees** and M-Pesa payment\n- **Legal procedures** in Kenya\n- Our **practice areas**\n- **Contact** information\n\nJust ask me anything or call: **+254 700 100 000**';
};

const MercyChat: React.FC<MercyChatProps> = ({ isOpen, onClose, guestMode = false }) => {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: guestMode
      ? "Hello! I'm **Mercy**, Nanyuki Law Firm's AI assistant. 👋\n\nI can help you with:\n\n- **Our services** and practice areas\n- **Legal fees** and payment options\n- **How to register** and submit your case\n- **Kenyan legal procedures** in plain language\n- **Finding the right advocate** for your matter\n\nWhat can I help you with today?"
      : "Hello! I'm **Mercy**, your AI Legal Assistant. ⚡\n\nI'm fully briefed on:\n\n- **All system features** — eFiling, documents, billing, calendar\n- **Kenyan court procedures** — civil, criminal, land, employment, family\n- **Kenya Judiciary eFiling** portal guidance\n- **Legal document** preparation tips\n- **Firm info** — team, fees, contacts\n\nHow can I assist you today?",
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const quickPrompts = guestMode ? GUEST_PROMPTS : CLIENT_PROMPTS;

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { if (isOpen && !minimized) inputRef.current?.focus(); }, [isOpen, minimized]);

  const sendMessage = async (text?: string) => {
    const userMessage = (text || input).trim();
    if (!userMessage || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    try {
      const history = messages.slice(-12).map(m => ({ role: m.role, content: m.content }));
      const resp = await fetch('https://lms-loxl.onrender.com/api/mercy-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('nlf_token')}` },
        body: JSON.stringify({ message: userMessage, history, systemPrompt: MERCY_SYSTEM_PROMPT }),
      });
      const data = await resp.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data?.reply || getFallback(userMessage) }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: getFallback(userMessage) }]);
    } finally { setLoading(false); }
  };

  const fmt = (text: string) => text.split('\n').map((line, i) => (
    <p key={i} className={line === '' ? 'h-2' : 'leading-relaxed'}
      dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/^- /, '• ') }} />
  ));

  if (!isOpen) return null;

  return (
    <div className={`fixed z-50 transition-all duration-300 ${minimized ? 'bottom-4 right-4 w-72' : 'bottom-4 right-4 w-96 h-[600px] max-h-[85vh]'}`}>
      <div className={`bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl shadow-2xl flex flex-col overflow-hidden ${minimized ? '' : 'h-full'}`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]"
          style={{ background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 50%, #1565c0 100%)' }}>
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-blue-900" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-white">Mercy AI</h3>
                <Sparkles className="w-3 h-3 text-yellow-300" />
              </div>
              <p className="text-[10px] text-blue-200">{guestMode ? 'Nanyuki Law Firm Assistant' : 'Legal AI · Fully briefed'}</p>
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
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-[var(--hover-bg)] text-[var(--text-primary)] rounded-bl-sm border border-[var(--border-color)]'}`}>
                    {msg.role === 'assistant'
                      ? <div className="space-y-0.5 [&_strong]:font-semibold [&_strong]:text-blue-400">{fmt(msg.content)}</div>
                      : msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center flex-shrink-0 mr-2">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-[var(--hover-bg)] border border-[var(--border-color)] rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex items-center gap-1">
                      {[0,150,300].map(d => <div key={d} className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto">
              {quickPrompts.map(q => (
                <button key={q} onClick={() => sendMessage(q)}
                  className="text-[10px] px-2.5 py-1.5 rounded-full border whitespace-nowrap transition-all hover:border-blue-400 hover:text-blue-400 flex-shrink-0"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', background: 'var(--hover-bg)' }}>
                  {q}
                </button>
              ))}
            </div>
            <div className="px-4 pb-4 pt-1">
              <div className="flex items-center gap-2 p-2 rounded-xl border border-[var(--border-color)] bg-[var(--input-bg)] focus-within:ring-2 focus-within:ring-blue-500/40 transition-all">
                <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                  placeholder="Ask Mercy anything..."
                  className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]" />
                <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
                  className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-center text-[var(--text-secondary)] mt-1.5 opacity-60">Mercy AI · Not a substitute for legal advice</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MercyChat;
