// LinkedIn OAuth 2.0 + Publishing (übernommen aus kiwi-linkedin-marketing-tool, modernisiert)

const AUTH_BASE = 'https://www.linkedin.com/oauth/v2'
const API_BASE = 'https://api.linkedin.com'

export function getLinkedInAuthUrl(state: string, workspaceId: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.LINKEDIN_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/accounts/linkedin/callback`,
    state: `${state}:${workspaceId}`,
    scope: 'openid profile email w_member_social',
  })
  return `${AUTH_BASE}/authorization?${params}`
}

export async function exchangeLinkedInCode(code: string): Promise<{
  access_token: string; expires_in: number; error?: string
}> {
  const res = await fetch(`${AUTH_BASE}/accessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/accounts/linkedin/callback`,
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
    }),
  })
  return res.json()
}

export async function getLinkedInProfile(accessToken: string): Promise<{ sub: string; name: string }> {
  const res = await fetch(`${API_BASE}/v2/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`LinkedIn userinfo error: ${res.status}`)
  const data = await res.json()
  return { sub: data.sub, name: data.name ?? data.sub }
}

export async function publishLinkedInPost(
  accessToken: string,
  personUrn: string,
  text: string
): Promise<string> {
  const res = await fetch(`${API_BASE}/rest/posts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'LinkedIn-Version': '202411',
    },
    body: JSON.stringify({
      author: `urn:li:person:${personUrn}`,
      commentary: text,
      visibility: 'PUBLIC',
      distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },
      lifecycleState: 'PUBLISHED',
      isReshareDisabledByAuthor: false,
    }),
  })
  if (!res.ok) throw new Error(`LinkedIn publish error ${res.status}: ${await res.text()}`)
  const postUrn = res.headers.get('x-restli-id') ?? ''
  return postUrn
}
