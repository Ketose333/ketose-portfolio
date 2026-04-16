import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { readAuthSession } from '@portfolio/account-client'
import { mapDeckError } from '../app/api/errors'
import { postJson, readJson } from '../app/api/client'
import { ActionDialog } from '../app/components/ActionDialog'
import { readClipboardTextSafe, writeClipboardTextSafe } from '../client/ui/clipboard'
import { GatedPageNotice } from '../app/components/GatedPageNotice'
import { getDeckCodecGlobal, getSharedCardsGlobal, normalizeCardKey, type CardDef } from '../app/globals'
import type { AuthResponse } from '../app/types'

const MIN_DECK = 30
const MAX_SAME_CARD = 3
const PAGE_SIZE = 8

type DeckSlot = {
  id: string
  name: string
  deck: string[]
}

type DeckSlotsResponse = {
  ok: boolean
  agentId?: string
  activeSlotId?: string
  slots?: DeckSlot[]
  error?: string
}

function compareCardKeys(a: string, b: string, defs: Record<string, CardDef>) {
  const themeCompare = String(defs[a]?.theme || '').localeCompare(String(defs[b]?.theme || ''), 'ko')
  if (themeCompare !== 0) return themeCompare
  const nameCompare = String(defs[a]?.name || a).localeCompare(String(defs[b]?.name || b), 'ko')
  if (nameCompare !== 0) return nameCompare
  return a.localeCompare(b)
}

function spellKindLabel(kind?: string) {
  const map: Record<string, string> = { normal: '일반', continuous: '지속', equip: '장착' }
  return map[String(kind || '').toLowerCase()] || '마법'
}

