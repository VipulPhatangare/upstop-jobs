import React from 'react';
import { MapPin, Building2, IndianRupee, Clock, Calendar, Bookmark, ExternalLink, ArrowRight, Eye, Briefcase, GraduationCap } from 'lucide-react';

export default function JobCard({ job, onSelect, isSaved, onToggleSave }) {
  const formatSalary = (amount, payIn) => {
    if (!amount) return 'Not Disclosed';
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)} LPA`;
    }
    return `₹${amount.toLocaleString('en-IN')}/${payIn === 'monthly' ? 'mo' : 'yr'}`;
  };

  const getSalaryDisplay = () => {
    const { min_salary, max_salary, pay_in, not_disclosed } = job.jobDetail || {};
    if (not_disclosed) return 'Stipend Not Disclosed';
    if (min_salary && max_salary) {
      return `${formatSalary(min_salary, pay_in)} - ${formatSalary(max_salary, pay_in)}`;
    }
    if (max_salary) return `Up to ${formatSalary(max_salary, pay_in)}`;
    if (min_salary) return `From ${formatSalary(min_salary, pay_in)}`;
    return 'Competitive Stipend';
  };

  const getWorkTypeBadge = (type) => {
    switch (type) {
      case 'remote':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Remote</span>;
      case 'hybrid':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">Hybrid</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">In-Office</span>;
    }
  };

  const companyLogo = job.organisation?.logoUrl || job.organisation?.logoUrl2 || 'https://d8it4huxumps7.cloudfront.net/images/icons/jobs.svg';
  const isInternship = job.opportunityType === 'internships' || job.jobDetail?.timing === 'internship';

  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col justify-between relative group border border-slate-800 hover:border-indigo-500/40 transition-all">

      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 p-2 flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform">
              <img
                src={companyLogo}
                alt={job.organisation?.name || 'Company Logo'}
                className="max-w-full max-h-full object-contain"
                onError={(e) => { e.target.onerror = null; e.target.src = 'https://d8it4huxumps7.cloudfront.net/images/icons/jobs.svg'; }}
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  {job.organisation?.name || 'Company Confidential'}
                </h4>
                {isInternship && (
                  <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" />
                    INTERNSHIP
                  </span>
                )}
              </div>
              <h3 className="font-bold text-base text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                {job.title}
              </h3>
            </div>
          </div>

          {/* Bookmark Action */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleSave(job); }}
            className={`p-2 rounded-xl border transition-all ${
              isSaved
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-amber-400 hover:bg-slate-800'
            }`}
            title={isSaved ? 'Remove from Saved' : 'Save Opportunity'}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-400' : ''}`} />
          </button>
        </div>

        {/* Salary & Badges Row */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-800/40 text-indigo-300 font-semibold text-xs">
            <IndianRupee className="w-3.5 h-3.5" />
            <span>{getSalaryDisplay()}</span>
          </div>
          {getWorkTypeBadge(job.jobDetail?.type)}
          {job.jobDetail?.timing && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 capitalize">
              {job.jobDetail.timing.replace('_', ' ')}
            </span>
          )}
        </div>

        {/* Location & Experience */}
        <div className="space-y-1.5 text-xs text-slate-300 mb-4">
          <div className="flex items-center space-x-1.5 text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
            <span className="line-clamp-1">
              {job.locations && job.locations.length > 0 ? job.locations.join(', ') : 'Location on Request'}
            </span>
          </div>

          {job.regnRequirements?.remain_days && (
            <div className="flex items-center space-x-1.5 text-amber-400 font-medium">
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{job.regnRequirements.remain_days}</span>
            </div>
          )}
        </div>

        {/* Required Skills Tags */}
        {job.requiredSkills && job.requiredSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {job.requiredSkills.slice(0, 4).map((skill, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 text-[11px] rounded-md bg-slate-800/90 text-slate-300 border border-slate-700/60"
              >
                {skill}
              </span>
            ))}
            {job.requiredSkills.length > 4 && (
              <span className="px-1.5 py-0.5 text-[10px] rounded-md bg-slate-800/50 text-slate-400">
                +{job.requiredSkills.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer Actions */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between mt-auto">
        <div className="flex items-center space-x-3 text-[11px] text-slate-400">
          <span className="flex items-center space-x-1">
            <Eye className="w-3 h-3 text-slate-500" />
            <span>{job.viewsCount || 0} views</span>
          </span>
          {job.isCustom && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300">
              Admin Created
            </span>
          )}
        </div>

        <button
          onClick={() => onSelect(job)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/90 hover:bg-indigo-500 text-white text-xs font-semibold transition-all group-hover:shadow-md group-hover:shadow-indigo-600/20"
        >
          <span>View Details</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

    </div>
  );
}
