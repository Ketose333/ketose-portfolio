function send(res, code, body) {
  res.statusCode = code;
  res.setHeader('cache-control', 'no-store');
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function parseBody(req) {
  if (typeof req.body === 'object' && req.body !== null) return req.body;
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}

function sendServerError(res, error = 'INTERNAL_SERVER_ERROR', statusCode = 500) {
  return send(res, statusCode, { ok: false, error });
}

module.exports = { send, parseBody, sendServerError };
