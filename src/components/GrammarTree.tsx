import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, CheckSquare, Square } from 'lucide-react';
import { GrammarSection, GrammarSubsection } from '../types';
import { GlassCard } from './GlassUI';

export interface SelectedTopic {
  title: string;
  levelInfo?: string[];
}

interface GrammarTreeProps {
  sections: GrammarSection[];
  selectedTopics: SelectedTopic[];
  onToggleTopic: (item: GrammarSubsection) => void;
  cefrLevel: string;
}

const SubsectionItem: React.FC<{ 
  item: GrammarSubsection; 
  level: number; 
  selectedTopics: SelectedTopic[];
  onToggleTopic: (item: GrammarSubsection) => void;
  cefrLevel: string;
}> = ({ item, level, selectedTopics, onToggleTopic, cefrLevel }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasSubsections = item.subsections && item.subsections.length > 0;
  const currentLevelInfo = item.levelInfo?.[cefrLevel];
  const isSelected = selectedTopics.some(t => t.title === item.title);

  return (
    <div className="w-full">
      <div 
        className={`
          flex items-start justify-between p-3 rounded-xl transition-all group
          ${level === 0 ? 'bg-white/5 backdrop-blur-xl border border-white/10 mb-2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'hover:bg-white/5'}
          ${isSelected ? 'bg-blue-500/10 border-blue-500/30 shadow-[inset_0_1px_1px_rgba(59,130,246,0.2)]' : ''}
        `}
      >
        <div 
          className="flex items-start gap-2 flex-1 cursor-pointer pr-2"
          onClick={() => (hasSubsections || currentLevelInfo) && setIsExpanded(!isExpanded)}
        >
          {(hasSubsections || currentLevelInfo) && (
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              className="mt-0.5 shrink-0"
            >
              <ChevronRight size={16} className="text-white/40" />
            </motion.div>
          )}
          <span className={`text-sm font-medium leading-snug ${!(hasSubsections || currentLevelInfo) ? 'ml-6' : ''} ${isSelected ? 'text-blue-400' : ''}`}>
            {item.title}
          </span>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleTopic(item);
          }}
          className={`shrink-0 p-1.5 rounded-lg transition-colors ${isSelected ? 'text-blue-400' : 'text-white/40 hover:bg-white/10 group-hover:opacity-100 opacity-40'}`}
          title={isSelected ? "Odznacz temat" : "Zaznacz temat"}
        >
          {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (hasSubsections || currentLevelInfo) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden ml-4 border-l border-white/10"
          >
            <div className="py-1 px-3">
              {currentLevelInfo && (
                <div className="mb-4 space-y-1">
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Zakres dla poziomu {cefrLevel}:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {currentLevelInfo.map((info, i) => (
                      <li key={i} className="text-xs text-white/60 leading-relaxed">{info}</li>
                    ))}
                  </ul>
                </div>
              )}
              {hasSubsections && item.subsections!.map((sub) => (
                <SubsectionItem 
                  key={sub.id} 
                  item={sub} 
                  level={level + 1} 
                  selectedTopics={selectedTopics}
                  onToggleTopic={onToggleTopic} 
                  cefrLevel={cefrLevel}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const GrammarTree: React.FC<GrammarTreeProps> = ({ sections, selectedTopics, onToggleTopic, cefrLevel }) => {
  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <div key={section.id} className="space-y-2">
          <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest px-2 mt-4 mb-2">
            {section.title}
          </h3>
          <div className="space-y-1">
            {section.subsections.map((sub) => (
              <SubsectionItem 
                key={sub.id} 
                item={sub} 
                level={0} 
                selectedTopics={selectedTopics}
                onToggleTopic={onToggleTopic} 
                cefrLevel={cefrLevel}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
