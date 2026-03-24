import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { CheckCircle2 } from 'lucide-react';

interface FeatureCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    features: string[];
    buttonText: string;
    variant: 'teal' | 'purple';
    onClick?: () => void;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
    title,
    description,
    icon: Icon,
    features,
    buttonText,
    variant,
    onClick,
}) => {
    const isTeal = variant === 'teal';

    const styles = {
        card: `bg-white rounded-3xl p-8 shadow-xl border border-slate-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col`,
        iconWrapper: `w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${isTeal ? 'bg-cyan-100 text-cyan-600' : 'bg-[#663399]/10 text-[#663399]'
            }`,
        button: `w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-md hover:shadow-lg ${isTeal
            ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-500 hover:to-cyan-600 text-white'
            : 'bg-gradient-to-r from-[#663399] to-[#4d2673] hover:from-[#4d2673] hover:to-[#3d1d5c] text-white'
            }`,
        featureIcon: isTeal ? 'text-cyan-500' : 'text-[#663399]',
    };

    return (
        <div className={styles.card}>
            <div className={styles.iconWrapper}>
                <Icon size={32} strokeWidth={2} />
            </div>

            <h3 className="text-2xl font-bold text-slate-900 mb-3">{title}</h3>
            <p className="text-slate-600 mb-8 leading-relaxed h-16">{description}</p>

            <ul className="space-y-4 mb-8 flex-grow">
                {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3 text-slate-600">
                        <CheckCircle2 size={20} className={`mt-0.5 flex-shrink-0 ${styles.featureIcon}`} />
                        <span>{feature}</span>
                    </li>
                ))}
            </ul>

            <button onClick={onClick} className={styles.button}>
                {buttonText}
            </button>
        </div>
    );
};
