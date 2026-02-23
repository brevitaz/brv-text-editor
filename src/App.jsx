import { useState } from 'react'
import RichTextEditor, { createTheme } from './components/RichTextEditor'
import RichTextPreview from './components/RichTextPreview'

const DEMO_CONTENT = `<h2>Grow organic revenue by 40%</h2><p>Our primary goal is to expand <strong>MRR from organic search and content</strong> while reducing dependency on paid acquisition channels.</p><ul><li>Launch SEO-optimised landing pages for all 12 product verticals</li><li>Publish 4 long-form thought-leadership articles per month</li><li>Improve average keyword ranking from position 18 → 9</li></ul><p>Success will be measured via <em>attribution-adjusted pipeline</em> against the organic channel.</p>`

const AUTHOR = { name: 'Vishal Shukla', initials: 'VS', avatarColor: '#065666' }

// Demo of a custom purple theme built using createTheme()
const purpleTheme = createTheme({
  '--rte-color-primary':       '#7c3aed',
  '--rte-btn-active-bg':       '#ede9fe',
  '--rte-btn-active-color':    '#7c3aed',
  '--rte-color-primary-hover': '#faf5ff',
  '--rte-focus-border':        '#a78bfa',
  '--rte-focus-ring':          'rgba(124, 58, 237, 0.18)',
  '--rte-blockquote-border':   '#a78bfa',
  '--rte-checkbox-accent':     '#7c3aed',
  '--rte-selection-bg':        '#ede9fe',
})

// ─── Sidebar navigation mock ───────────────────────────────────────────────────
function Sidebar() {
  const items = [
    { icon: '◎', label: 'OKR Dashboard',   active: false },
    { icon: '◈', label: 'Manage OKRs',     active: true  },
    { icon: '◷', label: 'Check-ins',       active: false },
    { icon: '◑', label: 'Analytics',       active: false },
    { icon: '◧', label: 'Team Members',    active: false },
    { icon: '◫', label: 'Settings',        active: false },
  ]

  return (
    <aside
      style={{
        width: 220,
        minWidth: 220,
        background: '#fff',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0 24px',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div style={{ padding: '0 20px 28px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: '#065666',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          U
        </div>
        <span style={{ fontWeight: 700, fontSize: 15, color: '#1a202c', letterSpacing: '-0.01em' }}>
          UnleashTeams
        </span>
      </div>

      {/* Nav items */}
      <nav>
        {items.map(item => (
          <div
            key={item.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 20px',
              margin: '1px 8px',
              borderRadius: 6,
              background: item.active ? '#f0fbff' : 'transparent',
              color: item.active ? '#065666' : '#718096',
              fontWeight: item.active ? 600 : 400,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'background 0.1s',
            }}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
          </div>
        ))}
      </nav>
    </aside>
  )
}

// ─── OKR Card header ──────────────────────────────────────────────────────────
function OkrMeta() {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 10,
        padding: '20px 24px',
        marginBottom: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span
          style={{
            background: '#c4f1f9',
            color: '#065666',
            fontSize: 11,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 20,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          Q1 2025
        </span>
        <span style={{ color: '#718096', fontSize: 13 }}>Company OKR</span>
      </div>
      <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: '#1a202c' }}>
        Accelerate Product-Led Growth
      </h2>
      <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#718096' }}>
        <span>Owner: <strong style={{ color: '#1a202c' }}>Vishal Shukla</strong></span>
        <span>·</span>
        <span>Progress: <strong style={{ color: '#065666' }}>62%</strong></span>
        <span>·</span>
        <span>Status: <span style={{ color: '#2f855a', fontWeight: 600 }}>On Track</span></span>
      </div>
    </div>
  )
}

