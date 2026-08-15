// ============================================================
//  데이터셋 분할기 — dataset.jsonl 을 셔플해 train/eval 로 나눈다.
//
//  평가(eval)는 반드시 "학습에 안 쓴" 예제로 해야 정직한 준수율이 나온다.
//  노드 순환 편향을 없애려 결정론적 셔플(seed 고정) 후 앞에서 EVAL_N개를 홀드아웃.
//
//  실행:
//    node ml/split-dataset.mjs
//  옵션(환경변수):
//    IN=ml/dataset.jsonl      입력(기본)
//    EVAL_N=40                평가 홀드아웃 개수(기본 40)
//    TRAIN_OUT=ml/train.jsonl / EVAL_OUT=ml/eval.jsonl
//    SEED=12345               셔플 시드(재현성)
// ============================================================

import fs from 'fs'

const IN = process.env.IN || 'ml/dataset.jsonl'
const EVAL_N = Number(process.env.EVAL_N || 40)
const TRAIN_OUT = process.env.TRAIN_OUT || 'ml/train.jsonl'
const EVAL_OUT = process.env.EVAL_OUT || 'ml/eval.jsonl'
const SEED = Number(process.env.SEED || 12345)

if (!fs.existsSync(IN)) {
  console.error(`❌ ${IN} 없음. 먼저 generate-dataset.mjs 로 데이터를 만드세요.`)
  process.exit(1)
}

const lines = fs.readFileSync(IN, 'utf8').split('\n').filter(Boolean)
if (lines.length <= EVAL_N) {
  console.error(`❌ 예제 ${lines.length}개는 EVAL_N(${EVAL_N})보다 적거나 같습니다. 더 생성하세요.`)
  process.exit(1)
}

// 결정론적 LCG 셔플(외부 의존 0, seed 고정 재현).
let s = SEED
const rnd = () => {
  s = (s * 1103515245 + 12345) & 0x7fffffff
  return s / 0x7fffffff
}
for (let i = lines.length - 1; i > 0; i--) {
  const j = Math.floor(rnd() * (i + 1))
  ;[lines[i], lines[j]] = [lines[j], lines[i]]
}

const evalSet = lines.slice(0, EVAL_N)
const trainSet = lines.slice(EVAL_N)
fs.writeFileSync(EVAL_OUT, evalSet.join('\n') + '\n')
fs.writeFileSync(TRAIN_OUT, trainSet.join('\n') + '\n')

console.log(`✅ 분할 완료 (입력 ${lines.length}, seed ${SEED})`)
console.log(`   ${TRAIN_OUT} — 학습 ${trainSet.length}개`)
console.log(`   ${EVAL_OUT} — 평가(홀드아웃) ${evalSet.length}개`)
console.log(`\n다음: Colab에 ${TRAIN_OUT} 업로드 → 학습 → 로컬에서 eval.mjs(${EVAL_OUT})`)
