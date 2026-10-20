const APPS_SCRIPT_PATTERN =
  /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec(?:\?.*)?$/;

async function callAppsScript(url, action, payload) {
  const response = await fetch(url, {
    method: 'POST',
    redirect: 'follow',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Accept': 'application/json, text/plain, */*'
    },
    body: JSON.stringify({
      action,
      payload: payload || {}
    })
  });

  const raw = await response.text();

  let data = null;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch (_) {}

  return {
    ok: response.ok,
    status: response.status,
    contentType: String(response.headers.get('content-type') || ''),
    finalUrl: String(response.url || ''),
    raw,
    data
  };
}

export default async function handler(req, res) {
  // Esta función SIEMPRE intenta responder JSON al navegador.
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  try {
    const appsScriptUrl = String(process.env.APPS_SCRIPT_URL || '').trim();

    if (!appsScriptUrl) {
      return res.status(500).json({
        ok: false,
        error: true,
        code: 'MISSING_ENV',
        message: 'Falta APPS_SCRIPT_URL en Vercel.'
      });
    }

    if (!APPS_SCRIPT_PATTERN.test(appsScriptUrl)) {
      return res.status(500).json({
        ok: false,
        error: true,
        code: 'INVALID_ENV_URL',
        message: 'APPS_SCRIPT_URL debe terminar en /exec.'
      });
    }

    // Diagnóstico del puente Vercel -> Apps Script.
    if (req.method === 'GET') {
      const upstream = await callAppsScript(
        appsScriptUrl,
        'getPanelHealth',
        { source: 'vercel-health-check' }
      );

      if (!upstream.data) {
        return res.status(502).json({
          ok: false,
          error: true,
          code: 'UPSTREAM_NOT_JSON',
          message: 'Apps Script respondió contenido no JSON.',
          upstreamStatus: upstream.status,
          contentType: upstream.contentType,
          finalUrl: upstream.finalUrl,
          preview: String(upstream.raw || '')
            .replace(/\s+/g, ' ')
            .slice(0, 350)
        });
      }

      return res.status(200).json({
        ok: true,
        bridge: 'OK',
        upstream: upstream.data
      });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({
        ok: false,
        error: true,
        code: 'METHOD_NOT_ALLOWED',
        message: 'Método no permitido.'
      });
    }

    const body = req.body || {};
    const action = String(body.action || '').trim();
    const payload = body.payload || {};

    if (!action) {
      return res.status(400).json({
        ok: false,
        error: true,
        code: 'MISSING_ACTION',
        message: 'Falta indicar la acción.'
      });
    }

    const upstream = await callAppsScript(
      appsScriptUrl,
      action,
      payload
    );

    if (!upstream.data) {
      return res.status(502).json({
        ok: false,
        error: true,
        code: 'UPSTREAM_NOT_JSON',
        message: 'Apps Script no devolvió JSON.',
        requestedAction: action,
        upstreamStatus: upstream.status,
        contentType: upstream.contentType,
        finalUrl: upstream.finalUrl,
        preview: String(upstream.raw || '')
          .replace(/\s+/g, ' ')
          .slice(0, 350)
      });
    }

    // Si Apps Script devolvió JSON, lo reenviamos tal cual.
    return res.status(200).json(upstream.data);

  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: true,
      code: 'VERCEL_FUNCTION_ERROR',
      message:
        (error && error.message) ||
        'Error inesperado en api/onboarding.js.'
    });
  }
}
