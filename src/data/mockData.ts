export interface Client {
  id: string; name: string; type: 'individual' | 'corporate'; email: string; phone: string;
  kraPin: string; address: string; idNumber: string; contactPerson?: string;
  notes: string; status: 'active' | 'inactive'; createdAt: string; mattersCount: number;
}

export interface Matter {
  id: string; matterNumber: string; title: string; clientId: string; clientName: string;
  practiceArea: string; status: 'consultation' | 'active' | 'court' | 'settled' | 'closed' | 'archived';
  assignedAdvocate: string; assignedAdvocateId: string; court: string; registry: string;
  filingDate: string; nextHearing: string; description: string; opposingParty: string;
  opposingCounsel: string; createdAt: string; value: number;
}

export interface Task {
  id: string; title: string; description: string; matterId?: string; matterNumber?: string;
  assignedTo: string; assignedToId: string; priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'; dueDate: string;
  createdAt: string; comments: { author: string; text: string; date: string }[];
}

export interface CalendarEvent {
  id: string; title: string; type: 'hearing' | 'mention' | 'deadline' | 'meeting' | 'filing';
  date: string; time: string; endTime: string; matterId?: string; matterNumber?: string;
  location: string; description: string; attendees: string[];
  color: string;
}

export interface Document {
  id: string; name: string; type: string; size: string; matterId?: string; matterNumber?: string;
  clientId?: string; clientName?: string; uploadedBy: string; uploadedAt: string;
  tags: string[]; version: number; accessLevel: 'public' | 'team' | 'restricted';
  category: 'pleading' | 'correspondence' | 'evidence' | 'contract' | 'template' | 'other';
}

export interface Invoice {
  id: string; invoiceNumber: string; matterId: string; matterNumber: string;
  clientId: string; clientName: string; amount: number; paid: number;
  status: 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string; issuedDate: string; items: { description: string; hours: number; rate: number; amount: number }[];
  tax: number; discount: number;
}

export interface TimeEntry {
  id: string; matterId: string; matterNumber: string; userId: string; userName: string;
  date: string; hours: number; description: string; billable: boolean;
  rate: number; status: 'pending' | 'approved' | 'billed';
}

export interface Notification {
  id: string; title: string; message: string; type: 'deadline' | 'hearing' | 'task' | 'invoice' | 'system';
  read: boolean; createdAt: string; link?: string;
}

