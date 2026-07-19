import './style.css'

const base = import.meta.env.BASE_URL

const catalog = [
  {
    id: 1,
    title: 'beat 1',
    tag: 'instrumental',
    src: `${base}beats/beat-1.m4a`,
  },
]

let activeId = null
let isPlaying = false

const audio = new Audio()
audio.preload = 'metadata'

const app = document.querySelector('#app')

let listEl
let playBtn
let titleEl
let tagEl
let timeCur
let timeDur
let progressEl
let progressFill
let progressKnob
let eqEl
let coverTitle

function formatTime(sec) {
  if (!Number.isFinite(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function mount() {
  app.innerHTML = `
    <div class="page">
      <div class="wash" aria-hidden="true"></div>
      <div class="grain" aria-hidden="true"></div>

      <header class="topbar">
        <a class="brand-lockup" href="#">
          <span class="brand">oli</span>
          <span class="tagline">beats</span>
        </a>
        <nav class="nav">
          <a href="#listen">listen</a>
          <a href="#about">about</a>
        </nav>
      </header>

      <main class="shell" id="listen">
        <section class="hero" aria-label="Now playing">
          <div class="cover" aria-hidden="true">
            <span class="eq" data-eq>
              <i></i><i></i><i></i><i></i><i></i><i></i><i></i>
            </span>
            <span class="cover-title" data-cover-title>beat 1</span>
          </div>

          <div class="hero-copy">
            <p class="eyebrow">now playing</p>
            <h1 class="track-name" data-title>select a beat</h1>
            <p class="track-kind" data-tag>—</p>

            <div class="controls">
              <button class="play-btn" data-play aria-label="Play" disabled>
                <svg class="icon-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
                <svg class="icon-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>
              </button>
              <div class="scrub">
                <div class="progress" data-progress>
                  <div class="progress-track">
                    <div class="progress-fill" data-fill></div>
                    <div class="progress-knob" data-knob></div>
                  </div>
                </div>
                <div class="times">
                  <span data-time-cur>0:00</span>
                  <span data-time-dur>0:00</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="playlist">
          <div class="playlist-head">
            <h2>playlist</h2>
            <p>${catalog.length} track${catalog.length === 1 ? '' : 's'}</p>
          </div>
          <div class="track-list"></div>
        </section>

        <section class="about" id="about">
          <h3>about</h3>
          <p>beats i've made. more coming.</p>
        </section>
      </main>
    </div>
  `

  listEl = app.querySelector('.track-list')
  playBtn = app.querySelector('[data-play]')
  titleEl = app.querySelector('[data-title]')
  tagEl = app.querySelector('[data-tag]')
  timeCur = app.querySelector('[data-time-cur]')
  timeDur = app.querySelector('[data-time-dur]')
  progressEl = app.querySelector('[data-progress]')
  progressFill = app.querySelector('[data-fill]')
  progressKnob = app.querySelector('[data-knob]')
  eqEl = app.querySelector('[data-eq]')
  coverTitle = app.querySelector('[data-cover-title]')

  bindShell()
  bindAudio()
  renderList()

  if (catalog[0]) selectBeat(catalog[0].id, { autoplay: false })
}

function renderList() {
  listEl.innerHTML = catalog
    .map(
      (beat, i) => `
    <button class="row" data-id="${beat.id}" style="--d: ${Math.min(i * 45, 360)}ms">
      <span class="row-num">${String(i + 1).padStart(2, '0')}</span>
      <span class="row-body">
        <span class="row-title">${beat.title}</span>
        <span class="row-meta">${beat.tag}</span>
      </span>
      <span class="row-play" aria-hidden="true">
        <svg class="icon-play" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        <svg class="icon-pause" viewBox="0 0 24 24"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>
      </span>
    </button>
  `,
    )
    .join('')
  syncRowStates()
}

function syncRowStates() {
  listEl.querySelectorAll('.row').forEach((el) => {
    const id = Number(el.dataset.id)
    const active = id === activeId
    el.classList.toggle('is-active', active)
    el.classList.toggle('is-playing', active && isPlaying)
  })
}

function selectBeat(id, { autoplay = true } = {}) {
  const beat = catalog.find((b) => b.id === id)
  if (!beat) return

  const changing = activeId !== id
  activeId = id
  titleEl.textContent = beat.title
  tagEl.textContent = beat.tag
  coverTitle.textContent = beat.title
  playBtn.disabled = false

  if (changing) {
    audio.src = beat.src
    audio.load()
  }

  syncRowStates()

  if (autoplay) audio.play().catch(() => {})
}

function togglePlay() {
  if (!activeId) {
    if (catalog[0]) selectBeat(catalog[0].id)
    return
  }
  if (audio.paused) audio.play().catch(() => {})
  else audio.pause()
}

function updateProgress() {
  const dur = audio.duration || 0
  const cur = audio.currentTime || 0
  const pct = dur ? (cur / dur) * 100 : 0
  progressFill.style.width = `${pct}%`
  progressKnob.style.left = `${pct}%`
  timeCur.textContent = formatTime(cur)
  timeDur.textContent = formatTime(dur)
}

function seekFromEvent(e) {
  const rect = progressEl.getBoundingClientRect()
  const x = Math.min(Math.max(e.clientX - rect.left, 0), rect.width)
  const pct = x / rect.width
  if (Number.isFinite(audio.duration)) {
    audio.currentTime = pct * audio.duration
    updateProgress()
  }
}

function bindAudio() {
  audio.addEventListener('play', () => {
    isPlaying = true
    playBtn.classList.add('is-playing')
    playBtn.setAttribute('aria-label', 'Pause')
    eqEl?.classList.add('is-on')
    syncRowStates()
  })

  audio.addEventListener('pause', () => {
    isPlaying = false
    playBtn.classList.remove('is-playing')
    playBtn.setAttribute('aria-label', 'Play')
    eqEl?.classList.remove('is-on')
    syncRowStates()
  })

  audio.addEventListener('timeupdate', updateProgress)
  audio.addEventListener('loadedmetadata', updateProgress)
  audio.addEventListener('ended', () => {
    audio.currentTime = 0
    updateProgress()
  })
}

function bindShell() {
  app.addEventListener('click', (e) => {
    const row = e.target.closest('.row')
    if (row) {
      const id = Number(row.dataset.id)
      if (activeId === id) togglePlay()
      else selectBeat(id)
      return
    }

    if (e.target.closest('[data-play]')) togglePlay()
  })

  let dragging = false

  progressEl.addEventListener('pointerdown', (e) => {
    dragging = true
    progressEl.setPointerCapture(e.pointerId)
    seekFromEvent(e)
  })

  progressEl.addEventListener('pointermove', (e) => {
    if (!dragging) return
    seekFromEvent(e)
  })

  progressEl.addEventListener('pointerup', () => {
    dragging = false
  })

  progressEl.addEventListener('pointercancel', () => {
    dragging = false
  })
}

mount()
