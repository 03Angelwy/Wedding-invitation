(function(){
    // Siempre empezar arriba al cargar/recargar o volver desde el historial
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  function goTop() { window.scrollTo(0, 0); }

  window.addEventListener('load', goTop);           // recarga normal
  window.addEventListener('pageshow', (e) => {      // vuelta desde bfcache (Safari/Firefox)
    if (e.persisted) goTop();
  });
  window.addEventListener('beforeunload', goTop);   // justo antes de salir/recargar
  // Quita el hash de la URL para que no salte a secciones al refrescar
  if (location.hash) {
    history.replaceState(null, '', location.pathname + location.search);
  }

  const cfg = window.INVITE_CONFIG || {};

  const heroEl = document.getElementById("hero");
  const imgs = (cfg.HERO_IMAGES || []).filter(Boolean);
  let idx = 0;
  // Rotación del hero sin pantallazo negro
const showHero = (src) => { if (heroEl) heroEl.style.backgroundImage = `url('${src}')`; };

function swapWhenReady(nextSrc) {
  const im = new Image();
  im.onload  = () => showHero(nextSrc);  // sólo cambia cuando ya cargó
  im.onerror = () => {};                 // opcional: ignora errores
  im.src = nextSrc;
}

// pinta la primera y luego rota
if (imgs.length) {
  showHero(imgs[0]);
  if (imgs.length > 1) {
    setInterval(() => {
      idx = (idx + 1) % imgs.length;
      swapWhenReady(imgs[idx]);
    }, 6000);
  }
}


  const start = new Date(cfg.startLocal || "2025-11-29T16:00:00-06:00");
  const end   = new Date(cfg.endLocal   || "2025-11-29T17:00:00-06:00");
  const fmt = new Intl.DateTimeFormat("es-MX",{weekday:"long",day:"2-digit",month:"long",year:"numeric"});
  const pretty = s => s.charAt(0).toUpperCase()+s.slice(1);
  const dateEl = document.getElementById("wedding-date");
  if(dateEl) dateEl.textContent = pretty(fmt.format(start));

  const dEl = document.getElementById("d-val"),
        hEl = document.getElementById("h-val"),
        mEl = document.getElementById("m-val"),
        sEl = document.getElementById("s-val");
  const pad = n => String(n).padStart(2,"0");
  function tick(){
    const now = new Date();
    let ms = start - now;
    if(ms <= 0){ dEl.textContent=hEl.textContent=mEl.textContent=sEl.textContent="00"; return; }
    const d=Math.floor(ms/86400000); ms-=d*86400000;
    const h=Math.floor(ms/3600000);  ms-=h*3600000;
    const m=Math.floor(ms/60000);    ms-=m*60000;
    const s=Math.floor(ms/1000);
    dEl.textContent=pad(d);hEl.textContent=pad(h);mEl.textContent=pad(m);sEl.textContent=pad(s);
  }
  setInterval(tick,1000); tick();

  const enc = encodeURIComponent;
  const toICSDate = d => d.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}Z$/,"Z");
  const gcalURL = `https://calendar.google.com/calendar/render?action=TEMPLATE`
    + `&text=${enc("Boda de Ángel & Suleydy")}`
    + `&dates=${toICSDate(start)}/${toICSDate(end)}`
    + `&details=${enc("Acompáñanos a celebrar nuestra boda.")}`
    + `&location=${enc("Parroquia [Nombre], [Ciudad / Estado]")}`
    + `&sf=true&output=xml`;
  const gbtn = document.getElementById("btn-gcal");
  if(gbtn){ gbtn.href = gcalURL; }

  const linkI = document.getElementById("link-iglesia");
  const linkR = document.getElementById("link-recepcion");
  if(linkI && cfg.MAPS && cfg.MAPS.IGLESIA) linkI.href = cfg.MAPS.IGLESIA;
  if(linkR && cfg.MAPS && cfg.MAPS.RECEPCION) linkR.href = cfg.MAPS.RECEPCION;

  const galleryImg = document.getElementById("gallery-img");
  const gimgs = (cfg.GALLERY_IMAGES || []).filter(Boolean);
  let gi = 0;
  const gTotalEl = document.getElementById("gallery-total");
  const gIndexEl = document.getElementById("gallery-index");
  function paintGallery(){
    if(!gimgs.length) return;
    galleryImg.src = gimgs[gi];
    if(gIndexEl) gIndexEl.textContent = String(gi+1);
    if(gTotalEl) gTotalEl.textContent = String(gimgs.length);
  }
  paintGallery();
  const prev = document.querySelector(".gallery .prev");
  const next = document.querySelector(".gallery .next");
  if(prev) prev.addEventListener("click", ()=>{ gi = (gi-1+gimgs.length)%gimgs.length; paintGallery(); });
  if(next) next.addEventListener("click", ()=>{ gi = (gi+1)%gimgs.length; paintGallery(); });

  const items = document.querySelectorAll(".t-item");
  const io = new IntersectionObserver(entries=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add("visible"); io.unobserve(e.target);} });
  },{threshold:.15});
  items.forEach(el=>io.observe(el));

  const params = new URLSearchParams(location.search);
  const inviteId = params.get("id") || "";
  const guestNameEl = document.getElementById("guest-name");
  const pasesNumEl  = document.getElementById("pases-num");
  const pasesLblEl  = document.getElementById("pases-label");
  const restricEl   = document.getElementById("restric");
  const btnRSVP     = document.getElementById("btn-rsvp");
  const btnGWallet  = document.getElementById("btn-google-wallet");
  const btnAWallet  = document.getElementById("btn-apple-wallet");

  async function fetchInvite(){
    if(cfg.SHEETS_ENDPOINT){
      const url = `${cfg.SHEETS_ENDPOINT}?id=${encodeURIComponent(inviteId)}`;
      const r = await fetch(url, {cache:"no-store"});
      if(!r.ok) throw new Error("Sheets endpoint error");
      return await r.json();
    }
    const r = await fetch(cfg.LOCAL_SAMPLE_JSON || "data/sample-invitados.json", {cache:"no-store"});
    if(!r.ok) throw new Error("No sample JSON");
    const data = await r.json();
    const row = (data.items||[]).find(x=>String(x.idHash)===String(inviteId)) || (data.items||[])[0];
    return row || {nombre:"Invitado", pases:1, restric:"", walletGoogle:"", walletApple:"", rsvpUrl: cfg.RSVP_FORM_URL};
  }

  function fillInvite(row){
    if(!row) return;
    const nombre = row.nombre || "Invitado";
    const pases  = Number(row.pases || 1);
    const restr  = row.restric || " ";
    const rsvp   = row.rsvpUrl || cfg.RSVP_FORM_URL;

    if(guestNameEl) guestNameEl.textContent = nombre;
    if(pasesNumEl) pasesNumEl.textContent = String(pases);
    if(pasesLblEl) pasesLblEl.textContent = String(pases);
    if(restricEl) restricEl.textContent = restr;
    if(btnRSVP && rsvp){ btnRSVP.onclick = ()=> window.open(rsvp, "_blank", "noopener"); }

    const gUrl = row.walletGoogle || cfg.GOOGLE_WALLET_URL;
    const aUrl = row.walletApple  || cfg.APPLE_WALLET_URL;
    if(btnGWallet){ btnGWallet.style.display = gUrl ? "inline-flex" : "none"; if(gUrl) btnGWallet.href = gUrl; }
    if(btnAWallet){ btnAWallet.style.display = aUrl ? "inline-flex" : "none"; if(aUrl) btnAWallet.href = aUrl; }
  }

  fetchInvite().then(fillInvite).catch(err=>{
    console.warn("Invite data error:", err);
    fillInvite(null);
  });

  const modal = document.getElementById("qr-modal");
  const qrBtn = document.getElementById("btn-qr");
  const qrBox = document.getElementById("qr-canvas");
  const qrText = document.getElementById("qr-text");
  if(qrBtn && modal){
    qrBtn.addEventListener("click", ()=>{
      const payload = JSON.stringify({id: inviteId || "demo", nombre: guestNameEl?.textContent||""});
      if(qrBox){ qrBox.innerHTML=""; if(window.QRCode){ window.QRCode.toCanvas(payload,{width:240},(err,canvas)=>{ if(!err) qrBox.appendChild(canvas); }); } }
      if(qrText) qrText.textContent = payload;
      modal.showModal();
    });
  }
})();
