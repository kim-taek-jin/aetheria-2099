// ============================================================
//  i18n — 한국어 / English.
//
//  itch.io 방문자는 대부분 영어권이다. 그래서 브라우저 언어가 한국어가
//  아니면 영어로 시작한다. 헤더 버튼으로 언제든 바꿀 수 있고, 선택은 기억된다.
//
//  세이브는 언어와 무관하다 — 노드 id·수치만 저장하므로 판 도중에 언어를
//  바꿔도 이어진다. 기억 조각은 한국어 원문을 키로 저장하고 표시할 때 번역한다
//  (증거 판정이 원문 키워드로 하기 때문).
// ============================================================

import { createContext, useContext } from 'react'
import { UI } from './ui.js'

export const LANGS = ['en', 'ko']
export const LANG_KEY = 'aetheria2099.lang'

export function detectLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY)
    if (LANGS.includes(saved)) return saved
  } catch {
    /* 저장소 접근 불가 — 브라우저 언어로 */
  }
  const nav = (typeof navigator !== 'undefined' && (navigator.languages?.[0] || navigator.language)) || ''
  return /^ko\b/i.test(nav) ? 'ko' : 'en'
}

export function saveLang(lang) {
  try {
    localStorage.setItem(LANG_KEY, lang)
  } catch {
    /* 무시 */
  }
}

export const LangContext = createContext('ko')
export const useLang = () => useContext(LangContext)

// 문자열 또는 (vars) => 문자열. 영어에 없으면 한국어, 그것도 없으면 키.
export function tr(lang, key, vars) {
  const v = UI[lang]?.[key] ?? UI.ko[key] ?? key
  return typeof v === 'function' ? v(vars || {}) : v
}

export function useT() {
  const lang = useLang()
  return (key, vars) => tr(lang, key, vars)
}

export const NPC_NAME = {
  ko: { Ren: '렌', Kael: '카엘', Echo: '에코', NEXUS: 'NEXUS' },
  en: { Ren: 'Ren', Kael: 'Kael', Echo: 'Echo', NEXUS: 'NEXUS' },
}
export const npcName = (lang, npc) => NPC_NAME[lang]?.[npc] || npc
