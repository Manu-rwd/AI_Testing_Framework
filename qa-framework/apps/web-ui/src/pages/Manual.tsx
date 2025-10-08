import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import FilePicker from '../components/FilePicker'
import CaseList, { UIItem } from '../components/CaseList'

export default function Manual() {
  const [params] = useSearchParams()
  const mdPath = params.get('md') || ''
  const usPath = params.get('us') || ''
  const genPath = params.get('gen') || mdPath
  const [items, setItems] = useState<UIItem[]>([])
  const [qaPath, setQaPath] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<{ pct: number; text: string } | null>(null)

  useEffect(() => {
    ;(async () => {
      if (!mdPath) return
      const res = await fetch(`/api/manual?path=${encodeURIComponent(mdPath)}`)
      const json = await res.json()
      if (json.ok) setItems(json.items.map((x: any) => ({ ...x, selected: false })))
    })()
  }, [mdPath])

  const allSelected = useMemo(() => items.length > 0 && items.every(i => i.selected), [items])
  const toggleAll = (v: boolean) => setItems(prev => prev.map(i => ({ ...i, selected: v })))
  const toggleOne = (id: string, v: boolean) => setItems(prev => prev.map(i => (i.id === id ? { ...i, selected: v } : i)))

  async function doRefine(requireGold: boolean) {
    setBusy(true)
    try {
      setProgress({ pct: 10, text: 'Preparing inputs…' })
      const body: any = { usPath, genPath, tip: 'Vizualizare', module: 'Documente' }
      if (qaPath) body.goldPath = qaPath
      if (requireGold && !qaPath) throw new Error('QA gold required')
      setProgress({ pct: 35, text: 'Starting refine…' })
      const res = await fetch('/api/refine', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      setProgress({ pct: 65, text: 'Waiting for results…' })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || 'Refine failed')
      setProgress({ pct: 85, text: 'Parsing manual…' })
      const outMd = json.out?.md
      if (outMd) {
        const m = await fetch(`/api/manual?path=${encodeURIComponent(outMd)}`).then(r => r.json())
        if (m.ok) setItems(m.items.map((x: any) => ({ ...x, selected: false })))
      }
      setProgress({ pct: 100, text: 'Done' })
    } catch (e) {
      console.error(e)
    } finally {
      setTimeout(() => setProgress(null), 600)
      setBusy(false)
    }
  }

  async function exportSelected(format: 'md' | 'txt') {
    const res = await fetch('/api/export', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items, format }) })
    const json = await res.json()
    if (json.ok) alert(`Exported: ${json.path}`)
  }

  async function exit() {
    window.location.href = '/'
  }

  return (
    <div>
      <h2>Manual</h2>
      {progress && (
        <div style={{ margin: '8px 0', background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: 8, width: `${Math.max(0, Math.min(100, progress.pct))}%`, background: '#3b82f6', transition: 'width 300ms ease' }} />
          <div style={{ fontSize: 12, color: '#444', paddingTop: 6 }}>{progress.text}</div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 12 }}>
        <FilePicker label="QA gold (.txt/.md)" accept=".txt,.md" onPath={p => setQaPath(p)} />
        <button onClick={() => doRefine(true)} disabled={busy || !qaPath}>Compare with QA</button>
        <button onClick={() => doRefine(false)} disabled={busy}>Refine</button>
        <a href={`/api/file?path=${encodeURIComponent(mdPath)}`} target="_blank" rel="noreferrer">Open refined manual</a>
        <button onClick={() => exportSelected('md')}>Export .md</button>
        <button onClick={() => exportSelected('txt')}>Export .txt</button>
        <button onClick={exit}>Exit</button>
      </div>
      <CaseList items={items} allSelected={allSelected} onToggleAll={toggleAll} onToggleOne={toggleOne} />
    </div>
  )
}


