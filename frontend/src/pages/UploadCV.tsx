
// UploadCV.tsx — Enhance Existing CV page.
// User uploads a CV, pastes a job description, and gets back a match score,
// gap checklist, strengths, recommendations, and a job breakdown.
// Two LLM calls run in parallel (job analysis + CV compare) with keyword fallback if Gemini is unavailable.

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Upload, FileText, CheckCircle2, AlertTriangle,
    ArrowLeft, Loader2, X,
    Lightbulb,
    Monitor, Users, Plus, Star, Clock, DollarSign,
    TrendingUp, AlertCircle, Bot, Send, Eye, Square, CheckSquare, Download
} from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import html2pdf from 'html2pdf.js';

const API_BASE = 'http://localhost:8000';
const ANALYSIS_TIMEOUT_MS = 30000;
const UPLOAD_TIMEOUT_MS = 60000;

// ── Types ──────────────────────────────────────────────────────────────────

interface PersonalInfo {
    full_name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
}

interface DynamicSection {
    title: string;
    content: string;
}

interface ParsedCV {
    personal_info: PersonalInfo;
    professional_summary?: string;
    skills?: { technical: string[]; soft: string[] };
    experience?: Array<{ job_title?: string; company?: string; responsibilities?: string[] }>;
    education?: Array<{ degree?: string; institution?: string }>;
    projects?: Array<{ title?: string; description?: string; technologies?: string[] }>;
    certifications?: string[];
    dynamic_sections?: DynamicSection[];
}

interface UploadResponse {
    success: boolean;
    parsed_data: ParsedCV;
    warnings: string[];
    raw_text?: string;
}

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

interface CVComparison {
    match_score: number;
    match_summary: string;
    strengths: string[];
    gaps: string[];
    recommendations: string[];
    ats_verdict: string;
    error?: string;
}

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface SuggestedAddition {
    type: 'bullet' | 'skill' | 'summary';
    job_title?: string;
    value: string;
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

const buildComparisonCvText = (parsed: ParsedCV, rawText?: string) => {
    const chunks: string[] = [];

    const name = parsed.personal_info?.full_name?.trim();
    if (name) chunks.push(`Name: ${name}`);

    const summary = parsed.professional_summary?.trim();
    if (summary) chunks.push(`Professional Summary:\n${summary}`);

    const technical = parsed.skills?.technical?.filter(Boolean) ?? [];
    const soft = parsed.skills?.soft?.filter(Boolean) ?? [];
    if (technical.length > 0) chunks.push(`Technical Skills: ${technical.join(', ')}`);
    if (soft.length > 0) chunks.push(`Soft Skills: ${soft.join(', ')}`);

    if (parsed.experience && parsed.experience.length > 0) {
        const expBlock = parsed.experience
            .map((exp) => {
                const heading = [exp.job_title, exp.company].filter(Boolean).join(' at ').trim();
                const bullets = (exp.responsibilities ?? []).filter(Boolean).map((r) => `- ${r}`).join('\n');
                return [heading ? `Role: ${heading}` : '', bullets].filter(Boolean).join('\n');
            })
            .filter(Boolean)
            .join('\n\n');

        if (expBlock) chunks.push(`Experience:\n${expBlock}`);
    }

    if (parsed.education && parsed.education.length > 0) {
        const eduBlock = parsed.education
            .map((edu) => [edu.degree, edu.institution].filter(Boolean).join(' — '))
            .filter(Boolean)
            .join('\n');

        if (eduBlock) chunks.push(`Education:\n${eduBlock}`);
    }

    if (parsed.projects && parsed.projects.length > 0) {
        const projBlock = parsed.projects
            .map((p) => {
                const heading = p.title ? `Project: ${p.title}` : 'Project';
                const desc = p.description?.trim() ?? '';
                const tech = p.technologies && p.technologies.length > 0
                    ? `Technologies: ${p.technologies.join(', ')}`
                    : '';
                return [heading, desc, tech].filter(Boolean).join('\n');
            })
            .filter(Boolean)
            .join('\n\n');

        if (projBlock) chunks.push(`Projects:\n${projBlock}`);
    }

    const structured = chunks.join('\n\n').trim();
    const cleanedRaw = (rawText ?? '').trim();

    if (!structured) return cleanedRaw;
    if (!cleanedRaw) return structured;

    // Keep both sources: parsed structure recovers missed PDF spans, raw text preserves context.
    return `${structured}\n\nRaw CV Text:\n${cleanedRaw}`;
};

const fetchWithTimeout = (input: RequestInfo | URL, init: RequestInit, timeoutMs: number) => {
    const controller = new AbortController();
    const id = window.setTimeout(() => controller.abort(), timeoutMs);
    return fetch(input, { ...init, signal: controller.signal }).finally(() => window.clearTimeout(id));
};

const readErrorMessage = async (res: Response, fallback: string) => {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        try {
            const payload = await res.json();
            if (typeof payload?.detail === 'string' && payload.detail.trim()) return payload.detail;
            if (typeof payload?.error === 'string' && payload.error.trim()) return payload.error;
        } catch {
            // Ignore JSON parsing issues and use fallback message.
        }
    }
    return fallback;
};

