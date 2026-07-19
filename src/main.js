import './style.css'

const base = import.meta.env.BASE_URL

const catalog = [
  {
    id: 1,
    title: 'beat 1',
    tag: 'instrumental',
    bpm: null,
    src: `${base}beats/beat-1.m4a`,
  },
]

const tags = ['all', 'instrumental']

let activeTag = 'all'
let activeId = null
let isPlaying = false
let listAnimated = false

const audio = new Audio()
audio.preload = 'metadata'

const app = document.querySelector('#app')

let listEl
let filtersEl
let playBtn
let titleEl
let tagEl
let timeEl
let progressEl
let progressFill
let progressKnob
let eqEl

function filtered() {
  return activeTag === 'all' ? catalog : catalog.filter((b) => b.tag === activeTag)
}

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

      <header class="mobile-bar">
        <div class="mobile-brand">
          <h1 class="brand">oli</h1>
          <p class="tagline">beats</p>
        </div>
        <nav class="mobile-links">
          <a href="#tracks">tracks</a>
          <a href="#about">about</a>
        </nav>
      </header>

      <aside class="rail">
        <div class="rail-top">
          <h1 class="brand">oli</h1>
          <p class="tagline">beats</p>
          <nav class="links">
            <a href="#tracks">tracks</a>
            <a href="#about">about</a>
          </nav>
        </div>
      </aside>

      <main class="main" id="tracks">
        <header class="top">
          <h2 class="headline">beats</h2>
        </header>

        <div class="filters-wrap">
          <div class="filters" role="tablist" aria-label="Filter beats"></div>
        </div>

        <section class="player" aria-label="Player">
          <div class="player-card">
            <div class="player-top">
              <div class="player-art" aria-hidden="true">
                <span class="eq" data-eq>
                  <i></i><i></i><i></i><i></i><i></i>
                </span>
              </div>
              <div class="player-info">
                <p class="player-title" data-title>select a beat</p>
                <p class="player-tag" data-tag>—</p>
              </div>
              <button class="play-btn" data-play aria-label="Play" disabled>
                <svg class="icon-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
                <svg class="icon-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>
              </button>
            </div>
            <div class="progress" data-progress>
              <div class="progress-track">
                <div class="progress-fill" data-fill></div>
                <div class="progress-knob" data-knob></div>
              </div>
            </div>
            <p class="player-time" data-time>0:00 / 0:00</p>
          </div>
        </section>

        <div class="track-list"></div>

        <section class="about" id="about">
          <h3>about</h3>
          <p>beats i've made. more coming.</p>
        </section>
      </main>
    </div>
  `

  listEl = app.querySelector('.track-list')
  filtersEl = app.querySelector('.filters')
  playBtn = app.querySelector('[data-play]')
  titleEl = app.querySelector('[data-title]')
  tagEl = app.querySelector('[data-tag]')
  timeEl = app.querySelector('[data-time]')
  progressEl = app.querySelector('[data-progress]')
  progressFill = app.querySelector('[data-fill]')
  progressKnob = app.querySelector('[data-knob]')
  eqEl = app.querySelector('[data-eq]')

  bindShell()
  bindAudio()
  renderFilters()
  renderList()

  if (catalog[0]) selectBeat(catalog[0].id, { autoplay: false })
}

function renderFilters() {
  filtersEl.innerHTML = tags
    .map(
      (tag) => `
    <button
      class="chip ${activeTag === tag ? 'is-active' : ''}"
      data-tag="${tag}"
      role="tab"
      aria-selected="${activeTag === tag}"
    >${tag}${tag === 'all' ? ` (${catalog.length})` : ''}</button>
  `,
    )
    .join('')
}

function renderList() {
  const items = filtered()
  const animate = !listAnimated
  listEl.innerHTML = items
    .map(
      (beat, i) => `
    <button
      class="track ${animate ? 'will-rise' : ''} ${activeId === beat.id ? 'is-active' : ''} ${activeId === beat.id && isPlaying ? 'is-playing' : ''}"
      data-id="${beat.id}"
      style="--d: ${animate ? Math.min(i * 40, 360) : 0}ms"
    >
      <span class="track-index">${String(i + 1).padStart(2, '0')}</span>
      <span class="track-body">
        <span class="track-title">${beat.title}</span>
        <span class="track-meta">${beat.tag}</span>
      </span>
      <span class="track-action" aria-hidden="true">
        <svg class="icon-play" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        <svg class="icon-pause" viewBox="0 0 24 24"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>
      </span>
    </button>
  `,
    )
    .join('')
  listAnimated = true
}

function syncTrackStates() {
  listEl.querySelectorAll('.track').forEach((el) => {
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
  playBtn.disabled = false

  if (changing) {
    audio.src = beat.src
    audio.load()
  }

  syncTrackStates()

  if (autoplay) {
    audio.play().catch(() => {})
  }
}

function togglePlay() {
  if (!activeId) {
    if (catalog[0]) selectBeat(catalog[0].id)
    return
  }
  if (audio.paused) {
    audio.play().catch(() => {})
  } else {
    audio.pause()
  }
}

function updateProgress() {
  const dur = audio.duration || 0
  const cur = audio.currentTime || 0
  const pct = dur ? (cur / dur) * 100 : 0
  progressFill.style.width = `${pct}%`
  progressKnob.style.left = `${pct}%`
  timeEl.textContent = `${formatTime(cur)} / ${formatTime(dur)}`
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
    syncTrackStates()
  })

  audio.addEventListener('pause', () => {
    isPlaying = false
    playBtn.classList.remove('is-playing')
    playBtn.setAttribute('aria-label', 'Play')
    eqEl?.classList.remove('is-on')
    syncTrackStates()
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
    const chip = e.target.closest('.chip')
    if (chip) {
      const next = chip.dataset.tag
      if (next === activeTag) return
      activeTag = next
      listAnimated = false
      renderFilters()
      renderList()
      return
    }

    const track = e.target.closest('.track')
    if (track) {
      const id = Number(track.dataset.id)
      if (activeId === id) {
        togglePlay()
      } else {
        selectBeat(id)
      }
      return
    }

    if (e.target.closest('[data-play]')) {
      togglePlay()
    }
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
