function escapeHtml(value) { return value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;'); }

/** Generate a client-only alternative from the same allowlisted package files. */
export function createViteStarter(item, nextFiles) {
  const shared = Object.fromEntries(Object.entries(nextFiles).filter(([name]) => name.startsWith('packages/')));
  return {
    ...shared,
    LICENSE: nextFiles.LICENSE,
    'package.json': JSON.stringify({
      name:'bld8-'+item.id+'-vite-starter',private:true,type:'module',engines:{node:'>=22.13.0 <23'},workspaces:['packages/*'],
      scripts:{dev:'vite --host 127.0.0.1',build:'npm run build --workspace=@bld8/ui && npm run build --workspace=@bld8/blocks && tsc --noEmit && vite build',preview:'vite preview --host 127.0.0.1'},
      dependencies:{'@bld8/ui':'*','@bld8/blocks':'*',react:'19.3.0','react-dom':'19.3.0'},
      devDependencies:{vite:'8.3.4','@vitejs/plugin-react':'6.1.2',typescript:'~5.9.3','@types/node':'^22.0.0','@types/react':'19.3.0','@types/react-dom':'19.3.0'},
    },null,2),
    'index.html': `<!doctype html>\n<html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${escapeHtml(item.name)} — BLD8 UI</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>\n`,
    'src/main.tsx': `import {createRoot} from 'react-dom/client';\nimport {UIProvider} from '@bld8/ui';\nimport '@bld8/ui/styles.css';\nimport '@bld8/blocks/styles.css';\nimport './styles.css';\nimport App from './App';\n\ncreateRoot(document.getElementById('root')!).render(<UIProvider><main><App /></main></UIProvider>);\n`,
    'src/App.tsx': `import {${item.exportName}} from '@bld8/blocks';\n\nexport default function App() {\n  return <div className="bblocks-root"><${item.exportName} /></div>;\n}\n`,
    'src/styles.css':nextFiles['app/globals.css'],
    'src/vite-env.d.ts':'/// <reference types="vite/client" />\n',
    'vite.config.ts':`import {defineConfig} from 'vite';\nimport react from '@vitejs/plugin-react';\n\nexport default defineConfig({plugins:[react()]});\n`,
    'tsconfig.json':JSON.stringify({compilerOptions:{target:'ES2020',lib:['DOM','DOM.Iterable','ESNext'],module:'ESNext',moduleResolution:'Bundler',jsx:'react-jsx',strict:true,noEmit:true,skipLibCheck:true,esModuleInterop:true,resolveJsonModule:true,isolatedModules:true},include:['src','vite.config.ts'],exclude:['node_modules','packages']},null,2),
    '.gitignore':'node_modules/\ndist/\n.env*\n*.tsbuildinfo\n',
    'README.md':`# ${item.name} — React + Vite\n\nThe same BLD8 React components and styles as the Next.js starter, in a client-only Vite application. Both collections are free under MIT.\n\nUse Node 22.13+ within Node 22:\n\n\`\`\`sh\nnpm install\nnpm run dev\n\`\`\`\n\nOpen http://127.0.0.1:5173, or the port printed by Vite if it is occupied. Edit src/App.tsx and src/styles.css; React Fast Refresh updates application edits.\n\n${item.notes}\n\nThe BLD8 packages are included as local workspaces, with editable source and compiled output. npm run build rebuilds both packages, checks application types and creates dist/. npm run preview serves that build locally for review; it is not a production server. If you edit packages/*/src during development, rebuild that package before refreshing; new Tailwind utilities require the included UI build.\n\nThis starter has no Next.js dependency, file-based router, server components, Server Actions or API routes. Connect your own router and backend when needed. Never put server secrets in VITE_* variables: those values are shipped to the browser. Outline stores data in this browser origin; other starters use session-local sample state. Data is not automatically transferred between origins.\n\nTo move an existing Next.js interface, reuse the React components, CSS and data contracts; replace Next-specific routing, image handling, environment wiring and server functions in the host app. The separate HTTP and React Hook Form integration ZIPs currently include a Next.js sample API and are not included here.\n\nFor static hosting publish dist/ after npm run build. Set Vite's base option if hosting under a subpath. Any client router needs host-side history fallback; no router is preinstalled.\n\nKeep LICENSE, SHADCN_LICENSE and all third-party notices. No BLD8 package is fetched from npm.\n`,
  };
}
