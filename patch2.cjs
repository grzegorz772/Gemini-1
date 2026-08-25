const fs = require('fs');
let code = fs.readFileSync('src/services/GeminiEngine.ts', 'utf8');

code = code.replace(/if \(this\.useLocalLLM\)/g, 'if (this.useLocalLLM || this.usePhoneLLM)');
code = code.replace(/if \(!this\.useLocalLLM\)/g, 'if (!this.useLocalLLM && !this.usePhoneLLM)');
code = code.replace(/isGemma \|\| this\.useLocalLLM/g, 'isGemma || this.useLocalLLM || this.usePhoneLLM');
code = code.replace(/!this\.useLocalLLM/g, '(!this.useLocalLLM && !this.usePhoneLLM)');

fs.writeFileSync('src/services/GeminiEngine.ts', code);