export const clients: Client[] = [
  { id: 'c1', name: 'Safaricom PLC', type: 'corporate', email: 'legal@safaricom.co.ke', phone: '+254 722 000 001', kraPin: 'P051234567A', address: 'Safaricom House, Waiyaki Way, Nairobi', idNumber: 'PVT-2024-001', contactPerson: 'John Odhiambo', notes: 'Major corporate client, priority handling', status: 'active', createdAt: '2024-01-15', mattersCount: 4 },
  { id: 'c2', name: 'Kenya Power & Lighting', type: 'corporate', email: 'legal@kplc.co.ke', phone: '+254 722 000 002', kraPin: 'P051234568B', address: 'Stima Plaza, Kolobot Rd, Nairobi', idNumber: 'PVT-2024-002', contactPerson: 'Alice Muthoni', notes: 'Ongoing regulatory matters', status: 'active', createdAt: '2024-02-10', mattersCount: 3 },
  { id: 'c3', name: 'David Kimani Njoroge', type: 'individual', email: 'david.kimani@gmail.com', phone: '+254 712 345 678', kraPin: 'A012345678B', address: '45 Moi Avenue, Nanyuki', idNumber: '28901234', notes: 'Land dispute case', status: 'active', createdAt: '2024-03-05', mattersCount: 2 },
  { id: 'c4', name: 'Equity Bank Limited', type: 'corporate', email: 'legal@equitybank.co.ke', phone: '+254 722 000 003', kraPin: 'P051234569C', address: 'Equity Centre, Hospital Rd, Nairobi', idNumber: 'PVT-2024-003', contactPerson: 'Sarah Wambui', notes: 'Banking litigation matters', status: 'active', createdAt: '2024-01-20', mattersCount: 5 },
  { id: 'c5', name: 'Jane Achieng Ouma', type: 'individual', email: 'jane.ouma@yahoo.com', phone: '+254 733 456 789', kraPin: 'A012345679C', address: '12 Kenyatta Street, Nanyuki', idNumber: '31234567', notes: 'Employment dispute', status: 'active', createdAt: '2024-04-12', mattersCount: 1 },
  { id: 'c6', name: 'Mt. Kenya Breweries', type: 'corporate', email: 'legal@mkb.co.ke', phone: '+254 722 000 004', kraPin: 'P051234570D', address: 'Industrial Area, Nanyuki', idNumber: 'PVT-2024-004', contactPerson: 'Michael Maina', notes: 'IP and trademark matters', status: 'active', createdAt: '2024-05-01', mattersCount: 2 },
  { id: 'c7', name: 'Samuel Mutua Kilonzo', type: 'individual', email: 'samuel.mutua@gmail.com', phone: '+254 700 567 890', kraPin: 'A012345680E', address: '78 Laikipia Road, Nanyuki', idNumber: '29876543', notes: 'Criminal defense case', status: 'active', createdAt: '2024-06-15', mattersCount: 1 },
  { id: 'c8', name: 'Nanyuki Ranch Ltd', type: 'corporate', email: 'admin@nanyukiranch.co.ke', phone: '+254 722 000 005', kraPin: 'P051234571F', address: 'Ranch Road, Nanyuki', idNumber: 'PVT-2024-005', contactPerson: 'Elizabeth Njeri', notes: 'Land and property matters', status: 'active', createdAt: '2024-02-28', mattersCount: 3 },
  { id: 'c9', name: 'Florence Wangari Mwangi', type: 'individual', email: 'florence.w@gmail.com', phone: '+254 711 678 901', kraPin: 'A012345681G', address: '23 Cedar Lane, Nanyuki', idNumber: '30123456', notes: 'Family law - divorce proceedings', status: 'active', createdAt: '2024-07-20', mattersCount: 1 },
  { id: 'c10', name: 'Laikipia County Government', type: 'corporate', email: 'legal@laikipia.go.ke', phone: '+254 722 000 006', kraPin: 'P051234572H', address: 'County HQ, Nanyuki', idNumber: 'GOV-2024-001', contactPerson: 'Patrick Karanja', notes: 'Government advisory and litigation', status: 'active', createdAt: '2024-01-05', mattersCount: 6 },
  { id: 'c11', name: 'Robert Otieno Ochieng', type: 'individual', email: 'robert.otieno@gmail.com', phone: '+254 723 789 012', kraPin: 'A012345682I', address: '56 Market Street, Nanyuki', idNumber: '27654321', notes: 'Commercial dispute', status: 'inactive', createdAt: '2023-11-10', mattersCount: 1 },
  { id: 'c12', name: 'Ol Pejeta Conservancy', type: 'corporate', email: 'legal@olpejeta.org', phone: '+254 722 000 007', kraPin: 'P051234573J', address: 'Ol Pejeta, Nanyuki', idNumber: 'NGO-2024-001', contactPerson: 'Catherine Wanjiku', notes: 'Conservation and land rights', status: 'active', createdAt: '2024-03-18', mattersCount: 2 },
];

