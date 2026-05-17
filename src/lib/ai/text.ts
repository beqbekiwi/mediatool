import { generateText as aiGenerateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

// Locally: uses ANTHROPIC_API_KEY directly.
// On Vercel: set ANTHROPIC_API_KEY via `vercel env add` or use AI Gateway.
const MODEL = anthropic('claude-sonnet-4-6')

export async function generateText(systemPrompt: string, userPrompt: string): Promise<string> {
  const { text } = await aiGenerateText({
    model: MODEL,
    system: systemPrompt,
    prompt: userPrompt,
    maxOutputTokens: 2000,
  })
  return text.trim()
}

export async function generateJSON<T>(systemPrompt: string, userPrompt: string): Promise<T> {
  const raw = await generateText(systemPrompt, userPrompt)
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  const jsonStr = match ? match[1].trim() : raw
  return JSON.parse(jsonStr) as T
}
