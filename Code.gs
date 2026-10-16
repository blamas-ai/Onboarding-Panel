/****************************************************
 * SISTEMA ONBOARDING LEBANE — Code.gs
 ****************************************************/

const MAIN_SPREADSHEET_ID = '1YBmZYsih2-C7ScUL3RmrZ0GQYNGng2jknzjaZs8v3I8';
var _MAIN_SS_CACHE = null;

const LEBANE = {
  timezone: 'America/Argentina/Buenos_Aires',

  sheets: {
    clients:   'Clientes y etapas',
    calendar:  'Calendario',
    history:   'Histórico clientes',
    audit:     'Auditoría',
    unmatched: 'Respuestas sin match',
    config:    'Configuración',
    payments:  'Payments'
  },

  form: {
    spreadsheetId: '1drL-Nkujq5itFF0Uq4o9vNvVPdArPovntKluBQ7t3rY',
    gid: 1304780074,
    publicFormUrl: 'https://forms.gle/XEMa3hQy6n3oTwgR8',
    syncFrom: '2026-09-01'
  },

  om: ['Agustin', 'Gabriela H', 'Julieta', 'Brisa'],
  am: ['a.nunez@lebane.app', 'g.murillo@lebane.app'],

  omCalendars: {
    'Agustin':  'https://calendly.com/a-serrano-lebane/45min',
    'Gabriela H':  'https://calendly.com/g-hernandez-lebane/45min',
    'Julieta':  'https://calendly.com/j-cecchettini-lebane/nueva-reunion',
    'Brisa': 'https://calendly.com/b-morello-lebane'
  }
};

/****************************************************
 * SPREADSHEET
 ****************************************************/
function getMainSpreadsheet_() {
  // Evita abrir el mismo Spreadsheet varias veces dentro de una misma ejecución.
  if (_MAIN_SS_CACHE) return _MAIN_SS_CACHE;

  if (MAIN_SPREADSHEET_ID && MAIN_SPREADSHEET_ID.length > 10) {
    _MAIN_SS_CACHE = SpreadsheetApp.openById(MAIN_SPREADSHEET_ID);
    return _MAIN_SS_CACHE;
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss) {
    _MAIN_SS_CACHE = ss;
    return _MAIN_SS_CACHE;
  }

  throw new Error('No se encontró el Spreadsheet principal. Completá MAIN_SPREADSHEET_ID.');
}

/****************************************************
 * MENÚ
 ****************************************************/
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Onboarding Lebane')
    .addItem('Abrir panel', 'showOnboardingPanel')
    .addSeparator()
    .addItem('Configurar sistema (primera vez)', 'setupOnboardingSystem')
    .addItem('Sincronizar Form desde 01/09/2026', 'syncFormResponses')
    .addItem('Diagnóstico fuente Form', 'debugFormSource')
    .addItem('Reparar configuración fuente Form', 'repairFormSourceConfig')
    .addItem('Instalar automatizaciones', 'installOnboardingTriggers')
    .addItem('Estado trigger Form', 'checkFormTriggerStatus')
    .addItem('Debug clientes', 'debugVerClientesOnboarding')
    .addToUi();
}

function showOnboardingPanel() {
  var html = HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Onboarding Lebane').setWidth(1600).setHeight(900);
  SpreadsheetApp.getUi().showModalDialog(html, 'Onboarding Lebane');
}

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Onboarding Lebane')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/****************************************************
 * ROUTER
 ****************************************************/
function apiRouter(action, payload) {
  payload = payload || {};
  var result;
  try {
    switch (action) {
      case 'getAppData':              result = getAppData(payload); break;
      case 'getPipelineData':          result = getPipelineData(); break;
      case 'getCalendarData':          result = getCalendarData(); break;
      case 'getHistoryData':           result = getHistoryData(); break;
      case 'getPanelHealth':           result = getPanelHealth(); break;
      case 'debugCalendarDates':        result = debugCalendarDates(); break;
      case 'addClient':               result = addClient(payload); break;
      case 'updateClient':            result = updateClient(payload); break;
      case 'getClientProfile':        result = getClientProfile(payload.id || payload.clientId || payload); break;
      case 'sendWelcomeEmail':        result = sendWelcomeEmail(payload.id || payload.clientId || payload); break;
      case 'sendDiscoveryEmail':      result = sendDiscoveryEmail(payload.id || payload.clientId || payload); break;
      case 'saveAndSendDiscovery':     result = saveAndSendDiscovery(payload); break;
      case 'sendCalendarEmail':       result = sendCalendarEmail(payload.id || payload.clientId || payload); break;
      case 'sendStageReminder':       result = sendStageReminder(payload.id || payload.clientId, payload.stage || payload.etapa); break;
      case 'confirmMeeting':          result = confirmMeeting(payload); break;
      case 'completeClient':          result = completeClient(payload.id || payload.clientId || payload); break;
      case 'syncFormResponses':       result = syncFormResponses(); break;
      case 'getRecentFormResponses':  result = getRecentFormResponses(payload); break;
      case 'debugFormSource':         result = debugFormSource(); break;
      case 'repairFormSourceConfig':  result = repairFormSourceConfig(); break;
      case 'getFormResponseDetails':  result = getFormResponseDetails(payload); break;
      case 'matchUnmatchedResponse':  result = matchUnmatchedResponse(payload); break;
      case 'ignoreUnmatchedResponse': result = ignoreUnmatchedResponse(payload.responseId || payload.id || payload); break;
      case 'ignoreUnmatchedResponses': result = ignoreUnmatchedResponses(payload.responseIds || payload.ids || []); break;
      case 'moveToDiscovery':         result = moveToDiscovery(payload.id || payload.clientId || payload); break;
      case 'moveToCalendar':          result = moveToCalendar(payload.id || payload.clientId || payload); break;
      case 'getOmList':               result = getOmList(); break;
      case 'toggleOmActive':          result = toggleOmActive(payload.om, payload.active); break;
      case 'addOm':                   result = addOm(payload); break;
      case 'editOm':                  result = editOm(payload); break;
      case 'deleteOm':                result = deleteOm(payload.om || payload.name); break;
      case 'getAmList':               result = getAmList(); break;
      case 'toggleAmActive':          result = toggleAmActive(payload.am, payload.active); break;
      case 'addAm':                   result = addAm(payload); break;
      case 'editAm':                  result = editAm(payload); break;
      case 'deleteAm':                result = deleteAm(payload.am || payload.email); break;
      case 'getStageData':            result = getStageData(payload.stage); break;
      case 'clearCache':              result = clearUiCache_(); break;
      case 'testData':                result = testDataDebug_(); break;
      case 'installFormTrigger':      result = installFormTrigger(); break;
      case 'getFormTriggerStatus':    result = getFormTriggerStatus(); break;
      case 'registerClient':          result = registerClient(payload); break;
      default: throw new Error('Acción no reconocida: ' + action);
    }
  } catch (err) {
    Logger.log('[apiRouter] ERROR en "' + action + '": ' + err.message);
    result = { ok: false, error: true, message: err.message || String(err) };
  }

  // Cualquier acción de escritura invalida las vistas cacheadas.
  if (result && !result.error && shouldInvalidateUiCache_(action)) {
    invalidateUiCache_();
  }

  try { return JSON.parse(JSON.stringify(result)); }
  catch (e) { return { ok: false, error: true, message: 'Error de serialización.' }; }
}

/****************************************************
 * SETUP
 ****************************************************/
function setupOnboardingSystem() {
  var ss = getMainSpreadsheet_();

  ensureSheet_(ss, LEBANE.sheets.clients, [
    'ID','Empresa','Mails','Revenue','Fecha Ingreso','Reimplementado','Etapa','Estado','OM','AM',
    'Mail Bienvenida Enviado','Fecha Envío Bienvenida','Fecha Programada Bienvenida',
    'Respondió Form','Link Respuestas','ID Respuesta Form',
    'Mail Discovery Enviado','Fecha Envío Discovery',
    'Fecha Discovery','Link Discovery','Asistió Discovery',
    'Mail Calendario Enviado','Fecha Envío Calendario',
    'Fecha Reunión','Link Reunión',
    'Fecha Ingreso Etapa','Última Actualización',
    'FUP Bienvenida','FUP Discovery','FUP Calendario',
    'Observaciones','Comentarios Internos','Payments'
  ]);

  ensureSheet_(ss, LEBANE.sheets.calendar, [
    'ID','Fecha','Empresa','Mails','Fecha Ingreso','Fecha Discovery','Reimplementado','OM','AM',
    'Link Reunión','Estado','Fecha Creación','Fecha Completado','Observaciones'
  ]);

  ensureSheet_(ss, LEBANE.sheets.history, [
    'ID','Empresa','Mails','Revenue','Fecha Ingreso','Reimplementado',
    'Estado',
    'Mail Bienvenida','Respondió Form','Link Respuestas','ID Respuesta Form',
    'Mail Discovery','Mail Calendario',
    'Fecha Discovery','Link Discovery','Asistió Discovery',
    'OM','AM','Link Reunión','Fecha Reunión','Fecha Completo',
    'FUP Bienvenida','FUP Discovery','FUP Calendario','FUP Total',
    'Observaciones','Comentarios Internos'
  ]);

  ensureSheet_(ss, LEBANE.sheets.audit, [
    'Fecha','ID','Empresa','Etapa','Acción','Detalle','Usuario'
  ]);

  ensureSheet_(ss, LEBANE.sheets.payments, [
    'ID','Empresa','Mails','Revenue','Fecha Ingreso','Reimplementado','Etapa','Estado','OM','AM',
    'Mail Bienvenida Enviado','Fecha Envío Bienvenida','Fecha Programada Bienvenida',
    'Respondió Form','Link Respuestas','ID Respuesta Form',
    'Mail Discovery Enviado','Fecha Envío Discovery',
    'Fecha Discovery','Link Discovery','Asistió Discovery',
    'Mail Calendario Enviado','Fecha Envío Calendario',
    'Fecha Reunión','Link Reunión',
    'Fecha Ingreso Etapa','Última Actualización',
    'FUP Bienvenida','FUP Discovery','FUP Calendario',
    'Observaciones','Comentarios Internos','Payments'
  ]);

  ensureSheet_(ss, LEBANE.sheets.unmatched, [
    'Response ID','Fecha Registro','Empresa','Mails','Fila','Estado','Link Respuesta','Datos JSON'
  ]);

  ensureSheet_(ss, LEBANE.sheets.config, ['Clave','Valor']);
  seedConfig_();
  migrateLegacyDiscoveryFields_();
  migrateReportingFields_();
  migrateHistoryReportingFields_();
  migrateCalendarMetadata_();
  migrateHistoryProfileFields_();
  invalidateUiCache_();
  return { ok: true, message: '✅ Sistema configurado. Se agregaron Fecha Ingreso y Reimplementado.' };
}


function migrateLegacyDiscoveryFields_() {
  var sh = getMainSpreadsheet_().getSheetByName(LEBANE.sheets.clients);
  if (!sh || sh.getLastRow() < 2) return;

  var headers = getHeaders_(sh);
  var idx = {};
  headers.forEach(function(h, i){ idx[h] = i; });

  if (idx['Fecha Discovery'] === undefined || idx['Link Discovery'] === undefined) return;

  var values = sh.getRange(2, 1, sh.getLastRow() - 1, headers.length).getValues();
  var changed = false;

  for (var r = 0; r < values.length; r++) {
    var etapa = String(values[r][idx['Etapa']] || '');
    if (etapa !== 'Discovery') continue;

    var fechaDiscovery = values[r][idx['Fecha Discovery']];
    var linkDiscovery  = values[r][idx['Link Discovery']];
    var fechaLegacy    = idx['Fecha Reunión'] !== undefined ? values[r][idx['Fecha Reunión']] : '';
    var linkLegacy     = idx['Link Reunión'] !== undefined ? values[r][idx['Link Reunión']] : '';

    if (!fechaDiscovery && fechaLegacy) {
      values[r][idx['Fecha Discovery']] = fechaLegacy;
      changed = true;
    }
    if (!linkDiscovery && linkLegacy) {
      values[r][idx['Link Discovery']] = linkLegacy;
      changed = true;
    }

    // Para clientes que todavía están en Discovery, esos campos legacy correspondían
    // a la sesión de introducción, no a la reunión de implementación.
    if ((fechaLegacy || linkLegacy) && (values[r][idx['Fecha Discovery']] || values[r][idx['Link Discovery']])) {
      if (idx['Fecha Reunión'] !== undefined) values[r][idx['Fecha Reunión']] = '';
      if (idx['Link Reunión'] !== undefined) values[r][idx['Link Reunión']] = '';
      changed = true;
    }
  }

  if (changed) sh.getRange(2, 1, values.length, headers.length).setValues(values);
}

function ensureSheet_(ss, name, headers) {
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  var existing = sh.getLastRow() > 0
    ? sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(function(h){ return String(h||'').trim(); })
    : [];
  if (!existing.length || existing.every(function(h){ return !h; })) {
    sh.getRange(1,1,1,headers.length).setValues([headers]);
  } else {
    headers.forEach(function(header) {
      if (existing.indexOf(header) === -1) sh.getRange(1, sh.getLastColumn()+1).setValue(header);
    });
  }
  sh.setFrozenRows(1);
  sh.getRange(1,1,1,sh.getLastColumn()).setFontWeight('bold').setBackground('#F8FAFC').setFontColor('#111827');
  return sh;
}

function seedConfig_() {
  var sh = getSheet_(LEBANE.sheets.config);
  var values = sh.getDataRange().getValues();
  var existing = {};
  for (var i = 1; i < values.length; i++) existing[String(values[i][0]||'')] = true;

  var rows = [
    ['FORM_SPREADSHEET_ID', LEBANE.form.spreadsheetId],
    ['FORM_GID', String(LEBANE.form.gid)],
    ['FORM_URL', LEBANE.form.publicFormUrl],
    ['DISCOVERY_LUMA_LINK', 'https://luma.com/calendar/cal-FvOcKZEh3CGtvua'],
    ['MAIL_FROM_NAME', 'Equipo Lebane'],
    ['CC_IMPLEMENTACIONES', 'implementaciones@lebane.app']
  ];

  Object.keys(LEBANE.omCalendars).forEach(function(omName) {
    var normKey = normalizeText_(omName).replace(/\s+/g,'_').toUpperCase();
    rows.push(['OM_' + normKey + '_CALENDAR', LEBANE.omCalendars[omName]]);
    rows.push(['OM_' + normKey + '_ACTIVE', 'true']);
  });

  rows.forEach(function(row) {
    if (!existing[row[0]]) sh.appendRow(row);
  });
}

/****************************************************
 * CAMPOS DE REPORTERÍA
 ****************************************************/
function migrateReportingFields_() {
  var ss = getMainSpreadsheet_();
  var sh = ss.getSheetByName(LEBANE.sheets.clients);
  if (!sh || sh.getLastRow() < 2) return;

  ensureColumnExists_(sh, 'Fecha Ingreso');
  ensureColumnExists_(sh, 'Reimplementado');

  var map = getHeaderMap_(sh);
  var lastRow = sh.getLastRow();
  var lastCol = sh.getLastColumn();
  var values = sh.getRange(2, 1, lastRow - 1, lastCol).getValues();

  // Tomamos la primera fecha de auditoría disponible como mejor aproximación
  // para clientes existentes. Si no existe, usamos Fecha Ingreso Etapa.
  var earliestAudit = {};
  safeReadObjects_(LEBANE.sheets.audit).forEach(function(r) {
    var id = String(r['ID'] || '');
    var d = r['Fecha'];
    if (!id || !d) return;
    var dt = new Date(d);
    if (isNaN(dt)) return;
    if (!earliestAudit[id] || dt < earliestAudit[id]) earliestAudit[id] = dt;
  });

  var changedFecha = false;
  var changedReimp = false;
  var fechaCol = map['Fecha Ingreso'] - 1;
  var reimpCol = map['Reimplementado'] - 1;
  var idCol = map['ID'] ? map['ID'] - 1 : -1;
  var etapaDateCol = map['Fecha Ingreso Etapa'] ? map['Fecha Ingreso Etapa'] - 1 : -1;

  values.forEach(function(row) {
    if (!row[fechaCol]) {
      var clientId = idCol >= 0 ? String(row[idCol] || '') : '';
      var fallback = earliestAudit[clientId] || (etapaDateCol >= 0 ? row[etapaDateCol] : '') || new Date();
      row[fechaCol] = fallback;
      changedFecha = true;
    }

    if (!String(row[reimpCol] || '').trim()) {
      row[reimpCol] = 'NO';
      changedReimp = true;
    }
  });

  if (changedFecha) {
    sh.getRange(2, map['Fecha Ingreso'], values.length, 1)
      .setValues(values.map(function(r){ return [r[fechaCol]]; }));
  }

  if (changedReimp) {
    sh.getRange(2, map['Reimplementado'], values.length, 1)
      .setValues(values.map(function(r){ return [r[reimpCol]]; }));
  }
}


function buildEarliestAuditMap_() {
  var earliest = {};
  safeReadObjects_(LEBANE.sheets.audit).forEach(function(r) {
    var id = String(r['ID'] || '');
    var d = r['Fecha'];
    if (!id || !d) return;
    var dt = new Date(d);
    if (isNaN(dt)) return;
    if (!earliest[id] || dt < earliest[id]) earliest[id] = dt;
  });
  return earliest;
}

function migrateHistoryReportingFields_() {
  var sh = getMainSpreadsheet_().getSheetByName(LEBANE.sheets.history);
  if (!sh || sh.getLastRow() < 2) return;

  ensureColumnExists_(sh, 'Fecha Ingreso');
  ensureColumnExists_(sh, 'Reimplementado');

  var map = getHeaderMap_(sh);
  var values = sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();
  var earliest = buildEarliestAuditMap_();
  var idCol = map['ID'] - 1;
  var ingresoCol = map['Fecha Ingreso'] - 1;
  var reimpCol = map['Reimplementado'] - 1;
  var completedCol = map['Fecha Completo'] ? map['Fecha Completo'] - 1 : -1;
  var changed = false;

  values.forEach(function(row) {
    var id = String(row[idCol] || '');
    if (!row[ingresoCol]) {
      row[ingresoCol] = earliest[id] || (completedCol >= 0 ? row[completedCol] : '') || '';
      changed = true;
    }
    if (!row[reimpCol]) {
      row[reimpCol] = 'NO';
      changed = true;
    }
  });

  if (changed) sh.getRange(2, 1, values.length, sh.getLastColumn()).setValues(values);
}

function migrateCalendarMetadata_() {
  var sh = getMainSpreadsheet_().getSheetByName(LEBANE.sheets.calendar);
  if (!sh || sh.getLastRow() < 2) return;

  ensureColumnExists_(sh, 'Fecha Ingreso');
  ensureColumnExists_(sh, 'Fecha Discovery');
  ensureColumnExists_(sh, 'Reimplementado');

  var lookup = {};
  safeReadObjects_(LEBANE.sheets.clients)
    .concat(safeReadObjects_(LEBANE.sheets.history))
    .forEach(function(r) {
      var id = String(r['ID'] || '');
      if (!id) return;
      lookup[id] = {
        fechaIngreso: r['Fecha Ingreso'] || '',
        fechaDiscovery: r['Fecha Discovery'] || '',
        reimplementado: normalizeYesNo_(r['Reimplementado'], 'NO')
      };
    });

  var earliest = buildEarliestAuditMap_();
  var map = getHeaderMap_(sh);
  var values = sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();
  var idCol = map['ID'] - 1;
  var ingresoCol = map['Fecha Ingreso'] - 1;
  var discoveryCol = map['Fecha Discovery'] - 1;
  var reimpCol = map['Reimplementado'] - 1;
  var changed = false;

  values.forEach(function(row) {
    var id = String(row[idCol] || '');
    var src = lookup[id] || {};
    if (!row[ingresoCol]) {
      row[ingresoCol] = src.fechaIngreso || earliest[id] || '';
      changed = true;
    }
    if (!row[discoveryCol] && src.fechaDiscovery) {
      row[discoveryCol] = src.fechaDiscovery;
      changed = true;
    }
    if (!row[reimpCol]) {
      row[reimpCol] = src.reimplementado || 'NO';
      changed = true;
    }
  });

  if (changed) sh.getRange(2, 1, values.length, sh.getLastColumn()).setValues(values);
}

