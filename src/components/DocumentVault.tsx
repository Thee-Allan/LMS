import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Folder, FolderOpen, FileText, Upload, Download, Eye, Trash2, Plus, Search, Lock, Scale, ChevronRight, ChevronDown, File, Image, Archive } from 'lucide-react';

interface VaultFile {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedBy: string;
  uploadedAt: string;
  roles: string[];
}

interface VaultFolder {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  files: VaultFile[];
  locked: boolean;
  lockedFor: string[];
}

interface MatterVault {
  matterId: string;
  matterTitle: string;
  matterRef: string;
  clientName: string;
  folders: VaultFolder[];
}

const SEED_VAULTS: MatterVault[] = [
  {
    matterId: 'm1', matterTitle: 'Safaricom v. Communications Authority', matterRef: 'NLF/2024/0001', clientName: 'Safaricom PLC',
    folders: [
      { id:'f1', name:'Court Filings', icon:<Scale className="w-4 h-4"/>, color:'#3b82f6', locked:false, lockedFor:[],
        files:[
          { id:'fi1', name:'Notice of Motion.pdf', size:'245 KB', type:'pdf', uploadedBy:'Peter Kamau', uploadedAt:'2026-03-01', roles:['super_admin','managing_partner','advocate'] },
          { id:'fi2', name:'Supporting Affidavit.pdf', size:'312 KB', type:'pdf', uploadedBy:'Peter Kamau', uploadedAt:'2026-03-01', roles:['super_admin','managing_partner','advocate'] },
        ]
      },
      { id:'f2', name:'Evidence', icon:<Archive className="w-4 h-4"/>, color:'#8b5cf6', locked:false, lockedFor:[],
        files:[
          { id:'fi3', name:'Communications Authority Decision.pdf', size:'1.2 MB', type:'pdf', uploadedBy:'Grace Wanjiku', uploadedAt:'2026-02-28', roles:['super_admin','managing_partner','advocate'] },
        ]
      },
      { id:'f3', name:'Client Documents', icon:<FileText className="w-4 h-4"/>, color:'#10b981', locked:false, lockedFor:[],
        files:[
          { id:'fi4', name:'Board Resolution.pdf', size:'89 KB', type:'pdf', uploadedBy:'James Mwangi', uploadedAt:'2026-02-25', roles:['super_admin','managing_partner','advocate','client'] },
        ]
      },
      { id:'f4', name:'Correspondence', icon:<File className="w-4 h-4"/>, color:'#f59e0b', locked:false, lockedFor:[],
        files:[
          { id:'fi5', name:'Demand Letter.pdf', size:'156 KB', type:'pdf', uploadedBy:'Peter Kamau', uploadedAt:'2026-02-20', roles:['super_admin','managing_partner','advocate','client'] },
        ]
      },
      { id:'f5', name:'Invoices', icon:<FileText className="w-4 h-4"/>, color:'#ec4899', locked:true, lockedFor:['advocate','client','paralegal'],
        files:[
          { id:'fi6', name:'Invoice NLF-2024-001.pdf', size:'67 KB', type:'pdf', uploadedBy:'James Mwangi', uploadedAt:'2026-02-15', roles:['super_admin','managing_partner','accountant'] },
        ]
      },
    ]
  },
  {
    matterId: 'm2', matterTitle: 'Kimani Land Title Dispute', matterRef: 'NLF/2024/0002', clientName: 'David Kimani',
    folders: [
      { id:'f6', name:'Court Filings', icon:<Scale className="w-4 h-4"/>, color:'#3b82f6', locked:false, lockedFor:[],
        files:[
          { id:'fi7', name:'Originating Summons.pdf', size:'198 KB', type:'pdf', uploadedBy:'Grace Wanjiku', uploadedAt:'2026-02-10', roles:['super_admin','managing_partner','advocate'] },
        ]
      },
      { id:'f7', name:'Title Documents', icon:<FileText className="w-4 h-4"/>, color:'#10b981', locked:false, lockedFor:[],
        files:[
          { id:'fi8', name:'Title Deed Copy.pdf', size:'456 KB', type:'pdf', uploadedBy:'Grace Wanjiku', uploadedAt:'2026-02-08', roles:['super_admin','managing_partner','advocate','client'] },
          { id:'fi9', name:'Land Search Results.pdf', size:'234 KB', type:'pdf', uploadedBy:'Grace Wanjiku', uploadedAt:'2026-02-09', roles:['super_admin','managing_partner','advocate'] },
        ]
      },
      { id:'f8', name:'Client Documents', icon:<FileText className="w-4 h-4"/>, color:'#8b5cf6', locked:false, lockedFor:[],
        files:[
          { id:'fi10', name:'National ID Copy.pdf', size:'123 KB', type:'pdf', uploadedBy:'James Mwangi', uploadedAt:'2026-02-05', roles:['super_admin','managing_partner','advocate','client'] },
        ]
      },
      { id:'f9', name:'Invoices', icon:<FileText className="w-4 h-4"/>, color:'#ec4899', locked:true, lockedFor:['advocate','client','paralegal'],
        files:[]
      },
    ]
  },
];