function normalizeEffectText(raw = '') {
  return String(raw || '')
    .replace(/([^\s(])\(/g, '$1 (')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function makeCountMap(deck: string[]) {
  const counts: Record<string, number> = {}
  for (const key of deck) counts[key] = (counts[key] || 0) + 1
  return counts
}

function validateImportedDeck(deck: string[]) {
  if (deck.length < MIN_DECK) return `덱은 최소 ${MIN_DECK}장 이상이어야 해요.`
  const counts = makeCountMap(deck)
  for (const count of Object.values(counts)) {
    if (count < 1 || count > MAX_SAME_CARD) {
      return `카드 수량은 1~${MAX_SAME_CARD}장만 가능해요.`
    }
  }
  return ''
}

function renderDeckCard(def: CardDef | undefined, key: string, options?: { count?: number }) {
  const normalizedKey = normalizeCardKey(key)
  const type = def?.type === 'monster' ? '유닛' : '마법'
  const footer = def?.type === 'monster'
    ? `${def?.atk ?? '-'} / ${def?.hp ?? '-'}`
    : spellKindLabel(def?.spellKind)
  const meta = [def?.race, def?.theme, def?.element].filter(Boolean).join(' · ')
  const effect = normalizeEffectText(def?.effect || '') || '효과 없음'

  return (
    <div className="deck-card-surface">
      <div className={`bp-card ${def?.type === 'monster' ? 'bp-card--unit' : 'bp-card--spell'}`}>
        <div className="bp-card__chrome" />
        <div className="bp-card__head">
          <span className="bp-card__cost">{def?.cost ?? '-'}</span>
          <span className="bp-card__type">{type}</span>
        </div>
        <div className="bp-card__body">
          <div className="bp-card__name">{def?.name || normalizedKey}</div>
          <div className={`bp-card__meta${meta ? '' : ' bp-card__meta--empty'}`}>{meta || '분류 없음'}</div>
          <div className="bp-card__text">{effect}</div>
        </div>
        <div className="bp-card__foot">
          <span className="bp-card__footer">{footer}</span>
          {typeof options?.count === 'number' ? <span className="bp-card__footer">x{options.count}</span> : null}
        </div>
      </div>
    </div>
  )
}

export function DeckPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const shared = getSharedCardsGlobal()
  const deckCodec = getDeckCodecGlobal()
  const defs = shared?.CARD_DEFS || {}
  const allCards = useMemo(
    () => Object.keys(defs).sort((a, b) => compareCardKeys(a, b, defs)),
    [defs],
  )

  const [authUser, setAuthUser] = useState<AuthResponse['user'] | null>(null)
  const [slots, setSlots] = useState<DeckSlot[]>([])
  const [activeSlotId, setActiveSlotId] = useState('')
  const [deck, setDeck] = useState<string[]>([])
  const [status, setStatus] = useState('불러오는 중')
  const [booting, setBooting] = useState(true)
  const [authRequired, setAuthRequired] = useState(false)
  const [filter, setFilter] = useState({ race: '', theme: '', element: '' })
  const [poolPage, setPoolPage] = useState(1)
  const [deckCode, setDeckCode] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [createSlotOpen, setCreateSlotOpen] = useState(false)
  const [deleteSlotOpen, setDeleteSlotOpen] = useState(false)

  const counts = useMemo(() => makeCountMap(deck), [deck])
  const activeSlot = slots.find((slot) => slot.id === activeSlotId) || null
  const deckSignals = [
    { label: '슬롯', value: activeSlot?.name || '슬롯 미선택' },
    { label: '장수', value: `${deck.length}장` },
    { label: '제한', value: `최소 ${MIN_DECK} / 동명 ${MAX_SAME_CARD}` },
  ]

  const filteredCards = useMemo(
    () =>
      allCards.filter((key) => {
        const card: CardDef | undefined = defs[key]
        if (filter.race && card.race !== filter.race) return false
        if (filter.theme && card.theme !== filter.theme) return false
        if (filter.element && card.element !== filter.element) return false
        return true
      }),
    [allCards, defs, filter],
  )

  const totalPages = Math.max(1, Math.ceil(filteredCards.length / PAGE_SIZE))
  const pagedCards = filteredCards.slice((poolPage - 1) * PAGE_SIZE, poolPage * PAGE_SIZE)

  useEffect(() => {
    setPoolPage((current) => Math.min(Math.max(1, current), totalPages))
  }, [totalPages])

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      try {
        const auth = await readAuthSession()
        if (!auth.ok || !auth.user) {
          if (!cancelled) {
            setAuthRequired(true)
          }
          navigate('/login?next=%2Fdeck', { replace: true })
          return
        }

        if (cancelled) return

        setAuthUser(auth.user)
        const slotResponse = await readJson<DeckSlotsResponse>(
          `/api/deck?action=slots&agentId=${encodeURIComponent(auth.user.username)}`,
        )
        if (cancelled) return

        if (!slotResponse.ok) {
          setStatus('덱 슬롯을 불러오지 못했습니다.')
          return
        }

        const nextSlots = slotResponse.slots || []
        const nextSlotId = slotResponse.activeSlotId || nextSlots[0]?.id || ''
        setSlots(nextSlots)
        setActiveSlotId(nextSlotId)
        setDeck((nextSlots.find((slot) => slot.id === nextSlotId)?.deck || []).map(normalizeCardKey))
        setStatus('덱을 불러왔습니다.')
      } catch {
        if (!cancelled) {
          setAuthRequired(true)
          setStatus('덱 화면을 불러오지 못했습니다.')
        }
      } finally {
        if (!cancelled) {
          setBooting(false)
        }
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [navigate])

  useEffect(() => {
    const pending = String((location.state as { importDeckCode?: string } | null)?.importDeckCode || '')
    if (!pending || !deckCodec?.decodeDeckCode) return

    navigate(location.pathname, { replace: true, state: null })
    setDeckCode(pending)
    const result = deckCodec.decodeDeckCode(pending)
    if (!result.ok || !result.deck) {
      setStatus('가져온 덱 코드를 해석하지 못했습니다.')
      return
    }

    const importedDeck = result.deck.map(normalizeCardKey)
    const error = validateImportedDeck(importedDeck)
    if (error) {
      setStatus(error)
      return
    }

    updateDeck(importedDeck)
    setStatus('허브 덱을 현재 슬롯으로 불러왔습니다.')
  }, [deckCodec, location.pathname, location.state, navigate])

  if (!booting && authRequired && !authUser) {
    return (
      <GatedPageNotice
        kicker="DECK"
        title="덱 편집은 로그인 뒤에 사용할 수 있습니다."
        description="카드 추가, 슬롯 저장, 덱 코드 적용은 로그인한 상태에서만 가능합니다."
        primaryAction={{ label: '로그인', onClick: () => navigate('/login?next=%2Fdeck') }}
        secondaryAction={{ label: '대기실', onClick: () => navigate('/lobby') }}
      />
    )
  }

  function updateDeck(nextDeck: string[]) {
    setDeck(nextDeck.map(normalizeCardKey))
  }

  async function refreshSlots(nextSlotId?: string) {
    if (!authUser?.username) return
    const response = await readJson<DeckSlotsResponse>(
      `/api/deck?action=slots&agentId=${encodeURIComponent(authUser.username)}`,
    )
    if (!response.ok) {
      setStatus(mapDeckError(response.error || ''))
      return
    }

    const nextSlots = response.slots || []
    const resolvedSlotId = nextSlotId || response.activeSlotId || nextSlots[0]?.id || ''
    setSlots(nextSlots)
    setActiveSlotId(resolvedSlotId)
    updateDeck(nextSlots.find((slot) => slot.id === resolvedSlotId)?.deck || [])
  }

  async function switchSlot(slotId: string) {
    if (!authUser?.username) return
    setBusy('switch')
    try {
      const response = await postJson<DeckSlotsResponse>('/api/deck?action=switch_slot', {
        agentId: authUser.username,
        slotId,
      })
      if (!response.ok) {
        setStatus(mapDeckError(response.error || ''))
        return
      }
      const nextSlots = response.slots || []
      const nextSlotId = response.activeSlotId || slotId
      setSlots(nextSlots)
      setActiveSlotId(nextSlotId)
      updateDeck(nextSlots.find((slot) => slot.id === nextSlotId)?.deck || [])
      setStatus('슬롯을 전환했습니다.')
    } finally {
      setBusy(null)
    }
  }

  function addCard(key: string) {
    const normalized = normalizeCardKey(key)
    if ((counts[normalized] || 0) >= MAX_SAME_CARD) {
      setStatus(`동명 카드는 ${MAX_SAME_CARD}장까지 넣을 수 있습니다.`)
      return
    }
    updateDeck([...deck, normalized])
  }

  function removeCard(key: string) {
    const normalized = normalizeCardKey(key)
    const index = deck.indexOf(normalized)
    if (index < 0) return
    updateDeck(deck.toSpliced(index, 1))
  }

  async function saveDeck() {
    if (!authUser?.username) return
    if (deck.length < MIN_DECK) {
      setStatus(`덱은 ${MIN_DECK}장 이상이어야 합니다.`)
      return
    }
    setBusy('save')
    try {
      const response = await postJson<{ ok: boolean; error?: string }>('/api/deck', {
        agentId: authUser.username,
        deck,
      })
      setStatus(response.ok ? '덱을 저장했습니다.' : mapDeckError(response.error || ''))
      if (response.ok) {
        await refreshSlots(activeSlotId)
      }
    } finally {
      setBusy(null)
    }
  }

  async function createSlot(name: string) {
    if (!authUser?.username) return
    if (!name) return
    setBusy('create-slot')
    try {
      const response = await postJson<DeckSlotsResponse>('/api/deck?action=create_slot', {
        agentId: authUser.username,
        name,
      })
      if (!response.ok) {
        setStatus(mapDeckError(response.error || ''))
        return
      }
      await refreshSlots(response.activeSlotId)
      setStatus('슬롯을 추가했습니다.')
    } finally {
      setBusy(null)
    }
  }

  async function deleteSlot() {
    if (!authUser?.username || !activeSlotId) return
    setBusy('delete-slot')
    try {
      const response = await postJson<DeckSlotsResponse>('/api/deck?action=delete_slot', {
        agentId: authUser.username,
        slotId: activeSlotId,
      })
      if (!response.ok) {
        setStatus(mapDeckError(response.error || ''))
        return
      }
      await refreshSlots(response.activeSlotId)
      setStatus('슬롯을 삭제했습니다.')
    } finally {
      setBusy(null)
    }
  }

  async function loadDeck() {
    await refreshSlots(activeSlotId)
    setStatus('덱을 다시 불러왔습니다.')
  }

  async function exportDeckCode() {
    if (!deckCodec?.encodeV2FromCounts) {
      setStatus('덱 코드 생성기를 불러오지 못했습니다.')
      return
    }
    if (deck.length < MIN_DECK) {
      setStatus(`덱은 ${MIN_DECK}장 이상이어야 코드 생성이 가능합니다.`)
      return
    }
    const code = deckCodec.encodeV2FromCounts(counts)
    setDeckCode(code)
    const copied = await writeClipboardTextSafe(code)
    setStatus(copied ? '덱 코드를 생성하고 클립보드에 복사했습니다.' : '덱 코드를 생성했습니다.')
  }

  async function pasteDeckCode() {
    const nextCode = await readClipboardTextSafe()
    if (!nextCode.trim()) {
      setStatus('클립보드에 덱 코드가 없습니다.')
      return
    }
    setDeckCode(nextCode.trim())
    setStatus('덱 코드를 붙여넣었습니다.')
  }

  function importDeckCode() {
    if (!deckCodec?.decodeDeckCode) {
      setStatus('덱 코드 해석기를 불러오지 못했습니다.')
      return
    }
    const result = deckCodec.decodeDeckCode(deckCode)
    if (!result.ok || !result.deck) {
      setStatus('덱 코드를 적용하지 못했습니다.')
      return
    }
    const importedDeck = result.deck.map(normalizeCardKey)
    const error = validateImportedDeck(importedDeck)
    if (error) {
      setStatus(error)
      return
    }
    updateDeck(importedDeck)
    setStatus('덱 코드를 적용했습니다.')
  }

  return (
    <main className="nulsight-shell">
      <section className="nulsight-panel nulsight-panel--compact row deck-toolbar" aria-label="덱 조작">
        <div className="deck-toolbar__head">
          <p className="nulsight-kicker">DECK</p>
          <h1 className="nulsight-section-title">덱 편집</h1>
          <div className="deck-toolbar__signals" aria-label="덱 상태">
            {deckSignals.map((entry) => (
              <article className="nulsight-band" key={entry.label}>
                <span className="nulsight-band__label">{entry.label}</span>
                <strong className="nulsight-band__value">{entry.value}</strong>
              </article>
            ))}
          </div>
        </div>
        <div className="deck-toolbar__left">
          <select
            className="deck-agent"
            aria-label="덱 슬롯"
            value={activeSlotId}
            onChange={(event) => void switchSlot(event.target.value)}
            disabled={!slots.length || busy !== null}
          >
            {slots.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {slot.name || '덱 슬롯'}
              </option>
            ))}
          </select>
          <button className="ghost nulsight-button" type="button" onClick={() => setCreateSlotOpen(true)} disabled={busy !== null}>
            슬롯 추가
          </button>
          <button className="ghost nulsight-button" type="button" onClick={() => setDeleteSlotOpen(true)} disabled={!activeSlotId || busy !== null}>
            슬롯 삭제
          </button>
          <button className="ghost nulsight-button" type="button" onClick={() => void loadDeck()} disabled={busy !== null}>
            불러오기
          </button>
          <button className="primary nulsight-button nulsight-button--primary" type="button" onClick={() => void saveDeck()} disabled={busy !== null}>
            저장
          </button>
        </div>

        <div className="deck-toolbar__right">
          <div className="deck-stat" role="status" aria-live="polite">
            {status}
          </div>
        </div>
      </section>

      <section className="nulsight-panel nulsight-panel--compact deck-share" aria-label="덱 코드 공유">
        <div className="deck-share__head">
          <div>
            <p className="nulsight-kicker">SHARE</p>
            <h2 className="t-section deck-pane-title">덱 코드</h2>
          </div>
        </div>
        <textarea
          className="deck-code"
          rows={3}
          placeholder="덱 코드를 입력하거나 생성해 주세요."
          value={deckCode}
          onChange={(event) => setDeckCode(event.target.value)}
        />
        <div className="deck-share__actions">
          <button className="ghost nulsight-button" type="button" onClick={() => void exportDeckCode()}>
            코드 생성
          </button>
          <button className="ghost nulsight-button" type="button" onClick={() => void pasteDeckCode()}>
            코드 붙여넣기
          </button>
          <button className="primary nulsight-button nulsight-button--primary" type="button" onClick={importDeckCode}>
            코드 적용
          </button>
        </div>
      </section>

      <div className="deck-grid" aria-label="카드 목록">
        <article className="nulsight-panel deck-panel">
          <header className="deck-pane-head">
            <div>
              <p className="nulsight-kicker">POOL</p>
              <h1 className="t-section deck-pane-title">카드 풀</h1>
            </div>
          </header>

          <div className="pool-filters" aria-label="카드 풀 필터">
            <label className="pool-filter">
              종족
              <select value={filter.race} onChange={(event) => setFilter((current) => ({ ...current, race: event.target.value }))}>
                <option value="">전체</option>
                {(shared?.CARD_RACES || []).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="pool-filter">
              테마
              <select value={filter.theme} onChange={(event) => setFilter((current) => ({ ...current, theme: event.target.value }))}>
                <option value="">전체</option>
                {(shared?.CARD_THEMES || []).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="pool-filter">
              속성
              <select
                value={filter.element}
                onChange={(event) => setFilter((current) => ({ ...current, element: event.target.value }))}
              >
                <option value="">전체</option>
                {(shared?.CARD_ELEMENTS || []).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="ghost nulsight-button"
              type="button"
              onClick={() => setFilter({ race: '', theme: '', element: '' })}
            >
              필터 초기화
            </button>
          </div>

          <div className="pool-pager" aria-label="카드 풀 페이지 이동">
              <button className="ghost nulsight-button" type="button" onClick={() => setPoolPage((page) => Math.max(1, page - 1))}>
                이전
              </button>
            <span id="poolPageInfo" className="muted">
              {poolPage} / {totalPages}
            </span>
              <button className="ghost nulsight-button" type="button" onClick={() => setPoolPage((page) => Math.min(totalPages, page + 1))}>
                다음
              </button>
            </div>

          <div id="pool" className="deck-pool-grid" aria-label="카드 풀 목록">
            {pagedCards.map((key) => {
              const card = defs[key]
              const count = counts[key] || 0
              const typeLabel = card?.type === 'monster' ? '유닛' : '마법'
              const stat = card?.type === 'monster' ? `${card.atk}/${card.hp}` : spellKindLabel(card?.spellKind)
              const chips = [card?.race, card?.theme, card?.element].filter(Boolean)

              return (
                <article className="deck-card" key={key}>
                  {renderDeckCard(card, key, { count })}
                  <div className="deck-card__meta">
                    <span className="deck-chip">{typeLabel}</span>
                    <span className="deck-chip">{stat}</span>
                    {chips.map((chip) => (
                      <span className="deck-chip" key={chip}>
                        {chip}
                      </span>
                    ))}
                  </div>
                  <div className="deck-card__actions">
                    <button className="ghost nulsight-button" type="button" onClick={() => removeCard(key)}>
                      -1
                    </button>
                    <button className="primary nulsight-button nulsight-button--primary" type="button" onClick={() => addCard(key)}>
                      +1
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </article>

        <article className="nulsight-panel deck-panel">
          <header className="deck-pane-head">
            <div>
              <p className="nulsight-kicker">CURRENT</p>
              <h2 className="t-section deck-pane-title">현재 덱</h2>
            </div>
          </header>
          <div id="deck" aria-label="현재 덱 목록">
            {Object.entries(counts).length ? (
              Object.entries(counts)
                .sort((a, b) => compareCardKeys(a[0], b[0], defs))
                .map(([key, count]) => {
                  const card = defs[key]
                  const chips = [card?.race, card?.theme, card?.element].filter(Boolean)
                  const stat = card?.type === 'monster' ? `${card.atk}/${card.hp}` : spellKindLabel(card?.spellKind)

                  return (
                    <article className="deck-line deck-line--summary" key={key}>
                      <div className="deck-line__main">
                        <div className="deck-line__row">
                          <strong className="deck-line__title">{card?.name || normalizeCardKey(key)}</strong>
                          <span className="deck-line__count">x{count}</span>
                        </div>
                        <small className="muted deck-line__chips">
                          {[card?.type === 'monster' ? '유닛' : '마법', stat, ...chips].filter(Boolean).join(' · ')}
                        </small>
                        <p className="deck-line__text">{normalizeEffectText(card?.effect || '') || '효과 없음'}</p>
                      </div>
                    </article>
                  )
                })
            ) : (
              <div className="deck-empty-state">
                <p className="deck-empty-state__title">아직 비어 있는 슬롯입니다</p>
                <p className="deck-empty-state__body">
                  왼쪽 카드 풀에서 유닛과 마법을 추가하면 여기에 현재 덱 구성이 정리됩니다.
                </p>
              </div>
            )}
          </div>
        </article>
      </div>

      <div className="nulsight-note-stack">
        <p className="nulsight-status">{status}</p>
      </div>

      <ActionDialog
        open={createSlotOpen}
        kicker="DECK"
        title="새 슬롯 만들기"
        description="슬롯 이름을 정하면 빈 덱 슬롯이 추가됩니다."
        inputLabel="슬롯 이름"
        inputPlaceholder={`덱 ${slots.length + 1}`}
        defaultValue={`덱 ${slots.length + 1}`}
        maxLength={24}
        confirmLabel="추가"
        onCancel={() => setCreateSlotOpen(false)}
        onConfirm={(value) => {
          setCreateSlotOpen(false)
          void createSlot(value || '')
        }}
      />

      <ActionDialog
        open={deleteSlotOpen}
        kicker="DECK"
        title="현재 슬롯을 삭제할까요?"
        description={activeSlot ? `선택된 슬롯 "${activeSlot.name || '덱 슬롯'}"이 삭제됩니다.` : '현재 슬롯이 삭제됩니다.'}
        confirmLabel="삭제"
        onCancel={() => setDeleteSlotOpen(false)}
        onConfirm={() => {
          setDeleteSlotOpen(false)
          void deleteSlot()
        }}
      />
    </main>
  )
}
