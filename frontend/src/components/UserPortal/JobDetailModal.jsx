import React from 'react';
import { X, Building2, MapPin, IndianRupee, ExternalLink, Calendar, CheckCircle2, Award, FileText, Layers, Share2, Bookmark } from 'lucide-react';

export default function JobDetailModal({ job, onClose, isSaved, onToggleSave }) {
  if (!job) return null;

  const companyLogo = job.organisation?.logoUrl || job.organisation?.logoUrl2 || 'https://d8it4huxumps7.cloudfront.net/images/icons/jobs.svg';

  const formatSalary = (amount, payIn) => {
    if (!amount) return 'Not Disclosed';
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)} Lakhs`;
    }
    return `₹${amount.toLocaleString('en-IN')}/${payIn === 'monthly' ? 'month' : 'year'}`;
  };

  const applyUrl = job.seoUrl || job.shortUrl || `https://unstop.com/o/${job.unstopId}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">

        {/* Modal Top Bar */}
        <div className="sticky top-0 z-10 glass-panel px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 p-2 flex items-center justify-center overflow-hidden">
              <img
                src={companyLogo}
                alt={job.organisation?.name}
                className="max-w-full max-h-full object-contain"
                onError={(e) => { e.target.onerror = null; e.target.src = 'https://d8it4huxumps7.cloudfront.net/images/icons/jobs.svg'; }}
              />
            </div>
            <div>
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                {job.organisation?.name || 'Company Confidential'}
              </span>
              <h2 className="text-lg font-bold text-white line-clamp-1">
                {job.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onToggleSave(job)}
              className={`p-2.5 rounded-xl border transition-colors ${
                isSaved ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-amber-400'
              }`}
              title={isSaved ? 'Remove Bookmark' : 'Bookmark Job'}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-400' : ''}`} />
            </button>

            <a
              href={applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-4 py-2 rounded-xl gradient-btn text-white text-xs font-bold shadow-lg shadow-indigo-600/30"
            >
              <span>Apply on Unstop</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-300">

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Salary Package</span>
              <p className="text-sm font-bold text-emerald-400 mt-0.5 flex items-center gap-1">
                <IndianRupee className="w-4 h-4" />
                {job.jobDetail?.max_salary
                  ? `${formatSalary(job.jobDetail.min_salary, job.jobDetail.pay_in)} - ${formatSalary(job.jobDetail.max_salary, job.jobDetail.pay_in)}`
                  : 'Undisclosed'}
              </p>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Job Location</span>
              <p className="text-sm font-medium text-slate-200 mt-0.5 flex items-center gap-1">
                <MapPin className="w-4 h-4 text-indigo-400" />
                <span>{job.locations?.join(', ') || 'Remote'}</span>
              </p>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Work Setup</span>
              <p className="text-sm font-medium text-indigo-300 mt-0.5 capitalize">
                {job.jobDetail?.type?.replace('_', ' ') || 'In Office'} • {job.jobDetail?.timing?.replace('_', ' ') || 'Full Time'}
              </p>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Application Deadline</span>
              <p className="text-sm font-bold text-amber-400 mt-0.5">
                {job.regnRequirements?.remain_days || 'Open'}
              </p>
            </div>
          </div>

          {/* Job Skills & Work Function */}
          {job.requiredSkills && job.requiredSkills.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-400" />
                Required Key Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {job.requiredSkills.map((skill, i) => (
                  <span key={i} className="px-3 py-1 rounded-xl text-xs font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-800/40">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* HTML Description Content */}
          <div>
            <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              Job Overview & Requirements
            </h3>
            <div
              className="prose prose-invert max-w-none prose-p:text-slate-300 prose-headings:text-indigo-200 prose-ul:text-slate-300 prose-li:my-1 text-sm bg-slate-950/40 p-5 rounded-2xl border border-slate-800/60 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: job.details || '<p>No detail description available.</p>' }}
            />
          </div>

          {/* Selection Process Rounds (if present) */}
          {job.rounds && job.rounds.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                Hiring & Evaluation Process ({job.rounds.length} Rounds)
              </h3>
              <div className="space-y-3">
                {job.rounds.map((round, idx) => (
                  <div key={idx} className="flex items-start space-x-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-200 text-sm">{round.title}</h4>
                      <p className="text-xs text-slate-400 mt-1">{round.displayText || 'Profile screening and skills assessment'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resume Match Weightage Matrix (Unstop Feature) */}
          {job.resumeMatchConfig && job.resumeMatchConfig.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Unstop Resume Match Score Criteria
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {job.resumeMatchConfig.map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-slate-200">{item.label}</span>
                      <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/40">
                        {item.weightage}% weight
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Actions */}
        <div className="sticky bottom-0 glass-panel px-6 py-4 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            <span>Job ID: #{job.unstopId} • Scraped from Unstop</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Close
            </button>
            <a
              href={applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl gradient-btn text-white text-xs font-bold shadow-lg shadow-indigo-600/30"
            >
              <span>Apply Now</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
