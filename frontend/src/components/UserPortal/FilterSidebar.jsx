import React from 'react';
import { Filter, Search, MapPin, IndianRupee, Briefcase, Sparkles, RotateCcw, GraduationCap } from 'lucide-react';

export default function FilterSidebar({ filters, setFilters, metaOptions, onReset }) {
  const handleChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-6 sticky top-20">

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2 text-white font-bold text-sm">
          <Filter className="w-4 h-4 text-indigo-400" />
          <span>Filter Opportunities</span>
        </div>
        <button
          onClick={onReset}
          className="flex items-center space-x-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Opportunity Category (Jobs vs Internships) */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1">
          <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
          Opportunity Category
        </label>
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-950/60 border border-slate-800">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'jobs', label: 'Jobs' },
            { id: 'internships', label: 'Internships' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => handleChange('opportunityType', cat.id)}
              className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                (filters.opportunityType || 'ALL') === cat.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Work Setup (Type) */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
          Work Setup
        </label>
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-950/60 border border-slate-800">
          {[
            { id: '', label: 'All' },
            { id: 'in_office', label: 'Office' },
            { id: 'remote', label: 'Remote' },
            { id: 'hybrid', label: 'Hybrid' }
          ].map(type => (
            <button
              key={type.id}
              onClick={() => handleChange('type', type.id)}
              className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                filters.type === type.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Job Location Filter */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-indigo-400" />
            Location
          </span>
        </label>
        <select
          value={filters.location}
          onChange={(e) => handleChange('location', e.target.value)}
          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
        >
          <option value="">All Locations (India)</option>
          {metaOptions.locations?.map((loc, i) => (
            <option key={i} value={loc}>{loc}</option>
          ))}
        </select>
      </div>

      {/* Minimum Annual / Monthly Compensation Filter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <label className="font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1">
            <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
            Min Package
          </label>
          <span className="font-bold text-emerald-400">
            {filters.minSalary > 0 ? `₹${(filters.minSalary / 100000).toFixed(1)} LPA+` : 'Any Salary'}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="3000000"
          step="100000"
          value={filters.minSalary}
          onChange={(e) => handleChange('minSalary', parseInt(e.target.value, 10))}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
        <div className="flex justify-between text-[10px] text-slate-500 font-medium">
          <span>₹0</span>
          <span>₹15L</span>
          <span>₹30L+</span>
        </div>
      </div>

      {/* Required Skills */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Skill Keyword
        </label>
        <select
          value={filters.skill}
          onChange={(e) => handleChange('skill', e.target.value)}
          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
        >
          <option value="">All Skills</option>
          {metaOptions.skills?.map((sk, i) => (
            <option key={i} value={sk}>{sk}</option>
          ))}
        </select>
      </div>

      {/* Job Schedule / Timing */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
          Job Schedule
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: '', label: 'All Schedules' },
            { id: 'full_time', label: 'Full Time' },
            { id: 'internship', label: 'Internship' },
            { id: 'part_time', label: 'Part Time' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => handleChange('timing', t.id)}
              className={`py-1.5 px-2 text-xs font-medium rounded-lg border transition-all ${
                filters.timing === t.id
                  ? 'bg-purple-950/80 border-purple-600 text-purple-200'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
