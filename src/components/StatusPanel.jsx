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

function Gauge({ label, value, color, danger }) {
  return (
    <div className="flex items-center gap-1">
      <span className="w-4 shrink-0 text-cyan-300/60">{label}</span>
      <div className="relative h-2 w-full overflow-hidden rounded bg-black/60">
        <div
          className={`h-full ${danger ? 'bg-neon-red' : color} transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="w-7 shrink-0 text-right text-cyan-200/70">{value}</span>
    </div>
  )
}

export default function StatusPanel({ save }) {
  const npcs = ['Ren', 'Kael', 'Echo']
  const heat = save.heat || 0
  const heatHot = heat >= HEAT_WARN
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
                />
                <Gauge
                  label={<Heart size={10} />}
                  value={r.affinity}
                  color="bg-neon-green"
                  danger={false}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* NEXUS trace — city-wide surveillance clock */}
      <div className="mt-2 flex items-center gap-2">
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
      </div>
    </div>
  )
}
