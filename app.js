// Lógica base para el MVP - simuladores de prevención de fraude
document.addEventListener('DOMContentLoaded', ()=>{
  const menuBtns = document.querySelectorAll('.menu-btn');
  const overlay = document.getElementById('eduOverlay');
  const modalBody = document.getElementById('modalBody');
  const modalClose = document.getElementById('modalClose');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const authStatus = document.getElementById('authStatus');
  const profileCard = document.getElementById('profileCard');
  const loadProfileBtn = document.getElementById('loadProfileBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const apiBase = '';
  const tokenKey = 'adultos_mayores_auth_token';

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

  async function loadInteractions(){
    try {
      const data = await apiRequest('/api/admin/interactions');
      interactionsList.innerHTML = data.interactions.map(i=>`<div class="interaction-row"><div><strong>${i.type}</strong> — ${i.action}</div><pre style="white-space:pre-wrap">${JSON.stringify(i.payload)}</pre><small>${i.created_at}</small></div>`).join('');
    } catch (e) { interactionsList.innerHTML = `<div style="color:var(--danger)">${e.message}</div>`; }
  }

  if(refreshUsersBtn) refreshUsersBtn.addEventListener('click', loadUsers);
  if(refreshInteractionsBtn) refreshInteractionsBtn.addEventListener('click', loadInteractions);


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
  }

  // ---------- PHISHING ----------
  const inboxData = [
    {
      senderName: 'Banco Nacional',
      senderEmail: 'soporte@banco-national.example.com',
      subject: 'Actualice sus datos URGENTE',
      snippet: 'Hemos detectado actividad. Actualice en el enlace adjunto para evitar bloqueo.',
      link: 'http://banco-nacional.seguridad-actualizar.example/login',
      domainOficial: 'bncr.fi.cr'
    },
    {
      senderName: 'BCR Atención',
      senderEmail: 'alertas@bcr-seguridad.example.co',
      subject: 'Verificación de cuenta requerida',
      snippet: 'Necesitamos confirmar su identidad. Haga clic para continuar.',
      link: 'http://bcr-verif.example/confirm',
      domainOficial: 'bancobcr.com'
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
    // richer interactive email simulation
    const header = `
      <div class="sim-email-header">
        <div><strong>${mail.senderName}</strong> &lt;${mail.senderEmail}&gt;</div>
        <div><em>Para: usuario@ejemplo.com</em></div>
        <div><small>${new Date().toLocaleString()}</small></div>
      </div>
    `;

    const bodyHtml = `
      <h4>${mail.subject}</h4>
      <p>${mail.snippet}</p>
      ${mail.link ? `<p>Enlace: <a href="#" id="simLink">${mail.link}</a></p>` : ''}
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
    const simLink = document.getElementById('simLink');
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

    if(simLink) simLink.addEventListener('click', (e)=>{ e.preventDefault(); if(openBtn) openBtn.click(); });
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
          <button class="btn secondary btn-reportar">Reportar y Bloquear</button>
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