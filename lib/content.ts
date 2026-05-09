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
  tagline:     'Hot Yoga & Hot Pilates. Doncaster.',
  description: 'A complete approach to movement — combining hot yoga and hot mat Pilates to build strength, mobility and balance in one boutique space in Doncaster, Melbourne.',
  address:     '132 Ayr Street, Doncaster VIC 3108',
  phone:       '(03) 9000 0000',          // ← update with real number
  email:       'hello@bodyforme.com.au',
  instagram:   '@bodyforme',              // ← update with real handle
  facebook:    'BodyForme',
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
    heading: 'Movement that finds',
    headingItalic: 'your form',
    body:    'BODYFORME combines hot yoga and hot mat Pilates to build both strength and mobility in one space. Every class is designed around form — not performance. You move at your own pace and progress on your terms.',
    cta1:    'Book a free trial',
    cta2:    'View the schedule',
    stat1:   { value: 'Hot',     label: 'Yoga & Pilates' },
    stat2:   { value: 'Small',   label: 'Group sizes' },
    quote:   'At BODYFORME, movement is personal.',
  },

  ticker: [
    'Hot Pilates',
    'AAA',
    'Bikram 90 Min',
    'Bikram Express',
    'Hot HIIT',
    'Special Forces',
    'Tabata',
    'Yin Yoga',
    'All Levels Welcome',
  ],

  classesSection: {
    eyebrow: 'What we offer',
    heading: 'Classes for every',
    headingItalic: 'body',
    intro:   'Hot yoga and hot Pilates under one roof. Whether you\'re brand new to movement or an experienced practitioner, our timetable has a class for where you are right now.',
  },

  benefitsSection: {
    eyebrow:  'Why BodyForme',
    heading:  'Strength and mobility,',
    headingItalic: 'together',
    body1:    'Most studios offer one thing. BODYFORME offers a complete approach — combining hot yoga for flexibility, breath and mental clarity with hot mat Pilates for deep core strength, posture and controlled movement. The result is a balanced practice that supports real, sustainable results.',
    body2:    'Our focus is on form, not performance. Every class is designed to help you move better, feel stronger and progress at your own pace. With small group sizes, your instructor knows your name and where you are in your practice.',
    benefits: [
      'Strength and mobility in one practice',
      'Form-focused — not performance-driven',
      'All levels, every class',
      'Mental reset through heat and breath',
      'Small groups, personal attention',
    ],
  },

  philosophySection: {
    eyebrow:  'Our philosophy',
    pullQuote: '"At BODYFORME, movement is personal."',
    quoteAttr: 'Suzanne Harb — Founder',
    body:     'Our name says it all. "Body" for strength and wellbeing. "Forme" for shape, condition — and for you. Every practice is yours. We built BodyForme as a place to train consistently, reset mentally and build a body you can rely on.',
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
    slug:      'hot-pilates',
    name:      'Hot',
    nameItalic: 'Pilates',
    duration:  '45–60 min',
    level:     'All levels',
    tags:      ['Sculpt', 'Core', 'Burn'],
    color:     'rust',
    desc:      'A dynamic, low-impact workout in a heated room designed to sculpt, strengthen, and challenge your entire body. Expect core-focused sequences, controlled intensity, and a deep, effective burn — all levels welcome.',
    priceNote: 'Included in all memberships',
  },
  {
    slug:      'aaa',
    name:      'AAA',
    nameItalic: '(Arms Abs Ass)',
    duration:  '45–60 min',
    level:     'All levels',
    tags:      ['Arms', 'Abs', 'Glutes'],
    color:     'special',
    desc:      'A targeted, high-rep class dedicated to the three areas that get results — arms, abs and glutes. Expect functional strength work, controlled burns and a structured format that delivers every session.',
    priceNote: 'Included in all memberships',
  },
  {
    slug:      'bikram-90',
    name:      'Bikram',
    nameItalic: '90 Min',
    duration:  '90 min',
    level:     'All levels',
    tags:      ['Balance', 'Focus', 'Detox'],
    color:     'sage',
    desc:      'The full traditional Bikram sequence — 26 postures and 2 breathing exercises practiced in a heated room. Designed to systematically work every part of the body, improve flexibility and support detoxification. Go at your own pace.',
    priceNote: 'Included in all memberships',
  },
  {
    slug:      'bikram-express',
    name:      'Bikram',
    nameItalic: 'Express',
    duration:  '60 min',
    level:     'All levels',
    tags:      ['Flow', 'Focus', 'Flexibility'],
    color:     'sage',
    desc:      'A shorter version of the traditional Bikram sequence, delivering the same core benefits in a more time-efficient format. Perfect for those wanting a focused, effective practice without the full 90-minute commitment — all levels welcome.',
    priceNote: 'Included in all memberships',
  },
  {
    slug:      'hot-hiit',
    name:      'Hot',
    nameItalic: 'HIIT',
    duration:  '45 min',
    level:     'All levels',
    tags:      ['Intervals', 'Cardio', 'Power'],
    color:     'special',
    desc:      'High-intensity interval training in a heated studio. Short bursts of maximum effort followed by active recovery — designed to build cardiovascular fitness, burn calories and push your limits. Suitable for all levels.',
    priceNote: 'Included in all memberships',
  },
  {
    slug:      'special-forces',
    name:      'Special',
    nameItalic: 'Forces',
    duration:  '60 min',
    level:     'All levels',
    tags:      ['Strength', 'Endurance', 'Power'],
    color:     'barre',
    desc:      'A structured circuit-style workout combining strength and conditioning. Move through stations of timed exercises designed to challenge the entire body — functional, intense, and adaptable to all fitness levels.',
    priceNote: 'Included in all memberships',
  },
  {
    slug:      'tabata',
    name:      'Tabata',
    nameItalic: '',
    duration:  '60 min',
    level:     'All levels',
    tags:      ['Intervals', 'Burn', 'Conditioning'],
    color:     'rust',
    desc:      'Based on the Tabata protocol — 20 seconds of intense effort followed by 10 seconds of rest, repeated across multiple exercises. One of the most time-efficient formats for building fitness and burning calories. All levels welcome.',
    priceNote: 'Included in all memberships',
  },
  {
    slug:      'yin-yoga',
    name:      'Yin',
    nameItalic: 'Yoga',
    duration:  '60 min',
    level:     'All levels',
    tags:      ['Flexibility', 'Restoration', 'Calm'],
    color:     'sage',
    desc:      'A slow, meditative yoga practice where poses are held for extended periods to target deep connective tissue. Yin Yoga improves flexibility, supports recovery and provides a genuine mental reset — accessible and restorative for all levels.',
    priceNote: 'Included in all memberships',
  },
]

