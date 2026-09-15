export default async function handler(req, res) {
  // Siempre responder JSON para que el frontend nunca reciba una página HTML
  // cuando espera una respuesta del backend.
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      service: 'onboarding-api',
      message: 'API de Onboarding activa.'
    });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({
      ok: false,
      error: true,
      message: 'Método no permitido.'
    });
  }

  const APPS_SCRIPT_URL = String(process.env.APPS_SCRIPT_URL || '').trim();

  if (!APPS_SCRIPT_URL) {
    return res.status(500).json({
      ok: false,
      error: true,
      message: 'Falta configurar APPS_SCRIPT_URL en Vercel.'
    });
  }

  if (!/\/exec(?:\?.*)?$/.test(APPS_SCRIPT_URL)) {
    return res.status(500).json({
      ok: false,
      error: true,
      message: 'APPS_SCRIPT_URL debe ser la URL publicada de Apps Script terminada en /exec.'
    });
  }

  const body = req.body || {};
  const action = String(body.action || '').trim();
  const payload = body.payload || {};

  if (!action) {
    return res.status(400).json({
      ok: false,
      error: true,
      message: 'Falta indicar la acción.'
    });
  }

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        // Apps Script funciona de forma más estable recibiendo el JSON como text/plain.
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify({
        action,
        payload
      })
    });

    const raw = await response.text();
    let data;

    try {
      data = raw ? JSON.parse(raw) : {};
    } catch (parseError) {
      const preview = String(raw || '')
        .replace(/\s+/g, ' ')
        .slice(0, 180);

      return res.status(502).json({
        ok: false,
        error: true,
        message:
          'Apps Script no devolvió JSON. Revisá que APPS_SCRIPT_URL sea la implementación vigente /exec.',
        detail: preview
      });
    }

    // El apiRouter de Apps Script devuelve HTTP 200 incluso para errores funcionales,
    // por eso preservamos su payload completo.
    if (!response.ok) {
      return res.status(502).json({
        ok: false,
        error: true,
        message:
          (data && (data.message || data.error)) ||
          ('Apps Script respondió HTTP ' + response.status)
      });
    }

    return res.status(200).json(data);

  } catch (error) {
    return res.status(502).json({
      ok: false,
      error: true,
      message:
        (error && error.message) ||
        'No se pudo conectar con Apps Script.'
    });
  }
}
