import React from 'react';
import { Briefcase, ShieldCheck, Bookmark, RefreshCw, Cpu, Layers } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, savedJobsCount, onRefresh, isServerOnline, dbStatus }) {
  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-slate-800/80 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('user')}>
            <div className="w-10 h-10 rounded-xl gradient-btn flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-white font-outfit">
                  Unstop<span className="gradient-text">Scraper</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  MERN Pro
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">77,700+ India Jobs Explorer</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('user')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'user'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Jobs Explorer</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'admin'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Hub</span>
            </button>
          </div>

          {/* Right Action Items */}
          <div className="flex items-center space-x-3">
            {/* Status indicator */}
            <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs">
              <span className={`w-2 h-2 rounded-full ${isServerOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-slate-300 font-medium">{dbStatus || 'Connected'}</span>
            </div>

            {/* Bookmarks */}
            <button
              onClick={() => setActiveTab('user')}
              className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Saved Jobs"
            >
              <Bookmark className="w-5 h-5 text-amber-400" />
              {savedJobsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shadow-md">
                  {savedJobsCount}
                </span>
              )}
            </button>

            {/* Refresh */}
            <button
              onClick={onRefresh}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