/****************************************************
 * GET APP DATA
 ****************************************************/
function getAppData(filters) {
  filters = filters || {};
  var grouped = { Bienvenida: [], Discovery: [], Calendario: [] };
  var allClients = [];

  try {
    var ss = getMainSpreadsheet_();
    var sh = ss.getSheetByName(LEBANE.sheets.clients);

    if (sh && sh.getLastRow() >= 2) {
      var values  = sh.getDataRange().getValues();
      var headers = values[0].map(function(h){ return String(h||'').trim(); });
      var empIdx  = headers.indexOf('Empresa');

      for (var i = 1; i < values.length; i++) {
        var row     = values[i];
        var empresa = String(empIdx >= 0 ? row[empIdx] : '').trim();
        if (!empresa) continue;

        var obj = {};
        headers.forEach(function(h, idx){ obj[h] = row[idx]; });
        obj.__row = i + 1;
        if (!obj['Etapa'])          obj['Etapa']         = 'Bienvenida';
        if (!obj['Respondió Form']) obj['Respondió Form'] = 'NO';

        var client = normalizeClientForUi_(obj);
        if (!clientPassesFilters_(client, filters)) continue;

        var etapa = client.etapa || 'Bienvenida';
        if (etapa === 'Histórico' || etapa === 'Historico') continue;
        if (!grouped[etapa]) etapa = 'Bienvenida';

        grouped[etapa].push(client);
        allClients.push(client);
      }
    }
  } catch(e) { Logger.log('[getAppData] clients error: ' + e.message); }

  var calendar = [], historic = [], unmatched = [];

  try {
    // Incluir reuniones completadas en calendario para vista histórica
    calendar = safeReadObjects_(LEBANE.sheets.calendar)
      .filter(function(r){ return String(r['Empresa']||'').trim(); })
      .map(normalizeCalendarForUi_);
  } catch(e) { Logger.log('[getAppData] calendar error: ' + e.message); }

  try {
    var historyCalendarLookup = buildCalendarLookup_();

    historic = safeReadObjects_(LEBANE.sheets.history)
      .filter(function(r){ return String(r['Empresa']||'').trim(); })
      .map(function(r){
        return enrichHistoryRawWithCalendar_(r, historyCalendarLookup);
      })
      .map(normalizeHistoryForUi_)
      .filter(function(c){ return clientPassesFilters_(c, filters); });
  } catch(e) { Logger.log('[getAppData] history error: ' + e.message); }

  try {
    unmatched = safeReadObjects_(LEBANE.sheets.unmatched)
      .filter(function(r){ return String(r['Response ID']||'').trim(); })
      .filter(function(r){ return String(r['Estado']||'').toLowerCase() === 'pendiente'; })
      .map(normalizeUnmatchedForUi_);
  } catch(e) { Logger.log('[getAppData] unmatched error: ' + e.message); }

  var elevated = allClients.filter(function(c){ return Number(c.daysInStage||0) >= 7; });

  return {
    ok: true,
    counts: {
      bienvenida: grouped.Bienvenida.length,
      discovery:  grouped.Discovery.length,
      calendario: grouped.Calendario.length,
      historico:  historic.length,
      unmatched:  unmatched.length
    },
    grouped:  grouped,
    calendar: calendar,
    historic: historic,
    unmatched: unmatched,
    elevated: elevated
  };
}


/****************************************************
 * CARGAS LIVIANAS POR VISTA
 ****************************************************/
function buildPipelineData_() {
  try {
    var grouped = { Bienvenida: [], Discovery: [], Calendario: [] };
    var allClients = [];
    var ss = getMainSpreadsheet_();
    var sh = ss.getSheetByName(LEBANE.sheets.clients);

    if (sh && sh.getLastRow() >= 2) {
      var values  = sh.getDataRange().getValues();
      var headers = values[0].map(function(h){ return String(h||'').trim(); });
      var empIdx  = headers.indexOf('Empresa');

      for (var i = 1; i < values.length; i++) {
        var empresa = String(empIdx >= 0 ? values[i][empIdx] : '').trim();
        if (!empresa) continue;

        var obj = {};
        headers.forEach(function(h, idx){ obj[h] = values[i][idx]; });
        obj.__row = i + 1;
        if (!obj['Etapa']) obj['Etapa'] = 'Bienvenida';
        if (!obj['Respondió Form']) obj['Respondió Form'] = 'NO';

        var client = normalizeClientForUi_(obj);
        var etapa = client.etapa || 'Bienvenida';
        if (etapa === 'Histórico' || etapa === 'Historico') continue;
        if (!grouped[etapa]) etapa = 'Bienvenida';

        grouped[etapa].push(client);
        allClients.push(client);
      }
    }

    var histSh = ss.getSheetByName(LEBANE.sheets.history);
    var historicoCount = histSh ? Math.max(0, histSh.getLastRow() - 1) : 0;

    var unmatched = [];
    try {
      unmatched = readPendingUnmatched_();
    } catch (e) {
      Logger.log('readPendingUnmatched error: ' + e.message);
    }

    var elevated = allClients.filter(function(c){ return Number(c.daysInStage||0) >= 7; });

    return {
      ok: true,
      counts: {
        bienvenida: grouped.Bienvenida.length,
        discovery: grouped.Discovery.length,
        calendario: grouped.Calendario.length,
        historico: historicoCount,
        unmatched: unmatched.length
      },
      grouped: grouped,
      unmatched: unmatched,
      elevated: elevated
    };
  } catch (err) {
    return {
      ok: false,
      error: err.message || String(err),
      counts: { bienvenida: 0, discovery: 0, calendario: 0, historico: 0, unmatched: 0 },
      grouped: { Bienvenida: [], Discovery: [], Calendario: [] },
      unmatched: [],
      elevated: []
    };
  }
}

function getPipelineData() {
  var cached = getUiCache_('pipeline');
  if (cached) return cached;

  var data = buildPipelineData_();
  putUiCache_('pipeline', data, 60);
  return data;
}

/**
 * Carga datos de una etapa específica (Bienvenida, Discovery, Calendario)
 * Mucho más rápido que cargar todo. Optimizado para pestañas por etapa.
 */
function getStageData(stage) {
  stage = stage || 'Bienvenida';
  var cacheKey = 'stage_' + stage;
  var cached = getUiCache_(cacheKey);
  if (cached) return cached;

  var sh = getMainSpreadsheet_().getSheetByName(LEBANE.sheets.clients);
  var clients = [];

  if (sh && sh.getLastRow() >= 2) {
    var values  = sh.getDataRange().getValues();
    var headers = values[0].map(function(h){ return String(h||'').trim(); });
    var empIdx  = headers.indexOf('Empresa');
    var etapaIdx = headers.indexOf('Etapa');

    for (var i = 1; i < values.length; i++) {
      var empresa = String(empIdx >= 0 ? values[i][empIdx] : '').trim();
      if (!empresa) continue;

      var etapa = String(etapaIdx >= 0 ? values[i][etapaIdx] : 'Bienvenida').trim();
      if (etapa !== stage) continue;

      var obj = {};
      headers.forEach(function(h, idx){ obj[h] = values[i][idx]; });
      obj.__row = i + 1;
      if (!obj['Etapa']) obj['Etapa'] = 'Bienvenida';
      if (!obj['Respondió Form']) obj['Respondió Form'] = 'NO';

      var client = normalizeClientForUi_(obj);
      clients.push(client);
    }
  }

  var data = {
    ok: true,
    stage: stage,
    clients: clients,
    count: clients.length
  };

  putUiCache_(cacheKey, data, 90);
  return data;
}

function getCalendarData() {
  var cached = getUiCache_('calendar');
  if (cached) return cached;

  var historyRows = safeReadObjects_(LEBANE.sheets.history);

  var historyIds = {};
  var historyKeys = {};
  var historyCompanies = {};

  historyRows.forEach(function(r) {
    var id = String(r['ID'] || '').trim();
    if (id) historyIds[id] = true;

    var empresaKey = normalizeText_(r['Empresa'] || '');
    if (empresaKey) historyCompanies[empresaKey] = true;

    // Compatibilidad con históricos viejos que quedaron sin ID:
    // empresa + fecha de reunión permite ocultarlos sin borrar la fila de Calendario.
    var fecha = r['Fecha Reunión'];
    var fechaKey = '';

    if (fecha instanceof Date && !isNaN(fecha)) {
      fechaKey = Utilities.formatDate(fecha, LEBANE.timezone, 'yyyy-MM-dd HH:mm');
    } else if (fecha) {
      var parsed = parseRobustDate_(fecha);
      if (parsed) {
        fechaKey = Utilities.formatDate(parsed, LEBANE.timezone, 'yyyy-MM-dd HH:mm');
      }
    }

    if (empresaKey && fechaKey) {
      historyKeys[empresaKey + '|' + fechaKey] = true;
    }
  });

  var calendar = safeReadObjects_(LEBANE.sheets.calendar)
    .filter(function(r) {
      if (!String(r['Empresa'] || '').trim()) return false;

      var estado = normalizeText_(r['Estado'] || '');

      // Nunca mostrar en la vista Calendario elementos ya archivados/completados.
      if (
        estado === 'historico' ||
        estado === 'histórico' ||
        estado === 'completado'
      ) {
        return false;
      }

      var id = String(r['ID'] || '').trim();
      if (id && historyIds[id]) return false;

      // Fallback para registros antiguos sin ID.
      var empresaKey = normalizeText_(r['Empresa'] || '');
      var fecha = r['Fecha'];
      var fechaKey = '';

      if (fecha instanceof Date && !isNaN(fecha)) {
        fechaKey = Utilities.formatDate(fecha, LEBANE.timezone, 'yyyy-MM-dd HH:mm');
      } else if (fecha) {
        var parsed = parseRobustDate_(fecha);
        if (parsed) {
          fechaKey = Utilities.formatDate(parsed, LEBANE.timezone, 'yyyy-MM-dd HH:mm');
        }
      }

      if (empresaKey && fechaKey && historyKeys[empresaKey + '|' + fechaKey]) {
        return false;
      }

      // Último respaldo para registros antiguos sin ID/fecha consistente:
      // si la empresa ya está en Histórico, no debe seguir apareciendo
      // en la visual de Calendario.
      if (!id && empresaKey && historyCompanies[empresaKey]) {
        return false;
      }

      return true;
    })
    .map(normalizeCalendarForUi_);

  var data = { ok: true, calendar: calendar };
  putUiCache_('calendar', data, 90);
  return data;
}


function buildCalendarLookup_() {
  var lookup = {};
  safeReadObjects_(LEBANE.sheets.calendar).forEach(function(r) {
    var id = String(r['ID'] || '');
    if (id) lookup[id] = r;
  });
  return lookup;
}

function enrichHistoryRawWithCalendar_(row, calendarLookup) {
  row = row || {};
  calendarLookup = calendarLookup || {};

  var id = String(row['ID'] || '');
  var cal = id ? calendarLookup[id] : null;

  if (!cal) return row;

  // Para históricos ya existentes, recuperamos los datos que el flujo
  // sí dejó guardados en la hoja Calendario.
  if (!row['Fecha Discovery'] && cal['Fecha Discovery']) {
    row['Fecha Discovery'] = cal['Fecha Discovery'];
  }

  if (!row['Fecha Reunión'] && cal['Fecha']) {
    row['Fecha Reunión'] = cal['Fecha'];
  }

  if (!row['Link Reunión'] && cal['Link Reunión']) {
    row['Link Reunión'] = cal['Link Reunión'];
  }

  if (!row['OM'] && cal['OM']) row['OM'] = cal['OM'];
  if (!row['AM'] && cal['AM']) row['AM'] = cal['AM'];

  if (!row['Observaciones'] && cal['Observaciones']) {
    row['Observaciones'] = cal['Observaciones'];
  }

  return row;
}

function getHistoryData() {
  var cached = getUiCache_('history');
  if (cached) return cached;

  var calendarLookup = buildCalendarLookup_();

  var historic = safeReadObjects_(LEBANE.sheets.history)
    .filter(function(r){ return String(r['Empresa']||'').trim(); })
    .map(function(r){
      return enrichHistoryRawWithCalendar_(r, calendarLookup);
    })
    .map(normalizeHistoryForUi_);

  var data = { ok: true, historic: historic };
  putUiCache_('history', data, 90);
  return data;
}


function readPendingUnmatched_() {
  var sh = getMainSpreadsheet_().getSheetByName(LEBANE.sheets.unmatched);
  if (!sh || sh.getLastRow() < 2) return [];

  var headers = getHeaders_(sh);
  var idx = {};
  headers.forEach(function(h, i){ idx[h] = i; });

  var values = sh.getRange(2, 1, sh.getLastRow() - 1, headers.length).getValues();
  var out = [];

  for (var i = 0; i < values.length; i++) {
    var status = idx['Estado'] !== undefined
      ? String(values[i][idx['Estado']] || '').toLowerCase()
      : '';

    if (status !== 'pendiente') continue;

    var obj = {};
    headers.forEach(function(h, c){ obj[h] = values[i][c]; });
    obj.__row = i + 2;
    out.push(normalizeUnmatchedForUi_(obj));
  }

  return out;
}

function getPanelHealth() {
  var ss = getMainSpreadsheet_();

  function dataRows(name) {
    var sh = ss.getSheetByName(name);
    return sh ? Math.max(0, sh.getLastRow() - 1) : 0;
  }

  return {
    ok: true,
    timestamp: new Date().toISOString(),
    rows: {
      clients: dataRows(LEBANE.sheets.clients),
      calendar: dataRows(LEBANE.sheets.calendar),
      history: dataRows(LEBANE.sheets.history),
      audit: dataRows(LEBANE.sheets.audit),
      unmatched: dataRows(LEBANE.sheets.unmatched)
    }
  };
}

/****************************************************
 * NORMALIZERS
 ****************************************************/
function normalizeClientForUi_(row) {
  var etapa = row['Etapa'] || 'Bienvenida';
  var fechaIngresoEtapa = row['Fecha Ingreso Etapa'] || '';
  var fechaBaseDias = fechaIngresoEtapa || row['Última Actualización'] || new Date();
  var days = daysBetween_(fechaBaseDias, new Date());
  var hoursInStage = fechaIngresoEtapa ? hoursBetween_(fechaIngresoEtapa, new Date()) : 999999;

  function ds(v) {
    if (!v || v === '') return '';
    if (v instanceof Date) return isNaN(v) ? '' : formatDate_(v);
    return String(v);
  }

  return {
    id:            String(row['ID'] || row['Empresa'] || ''),
    empresa:       String(row['Empresa'] || ''),
    mails:         String(row['Mails'] || ''),
    revenue:       String(row['Revenue'] || ''),
    fechaIngreso:   dateOnlyString_(row['Fecha Ingreso']),
    reimplementado: normalizeYesNo_(row['Reimplementado'], 'NO'),
    fechaIngresoEtapa: ds(row['Fecha Ingreso Etapa']),
    isNewStage:     hoursInStage >= 0 && hoursInStage < 48,
    etapa:         etapa,
    estado:        String(row['Estado'] || ''),
    om:            String(row['OM'] || ''),
    am:            String(row['AM'] || ''),
    mailBienvenida: String(row['Mail Bienvenida Enviado'] || ''),
    fechaBienvenida: ds(row['Fecha Envío Bienvenida']),
    fechaProgramadaBienvenida: ds(row['Fecha Programada Bienvenida']),
    respondioForm: String(row['Respondió Form'] || 'NO'),
    linkRespuestas: String(row['Link Respuestas'] || ''),
    idRespuestaForm: String(row['ID Respuesta Form'] || ''),
    mailDiscovery:  String(row['Mail Discovery Enviado'] || ''),
    fechaDiscovery: ds(row['Fecha Discovery']),
    linkDiscovery:  String(row['Link Discovery'] || ''),
    asistioDiscovery: String(row['Asistió Discovery'] || 'PENDIENTE'),
    mailCalendario: String(row['Mail Calendario Enviado'] || ''),
    fechaReunion:   ds(row['Fecha Reunión']),
    linkReunion:    String(row['Link Reunión'] || ''),
    daysInStage:    days,
    elevated:       days >= 7,
    observaciones:  String(row['Observaciones'] || ''),
    comentarios:    String(row['Comentarios Internos'] || '')
  };
}

function normalizeCalendarForUi_(row) {
  var rawFecha = row['Fecha'];
  var fechaDate = null;

  if (rawFecha instanceof Date && !isNaN(rawFecha)) {
    fechaDate = rawFecha;
  } else if (rawFecha) {
    fechaDate = parseRobustDate_(rawFecha);
  }

  return {
    id:         String(row['ID'] || row['Empresa'] || ''),
    empresa:    String(row['Empresa'] || ''),
    mails:      String(row['Mails'] || ''),

    // Metadatos de reporte. NO definen la fecha del calendario.
    fechaIngreso: dateOnlyString_(row['Fecha Ingreso']),
    fechaDiscovery: (row['Fecha Discovery'] instanceof Date)
      ? (isNaN(row['Fecha Discovery']) ? '' : formatDate_(row['Fecha Discovery']))
      : String(row['Fecha Discovery'] || ''),
    reimplementado: normalizeYesNo_(row['Reimplementado'], 'NO'),

    // FECHA REAL DEL CALENDARIO:
    // viene exclusivamente de Calendario!Fecha, cargada desde
    // confirmMeeting() -> "Registrar reunión".
    fecha: fechaDate ? formatDate_(fechaDate) : '',
    fechaMs: fechaDate ? fechaDate.getTime() : null,
    fechaIsoLocal: fechaDate
      ? Utilities.formatDate(fechaDate, LEBANE.timezone, "yyyy-MM-dd'T'HH:mm:ss")
      : '',

    om:         String(row['OM'] || ''),
    am:         String(row['AM'] || ''),
    linkReunion: String(row['Link Reunión'] || ''),
    estado:     String(row['Estado'] || 'Pendiente'),
    observaciones: String(row['Observaciones'] || '')
  };
}

function normalizeHistoryForUi_(row) {
  var fc = row['Fecha Completo'];
  var fr = row['Fecha Reunión'];
  var fd = row['Fecha Discovery'];

  function ds(v) {
    if (!v || v === '') return '';
    if (v instanceof Date) return isNaN(v) ? '' : formatDate_(v);
    return String(v);
  }

  return {
    id:           String(row['ID'] || row['Empresa'] || ''),
    empresa:      String(row['Empresa'] || ''),
    mails:        String(row['Mails'] || ''),
    revenue:      String(row['Revenue'] || ''),
    fechaIngreso: dateOnlyString_(row['Fecha Ingreso']),
    reimplementado: normalizeYesNo_(row['Reimplementado'], 'NO'),

    etapa:        'Histórico',
    estado:       String(row['Estado'] || 'Histórico'),
    isHistory:    true,

    mailBienvenida: String(row['Mail Bienvenida'] || ''),
    respondioForm:  String(row['Respondió Form'] || ''),
    linkRespuestas: String(row['Link Respuestas'] || ''),
    idRespuestaForm:String(row['ID Respuesta Form'] || ''),
    mailDiscovery:  String(row['Mail Discovery'] || ''),
    mailCalendario: String(row['Mail Calendario'] || ''),

    fechaDiscovery: ds(fd),
    linkDiscovery: String(row['Link Discovery'] || ''),
    asistioDiscovery: String(row['Asistió Discovery'] || 'PENDIENTE'),

    om:           String(row['OM'] || ''),
    am:           String(row['AM'] || ''),
    linkReunion:  String(row['Link Reunión'] || ''),
    fechaReunion: ds(fr),
    fechaCompleto: ds(fc),

    fupBienvenida:Number(row['FUP Bienvenida'] || 0),
    fupDiscovery: Number(row['FUP Discovery'] || 0),
    fupCalendario:Number(row['FUP Calendario'] || 0),
    fupTotal:     Number(row['FUP Total'] || 0),

    observaciones:String(row['Observaciones'] || ''),
    comentarios: String(row['Comentarios Internos'] || '')
  };
}

