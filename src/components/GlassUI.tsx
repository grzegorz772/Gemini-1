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
        bg-white/5 backdrop-blur-3xl border border-white/10 
        rounded-[2rem] overflow-hidden
        ${className}
      `}
      style={{
        boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.2), 0 8px 32px rgba(0, 0, 0, 0.3)"
      }}
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
    primary: "bg-gradient-to-br from-blue-500/80 to-purple-600/80 text-white shadow-[0_8px_20px_rgba(59,130,246,0.3)] border border-white/20",
    secondary: "bg-white/10 backdrop-blur-2xl text-white border border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.2)]",
    ghost: "bg-transparent text-white/70 hover:text-white hover:bg-white/5"
  };

  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.05, y: -2 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      onClick={disabled ? undefined : onClick}
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
