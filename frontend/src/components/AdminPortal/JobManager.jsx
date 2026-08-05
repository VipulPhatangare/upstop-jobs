import React, { useState } from 'react';
import axios from 'axios';
import { Plus, Search, Edit2, Trash2, Check, X, Building2, MapPin, IndianRupee, ExternalLink } from 'lucide-react';

export default function JobManager({ jobs, onJobUpdated }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    companyName: '',
    locations: '',
    minSalary: 0,
    maxSalary: 0,
    type: 'in_office',
    timing: 'full_time',
    skills: '',
    details: '',
    status: 'LIVE'
  });

  const filteredJobs = jobs.filter(j =>
    j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.organisation?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.locations?.some(l => l.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/jobs', formData);
      if (res.data.success) {
        alert('Job created successfully!');
        setShowAddModal(false);
        setFormData({ title: '', companyName: '', locations: '', minSalary: 0, maxSalary: 0, type: 'in_office', timing: 'full_time', skills: '', details: '', status: 'LIVE' });
        onJobUpdated();
      }
    } catch (err) {
      alert(`Error creating job: ${err.message}`);
    }
  };

  const handleEditClick = (job) => {
    setEditingJob(job);
    setFormData({
      title: job.title || '',
      companyName: job.organisation?.name || '',
      locations: job.locations?.join(', ') || '',
      minSalary: job.jobDetail?.min_salary || 0,
      maxSalary: job.jobDetail?.max_salary || 0,
      type: job.jobDetail?.type || 'in_office',
      timing: job.jobDetail?.timing || 'full_time',
      skills: job.requiredSkills?.join(', ') || '',
      details: job.details || '',
      status: job.status || 'LIVE'
    });
  };

  const handleUpdateJob = async (e) => {
    e.preventDefault();
    if (!editingJob) return;
    try {
      const res = await axios.put(`/api/jobs/${editingJob._id || editingJob.unstopId}`, formData);
      if (res.data.success) {
        alert('Job updated successfully!');
        setEditingJob(null);
        onJobUpdated();
      }
    } catch (err) {
      alert(`Error updating job: ${err.message}`);
    }
  };

  const handleDeleteJob = async (job) => {
    if (!window.confirm(`Are you sure you want to delete "${job.title}"?`)) return;
    try {
      const res = await axios.delete(`/api/jobs/${job._id || job.unstopId}`);
      if (res.data.success) {
        alert('Job deleted successfully!');
        onJobUpdated();
      }
    } catch (err) {
      alert(`Error deleting job: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search managed jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <button
          onClick={() => {
            setEditingJob(null);
            setFormData({ title: '', companyName: '', locations: '', minSalary: 0, maxSalary: 0, type: 'in_office', timing: 'full_time', skills: '', details: '', status: 'LIVE' });
            setShowAddModal(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl gradient-btn font-bold text-white text-xs shadow-lg shadow-indigo-600/30"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Job Role</span>
        </button>
      </div>

      {/* Jobs Data Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4">Job Role & Company</th>
                <th className="p-4">Locations</th>
                <th className="p-4">Salary Package</th>
                <th className="p-4">Work Setup</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    No jobs matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => (
                  <tr key={job._id || job.unstopId} className="hover:bg-slate-900/60 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-100 text-sm">{job.title}</div>
                      <div className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 text-indigo-400" />
                        {job.organisation?.name || 'Company Confidential'}
                      </div>
                    </td>
                    <td className="p-4 text-slate-300">
                      {job.locations?.join(', ') || 'Remote'}
                    </td>
                    <td className="p-4 font-semibold text-emerald-400">
                      {job.jobDetail?.max_salary
                        ? `₹${(job.jobDetail.min_salary / 100000).toFixed(1)} - ₹${(job.jobDetail.max_salary / 100000).toFixed(1)} LPA`
                        : 'Undisclosed'}
                    </td>
                    <td className="p-4 capitalize">
                      <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-800 text-slate-300">
                        {job.jobDetail?.type?.replace('_', ' ') || 'In Office'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        job.status === 'LIVE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' : 'bg-amber-950 text-amber-400 border border-amber-800/50'
                      }`}>
                        {job.status || 'LIVE'}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleEditClick(job)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-400"
                        title="Edit Job"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteJob(job)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/40 text-red-400"
                        title="Delete Job"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Job Modal */}
      {(showAddModal || editingJob) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-white">
                {editingJob ? `Edit Job: ${editingJob.title}` : 'Create Custom Job Entry'}
              </h3>
              <button
                onClick={() => { setShowAddModal(false); setEditingJob(null); }}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={editingJob ? handleUpdateJob : handleCreateJob} className="space-y-4 text-xs">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Job Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Company Name</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Locations (comma separated)</label>
                  <input
                    type="text"
                    placeholder="Mumbai, Pune"
                    value={formData.locations}
                    onChange={(e) => setFormData({ ...formData, locations: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Min Salary (Annual ₹)</label>
                  <input
                    type="number"
                    value={formData.minSalary}
                    onChange={(e) => setFormData({ ...formData, minSalary: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Max Salary (Annual ₹)</label>
                  <input
                    type="number"
                    value={formData.maxSalary}
                    onChange={(e) => setFormData({ ...formData, maxSalary: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Work Setup</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="in_office">In Office</option>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Timing</label>
                  <select
                    value={formData.timing}
                    onChange={(e) => setFormData({ ...formData, timing: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="full_time">Full Time</option>
                    <option value="internship">Internship</option>
                    <option value="part_time">Part Time</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="LIVE">LIVE</option>
                    <option value="CLOSED">CLOSED</option>
                    <option value="DRAFT">DRAFT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Required Skills (comma separated)</label>
                <input
                  type="text"
                  placeholder="React, Node.js, SQL"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Job Details & Overview (HTML supported)</label>
                <textarea
                  rows="4"
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setEditingJob(null); }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl gradient-btn text-white font-bold shadow-lg"
                >
                  {editingJob ? 'Save Changes' : 'Create Job'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
