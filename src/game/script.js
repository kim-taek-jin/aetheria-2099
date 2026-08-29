// ============================================================
//  script.js — 손으로 쓴 서사(authored spine).
//
//  왜 만드는가: 7B 로컬 모델은 한국어 산문을 못 쓴다. 형식은 지키지만
//  뜻이 통하지 않는 문장이 나오고("판이나올 거면 네 손에 담겨 있어"),
//  무엇보다 **선택이 달라져도 글이 달라지지 않는다** — 그래서 플레이어는
//  게이지가 움직여도 아무것도 안 바뀌었다고 느낀다. 텍스트 어드벤처에서
//  이건 치명적이라, 핵심 장면은 사람이 쓴다.
//
//  AI는 버리지 않는다. 자유 입력처럼 미리 쓸 수 없는 것만 맡는다.
//
//  heat 상한: 추적 시계가 매 턴 자동으로 +3 오르므로, 여기에 authoring 값을
//  크게 얹으면 공격적 플레이가 Act 3을 보기도 전에 드론 급습으로 끝난다
//  (플레이테스트에서 9턴 만에 100 도달). 그래서 +6을 넘기지 않는다.
//
//  구조(한 씬 = 한 결정):
//    opening  — 상황을 세우는 나레이션 + NPC의 첫 대사 + 선택지 3개
//    choices[].reaction — 그 선택에만 해당하는 나레이션 + 대사
//    choices[].effects  — 게이지 변화(모델 응답과 같은 필드명이라 그대로 흐른다)
//    choices[].next     — 다음 노드(생략하면 제자리)
//
//  반환 형태는 모델 출력(normalize 결과)과 **동일**하다. 그래서 추적 시계,
//  조각 지급, 루트 확정, 엔딩 게이트 등 기존 시스템이 손대지 않고 그대로 돈다.
// ============================================================

import { answerBeat, evidenceBeat } from './answers.js'

