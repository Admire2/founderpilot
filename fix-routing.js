const fs = require('fs');
const path = require('path');

const appTsxPath = path.join(__dirname, 'kara-office-mvp/kara-office-ui/src/App.tsx');
let appContent = fs.readFileSync(appTsxPath, 'utf8');

// 1. Inject URL parameter reading
const stateRegex = /const \[activeApp, setActiveApp\] = useState\(['"]dashboard['"]\);/;
const stateReplacement = `const params = new URLSearchParams(window.location.search);
  const isStandaloneWord = params.get('standalone') === 'word';
  const [activeApp, setActiveApp] = useState(isStandaloneWord ? 'word' : 'dashboard');`;

if (!appContent.includes('isStandaloneWord')) {
    appContent = appContent.replace(stateRegex, stateReplacement);
    console.log('✅ App.tsx: Injected URL parameter logic');
}

// 2. Hide sidebar when standalone
const sidebarRegex = /className="w-64 bg-slate-900 text-slate-300 flex flex-col"/;
const sidebarReplacement = 'className={`w-64 bg-slate-900 text-slate-300 flex flex-col ${isStandaloneWord ? "hidden" : ""}`}';

if (!appContent.includes('isStandaloneWord ? "hidden"')) {
    appContent = appContent.replace(sidebarRegex, sidebarReplacement);
    console.log('✅ App.tsx: Injected sidebar hiding logic');
}

fs.writeFileSync(appTsxPath, appContent, 'utf8');
console.log('🎉 Routing patch complete!');
