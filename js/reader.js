// Keep the current section and a route back visible during a long read.
(function(){
  const nav=document.querySelector('#readingNav'),bar=document.querySelector('#readingProgress'),top=document.querySelector('#backTop');
  const links=[...nav.querySelectorAll('a')],sections=links.map(a=>document.querySelector(a.hash));
  let pending=false;
  function update(){
    pending=false;
    const length=document.documentElement.scrollHeight-innerHeight;
    bar.style.width=(length>0?Math.min(100,100*scrollY/length):0)+'%';
    top.hidden=scrollY<innerHeight;
    let current=-1;
    sections.forEach((s,i)=>{if(s&&s.getBoundingClientRect().top<=nav.offsetHeight+50)current=i;});
    links.forEach((a,i)=>{if(i===current)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
  }
  function schedule(){if(!pending){pending=true;requestAnimationFrame(update);}}
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);
  top.onclick=()=>{location.hash='top';};
  update();
})();
