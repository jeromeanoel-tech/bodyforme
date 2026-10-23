'use client'

export default function TabsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      background: '#fdfaf6',
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    }}>
      <div style={{ fontSize: 20, fontStyle: 'italic', color: '#6b4e36', marginBottom: 12 }}>
        Couldn&apos;t load this page
      </div>
      <p style={{ fontSize: 12, color: '#a08568', marginBottom: 24, textAlign: 'center', maxWidth: 280, lineHeight: 1.6 }}>
        Check your connection and try again.
      </p>
      <button
        onClick={reset}
        style={{
          fontSize: 10, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase',
          color: '#7a4a2a', background: 'none', border: '1px solid #7a4a2a',
          padding: '10px 20px', cursor: 'pointer',
        }}
      >
        Try again
      </button>
    </div>
  )
}
