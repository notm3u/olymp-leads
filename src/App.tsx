/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  Search, 
  ExternalLink, 
  User, 
  Mail, 
  StickyNote, 
  MapPin, 
  Phone,
  CheckCircle2,
  AlertCircle,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';
import { Lead, Contact } from './types';

const STORAGE_KEY = 'olymp_leads_data';
const STATUS_OPTIONS = ['Not Contacted', 'Contacted', 'Warm', 'Hot', 'Cold', 'Follow-up', 'Deal Won', 'Deal Lost'];

const DEFAULT_CONTACT: Contact = { name: '', email: '', note: '' };

export default function App() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [tagFilter, setTagFilter] = useState<string>('All');
  const [isImporting, setIsImporting] = useState(false);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setLeads(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse leads from storage", e);
      }
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
  }, [leads]);

  const selectedLead = leads.find(l => l.id === selectedLeadId);

  const allTags = Array.from(new Set(leads.flatMap(l => l.tags || []))) as string[];

  const filteredLeads = leads.filter(l => {
    const matchesSearch = 
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
    const matchesTag = tagFilter === 'All' || l.tags?.includes(tagFilter);

    return matchesSearch && matchesStatus && matchesTag;
  });

  const logActivity = (leadId: string, type: Lead['activities'][0]['type'], description: string) => {
    setLeads(prev => prev.map(l => {
      if (l.id !== leadId) return l;
      const newActivity = {
        id: crypto.randomUUID(),
        type,
        description,
        timestamp: Date.now()
      };
      return {
        ...l,
        activities: [newActivity, ...(l.activities || [])],
        lastUpdated: Date.now()
      };
    }));
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const newLeads = results.data.map((row: any) => ({
          ...row,
          id: row.id || crypto.randomUUID(),
          contact1: { name: '', email: '', note: '' },
          contact2: { name: '', email: '', note: '' },
          tags: row.tags ? row.tags.split(',').map((t: string) => t.trim()) : [],
          activities: [{
            id: crypto.randomUUID(),
            type: 'manual_log',
            description: 'Lead imported from CSV',
            timestamp: Date.now()
          }],
          status: row.status || 'Not Contacted',
          lastUpdated: Date.now()
        })) as Lead[];

        setLeads(prev => {
          const existingNames = new Set(prev.map(l => l.name));
          const filtered = newLeads.filter(l => !existingNames.has(l.name));
          return [...prev, ...filtered];
        });
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
      error: (err) => {
        console.error("CSV Parse error", err);
        setIsImporting(false);
      }
    });
  };

  const handleExport = () => {
    const csv = Papa.unparse(leads);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `olymp_leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deleteLead = (id: string) => {
    if (confirm('Are you sure you want to delete this lead?')) {
      setLeads(prev => prev.filter(l => l.id !== id));
      if (selectedLeadId === id) setSelectedLeadId(null);
    }
  };

  const addManualLead = () => {
    const newLead: Lead = {
      id: crypto.randomUUID(),
      name: 'New Company',
      address: '',
      phone: '',
      email: '',
      website_url: '',
      has_website: '',
      linkedin_company_url: '',
      linkedin_dm_search: '',
      linkedin_ceo_search: '',
      linkedin_ops_search: '',
      linkedin_finance_search: '',
      apollo_company_search: '',
      apollo_ceo_search: '',
      hunter_domain_search: '',
      google_search: '',
      linkedin_google_search: '',
      outsource_signals: '',
      outsource_score: '',
      rating: '',
      review_count: '',
      category: '',
      size_hint: '',
      query: '',
      location: '',
      maps_url: '',
      score: '',
      bpo_notes: '',
      status: 'Not Contacted',
      date_scraped: new Date().toISOString(),
      contact1: { name: '', email: '', note: '' },
      contact2: { name: '', email: '', note: '' },
      tags: [],
      activities: [{
        id: crypto.randomUUID(),
        type: 'manual_log',
        description: 'Manual lead created',
        timestamp: Date.now()
      }],
      lastUpdated: Date.now()
    };
    setLeads([newLead, ...leads]);
    setSelectedLeadId(newLead.id);
    setIsEditingCompany(true); // Open in edit mode immediately
  };

  const clearAllLeads = () => {
    if (confirm('Are you sure you want to clear ALL leads? This action is irreversible.')) {
      setLeads([]);
      setSelectedLeadId(null);
    }
  };

  const updateLead = (id: string, updates: Partial<Lead>) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates, lastUpdated: Date.now() } : l));
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#F8FAF8] text-[#1B4332] font-sans overflow-hidden">
      {/* Navbar */}
      <nav id="navbar" className="h-16 bg-white border-b border-[#D8E3D8] flex items-center justify-between px-8 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center overflow-hidden rounded-lg">
            <img src="/logo.png" alt="Olymp Leads Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-xl font-serif font-bold text-[#081C15]">OLYMP LEADS</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-[#E9F0E9] p-1 rounded-full">
            <button className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-full bg-white shadow-sm">Manage</button>
            <button className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#2D6A4F] opacity-50 cursor-not-allowed">Analytics</button>
          </div>
          <button 
            onClick={clearAllLeads}
            className="flex items-center gap-2 border border-red-200 text-red-600 px-5 py-2 rounded-full text-sm font-medium hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear CRM Database</span>
          </button>
          <div className="h-6 w-px bg-[#D8E3D8]"></div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImport} 
            accept=".csv" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-[#2D6A4F] text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-[#1B4332] transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>{isImporting ? 'Importing...' : 'Import CSV'}</span>
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 border border-[#2D6A4F] text-[#2D6A4F] px-5 py-2 rounded-full text-sm font-medium hover:bg-[#2D6A4F]/5 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </nav>

      <main className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside id="sidebar" className="w-[360px] border-r border-[#D8E3D8] bg-[#F1F7F1] flex flex-col">
          <div className="p-6 pb-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg font-semibold">Lead Pipeline</h2>
              <button 
                onClick={addManualLead}
                className="bg-[#2D6A4F] text-white p-1.5 rounded-lg hover:bg-[#1B4332] transition-colors"
                title="Add New Lead"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="bg-[#D8F3DC] text-[#2D6A4F] px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">
                {filteredLeads.length} of {leads.length} Records
              </span>
            </div>
            <div className="relative mb-4">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#52B788]" />
              <input 
                type="text" 
                placeholder="Search leads, tags, emails..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#D8E3D8] rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 transition-shadow"
              />
            </div>
            
            <div className="flex flex-col gap-2 mb-2">
               <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  <FilterChip label="All" active={statusFilter === 'All'} onClick={() => setStatusFilter('All')} />
                  {STATUS_OPTIONS.map(s => (
                    <FilterChip key={s} label={s} active={statusFilter === s} onClick={() => setStatusFilter(s)} />
                  ))}
               </div>
               {allTags.length > 0 && (
                 <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    <FilterChip label="Any Tag" active={tagFilter === 'All'} onClick={() => setTagFilter('All')} />
                    {allTags.map(t => (
                      <FilterChip key={t} label={t} active={tagFilter === t} onClick={() => setTagFilter(t)} size="xs" />
                    ))}
                 </div>
               )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto space-y-px">
            {filteredLeads.map(lead => (
              <div 
                key={lead.id}
                id={`lead-item-${lead.id}`}
                onClick={() => setSelectedLeadId(lead.id)}
                className={`px-6 py-4 border-y border-[#D8E3D8] cursor-pointer transition-all ${
                  selectedLeadId === lead.id 
                    ? 'bg-[#E9F5E9] border-l-4 border-l-[#2D6A4F]' 
                    : 'bg-white hover:bg-[#F1F7F1]'
                }`}
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-sm truncate mr-2">{lead.name}</h3>
                  <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${
                    lead.contact1.name || lead.contact2.name ? 'bg-[#2D6A4F]' : 'bg-[#D8E3D8]'
                  }`}></div>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-[#8E8E7E] truncate flex-1">
                    {lead.category || 'Lead'}
                  </p>
                  <p className="text-[10px] text-[#A6A699]">
                    {new Date(lead.lastUpdated).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            {filteredLeads.length === 0 && (
              <div className="p-12 text-center">
                <AlertCircle className="w-12 h-12 mx-auto text-[#DEDCCE] mb-4" />
                <p className="text-sm text-[#8E8E7E]">No leads found matching your search.</p>
              </div>
            )}
          </div>
        </aside>

        {/* Lead Detail View */}
        <section id="detail-view" className="flex-1 bg-white flex flex-col overflow-y-auto">
          <AnimatePresence mode="wait">
            {selectedLead ? (
              <motion.div 
                key={selectedLead.id}
                data-selected-lead-id={selectedLead.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-4xl mx-auto w-full p-8"
              >
                <header className="mb-8 flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                       <h2 className="text-4xl font-serif font-bold text-[#081C15] leading-tight truncate">
                         {selectedLead.name}
                       </h2>
                       <div className="flex items-center gap-2">
                        <StatusBadge status={selectedLead.status} />
                        <CopyButton text={selectedLead.name} label="Copy Name" />
                       </div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-[#40916C] text-sm font-semibold uppercase tracking-widest items-center">
                      <span className="flex items-center gap-1.5">
                        <div className="w-5 h-5 overflow-hidden rounded">
                          <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
                        </div>
                        {selectedLead.category || 'Company'}
                      </span>
                      {selectedLead.location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" />
                          {selectedLead.location}
                        </span>
                      )}
                      
                      <div className="flex gap-1">
                        {selectedLead.tags?.map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-[#D8F3DC] text-[#2D6A4F] rounded text-[10px] font-bold">#{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <select 
                      value={selectedLead.status}
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        logActivity(selectedLead.id, 'status_change', `Status changed from ${selectedLead.status} to ${newStatus}`);
                        updateLead(selectedLead.id, { status: newStatus });
                      }}
                      className="text-sm border border-[#D8E3D8] rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 appearance-none pr-8 relative bg-no-repeat bg-[right_0.5rem_center]"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%232D6A4F' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-9'/%3E%3C/svg%3E")` }}
                    >
                      {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <button 
                      onClick={() => deleteLead(selectedLead.id)}
                      className="text-sm text-red-600 font-semibold hover:bg-red-50 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 border border-transparent hover:border-red-100"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                  {/* Company Info Card */}
                  <div className="bg-[#F1F7F1] p-6 rounded-2xl border border-[#D8E3D8] col-span-full">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-[#2D6A4F] flex items-center gap-2">
                         Company Details
                      </h4>
                      <button 
                        onClick={() => setIsEditingCompany(!isEditingCompany)}
                        className="text-[10px] font-bold uppercase tracking-widest text-[#2D6A4F] hover:underline"
                      >
                        {isEditingCompany ? 'Done Editing' : 'Edit Info'}
                      </button>
                    </div>
                    
                    {isEditingCompany ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <EditItem label="Name" value={selectedLead.name} onChange={(val) => updateLead(selectedLead.id, { name: val })} />
                        <EditItem label="Category" value={selectedLead.category} onChange={(val) => updateLead(selectedLead.id, { category: val })} />
                        <EditItem label="Address" value={selectedLead.address} onChange={(val) => updateLead(selectedLead.id, { address: val })} />
                        <EditItem label="Phone" value={selectedLead.phone} onChange={(val) => updateLead(selectedLead.id, { phone: val })} />
                        <EditItem label="Email" value={selectedLead.email} onChange={(val) => updateLead(selectedLead.id, { email: val })} />
                        <EditItem label="Website" value={selectedLead.website_url} onChange={(val) => updateLead(selectedLead.id, { website_url: val })} />
                        <EditItem label="LinkedIn Company URL" value={selectedLead.linkedin_company_url} onChange={(val) => updateLead(selectedLead.id, { linkedin_company_url: val })} />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <InfoItem icon={<MapPin className="w-4 h-4" />} label="Address" value={selectedLead.address} />
                          <InfoItem icon={<Phone className="w-4 h-4" />} label="Phone" value={selectedLead.phone} />
                          <InfoItem icon={<Mail className="w-4 h-4" />} label="Lead Email" value={selectedLead.email} />
                          <InfoItem icon={<img src="/logo.png" className="w-4 h-4 object-cover rounded-sm" />} label="Category" value={selectedLead.category} />
                        </div>
                        <div className="space-y-4">
                          <InfoItem 
                            icon={<ExternalLink className="w-4 h-4" />} 
                            label="Website" 
                            value={selectedLead.website_url} 
                            isLink 
                          />
                          <InfoItem 
                            icon={<ExternalLink className="w-4 h-4" />} 
                            label="LinkedIn Company" 
                            value={selectedLead.linkedin_company_url} 
                            isLink 
                          />
                          <InfoItem icon={<StickyNote className="w-4 h-4" />} label="BPO Notes" value={selectedLead.bpo_notes} />
                          <InfoItem icon={<AlertCircle className="w-4 h-4" />} label="Size" value={selectedLead.size_hint} />
                          
                          <div id="prospecting-tools" className="pt-2">
                             <label className="block text-[10px] uppercase font-bold text-[#40916C] mb-2">Research Terminal</label>
                             <div className="flex flex-wrap gap-2">
                               {selectedLead.name && (
                                 <ApolloButton name={selectedLead.name} />
                               )}
                               {selectedLead.maps_url && (
                                 <ExternalLinkButton href={selectedLead.maps_url} label="Google Maps" />
                               )}
                               {selectedLead.linkedin_company_url && (
                                 <ExternalLinkButton href={selectedLead.linkedin_company_url} label="LinkedIn" />
                               )}
                               {selectedLead.hunter_domain_search ? (
                                 <ExternalLinkButton href={selectedLead.hunter_domain_search} label="Hunter" />
                               ) : selectedLead.website_url ? (
                                 <ExternalLinkButton 
                                   href={`https://hunter.io/domain-search?domain=${new URL(selectedLead.website_url.startsWith('http') ? selectedLead.website_url : 'https://' + selectedLead.website_url).hostname.replace('www.', '')}`} 
                                   label="Hunter" 
                                 />
                               ) : null}
                             </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Company Research & Notes */}
                  <div id="company-notes-section" className="bg-[#F1F7F1] p-6 rounded-2xl border border-[#D8E3D8] col-span-full grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-[#2D6A4F] flex items-center gap-2">
                         <StickyNote className="w-4 h-4" />
                         Company-Wide Research
                      </h4>
                      <textarea 
                        rows={5}
                        value={selectedLead.bpo_notes || ''}
                        onChange={(e) => updateLead(selectedLead.id, { bpo_notes: e.target.value })}
                        placeholder="Add high-level company info, general feedback, or custom research here..."
                        className="w-full bg-white border border-[#D8E3D8] rounded-xl py-3 px-4 text-sm resize-none focus:ring-2 focus:ring-[#2D6A4F]/10 outline-none transition-shadow"
                      />
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-[#2D6A4F] flex items-center gap-2">
                         <AlertCircle className="w-4 h-4" />
                         Internal Strategy
                      </h4>
                      <div className="space-y-3">
                         <EditItem label="Target Persona" value={selectedLead.size_hint || ''} onChange={(val) => updateLead(selectedLead.id, { size_hint: val })} />
                         <p className="text-[10px] text-[#40916C] leading-tight font-medium">
                           Use this space for internal notes about who to contact or custom fields not found in the CSV.
                         </p>
                      </div>
                    </div>
                  </div>

                  {/* Tags Section */}
                  <div className="bg-[#F1F7F1] p-6 rounded-2xl border border-[#D8E3D8] col-span-full">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-[#2D6A4F] mb-4">Targeting & Tags</h4>
                    <div className="flex flex-wrap gap-2 mb-4">
                       {selectedLead.tags?.map(tag => (
                         <button 
                           key={tag} 
                           onClick={() => updateLead(selectedLead.id, { tags: selectedLead.tags.filter(t => t !== tag) })}
                           className="flex items-center gap-1 px-3 py-1 bg-white border border-[#D8E3D8] rounded-full text-xs font-medium hover:bg-red-50 hover:text-red-600 transition-all"
                         >
                           {tag} <Plus className="w-3 h-3 rotate-45" />
                         </button>
                       ))}
                       <input 
                         type="text"
                         placeholder="+ Add Tag"
                         onKeyDown={(e) => {
                           if (e.key === 'Enter') {
                             const val = e.currentTarget.value.trim();
                             if (val && !selectedLead.tags?.includes(val)) {
                               updateLead(selectedLead.id, { tags: [...(selectedLead.tags || []), val] });
                               e.currentTarget.value = '';
                             }
                           }
                         }}
                         className="px-3 py-1 border border-dashed border-[#D8E3D8] rounded-full text-xs outline-none focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F]/20 transition-all bg-transparent"
                       />
                    </div>
                  </div>

                  {/* Contact 1 */}
                  <ContactForm 
                    id="contact1"
                    title="Primary Contact" 
                    count={1}
                    data={selectedLead.contact1}
                    onLogActivity={(desc) => logActivity(selectedLead.id, 'manual_log', desc)}
                    onChange={(updates) => {
                      if (updates.email && updates.email !== selectedLead.contact1.email) {
                        logActivity(selectedLead.id, 'email_sent', `Primary contact email updated to ${updates.email}`);
                      }
                      updateLead(selectedLead.id, { 
                        contact1: { ...selectedLead.contact1, ...updates } 
                      });
                    }}
                  />

                  {/* Contact 2 */}
                  <ContactForm 
                    id="contact2"
                    title="Secondary Contact" 
                    count={2}
                    data={selectedLead.contact2}
                    onLogActivity={(desc) => logActivity(selectedLead.id, 'manual_log', desc)}
                    onChange={(updates) => {
                      updateLead(selectedLead.id, { 
                        contact2: { ...selectedLead.contact2, ...updates } 
                      });
                    }}
                  />

                  {/* Activity History */}
                  <div className="bg-white p-8 rounded-2xl border border-[#DEDCCE] col-span-full shadow-sm">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-[#2D6A4F] mb-8 flex items-center gap-2">
                       <StickyNote className="w-4 h-4" />
                       Activity History
                    </h4>
                    <div className="space-y-6 relative before:absolute before:left-[17px] before:top-2 before:bottom-0 before:w-px before:bg-[#DEDCCE]">
                       {selectedLead.activities?.map((activity, idx) => (
                         <div key={activity.id} className="flex gap-4 relative">
                            <div className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center border-4 border-white z-10 ${
                              activity.type === 'status_change' ? 'bg-amber-100 text-amber-700' :
                              activity.type === 'email_sent' ? 'bg-blue-100 text-blue-700' :
                              'bg-[#D8F3DC] text-[#2D6A4F]'
                            }`}>
                               {activity.type === 'status_change' ? <CheckCircle2 className="w-4 h-4" /> :
                                activity.type === 'email_sent' ? <Mail className="w-4 h-4" /> :
                                <StickyNote className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0 pt-1">
                               <p className="text-sm font-medium text-[#2D2D24] leading-relaxed">
                                 {activity.description}
                               </p>
                               <p className="text-[10px] font-bold text-[#8E8E7E] uppercase tracking-wider mt-1">
                                  {new Date(activity.timestamp).toLocaleString(undefined, { 
                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                                  })}
                               </p>
                            </div>
                         </div>
                       ))}
                       {(!selectedLead.activities || selectedLead.activities.length === 0) && (
                         <p className="text-sm text-[#8E8E7E] pl-12">No activity recorded yet.</p>
                       )}
                       <div className="pl-12 pt-4">
                          <button 
                            onClick={() => {
                              const note = prompt('Enter a manual activity note:');
                              if (note) logActivity(selectedLead.id, 'manual_log', note);
                            }}
                            className="text-xs font-bold text-[#2D6A4F] hover:underline"
                          >+ Add Manual Log</button>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-[#D8E3D8]">
                  <button className="bg-[#2D6A4F] text-white px-8 py-3 rounded-full font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 group">
                    <CheckCircle2 className="w-5 h-5 opacity-0 group-focus:opacity-100 transition-opacity" />
                    <span>Changes Auto-saved</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 text-center p-12 bg-[#F1F7F1]/30">
                <div className="w-20 h-20 bg-white shadow-sm rounded-2xl flex items-center justify-center mb-6 overflow-hidden border border-[#D8E3D8]">
                  <img src="/logo.png" alt="Olymp Leads" className="w-full h-full object-cover" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-[#081C15] mb-2">No Lead Selected</h3>
                <p className="text-[#40916C] max-w-sm mb-8">Select a company from the pipeline to manage contact information and lead details.</p>
                
                {leads.length === 0 && (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 bg-[#2D6A4F] text-white px-6 py-3 rounded-full font-bold shadow-md hover:shadow-lg transition-all"
                  >
                    <Upload className="w-5 h-5" />
                    Upload your CSV Leads
                  </button>
                )}
              </div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* Footer */}
      <footer id="footer" className="h-10 bg-[#FAF9F5] border-t border-[#DEDCCE] px-8 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-[#8E8E7E]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Local Storage Active
          </span>
          <span>Auto-saving enabled</span>
        </div>
        <div className="flex gap-6">
          <span>{leads.length} Leads Indexed</span>
          <span>Cloud Sync Off</span>
        </div>
      </footer>
    </div>
  );
}

function ContactForm({ id, title, count, data, onChange, onLogActivity }: { 
  id: string,
  title: string, 
  count: number, 
  data: Contact, 
  onLogActivity: (desc: string) => void,
  onChange: (updates: Partial<Contact>) => void 
}) {
  return (
    <div id={id} className="bg-[#F1F7F1] p-6 rounded-2xl border border-[#D8E3D8]">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-full bg-[#2D6A4F] flex items-center justify-center text-white text-[10px] font-bold">{count}</div>
        <h4 className="text-xs font-bold uppercase tracking-widest text-[#2D6A4F]">{title}</h4>
      </div>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-1.5 ml-1">
            <label className="block text-[10px] uppercase font-bold text-[#40916C]">Full Name</label>
            <CopyButton text={data.name} />
          </div>
          <div className="relative">
            <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#52B788]" />
            <input 
              type="text" 
              value={data.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="e.g. John Smith"
              className="w-full bg-white border border-[#D8E3D8] rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#2D6A4F]/10 outline-none transition-shadow"
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-1.5 ml-1">
            <label className="block text-[10px] uppercase font-bold text-[#40916C]">Email Address</label>
            <CopyButton text={data.email} />
          </div>
          <div className="relative">
            <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#52B788]" />
            <input 
              type="email" 
              value={data.email}
              onChange={(e) => onChange({ email: e.target.value })}
              placeholder="name@company.com"
              className="w-full bg-white border border-[#D8E3D8] rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#2D6A4F]/10 outline-none transition-shadow"
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-1.5 ml-1">
            <label className="block text-[10px] uppercase font-bold text-[#40916C]">Private Note</label>
            <CopyButton text={data.note} />
          </div>
          <div className="relative">
            <StickyNote className="w-3.5 h-3.5 absolute left-3 top-3 text-[#52B788]" />
            <textarea 
              rows={4}
              value={data.note}
              onChange={(e) => onChange({ note: e.target.value })}
              placeholder="Add key insights, outreach history..."
              className="w-full bg-white border border-[#D8E3D8] rounded-xl py-2.5 pl-10 pr-4 text-sm resize-none focus:ring-2 focus:ring-[#2D6A4F]/10 outline-none transition-shadow"
            />
          </div>
          <div className="flex justify-between mt-1 items-center">
             <span className="text-[9px] font-bold text-[#40916C] uppercase tracking-widest">Auto-saving...</span>
             <button 
               onClick={() => {
                 onLogActivity(`Action logged for ${title}: ${data.name || 'Unnamed'}`);
               }}
               className="text-[10px] font-bold text-[#2D6A4F] hover:underline px-2 py-1 bg-[#2D6A4F]/5 rounded"
             >
               + Log Action
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value, isLink }: { icon: React.ReactNode, label: string, value?: string, isLink?: boolean }) {
  if (!value) return null;
  return (
    <div>
      <label className="block text-[10px] uppercase font-bold text-[#40916C] mb-1">{label}</label>
      <div className="flex items-start gap-2 group">
        <span className="mt-0.5 text-[#52B788]">{icon}</span>
        {isLink ? (
          <a 
            href={value.startsWith('http') ? value : `https://${value}`} 
            target="_blank" 
            rel="noreferrer"
            className="text-sm font-medium text-[#2D6A4F] hover:underline break-all"
          >
            {value}
          </a>
        ) : (
          <p className="text-sm font-medium text-[#1B4332] leading-tight">{value}</p>
        )}
      </div>
    </div>
  );
}

function FilterChip({ label, active, onClick, size = 'sm' }: { label: string, active: boolean, onClick: () => void, size?: 'sm' | 'xs', key?: React.Key }) {
  return (
    <button 
      onClick={onClick}
      className={`whitespace-nowrap rounded-full font-bold uppercase tracking-widest transition-all ${
        active 
          ? 'bg-[#2D6A4F] text-white' 
          : 'bg-[#D8F3DC] text-[#2D6A4F] hover:bg-[#B7E4C7]'
      } ${size === 'xs' ? 'px-2 py-0.5 text-[8px]' : 'px-3 py-1 text-[10px]'}`}
    >
      {label}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    'Hot': 'bg-red-100 text-red-700 border-red-200',
    'Warm': 'bg-amber-100 text-amber-700 border-amber-200',
    'Cold': 'bg-blue-100 text-blue-700 border-blue-200',
    'Deal Won': 'bg-green-100 text-green-700 border-green-200',
    'Deal Lost': 'bg-gray-100 text-gray-700 border-gray-200',
    'Follow-up': 'bg-purple-100 text-purple-700 border-purple-200',
    'Contacted': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Not Contacted': 'bg-[#D8F3DC] text-[#2D6A4F] border-[#B7E4C7]'
  }[status] || 'bg-[#D8F3DC] text-[#2D6A4F] border-[#B7E4C7]';

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${styles}`}>
      {status}
    </span>
  );
}

function ExternalLinkButton({ href, label }: { href: string, label: string }) {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-white border border-[#D8E3D8] rounded-full hover:bg-emerald-50 transition-colors text-[#2D6A4F]"
    >
      <ExternalLink className="w-3 h-3" />
      {label}
    </a>
  );
}

function EditItem({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) {
  return (
    <div>
      <label className="block text-[10px] uppercase font-bold text-[#40916C] mb-1">{label}</label>
      <input 
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-[#D8E3D8] rounded-lg py-1.5 px-3 text-sm focus:ring-2 focus:ring-[#2D6A4F]/10 outline-none"
      />
    </div>
  );
}

function ApolloButton({ name }: { name: string }) {
  const [copied, setCopied] = useState(false);

  const handleAction = () => {
    navigator.clipboard.writeText(name);
    setCopied(true);
    window.open('https://app.apollo.io/#/onboarding-hub/queue', '_blank');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleAction}
      className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full transition-all ${
        copied ? 'bg-emerald-600 text-white' : 'bg-[#2D6A4F] text-white hover:bg-[#1B4332]'
      }`}
      title="Copies name and opens Apollo Search"
    >
      {copied ? <CheckCircle2 className="w-3 h-3" /> : <Search className="w-3 h-3" />}
      {copied ? 'Copied!' : 'Apollo (Copy)'}
    </button>
  );
}

function CopyButton({ text, label }: { text?: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!text) return null;

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded transition-all shrink-0 ${
        copied ? 'text-emerald-700 bg-emerald-50 shadow-sm' : 'text-[#2D6A4F] hover:bg-[#2D6A4F]/10'
      }`}
      title={label || "Copy to clipboard"}
    >
      {copied ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
      {label && <span>{copied ? 'Copied!' : label}</span>}
      {!label && !copied && <span>Copy</span>}
      {!label && copied && <span>Copied</span>}
    </button>
  );
}
