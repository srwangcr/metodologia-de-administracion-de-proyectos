function analyzeMail(mail) {
  const reasons = [];
  if (!mail || typeof mail !== 'object') return reasons;

  const sender = String(mail.senderEmail || '').toLowerCase();
  const domainOficial = String(mail.domainOficial || '').toLowerCase();
  const subject = String(mail.subject || '');
  const link = String(mail.link || '');

  if (sender && domainOficial && !sender.endsWith(domainOficial)) {
    reasons.push({ code: 'sender_mismatch', message: `Remitente falso: origen ${sender}` });
  }

  if (/\b(urgent|urgente|actualice|verificaci[oó]n|verificar)\b/i.test(subject)) {
    reasons.push({ code: 'urgency', message: 'Sentido de urgencia malicioso' });
  }

  if (link) {
    if (domainOficial) {
      if (!link.includes(domainOficial) && !link.includes('.cr')) {
        reasons.push({ code: 'suspicious_link', message: 'Enlace sospechoso' });
      }
    } else if (!link.includes('.cr')) {
      reasons.push({ code: 'suspicious_link', message: 'Enlace sospechoso' });
    }
  }

  return reasons;
}

module.exports = { analyzeMail };
