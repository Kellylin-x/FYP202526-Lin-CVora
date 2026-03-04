import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Search, Loader2, CheckCircle2,
    AlertTriangle, XCircle, ChevronDown, ChevronUp,
    Target, Lightbulb, Tag, BarChart3
} from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

const API_BASE = 'http://localhost:8000';

interface AnalysisResult {
    extracted_keywords: {
        all: string[];
        technical_skills?: string[];
        methodologies?: string[];
        soft_skills?: string[];
    };
    match_score: number | null;
    matched_keywords: string[] | null;
    missing_keywords: string[] | null;
    recommendations: string[];
    job_keyword_count: number;
    cv_keyword_count: number | null;
    ats_compatible: boolean | null;
    ats_issues: string[] | null;
}

type AnalysisState = 'idle' | 'loading' | 'success' | 'error';

export const JobAnalysis: React.FC = () => {
    const navigate = useNavigate();
    const [jobDescription, setJobDescription] = useState('');
    const [cvText, setCvText] = useState('');
    const [showCvInput, setShowCvInput] = useState(false);
    const [analysisState, setAnalysisState] = useState<AnalysisState>('idle');
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [showAllKeywords, setShowAllKeywords] = useState(false);

    const handleAnalyse = async () => {
        if (jobDescription.trim().length < 50) {
            setErrorMessage('Job description must be at least 50 characters.');
            setAnalysisState('error');
            return;
        }

        setAnalysisState('loading');
        setErrorMessage('');

        try {
            const body: { job_description: string; cv_text?: string } = {
                job_description: jobDescription.trim()
            };
            if (showCvInput && cvText.trim()) {
                body.cv_text = cvText.trim();
            }

            const response = await fetch(`${API_BASE}/api/cv/job/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Analysis failed');
            }

            const data: AnalysisResult = await response.json();
            setResult(data);
            setAnalysisState('success');
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : 'Analysis failed. Is the backend running?');
            setAnalysisState('error');
        }
    };

    const handleReset = () => {
        setJobDescription('');
        setCvText('');
        setResult(null);
        setAnalysisState('idle');
        setErrorMessage('');
        setShowAllKeywords(false);
    };

    const getScoreColor = (score: number) => {
        if (score >= 70) return 'text-green-600';
        if (score >= 40) return 'text-amber-500';
        return 'text-red-500';
    };

    const getScoreBg = (score: number) => {
        if (score >= 70) return 'from-green-400 to-emerald-500';
        if (score >= 40) return 'from-amber-400 to-orange-500';
        return 'from-red-400 to-rose-500';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 70) return 'Strong Match';
        if (score >= 40) return 'Partial Match';
        return 'Weak Match';
    };

    return (
        <div className="min-h-screen bg-white font-sans">
            <Header />

            <main className="pt-32 pb-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Back Button */}
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium mb-8 transition-colors group"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Home
                    </button>

                    {/* Page Title */}
                    <div className="mb-10">
                        <h1 className="text-4xl font-extrabold text-slate-900 mb-3">
                            Job <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-violet-600">Analysis</span>
                        </h1>
                        <p className="text-slate-500 text-lg">
                            Paste a job description to extract key STEM skills and check how well your CV matches.
                        </p>
                    </div>

                    {/* Input Section */}
                    {analysisState !== 'success' && (
                        <div className="space-y-5">

                            {/* Job Description Input */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Job Description <span className="text-red-400">*</span>
                                </label>
                                <textarea
                                    value={jobDescription}
                                    onChange={(e) => setJobDescription(e.target.value)}
                                    placeholder="Paste the full job description here..."
                                    rows={10}
                                    className="w-full border border-slate-200 rounded-2xl px-5 py-4 text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 resize-none transition-all text-sm leading-relaxed"
                                />
                                <p className="text-xs text-slate-400 mt-1.5 text-right">
                                    {jobDescription.length} characters {jobDescription.length < 50 && jobDescription.length > 0 && <span className="text-red-400">(min 50)</span>}
                                </p>
                            </div>

                            {/* CV Text Toggle */}
                            <div>
                                <button
                                    onClick={() => setShowCvInput(!showCvInput)}
                                    className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium text-sm transition-colors"
                                >
                                    {showCvInput ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    {showCvInput ? 'Hide CV text' : '+ Add your CV text to get a match score'}
                                </button>

                                {showCvInput && (
                                    <div className="mt-3">
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Your CV Text <span className="text-slate-400 font-normal">(optional)</span>
                                        </label>
                                        <textarea
                                            value={cvText}
                                            onChange={(e) => setCvText(e.target.value)}
                                            placeholder="Paste your CV text here to see how well it matches the job..."
                                            rows={8}
                                            className="w-full border border-slate-200 rounded-2xl px-5 py-4 text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 resize-none transition-all text-sm leading-relaxed"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Error */}
                            {analysisState === 'error' && (
                                <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
                                    <XCircle size={20} className="text-red-500 flex-shrink-0" />
                                    <p className="text-red-700 text-sm font-medium">{errorMessage}</p>
                                </div>
                            )}

                            {/* Analyse Button */}
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

                    {/* Results */}
                    {analysisState === 'success' && result && (
                        <div className="space-y-6">

                            {/* Match Score — only if CV text was provided */}
                            {result.match_score !== null && (
                                <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-lg text-center">
                                    <p className="text-slate-500 text-sm font-medium uppercase tracking-wide mb-4">
                                        CV Match Score
                                    </p>
                                    <div className={`text-7xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r ${getScoreBg(result.match_score)} mb-2`}>
                                        {result.match_score.toFixed(0)}%
                                    </div>
                                    <p className={`text-lg font-semibold ${getScoreColor(result.match_score)} mb-4`}>
                                        {getScoreLabel(result.match_score)}
                                    </p>

                                    {/* Score Bar */}
                                    <div className="w-full bg-slate-100 rounded-full h-3 max-w-sm mx-auto">
                                        <div
                                            className={`h-3 rounded-full bg-gradient-to-r ${getScoreBg(result.match_score)} transition-all duration-700`}
                                            style={{ width: `${result.match_score}%` }}
                                        />
                                    </div>

                                    <div className="flex justify-center gap-8 mt-5 text-sm text-slate-500">
                                        <span><strong className="text-slate-700">{result.matched_keywords?.length ?? 0}</strong> keywords matched</span>
                                        <span><strong className="text-slate-700">{result.missing_keywords?.length ?? 0}</strong> keywords missing</span>
                                    </div>
                                </div>
                            )}

                            {/* Matched Keywords */}
                            {result.matched_keywords && result.matched_keywords.length > 0 && (
                                <AnalysisCard
                                    icon={<CheckCircle2 size={20} className="text-green-600" />}
                                    title="Matched Keywords"
                                    color="green"
                                >
                                    <div className="flex flex-wrap gap-2">
                                        {result.matched_keywords.map((kw, i) => (
                                            <span key={i} className="bg-green-100 text-green-700 text-xs font-medium px-3 py-1.5 rounded-full">
                                                {kw}
                                            </span>
                                        ))}
                                    </div>
                                </AnalysisCard>
                            )}

                            {/* Missing Keywords */}
                            {result.missing_keywords && result.missing_keywords.length > 0 && (
                                <AnalysisCard
                                    icon={<AlertTriangle size={20} className="text-amber-500" />}
                                    title="Missing Keywords"
                                    color="amber"
                                >
                                    <p className="text-slate-500 text-sm mb-3">
                                        Consider adding these to your CV if you have experience with them:
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {result.missing_keywords.map((kw, i) => (
                                            <span key={i} className="bg-amber-100 text-amber-700 text-xs font-medium px-3 py-1.5 rounded-full">
                                                {kw}
                                            </span>
                                        ))}
                                    </div>
                                </AnalysisCard>
                            )}

                            {/* Extracted Keywords — job only mode */}
                            {result.match_score === null && result.extracted_keywords.all.length > 0 && (
                                <AnalysisCard
                                    icon={<Tag size={20} className="text-purple-600" />}
                                    title={`Extracted Keywords (${result.extracted_keywords.all.length} found)`}
                                    color="purple"
                                >
                                    <div className="flex flex-wrap gap-2">
                                        {(showAllKeywords
                                            ? result.extracted_keywords.all
                                            : result.extracted_keywords.all.slice(0, 20)
                                        ).map((kw, i) => (
                                            <span key={i} className="bg-purple-100 text-purple-700 text-xs font-medium px-3 py-1.5 rounded-full">
                                                {kw}
                                            </span>
                                        ))}
                                    </div>
                                    {result.extracted_keywords.all.length > 20 && (
                                        <button
                                            onClick={() => setShowAllKeywords(!showAllKeywords)}
                                            className="mt-3 text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1"
                                        >
                                            {showAllKeywords ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                            {showAllKeywords ? 'Show less' : `Show ${result.extracted_keywords.all.length - 20} more`}
                                        </button>
                                    )}
                                </AnalysisCard>
                            )}

                            {/* ATS Issues */}
                            {result.ats_issues && result.ats_issues.length > 0 && (
                                <AnalysisCard
                                    icon={<XCircle size={20} className="text-red-500" />}
                                    title="ATS Compatibility Issues"
                                    color="red"
                                >
                                    <ul className="space-y-2">
                                        {result.ats_issues.map((issue, i) => (
                                            <li key={i} className="text-red-700 text-sm flex items-start gap-2">
                                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                                                {issue}
                                            </li>
                                        ))}
                                    </ul>
                                </AnalysisCard>
                            )}

                            {/* Recommendations */}
                            {result.recommendations.length > 0 && (
                                <AnalysisCard
                                    icon={<Lightbulb size={20} className="text-purple-600" />}
                                    title="Recommendations"
                                    color="purple"
                                >
                                    <ul className="space-y-3">
                                        {result.recommendations.map((rec, i) => (
                                            <li key={i} className="flex items-start gap-3 text-slate-600 text-sm">
                                                <span className="mt-0.5 w-5 h-5 rounded-full bg-purple-100 text-purple-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                                                    {i + 1}
                                                </span>
                                                {rec}
                                            </li>
                                        ))}
                                    </ul>
                                </AnalysisCard>
                            )}

                            {/* Analyse Another */}
                            <div className="flex justify-center pt-4">
                                <button
                                    onClick={handleReset}
                                    className="text-slate-500 hover:text-slate-700 font-medium underline transition-colors"
                                >
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

// Reusable analysis result card
const AnalysisCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    color: 'green' | 'amber' | 'purple' | 'red';
    children: React.ReactNode;
}> = ({ icon, title, color, children }) => {
    const styles = {
        green: { border: 'border-green-100', iconBg: 'bg-green-50' },
        amber: { border: 'border-amber-100', iconBg: 'bg-amber-50' },
        purple: { border: 'border-purple-100', iconBg: 'bg-purple-50' },
        red: { border: 'border-red-100', iconBg: 'bg-red-50' },
    }[color];

    return (
        <div className={`bg-white border ${styles.border} rounded-2xl p-6 shadow-sm`}>
            <div className="flex items-center gap-3 mb-4">
                <div className={`w-8 h-8 rounded-lg ${styles.iconBg} flex items-center justify-center`}>
                    {icon}
                </div>
                <h3 className="font-semibold text-slate-800">{title}</h3>
            </div>
            {children}
        </div>
    );
};