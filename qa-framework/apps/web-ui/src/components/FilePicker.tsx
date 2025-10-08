import { useRef, useState } from 'react'

type Props = {
  label: string
  accept?: string
  onPath: (absolutePath: string) => void
}

export default function FilePicker({ label, accept, onPath }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')

  async function onChange() {
    const file = inputRef.current?.files?.[0]
    if (!file) return
    setName(file.name)
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/us', { method: 'POST', body: form })
    const json = await res.json()
    if (json.ok && json.path) onPath(json.path)
  }

  function triggerPick() {
    inputRef.current?.click()
  }

  return (
    <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
      <span>{label}</span>
      <button type="button" onClick={triggerPick}>Choose…</button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onChange}
        style={{ display: 'none' }}
      />
      {name ? <span>({name})</span> : null}
    </div>
  )
}


