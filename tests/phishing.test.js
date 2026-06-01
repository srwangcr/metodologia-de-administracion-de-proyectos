const test = require('node:test');
const assert = require('node:assert/strict');
const { analyzeMail } = require('../src/utils/phishing');

test('detects sender mismatch and urgency and suspicious link', () => {
  const mail = {
    senderEmail: 'soporte@fake-bank.example.com',
    domainOficial: 'bancobcr.com',
    subject: 'URGENTE: Actualice sus datos',
    link: 'http://phish.example/login'
  };

  const reasons = analyzeMail(mail);
  assert.equal(reasons.length, 3);
  assert.equal(reasons.some(r => r.code === 'sender_mismatch'), true);
  assert.equal(reasons.some(r => r.code === 'urgency'), true);
  assert.equal(reasons.some(r => r.code === 'suspicious_link'), true);
});

test('accepts safe mail', () => {
  const mail = {
    senderEmail: 'info@bancobcr.com',
    domainOficial: 'bancobcr.com',
    subject: 'Información de su cuenta',
    link: 'https://bancobcr.com/seguridad'
  };

  const reasons = analyzeMail(mail);
  assert.equal(reasons.length, 0);
});
