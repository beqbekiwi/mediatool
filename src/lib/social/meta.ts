// Meta Graph API – Facebook Pages + Instagram Business
// Offizielle API: https://developers.facebook.com/docs/graph-api
// Wichtig: Kein Scraping, keine unsauberen Automatisierungen – nur offizielle Graph API

const GRAPH_BASE = 'https://graph.facebook.com/v21.0'

export function getFacebookAuthUrl(state: string, workspaceId: string): string {
  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/accounts/facebook/callback`,
    state: `${state}:${workspaceId}`,
    scope: [
      'pages_show_list',
      'pages_read_engagement',
      'pages_manage_posts',
      'instagram_basic',
      'instagram_content_publish',
      'instagram_manage_insights',
    ].join(','),
    response_type: 'code',
  })
  return `https://www.facebook.com/dialog/oauth?${params}`
}

export async function exchangeFacebookCode(code: string): Promise<{
  access_token: string; token_type: string; expires_in?: number
}> {
  const res = await fetch(`${GRAPH_BASE}/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.FACEBOOK_APP_ID,
      client_secret: process.env.FACEBOOK_APP_SECRET,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/accounts/facebook/callback`,
      code,
    }),
  })
  if (!res.ok) throw new Error(`Facebook token error: ${res.status}`)
  return res.json()
}

export async function getLongLivedToken(shortToken: string): Promise<string> {
  const res = await fetch(
    `${GRAPH_BASE}/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.FACEBOOK_APP_ID}&client_secret=${process.env.FACEBOOK_APP_SECRET}&fb_exchange_token=${shortToken}`
  )
  if (!res.ok) throw new Error(`Long-lived token error: ${res.status}`)
  const data = await res.json()
  return data.access_token
}

export async function getUserPages(accessToken: string): Promise<Array<{
  id: string; name: string; access_token: string; instagram_business_account?: { id: string }
}>> {
  const res = await fetch(
    `${GRAPH_BASE}/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${accessToken}`
  )
  if (!res.ok) throw new Error(`Pages fetch error: ${res.status}`)
  const data = await res.json()
  return data.data ?? []
}

export async function getIgUser(igId: string, pageToken: string): Promise<{ id: string; username: string }> {
  const res = await fetch(`${GRAPH_BASE}/${igId}?fields=id,username&access_token=${pageToken}`)
  if (!res.ok) throw new Error(`IG user fetch error: ${res.status}`)
  return res.json()
}

// ─── Publishing ───────────────────────────────────────────────────────────────

export async function publishFacebookPost(pageId: string, pageToken: string, message: string): Promise<string> {
  const res = await fetch(`${GRAPH_BASE}/${pageId}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, access_token: pageToken }),
  })
  if (!res.ok) throw new Error(`Facebook publish error ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.id
}

export async function publishFacebookImagePost(
  pageId: string, pageToken: string, message: string, imageUrl: string
): Promise<string> {
  // 1. Bild hochladen
  const photoRes = await fetch(`${GRAPH_BASE}/${pageId}/photos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: imageUrl, caption: message, access_token: pageToken }),
  })
  if (!photoRes.ok) throw new Error(`Facebook photo upload error ${photoRes.status}: ${await photoRes.text()}`)
  const photo = await photoRes.json()
  return photo.id
}

export async function publishFacebookReel(
  pageId: string, pageToken: string, videoUrl: string, description: string
): Promise<string> {
  // Reels API: https://developers.facebook.com/docs/video-api/guides/reels-publishing
  const uploadRes = await fetch(`${GRAPH_BASE}/${pageId}/video_reels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      upload_phase: 'start',
      access_token: pageToken,
    }),
  })
  if (!uploadRes.ok) throw new Error(`FB Reel upload start error: ${uploadRes.status}`)
  const { video_id } = await uploadRes.json()

  // Video-Datei hochladen (Binary Transfer)
  const videoRes = await fetch(videoUrl)
  const videoBuffer = await videoRes.arrayBuffer()

  const transferRes = await fetch(`https://rupload.facebook.com/video-upload/v21.0/${video_id}`, {
    method: 'POST',
    headers: {
      Authorization: `OAuth ${pageToken}`,
      'Content-Type': 'application/octet-stream',
      'offset': '0',
      'file_size': String(videoBuffer.byteLength),
    },
    body: videoBuffer,
  })
  if (!transferRes.ok) throw new Error(`FB Reel video transfer error: ${transferRes.status}`)

  // Veröffentlichen
  const publishRes = await fetch(`${GRAPH_BASE}/${pageId}/video_reels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      video_id,
      upload_phase: 'finish',
      video_state: 'PUBLISHED',
      description,
      access_token: pageToken,
    }),
  })
  if (!publishRes.ok) throw new Error(`FB Reel publish error: ${publishRes.status}`)
  return video_id
}

// ─── Instagram ────────────────────────────────────────────────────────────────

export async function publishInstagramImagePost(
  igUserId: string, pageToken: string, imageUrl: string, caption: string
): Promise<string> {
  // 1. Container erstellen
  const containerRes = await fetch(`${GRAPH_BASE}/${igUserId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: imageUrl, caption, access_token: pageToken }),
  })
  if (!containerRes.ok) throw new Error(`IG container error: ${containerRes.status}`)
  const { id: containerId } = await containerRes.json()

  // 2. Warten bis Container bereit
  await waitForIgContainer(igUserId, containerId, pageToken)

  // 3. Veröffentlichen
  const publishRes = await fetch(`${GRAPH_BASE}/${igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: containerId, access_token: pageToken }),
  })
  if (!publishRes.ok) throw new Error(`IG publish error: ${publishRes.status}`)
  const data = await publishRes.json()
  return data.id
}

export async function publishInstagramReel(
  igUserId: string, pageToken: string, videoUrl: string, caption: string
): Promise<string> {
  // 1. Reel-Container erstellen
  const containerRes = await fetch(`${GRAPH_BASE}/${igUserId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      media_type: 'REELS',
      video_url: videoUrl,
      caption,
      access_token: pageToken,
    }),
  })
  if (!containerRes.ok) throw new Error(`IG Reel container error ${containerRes.status}: ${await containerRes.text()}`)
  const { id: containerId } = await containerRes.json()

  // 2. Auf Video-Verarbeitung warten
  await waitForIgContainer(igUserId, containerId, pageToken)

  // 3. Veröffentlichen
  const publishRes = await fetch(`${GRAPH_BASE}/${igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: containerId, access_token: pageToken }),
  })
  if (!publishRes.ok) throw new Error(`IG Reel publish error: ${publishRes.status}`)
  const data = await publishRes.json()
  return data.id
}

async function waitForIgContainer(igUserId: string, containerId: string, token: string, maxWait = 120000) {
  const start = Date.now()
  while (Date.now() - start < maxWait) {
    const res = await fetch(
      `${GRAPH_BASE}/${igUserId}/media?fields=id,status_code&access_token=${token}`
    )
    const data = await res.json()
    const container = (data.data ?? []).find((m: { id: string }) => m.id === containerId)
    if (container?.status_code === 'FINISHED') return
    if (container?.status_code === 'ERROR') throw new Error('IG Media-Verarbeitung fehlgeschlagen')
    await new Promise(r => setTimeout(r, 5000))
  }
  throw new Error('IG Container-Timeout überschritten')
}
