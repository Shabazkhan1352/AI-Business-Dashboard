import React, { useState, useMemo, useEffect } from 'react'; // Import useEffect
import { Briefcase, PlusCircle, Download, X, Edit, Trash2, Search, ArrowUp, ArrowDown } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { API_BASE_URL, endpoints } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

// --- Reusable KPI Card Component (Unchanged) ---
const KPI = ({ title, value }) => (
    <div className="bg-gray-800/50 p-4 rounded-xl border border-white/10">
        <p className="text-sm text-gray-400">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
);

// --- Reusable Modal Component (Unchanged) ---
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

// --- Add/Edit Project Form Component ---
// THIS COMPONENT CONTAINS THE FINAL FIX
const ProjectForm = ({ project, onSave, onClose, isSubmitting, submitError }) => {
    const [formData, setFormData] = useState({
        name: '', client: '', budget: '', deadline: '', completion: 0,
    });

    // --- THIS IS THE FIX ---
    // This useEffect hook listens for changes to the 'project' prop.
    // When you open the modal to edit, this ensures the form's internal state
    // is correctly populated with the data of the project you clicked on.
    useEffect(() => {
        if (project) {
            setFormData({
                name: project.name || '',
                client: project.client || '',
                budget: project.budget || '',
                deadline: project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '',
                completion: project.completion || 0,
            });
        } else {
            // Reset the form when adding a new project
            setFormData({ name: '', client: '', budget: '', deadline: '', completion: 0 });
        }
    }, [project]); // This hook runs every time the 'project' prop changes.
    // --- END OF FIX ---

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300">Project Name</label>
                <input required type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
                <label htmlFor="client" className="block text-sm font-medium text-gray-300">Client Name</label>
                <input required type="text" name="client" value={formData.client} onChange={handleChange} className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg p-2" />
            </div>
            <div>
                <label htmlFor="budget" className="block text-sm font-medium text-gray-300">Budget (INR)</label>
                <input required type="number" name="budget" value={formData.budget} onChange={handleChange} className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg p-2" />
            </div>
            <div>
                <label htmlFor="deadline" className="block text-sm font-medium text-gray-300">Deadline</label>
                <input required type="date" name="deadline" value={formData.deadline} onChange={handleChange} className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg p-2" />
            </div>
            <div>
                <label htmlFor="completion" className="block text-sm font-medium text-gray-300">Completion (%)</label>
                <input type="range" min="0" max="100" name="completion" value={formData.completion} onChange={handleChange} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                <div className="text-center text-sm text-gray-400 mt-1">{formData.completion}%</div>
            </div>
            {submitError && <p className="text-red-400 text-sm">{submitError}</p>}
            <div className="pt-4 flex space-x-4">
                <button type="button" onClick={onClose} className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500">
                    {isSubmitting ? 'Saving...' : 'Save Project'}
                </button>
            </div>
        </form>
    );
};


