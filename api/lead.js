// Vercel Function: заявка с хомпейджа → amoCRM через форму amoForms 1751306.
// Настройки сделки (воронка, ответственный, теги) задаются в самой форме в amoCRM.
// Имена полей — общие поля аккаунта, те же, что у форм 1705506 и 1751022;
// если форму в amo пересоздадут с другими полями — обновите AMO_FIELDS.
const AMO = {
  server: 'https://forms.amo-forms.ru',
  formId: '1751306',
  hash: '4549f2f048329fb3c80e459b5b469bee',
};
const AMO_FIELDS = { name: 'fields[name_1]', phone: 'fields[875427_1][1182433]', note: 'fields[note_2]' };
const TIMEOUT_MS = 8000;
const s = (v, max = 300) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }
  let body = req.body || {};
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }

  // honeypot: боты заполняют скрытое поле — отвечаем «ок», но никуда не шлём
  if (s(body.website)) return res.status(200).json({ ok: true });

  const name = s(body.name, 100);
  const digits = s(body.phone, 40).replace(/\D/g, '');
  if (name.length < 2 || !/^998\d{9}$/.test(digits)) {
    return res.status(400).json({ ok: false, error: 'invalid_input' });
  }
  const id = (globalThis.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now());

  const fd = new FormData();
  fd.append(AMO_FIELDS.name, s(body.dealName, 200) || name);
  fd.append(AMO_FIELDS.phone, '+' + digits);
  fd.append(AMO_FIELDS.note, s(body.note, 2000));
  fd.append('form_id', AMO.formId);
  fd.append('hash', AMO.hash);
  fd.append('user_origin', '{}');
  fd.append('form_request_id', id);

  try {
    const r = await fetch(`${AMO.server}/queue/add`, { method: 'POST', body: fd, signal: AbortSignal.timeout(TIMEOUT_MS) });
    const text = await r.text();
    let data = {};
    try { data = JSON.parse(text); } catch {}
    // виджет amo считает отправку успешной только при error_code === 0
    if (!r.ok || data.error_code !== 0) throw new Error(`HTTP ${r.status}: ${text.slice(0, 300)}`);
    console.log('LEAD_OK', JSON.stringify({ id, name, phone: '+' + digits }));
    return res.status(200).json({ ok: true, id });
  } catch (err) {
    console.error('lead: amo failed:', err && err.message);
    return res.status(502).json({ ok: false, error: 'amo_failed' });
  }
};