export const matters: Matter[] = [
  { id: 'm1', matterNumber: 'NLF/2024/0001', title: 'Safaricom v. Communications Authority - Licensing Dispute', clientId: 'c1', clientName: 'Safaricom PLC', practiceArea: 'Commercial', status: 'court', assignedAdvocate: 'Peter Kamau', assignedAdvocateId: '3', court: 'High Court of Kenya - Milimani', registry: 'Commercial Division', filingDate: '2024-02-15', nextHearing: '2026-03-10', description: 'Dispute regarding telecommunications licensing fees and regulatory compliance', opposingParty: 'Communications Authority of Kenya', opposingCounsel: 'Kaplan & Stratton Advocates', createdAt: '2024-02-10', value: 5000000 },
  { id: 'm2', matterNumber: 'NLF/2024/0002', title: 'Kimani Land Title Dispute - Nanyuki Plot LR 1234', clientId: 'c3', clientName: 'David Kimani Njoroge', practiceArea: 'Land', status: 'active', assignedAdvocate: 'Grace Wanjiku', assignedAdvocateId: '2', court: 'Environment & Land Court - Nanyuki', registry: 'Land Division', filingDate: '2024-03-20', nextHearing: '2026-03-15', description: 'Land title dispute over Plot LR 1234 in Nanyuki town', opposingParty: 'Joseph Mwangi Karanja', opposingCounsel: 'Mwangi & Associates', createdAt: '2024-03-15', value: 8000000 },
  { id: 'm3', matterNumber: 'NLF/2024/0003', title: 'Equity Bank Debt Recovery - Commercial Loan Default', clientId: 'c4', clientName: 'Equity Bank Limited', practiceArea: 'Commercial', status: 'active', assignedAdvocate: 'Peter Kamau', assignedAdvocateId: '3', court: 'High Court - Nairobi', registry: 'Commercial Division', filingDate: '2024-04-01', nextHearing: '2026-03-20', description: 'Recovery of KES 25M commercial loan default', opposingParty: 'ABC Trading Company Ltd', opposingCounsel: 'Hamilton Harrison & Mathews', createdAt: '2024-03-28', value: 25000000 },
  { id: 'm4', matterNumber: 'NLF/2024/0004', title: 'Ouma v. TechCorp Kenya - Wrongful Termination', clientId: 'c5', clientName: 'Jane Achieng Ouma', practiceArea: 'Employment', status: 'court', assignedAdvocate: 'Grace Wanjiku', assignedAdvocateId: '2', court: 'Employment & Labour Relations Court', registry: 'Nairobi', filingDate: '2024-05-10', nextHearing: '2026-03-05', description: 'Wrongful termination claim with discrimination allegations', opposingParty: 'TechCorp Kenya Ltd', opposingCounsel: 'Bowmans Kenya', createdAt: '2024-05-05', value: 3500000 },
  { id: 'm5', matterNumber: 'NLF/2024/0005', title: 'Mt. Kenya Breweries Trademark Registration', clientId: 'c6', clientName: 'Mt. Kenya Breweries', practiceArea: 'IP', status: 'active', assignedAdvocate: 'Peter Kamau', assignedAdvocateId: '3', court: 'KIPI - Kenya Industrial Property Institute', registry: 'Trademark Registry', filingDate: '2024-06-01', nextHearing: '2026-04-01', description: 'Trademark registration and protection for new product line', opposingParty: 'N/A', opposingCounsel: 'N/A', createdAt: '2024-05-28', value: 1500000 },
  { id: 'm6', matterNumber: 'NLF/2024/0006', title: 'Republic v. Samuel Mutua - Criminal Defense', clientId: 'c7', clientName: 'Samuel Mutua Kilonzo', practiceArea: 'Criminal', status: 'court', assignedAdvocate: 'Grace Wanjiku', assignedAdvocateId: '2', court: "Chief Magistrate's Court - Nanyuki", registry: 'Criminal Division', filingDate: '2024-07-01', nextHearing: '2026-03-08', description: 'Criminal defense - fraud charges', opposingParty: 'Republic of Kenya', opposingCounsel: 'Office of DPP', createdAt: '2024-06-28', value: 2000000 },
  { id: 'm7', matterNumber: 'NLF/2024/0007', title: 'Nanyuki Ranch Boundary Dispute', clientId: 'c8', clientName: 'Nanyuki Ranch Ltd', practiceArea: 'Land', status: 'consultation', assignedAdvocate: 'Peter Kamau', assignedAdvocateId: '3', court: 'Environment & Land Court', registry: 'Nanyuki', filingDate: '', nextHearing: '', description: 'Boundary dispute with neighboring property', opposingParty: 'Laikipia Farmers Cooperative', opposingCounsel: 'TBD', createdAt: '2024-08-01', value: 12000000 },
  { id: 'm8', matterNumber: 'NLF/2024/0008', title: 'Wangari Divorce Proceedings', clientId: 'c9', clientName: 'Florence Wangari Mwangi', practiceArea: 'Family', status: 'active', assignedAdvocate: 'Grace Wanjiku', assignedAdvocateId: '2', court: 'Family Division - High Court', registry: 'Nairobi', filingDate: '2024-08-15', nextHearing: '2026-03-25', description: 'Divorce proceedings with property and custody disputes', opposingParty: 'James Mwangi Kariuki', opposingCounsel: 'Iseme Kamau & Maema', createdAt: '2024-08-10', value: 4000000 },
  { id: 'm9', matterNumber: 'NLF/2024/0009', title: 'Laikipia County Procurement Advisory', clientId: 'c10', clientName: 'Laikipia County Government', practiceArea: 'Commercial', status: 'active', assignedAdvocate: 'Peter Kamau', assignedAdvocateId: '3', court: 'N/A - Advisory', registry: 'N/A', filingDate: '', nextHearing: '', description: 'Advisory on public procurement compliance and tender disputes', opposingParty: 'N/A', opposingCounsel: 'N/A', createdAt: '2024-01-10', value: 3000000 },
  { id: 'm10', matterNumber: 'NLF/2024/0010', title: 'KPLC Power Line Easement Dispute', clientId: 'c2', clientName: 'Kenya Power & Lighting', practiceArea: 'Land', status: 'settled', assignedAdvocate: 'Grace Wanjiku', assignedAdvocateId: '2', court: 'Environment & Land Court', registry: 'Nanyuki', filingDate: '2024-03-01', nextHearing: '', description: 'Easement dispute for power line installation through private land', opposingParty: 'Multiple Landowners', opposingCounsel: 'Various', createdAt: '2024-02-25', value: 6000000 },
  { id: 'm11', matterNumber: 'NLF/2025/0011', title: 'Ol Pejeta Conservation Easement', clientId: 'c12', clientName: 'Ol Pejeta Conservancy', practiceArea: 'Land', status: 'active', assignedAdvocate: 'Peter Kamau', assignedAdvocateId: '3', court: 'N/A', registry: 'N/A', filingDate: '', nextHearing: '', description: 'Drafting and registration of conservation easement agreements', opposingParty: 'N/A', opposingCounsel: 'N/A', createdAt: '2025-01-15', value: 2500000 },
  { id: 'm12', matterNumber: 'NLF/2025/0012', title: 'Safaricom Data Privacy Compliance', clientId: 'c1', clientName: 'Safaricom PLC', practiceArea: 'Commercial', status: 'consultation', assignedAdvocate: 'Grace Wanjiku', assignedAdvocateId: '2', court: 'N/A - Advisory', registry: 'N/A', filingDate: '', nextHearing: '', description: 'Advisory on Data Protection Act compliance and GDPR alignment', opposingParty: 'N/A', opposingCounsel: 'N/A', createdAt: '2025-02-01', value: 2000000 },
];