const toStringArray = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return value
            .map((item) => (typeof item === 'string' ? item.trim() : String(item ?? '').trim()))
            .filter(Boolean);
    }

    if (typeof value === 'string') {
        return value
            .split(/\r?\n|;|\u2022|•/) 
            .map((item) => item.replace(/^[-*\d.)\s]+/, '').trim())
            .filter(Boolean);
    }

    return [];
};

const normalizeComparison = (raw: any): CVComparison => ({
    match_score: Number(raw?.match_score ?? 0),
    match_summary: String(raw?.match_summary ?? ''),
    strengths: toStringArray(raw?.strengths ?? raw?.matched_keywords),
    gaps: toStringArray(raw?.gaps ?? raw?.missing_keywords),
    recommendations: toStringArray(raw?.recommendations),
    ats_verdict: String(raw?.ats_verdict ?? ''),
    error: typeof raw?.error === 'string' ? raw.error : undefined,
});

// ── Reusable result card ───────────────────────────────────────────────────

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

// ── Gap Checklist ──────────────────────────────────────────────────────────

const GapChecklist: React.FC<{
    gaps: string[];
    addressedGaps: Set<number>;
}> = ({ gaps, addressedGaps }) => {
    const addressed = addressedGaps.size;
    const total = gaps.length;

    return (
        <div className="bg-white border border-amber-200 rounded-2xl p-6 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                        <AlertCircle size={18} className="text-amber-500" />
                    </div>
                    <h3 className="font-semibold text-slate-800">CV Gaps to Address</h3>
                </div>
                {/* Progress pill */}
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    addressed === total && total > 0
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                }`}>
                    {addressed}/{total} addressed
                </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 mb-5">
                <div
                    className="h-2 rounded-full bg-gradient-to-r from-amber-400 to-green-400 transition-all duration-500"
                    style={{ width: total > 0 ? `${(addressed / total) * 100}%` : '0%' }}
                />
            </div>

            {/* Gap items */}
            <ul className="space-y-3">
                {gaps.map((gap, i) => {
                    const done = addressedGaps.has(i);
                    return (
                        <li key={i} className={`flex items-start gap-3 rounded-xl p-3 transition-all duration-300 ${
                            done ? 'bg-green-50 border border-green-100' : 'bg-amber-50 border border-amber-100'
                        }`}>
                            {done
                                ? <CheckSquare size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                                : <Square size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
                            }
                            <span className={`text-sm leading-relaxed ${
                                done ? 'text-green-700 line-through' : 'text-slate-700'
                            }`}>
                                {gap}
                            </span>
                        </li>
                    );
                })}
            </ul>

            {addressed === total && total > 0 && (
                <div className="mt-4 pt-4 border-t border-green-100 text-center">
                    <p className="text-green-600 font-semibold text-sm">
                        ✓ All gaps addressed — great work!
                    </p>
                </div>
            )}
        </div>
    );
};

// ── Live CV Preview ────────────────────────────────────────────────────────

const PreviewSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 border-b border-slate-100 pb-1">
            {title}
        </h2>
        {children}
    </div>
);

const CVPreview: React.FC<{ cv: ParsedCV; appliedCount: number }> = ({ cv, appliedCount }) => {
    const p = cv.personal_info || {};
    const cvRef = useRef<HTMLDivElement>(null);

     const handleExportPDF = () => {
        const element = cvRef.current;
        if (!element) return;
        const options = {
            margin: 10,
            filename: `${p.full_name || 'my-cv'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        };
        (html2pdf as any)().set(options).from(element).save();
    };
    const hasContent =
        p.full_name ||
        cv.professional_summary ||
        (cv.experience?.length ?? 0) > 0 ||
        (cv.dynamic_sections?.length ?? 0) > 0;
 
    if (!hasContent) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
                <Eye size={32} className="opacity-40" />
                <p className="text-sm">CV preview will appear here</p>
            </div>
        );
    }
 
    return (
        <div>
            <button
                onClick={handleExportPDF}
                className="w-full mb-3 flex items-center justify-center gap-2 py-2 px-4 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium rounded-xl transition-colors"
            >
                <Download size={14} />
                Export as PDF
            </button>
            <div
                ref={cvRef}
                className="bg-white p-6 text-sm"
                style={{ fontFamily: 'Georgia, serif' }}
        >
            {/* ── Name + Contact ── */}
            {p.full_name && (
                <div className="text-center border-b border-slate-200 pb-4 mb-4">
                    <h1 className="text-xl font-bold text-slate-900">{p.full_name}</h1>
                    <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2 text-xs text-slate-500">
                        {p.email    && <span>{p.email}</span>}
                        {p.phone    && <span>{p.phone}</span>}
                        {p.location && <span>{p.location}</span>}
                        {p.linkedin && <span>{p.linkedin}</span>}
                        {p.github   && <span>{p.github}</span>}
                    </div>
                </div>
            )}
 
            {/* ── Professional Summary ── */}
            {cv.professional_summary && (
                <PreviewSection title="Professional Summary">
                    <p className="text-slate-700 leading-relaxed text-xs">{cv.professional_summary}</p>
                </PreviewSection>
            )}
 
            {/* ── Experience ── */}
            {cv.experience && cv.experience.length > 0 && (
                <PreviewSection title="Experience">
                    {cv.experience.map((exp, i) => (
                        <div key={i} className="mb-3 last:mb-0">
                            <div className="flex justify-between items-baseline flex-wrap gap-1">
                                <span className="font-semibold text-slate-800 text-xs">{exp.job_title}</span>
                                {exp.company && (
                                    <span className="text-slate-500 text-xs">{exp.company}</span>
                                )}
                            </div>
                            {exp.responsibilities && exp.responsibilities.length > 0 && (
                                <ul className="mt-1 space-y-0.5">
                                    {exp.responsibilities.map((r, j) => (
                                        <li key={j} className="text-slate-600 text-xs flex items-start gap-1.5">
                                            <span className="mt-1 w-1 h-1 rounded-full bg-slate-400 flex-shrink-0" />
                                            {r}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </PreviewSection>
            )}
 
            {/* ── Education ── */}
            {cv.education && cv.education.length > 0 && (
                <PreviewSection title="Education">
                    {cv.education.map((edu, i) => (
                        <div key={i} className="mb-1 last:mb-0">
                            <span className="font-semibold text-slate-800 text-xs">{edu.degree}</span>
                            {edu.institution && (
                                <span className="text-slate-500 text-xs"> — {edu.institution}</span>
                            )}
                        </div>
                    ))}
                </PreviewSection>
            )}
 
            {/* ── Skills ── */}
            {cv.skills && (cv.skills.technical.length > 0 || cv.skills.soft.length > 0) && (
                <PreviewSection title="Skills">
                    {cv.skills.technical.length > 0 && (
                        <p className="text-slate-700 text-xs mb-1">
                            <span className="font-semibold">Technical: </span>
                            {cv.skills.technical.join(', ')}
                        </p>
                    )}
                    {cv.skills.soft.length > 0 && (
                        <p className="text-slate-700 text-xs">
                            <span className="font-semibold">Soft Skills: </span>
                            {cv.skills.soft.join(', ')}
                        </p>
                    )}
                </PreviewSection>
            )}
 
            {/* ── Projects ── */}
            {cv.projects && cv.projects.length > 0 && (
                <PreviewSection title="Projects">
                    {cv.projects.map((proj, i) => (
                        <div key={i} className="mb-2 last:mb-0">
                            {proj.title && (
                                <span className="font-semibold text-slate-800 text-xs">{proj.title}</span>
                            )}
                            {proj.description && (
                                <p className="text-slate-600 text-xs mt-0.5">{proj.description}</p>
                            )}
                            {proj.technologies && proj.technologies.length > 0 && (
                                <p className="text-slate-400 text-xs mt-0.5">
                                    {proj.technologies.join(', ')}
                                </p>
                            )}
                        </div>
                    ))}
                </PreviewSection>
            )}
 
            {/* ── Certifications ── */}
            {cv.certifications && cv.certifications.length > 0 && (
                <PreviewSection title="Certifications">
                    <ul className="space-y-0.5">
                        {cv.certifications.map((cert, i) => (
                            <li key={i} className="text-slate-700 text-xs flex items-start gap-1.5">
                                <span className="mt-1 w-1 h-1 rounded-full bg-slate-400 flex-shrink-0" />
                                {cert}
                            </li>
                        ))}
                    </ul>
                </PreviewSection>
            )}
 
            {/* ── Dynamic / Custom Sections ── */}
            {/* These are sections the parser found that don't fit known categories —
                e.g. "Awards", "Volunteering", "Publications", "Interests".
                We render them exactly as extracted so nothing gets lost. */}
            {cv.dynamic_sections && cv.dynamic_sections.map((section, i) => (
                <PreviewSection key={`dynamic-${i}`} title={section.title}>
                    {section.content.split('\n').map((line, j) => {
                        const cleaned = line.replace(/^[•\-\*\>◦▪]+\s*/, '').trim();
                        if (!cleaned) return null;
                        return (
                            <p key={j} className="text-slate-600 text-xs mb-0.5 flex items-start gap-1.5">
                                <span className="mt-1 w-1 h-1 rounded-full bg-slate-400 flex-shrink-0" />
                                {cleaned}
                            </p>
                        );
                    })}
                </PreviewSection>
            ))}
 
            {/* Enhancement counter */}
            {appliedCount > 0 && (
                <div className="mt-4 pt-3 border-t border-green-100 text-center">
                    <span className="text-xs text-green-600 font-semibold">
                        ✓ {appliedCount} enhancement{appliedCount > 1 ? 's' : ''} applied
                    </span>
                </div>
            )}
            </div>
        </div>
    );
};

// ── Tabbed right panel: CV Preview + Chat ─────────────────────────────────

const TabbedRightPanel: React.FC<{
    enhancedCV: ParsedCV | null;
    appliedCount: number;
    parsedCV: ParsedCV;
    gaps: string[];
    jobDescription: string;
    onApply: (addition: SuggestedAddition, gapIndex: number) => void;
}> = ({ enhancedCV, appliedCount, parsedCV, gaps, jobDescription, onApply }) => {
    const [activeTab, setActiveTab] = useState<'preview' | 'chat'>('chat');

    return (
        <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Tab bar */}
            <div className="flex border-b border-slate-100 flex-shrink-0">
                <button
                    onClick={() => setActiveTab('chat')}
                    className={`flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2
                        ${activeTab === 'chat'
                            ? 'text-[#663399] border-b-2 border-[#663399] bg-purple-50/50'
                            : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <Bot size={15} /> AI Chat
                </button>
                <button
                    onClick={() => setActiveTab('preview')}
                    className={`flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2
                        ${activeTab === 'preview'
                            ? 'text-cyan-600 border-b-2 border-cyan-500 bg-cyan-50/50'
                            : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <Eye size={15} /> CV Preview
                </button>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'chat' ? (
                    <EnhancementChatPanel
                        parsedCV={parsedCV}
                        gaps={gaps}
                        jobDescription={jobDescription}
                        onApply={onApply}
                    />
                ) : (
                    <div className="h-full overflow-y-auto p-4">
                        {enhancedCV
                            ? <CVPreview cv={enhancedCV} appliedCount={appliedCount} />
                            : <p className="text-slate-400 text-sm text-center pt-10">No CV loaded yet.</p>
                        }
                    </div>
                )}
            </div>
        </div>
    );
};

// ── Enhancement Chat Panel ─────────────────────────────────────────────────

const EnhancementChatPanel: React.FC<{
    parsedCV: ParsedCV;
    gaps: string[];
    jobDescription: string;
    onApply: (addition: SuggestedAddition, gapIndex: number) => void;
}> = ({ parsedCV, gaps, jobDescription, onApply }) => {
    const [messages, setMessages]               = useState<ChatMessage[]>([]);
    const [input, setInput]                     = useState('');
    const [loading, setLoading]                 = useState(false);
    const [pendingAddition, setPendingAddition] = useState<SuggestedAddition | null>(null);
    const [pendingGapIndex, setPendingGapIndex] = useState<number>(-1);
    const [appliedMsgIds, setAppliedMsgIds]     = useState<Set<number>>(new Set());
    const messagesEndRef                        = useRef<HTMLDivElement>(null);
    const hasOpened                             = useRef(false);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    useEffect(() => {
        if (hasOpened.current) return;
        hasOpened.current = true;
        sendMessage('__opener__');
    }, []);

    const sendMessage = async (userMsg: string) => {
        const isOpener = userMsg === '__opener__';
        const messageToSend = isOpener
            ? `Hello! I've just uploaded my CV. Please start by asking me about the most important gap.`
            : userMsg;

        if (!isOpener) {
            setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        }

        setLoading(true);
        setPendingAddition(null);

        try {
            const history = isOpener ? [] : messages;

            const res = await fetchWithTimeout(`${API_BASE}/api/cv/enhance-chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: messageToSend,
                    history,
                    parsed_cv: parsedCV,
                    gaps,
                    job_description: jobDescription
                })
            }, ANALYSIS_TIMEOUT_MS);

            if (!res.ok) throw new Error('Chat request failed');
            const data = await res.json();

            setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);

            if (data.suggested_addition) {
                setPendingAddition(data.suggested_addition);
                // Don't auto-match gaps — wait for explicit user action to avoid false positives.
                // User will see the suggestion card and decide which gap it addresses (if any).
                setPendingGapIndex(data.gap_index ?? -1);
            }
        } catch {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "Sorry, I couldn't connect right now. Please try again."
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = () => {
        if (!input.trim() || loading) return;
        const msg = input.trim();
        setInput('');
        sendMessage(msg);
    };

    const handleApply = (addition: SuggestedAddition, msgIndex: number) => {
        onApply(addition, pendingGapIndex);
        setAppliedMsgIds(prev => new Set(prev).add(msgIndex));
        setPendingAddition(null);
        sendMessage("I've applied that. What's the next gap I should address?");
    };

    const handleDismiss = (msgIndex: number) => {
        setAppliedMsgIds(prev => new Set(prev).add(msgIndex));
        setPendingAddition(null);
        sendMessage("Skip that one. What's the next gap?");
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

            {/* Header */}
            <div className="bg-gradient-to-r from-[#663399] to-[#4d2673] px-5 py-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <Bot size={18} className="text-white" />
                </div>
                <div>
                    <p className="text-white font-semibold text-sm">CV Enhancement Assistant</p>
                    <p className="text-purple-200 text-xs">Working through your gaps one by one</p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                {messages.length === 0 && loading && (
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Loader2 size={14} className="animate-spin" />
                        Analysing your CV gaps...
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={i}>
                        <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed
                                ${msg.role === 'user'
                                    ? 'bg-gradient-to-br from-[#663399] to-[#4d2673] text-white rounded-br-sm'
                                    : 'bg-slate-100 text-slate-700 rounded-bl-sm'
                                }`}>
                                {msg.content}
                            </div>
                        </div>

                        {/* Suggested addition card */}
                        {msg.role === 'assistant' && i === messages.length - 1 && pendingAddition && !appliedMsgIds.has(i) && (
                            <div className="mt-2 ml-2 bg-purple-50 border border-purple-200 rounded-xl p-3">
                                <p className="text-xs font-semibold text-purple-700 mb-1 uppercase tracking-wide">
                                    {pendingAddition.type === 'bullet'  && '✦ Suggested Bullet Point'}
                                    {pendingAddition.type === 'skill'   && '✦ Suggested Skill'}
                                    {pendingAddition.type === 'summary' && '✦ Suggested Summary'}
                                </p>
                                {pendingAddition.job_title && (
                                    <p className="text-xs text-purple-500 mb-1">For: {pendingAddition.job_title}</p>
                                )}
                                <p className="text-slate-700 text-xs leading-relaxed mb-3 bg-white rounded-lg p-2 border border-purple-100">
                                    {pendingAddition.value}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleApply(pendingAddition, i)}
                                        className="flex-1 py-1.5 bg-[#663399] hover:bg-[#4d2673] text-white text-xs font-bold rounded-lg transition-colors">
                                        Apply to CV
                                    </button>
                                    <button
                                        onClick={() => handleDismiss(i)}
                                        className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-lg transition-colors">
                                        Skip
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {loading && messages.length > 0 && (
                    <div className="flex justify-start">
                        <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                            {[0, 1, 2].map(i => (
                                <span key={i} className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                                      style={{ animationDelay: `${i * 150}ms` }} />
                            ))}
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-slate-100 p-3 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder="Type your answer..."
                    disabled={loading}
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700
                        placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-[#663399]/30
                        focus:border-[#663399] disabled:opacity-50"
                />
                <button
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                    className="w-9 h-9 rounded-xl bg-[#663399] hover:bg-[#4d2673] text-white flex items-center
                        justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    <Send size={14} />
                </button>
            </div>
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
    const [llmJobAnalysis, setLlmJobAnalysis] = useState<LLMJobAnalysis | null>(null);
    const [cvComparison, setCvComparison]     = useState<CVComparison | null>(null);
    const [errorMessage, setErrorMessage]     = useState('');
    const [analysisNotice, setAnalysisNotice] = useState('');
    const [enhancedCV, setEnhancedCV]         = useState<ParsedCV | null>(null);
    const [appliedCount, setAppliedCount]     = useState(0);
    // Tracks which gap indices have been addressed via the chat
    const [addressedGaps, setAddressedGaps]   = useState<Set<number>>(new Set());
    const showJobInput = true;

    const validTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

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

    // Called when user clicks Apply in the chat panel
    const handleApplyAddition = (addition: SuggestedAddition, gapIndex: number) => {
        if (!enhancedCV) return;

        const updated = JSON.parse(JSON.stringify(enhancedCV)) as ParsedCV;

        // Deep copy so we don't mutate the original parsed CV state
        if (addition.type === 'bullet') {
            // Find the best matching experience entry for this bullet
            // First try exact job_title match
            let target = updated.experience?.find(
                exp => exp.job_title?.toLowerCase() === addition.job_title?.toLowerCase()
            );
            
            // If no exact match, find best keyword match (e.g., both contain "Engineer")
            if (!target && addition.job_title && updated.experience && updated.experience.length > 0) {
                const suggestedWords = addition.job_title.toLowerCase().split(/\s+/);
                let bestMatch = 0;
                let bestScore = 0;
                
                updated.experience.forEach((exp, idx) => {
                    const expTitleWords = (exp.job_title || '').toLowerCase().split(/\s+/);
                    const score = suggestedWords.filter(w => expTitleWords.some(ew => ew.includes(w) || w.includes(ew))).length;
                    if (score > bestScore) {
                        bestScore = score;
                        bestMatch = idx;
                    }
                });
                
                // Only use best match if there was at least one keyword overlap
                if (bestScore > 0) {
                    target = updated.experience[bestMatch];
                }
            }
            
            // If still no match, add to first role as fallback
            if (!target) {
                target = updated.experience?.[0];
            }
            
            if (target) {
                target.responsibilities = [...(target.responsibilities || []), addition.value];
            }
        }

        if (addition.type === 'skill') {
            if (updated.skills && !updated.skills.technical.includes(addition.value)) {
                updated.skills.technical = [...updated.skills.technical, addition.value];
            }
        }

        if (addition.type === 'summary') {
            updated.professional_summary = addition.value;
        }

        setEnhancedCV(updated);
        setAppliedCount(prev => prev + 1);

        // Tick off the gap in the checklist if we know which one it is
        if (gapIndex >= 0) {
            setAddressedGaps(prev => new Set(prev).add(gapIndex));
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;
        setUploadState('uploading');
        setAnalysisNotice('');

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const uploadRes = await fetchWithTimeout(
                `${API_BASE}/api/cv/upload`,
                { method: 'POST', body: formData },
                UPLOAD_TIMEOUT_MS
            );
            if (!uploadRes.ok) {
                const contentType = uploadRes.headers.get('content-type') || '';
                if (contentType.includes('application/json')) {
                    const err = await uploadRes.json();
                    throw new Error(err.detail || 'Upload failed');
                }
                throw new Error('Upload failed. Please try again.');
            }
            const uploadData: UploadResponse = await uploadRes.json();
            setUploadResult(uploadData);
            setEnhancedCV(uploadData.parsed_data);

            if (showJobInput && jobDescription.trim().length >= 50) {
                const cleanedJD = jobDescription.trim().replace(/\n/g, ' ').replace(/\r/g, ' ').replace(/\s+/g, ' ');
                const cvText = buildComparisonCvText(uploadData.parsed_data, uploadData.raw_text);
                const notices: string[] = [];

                // Run both LLM calls at the same time — if one fails it doesn't block the other
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
                    const jobData: LLMJobAnalysis = await jobRes.value.json();
                    setLlmJobAnalysis(jobData);
                    if (jobData.error) notices.push(jobData.error);
                } else if (jobRes.status === 'fulfilled') {
                    notices.push(await readErrorMessage(jobRes.value, 'Job analysis could not be completed.'));
                } else {
                    notices.push('Job analysis request failed. Please retry.');
                }

                if (compareRes.status === 'fulfilled' && compareRes.value.ok) {
                    const compareRaw = await compareRes.value.json();
                    const compareData: CVComparison = normalizeComparison(compareRaw);
                    setCvComparison(compareData);
                    if (compareData.error) notices.push(compareData.error);
                } else if (compareRes.status === 'fulfilled') {
                    notices.push(await readErrorMessage(compareRes.value, 'CV comparison could not be completed.'));
                } else {
                    notices.push('CV comparison request failed. Please retry.');
                }

                if (notices.length > 0) {
                    setAnalysisNotice(Array.from(new Set(notices)).join(' '));
                }
            }

            setUploadState('success');
        } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') {
                setErrorMessage('Upload timed out. Please try a smaller or text-based CV file.');
            } else {
                setErrorMessage(err instanceof Error ? err.message : 'Upload failed. Is the backend running?');
            }
            setUploadState('error');
        }
    };

    const handleReset = () => {
        setSelectedFile(null);
        setUploadResult(null);
        setLlmJobAnalysis(null);
        setCvComparison(null);
        setAnalysisNotice('');
        setEnhancedCV(null);
        setAppliedCount(0);
        setAddressedGaps(new Set());
        setJobDescription('');
        setUploadState('idle');
        setErrorMessage('');
    };

    const hasJobDesc = jobDescription.trim().length >= 50;    const hasAnalysisResults = hasJobDesc && (llmJobAnalysis !== null || cvComparison !== null);
    const isFallbackMode = Boolean(analysisNotice);

    return (
        <div className="min-h-screen bg-white font-sans">
            <Header />

            <main className="pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Back button */}
                    <div className="max-w-4xl mx-auto">
                        <button onClick={() => navigate('/')}
                            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium mb-8 transition-colors group">
                            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                            Back to Home
                        </button>
                    </div>

                    {/* Page heading */}
                    <div className="mb-10 max-w-4xl mx-auto">
                        <h1 className="text-4xl font-extrabold text-slate-900 mb-3">
                            Enhance Your{' '}
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-cyan-600">Existing CV</span>
                        </h1>
                        <p className="text-slate-500 text-lg">
                            Upload your CV and add a job description for AI-powered match analysis and enhancement.
                        </p>
                    </div>

                    {/* ── Upload form ── */}
                    {uploadState !== 'success' && (
                        <div className="max-w-4xl mx-auto space-y-6">

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
                                <div>
                                    {selectedFile && jobDescription.trim().length < 50 && (
                                        <p className="text-amber-500 text-sm text-center mb-3">
                                            Please add a job description (at least 50 characters) to analyse your CV.
                                        </p>
                                    )}
                                    <button
                                        onClick={handleUpload}
                                        disabled={jobDescription.trim().length < 50}
                                        className="w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-md hover:shadow-lg
                                            bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-500 hover:to-cyan-600
                                            text-white flex items-center justify-center gap-3
                                            disabled:opacity-40 disabled:cursor-not-allowed">
                                        <FileText size={22} />
                                        Analyse CV
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Results ── */}
                    {uploadState === 'success' && uploadResult && enhancedCV && (
                        <div className={`${hasJobDesc && cvComparison ? 'grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6' : 'max-w-4xl'}`}>
                            {/* ── Left: Results column ── */}
                            <div className="space-y-6 min-w-0">

                                {/* Success banner */}
                                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-6 py-4">
                                    <CheckCircle2 size={24} className="text-green-500 flex-shrink-0" />
                                    <div>
                                        <p className="text-green-800 font-semibold">CV analysed successfully</p>
                                        <p className="text-green-600 text-sm">{selectedFile?.name}</p>
                                    </div>
                                    {hasAnalysisResults && (
                                        <span
                                            className={`ml-auto text-xs font-bold px-3 py-1 rounded-full border ${
                                                isFallbackMode
                                                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                                                    : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                            }`}
                                        >
                                            {isFallbackMode ? 'Fallback Mode' : 'AI Mode'}
                                        </span>
                                    )}
                                    <button
                                        onClick={handleReset}
                                        className={`${hasAnalysisResults ? '' : 'ml-auto '}text-slate-400 hover:text-slate-600 transition-colors`}
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {analysisNotice && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-2xl px-6 py-4">
                                        <p className="text-amber-800 font-medium text-sm">{analysisNotice}</p>
                                    </div>
                                )}

                                {/* ── Match score ── */}
                                {cvComparison && (
                                    <>
                                        {(() => {
                                            const strengths = cvComparison.strengths ?? [];
                                            const gaps = cvComparison.gaps ?? [];
                                            const recommendations = cvComparison.recommendations ?? [];

                                            return (
                                                <>
                                        <div className={`bg-gradient-to-br ${getScoreGradient(cvComparison.match_score)} rounded-3xl p-8 text-white`}>
                                            <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
                                                <div>
                                                    <p className="text-white/70 text-sm font-medium uppercase tracking-wide mb-1">AI Match Score</p>
                                                    <p className="text-6xl font-extrabold">{cvComparison.match_score}%</p>
                                                    <p className="text-white/80 mt-1">{getScoreLabel(cvComparison.match_score)}</p>
                                                </div>
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

                                        {/* ── Gap checklist — prominent, right after match score ── */}
                                        {gaps.length > 0 ? (
                                            <GapChecklist
                                                gaps={gaps}
                                                addressedGaps={addressedGaps}
                                            />
                                        ) : (
                                            <ResultCard icon={<AlertCircle size={20} className="text-amber-600" />} title="CV Gaps to Address" color="amber">
                                                <p className="text-sm text-slate-600">
                                                    No critical gaps were flagged for this role in the latest analysis.
                                                </p>
                                            </ResultCard>
                                        )}

                                        {/* Strengths */}
                                        <ResultCard icon={<TrendingUp size={20} className="text-green-600" />} title="Your Strengths for This Role" color="green">
                                            {strengths.length > 0 ? (
                                                <ul className="space-y-2">
                                                    {strengths.map((s, i) => (
                                                        <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                                                            <CheckCircle2 size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                                                            {s}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-sm text-slate-600">
                                                    The model did not return a strengths list for this run. Your match summary still reflects overall fit.
                                                </p>
                                            )}
                                        </ResultCard>

                                        {/* Recommendations */}
                                        <ResultCard icon={<Lightbulb size={20} className="text-cyan-600" />} title="Recommendations" color="cyan">
                                            {recommendations.length > 0 ? (
                                                <ul className="space-y-3">
                                                    {recommendations.map((rec, i) => (
                                                        <li key={i} className="flex items-start gap-3 text-slate-600 text-sm">
                                                            <span className="mt-0.5 w-5 h-5 rounded-full bg-cyan-100 text-cyan-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                                                                {i + 1}
                                                            </span>
                                                            {rec}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <ul className="space-y-3">
                                                    <li className="flex items-start gap-3 text-slate-600 text-sm">
                                                        <span className="mt-0.5 w-5 h-5 rounded-full bg-cyan-100 text-cyan-600 text-xs font-bold flex items-center justify-center flex-shrink-0">1</span>
                                                        Tailor your professional summary to this specific role title and company.
                                                    </li>
                                                    <li className="flex items-start gap-3 text-slate-600 text-sm">
                                                        <span className="mt-0.5 w-5 h-5 rounded-full bg-cyan-100 text-cyan-600 text-xs font-bold flex items-center justify-center flex-shrink-0">2</span>
                                                        Add quantifiable outcomes to your strongest experience bullets.
                                                    </li>
                                                    <li className="flex items-start gap-3 text-slate-600 text-sm">
                                                        <span className="mt-0.5 w-5 h-5 rounded-full bg-cyan-100 text-cyan-600 text-xs font-bold flex items-center justify-center flex-shrink-0">3</span>
                                                        Mirror key job-description keywords where they genuinely match your experience.
                                                    </li>
                                                </ul>
                                            )}
                                        </ResultCard>
                                                </>
                                            );
                                        })()}
                                    </>
                                )}

                                {/* ── Job breakdown ── */}
                                {llmJobAnalysis && (
                                    <>
                                        <div className="bg-gradient-to-br from-[#663399] to-[#4d2673] rounded-3xl p-6 text-white">
                                            <h2 className="text-2xl font-extrabold mb-0.5">{llmJobAnalysis.job_title || 'Role Analysis'}</h2>
                                            {llmJobAnalysis.company && <p className="text-purple-200 mb-3">{llmJobAnalysis.company}</p>}
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

                                        {llmJobAnalysis.tldr && (
                                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                                                <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                                                    <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full">TL;DR</span>
                                                    What they're really looking for
                                                </h3>
                                                <p className="text-slate-600 text-sm leading-relaxed">{llmJobAnalysis.tldr}</p>
                                            </div>
                                        )}

                                        <ResultCard icon={<CheckCircle2 size={18} className="text-green-600" />} title="Must-Have Requirements" color="green">
                                            {llmJobAnalysis.key_requirements.length > 0 ? (
                                                <ul className="space-y-2">
                                                    {llmJobAnalysis.key_requirements.map((req, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-slate-600 text-sm">
                                                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                                                            {req}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-sm text-slate-600">No explicit must-have requirements were extracted in this run.</p>
                                            )}
                                        </ResultCard>

                                        <ResultCard icon={<Monitor size={18} className="text-[#663399]" />} title="Tech Stack" color="purple">
                                            {llmJobAnalysis.tech_stack.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {llmJobAnalysis.tech_stack.map((tech, i) => (
                                                        <span key={i} className="bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-1.5 rounded-full">{tech}</span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-slate-600">No specific tech stack terms were extracted in this run.</p>
                                            )}
                                        </ResultCard>

                                        <ResultCard icon={<Plus size={18} className="text-blue-500" />} title="Nice to Have" color="blue">
                                            {llmJobAnalysis.nice_to_have.length > 0 ? (
                                                <ul className="space-y-2">
                                                    {llmJobAnalysis.nice_to_have.map((item, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-slate-600 text-sm">
                                                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-300 flex-shrink-0" />
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-sm text-slate-600">No optional or bonus requirements were extracted in this run.</p>
                                            )}
                                        </ResultCard>

                                        <ResultCard icon={<Users size={18} className="text-cyan-600" />} title="Soft Skills" color="cyan">
                                            {llmJobAnalysis.soft_skills.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {llmJobAnalysis.soft_skills.map((skill, i) => (
                                                        <span key={i} className="bg-cyan-100 text-cyan-700 text-xs font-semibold px-3 py-1.5 rounded-full">{skill}</span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-slate-600">No specific soft skills were extracted in this run.</p>
                                            )}
                                        </ResultCard>
                                    </>
                                )}

                                {/* Parser warnings — kept as useful feedback */}
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

                                <div className="flex justify-center pt-4">
                                    <button onClick={handleReset}
                                        className="text-slate-500 hover:text-slate-700 font-medium underline transition-colors">
                                        Upload a different CV
                                    </button>
                                </div>
                            </div>

                            {/* ── Right: Tabbed CV Preview + Chat ── */}
                            {hasJobDesc && cvComparison && (
                                <div className="lg:sticky lg:top-24 lg:self-start" style={{ height: 'calc(100vh - 140px)' }}>
                                    <TabbedRightPanel
                                        enhancedCV={enhancedCV}
                                        appliedCount={appliedCount}
                                        parsedCV={enhancedCV!}
                                        gaps={cvComparison.gaps}
                                        jobDescription={jobDescription}
                                        onApply={handleApplyAddition}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};