// ─── Section heading ──────────────────────────────────────────────────────────
function SectionHeading({ children, badge }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {children}
      </h3>
      {badge && (
        <span style={{ background: '#c4f1f9', color: '#065666', fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 20 }}>
          {badge}
        </span>
      )}
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [savedNotes, setSavedNotes]         = useState([])
  const [activeTheme, setActiveTheme]       = useState('unleashteams')

  const handleSubmit = html => {
    const now = new Date()
    const timestamp = now.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    })
    setSavedNotes(prev => [{ id: Date.now(), html, timestamp }, ...prev])
  }

  const dismissNote = id => setSavedNotes(prev => prev.filter(n => n.id !== id))

  const themeOptions = [
    { key: 'unleashteams', label: 'UnleashTeams', color: '#065666' },
    { key: 'classic',      label: 'Classic',      color: '#1a6b3c' },
    { key: 'purple',       label: 'Purple',       color: '#7c3aed' },
  ]

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f0f4f8',
        display: 'flex',
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <Sidebar />

      {/* Main content */}
      <main style={{ flex: 1, padding: '32px 40px', minWidth: 0 }}>
        {/* Page header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#1a202c' }}>
            Manage OKRs
          </h1>
          <p style={{ margin: 0, color: '#718096', fontSize: 14 }}>
            Track and update your objectives and key results
          </p>
        </div>

        <OkrMeta />

        <div style={{ maxWidth: 760 }}>

          {/* Theme switcher */}
          <div style={{ marginBottom: 20 }}>
            <SectionHeading badge="Demo">Editor Theme</SectionHeading>
            <div style={{ display: 'flex', gap: 8 }}>
              {themeOptions.map(t => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTheme(t.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '6px 14px',
                    border: `1px solid ${activeTheme === t.key ? t.color : '#e2e8f0'}`,
                    borderRadius: 6,
                    background: activeTheme === t.key ? `${t.color}15` : '#fff',
                    color: activeTheme === t.key ? t.color : '#718096',
                    fontSize: 13,
                    fontWeight: activeTheme === t.key ? 600 : 400,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Editor card */}
          <div
            style={{
              background: '#fff',
              borderRadius: 10,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.03)',
              overflow: 'hidden',
              border: '1px solid #e2e8f0',
            }}
          >
            {/* Card header */}
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: '#065666',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#fff',
                  flexShrink: 0,
                }}
              >
                VS
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1a202c', lineHeight: 1.3 }}>
                  Vishal Shukla
                </div>
                <div style={{ fontSize: 11, color: '#a0aec0' }}>Add a description or comment…</div>
              </div>
            </div>

            {/* Editor */}
            <RichTextEditor
              initialContent={DEMO_CONTENT}
              placeholder="Describe this OKR…"
              onSubmit={handleSubmit}
              submitLabel="Save"
              showActions={true}
              minHeight={180}
              autofocus={false}
              theme={activeTheme === 'purple' ? 'unleashteams' : activeTheme}
              themeVars={activeTheme === 'purple' ? purpleTheme : {}}
            />
          </div>

          {/* Saved note previews */}
          {savedNotes.map(note => (
            <RichTextPreview
              key={note.id}
              html={note.html}
              author={AUTHOR}
              timestamp={note.timestamp}
              onDismiss={() => dismissNote(note.id)}
              theme={activeTheme === 'purple' ? 'unleashteams' : activeTheme}
              themeVars={activeTheme === 'purple' ? purpleTheme : {}}
            />
          ))}

          {/* Theming guide */}
          <div
            style={{
              marginTop: 32,
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              padding: '20px 24px',
            }}
          >
            <SectionHeading>Theming guide</SectionHeading>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: '#718096', lineHeight: 1.6 }}>
              Every color, font, border, and spacing value is driven by a CSS custom property. Override them at any scope — globally, per-page, or per-instance.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { method: 'theme prop',    code: '<RichTextEditor theme="classic" />' },
                { method: 'themeVars prop', code: '<RichTextEditor themeVars={{ "--rte-color-primary": "#7c3aed" }} />' },
                { method: 'CSS class',      code: '.my-scope { --rte-color-primary: #7c3aed; }' },
                { method: 'createTheme()',  code: 'const t = createTheme({ ... })\n<RichTextEditor themeVars={t} />' },
              ].map(({ method, code }) => (
                <div key={method} style={{ background: '#f7fafc', borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#065666', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{method}</div>
                  <pre style={{ margin: 0, fontSize: 11, fontFamily: "'SFMono-Regular', Consolas, monospace", color: '#2d3748', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                    {code}
                  </pre>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
