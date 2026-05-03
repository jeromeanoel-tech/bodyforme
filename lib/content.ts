/**
 * BODYFORME SITE CONTENT
 * ─────────────────────────────────────────────
 * Edit this file to update text across the website.
 * No coding knowledge needed — just change the strings in quotes.
 * After saving, your site will update on the next deploy.
 */

// ── Studio details ──────────────────────────────────────────────────────────

export const studio = {
  name:        'BodyForme',
  tagline:     'Precision Pilates. Doncaster.',
  description: 'Premium Pilates studio in Doncaster, Melbourne — Mat, Reformer and Barre classes for every level.',
  address:     '132 Ayr Street, Doncaster VIC 3108',
  phone:       '(03) 9000 0000',          // ← update with real number
  email:       'hello@bodyforme.com.au',
  instagram:   '@bodyforme.pilates',       // ← update with real handle
  facebook:    'BodyForme Pilates',
  // Wix booking page — replace with your actual Wix booking URL
  bookingUrl:  'https://www.bodyforme.com.au/book-online',
  founded:     '24 April 2026',
  founderName: 'Suzanne Harb',
}

// ── Opening hours ────────────────────────────────────────────────────────────

export const hours = [
  { day: 'Monday',    open: '6:00 am', close: '8:00 pm' },
  { day: 'Tuesday',   open: '6:00 am', close: '8:00 pm' },
  { day: 'Wednesday', open: '6:00 am', close: '8:00 pm' },
  { day: 'Thursday',  open: '6:00 am', close: '8:00 pm' },
  { day: 'Friday',    open: '6:00 am', close: '7:00 pm' },
  { day: 'Saturday',  open: '7:00 am', close: '2:00 pm' },
  { day: 'Sunday',    open: '8:00 am', close: '12:00 pm' },
]

// ── Announcement bar (shows at the top of every page) ────────────────────────

export const announce = {
  text:    'New members — first class free when you join before 30 June 2026',
  linkText: 'Book now',
  linkHref: '/free-trial',
}

// ── Homepage ─────────────────────────────────────────────────────────────────

export const home = {
  hero: {
    eyebrow: 'Doncaster, Melbourne',
    heading: 'Where focus meets',
    headingItalic: 'form',
    body:    'BodyForme is Doncaster\'s dedicated Pilates studio — expert-led classes, small group sessions, and a community built around mindful, effective movement.',
    cta1:    'Book a free trial',
    cta2:    'View the schedule',
    stat1:   { value: '100%',    label: 'Expert-led classes' },
    stat2:   { value: 'Small',   label: 'Group sizes' },
    quote:   'Every session leaves you feeling stronger, taller, and more connected to your body.',
  },

  ticker: [
    'Mat Pilates',
    'Reformer Pilates',
    'Barre & Pilates',
    'Pilates Sculpt',
    'Beginners Welcome',
    'Expert Instructors',
    'Small Groups',
  ],

  classesSection: {
    eyebrow: 'What we offer',
    heading: 'Classes for every',
    headingItalic: 'level',
    intro:   'From complete beginners to experienced practitioners — our timetable has something for every body and every schedule.',
  },

  benefitsSection: {
    eyebrow:  'Why Pilates',
    heading:  'Movement that',
    headingItalic: 'transforms',
    body1:    'Pilates is one of the most effective and sustainable forms of exercise available. Unlike high-impact training, it builds strength, flexibility and postural alignment from the inside out — without wear and tear on your joints.',
    body2:    'Our classes are small by design. Every session, your instructor knows your name, your goals and where you are in your practice. That\'s the BodyForme difference.',
    benefits: [
      'Core strength and stability',
      'Improved posture and alignment',
      'Flexibility without injury risk',
      'Stress reduction and mental clarity',
      'Suitable for all fitness levels',
    ],
  },

  philosophySection: {
    eyebrow:  'Our philosophy',
    pullQuote: '"Pilates is not just about the body. It is about learning to inhabit it."',
    quoteAttr: 'Suzanne Harb — Founder',
    body:     'We built BodyForme around one belief: that precise, intentional movement creates lasting change. Every class is designed with progression in mind — so whether it\'s your first session or your hundredth, you leave feeling like you\'ve done something meaningful.',
    stats: [
      { value: '2026',  label: 'Founded' },
      { value: '< 12',  label: 'Students per class' },
      { value: '60',    label: 'Min avg class length' },
      { value: '100+',  label: 'Class types & levels' },
    ],
  },

  contactSection: {
    eyebrow: 'Find us',
    heading: 'Visit the',
    headingItalic: 'studio',
    body:    'We\'re in the heart of Doncaster, with easy parking on Ayr Street. Drop in any time during opening hours — we\'d love to show you around.',
    formHeading: 'Send a message',
  },
}