function normalizeUnmatchedForUi_(row) {
  return {
    responseId:    String(row['Response ID'] || ''),
    fechaRegistro: String(row['Fecha Registro'] || ''),
    empresa:       String(row['Empresa'] || ''),
    mails:         String(row['Mails'] || ''),
    fila:          String(row['Fila'] || ''),
    estado:        String(row['Estado'] || ''),
    linkRespuesta: String(row['Link Respuesta'] || '')
  };
}

function clientPassesFilters_(client, filters) {
  filters = filters || {};
  var om = String(filters.om || '');
  var am = String(filters.am || '');
  var search = normalizeText_(filters.search || '');
  if (om && String(client.om||'') !== om) return false;
  if (am && String(client.am||'') !== am) return false;
  if (search) {
    var blob = normalizeText_([client.empresa,client.mails,client.revenue,client.om,client.am,client.estado].join(' '));
    if (blob.indexOf(search) === -1) return false;
  }
  return true;
}

/****************************************************
 * CLIENTES
 ****************************************************/

/**
 * Registrar cliente SIN enviar ningún mail.
 * Útil para cargar históricos o clientes en cualquier etapa.
 */
function registerClient(data) {
  data = data || {};
  var empresa = clean_(data.empresa);
  var mails   = clean_(data.mails);
  if (!empresa) throw new Error('Falta completar empresa.');
  if (!mails)   throw new Error('Falta completar mails.');

  var ss = getMainSpreadsheet_();
  var sh = ss.getSheetByName(LEBANE.sheets.clients);
  if (sh && sh.getLastRow() >= 2) {
    var vals     = sh.getDataRange().getValues();
    var empIdx   = vals[0].map(function(h){ return String(h).trim(); }).indexOf('Empresa');
    if (empIdx >= 0) {
      for (var i = 1; i < vals.length; i++) {
        if (normalizeText_(vals[i][empIdx]) === normalizeText_(empresa)) {
          throw new Error('Ya existe un cliente con ese nombre.');
        }
      }
    }
  }

  var clientSheet = getSheet_(LEBANE.sheets.clients);
  var headers     = getHeaders_(clientSheet);
  var id          = Utilities.getUuid();
  var now         = new Date();
  var etapa       = clean_(data.etapa) || 'Bienvenida';

  var rowObj = {
    'ID': id, 'Empresa': empresa, 'Mails': mails,
    'Revenue': clean_(data.revenue),
    'Fecha Ingreso': parseLocalDateOrToday_(data.fechaIngreso),
    'Reimplementado': normalizeYesNo_(data.reimplementado, 'NO'),
    'Etapa': etapa,
    'Estado': clean_(data.estado) || etapa,
    'OM': clean_(data.om), 'AM': clean_(data.am),
    'Mail Bienvenida Enviado': data.mailBienvenida ? '✅' : '',
    'Fecha Envío Bienvenida': '',
    'Fecha Programada Bienvenida': '',
    'Respondió Form': data.respondioForm ? 'SI' : 'NO',
    'Link Respuestas': '',
    'ID Respuesta Form': '',
    'Mail Discovery Enviado': data.mailDiscovery ? '✅' : '',
    'Fecha Envío Discovery': '',
    'Fecha Discovery': parseDateOrBlank_(data.fechaDiscovery),
    'Link Discovery': clean_(data.linkDiscovery),
    'Asistió Discovery': normalizeDiscoveryAttendance_(data.asistioDiscovery),
    'Mail Calendario Enviado': data.mailCalendario ? '✅' : '',
    'Fecha Envío Calendario': '',
    'Fecha Reunión': parseDateOrBlank_(data.fechaReunion),
    'Link Reunión': clean_(data.linkReunion),
    'Fecha Ingreso Etapa': now,
    'Última Actualización': now,
    'FUP Bienvenida': 0, 'FUP Discovery': 0, 'FUP Calendario': 0,
    'Observaciones': clean_(data.observaciones),
    'Comentarios Internos': clean_(data.comentarios)
  };

  appendObject_(clientSheet, headers, rowObj);

  // La hoja Calendario NO se alimenta desde la carga manual.
  // Se completa únicamente al usar "Registrar reunión" en la etapa Calendario.

  audit_(id, empresa, etapa, 'Cliente registrado (sin mail)', 'Carga manual sin envío de mails.');
  try { syncFormResponses(); } catch(syncErr) { Logger.log('[registerClient] sync form: ' + syncErr.message); }
  return { ok: true, id: id, message: empresa + ' registrado en etapa ' + etapa + '.' };
}

function addClient(data) {
  data = data || {};
  var empresa = clean_(data.empresa);
  var mails   = clean_(data.mails);
  if (!empresa) throw new Error('Falta completar empresa.');
  if (!mails)   throw new Error('Falta completar mails.');

  var ss = getMainSpreadsheet_();
  var sh = ss.getSheetByName(LEBANE.sheets.clients);
  if (sh && sh.getLastRow() >= 2) {
    var vals   = sh.getDataRange().getValues();
    var empIdx = vals[0].map(function(h){ return String(h).trim(); }).indexOf('Empresa');
    if (empIdx >= 0) {
      for (var i = 1; i < vals.length; i++) {
        if (normalizeText_(vals[i][empIdx]) === normalizeText_(empresa)) {
          throw new Error('Ya existe un cliente con ese nombre de empresa.');
        }
      }
    }
  }

  var clientSheet = getSheet_(LEBANE.sheets.clients);
  var headers     = getHeaders_(clientSheet);
  var id          = Utilities.getUuid();
  var now         = new Date();
  var payments    = normalizeYesNo_(data.payments, 'NO');

  var rowObject = {
    'ID': id, 'Empresa': empresa, 'Mails': mails,
    'Revenue': clean_(data.revenue),
    'Fecha Ingreso': parseLocalDateOrToday_(data.fechaIngreso),
    'Reimplementado': normalizeYesNo_(data.reimplementado, 'NO'),
    'Etapa': 'Bienvenida',
    'Estado': data.sendWelcomeNow ? 'Bienvenida enviada' : 'Pendiente bienvenida',
    'OM': clean_(data.om), 'AM': clean_(data.am),
    'Mail Bienvenida Enviado': '',
    'Fecha Envío Bienvenida': '',
    'Fecha Programada Bienvenida': data.sendWelcomeNow ? '' : parseDateOrBlank_(data.welcomeScheduledAt || data.fechaProgramadaBienvenida),
    'Respondió Form': 'NO', 'Link Respuestas': '', 'ID Respuesta Form': '',
    'Mail Discovery Enviado': '', 'Fecha Envío Discovery': '',
    'Fecha Discovery': '', 'Link Discovery': '', 'Asistió Discovery': 'PENDIENTE',
    'Mail Calendario Enviado': '', 'Fecha Envío Calendario': '',
    'Fecha Reunión': '', 'Link Reunión': '',
    'Fecha Ingreso Etapa': now, 'Última Actualización': now,
    'FUP Bienvenida': 0, 'FUP Discovery': 0, 'FUP Calendario': 0,
    'Observaciones': clean_(data.observaciones), 'Comentarios Internos': '',
    'Payments': payments
  };

  appendObject_(clientSheet, headers, rowObject);

  // Si Payments = SI, también guardar en la hoja "Payments"
  if (payments === 'SI') {
    var paymentsSheet = getSheet_(LEBANE.sheets.payments);
    var paymentsHeaders = getHeaders_(paymentsSheet);
    appendObject_(paymentsSheet, paymentsHeaders, rowObject);
  }

  audit_(id, empresa, 'Bienvenida', 'Cliente creado', 'Desde panel.');
  try { syncFormResponses(); } catch(syncErr) { Logger.log('[addClient] sync form: ' + syncErr.message); }

  if (data.sendWelcomeNow === true || String(data.sendWelcomeNow) === 'true') {
    try { sendWelcomeEmail(id); }
    catch (e) {
      return { ok: true, id: id, message: 'Guardado. Error al enviar bienvenida: ' + (e.message || e) };
    }
  }
  return { ok: true, id: id, message: 'Cliente guardado correctamente.' };
}

function updateClient(data) {
  data = data || {};
  var id = data.id;
  if (!id) throw new Error('Falta ID del cliente.');

  var found = findClientRow_(id);
  if (!found || found.source === LEBANE.sheets.history) throw new Error('No se encontró el cliente activo.');

  var sh      = found.sheet;
  var row     = found.row;

  if (data['Asistió Discovery'] !== undefined) {
    ensureColumnExists_(sh, 'Asistió Discovery');
  }

  var headers = getHeaders_(sh);
  var values  = sh.getRange(row, 1, 1, headers.length).getValues()[0];
  var idx     = {};
  headers.forEach(function(h, i){ idx[h] = i; });

  var before = {};
  headers.forEach(function(h, i){ before[h] = values[i]; });
  var oldStage = before['Etapa'];

  var allowed = ['Empresa','Mails','Revenue','Fecha Ingreso','Reimplementado','Etapa','Estado','OM','AM',
    'Fecha Discovery','Link Discovery','Asistió Discovery','Fecha Reunión','Link Reunión','Observaciones','Comentarios Internos'];

  allowed.forEach(function(key) {
    if (data[key] === undefined || idx[key] === undefined) return;

    if (key === 'Asistió Discovery') {
      values[idx[key]] = normalizeDiscoveryAttendance_(data[key]);
    } else if (key === 'Reimplementado') {
      values[idx[key]] = normalizeYesNo_(data[key], 'NO');
    } else if (key === 'Fecha Ingreso') {
      values[idx[key]] = parseLocalDateOrBlank_(data[key]);
    } else {
      values[idx[key]] = data[key];
    }
  });

  if (data['Etapa'] && data['Etapa'] !== oldStage && idx['Fecha Ingreso Etapa'] !== undefined) {
    values[idx['Fecha Ingreso Etapa']] = new Date();
  }
  if (idx['Última Actualización'] !== undefined) values[idx['Última Actualización']] = new Date();

  sh.getRange(row, 1, 1, headers.length).setValues([values]);

  var after = {};
  headers.forEach(function(h, i){ after[h] = values[i]; });

  // IMPORTANTE:
  // Editar el perfil NO crea ni actualiza filas en la hoja Calendario.
  // La hoja Calendario se alimenta exclusivamente desde confirmMeeting(),
  // es decir, desde el botón "Registrar reunión" de la etapa Calendario.

  if (
    data['Asistió Discovery'] !== undefined &&
    normalizeDiscoveryAttendance_(before['Asistió Discovery']) !== normalizeDiscoveryAttendance_(after['Asistió Discovery'])
  ) {
    audit_(
      id,
      after['Empresa'],
      after['Etapa'],
      'Asistencia Discovery actualizada',
      'Asistió: ' + normalizeDiscoveryAttendance_(after['Asistió Discovery'])
    );
  } else {
    audit_(id, after['Empresa'], after['Etapa'], 'Cliente actualizado', '');
  }

  return { ok: true, message: 'Cliente actualizado.' };
}

function getClientProfile(id) {
  var found = findClientRow_(id);
  if (!found) throw new Error('No se encontró el cliente.');

  var raw = readObjectAtRow_(found.sheet, found.row);
  var isHistory = found.source === LEBANE.sheets.history;
  var client = isHistory ? normalizeHistoryForUi_(raw) : normalizeClientForUi_(raw);

  // Para históricos viejos, recuperar de Calendario cualquier dato que
  // no haya quedado copiado en Histórico.
  if (isHistory) {
    try {
      var calSh = getSheet_(LEBANE.sheets.calendar);
      var calRow = findRowByValue_(calSh, 'ID', client.id);

      if (calRow) {
        var cal = readObjectAtRow_(calSh, calRow);

        if (!client.fechaDiscovery && cal['Fecha Discovery']) {
          client.fechaDiscovery = formatDate_(cal['Fecha Discovery']);
        }
        if (!client.fechaReunion && cal['Fecha']) {
          client.fechaReunion = formatDate_(cal['Fecha']);
        }
        if (!client.linkReunion && cal['Link Reunión']) {
          client.linkReunion = String(cal['Link Reunión'] || '');
        }
        if (!client.observaciones && cal['Observaciones']) {
          client.observaciones = String(cal['Observaciones'] || '');
        }
        if (!client.om && cal['OM']) client.om = String(cal['OM'] || '');
        if (!client.am && cal['AM']) client.am = String(cal['AM'] || '');
      }
    } catch (calendarErr) {
      Logger.log('[getClientProfile] enrich history: ' + calendarErr.message);
    }
  }

  var audit = getAuditForClient_(client.id);

  var fup = isHistory
    ? {
        bienvenida: Number(client.fupBienvenida || 0),
        discovery: Number(client.fupDiscovery || 0),
        calendario: Number(client.fupCalendario || 0),
        total: Number(client.fupTotal || 0)
      }
    : getFupSummary_(raw);

  var formResponse = client.idRespuestaForm
    ? (getFormResponseDetails({ responseId: client.idRespuestaForm }).response || [])
    : [];

  return {
    ok: true,
    client: client,
    audit: audit,
    fupSummary: fup,
    formResponse: formResponse,
    isHistory: isHistory
  };
}

function moveToDiscovery(id) {
  var found = findClientRow_(id);
  if (!found) throw new Error('No se encontró el cliente.');

  var sh  = found.sheet;
  var map = getHeaderMap_(sh);
  var row = found.row;
  var client = readObjectAtRow_(sh, row);

  if (client['Etapa'] === 'Discovery') return { ok: true, message: 'El cliente ya está en Discovery.' };

  var now = new Date();
  if (map['Etapa'])                sh.getRange(row, map['Etapa']).setValue('Discovery');
  if (map['Estado'])               sh.getRange(row, map['Estado']).setValue('En Discovery');
  if (map['Fecha Ingreso Etapa'])  sh.getRange(row, map['Fecha Ingreso Etapa']).setValue(now);
  if (map['Última Actualización']) sh.getRange(row, map['Última Actualización']).setValue(now);

  audit_(client['ID'], client['Empresa'], 'Discovery', 'Movido manualmente a Discovery', '');
  return { ok: true, message: client['Empresa'] + ' movido a Discovery.' };
}

/**
 * Pasa un cliente de Discovery a Calendario SIN enviar ningún mail.
 * Conserva OM/AM si ya fueron asignados y usa Round Robin solo para los faltantes.
 */
function moveToCalendar(id) {
  var found = findClientRow_(id);
  if (!found || found.source === LEBANE.sheets.history) throw new Error('No se encontró el cliente activo.');

  var sh     = found.sheet;
  var map    = getHeaderMap_(sh);
  var row    = found.row;
  var client = readObjectAtRow_(sh, row);

  if (client['Etapa'] === 'Calendario') {
    return { ok: true, message: 'El cliente ya está en Calendario.' };
  }

  var om = client['OM'] || '';
  var am = client['AM'] || '';

  if (!om) {
    om = nextRoundRobin_('OM', LEBANE.om);
    if (map['OM']) sh.getRange(row, map['OM']).setValue(om);
  }
  if (!am) {
    am = nextRoundRobin_('AM', LEBANE.am);
    if (map['AM']) sh.getRange(row, map['AM']).setValue(am);
  }

  var now = new Date();
  if (map['Etapa'])                sh.getRange(row, map['Etapa']).setValue('Calendario');
  if (map['Estado'])               sh.getRange(row, map['Estado']).setValue('Pendiente envío agenda');
  if (map['Fecha Ingreso Etapa'])  sh.getRange(row, map['Fecha Ingreso Etapa']).setValue(now);
  if (map['Última Actualización']) sh.getRange(row, map['Última Actualización']).setValue(now);

  SpreadsheetApp.flush();
  client = readObjectAtRow_(sh, row);

  // Todavía NO se crea una fila en la hoja Calendario. Esa fila se crea recién
  // cuando internamente se confirma la fecha real de la reunión.
  audit_(client['ID'], client['Empresa'], 'Calendario', 'Movido a Calendario', 'Pendiente envío agenda. OM: ' + om + ' · AM: ' + am);
  return {
    ok: true,
    message: client['Empresa'] + ' movido a Calendario. Ya podés enviarle el link de agenda.'
  };
}


/****************************************************
 * ESQUEMA DISCOVERY
 ****************************************************/
function ensureDiscoveryColumns_(sh) {
  var required = ['Fecha Discovery', 'Link Discovery'];
  var headers = getHeaders_(sh);

  required.forEach(function(header) {
    if (headers.indexOf(header) === -1) {
      var newCol = sh.getLastColumn() + 1;
      sh.getRange(1, newCol).setValue(header);
      headers.push(header);
    }
  });

  SpreadsheetApp.flush();
  return getHeaderMap_(sh);
}

/****************************************************
 * MAILS
 ****************************************************/
function sendWelcomeEmail(id) {
  var found = findClientRow_(id);
  if (!found) throw new Error('No se encontró el cliente.');

  var sh = found.sheet; var map = getHeaderMap_(sh); var row = found.row;
  var client = readObjectAtRow_(sh, row);
  var mails = splitEmails_(client['Mails']);
  if (!mails.length) throw new Error('El cliente no tiene mails válidos.');

  var html = welcomeEmailHtml_(client['Empresa']);
  GmailApp.sendEmail(mails.join(','), 'Bienvenidos a Lebane | Primer paso — ' + client['Empresa'], stripHtml_(html), {
    htmlBody: html, name: getConfig_('MAIL_FROM_NAME') || 'Equipo Lebane',
    cc: getConfig_('CC_IMPLEMENTACIONES') || ''
  });

  var now = new Date();
  if (map['Mail Bienvenida Enviado'])  sh.getRange(row, map['Mail Bienvenida Enviado']).setValue('✅');
  if (map['Fecha Envío Bienvenida'])   sh.getRange(row, map['Fecha Envío Bienvenida']).setValue(now);
  if (map['Estado'])                   sh.getRange(row, map['Estado']).setValue('Bienvenida enviada');
  if (map['Última Actualización'])     sh.getRange(row, map['Última Actualización']).setValue(now);

  audit_(client['ID'], client['Empresa'], client['Etapa'], 'Mail bienvenida enviado', mails.join(', '));
  return { ok: true, message: 'Bienvenida enviada.' };
}

function sendDiscoveryEmail(id) {
  var found = findClientRow_(id);
  if (!found) throw new Error('No se encontró el cliente.');

  var sh = found.sheet; var map = getHeaderMap_(sh); var row = found.row;
  var client = readObjectAtRow_(sh, row);
  var mails = splitEmails_(client['Mails']);
  if (!mails.length) throw new Error('El cliente no tiene mails válidos.');

  var fecha = client['Fecha Discovery'];
  var link  = client['Link Discovery'];
  if (!fecha || !link) throw new Error('Completá Fecha Discovery y Link Discovery antes de enviar.');

  var html = discoveryEmailHtml_(client['Empresa'], formatDate_(fecha), link);
  GmailApp.sendEmail(mails.join(','), 'Sesión de introducción a Lebane — ' + client['Empresa'], stripHtml_(html), {
    htmlBody: html, name: getConfig_('MAIL_FROM_NAME') || 'Equipo Lebane',
    cc: getConfig_('CC_IMPLEMENTACIONES') || ''
  });

  var now = new Date();
  if (map['Mail Discovery Enviado']) sh.getRange(row, map['Mail Discovery Enviado']).setValue('✅');
  if (map['Fecha Envío Discovery'])  sh.getRange(row, map['Fecha Envío Discovery']).setValue(now);
  if (map['Estado'])                 sh.getRange(row, map['Estado']).setValue('Discovery enviado');
  if (map['Última Actualización'])   sh.getRange(row, map['Última Actualización']).setValue(now);

  audit_(client['ID'], client['Empresa'], client['Etapa'], 'Mail Discovery enviado', '');
  return { ok: true, message: 'Discovery enviado.' };
}


