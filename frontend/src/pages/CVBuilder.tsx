/**
 * CVBuilder.tsx
 *
 * Multi-step CV wizard with a context-aware AI chat assistant.
 *
 * Phase 1: Wizard shell, stepper, shared form state, Personal Info, Target Role
 * Phase 2: Experience (with AI bullet enhancement), Education, Skills, Summary
 * Phase 5: AI chat panel — fixed side panel, aware of full CV form data
 *
 * The chat panel sits alongside the wizard on wider screens and slides in
 * from the right on mobile. It sends the full CVFormData to the backend with
 * every message so the AI always has up-to-date context.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, ArrowRight, Check, Plus, Trash2, ChevronDown, ChevronUp,
    User, Briefcase, GraduationCap, Wrench, Sparkles, Loader2, FileText,
    X, MessageCircle, Send, Bot, Eye, Mail, Phone, MapPin, Linkedin, Github, Globe
} from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

const API_BASE = 'http://localhost:8010';

// ── Types ──────────────────────────────────────────────────────────────────

export interface PersonalInfo {
    full_name: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    github: string;
    website: string;
}

export interface TargetRole {
    job_title: string;
    career_focus: string;
}

export interface Experience {
    id: string;
    job_title: string;
    company: string;
    location: string;
    start_date: string;
    end_date: string;
    responsibilities: string[];
}

export interface Education {
    id: string;
    degree: string;
    institution: string;
    location: string;
    graduation_date: string;
    grade: string;
    relevant_modules: string[];
}

export interface Skills {
    technical: string[];
    soft: string[];
}

/** A single project entry — title, description, and optional link */
export interface Project {
    id: string;
    title: string;
    description: string;
    link: string;
}

export interface CVFormData {
    personal_info: PersonalInfo;
    target_role: TargetRole;
    professional_summary: string;
    experience: Experience[];
    education: Education[];
    skills: Skills;
    projects: Project[];
}

/** A single message in the chat — role is 'user' or 'assistant' */
interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    suggested_edit?: SuggestedEdit | null; // Optional edit attached to an assistant message
}

/**
 * SuggestedEdit represents a direct AI-proposed change to the CV.
 * The field discriminates which part of the CV to update.
 */
interface SuggestedEdit {
    field: 'professional_summary' | 'experience_bullet' | 'skills_add' | 'project_description';
    value?: string;           // For summary, bullet, project_description
    exp_id?: string;          // For experience_bullet
    bullet_index?: number;    // For experience_bullet
    skill_type?: 'technical' | 'soft'; // For skills_add
    values?: string[];        // For skills_add
    project_id?: string;      // For project_description
}

// ── Helpers ────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9);

const emptyExperience = (): Experience => ({
    id: uid(), job_title: '', company: '', location: '',
    start_date: '', end_date: '', responsibilities: [''],
});

const emptyEducation = (): Education => ({
    id: uid(), degree: '', institution: '', location: '',
    graduation_date: '', grade: '', relevant_modules: [],
});

const emptyProject = (): Project => ({
    id: uid(), title: '', description: '', link: '',
});

// ── Initial state ──────────────────────────────────────────────────────────

const initialFormData: CVFormData = {
    personal_info: { full_name: '', email: '', phone: '', location: '', linkedin: '', github: '', website: '' },
    target_role: { job_title: '', career_focus: '' },
    professional_summary: '',
    experience: [],
    education: [],
    skills: { technical: [], soft: [] },
    projects: [],
};

// ── Step definitions ───────────────────────────────────────────────────────

const STEPS = [
    { id: 0, label: 'Personal',    icon: User },
    { id: 1, label: 'Target Role', icon: Briefcase },
    { id: 2, label: 'Experience',  icon: Briefcase },
    { id: 3, label: 'Education',   icon: GraduationCap },
    { id: 4, label: 'Skills',      icon: Wrench },
    { id: 5, label: 'Summary',     icon: FileText },
];

// ── Stepper ────────────────────────────────────────────────────────────────

