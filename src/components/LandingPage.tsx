import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import MercyChat from './MercyChat';
import {
  Scale, Phone, Mail, MapPin, Clock, Star, ChevronRight,
  Shield, FileText, Users, Calendar, MessageCircle,
  CheckCircle, ArrowRight, Menu, X, Briefcase,
  Award, TrendingUp, BookOpen, Gavel, Bot, Eye
} from 'lucide-react';

interface LandingPageProps { onEnterApp: () => void; }

const PRACTICE_AREAS = [
  { icon: '🏢', title: 'Commercial Law',        desc: 'Business contracts, mergers, acquisitions, corporate compliance and shareholder disputes.' },
  { icon: '⚖️', title: 'Criminal Defence',      desc: 'Expert representation at all court levels — bail applications, trials and appeals.' },
  { icon: '📋', title: 'Civil Litigation',      desc: 'Dispute resolution, damages claims and full court representation.' },
  { icon: '🏡', title: 'Land & Property',       desc: 'Title disputes, conveyancing, boundary issues and Environment & Land Court matters.' },
  { icon: '👨‍👩‍👧', title: 'Family Law',            desc: 'Divorce, custody, maintenance, matrimonial property and adoption.' },
  { icon: '💼', title: 'Employment Law',        desc: 'Wrongful termination, ELRC claims, workplace disputes and employment contracts.' },
  { icon: '💡', title: 'Intellectual Property', desc: 'Trademark registration (KIPI), copyright protection and patent advisory.' },
  { icon: '🏛️', title: 'Constitutional Law',    desc: 'Petition filing, fundamental rights enforcement and judicial review.' },
  { icon: '💰', title: 'Tax Law',               desc: 'KRA disputes, tax compliance advisory and appeal proceedings.' },
  { icon: '🌿', title: 'Environmental Law',     desc: 'NEMA compliance, conservation matters and environmental impact disputes.' },
];

const TEAM = [
  { name: 'James Mwangi',  title: 'Managing Partner',  initials: 'JM', speciality: 'Commercial & Constitutional Law', experience: '18 years', color: 'from-blue-600 to-blue-800',   cases: '200+' },
  { name: 'Grace Wanjiku', title: 'Senior Advocate',   initials: 'GW', speciality: 'Land, Family & Employment Law',  experience: '14 years', color: 'from-green-600 to-green-800', cases: '180+' },
  { name: 'Peter Kamau',   title: 'Litigation Expert', initials: 'PK', speciality: 'Commercial, IP & Criminal',      experience: '12 years', color: 'from-purple-600 to-purple-800',cases: '150+' },
];

const TESTIMONIALS = [
  { text: 'Nanyuki Law Firm handled my land dispute with incredible professionalism. I was kept informed at every step and we won.', name: 'David Kimani Njoroge', matter: 'Land Title Dispute', rating: 5 },
  { text: 'Grace Wanjiku fought for me in my wrongful termination case. Her knowledge of employment law is outstanding.', name: 'Jane Achieng Ouma', matter: 'Employment Dispute', rating: 5 },
  { text: 'Peter Kamau secured my bail within hours and built a strong defence. A true professional who genuinely cares.', name: 'Samuel Mutua Kilonzo', matter: 'Criminal Defence', rating: 5 },
  { text: 'Excellent commercial advisory. They helped us draft airtight contracts and navigate a complex merger.', name: 'John Odhiambo – Safaricom', matter: 'Commercial Advisory', rating: 5 },
];

const FAQS = [
  { q: 'How do I submit my case?', a: 'Create a free account, click "Submit a Case" and follow the 5-step wizard. Upload documents, choose an advocate, and pay the KES 5,000 consultation fee via M-Pesa. Your advocate will contact you within 24 hours.' },
  { q: 'What are your legal fees?', a: 'Consultation: KES 5,000. Filing preparation: KES 15,000. Court fees: ~KES 8,500. Advocate rates: KES 8,000–15,000/hr. We provide a full estimate before proceeding.' },
  { q: 'How long does a case take?', a: 'Depends on the matter. Consultations can be same-day. Land disputes: 6–18 months. Criminal cases: 2–12 months. Employment: 4–12 months. We give realistic timelines upfront.' },
  { q: 'Can I track my case online?', a: 'Yes! Your client portal gives real-time case status, hearing dates, documents, direct messages from your advocate, and invoices — 24/7.' },
  { q: 'Do you handle urgent matters?', a: 'Yes — same-day consultations for bail applications, injunctions, and urgent filings. Urgency surcharge of KES 5,000–10,000 applies.' },
  { q: 'What courts do you appear in?', a: 'All Kenyan courts: Supreme Court, Court of Appeal, High Court (all divisions), ELRC, ELC, Magistrate courts, and KIPI for IP matters.' },
];

