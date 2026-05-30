import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getMemberByEmail } from '@/lib/db'
import { signSession, COOKIE_NAME, COOKIE_OPTIONS } from '@/lib/session'
import bcrypt from 'bcryptjs'

const T = {
  linen:  '#f4ede1',
  esp:    '#2a1506',
  brown:  '#7a4a2a',
  muted:  '#a08568',
  rule:   '#d8ccba',
  canvas: '#fdfaf6',
}

async function loginAction(formData: FormData) {
  'use server'
  const email    = ((formData.get('email')    as string) ?? '').toLowerCase().trim()
  const password =  (formData.get('password') as string) ?? ''
  const next     =  (formData.get('next')     as string) ?? '/app/schedule'

  if (!email || !password) redirect(`/app/login?error=missing`)

  const member = await getMemberByEmail(email)
  const valid  = member ? await bcrypt.compare(password, member.passwordHash) : false
  if (!member || !valid) redirect(`/app/login?error=invalid`)

  const token = await signSession({
    id:           member._id,
    email:        member.email,
    firstName:    member.firstName,
    lastName:     member.lastName,
    wixContactId: '',
  })

  const jar = await cookies()
  jar.set(COOKIE_NAME, token, COOKIE_OPTIONS)
  redirect(next)
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const errorMsg =
    error === 'invalid' ? 'Incorrect email or password' :
    error === 'missing' ? 'Please enter your email and password' :
    null

  const inp = 'width:100%;background:transparent;border:none;border-bottom:1px solid #d8ccba;padding:10px 0;font-family:"DM Sans",system-ui,sans-serif;font-size:15px;font-weight:300;color:#2a1506;outline:none;-webkit-appearance:none;'

  return (
    <div style={{
      minHeight:      '100dvh',
      background:     T.linen,
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '40px 32px',
      fontFamily:     "'DM Sans', system-ui, sans-serif",
    }}>
      <img src="/bodyformeBlogo.png" alt="BodyForme" style={{ height: 52, width: 'auto', marginBottom: 48 }} />

      <div style={{
        width:      '100%',
        maxWidth:   380,
        background: T.canvas,
        border:     `1px solid ${T.rule}`,
        padding:    '36px 28px',
      }}>
        <div style={{
          fontFamily:   "'Cormorant Garamond', 'Times New Roman', serif",
          fontSize:     26,
          fontWeight:   400,
          color:        T.esp,
          marginBottom: 6,
        }}>
          Member <em style={{ fontStyle: 'italic', fontWeight: 300, color: T.brown }}>sign in</em>
        </div>
        <div style={{
          fontSize:     13,
          fontWeight:   300,
          color:        T.muted,
          marginBottom: 32,
        }}>
          Sign in to book classes and manage your membership.
        </div>

        <form action={loginAction}>
          <div style={{ marginBottom: 24 }}>
            <label style={{
              fontSize:      9.5,
              fontWeight:    500,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color:         T.muted,
              display:       'block',
              marginBottom:  8,
            }}>Email</label>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: `1px solid ${T.rule}`, padding: '10px 0', fontFamily: 'inherit', fontSize: 15, fontWeight: 300, color: T.esp, outline: 'none', WebkitAppearance: 'none' } as React.CSSProperties}
            />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{
              fontSize:      9.5,
              fontWeight:    500,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color:         T.muted,
              display:       'block',
              marginBottom:  8,
            }}>Password</label>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: `1px solid ${T.rule}`, padding: '10px 0', fontFamily: 'inherit', fontSize: 15, fontWeight: 300, color: T.esp, outline: 'none', WebkitAppearance: 'none' } as React.CSSProperties}
            />
          </div>

          <div style={{ textAlign: 'right', marginBottom: 28, marginTop: 10 }}>
            <a href="/app/forgot-password" style={{
              fontSize:       12,
              fontWeight:     300,
              color:          T.muted,
              textDecoration: 'none',
              borderBottom:   `1px solid ${T.rule}`,
            }}>
              Forgot password?
            </a>
          </div>

          {errorMsg && (
            <div style={{
              padding:      '10px 14px',
              background:   '#fff5f5',
              border:       '1px solid #fcc',
              marginBottom: 20,
            }}>
              <p style={{ margin: 0, fontSize: 12, color: '#9a5a3a', fontFamily: 'inherit' }}>{errorMsg}</p>
            </div>
          )}

          <button
            type="submit"
            style={{
              width:         '100%',
              background:    T.esp,
              color:         T.linen,
              border:        'none',
              padding:       '15px 0',
              fontFamily:    'inherit',
              fontSize:      11,
              fontWeight:    500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              cursor:        'pointer',
            } as React.CSSProperties}
          >
            Sign in
          </button>
        </form>
      </div>

      <p style={{ marginTop: 24, fontSize: 12, color: T.muted, textAlign: 'center' }}>
        Don&apos;t have an account?{' '}
        <a href="/sign-up" style={{ color: T.brown, textDecoration: 'none', borderBottom: `1px solid ${T.brown}` }}>
          Sign up
        </a>
      </p>
    </div>
  )
}
