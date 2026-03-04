import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Upload, FileText, CheckCircle2, AlertTriangle,
    ArrowLeft, Loader2, X, User, Briefcase, GraduationCap,
    Code2, ShieldCheck, ShieldAlert
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
    skills?: {
        technical: string[];
        soft: string[];
    };
    experience?: Array<{
        job_title?: string;
        company?: string;
        responsibilities?: string[];
    }>;
    education?: Array<{
        degree?: string;
        institution?: string;
    }>;
}

interface UploadResponse {
    success: boolean;
    parsed_data: ParsedCV;
    warnings: string[];
}

type UploadState = 'idle' | 'dragging' | 'uploading' | 'success' | 'error';

export const UploadCV: React.FC = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadState, setUploadState] = useState<UploadState>('idle');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
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

    const handleDragLeave = () => {
        setUploadState('idle');
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setUploadState('uploading');
        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
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
            setUploadState('success');
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : 'Upload failed. Is the backend running?');
            setUploadState('error');
        }
    };

    const handleReset = () => {
        setSelectedFile(null);
        setUploadResult(null);
        setUploadState('idle');
        setErrorMessage('');
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
                            Upload your CV and our AI will analyse it, check ATS compatibility, and suggest improvements.
                        </p>
                    </div>

                    {/* Upload Area */}
                    {uploadState !== 'success' && (
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onClick={() => !selectedFile && fileInputRef.current?.click()}
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
                                        <p className="text-slate-400 text-sm mt-1">
                                            {(selectedFile.size / 1024).toFixed(1)} KB
                                        </p>
                                    </div>
                                    <div className="flex gap-3 mt-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                                            className="bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-500 hover:to-cyan-600 text-white font-bold px-8 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                                        >
                                            Analyse CV
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleReset(); }}
                                            className="text-slate-500 hover:text-slate-700 font-medium px-6 py-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-all"
                                        >
                                            Remove
                                        </button>
                                    </div>
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
                    )}

                    {/* Results */}
                    {uploadState === 'success' && uploadResult && (
                        <div className="space-y-6 animate-fade-in-up">

                            {/* Success Banner */}
                            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-6 py-4">
                                <CheckCircle2 size={24} className="text-green-500 flex-shrink-0" />
                                <div>
                                    <p className="text-green-800 font-semibold">CV analysed successfully</p>
                                    <p className="text-green-600 text-sm">{selectedFile?.name}</p>
                                </div>
                                <button
                                    onClick={handleReset}
                                    className="ml-auto text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Warnings */}
                            {uploadResult.warnings.length > 0 && (
                                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <AlertTriangle size={20} className="text-amber-500" />
                                        <h3 className="font-semibold text-amber-800">Suggestions</h3>
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
                                <ResultCard
                                    icon={<User size={20} className="text-cyan-600" />}
                                    title="Personal Information"
                                    color="cyan"
                                >
                                    <div className="grid grid-cols-2 gap-3">
                                        {Object.entries(uploadResult.parsed_data.personal_info)
                                            .filter(([, v]) => v)
                                            .map(([key, value]) => (
                                                <div key={key}>
                                                    <p className="text-xs text-slate-400 uppercase tracking-wide">
                                                        {key.replace('_', ' ')}
                                                    </p>
                                                    <p className="text-slate-700 font-medium text-sm mt-0.5">{value}</p>
                                                </div>
                                            ))}
                                    </div>
                                </ResultCard>
                            )}

                            {/* Skills */}
                            {uploadResult.parsed_data.skills && (
                                <ResultCard
                                    icon={<Code2 size={20} className="text-purple-600" />}
                                    title="Detected Skills"
                                    color="purple"
                                >
                                    {uploadResult.parsed_data.skills.technical.length > 0 && (
                                        <div className="mb-4">
                                            <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Technical</p>
                                            <div className="flex flex-wrap gap-2">
                                                {uploadResult.parsed_data.skills.technical.map((skill, i) => (
                                                    <span key={i} className="bg-purple-100 text-purple-700 text-xs font-medium px-3 py-1 rounded-full">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {uploadResult.parsed_data.skills.soft.length > 0 && (
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Soft Skills</p>
                                            <div className="flex flex-wrap gap-2">
                                                {uploadResult.parsed_data.skills.soft.map((skill, i) => (
                                                    <span key={i} className="bg-slate-100 text-slate-600 text-xs font-medium px-3 py-1 rounded-full">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </ResultCard>
                            )}

                            {/* Experience */}
                            {uploadResult.parsed_data.experience && uploadResult.parsed_data.experience.length > 0 && (
                                <ResultCard
                                    icon={<Briefcase size={20} className="text-cyan-600" />}
                                    title="Experience Detected"
                                    color="cyan"
                                >
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
                                <ResultCard
                                    icon={<GraduationCap size={20} className="text-purple-600" />}
                                    title="Education Detected"
                                    color="purple"
                                >
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
                                <button
                                    onClick={handleReset}
                                    className="text-slate-500 hover:text-slate-700 font-medium underline transition-colors"
                                >
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

// Reusable result card component
const ResultCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    color: 'cyan' | 'purple';
    children: React.ReactNode;
}> = ({ icon, title, color, children }) => {
    const border = color === 'cyan' ? 'border-cyan-100' : 'border-purple-100';
    const iconBg = color === 'cyan' ? 'bg-cyan-50' : 'bg-purple-50';

    return (
        <div className={`bg-white border ${border} rounded-2xl p-6 shadow-sm`}>
            <div className="flex items-center gap-3 mb-4">
                <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
                    {icon}
                </div>
                <h3 className="font-semibold text-slate-800">{title}</h3>
            </div>
            {children}
        </div>
    );
};