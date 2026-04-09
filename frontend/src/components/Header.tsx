import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CVoraLogo from '../assets/CVoraLOGO.png';

export const Header: React.FC = () => {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 80);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinkClass = scrolled
        ? 'text-slate-600 hover:text-primary font-medium transition-colors text-lg'
        : 'text-white/90 hover:text-white font-medium transition-colors text-lg';

    const headerClass = scrolled
        ? 'fixed w-full z-50 transition-all duration-300 bg-white/20 backdrop-blur-md border-b border-slate-200 shadow-sm'
        : 'fixed w-full z-50 transition-all duration-300 bg-black/10 backdrop-blur-md border-b border-white/10';

    return (
        <header className={headerClass}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-24">
                    {/* Logo */}
                    <div
                        className="flex-shrink-0 flex items-center gap-2 cursor-pointer"
                        onClick={() => navigate('/')}
                    >
                        <img src={CVoraLogo} alt="CVora Logo" className="h-48 w-48 object-contain" />
                    </div>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link to="/" className={navLinkClass}>Home</Link>
                        <Link to="/build" className={navLinkClass}>Build CV</Link>
                        <Link to="/upload" className={navLinkClass}>Enhance CV</Link>
                        <Link to="/job-analysis" className={navLinkClass}>Job Analysis</Link>
                        <Link to="/tips" className={navLinkClass}>Tips</Link>
                    </div>

                    {/* CTA Button */}
                    <div className="flex items-center">
                        <button
                            onClick={() => navigate('/build')}
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