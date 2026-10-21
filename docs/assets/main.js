(function(){
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Particles */
  var c = document.getElementById('particles');
  if (c && c.getContext) {
    var ctx = c.getContext('2d'), P = [], W, H, dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    function size(){
      W = c.clientWidth; H = c.clientHeight;
      c.width = W * dpr; c.height = H * dpr; ctx.setTransform(dpr,0,0,dpr,0,0);
      var n = Math.round(Math.min(110, W * H / 14000));
      P = [];
      for (var i=0;i<n;i++) P.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.6+.4,
        vx:(Math.random()-.5)*.15,vy:-(Math.random()*.25+.05),a:Math.random()*.6+.25,t:Math.random()*6.28});
    }
    function draw(){
      ctx.clearRect(0,0,W,H);
      for (var i=0;i<P.length;i++){
        var p=P[i]; p.x+=p.vx; p.y+=p.vy; p.t+=.02;
        if (p.y<-10){p.y=H+10;p.x=Math.random()*W}
        if (p.x<-10)p.x=W+10; if(p.x>W+10)p.x=-10;
        var a=p.a*(.6+.4*Math.sin(p.t));
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,6.283);
        ctx.fillStyle='rgba(230,205,140,'+a+')'; ctx.shadowColor='rgba(200,169,81,.9)'; ctx.shadowBlur=8; ctx.fill();
      }
      if(!reduce) requestAnimationFrame(draw);
    }
    size(); draw();
    var rt; window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(function(){size(); if(reduce) draw();},150)});
  }

  /* Graph lines */
  var g = document.getElementById('glines');
  if (g) {
    var nodes = document.querySelectorAll('.graph .node'), ns='http://www.w3.org/2000/svg', html='';
    nodes.forEach(function(n){
      var x=parseFloat(n.style.left), y=parseFloat(n.style.top);
      html += '<line x1="50" y1="50" x2="'+x+'" y2="'+y+'" vector-effect="non-scaling-stroke"/>';
      html += '<line class="flow" x1="50" y1="50" x2="'+x+'" y2="'+y+'" vector-effect="non-scaling-stroke"/>';
    });
    // cross links between neighbours (knowledge graph feel)
    var pts=[].map.call(nodes,function(n){return [parseFloat(n.style.left),parseFloat(n.style.top)]});
    pts.sort(function(a,b){return Math.atan2(a[1]-50,a[0]-50)-Math.atan2(b[1]-50,b[0]-50)});
    for(var i=0;i<pts.length;i++){var a=pts[i],b=pts[(i+1)%pts.length];
      html+='<line x1="'+a[0]+'" y1="'+a[1]+'" x2="'+b[0]+'" y2="'+b[1]+'" vector-effect="non-scaling-stroke" style="opacity:.35;stroke-dasharray:2 4"/>';}
    g.innerHTML = html;
  }

  /* Journey cells */
  var cells = document.getElementById('cells');
  if (cells) {
    var f = document.createDocumentFragment();
    for (var d=1; d<=100; d++){ var s=document.createElement('span'); s.className='cell'+(d<=2?' free':''); s.textContent=d; f.appendChild(s); }
    cells.appendChild(f);
  }
  function lightCells(){
    var list = cells ? cells.children : [];
    [].forEach.call(list,function(el,i){ if(i>1) setTimeout(function(){el.classList.add('lit'); setTimeout(function(){el.classList.remove('lit')},700)}, reduce?0:i*18); });
  }

  /* Typing terminals */
  function type(el){
    if (el.dataset.done) return; el.dataset.done=1;
    var lines = JSON.parse(el.getAttribute('data-type')), li=0, ci=0, cur=null, caret=document.createElement('span');
    caret.className='caret'; el.appendChild(caret);
    var tmp=document.createElement('textarea');
    lines = lines.map(function(l){ tmp.innerHTML=l[1]; return [l[0], tmp.value]; });
    if (reduce){ lines.forEach(function(l){var s=document.createElement('span'); if(l[0]) s.className=l[0]; s.textContent=l[1]+'\n'; el.insertBefore(s,caret);}); return; }
    (function step(){
      if (li>=lines.length) return;
      if (!cur){ cur=document.createElement('span'); if(lines[li][0]) cur.className=lines[li][0]; el.insertBefore(cur,caret); }
      var txt=lines[li][1];
      if (ci<txt.length){ cur.textContent+=txt[ci++]; setTimeout(step, 22+Math.random()*30); }
      else { cur.textContent+='\n'; li++; ci=0; cur=null; setTimeout(step, 320); }
    })();
  }

  /* Reveal */
  var obs = 'IntersectionObserver' in window ? new IntersectionObserver(function(es){
    es.forEach(function(e){ if(!e.isIntersecting) return; var t=e.target;
      t.classList.add('in');
      var tb=t.querySelector('[data-type]'); if(tb) setTimeout(function(){type(tb)},400);
      if (t.classList.contains('map')) lightCells();
      obs.unobserve(t);
    });
  },{threshold:.15, rootMargin:'0px 0px -40px 0px'}) : null;
  document.querySelectorAll('.reveal').forEach(function(el){ obs ? obs.observe(el) : el.classList.add('in'); });
  if(!obs) document.querySelectorAll('[data-type]').forEach(type);

  /* Quiz */
  var quiz=document.getElementById('quiz');
  if (quiz) quiz.addEventListener('click', function(e){
    var b=e.target.closest('.opt'); if(!b) return;
    var opts=quiz.querySelectorAll('.opt');
    opts.forEach(function(o){ o.disabled=true; if(o.dataset.ok==='1') o.classList.add('correct'); });
    if (b.dataset.ok!=='1') b.classList.add('wrong');
    document.getElementById('explain').classList.add('show');
  });

  /* Mobile menu */
  var mb=document.getElementById('menuBtn'), dr=document.getElementById('drawer');
  if (mb && dr){
    mb.addEventListener('click',function(){ var o=dr.classList.toggle('open'); mb.setAttribute('aria-expanded',o); });
    dr.addEventListener('click',function(e){ if(e.target.tagName==='A'){ dr.classList.remove('open'); mb.setAttribute('aria-expanded','false'); }});
  }
})();
