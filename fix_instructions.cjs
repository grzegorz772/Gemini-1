const fs = require('fs');
let code = fs.readFileSync('src/components/LocalAITab.tsx', 'utf8');

const targetList = `<ol className="list-decimal pl-5 space-y-2 text-sm text-white/60">
          <li>Włącz <strong>Hotspot Wi-Fi</strong> na telefonie (lub tablecie).</li>
          <li>Połącz oba urządzenia do tej samej sieci.</li>
          <li>Sprawdź adres IP telefonu w sieci (często jest to <code>192.168.43.1</code>).</li>
          <li>Uruchom Termux na telefonie.</li>
          <li>Odpal LiteRT-LM (np. poleceniem <code>./litert-lm --model gemma-4-E4B-it-gpu --host 0.0.0.0 --port 9379</code>).</li>
          <li>Wpisz poprawny adres powyżej, kliknij "Test połączenia" lub od razu wyślij wiadomość testową w czacie powyżej.</li>
        </ol>`;

const replacementList = `{settings.useLmStudio ? (
        <ol className="list-decimal pl-5 space-y-2 text-sm text-white/60">
          <li>Zainstaluj i uruchom aplikację <strong>LM Studio</strong> na komputerze.</li>
          <li>Pobierz i załaduj dowolny model z sekcji "Search".</li>
          <li>Przejdź do zakładki <strong>"Local Server"</strong> (ikona podwójnej strzałki/serwera po lewej stronie).</li>
          <li>Kliknij zielony przycisk <strong>Start Server</strong> na górze.</li>
          <li>Upewnij się, że port w LM Studio to <code>1234</code> (domyślny), a adres powyżej to <code>http://localhost:1234/v1</code>.</li>
          <li>Kliknij "Test połączenia", a potem możesz przetestować działanie w oknie czatu wyżej!</li>
        </ol>
        ) : (
        <ol className="list-decimal pl-5 space-y-2 text-sm text-white/60">
          <li>Włącz <strong>Hotspot Wi-Fi</strong> na telefonie (lub tablecie).</li>
          <li>Połącz oba urządzenia do tej samej sieci.</li>
          <li>Sprawdź adres IP telefonu w sieci (często jest to <code>192.168.43.1</code>).</li>
          <li>Uruchom Termux na telefonie.</li>
          <li>Odpal LiteRT-LM (np. poleceniem <code>./litert-lm --model gemma-4-E4B-it-gpu --host 0.0.0.0 --port 9379</code>).</li>
          <li>Wpisz poprawny adres powyżej, kliknij "Test połączenia" lub od razu wyślij wiadomość testową w czacie powyżej.</li>
        </ol>
        )}`;

code = code.replace(targetList, replacementList);
fs.writeFileSync('src/components/LocalAITab.tsx', code);
