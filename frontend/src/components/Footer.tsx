import React from 'react';

export const Footer: React.FC = () => {
    return (
        <footer className="bg-slate-50 border-t border-slate-200 mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left">
                    <div className="mb-6 md:mb-0">
                        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-[#4d2673] font-sans tracking-tight">
                            CVora
                        </span>
                        <p className="text-slate-500 mt-2 text-sm">
                            Smarter CVs. Better Opportunities.
                        </p>
                    </div>

                    <div className="text-slate-500 text-sm">
                        <p>&copy; {new Date().getFullYear()} CVora. All rights reserved.</p>
                        <p className="mt-1">Final Year Project - CT413</p>
                        <p className="mt-2 text-xs opacity-75">
                            Built with React, TypeScript, and FastAPI
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};
