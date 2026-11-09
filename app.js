(function(){
"use strict";
const D=window.NSIMBI, $=s=>document.querySelector(s), view=$("#view");
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const store={
  get(k,d){try{const v=localStorage.getItem("nsimbi."+k);return v==null?d:JSON.parse(v)}catch(e){return d}},
  set(k,v){try{localStorage.setItem("nsimbi."+k,JSON.stringify(v))}catch(e){}}
};
const nsByName={};D.nsimbi.forEach(n=>nsByName[n.nombre.toLowerCase()]=n);
const mkByBin={};D.makindu.forEach(m=>mkByBin[m.bin]=m);
const camByBin={};D.caminos.forEach(c=>camByBin[c.bin]=c);
const chapterNum=k=>{const m=/(\d+)/.exec(k);return m?+m[1]:null};
const nsLink=n=>nsByName[n.toLowerCase()]?`<a href="#/nsimbi/${encodeURIComponent(n)}">${esc(n)}</a>`:esc(n);
const nsLinks=txt=>txt.split(/\s*,\s*/).map(nsLink).join(", ");
/* ---------- Niveles de evidencia ----------
   No están en el libro Nsimbi. Se toman de cómo el "Manual de Tradiciones Kongo Kalunga"
   (del mismo autor) clasifica ese mismo contenido en su "Compendio de la obra Nsimbi"
   y en sus capítulos de cosmología general. Es una referencia aparte aplicada aquí, no una
   nota del propio libro. */
const EVID_DEF=[
  ["A","Respaldado por literatura académica publicada.","Citar con libro, capítulo y página."],
  ["B","Interpretación razonable apoyada en la literatura.","Presentar como lectura de un autor."],
  ["C","Modelo o reconstrucción propia de este manual.","Presentar siempre como propuesta, no como hecho."],
  ["P","Por localizar: falta referencia exacta.","No usar como prueba hasta encontrar la fuente."]
];
const EVID_COLOR={A:"#5fae7a",B:"#7fa8c9",C:"#e0a93f",P:"#c9503f"};
// nivel por capítulo del libro, según el tema equivalente en el Manual (— = sin equivalente directo, sin insignia)
const EVID_CAP={1:"A",2:"A/B",3:"C/P",4:"C",5:"C",6:"C",7:"C",8:"C",9:"A/B",12:"A",13:"A/B",15:"C",16:"C"};
const evidTip=lv=>EVID_DEF.filter(([k])=>lv.split("/").includes(k)).map(([k,s])=>k+": "+s).join(" · ");
function evidBadge(lv,big){
  if(!lv)return"";
  return `<a href="#/evidencia" class="evid ${big?"big":""}" style="--ec:${EVID_COLOR[lv[0]]}" title="${esc(evidTip(lv))}">${esc(lv)}</a>`;
}
function evidLegendCard(){
  return `<div class="card"><h3>Niveles de evidencia</h3>
  <p class="small mute">Tomados del Manual de Tradiciones Kongo Kalunga (mismo autor), que clasifica así su propio contenido. Esta app los aplica como guía aparte, no como una nota del libro Nsimbi.</p>
  <dl class="kv">${EVID_DEF.map(([k,s,u])=>`<dt><span class="evid big" style="--ec:${EVID_COLOR[k]}">${k}</span></dt><dd><b>${esc(s)}</b><br><span class="small mute">${esc(u)}</span></dd>`).join("")}</dl></div>`;
}
const CFG=window.NSIMBI_CFG||{};
const isLocked=id=>!!(D.lib[id]&&D.lib[id].locked);
const freeNames=()=>D.lib.filter(c=>!c.locked).map(c=>c.kicker.charAt(0)+c.kicker.slice(1).toLowerCase()).join(" y ");
const bisImg=n=>"img/bisinu-"+n.nombre.toLowerCase()+".png";
const FIG={cosmograma:["El cosmograma kongo (dikenga)","img/fig-cosmograma.png"],circuito:["El circuito entre los dos mundos","img/fig-circuito.png"],
  objetos:["Disposición de los cuatro objetos y orden de lectura","img/fig-objetos.png"],chamalongos:["Chamalongos: cinco resultados","img/fig-chamalongos.png"],
  hoja:["Las firmas (bisinu) de los 13 Nsimbi","img/fig-hoja-bisinu.png"]};
const fig=k=>`<figure class="fig"><img src="${FIG[k][1]}" alt="${esc(FIG[k][0])}" loading="lazy"></figure>`;
const CHFIGS={2:["cosmograma","circuito"],5:["objetos","chamalongos"],6:["hoja"]};
const firmaOf=b=>b.split("").map(x=>x==="1"?"■":"●").join("");

/* ---------- Luna y Dikenga ---------- */
function moonAge(d){const ref=Date.UTC(2000,0,6,18,14),syn=29.530588853;
  let a=((d.getTime()-ref)/86400000)%syn; if(a<0)a+=syn; return a}
function moonPhase(age){ // 4 fases del libro (Cap. 7)
  if(age<1.85||age>=27.7) return "Luna nueva";
  if(age<11) return "Luna creciente";
  if(age<18.5) return "Luna llena";
  return "Cuarto menguante";
}
function moonSVG(age,cls){
  const syn=29.530588853, ph=age/syn, r=40, c=50;
  const lit=(1-Math.cos(ph*2*Math.PI))/2; // 0..1
  const waxing=ph<.5, k=Math.cos(ph*2*Math.PI); // 1 nueva .. -1 llena
  const rx=Math.abs(k)*r;
  // lado iluminado: derecha si crece
  const sweepOuter=waxing?1:0;
  const path=`M ${c} ${c-r} A ${r} ${r} 0 0 ${sweepOuter} ${c} ${c+r} A ${rx} ${r} 0 0 ${k>0?1-sweepOuter:sweepOuter} ${c} ${c-r} Z`;
  return `<svg class="${cls||""}" viewBox="0 0 100 100" role="img" aria-label="Luna, ${Math.round(lit*100)}% iluminada">
  <circle cx="50" cy="50" r="40" fill="#0b2a31" stroke="#2a6370"/>
  <path d="${path}" fill="#f2e6bd"/></svg>`;
}
function dikengaNow(d){const h=d.getHours()+d.getMinutes()/60;
  const i=h>=5&&h<11?0:h>=11&&h<17?1:h>=17&&h<23?2:3; return D.dikenga[i]}
const colorOf={Blanco:"#f4f1e8",Rojo:"#c9503f",Negro:"#0b0b0b",Dorado:"#e0a93f"};
function lunaRow(phase){return D.luna.find(r=>r[0].toLowerCase()===phase.toLowerCase())}

/* ---------- Router ---------- */
function parse(){
  const h=location.hash.replace(/^#\/?/,""), [path,qs]=h.split("?");
  return {parts:path.split("/").filter(Boolean).map(decodeURIComponent),q:Object.fromEntries(new URLSearchParams(qs||""))};
}
const routes={"":home,oraculo:oraculo,nsimbi:nsimbi,libro:libro,calendario:calendario,comprar:comprar,evidencia:evidencia};
function evidencia(){
  view.innerHTML=`<p><a href="#/">← Inicio</a></p><h1>De dónde sale cada cosa</h1>
  ${evidLegendCard()}
  <div class="card"><h3>Dónde se usan en esta app</h3><ul class="ticks">
    <li><b>${esc("A — "+"Historia del Reino Kongo, linaje y el Dikenga")}</b> (Cap. 1, 2, 9, 12, 13): documentados en fuentes académicas (MacGaffey, Van Wing, Thompson).</li>
    <li><b>C — El sistema de los 16 Makindu, los 256 caminos, el catálogo de Nsimbi, el calendario de lunas y el Nkisi</b> (Oráculo, Nsimbi, Cap. 5 a 8, Apéndices): es un modelo propio del libro, no una práctica documentada tal cual en archivos históricos.</li>
    <li><b>C/P — La definición y etimología de "Nsimbi"</b> (Cap. 3): propuesta a la espera de una referencia exacta.</li>
  </ul><p class="small mute" style="margin-top:10px">Esta clasificación no está en el libro Nsimbi; se toma de cómo el autor evalúa ese mismo contenido en otro de sus trabajos.</p></div>`;
}
function route(){
  const r=parse(), key=r.parts[0]||"";
  document.querySelectorAll(".tabs a").forEach(a=>{
    const t=a.dataset.tab; a.classList.toggle("on",(key===""&&t==="inicio")||t===key)});
  (routes[key]||home)(r);
  closeSearch();
  if(!(key==="libro"&&r.parts[1])) window.scrollTo(0,0);
  view.focus({preventScroll:true});
}
window.addEventListener("hashchange",route);

/* ---------- Inicio ---------- */
function home(){
  const now=new Date(), age=moonAge(now), ph=moonPhase(age), dk=dikengaNow(now);
  const last=store.get("last",null);
  view.innerHTML=`
  <section class="hero"><img src="cover.jpg" alt="" onerror="this.remove()">
    <div class="in"><h1>NSIMBI</h1><p>Espíritus del agua y del camino</p></div></section>
  <div class="card row" style="gap:16px">
    ${moonSVG(age,"moon")}
    <div style="flex:1;min-width:180px"><div class="mute small">Hoy</div>
      <h3 style="margin:.1em 0">${ph}</h3>
      <div><span class="chip" style="border-color:${colorOf[dk[2]]}">${esc(dk[1])} · ${esc(dk[3])}</span></div>
      <a class="small" href="#/calendario">Ver calendario →</a></div></div>
  ${last?`<a class="card" style="display:block;color:inherit" href="#/libro/${last.id}"><div class="mute small">Seguir leyendo</div><h3>${esc(D.lib[last.id].kicker)} · ${esc(D.lib[last.id].title)}</h3></a>`:""}
  <div class="mods">
    <a class="mod" href="#/oraculo"><span class="g">◈</span><b>Oráculo</b><span>Tirada de los 16 Makindu y los 256 caminos</span></a>
    <a class="mod" href="#/nsimbi"><span class="g">≋</span><b>Nsimbi</b><span>Los 13 espíritus del agua y del camino</span></a>
    <a class="mod" href="#/libro"><span class="g">❡</span><b>El libro</b><span>14 capítulos, apéndices y bibliografía</span></a>
    <a class="mod" href="#/calendario"><span class="g">☾</span><b>Calendario</b><span>Fases lunares y momentos del Dikenga</span></a>
  </div>
  <a class="card" href="#/comprar" style="display:block;color:inherit"><span class="g gold" style="font-size:26px">❡</span> <b style="font-family:var(--serif);font-size:19px">Comprar el libro</b><br><span class="small mute">Libro completo en PDF, enviado a tu correo.</span></a>
  <p class="note">Contenido tomado del libro <i>Nsimbi</i>. Las lecturas de la app son una guía de estudio y orientación, no un diagnóstico. <a href="#/evidencia">Qué tan documentado está cada tema →</a></p>`;
}

/* ---------- Oráculo ---------- */
const POS=["Luvemba","Tukula","Kala","Musoni"]; // izquierda→derecha = posiciones 4,3,2,1
const POSN=[4,3,2,1];
// Chamalongos (4 conchas): cinco resultados, según la figura del libro. "Claras" = cara abierta/blanca = 1.
const CHAM=[["4 claras","Afirmación plena, camino abierto"],["3 claras y 1 oscura","Sí, con una condición o advertencia"],
  ["2 claras y 2 oscuras","Duda o equilibrio: precisar la pregunta"],["1 clara y 3 oscuras","Obstáculo: investigar antes de actuar"],
  ["4 oscuras","Negación fuerte: detenerse y consultar"]];
let mode=store.get("mode","4");            // "4" = tirada de 4 · "2" = doble
let cast4=store.get("cast4","0110");
let cast=store.get("cast",["0101","1010"]);
let busy=false;
const bitsNow=()=>mode==="4"?[cast4]:cast;
function setBits(a){if(mode==="4"){cast4=a[0];store.set("cast4",cast4)}else{cast=a;store.set("cast",cast)}}
const LABEL2=["Camino de Arriba · Nseke <span class=\"mute\">(lo visible)</span>","Camino de Abajo · Mpemba <span class=\"mute\">(la causa oculta)</span>"];

function oraculo(){
  const hist=store.get("hist",[]);
  view.innerHTML=`<h1>Oráculo ${evidBadge("C")}</h1>
  <p class="small mute" style="margin-top:-8px">Sistema reconstruido por el autor a partir del oráculo documentado; no es una práctica transcrita tal cual de un texto histórico. <a href="#/evidencia">Qué significa →</a></p>
  <div class="seg" role="tablist" aria-label="Tipo de tirada">
    <button role="tab" data-m="4" class="${mode==="4"?"on":""}">De 4<small>un Makindu</small></button>
    <button role="tab" data-m="2" class="${mode==="2"?"on":""}">Dobles<small>Nseke + Mpemba</small></button></div>
  <p class="mute small" id="intro"></p>
  <div class="cast" id="cast"></div>
  <div class="row" style="margin:16px 0"><button class="btn" id="tirar">Tirar</button>
    <button class="btn ghost" id="guardar">Guardar lectura</button><span class="mute small" id="cuenta"></span></div>
  <div id="resultado"></div>
  <details class="fold card"><summary>Objetos de tirada y orden de lectura</summary>${fig("objetos")}
    <div class="tw" style="overflow-x:auto"><table class="reader" style="font-size:14px;width:100%"><thead><tr><th>Objeto</th><th>Cara = 1</th><th>Cara = 0</th><th>Fuente</th></tr></thead><tbody>
    ${D.objetos.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div></details>
  <h3 style="margin-top:22px">Lecturas guardadas</h3>
  <ul class="hist" id="hist">${hist.length?hist.map((h,i)=>`<li><span><b>${esc(h.nombre)}</b><br><span class="mute small">${h.t2==="4"?"De 4":"Doble"} · ${esc(h.comb)} · ${new Date(h.t).toLocaleString("es")}</span></span><button class="btn ghost" style="padding:6px 12px;min-height:36px" data-del="${i}">Borrar</button></li>`).join(""):'<li class="mute">Aún no hay lecturas guardadas.</li>'}</ul>`;
  $("#intro").innerHTML=mode==="4"
    ?"<b>Tirada de 4:</b> cuatro objetos, un solo Makindu. Sirve para consultas simples (¿actuar o no?). Se lee de abajo hacia arriba: 1 Musoni → 2 Kala → 3 Tukula → 4 Luvemba. Cara abierta <b>■ = 1</b>, cerrada <b>● = 0</b>."
    :"<b>Tirada doble:</b> dos secuencias de 4 objetos. La primera es el Camino de Arriba (Nseke, lo visible); la segunda, el Camino de Abajo (Mpemba, la causa oculta). Juntas forman el nzila completo (Cap. 5.6). Cara abierta <b>■ = 1</b>, cerrada <b>● = 0</b>.";
  document.querySelectorAll(".seg button").forEach(b=>b.onclick=()=>{if(busy)return;mode=b.dataset.m;store.set("mode",mode);oraculo()});
  drawCast(); drawResult(false);
  $("#tirar").onclick=doCast;
  $("#guardar").onclick=()=>{const h=store.get("hist",[]),b=bitsNow();
    if(mode==="4"){const m=mkByBin[b[0]];h.unshift({t:Date.now(),t2:"4",bin:b,nombre:m.nombre,comb:m.bin})}
    else{const c=camByBin[b[0]+" "+b[1]];h.unshift({t:Date.now(),t2:"2",bin:b,nombre:c.nombre,comb:c.comb})}
    store.set("hist",h.slice(0,50));const g=$("#guardar");g.textContent="✓ Guardada";setTimeout(oraculo,700)};
  $("#hist").onclick=e=>{const b=e.target.closest("[data-del]");if(!b)return;
    const h=store.get("hist",[]);h.splice(+b.dataset.del,1);store.set("hist",h);oraculo()};
}
function coinsHTML(g,bits,spin){
  return bits.split("").map((b,i)=>`<button class="coin b${b} ${spin?"spin":""}" style="animation-delay:${(g*4+i)*110}ms" data-g="${g}" data-i="${i}" aria-label="Posición ${POSN[i]} ${POS[i]}: ${b==="1"?"abierto":"cerrado"}">
      <div class="disc">${b==="1"?"■":"●"}</div><small>${POSN[i]} · ${POS[i]}</small></button>`).join("");
}
function drawCast(spin){
  const bs=bitsNow();
  $("#cast").innerHTML=bs.map((bits,g)=>`<div class="mk"><h4>${mode==="4"?"Makindu":LABEL2[g]}</h4><div class="coins">${coinsHTML(g,bits,spin)}</div></div>`).join("");
  $("#cast").onclick=e=>{if(busy)return;const c=e.target.closest(".coin");if(!c)return;
    const g=+c.dataset.g,i=+c.dataset.i,a=bitsNow().slice(),t=a[g].split("");t[i]=t[i]==="1"?"0":"1";a[g]=t.join("");
    setBits(a);drawCast();drawResult(false)};
}
function doCast(){
  if(busy)return;busy=true;
  const btn=$("#tirar");btn.textContent="Tirando…";btn.disabled=true;
  const rnd=()=>Array.from(crypto.getRandomValues(new Uint8Array(4)),v=>v&1).join("");
  const before=bitsNow().join("|");
  let a=mode==="4"?[rnd()]:[rnd(),rnd()];
  setBits(a);drawCast(true);
  const n=(store.get("n",0))+1;store.set("n",n);
  setTimeout(()=>{
    drawResult(true);busy=false;btn.textContent="Tirar de nuevo";btn.disabled=false;
    $("#cuenta").textContent="Tirada nº "+n;
    $("#resultado").scrollIntoView({behavior:"smooth",block:"start"});
  },(a.length*4)*110+600);
}
function mkCard(m,label,open){
  return `<details class="fold" ${open?"open":""}><summary>${label?`<span class="mute small">${label}</span><br>`:""}<b>${esc(m.nombre)}</b> <span class="firma">${m.firma}</span> <span class="mute small">${m.bin} · ${esc(m.cuadrante)}</span></summary>
    <p class="small mute" style="margin:.4em 0">${esc(m.significado)}</p>
    <p style="margin:.4em 0">${esc(m.analisis)}</p>
    <p class="small">Nsimbi asociado: ${nsLink(m.nsimbi)}</p></details>`;
}
function drawResult(flash){
  const fl=flash?" flash":"", bs=bitsNow();
  if(mode==="4"){
    const bits=bs[0], m=mkByBin[bits], ones=bits.split("").filter(x=>x==="1").length, ch=CHAM[4-ones];
    const pos=D.posiciones.map((r,k)=>{const on=bits[3-k]==="1";
      return `<li><b>${r[0].replace(/\s*\(.*\)/,"")} · ${esc(r[2].split("/")[0].trim())}</b> <span class="mute small">(${esc(r[2].split("/")[1]||"").trim()} · ${esc(r[3])})</span>
        <span class="chip" style="float:right">${on?"■ abierto":"● cerrado"}</span><br><span class="small mute">${esc(r[5])}</span></li>`}).join("");
    $("#resultado").innerHTML=`<div class="card res${fl}"><div class="mute small">Makindu ${m.n} de 16 · ${esc(m.cuadrante)}</div>
      <div class="name">${esc(m.nombre)}</div><div class="firma" style="margin:6px 0">${firmaOf(bits)}</div>
      <div><span class="chip">${m.bin}</span><span class="chip">Nsimbi: ${nsLink(m.nsimbi)}</span></div>
      <p class="small mute" style="margin:.6em 0 0">${esc(m.significado)}</p>
      <p style="font-size:17px;margin:.4em 0 0">${esc(m.analisis)}</p>
      <h3 style="margin-top:16px;font-size:17px">Lectura por posición <span class="mute small">(de abajo a arriba)</span></h3>
      <ul class="hist pos" style="margin:0">${pos}</ul>
      <h3 style="margin-top:16px;font-size:17px">Lectura rápida con chamalongos</h3>
      <p style="margin:.2em 0"><b>${ch[0]}</b> — ${ch[1]}</p>
      <p class="small mute" style="margin:.2em 0">Esquema general divulgado; los matices varían de una casa a otra. Aquí “clara” = cara abierta (1).</p>
      <p class="small" style="margin-top:12px"><a href="#/libro/5">Cómo se lee la tirada (Cap. 5) →</a></p></div>
      <p class="note">Lectura de estudio basada en las tablas de tu libro; no sustituye la consulta con un especialista.</p>`;
    return;
  }
  const c=camByBin[bs[0]+" "+bs[1]], a=mkByBin[bs[0]], b=mkByBin[bs[1]];
  $("#resultado").innerHTML=`<div class="card res${fl}"><div class="mute small">${esc(c.grupo.split("—")[0].trim())} · camino ${c.n} de 256</div>
    <div class="name">${esc(c.nombre)}</div>
    <div class="firma" style="margin:6px 0">${firmaOf(bs[0])} &nbsp; ${firmaOf(bs[1])}</div>
    <div><span class="chip">${esc(c.comb)}</span><span class="chip">${esc(c.bin)}</span></div>
    <p style="font-size:18px;margin:.6em 0 0">${esc(c.interp)}</p>
    ${mkCard(a,"Arriba · Nseke (lo visible)",true)}${mkCard(b,"Abajo · Mpemba (la causa oculta)",true)}
    <p class="small" style="margin-top:12px"><a href="#/libro/5">Cómo se lee la tirada (Cap. 5) →</a></p></div>
    <p class="note">Esta lectura sale de las tablas del Apéndice A y B del libro. Es una referencia de estudio; el libro mismo señala los casos que requieren un especialista.</p>`;
}

/* ---------- Nsimbi ---------- */
function nsimbi(r){
  const nm=r.parts[1];
  if(nm&&nsByName[nm.toLowerCase()]) return nsimbiDetail(nsByName[nm.toLowerCase()]);
  view.innerHTML=`<h1>Los Nsimbi ${evidBadge("C")}</h1><p class="mute small">Espíritus del agua y del camino (Cap. 6). Toca uno para ver su ficha. <a href="#/evidencia">Qué significa la letra →</a></p>
  <input class="search" id="fnx" type="search" placeholder="Filtrar: agua, bosque, cruce…" aria-label="Filtrar Nsimbi">
  <div class="grid" id="ngrid"></div>`;
  const draw=q=>{q=q.toLowerCase();
    $("#ngrid").innerHTML=D.nsimbi.filter(n=>!q||JSON.stringify(n).toLowerCase().includes(q)).map(n=>
    `<a class="ncard" href="#/nsimbi/${encodeURIComponent(n.nombre)}"><b>${esc(n.nombre)}</b><small>${esc(n.tipo.replace(/^Nsimbi (ya )?/,""))}</small><img class="bis-img" src="${bisImg(n)}" alt="Bisinu — ${esc(n.nombre)}" loading="lazy"></a>`).join("")||'<p class="mute">Sin resultados.</p>'};
  draw(""); $("#fnx").oninput=e=>draw(e.target.value);
}
function nsimbiDetail(n){
  const luna=D.luna.filter(r=>r[2].split(/\s*,\s*/).includes(n.nombre));
  const nk=D.nkisi.filter(r=>r[1].split(/\s*\/\s*/).includes(n.nombre));
  const i=D.nsimbi.indexOf(n),prev=D.nsimbi[i-1],next=D.nsimbi[i+1];
  view.innerHTML=`<p><a href="#/nsimbi">← Todos los Nsimbi</a></p>
  <h1>${esc(n.nombre)} ${evidBadge("C")}</h1><p class="gold" style="font-family:var(--serif);font-style:italic;margin-top:-.4em">${esc(n.tipo)}</p>
  <img class="bis-img big" src="${bisImg(n)}" alt="Bisinu — ${esc(n.nombre)}">
  <p class="small mute">${esc(n.firma_txt)}</p>
  <div class="card"><dl class="kv">
    <dt>Función</dt><dd>${esc(n.funcion)}</dd>
    <dt>Localización</dt><dd>${esc(n.lugar)}</dd>
    <dt>Kuntu</dt><dd>${esc(n.kuntu)}</dd>
    <dt>Makindu</dt><dd>${esc(n.makindu)}</dd>
    ${luna.length?`<dt>Luna</dt><dd>${luna.map(r=>esc(r[0])+" — "+esc(r[3])).join("<br>")}</dd>`:""}
    ${nk.length?`<dt>Nkisi</dt><dd>${nk.map(r=>esc(r[0])+": "+esc(r[2])).join("<br>")}</dd>`:""}
  </dl></div>
  ${n.texto.map(t=>`<p style="font-family:var(--serif);font-size:18px;line-height:1.7">${esc(t)}</p>`).join("")}
  ${n.fuentes?`<p class="note">Fuentes: ${esc(n.fuentes)}</p>`:""}
  <div class="pager">${prev?`<a class="btn ghost" href="#/nsimbi/${encodeURIComponent(prev.nombre)}">← ${esc(prev.nombre)}</a>`:"<span></span>"}${next?`<a class="btn ghost" href="#/nsimbi/${encodeURIComponent(next.nombre)}">${esc(next.nombre)} →</a>`:""}</div>`;
}

/* ---------- Libro ---------- */
let lastScrollSave=0;
function libro(r){
  const id=r.parts[1];
  if(id!=null&&D.lib[+id]) return capitulo(+id,r.q);
  const bm=store.get("bm",[]);
  view.innerHTML=`<h1>El libro</h1><a class="card" href="#/comprar" style="display:block;color:inherit"><b>🔒 Muestra gratis</b><br><span class="small mute">Gratis en la app: ${esc(freeNames())}. El libro completo se compra y se envía en PDF a tu correo. Toca aquí.</span></a>
  <p class="mute small">Toca <b>⌕</b> arriba para buscar en todo el texto. Los capítulos marcados con ★ son tus marcadores.</p>
  ${D.lib.map(c=>`<a class="chap" href="#/libro/${c.id}"><span class="k">${esc(c.kicker.length>14?"Anexo":c.kicker)} ${evidBadge(EVID_CAP[c.id])}</span><span class="t">${esc(c.title)}</span><span class="bm">${isLocked(c.id)?"🔒":bm.includes(c.id)?"★":""}</span></a>`).join("")}
  <p class="small mute" style="margin-top:6px">Las letras junto a algunos títulos son el nivel de evidencia. <a href="#/evidencia">Qué significan →</a></p>`;
}
function renderBlock(b,i){
  const [k,v]=b;
  if(k==="h2") return `<h2 data-i="${i}">${esc(v)}</h2>`;
  if(k==="p") return `<p data-i="${i}">${esc(v)}</p>`;
  if(k==="art"){const nm=(v.split(String.fromCharCode(10))[0].split("·")[1]||"").trim(),n=nsByName[nm.toLowerCase()];
    if(n) return `<figure class="fig" data-i="${i}"><img class="bis-img" src="${bisImg(n)}" alt="Bisinu — ${esc(n.nombre)}" loading="lazy"></figure>`;
    return ""}
  const rows=v; let h='<div class="tw" data-i="'+i+'"><table>';
  rows.forEach((r,ri)=>{
    if(r.length===1) h+=`<tr><td class="grp" colspan="9">${esc(r[0])}</td></tr>`;
    else h+="<tr>"+r.map(c=>ri===0?`<th>${esc(c)}</th>`:`<td>${esc(c).replace(/\n/g,"<br>")}</td>`).join("")+"</tr>";
  });
  return h+"</table></div>";
}
function capitulo(id,q){
  if(isLocked(id)) return lockedView(id);
  const c=D.lib[id], bm=store.get("bm",[]), fs=store.get("fs",18);
  document.documentElement.style.setProperty("--fs",fs+"px");
  const h2s=c.blocks.map((b,i)=>b[0]==="h2"?[i,b[1]]:null).filter(Boolean);
  view.innerHTML=`<p><a href="#/libro">← Índice</a></p>
  <div class="tools"><button class="btn ghost" id="fm" aria-label="Texto más pequeño">A−</button><button class="btn ghost" id="fp" aria-label="Texto más grande">A+</button>
   <button class="btn ghost" id="bm">${bm.includes(id)?"★ Guardado":"☆ Marcar"}</button>
   ${h2s.length?`<select class="search" id="sec" style="width:auto;flex:1;margin:0;min-width:140px;padding:8px"><option value="">Ir a sección…</option>${h2s.map(([i,t])=>`<option value="${i}">${esc(t)}</option>`).join("")}</select>`:""}</div>
  <article class="reader"><div class="mute small" style="letter-spacing:.1em;text-transform:uppercase;color:var(--gold)">${esc(c.kicker)} ${evidBadge(EVID_CAP[id])}</div>
  <h1>${esc(c.title)}</h1>${(CHFIGS[id]||[]).map(fig).join("")}${c.blocks.map(renderBlock).join("")}</article>
  <div class="pager">${id>0?`<a class="btn ghost" href="#/libro/${id-1}">← Anterior</a>`:"<span></span>"}${id<D.lib.length-1?`<a class="btn" href="#/libro/${id+1}">Siguiente →</a>`:""}</div>`;
  store.set("last",{id});
  const jump=i=>{const el=view.querySelector(`[data-i="${i}"]`);if(el)el.scrollIntoView({block:"start"})};
  $("#fm").onclick=()=>setFs(-1);$("#fp").onclick=()=>setFs(1);
  function setFs(d){const n=Math.max(14,Math.min(30,store.get("fs",18)+d*2));store.set("fs",n);document.documentElement.style.setProperty("--fs",n+"px")}
  $("#bm").onclick=()=>{let b=store.get("bm",[]);b=b.includes(id)?b.filter(x=>x!==id):b.concat(id);store.set("bm",b);$("#bm").textContent=b.includes(id)?"★ Guardado":"☆ Marcar"};
  const sec=$("#sec");if(sec)sec.onchange=()=>{if(sec.value)jump(sec.value);sec.value=""};
  if(q.b!=null){
    const el=view.querySelector(`[data-i="${q.b}"]`);
    if(el){ if(q.q) highlight(el,q.q); setTimeout(()=>el.scrollIntoView({block:"center"}),30); }
  } else {
    const pos=store.get("pos",{})[id]; window.scrollTo(0,pos||0);
  }
  window.onscroll=()=>{const t=Date.now();if(t-lastScrollSave<400)return;lastScrollSave=t;
    if(!parse().parts.includes(String(id))||parse().parts[0]!=="libro")return;
    const p=store.get("pos",{});p[id]=Math.round(window.scrollY);store.set("pos",p)};
}
function highlight(el,term){
  const re=new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"gi");
  el.querySelectorAll("p,h2,td,th,pre").forEach(n=>{ if(n.children.length&&n.tagName!=="TD")return;
    n.innerHTML=n.innerHTML.replace(re,m=>`<mark>${m}</mark>`)});
  if(!el.querySelector("mark")) el.innerHTML=el.innerHTML.replace(re,m=>`<mark>${m}</mark>`);
}

/* ---------- Búsqueda ---------- */
let idx=null;
function buildIdx(){
  idx=[];
  D.lib.forEach(c=>c.blocks.forEach((b,i)=>{
    const t=b[0]==="table"?b[1].map(r=>r.join(" · ")).join(" | "):b[1];
    idx.push({c:c.id,i,t,k:b[0]});
  }));
}
const norm=s=>s.normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();
function openSearch(){
  if(!idx)buildIdx();
  let ov=$("#ov"); if(ov)return;
  ov=document.createElement("div");ov.id="ov";ov.className="overlay";
  ov.innerHTML=`<div class="box"><div class="row" style="margin-bottom:10px"><input class="search" id="sq" type="search" placeholder="Buscar en todo el libro…" style="flex:1;margin:0" autocomplete="off"><button class="btn ghost" id="sx">Cerrar</button></div>
  <div id="sr" class="mute">Escribe al menos 3 letras.</div></div>`;
  document.body.appendChild(ov);
  const inp=$("#sq");inp.focus();
  $("#sx").onclick=closeSearch;
  inp.oninput=()=>{
    const q=inp.value.trim(); if(q.length<3){$("#sr").innerHTML="Escribe al menos 3 letras.";return}
    const nq=norm(q), out=[];
    for(const e of idx){ const j=norm(e.t).indexOf(nq); if(j<0)continue;
      out.push({e,j}); if(out.length>=80)break; }
    $("#sr").innerHTML=out.length?out.map(({e,j})=>{
      const from=Math.max(0,j-60),s=e.t.slice(from,from+170);
      const c=D.lib[e.c];
      return `<a class="hit" href="#/libro/${c.id}?b=${e.i}&q=${encodeURIComponent(q)}"><b>${esc(c.kicker)} · ${esc(c.title.slice(0,50))}</b>${from?"…":""}${esc(s)}…</a>`}).join("")
      +(out.length>=80?'<p class="mute small">Se muestran los primeros 80 resultados.</p>':""):"Sin resultados.";
  };
  document.addEventListener("keydown",escKey);
}
function escKey(e){if(e.key==="Escape")closeSearch()}
function closeSearch(){const ov=$("#ov");if(ov)ov.remove();document.removeEventListener("keydown",escKey)}
$("#btnBuscar").onclick=openSearch;

/* ---------- Comprar el libro ---------- */
function waHref(msg){
  const n=String(CFG.whatsapp||"").replace(/\D/g,"");
  return n?`https://wa.me/${n}?text=${encodeURIComponent(msg||CFG.mensaje||"")}`:"";
}
function buyButton(label,cls){
  const h=waHref();
  return h?`<a class="btn ${cls||""}" href="${h}" target="_blank" rel="noopener">${esc(label||"Comprar por WhatsApp")}</a>`
          :`<span class="btn ${cls||""}" style="opacity:.55;cursor:not-allowed">${esc(label||"Comprar por WhatsApp")}</span><div class="note">Falta poner tu número de WhatsApp en <b>config.js</b>.</div>`;
}
function lockedView(id){
  const c=D.lib[id];
  view.innerHTML=`<p><a href="#/libro">← Índice</a></p>
  <div class="mute small" style="letter-spacing:.1em;text-transform:uppercase;color:var(--gold)">${esc(c.kicker)}</div>
  <h1>${esc(c.title)}</h1>
  <div class="card res" style="text-align:center"><div style="font-size:42px">🔒</div>
    <h3>Este capítulo está en el libro completo</h3>
    <p class="mute">En la app puedes leer gratis: <b>${esc(freeNames())}</b>. El libro completo se compra y se envía en PDF a tu correo.</p>
    <div class="row" style="justify-content:center">${buyButton("Comprar por WhatsApp")}<a class="btn ghost" href="#/comprar">Ver el libro</a></div></div>`;
}
function comprar(){
  const precio=CFG.precio?esc(CFG.precio):"Consulta el precio por WhatsApp";
  view.innerHTML=`<h1>Comprar el libro</h1>
  <div class="buybox"><img src="portada.jpg" alt="Portada del libro Nsimbi" onerror="this.remove()">
    <div><h2 style="margin:0">NSIMBI</h2><p class="gold" style="font-family:var(--serif);font-style:italic;margin:.2em 0">Espíritus del agua y del camino</p>
    ${CFG.autor?`<p class="small mute" style="margin:.2em 0">Por ${esc(CFG.autor)}</p>`:""}
    <p class="small mute" style="margin:.2em 0">Libro completo en PDF</p>
    <div class="price">${precio}</div></div></div>
  <div class="card"><h3>Qué incluye</h3><ul class="ticks">
    <li>14 capítulos: historia Kongo, el Dikenga, los Nsimbi, el código de los 16 Makindu y los 256 caminos, el nkisi, la diáspora cubana y el Palo Monte</li>
    <li>Apéndices con las tablas completas y bibliografía</li>
    <li>Se envía en PDF a tu correo</li></ul></div>
  <div class="card"><h3>Cómo comprar</h3><ol class="steps">
    <li>Escríbenos por WhatsApp con el botón de abajo y dinos tu correo.</li><li>Te explicamos las formas de pago.</li>
    <li>Cuando se confirme el pago, te enviamos el libro en PDF a tu correo.</li></ol>
    <div style="margin-top:12px">${buyButton("Comprar por WhatsApp")}</div></div>
  <div class="card"><h3>Muestra gratis</h3><p class="mute" style="margin:0">En la app puedes leer gratis: <b>${esc(freeNames())}</b>. <a href="#/libro/1">Leer ahora →</a></p></div>
  <p class="note">El pago y la entrega los acuerdas directamente por WhatsApp. Esta app no recibe pagos ni guarda datos de tarjeta.</p>`;
}

/* ---------- Calendario ---------- */
function calendario(){
  const now=new Date(), age=moonAge(now), ph=moonPhase(age), lr=lunaRow(ph), dk=dikengaNow(now);
  const days=Array.from({length:30},(_,i)=>{const d=new Date(now.getFullYear(),now.getMonth(),now.getDate()+i,12);return {d,a:moonAge(d)}});
  view.innerHTML=`<h1>Calendario</h1>
  <div class="card row" style="gap:16px">${moonSVG(age,"moon")}
    <div style="flex:1;min-width:200px"><div class="mute small">${now.toLocaleDateString("es",{weekday:"long",day:"numeric",month:"long"})} · <span id="upd">actualizado ${now.toLocaleTimeString("es",{hour:"2-digit",minute:"2-digit"})}</span></div>
    <h3 style="margin:.1em 0">${ph}</h3><div class="small mute">Día ${Math.floor(age)+1} del ciclo lunar</div></div></div>
  ${lr?`<div class="card"><h3>Con esta luna ${evidBadge("C")}</h3><p class="mute small" style="margin:0">${esc(lr[1])}</p>
    <p style="margin:.6em 0 .2em"><b>Nsimbi favorecidos:</b> ${nsLinks(lr[2])}</p><p style="margin:0"><b>Tipo de trabajo:</b> ${esc(lr[3])}</p></div>`:""}
  <div class="card"><h3>Ahora: ${esc(dk[1])} <span class="mute small">(${esc(dk[3])})</span></h3>
    <div class="row"><span class="dot" style="background:${colorOf[dk[2]]}"></span><span>${esc(dk[2])} — ${esc(dk[4])}</span></div></div>
  <h3>Próximos 30 días ${evidBadge("C")}</h3>
  <div class="strip">${days.map(({d,a},i)=>`<div class="day ${i===0?"hoy":""}">${d.toLocaleDateString("es",{weekday:"short"})}<br><b>${d.getDate()}</b>${moonSVG(a)}<span>${moonPhase(a).replace("Luna ","").replace("Cuarto ","C. ")}</span></div>`).join("")}</div>
  <h3 style="margin-top:20px">Los cuatro momentos del Dikenga ${evidBadge("A/B")}</h3>${fig("cosmograma")}
  ${D.dikenga.map(r=>`<div class="dk"><span class="dot" style="background:${colorOf[r[2]]}"></span><div><b>${esc(r[1])}</b> · ${esc(r[3])} <span class="mute small">(${esc(r[2])})</span><br><span class="mute small">${esc(r[4])}</span></div></div>`).join("")}
  <h3 style="margin-top:20px">Todas las lunas ${evidBadge("C")}</h3>
  ${D.luna.map(r=>`<div class="card"><b>${esc(r[0])}</b> <span class="mute small">— ${esc(r[1])}</span><br>${nsLinks(r[2])}<br><span class="mute small">${esc(r[3])}</span></div>`).join("")}
  <p class="small mute"><a href="#/evidencia">Qué significan las letras A/B/C →</a></p>
  <p class="note">La fase lunar y el momento del día se calculan en tu dispositivo, de forma aproximada. Las cuatro fases son las del Capítulo 7. Lo de las mareas es astronomía, no tradición: las vivas ocurren en luna nueva y llena, y las muertas en los cuartos. <a href="#/libro/7">Leer el capítulo →</a></p>`;
}

/* Calendario siempre al día: se vuelve a calcular al cambiar el momento del día, la fecha o al volver a la app */
let calStamp="";
const stampNow=()=>{const d=new Date();return d.toDateString()+"|"+dikengaNow(d)[1]};
function refreshLive(force){
  const st=stampNow(); if(!force&&st===calStamp)return; calStamp=st;
  const key=parse().parts[0]||"";
  if((key===""||key==="calendario")&&!document.getElementById("ov")){const y=window.scrollY;routes[key](parse());window.scrollTo(0,y)}
}
setInterval(()=>refreshLive(false),30000);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)refreshLive(false)});
window.addEventListener("focus",()=>refreshLive(false));
window.addEventListener("pageshow",()=>refreshLive(false));
calStamp=stampNow();
route();
if("serviceWorker" in navigator && location.protocol.startsWith("http")){
  navigator.serviceWorker.register("sw.js").catch(()=>{});
}
})();
