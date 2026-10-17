const fs = require('fs');
const path = require('path');

// 1. Patch App.tsx
const appTsxPath = path.join(__dirname, 'kara-office-mvp/kara-office-ui/src/App.tsx');
let appContent = fs.readFileSync(appTsxPath, 'utf8');

// Inject URL parameter reading
const stateRegex = /const \[activeApp, setActiveApp\] = useState\(['"]dashboard['"]\);/;
const stateReplacement = `const params = new URLSearchParams(window.location.search);
  const isStandaloneWord = params.get('standalone') === 'word';
  const [activeApp, setActiveApp] = useState(isStandaloneWord ? 'word' : 'dashboard');`;

if (!appContent.includes('isStandaloneWord')) {
    appContent = appContent.replace(stateRegex, stateReplacement);
    console.log('✅ App.tsx: Injected URL parameter logic');
} else {
    console.log('ℹ️ App.tsx: URL logic already exists');
}

// Hide sidebar when standalone
const sidebarRegex = /className="w-64 bg-slate-900 text-slate-300 flex flex-col"/;
const sidebarReplacement = 'className={`w-64 bg-slate-900 text-slate-300 flex flex-col ${isStandaloneWord ? "hidden" : ""}`}';

if (!appContent.includes('isStandaloneWord ? "hidden"')) {
    appContent = appContent.replace(sidebarRegex, sidebarReplacement);
    console.log('✅ App.tsx: Injected sidebar hiding logic');
} else {
    console.log('ℹ️ App.tsx: Sidebar logic already exists');
}

fs.writeFileSync(appTsxPath, appContent, 'utf8');

// 2. Verify main.cjs
const mainPath = path.join(__dirname, 'kara-desktop/main.cjs');
let mainContent = fs.readFileSync(mainPath, 'utf8');

if (!mainContent.includes('?standalone=word')) {
    console.log('⚠️ main.cjs: Missing standalone URL parameter. Please update main.cjs manually.');
} else {
    console.log('✅ main.cjs: Correctly passes ?standalone=word');
}

console.log('🎉 PATCH COMPLETE!');
