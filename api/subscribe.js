import { createResend, subscribeContactToSegment } from '../lib/resend.mjs'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function json(body, init = {}) {
  return Response.json(body, {
    ...init,
    headers: {
      'cache-control': 'no-store',
      ...init.headers,
    },
  })
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      allow: 'POST, OPTIONS',
      'cache-control': 'no-store',
    },
  })
}

export async function POST(request) {
  let payload

  try {
    payload = await request.json()
  } catch {
    return json({ message: 'Send a valid email address.' }, { status: 400 })
  }

  const honeypot = String(payload?.website ?? '').trim()

  if (honeypot) {
    return json({ message: "You're on the list." })
  }

  const email = String(payload?.email ?? '').trim().toLowerCase()

  if (!emailPattern.test(email) || email.length > 254) {
    return json({ message: 'Send a valid email address.' }, { status: 400 })
  }

  const apiKey = process.env.RESEND_API_KEY
  const segmentId = process.env.NEWSLETTER_SEGMENT_ID

  if (!apiKey || !segmentId) {
    console.error('newsletter_signup_missing_env', {
      hasApiKey: Boolean(apiKey),
      hasSegmentId: Boolean(segmentId),
    })

    return json(
      { message: 'Newsletter signup is not configured yet.' },
      { status: 500 }
    )
  }

  try {
    const resend = createResend(apiKey)

    await subscribeContactToSegment(resend, {
      email,
      segmentId,
    })

    return json({ message: "You're on the list." })
  } catch (error) {
    console.error('newsletter_signup_resend_error', {
      message: error.message,
      name: error.name,
      statusCode: error.statusCode,
      data: error.data,
    })

    return json(
      { message: 'Newsletter signup failed. Try again in a bit.' },
      { status: 502 }
    )
  }
}

export function GET() {
  return json(
    { message: 'Method not allowed.' },
    {
      status: 405,
      headers: {
        allow: 'POST, OPTIONS',
      },
    }
  )
}
