// 표시용 번역 도우미. 게임 상태(노드 id·수치·조각 원문)는 언어와 무관하고,
// 화면에 그릴 때만 이 함수들을 거친다.
import { SCENES } from './scenes.js'
import { SCRIPT } from './script.js'
import { SCRIPT_EN } from './script.en.js'
import { SCENE_TITLE_EN, actEn, WEAK_POINT_BY_KO, fragmentEn } from './content.en.js'
import { RESIDUE_FRAGMENTS_EN } from './residue.js'

export function sceneLabel(nodeId, lang) {
  const s = SCENES[nodeId]
  if (!s) return nodeId
  return lang === 'en' ? `[${actEn(s.act)}] ${SCENE_TITLE_EN[nodeId] || s.title}` : `[${s.act}] ${s.title}`
}

export function sceneTitle(nodeId, lang) {
  return (lang === 'en' && SCENE_TITLE_EN[nodeId]) || SCENES[nodeId]?.title || nodeId
}

export function weakPointText(ko, lang) {
  return lang === 'en' ? WEAK_POINT_BY_KO[ko] || ko : ko
}

export function fragmentText(ko, lang) {
  if (lang !== 'en') return ko
  return RESIDUE_FRAGMENTS_EN[ko] || fragmentEn(ko)
}

// 분기·결말 선택지(branch가 붙은 고정 선택지)의 문구를 본문 선택지에서 가져온다.
// 같은 노드의 SCRIPT 선택지 중 next가 branch와 같은 것의 영어 문구 — 출처를 하나로.
export function localizeFixedChoices(nodeId, choices, lang) {
  if (!choices || lang !== 'en') return choices
  const raw = SCRIPT[nodeId]
  const en = SCRIPT_EN[nodeId]
  if (!raw || !en) return choices
  return choices.map((c) => {
    const i = raw.choices.findIndex((x) => x.next === c.branch)
    const text = i >= 0 ? en.choices?.[i]?.text : null
    return text ? { ...c, text } : c
  })
}
