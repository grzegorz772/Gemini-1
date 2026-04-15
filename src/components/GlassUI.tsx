import React from 'react';
import { motion } from 'motion/react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  radiusClass?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = "", onClick, radiusClass = "rounded-[2rem]" }) => {
  return (
    <motion.div
      whileHover={onClick ? { scale: 1.02 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={`liquidGlass-wrapper ${radiusClass} ${className}`}
    >
      <div className={`liquidGlass-effect ${radiusClass}`}></div>
      <div className={`liquidGlass-tint ${radiusClass} bg-gradient-to-br from-white/10 to-white/5`}></div>
      <div className={`liquidGlass-shine ${radiusClass}`}></div>
      <div className="liquidGlass-text w-full">
        {children}
      </div>
    </motion.div>
  );
};

export const GlassButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
}> = ({ children, onClick, className = "", variant = 'primary', disabled = false }) => {
  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.05, y: -2 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      className={`
        liquidGlass-wrapper rounded-2xl transition-all duration-300
        ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''}
        ${className}
      `}
    >
      <div className="liquidGlass-effect rounded-2xl"></div>
      <div className={`liquidGlass-tint rounded-2xl ${
        variant === 'primary' ? 'bg-gradient-to-br from-blue-500/40 to-blue-600/20' : 
        variant === 'secondary' ? 'bg-gradient-to-br from-white/20 to-white/5' : 
        'bg-transparent'
      }`}></div>
      <div className="liquidGlass-shine rounded-2xl"></div>
      <div className="liquidGlass-text px-6 py-3 font-medium flex items-center justify-center">
        {children}
      </div>
    </motion.button>
  );
};

export const GlassInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { radiusClass?: string }> = ({ className = "", radiusClass = "rounded-xl", ...props }) => {
  return (
    <div className={`liquidGlass-wrapper ${radiusClass} ${className}`}>
      <div className={`liquidGlass-effect ${radiusClass}`}></div>
      <div className={`liquidGlass-tint ${radiusClass} bg-white/10`}></div>
      <div className={`liquidGlass-shine ${radiusClass}`}></div>
      <input 
        {...props}
        className="liquidGlass-text w-full bg-transparent outline-none p-3 placeholder-white/40 text-white"
      />
    </div>
  );
};

export const GlassTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { radiusClass?: string }> = ({ className = "", radiusClass = "rounded-xl", ...props }) => {
  return (
    <div className={`liquidGlass-wrapper ${radiusClass} ${className}`}>
      <div className={`liquidGlass-effect ${radiusClass}`}></div>
      <div className={`liquidGlass-tint ${radiusClass} bg-white/10`}></div>
      <div className={`liquidGlass-shine ${radiusClass}`}></div>
      <textarea 
        {...props}
        className="liquidGlass-text w-full bg-transparent outline-none p-4 placeholder-white/40 text-white resize-none"
      />
    </div>
  );
};

export const GlassSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { radiusClass?: string }> = ({ className = "", radiusClass = "rounded-xl", children, ...props }) => {
  return (
    <div className={`liquidGlass-wrapper ${radiusClass} ${className}`}>
      <div className={`liquidGlass-effect ${radiusClass}`}></div>
      <div className={`liquidGlass-tint ${radiusClass} bg-white/10`}></div>
      <div className={`liquidGlass-shine ${radiusClass}`}></div>
      <select 
        {...props}
        className="liquidGlass-text w-full bg-transparent outline-none p-3 appearance-none cursor-pointer text-white"
      >
        {children}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/60">
        <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
};
