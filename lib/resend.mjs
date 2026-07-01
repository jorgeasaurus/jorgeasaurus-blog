import { Resend } from 'resend'

export function createResend(apiKey) {
  return new Resend(apiKey)
}

export function createResendError(error, action) {
  const wrapped = new Error(`${action} failed: ${error.message}`)
  wrapped.data = error
  wrapped.name = error.name || wrapped.name
  wrapped.statusCode = error.statusCode ?? null
  return wrapped
}

export function unwrapResend(response, action) {
  if (response.error) {
    throw createResendError(response.error, action)
  }

  return response.data
}

function getErrorDetails(error) {
  return `${error?.name ?? ''} ${error?.message ?? ''}`.toLowerCase()
}

function hasMissingOrInvalidSignal(details) {
  return (
    details.includes('does not exist') ||
    details.includes('not exist') ||
    details.includes("doesn't exist") ||
    details.includes('not found') ||
    details.includes('invalid') ||
    details.includes('missing_required_field')
  )
}

function hasAlreadySignal(details) {
  return /\balready\b/.test(details)
}

export function isContactAlreadyExistsError(error) {
  const details = getErrorDetails(error)

  if (hasMissingOrInvalidSignal(details)) {
    return false
  }

  return error?.statusCode === 409 || (hasAlreadySignal(details) && /\bexist/.test(details))
}

export function isSegmentAlreadyAddedError(error) {
  const details = getErrorDetails(error)

  if (hasMissingOrInvalidSignal(details)) {
    return false
  }

  return (
    error?.statusCode === 409 ||
    (hasAlreadySignal(details) &&
      /\b(segment|subscrib|member|add|present|belong)/.test(details))
  )
}

export async function subscribeContactToSegment(resend, { email, segmentId }) {
  const createResponse = await resend.contacts.create({
    email,
    unsubscribed: false,
    segments: [{ id: segmentId }],
  })

  if (!createResponse.error) {
    return createResponse.data
  }

  if (!isContactAlreadyExistsError(createResponse.error)) {
    throw createResendError(createResponse.error, 'Contact create')
  }

  const addResponse = await resend.contacts.segments.add({
    email,
    segmentId,
  })

  if (addResponse.error && !isSegmentAlreadyAddedError(addResponse.error)) {
    throw createResendError(addResponse.error, 'Segment add')
  }

  return addResponse.data
}