function saveAndSendDiscovery(data) {
  data = data || {};

  var id = data.id || data.clientId;
  if (!id) throw new Error('Falta ID del cliente.');

  var fechaRaw = clean_(data.fecha);
  var link = clean_(data.link) || getConfig_('DISCOVERY_LUMA_LINK') || '';

  if (!fechaRaw) throw new Error('Falta fecha de la sesión.');
  if (!link) throw new Error('Falta link de la reunión.');

  var fecha = parseRobustDate_(fechaRaw);
  if (!fecha) {
    throw new Error('La Fecha Discovery no es válida: ' + fechaRaw);
  }

  var found = findClientRow_(id);
  if (!found || found.source === LEBANE.sheets.history) {
    throw new Error('No se encontró el cliente activo.');
  }

  var sh = found.sheet;
  var row = found.row;

  // Aseguramos físicamente las columnas necesarias.
  ensureColumnExists_(sh, 'Fecha Discovery');
  ensureColumnExists_(sh, 'Link Discovery');
  ensureColumnExists_(sh, 'Mail Discovery Enviado');
  ensureColumnExists_(sh, 'Fecha Envío Discovery');
  ensureColumnExists_(sh, 'Estado');
  ensureColumnExists_(sh, 'Última Actualización');

  var map = getHeaderMap_(sh);

  // Guardamos explícitamente la información cargada en el modal.
  sh.getRange(row, map['Fecha Discovery']).setValue(fecha);
  sh.getRange(row, map['Link Discovery']).setValue(link);
  sh.getRange(row, map['Última Actualización']).setValue(new Date());

  SpreadsheetApp.flush();

  // IMPORTANTE:
  // No volvemos a depender de una relectura inmediata de Fecha Discovery.
  // Usamos directamente los valores ingresados por el usuario para enviar el mail.
  return sendDiscoveryEmailWithData_(found, fecha, link);
}

function sendDiscoveryEmailWithData_(found, fecha, link) {
  if (!found || found.source === LEBANE.sheets.history) {
    throw new Error('No se encontró el cliente activo.');
  }

  var sh = found.sheet;
  var row = found.row;
  var map = getHeaderMap_(sh);
  var client = readObjectAtRow_(sh, row);

  var mails = splitEmails_(client['Mails']);
  if (!mails.length) {
    throw new Error('El cliente no tiene mails válidos.');
  }

  var empresa = client['Empresa'] || '';

  var html = discoveryEmailHtml_(
    empresa,
    formatDate_(fecha),
    link
  );

  GmailApp.sendEmail(
    mails.join(','),
    'Sesión de introducción a Lebane — ' + empresa,
    stripHtml_(html),
    {
      htmlBody: html,
      name: getConfig_('MAIL_FROM_NAME') || 'Equipo Lebane',
      cc: getConfig_('CC_IMPLEMENTACIONES') || ''
    }
  );

  var now = new Date();

  if (map['Mail Discovery Enviado']) {
    sh.getRange(row, map['Mail Discovery Enviado']).setValue('✅');
  }

  if (map['Fecha Envío Discovery']) {
    sh.getRange(row, map['Fecha Envío Discovery']).setValue(now);
  }

  if (map['Estado']) {
    sh.getRange(row, map['Estado']).setValue('Discovery enviado');
  }

  if (map['Última Actualización']) {
    sh.getRange(row, map['Última Actualización']).setValue(now);
  }

  SpreadsheetApp.flush();

  audit_(
    client['ID'],
    empresa,
    client['Etapa'],
    'Mail Discovery enviado',
    'Fecha Discovery: ' + formatDate_(fecha)
  );

  invalidateUiCache_();

  return {
    ok: true,
    message: 'Discovery enviado.'
  };
}

function sendCalendarEmail(id) {
  var found = findClientRow_(id);
  if (!found || found.source === LEBANE.sheets.history) throw new Error('No se encontró el cliente activo.');

  var sh = found.sheet;
  var map = getHeaderMap_(sh);
  var row = found.row;
  var client = readObjectAtRow_(sh, row);

  if (client['Etapa'] !== 'Calendario') {
    throw new Error('Primero pasá el cliente a la etapa Calendario.');
  }

  var om = client['OM'] || '';
  var am = client['AM'] || '';
  if (!om) {
    om = nextRoundRobin_('OM', LEBANE.om);
    if (map['OM']) sh.getRange(row, map['OM']).setValue(om);
  }
  if (!am) {
    am = nextRoundRobin_('AM', LEBANE.am);
    if (map['AM']) sh.getRange(row, map['AM']).setValue(am);
  }

  var calendarLink = getCalendarLinkForOm_(om);
  if (!calendarLink) throw new Error('El OM ' + om + ' no tiene link de calendario configurado.');

  SpreadsheetApp.flush();
  client = readObjectAtRow_(sh, row);
  var mails = splitEmails_(client['Mails']);
  if (!mails.length) throw new Error('El cliente no tiene mails válidos.');

  var html = calendarEmailHtml_(client['Empresa'], om, am, calendarLink);
  GmailApp.sendEmail(
    mails.join(','),
    'Agendá tu primera reunión de implementación — ' + client['Empresa'],
    stripHtml_(html),
    {
      htmlBody: html,
      name: getConfig_('MAIL_FROM_NAME') || 'Equipo Lebane',
      cc: getConfig_('CC_IMPLEMENTACIONES') || ''
    }
  );

  var now = new Date();
  if (map['Mail Calendario Enviado']) sh.getRange(row, map['Mail Calendario Enviado']).setValue('✅');
  if (map['Fecha Envío Calendario'])  sh.getRange(row, map['Fecha Envío Calendario']).setValue(now);
  if (map['Estado'])                  sh.getRange(row, map['Estado']).setValue('Agenda enviada');
  if (map['Última Actualización'])    sh.getRange(row, map['Última Actualización']).setValue(now);

  audit_(client['ID'], client['Empresa'], 'Calendario', 'Mail de agenda enviado', 'OM: ' + om + ' · AM: ' + am + ' · Calendario: ' + calendarLink);
  return { ok: true, message: 'Mail de agenda enviado. OM: ' + om + ' · AM: ' + am };
}

function sendStageReminder(id, stage) {
  var found = findClientRow_(id);
  if (!found) throw new Error('No se encontró el cliente.');

  var sh = found.sheet; var map = getHeaderMap_(sh); var row = found.row;
  var client = readObjectAtRow_(sh, row);
  var etapa  = stage || client['Etapa'] || 'Bienvenida';
  var mails  = splitEmails_(client['Mails']);
  if (!mails.length) throw new Error('Sin mails válidos.');

  var subject = '', html = '', fupCol = '';

  if (etapa === 'Bienvenida') {
    subject = 'Recordatorio | Nos falta tu Discovery — ' + client['Empresa'];
    html    = reminderWelcomeHtml_(client['Empresa']);
    fupCol  = 'FUP Bienvenida';

  } else if (etapa === 'Discovery') {
    subject = 'Recordatorio | Tu sesión de introducción — ' + client['Empresa'];
    var fechaDiscovery = client['Fecha Discovery'];
    var linkDiscovery  = client['Link Discovery'];
    html = reminderDiscoveryHtml_(
      client['Empresa'],
      fechaDiscovery ? formatDate_(fechaDiscovery) : '',
      linkDiscovery || ''
    );
    fupCol = 'FUP Discovery';

  } else {
    var om = client['OM'] || '';
    var am = client['AM'] || '';

    if (!om) {
      om = nextRoundRobin_('OM', LEBANE.om);
      if (map['OM']) sh.getRange(row, map['OM']).setValue(om);
    }
    if (!am) {
      am = nextRoundRobin_('AM', LEBANE.am);
      if (map['AM']) sh.getRange(row, map['AM']).setValue(am);
    }

    var calendarLink = getCalendarLinkForOm_(om);
    if (!calendarLink) throw new Error('El OM ' + om + ' no tiene link de calendario configurado.');

    subject = 'Recordatorio | Coordinemos tu reunión de implementación — ' + client['Empresa'];
    html    = reminderCalendarHtml_(client['Empresa'], om, am, calendarLink);
    fupCol  = 'FUP Calendario';
  }

  GmailApp.sendEmail(mails.join(','), subject, stripHtml_(html), {
    htmlBody: html,
    name: getConfig_('MAIL_FROM_NAME') || 'Equipo Lebane',
    cc: getConfig_('CC_IMPLEMENTACIONES') || ''
  });

  if (map[fupCol]) {
    var cur = Number(sh.getRange(row, map[fupCol]).getValue() || 0);
    sh.getRange(row, map[fupCol]).setValue(cur + 1);
  }
  if (map['Última Actualización']) sh.getRange(row, map['Última Actualización']).setValue(new Date());

  audit_(client['ID'], client['Empresa'], etapa, 'FUP enviado', '');
  return { ok: true, message: 'FUP enviado.' };
}


/****************************************************
 * REGLAS DE FECHAS
 ****************************************************/
function validateSeparatedDates_(client) {
  // Discovery y Reunión de implementación son conceptos distintos.
  // Nunca se debe reutilizar un campo para suplir al otro.
  return {
    discovery: {
      fecha: client['Fecha Discovery'] || '',
      link: client['Link Discovery'] || ''
    },
    reunion: {
      fecha: client['Fecha Reunión'] || '',
      link: client['Link Reunión'] || ''
    }
  };
}

/****************************************************
 * CALENDARIO / HISTÓRICO
 ****************************************************/
function confirmMeeting(data) {
  data = data || {};

  var id = data.id;
  if (!id) throw new Error('Falta ID del cliente.');

  var found = findClientRow_(id);
  if (!found || found.source === LEBANE.sheets.history) {
    throw new Error('No se encontró el cliente activo.');
  }

  var sh  = found.sheet;
  var row = found.row;

  var fecha = parseRobustDate_(data.fecha || '');
  if (!fecha) {
    throw new Error('Falta una fecha y hora de reunión válida.');
  }

  var link = clean_(data.link || '');
  var observaciones = clean_(data.observaciones || '');
  var now = new Date();

  // Asegurar físicamente las columnas antes de guardar.
  // Esto evita que una hoja vieja ignore silenciosamente la Fecha Reunión.
  ensureColumnExists_(sh, 'Fecha Reunión');
  ensureColumnExists_(sh, 'Link Reunión');
  ensureColumnExists_(sh, 'Estado');
  ensureColumnExists_(sh, 'Observaciones');
  ensureColumnExists_(sh, 'Última Actualización');

  // Refrescar el mapa luego de crear columnas faltantes.
  var map = getHeaderMap_(sh);

  sh.getRange(row, map['Fecha Reunión']).setValue(fecha);
  sh.getRange(row, map['Link Reunión']).setValue(link);
  sh.getRange(row, map['Estado']).setValue('Reunión agendada');
  sh.getRange(row, map['Observaciones']).setValue(observaciones);
  sh.getRange(row, map['Última Actualización']).setValue(now);

  SpreadsheetApp.flush();

  // Volver a leer el cliente, pero forzar además los datos ingresados en el modal.
  // Así Calendario nunca depende de una lectura vieja o de una columna faltante.
  var client = readObjectAtRow_(sh, row);

  client['Fecha Reunión'] = fecha;
  client['Link Reunión'] = link;
  client['Estado'] = 'Reunión agendada';
  client['Observaciones'] = observaciones;

  // La hoja Calendario se alimenta EXCLUSIVAMENTE con la fecha ingresada
  // en "Registrar reunión".
  upsertCalendar_(client, fecha);

  setCalendarStatus_(client['ID'], 'Agendada', '');

  // Paso interno: no envía mail.
  // Una vez registrada la reunión, pasa a Histórico.
  archiveClientAfterMeetingScheduled_(found, client);

  invalidateUiCache_();

  return {
    ok: true,
    message:
      'Reunión registrada para ' +
      formatDate_(fecha) +
      '. Cliente movido a Histórico.'
  };
}

// Parseo de fecha robusto — acepta datetime-local, ISO, Date, o número
function parseRobustDate_(value) {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value) ? null : value;
  var s = String(value).trim();
  if (!s) return null;
  // datetime-local: "2026-07-06T11:00" o "2026-07-06 11:00"
  s = s.replace(' ', 'T');
  // Si no tiene segundos, agregar :00
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) s += ':00';
  var d = new Date(s);
  if (!isNaN(d)) return d;
  // Último intento con parseo nativo
  d = new Date(value);
  return isNaN(d) ? null : d;
}

function completeClient(id) {
  var found = findClientRow_(id);
  if (!found) throw new Error('No se encontró el cliente.');
  if (found.source === LEBANE.sheets.history) return { ok: true, message: 'Ya estaba en Histórico.' };

  var client = readObjectAtRow_(found.sheet, found.row);
  var result = archiveClient_(found, client, 'Completado', 'Cliente completado manualmente.');
  return { ok: true, message: client['Empresa'] + ' movido a Histórico.' };
}

function archiveClientAfterMeetingScheduled_(found, client) {
  // La reunión queda guardada en la hoja Calendario para reportería,
  // pero ya no debe aparecer en la VISUAL de Calendario porque el cliente
  // pasa inmediatamente a Histórico.
  return archiveClient_(
    found,
    client,
    'Histórico',
    'Reunión de implementación registrada. Cliente archivado.'
  );
}

function archiveClient_(found, client, calendarStatus, auditDetail) {
  var histSheet   = getSheet_(LEBANE.sheets.history);
  var histHeaders = getHeaders_(histSheet);
  var empresa     = client['Empresa'] || '';
  var totalFup = Number(client['FUP Bienvenida']||0)
    + Number(client['FUP Discovery']||0)
    + Number(client['FUP Calendario']||0);

  appendObject_(histSheet, histHeaders, {
    'ID': client['ID'],
    'Empresa': empresa,
    'Mails': client['Mails'],
    'Revenue': client['Revenue'],
    'Fecha Ingreso': client['Fecha Ingreso'] || '',
    'Reimplementado': normalizeYesNo_(client['Reimplementado'], 'NO'),
    'Estado': 'Histórico',
    'Mail Bienvenida': client['Mail Bienvenida Enviado'],
    'Respondió Form': client['Respondió Form'],
    'Link Respuestas': client['Link Respuestas'],
    'ID Respuesta Form': client['ID Respuesta Form'],
    'Mail Discovery': client['Mail Discovery Enviado'],
    'Mail Calendario': client['Mail Calendario Enviado'],
    'Fecha Discovery': client['Fecha Discovery'],
    'Link Discovery': client['Link Discovery'],
    'Asistió Discovery': client['Asistió Discovery'] || 'PENDIENTE',
    'OM': client['OM'],
    'AM': client['AM'],
    'Link Reunión': client['Link Reunión'],
    'Fecha Reunión': client['Fecha Reunión'],
    'Fecha Completo': new Date(),
    'FUP Bienvenida': Number(client['FUP Bienvenida'] || 0),
    'FUP Discovery': Number(client['FUP Discovery'] || 0),
    'FUP Calendario': Number(client['FUP Calendario'] || 0),
    'FUP Total': totalFup,
    'Observaciones': client['Observaciones'],
    'Comentarios Internos': client['Comentarios Internos']
  });

  setCalendarStatus_(client['ID'], calendarStatus || 'Completado', calendarStatus === 'Completado' ? new Date() : '');

  audit_(client['ID'], empresa, 'Histórico', auditDetail || 'Cliente archivado', '');
  found.sheet.deleteRow(found.row);

  // Importante: el cliente desaparece inmediatamente de Pipeline y de la
  // visual de Calendario, aunque la fila quede conservada en la hoja Calendario.
  invalidateUiCache_();

  return { ok: true };
}

function setCalendarStatus_(id, status, completedAt) {
  var sh = getSheet_(LEBANE.sheets.calendar);
  var map = getHeaderMap_(sh);
  var row = findRowByValue_(sh, 'ID', id);
  if (!row) return;
  if (map['Estado']) sh.getRange(row, map['Estado']).setValue(status || 'Agendada');
  if (completedAt && map['Fecha Completado']) sh.getRange(row, map['Fecha Completado']).setValue(completedAt);
}

function upsertCalendar_(client, explicitFechaReunion) {
  var sh      = getSheet_(LEBANE.sheets.calendar);
  var headers = getHeaders_(sh);
  var map     = getHeaderMap_(sh);
  var id      = client['ID'];

  // REGLA DE NEGOCIO:
  // Esta función debe ser llamada únicamente desde confirmMeeting()
  // (botón "Registrar reunión" en etapa Calendario).
  // La columna "Fecha" de la hoja Calendario usa SOLO "Fecha Reunión".
  // Nunca usa Fecha Discovery ni Fecha Ingreso Etapa.
  var fechaReunion = explicitFechaReunion || client['Fecha Reunión'];

  if (fechaReunion && !(fechaReunion instanceof Date)) {
    fechaReunion = parseRobustDate_(fechaReunion);
  }

  if (!fechaReunion || isNaN(fechaReunion)) {
    throw new Error(
      'No se pudo interpretar la Fecha Reunión cargada en Registrar reunión.'
    );
  }

  var existing = findRowByValue_(sh, 'ID', id);

  var obj = {
    'ID': id, 'Fecha': fechaReunion,
    'Empresa': client['Empresa'], 'Mails': client['Mails'],
    'Fecha Ingreso': client['Fecha Ingreso'] || '',
    'Fecha Discovery': client['Fecha Discovery'] || '',
    'Reimplementado': normalizeYesNo_(client['Reimplementado'], 'NO'),
    'OM': client['OM'], 'AM': client['AM'],
    'Link Reunión': client['Link Reunión'] || '',
    'Estado': client['Estado'] || 'Pendiente',
    'Fecha Creación': new Date(), 'Fecha Completado': '',
    'Observaciones': client['Observaciones'] || ''
  };

  if (existing) {
    Object.keys(obj).forEach(function(key) {
      if (map[key]) sh.getRange(existing, map[key]).setValue(obj[key]);
    });
  } else {
    appendObject_(sh, headers, obj);
  }
}

function markCalendarCompleted_(id) {
  var sh  = getSheet_(LEBANE.sheets.calendar);
  var map = getHeaderMap_(sh);
  var row = findRowByValue_(sh, 'ID', id);
  if (!row) return;
  if (map['Estado'])          sh.getRange(row, map['Estado']).setValue('Completado');
  if (map['Fecha Completado'])sh.getRange(row, map['Fecha Completado']).setValue(new Date());
}


function debugCalendarSourceRules() {
  var sh = getSheet_(LEBANE.sheets.calendar);
  var rows = safeReadObjects_(LEBANE.sheets.calendar);

  return {
    ok: true,
    calendarRows: rows.length,
    rule: 'Calendario.Fecha = Clientes y etapas.Fecha Reunión cargada desde Registrar reunión',
    sourceFunction: 'confirmMeeting -> upsertCalendar_',
    discoveryDateUsed: false,
    message: 'La hoja Calendario se alimenta únicamente desde Registrar reunión.'
  };
}


function migrateHistoryProfileFields_() {
  var hist = getSheet_(LEBANE.sheets.history);
  if (!hist || hist.getLastRow() < 2) return;

  var histHeaders = getHeaders_(hist);
  var h = {};
  histHeaders.forEach(function(name, idx){ h[name] = idx; });

  var values = hist.getRange(2, 1, hist.getLastRow() - 1, histHeaders.length).getValues();

  var calendarById = {};
  try {
    safeReadObjects_(LEBANE.sheets.calendar).forEach(function(r) {
      var id = String(r['ID'] || '');
      if (id) calendarById[id] = r;
    });
  } catch(e) {}

  var changed = false;

  for (var r = 0; r < values.length; r++) {
    var id = h['ID'] !== undefined ? String(values[r][h['ID']] || '') : '';
    var cal = calendarById[id] || null;

    if (h['Estado'] !== undefined && !values[r][h['Estado']]) {
      values[r][h['Estado']] = 'Histórico';
      changed = true;
    }

    if (cal) {
      if (h['Fecha Discovery'] !== undefined && !values[r][h['Fecha Discovery']] && cal['Fecha Discovery']) {
        values[r][h['Fecha Discovery']] = cal['Fecha Discovery'];
        changed = true;
      }

      if (h['Fecha Reunión'] !== undefined && !values[r][h['Fecha Reunión']] && cal['Fecha']) {
        values[r][h['Fecha Reunión']] = cal['Fecha'];
        changed = true;
      }

      if (h['Link Reunión'] !== undefined && !values[r][h['Link Reunión']] && cal['Link Reunión']) {
        values[r][h['Link Reunión']] = cal['Link Reunión'];
        changed = true;
      }

      if (h['Observaciones'] !== undefined && !values[r][h['Observaciones']] && cal['Observaciones']) {
        values[r][h['Observaciones']] = cal['Observaciones'];
        changed = true;
      }

      if (h['OM'] !== undefined && !values[r][h['OM']] && cal['OM']) {
        values[r][h['OM']] = cal['OM'];
        changed = true;
      }

      if (h['AM'] !== undefined && !values[r][h['AM']] && cal['AM']) {
        values[r][h['AM']] = cal['AM'];
        changed = true;
      }
    }
  }

  if (changed) {
    hist.getRange(2, 1, values.length, histHeaders.length).setValues(values);
  }
}


