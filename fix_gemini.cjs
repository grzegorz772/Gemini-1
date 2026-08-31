const fs = require('fs');
let code = fs.readFileSync('src/services/GeminiEngine.ts', 'utf8');

// The original condition in executePrompt was: if (this.usePhoneLLM || this.useLmStudio) { (since we replaced usePhoneLLM)
// Let's just find the section and replace it.

const startStr = `        if (this.usePhoneLLM || this.useLmStudio) {
          let cleanUrl = (this.phoneLLMUrl || 'http://localhost:9379/v1').trim().replace(/\\\/+$/, '');`;
          
const fixedStart = `        if (this.usePhoneLLM || this.useLmStudio) {
          let cleanUrl = this.useLmStudio 
            ? (this.lmStudioUrl || 'http://localhost:1234/v1').trim().replace(/\\\/+$/, '')
            : (this.phoneLLMUrl || 'http://localhost:9379/v1').trim().replace(/\\\/+$/, '');
            
          const currentModel = this.useLmStudio 
            ? (this.lmStudioModel || 'local-model') 
            : (this.phoneLLMModel || 'gemma-4-E4B-it-gpu.litertlm');`;

if(code.includes(startStr)) {
  code = code.replace(startStr, fixedStart);
} else {
  // Try another approach
  code = code.replace(/if \(this\.usePhoneLLM \|\| this\.useLmStudio\) \{\n\s*let cleanUrl = \(this\.phoneLLMUrl \|\| 'http:\/\/localhost:9379\/v1'\)\.trim\(\)\.replace\(\/\\\\\/\\+\$\/, ''\);/, fixedStart);
}

// Ensure model is set correctly
code = code.replace(/model: this\.phoneLLMModel \|\| "gemma-4-E4B-it-gpu\.litertlm",/g, "model: currentModel,");

fs.writeFileSync('src/services/GeminiEngine.ts', code);
