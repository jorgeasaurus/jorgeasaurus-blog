/*
 * WebGL2 liquid-glass renderer for the site's glass panels.
 *
 * The fragment shader is adapted from @crazygl/hero-glass-panels 0.1.1
 * (https://crazygl.com/hero/glass-panels, Apache-2.0), which follows the
 * approach of ybouane/liquidglass: a rounded-rect SDF feeds a half-sphere bevel
 * height field whose gradient drives biconvex refraction, chromatic dispersion,
 * a Fresnel rim and an inner stroke.
 *
 * Changes from the original: panels are an array measured from live DOM
 * elements instead of two hero cards, each panel carries its own corner radius
 * and bevel, pixel constants scale with the device pixel ratio, the rim stays
 * sharp while the body frosts, the drop shadow and specular lights are dropped
 * (CSS already draws them), and the canvas is transparent outside the panels so
 * the CSS wallpaper keeps showing through.
 */

const MAX_PANELS = 16
const PANEL_SELECTOR = '.liquid-glass-surface:not(.topbar)'
/* The fixed topbar floats over page content, so its glass cannot live on the
   canvas behind the page. It is rendered in a pass of its own and copied into
   a 2D canvas inside the bar, which then covers whatever scrolls underneath. */
const TOPBAR_SELECTOR = '.topbar.liquid-glass-surface'
const TOPBAR_CANVAS_SELECTOR = '.topbar-glass'
const ACTIVE_ATTRIBUTE = 'glass'
/* CSS px the canvas extends past the viewport, above and below. */
const OVERSCAN = 160
const SKIP_QUERY =
  '(prefers-reduced-motion: reduce), (prefers-reduced-transparency: reduce), (prefers-contrast: more)'

const GLASS = {
  bevelDepth: 52,
  refraction: 1.21,
  chromatic: 0.4,
  fresnel: 0.8,
  edgeHighlight: 0.4,
  tint: 0.12,
  /* Brightness/saturation match --main-hero-glass-filter; the blur is lighter
     so the bent wallpaper stays recognisable through the body. */
  brightness: -0.16,
  saturation: 0.12,
  blur: 9,
  pointerTilt: 1,
}

const VERT = `#version 300 es
in vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}`