function debugCalendarDates() {
  var rows = safeReadObjects_(LEBANE.sheets.calendar);

  var result = rows.map(function(r) {
    var f = r['Fecha'];
    var parsed = (f instanceof Date && !isNaN(f)) ? f : parseRobustDate_(f);

    return {
      id: String(r['ID'] || ''),
      empresa: String(r['Empresa'] || ''),
      fechaCalendario: parsed ? formatDate_(parsed) : '',
      fechaDiscovery: r['Fecha Discovery'] ? formatDate_(r['Fecha Discovery']) : '',
      regla: 'La vista Calendario usa exclusivamente Fecha'
    };
  });

  Logger.log(JSON.stringify(result, null, 2));
  return {
    ok: true,
    count: result.length,
    rows: result,
    message: 'Calendario validado: la vista usa exclusivamente la columna Fecha.'
  };
}


function debugMeetingColumns() {
  var sh = getSheet_(LEBANE.sheets.clients);
  var headers = getHeaders_(sh);

  var required = [
    'Fecha Reunión',
    'Link Reunión',
    'Estado',
    'Observaciones',
    'Última Actualización'
  ];

  var missing = required.filter(function(h){
    return headers.indexOf(h) === -1;
  });

  return {
    ok: missing.length === 0,
    missing: missing,
    message: missing.length
      ? 'Faltan columnas: ' + missing.join(', ')
      : 'Columnas de reunión OK.'
  };
}


function repairCalendarHistoricalVisibility() {
  var cal = getSheet_(LEBANE.sheets.calendar);
  var map = getHeaderMap_(cal);
  var calendarRows = safeReadObjects_(LEBANE.sheets.calendar);
  var historyRows = safeReadObjects_(LEBANE.sheets.history);

  var historyIds = {};
  var historyKeys = {};

  historyRows.forEach(function(r) {
    var id = String(r['ID'] || '').trim();
    if (id) historyIds[id] = true;

    var empresaKey = normalizeText_(r['Empresa'] || '');
    var fecha = r['Fecha Reunión'];
    var parsed = fecha instanceof Date ? fecha : parseRobustDate_(fecha);

    if (empresaKey && parsed && !isNaN(parsed)) {
      historyKeys[
        empresaKey + '|' +
        Utilities.formatDate(parsed, LEBANE.timezone, 'yyyy-MM-dd HH:mm')
      ] = true;
    }
  });

  var updated = 0;

  calendarRows.forEach(function(r) {
    var shouldArchive = false;
    var id = String(r['ID'] || '').trim();

    if (id && historyIds[id]) {
      shouldArchive = true;
    } else {
      var empresaKey = normalizeText_(r['Empresa'] || '');
      var fecha = r['Fecha'];
      var parsed = fecha instanceof Date ? fecha : parseRobustDate_(fecha);

      if (empresaKey && parsed && !isNaN(parsed)) {
        var key =
          empresaKey + '|' +
          Utilities.formatDate(parsed, LEBANE.timezone, 'yyyy-MM-dd HH:mm');

        if (historyKeys[key]) shouldArchive = true;
      }
    }

    if (shouldArchive && map['Estado']) {
      var current = normalizeText_(r['Estado'] || '');

      if (current !== 'historico' && current !== 'histórico' && current !== 'completado') {
        cal.getRange(r.__row, map['Estado']).setValue('Histórico');
        updated++;
      }
    }
  });

  SpreadsheetApp.flush();
  invalidateUiCache_();

  return {
    ok: true,
    updated: updated,
    message:
      updated +
      ' fila(s) de Calendario fueron marcadas como Histórico. No se eliminó ninguna fila.'
  };
}

/****************************************************
 * OM CRUD
 ****************************************************/
function getOmList() {
  var sh      = getMainSpreadsheet_().getSheetByName(LEBANE.sheets.config);
  var baseOms = LEBANE.om;

  var extraRaw = '';
  if (sh) {
    var vals = sh.getDataRange().getValues();
    for (var i = 1; i < vals.length; i++) {
      if (String(vals[i][0]) === 'OM_EXTRA_LIST') { extraRaw = String(vals[i][1]||''); break; }
    }
  }

  var extraOms = extraRaw ? extraRaw.split('|').map(function(s){ return s.trim(); }).filter(Boolean) : [];
  var allOms   = baseOms.concat(extraOms);
  var seen = {};
  allOms = allOms.filter(function(o) {
    var k = o.toLowerCase();
    if (seen[k]) return false;
    seen[k] = true; return true;
  });

  var configVals = sh ? sh.getDataRange().getValues() : [];

  var result = allOms.map(function(omName) {
    var normKey    = normalizeText_(omName).replace(/\s+/g,'_').toUpperCase();
    var calKey     = 'OM_' + normKey + '_CALENDAR';
    var activeKey  = 'OM_' + normKey + '_ACTIVE';
    var deletedKey = 'OM_' + normKey + '_DELETED';
    var calLink = LEBANE.omCalendars[omName] || '';
    var active  = true;
    var deleted = false;

    for (var i = 1; i < configVals.length; i++) {
      var k = String(configVals[i][0]);
      var v = String(configVals[i][1]||'');
      if (k === calKey)     calLink = v || calLink;
      if (k === activeKey)  active  = v.toLowerCase() !== 'false';
      if (k === deletedKey) deleted = v.toLowerCase() === 'true';
    }
    return { name: omName, active: active, calendar: calLink, deleted: deleted };
  });

  return { ok: true, list: result.filter(function(o){ return !o.deleted; }) };
}

function toggleOmActive(omName, active) {
  if (!omName) throw new Error('Falta nombre del OM.');
  var sh  = getSheet_(LEBANE.sheets.config);
  var key = 'OM_' + normalizeText_(omName).replace(/\s+/g,'_').toUpperCase() + '_ACTIVE';
  _upsertConfig(sh, key, String(active));
  return { ok: true, message: omName + (active ? ' activado.' : ' desactivado.') };
}

function addOm(data) {
  data = data || {};
  var name     = clean_(data.name);
  var calendar = clean_(data.calendar);
  if (!name) throw new Error('Falta el nombre del OM.');

  var sh       = getSheet_(LEBANE.sheets.config);
  var existing = getOmList();
  var dup = existing.list.some(function(o){ return normalizeText_(o.name) === normalizeText_(name); });
  if (dup) throw new Error('Ya existe un OM con ese nombre.');

  var vals     = sh.getDataRange().getValues();
  var extraRaw = '';
  for (var i = 1; i < vals.length; i++) {
    if (String(vals[i][0]) === 'OM_EXTRA_LIST') { extraRaw = String(vals[i][1]||''); break; }
  }
  var extras = extraRaw ? extraRaw.split('|').filter(Boolean) : [];
  extras.push(name);
  _upsertConfig(sh, 'OM_EXTRA_LIST', extras.join('|'));

  var normKey = normalizeText_(name).replace(/\s+/g,'_').toUpperCase();
  if (calendar) _upsertConfig(sh, 'OM_' + normKey + '_CALENDAR', calendar);
  _upsertConfig(sh, 'OM_' + normKey + '_ACTIVE',  'true');
  _upsertConfig(sh, 'OM_' + normKey + '_DELETED', 'false');

  return { ok: true, message: 'OM ' + name + ' agregado.' };
}

function editOm(data) {
  data = data || {};
  var name     = clean_(data.name);
  var calendar = clean_(data.calendar);
  if (!name) throw new Error('Falta el nombre del OM.');
  var sh      = getSheet_(LEBANE.sheets.config);
  var normKey = normalizeText_(name).replace(/\s+/g,'_').toUpperCase();
  if (calendar !== undefined) _upsertConfig(sh, 'OM_' + normKey + '_CALENDAR', calendar);
  _upsertConfig(sh, 'OM_' + normKey + '_ACTIVE', String(data.active !== undefined ? data.active : true));
  return { ok: true, message: 'OM ' + name + ' actualizado.' };
}

function deleteOm(omName) {
  if (!omName) throw new Error('Falta el nombre del OM.');
  var sh      = getSheet_(LEBANE.sheets.config);
  var normKey = normalizeText_(omName).replace(/\s+/g,'_').toUpperCase();
  _upsertConfig(sh, 'OM_' + normKey + '_DELETED', 'true');
  _upsertConfig(sh, 'OM_' + normKey + '_ACTIVE',  'false');
  return { ok: true, message: 'OM ' + omName + ' eliminado.' };
}

/****************************************************
 * AM (ACCOUNT MANAGER)
 ****************************************************/
function getAmList() {
  var sh       = getMainSpreadsheet_().getSheetByName(LEBANE.sheets.config);
  var baseAms  = LEBANE.am;

  var extraRaw = '';
  if (sh) {
    var vals = sh.getDataRange().getValues();
    for (var i = 1; i < vals.length; i++) {
      if (String(vals[i][0]) === 'AM_EXTRA_LIST') { extraRaw = String(vals[i][1]||''); break; }
    }
  }

  var extraAms = extraRaw ? extraRaw.split('|').map(function(s){ return s.trim(); }).filter(Boolean) : [];
  var allAms   = baseAms.concat(extraAms);
  var seen = {};
  allAms = allAms.filter(function(a) {
    var k = a.toLowerCase();
    if (seen[k]) return false;
    seen[k] = true; return true;
  });

  var configVals = sh ? sh.getDataRange().getValues() : [];

  var result = allAms.map(function(amEmail) {
    var normKey    = normalizeText_(amEmail).replace(/[\s@.]/g,'_').toUpperCase();
    var activeKey  = 'AM_' + normKey + '_ACTIVE';
    var deletedKey = 'AM_' + normKey + '_DELETED';
    var active  = true;
    var deleted = false;

    for (var i = 1; i < configVals.length; i++) {
      var k = String(configVals[i][0]);
      var v = String(configVals[i][1]||'');
      if (k === activeKey)  active  = v.toLowerCase() !== 'false';
      if (k === deletedKey) deleted = v.toLowerCase() === 'true';
    }
    return { email: amEmail, active: active, deleted: deleted };
  });

  return { ok: true, list: result.filter(function(a){ return !a.deleted; }) };
}

function toggleAmActive(amEmail, active) {
  if (!amEmail) throw new Error('Falta email del AM.');
  var sh  = getSheet_(LEBANE.sheets.config);
  var key = 'AM_' + normalizeText_(amEmail).replace(/[\s@.]/g,'_').toUpperCase() + '_ACTIVE';
  _upsertConfig(sh, key, String(active));
  return { ok: true, message: amEmail + (active ? ' activado.' : ' desactivado.') };
}

function addAm(data) {
  data = data || {};
  var email    = clean_(data.email);
  if (!email) throw new Error('Falta el email del AM.');

  var sh       = getSheet_(LEBANE.sheets.config);
  var existing = getAmList();
  var dup = existing.list.some(function(a){ return normalizeText_(a.email) === normalizeText_(email); });
  if (dup) throw new Error('Ya existe un AM con ese email.');

  var vals     = sh.getDataRange().getValues();
  var extraRaw = '';
  for (var i = 1; i < vals.length; i++) {
    if (String(vals[i][0]) === 'AM_EXTRA_LIST') { extraRaw = String(vals[i][1]||''); break; }
  }
  var extras = extraRaw ? extraRaw.split('|').filter(Boolean) : [];
  extras.push(email);
  _upsertConfig(sh, 'AM_EXTRA_LIST', extras.join('|'));

  var normKey = normalizeText_(email).replace(/[\s@.]/g,'_').toUpperCase();
  _upsertConfig(sh, 'AM_' + normKey + '_ACTIVE',  'true');
  _upsertConfig(sh, 'AM_' + normKey + '_DELETED', 'false');

  return { ok: true, message: 'AM ' + email + ' agregado.' };
}

function editAm(data) {
  data = data || {};
  var email    = clean_(data.email);
  if (!email) throw new Error('Falta el email del AM.');
  var sh       = getSheet_(LEBANE.sheets.config);
  var normKey  = normalizeText_(email).replace(/[\s@.]/g,'_').toUpperCase();
  _upsertConfig(sh, 'AM_' + normKey + '_ACTIVE', String(data.active !== undefined ? data.active : true));
  return { ok: true, message: 'AM ' + email + ' actualizado.' };
}

function deleteAm(amEmail) {
  if (!amEmail) throw new Error('Falta el email del AM.');
  var sh      = getSheet_(LEBANE.sheets.config);
  var normKey = normalizeText_(amEmail).replace(/[\s@.]/g,'_').toUpperCase();
  _upsertConfig(sh, 'AM_' + normKey + '_DELETED', 'true');
  _upsertConfig(sh, 'AM_' + normKey + '_ACTIVE',  'false');
  return { ok: true, message: 'AM ' + amEmail + ' eliminado.' };
}

function _upsertConfig(sh, key, value) {
  try { CacheService.getScriptCache().remove('CFG_' + key); } catch(e) {}
  var vals = sh.getDataRange().getValues();
  for (var i = 1; i < vals.length; i++) {
    if (String(vals[i][0]) === key) { sh.getRange(i+1, 2).setValue(value); return; }
  }
  sh.appendRow([key, value, '']);
}

/****************************************************
 * ROUND ROBIN
 ****************************************************/
function nextRoundRobin_(type, list) {
  var props = PropertiesService.getScriptProperties();
  var key   = 'RR_' + type;

  var activeList = list;
  if (type === 'OM') {
    try {
      var omData    = getOmList();
      var activeOms = (omData.list||[]).filter(function(o){ return o.active; }).map(function(o){ return o.name; });
      if (activeOms.length > 0) activeList = activeOms;
    } catch(e) { Logger.log('RR OM filter error: ' + e.message); }
  }

  var current = Number(props.getProperty(key) || 0);
  var value   = activeList[current % activeList.length];
  props.setProperty(key, String(current + 1));
  return value;
}

/****************************************************
 * FORM RESPONSES
 ****************************************************/
function syncFormResponses() {
  var source = getFormResponsesSheet_();
  var values = source.getDataRange().getValues();

  if (values.length < 2) {
    return {
      ok: true,
      message: 'La hoja correcta fue encontrada, pero no tiene respuestas.',
      sourceSheet: source.getName(),
      sourceGid: source.getSheetId()
    };
  }

  var headers = values[0].map(function(h){ return String(h || '').trim(); });

  var timestampIdx = detectColumn_(headers, ['marca temporal', 'timestamp']);
  if (timestampIdx < 0) timestampIdx = 0;

  var empresaIdx  = detectColumn_(headers, ['empresa','compañ','razon','razón','organizacion','organización']);
  var mailIdx     = detectColumn_(headers, ['mail','email','correo']);
  var clientIdIdx = detectColumn_(headers, ['id cliente','client id','codigo onboarding','código onboarding','id onboarding']);

  if (empresaIdx < 0 && mailIdx < 0 && clientIdIdx < 0) {
    throw new Error(
      'Estoy leyendo la hoja "' + source.getName() + '" (gid ' + source.getSheetId() + '), ' +
      'pero no pude detectar columnas de Empresa, Email o ID Cliente. Encabezados: ' +
      headers.join(' | ')
    );
  }

  var cutoff = new Date(LEBANE.form.syncFrom + 'T00:00:00-03:00');

  var unmatchedSheet   = getSheet_(LEBANE.sheets.unmatched);
  var unmatchedHeaders = getHeaders_(unmatchedSheet);
  var unmatchedRows    = safeReadObjects_(LEBANE.sheets.unmatched);

  var unmatchedById = {};
  unmatchedRows.forEach(function(r){
    var rid = String(r['Response ID'] || '');
    if (rid) unmatchedById[rid] = r;
  });

  var processedSet = {};
  safeReadObjects_(LEBANE.sheets.clients).forEach(function(r){
    var rid = String(r['ID Respuesta Form'] || '');
    if (rid) processedSet[rid] = true;
  });
  safeReadObjects_(LEBANE.sheets.history).forEach(function(r){
    var rid = String(r['ID Respuesta Form'] || '');
    if (rid) processedSet[rid] = true;
  });

  var clientIndex = buildClientMatchIndex_();
  var matched = 0;
  var newUnmatched = 0;
  var pendingRetried = 0;
  var skippedBeforeDate = 0;
  var invalidDates = 0;
  var rowsFromCutoff = 0;

  var firstSeen = null;
  var lastSeen = null;

  var unmatchedMap = getHeaderMap_(unmatchedSheet);

  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var rowNum = i + 1;
    var responseId = 'FORM_ROW_' + rowNum;

    var responseDate = parseFormTimestamp_(row[timestampIdx]);

    if (!responseDate) {
      invalidDates++;
      continue;
    }

    if (!firstSeen || responseDate < firstSeen) firstSeen = responseDate;
    if (!lastSeen || responseDate > lastSeen) lastSeen = responseDate;

    if (responseDate < cutoff) {
      skippedBeforeDate++;
      continue;
    }

    rowsFromCutoff++;

    if (processedSet[responseId]) continue;

    var existing = unmatchedById[responseId] || null;
    var existingStatus = existing
      ? String(existing['Estado'] || '').toLowerCase()
      : '';

    // Las respuestas pendientes se reintentan para permitir match
    // cuando el cliente fue cargado después.
    if (existingStatus === 'matcheada' || existingStatus === 'ignorada') continue;

    var empresa  = empresaIdx >= 0 ? clean_(row[empresaIdx]) : '';
    var mails    = mailIdx >= 0 ? clean_(row[mailIdx]) : '';
    var clientId = clientIdIdx >= 0 ? clean_(row[clientIdIdx]) : '';

    var rowText = row.map(function(v){
      return String(v || '');
    }).join(' ');

    var found = findMatchingClientFromIndex_(
      clientIndex,
      empresa,
      mails,
      rowText,
      clientId
    );

    var link = buildFormRowLink_(source, rowNum);

    if (found) {
      applyFormMatchToClient_(found, responseId, link);
      processedSet[responseId] = true;

      if (existing && existing.__row && unmatchedMap['Estado']) {
        unmatchedSheet
          .getRange(existing.__row, unmatchedMap['Estado'])
          .setValue('Matcheada');
      }

      matched++;
      continue;
    }

    if (existing) {
      pendingRetried++;
      continue;
    }

    var json = JSON.stringify(
      headers.map(function(h, idx){
        return { label: h, value: row[idx] };
      })
    );

    appendObject_(unmatchedSheet, unmatchedHeaders, {
      'Response ID': responseId,
      'Fecha Registro': responseDate,
      'Empresa': empresa,
      'Mails': mails,
      'Fila': rowNum,
      'Estado': 'Pendiente',
      'Link Respuesta': link,
      'Datos JSON': json
    });

    unmatchedById[responseId] = {
      'Response ID': responseId,
      'Estado': 'Pendiente'
    };

    newUnmatched++;
  }

  return {
    ok: true,
    sourceSpreadsheetId: LEBANE.form.spreadsheetId,
    sourceSheet: source.getName(),
    sourceGid: source.getSheetId(),
    totalRows: Math.max(0, values.length - 1),
    rowsFromCutoff: rowsFromCutoff,
    matched: matched,
    newUnmatched: newUnmatched,
    pendingRetried: pendingRetried,
    skippedBeforeDate: skippedBeforeDate,
    invalidDates: invalidDates,
    firstResponse: firstSeen ? formatDate_(firstSeen) : '',
    lastResponse: lastSeen ? formatDate_(lastSeen) : '',
    message:
      'Fuente: ' + source.getName() + ' (gid ' + source.getSheetId() + '). ' +
      'Desde 01/09/2026: ' + rowsFromCutoff +
      ' · Matcheadas: ' + matched +
      ' · Nuevas sin match: ' + newUnmatched +
      ' · Pendientes reintentadas: ' + pendingRetried +
      ' · Anteriores omitidas: ' + skippedBeforeDate +
      (invalidDates ? ' · Fechas inválidas: ' + invalidDates : '')
  };
}

