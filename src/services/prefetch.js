// ============================================================
//  선생성(prefetch) — 플레이어가 읽는 동안 다음 턴을 미리 만들어 둔다.
//
//  선택지 3개는 "플레이어가 무엇을 할 수 있는지"를 이미 알고 있으므로,
//  각각에 대한 다음 비트를 미리 생성해 둘 수 있다. 고르는 순간 캐시가
//  있으면 대기 0초. (자유 입력은 내용을 알 수 없으니 그때 생성한다.)
//
//  설계 제약:
//   · GPU/모델 인스턴스는 하나다. 3개를 동시에 던지면 큐에서 직렬화되며
//     서로를 밀어내 오히려 느려진다 → **순차** 생성한다.
//   · 플레이어가 고르는 순간, 아직 안 만든 것들은 즉시 취소해 GPU를 비운다.
//   · 캐시는 특정 세이브 상태에서만 유효하다(다음 비트는 현재 상태의 함수).
//     상태가 바뀌면 통째로 버린다 — 낡은 비트를 쓰는 건 버그다.
//   · 클라우드(BYOK)에서는 쓰지 않는다. 3배 호출은 사용자의 유료 쿼터를
//     3배로 태우는 짓이다. 로컬 모델(무료)일 때만 켠다.
// ============================================================

export function createPrefetcher(generate) {
  let key = null // 이 캐시가 유효한 세이브 상태의 서명
  let entries = new Map() // playerInput -> { promise, controller }
  let stopped = false

  function abortAll() {
    for (const e of entries.values()) {
      try {
        e.controller.abort()
      } catch {
        /* 이미 끝났으면 무시 */
      }
    }
    entries.clear()
  }

  async function runSequential(choices, ctx) {
    for (const text of choices) {
      if (stopped) return
      const controller = new AbortController()
      const promise = generate({ ...ctx, playerInput: text, signal: controller.signal })
      entries.set(text, { promise, controller })
      // 순차: 하나가 끝나야 다음을 시작한다(동시 실행은 서로를 느리게 만든다).
      await promise.catch(() => {})
    }
  }

  return {
    // 새 상태에 대한 선생성 시작. 같은 key면 재시작하지 않는다.
    start(newKey, choices, ctx) {
      if (newKey === key) return
      abortAll()
      key = newKey
      stopped = false
      runSequential(choices, ctx)
    },

    // 플레이어가 고른 것을 꺼낸다.
    // 반환: Promise(res) — 이미 끝났으면 즉시, 생성 중이면 그것을 기다린다.
    //       null — 캐시에 없음(호출자가 직접 생성해야 함). 이때 남은 선생성은 취소한다.
    take(expectedKey, playerInput) {
      if (expectedKey !== key) {
        // 상태가 어긋났다 = 낡은 캐시. 절대 쓰지 않는다.
        stopped = true
        abortAll()
        return null
      }
      const hit = entries.get(playerInput)
      stopped = true // 이 턴의 선생성은 여기서 종료
      // 고른 것 외의 대기 중인 생성은 즉시 취소해 GPU를 비운다.
      for (const [text, e] of entries) {
        if (text !== playerInput) {
          try {
            e.controller.abort()
          } catch {
            /* ignore */
          }
        }
      }
      entries = hit ? new Map([[playerInput, hit]]) : new Map()
      key = null
      return hit ? hit.promise : null
    },

    // 상태가 바뀌었거나 게임이 끝났을 때 통째로 폐기.
    reset() {
      stopped = true
      abortAll()
      key = null
    },
  }
}
