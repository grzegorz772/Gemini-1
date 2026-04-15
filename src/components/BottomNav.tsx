import React from 'react';
import { motion } from 'motion/react';
import { MessageCircle, User, PenTool, BookOpen, Settings } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'chat', icon: MessageCircle, label: 'Czat' },
    { id: 'writing', icon: PenTool, label: 'Pisanie' },
    { id: 'exercises', icon: BookOpen, label: 'Ćwiczenia' },
    { id: 'profile', icon: User, label: 'Profil' },
  ];

  return (
    <div className="w-full max-w-md mx-auto z-50 flex justify-center pb-6 pt-2 shrink-0 px-4">
      <div className="liquidGlass-wrapper dock w-full max-w-[300px]">
        <div className="liquidGlass-effect"></div>
        <div className="liquidGlass-tint bg-gradient-to-br from-white/10 to-white/5"></div>
        <div className="liquidGlass-shine"></div>
        <div className="liquidGlass-text dock flex justify-between w-full px-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative p-4 group dock-icon"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white/10 rounded-2xl"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon 
                  size={28}
                  className={`relative z-10 transition-colors duration-300 ${
                    isActive ? 'text-blue-400' : 'text-white/60 group-hover:text-white'
                  }`}
                />
                {isActive && (
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-bold text-blue-600 uppercase tracking-widest"
                  >
                    •
                  </motion.span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
