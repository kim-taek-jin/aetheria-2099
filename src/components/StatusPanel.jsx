import { Cpu, Eye, Heart, Radio, Satellite } from 'lucide-react'
import { GATES, HEAT_WARN } from '../game/state.js'

const NPC_COLOR = {
  Ren: 'text-neon-amber',
  Kael: 'text-neon-cyan',
  Echo: 'text-neon-magenta',
  NEXUS: 'text-neon-green',
}
const TONE_LABEL = {
  Normal: '평온',
  Danger: '위험',
  Melancholy: '비애',
  Forest_Glitch: '숲 // 글리치',
}

// delta: 이번 턴 변화량(없으면 null). invert=true면 +가 나쁨(의심·추적).
function Gauge({ label, value, color, danger, delta, dkey, invert }) {
  const show = typeof delta === 'number' && delta !== 0
  const good = invert ? delta < 0 : delta > 0
  return (
    <div className="relative flex items-center gap-1">
      <span className="w-4 shrink-0 text-cyan-300/60">{label}</span>
      <div className="relative h-2 w-full overflow-hidden rounded bg-black/60">
        <div
          className={`h-full ${danger ? 'bg-neon-red' : color} transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="w-7 shrink-0 text-right text-cyan-200/70">{value}</span>
      {show && (
        <span
          key={dkey}
          className={`delta-float pointer-events-none absolute -top-3 right-0 text-[10px] font-bold ${
            good ? 'text-neon-green' : 'text-neon-red'
          }`}
        >
          {delta > 0 ? `+${delta}` : delta}
        </span>
      )}
    </div>
  )
}

export default function StatusPanel({ save, delta }) {
  const npcs = ['Ren', 'Kael', 'Echo']
  const heat = save.heat || 0
  const heatHot = heat >= HEAT_WARN
  const dk = delta?.turn // 델타 애니메이션 리트리거용 key
  return (
    <div className="panel-border rounded-lg px-3 py-2 text-[11px]">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1 font-bold tracking-widest text-neon-cyan">
          <Cpu size={13} /> NEXUS STATUS
        </span>
        <span className="flex items-center gap-1 text-cyan-300/70">
          <Radio size={12} /> TONE: <b className={save.backgroundTone === 'Forest_Glitch' ? 'text-neon-green' : ''}>
            {TONE_LABEL[save.backgroundTone] || save.backgroundTone}
          </b>
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {npcs.map((n) => {
          const r = save.relationships[n]
          const active = save.activeNpc === n
          return (
            <div
              key={n}
              className={`rounded border px-2 py-1.5 ${
                active ? 'border-neon-cyan/60 bg-cyan-500/5' : 'border-cyan-500/15'
              }`}
            >
              <div className={`mb-1 flex items-center justify-between font-bold ${NPC_COLOR[n]}`}>
                <span>{n}</span>
                {active && <span className="text-[9px] text-neon-cyan">◉ ACTIVE</span>}
              </div>
              <div className="space-y-1">
                <Gauge
                  label={<Eye size={10} />}
                  value={r.suspicion}
                  color="bg-neon-amber"
                  danger={r.suspicion >= GATES.SUSPICION_HOSTILE}
                  delta={delta?.npc === n ? delta.dSus : null}
                  dkey={dk}
                  invert
                />
                <Gauge
                  label={<Heart size={10} />}
                  value={r.affinity}
                  color="bg-neon-green"
                  danger={false}
                  delta={delta?.npc === n ? delta.dAff : null}
                  dkey={dk}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* NEXUS trace — city-wide surveillance clock */}
      <div className="relative mt-2 flex items-center gap-2">
        <span className={`flex shrink-0 items-center gap-1 ${heatHot ? 'text-neon-red' : 'text-cyan-300/60'}`}>
          <Satellite size={12} className={heatHot ? 'glitch-flicker' : ''} /> NEXUS 추적
        </span>
        <div className="relative h-2 w-full overflow-hidden rounded bg-black/60">
          <div
            className={`h-full transition-all duration-500 ${heatHot ? 'bg-neon-red' : 'bg-neon-magenta'}`}
            style={{ width: `${heat}%` }}
          />
        </div>
        <span className={`w-8 shrink-0 text-right ${heatHot ? 'text-neon-red' : 'text-cyan-200/70'}`}>{heat}%</span>
        {typeof delta?.dHeat === 'number' && delta.dHeat !== 0 && (
          <span
            key={dk}
            className={`delta-float pointer-events-none absolute -top-3 right-0 text-[10px] font-bold ${
              delta.dHeat < 0 ? 'text-neon-green' : 'text-neon-red'
            }`}
          >
            {delta.dHeat > 0 ? `+${delta.dHeat}` : delta.dHeat}
          </span>
        )}
      </div>
    </div>
  )
}