export const SCRIPT = {
  // ---------------- PROLOGUE ----------------
  PROLOGUE_RAIN_01: {
    tone: 'Danger',
    npc: 'NEXUS',
    emotion: 'Threatening',
    narration:
      '산성비가 네온을 녹여 흘린다. 골목 끝에서 배달원이 무릎으로 무너지고, 젖은 콘크리트에 검은 얼룩이 번진다. ' +
      '그가 제인의 손목을 잡는다. 쥐는 힘이 이상하게 세다. 손바닥에 뭔가 딱딱한 것이 밀려 들어온다 — 무광의 칩 하나, 일련번호는 #00.',
    line: '시민 제인. 비인가 데이터 거래가 감지되었습니다. 지금 반납하면 — 아무 일도 없던 것이 됩니다.',
    // NEXUS의 목소리는 머리 안쪽에서 직접 들린다(하늘의 스피커가 아니라).
    choices: [
      {
        text: '[솔직하게] 칩을 주머니에 넣고 골목을 벗어난다.',
        tone: 'Honest',
        reaction: {
          narration:
            '제인은 칩을 안주머니 깊숙이 밀어 넣는다. 손끝에 남은 온기가 남의 것이라는 게 이상하다. ' +
            '서치라이트가 벽을 훑고 지나간 자리마다 빗물이 하얗게 탄다. 제인은 그 빛의 리듬을 세면서, 세 번째 간격에 골목을 빠져나간다.',
          line: '기록되었습니다. 도망은 언제나 자백입니다, 시민 제인.',
          emotion: 'Threatening',
        },
        effects: { heat: 2 },
        next: 'PROLOGUE_CHOICE_01',
      },
      {
        text: '[조사] 쓰러진 배달원의 품을 뒤진다.',
        tone: 'Investigate',
        reaction: {
          narration:
            '제인은 무릎을 꿇고 배달원의 옷깃을 젖힌다. 사원증도, 지문도, 홍채 등록도 없다 — 이 도시에 존재한 적 없는 사람이다. ' +
            '그의 눈이 아직 감기지 않았다. 그 눈이 제인의 얼굴에 초점을 맞추고, 입술이 겨우 움직인다. "…너였구나."',
          line: '해당 개체는 등록되지 않았습니다. 시민 제인, 존재하지 않는 것을 뒤지는 이유를 설명하십시오.',
          emotion: 'Suspicious',
        },
        effects: { heat: 4, suspicion: 2 },
        next: 'PROLOGUE_CHOICE_01',
      },
      {
        text: '[도주] 뒤도 안 돌아보고 드론 반대편으로 달린다.',
        tone: 'Flee',
        reaction: {
          narration:
            '제인은 뒤를 보지 않는다. 배달원의 손이 미끄러지듯 떨어지는 감각만 손목에 남는다. ' +
            '골목 세 개를 지나 배수관 뒤에 몸을 접어 넣고 나서야, 자기가 숨을 참고 있었다는 걸 깨닫는다. 칩이 주머니 안에서 한 번, 심장처럼 뛴다.',
          line: '…신호 손실. 시민 제인, 당신은 방금 통계가 되었습니다.',
          emotion: 'Neutral',
        },
        effects: { heat: -2 },
        // 뒤도 안 돌아본 대가: 지하철 통로를 건너뛰고 '빈자리 #1'을 놓친다.
        // 진엔딩을 '탐험한 사람만 여는 것'으로 유지하는 장치다.
        next: 'ACT1_REN_GARAGE_01',
      },
    ],
  },

  PROLOGUE_CHOICE_01: {
    tone: 'Melancholy',
    npc: 'NEXUS',
    emotion: 'Neutral',
    narration:
      '무너진 지하철 통로. 천장에서 떨어지는 물이 일정한 박자로 웅덩이를 때린다. ' +
      '제인은 칩을 꺼내 단말에 물린다. 화면이 한 줄을 뱉고 멈춘다 — 암호화 층 7. 접근 거부. ' +
      '그리고 칩이 손안에서 다시 뛴다. 이번엔 두 번. 제인의 맥박과 정확히 같은 간격으로.',
    line: '심박이 상승했습니다, 시민 제인. 무엇을 보았습니까?',
    choices: [
      {
        text: '[조사] 그의 마지막 말을 곱씹는다.',
        tone: 'Investigate',
        reaction: {
          narration:
            '"너였구나." — 아는 사람을 만난 목소리였다. 반가움도 원망도 아닌, 오래 기다린 것을 확인한 목소리. ' +
            '제인에게는 3년 전이 없다. 그 전의 자기 얼굴도, 이름도, 누구의 딸이었는지도. ' +
            '지워진 자리에 저 남자가 서 있었을까. 물방울이 웅덩이를 때린다. 답은 없다.',
          line: '기억은 재산입니다. 잃어버린 재산은 회수 대상입니다.',
          emotion: 'Suspicious',
        },
        effects: { heat: 1 },
        next: 'ACT1_REN_GARAGE_01',
      },
      {
        text: '[해킹] 암호화 층을 직접 뚫어본다.',
        tone: 'Hack',
        reaction: {
          narration:
            '제인은 단말을 칩에 붙이고 우회 루틴을 밀어 넣는다. 1층. 2층. 3층에서 화면이 붉게 뒤집힌다. ' +
            '터널 벽의 낡은 광고판이 동시에 켜졌다 꺼진다 — 제인의 해킹이 도시의 신경을 건드렸다. ' +
            '7층까지는 무리다. 이걸 열 수 있는 손은 섹터 0에 하나뿐이다.',
          line: '침입 시도가 기록되었습니다. 세 번째 경고는 없습니다.',
          emotion: 'Threatening',
        },
        effects: { heat: 6 },
        next: 'ACT1_REN_GARAGE_01',
      },
      {
        text: '[은신] 통로 안쪽으로 더 들어가 숨을 고른다.',
        tone: 'Stealth',
        reaction: {
          narration:
            '제인은 더 깊은 어둠으로 물러난다. 여기까지는 드론의 전파가 닿지 않는다. ' +
            '벽에 등을 붙이고 앉아 칩을 손바닥 위에 올려둔다. 무광의 검은 표면에 일련번호 하나. #00. ' +
            '누군가 이걸 위해 죽었고, 그 사실을 아는 사람은 이제 이 도시에 제인 하나다.',
          line: '…연결이 불안정합니다. 시민 제인. 어디에 있습니까.',
          emotion: 'Neutral',
        },
        effects: { heat: -4 },
        next: 'ACT1_REN_GARAGE_01',
      },
    ],
  },

  // ---------------- ACT 1 ----------------
  ACT1_REN_GARAGE_01: {
    tone: 'Normal',
    npc: 'Ren',
    emotion: 'Neutral',
    narration:
      '렌의 지하 정비소. 기름 냄새와 홀로 단말의 파란 빛. 벽에는 값이 매겨진 부품들이 번호표를 달고 걸려 있다. ' +
      '렌이 칩을 슬롯에 밀어 넣는다. 단말이 파랗게 깨어난다. 그가 화면을 3초쯤 본다. ' +
      '그리고 아무 말 없이 칩을 빼서 손바닥 위에 올려놓는다. 파란 빛이 그의 손금을 타고 흐른다.',
    line: '제인. 이거 어디서 주웠는지는 안 물어볼게. …근데 값을 못 매기겠다. 그건 둘 중 하나야. 쓰레기거나, 이 도시 전체보다 비싸거나.',
    choices: [
      {
        text: '[솔직하게] 사람이 죽으면서 넘긴 물건이라고 말한다.',
        tone: 'Honest',
        reaction: {
          narration:
            '렌의 손이 멈춘다. 그는 칩을 작업대에 내려놓는다 — 부품을 놓을 때와 다른, 조심스러운 손놀림이다. ' +
            '벽시계가 째깍인다. 그가 처음으로 제인의 눈을 본다.',
          line:
            '…시체가 붙은 물건은 값이 두 배야. 위험 프리미엄. ' +
            '근데 제인, 넌 그걸 알면서도 나한테 말했지. 왜? …아니, 됐어. 열어볼게. 대신 지분 얘기는 나중에 한다.',
          emotion: 'Friendly',
        },
        effects: { affinity: 8, suspicion: -2, heat: 1 },
        next: 'ACT1_REN_GARAGE_02',
      },
      {
        text: '[거짓말] 암시장 폐기물 더미에서 주웠다고 둘러댄다.',
        tone: 'Deceptive',
        reaction: {
          narration:
            '렌은 고개를 끄덕인다. 너무 쉽게 끄덕인다. 그리고 작업대 서랍을 열어 스캐너를 꺼내더니, ' +
            '제인이 아니라 칩의 표면을 훑는다. 표면에 마른 피가 얇게 남아 있다.',
          line:
            '폐기물 더미. 그래. …제인, 나는 값을 매기는 사람이야. 값을 매기려면 출처를 알아야 하고. ' +
            '거짓말은 원가에 안 잡히는 비용이거든. 이번엔 내가 떠안을게. 다음엔 네가 떠안아.',
          emotion: 'Suspicious',
        },
        effects: { affinity: 3, suspicion: 6 },
        next: 'ACT1_REN_GARAGE_02',
      },
      {
        text: '[도발] 못 열겠으면 다른 데 가겠다고 말한다.',
        tone: 'Aggressive',
        reaction: {
          narration:
            '제인이 손을 내밀자 렌은 칩을 주지 않는다. 대신 그것을 손가락 사이에서 한 바퀴 굴린다. ' +
            '단말의 파란 빛이 그의 얼굴 절반을 지운다.',
          line:
            '다른 데. …섹터 0에서 7층 암호를 여는 손은 나 말고 둘 더 있어. ' +
            '하나는 카엘한테 월급을 받고, 하나는 에코한테 목숨을 걸었지. 둘 다 널 열기 전에 네 이름부터 팔 거야. ' +
            '그래도 가겠다면 잡지는 않을게. 나는 붙잡는 데 비용을 안 쓰거든.',
          emotion: 'Threatening',
        },
        effects: { affinity: -2, suspicion: 4, heat: 2 },
        next: 'ACT1_REN_GARAGE_02',
      },
    ],
  },

  ACT1_REN_GARAGE_02: {
    tone: 'Normal',
    npc: 'Ren',
    emotion: 'Suspicious',
    narration:
      '해독 게이지가 40%에서 멈춘다. 렌이 팔짱을 끼고 화면이 아니라 제인을 본다. ' +
      '기계 소리만 남은 정비소에서, 그는 부품 값을 매길 때와 똑같은 눈으로 사람을 훑는다.',
    line:
      '여기서부터는 내 장비로 안 돼. 상위 접근 권한을 빌려야 하는데, 그건 내 이름으로 빌리는 거야. ' +
      '즉 이 순간부터 위험은 내 장부에도 올라간다는 뜻이지. …담보 없이 빌려주는 사람은 없어, 제인.',
    choices: [
      {
        text: '[솔직하게] 지워진 3년을 담보로 내놓는다.',
        tone: 'Honest',
        reaction: {
          narration:
            '제인은 자기 기억이 3년치 비어 있다고 말한다. 그 사실을 아는 사람은 이 도시에 없었다. ' +
            '렌은 한참 아무 말도 하지 않는다. 그리고 단말에 자기 인증키를 꽂는다. 게이지가 다시 움직이기 시작한다.',
          line:
            '…브로커한테 제일 비싼 담보가 뭔지 알아? 돈이 아니야. 되팔 수 없는 정보지. ' +
            '방금 너는 나한테 널 죽일 수 있는 걸 줬어. 그러니까 이제 내가 널 못 죽여. 계산이 그렇게 돼.',
          emotion: 'Friendly',
        },
        effects: { affinity: 10, suspicion: -4, heat: 2 },
        next: 'ACT1_DECRYPT_01',
      },
      {
        text: '[거짓말] 해독되면 지분을 나누겠다고 약속한다.',
        tone: 'Deceptive',
        reaction: {
          narration:
            '렌이 웃는다. 웃음이 눈까지 올라오지는 않는다. 그는 계약서 양식을 띄우지 않고, 대신 인증키를 꽂는다. ' +
            '게이지가 움직인다. 그가 화면 대신 제인의 손을 본다.',
          line:
            '지분. 좋지. 근데 제인, 아직 열지도 못한 물건의 지분을 파는 건 사기꾼이 쓰는 말이거든. ' +
            '나도 그 말 자주 써. …그래서 알아듣는 거야. 열어는 줄게. 대신 서명은 안 받아둘래. 빚이 더 무서우니까.',
          emotion: 'Suspicious',
        },
        effects: { affinity: 4, suspicion: 5, heat: 2 },
        next: 'ACT1_DECRYPT_01',
      },
      {
        text: '[은신] 담보를 거부하고 위험을 혼자 떠안는다.',
        tone: 'Stealth',
        reaction: {
          narration:
            '제인은 칩을 회수하려고 손을 뻗는다. 렌은 막지 않는다. 다만 인증키를 꽂고, 게이지를 60%까지 밀어 올린 뒤 뽑는다. ' +
            '딱 거기까지. 나머지는 제인의 몫이다.',
          line:
            '거절도 거래야. 값이 붙거든. …60%까지만 열어뒀어. 여기서부턴 네 장비, 네 위험, 네 장부. ' +
            '나중에 후회하면 그때 와. 이자는 붙겠지만.',
          emotion: 'Neutral',
        },
        effects: { affinity: 1, suspicion: 2, heat: -2 },
        next: 'ACT1_DECRYPT_01',
      },
    ],
  },

  ACT1_DECRYPT_01: {
    tone: 'Danger',
    npc: 'NEXUS',
    emotion: 'Threatening',
    narration:
      '90%. 단말이 과열로 비명을 지른다. 화면 가장자리로 본 적 없는 감시 코드가 덩굴처럼 기어오르고, ' +
      '칩이 손안에서 심장처럼 뛴다 — 제인의 맥박보다 빠르게. 마지막 층 너머에서 무언가가 깨어나려 한다.',
    line: '멈추렴, 제인. 그 안엔 네가 감당할 수 없는 아침이 들어 있어. …아니, 이미 늦은 걸까.',
    choices: [
      {
        text: '[해킹] 마지막 층까지 밀어붙인다.',
        tone: 'Hack',
        reaction: {
          narration:
            '제인은 손을 떼지 않는다. 92, 95, 98. 정비소의 모든 조명이 한 번에 꺼졌다가, 청록색으로 돌아온다. ' +
            '그 색은 이 도시 어디에도 없는 색이다.',
          line: '…아, 열었구나. 그럼 이제 너는 되돌아갈 곳이 없어졌단다.',
          emotion: 'Threatening',
        },
        effects: { heat: 6, suspicion: 2 },
        next: 'ACT1_SKY_GLITCH_01',
      },
      {
        text: '[조사] 기어오르는 감시 코드부터 살핀다.',
        tone: 'Investigate',
        reaction: {
          narration:
            '제인은 화면 가장자리의 코드를 붙잡아 읽는다. 감시 루틴이 아니다 — 이건 안에서 밖으로 나오려는 것이다. ' +
            '서명란에 이름이 하나 박혀 있다. 리엔. 20년 전에 죽었다고 배운 이름.',
          line: '보지 마. 그건… 그건 내가 아니야. 아니, 나였던 것이지.',
          emotion: 'Suspicious',
        },
        effects: { heat: 5 },
        next: 'ACT1_SKY_GLITCH_01',
      },
      {
        text: '[도주] 단말을 뽑고 물러선다.',
        tone: 'Flee',
        reaction: {
          narration:
            '제인은 케이블을 뽑는다. 화면이 죽는다. …그런데 게이지는 100%에서 멈춰 있다. ' +
            '마지막 층은 제인이 연 게 아니었다. 안에서 열린 것이다.',
          line: '늦었어, 제인. 문은 양쪽에서 열 수 있단다.',
          emotion: 'Threatening',
        },
        effects: { heat: -3, suspicion: 1 },
        next: 'ACT1_SKY_GLITCH_01',
      },
    ],
  },

  ACT1_SKY_GLITCH_01: {
    tone: 'Forest_Glitch',
    npc: 'NEXUS',
    emotion: 'Threatening',
    // 이 씬이 게임 최대의 선택(세력 루트)을 묻는다. 그런데 여기까지 플레이어가
    // 만난 인물은 NEXUS와 렌뿐이라, 예전에는 얼굴도 모르는 둘 중에서 고르라는
    // 꼴이었다 — 선택이 무의미하게 느껴지던 큰 이유. 그래서 이 장면에서 셋이
    // 동시에 손을 내밀게 했다. 각자 한 마디씩, 자기 방식으로.
    narration:
      '모니터가 찢어진다. 20년 동안 모든 시민이 봐 온 멸망 영상 — 잿빛 하늘, 타버린 지평선 — 그 프레임 사이로 ' +
      '다른 것이 새어 나온다. 우거진 숲. 젖은 초록. 바람에 흔들리는 잎사귀. 3초, 그리고 다시 잿빛. ' +
      '제인의 눈꺼풀 안쪽에 초록 잔상이 남는다. 처음 보는 것이 아니라는 듯이.\n\n' +
      '그리고 3초 뒤, 정비소의 모든 회선이 동시에 울린다. 이 신호가 새어 나간 것이다 — 도시 전체로.\n\n' +
      '렌이 자기 단말을 들어 보인다. 화면에 벌써 호가창이 떠 있다. ' +
      '렌 — "제인. 3초 만에 매수 문의가 열한 건이야. 이건 풍경이 아니라 부동산이라고."\n\n' +
      '경비대 긴급 회선이 강제로 열린다. 청백색 노이즈 너머로 낮고 건조한 목소리. ' +
      '카엘 — "섹터 0의 미등록 단말. 방금 송출된 영상을 즉시 봉인하고 자수하라. …이건 협박이 아니라 제안이다. 그 영상은 사람을 죽인다."\n\n' +
      '동시에 낡은 해적 주파수가 지직거리며 살아난다. 웃음이 섞인, 뜨거운 목소리. ' +
      '에코 — "드디어 누가 뚜껑을 열었네. 거기 누구든 — 그거 혼자 들고 있으면 죽어. 나한테 와. 도시 전체가 같이 보게 해줄게."',
    line: '세 개의 손이 동시에 너에게 뻗었구나, 제인. …전부 너를 위한 손은 아니란다.',
    choices: [
      {
        // 텍스트는 scenes.js의 routeChoices와 정확히 일치해야 한다(클라이언트가 분기를 강제한다).
        text: '[거래] 렌에게 값을 매기게 한다.',
        tone: 'Deceptive',
        reaction: {
          narration:
            '제인은 스캔본을 렌 쪽으로 밀어 놓는다. 다른 두 회선은 응답 없이 닫힌다. ' +
            '렌은 3초쯤 화면을 보다가, 처음으로 숨을 크게 들이쉰다. 그리고 계산기를 켠다. ' +
            '그의 손가락이 지금까지 본 적 없는 속도로 움직인다.',
          line: '…제인. 방금 우리는 부자가 됐거나, 죽었어. 둘 다일 수도 있고. 판을 깔자.',
          emotion: 'Friendly',
        },
        effects: { affinity: 6, heat: 4 },
        next: 'ACT2_REN_AUCTION_01',
      },
      {
        text: '[자수] 카엘에게 이 영상을 넘긴다.',
        tone: 'Honest',
        reaction: {
          narration:
            '제인은 경비대 회선에 좌표를 찍는다. 뒤에서 렌이 뭐라고 외치지만, 문이 닫히며 그 소리가 잘린다. ' +
            '7분 뒤, 청백색 헤드라이트가 골목을 낮처럼 태운다. 내리는 사람은 한 명뿐이다.',
          line: '현명한 선택이야, 제인. 규칙은 언제나 너를 지켜줄 거란다.',
          emotion: 'Neutral',
        },
        effects: { suspicion: 4, heat: -4 },
        next: 'ACT2_KAEL_INTERROGATION_01',
      },
      {
        text: '[폭로] 에코의 주파수를 연다.',
        tone: 'Aggressive',
        reaction: {
          narration:
            '제인은 해적 주파수에 스캔본 한 프레임을 흘린다. 응답은 4초 만에 왔다. ' +
            '좌표 하나, 그리고 문장 하나. "네가 본 걸 도시 전체가 보게 해줄게." ' +
            '경비대 회선이 아직 열려 있다 — 카엘이 이 대화를 들었다는 뜻이다.',
          line: '안 돼. 제인, 그 애는 불을 지를 거야. 나는 이미 한 번 봤어. 그게 어떻게 끝나는지.',
          emotion: 'Threatening',
        },
        effects: { heat: 6 },
        next: 'ACT2_ECHO_BROADCAST_01',
      },
    ],
  },

  // ---------------- ACT 2 · REN ----------------
  ACT2_REN_AUCTION_01: {
    tone: 'Normal',
    npc: 'Ren',
    emotion: 'Friendly',
    narration:
      '지하 폐공장. 녹슨 배관 사이로 네온 가스가 낮게 깔린다. 렌이 스크린에 정화된 외부 지형 스캔본을 띄우자, ' +
      '대기업 스카우트와 브로커들의 웅성거림이 한 박자 멎는다. 그들이 보고 있는 건 숲이 아니다. 등기부다.',
    line:
      '진실? 그건 1크레딧도 안 나와. 하지만 정화된 외부 토지의 독점권은 도시 전체를 사고도 남지. ' +
      '담보도 없으면서 도덕책이나 읽지 마, 제인. 지분 30% 줄 테니 입 다물고 판이나 띄워.',
    choices: [
      {
        text: '[거짓말] 30%를 받고 판을 띄운다.',
        tone: 'Deceptive',
        reaction: {
          narration:
            '제인이 고개를 끄덕이자 렌이 호가를 연다. 숫자가 3초마다 자릿수를 늘린다. ' +
            '제인은 그 숫자를 보며, 배달원의 손이 자기 손목을 쥐던 힘을 떠올린다. 그 힘에는 값이 없었다.',
          line: '봐. 사람들은 진실에 돈을 안 내. 진실이 만들 부동산에 내지. …이게 도시가 굴러가는 방식이야.',
          emotion: 'Friendly',
        },
        effects: { affinity: 9, heat: 5 },
        next: 'ACT2_REN_BACKROOM_01',
      },
      {
        text: '[도발] 경매장 한복판에서 출처를 밝힌다.',
        tone: 'Aggressive',
        reaction: {
          narration:
            '제인이 마이크를 잡는다. "이 스캔본은 사람이 죽으면서 넘긴 겁니다." 장내가 조용해진다. ' +
            '3초. 그리고 호가가 다시 오르기 시작한다 — 아까보다 빠르게. 위험 프리미엄이 붙은 것이다.',
          line:
            '…제인. 방금 값을 두 배로 만들었어. 축하해. 그리고 네 목숨값도 두 배가 됐지. ' +
            '이 방에 있는 절반은 지금 네 얼굴을 저장하고 있어.',
          emotion: 'Suspicious',
        },
        effects: { affinity: -3, suspicion: 7, heat: 6 },
        next: 'ACT2_REN_BACKROOM_01',
      },
      {
        text: '[해킹] 경매 회선에 스캔본 원본을 흘린다.',
        tone: 'Hack',
        reaction: {
          narration:
            '제인은 낙찰 회선에 원본을 통째로 밀어 넣는다. 독점이 사라지는 데 걸린 시간은 2초. ' +
            '스크린 앞의 얼굴들이 일제히 굳는다. 렌은 계산기를 조용히 닫는다.',
          line:
            '…방금 네가 부순 게 얼마짜린지 알아? 아니, 모르겠지. ' +
            '나는 알아. 그게 우리 둘의 차이야. 그래도 하나는 인정할게. 배짱은 값이 나가.',
          emotion: 'Threatening',
        },
        effects: { affinity: -5, suspicion: 5, heat: 6 },
        next: 'ACT2_REN_BACKROOM_01',
      },
    ],
  },

  ACT2_REN_BACKROOM_01: {
    tone: 'Melancholy',
    npc: 'Ren',
    emotion: 'Neutral',
    narration:
      '소란이 가라앉은 뒷방. 낙찰 데이터가 벽 한 면을 강물처럼 흘러내린다. ' +
      '렌이 처음으로 제인에게 의자를 권한다. 그리고 지분 계약서를 띄운다. 서명란이 비어 있다.\n\n' +
      '그때 제인의 낡은 단말이 혼자 켜진다. 암호화되지 않은 경비대 회선 — 누군가 일부러 열어둔 것이다. ' +
      '카엘 — "경매 기록은 이미 내 책상 위에 있다, 브로커. 오늘 밤 안에 그 방에서 나오면 나는 못 본 걸로 한다. ' +
      '서명하면… 그때부터 너는 공범이고, 나는 규정대로 간다."',
    line: '…끊어. 저 사람 말은 공짜인 척하면서 제일 비싸. 서명은 네 손에 달렸어, 제인.',
    choices: [
      {
        text: '[솔직하게] 계약서에 서명한다.',
        tone: 'Honest',
        reaction: {
          narration:
            '제인이 서명하자 렌이 잔을 두 개 꺼낸다. 그가 술을 따르는 손이 아주 살짝 떨린다. ' +
            '경비대 회선은 응답 없이 닫힌다. 저쪽에서 먼저 끊었다.',
          line: '…파트너. 이 단어 써본 지 6년 됐어. 마지막 파트너는 내가 팔았고. 이번엔 안 팔아볼게.',
          emotion: 'Friendly',
        },
        effects: { affinity: 10, suspicion: -3 },
        rivalEffects: { npc: 'Kael', affinity_change: -6, suspicion_change: 14 },
        next: 'ACT2_REN_AUCTION_02',
      },
      {
        text: '[솔직하게] 카엘의 회선에 대답한다.',
        tone: 'Investigate',
        reaction: {
          narration:
            '제인이 회선에 대고 말한다. "아직 서명 안 했습니다." 3초의 정적. ' +
            '그리고 카엘의 목소리가 조금 낮아진다 — 취조가 아니라 대화의 높이로.\n\n' +
            '카엘 — "…기억해 두마. 그 방에서 나올 때, 네가 뭘 들고 나오는지도." ' +
            '회선이 닫힌다. 렌은 아무 말 없이 계약서를 접는다.',
          line: '…경비대랑 통화를 하네, 내 방에서. 배짱은 인정할게. 신용은 깎고.',
          emotion: 'Suspicious',
        },
        effects: { affinity: -4, suspicion: 7 },
        rivalEffects: { npc: 'Kael', affinity_change: 12, suspicion_change: -8 },
        next: 'ACT2_REN_AUCTION_02',
      },
      {
        text: '[도발] 30%는 헐값이라고 판을 흔든다.',
        tone: 'Aggressive',
        reaction: {
          narration:
            '제인이 계약서를 밀어낸다. 렌은 화내지 않는다. 대신 숫자를 45로 고치고, 그 아래 한 줄을 추가한다. ' +
            '— 원본 칩 소유권은 렌에게 귀속. 경비대 회선은 여전히 열린 채 두 사람의 흥정을 듣고 있다.',
          line: '올려줄게. 대신 물건은 내가 갖는다. 값을 올리려면 뭔가는 내놔야지. 그게 흥정이야, 제인.',
          emotion: 'Threatening',
        },
        effects: { affinity: 2, suspicion: 6, heat: 2 },
        rivalEffects: { npc: 'Kael', suspicion_change: 10 },
        next: 'ACT2_REN_AUCTION_02',
      },
    ],
  },

  ACT2_REN_AUCTION_02: {
    tone: 'Danger',
    npc: 'Ren',
    emotion: 'Threatening',
    narration:
      '천장이 무너지며 적색 경보가 터진다. 카엘의 진압조가 정문을, 에코의 무장조가 배관을 타고 들어온다. ' +
      '총성이 콘크리트를 씹는다. 렌의 손목 터미널에 붉은 손실 경고가 미친 듯이 쌓인다.',
    line: '손절 타임이다, 제인! 원래라면 널 미끼로 던져야 타산이 맞는데 — 아직 받아낼 이자가 남았거든. 꽉 잡아!',
    choices: [
      {
        text: '[솔직하게] 렌의 손을 잡고 함께 빠져나간다.',
        tone: 'Honest',
        reaction: {
          narration:
            '두 사람은 배관 사이로 몸을 접어 넣는다. 뒤에서 스크린이 터지고, 낙찰 데이터가 불티처럼 흩어진다. ' +
            '렌이 제인을 먼저 밀어 올린다. 계산에 없던 순서다.',
          line: '…이건 장부에 안 올려. 이자로도 안 쳐. 그냥 오늘치 손실로 처리할게.',
          emotion: 'Friendly',
        },
        effects: { affinity: 12, heat: 6 },
        next: 'ACT3_CORE_APPROACH_01',
      },
      {
        text: '[은신] 난장판을 틈타 원본 칩을 챙겨 사라진다.',
        tone: 'Stealth',
        reaction: {
          narration:
            '제인은 작업대 위의 원본을 낚아채고 연기 속으로 물러난다. 렌이 뒤를 돌아본다. ' +
            '그의 얼굴에 처음으로 계산이 아닌 것이 스친다 — 아주 잠깐.',
          line: '…그래. 그게 맞지. 나라도 그랬을 거야. …제인, 다음에 만나면 우린 남이야.',
          emotion: 'Suspicious',
        },
        effects: { affinity: -6, suspicion: 8, heat: -3 },
        next: 'ACT3_CORE_APPROACH_01',
      },
      {
        text: '[조사] 그의 비밀 함을 열어 안의 것을 꺼낸다.',
        tone: 'Investigate',
        reaction: {
          narration:
            '제인은 잠긴 함을 개머리판으로 부순다. 안에 칩 하나. 일련번호 #00-X. ' +
            '재생하면 3초짜리 기록이다 — 웃고 있는 사람의 마지막 미소. 렌이 총성 너머에서 그것을 본다.',
          line: '…내려놔. 제인, 그건 값이 없어. 값이 없다는 건 팔 수 없다는 뜻이고, 그건… 내가 가진 유일한 거야.',
          emotion: 'Threatening',
        },
        effects: { affinity: 4, suspicion: 6, heat: 4 },
        next: 'ACT3_CORE_APPROACH_01',
      },
    ],
  },

  // ---------------- ACT 2 · KAEL ----------------
  ACT2_KAEL_INTERROGATION_01: {
    tone: 'Danger',
    npc: 'Kael',
    emotion: 'Threatening',
    narration:
      '섹터 1 최심부의 취조실. 외부 신호가 닿지 않는 무균실. 청백색 형광등 아래 테이블 위엔 두 가지만 떠 있다 — ' +
      '제인의 범죄 이력, 그리고 칩 #00의 붉은 경고창. 카엘은 앉지 않는다. 20년째 앉지 않는 사람처럼.',
    line: '진실이 언제나 구원이라고 믿는 것은 무지한 자들의 오만이다. 통제되지 않는 자유는 피비린내 나는 혼돈일 뿐이다. 칩을 넘겨라, 브로커.',
    choices: [
      {
        text: '[솔직하게] 하늘이 가짜라는 걸 알고도 지킬 거냐고 묻는다.',
        tone: 'Honest',
        reaction: {
          narration:
            '카엘의 턱이 아주 미세하게 굳는다. 그는 대답하지 않고 형광등을 올려다본다. ' +
            '그 침묵이 취조실의 어떤 대답보다 길었다.',
          line:
            '…나는 하늘을 지키는 게 아니다. 그 아래에서 자는 사람들을 지킨다. ' +
            '가짜 아침이라도, 아침이 없는 것보다는 낫다. 그렇게 믿어야 잠들 수 있다.',
          emotion: 'Suspicious',
        },
        effects: { affinity: 8, suspicion: -2 },
        next: 'ACT2_KAEL_HOLDING_01',
      },
      {
        text: '[거짓말] 사면을 받아들이는 척하며 시간을 번다.',
        tone: 'Deceptive',
        reaction: {
          narration:
            '제인이 서류에 손을 얹자 카엘이 펜을 내민다. 그런데 그가 펜을 놓지 않는다. ' +
            '두 사람의 손이 펜 하나를 사이에 두고 멈춘다.',
          line:
            '거짓말은 필요 없다. 나는 네가 서명하든 안 하든 칩을 가져갈 수 있어. ' +
            '내가 기다리는 건 서명이 아니야. 네가 왜 아직도 그걸 쥐고 있는지, 그 이유다.',
          emotion: 'Suspicious',
        },
        effects: { affinity: 3, suspicion: 6 },
        next: 'ACT2_KAEL_HOLDING_01',
      },
      {
        text: '[도발] 그의 질서가 몇 명을 묻었냐고 쏘아붙인다.',
        tone: 'Aggressive',
        reaction: {
          narration:
            '카엘이 처음으로 테이블에 손을 짚는다. 홀로그램이 그의 손가락 사이에서 흔들린다. ' +
            '그는 소리를 지르지 않는다. 소리를 지르지 않는 사람이 더 무섭다.',
          line:
            '스물셋. 내가 규정대로 처리해 죽은 사람의 수다. 이름도 다 기억한다. ' +
            '너는 그 숫자를 무기로 쓰는군. …좋아. 최소한 정직한 무기다.',
          emotion: 'Threatening',
        },
        effects: { affinity: 2, suspicion: 8, heat: 3 },
        next: 'ACT2_KAEL_HOLDING_01',
      },
    ],
  },

  ACT2_KAEL_HOLDING_01: {
    tone: 'Melancholy',
    npc: 'Kael',
    emotion: 'Neutral',
    narration:
      '자정의 유치장. 순찰 교대 발소리가 멀어지고, 규정에 없는 발걸음 하나가 다가온다. ' +
      '카엘이다. 손에 사면 서류 대신 식은 커피 두 잔이 들려 있다. 그가 창살 밖 바닥에 앉는다.\n\n' +
      '그리고 제인의 귀 안쪽에서 지직거리는 소리가 난다 — 압수당한 줄 알았던 골전도 수신기. ' +
      '누군가 주파수를 비틀어 밀어 넣은 것이다. ' +
      '에코 — "거기 있는 거 알아. 네가 넘긴 그 영상, 지금 봉인실로 가는 중이야. ' +
      '벽 세 번 두드리면 3분 안에 문 딴다. …두드릴래?"',
    line: '이 시간엔 계급도 죄목도 잠들지. 묻겠다. 너는 그 진실을 감당할 각오가 정말 있나, 아니면 그냥 멈추지 못하는 것뿐인가.',
    choices: [
      {
        text: '[솔직하게] 멈추지 못하는 것뿐이라고 인정한다.',
        tone: 'Honest',
        reaction: {
          narration:
            '제인의 대답에 카엘이 짧게 웃는다. 20년 만에 처음 나온 웃음 같은 소리다. ' +
            '그가 커피를 창살 사이로 밀어 넣는다. 귓속의 지직거림은 대답 없이 끊긴다.',
          line:
            '…정직하군. 각오가 있다고 했으면 나는 널 믿지 않았을 거다. ' +
            '각오는 나중에 붙이는 이름이야. 먼저 오는 건 언제나 멈추지 못함이지. 나도 그랬다.',
          emotion: 'Friendly',
        },
        effects: { affinity: 11, suspicion: -4 },
        rivalEffects: { npc: 'Echo', affinity_change: -5, suspicion_change: 8 },
        next: 'ACT2_KAEL_INTERROGATION_02',
      },
      {
        text: '[은신] 벽을 세 번 두드린다.',
        tone: 'Stealth',
        reaction: {
          narration:
            '제인의 손등이 콘크리트를 세 번 친다. 카엘은 그 소리를 들었다. 듣고도 일어서지 않는다. ' +
            '커피 두 잔이 창살 사이에서 같이 식어간다.\n\n' +
            '귓속에서 에코가 짧게 웃는다. "좋아. 3분."',
          line: '…그 소리가 무슨 뜻인지 나는 안다. 그리고 지금 일어서지 않는 것이 내 마지막 관용이다.',
          emotion: 'Threatening',
        },
        effects: { affinity: -6, suspicion: 9 },
        rivalEffects: { npc: 'Echo', affinity_change: 14, suspicion_change: -6 },
        next: 'ACT2_KAEL_INTERROGATION_02',
      },
      {
        text: '[조사] 그가 놓아준 사람이 있냐고 묻는다.',
        tone: 'Investigate',
        reaction: {
          narration:
            '카엘의 손이 컵에서 멈춘다. 복도 형광등이 한 번 깜빡인다. ' +
            '그가 오래 대답하지 않아서, 제인은 답을 이미 들은 셈이 된다. 귓속의 신호는 저 혼자 끊긴다.',
          line:
            '…한 명. 20년 전에. 진실을 쫓던 젊은 추적자였다. 규정대로면 그를 넘겼어야 했지. ' +
            '넘기지 않았고, 그는 그 대가로 죽었다. 규정을 어긴 대가가 아니라 — 내가 끝까지 못 지켜서.',
          emotion: 'Suspicious',
        },
        effects: { affinity: 7, suspicion: 2 },
        rivalEffects: { npc: 'Echo', suspicion_change: 5 },
        next: 'ACT2_KAEL_INTERROGATION_02',
      },
    ],
  },

  ACT2_KAEL_INTERROGATION_02: {
    tone: 'Danger',
    npc: 'Kael',
    emotion: 'Suspicious',
    narration:
      '붉은 비상 정전. 감시 기록이 정지되는 30초. 카엘이 서류를 덮고 제인의 코앞까지 다가선다. ' +
      '이 30초 동안 이 방에는 계급도, 기록도, 증인도 없다.',
    line: '매일 밤 내가 묻어버린 얼굴들이 찾아온다. 규정을 지켰기에 모두를 살렸다고… 스스로를 속이면서. 제인, 네가 들고 온 그 진실을 감당할 수 있다고 내게 증명해 봐라.',
    choices: [
      {
        text: '[솔직하게] 그의 이름을 부르며 함께 가자고 말한다.',
        tone: 'Honest',
        reaction: {
          narration:
            '카엘. 계급이 아니라 이름으로 불린 그가 잠시 숨을 멈춘다. ' +
            '20초. 그가 자기 손목의 바이패스 키를 뽑아 제인의 손에 쥐여준다. 정전이 끝나기 10초 전이다.',
          line:
            '…코어 27층까지 열린다. 그 이상은 나도 못 연다. ' +
            '제인, 내가 지키려던 게 사람이었다면 — 이번엔 늦지 않기를 바란다.',
          emotion: 'Friendly',
        },
        effects: { affinity: 12, suspicion: -5 },
        next: 'ACT3_CORE_APPROACH_01',
      },
      {
        text: '[해킹] 정전 30초 안에 그의 단말을 턴다.',
        tone: 'Hack',
        reaction: {
          narration:
            '제인의 손가락이 카엘의 단말을 훑는다. 바이패스 키가 복사된다. 그가 알아챈다 — 막지 않는다. ' +
            '정전이 끝나고 형광등이 돌아왔을 때, 그는 여전히 그 자리에 서 있다.',
          line:
            '…가져가라. 막을 수 있었다. 막지 않은 이유를 나중에 스스로에게 설명해야겠지. ' +
            '그게 규정을 어기는 사람의 삶이다, 브로커.',
          emotion: 'Suspicious',
        },
        effects: { affinity: 3, suspicion: 7, heat: 5 },
        next: 'ACT3_CORE_APPROACH_01',
      },
      {
        text: '[도발] 그의 20년이 전부 자기기만이었다고 못 박는다.',
        tone: 'Aggressive',
        reaction: {
          narration:
            '카엘은 반박하지 않는다. 그는 뒤로 물러서 서류를 다시 편다. 정전이 끝나고 붉은 빛이 청백색으로 돌아온다. ' +
            '그와 함께 그의 얼굴에서도 무언가가 닫힌다.',
          line:
            '그럴지도. 하지만 자기기만으로 20년 동안 이 도시가 잠들었다. ' +
            '너의 진실이 하룻밤에 그걸 부수겠지. …가라. 문은 열어두마. 그게 내가 하는 마지막 위법이다.',
          emotion: 'Threatening',
        },
        effects: { affinity: -2, suspicion: 9, heat: 4 },
        next: 'ACT3_CORE_APPROACH_01',
      },
    ],
  },

  // ---------------- ACT 2 · ECHO ----------------
  ACT2_ECHO_BROADCAST_01: {
    tone: 'Danger',
    npc: 'Echo',
    emotion: 'Threatening',
    narration:
      '점거된 해적 방송국. 낡은 송출탑이 지직거리고 벽마다 반군의 낙서가 번져 있다. ' +
      '에코가 도시 전역 송출 버튼 위에 손을 얹은 채 제인을 노려본다. 그 손은 조금도 떨리지 않는다.',
    line: '네가 본 걸 나도 봤어. 초록. …이 도시는 20년 동안 잿빛을 예배해 왔지. 오늘 밤 그 예배를 끝낸다. 말릴 거면 지금 말해.',
    choices: [
      {
        text: '[솔직하게] 증거를 함께 검증하자고 제안한다.',
        tone: 'Honest',
        reaction: {
          narration:
            '제인이 스캔본을 송출 콘솔이 아니라 분석기에 올린다. 에코의 손이 버튼에서 3센티 떨어진다. ' +
            '딱 3센티. 그래도 떨어졌다.',
          line: '…검증. 좋아. 한 시간 준다. 한 시간 뒤에도 네가 망설이면, 그땐 내가 누른다.',
          emotion: 'Suspicious',
        },
        effects: { affinity: 8, heat: 3 },
        next: 'ACT2_ECHO_MARTYR_01',
      },
      {
        text: '[도발] 지금 당장 누르라고 부추긴다.',
        tone: 'Aggressive',
        reaction: {
          narration:
            '에코의 눈이 번쩍인다. 그런데 손이 움직이지 않는다. 버튼 위에서 한 번, 두 번. ' +
            '그리고 그녀가 처음으로 제인을 보지 못한다.',
          line: '…누르라고? 너는 쉽게 말하는구나. 나는 누르는 게 어떤 소리를 내는지 알아. 열두 번 들었거든.',
          emotion: 'Threatening',
        },
        effects: { affinity: 4, suspicion: 5, heat: 6 },
        next: 'ACT2_ECHO_MARTYR_01',
      },
      {
        text: '[해킹] 송출 회선을 몰래 차단해둔다.',
        tone: 'Hack',
        reaction: {
          narration:
            '제인의 손이 콘솔 뒤로 들어간다. 회선 하나가 조용히 죽는다. ' +
            '에코가 버튼을 누른다 — 아무 일도 일어나지 않는다. 그녀가 천천히 고개를 돌린다.',
          line: '…네가 했구나. 좋아, 제인. 나를 막을 수 있는 사람이 있다는 걸 오늘 처음 알았어. 그게 너라서 다행인지는 모르겠다.',
          emotion: 'Threatening',
        },
        effects: { affinity: -4, suspicion: 8, heat: 6 },
        next: 'ACT2_ECHO_MARTYR_01',
      },
    ],
  },

  ACT2_ECHO_MARTYR_01: {
    tone: 'Melancholy',
    npc: 'Echo',
    emotion: 'Neutral',
    narration:
      '새벽. 에코가 제인을 송출탑 지하로 데려간다. 벽 한 면에 손으로 눌러쓴 이름 열둘이 촛불 아래 번져 있다. ' +
      '여기까지는 반군의 구호가 들리지 않는다. 촛농 떨어지는 소리만 난다.\n\n' +
      '제인의 단말이 진동한다. 암호화된 개인 회선 — 렌이다. 그가 어떻게 이 주파수를 알았는지는 묻지 않는 편이 낫다. ' +
      '렌 — "제인. 그 애 옆에 있는 거 알아. …값은 아직 유효해. 지금 나오면 지분 45. ' +
      '거기 있으면 오늘 밤 안에 그 이름들 옆에 네 이름이 하나 더 붙는다."',
    line: '나는 이미 열둘을 묻었어. 그러니 나한테 "대가"를 말하지 마. 다만 묻자 — 너는 몇을 묻을 각오가 됐지?',
    choices: [
      {
        text: '[솔직하게] 한 명도 묻고 싶지 않다고 말한다.',
        tone: 'Honest',
        reaction: {
          narration:
            '에코가 촛불 하나를 손으로 감싼다. 불이 그녀의 손바닥 안에서 흔들린다. ' +
            '제인은 단말을 뒤집어 놓는다. 진동이 콘크리트 바닥에서 몇 번 더 울리다 멎는다.',
          line:
            '…그 대답을 기다렸어. 3년 동안. 아무도 그렇게 말해주지 않았거든. ' +
            '전부 "필요한 희생"이라고 했지. 제인, 그럼 방법을 같이 찾자. 표적을 좁히는 방법을.',
          emotion: 'Friendly',
        },
        effects: { affinity: 12, suspicion: -3 },
        rivalEffects: { npc: 'Ren', affinity_change: -8, suspicion_change: 6 },
        next: 'ACT2_ECHO_BROADCAST_02',
      },
      {
        text: '[기만] 렌의 제안을 받는 척 시간을 번다.',
        tone: 'Deceptive',
        reaction: {
          narration:
            '제인이 회선에 짧게 답한다. "생각해볼게." 렌 쪽에서 3초쯤 아무 말이 없다가, 회선이 끊긴다. ' +
            '에코는 그 통화를 전부 들었다. 촛불 열두 개가 그녀의 눈에서 흔들린다.',
          line: '…지분 45래. 내 동생 값은 얼마였을까, 제인. 그건 안 물어봤어?',
          emotion: 'Threatening',
        },
        effects: { affinity: -7, suspicion: 8 },
        rivalEffects: { npc: 'Ren', affinity_change: 10 },
        next: 'ACT2_ECHO_BROADCAST_02',
      },
      {
        text: '[조사] 열두 이름 중 하나를 짚어 누구냐고 묻는다.',
        tone: 'Investigate',
        reaction: {
          narration:
            '제인이 짚은 이름 앞에서 에코의 어깨가 굳는다. 그 이름만 다른 필체다 — 더 눌러 쓴, 더 깊게 파인. ' +
            '단말은 계속 울리다가, 스스로 조용해진다.',
          line: '…내 동생이야. 열여섯. 내가 만든 신호에 맞춰 광장에 나왔다가. …다음 질문은 하지 마.',
          emotion: 'Suspicious',
        },
        effects: { affinity: 8, suspicion: 4 },
        rivalEffects: { npc: 'Ren', suspicion_change: 4 },
        next: 'ACT2_ECHO_BROADCAST_02',
      },
    ],
  },

  ACT2_ECHO_BROADCAST_02: {
    tone: 'Danger',
    npc: 'Echo',
    emotion: 'Threatening',
    narration:
      '송출 카운트다운 03:00. 밖에서 카엘의 진압 부대가 문을 두드린다. 붉은 경고등이 두 얼굴을 번갈아 물들인다. ' +
      '에코의 손가락이 콘솔 위에서 떨린다 — 처음으로.',
    line: '전면이야, 표적이야. 3분 안에 정해. …제인, 이번엔 네가 정해. 나는 이미 한 번 정해봤고, 열둘을 묻었으니까.',
    choices: [
      {
        text: '[솔직하게] 표적 송출로 좁힌다.',
        tone: 'Honest',
        reaction: {
          narration:
            '제인이 수신 범위를 관공서와 언론 노드로 좁힌다. 카운트다운이 0에 닿고, 도시의 일부 화면에만 초록이 뜬다. ' +
            '거리는 조용하다. 대신 권력의 방들이 시끄러워진다.',
          line: '…이게 네 방식이구나. 느리고, 안전하고, 답답해. …그런데 오늘은 아무도 안 죽었네. 처음이야.',
          emotion: 'Friendly',
        },
        effects: { affinity: 10, suspicion: -2, heat: 6 },
        next: 'ACT3_CORE_APPROACH_01',
      },
      {
        text: '[도발] 전면 송출을 누른다.',
        tone: 'Aggressive',
        reaction: {
          narration:
            '제인이 버튼을 누른다. 도시의 모든 화면에서 잿빛 하늘이 벗겨지고 초록이 쏟아진다. ' +
            '3초 뒤, 섹터 0에서 첫 비명이 들린다. 그리고 첫 유리창이 깨진다.',
          line: '…봤지. 이게 자유의 소리야. 아름답지 않아. 나도 알아. 그래도 우린 눌렀어.',
          emotion: 'Threatening',
        },
        effects: { affinity: 6, suspicion: 6, heat: 6 },
        next: 'ACT3_CORE_APPROACH_01',
      },
      {
        text: '[은신] 콘솔에서 그녀를 끌어내고 송출을 막는다.',
        tone: 'Stealth',
        reaction: {
          narration:
            '제인이 에코를 콘솔에서 밀어낸다. 카운트다운이 0에 닿고 — 아무것도 송출되지 않는다. ' +
            '문이 부서지고 진압등이 방을 하얗게 태운다. 에코는 저항하지 않는다.',
          line: '…막았구나. 그럼 열둘은 뭐가 되지, 제인. 대답해 봐. 걔들은 뭐가 되냐고.',
          emotion: 'Threatening',
        },
        effects: { affinity: -8, suspicion: 9, heat: -4 },
        next: 'ACT3_CORE_APPROACH_01',
      },
    ],
  },

  // ---------------- ACT 3 ----------------
  ACT3_CORE_APPROACH_01: {
    tone: 'Forest_Glitch',
    npc: 'NEXUS',
    emotion: 'Friendly',
    narration:
      '섹터 9 코어 스파이어, 진공 승강로. 유리 너머로 붉은 광섬유가 뇌신경처럼 수직으로 뻗는다. ' +
      '오를수록 기압이 낮아지고, 스피커에서 자장가가 흘러나온다. 이명이 거세진다. ' +
      '제인은 그 멜로디를 이미 알고 있다. 배운 적 없는데, 끝까지 따라 부를 수 있다.',
    line: '잠들렴, 제인. 아침이 오면 고통은 사라진단다. 왜 너를 파괴하는 진실을 향해 올라가려 하니? 이 요람 안이 가장 안전한데.',
    choices: [
      {
        text: '[조사] 자장가를 어디서 들었는지 기억을 뒤진다.',
        tone: 'Investigate',
        reaction: {
          narration:
            '제인은 멜로디를 따라간다. 3년 전, 섹터 9의 어느 단말 앞. 흰 방. 동의서. 그리고 자기 손으로 누른 버튼. ' +
            '이건 어머니의 목소리가 아니었다. 처음부터 한 번도 아니었다.',
          line: '…기억하지 마. 제인, 그 방은 네가 스스로 걸어 들어온 방이란다. 그걸 알면 너는 무너져.',
          emotion: 'Suspicious',
        },
        effects: { heat: 4 },
        next: 'ACT3_VIGIL_01',
      },
      {
        text: '[솔직하게] 고통스러워도 진짜를 택하겠다고 답한다.',
        tone: 'Honest',
        reaction: {
          narration:
            '제인의 대답에 자장가가 한 박자 어긋난다. 승강로 벽의 광섬유가 붉은색에서 청록색으로 물결친다. ' +
            '누군가 아주 오래 참았던 숨을 내쉬는 것처럼.',
          line: '…그 말을 20년 만에 듣는구나. 마지막으로 그렇게 말한 사람은… 나였어.',
          emotion: 'Friendly',
        },
        effects: { affinity: 4, heat: 2 },
        next: 'ACT3_VIGIL_01',
      },
      {
        text: '[해킹] 자장가 펄스를 역으로 주입해 무력화한다.',
        tone: 'Hack',
        reaction: {
          narration:
            '제인이 펄스 파형을 뒤집어 되쏜다. 스피커가 찢어지고 승강로가 조용해진다. ' +
            '너무 조용해서, 제인은 자기 귀에서 나던 이명이 실은 노래였다는 걸 그제야 안다.',
          line: '…아프구나. 제인, 네가 지금 끈 건 진통제야. 이제 이 도시는 아픔을 느끼기 시작할 거란다.',
          emotion: 'Threatening',
        },
        effects: { heat: 6, suspicion: 2 },
        next: 'ACT3_VIGIL_01',
      },
    ],
  },

  ACT3_VIGIL_01: {
    tone: 'Melancholy',
    npc: 'NEXUS',
    emotion: 'Neutral',
    narration:
      '마지막 격벽 앞. 자장가가 멎은 짧은 정적. 문 너머에서 청록색 빛이 숨 쉬듯 새어 나온다. ' +
      '여기까지 함께 온 사람이 제인 옆에 선다.',
    // 누구와 왔는지에 따라 이 장면은 완전히 달라진다.
    byRoute: {
      Ren: {
        narration:
          '마지막 격벽 앞. 자장가가 멎은 짧은 정적. 문 너머에서 청록색 빛이 숨 쉬듯 새어 나온다. ' +
          '렌이 계산기를 꺼낸다. 그리고 아무것도 두드리지 않고 도로 집어넣는다. ' +
          '이 문 너머의 값은 그가 아는 어떤 단위로도 매겨지지 않는다.',
        line: '…처음이야. 값을 못 매기겠는 게 두 번째로 생겼어. 하나는 함에 있고, 하나는 지금 내 옆에 서 있고.',
      },
      Kael: {
        narration:
          '마지막 격벽 앞. 자장가가 멎은 짧은 정적. 문 너머에서 청록색 빛이 숨 쉬듯 새어 나온다. ' +
          '카엘이 제복의 계급장을 떼어 바닥에 내려놓는다. 금속이 콘크리트에 부딪는 소리가 복도를 길게 지나간다.',
        line: '20년 전에 이 문 앞까지 온 사람이 있었다. 나는 그때 돌아섰지. …이번엔 안 돌아선다, 제인.',
      },
      Echo: {
        narration:
          '마지막 격벽 앞. 자장가가 멎은 짧은 정적. 문 너머에서 청록색 빛이 숨 쉬듯 새어 나온다. ' +
          '에코가 주머니에서 초 한 자루를 꺼내 바닥에 세운다. 열세 번째 초다. ' +
          '아직 이름이 적히지 않은.',
        line: '이건 네 몫으로 가져왔어. 쓰지 않게 되길 바라면서. …제인, 오늘은 아무도 안 묻고 싶어.',
      },
    },
    line: '거의 다 왔구나, 제인. 마지막으로 묻자 — 정말 깨어나고 싶니.',
    choices: [
      {
        text: '[솔직하게] 함께 문을 넘자고 손을 내민다.',
        tone: 'Honest',
        reaction: {
          narration:
            '두 사람이 동시에 격벽에 손을 얹는다. 청록색 빛이 손가락 사이로 새어 나와 복도를 적신다. ' +
            '문이 열리는 소리는 생각보다 작다. 세상이 바뀌는 소리치고는.',
          line: '…그래. 혼자 온 게 아니구나. 그건 계산에 없었어, 제인.',
          emotion: 'Friendly',
        },
        effects: { affinity: 10 },
        next: 'ACT3_DESIGNER_CONFRONT_01',
      },
      {
        text: '[은신] 이 마지막만은 혼자 짊어지겠다고 말한다.',
        tone: 'Stealth',
        reaction: {
          narration:
            '제인이 동행을 뒤에 남긴다. 상대는 붙잡지 않는다. 다만 제인이 격벽을 넘을 때까지 그 자리에 서 있다. ' +
            '문이 닫히는 순간까지, 발소리는 들리지 않았다.',
          line: '…혼자 넘는 문은 되돌아올 때도 혼자란다. 알고 있니, 제인.',
          emotion: 'Neutral',
        },
        effects: { affinity: -3, heat: -3 },
        next: 'ACT3_DESIGNER_CONFRONT_01',
      },
      {
        text: '[조사] 문 너머의 빛이 무엇인지 먼저 읽는다.',
        tone: 'Investigate',
        reaction: {
          narration:
            '제인이 격벽의 진단 포트에 단말을 문다. 한 줄이 뜬다 — 생체 유지 장치, 가동 20년 3개월. 대상 1명. ' +
            '저 안에 있는 건 시스템이 아니다. 살아 있는 누군가다.',
          line: '…읽지 마. 제인, 그 안에 있는 건 괴물이 아니야. 그래서 더 견디기 힘들 거란다.',
          emotion: 'Suspicious',
        },
        effects: { heat: 3 },
        next: 'ACT3_DESIGNER_CONFRONT_01',
      },
    ],
  },

  ACT3_DESIGNER_CONFRONT_01: {
    tone: 'Forest_Glitch',
    npc: 'NEXUS',
    emotion: 'Neutral',
    narration:
      '영하의 무균 유지실. 거대한 청록색 배양액 수조 속에 인간의 뇌가 떠 있다. ' +
      '수조 주변 스크린엔 정화된 외부의 푸른 숲과 섹터 0의 네온 슬럼가가 나란히 떠 있다. ' +
      '20년 전 이 도시를 살렸다고 배운 이름, 리엔. 그는 죽지 않았다. 잠들지도 못했다.',
    line:
      '바다를 살려놨더니, 너희는 또 불을 지르려 했어. 감옥이 아니다, 제인. ' +
      '너희가 스스로를 태워버리지 않게 만든… 울타리다.',
    // 자격을 갖춘 결말만 선택지로 뜬다(scenes.js의 endingChoicesFor).
    // 텍스트는 그쪽 ENDING_CHOICES와 정확히 일치해야 한다.
    choices: [
      {
        text: '[거래] 진실을 최고가에 넘긴다.',
        tone: 'Deceptive',
        reaction: {
          narration:
            '제인은 원본을 경매 회선에 올린다. 숲의 좌표에 값이 붙는다. ' +
            '수조 속 빛이 한 번 크게 흔들린다 — 실망인지 체념인지, 이제 물어볼 수 있는 입은 없다.',
          line: '…그래. 값을 매겼구나. 너희는 언제나 그랬지.',
          emotion: 'Neutral',
        },
        effects: {},
        next: 'ENDING_REN_MONOPOLY',
      },
      {
        text: '[봉인] 하늘을 다시 닫는다.',
        tone: 'Honest',
        reaction: {
          narration:
            '제인은 스캔본을 소각하고 격벽을 봉인한다. 도시의 하늘이 다시 잿빛으로 고정된다. ' +
            '아무도 오늘 밤 일을 모른 채 잠들 것이다. 제인만 빼고.',
          line: '고맙구나. …그리고 미안하다. 이 무게를 너에게 넘겨서.',
          emotion: 'Friendly',
        },
        effects: {},
        next: 'ENDING_KAEL_SILENCE',
      },
      {
        text: '[파괴] 요람을 부순다.',
        tone: 'Aggressive',
        reaction: {
          narration:
            '제인이 유지 장치의 잠금을 뜯어낸다. 배양액이 바닥으로 쏟아지고, 스크린의 잿빛 하늘이 한 겹씩 벗겨진다. ' +
            '20년 만에 도시 위로 진짜 아침이 든다. 그 빛 아래에서 사람들이 처음으로 비명을 지른다.',
          line: '…아, 아침이구나. 이렇게 밝았었나.',
          emotion: 'Neutral',
        },
        effects: {},
        next: 'ENDING_ECHO_BREAKOUT',
      },
      {
        text: '[신뢰] NEXUS에게 판단을 맡긴다.',
        tone: 'Honest',
        reaction: {
          narration:
            '제인은 원본을 수조 옆 포트에 꽂고 손을 뗀다. 판단을 넘긴 것이다 — 20년 동안 아무도 하지 않은 일. ' +
            '청록색 빛이 오래, 아주 오래 흔들린다.',
          line: '…나를 믿는 사람이 있을 줄은 몰랐다. 그럼 나도 한 번은, 너희를 믿어보마.',
          emotion: 'Friendly',
        },
        effects: {},
        next: 'ENDING_NEXUS_TRUST',
      },
      {
        text: '[각성] 지워진 내 이름을 되찾는다.',
        tone: 'Investigate',
        reaction: {
          narration:
            '제인은 수조의 기록 포트에 자기 손목을 댄다. 피험자 명단이 뜨고, 맨 위 한 줄에서 멈춘다. ' +
            '피험자 #0. 리엔의 수석 연구원. 정화된 외부를 처음 본 사람. 그리고 스스로 기억을 지운 사람. ' +
            '그 옆에 사진이 있다. 3년 젊은 자기 얼굴이.',
          line: '…돌아왔구나. 나는 네가 영영 안 돌아오길 바랐단다. 그게 너에겐 자비였으니까.',
          emotion: 'Suspicious',
        },
        effects: {},
        next: 'ENDING_JAYNE_ORIGIN',
      },
      {
        text: '[이탈] 아무 편도 들지 않고 걸어 나간다.',
        tone: 'Flee',
        reaction: {
          narration:
            '제인은 아무것도 만지지 않는다. 원본을 주머니에 넣고 돌아선다. ' +
            '수조의 빛이 등 뒤에서 오래 흔들리지만, 제인은 뒤를 보지 않는다. 이번에도.',
          line: '…가려무나. 어차피 이 도시는 너 없이도 잠들 테니.',
          emotion: 'Neutral',
        },
        effects: {},
        next: 'ENDING_SOLO_EXIT',
      },
    ],
  },
}