const STEPS = [
  { n: '01', title: 'Create Account',     desc: 'Register free in 2 minutes. Verify your email.',                           icon: <Users className="w-5 h-5" /> },
  { n: '02', title: 'Submit Your Case',   desc: '5-step guided form. Upload your documents securely.',                       icon: <FileText className="w-5 h-5" /> },
  { n: '03', title: 'Pay & Get Matched',  desc: 'Pay KES 5,000 via M-Pesa. Best advocate assigned.',                         icon: <Phone className="w-5 h-5" /> },
  { n: '04', title: 'Consultation',       desc: 'Meet your advocate — physical, virtual, or phone.',                          icon: <MessageCircle className="w-5 h-5" /> },
  { n: '05', title: 'We Handle the Rest', desc: 'We file, track, and fight your case to resolution.',                         icon: <Gavel className="w-5 h-5" /> },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [mercyOpen, setMercyOpen]     = useState(false);
  const [activeFaq, setActiveFaq]     = useState<number | null>(null);
  const [tab, setTab]                 = useState<'about'|'areas'|'team'|'process'|'faq'>('about');
  const [scrolled, setScrolled]       = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const scrollTo = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); setMobileOpen(false); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white overflow-x-hidden">

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-white/10 ${scrolled ? 'bg-slate-900/95 backdrop-blur-md shadow-lg' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
              <Scale className="w-5 h-5 text-gray-900" />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">NANYUKI LAW FIRM</p>
              <p className="text-[10px] text-yellow-400 tracking-widest">ADVOCATES · NANYUKI</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm">
            {[['about','About'],['areas','Practice Areas'],['team','Our Team'],['process','How It Works'],['faq','FAQ'],['contact','Contact']].map(([id,lbl]) => (
              <button key={id} onClick={() => scrollTo(id)} className="text-gray-300 hover:text-yellow-400 transition-colors font-medium">{lbl}</button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => setMercyOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-blue-400/40 text-blue-300 hover:bg-blue-500/10 transition-all">
              <Bot className="w-3.5 h-3.5" /> Ask Mercy
            </button>
            <Button variant="outline" onClick={onEnterApp} className="border-yellow-400/60 text-yellow-400 hover:bg-yellow-400 hover:text-black text-sm">Sign In</Button>
            <Button onClick={onEnterApp} className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:opacity-90 text-sm font-bold">Get Started →</Button>
          </div>

          <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-slate-900/98 border-t border-white/10 px-4 py-4 space-y-3">
            {[['about','About'],['areas','Practice Areas'],['team','Our Team'],['process','How It Works'],['faq','FAQ'],['contact','Contact']].map(([id,lbl]) => (
              <button key={id} onClick={() => scrollTo(id)} className="block w-full text-left text-gray-300 hover:text-yellow-400 py-2 text-sm">{lbl}</button>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              <Button variant="outline" onClick={onEnterApp} className="border-yellow-400/60 text-yellow-400 w-full">Sign In</Button>
              <Button onClick={onEnterApp} className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black w-full font-bold">Get Started</Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-20 px-4">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-yellow-400/30 text-yellow-400 text-xs font-medium bg-yellow-400/5">
              <Award className="w-3.5 h-3.5" /> 18+ Years of Legal Excellence in Kenya
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
              Justice Begins
              <span className="block bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">With Us</span>
            </h1>
            <p className="text-lg text-gray-300 leading-relaxed max-w-lg">
              Nanyuki Law Firm — trusted by hundreds across Kenya for land disputes, criminal defence, commercial law, family matters, and more.
            </p>
            <div className="grid grid-cols-3 gap-6">
              {[['500+','Cases Handled'],['200+','Happy Clients'],['98%','Success Rate']].map(([v,l]) => (
                <div key={l}><p className="text-3xl font-bold text-yellow-400">{v}</p><p className="text-xs text-gray-400 mt-0.5">{l}</p></div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={onEnterApp} className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-base py-5 px-7 hover:opacity-90 font-bold">
                Submit Your Case →
              </Button>
              <Button variant="outline" onClick={() => setMercyOpen(true)} className="border-blue-400/50 text-blue-300 text-base py-5 px-7 hover:bg-blue-500/10">
                <Bot className="w-4 h-4 mr-2" /> Ask Mercy AI
              </Button>
            </div>
            <p className="text-xs text-gray-500">Free to register · No commitment · KES 5,000 consultation</p>
          </div>

          {/* Portal Preview Card */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl blur-3xl" />
            <div className="relative bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                  <Scale className="w-4 h-4 text-black" />
                </div>
                <div>
                  <p className="font-bold text-sm">Client Portal</p>
                  <p className="text-[10px] text-gray-400">Your legal hub — 24/7</p>
                </div>
              </div>
              {[
                { icon: <Eye className="w-4 h-4 text-blue-400" />,         label: 'Track your cases in real-time' },
                { icon: <FileText className="w-4 h-4 text-green-400" />,   label: 'Access and share documents securely' },
                { icon: <MessageCircle className="w-4 h-4 text-purple-400" />, label: 'Chat directly with your advocate' },
                { icon: <Phone className="w-4 h-4 text-yellow-400" />,     label: 'Pay fees via M-Pesa instantly' },
                { icon: <Calendar className="w-4 h-4 text-red-400" />,    label: 'Get hearing date reminders' },
                { icon: <Bot className="w-4 h-4 text-cyan-400" />,         label: 'Ask Mercy AI legal questions anytime' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                  {item.icon}
                  <span className="text-sm text-gray-200">{item.label}</span>
                  <CheckCircle className="w-3.5 h-3.5 text-green-400 ml-auto flex-shrink-0" />
                </div>
              ))}
              <Button onClick={onEnterApp} className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold mt-2">
                Create Free Account
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Band */}
      <section className="py-8 bg-gradient-to-r from-yellow-400 to-orange-500 text-black">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[['500+','Cases Handled'],['18+','Years Experience'],['10','Practice Areas'],['98%','Client Satisfaction']].map(([v,l]) => (
            <div key={l}><p className="text-3xl font-black">{v}</p><p className="text-sm font-medium opacity-80">{l}</p></div>
          ))}
        </div>
      </section>

      {/* Guest Zone — Tabbed Explorer */}
      <section id="about" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-yellow-400 text-sm font-semibold tracking-widest mb-2">EXPLORE THE FIRM</p>
            <h2 className="text-4xl font-bold">Everything You Need to Know</h2>
            <p className="text-gray-400 mt-3">Browse freely — no account required</p>
          </div>

          {/* Tab Buttons */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {([['about','About Us'],['areas','Practice Areas'],['team','Our Team'],['process','How It Works'],['faq','FAQ']] as const).map(([id,lbl]) => (
              <button key={id} onClick={() => setTab(id)}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                style={{
                  background: tab === id ? 'linear-gradient(135deg,#fbbf24,#f97316)' : 'rgba(255,255,255,0.05)',
                  color: tab === id ? '#000' : '#9ca3af',
                  border: tab === id ? 'none' : '1px solid rgba(255,255,255,0.1)',
                }}>
                {lbl}
              </button>
            ))}
          </div>

          {/* About */}
          {tab === 'about' && (
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h3 className="text-3xl font-bold">Kenya's Trusted Legal Partners</h3>
                <p className="text-gray-300 leading-relaxed">Established in Nanyuki Town, Laikipia County, Nanyuki Law Firm has been the go-to legal practice for individuals, businesses, and government bodies across Central Kenya for 18+ years.</p>
                <p className="text-gray-300 leading-relaxed">We combine deep knowledge of Kenyan law with modern technology — giving clients real-time case updates, secure document sharing, and direct advocate communication through our digital portal.</p>
                <div className="space-y-3">
                  {['Licensed by the Law Society of Kenya','Appearing in all Kenyan courts including the Supreme Court','Modern digital case management portal','Multilingual — English and Swahili','Transparent pricing — no hidden fees'].map(item => (
                    <div key={item} className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                      <span className="text-gray-300 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
                <Button onClick={onEnterApp} className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold">
                  Work With Us <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: <Shield className="w-6 h-6" />,    title: 'Integrity',  desc: 'Highest ethical standards in every matter we handle.' },
                  { icon: <TrendingUp className="w-6 h-6" />, title: 'Results',    desc: 'Track record of successful outcomes for our clients.' },
                  { icon: <Users className="w-6 h-6" />,      title: 'Client First',desc: 'Your interests are our only priority throughout.' },
                  { icon: <BookOpen className="w-6 h-6" />,   title: 'Expertise',  desc: '18+ years of deep Kenyan legal knowledge across 10 areas.' },
                ].map(card => (
                  <div key={card.title} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all">
                    <div className="text-yellow-400 mb-3">{card.icon}</div>
                    <p className="font-semibold mb-1">{card.title}</p>
                    <p className="text-xs text-gray-400">{card.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Practice Areas */}
          {tab === 'areas' && (
            <div id="areas">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {PRACTICE_AREAS.map(a => (
                  <div key={a.title} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 hover:border-yellow-400/30 transition-all group">
                    <p className="text-3xl mb-3">{a.icon}</p>
                    <h3 className="font-bold text-sm mb-2 group-hover:text-yellow-400 transition-colors">{a.title}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">{a.desc}</p>
                  </div>
                ))}
              </div>
              <div className="text-center mt-10">
                <p className="text-gray-400 text-sm mb-4">Not sure which area applies to you?</p>
                <button onClick={() => setMercyOpen(true)} className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl border border-blue-400/40 text-blue-300 hover:bg-blue-500/10 transition-all text-sm font-medium">
                  <Bot className="w-4 h-4" /> Ask Mercy AI for guidance
                </button>
              </div>
            </div>
          )}

          {/* Team */}
          {tab === 'team' && (
            <div id="team" className="grid md:grid-cols-3 gap-8">
              {TEAM.map(m => (
                <div key={m.name} className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center hover:bg-white/10 transition-all">
                  <div className={`w-20 h-20 mx-auto mb-4 bg-gradient-to-br ${m.color} rounded-full flex items-center justify-center text-2xl font-black text-white`}>{m.initials}</div>
                  <h3 className="text-lg font-bold mb-1">{m.name}</h3>
                  <p className="text-yellow-400 text-sm font-medium mb-3">{m.title}</p>
                  <p className="text-gray-400 text-xs mb-4 leading-relaxed">{m.speciality}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-lg p-3"><p className="text-yellow-400 font-bold">{m.cases}</p><p className="text-[10px] text-gray-400">Cases</p></div>
                    <div className="bg-white/5 rounded-lg p-3"><p className="text-yellow-400 font-bold">{m.experience}</p><p className="text-[10px] text-gray-400">Experience</p></div>
                  </div>
                  <Button onClick={onEnterApp} variant="outline" className="w-full mt-4 border-white/20 text-white hover:bg-white/10 text-xs">Book Consultation</Button>
                </div>
              ))}
            </div>
          )}

          {/* How It Works */}
          {tab === 'process' && (
            <div id="process" className="max-w-3xl mx-auto space-y-4">
              {STEPS.map((s, i) => (
                <div key={s.n} className="flex items-start gap-5 bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center flex-shrink-0 text-black">{s.icon}</div>
                  <div className="flex-1">
                    <p className="text-yellow-400 text-xs font-bold mb-1">STEP {s.n}</p>
                    <h3 className="font-bold text-sm mb-1">{s.title}</h3>
                    <p className="text-gray-400 text-xs leading-relaxed">{s.desc}</p>
                  </div>
                  {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0 mt-3" />}
                </div>
              ))}
              <div className="text-center pt-4">
                <Button onClick={onEnterApp} className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold px-8 py-4 text-base">Start Your Case Now →</Button>
              </div>
            </div>
          )}

          {/* FAQ */}
          {tab === 'faq' && (
            <div id="faq" className="max-w-3xl mx-auto space-y-3">
              {FAQS.map((faq, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                  <button onClick={() => setActiveFaq(activeFaq === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors">
                    <span className="font-semibold text-sm">{faq.q}</span>
                    <span className="text-yellow-400 flex-shrink-0 ml-3 text-lg">{activeFaq === i ? '−' : '+'}</span>
                  </button>
                  {activeFaq === i && <div className="px-5 pb-5"><p className="text-gray-300 text-sm leading-relaxed">{faq.a}</p></div>}
                </div>
              ))}
              <div className="text-center pt-4">
                <p className="text-gray-400 text-sm mb-3">More questions?</p>
                <button onClick={() => setMercyOpen(true)} className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl border border-blue-400/40 text-blue-300 hover:bg-blue-500/10 transition-all text-sm font-medium">
                  <Bot className="w-4 h-4" /> Ask Mercy AI — instant answers
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-yellow-400 text-sm font-semibold tracking-widest mb-2">CLIENT VOICES</p>
            <h2 className="text-4xl font-bold">What Our Clients Say</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
                <div className="flex gap-0.5 mb-3">{Array(t.rating).fill(0).map((_,j) => <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}</div>
                <p className="text-gray-300 text-sm italic mb-4 leading-relaxed">"{t.text}"</p>
                <p className="font-semibold text-sm">{t.name}</p>
                <p className="text-yellow-400 text-xs">{t.matter}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl p-12 text-black text-center">
            <h2 className="text-4xl font-black mb-4">Ready to Get Started?</h2>
            <p className="text-lg opacity-80 mb-8 max-w-xl mx-auto">Join hundreds of Kenyans who trust Nanyuki Law Firm. Create your account in 2 minutes.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={onEnterApp} className="bg-black text-white text-base py-5 px-8 hover:bg-gray-900 font-bold">Create Free Account</Button>
              <Button variant="outline" onClick={onEnterApp} className="border-black text-black text-base py-5 px-8 hover:bg-black hover:text-white">Sign In to Portal</Button>
            </div>
            <p className="text-xs opacity-60 mt-4">Free to register · KES 5,000 consultation · Secure portal</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="py-16 bg-black/40 border-t border-white/10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center"><Scale className="w-4 h-4 text-black" /></div>
                <p className="font-bold text-sm">NANYUKI LAW FIRM</p>
              </div>
              <p className="text-gray-400 text-xs leading-relaxed">Trusted legal services in Nanyuki Town, Laikipia County — serving Kenya for 18+ years.</p>
            </div>
            <div>
              <p className="font-semibold text-sm mb-4 text-yellow-400">Contact Us</p>
              <div className="space-y-3">
                {[
                  [<MapPin className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />, 'Nanyuki Town, Laikipia County, Kenya'],
                  [<Phone className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />, '+254 700 100 000'],
                  [<Mail className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />, 'info@nanyukilaw.com'],
                  [<Clock className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />, 'Mon–Fri 8AM–5PM · Sat 9AM–1PM'],
                ].map(([icon, text], i) => (
                  <div key={i} className="flex items-center gap-2 text-gray-400 text-xs">{icon}{text}</div>
                ))}
              </div>
            </div>
            <div>
              <p className="font-semibold text-sm mb-4 text-yellow-400">Practice Areas</p>
              <div className="space-y-2">
                {['Commercial Law','Criminal Defence','Land & Property','Family Law','Employment Law'].map(a => (
                  <p key={a} className="text-gray-400 text-xs hover:text-yellow-400 cursor-pointer transition-colors">{a}</p>
                ))}
              </div>
            </div>
            <div>
              <p className="font-semibold text-sm mb-4 text-yellow-400">Client Portal</p>
              <div className="space-y-2 mb-4">
                {['Submit a Case','Track Your Matter','Pay via M-Pesa','Chat with Advocate','View Documents'].map(a => (
                  <p key={a} className="text-gray-400 text-xs">{a}</p>
                ))}
              </div>
              <Button onClick={onEnterApp} size="sm" className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold">Login to Portal →</Button>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <p>© 2026 Nanyuki Law Firm. All rights reserved. Licensed by the Law Society of Kenya.</p>
            <p>Powered by <span className="text-yellow-400">LexKenya</span> Law Firm OS</p>
          </div>
        </div>
      </footer>

      {/* Floating Mercy Button */}
      {!mercyOpen && (
        <button onClick={() => setMercyOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full shadow-2xl font-semibold text-sm transition-all hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg,#1a237e,#1565c0)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}>
          <Bot className="w-4 h-4" />
          Ask Mercy AI
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        </button>
      )}

      <MercyChat isOpen={mercyOpen} onClose={() => setMercyOpen(false)} guestMode={true} />
    </div>
  );
};
