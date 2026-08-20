// 캡처 소스로 트레일러 mp4 조립 (ffmpeg-static).
//  스틸을 페이드 전환으로 잇고, 녹화된 게임플레이(실제 타이핑 모션)를 중간에 삽입.
//  출력: trailer-assets/trailer.mp4 (1920x1080, H.264, 무음)
//    node scripts/make-trailer-video.mjs
import { execFileSync } from 'child_process'
import ffmpegPath from 'ffmpeg-static'
import fs from 'fs'

const OUT = 'trailer-assets'
const TMP = `${OUT}/_seg`
fs.mkdirSync(TMP, { recursive: true })
const run = (args) => execFileSync(ffmpegPath, ['-y', ...args], { stdio: ['ignore', 'ignore', 'inherit'] })

const RES = '1920:1080'
const FPS = 30
// 스틸 → 지정 길이 mp4 (레터박스 + 페이드 인/아웃)
const stillSeg = (png, dur, out) => {
  const vf = `scale=${RES}:force_original_aspect_ratio=decrease,pad=${RES}:(ow-iw)/2:(oh-ih)/2:black,` +
    `fade=t=in:st=0:d=0.4,fade=t=out:st=${(dur - 0.4).toFixed(2)}:d=0.4,format=yuv420p`
  run(['-loop', '1', '-t', String(dur), '-i', png, '-vf', vf, '-r', String(FPS), '-an', out])
}
// 게임플레이 영상 → 구간 잘라 스케일 + 페이드
const clipSeg = (webm, ss, dur, out) => {
  const vf = `scale=${RES}:force_original_aspect_ratio=decrease,pad=${RES}:(ow-iw)/2:(oh-ih)/2:black,` +
    `fade=t=in:st=0:d=0.4,fade=t=out:st=${(dur - 0.4).toFixed(2)}:d=0.4,format=yuv420p`
  run(['-ss', String(ss), '-t', String(dur), '-i', webm, '-vf', vf, '-r', String(FPS), '-an', out])
}

// ---- 시퀀스 정의 ----
const P = (n) => `${OUT}/${n}`
const seq = []
let i = 0
const add = (fn) => { const o = `${TMP}/${String(++i).padStart(2, '0')}.mp4`; fn(o); seq.push(o) }

add((o) => stillSeg(P('01-opening.png'), 3.0, o))                 // 훅: 이게 게임이다
add((o) => clipSeg(P('video/gameplay.webm'), 4, 7, o))           // AI가 실시간으로 씀(타이핑 모션)
add((o) => stillSeg(P('11-faction-ren.png'), 2.0, o))            // 세력: 렌(자본)
add((o) => stillSeg(P('12-faction-kael.png'), 2.0, o))           // 세력: 카엘(질서)
add((o) => stillSeg(P('13-faction-echo.png'), 2.0, o))           // 세력: 에코(자유)
add((o) => stillSeg(P('15-ending-ENDING_ECHO_BREAKOUT-card.png'), 3.0, o))  // 결말
add((o) => stillSeg(P('17-ending-ENDING_JAYNE_ORIGIN-card.png'), 3.2, o))   // 진엔딩

// ---- concat ----
const listFile = `${TMP}/list.txt`
fs.writeFileSync(listFile, seq.map((s) => `file '${s.split('/').pop()}'`).join('\n') + '\n')
const final = `${OUT}/trailer.mp4`
// concat 데멀서: list.txt 안의 상대경로는 list 파일 디렉터리 기준으로 해석됨(basename OK).
run(['-f', 'concat', '-safe', '0', '-i', listFile, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', final])
console.log('✅ 트레일러 →', final)