export const tasks: Task[] = [
  { id: 't1', title: 'Draft Statement of Claim - Safaricom v. CA', description: 'Prepare and file the statement of claim for the licensing dispute', matterId: 'm1', matterNumber: 'NLF/2024/0001', assignedTo: 'Peter Kamau', assignedToId: '3', priority: 'high', status: 'in_progress', dueDate: '2026-03-05', createdAt: '2026-02-20', comments: [{ author: 'Grace Wanjiku', text: 'Please include the 2023 regulatory amendments', date: '2026-02-21' }] },
  { id: 't2', title: 'File Land Search - Kimani Matter', description: 'Conduct official land search at Nanyuki Land Registry', matterId: 'm2', matterNumber: 'NLF/2024/0002', assignedTo: 'Grace Wanjiku', assignedToId: '2', priority: 'urgent', status: 'pending', dueDate: '2026-03-01', createdAt: '2026-02-18', comments: [] },
  { id: 't3', title: 'Prepare Witness Statements - Ouma Case', description: 'Interview and prepare witness statements for employment tribunal', matterId: 'm4', matterNumber: 'NLF/2024/0004', assignedTo: 'Grace Wanjiku', assignedToId: '2', priority: 'high', status: 'pending', dueDate: '2026-03-03', createdAt: '2026-02-19', comments: [] },
  { id: 't4', title: 'Review Trademark Application - MKB', description: 'Review and finalize trademark application documents', matterId: 'm5', matterNumber: 'NLF/2024/0005', assignedTo: 'Peter Kamau', assignedToId: '3', priority: 'medium', status: 'completed', dueDate: '2026-02-28', createdAt: '2026-02-15', comments: [{ author: 'Peter Kamau', text: 'Application submitted to KIPI', date: '2026-02-27' }] },
  { id: 't5', title: 'Client Meeting - Nanyuki Ranch', description: 'Schedule and conduct initial consultation for boundary dispute', matterId: 'm7', matterNumber: 'NLF/2024/0007', assignedTo: 'Peter Kamau', assignedToId: '3', priority: 'medium', status: 'in_progress', dueDate: '2026-03-07', createdAt: '2026-02-22', comments: [] },
  { id: 't6', title: 'Prepare Invoice - Equity Bank Q1', description: 'Generate quarterly invoice for Equity Bank matters', matterId: 'm3', matterNumber: 'NLF/2024/0003', assignedTo: 'Grace Wanjiku', assignedToId: '2', priority: 'medium', status: 'pending', dueDate: '2026-03-10', createdAt: '2026-02-24', comments: [] },
  { id: 't7', title: 'Court Filing - Mutua Criminal Defense', description: 'File defense response before court deadline', matterId: 'm6', matterNumber: 'NLF/2024/0006', assignedTo: 'Grace Wanjiku', assignedToId: '2', priority: 'urgent', status: 'in_progress', dueDate: '2026-03-02', createdAt: '2026-02-20', comments: [{ author: 'Grace Wanjiku', text: 'Need additional evidence documents from client', date: '2026-02-23' }] },
  { id: 't8', title: 'Draft Procurement Advisory Memo', description: 'Prepare advisory memo on procurement compliance for Laikipia County', matterId: 'm9', matterNumber: 'NLF/2024/0009', assignedTo: 'Peter Kamau', assignedToId: '3', priority: 'low', status: 'pending', dueDate: '2026-03-15', createdAt: '2026-02-24', comments: [] },
  { id: 't9', title: 'Divorce Settlement Proposal', description: 'Draft settlement proposal for Wangari divorce case', matterId: 'm8', matterNumber: 'NLF/2024/0008', assignedTo: 'Grace Wanjiku', assignedToId: '2', priority: 'high', status: 'pending', dueDate: '2026-03-12', createdAt: '2026-02-23', comments: [] },
  { id: 't10', title: 'Data Protection Audit Report', description: 'Complete data protection compliance audit report for Safaricom', matterId: 'm12', matterNumber: 'NLF/2025/0012', assignedTo: 'Peter Kamau', assignedToId: '3', priority: 'medium', status: 'pending', dueDate: '2026-03-20', createdAt: '2026-02-25', comments: [] },
];

