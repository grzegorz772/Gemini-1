import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

old_feedback = """                  {/* Panel Feedbacku - Prawa strona */}
                  <AnimatePresence mode="popLayout">
                    {writingSentenceFeedback && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="fixed bottom-6 right-6 z-50 w-full max-w-sm"
                      >
                        <div className="bg-gradient-to-br from-amber-900/90 to-black/90 border border-amber-500/30 rounded-2xl p-6 shadow-2xl backdrop-blur-md">"""

new_feedback = """                  {/* Panel Feedbacku - Prawa strona */}
                  <AnimatePresence mode="popLayout">
                    {writingSentenceFeedback && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20, width: 0 }}
                        animate={{ opacity: 1, x: 0, width: 'auto' }}
                        exit={{ opacity: 0, x: 20, width: 0 }}
                        className="w-full md:w-80 shrink-0"
                      >
                        <div className="bg-gradient-to-br from-amber-500/10 to-amber-900/20 border border-amber-500/30 rounded-[2rem] p-6 shadow-2xl backdrop-blur-md h-full overflow-y-auto custom-scrollbar">"""

content = content.replace(old_feedback, new_feedback)

with open('src/App.tsx', 'w') as f:
    f.write(content)
