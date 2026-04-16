const { send, parseBody } = require('../../lib/http');
const { requireAuth } = require('../../lib/auth-service');
const { createDeckPost, listDeckPosts, getDeckPost, deleteDeckPost, bumpMetric } = require('../../lib/deck-hub-store');
const { decodeDeckCodeSummary } = require('../../lib/deck-codec');

const DECK_HUB_ID_RE = /^d_[a-z0-9]+_[a-z0-9]+$/i;
const SEARCH_QUERY_MAX = 80;
const TITLE_MAX = 60;
const DESCRIPTION_MAX = 300;
const TAG_MAX = 8;
const TAG_LENGTH_MAX = 24;
const DECK_CODE_MAX = 2048;

function isValidDeckHubId(value) {
  return DECK_HUB_ID_RE.test(String(value || '').trim());
}

function normalizeTags(tags) {
  const raw = Array.isArray(tags)
    ? tags
    : typeof tags === 'string'
      ? tags.split(',')
      : [];
  return [...new Set(raw.map((item) => String(item || '').trim()).filter(Boolean))]
    .map((item) => item.slice(0, TAG_LENGTH_MAX))
    .filter(Boolean)
    .slice(0, TAG_MAX);
}

module.exports = async (req, res) => {
  try {
    const action = String((req.query && req.query.action) || '').trim();

    if (req.method === 'GET') {
      if (action === 'detail') {
        const id = String(req.query.id || '').trim();
        if (!id) return send(res, 400, { ok: false, error: 'id required' });
        if (!isValidDeckHubId(id)) return send(res, 400, { ok: false, error: 'invalid id' });
        const post = await getDeckPost(id);
        if (!post) return send(res, 404, { ok: false, error: 'not found' });
        return send(res, 200, { ok: true, post });
      }

      if (action) return send(res, 400, { ok: false, error: 'unsupported action' });

      const q = String(req.query.q || '').trim().slice(0, SEARCH_QUERY_MAX);
      const rawSort = String(req.query.sort || 'latest').trim();
      const sort = rawSort === 'imports' ? 'imports' : 'latest';
      const rawLimit = Number(req.query.limit || 30);
      const rawOffset = Number(req.query.offset || 0);
      const limit = Math.min(60, Math.max(1, Number.isFinite(rawLimit) ? rawLimit : 30));
      const offset = Math.min(1000, Math.max(0, Number.isFinite(rawOffset) ? rawOffset : 0));
      const result = await listDeckPosts({ q, sort, limit, offset });
      return send(res, 200, { ok: true, ...result });
    }

    if (req.method === 'POST') {
      const auth = await requireAuth(req, res, send);
      if (!auth) return;
      const body = parseBody(req);

      if (action === 'delete') {
        const id = String(body.id || '').trim();
        if (!id) return send(res, 400, { ok: false, error: 'id required' });
        if (!isValidDeckHubId(id)) return send(res, 400, { ok: false, error: 'invalid id' });
        const post = await getDeckPost(id);
        if (!post) return send(res, 404, { ok: false, error: 'not found' });
        if (String(post.author || '') !== String(auth.username || '')) return send(res, 403, { ok: false, error: 'forbidden' });
        await deleteDeckPost(id);
        return send(res, 200, { ok: true, id });
      }

      if (action === 'import') {
        const id = String(body.id || '').trim();
        if (!id) return send(res, 400, { ok: false, error: 'id required' });
        if (!isValidDeckHubId(id)) return send(res, 400, { ok: false, error: 'invalid id' });
        const post = await bumpMetric(id, 'imports');
        if (!post) return send(res, 404, { ok: false, error: 'not found' });
        return send(res, 200, { ok: true, post });
      }

      if (action) return send(res, 400, { ok: false, error: 'unsupported action' });

      const title = String(body.title || '').trim();
      const description = String(body.description || '').trim();
      const code = String(body.code || '').trim();
      const tags = normalizeTags(body.tags);

      if (!title || title.length > TITLE_MAX) return send(res, 400, { ok: false, error: `title must be 1~${TITLE_MAX} chars` });
      if (description.length > DESCRIPTION_MAX) return send(res, 400, { ok: false, error: 'description too long' });
      if (!code || code.length > DECK_CODE_MAX) return send(res, 400, { ok: false, error: 'invalid code length' });

      const decoded = decodeDeckCodeSummary(code);
      if (!decoded.ok) return send(res, 400, { ok: false, error: decoded.reason });

      const post = await createDeckPost({
        title,
        description,
        author: auth.username,
        code,
        cardsCount: decoded.total,
        tags
      });

      return send(res, 200, { ok: true, post });
    }

    return send(res, 405, { ok: false, error: 'method not allowed' });
  } catch (e) {
    return send(res, 500, { ok: false, error: 'DECK_HUB_SERVER_ERROR' });
  }
};
