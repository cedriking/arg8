export function generateAvatar(str, size = 32) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  window.jdenticon.drawIcon(canvas.getContext('2d'), str, size)

  return canvas.toDataURL()
}
