const fs = require('fs');
let code = fs.readFileSync('src/services/GeminiEngine.ts', 'utf8');

// Add properties
code = code.replace(
  "public phoneLLMModel: string = 'gemma-4-E4B-it-gpu.litertlm';",
  "public phoneLLMModel: string = 'gemma-4-E4B-it-gpu.litertlm';\n  public useLmStudio: boolean = false;\n  public lmStudioUrl: string = 'http://localhost:1234/v1';\n  public lmStudioModel: string = 'local-model';"
);

// Replace condition checks everywhere except inside executePrompt for now
code = code.replace(/\|\| this\.usePhoneLLM/g, "|| this.usePhoneLLM || this.useLmStudio");
code = code.replace(/!this\.usePhoneLLM/g, "!this.usePhoneLLM && !this.useLmStudio");

// But we need to handle the specific logic inside executePrompt
const oldExecuteLogic = `if (this.usePhoneLLM || this.useLmStudio) {
          let cleanUrl = (this.phoneLLMUrl || 'http://localhost:9379/v1').trim().replace(/\\\/+$/, '');`;
const newExecuteLogic = `if (this.usePhoneLLM || this.useLmStudio) {
          let cleanUrl = this.useLmStudio 
            ? (this.lmStudioUrl || 'http://localhost:1234/v1').trim().replace(/\\\/+$/, '')
            : (this.phoneLLMUrl || 'http://localhost:9379/v1').trim().replace(/\\\/+$/, '');
            
          const currentModel = this.useLmStudio 
            ? (this.lmStudioModel || 'local-model') 
            : (this.phoneLLMModel || 'gemma-4-E4B-it-gpu.litertlm');`;

code = code.replace(`if (this.usePhoneLLM || this.useLmStudio) {
          let cleanUrl = (this.phoneLLMUrl || 'http://localhost:9379/v1').trim().replace(/\\\/+$/, '');`, newExecuteLogic);

code = code.replace(`model: this.phoneLLMModel || "gemma-4-E4B-it-gpu.litertlm",`, `model: currentModel,`);

const fallbackCheck = `if (this.usePhoneLLM || this.useLmStudio) {
            return { text: "Nie można połączyć się z lokalnym AI (http://localhost:9379/v1). Sprawdź, czy serwer LiteRT-LM jest uruchomiony.", usage: 0, latency: 0 };
          }`;
const fallbackFix = `if (this.usePhoneLLM || this.useLmStudio) {
            return { text: "Nie można połączyć się z lokalnym API. Sprawdź, czy serwer (LiteRT-LM / LM Studio) jest włączony i działa pod podanym adresem.", usage: 0, latency: 0 };
          }`;
code = code.replace(fallbackCheck, fallbackFix);

fs.writeFileSync('src/services/GeminiEngine.ts', code);
