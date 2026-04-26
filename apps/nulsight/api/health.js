const { send, sendServerError } = require('../lib/http');
const { hasKV } = require('../lib/store');

module.exports = async (req, res) => {
  try {
    return send(res, 200, {
      ok: true,
      service: 'nulsight-api',
      storageBackend: hasKV() ? 'kv' : 'memory',
      maintenanceEnabled: Boolean(String(process.env.PORTFOLIO_MAINTENANCE_TOKEN || '').trim()),
      timestamp: new Date().toISOString(),
      node: process.version,
    });
  } catch (error) {
    console.error('[nulsight][health]', error);
    return sendServerError(res, 'HEALTH_SERVER_ERROR');
  }
};
