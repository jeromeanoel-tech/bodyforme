'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type ClassType = {
  slug: string
  name: string
  nameItalic?: string
  tags?: string[]
  desc: string
  priceNote?: string
}

const T = {
  esp:    'var(--esp)',
  brown:  'var(--brown)',
  linen:  'var(--linen)',
  muted:  'var(--muted)',
  mid:    'var(--mid)',
  rule:   'var(--rule)',
  blt:    'var(--blt)',
  canvas: 'var(--canvas)',
}

export default function ClassAccordion({ classes, bookingUrl }: { classes: ClassType[]; bookingUrl: string }) {
  const [open, setOpen] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 767)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  if (!isMobile) return null // desktop handled by server component

  return (
    <div style={{ border: '1px solid var(--rule)' }}>
      {classes.map((cls, i) => {
        const isOpen = open === cls.slug
        return (
          <div key={cls.slug} style={{ borderBottom: i < classes.length - 1 ? '1px solid var(--rule)' : 'none' }}>
            {/* Header row — always visible */}
            <button
              onClick={() => setOpen(isOpen ? null : cls.slug)}
              style={{
                width:          '100%',
                background:     'var(--linen)',
                border:         'none',
                padding:        '20px 24px',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'space-between',
                gap:            '16px',
                cursor:         'pointer',
                textAlign:      'left',
              }}
            >
              <div>
                <span style={{ fontSize: 10, letterSpacing: '.1em', color: T.muted, display: 'block', marginBottom: 4 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span style={{ fontFamily: "'Cormorant Garamond','Times New Roman',serif", fontSize: 24, fontWeight: 400, color: T.esp, lineHeight: 1.1 }}>
                  {cls.name}{cls.nameItalic && <> <em style={{ fontStyle: 'italic', fontWeight: 300 }}>{cls.nameItalic}</em></>}
                </span>
              </div>
              <span style={{ fontSize: 20, color: T.muted, flexShrink: 0, transition: 'transform .2s', display: 'block', transform: isOpen ? 'rotate(45deg)' : 'none' }}>+</span>
            </button>

            {/* Drawer content */}
            {isOpen && (
              <div style={{ background: 'var(--canvas)', padding: '24px 24px 32px', borderTop: '1px solid var(--rule)' }}>
                {cls.tags && cls.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    {cls.tags.map((tag, ti) => (
                      <span key={tag} style={{ fontSize: '9.5px', letterSpacing: '.12em', textTransform: 'uppercase', color: T.blt, fontWeight: 500 }}>
                        {ti > 0 && <span style={{ color: T.rule, marginRight: '8px' }}>·</span>}{tag}
                      </span>
                    ))}
                  </div>
                )}
                <p style={{ fontSize: 14, fontWeight: 300, color: T.mid, lineHeight: 1.75, margin: '0 0 24px' }}>{cls.desc}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '20px', borderTop: '1px solid var(--rule)' }}>
                  {cls.priceNote && (
                    <span style={{ fontFamily: "'Cormorant Garamond','Times New Roman',serif", fontSize: 18, fontWeight: 300, color: T.esp }}>
                      {cls.priceNote}
                    </span>
                  )}
                  <Link
                    href={bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '.14em', textTransform: 'uppercase', color: T.linen, background: T.esp, padding: '12px 24px', textDecoration: 'none' }}
                  >
                    Book class
                  </Link>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