// ── Classes ──────────────────────────────────────────────────────────────────

export const classTypes = [
  {
    slug:     'mat-pilates',
    name:     'Mat Pilates',
    nameItalic: '',
    duration: '60 min',
    level:    'All levels',
    color:    'sage',          // sage green left border
    desc:     'The foundation of Pilates practice. Mat classes build deep core strength, improve posture and develop body awareness using only your own bodyweight and a mat. Perfect for all levels.',
    priceNote: 'Included in all memberships',
  },
  {
    slug:     'reformer-pilates',
    name:     'Reformer',
    nameItalic: 'Pilates',
    duration: '60 min',
    level:    'All levels',
    color:    'rust',          // warm rust left border
    desc:     'Our most popular class. The Reformer adds spring resistance to classical Pilates movements, creating a deeper challenge for strength and flexibility. Suitable for beginners to advanced.',
    priceNote: 'Included in all memberships',
  },
  {
    slug:     'barre-pilates',
    name:     'Barre &',
    nameItalic: 'Pilates',
    duration: '45 min',
    level:    'All levels',
    color:    'sculpt',        // slate blue
    desc:     'A fusion of ballet-inspired barre work and Pilates principles. Targets the glutes, thighs and core with small, controlled movements set to music. High energy, low impact.',
    priceNote: 'Included in all memberships',
  },
  {
    slug:     'sculpt',
    name:     'Pilates',
    nameItalic: 'Sculpt',
    duration: '45 min',
    level:    'Intermediate',
    color:    'special',       // sand
    desc:     'A more intense Pilates session designed to build lean muscle. Uses light weights and resistance bands alongside core Pilates sequences. Great for those looking to push further.',
    priceNote: 'Included in all memberships',
  },
]

export const classesPage = {
  eyebrow: 'Weekly schedule',
  heading: 'Find your',
  headingItalic: 'class',
  desc:    'Our timetable runs seven days a week. Book through the Wix app or drop in — we always have room for beginners.',
  stats: [
    { value: '20+', label: 'Classes per week' },
    { value: '4',   label: 'Class types' },
    { value: '12',  label: 'Max class size' },
  ],
  ctaHeading:   'Ready to start your practice?',
  ctaHeadingItalic: '',
  ctaBody:      'Your first class is free — no credit card, no commitment. Just show up and see how you feel.',
}

// ── Memberships ───────────────────────────────────────────────────────────────

