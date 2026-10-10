// How many lines a candidate card line renders to, injected into the real card at four viewports.
// Usage: node lines.cjs <lines.json> [url]   (or U=<url>); lines.json = {"key": "markdown-lite line"}
const p=require('puppeteer');
const {pinFrame}=require('./frame.cjs');
const U=process.env.U||process.argv[3]||'http://localhost:8791/entregas/nosotros/Home%20-%20nosotros.html';
const md=s=>s.replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*([^*]+)\*/g,'<em>$1</em>');
const L=JSON.parse(require('fs').readFileSync(process.argv[2],'utf8'));
(async()=>{const b=await p.launch({headless:'new'});const g=await b.newPage();
for(const [w,h,m] of [[1440,900,false],[1280,800,false],[393,852,true],[360,740,true]]){
 await g.setViewport({width:w,height:h,isMobile:m,hasTouch:m,deviceScaleFactor:m?2:1});
 if(!/entregas/.test(U))await g.goto(U,{waitUntil:'networkidle2'});await pinFrame(g,U,5,3000);
 const out=await g.evaluate(async(L)=>{await document.fonts.ready;
  const it=[...document.querySelectorAll('.s-hero__item')].find(e=>getComputedStyle(e).opacity>0.5);
  const leaf=it.querySelector('.s-hero__pitch-item, .s-hero__fact');
  const res={};
  for(const [k,html] of Object.entries(L)){leaf.innerHTML=html;leaf.querySelectorAll('code').forEach(c=>{c.style.fontFamily='"JetBrains Mono",monospace';c.style.fontSize='0.9em'});
   const lh=parseFloat(getComputedStyle(leaf).lineHeight)||parseFloat(getComputedStyle(leaf).fontSize)*1.5;res[k]=Math.round(leaf.getBoundingClientRect().height/lh)+'('+Math.round(lh)+')';}
  return res;},Object.fromEntries(Object.entries(L).map(([k,v])=>[k,md(v)])));
 console.log(w+'x'+h,JSON.stringify(out));}
await b.close()})();