export const calendarEvents: CalendarEvent[] = [
  { id: 'e1', title: 'Hearing - Safaricom v. CA', type: 'hearing', date: '2026-03-10', time: '09:00', endTime: '12:00', matterId: 'm1', matterNumber: 'NLF/2024/0001', location: 'High Court - Milimani, Court Room 3', description: 'Main hearing for licensing dispute', attendees: ['Peter Kamau', 'Grace Wanjiku'], color: '#ef4444' },
  { id: 'e2', title: 'Mention - Kimani Land Dispute', type: 'mention', date: '2026-03-15', time: '10:00', endTime: '10:30', matterId: 'm2', matterNumber: 'NLF/2024/0002', location: 'ELC Nanyuki', description: 'Case mention for directions', attendees: ['Grace Wanjiku'], color: '#f59e0b' },
  { id: 'e3', title: 'Deadline - Mutua Defense Filing', type: 'deadline', date: '2026-03-02', time: '17:00', endTime: '17:00', matterId: 'm6', matterNumber: 'NLF/2024/0006', location: "Magistrate's Court - Nanyuki", description: 'Last day to file defense response', attendees: ['Grace Wanjiku'], color: '#dc2626' },
  { id: 'e4', title: 'Hearing - Ouma Employment Case', type: 'hearing', date: '2026-03-05', time: '09:30', endTime: '13:00', matterId: 'm4', matterNumber: 'NLF/2024/0004', location: 'ELRC - Nairobi', description: 'Employment tribunal hearing', attendees: ['Grace Wanjiku'], color: '#ef4444' },
  { id: 'e5', title: 'Partners Meeting', type: 'meeting', date: '2026-03-03', time: '14:00', endTime: '16:00', location: 'NLF Boardroom', description: 'Monthly partners review meeting', attendees: ['Grace Wanjiku', 'Peter Kamau', 'James Mwangi'], color: '#3b82f6' },
  { id: 'e6', title: 'Client Meeting - Nanyuki Ranch', type: 'meeting', date: '2026-03-07', time: '10:00', endTime: '11:30', matterId: 'm7', matterNumber: 'NLF/2024/0007', location: 'NLF Office', description: 'Initial consultation for boundary dispute', attendees: ['Peter Kamau'], color: '#3b82f6' },
  { id: 'e7', title: 'Filing Deadline - Trademark MKB', type: 'filing', date: '2026-04-01', time: '16:00', endTime: '16:00', matterId: 'm5', matterNumber: 'NLF/2024/0005', location: 'KIPI Office', description: 'Trademark application filing deadline', attendees: ['Peter Kamau'], color: '#8b5cf6' },
  { id: 'e8', title: 'Hearing - Wangari Divorce', type: 'hearing', date: '2026-03-25', time: '09:00', endTime: '12:00', matterId: 'm8', matterNumber: 'NLF/2024/0008', location: 'Family Division - High Court', description: 'Divorce proceedings hearing', attendees: ['Grace Wanjiku'], color: '#ef4444' },
  { id: 'e9', title: 'Hearing - Equity Bank Recovery', type: 'hearing', date: '2026-03-20', time: '10:00', endTime: '13:00', matterId: 'm3', matterNumber: 'NLF/2024/0003', location: 'High Court - Commercial Division', description: 'Debt recovery hearing', attendees: ['Peter Kamau'], color: '#ef4444' },
  { id: 'e10', title: 'Staff Training - Legal Tech', type: 'meeting', date: '2026-03-12', time: '14:00', endTime: '17:00', location: 'NLF Conference Room', description: 'Training on new legal management system', attendees: ['All Staff'], color: '#10b981' },
  { id: 'e11', title: 'Mutua Criminal Hearing', type: 'hearing', date: '2026-03-08', time: '09:00', endTime: '11:00', matterId: 'm6', matterNumber: 'NLF/2024/0006', location: "Chief Magistrate's Court - Nanyuki", description: 'Criminal defense hearing', attendees: ['Grace Wanjiku'], color: '#ef4444' },
  { id: 'e12', title: 'Deadline - Quarterly Tax Filing', type: 'deadline', date: '2026-03-31', time: '17:00', endTime: '17:00', location: 'KRA Portal', description: 'Quarterly tax return filing deadline', attendees: ['James Mwangi'], color: '#dc2626' },
];

