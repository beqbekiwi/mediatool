import type { PostFormat, PostStyle, Platform } from '@/types'

interface BrandContext {
  name: string
  description?: string | null
  industry?: string | null
  targetAudience?: string | null
  tonality: string
  language: string
  addressingStyle: string
  useEmojis: boolean
  noGos: string[]
  preferredTerms: string[]
  avoidedTerms: string[]
}

export function buildSystemPrompt(brand: BrandContext): string {
  const emojiRule = brand.useEmojis
    ? 'Emojis sind erlaubt – sparsam und passend einsetzen (max. 2–3 pro Post).'
    : 'Keine Emojis verwenden.'

  const noGoBlock = brand.noGos.length
    ? `\nSTRENGE VERBOTE: ${brand.noGos.join(', ')}`
    : ''

  const termBlock = [
    brand.preferredTerms.length ? `Bevorzugte Begriffe: ${brand.preferredTerms.join(', ')}` : '',
    brand.avoidedTerms.length ? `Zu vermeidende Begriffe: ${brand.avoidedTerms.join(', ')}` : '',
  ].filter(Boolean).join('\n')

  return `Du bist ein erfahrener Social-Media-Stratege und Texter.

MARKE: ${brand.name}
${brand.description ? `BESCHREIBUNG: ${brand.description}` : ''}
${brand.industry ? `BRANCHE: ${brand.industry}` : ''}
${brand.targetAudience ? `ZIELGRUPPE: ${brand.targetAudience}` : ''}

TONALITÄT: ${brand.tonality}
ANSPRACHE: ${brand.addressingStyle}-Form verwenden
SPRACHE: ${brand.language === 'de' ? 'Deutsch' : 'Englisch'}
${emojiRule}
${termBlock}
${noGoBlock}

ALLGEMEINE REGELN:
- Keine Marketingfloskeln ("revolutionär", "game-changer", "disruptiv")
- Authentisch, klar und zielgruppengerecht schreiben
- Starker Hook in der ersten Zeile
- Kurze Absätze (2–3 Sätze), gut lesbar
- Call-to-Action am Ende wenn sinnvoll
- Hashtags immer am Ende, nie im Fließtext`
}

const FORMAT_INSTRUCTIONS: Record<PostFormat, string> = {
  standard: 'Schreibe einen ausgewogenen Post mit klarer Botschaft.',
  expert: 'Schreibe einen fundierten Expertenpost mit Fachwissen und Einschätzung – kein Verkaufstext.',
  story: 'Erzähle eine kurze, authentische Geschichte mit klarem Erkenntnismoment.',
  list: 'Schreibe einen strukturierten Listenpost mit 4–6 konkreten, nützlichen Punkten.',
  question: 'Formuliere einen Post der mit einer echten, offenen Frage endet – lädt zum Kommentieren ein.',
  promo: 'Präsentiere ein Angebot oder eine Aktion klar und überzeugend – ohne übertriebene Verkaufsrhetorik.',
  faq: 'Beantworte eine häufige Frage aus der Zielgruppe klar und hilfreich.',
  'behind-scenes': 'Gewähre einen authentischen Einblick hinter die Kulissen – persönlich und greifbar.',
}

const PLATFORM_RULES: Record<Platform, string> = {
  facebook: `FACEBOOK-REGELN:
- Länge: 100–300 Wörter (längere Posts funktionieren auf Facebook)
- Erste Zeile entscheidet über "Mehr lesen" – muss neugierig machen
- Links können im Post stehen
- 3–5 Hashtags am Ende`,
  instagram: `INSTAGRAM-REGELN:
- Länge: 80–150 Wörter (Caption, nicht zu lang)
- Sehr starke erste Zeile (nur diese ist ohne Klick sichtbar)
- Keine externen Links im Post (nur in Bio)
- 5–15 relevante Hashtags am Ende
- Kann emotionaler und visueller sein`,
  linkedin: `LINKEDIN-REGELN:
- Länge: 150–300 Wörter
- Erste Zeile muss zum Weiterlesen animieren
- Keine externen Links im Post-Text (algorithmisch benachteiligt)
- 3–5 themenspezifische Hashtags am Ende
- Professionell, aber persönlich`,
  tiktok: `TIKTOK-REGELN:
- Sehr kurze Caption: 50–100 Wörter
- Hook muss sofort Aufmerksamkeit erzeugen
- Trendbewusst, authentisch, energetisch
- 3–5 relevante Hashtags`,
}

const STYLE_INSTRUCTIONS: Record<PostStyle, string> = {
  professional: 'Professionell und seriös – wie ein erfahrener Experte oder Unternehmer.',
  casual: 'Locker und nahbar – wie ein Gespräch mit einem Freund, aber immer noch seriös.',
  emotional: 'Emotional und bewegend – spricht Gefühle und Werte an.',
  informative: 'Informativ und sachlich – Fakten, Daten, klare Aussagen.',
  sales: 'Verkaufsorientiert aber nicht aufdringlich – Nutzen und Mehrwert im Vordergrund.',
  inspirational: 'Inspirierend und motivierend – gibt Energie und neue Perspektiven.',
}

export function buildPostPrompt(params: {
  topic: string
  platform: Platform
  format: PostFormat
  style: PostStyle
  targetGroup?: string
  cta?: string
  hashtags?: string[]
  imageIdea?: string
  additionalNotes?: string
  count?: number
}): string {
  const { topic, platform, format, style, targetGroup, cta, hashtags, imageIdea, additionalNotes, count = 3 } = params

  return `Erstelle ${count} verschiedene Social-Media-Posts für ${platform.charAt(0).toUpperCase() + platform.slice(1)}.

THEMA: ${topic}
FORMAT: ${FORMAT_INSTRUCTIONS[format]}
STIL: ${STYLE_INSTRUCTIONS[style]}
${targetGroup ? `SPEZIFISCHE ZIELGRUPPE: ${targetGroup}` : ''}
${cta ? `GEWÜNSCHTER CALL-TO-ACTION: ${cta}` : ''}
${hashtags?.length ? `HASHTAG-VORGABEN: ${hashtags.map(h => '#' + h).join(' ')}` : ''}
${imageIdea ? `BILDIDEE: ${imageIdea}` : ''}
${additionalNotes ? `BESONDERE HINWEISE: ${additionalNotes}` : ''}

${PLATFORM_RULES[platform]}

Gib die Antwort als JSON-Array zurück. Jedes Objekt hat folgende Felder:
- title: Kurztitel des Posts (max. 60 Zeichen, intern zur Identifikation)
- hook: Die erste Zeile / der Einstieg (1 Satz, sehr stark)
- content: Der vollständige Post-Text inkl. Hashtags am Ende
- cta: Der konkrete Call-to-Action (1 Satz)
- hashtags: Array der verwendeten Hashtags (ohne #)
- imageIdea: Bildidee oder Bildvorschlag (1–2 Sätze)
- videoIdea: Videoidee falls sinnvoll, sonst null
- publishTip: Empfohlener Veröffentlichungszeitpunkt (z. B. "Dienstag, 9–11 Uhr")

Nur das JSON-Array zurückgeben, kein weiterer Text.`
}

export function buildVariantPrompt(originalContent: string, newStyle: PostStyle): string {
  return `Schreibe den folgenden Post in einem anderen Stil um:

ORIGINAL:
${originalContent}

NEUER STIL: ${STYLE_INSTRUCTIONS[newStyle]}

Behalte den Kerninhalt bei, ändere Ton und Formulierung. Platform-spezifische Regeln bleiben gleich.
Gib nur den überarbeiteten Post-Text zurück, kein Kommentar.`
}
