import { Pause, Play, RotateCcw, X } from 'lucide-react'
import type { CookingTimerState } from '../types'
import { formatCountdown, timerRemainingMs } from '../lib/cooking'

interface CookingTimerProps {
  timer: CookingTimerState
  now: number
  onPause: () => void
  onResume: () => void
  onReset: () => void
  onRemove: () => void
}

export default function CookingTimer({ timer, now, onPause, onResume, onReset, onRemove }: CookingTimerProps) {
  const remaining = timerRemainingMs(timer, now)
  return <div className={timer.status === 'finished' ? 'cooking-timer finished' : 'cooking-timer'}>
    <button className="timer-remove" onClick={onRemove} aria-label={`取消${timer.label}计时`} title="取消计时"><X /></button>
    <div><span>{timer.status === 'finished' ? '计时结束' : timer.label}</span><strong>{formatCountdown(remaining)}</strong></div>
    <div className="timer-actions">
      {timer.status === 'running' && <button onClick={onPause}><Pause />暂停</button>}
      {timer.status === 'paused' && <button onClick={onResume}><Play />继续</button>}
      <button className="timer-reset" onClick={onReset}><RotateCcw />重置</button>
    </div>
  </div>
}
