/**
 * TipsPage.tsx
 *
 * A static advice and guidance page for CVora.
 * Covers CV writing tips, ATS advice, STAR method guide, and interview tips.
 * Laid out as cards/tiles, consistent with the CVora design system.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, FileText, Search, Star, MessageSquare,
    ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Lightbulb
} from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

// ── Types ──────────────────────────────────────────────────────────────────

interface TipCard {
    title: string;
    description: string;
    tips: string[];
}

interface Section {
    id: string;
    icon: React.ReactNode;
    label: string;
    heading: string;
    intro: string;
    color: 'purple' | 'teal' | 'amber' | 'blue';
    cards: TipCard[];
}

// ── Content ────────────────────────────────────────────────────────────────

const SECTIONS: Section[] = [
    {
        id: 'cv-writing',
        icon: <FileText size={20} />,
        label: 'CV Writing',
        heading: 'Writing a Strong CV',
        intro: 'Your CV is your first impression. These tips will help you stand out to Irish and UK recruiters.',
        color: 'teal',
        cards: [
            {
                title: 'Keep it to 1–2 pages',
                description: 'UK and Irish recruiters spend an average of 6 seconds scanning a CV. Keep it concise.',
                tips: [
                    'One page for graduates and early careers',
                    'Two pages maximum for experienced professionals',
                    'Cut older or irrelevant experience ruthlessly',
                    'Use a clean, readable font at 10–12pt',
                ]
            },
            {
                title: 'Lead with a strong summary',
                description: 'A 2–3 sentence professional summary at the top tells the recruiter who you are immediately.',
                tips: [
                    'State your current status (e.g. "Final-year Computer Science student")',
                    'Mention your strongest relevant skill or experience',
                    'Include the type of role you\'re targeting',
                    'Avoid clichés like "hard-working team player"',
                ]
            },
            {
                title: 'Use action verbs and metrics',
                description: 'Strong bullet points start with verbs and include measurable outcomes where possible.',
                tips: [
                    'Start each bullet with: Developed, Led, Built, Designed, Reduced, Increased',
                    'Add numbers where you can: "reduced load time by 40%"',
                    'Focus on impact, not just duties',
                    'Keep bullets to one line where possible',
                ]
            },
            {
                title: 'Tailor for each application',
                description: 'A generic CV performs poorly. Customise for every role you apply to.',
                tips: [
                    'Mirror keywords from the job description',
                    'Reorder your skills to match what\'s most relevant',
                    'Adjust your summary to match the company\'s tone',
                    'Use CVora\'s Job Analysis tool to identify gaps',
                ]
            },
        ]
    },
    {
        id: 'ats',
        icon: <Search size={20} />,
        label: 'ATS Advice',
        heading: 'Beating Applicant Tracking Systems',
        intro: 'Most large companies use ATS software to filter CVs before a human ever reads them. Here\'s how to get through.',
        color: 'purple',
        cards: [
            {
                title: 'What is an ATS?',
                description: 'An Applicant Tracking System scans your CV for keywords and ranks it against the job description.',
                tips: [
                    'ATS software is used by ~75% of large employers',
                    'It ranks CVs by keyword match before human review',
                    'A great CV can still be rejected if it\'s not ATS-friendly',
                    'CVora\'s job analysis helps you identify the right keywords',
                ]
            },
            {
                title: 'Format for ATS compatibility',
                description: 'Fancy formatting can confuse ATS parsers. Keep your layout clean and simple.',
                tips: [
                    'Avoid tables, text boxes, and columns',
                    'Use standard section headings: Experience, Education, Skills',
                    'Submit as PDF unless the job ad specifies DOCX',
                    'Avoid headers and footers — ATS often skips them',
                ]
            },
            {
                title: 'Use keywords strategically',
                description: 'Match the language in the job description — ATS looks for exact or near-exact matches.',
                tips: [
                    'Copy key phrases directly from the job posting',
                    'Include both acronyms and full terms (e.g. "ML" and "Machine Learning")',
                    'Put keywords in your skills section and bullet points',
                    'Don\'t keyword-stuff — it looks unnatural to human reviewers',
                ]
            },
            {
                title: 'Test before you submit',
                description: 'Run your CV through CVora\'s analysis tool to check your match score before applying.',
                tips: [
                    'Aim for a match score above 70% for competitive roles',
                    'Pay attention to missing keywords in the results',
                    'Check the tech stack section for skills you may have forgotten to list',
                    'Re-run after editing your CV to see improvement',
                ]
            },
        ]
    },
    {
        id: 'star',
        icon: <Star size={20} />,
        label: 'STAR Method',
        heading: 'The STAR Method',
        intro: 'STAR is the most effective framework for writing CV bullet points and answering interview questions.',
        color: 'amber',
        cards: [
            {
                title: 'Situation',
                description: 'Set the scene. What was the context or challenge you were facing?',
                tips: [
                    'Keep it brief — one sentence is usually enough',
                    'Example: "During a group project in 3rd year..."',
                    'Example: "When our team faced a critical deployment deadline..."',
                    'Don\'t over-explain — get to the Task quickly',
                ]
            },
            {
                title: 'Task',
                description: 'What was your specific responsibility or goal in that situation?',
                tips: [
                    'Make clear what YOU were responsible for',
                    'Example: "I was tasked with building the backend API..."',
                    'Distinguish your role from the team\'s role',
                    'This sets up why your Action mattered',
                ]
            },
            {
                title: 'Action',
                description: 'What did you actually do? This is the most important part.',
                tips: [
                    'Use strong action verbs: Developed, Designed, Led, Implemented',
                    'Be specific about your approach and decisions',
                    'Example: "I designed a REST API using FastAPI and integrated OpenAI..."',
                    'Focus on what makes your approach noteworthy',
                ]
            },
            {
                title: 'Result',
                description: 'What was the outcome? Quantify it if you can.',
                tips: [
                    'Include numbers where possible: "reduced by 30%", "served 500 users"',
                    'Example: "The system went live on time with zero critical bugs"',
                    'If you can\'t quantify, describe the qualitative impact',
                    'Results are what recruiters remember most',
                ]
            },
        ]
    },
    {
        id: 'interview',
        icon: <MessageSquare size={20} />,
        label: 'Interview Tips',
        heading: 'Interview Preparation',
        intro: 'Getting an interview is half the battle. These tips will help you perform confidently on the day.',
        color: 'blue',
        cards: [
            {
                title: 'Research the company',
                description: 'Interviewers can tell immediately if you haven\'t done your homework.',
                tips: [
                    'Read the company\'s website, blog, and recent news',
                    'Understand their product, customers, and tech stack',
                    'Know who you\'re interviewing with if possible (LinkedIn)',
                    'Prepare a question about their work — it shows genuine interest',
                ]
            },
            {
                title: 'Prepare STAR stories',
                description: 'Have 4–5 strong STAR examples ready that you can adapt to different questions.',
                tips: [
                    'Prepare stories covering: leadership, problem-solving, teamwork, failure, achievement',
                    'Practice saying them out loud — not just in your head',
                    'Aim for 1.5–2 minutes per answer',
                    'Tailor the story to the role you\'re interviewing for',
                ]
            },
            {
                title: 'Handle technical interviews',
                description: 'For STEM roles, technical rounds are common. Preparation is everything.',
                tips: [
                    'Review fundamentals relevant to the role (algorithms, system design, domain knowledge)',
                    'Think out loud — interviewers want to see your reasoning process',
                    'It\'s okay to ask clarifying questions before diving in',
                    'If you\'re stuck, explain your approach even if you can\'t complete the solution',
                ]
            },
            {
                title: 'After the interview',
                description: 'What you do after the interview can make a difference.',
                tips: [
                    'Send a brief thank-you email within 24 hours',
                    'Reference something specific from the conversation',
                    'If you didn\'t hear back within the stated timeframe, follow up once',
                    'Reflect on what went well and what to improve for next time',
                ]
            },
        ]
    },
];

// ── Colour maps ────────────────────────────────────────────────────────────

const colorMap = {
    purple: {
        tab:        'bg-[#663399] text-white',
        tabInactive:'hover:bg-[#663399]/10 hover:text-[#663399]',
        icon:       'bg-[#663399]/10 text-[#663399]',
        border:     'border-[#663399]/20',
        badge:      'bg-[#663399]/10 text-[#663399]',
        dot:        'bg-[#663399]',
        heading:    'text-[#663399]',
    },
    teal: {
        tab:        'bg-teal-500 text-white',
        tabInactive:'hover:bg-teal-50 hover:text-teal-600',
        icon:       'bg-teal-100 text-teal-600',
        border:     'border-teal-100',
        badge:      'bg-teal-100 text-teal-700',
        dot:        'bg-teal-500',
        heading:    'text-teal-700',
    },
    amber: {
        tab:        'bg-amber-500 text-white',
        tabInactive:'hover:bg-amber-50 hover:text-amber-600',
        icon:       'bg-amber-100 text-amber-600',
        border:     'border-amber-100',
        badge:      'bg-amber-100 text-amber-700',
        dot:        'bg-amber-500',
        heading:    'text-amber-700',
    },
    blue: {
        tab:        'bg-blue-500 text-white',
        tabInactive:'hover:bg-blue-50 hover:text-blue-600',
        icon:       'bg-blue-100 text-blue-600',
        border:     'border-blue-100',
        badge:      'bg-blue-100 text-blue-700',
        dot:        'bg-blue-500',
        heading:    'text-blue-700',
    },
};

// ── Tip card component ─────────────────────────────────────────────────────

const TipCardComponent: React.FC<{ card: TipCard; color: Section['color'] }> = ({ card, color }) => {
    const [open, setOpen] = useState(false);
    const c = colorMap[color];

    return (
        <div className={`bg-white border ${c.border} rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow`}>
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full text-left px-6 py-5 flex items-center justify-between gap-4"
            >
                <div className="flex items-center gap-3">
                    <CheckCircle2 size={18} className={c.heading} />
                    <span className="font-bold text-slate-800 text-sm">{card.title}</span>
                </div>
                {open
                    ? <ChevronUp size={16} className="text-slate-400 flex-shrink-0" />
                    : <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />
                }
            </button>

            {open && (
                <div className="px-6 pb-5 border-t border-slate-100">
                    <p className="text-slate-500 text-sm mt-3 mb-3 leading-relaxed">{card.description}</p>
                    <ul className="space-y-2">
                        {card.tips.map((tip, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${c.dot} flex-shrink-0`} />
                                {tip}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

// ── Main TipsPage ──────────────────────────────────────────────────────────

export const TipsPage: React.FC = () => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('cv-writing');

    const current = SECTIONS.find(s => s.id === activeSection) || SECTIONS[0];
    const c = colorMap[current.color];

    return (
        <div className="min-h-screen bg-white font-sans">
            <Header />

            <main className="pt-32 pb-24">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Back button */}
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium mb-8 transition-colors group"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Home
                    </button>

                    {/* Page heading */}
                    <div className="mb-10">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-[#663399]/10 flex items-center justify-center">
                                <Lightbulb size={16} className="text-teal-600" />
                            </div>
                            <span className="text-sm font-semibold text-teal-600 uppercase tracking-wide">Career Guides</span>
                        </div>
                        <h1 className="text-4xl font-extrabold text-slate-900 mb-3">
                            Tips & <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-500 to-teal-600">Guidance</span>
                        </h1>
                        <p className="text-slate-500 text-lg max-w-2xl">
                            Everything you need to write a standout CV, beat ATS filters, nail interviews, and structure your experience using the STAR method.
                        </p>
                    </div>

                    {/* Section tabs */}
                    <div className="flex flex-wrap gap-2 mb-8">
                        {SECTIONS.map(section => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all
                                    ${activeSection === section.id
                                        ? colorMap[section.color].tab
                                        : `text-slate-500 bg-slate-50 border border-slate-200 ${colorMap[section.color].tabInactive}`
                                    }`}
                            >
                                {section.icon}
                                {section.label}
                            </button>
                        ))}
                    </div>

                    {/* Active section */}
                    <div>
                        {/* Section header */}
                        <div className={`flex items-start gap-4 bg-white border ${c.border} rounded-3xl p-6 mb-6 shadow-sm`}>
                            <div className={`w-12 h-12 rounded-2xl ${c.icon} flex items-center justify-center flex-shrink-0`}>
                                {current.icon}
                            </div>
                            <div>
                                <h2 className={`text-2xl font-extrabold ${c.heading} mb-1`}>{current.heading}</h2>
                                <p className="text-slate-500 text-sm leading-relaxed">{current.intro}</p>
                            </div>
                        </div>

                        {/* Tip cards grid */}
                        <div className="grid grid-cols-1 gap-4">
                            {current.cards.map((card, i) => (
                                <TipCardComponent key={`${activeSection}-${i}`} card={card} color={current.color} />
                            ))}
                        </div>

                        {/* CTA at the bottom */}
                        <div className="mt-8 bg-gradient-to-r from-teal-500 to-teal-600 rounded-3xl p-6 text-white flex items-center justify-between flex-wrap gap-4">
                            <div>
                                <p className="font-bold text-lg">Ready to put this into practice?</p>
                                <p className="text-white text-sm mt-0.5">Use CVora to build your CV with AI guidance built in.</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => navigate('/build')}
                                    className="px-5 py-2.5 bg-white text-teal-600 font-bold text-sm rounded-xl hover:bg-purple-50 transition-colors">
                                    Build my CV
                                </button>
                                <button onClick={() => navigate('/job-analysis')}
                                    className="px-5 py-2.5 bg-white/20 text-white font-bold text-sm rounded-xl hover:bg-white/30 transition-colors">
                                    Analyse a Job
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default TipsPage;