function parseFormTimestamp_(value) {
  if (!value) return null;

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  var s = String(value).trim();
  if (!s) return null;

  // dd/MM/yyyy HH:mm:ss o dd/MM/yyyy HH:mm
  var m = s.match(
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );

  if (m) {
    var d = new Date(
      Number(m[3]),
      Number(m[2]) - 1,
      Number(m[1]),
      Number(m[4] || 0),
      Number(m[5] || 0),
      Number(m[6] || 0)
    );

    return isNaN(d.getTime()) ? null : d;
  }

  var parsed = new Date(s);
  return isNaN(parsed.getTime()) ? null : parsed;
}


function getRecentFormResponses(payload) {
  payload = payload || {};

  var source = getFormResponsesSheet_();
  var values = source.getDataRange().getValues();

  if (values.length < 2) {
    return {
      ok: true,
      responses: [],
      recent: [],
      count: 0,
      message: 'No hay respuestas en la hoja del formulario.'
    };
  }

  var headers = values[0].map(function(h){
    return String(h || '').trim();
  });

  var timestampIdx = detectColumn_(headers, ['marca temporal', 'timestamp']);
  if (timestampIdx < 0) timestampIdx = 0;

  var empresaIdx = detectColumn_(headers, [
    'empresa','compañ','razon','razón','organizacion','organización'
  ]);

  var mailIdx = detectColumn_(headers, [
    'mail','email','correo'
  ]);

  var clientIdIdx = detectColumn_(headers, [
    'id cliente','client id','codigo onboarding','código onboarding','id onboarding'
  ]);

  var fromValue = clean_(payload.from || payload.desde || LEBANE.form.syncFrom || '2026-09-01');
  var cutoff = new Date(fromValue + 'T00:00:00-03:00');

  var limit = Number(payload.limit || 50);
  if (!limit || limit < 1) limit = 50;
  if (limit > 200) limit = 200;

  // Índice de respuestas ya vinculadas a clientes.
  var matchedByResponse = {};

  safeReadObjects_(LEBANE.sheets.clients).forEach(function(r){
    var rid = String(r['ID Respuesta Form'] || '');
    if (!rid) return;

    matchedByResponse[rid] = {
      estado: 'Matcheada',
      clientId: String(r['ID'] || ''),
      clientName: String(r['Empresa'] || ''),
      etapa: String(r['Etapa'] || '')
    };
  });

  safeReadObjects_(LEBANE.sheets.history).forEach(function(r){
    var rid = String(r['ID Respuesta Form'] || '');
    if (!rid) return;

    matchedByResponse[rid] = {
      estado: 'Matcheada',
      clientId: String(r['ID'] || ''),
      clientName: String(r['Empresa'] || ''),
      etapa: 'Histórico'
    };
  });

  // Índice de la bandeja de "sin match".
  var unmatchedByResponse = {};
  safeReadObjects_(LEBANE.sheets.unmatched).forEach(function(r){
    var rid = String(r['Response ID'] || '');
    if (!rid) return;

    unmatchedByResponse[rid] = {
      estado: String(r['Estado'] || 'Pendiente'),
      empresa: String(r['Empresa'] || ''),
      mails: String(r['Mails'] || ''),
      row: r.__row
    };
  });

  var clientIndex = buildClientMatchIndex_();
  var list = [];

  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var rowNum = i + 1;
    var responseId = 'FORM_ROW_' + rowNum;

    var fecha = parseFormTimestamp_(row[timestampIdx]);
    if (!fecha) continue;
    if (fecha < cutoff) continue;

    var empresa = empresaIdx >= 0 ? clean_(row[empresaIdx]) : '';
    var mails = mailIdx >= 0 ? clean_(row[mailIdx]) : '';
    var explicitClientId = clientIdIdx >= 0 ? clean_(row[clientIdIdx]) : '';

    var rowText = row.map(function(v){
      return String(v || '');
    }).join(' ');

    var status = matchedByResponse[responseId] || unmatchedByResponse[responseId] || null;

    // Si todavía no está registrada ni vinculada, mostrar si hoy tendría match.
    var liveMatch = null;
    if (!status) {
      liveMatch = findMatchingClientFromIndex_(
        clientIndex,
        empresa,
        mails,
        rowText,
        explicitClientId
      );
    }

    var estado = 'Sin procesar';
    var matchedClientId = '';
    var matchedClientName = '';
    var etapaCliente = '';

    if (status) {
      estado = status.estado || 'Pendiente';
      matchedClientId = status.clientId || '';
      matchedClientName = status.clientName || '';
      etapaCliente = status.etapa || '';
    } else if (liveMatch) {
      estado = 'Match disponible';
      matchedClientId = liveMatch.id || '';
      matchedClientName = liveMatch.empresaRaw || '';
    }

    var pairs = headers.map(function(h, idx){
      return {
        label: h,
        value: row[idx] instanceof Date
          ? formatDate_(row[idx])
          : String(row[idx] == null ? '' : row[idx])
      };
    });

    list.push({
      responseId: responseId,
      id: responseId,
      fila: rowNum,
      row: rowNum,
      fecha: formatDate_(fecha),
      fechaIso: fecha.toISOString(),
      empresa: empresa,
      mails: mails,
      estado: estado,
      status: estado,
      clientId: matchedClientId,
      clientName: matchedClientName,
      cliente: matchedClientName,
      etapaCliente: etapaCliente,
      linkRespuesta: buildFormRowLink_(source, rowNum),
      response: pairs,
      data: pairs
    });
  }

  // Más nuevas primero
  list.sort(function(a, b){
    return new Date(b.fechaIso) - new Date(a.fechaIso);
  });

  list = list.slice(0, limit);

  return {
    ok: true,
    responses: list,
    recent: list,
    items: list,
    count: list.length,
    sourceSheet: source.getName(),
    sourceGid: source.getSheetId(),
    from: fromValue,
    message: 'Últimas respuestas desde ' + fromValue + ': ' + list.length + '.'
  };
}

function getFormResponseDetails(payload) {
  payload = payload || {};
  var responseId = payload.responseId || '';

  if (payload.clientId) {
    var found = findClientRow_(payload.clientId);
    if (found) responseId = readObjectAtRow_(found.sheet, found.row)['ID Respuesta Form'];
  }

  if (!responseId) return { ok: true, response: [] };

  var unmatched = findUnmatchedByResponseId_(responseId);
  if (unmatched) {
    try { return { ok: true, response: JSON.parse(unmatched['Datos JSON']||'[]') }; }
    catch(e) { return { ok: true, response: [] }; }
  }

  if (String(responseId).indexOf('FORM_ROW_') === 0) {
    var rowNumber = Number(String(responseId).replace('FORM_ROW_',''));
    var src = getFormResponsesSheet_();
    var vals = src.getDataRange().getValues();
    if (vals.length >= rowNumber) {
      var hdrs = vals[0];
      var r    = vals[rowNumber - 1];
      return { ok: true, response: hdrs.map(function(h,i){ return { label: h, value: r[i] }; }) };
    }
  }
  return { ok: true, response: [] };
}

function matchUnmatchedResponse(data) {
  data = data || {};
  if (!data.responseId) throw new Error('Falta responseId.');
  if (!data.clientId)   throw new Error('Falta clientId.');

  var unmatched = findUnmatchedByResponseId_(data.responseId);
  if (!unmatched) throw new Error('No se encontró la respuesta.');

  var foundClient = findClientRow_(data.clientId);
  if (!foundClient) throw new Error('No se encontró el cliente.');

  applyFormMatchToClient_(foundClient, data.responseId, unmatched['Link Respuesta']);
  setUnmatchedStatus_(data.responseId, 'Matcheada');

  var client = readObjectAtRow_(foundClient.sheet, foundClient.row);
  audit_(client['ID'], client['Empresa'], client['Etapa'], 'Respuesta matcheada manualmente', '');
  return { ok: true, message: 'Respuesta matcheada.' };
}

function ignoreUnmatchedResponse(responseId) {
  if (!responseId) throw new Error('Falta responseId.');
  setUnmatchedStatus_(responseId, 'Ignorada');
  return { ok: true, message: 'Respuesta ignorada.' };
}

function ignoreUnmatchedResponses(responseIds) {
  responseIds = responseIds || [];
  if (!Array.isArray(responseIds) || !responseIds.length) throw new Error('No hay respuestas seleccionadas.');

  var wanted = {};
  responseIds.forEach(function(id){ wanted[String(id)] = true; });

  var sh = getSheet_(LEBANE.sheets.unmatched);
  if (sh.getLastRow() < 2) return { ok: true, message: 'No había respuestas para ignorar.' };

  var values  = sh.getDataRange().getValues();
  var headers = values[0].map(function(h){ return String(h||'').trim(); });
  var idIdx   = headers.indexOf('Response ID');
  var stIdx   = headers.indexOf('Estado');
  if (idIdx < 0 || stIdx < 0) throw new Error('Faltan columnas en Respuestas sin match.');

  var changed = 0;
  for (var i = 1; i < values.length; i++) {
    var rid = String(values[i][idIdx] || '');
    if (wanted[rid]) {
      values[i][stIdx] = 'Ignorada';
      changed++;
    }
  }

  var statusValues = values.slice(1).map(function(r){ return [r[stIdx]]; });
  if (statusValues.length) sh.getRange(2, stIdx + 1, statusValues.length, 1).setValues(statusValues);

  return { ok: true, message: changed + ' respuesta(s) ignorada(s).' };
}

function applyFormMatchToClient_(found, responseId, link) {
  var sh      = found.sheet;
  var row     = found.row;
  var headers = getHeaders_(sh);
  var values  = sh.getRange(row, 1, 1, headers.length).getValues()[0];
  var idx     = {};
  headers.forEach(function(h, i){ idx[h] = i; });

  var client = {};
  headers.forEach(function(h, i){ client[h] = values[i]; });

  var now = new Date();
  if (idx['Respondió Form'] !== undefined) values[idx['Respondió Form']] = 'SI';
  if (idx['Link Respuestas'] !== undefined) values[idx['Link Respuestas']] = link;
  if (idx['ID Respuesta Form'] !== undefined) values[idx['ID Respuesta Form']] = responseId;

  if (client['Etapa'] === 'Bienvenida') {
    if (idx['Etapa'] !== undefined) values[idx['Etapa']] = 'Discovery';
    if (idx['Fecha Ingreso Etapa'] !== undefined) values[idx['Fecha Ingreso Etapa']] = now;
  }
  if (idx['Estado'] !== undefined) values[idx['Estado']] = 'Form respondido';
  if (idx['Última Actualización'] !== undefined) values[idx['Última Actualización']] = now;

  sh.getRange(row, 1, 1, headers.length).setValues([values]);
  audit_(client['ID'], client['Empresa'], 'Discovery', 'Form respondido', '');
  invalidateUiCache_();
}

/****************************************************
 * TRIGGER FORM EN TIEMPO REAL
 ****************************************************/
function onFormSubmitTrigger(e) {
  try {
    var source  = (e && e.range) ? e.range.getSheet() : getFormResponsesSheet_();
    var rowNum  = (e && e.range) ? e.range.getRow() : source.getLastRow();
    var lastCol = source.getLastColumn();

    var headers = source.getRange(1, 1, 1, lastCol).getValues()[0]
      .map(function(h){ return String(h||'').trim(); });

    var row = (e && e.values && e.values.length)
      ? e.values
      : source.getRange(rowNum, 1, 1, lastCol).getValues()[0];

    var empresaIdx  = detectColumn_(headers, ['empresa','compañ','razon','razón','organizacion','organización']);
    var mailIdx     = detectColumn_(headers, ['mail','email','correo']);
    var clientIdIdx = detectColumn_(headers, ['id cliente','client id','codigo onboarding','código onboarding','id onboarding']);

    var responseId = 'FORM_ROW_' + rowNum;

    var active = safeReadObjects_(LEBANE.sheets.clients);
    if (active.some(function(r){ return String(r['ID Respuesta Form']||'') === responseId; })) return;

    var empresa  = empresaIdx >= 0 ? clean_(row[empresaIdx]) : '';
    var mails    = mailIdx >= 0 ? clean_(row[mailIdx]) : '';
    var clientId = clientIdIdx >= 0 ? clean_(row[clientIdIdx]) : '';
    var rowText  = row.map(function(v){ return String(v||''); }).join(' ');
    var link     = buildFormRowLink_(source, rowNum);
    var json     = JSON.stringify(headers.map(function(h,i){ return { label: h, value: row[i] }; }));

    var found = findMatchingClientFromIndex_(buildClientMatchIndex_(), empresa, mails, rowText, clientId);

    if (found) {
      applyFormMatchToClient_(found, responseId, link);
      setUnmatchedStatus_(responseId, 'Matcheada');

      try {
        var cc = getConfig_('CC_IMPLEMENTACIONES');
        if (cc) GmailApp.sendEmail(
          cc,
          '✅ Form respondido — ' + (empresa || 'Cliente'),
          (empresa || 'Un cliente') + ' completó el formulario y fue movido a Discovery.',
          { name: getConfig_('MAIL_FROM_NAME') || 'Lebane Onboarding' }
        );
      } catch(me) {}
    } else {
      var existing = findUnmatchedByResponseId_(responseId);
      if (!existing) {
        var us = getSheet_(LEBANE.sheets.unmatched);
        appendObject_(us, getHeaders_(us), {
          'Response ID': responseId, 'Fecha Registro': new Date(),
          'Empresa': empresa, 'Mails': mails, 'Fila': rowNum,
          'Estado': 'Pendiente', 'Link Respuesta': link, 'Datos JSON': json
        });
      }
    }
  } catch(err) {
    Logger.log('[onFormSubmitTrigger] ' + err.message);
  }
}

