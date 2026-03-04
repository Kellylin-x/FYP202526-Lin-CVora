import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Upload, FileText, CheckCircle2, AlertTriangle,
    ArrowLeft, Loader2, X, User, Briefcase, GraduationCap,
    Code2, ChevronDown, ChevronUp, Target, Lightbulb
} from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

const API_BASE = 'http://localhost:8000';

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

interface JobAnalysisResult {
    extracted_keywords: { all: string[] };
    match_score: number | null;
    matched_keywords: string[] | null;
    missing_keywords: string[] | null;
    recommendations: string[];
    ats_compatible: boolean | null;
    ats_issues: string[] | null;
}

type UploadState = 'idle' | 'dragging' | 'uploading' | 'success' | 'error';

export const UploadCV: React.FC = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadState, setUploadState] = useState<UploadState>('idle');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
    const [jobDescription, setJobDescription] = useState('');
    const [showJobInput, setShowJobInput] = useState(false);
    const [jobAnalysis, setJobAnalysis] = useState<JobAnalysisResult | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>('');

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

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setUploadState('idle');
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setUploadState('dragging');
    };

    const handleDragLeave = () => setUploadState('idle');

    const handleUpload = async () => {
        if (!selectedFile) return;

        setUploadState('uploading');
        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            // Step 1: Upload and parse CV
            const response = await fetch(`${API_BASE}/api/cv/upload`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Upload failed');
            }

            const data: UploadResponse = await response.json();
            setUploadResult(data);

            // Step 2: If job description provided, run job analysis too
            if (showJobInput && jobDescription.trim().length >= 50) {
                // Extract raw text from parsed CV for comparison
                const cvText = data.raw_text || '';
                
                const analysisResponse = await fetch(`${API_BASE}/api/cv/job/analyze`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        job_description: jobDescription.trim(),
                        cv_text: cvText
                    })
                });

                if (analysisResponse.ok) {
                    const analysisData: JobAnalysisResult = await analysisResponse.json();
                    setJobAnalysis(analysisData);
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
        setJobAnalysis(null);
        setJobDescription('');
        setUploadState('idle');
        setErrorMessage('');
    };

    const getScoreBg = (score: number) => {
        if (score >= 70) return 'from-green-400 to-emerald-500';
        if (score >= 40) return 'from-amber-400 to-orange-500';
        return 'from-red-400 to-rose-500';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 70) return 'Strong Match';
        if (score >= 40) return 'Partial Match';
        return 'Weak Match — consider tailoring your CV';
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
                            Enhance Your <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-cyan-600">Existing CV</span>
                        </h1>
                        <p className="text-slate-500 text-lg">
                            Upload your CV and optionally add a job description to see how well you match the role.
                        </p>
                    </div>

                    {/* Upload + Input Section */}
                    {uploadState !== 'success' && (
                        <div className="space-y-6">

                            {/* Upload Area */}
                            <div
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onClick={() => !selectedFile && uploadState !== 'error' && fileInputRef.current?.click()}
                                className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 
                                    ${uploadState === 'dragging'
                                        ? 'border-cyan-400 bg-cyan-50 scale-[1.01]'
                                        : uploadState === 'error'
                                            ? 'border-red-300 bg-red-50'
                                            : selectedFile
                                                ? 'border-cyan-300 bg-cyan-50/50'
                                                : 'border-slate-200 bg-slate-50 hover:border-cyan-300 hover:bg-cyan-50/30 cursor-pointer'
                                    }`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,.docx"
                                    className="hidden"
                                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                                />

                                {uploadState === 'uploading' ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <Loader2 size={48} className="text-cyan-500 animate-spin" />
                                        <p className="text-slate-600 font-medium text-lg">Analysing your CV...</p>
                                        <p className="text-slate-400 text-sm">This may take a few seconds</p>
                                    </div>
                                ) : uploadState === 'error' ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                                            <X size={32} className="text-red-500" />
                                        </div>
                                        <p className="text-red-600 font-semibold text-lg">{errorMessage}</p>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleReset(); }}
                                            className="text-slate-500 hover:text-slate-700 underline text-sm"
                                        >
                                            Try again
                                        </button>
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
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleReset(); }}
                                            className="text-slate-400 hover:text-slate-600 text-sm underline"
                                        >
                                            Remove file
                                        </button>
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

                            {/* Job Description Toggle */}
                            {selectedFile && (
                                <div>
                                    <button
                                        onClick={() => setShowJobInput(!showJobInput)}
                                        className="flex items-center gap-2 text-cyan-600 hover:text-cyan-700 font-medium text-sm transition-colors"
                                    >
                                        {showJobInput ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        {showJobInput ? 'Hide job description' : '+ Add job description to get a match score'}
                                    </button>

                                    {showJobInput && (
                                        <div className="mt-3">
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Job Description <span className="text-slate-400 font-normal">(paste full job description for best results)</span>
                                            </label>
                                            <textarea
                                                value={jobDescription}
                                                onChange={(e) => setJobDescription(e.target.value)}
                                                placeholder="Paste the job description here to see how well your CV matches..."
                                                rows={8}
                                                className="w-full border border-slate-200 rounded-2xl px-5 py-4 text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:border-cyan-400 resize-none transition-all text-sm leading-relaxed"
                                            />
                                            <p className="text-xs text-slate-400 mt-1 text-right">
                                                {jobDescription.length} characters
                                                {jobDescription.length > 0 && jobDescription.length < 200 &&
                                                    <span className="text-amber-500"> (add more detail for accurate matching)</span>
                                        }
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Analyse Button */}
                            {selectedFile && (
                                <button
                                    onClick={handleUpload}
                                    className="w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-md hover:shadow-lg
                                        bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-500 hover:to-cyan-600
                                        text-white flex items-center justify-center gap-3"
                                >
                                    <FileText size={22} />
                                    Analyse CV
                                </button>
                            )}
                        </div>
                    )}

                    {/* Results */}
                    {uploadState === 'success' && uploadResult && (
                        <div className="space-y-6">

                            {/* Success Banner */}
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

                            {/* Match Score — only if job description was provided */}
                            {jobAnalysis && jobAnalysis.match_score !== null && (
                                <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-lg text-center">
                                    <p className="text-slate-500 text-sm font-medium uppercase tracking-wide mb-4">
                                        CV Match Score
                                    </p>
                                    <div className={`text-7xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r ${getScoreBg(jobAnalysis.match_score)} mb-2`}>
                                        {jobAnalysis.match_score.toFixed(0)}%
                                    </div>
                                    <p className="text-slate-500 text-base mb-5">{getScoreLabel(jobAnalysis.match_score)}</p>
                                    <div className="w-full bg-slate-100 rounded-full h-3 max-w-sm mx-auto mb-5">
                                        <div
                                            className={`h-3 rounded-full bg-gradient-to-r ${getScoreBg(jobAnalysis.match_score)} transition-all duration-700`}
                                            style={{ width: `${jobAnalysis.match_score}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-center gap-8 text-sm text-slate-500">
                                        <span><strong className="text-slate-700">{jobAnalysis.matched_keywords?.length ?? 0}</strong> matched</span>
                                        <span><strong className="text-slate-700">{jobAnalysis.missing_keywords?.length ?? 0}</strong> missing</span>
                                    </div>
                                </div>
                            )}

                            {/* Missing Keywords */}
                            {jobAnalysis?.missing_keywords && jobAnalysis.missing_keywords.length > 0 && (
                                <ResultCard icon={<Target size={20} className="text-amber-500" />} title="Missing Keywords" color="amber">
                                    <p className="text-slate-500 text-sm mb-3">Consider adding these to your CV if you have experience with them:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {jobAnalysis.missing_keywords.map((kw, i) => (
                                            <span key={i} className="bg-amber-100 text-amber-700 text-xs font-medium px-3 py-1.5 rounded-full">{kw}</span>
                                        ))}
                                    </div>
                                </ResultCard>
                            )}

                            {/* Recommendations */}
                            {jobAnalysis?.recommendations && jobAnalysis.recommendations.length > 0 && (
                                <ResultCard icon={<Lightbulb size={20} className="text-cyan-600" />} title="Recommendations" color="cyan">
                                    <ul className="space-y-3">
                                        {jobAnalysis.recommendations.map((rec, i) => (
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

                            {/* Personal Info */}
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
                                <ResultCard icon={<Code2 size={20} className="text-purple-600" />} title="Detected Skills" color="purple">
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
                                <ResultCard icon={<GraduationCap size={20} className="text-purple-600" />} title="Education Detected" color="purple">
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

                            {/* Upload Another */}
                            <div className="flex justify-center pt-4">
                                <button onClick={handleReset} className="text-slate-500 hover:text-slate-700 font-medium underline transition-colors">
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

const ResultCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    color: 'cyan' | 'purple' | 'amber';
    children: React.ReactNode;
}> = ({ icon, title, color, children }) => {
    const styles = {
        cyan: { border: 'border-cyan-100', iconBg: 'bg-cyan-50' },
        purple: { border: 'border-purple-100', iconBg: 'bg-purple-50' },
        amber: { border: 'border-amber-100', iconBg: 'bg-amber-50' },
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