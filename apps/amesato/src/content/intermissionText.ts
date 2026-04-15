import type { CampaignStageNumber, GameRoute } from '../game/core/types'
import { gameplayTerminology, getRouteBranchLabel } from './terminology'

export type BossDialoguePhase = 'before-boss' | 'after-boss' | 'ending'
export type EndingKind = 'good' | 'bad'

export interface DialogueLine {
  speaker: string
  text: string
}

export interface DialogueSequence {
  title: string
  prompt: string
  lines: DialogueLine[]
}

export const stageBonusText = {
  title: '스테이지 보너스',
  subtitlePrefix: '제',
  prompt: `${gameplayTerminology.controls.shotKeyLabel}로 진행`,
  labels: {
    time: '시간',
    combo: '최대 콤보',
    resources: '남은 자원',
    stage: '면 수치',
    total: '합계',
  },
} as const

export const sceneTotalText = {
  title: '총계',
  finalTitle: '최종 총계',
  subtitlePrefix: '제',
  prompt: `${gameplayTerminology.controls.shotKeyLabel}로 진행`,
  labels: {
    time: '시간',
    combo: '최대 콤보',
    resources: '남은 자원',
    stage: '면 수치',
    total: '총계',
  },
} as const

export function getBossDialogueSequence(
  stageNumber: CampaignStageNumber,
  phase: BossDialoguePhase,
  route: GameRoute,
  bossName: string,
  endingKind: EndingKind = 'good',
): DialogueSequence {
  const player = gameplayTerminology.playerLabel
  const routeLabel = getRouteBranchLabel(route)

  if (stageNumber === 5 && phase === 'before-boss') {
    return {
      title: '보스 조우',
      prompt: `${gameplayTerminology.controls.shotKeyLabel}로 대화 진행`,
      lines: [
        { speaker: bossName, text: '여기서부터는 관측 밖의 영역이다. 함부로 지나갈 수는 없다.' },
        { speaker: player, text: '이미 시작된 이변이야. 여기서 멈출 생각은 없어.' },
        { speaker: bossName, text: '좋다. 네가 어떤 태도로 이 기둥을 마주하는지 직접 보겠다.' },
      ],
    }
  }

  if (stageNumber === 5 && phase === 'after-boss') {
    return {
      title: '전투 후 대화',
      prompt: `${gameplayTerminology.controls.shotKeyLabel}로 대화 진행`,
      lines: [
        { speaker: bossName, text: '이제 선택해라. 닫을 것인지, 더 들여다볼 것인지.' },
        { speaker: player, text: '좋아. 여기서부터는 내가 정한 방향으로 간다.' },
      ],
    }
  }

  if (stageNumber === 10 && phase === 'before-boss') {
    return {
      title: '보스 조우',
      prompt: `${gameplayTerminology.controls.shotKeyLabel}로 대화 진행`,
      lines: [
        { speaker: bossName, text: `${routeLabel} 쪽 판단으로 여기까지 왔군.` },
        { speaker: player, text: '아직 끝이 아니야. 여기서 무엇을 택할지 더 분명히 할 거야.' },
        { speaker: bossName, text: '그렇다면 네 선택이 얼마나 버틸 수 있는지 보자.' },
      ],
    }
  }

  if (stageNumber === 10 && phase === 'after-boss') {
    return {
      title: '전투 후 대화',
      prompt: `${gameplayTerminology.controls.shotKeyLabel}로 대화 진행`,
      lines: [
        { speaker: bossName, text: '중간 경계는 넘어섰다. 하지만 다음부터는 더 깊은 판단이 필요하다.' },
        { speaker: player, text: '좋아. 끝까지 가서 이 이변의 결말을 직접 확인하겠어.' },
      ],
    }
  }

  if (stageNumber === 15 && phase === 'before-boss') {
    return {
      title: '보스 조우',
      prompt: `${gameplayTerminology.controls.shotKeyLabel}로 대화 진행`,
      lines: [
        { speaker: bossName, text: `${routeLabel} 쪽 해석을 아직도 붙들고 있군.` },
        { speaker: player, text: '붙드는 게 아니라 확인하는 거야. 여기서 물러설 이유는 없어.' },
        { speaker: bossName, text: '좋다. 네가 끝까지 감당할 수 있는지 보아라.' },
      ],
    }
  }

  if (stageNumber === 15 && phase === 'after-boss') {
    return {
      title: '전투 후 대화',
      prompt: `${gameplayTerminology.controls.shotKeyLabel}로 대화 진행`,
      lines: [
        { speaker: bossName, text: '이제 남은 건 마지막 판단뿐이다.' },
        { speaker: player, text: '좋아. 끝까지 가서 이 선택의 결말을 마주하겠어.' },
      ],
    }
  }

  if (stageNumber === 20 && phase === 'before-boss') {
    return {
      title: '최종 보스 조우',
      prompt: `${gameplayTerminology.controls.shotKeyLabel}로 대화 진행`,
      lines: [
        { speaker: bossName, text: `${routeLabel} 끝까지 밀어붙였군.` },
        { speaker: player, text: '여기서 끝을 낸다. 이 이변이 무엇으로 남을지 내가 정하겠어.' },
        { speaker: bossName, text: '그렇다면 마지막 국면을 통과해 보아라.' },
      ],
    }
  }

  if (stageNumber === 20 && phase === 'after-boss') {
    return {
      title: '전투 후 대화',
      prompt: `${gameplayTerminology.controls.shotKeyLabel}로 대화 진행`,
      lines: [
        { speaker: bossName, text: '최후의 경계가 물러났다. 이제 남는 것은 네가 남길 결론뿐이다.' },
        { speaker: player, text: '좋아. 남은 건 이 여정의 결말을 끝까지 확인하는 일뿐이야.' },
      ],
    }
  }

  return {
    title: endingKind === 'good' ? '굿 엔딩' : '배드 엔딩',
    prompt: `${gameplayTerminology.controls.shotKeyLabel}로 대화 진행`,
    lines:
      endingKind === 'good'
        ? [
            { speaker: player, text: `${routeLabel} 끝에서 이어진 긴 충돌이 마침내 멎었다.` },
            { speaker: player, text: '끝까지 물러서지 않았고, 마지막 판단도 내 손으로 밀어붙였다.' },
            { speaker: player, text: '흔적은 오래 남겠지만, 오늘만큼은 내가 붙든 결론이 분명하다.' },
          ]
        : [
            { speaker: player, text: `${routeLabel} 끝에 다다르기는 했지만, 이 결말은 여러 번 다시 이어 붙인 끝에 겨우 닿은 결과다.` },
            { speaker: player, text: '마지막 국면은 넘겼어도, 처음부터 끝까지 흔들림 없는 승부였다고 말하기는 어렵다.' },
            { speaker: player, text: '다음에는 더 흔들림 없이 이 선택의 끝을 완주해야 한다.' },
          ],
  }
}
