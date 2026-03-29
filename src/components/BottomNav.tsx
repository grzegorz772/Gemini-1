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
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50">
      <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-2 flex justify-around items-center shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]" style={{ boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.2), 0 8px 32px rgba(0, 0, 0, 0.3)" }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative p-4 group"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white/10 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon
                size={24}
                className={`relative z-10 transition-colors duration-300 ${
                  isActive ? 'text-blue-400' : 'text-white/40 group-hover:text-white/70'
                }`}
              />
              {isActive && (
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-bold text-blue-400 uppercase tracking-widest"
                >
                  •
                </motion.span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
