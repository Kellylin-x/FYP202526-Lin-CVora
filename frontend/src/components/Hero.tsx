import React from 'react';
import { Sparkles } from 'lucide-react';
import heroVideo from '../assets/Herobg.mp4';

export const Hero: React.FC = () => {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-900">
            
            {/* Video Background */}
            <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover z-0"
            >
                <source src={heroVideo} type="video/mp4" />
            </video>

            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/50 z-10" />

            {/* Content */}
            <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white font-medium text-sm mb-8 backdrop-blur-sm">
                    <Sparkles size={16} className="text-blue-300" />
                    <span>AI-Powered CV Enhancement</span>
                </div>

                {/* Headline */}
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8">
                    <span className="block text-white mb-2">AI-Powered CV Builder</span>
                    <span className="block bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-blue-300 pb-2">
                        for STEM Roles
                    </span>
                </h1>

                {/* Subheadline */}
                <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-200 leading-relaxed">
                    Create and enhance your CV for UK & Ireland STEM positions with intelligent AI assistance.
                    Stand out from the crowd and land your dream job.
                </p>

                {/* Feature List */}
                <div className="mt-10 flex flex-wrap justify-center gap-8 text-gray-200 font-medium">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-400" />
                        ATS-Optimized
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                        STAR Method Guidance
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-pink-400" />
                        Real-time Preview
                    </div>
                </div>
            </div>
        </section>
    );
};