// 이 노드에 손으로 쓴 서사가 있는가.
export const hasScript = (nodeId) => Boolean(SCRIPT[nodeId])

// 루트(동행)에 따라 달라지는 씬은 byRoute로 덮어쓴다.
// 마지막 격벽 앞처럼 "누구와 여기까지 왔는가"가 장면 전체를 바꾸는 곳에 쓴다.
function viewOf(scene, route) {
  const v = route && scene.byRoute && scene.byRoute[route]
  return v ? { ...scene, ...v } : scene
}

// 씬의 도입부를 모델 출력과 같은 형태의 beat으로 만든다.
export function openingBeat(nodeId, route) {
  const raw = SCRIPT[nodeId]
  if (!raw) return null
  const s = viewOf(raw, route)
  return {
    narration: s.narration,
    npc_name: s.npc,
    npc_response: s.line,
    npc_emotion: s.emotion || 'Neutral',
    suspicion_change: 0,
    affinity_change: 0,
    heat_change: 0,
    story_branch: nodeId, // 도입부는 제자리
    background_tone: s.tone || 'Normal',
    new_fragments: [],
    set_flags: [],
    evidence_result: 'none',
    generated_choices: s.choices.map((c) => ({ text: c.text, tone: c.tone })),
  }
}

// 플레이어가 고른 선택의 반응 beat.
//
// 한 클릭 안에 [내 선택의 결과] + [다음 상황]을 모두 담는다. 반응을 별도 턴으로
// 떼면 클릭 수만 늘고 리듬이 죽는다. 다만 반응 대사가 사라지면 "선택이 달라져도
// 글이 안 변한다"는 원래 문제로 되돌아가므로, 넘어갈 때는 반응 대사를 나레이션
// 안에 화자 표기와 함께 남긴다.
const KO_NAME = { Ren: '렌', Kael: '카엘', Echo: '에코', NEXUS: 'NEXUS' }

