// 화제별 추가 답변(변형). 같은 화제를 다시 물으면 다른 답이 나온다.
// 기존 42개 화제는 [2번째, 3번째], 새 화제는 [1·2·3번째] 답을 가진다.
import { REN_KO, REN_DEFLECT_KO } from './ren.ko.js'
import { KAEL_KO, KAEL_DEFLECT_KO } from './kael.ko.js'
import { ECHO_KO, ECHO_DEFLECT_KO } from './echo.ko.js'
import { NEXUS_KO, NEXUS_DEFLECT_KO } from './nexus.ko.js'
import { REN_EN, REN_DEFLECT_EN } from './ren.en.js'
import { KAEL_EN, KAEL_DEFLECT_EN } from './kael.en.js'
import { ECHO_EN, ECHO_DEFLECT_EN } from './echo.en.js'
import { NEXUS_EN, NEXUS_DEFLECT_EN } from './nexus.en.js'

export { MORE_KEYWORDS, MORE_KEYWORDS_EN } from './keywords.more.js'

export const VARIANTS = {
  ko: { Ren: REN_KO, Kael: KAEL_KO, Echo: ECHO_KO, NEXUS: NEXUS_KO },
  en: { Ren: REN_EN, Kael: KAEL_EN, Echo: ECHO_EN, NEXUS: NEXUS_EN },
}

export const MORE_DEFLECT = {
  ko: { Ren: REN_DEFLECT_KO, Kael: KAEL_DEFLECT_KO, Echo: ECHO_DEFLECT_KO, NEXUS: NEXUS_DEFLECT_KO },
  en: { Ren: REN_DEFLECT_EN, Kael: KAEL_DEFLECT_EN, Echo: ECHO_DEFLECT_EN, NEXUS: NEXUS_DEFLECT_EN },
}
