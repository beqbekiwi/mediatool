// ─── Plattformen ──────────────────────────────────────────────────────────────

export type Platform = 'facebook' | 'instagram' | 'linkedin' | 'tiktok'
export type ContentType = 'text' | 'image' | 'video' | 'reel' | 'story' | 'carousel'
export type PostStatus = 'draft' | 'review' | 'approved' | 'scheduled' | 'publishing' | 'published' | 'failed'
export type PostFormat = 'standard' | 'expert' | 'story' | 'list' | 'question' | 'promo' | 'faq' | 'behind-scenes'
export type PostStyle = 'professional' | 'casual' | 'emotional' | 'informative' | 'sales' | 'inspirational'
export type WorkspaceType = 'personal' | 'business'
export type AccountType = 'personal' | 'page' | 'business'

// ─── Labels ───────────────────────────────────────────────────────────────────

export const PLATFORM_LABELS: Record<Platform, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
}

export const PLATFORM_COLORS: Record<Platform, string> = {
  facebook: 'bg-blue-100 text-blue-700',
  instagram: 'bg-pink-100 text-pink-700',
  linkedin: 'bg-sky-100 text-sky-700',
  tiktok: 'bg-slate-100 text-slate-700',
}

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  text: 'Text-Post',
  image: 'Bild-Post',
  video: 'Video-Post',
  reel: 'Reel / Kurzvideo',
  story: 'Story',
  carousel: 'Carousel',
}

export const POST_STATUS_LABELS: Record<PostStatus, string> = {
  draft: 'Entwurf',
  review: 'In Prüfung',
  approved: 'Freigegeben',
  scheduled: 'Geplant',
  publishing: 'Wird veröffentlicht',
  published: 'Veröffentlicht',
  failed: 'Fehlgeschlagen',
}

export const POST_STATUS_COLORS: Record<PostStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  review: 'bg-amber-100 text-amber-700',
  approved: 'bg-teal-100 text-teal-700',
  scheduled: 'bg-blue-100 text-blue-700',
  publishing: 'bg-violet-100 text-violet-700',
  published: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
}

export const FORMAT_LABELS: Record<PostFormat, string> = {
  standard: 'Standard',
  expert: 'Expertenpost',
  story: 'Storytelling',
  list: 'Listenpost',
  question: 'Frage / Diskussion',
  promo: 'Angebot / Promo',
  faq: 'FAQ',
  'behind-scenes': 'Hinter den Kulissen',
}

export const STYLE_LABELS: Record<PostStyle, string> = {
  professional: 'Professionell',
  casual: 'Locker & Nahbar',
  emotional: 'Emotional',
  informative: 'Informativ & Sachlich',
  sales: 'Verkaufsorientiert',
  inspirational: 'Inspirierend',
}

export const TONALITY_LABELS: Record<string, string> = {
  professional: 'Professionell',
  friendly: 'Freundlich & Locker',
  inspiring: 'Inspirierend',
  expert: 'Expertig & Sachlich',
  sales: 'Verkaufsorientiert',
  storytelling: 'Storytelling',
}

export const INDUSTRY_OPTIONS = [
  'Handel & E-Commerce',
  'Gastronomie & Hotellerie',
  'Handwerk & Bau',
  'IT & Technologie',
  'Marketing & Kommunikation',
  'Beratung & Coaching',
  'Gesundheit & Wellness',
  'Bildung & Weiterbildung',
  'Immobilien',
  'Finanzen & Versicherung',
  'Logistik & Transport',
  'Produktion & Industrie',
  'Mode & Beauty',
  'Medien & Unterhaltung',
  'Sport & Freizeit',
  'Soziales & Non-Profit',
  'Sonstiges',
]

export const POSTING_GOAL_OPTIONS = [
  'Expertenwissen teilen',
  'Produkte vorstellen',
  'Kundenvorteile zeigen',
  'Hinter die Kulissen blicken',
  'Persönliche Statements',
  'Angebote & Aktionen',
  'Recruiting',
  'Veranstaltungen',
  'Storytelling',
  'FAQ & häufige Fragen',
  'Saisonale Themen',
  'Kundenerfahrungen',
]
