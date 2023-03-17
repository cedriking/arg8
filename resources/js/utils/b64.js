function b64UrlEncode(b64String) {
  return b64String.replace(/\+/g, '-').replace(/\//g, '_').replace(/\=/g, '')
}

function bufferTob64(buffer) {
  return window.Base64.fromUint8Array(buffer)
}

export function bufferTob64Url(buffer) {
  return b64UrlEncode(bufferTob64(buffer))
}
