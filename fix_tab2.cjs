const fs = require('fs');
let code = fs.readFileSync('src/components/LocalAITab.tsx', 'utf8');

const targetStr = `      let cleanUrl = (settings.phoneLLMUrl || 'http://localhost:9379/v1').trim().replace(/\\\/+\$/, '').replace(/\\\/chat\\\/completions\$/, '');`;
const replacement = `      let activeUrl = settings.useLmStudio ? (settings.lmStudioUrl || 'http://localhost:1234/v1') : (settings.phoneLLMUrl || 'http://localhost:9379/v1');
      let cleanUrl = activeUrl.trim().replace(/\\\/+\$/, '').replace(/\\\/chat\\\/completions\$/, '');`;

code = code.replace(targetStr, replacement);

const targetError = `      setErrorMessage("Nie można połączyć się z lokalnym AI. Sprawdź, czy telefon jest połączony i czy LiteRT-LM jest uruchomiony na http://localhost:9379/v1.");`;
const replacementError = `      setErrorMessage(settings.useLmStudio 
        ? "Nie można połączyć się z LM Studio. Upewnij się, że serwer działa na ustawionym adresie (np. http://localhost:1234/v1)." 
        : "Nie można połączyć się z lokalnym AI (Telefon). Sprawdź, czy telefon jest połączony i czy LiteRT-LM jest uruchomiony.");`;

code = code.replace(targetError, replacementError);

const targetChat = `      let cleanUrl = (settings.phoneLLMUrl || 'http://localhost:9379/v1').trim().replace(/\\\/+\$/, '').replace(/\\\/chat\\\/completions\$/, '');
      const chatEndpoint = cleanUrl.endsWith('/v1') ? \`\${cleanUrl}/chat/completions\` : \`\${cleanUrl}/v1/chat/completions\`;`;
      
const replacementChat = `      let activeUrl = settings.useLmStudio ? (settings.lmStudioUrl || 'http://localhost:1234/v1') : (settings.phoneLLMUrl || 'http://localhost:9379/v1');
      let cleanUrl = activeUrl.trim().replace(/\\\/+\$/, '').replace(/\\\/chat\\\/completions\$/, '');
      const chatEndpoint = cleanUrl.endsWith('/v1') ? \`\${cleanUrl}/chat/completions\` : \`\${cleanUrl}/v1/chat/completions\`;`;

code = code.replace(targetChat, replacementChat);

const targetModel = `model: settings.phoneLLMModel || "gemma-4-E4B-it-gpu.litertlm",`;
const replacementModel = `model: settings.useLmStudio ? (settings.lmStudioModel || 'local-model') : (settings.phoneLLMModel || 'gemma-4-E4B-it-gpu.litertlm'),`;

code = code.replace(targetModel, replacementModel);

const targetTitle = `Czat testowy z Lokalnym modelem`;
const replacementTitle = `{settings.useLmStudio ? 'Czat testowy z LM Studio' : 'Czat testowy z API Telefonu'}`;
code = code.replace(targetTitle, replacementTitle);

const targetPlaceholder = `placeholder="Napisz wiadomość testową do modelu Gemma na telefonie..."`;
const replacementPlaceholder = `placeholder="Napisz wiadomość testową..."`;
code = code.replace(targetPlaceholder, replacementPlaceholder);

fs.writeFileSync('src/components/LocalAITab.tsx', code);