const fileTypeIcon = (type: string) => {
  if (type === 'pdf') return <FileText className="w-4 h-4 text-red-400" />;
  if (['jpg','jpeg','png'].includes(type)) return <Image className="w-4 h-4 text-blue-400" />;
  return <File className="w-4 h-4 text-gray-400" />;
};

const DocumentVault: React.FC = () => {
  const { user } = useAuth();
  const [vaults] = useState<MatterVault[]>(SEED_VAULTS);
  const [selectedVault, setSelectedVault] = useState<MatterVault | null>(null);
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const isAdmin = ['super_admin', 'managing_partner'].includes(user?.role || '');
  const isClient = user?.role === 'client';

  const toggleFolder = (id: string) => {
    setOpenFolders(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const canAccessFolder = (folder: VaultFolder) => {
    if (user?.role === 'super_admin') return true;
    if (folder.locked && folder.lockedFor.includes(user?.role || '')) return false;
    return true;
  };

  const canAccessFile = (file: VaultFile) => {
    return file.roles.includes(user?.role || '') || user?.role === 'super_admin';
  };

  const displayedVaults = isClient
    ? vaults.filter(v => v.clientName.toLowerCase().includes(user?.name?.split(' ')[0]?.toLowerCase() || ''))
    : vaults.filter(v => !search || v.matterTitle.toLowerCase().includes(search.toLowerCase()) || v.clientName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Document Vault</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">Secure per-matter document storage</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Matter List */}
        <div className="lg:col-span-1 space-y-3">
          {!isClient && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search matters..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)]" />
            </div>
          )}
          {displayedVaults.map(v => (
            <button key={v.matterId} onClick={() => setSelectedVault(v)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${selectedVault?.matterId === v.matterId ? 'border-blue-500 bg-blue-500/10' : 'border-[var(--border-color)] bg-[var(--card-bg)] hover:bg-[var(--hover-bg)]'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Folder className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{v.matterTitle}</p>
                  <p className="text-[11px] text-[var(--text-secondary)]">{v.matterRef} · {v.clientName}</p>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{v.folders.reduce((s, f) => s + f.files.length, 0)} files</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--text-secondary)] flex-shrink-0" />
              </div>
            </button>
          ))}
          {displayedVaults.length === 0 && (
            <div className="text-center py-8 text-[var(--text-secondary)]">
              <Folder className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No vaults found</p>
            </div>
          )}
        </div>

        {/* Folder/File View */}
        <div className="lg:col-span-2">
          {selectedVault ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <Folder className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-[var(--text-primary)]">{selectedVault.matterTitle}</h3>
                <span className="text-xs text-[var(--text-secondary)]">· {selectedVault.matterRef}</span>
              </div>
              {selectedVault.folders.map(folder => {
                const canAccess = canAccessFolder(folder);
                const isOpen = openFolders.has(folder.id);
                const accessibleFiles = folder.files.filter(canAccessFile);
                return (
                  <div key={folder.id} className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] overflow-hidden">
                    <button onClick={() => canAccess && toggleFolder(folder.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${canAccess ? 'hover:bg-[var(--hover-bg)]' : 'opacity-50 cursor-not-allowed'}`}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${folder.color}20`, color: folder.color }}>
                        {isOpen ? <FolderOpen className="w-4 h-4" /> : folder.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-[var(--text-primary)]">{folder.name}</p>
                        <p className="text-[11px] text-[var(--text-secondary)]">{accessibleFiles.length} {canAccess ? 'files' : '— restricted'}</p>
                      </div>
                      {!canAccess ? (
                        <Lock className="w-4 h-4 text-[var(--text-secondary)]" />
                      ) : isOpen ? (
                        <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
                      )}
                    </button>
                    {isOpen && canAccess && (
                      <div className="border-t border-[var(--border-color)]">
                        {accessibleFiles.length === 0 ? (
                          <div className="px-4 py-6 text-center text-[var(--text-secondary)]">
                            <FileText className="w-6 h-6 mx-auto mb-1 opacity-30" />
                            <p className="text-xs">No files yet</p>
                            {isAdmin && (
                              <button className="mt-2 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 mx-auto">
                                <Upload className="w-3 h-3" /> Upload first file
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="divide-y divide-[var(--border-color)]">
                            {accessibleFiles.map(file => (
                              <div key={file.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--hover-bg)] transition-colors">
                                {fileTypeIcon(file.type)}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-[var(--text-primary)] truncate">{file.name}</p>
                                  <p className="text-[10px] text-[var(--text-secondary)]">{file.size} · {file.uploadedBy} · {new Date(file.uploadedAt).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button className="p-1.5 rounded-lg hover:bg-blue-500/10 text-[var(--text-secondary)] hover:text-blue-400 transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                                  <button className="p-1.5 rounded-lg hover:bg-green-500/10 text-[var(--text-secondary)] hover:text-green-400 transition-colors"><Download className="w-3.5 h-3.5" /></button>
                                  {isAdmin && <button className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-secondary)] hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {isAdmin && accessibleFiles.length > 0 && (
                          <div className="px-4 py-2 border-t border-[var(--border-color)]">
                            <button className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                              <Upload className="w-3 h-3" /> Upload file
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-[var(--text-secondary)]">
              <FolderOpen className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">Select a matter to view its vault</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentVault;
