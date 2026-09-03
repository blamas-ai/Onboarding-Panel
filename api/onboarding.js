export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      ok: false,
      error: true,
      message: 'Método no permitido.'
    });
  }

  const appsScriptUrl = process.env.APPS_SCRIPT_URL;

  if (!appsScriptUrl) {
    return res.status(500).json({
      ok: false,
      error: true,
      message: 'Falta APPS_SCRIPT_URL.'
    });
  }

  try {
    const response = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify({
        action: req.body?.action,
        payload: req.body?.payload || {}
      }),
      redirect: 'follow'
    });

    const text = await response.text();
    const data = JSON.parse(text);

    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: true,
      message: error.message || 'Error comunicando con Apps Script.'
    });
  }
}
