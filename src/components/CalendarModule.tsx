import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { calendarEvents as initialEvents, CalendarEvent, matters } from '@/data/mockData';
import { Plus, ChevronLeft, ChevronRight, X, MapPin, Clock, Users } from 'lucide-react';

const eventTypeColors: Record<string, string> = {
  hearing: '#ef4444', mention: '#f59e0b', deadline: '#dc2626', meeting: '#3b82f6', filing: '#8b5cf6',
};

const CalendarModule: React.FC = () => {
  const { hasPermission, addAuditLog, allUsers } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 1)); // March 2026
  const [showForm, setShowForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'list'>('month');

  const [form, setForm] = useState({ title: '', type: 'meeting' as CalendarEvent['type'], date: '', time: '09:00', endTime: '10:00', matterId: '', location: '', description: '', attendees: '' });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentDate.toLocaleString('en', { month: 'long', year: 'numeric' });

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [firstDay, daysInMonth]);

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const upcomingEvents = events.filter(e => new Date(e.date) >= new Date()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleSave = () => {
    if (!form.title || !form.date) return;
    const matter = matters.find(m => m.id === form.matterId);
    const newEvent: CalendarEvent = {
      id: `e${Date.now()}`, ...form, matterId: form.matterId || undefined,
      matterNumber: matter?.matterNumber, attendees: form.attendees.split(',').map(a => a.trim()).filter(Boolean),
      color: eventTypeColors[form.type] || '#3b82f6',
    };
    setEvents(prev => [...prev, newEvent]);
    addAuditLog('CREATE', 'Calendar', `Created event: ${form.title}`);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Calendar & Hearings</h1>
          <p className="text-sm text-[var(--text-secondary)]">{upcomingEvents.length} upcoming events</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[var(--hover-bg)] rounded-lg p-0.5">
            <button onClick={() => setViewMode('month')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'month' ? 'bg-blue-600 text-white' : 'text-[var(--text-secondary)]'}`}>Month</button>
            <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-[var(--text-secondary)]'}`}>List</button>
          </div>
          {hasPermission('calendar.create') && (
            <button onClick={() => { setForm({ title: '', type: 'meeting', date: '', time: '09:00', endTime: '10:00', matterId: '', location: '', description: '', attendees: '' }); setShowForm(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium">
              <Plus className="w-4 h-4" /> New Event
            </button>
          )}
        </div>
      </div>

      {viewMode === 'month' ? (
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-secondary)]"><ChevronLeft className="w-5 h-5" /></button>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">{monthName}</h3>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-secondary)]"><ChevronRight className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-7">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="px-2 py-2 text-center text-xs font-semibold text-[var(--text-secondary)] border-b border-[var(--border-color)]">{d}</div>
            ))}
            {calendarDays.map((day, i) => {
              const dayEvents = day ? getEventsForDay(day) : [];
              const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
              return (
                <div key={i} className={`min-h-[80px] md:min-h-[100px] p-1 border-b border-r border-[var(--border-color)] ${!day ? 'bg-[var(--hover-bg)]/30' : 'hover:bg-[var(--hover-bg)]/50'} transition-colors`}>
                  {day && (
                    <>
                      <span className={`text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-[var(--text-secondary)]'}`}>{day}</span>
                      <div className="space-y-0.5 mt-0.5">
                        {dayEvents.slice(0, 3).map(e => (
                          <button key={e.id} onClick={() => setSelectedEvent(e)}
                            className="w-full text-left px-1 py-0.5 rounded text-[10px] font-medium truncate text-white"
                            style={{ backgroundColor: eventTypeColors[e.type] || '#3b82f6' }}>
                            {e.title}
                          </button>
                        ))}
                        {dayEvents.length > 3 && <span className="text-[10px] text-[var(--text-secondary)] px-1">+{dayEvents.length - 3} more</span>}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {upcomingEvents.map(e => (
            <div key={e.id} onClick={() => setSelectedEvent(e)}
              className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-4 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl flex flex-col items-center justify-center text-white font-bold flex-shrink-0"
                  style={{ backgroundColor: eventTypeColors[e.type] || '#3b82f6' }}>
                  <span className="text-lg leading-none">{new Date(e.date).getDate()}</span>
                  <span className="text-[10px] uppercase">{new Date(e.date).toLocaleString('en', { month: 'short' })}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{e.title}</p>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mt-1 inline-block" style={{ backgroundColor: `${eventTypeColors[e.type]}20`, color: eventTypeColors[e.type] }}>{e.type}</span>
                    </div>
                    {e.matterNumber && <span className="text-xs text-blue-400 flex-shrink-0">{e.matterNumber}</span>}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-[var(--text-secondary)]">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {e.time} - {e.endTime}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {e.location}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedEvent(null)}>
          <div className="bg-[var(--card-bg)] rounded-xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: eventTypeColors[selectedEvent.type] }} />
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">{selectedEvent.title}</h3>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="text-[var(--text-secondary)]"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-3">
              {[
                ['Type', selectedEvent.type],
                ['Date', new Date(selectedEvent.date).toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })],
                ['Time', `${selectedEvent.time} - ${selectedEvent.endTime}`],
                ['Location', selectedEvent.location],
                ['Matter', selectedEvent.matterNumber || 'N/A'],
                ['Description', selectedEvent.description],
                ['Attendees', selectedEvent.attendees.join(', ')],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">{label}</span>
                  <span className="text-sm font-medium text-[var(--text-primary)] text-right max-w-[60%] capitalize">{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-[var(--card-bg)] rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">New Event</h3>
              <button onClick={() => setShowForm(false)} className="text-[var(--text-secondary)]"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Title <span className="text-red-400">*</span></label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm">
                    {['hearing', 'mention', 'deadline', 'meeting', 'filing'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Date <span className="text-red-400">*</span></label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Start Time</label>
                  <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">End Time</label>
                  <input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Location</label>
                <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Matter</label>
                <select value={form.matterId} onChange={e => setForm({ ...form, matterId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm">
                  <option value="">None</option>
                  {matters.map(m => <option key={m.id} value={m.id}>{m.matterNumber} - {m.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Attendees (comma-separated)</label>
                <input type="text" value={form.attendees} onChange={e => setForm({ ...form, attendees: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] text-sm">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium">Create Event</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarModule;