export const memberships = {
  page: {
    eyebrow:    'No lock-in contracts · Cancel anytime',
    heading:    'Your practice,',
    headingItalic: 'your plan',
    desc:       'Every BodyForme membership comes with no joining fee, flexible pause options and a free trial class so you can feel the difference before you commit.',
    trust:      ['No joining fee', 'First class free', 'Pause anytime', 'Cancel anytime'],
  },

  trial: {
    heading:  'Try your first class — completely free',
    subtext:  'New members only. No credit card required. Valid for one class, any type.',
    ctaText:  'Book free trial',
  },

  plans: [
    {
      tag:      'Great value',
      name:     'Bronze',
      tagline:  'Build a consistent practice without committing to daily classes.',
      amount:   '$120',
      period:   '/ month',
      equiv:    '$30 per class',
      featured: false,
      badge:    '',
      features: [
        '4 classes per month',
        'All class types included',
        'Online booking',
        'Pause up to 4 weeks/year',
        'App access',
      ],
      crossedOut: ['Priority booking', 'Guest pass'],
      cta:      'Get started',
    },
    {
      tag:      'Most popular',
      name:     'Silver',
      tagline:  'Our most popular plan. Eight classes per month with priority booking access.',
      amount:   '$200',
      period:   '/ month',
      equiv:    '$25 per class',
      featured: true,
      badge:    'Most popular',
      features: [
        '8 classes per month',
        'All class types included',
        'Priority booking (72hr advance)',
        'Pause up to 8 weeks/year',
        'App access',
        '1 guest pass per month',
      ],
      crossedOut: [],
      cta:      'Get started',
    },
    {
      tag:      'Best value',
      name:     'Unlimited',
      tagline:  'For those who want to fully commit. Unlimited classes, best value per session.',
      amount:   '$260',
      period:   '/ month',
      equiv:    'Unlimited — best value',
      featured: false,
      badge:    '',
      features: [
        'Unlimited classes',
        'All class types included',
        'Priority booking (72hr advance)',
        'Pause up to 8 weeks/year',
        'App access',
        '2 guest passes per month',
      ],
      crossedOut: [],
      cta:      'Get started',
    },
  ],

  packs: [
    { name: 'Single class',  price: '$35',  detail: 'Drop-in, any class type' },
    { name: '5-class pack',  price: '$160', detail: '2-month expiry · $32/class' },
    { name: '10-class pack', price: '$300', detail: '3-month expiry · $30/class' },
    { name: 'Free trial',    price: '$0',   detail: 'First class, new members only' },
  ],

  howItWorks: [
    { step: '01', title: 'Choose your', titleItalic: 'plan', desc: 'Pick the membership that fits your schedule. Not sure? Start with a free trial class — no credit card required.' },
    { step: '02', title: 'Create your', titleItalic: 'account', desc: 'Sign up takes two minutes through the BodyForme app. Your schedule, booking history and credits are all in one place.' },
    { step: '03', title: 'Book your', titleItalic: 'class', desc: 'Browse the weekly timetable, book your spot and receive a confirmation. Arrive 10 minutes early for your first class.' },
    { step: '04', title: 'Feel the', titleItalic: 'difference', desc: 'Most students notice a significant change in how they feel within two weeks. The practice does its work — you just have to show up.' },
  ],

  testimonials: [
    { stars: 5, quote: 'I booked a free trial expecting nothing. Six months later I\'m on the Silver plan and Pilates has genuinely changed how I carry myself.', name: 'Claire M.', detail: 'Silver member' },
    { stars: 5, quote: 'The Bronze plan is perfect for my schedule. Four classes a month, no pressure, and the instructors remember my name every single time.', name: 'Tom R.', detail: 'Bronze member' },
    { stars: 5, quote: 'I travel for work so the class packs are ideal. Credits never expire and booking is seamless through the app.', name: 'Priya S.', detail: 'Class pack member' },
  ],

  faqs: [
    {
      q: 'Is the first class really free?',
      a: 'Yes — completely free, with no credit card required. New members only. You can attend any class type during your trial. Just book through the app or contact us directly.',
    },
    {
      q: 'Can I pause or cancel my membership?',
      a: 'Absolutely. Bronze members can pause for up to 4 weeks per year. Silver and Unlimited members can pause for up to 8 weeks. All memberships can be cancelled at any time with 7 days\' notice — no fees, no questions.',
    },
    {
      q: 'What happens if I miss a class?',
      a: 'For Bronze and Silver memberships, unused classes in a month do not roll over. For class packs, your credits never expire. We ask that cancellations are made at least 2 hours before class to avoid forfeiting the credit.',
    },
    {
      q: 'Do I need experience to join?',
      a: 'No experience is needed. All of our classes are suitable for complete beginners unless specifically marked otherwise. We recommend arriving 10 minutes early for your first class so our team can show you around.',
    },
    {
      q: 'Can I change my membership plan?',
      a: 'Yes. You can upgrade or downgrade at any time. Changes take effect at the start of your next billing cycle. Just contact us or make the change through the app.',
    },
    {
      q: 'What should I bring?',
      a: 'Comfortable workout clothes, a water bottle and grip socks (required for Reformer classes — available to buy at the studio). We have mats available for Mat classes.',
    },
  ],
}