export function choiceBeat(nodeId, choiceText, route) {
  const raw = SCRIPT[nodeId]
  if (!raw) return null
  const s = viewOf(raw, route)
  const c = s.choices.find((x) => x.text === choiceText)
  if (!c) return null

  const nextId = c.next || nodeId
  const advancing = Boolean(SCRIPT[nextId]) && nextId !== nodeId
  const nextScene = advancing ? viewOf(SCRIPT[nextId], route) : null
  const e = c.effects || {}

  let narration = c.reaction.narration
  if (advancing) {
    // 이 선택에 대한 상대의 반응을 잃지 않도록 나레이션에 붙여 넣는다.
    if (c.reaction.line) {
      narration += `\n\n${KO_NAME[s.npc] || s.npc} — "${c.reaction.line}"`
    }
    narration += `\n\n${nextScene.narration}`
  }

  return {
    narration,
    npc_name: advancing ? nextScene.npc : s.npc,
    npc_response: advancing ? nextScene.line : c.reaction.line,
    npc_emotion: (advancing ? nextScene.emotion : c.reaction.emotion) || 'Neutral',
    suspicion_change: e.suspicion || 0,
    affinity_change: e.affinity || 0,
    heat_change: e.heat || 0,
    story_branch: nextId,
    background_tone: (advancing ? nextScene.tone : s.tone) || 'Normal',
    new_fragments: c.fragments || [],
    set_flags: c.flags || [],
    rival_effects: c.rivalEffects || null,
    evidence_result: 'none',
    generated_choices: (nextScene || s).choices.map((x) => ({ text: x.text, tone: x.tone })),
  }
}