export const documents: Document[] = [
  { id: 'd1', name: 'Statement of Claim - Safaricom v CA.pdf', type: 'pdf', size: '2.4 MB', matterId: 'm1', matterNumber: 'NLF/2024/0001', clientId: 'c1', clientName: 'Safaricom PLC', uploadedBy: 'Peter Kamau', uploadedAt: '2026-02-20', tags: ['pleading', 'court-filing'], version: 2, accessLevel: 'team', category: 'pleading' },
  { id: 'd2', name: 'Land Search Report - LR 1234.pdf', type: 'pdf', size: '1.1 MB', matterId: 'm2', matterNumber: 'NLF/2024/0002', clientId: 'c3', clientName: 'David Kimani Njoroge', uploadedBy: 'Grace Wanjiku', uploadedAt: '2026-02-18', tags: ['land-search', 'evidence'], version: 1, accessLevel: 'team', category: 'evidence' },
  { id: 'd3', name: 'Employment Contract - Ouma.pdf', type: 'pdf', size: '856 KB', matterId: 'm4', matterNumber: 'NLF/2024/0004', clientId: 'c5', clientName: 'Jane Achieng Ouma', uploadedBy: 'Grace Wanjiku', uploadedAt: '2026-02-19', tags: ['contract', 'employment'], version: 1, accessLevel: 'restricted', category: 'evidence' },
  { id: 'd4', name: 'Trademark Application - MKB.docx', type: 'docx', size: '543 KB', matterId: 'm5', matterNumber: 'NLF/2024/0005', clientId: 'c6', clientName: 'Mt. Kenya Breweries', uploadedBy: 'Peter Kamau', uploadedAt: '2026-02-15', tags: ['trademark', 'IP'], version: 3, accessLevel: 'team', category: 'correspondence' },
  { id: 'd5', name: 'Defense Brief - Mutua.pdf', type: 'pdf', size: '1.8 MB', matterId: 'm6', matterNumber: 'NLF/2024/0006', clientId: 'c7', clientName: 'Samuel Mutua Kilonzo', uploadedBy: 'Grace Wanjiku', uploadedAt: '2026-02-23', tags: ['defense', 'criminal'], version: 1, accessLevel: 'restricted', category: 'pleading' },
  { id: 'd6', name: 'Procurement Advisory Memo.docx', type: 'docx', size: '234 KB', matterId: 'm9', matterNumber: 'NLF/2024/0009', clientId: 'c10', clientName: 'Laikipia County Government', uploadedBy: 'Peter Kamau', uploadedAt: '2026-02-24', tags: ['advisory', 'procurement'], version: 1, accessLevel: 'team', category: 'correspondence' },
  { id: 'd7', name: 'Fee Note Template.docx', type: 'docx', size: '125 KB', uploadedBy: 'James Mwangi', uploadedAt: '2024-01-01', tags: ['template', 'billing'], version: 5, accessLevel: 'public', category: 'template' },
  { id: 'd8', name: 'Plaint Template.docx', type: 'docx', size: '98 KB', uploadedBy: 'James Mwangi', uploadedAt: '2024-01-01', tags: ['template', 'pleading'], version: 3, accessLevel: 'public', category: 'template' },
  { id: 'd9', name: 'Power of Attorney Template.docx', type: 'docx', size: '112 KB', uploadedBy: 'James Mwangi', uploadedAt: '2024-01-01', tags: ['template', 'authority'], version: 2, accessLevel: 'public', category: 'template' },
  { id: 'd10', name: 'Demand Letter Template.docx', type: 'docx', size: '87 KB', uploadedBy: 'James Mwangi', uploadedAt: '2024-01-01', tags: ['template', 'demand'], version: 4, accessLevel: 'public', category: 'template' },
  { id: 'd11', name: 'Affidavit Template.docx', type: 'docx', size: '95 KB', uploadedBy: 'James Mwangi', uploadedAt: '2024-01-01', tags: ['template', 'affidavit'], version: 2, accessLevel: 'public', category: 'template' },
  { id: 'd12', name: 'Settlement Agreement - KPLC.pdf', type: 'pdf', size: '1.5 MB', matterId: 'm10', matterNumber: 'NLF/2024/0010', clientId: 'c2', clientName: 'Kenya Power & Lighting', uploadedBy: 'Grace Wanjiku', uploadedAt: '2025-12-15', tags: ['settlement', 'agreement'], version: 1, accessLevel: 'team', category: 'contract' },
];