function installFormTrigger() {
  var triggers = ScriptApp.getProjectTriggers();

  for (var i = triggers.length - 1; i >= 0; i--) {
    if (triggers[i].getHandlerFunction() === 'onFormSubmitTrigger') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  try {
    var formSS = SpreadsheetApp.openById(LEBANE.form.spreadsheetId);

    ScriptApp.newTrigger('onFormSubmitTrigger')
      .forSpreadsheet(formSS)
      .onFormSubmit()
      .create();

    return { ok: true, message: '✅ Trigger instalado. Las respuestas se procesan al enviarse el Form.' };
  } catch(err) {
    return { ok: false, message: 'Error: ' + err.message };
  }
}

function getFormTriggerStatus() {
  var triggers = ScriptApp.getProjectTriggers();
  var installed = triggers.some(function(t){ return t.getHandlerFunction() === 'onFormSubmitTrigger'; });
  return { ok: true, installed: installed };
}

/****************************************************
 * AUTOMATIZACIONES
 ****************************************************/
function installOnboardingTriggers() {
  var existing  = ScriptApp.getProjectTriggers();
  var hasScheduled = existing.some(function(t){ return t.getHandlerFunction() === 'runScheduledOnboardingAutomation'; });
  if (!hasScheduled) ScriptApp.newTrigger('runScheduledOnboardingAutomation').timeBased().everyHours(1).create();
  var formResult = installFormTrigger();
  return { ok: true, message: 'Automatizaciones instaladas. Form trigger: ' + formResult.message };
}

function runScheduledOnboardingAutomation() {
  sendDueWelcomeEmails_();
  try { syncFormResponses(); } catch(e) { Logger.log('Sync error: ' + e.message); }
}

function sendDueWelcomeEmails_() {
  var sh  = getSheet_(LEBANE.sheets.clients);
  var map = getHeaderMap_(sh);
  var values = sh.getDataRange().getValues();
  if (values.length < 2) return;
  var now = new Date();

  for (var i = 1; i < values.length; i++) {
    var row  = values[i];
    var id   = map['ID'] ? row[map['ID']-1] : '';
    var sent = map['Mail Bienvenida Enviado'] ? row[map['Mail Bienvenida Enviado']-1] : '';
    var sched= map['Fecha Programada Bienvenida'] ? row[map['Fecha Programada Bienvenida']-1] : '';
    if (!id || sent === '✅' || !sched) continue;
    var sd = new Date(sched);
    if (!isNaN(sd) && sd <= now) {
      try { sendWelcomeEmail(id); }
      catch(e) { Logger.log('Error bienvenida programada: ' + e.message); }
    }
  }
}

/****************************************************
 * HTML MAILS — UX / COMUNICACIÓN
 *
 * Principios:
 * - Un solo objetivo por mail.
 * - Un CTA principal y centrado.
 * - El cliente siempre entiende: dónde está, qué hacer y qué sigue.
 * - Diseño compatible con Gmail (tablas + estilos inline).
 ****************************************************/

function emailLayout_(options) {
  options = options || {};

  var title       = options.title || '';
  var subtitle    = options.subtitle || '';
  var preheader   = options.preheader || '';
  var step        = options.step || '';
  var stepBg      = options.stepBg || '#EEF4FF';
  var stepColor   = options.stepColor || '#125BFF';
  var bodyHtml    = options.bodyHtml || '';
  var buttonText  = options.buttonText || '';
  var buttonUrl   = options.buttonUrl || '';
  var nextText    = options.nextText || '';
  var footerText  = options.footerText || 'Equipo de Implementaciones · Lebane';

  var stepHtml = '';
  if (step) {
    stepHtml =
      '<div style="text-align:center;margin:0 0 18px;">'
      + '<span style="display:inline-block;background:' + stepBg + ';color:' + stepColor + ';'
      + 'border-radius:999px;padding:7px 12px;font-size:11px;font-weight:800;'
      + 'letter-spacing:.06em;text-transform:uppercase;">'
      + escapeHtml_(step)
      + '</span>'
      + '</div>';
  }

  var buttonHtml = '';
  if (buttonText && buttonUrl) {
    buttonHtml =
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" '
      + 'style="margin:0 auto 28px;">'
      + '<tr><td align="center" bgcolor="#125BFF" style="border-radius:12px;">'
      + '<a href="' + escapeHtml_(buttonUrl) + '" target="_blank" '
      + 'style="display:inline-block;padding:14px 30px;color:#FFFFFF;text-decoration:none;'
      + 'font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:800;line-height:1.2;">'
      + escapeHtml_(buttonText)
      + '</a>'
      + '</td></tr></table>';
  }

  var nextHtml = '';
  if (nextText) {
    nextHtml =
      '<div style="background:#F8FAFC;border:1px solid #E8EDF5;border-radius:12px;'
      + 'padding:16px 18px;text-align:center;">'
      + '<div style="font-size:11px;font-weight:800;color:#667085;text-transform:uppercase;'
      + 'letter-spacing:.07em;margin-bottom:6px;">¿Qué sigue?</div>'
      + '<div style="font-size:13px;line-height:1.65;color:#475467;">'
      + nextText
      + '</div>'
      + '</div>';
  }

  // Logo armado en HTML para máxima compatibilidad entre clientes de correo.
  var brandHtml =
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">'
    + '<tr>'
    + '<td style="padding-right:9px;vertical-align:middle;">'
    + '<table role="presentation" cellpadding="0" cellspacing="0" border="0">'
    + '<tr><td style="width:24px;height:4px;background:#296BFE;font-size:0;line-height:0;">&nbsp;</td></tr>'
    + '<tr><td style="height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>'
    + '<tr><td style="width:24px;height:4px;background:#296BFE;font-size:0;line-height:0;">&nbsp;</td></tr>'
    + '<tr><td style="height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>'
    + '<tr><td style="width:31px;height:4px;background:#296BFE;font-size:0;line-height:0;">&nbsp;</td></tr>'
    + '</table>'
    + '</td>'
    + '<td style="font-family:Arial,Helvetica,sans-serif;font-size:25px;font-weight:900;'
    + 'letter-spacing:-1px;color:#181B21;vertical-align:middle;">Lebane</td>'
    + '</tr></table>';

  return ''
    + '<!DOCTYPE html>'
    + '<html lang="es">'
    + '<head><meta charset="UTF-8"></head>'
    + '<body style="margin:0;padding:0;background:#F3F6FB;">'
    + (preheader
        ? '<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">'
          + escapeHtml_(preheader)
          + '</div>'
        : '')
    + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" '
    + 'style="width:100%;background:#F3F6FB;margin:0;padding:0;">'
    + '<tr><td align="center" style="padding:32px 12px;">'
    + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" '
    + 'style="width:100%;max-width:640px;background:#FFFFFF;border:1px solid #E5EAF2;border-radius:20px;">'

    + '<tr><td align="center" style="padding:28px 32px 16px;">'
    + brandHtml
    + '</td></tr>'

    + '<tr><td style="padding:4px 34px 36px;font-family:Arial,Helvetica,sans-serif;">'
    + stepHtml
    + '<h1 style="margin:0 0 10px;text-align:center;font-family:Arial,Helvetica,sans-serif;'
    + 'font-size:26px;line-height:1.25;color:#111827;font-weight:800;letter-spacing:-.4px;">'
    + escapeHtml_(title)
    + '</h1>'
    + (subtitle
        ? '<p style="margin:0 auto 24px;max-width:520px;text-align:center;font-size:14px;'
          + 'line-height:1.7;color:#667085;">' + subtitle + '</p>'
        : '<div style="height:12px;"></div>')
    + '<div style="height:1px;background:#EDF0F5;margin:0 0 25px;font-size:0;line-height:0;">&nbsp;</div>'
    + bodyHtml
    + buttonHtml
    + nextHtml
    + '</td></tr>'

    + '<tr><td align="center" style="padding:17px 24px;background:#FAFBFC;border-top:1px solid #EDF0F5;'
    + 'font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#98A2B3;">'
    + escapeHtml_(footerText)
    + '</td></tr>'

    + '</table>'
    + '</td></tr></table>'
    + '</body></html>';
}


// Compatibilidad con referencias antiguas del proyecto.
function baseEmail_(title, bodyHtml) {
  return emailLayout_({
    title: title,
    bodyHtml: bodyHtml
  });
}


/****************************************************
 * 1. BIENVENIDA / DISCOVERY
 ****************************************************/
function welcomeEmailHtml_(empresa) {
  var formUrl = getConfig_('FORM_URL') || LEBANE.form.publicFormUrl;

  var body =
    '<p style="margin:0 0 15px;font-size:15px;line-height:1.75;color:#344054;">'
    + 'Hola <strong>' + escapeHtml_(empresa) + '</strong>,'
    + '</p>'

    + '<p style="margin:0 0 17px;font-size:15px;line-height:1.75;color:#344054;">'
    + '¡Gracias por sumarse a Lebane! Para comenzar, necesitamos conocer brevemente cómo trabajan hoy.'
    + '</p>'

    + '<p style="margin:0 0 22px;font-size:15px;line-height:1.75;color:#344054;">'
    + 'El primer paso es completar el formulario de Discovery. Con esa información podemos preparar '
    + 'mejor las siguientes instancias de implementación.'
    + '</p>'

    + '<div style="background:#F8FAFC;border:1px solid #E8EDF5;border-radius:14px;'
    + 'padding:17px 18px;margin:0 0 25px;text-align:center;">'
    + '<div style="font-size:13px;font-weight:800;color:#111827;margin-bottom:4px;">'
    + 'Completarlo lleva aproximadamente 10–15 minutos'
    + '</div>'
    + '<div style="font-size:13px;line-height:1.6;color:#667085;">'
    + 'No necesitan preparar documentación previamente.'
    + '</div>'
    + '</div>';

  return emailLayout_({
    step: 'Paso 1 de 3 · Conocernos',
    title: '¡Bienvenidos a Lebane!',
    subtitle: 'Para empezar bien, necesitamos conocer cómo trabajan hoy.',
    preheader: 'Completá el Discovery para que podamos preparar tu implementación.',
    bodyHtml: body,
    buttonText: 'Completar Discovery',
    buttonUrl: formUrl,
    nextText: 'Cuando recibamos la respuesta, les enviaremos la información de la sesión de introducción.'
  });
}


/****************************************************
 * 2. SESIÓN DE INTRODUCCIÓN
 ****************************************************/
function discoveryEmailHtml_(empresa, fechaTexto, linkReunion) {
  var body =
    '<p style="margin:0 0 15px;font-size:15px;line-height:1.75;color:#344054;">'
    + 'Hola <strong>' + escapeHtml_(empresa) + '</strong>,'
    + '</p>'

    + '<p style="margin:0 0 18px;font-size:15px;line-height:1.75;color:#344054;">'
    + 'Gracias por completar el Discovery. El próximo paso es participar de la sesión de introducción a Lebane.'
    + '</p>'

    + '<div style="background:#FFFAF0;border:1px solid #F4DFAD;border-radius:14px;'
    + 'padding:15px 17px;margin:0 0 22px;">'
    + '<div style="font-size:13px;line-height:1.65;color:#6B5A2A;">'
    + '<strong>Importante:</strong> esta sesión es un recorrido general por la plataforma y por el proceso '
    + 'de implementación. Las configuraciones y procesos particulares de su empresa se trabajan luego '
    + 'con su implementador/a asignado/a.'
    + '</div>'
    + '</div>'

    + '<div style="background:#F8FAFC;border:1px solid #E8EDF5;border-radius:14px;'
    + 'padding:19px;margin:0 0 25px;text-align:center;">'
    + '<div style="font-size:11px;font-weight:800;color:#7B8494;text-transform:uppercase;'
    + 'letter-spacing:.08em;margin-bottom:7px;">Sesión programada</div>'
    + '<div style="font-size:17px;font-weight:800;color:#111827;">'
    + escapeHtml_(fechaTexto)
    + '</div>'
    + '</div>';

  return emailLayout_({
    step: 'Paso 2 de 3 · Introducción',
    stepBg: '#FFF7E8',
    stepColor: '#946200',
    title: 'Tu sesión de introducción',
    subtitle: 'Un recorrido general para conocer la plataforma y entender cómo sigue el proceso.',
    preheader: 'Te compartimos la fecha, el acceso y qué vas a ver en este encuentro.',
    bodyHtml: body,
    buttonText: 'Inscríbete aquí',
    buttonUrl: linkReunion,
    nextText: 'Después de la sesión van a recibir el paso a paso para completar las configuraciones iniciales.'
  });
}


/****************************************************
 * 3. CALENDARIO DE IMPLEMENTACIÓN
 ****************************************************/
function calendarEmailHtml_(empresa, om, am, calendarLink) {
  var amName = am;
  if (am === 'a.nunez@lebane.app') amName = 'Adriana';
  if (am === 'g.murillo@lebane.app') amName = 'Gabriela';

  var body =
    '<p style="margin:0 0 15px;font-size:15px;line-height:1.75;color:#344054;">'
    + 'Hola <strong>' + escapeHtml_(empresa) + '</strong>,'
    + '</p>'

    + '<p style="margin:0 0 18px;font-size:15px;line-height:1.75;color:#344054;">'
    + 'Ya completamos la instancia inicial del onboarding. El próximo paso es agendar la primera reunión '
    + 'de implementación con el equipo asignado.'
    + '</p>'

    + '<div style="background:#F8FAFC;border:1px solid #E8EDF5;border-radius:14px;'
    + 'padding:18px 20px;margin:0 0 24px;">'
    + '<div style="text-align:center;margin-bottom:14px;">'
    + '<div style="font-size:11px;font-weight:800;color:#7B8494;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;">Implementador/a asignado/a</div>'
    + '<div style="font-size:18px;font-weight:800;color:#111827;">' + escapeHtml_(om) + '</div>'
    + '</div>'
    + '<div style="height:1px;background:#E8EDF5;margin:0 0 14px;"></div>'
    + '<div style="text-align:center;">'
    + '<div style="font-size:11px;font-weight:800;color:#7B8494;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;">Account Manager</div>'
    + '<div style="font-size:15px;font-weight:800;color:#111827;margin-bottom:4px;">' + escapeHtml_(amName || am) + '</div>'
    + (am ? '<a href="mailto:' + escapeHtml_(am) + '" style="font-size:13px;color:#125BFF;text-decoration:none;font-weight:700;">' + escapeHtml_(am) + '</a>' : '')
    + '</div>'
    + '</div>'

    + '<p style="margin:0 0 22px;font-size:14px;line-height:1.7;color:#475467;text-align:center;">'
    + 'Elegí desde el calendario el día y horario que mejor se adapte a tu equipo.'
    + '</p>';

  return emailLayout_({
    step: 'Paso 3 de 3 · Implementación',
    stepBg: '#EDFDF3',
    stepColor: '#16794D',
    title: 'Agendá tu primera reunión',
    subtitle: 'Ya tenés asignados tu implementador/a y Account Manager.',
    preheader: 'Elegí la fecha y horario que mejor les quede.',
    bodyHtml: body,
    buttonText: 'Elegir fecha y horario',
    buttonUrl: calendarLink,
    nextText: 'Si necesitás ayuda para coordinar, podés responder este correo o escribirle a tu Account Manager.',
    footerText: 'Equipo de Implementaciones · Lebane'
  });
}



/****************************************************
 * CONFIRMACIÓN DE REUNIÓN
 ****************************************************/
function meetingConfirmedEmailHtml_(empresa, om, am, fechaTexto, linkReunion) {
  var amName = am;
  if (am === 'a.nunez@lebane.app') amName = 'Adriana';
  if (am === 'g.murillo@lebane.app') amName = 'Gabriela';

  var body =
    '<p style="margin:0 0 15px;font-size:15px;line-height:1.75;color:#344054;">'
    + 'Hola <strong>' + escapeHtml_(empresa) + '</strong>,'
    + '</p>'

    + '<p style="margin:0 0 20px;font-size:15px;line-height:1.75;color:#344054;">'
    + 'Ya quedó confirmada su próxima reunión de implementación con Lebane.'
    + '</p>'

    + '<div style="background:#F8FAFC;border:1px solid #E8EDF5;border-radius:14px;'
    + 'padding:19px 20px;margin:0 0 25px;text-align:center;">'
    + '<div style="font-size:11px;font-weight:800;color:#7B8494;text-transform:uppercase;'
    + 'letter-spacing:.08em;margin-bottom:7px;">Fecha y horario</div>'
    + '<div style="font-size:18px;font-weight:800;color:#111827;margin-bottom:14px;">'
    + escapeHtml_(fechaTexto)
    + '</div>'
    + '<div style="height:1px;background:#E8EDF5;margin:0 0 13px;"></div>'
    + '<div style="font-size:11px;font-weight:800;color:#7B8494;text-transform:uppercase;'
    + 'letter-spacing:.08em;margin-bottom:5px;">Implementador/a</div>'
    + '<div style="font-size:16px;font-weight:800;color:#111827;">' + escapeHtml_(om) + '</div>'
    + '</div>'

    + '<p style="margin:0 0 22px;font-size:14px;line-height:1.7;color:#475467;text-align:center;">'
    + 'En este encuentro vamos a revisar sus procesos, resolver dudas sobre las configuraciones iniciales '
    + 'y continuar con la implementación.'
    + '</p>';

  var footer = 'Equipo de Implementaciones · Lebane';
  if (am) footer += ' · Account Manager: ' + (amName || am);

  return emailLayout_({
    step: 'Reunión confirmada',
    stepBg: '#EDFDF3',
    stepColor: '#16794D',
    title: 'Tu reunión de implementación está confirmada',
    subtitle: 'Te compartimos los datos para que los tengas a mano.',
    preheader: 'Tu reunión de implementación con Lebane ya está confirmada.',
    bodyHtml: body,
    buttonText: 'Ingresar a la reunión',
    buttonUrl: linkReunion,
    nextText: 'No necesitás realizar ninguna acción adicional. Te esperamos en el horario acordado.',
    footerText: footer
  });
}

/****************************************************
 * FUP 1 · FORMULARIO PENDIENTE
 ****************************************************/
function reminderWelcomeHtml_(empresa) {
  var formUrl = getConfig_('FORM_URL') || LEBANE.form.publicFormUrl;

  var body =
    '<p style="margin:0 auto 23px;max-width:520px;text-align:center;font-size:15px;'
    + 'line-height:1.75;color:#475467;">'
    + 'Hola <strong>' + escapeHtml_(empresa) + '</strong>. '
    + 'Todavía no recibimos el formulario de Discovery. Completarlo lleva entre 10 y 15 minutos '
    + 'y nos permite continuar con el onboarding.'
    + '</p>'

    + '<p style="margin:0 0 8px;text-align:center;font-size:12px;line-height:1.5;color:#98A2B3;">'
    + 'Si ya lo completaron, pueden ignorar este mensaje.'
    + '</p>';

  return emailLayout_({
    title: 'Nos falta un paso para continuar',
    subtitle: 'Con el Discovery podemos preparar la siguiente etapa.',
    preheader: 'Con este paso podemos continuar con tu onboarding.',
    bodyHtml: body,
    buttonText: 'Completar Discovery',
    buttonUrl: formUrl
  });
}


/****************************************************
 * FUP 2 · SESIÓN DE INTRODUCCIÓN
 ****************************************************/
function reminderDiscoveryHtml_(empresa, fechaTexto, linkReunion) {
  var details = '';

  if (fechaTexto) {
    details =
      '<div style="background:#F8FAFC;border:1px solid #E8EDF5;border-radius:12px;'
      + 'padding:15px 17px;margin:0 0 23px;text-align:center;">'
      + '<div style="font-size:11px;font-weight:800;color:#7B8494;text-transform:uppercase;'
      + 'letter-spacing:.08em;margin-bottom:6px;">Sesión programada</div>'
      + '<div style="font-size:16px;font-weight:800;color:#111827;">'
      + escapeHtml_(fechaTexto)
      + '</div>'
      + '</div>';
  }

  var body =
    '<p style="margin:0 auto 20px;max-width:520px;text-align:center;font-size:15px;'
    + 'line-height:1.75;color:#475467;">'
    + 'Hola <strong>' + escapeHtml_(empresa) + '</strong>. '
    + 'Te recordamos la instancia de introducción a Lebane para poder continuar con los próximos pasos.'
    + '</p>'
    + details;

  return emailLayout_({
    title: 'Recordatorio de tu sesión de introducción',
    subtitle: 'Este encuentro nos permite ordenar el inicio de la implementación.',
    preheader: 'Te recordamos la próxima instancia de tu onboarding.',
    bodyHtml: body,
    buttonText: linkReunion ? 'Inscríbete aquí' : '',
    buttonUrl: linkReunion || ''
  });
}


/****************************************************
 * FUP 3 · AGENDA PENDIENTE
 ****************************************************/
function reminderCalendarHtml_(empresa, om, am, calendarLink) {
  var amName = am;
  if (am === 'a.nunez@lebane.app') amName = 'Adriana';
  if (am === 'g.murillo@lebane.app') amName = 'Gabriela';

  var body =
    '<p style="margin:0 auto 18px;max-width:520px;text-align:center;font-size:15px;line-height:1.75;color:#475467;">'
    + 'Hola <strong>' + escapeHtml_(empresa) + '</strong>. '
    + 'Nos queda pendiente coordinar la primera reunión de implementación. '
    + 'Elegí el día y horario que mejor se adapte a tu equipo.'
    + '</p>'

    + '<div style="background:#F8FAFC;border:1px solid #E8EDF5;border-radius:12px;padding:15px 18px;margin:0 0 22px;text-align:center;">'
    + '<div style="font-size:13px;color:#667085;margin-bottom:6px;">Implementador/a: <strong style="color:#111827;">' + escapeHtml_(om || '') + '</strong></div>'
    + (am ? '<div style="font-size:13px;color:#667085;">Account Manager: <strong style="color:#111827;">' + escapeHtml_(amName || am) + '</strong> · <a href="mailto:' + escapeHtml_(am) + '" style="color:#125BFF;text-decoration:none;font-weight:700;">' + escapeHtml_(am) + '</a></div>' : '')
    + '</div>';

  return emailLayout_({
    title: '¿Agendamos la próxima reunión?',
    subtitle: 'Ya estamos listos para continuar con la implementación.',
    preheader: 'Elegí una fecha y horario para continuar con la implementación.',
    bodyHtml: body,
    buttonText: 'Agendar reunión',
    buttonUrl: calendarLink || ''
  });
}




function ensureColumnExists_(sh, header) {
  var headers = getHeaders_(sh);
  if (headers.indexOf(header) !== -1) return;

  var newCol = sh.getLastColumn() + 1;
  sh.getRange(1, newCol).setValue(header);
  SpreadsheetApp.flush();
}

function normalizeDiscoveryAttendance_(value) {
  var v = normalizeText_(value);

  if (v === 'si' || v === 'sí' || v === 'asistio' || v === 'asistió' || v === 'yes') {
    return 'SI';
  }

  if (v === 'no' || v === 'no asistio' || v === 'no asistió') {
    return 'NO';
  }

  return 'PENDIENTE';
}


/****************************************************
 * CACHE DE VISTAS / PERFORMANCE
 ****************************************************/
function getUiCache_(name) {
  try {
    var raw = CacheService.getScriptCache().get('UI_' + name + '_V24');
    if (!raw) return null;
    var parsed = JSON.parse(raw);
    return parsed;
  } catch (e) {
    Logger.log('getUiCache_ error: ' + e.message);
    return null;
  }
}

function putUiCache_(name, data, seconds) {
  try {
    // Ensure data is JSON serializable by converting to string all values
    var safe = safeForJSON_(data);
    var serialized = JSON.stringify(safe);
    CacheService.getScriptCache().put(
      'UI_' + name + '_V24',
      serialized,
      seconds || 25
    );
  } catch (e) {
    Logger.log('putUiCache_ error: ' + e.message);
  }
}

function safeForJSON_(obj) {
  if (obj === null || obj === undefined) return null;
  if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }
  if (obj instanceof Date) {
    return formatDate_(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(function(item) { return safeForJSON_(item); });
  }
  if (typeof obj === 'object') {
    var result = {};
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = safeForJSON_(obj[key]);
      }
    }
    return result;
  }
  return String(obj);
}

function invalidateUiCache_() {
  try {
    CacheService.getScriptCache().removeAll([
      'UI_pipeline_V24',
      'UI_calendar_V24',
      'UI_history_V24'
    ]);
  } catch (e) {}
}

function clearUiCache_() {
  try {
    var cache = CacheService.getScriptCache();
    cache.removeAll([
      'UI_pipeline_V24',
      'UI_calendar_V24',
      'UI_history_V24',
      'UI_pipeline',
      'UI_calendar',
      'UI_history',
      'UI_stage_Bienvenida',
      'UI_stage_Discovery',
      'UI_stage_Calendario',
      'UI_stage_Histórico'
    ]);
    return { ok: true, message: 'Caché limpiado' };
  } catch (e) {
    return { ok: false, message: 'Error: ' + e.message };
  }
}

function testDataDebug_() {
  try {
    var ss = getMainSpreadsheet_();
    var sheetNames = ss.getSheetNames();

    var clientsSheetName = LEBANE.sheets.clients;
    var sh = ss.getSheetByName(clientsSheetName);

    if (!sh) {
      return {
        ok: false,
        message: 'Hoja no encontrada: ' + clientsSheetName,
        availableSheets: sheetNames
      };
    }

    var lastRow = sh.getLastRow();
    if (lastRow < 2) {
      return {
        ok: false,
        message: 'Hoja vacía o sin datos. Last row: ' + lastRow
      };
    }

    var values = sh.getDataRange().getValues();
    var headers = values[0];
    var firstRow = values[1];

    return {
      ok: true,
      message: 'Datos encontrados',
      sheetName: clientsSheetName,
      totalRows: lastRow,
      headers: headers,
      firstDataRow: firstRow,
      headerCount: headers.length
    };
  } catch (e) {
    return { ok: false, error: e.message, stack: e.stack };
  }
}

function shouldInvalidateUiCache_(action) {
  return !/^get/.test(String(action || '')) && action !== 'debugFormSource';
}

function parseLocalDateOrBlank_(value) {
  if (!value) return '';
  if (value instanceof Date) return isNaN(value) ? '' : value;

  var s = String(value).trim();
  var m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0);

  var d = new Date(s);
  return isNaN(d) ? '' : d;
}

function parseLocalDateOrToday_(value) {
  return parseLocalDateOrBlank_(value) || new Date();
}

function dateOnlyString_(value) {
  if (!value) return '';
  var d = new Date(value);
  if (isNaN(d)) return String(value || '');
  return Utilities.formatDate(d, LEBANE.timezone, 'yyyy-MM-dd');
}