export const classesPage = {
  eyebrow: 'Weekly schedule',
  heading: 'Find your',
  headingItalic: 'class',
  desc:    'Hot yoga and hot Pilates, seven days a week. All levels welcome — book through the app or drop in.',
  stats: [
    { value: '20+', label: 'Classes per week' },
    { value: '8',   label: 'Class types' },
    { value: '12',  label: 'Max class size' },
  ],
  ctaHeading:   'Ready to find your form?',
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
      tag:      'Flexible',
      name:     '3 Per Week',
      planKey:  'weekly-3',
      tagline:  'Three classes a week — the ideal rhythm for building a consistent practice.',
      amount:   '$42',
      period:   '/ week',
      equiv:    '≈ $14 per class',
      featured: false,
      badge:    '',
      features: [
        '3 classes per week',
        'All class types',
        'Weekly direct debit',
        'Cancel with 7 days\' notice',
      ],
      crossedOut: [],
      cta:      'Get started',
    },
    {
      tag:      'Most popular',
      name:     '4 Per Week',
      planKey:  'weekly-4',
      tagline:  'Four classes a week — the most popular way to train consistently at BodyForme.',
      amount:   '$52',
      period:   '/ week',
      equiv:    '≈ $13 per class',
      featured: true,
      badge:    'Most popular',
      features: [
        '4 classes per week',
        'All class types',
        'Weekly direct debit',
        'Cancel with 7 days\' notice',
      ],
      crossedOut: [],
      cta:      'Get started',
    },
    {
      tag:      'Best value',
      name:     'Unlimited',
      planKey:  'weekly-unlimited',
      tagline:  'Unlimited classes for those who want to fully commit to their practice.',
      amount:   '$62',
      period:   '/ week',
      equiv:    'Unlimited — best value per class',
      featured: false,
      badge:    '',
      features: [
        'Unlimited classes',
        'All class types',
        'Weekly direct debit',
        'Cancel with 7 days\' notice',
      ],
      crossedOut: [],
      cta:      'Get started',
    },
  ],

  packs: [
    { name: 'Casual Class',      planKey: 'casual',    price: '$32',    detail: 'Single drop-in, any class type' },
    { name: '3 Day Pass',        planKey: '3day-pass', price: '$39',    detail: '3 classes within 7 days' },
    { name: '10 Class Pass',     planKey: '10pack',    price: '$250',   detail: '$25 per class' },
    { name: '20 Class Pass',     planKey: '20pack',    price: '$475',   detail: '$23.75 per class' },
    { name: '50 Class Pass',     planKey: '50pack',    price: '$999',   detail: '~$20 per class' },
    { name: '3 Month Unlimited', planKey: '3month',    price: '$720',   detail: 'Unlimited for 3 months · $240/mo' },
    { name: '6 Month Unlimited', planKey: '6month',    price: '$1,199', detail: 'Unlimited for 6 months · ~$200/mo' },
    { name: '1 Year Unlimited',  planKey: '12month',   price: '$2,199', detail: 'Unlimited for 12 months · ~$183/mo' },
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
      a: 'Yes. All weekly direct debit memberships can be cancelled with 7 days\' notice — no fees, no questions. Prepaid memberships (3, 6 or 12 months) are non-refundable once purchased but run for the full period you paid for.',
    },
    {
      q: 'What happens if I miss a class?',
      a: 'For weekly memberships, unused classes in a week do not roll over. For class packs, your credits do not expire. We ask that cancellations are made at least 2 hours before class to avoid forfeiting the credit.',
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
    body:       'BODYFORME is a complete approach to movement — combining hot yoga and hot mat Pilates to build strength and mobility in one boutique space. We are new, and prouder of our community than anything else.',
    quote:      '"At BODYFORME, movement is personal."',
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
      'BODYFORME is different because it\'s not just a studio — it\'s a complete approach to movement. We combine hot yoga and hot mat Pilates to build both strength and mobility in one space, creating a balanced practice that supports real, sustainable results.',
      'Our focus is on form, not performance. Every class is designed to help you move better, feel stronger and progress at your own pace. With a boutique feel that\'s welcoming, structured and grounded, BODYFORME offers more than fitness — it\'s a place to train consistently, reset mentally and build a body you can rely on.',
      'Our name reflects our philosophy. "Body" for strength and wellbeing. "Forme" for shape, condition — and for you. Every practice is yours. On 24 April 2026, we opened our doors at 132 Ayr Street, Doncaster. More than a workout, BODYFORME is your space to reset, reconnect and grow.',
    ],
    signature: 'Suzanne Harb',
  },

  values: [
    { n: '01', title: 'Form over', titleItalic: 'performance', desc: 'We don\'t measure success in reps or speed. One movement done correctly is worth more than ten done carelessly. Form is the foundation everything else is built on.' },
    { n: '02', title: 'Your pace,', titleItalic: 'your progress', desc: 'Classes are designed for all levels. There is no pressure to keep up, push through pain or perform for the room. You move at the pace that\'s right for your body today.' },
    { n: '03', title: 'Heat as a', titleItalic: 'tool', desc: 'We use heat intentionally — to deepen stretching, build mental resilience and help the body work more efficiently. It\'s not a gimmick. It\'s part of the practice.' },
    { n: '04', title: 'The complete', titleItalic: 'picture', desc: 'Strength without mobility is fragile. Flexibility without control is unstable. The combination of hot yoga and Pilates addresses both — giving you a practice that\'s genuinely balanced.' },
    { n: '05', title: 'Reset and', titleItalic: 'reconnect', desc: 'We built BODYFORME to be a space where the outside world falls away. Every session is a chance to come back to your body, clear your head and leave feeling more yourself than when you walked in.' },
    { n: '06', title: 'Movement', titleItalic: 'is personal', desc: 'Every body is different. Every practice is different. What works for one person may not work for another, and that\'s not a problem — it\'s the whole point. We meet you where you are.' },
  ],

  instructors: [
    {
      name: 'Gabe',
      role: 'Bikram Yoga Instructor',
      bio: 'Gabriel has been teaching Bikram Yoga for over a decade — beginning in Paris, then Geneva, and now Melbourne. Trained in the traditional lineage by Bikram Choudury in 2014, Gabe teaches the pure, unmodified 26+2 series and sees it as a path to clarity, unity and personal change.',
      tags: ['Bikram 26+2'],
    },
    {
      name: 'Sammy',
      role: 'Pilates & Yoga Instructor',
      bio: 'Pilates and yoga instructor with 10 years of experience.',
      tags: ['Pilates', 'Yoga'],
    },
    {
      name: 'Mish Gubbels',
      role: 'Bikram & Pilates Instructor',
      bio: 'Mish has taught Bikram Yoga for 16 years after graduating in Las Vegas in 2010, and Pilates for 11 years (Core Plus trained). Expect energy from the moment you walk in reception — sprinkled with a lot of laughter as you work hard and sweat together.',
      tags: ['Bikram', 'Pilates'],
    },
    {
      name: 'Jodie',
      role: 'Mat Pilates Instructor',
      bio: 'Certified Mat Pilates Instructor with over a decade of Pilates and Bikram practice. Jodie brings a background in Nursing and Midwifery and a passion for body awareness, mental wellness and strength training to help her students live their best active lives.',
      tags: ['Mat Pilates', 'Bikram'],
    },
    {
      name: 'Steph',
      role: 'Yoga & Sculpt Instructor',
      bio: 'Steph discovered yoga at age 11 and never looked back. With a 200hr YTT and Sculpt Teacher Training (2019), her classes are supportive and energising — nurturing strength, balance and flexibility with good vibes throughout.',
      tags: ['Sculpt', 'Yoga'],
    },
    {
      name: 'Hilory',
      role: 'Pilates & Yoga Instructor',
      bio: 'A decade of Pilates and Yoga teaching — and Hilory brings energy to every single class. No matter your ability or experience level, expect a mix of strength, flow and a touch of cardio, all set to great tunes.',
      tags: ['Pilates', 'Yoga'],
    },
  ],

  gallery: [
    { label: 'The main studio' },
    { label: 'Reception' },
    { label: 'Change rooms' },
    { label: 'Reformer suite' },
    { label: 'The lounge' },
  ],

  timeline: [
    { year: 'Apr 2026', title: 'BodyForme opens', desc: 'Doors open at 132 Ayr Street, Doncaster. First classes run across Hot Yoga and Hot Mat Pilates.' },
    { year: 'May 2026', title: 'Free trial programme', desc: 'First class free for all new members — no credit card, no commitment.' },
    { year: '2026',     title: 'Growing the team', desc: 'Expanding the instructor team and class timetable across Reformer, Sculpt and beyond.' },
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

// ── Sign-up / checkout ────────────────────────────────────────────────────────

export const signupPolicy = {
  // ← Update this text when your Terms & Cancellation Policy are finalised
  checkboxText: 'I agree to BodyForme\'s Terms & Conditions and Cancellation Policy',
  policyLinkText: 'Terms & Conditions',
  policyHref:     '/terms',           // create this page when policy is ready
  cancelLinkText: 'Cancellation Policy',
  cancelHref:     '/cancellation',
  note: 'Weekly memberships are billed weekly via direct debit and can be cancelled with 7 days\' notice. Class pack credits do not expire.',
}

export const signupPlans: Record<string, {
  name: string
  tag: string
  amount: number              // AUD cents
  period: string
  description: string
  mode: 'subscription' | 'payment' | 'free'
  billingInterval?: 'week' | 'month'  // for subscriptions
  features: string[]
}> = {
  'weekly-3': {
    name:            '3 Classes Per Week',
    tag:             'Flexible',
    amount:          4200,
    period:          '$42 / week',
    description:     '3 classes per week. Weekly direct debit, cancel with 7 days\' notice.',
    mode:            'subscription',
    billingInterval: 'week',
    features:        ['3 classes per week', 'All class types', 'Weekly direct debit', 'Cancel with 7 days\' notice'],
  },
  'weekly-4': {
    name:            '4 Classes Per Week',
    tag:             'Most popular',
    amount:          5200,
    period:          '$52 / week',
    description:     '4 classes per week. Weekly direct debit, cancel with 7 days\' notice.',
    mode:            'subscription',
    billingInterval: 'week',
    features:        ['4 classes per week', 'All class types', 'Weekly direct debit', 'Cancel with 7 days\' notice'],
  },
  'weekly-unlimited': {
    name:            'Unlimited Classes',
    tag:             'Best value',
    amount:          6200,
    period:          '$62 / week',
    description:     'Unlimited classes. Weekly direct debit, cancel with 7 days\' notice.',
    mode:            'subscription',
    billingInterval: 'week',
    features:        ['Unlimited classes', 'All class types', 'Weekly direct debit', 'Cancel with 7 days\' notice'],
  },
  'casual': {
    name:        'Casual Class',
    tag:         'Drop-in',
    amount:      3200,
    period:      '$32 once',
    description: 'Single drop-in class, any class type.',
    mode:        'payment',
    features:    ['Any class type', 'No expiry', 'Book ahead or drop in'],
  },
  '3day-pass': {
    name:        '3 Day Pass',
    tag:         'Short stay',
    amount:      3900,
    period:      '$39 once',
    description: '3 classes within 7 days, any class type.',
    mode:        'payment',
    features:    ['3 classes', '7 day expiry', 'Any class type'],
  },
  '10pack': {
    name:        '10 Class Pass',
    tag:         'Popular',
    amount:      25000,
    period:      '$250 once',
    description: '10 classes at $25 per class.',
    mode:        'payment',
    features:    ['10 classes', '$25 per class', 'Any class type', 'No expiry'],
  },
  '20pack': {
    name:        '20 Class Pass',
    tag:         'Great value',
    amount:      47500,
    period:      '$475 once',
    description: '20 classes at $23.75 per class.',
    mode:        'payment',
    features:    ['20 classes', '$23.75 per class', 'Any class type', 'No expiry'],
  },
  '50pack': {
    name:        '50 Class Pass',
    tag:         'Best pass value',
    amount:      99900,
    period:      '$999 once',
    description: '50 classes at ~$20 per class.',
    mode:        'payment',
    features:    ['50 classes', '~$20 per class', 'Any class type', 'No expiry'],
  },
  '3month': {
    name:        '3 Month Unlimited',
    tag:         'Prepaid',
    amount:      72000,
    period:      '$720 once',
    description: 'Unlimited classes for 3 months. Equivalent to $240/month.',
    mode:        'payment',
    features:    ['Unlimited classes for 3 months', 'All class types', '$240 / month equivalent'],
  },
  '6month': {
    name:        '6 Month Unlimited',
    tag:         'Prepaid',
    amount:      119900,
    period:      '$1,199 once',
    description: 'Unlimited classes for 6 months. Equivalent to ~$200/month.',
    mode:        'payment',
    features:    ['Unlimited classes for 6 months', 'All class types', '~$200 / month equivalent'],
  },
  '12month': {
    name:        '1 Year Unlimited',
    tag:         'Best prepaid value',
    amount:      219900,
    period:      '$2,199 once',
    description: 'Unlimited classes for 12 months. Equivalent to ~$183/month.',
    mode:        'payment',
    features:    ['Unlimited classes for 12 months', 'All class types', '~$183 / month equivalent'],
  },
  'free-trial': {
    name:        'Free Trial Class',
    tag:         'New members',
    amount:      0,
    period:      'Free — no card needed',
    description: 'Your first class at BodyForme, completely free. New members only.',
    mode:        'free',
    features:    ['Any class type', 'New members only', 'No credit card required'],
  },
}