export const invoices: Invoice[] = [
  { id: 'i1', invoiceNumber: 'INV-2026-001', matterId: 'm1', matterNumber: 'NLF/2024/0001', clientId: 'c1', clientName: 'Safaricom PLC', amount: 850000, paid: 850000, status: 'paid', dueDate: '2026-02-28', issuedDate: '2026-01-15', items: [{ description: 'Legal consultation and research', hours: 40, rate: 15000, amount: 600000 }, { description: 'Court appearance and preparation', hours: 10, rate: 15000, amount: 150000 }, { description: 'Document drafting and review', hours: 10, rate: 10000, amount: 100000 }], tax: 136000, discount: 0 },
  { id: 'i2', invoiceNumber: 'INV-2026-002', matterId: 'm2', matterNumber: 'NLF/2024/0002', clientId: 'c3', clientName: 'David Kimani Njoroge', amount: 250000, paid: 100000, status: 'partial', dueDate: '2026-03-15', issuedDate: '2026-02-01', items: [{ description: 'Land search and due diligence', hours: 10, rate: 10000, amount: 100000 }, { description: 'Legal consultation', hours: 15, rate: 10000, amount: 150000 }], tax: 40000, discount: 0 },
  { id: 'i3', invoiceNumber: 'INV-2026-003', matterId: 'm3', matterNumber: 'NLF/2024/0003', clientId: 'c4', clientName: 'Equity Bank Limited', amount: 1200000, paid: 0, status: 'sent', dueDate: '2026-03-20', issuedDate: '2026-02-15', items: [{ description: 'Debt recovery proceedings', hours: 60, rate: 15000, amount: 900000 }, { description: 'Court appearances', hours: 20, rate: 15000, amount: 300000 }], tax: 192000, discount: 0 },
  { id: 'i4', invoiceNumber: 'INV-2026-004', matterId: 'm4', matterNumber: 'NLF/2024/0004', clientId: 'c5', clientName: 'Jane Achieng Ouma', amount: 180000, paid: 180000, status: 'paid', dueDate: '2026-02-20', issuedDate: '2026-01-20', items: [{ description: 'Employment tribunal preparation', hours: 12, rate: 10000, amount: 120000 }, { description: 'Witness preparation', hours: 6, rate: 10000, amount: 60000 }], tax: 28800, discount: 0 },
  { id: 'i5', invoiceNumber: 'INV-2026-005', matterId: 'm5', matterNumber: 'NLF/2024/0005', clientId: 'c6', clientName: 'Mt. Kenya Breweries', amount: 350000, paid: 0, status: 'overdue', dueDate: '2026-02-10', issuedDate: '2026-01-10', items: [{ description: 'Trademark research and application', hours: 20, rate: 10000, amount: 200000 }, { description: 'IP advisory services', hours: 15, rate: 10000, amount: 150000 }], tax: 56000, discount: 0 },
  { id: 'i6', invoiceNumber: 'INV-2026-006', matterId: 'm6', matterNumber: 'NLF/2024/0006', clientId: 'c7', clientName: 'Samuel Mutua Kilonzo', amount: 300000, paid: 150000, status: 'partial', dueDate: '2026-03-10', issuedDate: '2026-02-10', items: [{ description: 'Criminal defense preparation', hours: 20, rate: 10000, amount: 200000 }, { description: 'Court representation', hours: 10, rate: 10000, amount: 100000 }], tax: 48000, discount: 0 },
  { id: 'i7', invoiceNumber: 'INV-2026-007', matterId: 'm9', matterNumber: 'NLF/2024/0009', clientId: 'c10', clientName: 'Laikipia County Government', amount: 500000, paid: 500000, status: 'paid', dueDate: '2026-02-28', issuedDate: '2026-01-28', items: [{ description: 'Procurement advisory - Q4 2025', hours: 30, rate: 15000, amount: 450000 }, { description: 'Document review', hours: 5, rate: 10000, amount: 50000 }], tax: 80000, discount: 0 },
  { id: 'i8', invoiceNumber: 'INV-2026-008', matterId: 'm8', matterNumber: 'NLF/2024/0008', clientId: 'c9', clientName: 'Florence Wangari Mwangi', amount: 200000, paid: 0, status: 'draft', dueDate: '2026-04-01', issuedDate: '2026-02-25', items: [{ description: 'Divorce proceedings - initial phase', hours: 15, rate: 10000, amount: 150000 }, { description: 'Mediation sessions', hours: 5, rate: 10000, amount: 50000 }], tax: 32000, discount: 0 },
];

