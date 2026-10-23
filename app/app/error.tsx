'use client'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      background: '#f4ede1',
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    }}>
      <div style={{ fontSize: 22, fontStyle: 'italic', color: '#2a1506', marginBottom: 12 }}>
        Something went wrong
      </div>
      <p style={{ fontSize: 13, color: '#a08568', marginBottom: 28, textAlign: 'center', maxWidth: 300, lineHeight: 1.6 }}>
        We hit an unexpected error. Try again or head back to your schedule.
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={reset}
          style={{
            fontSize: 10, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase',
            color: '#f4ede1', background: '#2a1506', border: 'none',
            padding: '12px 24px', cursor: 'pointer',
          }}
        >
          Try again
        </button>
        <a
          href="/app"
          style={{
            fontSize: 10, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase',
            color: '#2a1506', background: 'none', border: '1px solid #d8ccba',
            padding: '12px 24px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
          }}
        >
          Back to schedule
        </a>
      </div>
    </div>
  )
}
