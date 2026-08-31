const fs = require('fs');
let code = fs.readFileSync('src/components/LocalAITab.tsx', 'utf8');

if (!code.includes('Monitor')) {
  code = code.replace(/import \{([^}]+)\} from 'lucide-react';/, function(match, p1) {
    if (!p1.includes('Monitor')) {
      return "import {" + p1 + ", Monitor} from 'lucide-react';";
    }
    return match;
  });
  fs.writeFileSync('src/components/LocalAITab.tsx', code);
}