export const timeEntries: TimeEntry[] = [
  { id: 'te1', matterId: 'm1', matterNumber: 'NLF/2024/0001', userId: '3', userName: 'Peter Kamau', date: '2026-02-24', hours: 3.5, description: 'Research on telecommunications regulations', billable: true, rate: 10000, status: 'approved' },
  { id: 'te2', matterId: 'm2', matterNumber: 'NLF/2024/0002', userId: '2', userName: 'Grace Wanjiku', date: '2026-02-24', hours: 2.0, description: 'Client meeting and case review', billable: true, rate: 15000, status: 'approved' },
  { id: 'te3', matterId: 'm3', matterNumber: 'NLF/2024/0003', userId: '3', userName: 'Peter Kamau', date: '2026-02-24', hours: 4.0, description: 'Drafting demand letter and court filings', billable: true, rate: 10000, status: 'pending' },
  { id: 'te4', matterId: 'm4', matterNumber: 'NLF/2024/0004', userId: '2', userName: 'Grace Wanjiku', date: '2026-02-23', hours: 5.0, description: 'Witness statement preparation', billable: true, rate: 15000, status: 'approved' },
  { id: 'te5', matterId: 'm6', matterNumber: 'NLF/2024/0006', userId: '2', userName: 'Grace Wanjiku', date: '2026-02-23', hours: 3.0, description: 'Defense brief drafting', billable: true, rate: 15000, status: 'pending' },
  { id: 'te6', matterId: 'm1', matterNumber: 'NLF/2024/0001', userId: '3', userName: 'Peter Kamau', date: '2026-02-23', hours: 1.5, description: 'Internal team meeting', billable: false, rate: 0, status: 'approved' },
  { id: 'te7', matterId: 'm5', matterNumber: 'NLF/2024/0005', userId: '3', userName: 'Peter Kamau', date: '2026-02-22', hours: 2.5, description: 'Trademark application review', billable: true, rate: 10000, status: 'billed' },
  { id: 'te8', matterId: 'm8', matterNumber: 'NLF/2024/0008', userId: '2', userName: 'Grace Wanjiku', date: '2026-02-22', hours: 3.0, description: 'Divorce settlement research', billable: true, rate: 15000, status: 'pending' },
];

export const notifications: Notification[] = [
  { id: 'n1', title: 'Upcoming Hearing', message: 'Hearing for Ouma v. TechCorp is scheduled for March 5, 2026', type: 'hearing', read: false, createdAt: '2026-02-25T08:00:00', link: '/calendar' },
  { id: 'n2', title: 'Task Deadline', message: 'Land search filing for Kimani matter is due March 1, 2026', type: 'deadline', read: false, createdAt: '2026-02-25T07:30:00', link: '/tasks' },
  { id: 'n3', title: 'Invoice Overdue', message: 'Invoice INV-2026-005 for Mt. Kenya Breweries is overdue', type: 'invoice', read: false, createdAt: '2026-02-25T06:00:00', link: '/billing' },
  { id: 'n4', title: 'New Task Assigned', message: 'You have been assigned: Draft Statement of Claim - Safaricom v. CA', type: 'task', read: true, createdAt: '2026-02-24T14:00:00', link: '/tasks' },
  { id: 'n5', title: 'Filing Deadline', message: 'Defense filing for Mutua case due March 2, 2026', type: 'deadline', read: false, createdAt: '2026-02-24T09:00:00', link: '/calendar' },
  { id: 'n6', title: 'Payment Received', message: 'Payment of KES 850,000 received from Safaricom PLC', type: 'system', read: true, createdAt: '2026-02-23T16:00:00', link: '/billing' },
  { id: 'n7', title: 'Partners Meeting', message: 'Monthly partners meeting scheduled for March 3, 2026 at 2:00 PM', type: 'system', read: true, createdAt: '2026-02-22T10:00:00', link: '/calendar' },
  { id: 'n8', title: 'Document Updated', message: 'Statement of Claim for Safaricom v CA has been updated to version 2', type: 'system', read: true, createdAt: '2026-02-20T11:00:00', link: '/documents' },
];

export const practiceAreas = ['Civil', 'Criminal', 'Commercial', 'Family', 'Land', 'Employment', 'Tax', 'IP', 'Constitutional', 'Environmental'];
export const matterStatuses = ['consultation', 'active', 'court', 'settled', 'closed', 'archived'];
export const courts = ['High Court of Kenya - Milimani', 'High Court of Kenya - Nanyuki', "Chief Magistrate's Court - Nanyuki", 'Environment & Land Court - Nanyuki', 'Employment & Labour Relations Court', 'Court of Appeal - Nairobi', 'Supreme Court of Kenya', 'Family Division - High Court', 'Commercial Division - High Court', 'KIPI - Kenya Industrial Property Institute'];
