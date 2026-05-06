import { getSharedCardsGlobal } from '../app/globals'
import { NulsightPageFrame } from '../app/components/NulsightPageFrame'
import { NulsightPanel } from '../app/components/NulsightPanel'

const guideSections = [
  {
    id: 'g1',
    title: '1) 턴/페이즈',
    body: [
      '드로우 → 메인 → 배틀 → 엔드 순서로 진행됩니다.',
      '선공 첫 턴에는 배틀이 열리지 않습니다.',
      '드로우와 엔드는 열린 행동이 없으면 빠르게 다음 구간으로 넘어갑니다.',
    ],
  },
  {
    id: 'g2',
    title: '2) 기본 조작',
    body: [
      '전개: 손패를 선택한 뒤 빈 슬롯을 클릭합니다.',
      '유닛 공격: 내 유닛을 선택한 뒤 상대 유닛을 클릭합니다.',
      '본체 공격: 내 유닛을 선택한 뒤 본체 공격 버튼을 누릅니다.',
      '항복: 항복 버튼을 누르면 즉시 패배 처리됩니다.',
      '우선권 패스: 체인이나 열린 창이 있으면 상대에게 응답 순서를 넘깁니다.',
    ],
  },
] as const

function keywordLabel(name: string, terms: Record<string, string>) {
  const fallbackMap: Record<string, string> = {
    deploy: '전개',
    active: '사용',
    continuous: '지속',
    forced: '자동',
    optional: '선택',
    search: '탐색',
    recruit: '징집',
    heal: '치유',
    overcharge: '충전',
    chain: '연쇄',
    targeting: '지정',
    pressure: '피해',
    equip: '장착',
    guard: '수호',
    release: '희생',
    banish: '제외',
    selfDestruct: '자폭',
  }

  return terms[name] || fallbackMap[name] || name || '키워드'
}

function normalizeKeywordDescription(text: string) {
  return text
    .replaceAll('priority_pass', '우선권 패스')
    .replaceAll('on_play', '사용 시점')
    .replaceAll('on_deploy', '전개 시점')
}

export function GuidePage() {
  const shared = getSharedCardsGlobal()
  const terms = shared?.TERMS || {}
  const keywordCatalog = shared?.buildKeywordCatalog?.() || []

  return (
    <NulsightPageFrame className="nulsight-shell nulsight-shell--reading" width="reading">
      <section className="nulsight-page-main">
        <NulsightPanel
          ariaLabel="기본 규칙"
          compact
          eyebrow="규칙"
          title="듀얼 가이드"
          titleAs="h1"
          description={
            <p className="nulsight-copy nulsight-copy--tight">
              턴 순서, 조작, 키워드만 빠르게 확인합니다.
            </p>
          }
        >
          <div className="nulsight-band-list nulsight-band-list--guide">
            <article className="nulsight-band">
              <span className="nulsight-band__label">페이즈</span>
              <strong className="nulsight-band__value">드로우 → 메인 → 배틀 → 엔드</strong>
            </article>
            <article className="nulsight-band">
              <span className="nulsight-band__label">조작</span>
              <strong className="nulsight-band__value">손패 선택 후 목표 슬롯/대상 클릭</strong>
            </article>
            <article className="nulsight-band">
              <span className="nulsight-band__label">키워드</span>
              <strong className="nulsight-band__value">{keywordCatalog.length ? `${keywordCatalog.length}개` : '불러오는 중'}</strong>
            </article>
          </div>
        </NulsightPanel>

        <section className="nulsight-guide-grid">
          {guideSections.map((section) => (
            <article className="nulsight-panel guide-card" id={section.id} key={section.id}>
              <div className="guide-card__title">{section.title}</div>
              <div className="guide-bullets">
                {section.body.map((line) => (
                  <div className="bullet" key={line}>
                    <span className="bullet-dot" aria-hidden="true" />
                    <div className="muted lh15">{line}</div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>

        <article className="nulsight-panel guide-card" id="g3">
          <div className="guide-card__title">3) 키워드 문법</div>
          <div className="guide-bullets guide-bullets--catalog">
            {keywordCatalog.length ? (
              keywordCatalog.map((entry) => (
                <div className="bullet" key={entry.name}>
                  <span className="bullet-dot" aria-hidden="true" />
                  <div className="muted lh15">
                    <span className="code-token">{keywordLabel(entry.name, terms)}</span> :{' '}
                    {normalizeKeywordDescription(entry.description || '설명이 아직 준비되지 않았습니다.')}
                  </div>
                </div>
              ))
            ) : (
              <div className="muted lh15">키워드 데이터를 불러오지 못했습니다.</div>
            )}
          </div>
        </article>
      </section>
    </NulsightPageFrame>
  )
}