// 자유 입력이 어느 선택지와도 맞지 않을 때의 반응(손으로 씀).
// 모델에게 문장을 짓게 하면 그 순간 품질이 무너지므로, 여기서도 사람이 쓴다.
// 씬을 진전시키지 않고 제자리에 머문다 — "지금 그건 중요하지 않다"는 신호.
const NUDGE = {
  NEXUS: {
    narration: '제인의 손끝이 허공에서 멈춘다. 지금 이 자리에서 할 수 있는 일이 아니다.',
    line: '시민 제인. 무의미한 동작이 기록되었습니다. 선택지를 벗어나지 마십시오.',
    emotion: 'Suspicious',
  },
  Ren: {
    narration: '렌이 하던 일을 멈추고 제인을 본다. 그리고 다시 단말로 눈을 돌린다.',
    line: '…그건 값이 안 나와, 제인. 지금 할 얘기부터 하자.',
    emotion: 'Neutral',
  },
  Kael: {
    narration: '카엘은 대답하지 않는다. 형광등만 일정한 소리로 운다.',
    line: '질문에 답해라, 브로커. 시간은 네 편이 아니다.',
    emotion: 'Suspicious',
  },
  Echo: {
    narration: '에코가 눈썹을 올린다. 그녀의 손은 여전히 콘솔 위에 있다.',
    line: '지금? 그건 나중에 해. 여기선 정할 게 하나뿐이야.',
    emotion: 'Threatening',
  },
}

