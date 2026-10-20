(()=>{
const calm=matchMedia('(prefers-reduced-motion: reduce)').matches;
if(!calm)document.documentElement.classList.add('asm');
const openHash=()=>{const id=location.hash.slice(1);if(!id)return;const el=document.getElementById(id);if(!el)return;const d=el.closest('details');if(d&&!d.open){d.open=true;requestAnimationFrame(()=>scrollTo({top:el.getBoundingClientRect().top+scrollY-96}))}};
addEventListener('hashchange',openHash);openHash();
const pls=[...document.querySelectorAll('.pl')];
const cells=[...document.querySelectorAll('.sp-c[data-l],.m-lk[data-l]')];
const set=n=>cells.forEach(c=>{const on=c.dataset.l===n;c.classList.toggle('on',on);if(c.classList.contains('sp-c'))on?c.setAttribute('aria-current','true'):c.removeAttribute('aria-current')});
if('IntersectionObserver' in window){
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)set(e.target.dataset.l)}),{rootMargin:'-30% 0px -65% 0px'});pls.forEach(p=>io.observe(p));
  const h=document.querySelector('.hero');h&&new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)set('')}),{rootMargin:'-30% 0px -65% 0px'}).observe(h);
}
})();