// --- Main Projects Page Component (Unchanged) ---
export default function ProjectsPage() {
    const { projects, metrics, loading, error, refreshData } = useData();
    const { session } = useAuth();

    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingProjectId, setDeletingProjectId] = useState(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'descending' });

    // --- API HANDLERS (Add, Edit, Delete) ---
    const handleSaveProject = async (formData) => {
        setIsSubmitting(true);
        setSubmitError(null);

        if (!session?.access_token) {
            setSubmitError("Authentication error. Please log in again.");
            setIsSubmitting(false);
            return;
        }
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
        };

        const isEditing = !!editingProject;
        const url = isEditing ? `${API_BASE_URL}${endpoints.projects}/${editingProject.id}` : `${API_BASE_URL}${endpoints.projects}`;
        const method = isEditing ? 'PUT' : 'POST';

        // --- THIS IS THE FIX FOR THE START DATE ---
        const body = JSON.stringify({
            ...formData,
            budget: Number(formData.budget),
            completion: Number(formData.completion),
            // On create, set start_date to today.
            // On edit, include the original start_date from the project being edited
            // to ensure it is preserved and not lost.
            start_date: isEditing ? editingProject.start_date.split('T')[0] : new Date().toISOString().split('T')[0],
        });

        try {
            const response = await fetch(url, { method, headers, body });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to save project');
            }
            refreshData();
            closeModals();
        } catch (err) {
            setSubmitError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteProject = async () => {
        setIsSubmitting(true);
        setSubmitError(null);
        if (!session?.access_token || !deletingProjectId) {
            setSubmitError("Authentication or selection error.");
            setIsSubmitting(false);
            return;
        }
        const headers = { 'Authorization': `Bearer ${session.access_token}` };
        try {
            const response = await fetch(`${API_BASE_URL}${endpoints.projects}/${deletingProjectId}`, { method: 'DELETE', headers });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Failed to delete project');
            }
            refreshData();
            closeModals();
        } catch (err) {
            setSubmitError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- NEW: Fully implemented CSV Export functionality ---
    const exportCSV = () => {
        if (!projects || projects.length === 0) {
            alert("No projects to export.");
            return;
        }
        
        const headers = ["id", "name", "client", "start_date", "deadline", "completion", "status", "budget", "owner", "created_at", "updated_at"];
        
        const csvRows = [
            headers.join(','),
            ...projects.map(proj => {
                const row = headers.map(header => {
                    const value = proj[header] === null || proj[header] === undefined ? '' : String(proj[header]);
                    const escaped = value.replace(/"/g, '""');
                    return `"${escaped}"`;
                });
                return row.join(',');
            })
        ];

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'projects_export.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    // --- UI HELPER FUNCTIONS ---
    const openAddModal = () => {
        setEditingProject(null);
        setIsAddEditModalOpen(true);
    };

    const openEditModal = (project) => {
        console.log('Opening edit modal for:', project); // Keep this for debugging
        setEditingProject(project);
        setIsAddEditModalOpen(true);
    };
    
    const openDeleteModal = (id) => {
        setDeletingProjectId(id);
        setIsDeleteModalOpen(true);
    };

    const closeModals = () => {
        setIsAddEditModalOpen(false);
        setIsDeleteModalOpen(false);
        setEditingProject(null);
        setDeletingProjectId(null);
        setSubmitError(null);
    };
    
    const getStatusColor = (status) => {
        const colors = { 'On Track': 'bg-green-500/20 text-green-300', 'At Risk': 'bg-yellow-500/20 text-yellow-300', 'Delayed': 'bg-red-500/20 text-red-300', 'Completed': 'bg-blue-500/20 text-blue-300' };
        return colors[status] || 'bg-gray-500/20 text-gray-300';
    };

    const formatCurrency = (value) => {
        return (value || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
    };

    const sortedAndFilteredProjects = useMemo(() => {
        let processableProjects = [...projects];

        if (searchTerm) {
            processableProjects = processableProjects.filter(p =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.client.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (sortConfig.key) {
            processableProjects.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }

        return processableProjects;
    }, [projects, searchTerm, sortConfig]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const SortableHeader = ({ label, sortKey }) => (
        <th className="p-4 font-semibold text-white cursor-pointer hover:bg-white/5" onClick={() => requestSort(sortKey)}>
            <div className="flex items-center">
                {label}
                {sortConfig.key === sortKey && (
                    sortConfig.direction === 'ascending' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                )}
            </div>
        </th>
    );

    // --- RENDER LOGIC ---
    return (
      <div>
        {/* MODALS */}
        <Modal isOpen={isAddEditModalOpen} onClose={closeModals} title={editingProject ? 'Edit Project' : 'Add New Project'}>
            <ProjectForm project={editingProject} onSave={handleSaveProject} onClose={closeModals} isSubmitting={isSubmitting} submitError={submitError} />
        </Modal>
        <Modal isOpen={isDeleteModalOpen} onClose={closeModals} title="Confirm Deletion">
            <div>
                <p className="text-gray-300 mb-6">Are you sure you want to delete this project? This action cannot be undone.</p>
                {submitError && <p className="text-red-400 text-sm mb-4">{submitError}</p>}
                <div className="flex justify-end space-x-4">
                    <button onClick={closeModals} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Cancel</button>
                    <button onClick={handleDeleteProject} disabled={isSubmitting} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500">
                        {isSubmitting ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </Modal>
        
        {/* HEADER */}
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
            <div>
                <h1 className="text-3xl font-bold flex items-center"><Briefcase className="mr-3" /> Projects</h1>
                <p className="text-gray-400 mt-2">Manage and track all company projects.</p>
            </div>
            <div className="flex items-center space-x-2">
                 <button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg flex items-center"><PlusCircle className="mr-2 h-4 w-4" /> Add Project</button>
            </div>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <KPI title="Total Projects" value={metrics?.project_stats?.total_projects ?? '...'} />
            <KPI title="On Track" value={metrics?.project_stats?.on_track ?? '...'} />
            <KPI title="At Risk" value={metrics?.project_stats?.at_risk ?? '...'} />
            <KPI title="Delayed" value={metrics?.project_stats?.delayed ?? '...'} />
        </div>
        
        {/* CONTROLS: SEARCH BAR & EXPORT */}
        <div className="mb-4 flex justify-between items-center">
            <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by name or client..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 pl-10 focus:ring-blue-500 focus:border-blue-500"
                />
            </div>
            <button onClick={exportCSV} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg flex items-center"><Download className="mr-2 h-4 w-4" /> Export CSV</button>
        </div>

        {/* MAIN DATA TABLE */}
        <div className="mt-4 bg-gray-800/50 rounded-2xl border border-white/10" style={{ maxHeight: '58vh', overflowY: 'auto', minHeight: '200px' }}>
            {loading ? <p className="text-center p-12 text-gray-400">Loading projects...</p> :
             error ? <p className="text-center p-12 text-red-400 font-semibold">{error}</p> :
             <table className="w-full text-left min-w-[800px]">
                <thead>
                    <tr className="border-b border-white/10">
                        <SortableHeader label="Project Name" sortKey="name" />
                        <SortableHeader label="Client" sortKey="client" />
                        <SortableHeader label="Status" sortKey="status" />
                        <th className="p-4 font-semibold text-white">Completion</th>
                        <SortableHeader label="Budget" sortKey="budget" />
                        <th className="p-4 font-semibold text-white text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedAndFilteredProjects.map((project) => (
                        <tr key={project.id} className="border-b border-white/10 last:border-b-0 hover:bg-white/5 transition-colors">
                            <td className="p-4 font-semibold text-white">{project.name}</td>
                            <td className="p-4 text-gray-300">{project.client}</td>
                            <td className="p-4"><span className={`px-2 py-1 text-xs font-bold rounded-full ${getStatusColor(project.status)}`}>{project.status}</span></td>
                            <td className="p-4">
                                <div className="w-full bg-gray-700 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${project.completion ?? 0}%` }}></div></div>
                                <span className="text-xs text-gray-400 mt-1 block">{project.completion ?? 0}%</span>
                            </td>
                            <td className="p-4 text-gray-300">{formatCurrency(project.budget)}</td>
                            <td className="p-4 text-center">
                                <div className="flex justify-center space-x-2">
                                    <button onClick={() => openEditModal(project)} className="p-2 text-gray-400 hover:text-blue-400 transition-colors"><Edit size={16} /></button>
                                    <button onClick={() => openDeleteModal(project.id)} className="p-2 text-gray-400 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
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