const Stepper: React.FC<{ currentStep: number; completedSteps: Set<number> }> = ({ currentStep, completedSteps }) => (
    <div className="flex items-center justify-between w-full mb-10">
        {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive    = currentStep === step.id;
            const isCompleted = completedSteps.has(step.id);
            return (
                <React.Fragment key={step.id}>
                    <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 font-bold text-sm
                            ${isCompleted
                                ? 'bg-gradient-to-br from-[#663399] to-[#4d2673] text-white shadow-md shadow-purple-200'
                                : isActive
                                ? 'bg-white border-2 border-[#663399] text-[#4d2673] shadow-md shadow-purple-100'
                                : 'bg-slate-100 text-slate-400 border-2 border-transparent'}`}>
                            {isCompleted ? <Check size={16} strokeWidth={3} /> : <Icon size={16} />}
                        </div>
                        <span className={`text-xs font-semibold hidden sm:block transition-colors
                            ${isActive ? 'text-[#4d2673]' : isCompleted ? 'text-slate-600' : 'text-slate-400'}`}>
                            {step.label}
                        </span>
                    </div>
                    {idx < STEPS.length - 1 && (
                        <div className="flex-1 h-0.5 mx-2 rounded-full overflow-hidden bg-slate-100">
                            <div className="h-full bg-gradient-to-r from-[#663399] to-[#4d2673] transition-all duration-500"
                                style={{ width: completedSteps.has(step.id) ? '100%' : '0%' }} />
                        </div>
                    )}
                </React.Fragment>
            );
        })}
    </div>
);

// ── Shared UI primitives ───────────────────────────────────────────────────

const StepPanel: React.FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
    <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-8">
        <div className="mb-7">
            <h2 className="text-2xl font-extrabold text-slate-900">{title}</h2>
            <p className="text-slate-500 mt-1 text-sm">{subtitle}</p>
        </div>
        {children}
    </div>
);

const Field: React.FC<{
    label: string; required?: boolean; hint?: string;
    children: React.ReactNode; fullWidth?: boolean;
}> = ({ label, required, hint, children, fullWidth }) => (
    <div className={fullWidth ? 'col-span-2' : ''}>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            {label} {required && <span className="text-red-400">*</span>}
        </label>
        {children}
        {hint && <p className="text-xs text-slate-400 mt-1.5">{hint}</p>}
    </div>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input {...props}
        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder-slate-300
            focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-[#7a3db5] transition-all" />
);

// ── Step 0: Personal Info ──────────────────────────────────────────────────

const PersonalInfoStep: React.FC<{ data: CVFormData; onChange: (d: CVFormData) => void }> = ({ data, onChange }) => {
    const update = (field: keyof PersonalInfo, value: string) =>
        onChange({ ...data, personal_info: { ...data.personal_info, [field]: value } });

    const fields: { label: string; field: keyof PersonalInfo; placeholder: string; required: boolean; fullWidth?: boolean }[] = [
        { label: 'Full Name',  field: 'full_name',  placeholder: 'Jane Smith',                 required: true,  fullWidth: true },
        { label: 'Email',      field: 'email',      placeholder: 'jane@example.com',           required: true  },
        { label: 'Phone',      field: 'phone',      placeholder: '+353 87 123 4567',           required: true  },
        { label: 'Location',   field: 'location',   placeholder: 'Galway, Ireland',            required: true  },
        { label: 'LinkedIn',   field: 'linkedin',   placeholder: 'linkedin.com/in/janesmith',  required: false },
        { label: 'GitHub',     field: 'github',     placeholder: 'github.com/janesmith',       required: false },
        { label: 'Website',    field: 'website',    placeholder: 'janesmith.dev',              required: false },
    ];

    return (
        <StepPanel title="Personal Information" subtitle="Your contact details — these appear at the top of your CV.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {fields.map(({ label, field, placeholder, required, fullWidth }) => (
                    <Field key={field} label={label} required={required} fullWidth={fullWidth}>
                        <Input value={data.personal_info[field]} onChange={(e) => update(field, e.target.value)} placeholder={placeholder} />
                    </Field>
                ))}
            </div>
        </StepPanel>
    );
};

// ── Step 1: Target Role ────────────────────────────────────────────────────

const TargetRoleStep: React.FC<{ data: CVFormData; onChange: (d: CVFormData) => void }> = ({ data, onChange }) => {
    const update = (field: keyof TargetRole, value: string) =>
        onChange({ ...data, target_role: { ...data.target_role, [field]: value } });

    return (
        <StepPanel title="Target Role" subtitle="Tell us what you're aiming for — this helps the AI tailor your CV and give better suggestions.">
            <div className="space-y-4">
                <Field label="What role are you targeting?" required>
                    <Input value={data.target_role.job_title} onChange={(e) => update('job_title', e.target.value)}
                        placeholder="e.g. Software Engineer, Data Scientist, DevOps Engineer" />
                </Field>
                <Field label="What kind of opportunity are you aiming for?"
                    hint="This gives the AI context when helping you improve bullet points and write your summary.">
                    <Input value={data.target_role.career_focus} onChange={(e) => update('career_focus', e.target.value)}
                        placeholder="e.g. Graduate role in fintech, internship in AI/ML, junior position in a startup" />
                </Field>
            </div>
        </StepPanel>
    );
};

// ── Step 2: Experience ─────────────────────────────────────────────────────

const BulletInput: React.FC<{
    value: string; index: number; targetRole: string;
    onChange: (i: number, v: string) => void;
    onRemove: (i: number) => void;
    onEnhanced: (i: number, v: string) => void;
}> = ({ value, index, targetRole, onChange, onRemove, onEnhanced }) => {
    const [enhancing, setEnhancing] = useState(false);
    const [enhanced, setEnhanced]   = useState('');

    const handleEnhance = async () => {
        if (!value.trim() || value.trim().length < 5) return;
        setEnhancing(true);
        try {
            const res = await fetch(`${API_BASE}/api/cv/enhance-bullet`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: value, context: { job_title: targetRole } }),
            });
            const data = await res.json();
            if (res.ok && data.enhanced) setEnhanced(data.enhanced);
        } catch {
            // Silently fail — user keeps their original text
        } finally {
            setEnhancing(false);
        }
    };

    const acceptEnhanced  = () => { onEnhanced(index, enhanced); setEnhanced(''); };
    const dismissEnhanced = () => setEnhanced('');

    return (
        <div className="space-y-2">
            <div className="flex items-start gap-2">
                <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-purple-300 flex-shrink-0" />
                <input type="text" value={value}
                    onChange={(e) => onChange(index, e.target.value)}
                    placeholder="e.g. Developed REST API endpoints using FastAPI, reducing response time by 30%"
                    className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder-slate-300
                        focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-[#7a3db5] transition-all" />
                <button onClick={handleEnhance} disabled={enhancing || value.trim().length < 5}
                    title="Enhance with AI"
                    className="flex-shrink-0 w-9 h-9 mt-0.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-[#663399]
                        flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                    {enhancing ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                </button>
                <button onClick={() => onRemove(index)}
                    className="flex-shrink-0 w-9 h-9 mt-0.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400
                        flex items-center justify-center transition-all">
                    <Trash2 size={15} />
                </button>
            </div>
            {enhanced && (
                <div className="ml-5 bg-purple-50 border border-purple-200 rounded-xl p-3 text-sm">
                    <p className="text-xs font-semibold text-[#4d2673] mb-1 flex items-center gap-1">
                        <Sparkles size={11} /> AI suggestion
                    </p>
                    <p className="text-slate-700 leading-relaxed">{enhanced}</p>
                    <div className="flex gap-2 mt-2">
                        <button onClick={acceptEnhanced}
                            className="text-xs font-bold text-white bg-[#663399] hover:bg-[#4d2673] px-3 py-1 rounded-lg transition-colors">
                            Use this
                        </button>
                        <button onClick={dismissEnhanced}
                            className="text-xs font-semibold text-slate-400 hover:text-slate-600 px-3 py-1 rounded-lg transition-colors">
                            Dismiss
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const ExperienceCard: React.FC<{
    exp: Experience; index: number; targetRole: string;
    onChange: (exp: Experience) => void; onRemove: () => void;
}> = ({ exp, index, targetRole, onChange, onRemove }) => {
    const [open, setOpen] = useState(true);

    const update         = (field: keyof Experience, value: string) => onChange({ ...exp, [field]: value });
    const updateBullet   = (i: number, v: string) => { const r = [...exp.responsibilities]; r[i] = v; onChange({ ...exp, responsibilities: r }); };
    const removeBullet   = (i: number) => onChange({ ...exp, responsibilities: exp.responsibilities.filter((_, idx) => idx !== i) });
    const addBullet      = () => onChange({ ...exp, responsibilities: [...exp.responsibilities, ''] });
    const acceptEnhanced = (i: number, v: string) => updateBullet(i, v);

    const summary = exp.job_title || exp.company
        ? `${exp.job_title || 'Untitled role'}${exp.company ? ` · ${exp.company}` : ''}`
        : `Experience ${index + 1}`;

    return (
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 cursor-pointer" onClick={() => setOpen(o => !o)}>
                <span className="font-semibold text-sm text-slate-700">{summary}</span>
                <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); onRemove(); }}
                        className="text-slate-300 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-50">
                        <Trash2 size={15} />
                    </button>
                    {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </div>
            </div>
            {open && (
                <div className="p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Job Title" required fullWidth>
                            <Input value={exp.job_title} onChange={(e) => update('job_title', e.target.value)} placeholder="Software Engineer" />
                        </Field>
                        <Field label="Company" required>
                            <Input value={exp.company} onChange={(e) => update('company', e.target.value)} placeholder="Acme Ltd" />
                        </Field>
                        <Field label="Location">
                            <Input value={exp.location} onChange={(e) => update('location', e.target.value)} placeholder="Dublin, Ireland" />
                        </Field>
                        <Field label="Start Date" required>
                            <Input value={exp.start_date} onChange={(e) => update('start_date', e.target.value)} placeholder="June 2023" />
                        </Field>
                        <Field label="End Date" required>
                            <Input value={exp.end_date} onChange={(e) => update('end_date', e.target.value)} placeholder="Present" />
                        </Field>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Responsibilities & Achievements
                            <span className="ml-2 text-xs font-normal text-[#663399] inline-flex items-center gap-0.5">
                                <Sparkles size={10} /> AI enhance available
                            </span>
                        </label>
                        <div className="space-y-2">
                            {exp.responsibilities.map((r, i) => (
                                <BulletInput key={i} value={r} index={i}
                                    targetRole={targetRole}
                                    onChange={updateBullet} onRemove={removeBullet} onEnhanced={acceptEnhanced} />
                            ))}
                        </div>
                        <button onClick={addBullet}
                            className="mt-3 text-xs font-semibold text-[#4d2673] hover:text-purple-700 flex items-center gap-1 transition-colors">
                            <Plus size={13} /> Add bullet point
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const ExperienceStep: React.FC<{ data: CVFormData; onChange: (d: CVFormData) => void }> = ({ data, onChange }) => {
    const updateExp = (id: string, updated: Experience) =>
        onChange({ ...data, experience: data.experience.map(e => e.id === id ? updated : e) });
    const removeExp = (id: string) =>
        onChange({ ...data, experience: data.experience.filter(e => e.id !== id) });
    const addExp = () =>
        onChange({ ...data, experience: [...data.experience, emptyExperience()] });

    return (
        <StepPanel title="Work Experience" subtitle="Add your roles — most recent first. Hit the ✦ button to enhance any bullet point with AI.">
            <div className="space-y-3">
                {data.experience.length === 0 && (
                    <div className="text-center py-10 text-slate-400 text-sm">
                        No experience added yet — click below to add your first role.
                    </div>
                )}
                {data.experience.map((exp, i) => (
                    <ExperienceCard key={exp.id} exp={exp} index={i}
                        targetRole={data.target_role.job_title}
                        onChange={(updated) => updateExp(exp.id, updated)}
                        onRemove={() => removeExp(exp.id)} />
                ))}
                <button onClick={addExp}
                    className="w-full py-3 rounded-2xl border-2 border-dashed border-purple-200 text-[#663399]
                     font-semibold text-sm
                        hover:border-[#7a3db5] hover:bg-purple-50 transition-all flex items-center justify-center gap-2">
                    <Plus size={16} /> Add Experience
                </button>
            </div>
        </StepPanel>
    );
};

// ── Step 3: Education ──────────────────────────────────────────────────────

const EducationCard: React.FC<{
    edu: Education; index: number;
    onChange: (edu: Education) => void; onRemove: () => void;
}> = ({ edu, index, onChange, onRemove }) => {
    const [open, setOpen]               = useState(true);
    const [moduleInput, setModuleInput] = useState('');

    const update       = (field: keyof Education, value: string) => onChange({ ...edu, [field]: value });
    const addModule    = () => { const v = moduleInput.trim(); if (v && !edu.relevant_modules.includes(v)) onChange({ ...edu, relevant_modules: [...edu.relevant_modules, v] }); setModuleInput(''); };
    const removeModule = (m: string) => onChange({ ...edu, relevant_modules: edu.relevant_modules.filter(x => x !== m) });

    const summary = edu.degree || edu.institution
        ? `${edu.degree || 'Degree'}${edu.institution ? ` · ${edu.institution}` : ''}`
        : `Education ${index + 1}`;

    return (
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 cursor-pointer" onClick={() => setOpen(o => !o)}>
                <span className="font-semibold text-sm text-slate-700">{summary}</span>
                <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); onRemove(); }}
                        className="text-slate-300 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-50">
                        <Trash2 size={15} />
                    </button>
                    {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </div>
            </div>
            {open && (
                <div className="p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Degree / Qualification" required fullWidth>
                            <Input value={edu.degree} onChange={(e) => update('degree', e.target.value)} placeholder="Bachelor of Computer Science" />
                        </Field>
                        <Field label="Institution" required>
                            <Input value={edu.institution} onChange={(e) => update('institution', e.target.value)} placeholder="University of Galway" />
                        </Field>
                        <Field label="Location">
                            <Input value={edu.location} onChange={(e) => update('location', e.target.value)} placeholder="Galway, Ireland" />
                        </Field>
                        <Field label="Graduation Date" required>
                            <Input value={edu.graduation_date} onChange={(e) => update('graduation_date', e.target.value)} placeholder="June 2026" />
                        </Field>
                        <Field label="Grade / Classification">
                            <Input value={edu.grade} onChange={(e) => update('grade', e.target.value)} placeholder="First Class Honours (Expected)" />
                        </Field>
                    </div>
                    <Field label="Relevant Modules" hint="Press Enter to add a module.">
                        <div className="flex flex-wrap gap-2 mb-2">
                            {edu.relevant_modules.map(m => (
                                <span key={m} className="bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                    {m}
                                    <button onClick={() => removeModule(m)} className="hover:text-purple-900 transition-colors"><X size={11} /></button>
                                </span>
                            ))}
                        </div>
                        <input type="text" value={moduleInput}
                            onChange={(e) => setModuleInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addModule(); } }}
                            placeholder="e.g. Machine Learning, Web Development..."
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder-slate-300
                                focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-[#7a3db5] transition-all" />
                    </Field>
                </div>
            )}
        </div>
    );
};

const EducationStep: React.FC<{ data: CVFormData; onChange: (d: CVFormData) => void }> = ({ data, onChange }) => {
    const updateEdu = (id: string, updated: Education) =>
        onChange({ ...data, education: data.education.map(e => e.id === id ? updated : e) });
    const removeEdu = (id: string) =>
        onChange({ ...data, education: data.education.filter(e => e.id !== id) });
    const addEdu = () =>
        onChange({ ...data, education: [...data.education, emptyEducation()] });

    return (
        <StepPanel title="Education" subtitle="Add your qualifications — most recent first.">
            <div className="space-y-3">
                {data.education.length === 0 && (
                    <div className="text-center py-10 text-slate-400 text-sm">
                        No education added yet — click below to add your first qualification.
                    </div>
                )}
                {data.education.map((edu, i) => (
                    <EducationCard key={edu.id} edu={edu} index={i}
                        onChange={(updated) => updateEdu(edu.id, updated)}
                        onRemove={() => removeEdu(edu.id)} />
                ))}
                <button onClick={addEdu}
                    className="w-full py-3 rounded-2xl border-2 border-dashed border-purple-200 text-[#663399] font-semibold text-sm
                        hover:border-[#7a3db5] hover:bg-purple-50 transition-all flex items-center justify-center gap-2">
                    <Plus size={16} /> Add Education
                </button>
            </div>
        </StepPanel>
    );
};

// ── Step 4: Skills ─────────────────────────────────────────────────────────

const TagInput: React.FC<{
    label: string; tags: string[]; placeholder: string; color: 'purple' | 'cyan';
    onAdd: (tag: string) => void; onRemove: (tag: string) => void;
}> = ({ label, tags, placeholder, color, onAdd, onRemove }) => {
    const [input, setInput] = useState('');
    const add = () => { const v = input.trim(); if (v && !tags.includes(v)) onAdd(v); setInput(''); };
    const colorMap = {
        purple: { tag: 'bg-purple-100 text-purple-700', x: 'hover:text-purple-900' },
        cyan:   { tag: 'bg-cyan-100 text-cyan-700',     x: 'hover:text-cyan-900'   },
    }[color];

    return (
        <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
            <div className="flex flex-wrap gap-2 mb-2 min-h-[2rem]">
                {tags.map(tag => (
                    <span key={tag} className={`${colorMap.tag} text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5`}>
                        {tag}
                        <button onClick={() => onRemove(tag)} className={`${colorMap.x} transition-colors`}><X size={11} /></button>
                    </span>
                ))}
                {tags.length === 0 && <span className="text-xs text-slate-300 py-1">None added yet</span>}
            </div>
            <div className="flex gap-2">
                <input type="text" value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
                    placeholder={placeholder}
                    className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder-slate-300
                        focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-[#7a3db5] transition-all" />
                <button onClick={add}
                    className="px-4 py-2.5 rounded-xl bg-purple-100 text-[#4d2673] font-bold text-sm hover:bg-purple-200 transition-colors">
                    Add
                </button>
            </div>
        </div>
    );
};

const SkillsStep: React.FC<{ data: CVFormData; onChange: (d: CVFormData) => void }> = ({ data, onChange }) => {
    const addTech    = (t: string) => onChange({ ...data, skills: { ...data.skills, technical: [...data.skills.technical, t] } });
    const removeTech = (t: string) => onChange({ ...data, skills: { ...data.skills, technical: data.skills.technical.filter(x => x !== t) } });
    const addSoft    = (t: string) => onChange({ ...data, skills: { ...data.skills, soft: [...data.skills.soft, t] } });
    const removeSoft = (t: string) => onChange({ ...data, skills: { ...data.skills, soft: data.skills.soft.filter(x => x !== t) } });

    const addProject    = () => onChange({ ...data, projects: [...data.projects, emptyProject()] });
    const removeProject = (id: string) => onChange({ ...data, projects: data.projects.filter(p => p.id !== id) });
    const updateProject = (id: string, field: keyof Project, value: string) =>
        onChange({ ...data, projects: data.projects.map(p => p.id === id ? { ...p, [field]: value } : p) });

    return (
        <StepPanel title="Skills & Projects" subtitle="Add your skills and any notable projects — personal, academic, or professional.">
            <div className="space-y-6">
                {/* Technical skills tag input */}
                <TagInput label="Technical Skills" tags={data.skills.technical} color="purple"
                    placeholder="e.g. Python, React, Docker..." onAdd={addTech} onRemove={removeTech} />

                <div className="border-t border-slate-100" />

                {/* Soft skills tag input */}
                <TagInput label="Soft Skills" tags={data.skills.soft} color="cyan"
                    placeholder="e.g. Team Leadership, Communication..." onAdd={addSoft} onRemove={removeSoft} />

                <div className="border-t border-slate-100" />

                {/* Projects section */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Projects</label>
                    <p className="text-xs text-slate-400 mb-3">Optional — add personal, academic, or open source projects.</p>

                    <div className="space-y-3">
                        {data.projects.map((project) => (
                            <div key={project.id} className="border border-slate-200 rounded-2xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <input
                                        type="text"
                                        value={project.title}
                                        onChange={(e) => updateProject(project.id, 'title', e.target.value)}
                                        placeholder="Project title e.g. CVora, Portfolio Website"
                                        className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700
                                            placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-[#7a3db5] transition-all"
                                    />
                                    <button onClick={() => removeProject(project.id)}
                                        className="ml-2 w-9 h-9 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400
                                            flex items-center justify-center transition-all flex-shrink-0">
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                                <textarea
                                    value={project.description}
                                    onChange={(e) => updateProject(project.id, 'description', e.target.value)}
                                    placeholder="One sentence describing what it does and the tech used..."
                                    rows={2}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700
                                        placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border[#7a3db5]-
                                        resize-none transition-all"
                                />
                                <input
                                    type="text"
                                    value={project.link}
                                    onChange={(e) => updateProject(project.id, 'link', e.target.value)}
                                    placeholder="Link (optional) — e.g. github.com/username/project"
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-500[#7a3db5]
                                        placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border- transition-all"
                                />
                            </div>
                        ))}
                    </div>

                    <button onClick={addProject}
                        className="mt-3 w-full py-3 rounded-2xl border-2 border-dashed border-purple-200 text-[#663399] font-semibold text-sm
                            hover:border-[#7a3db5] hover:bg-purple-50 transition-all flex items-center justify-center gap-2">
                        <Plus size={16} /> Add Project
                    </button>
                </div>
            </div>
        </StepPanel>
    );
};

// ── Step 5: Summary ────────────────────────────────────────────────────────

const SummaryStep: React.FC<{ data: CVFormData; onChange: (d: CVFormData) => void }> = ({ data, onChange }) => (
    <StepPanel title="Professional Summary"
        subtitle="2–3 sentences summing up who you are and what you bring. This is the first thing recruiters read.">
        <textarea
            value={data.professional_summary}
            onChange={(e) => onChange({ ...data, professional_summary: e.target.value })}
            placeholder={`e.g. Final-year Computer Science student at University of Galway with hands-on experience in full-stack development and AI. Passionate about building tools that solve real-world problems, targeting ${data.target_role.job_title || 'a graduate role'} in the Irish tech industry.`}
            rows={6}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder-slate-300
                focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-[#7a3db5] resize-none transition-all leading-relaxed"
        />
        <p className="text-xs text-slate-400 mt-2 text-right">{data.professional_summary.length} characters</p>
    </StepPanel>
);

// ── Chat Panel ─────────────────────────────────────────────────────────────

/**
 * ChatPanel is the AI assistant side panel.
 *
 * It receives the full formData as a prop and sends it to the backend
 * with every message, so the AI always has up-to-date CV context.
 *
 * Conversation history is kept locally in the component and sent as
 * the `history` array to maintain multi-turn conversation context.
 *
 * Suggested prompts give the user quick-start options rather than
 * staring at a blank input.
 */
const ChatPanel: React.FC<{
    formData: CVFormData;
    onClose: () => void;
    onApplyEdit: (edit: SuggestedEdit) => void;
    messages: ChatMessage[];
    onMessagesChange: (msgs: ChatMessage[]) => void;
}> = ({ formData, onClose, onApplyEdit, messages, onMessagesChange }) => {
    const [input, setInput]   = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef        = useRef<HTMLDivElement>(null);

    // Initialise with greeting if no messages yet
    const allMessages: ChatMessage[] = messages.length === 0 ? [{
        role: 'assistant',
        content: `Hi${formData.personal_info.full_name ? ` ${formData.personal_info.full_name.split(' ')[0]}` : ''}! I'm your CV assistant. I can see what you've filled in so far${formData.target_role.job_title ? ` and know you're targeting a ${formData.target_role.job_title} role` : ''}.\n\nHow can I help? You can ask me to improve bullet points, write your summary, or paste a job description to get tailored advice.`
    }] : messages;

    const suggestions = [
        'Write my professional summary',
        'Improve my first bullet point',
        'What skills am I missing?',
        'How do I tailor my CV to a job?',
    ];

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [allMessages]);

    const sendMessage = async (text?: string) => {
        const messageText = (text || input).trim();
        if (!messageText || loading) return;

        const userMessage: ChatMessage = { role: 'user', content: messageText };
        const updatedMessages = [...allMessages, userMessage];
        onMessagesChange(updatedMessages);
        setInput('');
        setLoading(true);

        try {
            const history = updatedMessages
                .slice(1)
                .slice(0, -1)
                .map(m => ({ role: m.role, content: m.content }));

            const res = await fetch(`${API_BASE}/api/cv/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: messageText, history, cv_data: formData }),
            });

            const data = await res.json();

            if (res.ok && data.reply) {
                onMessagesChange([...updatedMessages, {
                    role: 'assistant',
                    content: data.reply,
                    suggested_edit: data.suggested_edit || null
                }]);
            } else {
                onMessagesChange([...updatedMessages, {
                    role: 'assistant',
                    content: 'Sorry, I ran into an issue. Please check the backend is running and try again.'
                }]);
            }
        } catch {
            onMessagesChange([...updatedMessages, {
                role: 'assistant',
                content: 'Could not reach the server. Make sure the backend is running on port 8000.'
            }]);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Returns a human-readable label for the suggested edit
     * so the user knows exactly what will change.
     */
    const getEditLabel = (edit: SuggestedEdit): string => {
        switch (edit.field) {
            case 'professional_summary': return 'Professional Summary';
            case 'experience_bullet':   return `Experience bullet point`;
            case 'skills_add':          return `Add ${edit.skill_type} skills: ${(edit.values || []).join(', ')}`;
            case 'project_description': return 'Project description';
            default: return 'CV edit';
        }
    };

    return (
        <div className="flex flex-col h-full bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">

            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-[#663399] to-[#4d2673]">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                        <Bot size={16} className="text-white" />
                    </div>
                    <div>
                        <p className="font-bold text-white text-sm">CV Assistant</p>
                        <p className="text-purple-200 text-xs">Powered by AI · can edit your CV</p>
                    </div>
                </div>
                <button onClick={onClose}
                    className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
                    <X size={18} />
                </button>
            </div>

            {/* Suggested prompts */}
            {allMessages.length === 1 && (
                <div className="px-4 pt-4 pb-2 flex flex-wrap gap-2">
                    {suggestions.map(s => (
                        <button key={s} onClick={() => sendMessage(s)}
                            className="text-xs font-semibold text-[#4d2673] bg-purple-50 hover:bg-purple-100 border border-purple-200
                                px-3 py-1.5 rounded-full transition-colors text-left">
                            {s}
                        </button>
                    ))}
                </div>
            )}

            {/* Message list */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {allMessages.map((msg, i) => (
                    <div key={i}>
                        <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap
                                ${msg.role === 'user'
                                    ? 'bg-gradient-to-br from-[#663399] to-[#4d2673] text-white rounded-br-sm'
                                    : 'bg-slate-50 border border-slate-200 text-slate-700 rounded-bl-sm'
                                }`}>
                                {msg.content}
                            </div>
                        </div>

                        {msg.suggested_edit && (
                            <div className="mt-2 bg-purple-50 border border-purple-200 rounded-2xl p-3">
                                <p className="text-xs font-bold text-purple-700 mb-1 flex items-center gap-1">
                                    <Sparkles size={11} /> Suggested edit — {getEditLabel(msg.suggested_edit)}
                                </p>
                                {msg.suggested_edit.value && (
                                    <p className="text-xs text-slate-600 leading-relaxed mb-2 bg-white border border-purple-100 rounded-xl px-3 py-2">
                                        {msg.suggested_edit.value}
                                    </p>
                                )}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            onApplyEdit(msg.suggested_edit!);
                                            onMessagesChange(allMessages.map((m, idx) =>
                                                idx === i ? { ...m, suggested_edit: null } : m
                                            ));
                                        }}
                                        className="text-xs font-bold text-white bg-[#663399] hover:bg-[#4d2673] px-3 py-1.5 rounded-lg transition-colors">
                                        Apply to CV
                                    </button>
                                    <button
                                        onClick={() => onMessagesChange(allMessages.map((m, idx) =>
                                            idx === i ? { ...m, suggested_edit: null } : m
                                        ))}
                                        className="text-xs font-semibold text-slate-400 hover:text-slate-600 px-3 py-1.5 rounded-lg transition-colors">
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {/* Typing indicator */}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <div className="px-4 py-3 border-t border-slate-100">
                <div className="flex items-end gap-2">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                            }
                        }}
                        placeholder="Ask me anything about your CV..."
                        rows={1}
                        className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder-slate-300
                            focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-[#7a3db5] resize-none transition-all"
                    />
                    <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
                        className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#663399] to-[#4d2673] hover:from-[#4d2673] hover:to-violet-700
                            text-white flex items-center justify-center transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0">
                        <Send size={16} />
                    </button>
                </div>
                <p className="text-xs text-slate-400 mt-1.5 text-center">Enter to send · Shift+Enter for new line</p>
            </div>
        </div>
    );
};

// ── CV Preview Panel ───────────────────────────────────────────────────────

/**
 * CVPreview renders the form data as a real formatted CV document.
 * Updates live as the user types — it reads directly from formData prop.
 *
 * Styled to look like an actual A4 CV with:
 * - Name and contact details at the top
 * - Sections for Summary, Experience, Education, Skills
 * - Empty sections are hidden so the preview stays clean
 */
const CVPreview: React.FC<{ formData: CVFormData; onClose: () => void }> = ({ formData, onClose }) => {
    const { personal_info: p, target_role, professional_summary, experience, education, skills } = formData;

    const hasContact = p.email || p.phone || p.location || p.linkedin || p.github || p.website;
    const hasExperience = experience.some(e => e.job_title || e.company);
    const hasEducation = education.some(e => e.degree || e.institution);
    const hasTechnical = skills.technical.length > 0;
    const hasSoft = skills.soft.length > 0;

    return (
        <div className="flex flex-col h-full bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">

            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-[#663399] to-[#4d2673] flex-shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                        <Eye size={16} className="text-white" />
                    </div>
                    <div>
                        <p className="font-bold text-white text-sm">CV Preview</p>
                        <p className="text-purple-200 text-xs">Updates as you type</p>
                    </div>
                </div>
                <button onClick={onClose}
                    className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
                    <X size={18} />
                </button>
            </div>

            {/* CV document — scrollable */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
                <div className="bg-white shadow-sm rounded-xl p-8 min-h-full" style={{ fontFamily: 'Georgia, serif' }}>

                    {/* Empty state — shown before any data is entered */}
                    {!p.full_name && !professional_summary && !hasExperience && (
                        <div className="text-center py-16 text-slate-400">
                            <Eye size={32} className="mx-auto mb-3 opacity-30" />
                            <p className="text-sm font-medium">Your CV will appear here as you fill in the form.</p>
                        </div>
                    )}

                    {/* ── Header: Name + contact details ── */}
                    {(p.full_name || hasContact) && (
                        <div className="mb-6 pb-4 border-b-2 border-slate-800">
                            {p.full_name && (
                                <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
                                    {p.full_name}
                                </h1>
                            )}
                            {target_role.job_title && (
                                <p className="text-sm text-[#4d2673] font-semibold mb-2">{target_role.job_title}</p>
                            )}
                            {hasContact && (
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                                    {p.email    && <span className="flex items-center gap-1"><Mail size={10} />{p.email}</span>}
                                    {p.phone    && <span className="flex items-center gap-1"><Phone size={10} />{p.phone}</span>}
                                    {p.location && <span className="flex items-center gap-1"><MapPin size={10} />{p.location}</span>}
                                    {p.linkedin && <span className="flex items-center gap-1"><Linkedin size={10} />{p.linkedin}</span>}
                                    {p.github   && <span className="flex items-center gap-1"><Github size={10} />{p.github}</span>}
                                    {p.website  && <span className="flex items-center gap-1"><Globe size={10} />{p.website}</span>}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Professional Summary ── */}
                    {professional_summary && (
                        <div className="mb-5">
                            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-2 border-b border-slate-200 pb-1">
                                Professional Summary
                            </h2>
                            <p className="text-xs text-slate-600 leading-relaxed">{professional_summary}</p>
                        </div>
                    )}

                    {/* ── Work Experience ── */}
                    {hasExperience && (
                        <div className="mb-5">
                            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-3 border-b border-slate-200 pb-1">
                                Work Experience
                            </h2>
                            <div className="space-y-4">
                                {experience.filter(e => e.job_title || e.company).map(exp => (
                                    <div key={exp.id}>
                                        <div className="flex items-start justify-between mb-0.5">
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{exp.job_title}</p>
                                                <p className="text-xs text-slate-600 font-semibold">
                                                    {exp.company}{exp.location ? ` · ${exp.location}` : ''}
                                                </p>
                                            </div>
                                            {(exp.start_date || exp.end_date) && (
                                                <p className="text-xs text-slate-400 flex-shrink-0 ml-2">
                                                    {exp.start_date}{exp.end_date ? ` – ${exp.end_date}` : ''}
                                                </p>
                                            )}
                                        </div>
                                        {exp.responsibilities.filter(r => r.trim()).length > 0 && (
                                            <ul className="mt-1.5 space-y-0.5">
                                                {exp.responsibilities.filter(r => r.trim()).map((r, i) => (
                                                    <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                                                        <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-400 flex-shrink-0" />
                                                        {r}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Education ── */}
                    {hasEducation && (
                        <div className="mb-5">
                            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-3 border-b border-slate-200 pb-1">
                                Education
                            </h2>
                            <div className="space-y-3">
                                {education.filter(e => e.degree || e.institution).map(edu => (
                                    <div key={edu.id}>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{edu.degree}</p>
                                                <p className="text-xs text-slate-600">
                                                    {edu.institution}{edu.location ? ` · ${edu.location}` : ''}
                                                </p>
                                                {edu.grade && <p className="text-xs text-slate-500 italic">{edu.grade}</p>}
                                            </div>
                                            {edu.graduation_date && (
                                                <p className="text-xs text-slate-400 flex-shrink-0 ml-2">{edu.graduation_date}</p>
                                            )}
                                        </div>
                                        {edu.relevant_modules.length > 0 && (
                                            <p className="text-xs text-slate-500 mt-1">
                                                <span className="font-semibold">Modules: </span>
                                                {edu.relevant_modules.join(', ')}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Projects ── */}
                    {formData.projects.filter(p => p.title).length > 0 && (
                        <div className="mb-5">
                            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-3 border-b border-slate-200 pb-1">
                                Projects
                            </h2>
                            <div className="space-y-3">
                                {formData.projects.filter(p => p.title).map(project => (
                                    <div key={project.id}>
                                        <div className="flex items-start justify-between">
                                            <p className="text-sm font-bold text-slate-800">{project.title}</p>
                                            {project.link && (
                                                <p className="text-xs text-[#4d2673] flex-shrink-0 ml-2">{project.link}</p>
                                            )}
                                        </div>
                                        {project.description && (
                                            <p className="text-xs text-slate-600 mt-0.5">{project.description}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Skills ── */}
                    {(hasTechnical || hasSoft) && (
                        <div className="mb-5">
                            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-3 border-b border-slate-200 pb-1">
                                Skills
                            </h2>
                            {hasTechnical && (
                                <div className="mb-2">
                                    <span className="text-xs font-bold text-slate-700">Technical: </span>
                                    <span className="text-xs text-slate-600">{skills.technical.join(' · ')}</span>
                                </div>
                            )}
                            {hasSoft && (
                                <div>
                                    <span className="text-xs font-bold text-slate-700">Soft Skills: </span>
                                    <span className="text-xs text-slate-600">{skills.soft.join(' · ')}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ── Navigation bar ─────────────────────────────────────────────────────────

const NavBar: React.FC<{
    currentStep: number; totalSteps: number;
    onBack: () => void; onNext: () => void;
    canProceed: boolean; isLastStep: boolean;
}> = ({ currentStep, totalSteps, onBack, onNext, canProceed, isLastStep }) => (
    <div className="flex items-center justify-between mt-6">
        <button onClick={onBack} disabled={currentStep === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all
                text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed">
            <ArrowLeft size={16} /> Back
        </button>
        <span className="text-xs text-slate-400 font-medium">Step {currentStep + 1} of {totalSteps}</span>
        <button onClick={onNext} disabled={!canProceed}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 shadow-sm
                bg-gradient-to-r from-[#663399] to-[#4d2673] hover:from-[#4d2673] hover:to-violet-700
                text-white disabled:opacity-40 disabled:cursor-not-allowed">
            {isLastStep ? 'Finish' : 'Next'} <ArrowRight size={16} />
        </button>
    </div>
);

// ── Main CVBuilder page ────────────────────────────────────────────────────

export const CVBuilder: React.FC = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep]       = useState(0);
    const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
    const [formData, setFormData]             = useState<CVFormData>(initialFormData);
    const [wizardFinished, setWizardFinished] = useState(false);

    // Chat and preview panel visibility — only one can be open at a time during wizard
    // After finishing, both can be open side by side
    const [chatOpen, setChatOpen]       = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);

    // Chat messages lifted to parent so they persist when panel is closed/reopened
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

    const toggleChat    = () => { setChatOpen(o => !o); if (!wizardFinished) setPreviewOpen(false); };
    const togglePreview = () => { setPreviewOpen(o => !o); if (!wizardFinished) setChatOpen(false); };

    const totalSteps = STEPS.length;

    const handleNext = () => {
        setCompletedSteps(prev => new Set(prev).add(currentStep));
        if (currentStep < totalSteps - 1) {
            setCurrentStep(prev => prev + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            // Wizard complete — switch to review mode with preview + chat side by side
            setWizardFinished(true);
            setPreviewOpen(true);
            setChatOpen(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const canProceed = (): boolean => {
        if (currentStep === 0) {
            const p = formData.personal_info;
            return !!(p.full_name.trim() && p.email.trim() && p.phone.trim() && p.location.trim());
        }
        if (currentStep === 1) return !!formData.target_role.job_title.trim();
        return true;
    };

    const applyEdit = (edit: SuggestedEdit) => {
        switch (edit.field) {
            case 'professional_summary':
                if (edit.value) setFormData(prev => ({ ...prev, professional_summary: edit.value! }));
                break;
            case 'experience_bullet':
                if (edit.exp_id !== undefined && edit.bullet_index !== undefined && edit.value) {
                    setFormData(prev => ({
                        ...prev,
                        experience: prev.experience.map(exp =>
                            exp.id === edit.exp_id
                                ? { ...exp, responsibilities: exp.responsibilities.map((r, i) => i === edit.bullet_index ? edit.value! : r) }
                                : exp
                        )
                    }));
                }
                break;
            case 'skills_add':
                if (edit.skill_type && edit.values && edit.values.length > 0) {
                    setFormData(prev => ({
                        ...prev,
                        skills: {
                            ...prev.skills,
                            [edit.skill_type!]: [...new Set([...prev.skills[edit.skill_type!], ...edit.values!])]
                        }
                    }));
                }
                break;
            case 'project_description':
                if (edit.project_id && edit.value) {
                    setFormData(prev => ({
                        ...prev,
                        projects: prev.projects.map(p => p.id === edit.project_id ? { ...p, description: edit.value! } : p)
                    }));
                }
                break;
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 0: return <PersonalInfoStep data={formData} onChange={setFormData} />;
            case 1: return <TargetRoleStep   data={formData} onChange={setFormData} />;
            case 2: return <ExperienceStep   data={formData} onChange={setFormData} />;
            case 3: return <EducationStep    data={formData} onChange={setFormData} />;
            case 4: return <SkillsStep       data={formData} onChange={setFormData} />;
            case 5: return <SummaryStep      data={formData} onChange={setFormData} />;
            default: return null;
        }
    };

    // ── Finished view: preview + chat side by side, wizard hidden ──
    if (wizardFinished) {
        return (
            <div className="min-h-screen bg-white font-sans">
                <Header />
                <main className="pt-32 pb-24">
                    <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                        {/* Top bar */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-2xl font-extrabold text-slate-900">
                                    Your <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#663399] to-[#4d2673]">CV</span>
                                </h1>
                                <p className="text-slate-500 text-sm mt-0.5">Review and refine with your AI assistant.</p>
                            </div>
                            <button onClick={() => { setWizardFinished(false); setPreviewOpen(false); }}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-slate-500
                                    hover:text-slate-800 hover:bg-slate-100 transition-all border border-slate-200">
                                <ArrowLeft size={16} /> Back to wizard
                            </button>
                        </div>

                        {/* Side by side: preview left, chat right */}
                        <div className="flex gap-6 items-start">
                            <div className="flex-1 min-w-0 lg:sticky lg:top-32" style={{ height: 'calc(100vh - 12rem)' }}>
                                <CVPreview formData={formData} onClose={() => {}} />
                            </div>
                            <div className="w-full lg:w-96 flex-shrink-0 lg:sticky lg:top-32" style={{ height: 'calc(100vh - 12rem)' }}>
                                <ChatPanel
                                    formData={formData}
                                    onClose={() => {}}
                                    onApplyEdit={applyEdit}
                                    messages={chatMessages}
                                    onMessagesChange={setChatMessages}
                                />
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    // ── Wizard view ──
    return (
        <div className="min-h-screen bg-white font-sans">
            <Header />
            <main className="pt-32 pb-24">
                <div className={`mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300
                    ${(chatOpen || previewOpen) ? 'max-w-6xl' : 'max-w-2xl'}`}>

                    <div className={`flex gap-8 items-start ${(chatOpen || previewOpen) ? 'flex-col lg:flex-row' : ''}`}>

                        {/* ── Wizard column ── */}
                        <div className="flex-1 min-w-0">
                            <button onClick={() => navigate('/')}
                                className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium mb-8 transition-colors group">
                                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                                Back to Home
                            </button>

                            <div className="flex items-start justify-between mb-10">
                                <div>
                                    <h1 className="text-4xl font-extrabold text-slate-900 mb-2">
                                        Build your{' '}
                                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#663399] to-[#4d2673]">CV</span>
                                    </h1>
                                    <p className="text-slate-500 text-lg">Step-by-step, with AI to help you along the way.</p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                    <button onClick={togglePreview}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm
                                            ${previewOpen
                                                ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                                : 'bg-white border border-slate-200 text-slate-600 hover:border-purple-300 hover:text-[#4d2673]'
                                            }`}>
                                        <Eye size={16} />
                                        {previewOpen ? 'Hide Preview' : 'Preview CV'}
                                    </button>
                                    <button onClick={toggleChat}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm
                                            ${chatOpen
                                                ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                                : 'bg-gradient-to-r from-[#663399] to-[#4d2673] text-white hover:from-[#4d2673] hover:to-violet-700'
                                            }`}>
                                        <MessageCircle size={16} />
                                        {chatOpen ? 'Hide Assistant' : 'AI Assistant'}
                                    </button>
                                </div>
                            </div>

                            <Stepper currentStep={currentStep} completedSteps={completedSteps} />
                            {renderStep()}
                            <NavBar
                                currentStep={currentStep} totalSteps={totalSteps}
                                onBack={handleBack} onNext={handleNext}
                                canProceed={canProceed()} isLastStep={currentStep === totalSteps - 1}
                            />
                        </div>

                        {/* ── Preview panel ── */}
                        {previewOpen && (
                            <div className="w-full lg:w-96 lg:sticky lg:top-32 flex-shrink-0" style={{ height: 'calc(100vh - 10rem)' }}>
                                <CVPreview formData={formData} onClose={() => setPreviewOpen(false)} />
                            </div>
                        )}

                        {/* ── Chat panel ── */}
                        {chatOpen && (
                            <div className="w-full lg:w-96 lg:sticky lg:top-32 flex-shrink-0" style={{ height: 'calc(100vh - 10rem)' }}>
                                <ChatPanel
                                    formData={formData}
                                    onClose={() => setChatOpen(false)}
                                    onApplyEdit={applyEdit}
                                    messages={chatMessages}
                                    onMessagesChange={setChatMessages}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default CVBuilder;