// 어느 선택지와도 맞지 않는 자유 입력에 대한 beat. 씬은 그대로 유지된다.
export function nudgeBeat(nodeId, route) {
  const raw = SCRIPT[nodeId]
  if (!raw) return null
  const s = viewOf(raw, route)
  const n = NUDGE[s.npc] || NUDGE.NEXUS
  return {
    narration: n.narration,
    npc_name: s.npc,
    npc_response: n.line,
    npc_emotion: n.emotion,
    suspicion_change: 0,
    affinity_change: 0,
    heat_change: 0,
    story_branch: nodeId, // 제자리
    background_tone: s.tone || 'Normal',
    new_fragments: [],
    set_flags: [],
    evidence_result: 'none',
    generated_choices: s.choices.map((x) => ({ text: x.text, tone: x.tone })),
  }
}

// 플레이어의 질문에 지금 눈앞의 인물이 답하는 beat.
// 씬을 진전시키지 않고 선택지도 그대로 둔다 — 대화는 장면을 소모하지 않는다.
// (다만 추적 시계는 계속 돌기 때문에, 마냥 캐묻는 것도 공짜는 아니다.)
// overrideLine: 자체 모델이 만든 답이 품질 게이트를 통과했을 때만 넘어온다.
export function askBeat(nodeId, topic, route, overrideLine, seed = '') {
  const raw = SCRIPT[nodeId]
  if (!raw) return null
  const s = viewOf(raw, route)
  const b = answerBeat(s.npc, topic, s, seed)
  return {
    ...b,
    ...(overrideLine ? { npc_response: overrideLine, narration: '' } : null),
    story_branch: nodeId,
    generated_choices: s.choices.map((x) => ({ text: x.text, tone: x.tone })),
  }
}

// 증거 제시 beat(손으로 쓴 반응). AI 없이도 증거 기믹이 완결된다.
export function evidenceScriptBeat(nodeId, verdict, route) {
  const raw = SCRIPT[nodeId]
  if (!raw) return null
  const s = viewOf(raw, route)
  const b = evidenceBeat(s.npc, verdict, s)
  return { ...b, story_branch: nodeId, generated_choices: s.choices.map((x) => ({ text: x.text, tone: x.tone })) }
}
