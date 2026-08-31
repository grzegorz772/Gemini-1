const fs = require('fs');
let code = fs.readFileSync('src/services/GeminiEngine.ts', 'utf8');

const oldCheck = `if (this.usePhoneLLM) {
          let cleanUrl = (this.phoneLLMUrl || 'http://localhost:9379/v1').trim().replace(/\\\/+\$/, '');`;
          
const newCheck = `if (this.usePhoneLLM || this.useLmStudio) {
          let cleanUrl = this.useLmStudio 
            ? (this.lmStudioUrl || 'http://localhost:1234/v1').trim().replace(/\\\/+\$/, '')
            : (this.phoneLLMUrl || 'http://localhost:9379/v1').trim().replace(/\\\/+\$/, '');
            
          const currentModel = this.useLmStudio 
            ? (this.lmStudioModel || 'local-model') 
            : (this.phoneLLMModel || 'gemma-4-E4B-it-gpu.litertlm');`;

code = code.replace(oldCheck, newCheck);

// And fix the currentModel assignment if it was replaced with currentModel before but maybe not?
// It seems it was `model: currentModel,` but let's check
if(!code.includes('model: currentModel,')) {
    code = code.replace(/model: this\.phoneLLMModel \|\| "gemma-4-E4B-it-gpu\.litertlm",/g, "model: currentModel,");
}

fs.writeFileSync('src/services/GeminiEngine.ts', code);
