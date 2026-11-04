// Keep the current section and a route back visible during a long read.
(function(){
  const nav=document.querySelector('#readingNav'),bar=document.querySelector('#readingProgress'),top=document.querySelector('#backTop');
  const strip=nav.querySelector('.masthead-nav')||nav;
  const links=[...strip.querySelectorAll('a[href^="#"]')],sections=links.map(a=>document.querySelector(a.hash));
  let pending=false,shown=-2;
  function update(){
    pending=false;
    const length=document.documentElement.scrollHeight-innerHeight;
    bar.style.width=(length>0?Math.min(100,100*scrollY/length):0)+'%';
    top.hidden=scrollY<innerHeight;
    let current=-1;
    sections.forEach((s,i)=>{if(s&&s.getBoundingClientRect().top<=nav.offsetHeight+50)current=i;});
    links.forEach((a,i)=>{if(i===current)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
    // On narrow screens the section links scroll sideways: keep the current one in view.
    if(current!==shown){shown=current;const a=links[current];
      if(a&&strip.scrollWidth>strip.clientWidth)strip.scrollTo({left:Math.max(0,a.offsetLeft-strip.offsetLeft-(strip.clientWidth-a.offsetWidth)/2)});}
  }
  function schedule(){if(!pending){pending=true;requestAnimationFrame(update);}}
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);
  // The pinned hero is a full-viewport stage with its content at the top. Publish the empty band below that content so the
  // next section can start right under it once the stage unpins (style.css: --hero-slack). Pin and scroll mapping are untouched.
  const track=document.querySelector('#heroTrack'),hero=track&&track.querySelector('.hero');
  function slack(){
    if(!hero)return;let v=0;
    if(!track.classList.contains('hero-static')){
      const kids=[...hero.children].map(e=>e.getBoundingClientRect()),cs=getComputedStyle(hero);
      const need=Math.max(...kids.map(r=>r.bottom))-Math.min(...kids.map(r=>r.top))+parseFloat(cs.paddingTop)+parseFloat(cs.paddingBottom);
      v=Math.max(0,Math.floor(hero.offsetHeight-need));
    }
    document.documentElement.style.setProperty('--hero-slack',v+'px');
  }
  if(hero){slack();addEventListener('resize',slack);addEventListener('load',slack);if(window.ResizeObserver)new ResizeObserver(slack).observe(hero);}
  top.onclick=()=>{location.hash='top';};
  // Appendix disclosures: charts measured while closed (text truncation) are redrawn once on first open, through their own control.
  document.querySelectorAll('details.appendix').forEach(d=>d.addEventListener('toggle',()=>{if(!d.open||d.dataset.drawn)return;d.dataset.drawn='1';
    const c=d.querySelector('#tokenPeriod,#chipStackDate,#priceGroup');if(c)c.dispatchEvent(new Event('change'));dispatchEvent(new Event('resize'));}));
  // A link to something inside a closed appendix opens it.
  const openFor=()=>{const t=location.hash&&document.querySelector(location.hash);const d=t&&t.closest('details.appendix');if(d&&!d.open){d.open=true;t.scrollIntoView();}};
  addEventListener('hashchange',openFor);openFor();
  update();
})();
