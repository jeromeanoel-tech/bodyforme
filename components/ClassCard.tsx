'use client'

import { useState } from 'react'
import Link from 'next/link'

type ClassType = {
  slug: string
  name: string
  nameItalic?: string
  tags?: string[]
  desc: string
  duration?: string
  level?: string
}

export default function ClassCard({ cls, index }: { cls: ClassType; index: number }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      href="/classes"
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: hovered ? 'var(--esp)' : 'var(--canvas)',
          padding: '36px 30px 40px',
          cursor: 'pointer',
          transition: 'background .3s ease',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '11px', color: hovered ? 'rgba(244,237,225,.3)' : 'var(--muted)', marginBottom: '24px', transition: 'color .3s' }}>
          0{index + 1}
        </div>
        <h3 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '28px', fontWeight: 400, color: hovered ? 'rgba(244,237,225,1)' : 'var(--esp)', lineHeight: 1.1, marginBottom: '14px', transition: 'color .3s' }}>
          {cls.name}{' '}
          {cls.nameItalic && (
            <em style={{ fontStyle: 'italic', fontWeight: 300, color: hovered ? 'rgba(196,168,130,.9)' : 'var(--brown)', transition: 'color .3s' }}>
              {cls.nameItalic}
            </em>
          )}
        </h3>
        {cls.tags && cls.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
            {cls.tags.map(tag => (
              <span
                key={tag}
                style={{
                  fontFamily: 'var(--font-dm-sans)',
                  fontSize: '8.5px',
                  letterSpacing: '.14em',
                  textTransform: 'uppercase',
                  color: hovered ? 'rgba(196,168,130,.7)' : 'var(--blt)',
                  fontWeight: 500,
                  transition: 'color .3s',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12.5px', fontWeight: 300, color: hovered ? 'rgba(244,237,225,.6)' : 'var(--mid)', lineHeight: 1.75, flex: 1, transition: 'color .3s' }}>
          {cls.desc}
        </p>
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: `1px solid ${hovered ? 'rgba(255,255,255,.08)' : 'var(--rule)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'border-color .3s' }}>
          <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '9px', letterSpacing: '.12em', textTransform: 'uppercase', color: hovered ? 'rgba(244,237,225,.4)' : 'var(--muted)', transition: 'color .3s' }}>
            {cls.duration ?? ''} · {cls.level ?? ''}
          </span>
          <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '9px', letterSpacing: '.12em', textTransform: 'uppercase', color: hovered ? 'rgba(196,168,130,.8)' : 'var(--brown)', transition: 'color .3s' }}>
            Book →
          </span>
        </div>
      </div>
    </Link>
  )
}
