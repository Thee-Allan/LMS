import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { tasks as initialTasks, Task, matters } from '@/data/mockData';
import { Plus, Search, Edit2, Trash2, X, ChevronLeft, ChevronRight, CheckCircle2, Clock, AlertTriangle, MessageSquare } from 'lucide-react';

const priorityColors: Record<string, string> = { low: '#10b981', medium: '#3b82f6', high: '#f59e0b', urgent: '#ef4444' };
const statusColors: Record<string, string> = { pending: '#6b7280', in_progress: '#3b82f6', completed: '#10b981', cancelled: '#ef4444' };

const TasksModule: React.FC = () => {
  const { hasPermission, addAuditLog, allUsers, user } = useAuth();
  const [tasksList, setTasksList] = useState<Task[]>(initialTasks);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [page, setPage] = useState(1);
  const [commentText, setCommentText] = useState('');
  const [commentingTask, setCommentingTask] = useState<string | null>(null);
  const perPage = 8;

  const [form, setForm] = useState({ title: '', description: '', matterId: '', assignedToId: '', priority: 'medium' as Task['priority'], status: 'pending' as Task['status'], dueDate: '' });

  const filtered = useMemo(() => {
    return tasksList.filter(t => {
      const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
      const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchSearch && matchPriority && matchStatus;
    });
  }, [tasksList, search, priorityFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const openCreate = () => {
    setForm({ title: '', description: '', matterId: '', assignedToId: '', priority: 'medium', status: 'pending', dueDate: '' });
    setEditingTask(null); setShowForm(true);
  };

  const openEdit = (t: Task) => {
    setForm({ title: t.title, description: t.description, matterId: t.matterId || '', assignedToId: t.assignedToId, priority: t.priority, status: t.status, dueDate: t.dueDate });
    setEditingTask(t); setShowForm(true);
  };

  const handleSave = () => {
    if (!form.title) return;
    const assignee = allUsers.find(u => u.id === form.assignedToId);
    const matter = matters.find(m => m.id === form.matterId);
    if (editingTask) {
      setTasksList(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...form, assignedTo: assignee?.name || t.assignedTo, matterNumber: matter?.matterNumber } : t));
      addAuditLog('UPDATE', 'Tasks', `Updated task: ${form.title}`);
    } else {
      const newTask: Task = { ...form, id: `t${Date.now()}`, assignedTo: assignee?.name || '', matterNumber: matter?.matterNumber, createdAt: new Date().toISOString().split('T')[0], comments: [] };
      setTasksList(prev => [newTask, ...prev]);
      addAuditLog('CREATE', 'Tasks', `Created task: ${form.title}`);
    }
    setShowForm(false);
  };

  const toggleStatus = (t: Task) => {
    const next = t.status === 'completed' ? 'pending' : t.status === 'pending' ? 'in_progress' : 'completed';
    setTasksList(prev => prev.map(x => x.id === t.id ? { ...x, status: next } : x));
    addAuditLog('UPDATE', 'Tasks', `Changed task "${t.title}" status to ${next}`);
  };

  const addComment = (taskId: string) => {
    if (!commentText.trim()) return;
    setTasksList(prev => prev.map(t => t.id === taskId ? { ...t, comments: [...t.comments, { author: user?.name || '', text: commentText, date: new Date().toISOString().split('T')[0] }] } : t));
    setCommentText('');
    setCommentingTask(null);
  };

  const handleDelete = (t: Task) => {
    if (confirm(`Delete task "${t.title}"?`)) {
      setTasksList(prev => prev.filter(x => x.id !== t.id));
      addAuditLog('DELETE', 'Tasks', `Deleted task: ${t.title}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Tasks</h1>
          <p className="text-sm text-[var(--text-secondary)]">{filtered.length} tasks</p>
        </div>
        {hasPermission('tasks.create') && (
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium">
            <Plus className="w-4 h-4" /> New Task
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search tasks..." className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
        </div>
        <select value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm">
          <option value="all">All Priorities</option>
          {['low', 'medium', 'high', 'urgent'].map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm">
          <option value="all">All Status</option>
          {['pending', 'in_progress', 'completed', 'cancelled'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      </div>

      {/* Task Cards */}
      <div className="space-y-3">
        {paginated.map(t => (
          <div key={t.id} className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-4 hover:shadow-md transition-all">
            <div className="flex items-start gap-3">
              <button onClick={() => toggleStatus(t)} className="mt-0.5 flex-shrink-0">
                <CheckCircle2 className={`w-5 h-5 transition-colors ${t.status === 'completed' ? 'text-green-500' : 'text-[var(--text-secondary)] hover:text-blue-400'}`} />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={`text-sm font-medium ${t.status === 'completed' ? 'line-through text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>{t.title}</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">{t.description}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ backgroundColor: `${priorityColors[t.priority]}20`, color: priorityColors[t.priority] }}>{t.priority}</span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ backgroundColor: `${statusColors[t.status]}20`, color: statusColors[t.status] }}>{t.status.replace('_', ' ')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-[var(--text-secondary)]">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Due: {new Date(t.dueDate).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}</span>
                  <span>Assigned: {t.assignedTo}</span>
                  {t.matterNumber && <span>Matter: {t.matterNumber}</span>}
                  <button onClick={() => setCommentingTask(commentingTask === t.id ? null : t.id)} className="flex items-center gap-1 hover:text-blue-400">
                    <MessageSquare className="w-3 h-3" /> {t.comments.length}
                  </button>
                </div>
                {/* Comments */}
                {commentingTask === t.id && (
                  <div className="mt-3 space-y-2 pl-2 border-l-2 border-[var(--border-color)]">
                    {t.comments.map((c, i) => (
                      <div key={i} className="text-xs">
                        <span className="font-medium text-[var(--text-primary)]">{c.author}</span>
                        <span className="text-[var(--text-secondary)]"> - {c.date}</span>
                        <p className="text-[var(--text-secondary)] mt-0.5">{c.text}</p>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input type="text" value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Add comment..."
                        className="flex-1 px-2 py-1 rounded border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-xs" />
                      <button onClick={() => addComment(t.id)} className="px-2 py-1 rounded bg-blue-600 text-white text-xs">Add</button>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {hasPermission('tasks.edit') && <button onClick={() => openEdit(t)} className="p-1 rounded hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-yellow-400"><Edit2 className="w-3.5 h-3.5" /></button>}
                {hasPermission('tasks.delete') && <button onClick={() => handleDelete(t)} className="p-1 rounded hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--text-secondary)]">Page {page} of {totalPages}</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-[var(--hover-bg)] disabled:opacity-30 text-[var(--text-secondary)]"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg hover:bg-[var(--hover-bg)] disabled:opacity-30 text-[var(--text-secondary)]"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-[var(--card-bg)] rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">{editingTask ? 'Edit Task' : 'New Task'}</h3>
              <button onClick={() => setShowForm(false)} className="text-[var(--text-secondary)]"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Title <span className="text-red-400">*</span></label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Matter</label>
                  <select value={form.matterId} onChange={e => setForm({ ...form, matterId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm">
                    <option value="">None</option>
                    {matters.map(m => <option key={m.id} value={m.id}>{m.matterNumber}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Assign To</label>
                  <select value={form.assignedToId} onChange={e => setForm({ ...form, assignedToId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm">
                    <option value="">Select</option>
                    {allUsers.filter(u => u.role !== 'client').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Priority</label>
                  <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm">
                    {['low', 'medium', 'high', 'urgent'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Due Date</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] text-sm">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium">
                  {editingTask ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksModule;
