export type UIItem = {
  id: string
  bucket: string
  narrative: string
  facets: string[]
  selected: boolean
}

type Props = {
  items: UIItem[]
  allSelected: boolean
  onToggleAll: (value: boolean) => void
  onToggleOne: (id: string, value: boolean) => void
}

export default function CaseList({ items, allSelected, onToggleAll, onToggleOne }: Props) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, background: '#f4f4f4' }}>
        <input type="checkbox" checked={allSelected} onChange={e => onToggleAll(e.target.checked)} />
        <strong>Select all</strong>
      </div>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {items.map((i, idx) => (
          <li key={i.id} style={{ padding: 8, borderBottom: '1px solid #e5e5e5', display: 'flex', gap: 8 }}>
            <input type="checkbox" checked={i.selected} onChange={e => onToggleOne(i.id, e.target.checked)} />
            <span style={{ width: 32, textAlign: 'right', color: '#555' }}>{String(idx + 1).padStart(2, '0')}.</span>
            <span style={{ minWidth: 120, fontWeight: 600 }}>[{i.bucket}]</span>
            <span style={{ flex: 1 }}>{i.narrative}</span>
            {i.facets.length ? <em style={{ color: '#666' }}>{i.facets.join(', ')}</em> : null}
          </li>
        ))}
      </ul>
    </div>
  )
}


