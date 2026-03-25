/**
 * UploadCV.tsx
 *
 * Enhance Existing CV page.
 * Allows users to upload a PDF or DOCX CV and optionally paste a job description.
 *
 * When a job description is provided, two LLM calls are made in parallel:
 *   1. POST /api/cv/job/analyze-llm — structured job breakdown (TL;DR, requirements, tech stack)
 *   2. POST /api/cv/compare        — Gemini-powered CV vs job comparison (match score, gaps, strengths)
 *
 * Results are displayed in a rich structured layout matching the Job Analysis page style.
 */

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Upload, FileText, CheckCircle2, AlertTriangle,
    ArrowLeft, Loader2, X, User, Briefcase, GraduationCap,
    Code2, ChevronDown, ChevronUp, Lightbulb,
    Monitor, Users, Plus, Star, Clock, DollarSign, TrendingUp, AlertCircle
} from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

const API_BASE = 'http://localhost:8000';
const ANALYSIS_TIMEOUT_MS = 30000;

// ── Types ──────────────────────────────────────────────────────────────────

interface PersonalInfo {
    full_name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
}

interface ParsedCV {
    personal_info: PersonalInfo;
    professional_summary?: string;
    skills?: { technical: string[]; soft: string[] };
    experience?: Array<{ job_title?: string; company?: string; responsibilities?: string[] }>;
    education?: Array<{ degree?: string; institution?: string }>;
}

interface UploadResponse {
    success: boolean;
    parsed_data: ParsedCV;
    warnings: string[];
    raw_text?: string;
}

/** LLM-powered job description analysis — mirrors JobAnalysis page structure */
interface LLMJobAnalysis {
    job_title: string | null;
    company: string | null;
    tldr: string | null;
    employment_type: string | null;
    work_model: string | null;
    salary: string | null;
    experience_level: string | null;
    key_requirements: string[];
    nice_to_have: string[];
    tech_stack: string[];
    soft_skills: string[];
    error?: string;
}

/** Gemini-powered CV vs job comparison */
interface CVComparison {
    match_score: number;
    match_summary: string;
    strengths: string[];
    gaps: string[];
    recommendations: string[];
    ats_verdict: string;
    error?: string;
}

type UploadState = 'idle' | 'dragging' | 'uploading' | 'success' | 'error';

// ── Helpers ────────────────────────────────────────────────────────────────

const getScoreGradient = (score: number) => {
    if (score >= 70) return 'from-green-400 to-emerald-500';
    if (score >= 40) return 'from-amber-400 to-orange-500';
    return 'from-red-400 to-rose-500';
};

const getScoreLabel = (score: number) => {
    if (score >= 70) return 'Strong Match';
    if (score >= 40) return 'Partial Match';
    return 'Weak Match — consider tailoring your CV';
};

const getATSColor = (verdict: string) => {
    if (verdict?.toLowerCase().includes('likely to pass')) return 'text-green-700 bg-green-50 border-green-200';
    if (verdict?.toLowerCase().includes('may struggle'))   return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-red-700 bg-red-50 border-red-200';
};

const fetchWithTimeout = (input: RequestInfo | URL, init: RequestInit, timeoutMs: number) => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    return fetch(input, { ...init, signal: controller.signal }).finally(() => {
        window.clearTimeout(timeoutId);
    });
};

// ── Reusable card ──────────────────────────────────────────────────────────

const ResultCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    color: 'cyan' | 'purple' | 'amber' | 'green' | 'red' | 'blue';
    children: React.ReactNode;
}> = ({ icon, title, color, children }) => {
    const styles = {
        cyan:   { border: 'border-cyan-100',   iconBg: 'bg-cyan-50'   },
        purple: { border: 'border-purple-100', iconBg: 'bg-purple-50' },
        amber:  { border: 'border-amber-100',  iconBg: 'bg-amber-50'  },
        green:  { border: 'border-green-100',  iconBg: 'bg-green-50'  },
        red:    { border: 'border-red-100',    iconBg: 'bg-red-50'    },
        blue:   { border: 'border-blue-100',   iconBg: 'bg-blue-50'   },
    }[color];

    return (
        <div className={`bg-white border ${styles.border} rounded-2xl p-6 shadow-sm`}>
            <div className="flex items-center gap-3 mb-4">
                <div className={`w-8 h-8 rounded-lg ${styles.iconBg} flex items-center justify-center`}>{icon}</div>
                <h3 className="font-semibold text-slate-800">{title}</h3>
            </div>
            {children}
        </div>
    );
};

// ── Main component ─────────────────────────────────────────────────────────

export const UploadCV: React.FC = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [uploadState, setUploadState]       = useState<UploadState>('idle');
    const [selectedFile, setSelectedFile]     = useState<File | null>(null);
    const [uploadResult, setUploadResult]     = useState<UploadResponse | null>(null);
    const [jobDescription, setJobDescription] = useState('');
    const [showJobInput, setShowJobInput]     = useState(false);
    const [llmJobAnalysis, setLlmJobAnalysis] = useState<LLMJobAnalysis | null>(null);
    const [cvComparison, setCvComparison]     = useState<CVComparison | null>(null);
    const [errorMessage, setErrorMessage]     = useState('');

    const validTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    // ── File handling ──────────────────────────────────────────────────

    const handleFileSelect = (file: File) => {
        if (!validTypes.includes(file.type)) {
            setErrorMessage('Please upload a PDF or DOCX file only.');
            setUploadState('error');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setErrorMessage('File size must be under 10MB.');
            setUploadState('error');
            return;
        }
        setSelectedFile(file);
        setUploadState('idle');
        setErrorMessage('');
    };

    const handleDrop      = (e: React.DragEvent) => { e.preventDefault(); setUploadState('idle'); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f); };
    const handleDragOver  = (e: React.DragEvent) => { e.preventDefault(); setUploadState('dragging'); };
    const handleDragLeave = () => setUploadState('idle');

    // ── Upload + analysis ──────────────────────────────────────────────

    const handleUpload = async () => {
        if (!selectedFile) return;
        setUploadState('uploading');

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            // Step 1: Upload and parse CV
            const uploadRes = await fetch(`${API_BASE}/api/cv/upload`, { method: 'POST', body: formData });
            if (!uploadRes.ok) { const err = await uploadRes.json(); throw new Error(err.detail || 'Upload failed'); }
            const uploadData: UploadResponse = await uploadRes.json();
            setUploadResult(uploadData);

            // Step 2: If job description provided, run LLM analysis and comparison in parallel
            if (showJobInput && jobDescription.trim().length >= 50) {
                const cleanedJD = jobDescription.trim().replace(/\n/g, ' ').replace(/\r/g, ' ').replace(/\s+/g, ' ');
                const cvText = uploadData.raw_text || '';

                const [jobRes, compareRes] = await Promise.allSettled([
                    fetchWithTimeout(`${API_BASE}/api/cv/job/analyze-llm`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ job_description: cleanedJD })
                    }, ANALYSIS_TIMEOUT_MS),
                    fetchWithTimeout(`${API_BASE}/api/cv/compare`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ cv_text: cvText, job_description: cleanedJD })
                    }, ANALYSIS_TIMEOUT_MS)
                ]);

                if (jobRes.status === 'fulfilled' && jobRes.value.ok) {
                    setLlmJobAnalysis(await jobRes.value.json());
                }

                if (compareRes.status === 'fulfilled' && compareRes.value.ok) {
                    setCvComparison(await compareRes.value.json());
                }
            }

            setUploadState('success');
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : 'Upload failed. Is the backend running?');
            setUploadState('error');
        }
    };

    const handleReset = () => {
        setSelectedFile(null);
        setUploadResult(null);
        setLlmJobAnalysis(null);
        setCvComparison(null);
        setJobDescription('');
        setUploadState('idle');
        setErrorMessage('');
    };

    // ── Render ─────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-white font-sans">
            <Header />

            <main className="pt-32 pb-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Back button */}
                    <button onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium mb-8 transition-colors group">
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Home
                    </button>

                    {/* Page heading */}
                    <div className="mb-10">
                        <h1 className="text-4xl font-extrabold text-slate-900 mb-3">
                            Enhance Your{' '}
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-cyan-600">Existing CV</span>
                        </h1>
                        <p className="text-slate-500 text-lg">
                            Upload your CV and optionally add a job description for an AI-powered match analysis.
                        </p>
                    </div>

                    {/* ── Upload + input form ── */}
                    {uploadState !== 'success' && (
                        <div className="space-y-6">

                            {/* Drop zone */}
                            <div
                                onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
                                onClick={() => !selectedFile && uploadState !== 'error' && fileInputRef.current?.click()}
                                className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300
                                    ${uploadState === 'dragging'   ? 'border-cyan-400 bg-cyan-50 scale-[1.01]'
                                    : uploadState === 'error'      ? 'border-red-300 bg-red-50'
                                    : selectedFile                 ? 'border-cyan-300 bg-cyan-50/50'
                                    : 'border-slate-200 bg-slate-50 hover:border-cyan-300 hover:bg-cyan-50/30 cursor-pointer'}`}
                            >
                                <input ref={fileInputRef} type="file" accept=".pdf,.docx" className="hidden"
                                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />

                                {uploadState === 'uploading' ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <Loader2 size={48} className="text-cyan-500 animate-spin" />
                                        <p className="text-slate-600 font-medium text-lg">Analysing your CV...</p>
                                        <p className="text-slate-400 text-sm">Running AI analysis — this may take a few seconds</p>
                                    </div>
                                ) : uploadState === 'error' ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                                            <X size={32} className="text-red-500" />
                                        </div>
                                        <p className="text-red-600 font-semibold text-lg">{errorMessage}</p>
                                        <button onClick={(e) => { e.stopPropagation(); handleReset(); }}
                                            className="text-slate-500 hover:text-slate-700 underline text-sm">Try again</button>
                                    </div>
                                ) : selectedFile ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-cyan-100 flex items-center justify-center">
                                            <FileText size={32} className="text-cyan-600" />
                                        </div>
                                        <div>
                                            <p className="text-slate-800 font-semibold text-lg">{selectedFile.name}</p>
                                            <p className="text-slate-400 text-sm mt-1">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); handleReset(); }}
                                            className="text-slate-400 hover:text-slate-600 text-sm underline">Remove file</button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-cyan-100 flex items-center justify-center">
                                            <Upload size={32} className="text-cyan-600" />
                                        </div>
                                        <div>
                                            <p className="text-slate-700 font-semibold text-lg">
                                                Drop your CV here or <span className="text-cyan-600">browse files</span>
                                            </p>
                                            <p className="text-slate-400 text-sm mt-2">PDF or DOCX · Max 10MB</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Job description toggle */}
                            {selectedFile && (
                                <div>
                                    <button onClick={() => setShowJobInput(!showJobInput)}
                                        className="flex items-center gap-2 text-cyan-600 hover:text-cyan-700 font-medium text-sm transition-colors">
                                        {showJobInput ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        {showJobInput ? 'Hide job description' : '+ Add job description for AI match analysis'}
                                    </button>

                                    {showJobInput && (
                                        <div className="mt-3">
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Job Description{' '}
                                                <span className="text-slate-400 font-normal">(paste full description for best results)</span>
                                            </label>
                                            <textarea
                                                value={jobDescription}
                                                onChange={(e) => setJobDescription(e.target.value)}
                                                placeholder="Paste the job description here..."
                                                rows={8}
                                                className="w-full border border-slate-200 rounded-2xl px-5 py-4 text-slate-700 placeholder-slate-300
                                                    focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:border-cyan-400 resize-none transition-all text-sm leading-relaxed"
                                            />
                                            <p className="text-xs text-slate-400 mt-1 text-right">
                                                {jobDescription.length} characters
                                                {jobDescription.length > 0 && jobDescription.length < 200 &&
                                                    <span className="text-amber-500"> — add more for accurate analysis</span>}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Analyse button */}
                            {selectedFile && (
                                <button onClick={handleUpload}
                                    className="w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-md hover:shadow-lg
                                        bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-500 hover:to-cyan-600
                                        text-white flex items-center justify-center gap-3">
                                    <FileText size={22} />
                                    Analyse CV
                                </button>
                            )}
                        </div>
                    )}

                    {/* ── Results ── */}
                    {uploadState === 'success' && uploadResult && (
                        <div className="space-y-6">

                            {/* Success banner */}
                            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-6 py-4">
                                <CheckCircle2 size={24} className="text-green-500 flex-shrink-0" />
                                <div>
                                    <p className="text-green-800 font-semibold">CV analysed successfully</p>
                                    <p className="text-green-600 text-sm">{selectedFile?.name}</p>
                                </div>
                                <button onClick={handleReset} className="ml-auto text-slate-400 hover:text-slate-600 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* ── CV vs Job comparison (LLM) ── */}
                            {cvComparison && (
                                <>
                                    {/* Match score header */}
                                    <div className={`bg-gradient-to-br ${getScoreGradient(cvComparison.match_score)} rounded-3xl p-8 text-white`}>
                                        <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
                                            <div>
                                                <p className="text-white/70 text-sm font-medium uppercase tracking-wide mb-1">AI Match Score</p>
                                                <p className="text-6xl font-extrabold">{cvComparison.match_score}%</p>
                                                <p className="text-white/80 mt-1">{getScoreLabel(cvComparison.match_score)}</p>
                                            </div>
                                            {/* ATS verdict */}
                                            <div className={`text-xs font-bold px-4 py-2 rounded-full border ${getATSColor(cvComparison.ats_verdict)} self-start`}>
                                                {cvComparison.ats_verdict}
                                            </div>
                                        </div>
                                        {cvComparison.match_summary && (
                                            <p className="text-white/90 text-sm leading-relaxed border-t border-white/20 pt-4">
                                                {cvComparison.match_summary}
                                            </p>
                                        )}
                                    </div>

                                    {/* Strengths */}
                                    {cvComparison.strengths.length > 0 && (
                                        <ResultCard icon={<TrendingUp size={20} className="text-green-600" />} title="Your Strengths for This Role" color="green">
                                            <ul className="space-y-2">
                                                {cvComparison.strengths.map((s, i) => (
                                                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                                                        <CheckCircle2 size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                                                        {s}
                                                    </li>
                                                ))}
                                            </ul>
                                        </ResultCard>
                                    )}

                                    {/* Gaps */}
                                    {cvComparison.gaps.length > 0 && (
                                        <ResultCard icon={<AlertCircle size={20} className="text-amber-500" />} title="Gaps to Address" color="amber">
                                            <ul className="space-y-2">
                                                {cvComparison.gaps.map((g, i) => (
                                                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                                                        {g}
                                                    </li>
                                                ))}
                                            </ul>
                                        </ResultCard>
                                    )}

                                    {/* Recommendations */}
                                    {cvComparison.recommendations.length > 0 && (
                                        <ResultCard icon={<Lightbulb size={20} className="text-cyan-600" />} title="Recommendations" color="cyan">
                                            <ul className="space-y-3">
                                                {cvComparison.recommendations.map((rec, i) => (
                                                    <li key={i} className="flex items-start gap-3 text-slate-600 text-sm">
                                                        <span className="mt-0.5 w-5 h-5 rounded-full bg-cyan-100 text-cyan-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                                                            {i + 1}
                                                        </span>
                                                        {rec}
                                                    </li>
                                                ))}
                                            </ul>
                                        </ResultCard>
                                    )}
                                </>
                            )}

                            {/* ── LLM job breakdown ── */}
                            {llmJobAnalysis && (
                                <>
                                    {/* Job header */}
                                    <div className="bg-gradient-to-br from-[#663399] to-[#4d2673] rounded-3xl p-6 text-white">
                                        <h2 className="text-2xl font-extrabold mb-0.5">
                                            {llmJobAnalysis.job_title || 'Role Analysis'}
                                        </h2>
                                        {llmJobAnalysis.company && (
                                            <p className="text-purple-200 mb-3">{llmJobAnalysis.company}</p>
                                        )}
                                        <div className="flex flex-wrap gap-2">
                                            {llmJobAnalysis.employment_type && llmJobAnalysis.employment_type !== 'unknown' && (
                                                <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                                    <Clock size={12} /> {llmJobAnalysis.employment_type}
                                                </span>
                                            )}
                                            {llmJobAnalysis.work_model && llmJobAnalysis.work_model !== 'unknown' && (
                                                <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                                    <Monitor size={12} /> {llmJobAnalysis.work_model}
                                                </span>
                                            )}
                                            {llmJobAnalysis.experience_level && llmJobAnalysis.experience_level !== 'unknown' && (
                                                <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                                    <Star size={12} /> {llmJobAnalysis.experience_level}
                                                </span>
                                            )}
                                            {llmJobAnalysis.salary && (
                                                <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                                    <DollarSign size={12} /> {llmJobAnalysis.salary}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* TL;DR */}
                                    {llmJobAnalysis.tldr && (
                                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                                            <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                                                <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full">TL;DR</span>
                                                What they're really looking for
                                            </h3>
                                            <p className="text-slate-600 text-sm leading-relaxed">{llmJobAnalysis.tldr}</p>
                                        </div>
                                    )}

                                    {/* Must-haves */}
                                    {llmJobAnalysis.key_requirements.length > 0 && (
                                        <ResultCard icon={<CheckCircle2 size={18} className="text-green-600" />} title="Must-Have Requirements" color="green">
                                            <ul className="space-y-2">
                                                {llmJobAnalysis.key_requirements.map((req, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-slate-600 text-sm">
                                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                                                        {req}
                                                    </li>
                                                ))}
                                            </ul>
                                        </ResultCard>
                                    )}

                                    {/* Tech stack */}
                                    {llmJobAnalysis.tech_stack.length > 0 && (
                                        <ResultCard icon={<Monitor size={18} className="text-[#663399]" />} title="Tech Stack" color="purple">
                                            <div className="flex flex-wrap gap-2">
                                                {llmJobAnalysis.tech_stack.map((tech, i) => (
                                                    <span key={i} className="bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                                                        {tech}
                                                    </span>
                                                ))}
                                            </div>
                                        </ResultCard>
                                    )}

                                    {/* Nice to have */}
                                    {llmJobAnalysis.nice_to_have.length > 0 && (
                                        <ResultCard icon={<Plus size={18} className="text-blue-500" />} title="Nice to Have" color="blue">
                                            <ul className="space-y-2">
                                                {llmJobAnalysis.nice_to_have.map((item, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-slate-600 text-sm">
                                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-300 flex-shrink-0" />
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </ResultCard>
                                    )}

                                    {/* Soft skills */}
                                    {llmJobAnalysis.soft_skills.length > 0 && (
                                        <ResultCard icon={<Users size={18} className="text-cyan-600" />} title="Soft Skills" color="cyan">
                                            <div className="flex flex-wrap gap-2">
                                                {llmJobAnalysis.soft_skills.map((skill, i) => (
                                                    <span key={i} className="bg-cyan-100 text-cyan-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </ResultCard>
                                    )}
                                </>
                            )}

                            {/* ── Parsed CV sections ── */}

                            {/* Warnings */}
                            {uploadResult.warnings.length > 0 && (
                                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <AlertTriangle size={20} className="text-amber-500" />
                                        <h3 className="font-semibold text-amber-800">Parser Suggestions</h3>
                                    </div>
                                    <ul className="space-y-2">
                                        {uploadResult.warnings.map((w, i) => (
                                            <li key={i} className="text-amber-700 text-sm flex items-start gap-2">
                                                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                                                {w}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Personal info */}
                            {uploadResult.parsed_data.personal_info && (
                                <ResultCard icon={<User size={20} className="text-cyan-600" />} title="Personal Information" color="cyan">
                                    <div className="grid grid-cols-2 gap-3">
                                        {Object.entries(uploadResult.parsed_data.personal_info)
                                            .filter(([, v]) => v)
                                            .map(([key, value]) => (
                                                <div key={key}>
                                                    <p className="text-xs text-slate-400 uppercase tracking-wide">{key.replace('_', ' ')}</p>
                                                    <p className="text-slate-700 font-medium text-sm mt-0.5">{value}</p>
                                                </div>
                                            ))}
                                    </div>
                                </ResultCard>
                            )}

                            {/* Skills */}
                            {uploadResult.parsed_data.skills && (
                                <ResultCard icon={<Code2 size={20} className="text-[#4d2673]" />} title="Detected Skills" color="purple">
                                    {uploadResult.parsed_data.skills.technical.length > 0 && (
                                        <div className="mb-4">
                                            <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Technical</p>
                                            <div className="flex flex-wrap gap-2">
                                                {uploadResult.parsed_data.skills.technical.map((skill, i) => (
                                                    <span key={i} className="bg-purple-100 text-purple-700 text-xs font-medium px-3 py-1 rounded-full">{skill}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {uploadResult.parsed_data.skills.soft.length > 0 && (
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Soft Skills</p>
                                            <div className="flex flex-wrap gap-2">
                                                {uploadResult.parsed_data.skills.soft.map((skill, i) => (
                                                    <span key={i} className="bg-slate-100 text-slate-600 text-xs font-medium px-3 py-1 rounded-full">{skill}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </ResultCard>
                            )}

                            {/* Experience */}
                            {uploadResult.parsed_data.experience && uploadResult.parsed_data.experience.length > 0 && (
                                <ResultCard icon={<Briefcase size={20} className="text-cyan-600" />} title="Experience Detected" color="cyan">
                                    <div className="space-y-3">
                                        {uploadResult.parsed_data.experience.map((exp, i) => (
                                            <div key={i} className="border-l-2 border-cyan-200 pl-4">
                                                <p className="font-semibold text-slate-800">{exp.job_title || 'Role detected'}</p>
                                                {exp.company && <p className="text-slate-500 text-sm">{exp.company}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </ResultCard>
                            )}

                            {/* Education */}
                            {uploadResult.parsed_data.education && uploadResult.parsed_data.education.length > 0 && (
                                <ResultCard icon={<GraduationCap size={20} className="text-[#4d2673]" />} title="Education Detected" color="purple">
                                    <div className="space-y-3">
                                        {uploadResult.parsed_data.education.map((edu, i) => (
                                            <div key={i} className="border-l-2 border-purple-200 pl-4">
                                                <p className="font-semibold text-slate-800">{edu.degree || 'Qualification detected'}</p>
                                                {edu.institution && <p className="text-slate-500 text-sm">{edu.institution}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </ResultCard>
                            )}

                            {/* Upload another */}
                            <div className="flex justify-center pt-4">
                                <button onClick={handleReset}
                                    className="text-slate-500 hover:text-slate-700 font-medium underline transition-colors">
                                    Upload a different CV
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