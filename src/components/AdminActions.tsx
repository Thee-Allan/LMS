/**
 * AdminActions – a reusable "⋯" kebab-menu button that renders a rich
 * dropdown with contextual options for admin / advocate / managing-partner /
 * super-admin views.
 *
 * Client users only see a plain "View" eye-button (rendered separately in
 * each module).
 *
 * Usage:
 *   <AdminActions
 *     onView={() => setViewing(item)}
 *     onEdit={hasPermission('x.edit') ? () => openEdit(item) : undefined}
 *     onDelete={hasPermission('x.delete') ? () => handleDelete(item) : undefined}
 *     onExport={() => exportRow(item)}          // optional
 *     onAssign={() => reassign(item)}            // optional
 *     onChangeStatus={() => changeStatus(item)}  // optional
 *     label="Matter"                             // used in aria labels
 *   />
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Eye, Edit2, Trash2, MoreVertical, Download, UserCheck,
  RefreshCw, Printer, Copy, ExternalLink
} from 'lucide-react';

interface AdminActionsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onExport?: () => void;
  onAssign?: () => void;
  onChangeStatus?: () => void;
  onDuplicate?: () => void;
  onPrint?: () => void;
  label?: string;
}

const AdminActions: React.FC<AdminActionsProps> = ({
  onView,
  onEdit,
  onDelete,
  onExport,
  onAssign,
  onChangeStatus,
  onDuplicate,
  onPrint,
  label = 'item',
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const action = (fn?: () => void) => () => {
    setOpen(false);
    fn?.();
  };

  const primaryActions = [
    onView          && { icon: Eye,          label: `View ${label}`,        onClick: action(onView),          color: 'text-blue-400' },
    onEdit          && { icon: Edit2,         label: `Edit ${label}`,        onClick: action(onEdit),          color: 'text-yellow-400' },
    onAssign        && { icon: UserCheck,     label: `Assign / Reassign`,    onClick: action(onAssign),        color: 'text-purple-400' },
    onChangeStatus  && { icon: RefreshCw,     label: `Change Status`,        onClick: action(onChangeStatus),  color: 'text-teal-400' },
  ].filter(Boolean) as { icon: React.ElementType; label: string; onClick: () => void; color: string }[];

  const secondaryActions = [
    onExport        && { icon: Download,      label: `Export / Download`,    onClick: action(onExport),        color: 'text-green-400' },
    onDuplicate     && { icon: Copy,          label: `Duplicate`,            onClick: action(onDuplicate),     color: 'text-cyan-400' },
    onPrint         && { icon: Printer,       label: `Print`,                onClick: action(onPrint),         color: 'text-gray-400' },
  ].filter(Boolean) as { icon: React.ElementType; label: string; onClick: () => void; color: string }[];

  const dangerActions = [
    onDelete        && { icon: Trash2,        label: `Delete ${label}`,      onClick: action(onDelete),        color: 'text-red-400' },
  ].filter(Boolean) as { icon: React.ElementType; label: string; onClick: () => void; color: string }[];

  return (
    <div ref={ref} className="relative flex items-center gap-1">
      {/* Quick View button always visible */}
      {onView && (
        <button
          onClick={onView}
          title={`View ${label}`}
          className="p-1.5 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-blue-400 transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
      )}

      {/* Kebab menu for the rest */}
      {(onEdit || onDelete || onExport || onAssign || onChangeStatus || onDuplicate || onPrint) && (
        <>
          <button
            onClick={() => setOpen(v => !v)}
            title="More actions"
            className={`p-1.5 rounded-lg transition-colors text-[var(--text-secondary)] ${open ? 'bg-[var(--hover-bg)] text-[var(--text-primary)]' : 'hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]'}`}
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-1 z-50 w-52 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-2xl overflow-hidden">
              {/* Primary actions */}
              {primaryActions.length > 0 && (
                <div className="py-1">
                  {primaryActions.map((a, i) => {
                    const Icon = a.icon;
                    return (
                      <button key={i} onClick={a.onClick}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--hover-bg)] transition-colors text-left group">
                        <Icon className={`w-4 h-4 ${a.color} flex-shrink-0`} />
                        <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">{a.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Secondary actions */}
              {secondaryActions.length > 0 && (
                <>
                  <div className="border-t border-[var(--border-color)]" />
                  <div className="py-1">
                    {secondaryActions.map((a, i) => {
                      const Icon = a.icon;
                      return (
                        <button key={i} onClick={a.onClick}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--hover-bg)] transition-colors text-left group">
                          <Icon className={`w-4 h-4 ${a.color} flex-shrink-0`} />
                          <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">{a.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Danger zone */}
              {dangerActions.length > 0 && (
                <>
                  <div className="border-t border-[var(--border-color)]" />
                  <div className="py-1">
                    {dangerActions.map((a, i) => {
                      const Icon = a.icon;
                      return (
                        <button key={i} onClick={a.onClick}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-500/10 transition-colors text-left">
                          <Icon className="w-4 h-4 text-red-400 flex-shrink-0" />
                          <span className="text-sm text-red-400">{a.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminActions;
