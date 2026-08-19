#!/usr/bin/env python3
# 견고한 단일 파일 다운로더 — 구간을 정확한 오프셋에 기록, 실패 구간만 재시도.
import os, sys, time, urllib.request

URL = sys.argv[1]
OUT = sys.argv[2]
TARGET = int(sys.argv[3])
CHUNK = 64 * 1024 * 1024  # 64MB

# 이어받기: 기존 파일 크기부터. 손상 방지 위해 CHUNK 경계로 내림.
have = os.path.getsize(OUT) if os.path.exists(OUT) else 0
have = (have // CHUNK) * CHUNK
mode = 'r+b' if os.path.exists(OUT) else 'wb'
f = open(OUT, mode if have else 'wb')
f.seek(have)
pos = have
print(f'시작 오프셋 {pos/1e9:.2f}GB / 목표 {TARGET/1e9:.2f}GB', flush=True)

while pos < TARGET:
    end = min(pos + CHUNK - 1, TARGET - 1)
    for attempt in range(1, 1000):
        try:
            req = urllib.request.Request(URL, headers={'Range': f'bytes={pos}-{end}'})
            with urllib.request.urlopen(req, timeout=60) as r:
                data = r.read()
            want = end - pos + 1
            if len(data) != want:
                raise IOError(f'짧게 받음 {len(data)}/{want}')
            f.seek(pos); f.write(data); f.flush()
            pos = end + 1
            if (pos // CHUNK) % 8 == 0:
                print(f'  {pos/1e9:.2f}/{TARGET/1e9:.2f}GB', flush=True)
            break
        except Exception as e:
            if attempt % 10 == 0:
                print(f'  재시도 {attempt} @ {pos/1e9:.2f}GB: {e}', flush=True)
            time.sleep(min(2 + attempt * 0.3, 10))
f.close()
print(f'DONE {os.path.getsize(OUT)}', flush=True)