// ── About ─────────────────────────────────────────────────────────────────────

export const about = {
  hero: {
    eyebrow:    'Est. 2026 — Doncaster, Melbourne',
    heading:    'More than a',
    headingItalic: 'studio',
    body:       'BodyForme was built on the belief that real transformation — physical, mental and emotional — happens in community. We are new, and prouder of our people than anything else.',
    quote:      '"We didn\'t build a gym. We built a place where people become who they are meant to be."',
    quoteAttr:  'Suzanne Harb — Founder',
    stats: [
      { value: '2026', label: 'Year founded' },
      { value: '< 12', label: 'Per class' },
      { value: '4',    label: 'Class types' },
    ],
  },

  founder: {
    eyebrow:   'Our story',
    heading:   'Born from a',
    headingItalic: 'practice',
    name:      'Suzanne Harb',
    role:      'Founder, BodyForme',
    paragraphs: [
      'Suzanne Harb discovered Pilates over a decade ago while recovering from a spinal injury. What began as rehabilitation became a practice that reshaped not just her body, but her entire relationship with movement and self-care.',
      'After years of training and teaching in studios across Melbourne, Suzanne recognised a gap: a studio focused purely on Pilates, built for the local Doncaster community, with small class sizes and genuinely expert instruction.',
      'On 24 April 2026, BodyForme opened its doors on Ayr Street. The studio was designed to feel like a home — warm, unhurried and free from the noise of a commercial gym. The community response was immediate.',
    ],
    signature: 'Suzanne Harb',
  },

  values: [
    { n: '01', title: 'Precision as', titleItalic: 'foundation', desc: 'We believe that doing one movement correctly is worth more than ten done carelessly. Precision is not perfectionism — it is the path to genuine progress.' },
    { n: '02', title: 'No', titleItalic: 'ego', desc: 'Everyone was a beginner once. We celebrate the person attempting their first roll-up as much as the person achieving their hundredth.' },
    { n: '03', title: 'Community', titleItalic: 'first', desc: 'We are not a transactional gym. We are a community. We remember names, celebrate milestones and show up for each other outside the studio.' },
    { n: '04', title: 'Honest', titleItalic: 'teaching', desc: 'Our instructors correct and challenge. They don\'t offer empty encouragement — they offer the kind of feedback that actually creates change.' },
    { n: '05', title: 'The long', titleItalic: 'game', desc: 'We build practices that last decades — because the benefits of consistent, mindful movement compound over a lifetime.' },
    { n: '06', title: 'Space to', titleItalic: 'fail', desc: 'Falling out of a movement is not failure. It\'s information. We create an environment where trying is always celebrated, regardless of outcome.' },
  ],

  instructors: [
    { name: 'Suzanne Harb',      role: 'Founder · Lead Instructor', bio: 'Pilates-certified with over 10 years of teaching experience. Suzanne\'s classes are known for their warmth, precision and deep anatomical knowledge.', tags: ['Mat Pilates', 'Reformer', 'Barre'] },
    { name: 'Coming soon',       role: 'Instructor',                 bio: 'We\'re building a team of exceptional instructors. Stay tuned for new class times and new faces.', tags: ['Reformer', 'Sculpt'] },
    { name: 'Coming soon',       role: 'Instructor',                 bio: 'We\'re building a team of exceptional instructors. Stay tuned for new class times and new faces.', tags: ['Mat Pilates', 'Barre'] },
    { name: 'Coming soon',       role: 'Instructor',                 bio: 'We\'re building a team of exceptional instructors. Stay tuned for new class times and new faces.', tags: ['Reformer', 'Sculpt'] },
  ],

  gallery: [
    { label: 'The main studio' },
    { label: 'Reception' },
    { label: 'Change rooms' },
    { label: 'Reformer suite' },
    { label: 'The lounge' },
  ],

  timeline: [
    { year: 'Apr 2026', title: 'BodyForme opens', desc: 'Doors open at 132 Ayr Street, Doncaster. First classes run across Mat Pilates and Reformer.' },
    { year: 'May 2026', title: 'Free trial programme', desc: 'Free trial week for all new members — no credit card, no commitment. Fifty students in the first month.' },
    { year: '2026',     title: 'Growing the team', desc: 'Expanding the instructor team and class timetable to meet demand across the Doncaster community.' },
  ],

  cta: {
    heading:       'Ready to start your',
    headingItalic: 'practice?',
    body:          'Your first class is free. Come in, meet the team and see how you feel. No commitment, no pressure.',
  },
}