const FRAG = `#version 300 es
precision highp float;
out vec4 outColor;

uniform sampler2D u_bgSharp;
uniform sampler2D u_bgBlur;
uniform vec2  u_resolution;
uniform vec2  u_bgSize;
uniform float u_dpr;
uniform int   u_count;
uniform vec4  u_panels[${MAX_PANELS}];  // centerX, centerY, halfW, halfH (canvas px)
uniform vec2  u_shapes[${MAX_PANELS}];  // corner radius, bevel depth (canvas px)
uniform float u_refract;
uniform float u_chroma;
uniform float u_edgeHL;
uniform float u_fresnel;
uniform float u_tint;
uniform float u_brightness;
uniform float u_sat;
uniform vec2  u_tilt;
uniform vec2  u_origin;      // viewport's bottom-left corner in canvas px

float rrSDF(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + vec2(r);
  return min(max(q.x, q.y), 0.0) + length(max(q, vec2(0.0))) - r;
}

// Half-circle bevel: 0 at the rim, flat at zR once d reaches zR.
float bevelHeight(float d, float zR) {
  if (d <= 0.0) return 0.0;
  if (d >= zR) return zR;
  return sqrt(d * (2.0 * zR - d));
}

// background-size: cover, centered.
vec2 coverUV(vec2 uv) {
  float bgAspect = u_bgSize.x / max(u_bgSize.y, 1.0);
  float canvasAspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 scale = vec2(1.0);
  if (bgAspect > canvasAspect) scale.x = canvasAspect / bgAspect;
  else                         scale.y = bgAspect / canvasAspect;
  vec2 c = (uv - 0.5) * scale + 0.5;
  return vec2(c.x, 1.0 - c.y);
}

void main() {
  // The canvas scrolls with the page and overscans the viewport, while the
  // wallpaper is fixed: panel geometry is in canvas px, sampling in viewport px.
  vec2 fragPx = gl_FragCoord.xy;
  vec2 viewPx = fragPx - u_origin;
  vec2 pxToUV = 1.0 / u_resolution;
  vec2 sUV = viewPx * pxToUV;

  // Refraction accumulates across overlapping panels, then the background is
  // sampled once with the combined offset.
  vec2 totalRefr = vec2(0.0);
  vec2 totalCaD = vec2(0.0);
  float totalRim = 0.0;
  float totalStroke = 0.0;
  float totalEnvRefl = 0.0;
  float totalFres = 0.0;
  float maxSharp = 0.0;
  float maxMask = 0.0;

  for (int i = 0; i < ${MAX_PANELS}; i++) {
    if (i >= u_count) break;
    vec2 halfPx = u_panels[i].zw;
    vec2 localPx = fragPx - u_panels[i].xy;
    float maxD = min(halfPx.x, halfPx.y);
    float r = min(u_shapes[i].x, maxD);
    float sdf = rrSDF(localPx, halfPx, r);
    float mask = 1.0 - smoothstep(-1.5, 0.5, sdf);
    if (mask <= 0.0) continue;

    float zR = max(min(u_shapes[i].y, maxD), 1.0);
    float inside = -sdf;
    float edge = smoothstep(maxD * 0.35, 0.0, inside);

    float e = 2.0 * u_dpr;
    float hC = bevelHeight(inside, zR);
    float hRR = bevelHeight(-rrSDF(localPx + vec2(e, 0.0), halfPx, r), zR);
    float hLL = bevelHeight(-rrSDF(localPx - vec2(e, 0.0), halfPx, r), zR);
    float hUU = bevelHeight(-rrSDF(localPx + vec2(0.0, e), halfPx, r), zR);
    float hDD = bevelHeight(-rrSDF(localPx - vec2(0.0, e), halfPx, r), zR);
    vec2 hGrad = vec2(hRR - hLL, hUU - hDD) / (2.0 * e);
    vec3 N = normalize(vec3(-(hGrad + u_tilt), 1.0));

    float depth = smoothstep(0.0, zR, inside);

    // Biconvex refraction: entry + exit + thickness, all driven by hGrad.
    float refrPow = 1.0 - 1.0 / 1.5;
    float thickNorm = hC / zR;
    vec2 surfaceRefr = (hGrad + u_tilt) * refrPow;
    vec2 refrPx = surfaceRefr * (2.0 + thickNorm * 0.5) * u_refract * 30.0 * u_dpr;
    refrPx += -localPx / max(halfPx, vec2(1.0)) * u_refract * 4.0 * u_dpr * depth;

    float caS = u_chroma * 36.0 * u_dpr * (edge * 0.7 + 0.3);

    float bw = 1.5 * u_dpr;
    float innerStroke = smoothstep(-bw - u_dpr, -bw, sdf) * (1.0 - smoothstep(-u_dpr, 0.0, sdf));
    float topBias = 0.5 + 0.5 * (localPx.y / max(halfPx.y, 1.0));
    innerStroke *= 0.4 + 0.6 * topBias;

    float fres = pow(1.0 - abs(N.z), 4.0) * u_fresnel;

    totalRefr    += refrPx * pxToUV * mask;
    totalCaD     += N.xy * caS * pxToUV * mask;
    totalRim     += (edge * 0.22 + smoothstep(5.0 * u_dpr, 0.0, inside) * 0.15) * u_edgeHL * mask;
    totalStroke  += innerStroke * mask;
    totalEnvRefl += (N.y * 0.5 + 0.5) * fres * 0.08 * mask;
    totalFres    += fres * mask;
    maxSharp      = max(maxSharp, (1.0 - depth) * mask);
    maxMask       = max(maxMask, mask);
  }

  if (maxMask <= 0.0) {
    outColor = vec4(0.0);
    return;
  }

  vec2 base = sUV + totalRefr;
  vec2 uvR = coverUV(base + totalCaD);
  vec2 uvG = coverUV(base);
  vec2 uvB = coverUV(base - totalCaD);
  vec3 sharp = vec3(texture(u_bgSharp, uvR).r, texture(u_bgSharp, uvG).g, texture(u_bgSharp, uvB).b);
  vec3 blur = vec3(texture(u_bgBlur, uvR).r, texture(u_bgBlur, uvG).g, texture(u_bgBlur, uvB).b);
  // Crisp, lens-like rim; frosted body so the text on top stays readable.
  vec3 col = mix(blur, sharp, maxSharp);

  // The wallpaper's CSS wash: linear-gradient(115deg, 2% -> 34% at 76%).
  vec2 dir = vec2(0.9063, 0.4226);
  vec2 cssPx = vec2(viewPx.x, u_resolution.y - viewPx.y);
  float span = dot(u_resolution, dir);
  float t = dot(cssPx - u_resolution * 0.5, dir) / span + 0.5;
  col = mix(col, vec3(0.008, 0.039, 0.027), mix(0.02, 0.34, clamp(t / 0.76, 0.0, 1.0)));

  col *= 1.0 + u_brightness;
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(lum), col, 1.0 + u_sat);
  col = mix(col, col * vec3(0.92, 0.95, 1.05), u_tint);

  col += vec3(totalRim);
  col += vec3(totalStroke * u_edgeHL * 0.55);
  col += vec3(totalEnvRefl);
  col = mix(col, vec3(1.0), clamp(totalFres * 0.2, 0.0, 1.0));

  outColor = vec4(clamp(col, 0.0, 1.0) * maxMask, maxMask);
}`

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) throw new Error('glass: shader allocation failed')
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error(`glass: shader compile failed: ${log}`)
  }
  return shader
}