function normalizeYesNo_(value, fallback) {
  var v = normalizeText_(value);
  if (v === 'si' || v === 'sí' || v === 'true' || v === '1' || v === 'reimplementado') return 'SI';
  if (v === 'no' || v === 'false' || v === '0' || v === 'implementacion' || v === 'implementación') return 'NO';
  return fallback || 'NO';
}

function hoursBetween_(from, to) {
  var a = new Date(from), b = new Date(to);
  if (isNaN(a) || isNaN(b)) return 999999;
  return Math.floor((b - a) / 3600000);
}

/****************************************************
 * HELPERS
 ****************************************************/
function getSheet_(name) {
  var sh = getMainSpreadsheet_().getSheetByName(name);
  if (!sh) throw new Error('No se encontró la hoja: "' + name + '". Ejecutá "Configurar sistema".');
  return sh;
}

function getHeaders_(sh) {
  if (sh.getLastColumn() === 0) return [];
  return sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(function(h){ return String(h||'').trim(); });
}

function getHeaderMap_(sh) {
  var headers = getHeaders_(sh);
  var map = {};
  headers.forEach(function(h, idx){ if (h) map[h] = idx + 1; });
  return map;
}

function readObjects_(sheetName) {
  var sh = getSheet_(sheetName);
  var lastRow = sh.getLastRow();
  var lastCol = sh.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];
  var values = sh.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = values[0].map(function(h){ return String(h||'').trim(); });
  return values.slice(1).map(function(row, i) {
    var obj = {};
    headers.forEach(function(h, idx){ obj[h] = row[idx]; });
    obj.__row = i + 2;
    return obj;
  });
}

function safeReadObjects_(sheetName) {
  try { return readObjects_(sheetName); } catch(e) { return []; }
}

function readObjectAtRow_(sh, row) {
  var headers = getHeaders_(sh);
  var values  = sh.getRange(row, 1, 1, sh.getLastColumn()).getValues()[0];
  var obj = {};
  headers.forEach(function(h, idx){ obj[h] = values[idx]; });
  obj.__row = row;
  return obj;
}

function appendObject_(sh, headers, obj) {
  var row = headers.map(function(h){ return obj[h] !== undefined ? obj[h] : ''; });
  sh.appendRow(row);
}

function findClientRow_(idOrEmpresa) {
  var key = normalizeText_(idOrEmpresa);
  return findRowInSheetByIdOrEmpresa_(LEBANE.sheets.clients, key)
      || findRowInSheetByIdOrEmpresa_(LEBANE.sheets.history, key);
}

function findRowInSheetByIdOrEmpresa_(sheetName, key) {
  var ss = getMainSpreadsheet_();
  var sh = ss.getSheetByName(sheetName);
  if (!sh || sh.getLastRow() < 2) return null;
  var values  = sh.getDataRange().getValues();
  var headers = values[0].map(function(h){ return String(h||'').trim(); });
  var idIdx      = headers.indexOf('ID');
  var empresaIdx = headers.indexOf('Empresa');
  for (var i = 1; i < values.length; i++) {
    var id      = idIdx      >= 0 ? normalizeText_(values[i][idIdx])      : '';
    var empresa = empresaIdx >= 0 ? normalizeText_(values[i][empresaIdx]) : '';
    if (id === key || empresa === key) return { sheet: sh, row: i+1, source: sheetName };
  }
  return null;
}

function findRowByValue_(sh, headerName, value) {
  var map = getHeaderMap_(sh);
  var col = map[headerName];
  if (!col) return null;
  var last = sh.getLastRow();
  if (last < 2) return null;
  var values = sh.getRange(2, col, last-1, 1).getValues();
  var target = normalizeText_(value);
  for (var i = 0; i < values.length; i++) {
    if (normalizeText_(values[i][0]) === target) return i + 2;
  }
  return null;
}

function audit_(id, empresa, etapa, accion, detalle) {
  try {
    var sh = getSheet_(LEBANE.sheets.audit);
    sh.appendRow([new Date(), id||'', empresa||'', etapa||'', accion||'', detalle||'', Session.getActiveUser().getEmail()||'']);
  } catch(e) {}
}

function getAuditForClient_(id) {
  return safeReadObjects_(LEBANE.sheets.audit)
    .filter(function(r){ return String(r['ID']) === String(id); })
    .map(function(r) {
      return {
        fecha: String(r['Fecha']||''), fechaTexto: formatDate_(r['Fecha']),
        id: r['ID'], empresa: r['Empresa'], etapa: r['Etapa'],
        accion: r['Acción'], detalle: r['Detalle'], usuario: r['Usuario']
      };
    }).reverse();
}

function getFupSummary_(client) {
  return {
    bienvenida: Number(client['FUP Bienvenida']||0),
    discovery:  Number(client['FUP Discovery'] ||0),
    calendario: Number(client['FUP Calendario']||0)
  };
}

function getFormResponsesSheet_() {
  var ss = SpreadsheetApp.openById(LEBANE.form.spreadsheetId);
  var gid = Number(LEBANE.form.gid);

  var sheets = ss.getSheets();
  var target = null;

  for (var i = 0; i < sheets.length; i++) {
    if (Number(sheets[i].getSheetId()) === gid) {
      target = sheets[i];
      break;
    }
  }

  if (!target) {
    var available = sheets.map(function(s){
      return s.getName() + ' (gid ' + s.getSheetId() + ')';
    }).join(' | ');

    throw new Error(
      'No encontré el gid ' + gid +
      ' dentro del Spreadsheet ' + LEBANE.form.spreadsheetId +
      '. Hojas disponibles: ' + available
    );
  }

  return target;
}

function debugFormSource() {
  var sh = getFormResponsesSheet_();
  var values = sh.getDataRange().getValues();
  var headers = values.length
    ? values[0].map(function(h){ return String(h || '').trim(); })
    : [];

  var timestampIdx = detectColumn_(headers, ['marca temporal', 'timestamp']);
  if (timestampIdx < 0 && headers.length) timestampIdx = 0;

  var cutoff = new Date(LEBANE.form.syncFrom + 'T00:00:00-03:00');
  var firstDate = null;
  var lastDate = null;
  var rowsFromCutoff = 0;
  var invalidDates = 0;

  for (var i = 1; i < values.length; i++) {
    var d = parseFormTimestamp_(values[i][timestampIdx]);
    if (!d) {
      invalidDates++;
      continue;
    }

    if (!firstDate || d < firstDate) firstDate = d;
    if (!lastDate || d > lastDate) lastDate = d;
    if (d >= cutoff) rowsFromCutoff++;
  }

  var result = {
    ok: true,
    spreadsheetId: LEBANE.form.spreadsheetId,
    spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/' + LEBANE.form.spreadsheetId + '/edit#gid=' + LEBANE.form.gid,
    sheetName: sh.getName(),
    gid: sh.getSheetId(),
    lastRow: sh.getLastRow(),
    lastColumn: sh.getLastColumn(),
    headers: headers,
    firstResponse: firstDate ? formatDate_(firstDate) : '',
    lastResponse: lastDate ? formatDate_(lastDate) : '',
    rowsFromSeptember1: rowsFromCutoff,
    invalidDates: invalidDates
  };

  Logger.log(JSON.stringify(result, null, 2));

  try {
    SpreadsheetApp.getUi().alert(
      'Fuente Form OK\n\n' +
      'Hoja: ' + result.sheetName + '\n' +
      'GID: ' + result.gid + '\n' +
      'Filas con datos: ' + Math.max(0, result.lastRow - 1) + '\n' +
      'Desde 01/09/2026: ' + result.rowsFromSeptember1 + '\n' +
      'Primera respuesta: ' + (result.firstResponse || '-') + '\n' +
      'Última respuesta: ' + (result.lastResponse || '-') + '\n\n' +
      'Encabezados:\n' + result.headers.join(' | ')
    );
  } catch (e) {}

  return result;
}

function repairFormSourceConfig() {
  var sh = getSheet_(LEBANE.sheets.config);

  _upsertConfig(sh, 'FORM_SPREADSHEET_ID', LEBANE.form.spreadsheetId);
  _upsertConfig(sh, 'FORM_GID', String(LEBANE.form.gid));
  _upsertConfig(sh, 'FORM_URL', LEBANE.form.publicFormUrl);

  try {
    var cache = CacheService.getScriptCache();
    cache.remove('CFG_FORM_SPREADSHEET_ID');
    cache.remove('CFG_FORM_GID');
    cache.remove('CFG_FORM_URL');
  } catch (e) {}

  return {
    ok: true,
    message:
      'Fuente del Form reparada: Spreadsheet ' +
      LEBANE.form.spreadsheetId +
      ' · gid ' + LEBANE.form.gid + '.'
  };
}

function detectColumn_(headers, terms) {
  var norm = headers.map(function(h){ return normalizeText_(h); });
  for (var i = 0; i < norm.length; i++) {
    for (var j = 0; j < terms.length; j++) {
      if (norm[i].indexOf(normalizeText_(terms[j])) !== -1) return i;
    }
  }
  return -1;
}


function buildClientMatchIndex_() {
  var sh = getMainSpreadsheet_().getSheetByName(LEBANE.sheets.clients);
  if (!sh || sh.getLastRow() < 2) return { sheet: sh, rows: [] };

  var values     = sh.getDataRange().getValues();
  var headers    = values[0].map(function(h){ return String(h||'').trim(); });
  var empresaIdx = headers.indexOf('Empresa');
  var mailsIdx   = headers.indexOf('Mails');
  var idIdx      = headers.indexOf('ID');

  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var empresaRaw = empresaIdx >= 0 ? String(values[i][empresaIdx]||'') : '';
    if (!empresaRaw.trim()) continue;

    rows.push({
      sheet: sh,
      row: i + 1,
      source: LEBANE.sheets.clients,
      id: idIdx >= 0 ? String(values[i][idIdx]||'') : '',
      empresaRaw: empresaRaw,
      empresaNorm: normalizeText_(empresaRaw),
      mails: mailsIdx >= 0
        ? splitEmails_(values[i][mailsIdx]||'').map(function(m){ return normalizeText_(m); })
        : []
    });
  }
  return { sheet: sh, rows: rows };
}

function findMatchingClientFromIndex_(index, empresa, mails, rowText, explicitClientId) {
  index = index || { rows: [] };
  var rows = index.rows || [];

  var wantedId = normalizeText_(explicitClientId || '');
  if (wantedId) {
    for (var a = 0; a < rows.length; a++) {
      if (normalizeText_(rows[a].id) === wantedId) return rows[a];
    }
  }

  var empNorm   = normalizeText_(empresa);
  var rowNorm   = normalizeText_(rowText);
  var formMails = (mails||'')
    .split(/[,;\s]+/)
    .map(function(m){ return normalizeText_(m.trim()); })
    .filter(function(m){ return m.indexOf('@') !== -1; });

  var allMails = rowNorm.match(/[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}/g) || [];

  // Mail exacto primero.
  for (var i = 0; i < rows.length; i++) {
    for (var j = 0; j < rows[i].mails.length; j++) {
      var cm = rows[i].mails[j];
      if (!cm) continue;
      if (formMails.indexOf(cm) !== -1 || allMails.indexOf(cm) !== -1) return rows[i];
    }
  }

  // Empresa exacta.
  if (empNorm) {
    for (var k = 0; k < rows.length; k++) {
      if (rows[k].empresaNorm === empNorm) return rows[k];
    }
  }

  // Fallback por similitud.
  if (empNorm && empNorm.length >= 4) {
    for (var l = 0; l < rows.length; l++) {
      var cEmpresa = rows[l].empresaNorm;
      if (!cEmpresa || cEmpresa.length < 4) continue;

      if (empNorm.indexOf(cEmpresa) !== -1 || cEmpresa.indexOf(empNorm) !== -1) return rows[l];

      var ew = empNorm.split(/\s+/).filter(function(w){ return w.length >= 3; });
      var cw = cEmpresa.split(/\s+/).filter(function(w){ return w.length >= 3; });
      var common = ew.filter(function(w){ return cw.indexOf(w) !== -1; });
      if (common.length >= 2 || (common.length === 1 && ew.length === 1)) return rows[l];
    }
  }

  return null;
}

function findMatchingClientFromForm_(empresa, mails, rowText) {
  var sh = getMainSpreadsheet_().getSheetByName(LEBANE.sheets.clients);
  if (!sh || sh.getLastRow() < 2) return null;

  var values     = sh.getDataRange().getValues();
  var headers    = values[0].map(function(h){ return String(h||'').trim(); });
  var empresaIdx = headers.indexOf('Empresa');
  var mailsIdx   = headers.indexOf('Mails');
  var idIdx      = headers.indexOf('ID');

  var empNorm    = normalizeText_(empresa);
  var rowNorm    = normalizeText_(rowText);
  var formMails  = (mails||'').split(/[,;\s]+/).map(function(m){ return normalizeText_(m.trim()); }).filter(function(m){ return m.indexOf('@')!==-1; });
  var allMails   = rowNorm.match(/[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}/g) || [];

  for (var i = 1; i < values.length; i++) {
    var cEmpresaRaw = String(values[i][empresaIdx]||'');
    var cEmpresa    = normalizeText_(cEmpresaRaw);
    var cMails      = splitEmails_(values[i][mailsIdx]||'').map(function(m){ return normalizeText_(m); });
    var cId         = idIdx >= 0 ? String(values[i][idIdx]||'') : '';

    if (empNorm && cEmpresa && (empNorm === cEmpresa || empNorm.indexOf(cEmpresa)!==-1 || cEmpresa.indexOf(empNorm)!==-1)) {
      return findClientRow_(cId || cEmpresaRaw);
    }
    for (var j = 0; j < cMails.length; j++) {
      var cm = cMails[j];
      if (!cm) continue;
      for (var k = 0; k < formMails.length; k++) { if (cm === formMails[k]) return findClientRow_(cId || cEmpresaRaw); }
      for (var l = 0; l < allMails.length; l++)  { if (cm === allMails[l])  return findClientRow_(cId || cEmpresaRaw); }
      if (rowNorm.indexOf(cm) !== -1) return findClientRow_(cId || cEmpresaRaw);
    }
    if (empNorm && cEmpresa && empNorm.length >= 4 && cEmpresa.length >= 4) {
      var ew = empNorm.split(/\s+/).filter(function(w){ return w.length>=3; });
      var cw = cEmpresa.split(/\s+/).filter(function(w){ return w.length>=3; });
      var common = ew.filter(function(w){ return cw.indexOf(w)!==-1; });
      if (common.length >= 2 || (common.length === 1 && ew.length === 1)) return findClientRow_(cId || cEmpresaRaw);
    }
  }
  return null;
}

function isResponseAlreadyProcessed_(responseId) {
  // Procesada = ya está aplicada a un cliente activo
  var clients = safeReadObjects_(LEBANE.sheets.clients);
  var history = safeReadObjects_(LEBANE.sheets.history);
  if (clients.some(function(r){ return String(r['ID Respuesta Form']||'') === String(responseId); })) return true;
  if (history.some(function(r){ return String(r['ID Respuesta Form']||'') === String(responseId); })) return true;

  // Procesada = está en Respuestas sin match con estado "Pendiente" (ya fue registrada, esperando revisión)
  // NO se considera procesada si está "Ignorada" o "Matcheada" — puede haber nuevos clientes que la matcheen
  var unmatched = safeReadObjects_(LEBANE.sheets.unmatched);
  return unmatched.some(function(r){
    return String(r['Response ID']||'') === String(responseId)
        && String(r['Estado']||'').toLowerCase() === 'pendiente';
  });
}

function findUnmatchedByResponseId_(responseId) {
  var rows = safeReadObjects_(LEBANE.sheets.unmatched);
  return rows.filter(function(r){ return String(r['Response ID']||'') === String(responseId); })[0] || null;
}

function setUnmatchedStatus_(responseId, status) {
  var sh  = getSheet_(LEBANE.sheets.unmatched);
  var map = getHeaderMap_(sh);
  var row = findRowByValue_(sh, 'Response ID', responseId);
  if (row && map['Estado']) sh.getRange(row, map['Estado']).setValue(status);
}

function buildFormRowLink_(sh, rowNumber) {
  return sh.getParent().getUrl() + '#gid=' + sh.getSheetId() + '&range=A' + rowNumber;
}

function getConfig_(key) {
  var cache = CacheService.getScriptCache();
  var cacheKey = 'CFG_' + key;
  var cached = cache.get(cacheKey);
  if (cached !== null) return cached;

  var sh = getMainSpreadsheet_().getSheetByName(LEBANE.sheets.config);
  if (!sh) return '';

  var values = sh.getDataRange().getValues();
  var value = '';
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(key)) {
      value = String(values[i][1] || '');
      break;
    }
  }

  cache.put(cacheKey, value, 300);
  return value;
}

function getCalendarLinkForOm_(om) {
  var key = 'OM_' + normalizeText_(om).replace(/\s+/g,'_').toUpperCase() + '_CALENDAR';
  return getConfig_(key) || LEBANE.omCalendars[om] || '';
}

function splitEmails_(value) {
  return String(value||'').split(/[,\n;]/).map(function(e){ return e.trim(); }).filter(function(e){ return e && e.indexOf('@')!==-1; });
}

function parseDateOrBlank_(value) {
  if (!value) return '';
  var d = new Date(value);
  return isNaN(d) ? '' : d;
}

function daysBetween_(from, to) {
  var a = new Date(from), b = new Date(to);
  if (isNaN(a)||isNaN(b)) return 0;
  return Math.floor((b-a)/86400000);
}

function formatDate_(value) {
  if (!value) return '';
  var d = new Date(value);
  if (isNaN(d)) return String(value);
  return Utilities.formatDate(d, LEBANE.timezone, 'dd/MM/yyyy HH:mm');
}

function clean_(value)  { return String(value||'').trim(); }

function normalizeText_(value) {
  return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
}

function stripHtml_(html) {
  return String(html||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
}

function escapeHtml_(value) {
  return String(value||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

/****************************************************
 * DEBUG
 ****************************************************/
function checkFormTriggerStatus() {
  var result = getFormTriggerStatus();
  SpreadsheetApp.getUi().alert(result.installed
    ? '✅ Trigger activo\n\nEl Form se procesa automáticamente en tiempo real.'
    : '❌ Trigger NO instalado\n\nAndá a "Instalar automatizaciones" para activarlo.');
}

function debugVerClientesOnboarding() {
  var data = getAppData({});
  Logger.log(JSON.stringify(data.counts, null, 2));
  Logger.log(JSON.stringify(data.grouped, null, 2));
  return data;
}


/****************************************************
 * WEB API PARA VERCEL
 ****************************************************/
function doPost(e) {
  var response = {
    ok: false,
    error: true,
    message: 'Error desconocido'
  };

  try {
    var body = {};
    try {
      if (e && e.postData && e.postData.contents) {
        body = JSON.parse(e.postData.contents);
      }
    } catch (parseErr) {
      return createSimpleJsonResponse_({ ok:false, error:true, message:'JSON inválido en request.' });
    }

    if (!body.action) {
      return createSimpleJsonResponse_({ ok:false, error:true, message:'Falta indicar la acción.' });
    }

    var result = apiRouter(body.action, body.payload || {});
    return createSimpleJsonResponse_(result);

  } catch (err) {
    return createSimpleJsonResponse_({
      ok:false,
      error:true,
      message:'Error en doPost: ' + (err.message || String(err))
    });
  }
}

function createSimpleJsonResponse_(data) {
  // Asegurar que todos los datos sean JSON-serializable antes de stringify
  var safe = safeForJSON_(data || {});
  var output = ContentService.createTextOutput(JSON.stringify(safe));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function doOptions(e) {
  return ContentService.createTextOutput('')
    .addHeader('Access-Control-Allow-Origin', '*')
    .addHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .addHeader('Access-Control-Allow-Headers', 'Content-Type')
    .setMimeType(ContentService.MimeType.TEXT);
}

function jsonResponse_(data) {
  var output = ContentService
    .createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function jsonResponseWithCORS_(data) {
  var output = ContentService
    .createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  output.addHeader('Access-Control-Allow-Origin', '*');
  output.addHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  output.addHeader('Access-Control-Allow-Headers', 'Content-Type');
  return output;
}
