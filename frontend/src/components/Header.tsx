import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CVoraLogo from '../assets/CVoraLOGO.png';

export const Header: React.FC = () => {
    const navigate = useNavigate();

    return (
        <header className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-24">
                    {/* Logo Section */}
                    <div
                        className="flex-shrink-0 flex items-center gap-2 cursor-pointer"
                        onClick={() => navigate('/')}
                    >
                        <img src={CVoraLogo} alt="CVora Logo" className="h-48 w-48 object-contain" />
                    </div>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link to="/" className="text-slate-600 hover:text-primary font-medium transition-colors text-lg">
                            Home
                        </Link>
                        <a href="/#features" className="text-slate-600 hover:text-primary font-medium transition-colors text-lg">
                            Features
                        </a>
                        <a href="/#about" className="text-slate-600 hover:text-primary font-medium transition-colors text-lg">
                            About
                        </a>
                    </div>

                    {/* CTA Button */}
                    <div className="flex items-center">
                        <button
                            onClick={() => navigate('/upload')}
                            className="bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-secondary-dark text-white text-lg font-semibold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                        >
                            Get Started
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};