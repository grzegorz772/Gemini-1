import React from 'react';
import { motion } from 'motion/react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = "", onClick }) => {
  return (
    <motion.div
      whileHover={onClick ? { scale: 1.02 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={`
        bg-white/10 backdrop-blur-xl border border-white/20 
        rounded-[2rem] shadow-2xl overflow-hidden
        ${className}
      `}
    >
      {children}
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
  const variants = {
    primary: "bg-gradient-to-br from-blue-500/80 to-purple-600/80 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]",
    secondary: "bg-white/20 text-white border border-white/30",
    ghost: "bg-transparent text-white/70 hover:text-white"
  };

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.05, y: -2 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      className={`
        px-6 py-3 rounded-2xl font-medium transition-all duration-300
        ${variants[variant]}
        ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''}
        ${className}
      `}
    >
      {children}
    </motion.button>
  );
};
