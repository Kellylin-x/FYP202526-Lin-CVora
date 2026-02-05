import React from 'react';
import { Sparkles } from 'lucide-react';

export const Hero: React.FC = () => {
    return (
        <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl mix-blend-multiply opacity-70 animate-blob" />
                <div className="absolute top-20 right-10 w-72 h-72 bg-secondary/10 rounded-full blur-3xl mix-blend-multiply opacity-70 animate-blob animation-delay-2000" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 font-medium text-sm mb-8 animate-fade-in-up">
                    <Sparkles size={16} className="text-blue-500" />
                    <span>AI-Powered CV Enhancement</span>
                </div>

                {/* Headline */}
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8">
                    <span className="block text-slate-900 mb-2">AI-Powered CV Builder</span>
                    <span className="block bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary pb-2">
                        for STEM Roles
                    </span>
                </h1>

                {/* Subheadline */}
                <p className="mt-6 max-w-2xl mx-auto text-xl text-slate-600 leading-relaxed">
                    Create and enhance your CV for UK & Ireland STEM positions with intelligent AI assistance.
                    Stand out from the crowd and land your dream job.
                </p>

                {/* Feature List */}
                <div className="mt-10 flex flex-wrap justify-center gap-8 text-slate-600 font-medium">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        ATS-Optimized
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-secondary" />
                        STAR Method Guidance
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-pink-500" />
                        Real-time Preview
                    </div>
                </div>
            </div>
        </section>
    );
};
