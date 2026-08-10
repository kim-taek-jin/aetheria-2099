import { useState } from 'react'
import { KeyRound, ShieldCheck, Loader2, ExternalLink } from 'lucide-react'
import { validateKey } from '../services/geminiService.js'

// BYOK modal. Key lives ONLY in the user's browser (LocalStorage) and is
// sent straight to Google — never to our server. That promise is stated
// in the UI for trust + legal safety.
export default function ApiKeyModal({ initial = '', onSave, onClose, dismissable }) {
  const [key, setKey] = useState(initial)
  const [status, setStatus] = useState(null) // null | 'checking' | 'ok' | 'bad'
  const [msg, setMsg] = useState('')

  // Loose gate only — the real judge is the auth ping below. Google rotates
  // key formats, so we don't hard-reject on a strict pattern.
  const looksValid = key.trim().length >= 20

  async function handleSave() {
    const k = key.trim()
    if (!looksValid) {
      setStatus('bad')
      setMsg('키가 너무 짧습니다. 전체를 복사해 붙여넣었는지 확인하세요.')
      return
    }
    if (!/^AIza/.test(k)) {
      // Warn but still allow — some keys may differ; let the ping decide.
      setMsg('참고: 보통 "AIza"로 시작합니다. 인증을 시도합니다…')
    }
    setStatus('checking')
    setMsg('NEXUS 인증 핑 전송 중…')
    const res = await validateKey(k)
    if (res.ok || res.code === 'RATE_LIMIT') {
      setStatus('ok')
      onSave(k)
    } else {
      setStatus('bad')
      setMsg(res.code === 'BAD_KEY' ? '키가 거부되었습니다. 다시 확인하세요.' : '네트워크 오류. 잠시 후 재시도.')
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4">
      <div className="panel-border w-full max-w-md rounded-lg p-6">
        <div className="mb-4 flex items-center gap-2 text-neon-cyan">
          <KeyRound size={20} />
          <h2 className="text-lg font-bold tracking-widest">ACCESS KEY // BYOK</h2>
        </div>

        <p className="mb-4 text-xs leading-relaxed text-cyan-200/70">
          Google AI Studio의 <b>Gemini 무료 API Key</b>를 입력하세요. 이 키는{' '}
          <b className="text-neon-green">당신의 브라우저(LocalStorage)에만 저장</b>되며 우리 서버로 전송되지
          않습니다.
        </p>

        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="AIza..."
          className="mb-2 w-full rounded border border-neon-cyan/30 bg-black/50 px-3 py-2 font-mono text-sm text-neon-cyan outline-none focus:border-neon-cyan"
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />

        {status === 'bad' && <p className="mb-2 text-xs text-neon-red">{msg}</p>}
        {status === 'checking' && (
          <p className="mb-2 flex items-center gap-1 text-xs text-neon-amber">
            <Loader2 size={12} className="animate-spin" /> {msg}
          </p>
        )}

        <a
          href="https://aistudio.google.com/app/apikey"
          target="_blank"
          rel="noreferrer"
          className="mb-4 inline-flex items-center gap-1 text-xs text-neon-magenta hover:underline"
        >
          무료 키 발급받기 <ExternalLink size={11} />
        </a>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={status === 'checking'}
            className="neon-btn flex-1 rounded border border-neon-green/50 bg-neon-green/10 px-4 py-2 text-sm font-bold text-neon-green disabled:opacity-40"
          >
            <span className="inline-flex items-center gap-1">
              <ShieldCheck size={14} /> 접속
            </span>
          </button>
          {dismissable && (
            <button
              onClick={onClose}
              className="neon-btn rounded border border-cyan-500/30 px-4 py-2 text-sm text-cyan-300/70"
            >
              닫기
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
