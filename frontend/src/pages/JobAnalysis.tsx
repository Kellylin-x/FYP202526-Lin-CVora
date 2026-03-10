import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Search, Loader2, Briefcase, MapPin,
    Clock, DollarSign, Star, CheckCircle2, Plus,
    Monitor, Users, ChevronDown, ChevronUp, XCircle
} from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

const API_BASE = 'http://localhost:8000';

// Shape of the LLM analysis response from the backend
interface JobAnalysisResult {
    job_title: string | null;
    company: string | null;
    tldr: string | null;               // Plain English summary of the role
    employment_type: string | null;    // Full-time, Part-time, Contract etc.
    work_model: string | null;         // Remote, Hybrid, On-site
    salary: string | null;             // Salary range if mentioned in the job description
    experience_level: string | null;   // Junior, Mid-level, Senior, Lead
    key_requirements: string[];        // Must-have skills and experience
    nice_to_have: string[];            // Preferred but not essential skills
    tech_stack: string[];              // Technologies mentioned in the job description
    soft_skills: string[];             // Soft skills mentioned
    error?: string;
}

// Page can be in one of these states
type AnalysisState = 'idle' | 'loading' | 'success' | 'error';

export const JobAnalysis: React.FC = () => {
    const navigate = useNavigate();

    // Form and result state
    const [jobDescription, setJobDescription] = useState('');
    const [analysisState, setAnalysisState] = useState<AnalysisState>('idle');
    const [result, setResult] = useState<JobAnalysisResult | null>(null);
    const [errorMessage, setErrorMessage] = useState('');

    // Send job description to the LLM analysis endpoint
    const handleAnalyse = async () => {
        if (jobDescription.trim().length < 50) {
            setErrorMessage('Please paste the full job description (minimum 50 characters).');
            setAnalysisState('error');
            return;
        }

        setAnalysisState('loading');
        setErrorMessage('');

        try {
            // Clean the job description before sending to avoid JSON parsing issues
            const cleanedDescription = jobDescription
                .trim()
                .replace(/\n/g, ' ')  // Replace newlines with spaces
                .replace(/\r/g, ' ')  // Replace carriage returns with spaces
                .replace(/\s+/g, ' '); // Replace multiple spaces with single space

            const response = await fetch(`${API_BASE}/api/cv/job/analyze-llm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ job_description: cleanedDescription })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Analysis failed');
            }

            const data: JobAnalysisResult = await response.json();
            setResult(data);
            setAnalysisState('success');
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : 'Analysis failed. Is the backend running?');
            setAnalysisState('error');
        }
    };

    // Reset everything so user can analyse a new job
    const handleReset = () => {
        setJobDescription('');
        setResult(null);
        setAnalysisState('idle');
        setErrorMessage('');
    };

    // Return the right Tailwind colour classes based on the badge type and value
    const getBadgeColor = (value: string | null, type: 'employment' | 'work_model' | 'experience') => {
        if (!value || value === 'unknown') return 'bg-slate-100 text-slate-500';
        if (type === 'work_model') {
            if (value.toLowerCase().includes('remote')) return 'bg-green-100 text-green-700';
            if (value.toLowerCase().includes('hybrid')) return 'bg-blue-100 text-blue-700';
            return 'bg-orange-100 text-orange-700'; // On-site
        }
        if (type === 'experience') {
            if (value.toLowerCase().includes('junior')) return 'bg-cyan-100 text-cyan-700';
            if (value.toLowerCase().includes('senior') || value.toLowerCase().includes('lead')) return 'bg-purple-100 text-purple-700';
            return 'bg-slate-100 text-slate-600'; // Mid-level or unknown
        }
        return 'bg-slate-100 text-slate-600';
    };

    return (
        <div className="min-h-screen bg-white font-sans">
            <Header />

            <main className="pt-32 pb-20">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Back to landing page */}
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium mb-8 transition-colors group"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Home
                    </button>

                    {/* Page heading */}
                    <div className="mb-10">
                        <h1 className="text-4xl font-extrabold text-slate-900 mb-3">
                            Job <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-violet-600">Analysis</span>
                        </h1>
                        <p className="text-slate-500 text-lg">
                            Paste a job description and our AI will break it down — what they're really looking for, the tech stack, work model, and more.
                        </p>
                    </div>

                    {/* Input form — only shown before results */}
                    {analysisState !== 'success' && (
                        <div className="space-y-4">

                            {/* Job description textarea */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Job Description <span className="text-red-400">*</span>
                                </label>
                                <textarea
                                    value={jobDescription}
                                    onChange={(e) => setJobDescription(e.target.value)}
                                    placeholder="Paste the full job description here..."
                                    rows={12}
                                    className="w-full border border-slate-200 rounded-2xl px-5 py-4 text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 resize-none transition-all text-sm leading-relaxed"
                                />
                                {/* Character count with hint if description is too short */}
                                <p className="text-xs text-slate-400 mt-1.5 text-right">
                                    {jobDescription.length} characters
                                    {jobDescription.length > 0 && jobDescription.length < 200 &&
                                        <span className="text-amber-500"> — paste the full description for best results</span>
                                    }
                                </p>
                            </div>

                            {/* Error message shown if API call fails or input is invalid */}
                            {analysisState === 'error' && (
                                <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
                                    <XCircle size={20} className="text-red-500 flex-shrink-0" />
                                    <p className="text-red-700 text-sm font-medium">{errorMessage}</p>
                                </div>
                            )}

                            {/* Submit button — disabled until 50+ characters entered */}
                            <button
                                onClick={handleAnalyse}
                                disabled={analysisState === 'loading' || jobDescription.length < 50}
                                className="w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-md hover:shadow-lg
                                    bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700
                                    text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                            >
                                {analysisState === 'loading' ? (
                                    <>
                                        <Loader2 size={22} className="animate-spin" />
                                        Analysing...
                                    </>
                                ) : (
                                    <>
                                        <Search size={22} />
                                        Analyse Job
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Results section — shown after successful analysis */}
                    {analysisState === 'success' && result && (
                        <div className="space-y-5">

                            {/* Header card with job title, company, and meta badges */}
                            <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-3xl p-6 text-white">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h2 className="text-2xl font-extrabold">
                                            {result.job_title || 'Role Analysis'}
                                        </h2>
                                        {/* Company name if the LLM extracted it */}
                                        {result.company && (
                                            <p className="text-purple-200 mt-0.5">{result.company}</p>
                                        )}
                                    </div>
                                    {/* Quick reset link in top right of header card */}
                                    <button onClick={handleReset} className="text-purple-200 hover:text-white transition-colors text-sm underline">
                                        Analyse another
                                    </button>
                                </div>

                                {/* Meta badges — only shown if LLM extracted a value */}
                                <div className="flex flex-wrap gap-2">
                                    {result.employment_type && result.employment_type !== 'unknown' && (
                                        <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                            <Clock size={12} /> {result.employment_type}
                                        </span>
                                    )}
                                    {result.work_model && result.work_model !== 'unknown' && (
                                        <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                            <Monitor size={12} /> {result.work_model}
                                        </span>
                                    )}
                                    {result.experience_level && result.experience_level !== 'unknown' && (
                                        <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                            <Star size={12} /> {result.experience_level}
                                        </span>
                                    )}
                                    {/* Salary only shown if explicitly mentioned in the job description */}
                                    {result.salary && (
                                        <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                            <DollarSign size={12} /> {result.salary}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* TL;DR — plain English summary of what the employer actually wants */}
                            {result.tldr && (
                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                                    <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                                        <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full">TL;DR</span>
                                        What they're really looking for
                                    </h3>
                                    <p className="text-slate-600 text-sm leading-relaxed">{result.tldr}</p>
                                </div>
                            )}

                            {/* Must-have requirements extracted by the LLM */}
                            {result.key_requirements.length > 0 && (
                                <JobCard
                                    icon={<CheckCircle2 size={18} className="text-green-600" />}
                                    title="Must-Have Requirements"
                                    color="green"
                                >
                                    <ul className="space-y-2">
                                        {result.key_requirements.map((req, i) => (
                                            <li key={i} className="flex items-start gap-2 text-slate-600 text-sm">
                                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                                                {req}
                                            </li>
                                        ))}
                                    </ul>
                                </JobCard>
                            )}

                            {/* Technologies and tools mentioned in the job description */}
                            {result.tech_stack.length > 0 && (
                                <JobCard
                                    icon={<Monitor size={18} className="text-purple-600" />}
                                    title="Tech Stack"
                                    color="purple"
                                >
                                    <div className="flex flex-wrap gap-2">
                                        {result.tech_stack.map((tech, i) => (
                                            <span key={i} className="bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                                                {tech}
                                            </span>
                                        ))}
                                    </div>
                                </JobCard>
                            )}

                            {/* Preferred skills — not required but good to have */}
                            {result.nice_to_have.length > 0 && (
                                <JobCard
                                    icon={<Plus size={18} className="text-blue-500" />}
                                    title="Nice to Have"
                                    color="blue"
                                >
                                    <ul className="space-y-2">
                                        {result.nice_to_have.map((item, i) => (
                                            <li key={i} className="flex items-start gap-2 text-slate-600 text-sm">
                                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-300 flex-shrink-0" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </JobCard>
                            )}

                            {/* Soft skills mentioned in the job description */}
                            {result.soft_skills.length > 0 && (
                                <JobCard
                                    icon={<Users size={18} className="text-cyan-600" />}
                                    title="Soft Skills"
                                    color="cyan"
                                >
                                    <div className="flex flex-wrap gap-2">
                                        {result.soft_skills.map((skill, i) => (
                                            <span key={i} className="bg-cyan-100 text-cyan-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </JobCard>
                            )}

                            {/* Bottom reset link */}
                            <div className="flex justify-center pt-2">
                                <button onClick={handleReset} className="text-slate-500 hover:text-slate-700 font-medium underline transition-colors text-sm">
                                    Analyse a different job
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

// Reusable card component for each results section
// Accepts a colour prop to keep the visual style consistent across sections
const JobCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    color: 'green' | 'purple' | 'blue' | 'cyan';
    children: React.ReactNode;
}> = ({ icon, title, color, children }) => {
    // Map colour names to the correct Tailwind border and icon background classes
    const styles = {
        green: { border: 'border-green-100', iconBg: 'bg-green-50' },
        purple: { border: 'border-purple-100', iconBg: 'bg-purple-50' },
        blue: { border: 'border-blue-100', iconBg: 'bg-blue-50' },
        cyan: { border: 'border-cyan-100', iconBg: 'bg-cyan-50' },
    }[color];

    return (
        <div className={`bg-white border ${styles.border} rounded-2xl p-5 shadow-sm`}>
            <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-lg ${styles.iconBg} flex items-center justify-center`}>
                    {icon}
                </div>
                <h3 className="font-semibold text-slate-800">{title}</h3>
            </div>
            {children}
        </div>
    );
};