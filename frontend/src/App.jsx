import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './components/Navbar';
import JobCard from './components/UserPortal/JobCard';
import JobDetailModal from './components/UserPortal/JobDetailModal';
import FilterSidebar from './components/UserPortal/FilterSidebar';
import AdminDashboard from './components/AdminPortal/AdminDashboard';
import ScraperControlHub from './components/AdminPortal/ScraperControlHub';
import JobManager from './components/AdminPortal/JobManager';
import { Search, Briefcase, Bookmark, Sparkles, SlidersHorizontal, RefreshCw, LayoutGrid, List, AlertCircle } from 'lucide-react';

export default function App() {
  // Restore State from localStorage on reload
  const [activeTab, setActiveTab] = useState(() => {
    try { return localStorage.getItem('unstop_active_tab') || 'user'; } catch (e) { return 'user'; }
  });

  const [adminSubTab, setAdminSubTab] = useState(() => {
    try { 
      return localStorage.getItem('unstop_admin_subtab') || 'dashboard'; 
    } catch (e) { return 'dashboard'; }
  });

  // Data states
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 12, totalPages: 1 });
  const [metaOptions, setMetaOptions] = useState({ locations: [], skills: [], companies: [] });
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [savedJobs, setSavedJobs] = useState(() => {
    try {
      const stored = localStorage.getItem('unstop_saved_jobs');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [adminStats, setAdminStats] = useState({});
  const [healthStatus, setHealthStatus] = useState({ isOnline: true, db: 'Loading...' });

  // Filters State restored from localStorage
  const [filters, setFilters] = useState(() => {
    try {
      const stored = localStorage.getItem('unstop_filters');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {
      q: '',
      location: '',
      type: '',
      timing: '',
      skill: '',
      opportunityType: 'ALL',
      minSalary: 0,
      sortBy: 'newest',
      page: 1
    };
  });

  // Persist Active Tab to localStorage
  useEffect(() => {
    try { localStorage.setItem('unstop_active_tab', activeTab); } catch (e) {}
  }, [activeTab]);

  // Persist Admin SubTab to localStorage
  useEffect(() => {
    try { localStorage.setItem('unstop_admin_subtab', adminSubTab); } catch (e) {}
  }, [adminSubTab]);

  // Persist Filters to localStorage
  useEffect(() => {
    try { localStorage.setItem('unstop_filters', JSON.stringify(filters)); } catch (e) {}
  }, [filters]);

  // Save savedJobs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('unstop_saved_jobs', JSON.stringify(savedJobs));
    } catch (e) {
      console.error('LocalStorage save error', e);
    }
  }, [savedJobs]);

  // Check backend health
  const checkHealth = async () => {
    try {
      const res = await axios.get('/api/health');
      setHealthStatus({ isOnline: true, db: res.data.database });
    } catch (e) {
      setHealthStatus({ isOnline: false, db: 'Offline / Reconnecting' });
    }
  };

  // Fetch Jobs from backend API
  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = {
        q: filters.q,
        location: filters.location,
        type: filters.type,
        timing: filters.timing,
        skill: filters.skill,
        opportunityType: filters.opportunityType || 'ALL',
        minSalary: filters.minSalary,
        sortBy: filters.sortBy,
        page: filters.page,
        limit: 12
      };

      const res = await axios.get('/api/jobs', { params });
      if (res.data.success) {
        setJobs(res.data.data);
        setPagination(res.data.pagination);
        if (res.data.meta) setMetaOptions(res.data.meta);
      }
    } catch (err) {
      console.error('Error loading jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Admin Stats
  const fetchAdminStats = async () => {
    try {
      const res = await axios.get('/api/jobs/admin/stats');
      if (res.data.success) setAdminStats(res.data.data);
    } catch (e) {
      console.error('Error loading admin stats', e);
    }
  };

  useEffect(() => {
    checkHealth();
    fetchJobs();
    fetchAdminStats();
  }, [filters]);

  const handleResetFilters = () => {
    const resetState = {
      q: '',
      location: '',
      type: '',
      timing: '',
      skill: '',
      opportunityType: 'ALL',
      minSalary: 0,
      sortBy: 'newest',
      page: 1
    };
    setFilters(resetState);
    setShowSavedOnly(false);
    try { localStorage.removeItem('unstop_filters'); } catch (e) {}
  };

  const toggleSaveJob = (job) => {
    const exists = savedJobs.some(j => (j._id && j._id === job._id) || j.unstopId === job.unstopId);
    if (exists) {
      setSavedJobs(savedJobs.filter(j => (j._id ? j._id !== job._id : j.unstopId !== job.unstopId)));
    } else {
      setSavedJobs([...savedJobs, job]);
    }
  };

  const isJobSaved = (job) => {
    return savedJobs.some(j => (j._id && j._id === job._id) || j.unstopId === job.unstopId);
  };

  const displayedJobs = showSavedOnly ? savedJobs : jobs;

  const getCategoryTabLabel = () => {
    if (filters.opportunityType === 'jobs') return `Jobs (${pagination.total})`;
    if (filters.opportunityType === 'internships') return `Internships (${pagination.total})`;
    return `All Opportunities (${pagination.total})`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-indigo-600">

      {/* Main Navbar Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        savedJobsCount={savedJobs.length}
        onRefresh={() => { fetchJobs(); fetchAdminStats(); checkHealth(); }}
        isServerOnline={healthStatus.isOnline}
        dbStatus={healthStatus.db}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* USER PORTAL VIEW */}
        {activeTab === 'user' && (
          <div className="space-y-8">

            {/* Hero Banner with Search */}
            <div className="relative rounded-3xl overflow-hidden glass-panel p-8 border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 shadow-2xl">
              <div className="max-w-3xl space-y-4">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Real-time Scraped Job & Internship Intelligence Engine</span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-outfit tracking-tight leading-tight">
                  Find Your Next Role Across <span className="gradient-text">India Opportunities</span>
                </h1>

                <p className="text-sm text-slate-300">
                  Search live unstop jobs and internships with full compensation details, interview round roadmaps, and instant eligibility matching.
                </p>

                {/* Main Search Bar */}
                <div className="relative pt-2">
                  <div className="flex items-center bg-slate-950/90 border border-slate-800 rounded-2xl p-2 shadow-xl focus-within:border-indigo-500 transition-all">
                    <Search className="w-5 h-5 text-indigo-400 ml-3 mr-2" />
                    <input
                      type="text"
                      placeholder="Job/Internship title, company name, skill (e.g. Software Internship, React, Solar EPC)..."
                      value={filters.q}
                      onChange={(e) => setFilters(prev => ({ ...prev, q: e.target.value, page: 1 }))}
                      className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
                    />
                    {filters.q && (
                      <button
                        onClick={() => setFilters(prev => ({ ...prev, q: '', page: 1 }))}
                        className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Content Layout Grid (Sidebar + Job Cards) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

              {/* Filter Sidebar */}
              <div className="lg:col-span-3">
                <FilterSidebar
                  filters={filters}
                  setFilters={setFilters}
                  metaOptions={metaOptions}
                  onReset={handleResetFilters}
                />
              </div>

              {/* Main Jobs Listing Section */}
              <div className="lg:col-span-9 space-y-6">

                {/* Listing Control Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 glass-panel px-5 py-3.5 rounded-2xl border border-slate-800">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setShowSavedOnly(false)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        !showSavedOnly ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {getCategoryTabLabel()}
                    </button>
                    <button
                      onClick={() => setShowSavedOnly(true)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        showSavedOnly ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>Saved ({savedJobs.length})</span>
                    </button>
                  </div>

                  {/* Sort Selector */}
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-slate-400 font-medium">Sort by:</span>
                    <select
                      value={filters.sortBy}
                      onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value, page: 1 }))}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="newest">Recently Scraped</option>
                      <option value="salary_desc">Highest Package / Stipend</option>
                      <option value="salary_asc">Lowest Package</option>
                      <option value="views">Most Viewed</option>
                    </select>
                  </div>
                </div>

                {/* Job Cards Grid */}
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map(n => (
                      <div key={n} className="glass-card rounded-2xl p-6 h-64 animate-pulse space-y-4">
                        <div className="flex space-x-3">
                          <div className="w-12 h-12 bg-slate-800 rounded-xl" />
                          <div className="space-y-2 flex-1">
                            <div className="h-4 bg-slate-800 rounded w-3/4" />
                            <div className="h-3 bg-slate-800/60 rounded w-1/2" />
                          </div>
                        </div>
                        <div className="h-4 bg-slate-800/80 rounded w-1/3" />
                        <div className="h-12 bg-slate-800/40 rounded w-full" />
                      </div>
                    ))}
                  </div>
                ) : displayedJobs.length === 0 ? (
                  <div className="glass-panel rounded-3xl p-12 text-center border border-slate-800 space-y-4">
                    <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
                    <h3 className="text-lg font-bold text-white">No opportunities matched your current criteria</h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      Try resetting your location, category, or search terms.
                    </p>
                    <button
                      onClick={handleResetFilters}
                      className="px-4 py-2 rounded-xl gradient-btn text-white text-xs font-bold"
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {displayedJobs.map((job) => (
                      <JobCard
                        key={job._id || job.unstopId}
                        job={job}
                        onSelect={setSelectedJob}
                        isSaved={isJobSaved(job)}
                        onToggleSave={toggleSaveJob}
                      />
                    ))}
                  </div>
                )}

                {/* Pagination Controls */}
                {!showSavedOnly && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between glass-panel px-6 py-4 rounded-2xl border border-slate-800">
                    <span className="text-xs text-slate-400">
                      Page <strong className="text-white">{pagination.page}</strong> of <strong className="text-white">{pagination.totalPages}</strong> ({pagination.total} items)
                    </span>

                    <div className="flex space-x-2">
                      <button
                        disabled={pagination.page <= 1}
                        onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white disabled:opacity-40"
                      >
                        Previous
                      </button>

                      <button
                        disabled={pagination.page >= pagination.totalPages}
                        onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-40"
                      >
                        Next Page
                      </button>
                    </div>
                  </div>
                )}

              </div>

            </div>

          </div>
        )}

        {/* ADMIN PORTAL VIEW */}
        {activeTab === 'admin' && (
          <div className="space-y-6">

            {/* Admin Sub Navigation */}
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
              {[
                { id: 'dashboard', label: 'Metrics Dashboard' },
                { id: 'scraper', label: 'Scraper Control & Audit Logs' },
                { id: 'manage', label: 'Job Manager (CRUD)' }
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setAdminSubTab(sub.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    adminSubTab === sub.id
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {/* Subtab Contents */}
            {adminSubTab === 'dashboard' && (
              <AdminDashboard
                stats={adminStats}
              />
            )}

            {adminSubTab === 'scraper' && (
              <ScraperControlHub
                onScrapeFinished={() => {
                  fetchJobs();
                  fetchAdminStats();
                }}
              />
            )}

            {adminSubTab === 'manage' && (
              <JobManager
                jobs={jobs}
                onJobUpdated={() => {
                  fetchJobs();
                  fetchAdminStats();
                }}
              />
            )}

          </div>
        )}

      </main>

      {/* Selected Job Detail Modal Overlay */}
      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          isSaved={isJobSaved(selectedJob)}
          onToggleSave={toggleSaveJob}
        />
      )}

      {/* App Footer */}
      <footer className="glass-panel border-t border-slate-800/80 py-6 mt-12 text-center text-xs text-slate-500">
        <p>Unstop Job & Internship Scraper • Built with Node.js, Express, MongoDB & React</p>
      </footer>

    </div>
  );
}