function wallpaperUrl(stage: HTMLElement) {
  const value = getComputedStyle(stage).getPropertyValue('--wallpaper-image')
  return value.match(/url\(\s*["']?(.*?)["']?\s*\)/)?.[1] ?? null
}

/* Downscaled copy of the wallpaper, blurred by `blurPx` source pixels. */
function blurredCopy(image: HTMLImageElement, blurPx: number) {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) return image
  if (typeof (context as { filter?: unknown }).filter === 'string') {
    const scale = 0.25
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    /* Unblurred base coat so the blur does not fade to transparent at the edges. */
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    context.filter = `blur(${Math.max(0.5, blurPx * scale)}px)`
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    return canvas
  }
  /* No canvas filter support: lean on bilinear upsampling of a tiny copy. */
  const scale = Math.min(1, 1 / Math.max(1, blurPx))
  canvas.width = Math.max(2, Math.round(image.naturalWidth * scale))
  canvas.height = Math.max(2, Math.round(image.naturalHeight * scale))
  context.imageSmoothingQuality = 'high'
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas
}

const noop = () => {}

/**
 * Renders refractive glass on `canvas` behind every `.liquid-glass-surface`
 * element. `canvas` is the only child of an absolutely positioned, clipping
 * layer that spans the page, so it scrolls with the panels on the compositor
 * and the glass edge cannot trail them; each frame it is re-centred on the
 * viewport and redrawn. `stage` is the fixed wallpaper element: it gives the
 * viewport size and the image, through `--wallpaper-image`.
 * Returns a cleanup function. Does nothing when WebGL2 is unavailable or the
 * visitor asked for reduced motion, reduced transparency or more contrast; the
 * CSS backdrop-filter glass remains in that case.
 */
export function startGlassPanels(canvas: HTMLCanvasElement, stage: HTMLElement): () => void {
  if (window.matchMedia(SKIP_QUERY).matches) return noop
  const url = wallpaperUrl(stage)
  if (!url) return noop
  const gl = canvas.getContext('webgl2', { alpha: true, antialias: false, premultipliedAlpha: true })
  if (!gl || gl.isContextLost()) return noop

  let program: WebGLProgram | null = null
  let buffer: WebGLBuffer | null = null
  const textures: WebGLTexture[] = []
  const uniforms: Record<string, WebGLUniformLocation | null> = {}
  try {
    program = gl.createProgram()
    const vert = compile(gl, gl.VERTEX_SHADER, VERT)
    const frag = compile(gl, gl.FRAGMENT_SHADER, FRAG)
    gl.attachShader(program, vert)
    gl.attachShader(program, frag)
    gl.linkProgram(program)
    gl.deleteShader(vert)
    gl.deleteShader(frag)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`glass: link failed: ${gl.getProgramInfoLog(program)}`)
    }
  } catch (error) {
    console.warn(error)
    gl.deleteProgram(program)
    return noop
  }

  gl.useProgram(program)
  buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const position = gl.getAttribLocation(program, 'a_position')
  gl.enableVertexAttribArray(position)
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

  for (const name of [
    'u_bgSharp', 'u_bgBlur', 'u_resolution', 'u_bgSize', 'u_dpr', 'u_count', 'u_panels', 'u_shapes',
    'u_refract', 'u_chroma', 'u_edgeHL', 'u_fresnel', 'u_tint', 'u_brightness', 'u_sat', 'u_tilt', 'u_origin',
  ]) {
    uniforms[name] = gl.getUniformLocation(program, name)
  }
  gl.uniform1i(uniforms.u_bgSharp, 0)
  gl.uniform1i(uniforms.u_bgBlur, 1)
  gl.uniform1f(uniforms.u_refract, GLASS.refraction)
  gl.uniform1f(uniforms.u_chroma, GLASS.chromatic)
  gl.uniform1f(uniforms.u_edgeHL, GLASS.edgeHighlight)
  gl.uniform1f(uniforms.u_fresnel, GLASS.fresnel)
  gl.uniform1f(uniforms.u_tint, GLASS.tint)
  gl.uniform1f(uniforms.u_brightness, GLASS.brightness)
  gl.uniform1f(uniforms.u_sat, GLASS.saturation)

  const upload = (unit: number, source: TexImageSource) => {
    const texture = gl.createTexture()
    textures.push(texture)
    gl.activeTexture(gl.TEXTURE0 + unit)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
  }

  let stopped = false
  let ready = false
  let frame = 0
  let dirty = true
  const root = document.documentElement

  const image = new Image()
  image.decoding = 'async'
  image.onload = () => {
    if (stopped || gl.isContextLost()) return
    const maxSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number
    if (image.naturalWidth > maxSize || image.naturalHeight > maxSize) return
    const cover = Math.max(
      window.innerWidth / image.naturalWidth,
      window.innerHeight / image.naturalHeight,
    )
    upload(0, image)
    upload(1, blurredCopy(image, GLASS.blur / cover))
    gl.uniform2f(uniforms.u_bgSize, image.naturalWidth, image.naturalHeight)
    ready = true
    dirty = true
  }
  image.src = url

  /* Pointer tilt: a small bias on the bevel gradient, eased toward the cursor. */
  const tilt = { x: 0, y: 0, wantX: 0, wantY: 0 }
  const tiltEnabled = GLASS.pointerTilt > 0 && window.matchMedia('(hover: hover) and (pointer: fine)').matches
  const onPointerMove = (event: PointerEvent) => {
    const amplitude = 0.1 * GLASS.pointerTilt
    tilt.wantX = (event.clientX / Math.max(1, window.innerWidth) - 0.5) * 2 * amplitude
    tilt.wantY = (event.clientY / Math.max(1, window.innerHeight) - 0.5) * 2 * amplitude
  }
  const onPointerLeave = () => {
    tilt.wantX = 0
    tilt.wantY = 0
  }
  if (tiltEnabled) {
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    root.addEventListener('pointerleave', onPointerLeave)
  }

  const panels = new Float32Array(MAX_PANELS * 4)
  const shapes = new Float32Array(MAX_PANELS * 2)
  const drawnPanels = new Float32Array(MAX_PANELS * 4)
  const drawnShapes = new Float32Array(MAX_PANELS * 2)
  let drawnCount = -1
  let lastTime = 0
  const barPanel = new Float32Array(4)
  const barShape = new Float32Array(2)
  const drawnBar = new Float32Array(6)
  let barDirty = true
  let placedY = Number.NaN
  let placedHeight = 0

  const render = (time: number) => {
    frame = requestAnimationFrame(render)
    if (!ready) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const layer = canvas.parentElement
    if (!layer) return
    const layerRect = layer.getBoundingClientRect()
    const viewWidth = stage.clientWidth
    const viewHeight = stage.clientHeight
    /* Keep the canvas centred on the viewport with OVERSCAN to spare above and
       below, so panels scrolled into view before the next frame are covered. */
    const cssWidth = layerRect.width
    const cssHeight = viewHeight + 2 * OVERSCAN
    const offsetY = Math.round(-layerRect.top - OVERSCAN)
    if (offsetY !== placedY || cssHeight !== placedHeight) {
      placedY = offsetY
      placedHeight = cssHeight
      canvas.style.height = `${cssHeight}px`
      canvas.style.transform = `translate3d(0, ${offsetY}px, 0)`
      dirty = true
    }
    /* Canvas origin in viewport coordinates. */
    const originX = layerRect.left
    const originY = layerRect.top + offsetY
    const width = Math.max(1, Math.round(cssWidth * dpr))
    const height = Math.max(1, Math.round(cssHeight * dpr))
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
      gl.viewport(0, 0, width, height)
      dirty = true
      barDirty = true
    }

    /* Polling rects every frame keeps the glass glued to panels through
       scroll, layout shifts and CSS transitions without any observers. */
    let count = 0
    for (const element of document.querySelectorAll<HTMLElement>(PANEL_SELECTOR)) {
      if (count === MAX_PANELS) break
      const rect = element.getBoundingClientRect()
      if (
        rect.width < 2 || rect.height < 2 ||
        rect.bottom <= originY || rect.top >= originY + cssHeight ||
        rect.right <= originX || rect.left >= originX + cssWidth
      ) continue
      const radius = Number.parseFloat(getComputedStyle(element).borderTopLeftRadius) || 0
      panels[count * 4] = (rect.left - originX + rect.width / 2) * dpr
      panels[count * 4 + 1] = height - (rect.top - originY + rect.height / 2) * dpr
      panels[count * 4 + 2] = (rect.width / 2) * dpr
      panels[count * 4 + 3] = (rect.height / 2) * dpr
      shapes[count * 2] = radius * dpr
      shapes[count * 2 + 1] = GLASS.bevelDepth * dpr
      count += 1
    }

    if (count !== drawnCount) dirty = true
    for (let i = 0; !dirty && i < count * 4; i++) if (panels[i] !== drawnPanels[i]) dirty = true
    for (let i = 0; !dirty && i < count * 2; i++) if (shapes[i] !== drawnShapes[i]) dirty = true

    const delta = Math.min(0.1, Math.max(0.001, (time - lastTime) / 1000))
    lastTime = time
    const dx = tilt.wantX - tilt.x
    const dy = tilt.wantY - tilt.y
    if (Math.abs(dx) > 1e-4 || Math.abs(dy) > 1e-4) {
      const k = 1 - Math.exp(-delta / 0.16)
      tilt.x += dx * k
      tilt.y += dy * k
      dirty = true
      barDirty = true
    }

    const bar = document.querySelector<HTMLElement>(TOPBAR_SELECTOR)
    const barCanvas = bar?.querySelector<HTMLCanvasElement>(TOPBAR_CANVAS_SELECTOR)
    const barRect = bar && barCanvas ? bar.getBoundingClientRect() : null
    if (bar && barRect && barRect.width >= 2 && barRect.height >= 2) {
      barPanel[0] = (barRect.left - originX + barRect.width / 2) * dpr
      barPanel[1] = height - (barRect.top - originY + barRect.height / 2) * dpr
      barPanel[2] = (barRect.width / 2) * dpr
      barPanel[3] = (barRect.height / 2) * dpr
      barShape[0] = (Number.parseFloat(getComputedStyle(bar).borderTopLeftRadius) || 0) * dpr
      barShape[1] = GLASS.bevelDepth * dpr
      for (let i = 0; i < 6; i++) {
        const value = i < 4 ? barPanel[i] : barShape[i - 4]
        if (value !== drawnBar[i]) barDirty = true
        drawnBar[i] = value
      }
    }

    if (!dirty && !barDirty) return

    /* Hand the panels over from CSS backdrop-filter to the canvas in the same
       frame as the first draw. Set first: the bar pass reads CSS that keys on it. */
    root.dataset[ACTIVE_ATTRIBUTE] = 'webgl'

    gl.uniform2f(uniforms.u_resolution, viewWidth * dpr, viewHeight * dpr)
    gl.uniform2f(uniforms.u_origin, -originX * dpr, height - (viewHeight - originY) * dpr)
    gl.uniform1f(uniforms.u_dpr, dpr)
    /* Shader space is y-up, pointer space is y-down. */
    gl.uniform2f(uniforms.u_tilt, tilt.x, -tilt.y)
    gl.clearColor(0, 0, 0, 0)

    if (barDirty && barCanvas && barRect && barRect.width >= 2 && barRect.height >= 2) {
      const context = barCanvas.getContext('2d')
      const left = Math.round((barRect.left - originX) * dpr)
      const top = Math.round((barRect.top - originY) * dpr)
      const barWidth = Math.max(1, Math.round(barRect.width * dpr))
      const barHeight = Math.max(1, Math.round(barRect.height * dpr))
      if (context) {
        if (barCanvas.width !== barWidth || barCanvas.height !== barHeight) {
          barCanvas.width = barWidth
          barCanvas.height = barHeight
        }
        gl.enable(gl.SCISSOR_TEST)
        gl.scissor(left, height - top - barHeight, barWidth, barHeight)
        gl.uniform1i(uniforms.u_count, 1)
        gl.uniform4fv(uniforms.u_panels, barPanel)
        gl.uniform2fv(uniforms.u_shapes, barShape)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.drawArrays(gl.TRIANGLES, 0, 3)
        gl.disable(gl.SCISSOR_TEST)
        /* The drawing buffer is only readable until this frame is presented. */
        context.clearRect(0, 0, barWidth, barHeight)
        context.drawImage(canvas, left, top, barWidth, barHeight, 0, 0, barWidth, barHeight)
        /* This canvas sits above the bar's CSS background, so repaint its scrim. */
        const scrim = Number.parseFloat(getComputedStyle(bar!).getPropertyValue('--topbar-glass-scrim'))
        if (scrim > 0) {
          context.globalCompositeOperation = 'source-atop'
          context.fillStyle = `rgba(5, 14, 10, ${Math.min(scrim, 1)})`
          context.fillRect(0, 0, barWidth, barHeight)
          context.globalCompositeOperation = 'source-over'
        }
      }
    }
    barDirty = false
    dirty = false
    drawnCount = count
    drawnPanels.set(panels)
    drawnShapes.set(shapes)

    gl.uniform1i(uniforms.u_count, count)
    gl.uniform4fv(uniforms.u_panels, panels)
    gl.uniform2fv(uniforms.u_shapes, shapes)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  const stop = () => {
    if (stopped) return
    stopped = true
    cancelAnimationFrame(frame)
    image.onload = null
    window.removeEventListener('pointermove', onPointerMove)
    root.removeEventListener('pointerleave', onPointerLeave)
    canvas.removeEventListener('webglcontextlost', stop)
    delete root.dataset[ACTIVE_ATTRIBUTE]
    /* Free GPU objects but keep the context: a remount (StrictMode) asks this
       canvas for it again, and a deliberately lost context would not come back. */
    for (const texture of textures) gl.deleteTexture(texture)
    gl.deleteBuffer(buffer)
    gl.deleteProgram(program)
  }

  canvas.addEventListener('webglcontextlost', stop)
  frame = requestAnimationFrame(render)
  return stop
}
