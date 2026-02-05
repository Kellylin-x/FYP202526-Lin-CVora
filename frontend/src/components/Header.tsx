import React from 'react';
import { FileText } from 'lucide-react';

export const Header: React.FC = () => {
    return (
        <header className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {/* Logo Section */}
                    <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center text-white shadow-lg">
                            <FileText size={24} strokeWidth={2.5} />
                        </div>
                        <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-dark to-secondary-dark font-sans tracking-tight">
                            CVora
                        </span>
                    </div>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center space-x-8">
                        <a href="#" className="text-slate-600 hover:text-primary font-medium transition-colors text-lg">
                            Home
                        </a>
                        <a href="#features" className="text-slate-600 hover:text-primary font-medium transition-colors text-lg">
                            Features
                        </a>
                        <a href="#about" className="text-slate-600 hover:text-primary font-medium transition-colors text-lg">
                            About
                        </a>
                    </div>

                    {/* CTA Button */}
                    <div className="flex items-center">
                        <button className="bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-secondary-dark text-white text-lg font-semibold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5">
                            Get Started
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};
