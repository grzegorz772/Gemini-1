const fs = require('fs');
let code = fs.readFileSync('src/components/LocalAITab.tsx', 'utf8');

const statusIcon = `<Smartphone className="text-blue-400" size={24} />`;
const dynStatusIcon = `{settings.useLmStudio ? <Monitor className="text-blue-400" size={24} /> : <Smartphone className="text-blue-400" size={24} />}`;

code = code.replace(statusIcon, dynStatusIcon);

const targetHeader = `<h2 className="text-lg font-bold text-white">Lokalny Model (Telefon)</h2>
            <p className="text-xs text-white/50">Wymaga Termux + LiteRT-LM uruchomionego na telefonie</p>`;

const replacementHeader = `<h2 className="text-lg font-bold text-white">
              {settings.useLmStudio ? 'Lokalny Model (LM Studio)' : 'Lokalny Model (Telefon)'}
            </h2>
            <p className="text-xs text-white/50">
              {settings.useLmStudio ? 'Wymaga uruchomienia LM Studio na PC (Local Inference Server)' : 'Wymaga Termux + LiteRT-LM uruchomionego na telefonie'}
            </p>`;

code = code.replace(targetHeader, replacementHeader);

const successMsg = `Połączono z Lokalnym modelem`;
const dynSuccessMsg = `Połączono z {settings.useLmStudio ? 'LM Studio' : 'API Telefonu'}`;
code = code.replace(successMsg, dynSuccessMsg); // at the top

const successMsg2 = `<span>Połączono z Lokalnym modelem!</span>`;
const dynSuccessMsg2 = `<span>Połączono z {settings.useLmStudio ? 'LM Studio' : 'API Telefonu'}!</span>`;
code = code.replace(successMsg2, dynSuccessMsg2);

const generatingMsg = `<span>Lokalny model przetwarza zapytanie...</span>`;
const dynGeneratingMsg = `<span>{settings.useLmStudio ? 'LM Studio' : 'Lokalny model'} przetwarza zapytanie...</span>`;
code = code.replace(generatingMsg, dynGeneratingMsg);

// Also need to import Monitor from lucide-react
if(!code.includes('Monitor')) {
  code = code.replace('Smartphone,', 'Smartphone, Monitor,');
}

fs.writeFileSync('src/components/LocalAITab.tsx', code);