// ── Contact ────────────────────────────────────────────────────────────────

export const contact = {
  hero: {
    eyebrow:    'Doncaster, Melbourne',
    heading:    'Come say',
    headingItalic: 'hello',
    desc:       'We\'d love to show you around, answer your questions, or simply have you in for a class. Drop in any time during opening hours.',
    details: [
      { label: 'Address', value: '132 Ayr Street\nDoncaster VIC 3108' },
      { label: 'Phone',   value: '(03) 9000 0000' },           // ← update
      { label: 'Email',   value: 'hello@bodyforme.com.au' },
      { label: 'Parking', value: 'Free street parking on Ayr Street and surrounding streets.' },
    ],
  },

  mapNote: 'Free parking available on Ayr Street.',

  form: {
    title:    'Send us a message',
    subtitle: 'We aim to respond within one business day.',
    subjects: [
      'General enquiry',
      'Memberships',
      'Class information',
      'Free trial',
      'Corporate & groups',
      'Other',
    ],
    success: {
      title: 'Message received',
      body:  'Thanks for reaching out. We\'ll be in touch within one business day.',
    },
  },

  social: [
    { name: 'Instagram', handle: '@bodyforme.pilates', icon: 'IG', href: '#' },
    { name: 'Facebook',  handle: 'BodyForme Pilates',  icon: 'FB', href: '#' },
  ],
}

// ── Free trial ────────────────────────────────────────────────────────────────

export const freeTrial = {
  heading:       'Your first class,',
  headingItalic: 'on us',
  body:          'New to Pilates or new to BodyForme? Your first class is completely free — no credit card required, no commitment.',
  steps: [
    { n: '01', title: 'Choose a class',     desc: 'Browse the timetable and pick a class that suits your schedule. Any class type is included in the free trial.' },
    { n: '02', title: 'Book your spot',     desc: 'Book through the link below. Select "Free Trial" when prompted. We\'ll confirm your booking within a few hours.' },
    { n: '03', title: 'Arrive early',       desc: 'Arrive 10 minutes before your class so our team can show you around, get you set up and answer any questions.' },
    { n: '04', title: 'Feel the practice',  desc: 'Experience a full class. After, we\'ll be on hand to talk through membership options — no pressure at all.' },
  ],
  whatToBring: 'Comfortable workout clothes, a water bottle and grip socks (available to purchase at the studio for $3).',
  ctaText: 'Book my free trial',
}
