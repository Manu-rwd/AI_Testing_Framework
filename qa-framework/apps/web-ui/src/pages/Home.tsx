import { useState } from 'react'
import FilePicker from '../components/FilePicker'

export default function Home() {
  const [apiKey, setApiKey] = useState('')
  const [usPath, setUsPath] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [learnProgress, setLearnProgress] = useState<{ pct: number; text: string } | null>(null)
  const [lastReport, setLastReport] = useState<string | null>(null)
  const [learnBusy, setLearnBusy] = useState(false)
  const [qaLearnPath, setQaLearnPath] = useState<string | null>(null)

  async function saveKey() {
    setBusy(true)
    try {
      await fetch('/api/config/api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      })
      setMessage('API key saved')
    } catch (e) {
      setMessage(String(e))
    } finally {
      setBusy(false)
    }
  }

  async function generate() {
    setBusy(true)
    try {
      let absUsPath = usPath
      if ((window as any).File && usPath && usPath.startsWith('upload://')) {
        absUsPath = usPath.replace('upload://', '')
      }
      const genRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usPath: absUsPath }),
      }).then(r => r.json())
      if (!genRes.ok) throw new Error(genRes.error || 'Generate failed')
      const manualPath = genRes.manualPath
      const qp = new URLSearchParams({ md: manualPath, us: absUsPath || '', gen: manualPath || '' })
      window.location.href = `/manual?${qp.toString()}`
    } catch (e) {
      setMessage(String(e))
    } finally {
      setBusy(false)
    }
  }

  async function exitApp() {
    await fetch('/api/exit', { method: 'POST' })
    window.location.href = '/'
  }

  async function learnAndImprove() {
    if (!usPath || !qaLearnPath) return
    setLearnBusy(true)
    setLearnProgress({ pct: 10, text: 'Starting learn & improve…' })
    try {
      const body = new FormData()
      body.append('usPath', usPath)
      body.append('qaPath', qaLearnPath)
      body.append('train', 'true')
      setLearnProgress({ pct: 35, text: 'Generating baseline…' })
      const res = await fetch('/api/learn-improve', { method: 'POST', body })
      setLearnProgress({ pct: 75, text: 'Computing diff & writing report…' })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || 'Learn & improve failed')
      setLearnProgress({ pct: 100, text: 'Done' })
      setMessage(`Report written: ${json.report}`)
      setLastReport(json.report)
    } catch (e) {
      setLearnProgress({ pct: 100, text: 'Failed' })
      setMessage(String(e))
    } finally {
      setLearnBusy(false)
      setTimeout(() => setLearnProgress(null), 800)
    }
  }

  return (
    <div>
      <h2>Home</h2>
      <div style={{ display: 'grid', gap: 12, maxWidth: 520 }}>
        <label>
          OpenAI API Key
          <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} style={{ width: '100%' }} />
        </label>
        <button onClick={saveKey} disabled={busy || !apiKey}>Save key</button>

        <div>
          <FilePicker label="US file (.txt/.md)" accept=".txt,.md" onPath={p => setUsPath(p)} />
        </div>

        <div>
          <FilePicker label="QA manual (for learn & improve)" accept=".txt,.md" onPath={p => setQaLearnPath(p)} />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={generate} disabled={busy || !usPath}>Generate initial test cases</button>
          <button onClick={learnAndImprove} disabled={learnBusy || !usPath || !qaLearnPath}>Learn and improve</button>
          <button onClick={exitApp}>Exit</button>
        </div>
        {lastReport && (
          <div style={{ marginTop: 8 }}>
            <a href={`/api/file?path=${encodeURIComponent(lastReport)}`} target="_blank" rel="noreferrer">Open last report</a>
          </div>
        )}
        {learnProgress && (
          <div style={{ marginTop: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: 8, width: `${Math.max(0, Math.min(100, learnProgress.pct))}%`, background: '#22c55e', transition: 'width 300ms ease' }} />
            <div style={{ fontSize: 12, color: '#444', paddingTop: 6 }}>{learnProgress.text}</div>
          </div>
        )}
        {message && <div>{message}</div>}
      </div>
    </div>
  )
}


