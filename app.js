// Lógica base para el MVP - simuladores de prevención de fraude
document.addEventListener('DOMContentLoaded', ()=>{
  const menuBtns = document.querySelectorAll('.menu-btn');
  const overlay = document.getElementById('eduOverlay');
  const modalBody = document.getElementById('modalBody');
  const modalClose = document.getElementById('modalClose');

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
    const reasons = [];
    if(!mail.senderEmail.toLowerCase().endsWith(mail.domainOficial)){
      reasons.push(`<strong>Remitente falso:</strong> Aunque dice ser de "${mail.senderName}", el correo real proviene de <code>${mail.senderEmail.split('@')[1]}</code>. Los correos legítimos terminan estrictamente en <code>${mail.domainOficial}</code>.`);
    }
    if(/\b(urgent|urgente|actualice|verificación|verificar)\b/i.test(mail.subject)){
      reasons.push('<strong>Sentido de urgencia malicioso:</strong> El asunto usa palabras alarmantes como "URGENTE" o amenazas de "bloqueo" para presionarle a actuar rápido y sin pensar.');
    }
    if(mail.link && !mail.link.includes('.cr')){
      reasons.push('<strong>Enlace sospechoso:</strong> La dirección web no utiliza el dominio oficial de Costa Rica (<code>.cr</code>) y redirige a un servidor externo desconocido.');
    }

    modalBody.innerHTML = `
      <p><strong>Correo Electrónico Evaluado:</strong></p>
      <p><em>"${mail.subject}"</em> — ${mail.senderName}</p>
      <hr />
      <p class="alert-title">⚠️ Trampas identificadas en este correo:</p>
      <ul>${reasons.map(r=>`<li>${r}</li>`).join('')}</ul>
      <hr />
      <p><strong>¿Qué debe hacer en la vida real?</strong></p>
      <ul>
        <li><strong>Nunca haga clic</strong> en los enlaces de este tipo de correos ni descargue archivos adjuntos.</li>
        <li>Elimine el correo de su bandeja de entrada inmediatamente.</li>
        <li>Si tiene dudas reales, llame al número oficial del banco impreso en su tarjeta.</li>
      </ul>
    `;
    openModal();
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
        modalBody.innerHTML = `
          <p><strong>Acciones de seguridad recomendadas:</strong></p>
          <ul>
            <li>Bloquee este número telefónico inmediatamente desde los ajustes de su teléfono celular.</li>
            <li>No responda al mensaje bajo ninguna circunstancia; responder confirma al estafador que su línea está activa.</li>
            <li>Recuerde que ninguna entidad bancaria legítima le pedirá códigos de seguridad por mensaje de texto.</li>
          </ul>
        `;
        openModal();
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