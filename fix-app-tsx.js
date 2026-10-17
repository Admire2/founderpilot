const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'kara-browser-mvp/src/App.tsx');
let code = fs.readFileSync(appPath, 'utf8');

// 1. Clean up any previous broken injections
code = code.replace(/const \[isSeekOpen, setIsSeekOpen\] = useState\(false\);/g, '');
code = code.replace(/import KaraSeekSidebar from '\.\/components\/KaraSeekSidebar';/g, '');
code = code.replace(/<button[\s\S]*?Seek[\s\S]*?<\/button>/g, '');
code = code.replace(/<KaraSeekSidebar[\s\S]*?\/>/g, '');
code = code.replace(/<>\s*<\/>/g, ''); // Remove empty fragments

// 2. Add proper imports
if (!code.includes("import React, { useState }")) {
    code = code.replace("import React from 'react';", "import React, { useState } from 'react';");
}
if (!code.includes("KaraSeekSidebar")) {
    code = "import KaraSeekSidebar from './components/KaraSeekSidebar';\n" + code;
}

// 3. Add state inside the App function
if (!code.includes("isSeekOpen")) {
    code = code.replace(
        /(function App\(\)|const App = \(\) =>|export default function App\(\))\s*\{/,
        '$1 {\n  const [isSeekOpen, setIsSeekOpen] = useState(false);'
    );
}

// 4. Safely inject the UI wrapped in a Fragment <> ... </>
if (!code.includes("fixed bottom-4 right-4")) {
    // Wrap the return statement's contents in a Fragment
    code = code.replace(
        /return\s*\(\s*\n?\s*</,
        `return (
    <>
      <button 
        onClick={() => setIsSeekOpen(true)} 
        className="fixed bottom-4 right-4 z-50 bg-cyan-600 hover:bg-cyan-500 text-white p-3 rounded-full shadow-lg flex items-center gap-2 font-bold transition"
      >
        Seek
      </button>
      <KaraSeekSidebar isOpen={isSeekOpen} onClose={() => setIsSeekOpen(false)} />
      <`
    );

    // Close the Fragment before the end of the component
    code = code.replace(
        /(\s+)\)\s*;?\s*\n\s*\}\s*$/,
        `      </>
$1);
}`
    );
}

fs.writeFileSync(appPath, code, 'utf8');
console.log('? App.tsx safely updated with Fragment wrapper!');
