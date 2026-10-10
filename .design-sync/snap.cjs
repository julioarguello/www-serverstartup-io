// Self-contained snapshot of a live page: stylesheets inlined, every URL absolute to the preview host.
// Run from .design-sync/current/ (it writes home.html, cdn.html and integracion.html there): node ../snap.cjs
const B='https://www-serverstartup-io-preview.serverstartup-s-partner-demo-account3612.workers.dev';
const fs=require('fs');
const abs=(u)=>u.startsWith('http')||u.startsWith('data:')||u.startsWith('#')||u.startsWith('mailto:')?u:(u.startsWith('/')?B+u:B+'/'+u);
(async()=>{
 for(const [name,path] of [['home','/'],['cdn','/cdn-waf-seguridad-edge-cloudflare'],['integracion','/integracion-de-sistemas']]){
  let h=await (await fetch(B+path)).text();
  const links=[...h.matchAll(/<link[^>]+rel="stylesheet"[^>]*>/g)].map(m=>m[0]);
  for(const l of links){const href=(l.match(/href="([^"]+)"/)||[])[1];if(!href)continue;
    let css=await (await fetch(abs(href.replace(/&amp;/g,'&')))).text();
    css=css.replace(/url\((['"]?)(\/[^)'"]+)\1\)/g,(m,q,u)=>`url(${q}${B}${u}${q})`);
    h=h.replace(l,`<style data-from="${href}">\n${css}\n</style>`);}
  // module scripts: inline them (the host sends no CORS headers, so a cross-origin module would not run)
  for(const m of [...h.matchAll(/<script([^>]*)src="([^"]+)"([^>]*)><\/script>/g)]){
    const js=await (await fetch(abs(m[2]))).text();
    if(/(?:from|import)\s*["']\.\.?\//.test(js)){h=h.replace(m[0],'');continue;}
    h=h.replace(m[0],`<script${m[1]}${m[3]} data-from="${m[2]}">\n${js.replace(/<\/script/g,'<\\/script')}\n</script>`);}
  // lazy photographs: show them straight away
  h=h.replace(/src="data:image\/gif;base64,[^"]+"\s+data-src="/g,'src="').replace(/data-srcset="/g,'srcset="');
  h=h.replace(/(src|href|poster)="(\/[^"]*)"/g,(m,a,u)=>`${a}="${B}${u}"`);
  h=h.replace(/srcset="([^"]+)"/g,(m,s)=>`srcset="${s.split(',').map(p=>{const t=p.trim().split(/\s+/);t[0]=abs(t[0]);return t.join(' ')}).join(', ')}"`);
  h=h.replace(/url\((['"]?)(\/[^)'"]+)\1\)/g,(m,q,u)=>`url(${q}${B}${u}${q})`);
  h=h.replace('<head>','<head>\n<!-- Snapshot of '+B+path+' taken '+new Date().toISOString().slice(0,10)+' for Claude Design: the live state to refine. -->\n<link rel="stylesheet" href="../../styles.css">');
  h=h.replace('</head>','<style>/* brand faces from this project (the host blocks cross-origin fonts) */:root{--font-sans:"Alexandria";--font-mono:"JetBrains Mono"}</style>\n</head>');
  fs.writeFileSync(name+'.html',h);console.log(name,h.length);
 }
})();
