import { Outlet, Link } from 'react-router-dom'

export default function App() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 16 }}>
      <nav style={{ marginBottom: 16 }}>
        <Link to="/">Home</Link>
      </nav>
      <Outlet />
    </div>
  )
}


