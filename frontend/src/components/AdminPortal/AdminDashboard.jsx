import React from 'react';
import { Database, Activity, Building2, MapPin, IndianRupee, Layers, Briefcase, GraduationCap, Sparkles } from 'lucide-react';

export default function AdminDashboard({ stats }) {
  const {
    totalOpportunities = 0,
    totalFullTimeJobs = 0,
    totalInternships = 0,
    activeOpportunities = 0,
    activeFullTimeJobs = 0,
    activeInternships = 0,
    uniqueCompanies = 0,
    avgMaxSalary = 0,
    highestSalary = 0,
    topLocations = []
  } = stats || {};

  return (
    <div className="space-y-6">

      {/* Primary Metrics Grid (Jobs vs Internships Breakdown) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Total Full Time Jobs */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Full-Time Jobs</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white mt-3 font-outfit">{totalFullTimeJobs.toLocaleString()}</p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[11px]">
            <span className="text-emerald-400 font-semibold">{activeFullTimeJobs} Active Live</span>
            <span className="text-slate-500">{totalFullTimeJobs - activeFullTimeJobs} Ended</span>
          </div>
        </div>

        {/* Total Internships */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Internships</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white mt-3 font-outfit">{totalInternships.toLocaleString()}</p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[11px]">
            <span className="text-purple-300 font-semibold">{activeInternships} Active Live</span>
            <span className="text-slate-500">{totalInternships - activeInternships} Ended</span>
          </div>
        </div>

        {/* Total Combined Opportunities */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">All Opportunities</span>
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white mt-3 font-outfit">{totalOpportunities.toLocaleString()}</p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[11px]">
            <span className="text-sky-400 font-semibold">{activeOpportunities} Active Live</span>
            <span className="text-slate-500">Jobs + Internships</span>
          </div>
        </div>

        {/* Unique Hiring Companies */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Hiring Companies</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white mt-3 font-outfit">{uniqueCompanies.toLocaleString()}</p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[11px]">
            <span className="text-amber-400 font-semibold">Verified Organisations</span>
          </div>
        </div>

      </div>

      {/* Salary & Location Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Highest Compensation */}
        <div className="lg:col-span-4 glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Highest Package / Stipend</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-400 mt-3 font-outfit">
            {highestSalary >= 100000 ? `₹${(highestSalary / 100000).toFixed(1)} LPA` : `₹${highestSalary}`}
          </p>
          <span className="text-[11px] text-slate-400 font-medium mt-1 inline-block">
            Avg Max Package: ₹{(avgMaxSalary / 100000).toFixed(1)} LPA
          </span>
        </div>

        {/* Top Locations Breakdown */}
        {topLocations.length > 0 && (
          <div className="lg:col-span-8 glass-panel p-5 rounded-2xl border border-slate-800">
            <h3 className="text-xs font-bold text-white mb-3 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-400" />
              Top Hiring Hubs in India
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {topLocations.map((loc, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-xs font-bold text-slate-200 block truncate">{loc.location}</span>
                  <span className="text-xs text-indigo-400 font-semibold">{loc.count} Opportunities</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
