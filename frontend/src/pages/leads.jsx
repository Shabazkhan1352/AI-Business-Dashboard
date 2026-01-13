// --- This is the complete, final, and refactored file for your Leads page. ---
import React, { useState, useMemo } from 'react';
import { UserCircle2, PlusCircle, Download, X, Edit, Trash2, Search, ArrowUp, ArrowDown } from 'lucide-react';
// FIX: Corrected the import paths to accurately point to the contexts directory from the pages directory without file extensions.
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

// --- Reusable UI Components ---

const KPI = ({ title, value }) => (
    <div className="bg-gray-800/50 p-4 rounded-xl border border-white/10 flex flex-col justify-between">
        <p className="text-sm text-gray-400">{title}</p>
        <p className="text-2xl font-bold mt-1 truncate">{value}</p>
    </div>
);

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl border border-white/10 p-8 w-full max-w-md relative animate-fade-in-up">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                    <X size={24} />
                </button>
                <h2 className="text-2xl font-bold mb-6">{title}</h2>
                {children}
            </div>
        </div>
    );
};

const LeadForm = ({ lead, onSave, onClose, isSubmitting, submitError }) => {
    const [formData, setFormData] = useState({
        name: lead?.name || '',
        source: lead?.source || '',
        stage: lead?.stage || 'Prospect',
        value: lead?.value || '',
        status: lead?.status || 'Active',
        owner: lead?.owner || '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Basic validation
        if (!formData.name || !formData.value || !formData.source) {
            alert("Lead Name, Value, and Source are required.");
            return;
        }
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-300">Lead Name</label>
                <input required type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg p-2" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300">Value (INR)</label>
                <input required type="number" name="value" value={formData.value} onChange={handleChange} className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg p-2" />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-300">Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg p-2">
                    <option>Active</option>
                    <option>Won</option>
                    <option>Lost</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300">Source</label>
                <input required type="text" name="source" value={formData.source} onChange={handleChange} className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg p-2" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300">Owner</label>
                <input type="text" name="owner" value={formData.owner} onChange={handleChange} className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg p-2" />
            </div>
            {submitError && <p className="text-red-400 text-sm">{submitError}</p>}
            <div className="pt-4 flex space-x-4">
                <button type="button" onClick={onClose} className="w-full bg-gray-600 hover:bg-gray-500 font-bold py-2 px-4 rounded-lg">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-500 font-bold py-2 px-4 rounded-lg disabled:bg-gray-500">
                    {isSubmitting ? 'Saving...' : 'Save Lead'}
                </button>
            </div>
        </form>
    );
};

// --- Main Leads Page Component ---
export default function LeadsPage() {
    const { leads, metrics, loading, error, refreshData } = useData();
    const { session } = useAuth();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLead, setEditingLead] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingLeadId, setDeletingLeadId] = useState(null);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'descending' });

    // --- API Handlers (Create, Update, Delete) ---
    const handleSaveLead = async (formData) => {
        setIsSubmitting(true);
        setSubmitError(null);
        if (!session?.access_token) {
            setSubmitError("Authentication error.");
            setIsSubmitting(false);
            return;
        }
        const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}`};
        const isEditing = !!editingLead;
        const url = isEditing ? `http://127.0.0.1:8000/api/leads/${editingLead.id}` : 'http://127.0.0.1:8000/api/leads';
        const method = isEditing ? 'PUT' : 'POST';

        const bodyPayload = {
            id: isEditing ? editingLead.id : undefined,
            name: formData.name,
            source: formData.source,
            stage: formData.stage || 'Prospect',
            value: Number(formData.value),
            status: formData.status,
            owner: formData.owner || null,
        };

        const body = JSON.stringify(bodyPayload);

        try {
            const response = await fetch(url, { method, headers, body });
            if (!response.ok) {
                const errorData = await response.json();
                // FIX: This block intelligently parses the error message from the backend.
                // It prevents the "[object Object]" error by creating a readable string.
                let errorMessage = 'Failed to save lead. Please check the details.';
                if (errorData.detail) {
                    if (typeof errorData.detail === 'string') {
                        errorMessage = errorData.detail;
                    } else if (Array.isArray(errorData.detail) && errorData.detail[0] && errorData.detail[0].msg) {
                        // This handles FastAPI's detailed validation errors
                        errorMessage = `Validation Error: ${errorData.detail[0].msg}`;
                    }
                }
                throw new Error(errorMessage);
            }
            refreshData();
            closeModals();
        } catch (err) {
            // Now, `err.message` will always be a readable string.
            setSubmitError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteLead = async () => {
        setIsSubmitting(true);
        setSubmitError(null);
        if (!session?.access_token || !deletingLeadId) return;
        
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/leads/${deletingLeadId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            if (!response.ok) {
                 const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Failed to delete lead');
            }
            refreshData();
            closeModals();
        } catch (err) {
            setSubmitError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // --- UI Helpers ---
    const openAddModal = () => { setEditingLead(null); setIsModalOpen(true); };
    const openEditModal = (lead) => { setEditingLead(lead); setIsModalOpen(true); };
    const openDeleteModal = (id) => { setDeletingLeadId(id); setIsDeleteModalOpen(true); };
    const closeModals = () => {
        setIsModalOpen(false);
        setIsDeleteModalOpen(false);
        setEditingLead(null);
        setDeletingLeadId(null);
        setSubmitError(null);
    };

    const formatCurrency = (value) => (value || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

    const sortedAndFilteredLeads = useMemo(() => {
        let processableLeads = [...leads];
        if (searchTerm) {
            processableLeads = processableLeads.filter(l =>
                l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                l.owner?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                l.source.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (sortConfig.key) {
             processableLeads.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return processableLeads;
    }, [leads, searchTerm, sortConfig]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
        setSortConfig({ key, direction });
    };

    const SortableHeader = ({ label, sortKey }) => (
        <th className="p-4 font-semibold text-white cursor-pointer hover:bg-white/5" onClick={() => requestSort(sortKey)}>
            <div className="flex items-center">
                {label}
                {sortConfig.key === sortKey && (sortConfig.direction === 'ascending' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />)}
            </div>
        </th>
    );

    return (
        <div>
            {/* Modals */}
            <Modal isOpen={isModalOpen} onClose={closeModals} title={editingLead ? 'Edit Lead' : 'Add New Lead'}>
                <LeadForm lead={editingLead} onSave={handleSaveLead} onClose={closeModals} isSubmitting={isSubmitting} submitError={submitError} />
            </Modal>
            <Modal isOpen={isDeleteModalOpen} onClose={closeModals} title="Confirm Deletion">
                 <div>
                    <p className="text-gray-300 mb-6">Are you sure you want to delete this lead? This action is permanent.</p>
                    {submitError && <p className="text-red-400 text-sm mb-4">{submitError}</p>}
                    <div className="flex justify-end space-x-4">
                        <button onClick={closeModals} className="bg-gray-600 hover:bg-gray-500 font-bold py-2 px-4 rounded-lg">Cancel</button>
                        <button onClick={handleDeleteLead} disabled={isSubmitting} className="bg-red-600 hover:bg-red-500 font-bold py-2 px-4 rounded-lg disabled:bg-gray-500">
                            {isSubmitting ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Header */}
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center"><UserCircle2 className="mr-3" /> Leads</h1>
                    <p className="text-gray-400 mt-2">Monitor your sales funnel and lead sources.</p>
                </div>
                <button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg flex items-center"><PlusCircle className="mr-2 h-4 w-4" /> Add Lead</button>
            </div>

            {/* FEATURE: Upgraded & Expanded KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                <KPI title="Total Leads" value={metrics?.lead_stats?.total_leads ?? "..."} />
                <KPI title="Active Leads" value={metrics?.lead_stats?.active_leads ?? "..."} />
                <KPI title="Won Leads" value={metrics?.lead_stats?.won_leads ?? "..."} />
                <KPI title="Pipeline Value" value={formatCurrency(metrics?.lead_stats?.pipeline_value)} />
                <KPI title="Total Revenue" value={formatCurrency(metrics?.lead_stats?.total_revenue)} />
            </div>

            {/* Controls */}
            <div className="mb-4">
                 <div className="relative w-full max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input type="text" placeholder="Search leads..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                           className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 pl-10" />
                </div>
            </div>

            {/* Leads Table */}
            <div className="mt-4 bg-gray-800/50 rounded-2xl border border-white/10" style={{ maxHeight: "58vh", overflowY: 'auto' }}>
                {loading ? <p className="p-12 text-center text-gray-400">Loading leads...</p> : 
                 error ? <p className="p-12 text-center text-red-400">{error}</p> :
                 <table className="w-full text-left min-w-[700px]">
                    <thead>
                        <tr className="border-b border-white/10">
                            <SortableHeader label="Lead Name" sortKey="name" />
                            <SortableHeader label="Status" sortKey="status" />
                            <SortableHeader label="Value" sortKey="value" />
                            <SortableHeader label="Source" sortKey="source" />
                            <SortableHeader label="Owner" sortKey="owner" />
                            <th className="p-4 font-semibold text-white text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedAndFilteredLeads.map((lead) => (
                            <tr key={lead.id} className="border-b border-white/10 last:border-b-0 hover:bg-white/5">
                                <td className="p-4 font-semibold text-white">{lead.name}</td>
                                <td className="p-4 text-gray-300">{lead.status}</td>
                                <td className="p-4 text-gray-300">{formatCurrency(lead.value)}</td>
                                <td className="p-4 text-gray-300">{lead.source}</td>
                                <td className="p-4 text-gray-300">{lead.owner || '-'}</td>
                                <td className="p-4 text-center">
                                    <div className="flex justify-center space-x-2">
                                        <button onClick={() => openEditModal(lead)} className="p-2 text-gray-400 hover:text-blue-400"><Edit size={16} /></button>
                                        <button onClick={() => openDeleteModal(lead.id)} className="p-2 text-gray-400 hover:text-red-400"><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                }
            </div>
        </div>
    );
}

