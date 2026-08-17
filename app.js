// Lógica base para el MVP - simuladores de prevención de fraude
document.addEventListener('DOMContentLoaded', ()=>{
  const menuBtns = document.querySelectorAll('.menu-btn');
  const overlay = document.getElementById('eduOverlay');
  const modalBody = document.getElementById('modalBody');
  const modalClose = document.getElementById('modalClose');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const authStatus = document.getElementById('authStatus');

  // Diagnostics: surface JS errors and unhandled promise rejections to the UI
  window.addEventListener('error', (ev)=>{
    const msg = ev && ev.message ? ev.message : String(ev);
    console.error('Unhandled error:', ev.error || ev.message || ev);
    if(authStatus) authStatus.textContent = `Error JS: ${msg}`;
    // do not interrupt user flow, but make it visible
  });
  window.addEventListener('unhandledrejection', (ev)=>{
    const reason = ev && ev.reason ? (ev.reason.message || String(ev.reason)) : String(ev);
    console.error('Unhandled rejection:', ev.reason || ev);
    if(authStatus) authStatus.textContent = `Promise rejection: ${reason}`;
  });
  console.log('app.js initialized — DOMContentLoaded');
  const profileCard = document.getElementById('profileCard');
  const loadProfileBtn = document.getElementById('loadProfileBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const apiBase = '';
  const tokenKey = 'adultos_mayores_auth_token';
  const fontSizeKey = 'am_base_font_size';
  const ttsEnabledKey = 'am_tts_enabled';
  const contrastKey = 'am_contrast_enabled';

  function setAuthStatus(message, kind = 'info'){
    if(!authStatus) return;
    authStatus.textContent = message;
    authStatus.dataset.kind = kind;
  }

  function getToken(){
    return localStorage.getItem(tokenKey);
  }

  function saveToken(token){
    localStorage.setItem(tokenKey, token);
  }

  // Accessibility: font size and TTS helpers
  function applyFontSize(size){
    document.documentElement.style.setProperty('--base-font-size', size + 'px');
    localStorage.setItem(fontSizeKey, String(size));
  }

  function getSavedFontSize(){
    const v = localStorage.getItem(fontSizeKey);
    return v ? Number(v) : null;
  }

  let ttsEnabled = localStorage.getItem(ttsEnabledKey) === 'true';
  const synth = window.speechSynthesis;
  let currentUtterance = null;

  function speak(text){
    if(!('speechSynthesis' in window)) return;
    stopSpeak();
    try{
      currentUtterance = new SpeechSynthesisUtterance(text);
      currentUtterance.lang = 'es-ES';
      currentUtterance.rate = 1;
      synth.speak(currentUtterance);
    } catch(e) { console.warn('TTS error', e); }
  }

  function stopSpeak(){
    if(synth && synth.speaking) synth.cancel();
    currentUtterance = null;
  }

  function initAccessibilityControls(){
    const inc = document.getElementById('increaseFont');
    const dec = document.getElementById('decreaseFont');
    const tts = document.getElementById('toggleTTS');
    const contrastBtn = document.getElementById('toggleContrast');

    const saved = getSavedFontSize();
    if(saved) applyFontSize(saved);

    if(inc) inc.addEventListener('click', ()=>{
      const current = Number(getComputedStyle(document.documentElement).getPropertyValue('--base-font-size')) || 20;
      const next = Math.min(32, Math.round(current) + 2);
      applyFontSize(next);
      // persist to server if logged in
      if(getToken()) apiRequest('/api/auth/me', { method: 'PUT', body: JSON.stringify({ preferences: { fontSize: next, ttsEnabled } }) }).catch(()=>{});
    });

    if(dec) dec.addEventListener('click', ()=>{
      const current = Number(getComputedStyle(document.documentElement).getPropertyValue('--base-font-size')) || 20;
      const next = Math.max(14, Math.round(current) - 2);
      applyFontSize(next);
      if(getToken()) apiRequest('/api/auth/me', { method: 'PUT', body: JSON.stringify({ preferences: { fontSize: next, ttsEnabled } }) }).catch(()=>{});
    });

    if(tts){
      function updateTTSButton(){ tts.setAttribute('aria-pressed', ttsEnabled ? 'true' : 'false'); tts.textContent = ttsEnabled ? 'Leer (ON)' : 'Leer'; }
      tts.addEventListener('click', ()=>{
        ttsEnabled = !ttsEnabled;
        localStorage.setItem(ttsEnabledKey, String(ttsEnabled));
        updateTTSButton();
        if(!ttsEnabled) stopSpeak(); else {
          // read visible view title and paragraphs
          const view = document.querySelector('.view:not(.hidden)');
          if(view){ const text = Array.from(view.querySelectorAll('h2,h3,p')).map(n=>n.innerText).join('\n'); speak(text); }
          if(getToken()) apiRequest('/api/auth/me', { method: 'PUT', body: JSON.stringify({ preferences: { fontSize: Number(getComputedStyle(document.documentElement).getPropertyValue('--base-font-size')) || 20, ttsEnabled } }) }).catch(()=>{});
        }
      });
      updateTTSButton();
    }

    if(contrastBtn){
      function updateContrast(){
        const on = localStorage.getItem(contrastKey) === 'true';
        contrastBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
        document.body.classList.toggle('high-contrast', on);
      }
      contrastBtn.addEventListener('click', ()=>{
        const current = localStorage.getItem(contrastKey) === 'true';
        localStorage.setItem(contrastKey, String(!current));
        updateContrast();
        // persist to server if logged in
        if(getToken()) apiRequest('/api/auth/me', { method: 'PUT', body: JSON.stringify({ preferences: { fontSize: Number(getComputedStyle(document.documentElement).getPropertyValue('--base-font-size')) || 20, ttsEnabled, highContrast: !current } }) }).catch(()=>{});
      });
      // apply saved value
      const savedContrast = localStorage.getItem(contrastKey) === 'true';
      if(savedContrast) document.body.classList.add('high-contrast');
      updateContrast();
    }
  }

  // ---------- Guided Tutorial ----------
  const tutorialKey = 'am_tutorial_completed';
  const tutorialSteps = [
    { title: 'Bienvenido', body: 'Bienvenido al simulador. Este breve tutorial le muestra las áreas principales: simulador de correos, simulador de mensajes, perfil y controles de accesibilidad.' },
    { title: 'Correos (Phishing)', body: 'En "Simulador de Correos" puede analizar correos sospechosos, ver enlace visible y la URL real, y reportarlos. Use el botón "Analizar Correo".' },
    { title: 'Mensajes / SINPE', body: 'En "Simulador de Mensajes" encontrará ejemplos de SMS y SINPE. Use "¿Qué significa este mensaje?" para ver orientación.' },
    { title: 'Perfil', body: 'En "Mi Perfil" puede actualizar su nombre y contraseña. Sus preferencias de accesibilidad (tamaño y contraste) se guardarán en su cuenta si inicia sesión.' },
    { title: 'Accesibilidad', body: 'Use los botones A- / A+ para cambiar tamaño del texto, "Contraste" para alternar modo alto contraste, y "Leer" (TTS) para que el sistema lea el contenido.' }
  ];

  function showTutorialOverlay(show){
    const o = document.getElementById('tutorialOverlay');
    const content = document.getElementById('tutorialContent');
    if(!o || !content) return;
    o.setAttribute('aria-hidden', show ? 'false' : 'true');
    if(show) { o.style.display = 'flex'; currentTutorial = 0; renderTutorialStep(); document.getElementById('tutorialNext').focus(); }
    else { o.style.display = 'none'; }
  }

  let currentTutorial = 0;
  function renderTutorialStep(){
    const t = tutorialSteps[currentTutorial];
    const content = document.getElementById('tutorialContent');
    if(!content) return;
    content.innerHTML = `<h3>${t.title}</h3><p>${t.body}</p><p style="opacity:0.85;font-size:0.95rem">Paso ${currentTutorial+1} de ${tutorialSteps.length}</p>`;
  }

  document.addEventListener('click', (e)=>{
    if(e.target && e.target.id === 'startTutorial') showTutorialOverlay(true);
    if(e.target && e.target.id === 'tutorialClose') { showTutorialOverlay(false); }
    if(e.target && e.target.id === 'tutorialNext'){
      if(currentTutorial < tutorialSteps.length - 1){ currentTutorial++; renderTutorialStep(); } else {
        // finish
        localStorage.setItem(tutorialKey, 'true');
        if(getToken()) apiRequest('/api/auth/me', { method: 'PUT', body: JSON.stringify({ preferences: { tutorialCompleted: true } }) }).catch(()=>{});
        showTutorialOverlay(false);
      }
    }
    if(e.target && e.target.id === 'tutorialPrev'){ if(currentTutorial > 0) { currentTutorial--; renderTutorialStep(); } }
  });

  // auto show tutorial on first visit (if not completed)
  try{
    const completed = localStorage.getItem(tutorialKey) === 'true';
    if(!completed) setTimeout(()=>{ showTutorialOverlay(true); }, 1200);
  } catch(e){}

  function clearToken(){
    localStorage.removeItem(tokenKey);
  }

  async function apiRequest(path, options = {}){
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    const token = getToken();

    if(token){
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${apiBase}${path}`, {
      ...options,
      headers
    });

    const payload = await response.json().catch(()=>({}));
    if(!response.ok){
      throw new Error(payload.message || 'No fue posible completar la solicitud.');
    }

    return payload;
  }

  function renderProfile(user){
    if(!profileCard) return;
    profileCard.classList.remove('hidden');
    profileCard.innerHTML = `
      <h3>Perfil activo</h3>
      <p><strong>Nombre:</strong> ${user.fullName}</p>
      <p><strong>Correo:</strong> ${user.email}</p>
      <p><strong>Rol:</strong> ${user.role}</p>
    `;
  }

  function resetSessionAfterAccountDeletion(message){
    clearToken();
    setAuthStatus(message, 'neutral');
    if(profileForm) profileForm.reset();
    if(profileCard){
      profileCard.classList.add('hidden');
      profileCard.innerHTML = '';
    }
    showView('home');
  }

  async function loadCurrentUser(){
    const token = getToken();
    if(!token){
      setAuthStatus('Sesión no iniciada.', 'neutral');
      if(profileCard) profileCard.classList.add('hidden');
      return;
    }

    try {
      const data = await apiRequest('/api/auth/me');
      setAuthStatus(`Sesión activa como ${data.user.fullName}.`, 'success');
      renderProfile(data.user);
      // apply persisted preferences if present
      try{
        if(data.user.preferences){
          const prefs = data.user.preferences || {};
          if(prefs.fontSize) applyFontSize(Number(prefs.fontSize));
          if(typeof prefs.ttsEnabled !== 'undefined'){
            ttsEnabled = Boolean(prefs.ttsEnabled);
            localStorage.setItem(ttsEnabledKey, String(ttsEnabled));
            const tbtn = document.getElementById('toggleTTS'); if(tbtn) tbtn.setAttribute('aria-pressed', ttsEnabled ? 'true' : 'false');
          }
        }
      } catch(e){}
    } catch (error) {
      clearToken();
      setAuthStatus(error.message, 'error');
      if(profileCard) profileCard.classList.add('hidden');
    }
  }

  // --- Admin panel functions ---
  const refreshUsersBtn = document.getElementById('refreshUsers');
  const usersList = document.getElementById('usersList');
  const refreshInteractionsBtn = document.getElementById('refreshInteractions');
  const interactionsList = document.getElementById('interactionsList');

  async function loadUsers(){
    try {
      const data = await apiRequest('/api/admin/users');
      usersList.innerHTML = data.users.map(u => `
        <div class="user-row" data-id="${u.id}">
          <div><strong>${u.full_name || u.fullName}</strong> — ${u.email}</div>
          <div>Rol: <select data-role>${u.role}</select> <button data-save class="btn">Guardar</button> <button data-delete class="btn secondary">Borrar</button></div>
        </div>
      `).join('');

      // wire up actions
      usersList.querySelectorAll('[data-id]').forEach(div=>{
        const id = div.dataset.id;
        const sel = div.querySelector('select[data-role]');
        ['user','admin'].forEach(r=>{ const o=document.createElement('option'); o.value=r; o.textContent=r; sel.appendChild(o); });
        sel.value = div.querySelector('select[data-role]').getAttribute('value') || sel.value;
        const save = div.querySelector('[data-save]');
        const del = div.querySelector('[data-delete]');
        save.addEventListener('click', async ()=>{
          const role = sel.value;
          await apiRequest(`/api/admin/users/${id}`, { method: 'PUT', body: JSON.stringify({ role }) });
          await loadUsers();
        });
        del.addEventListener('click', async ()=>{
          if(!confirm('¿Borrar usuario?')) return;
          await apiRequest(`/api/admin/users/${id}`, { method: 'DELETE' });
          await loadUsers();
        });
      });
    } catch (e) { usersList.innerHTML = `<div style="color:var(--danger)">${e.message}</div>`; }
  }

  async function loadMetrics(){
    try{
      const mEl = document.getElementById('metricsSummary');
      if(!mEl) return;
      const data = await apiRequest('/api/admin/metrics');
      mEl.textContent = `Usuarios: ${data.totalUsers} — Interacciones: ${data.totalInteractions}`;
    } catch(e){ /* ignore */ }
  }

  async function loadInteractions(){
    try {
      const data = await apiRequest('/api/admin/interactions');
      interactionsList.innerHTML = data.interactions.map(i=>`<div class="interaction-row"><div><strong>${i.type}</strong> — ${i.action}</div><pre style="white-space:pre-wrap">${JSON.stringify(i.payload)}</pre><small>${i.created_at}</small></div>`).join('');
    } catch (e) { interactionsList.innerHTML = `<div style="color:var(--danger)">${e.message}</div>`; }
  }

  if(refreshUsersBtn) refreshUsersBtn.addEventListener('click', loadUsers);
  if(refreshInteractionsBtn) refreshInteractionsBtn.addEventListener('click', loadInteractions);
  // cargar métricas cuando se refrescan usuarios/interacciones o al abrir admin
  if(refreshUsersBtn) refreshUsersBtn.addEventListener('click', loadMetrics);


  const profileForm = document.getElementById('profileForm');
  const profileName = document.getElementById('profileName');
  const profilePassword = document.getElementById('profilePassword');
  const deleteAccountBtn = document.getElementById('deleteAccountBtn');

  if(profileForm){
    profileForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const fullName = profileName.value.trim();
      const password = profilePassword.value;

      try {
        const payload = {};
        if(fullName) payload.fullName = fullName;
        if(password) payload.password = password;

        const data = await apiRequest('/api/auth/me', { method: 'PUT', body: JSON.stringify(payload) });
        setAuthStatus('Perfil actualizado.', 'success');
        renderProfile(data.user);
        profileForm.reset();
      } catch (error) {
        setAuthStatus(error.message, 'error');
      }
    });
  }

  if(deleteAccountBtn){
    deleteAccountBtn.addEventListener('click', async ()=>{
      if(!confirm('¿Seguro que quiere eliminar su cuenta? Esta acción borrará su perfil y sus datos asociados.')) return;

      try {
        await apiRequest('/api/auth/me', { method: 'DELETE' });
        resetSessionAfterAccountDeletion('Su cuenta fue eliminada correctamente.');
      } catch (error) {
        setAuthStatus(error.message, 'error');
      }
    });
  }

  menuBtns.forEach(b=>b.addEventListener('click', ()=>{
    showView(b.dataset.target);
  }));

  function showView(name){
    document.querySelectorAll('.view').forEach(v=>{
      if(v.id === name){
        v.classList.remove('hidden');
        v.removeAttribute('aria-hidden');
      } else {
        v.classList.add('hidden');
        v.setAttribute('aria-hidden','true');
      }
    });
    if(name === 'phishing') renderInbox();
    if(name === 'sinpe') renderSMS();
    if(name === 'admin') { loadUsers(); loadInteractions(); loadMetrics(); }
  }

  // ---------- PHISHING ----------
  // plantillas de correo enriquecidas para simulaciones
  const inboxData = [
    {
      senderName: 'Banco Nacional',
      senderEmail: 'soporte@banco-national.example.com',
      subject: 'Actualice sus datos URGENTE',
      snippet: 'Hemos detectado actividad. Actualice en el enlace adjunto para evitar bloqueo.',
      link: 'http://banco-nacional.seguridad-actualizar.example/login',
      displayLink: 'https://bncr.li/act',
      attachments: [],
      urgency: 'alta',
      domainOficial: 'bncr.fi.cr'
    },
    {
      senderName: 'BCR Atención',
      senderEmail: 'alertas@bcr-seguridad.example.co',
      subject: 'Verificación de cuenta requerida',
      snippet: 'Necesitamos confirmar su identidad. Haga clic para continuar.',
      link: 'http://bcr-verif.example/confirm',
      displayLink: 'http://bit.ly/3xyzAB',
      attachments: ['informe.pdf'],
      urgency: 'media',
      domainOficial: 'bancobcr.com'
    },
    {
      senderName: 'Comercio Local',
      senderEmail: 'ofertas@tienda-local.example',
      subject: 'Cupón por tiempo limitado para usted',
      snippet: 'Aproveche 50% de descuento. Válido hoy.',
      link: 'http://tienda.example/promocion',
      displayLink: 'https://promo.tl/ahora',
      attachments: [],
      urgency: 'baja',
      domainOficial: 'tienda.example'
    }
  ];

  function renderInbox(){
    const inbox = document.getElementById('inbox');
    if(!inbox) return;
    inbox.innerHTML = '';
    inboxData.forEach((mail, idx)=>{
      const card = document.createElement('article');
      card.className = 'email-card';
      card.innerHTML = `
        <div class="email-header">
          <div>
            <div class="sender">${mail.senderName} <span class="email-address">&lt;${mail.senderEmail}&gt;</span></div>
            <div class="subject">${mail.subject}</div>
          </div>
          <div class="email-actions">
            <button class="link-btn" data-idx="${idx}">Analizar Correo</button>
          </div>
        </div>
        <div class="snippet">${mail.snippet}</div>
        ${mail.displayLink ? `<div style="margin-top:8px;font-size:0.95rem;color:var(--accent)">Enlace visible: ${mail.displayLink}</div>` : ''}
        ${mail.attachments && mail.attachments.length ? `<div style="margin-top:6px;font-size:0.9rem;color:rgba(255,255,255,0.8)">Adjuntos: ${mail.attachments.join(', ')}</div>` : ''}
      `;
      inbox.appendChild(card);
    });

    inbox.querySelectorAll('.link-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        showPhishingModal(inboxData[Number(btn.dataset.idx)]);
      });
    });
  }

  function showPhishingModal(mail){
    // richer interactive email simulation: mostrar link visible vs real, adjuntos y urgencia
    const header = `
      <div class="sim-email-header">
        <div><strong>${mail.senderName}</strong> &lt;${mail.senderEmail}&gt;</div>
        <div><em>Para: usuario@ejemplo.com</em></div>
        <div><small>${new Date().toLocaleString()}</small></div>
      </div>
    `;

    const attachmentsHtml = (mail.attachments && mail.attachments.length) ? `<p>Adjuntos: ${mail.attachments.join(', ')}</p>` : '';
    const urgencyTag = mail.urgency ? `<div style="font-weight:700;color:${mail.urgency==='alta' ? 'var(--danger)' : 'var(--accent)'}">Urgencia: ${mail.urgency}</div>` : '';

    const bodyHtml = `
      <h4>${mail.subject}</h4>
      <p>${mail.snippet}</p>
      ${attachmentsHtml}
      ${urgencyTag}
      ${mail.displayLink ? `<p>Enlace visible: <a href="#" id="simDisplayLink">${mail.displayLink}</a></p>` : ''}
      ${mail.link ? `<p style="font-size:0.9rem;color:rgba(255,255,255,0.7)">URL real: <code>${mail.link}</code></p>` : ''}
    `;

    modalBody.innerHTML = header + bodyHtml + `
      <hr />
      <div class="sim-actions">
        <button id="simReport" class="btn secondary">Reportar</button>
        <button id="simDelete" class="btn">Eliminar</button>
        ${mail.link ? '<button id="simOpen" class="primary">Abrir enlace (simulado)</button>' : ''}
      </div>
      <div id="simFeedback" style="margin-top:12px;font-weight:700;color:var(--accent)"></div>
    `;

    openModal();

    // helper to log interaction (anonymous if no token)
    async function logInteraction(action){
      try {
        await apiRequest('/api/simulations/anonymous/interaction', {
          method: 'POST',
          body: JSON.stringify({ type: 'email', action, payload: mail })
        });
      } catch (e) {
        // fail silently
      }
    }

    const reportBtn = document.getElementById('simReport');
    const deleteBtn = document.getElementById('simDelete');
    const openBtn = document.getElementById('simOpen');
    const simDisplayLink = document.getElementById('simDisplayLink');
    const simFeedback = document.getElementById('simFeedback');

    if(reportBtn) reportBtn.addEventListener('click', async ()=>{
      simFeedback.textContent = 'Correo reportado. Buen trabajo.';
      await logInteraction('report');
    });

    if(deleteBtn) deleteBtn.addEventListener('click', async ()=>{
      simFeedback.textContent = 'Correo eliminado.';
      await logInteraction('delete');
    });

    if(openBtn) openBtn.addEventListener('click', async ()=>{
      simFeedback.textContent = 'Simulación: abrir enlace (NO REAL).';
      await logInteraction('open_link');
    });

    if(simDisplayLink) simDisplayLink.addEventListener('click', (e)=>{ e.preventDefault(); if(openBtn) openBtn.click(); });
  }

  // ---------- SINPE / SMS ----------
  const smsData = [
    {from:'+506 8888-0000', text:'Hola, le entró un SINPE por error por ¢100.000. ¿Me lo devuelve? Responda con el código que le llegó.', type:'sinpe'},
    {from:'+506 7000-1111', text:'¡Felicidades! Ha ganado un premio de un sorteo navideño. Haga clic aquí para reclamar: http://premios.example/obtener', type:'phishing'}
  ];

  function renderSMS(){
    const list = document.getElementById('smsList');
    if(!list) return;
    list.innerHTML = '';

    smsData.forEach((sms, idx)=>{
      const li = document.createElement('li');
      li.className = 'sms-item';
      li.innerHTML = `
        <div class="sms-meta">De: ${sms.from}</div>
        <div class="sms-text">${sms.text}</div>
        <div class="sms-actions">
          <button class="btn btn-guiar" data-idx="${idx}">¿Qué significa este mensaje?</button>
          <button class="btn secondary btn-reportar" data-idx="${idx}">Reportar y Bloquear</button>
        </div>
      `;
      list.appendChild(li);
    });

    list.querySelectorAll('.btn-guiar').forEach(b=>{
      b.addEventListener('click', ()=>{
        showSMSGuidance(smsData[Number(b.dataset.idx)]);
      });
    });

    list.querySelectorAll('.btn-reportar').forEach(b=>{
      b.addEventListener('click', ()=>{
        // more interactive SMS modal
        const sms = smsData[Number(b.dataset.idx)];
        modalBody.innerHTML = `
          <h4>Mensaje de: ${sms.from}</h4>
          <p>${sms.text}</p>
          <div class="sim-actions">
            <button id="simSmsReport" class="btn secondary">Reportar y bloquear</button>
            <button id="simSmsIgnore" class="btn">Ignorar</button>
          </div>
          <div id="simSmsFeedback" style="margin-top:12px;font-weight:700;color:var(--accent)"></div>
        `;
        openModal();

        async function logSms(action){
          try { await apiRequest('/api/simulations/anonymous/interaction', { method: 'POST', body: JSON.stringify({ type: 'sms', action, payload: sms }) }); } catch(e){}
        }

        const r = document.getElementById('simSmsReport');
        const i = document.getElementById('simSmsIgnore');
        const fb = document.getElementById('simSmsFeedback');
        if(r) r.addEventListener('click', async ()=>{ fb.textContent = 'Número bloqueado y reportado.'; await logSms('report'); });
        if(i) i.addEventListener('click', async ()=>{ fb.textContent = 'Mensaje ignorado.'; await logSms('ignore'); });
      });
    });
  }

  function showSMSGuidance(sms){
    let content = `<p><strong>Mensaje de Texto bajo análisis:</strong></p><p><em>"${sms.text}"</em></p><hr/>`;
    if(sms.type==='sinpe'){
      content += `
        <p class="alert-title">⚠️ Alerta: El timo del "Falso SINPE Móvil por error"</p>
        <ul>
          <li><strong>¿Cómo funciona la estafa?</strong> Un desconocido afirma haberle transferido dinero por error y le pide un "código de verificación" SMS.</li>
          <li><strong>El peligro real:</strong> Ese código le da acceso al criminal para vaciar sus cuentas bancarias.</li>
          <li><strong>Regla de oro:</strong> Nunca reenvíe códigos SMS. Verifique su saldo directamente en la aplicación oficial de su banco.</li>
        </ul>`;
    } else {
      content += `
        <p class="alert-title">⚠️ Alerta: Enlace Falso de Premios (Smishing)</p>
        <ul>
          <li>Los premios de sorteos en los que usted no participó son siempre una estafa.</li>
          <li><strong>No toque el enlace.</strong> Puede instalar virus en su celular o llevarle a una página falsa del banco para robar sus contraseñas.</li>
        </ul>`;
    }
    modalBody.innerHTML = content;
    openModal();
  }

  // ---------- Modal ----------
  function openModal(){
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    if(modalClose) setTimeout(()=>modalClose.focus(), 50);
    // si TTS está activo, leer el contenido del modal
    try{
      if(localStorage.getItem(ttsEnabledKey) === 'true'){
        const text = modalBody ? modalBody.innerText : '';
        if(text) speak(text);
      }
    } catch(e){}
  }

  function closeModal(){
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  if(loginForm){
    loginForm.addEventListener('submit', async (event)=>{
      event.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;

      try {
        const data = await apiRequest('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });

        saveToken(data.token);
        setAuthStatus(`Sesión iniciada como ${data.user.fullName}.`, 'success');
        renderProfile(data.user);
        loginForm.reset();
      } catch (error) {
        setAuthStatus(error.message, 'error');
      }
    });
  }

  if(registerForm){
    registerForm.addEventListener('submit', async (event)=>{
      event.preventDefault();
      const fullName = document.getElementById('registerName').value.trim();
      const email = document.getElementById('registerEmail').value.trim();
      const password = document.getElementById('registerPassword').value;

      try {
        await apiRequest('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ fullName, email, password })
        });

        setAuthStatus('Cuenta creada. Ya puede iniciar sesión.', 'success');
        registerForm.reset();
      } catch (error) {
        setAuthStatus(error.message, 'error');
      }
    });
  }

  if(loadProfileBtn){
    loadProfileBtn.addEventListener('click', loadCurrentUser);
  }

  if(logoutBtn){
    logoutBtn.addEventListener('click', ()=>{
      clearToken();
      setAuthStatus('Sesión cerrada.', 'neutral');
      if(profileCard){
        profileCard.classList.add('hidden');
        profileCard.innerHTML = '';
      }
    });
  }

  loadCurrentUser();

  // Initialize accessibility controls (font size, TTS)
  initAccessibilityControls();

  if(modalClose){
    modalClose.addEventListener('click', closeModal);
  }

  if(overlay){
    overlay.addEventListener('click', (e)=>{
      if(e.target === overlay) closeModal();
    });
  }

  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeModal(); });

  showView('home');
});