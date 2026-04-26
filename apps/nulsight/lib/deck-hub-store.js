const { loadKV, canUseKV, tryKV, withLegacy, aliasGlobalStore } = require('./storage-config');

const kv = loadKV();
const mem = aliasGlobalStore('__portfolio_nulsight_deck_hub_store', '__nulsight_deck_hub_store', () => ({
  list: [],
  byId: new Map(),
}));

const [LIST_KEY, LEGACY_LIST_KEY] = withLegacy(['deckhub', 'list']);
const HUB_LIST_LIMIT = 500;

function itemKeys(id) {
  return withLegacy(['deckhub', 'item', id]);
}

function hasKV() {
  return canUseKV(kv);
}

function nowIso() {
  return new Date().toISOString();
}

function makeId() {
  return `d_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return [...new Set(tags.map((x) => String(x || '').trim()).filter(Boolean))].slice(0, 8);
}

function normalizeListRef(entry) {
  if (!entry) return null;
  if (typeof entry === 'string') {
    try {
      return normalizeListRef(JSON.parse(entry));
    } catch {
      const id = entry.trim();
      return id ? { id, createdAt: '' } : null;
    }
  }
  if (typeof entry !== 'object') return null;
  const id = String(entry.id || '').trim();
  if (!id) return null;
  return {
    id,
    createdAt: String(entry.createdAt || '').trim(),
  };
}

function normalizeHubList(list) {
  return (Array.isArray(list) ? list : [])
    .map(normalizeListRef)
    .filter(Boolean)
    .slice(0, HUB_LIST_LIMIT);
}

async function readHubListKey(key) {
  const kind = await kv.type(key);
  if (kind === 'list') {
    return normalizeHubList(await kv.lrange(key, 0, HUB_LIST_LIMIT - 1));
  }
  if (kind === 'string') {
    return normalizeHubList(await kv.get(key));
  }
  return [];
}

async function getHubList() {
  const raw = hasKV()
    ? await tryKV(async () => {
      const current = await readHubListKey(LIST_KEY);
      if (current.length > 0) return current;
      return readHubListKey(LEGACY_LIST_KEY);
    }, () => mem.list)
    : mem.list;
  return normalizeHubList(raw);
}

async function setHubList(list) {
  const safeList = normalizeHubList(list);
  if (hasKV()) {
    await tryKV(async () => {
      const [currentType, legacyType] = await Promise.all([kv.type(LIST_KEY), kv.type(LEGACY_LIST_KEY)]);
      const delKeys = [];
      if (currentType && currentType !== 'none') delKeys.push(LIST_KEY);
      if (legacyType && legacyType !== 'none') delKeys.push(LEGACY_LIST_KEY);
      if (delKeys.length && typeof kv.del === 'function') await kv.del(...delKeys);
      if (safeList.length > 0) await kv.rpush(LIST_KEY, ...safeList);
    }, () => {
      mem.list = safeList;
    });
    return;
  }
  mem.list = safeList;
}

async function getDeckPost(id) {
  if (!id) return null;
  if (hasKV()) {
    return tryKV(async () => {
      const [primaryKey, legacyKey] = itemKeys(id);
      return (await kv.get(primaryKey)) || (await kv.get(legacyKey)) || null;
    }, () => mem.byId.get(id) || null);
  }
  return mem.byId.get(id) || null;
}

async function setDeckPost(post) {
  if (hasKV()) {
    const [primaryKey] = itemKeys(post.id);
    await tryKV(() => kv.set(primaryKey, post), () => mem.byId.set(post.id, post));
    return;
  }
  mem.byId.set(post.id, post);
}

async function createDeckPost({ title, description, author, code, cardsCount, tags = [] }) {
  const id = makeId();
  const now = nowIso();
  const post = {
    id,
    title: String(title || '').trim(),
    description: String(description || '').trim(),
    author: String(author || '').trim(),
    code: String(code || '').trim(),
    cardsCount: Number(cardsCount) || 0,
    tags: normalizeTags(tags),
    imports: 0,
    createdAt: now,
    updatedAt: now,
  };

  await setDeckPost(post);
  const nextRef = { id: post.id, createdAt: post.createdAt };

  if (hasKV()) {
    await tryKV(async () => {
      const legacyType = await kv.type(LEGACY_LIST_KEY);
      if (legacyType && legacyType !== 'none' && typeof kv.del === 'function') {
        await kv.del(LEGACY_LIST_KEY);
      }
      await kv.lpush(LIST_KEY, nextRef);
      await kv.ltrim(LIST_KEY, 0, HUB_LIST_LIMIT - 1);
    }, async () => {
      const nextList = [nextRef, ...mem.list];
      mem.list = normalizeHubList(nextList);
    });
  } else {
    mem.list = normalizeHubList([nextRef, ...mem.list]);
  }

  return post;
}

function toTimeMs(v) {
  const t = Date.parse(String(v || ''));
  return Number.isFinite(t) ? t : 0;
}

async function listDeckPosts({ q = '', sort = 'latest', limit = 30, offset = 0 }) {
  const refs = await getHubList();
  const ids = refs
    .map((r) => (r && typeof r === 'object' ? r.id : null))
    .filter(Boolean);

  const rows = [];
  for (const id of ids) {
    const item = await getDeckPost(id);
    if (item && typeof item === 'object') rows.push(item);
  }

  const qq = String(q || '').trim().toLowerCase();
  let filtered = rows;
  if (qq) {
    filtered = rows.filter((r) =>
      String(r.title || '').toLowerCase().includes(qq) ||
      String(r.author || '').toLowerCase().includes(qq) ||
      String(r.description || '').toLowerCase().includes(qq) ||
      (Array.isArray(r.tags) ? r.tags : []).some((t) => String(t).toLowerCase().includes(qq))
    );
  }

  if (sort === 'imports') {
    filtered.sort((a, b) => {
      const byImports = (Number(b.imports) || 0) - (Number(a.imports) || 0);
      if (byImports) return byImports;
      const byCreated = toTimeMs(b.createdAt) - toTimeMs(a.createdAt);
      if (byCreated) return byCreated;
      return String(b.id || '').localeCompare(String(a.id || ''));
    });
  } else {
    filtered.sort((a, b) => {
      const byCreated = toTimeMs(b.createdAt) - toTimeMs(a.createdAt);
      if (byCreated) return byCreated;
      return String(b.id || '').localeCompare(String(a.id || ''));
    });
  }

  const total = filtered.length;
  const page = filtered.slice(offset, offset + limit);
  return { total, items: page };
}

async function deleteDeckPost(id) {
  const post = await getDeckPost(id);
  if (!post) return false;

  if (hasKV()) {
    await tryKV(() => {
      const [primaryKey, legacyKey] = itemKeys(id);
      return kv.del(primaryKey, legacyKey);
    }, () => mem.byId.delete(id));
  } else {
    mem.byId.delete(id);
  }

  const refs = await getHubList();
  const next = refs.filter((r) => String((r && r.id) || '') !== String(id));
  await setHubList(next);
  return true;
}

async function bumpMetric(id, field) {
  const post = await getDeckPost(id);
  if (!post) return null;
  const next = { ...post, [field]: (Number(post[field]) || 0) + 1, updatedAt: nowIso() };
  await setDeckPost(next);
  return next;
}

module.exports = {
  createDeckPost,
  listDeckPosts,
  getDeckPost,
  deleteDeckPost,
  bumpMetric,
};
