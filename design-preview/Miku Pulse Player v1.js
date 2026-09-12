(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  const DEMO_MV = [
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
  ];

  const TRACKS = [
    {
      title: "玻璃星轨 / Glass Starline",
      shortTitle: "玻璃星轨",
      artist: "Prototype Vocal",
      album: "Stage Session 01",
      source: "演示云",
      duration: 222,
      tone: "",
      mv: DEMO_MV[0],
    },
    {
      title: "青色回声 / Cyan Echo",
      shortTitle: "青色回声",
      artist: "Studio 39",
      album: "Stage Session 01",
      source: "本地",
      duration: 248,
      tone: "ice",
      mv: DEMO_MV[1],
    },
    {
      title: "夜航协议 / Night Protocol",
      shortTitle: "夜航协议",
      artist: "Virtual Relay",
      album: "Night Protocol",
      source: "自托管",
      duration: 236,
      tone: "magenta",
      mv: DEMO_MV[2],
    },
    {
      title: "薄荷色流星 / Mint Meteor",
      shortTitle: "薄荷色流星",
      artist: "Signal Garden",
      album: "Signal Garden",
      source: "演示云",
      duration: 261,
      tone: "",
      mv: DEMO_MV[3],
    },
    {
      title: "零点合唱 / Midnight Chorus",
      shortTitle: "零点合唱",
      artist: "Clockwork Voice",
      album: "Encore Clock",
      source: "广播",
      duration: 214,
      tone: "yellow",
      mv: DEMO_MV[4],
    },
    {
      title: "透明天线 / Clear Antenna",
      shortTitle: "透明天线",
      artist: "Prototype Vocal",
      album: "Stage Session 01",
      source: "本地",
      duration: 198,
      tone: "ice",
      mv: DEMO_MV[5],
    },
    {
      title: "星屑缓存 / Stardust Cache",
      shortTitle: "星屑缓存",
      artist: "Studio 39",
      album: "Signal Garden",
      source: "自托管",
      duration: 284,
      tone: "magenta",
      mv: DEMO_MV[6],
    },
    {
      title: "返场时钟 / Encore Clock",
      shortTitle: "返场时钟",
      artist: "Clockwork Voice",
      album: "Encore Clock",
      source: "演示云",
      duration: 231,
      tone: "yellow",
      mv: DEMO_MV[7],
    },
  ];

  const PLAYLISTS = {
    starlight: {
      name: "星河当天亮之前",
      description: "把城市夜色、合成器与虚拟舞台排成一条从深夜走向天亮的演示歌单。",
      meta: "ORIGINAL DEMO · 12 TRACKS",
      label: "PLAYLIST / 01",
      tone: "",
      tracks: [0, 1, 3, 5, 6, 2],
    },
    night: {
      name: "凌晨三点的副歌",
      description: "偏重节拍与夜间氛围的虚构歌单，用于验证深色界面与长标题的可读性。",
      meta: "ORIGINAL DEMO · 09 TRACKS",
      label: "PLAYLIST / 02",
      tone: "magenta",
      tracks: [2, 4, 6, 0, 7],
    },
    focus: {
      name: "调音台专注模式",
      description: "更低动态、更长时长的虚构工作歌单，适合验证信息密度与无缝播放控制。",
      meta: "ORIGINAL DEMO · 16 TRACKS",
      label: "PLAYLIST / 03",
      tone: "ice",
      tracks: [5, 3, 1, 6, 0],
    },
    live: {
      name: "虚拟舞台返场",
      description: "强调现场次序与自动续播的虚构演出歌单，用于验证队列和舞台模式之间的关系。",
      meta: "ORIGINAL DEMO · 14 TRACKS",
      label: "PLAYLIST / 04",
      tone: "yellow",
      tracks: [7, 4, 0, 2, 1, 3],
    },
  };

  const ORIGINAL_LYRICS = [
    "城市把夜色折成透明声波",
    "沿着玻璃星轨，把名字唱亮",
    "节拍越过天台，落进每一扇窗",
    "如果未来很远，就让副歌先抵达",
    "下一束光里，我们继续合唱",
  ];

  const TRANSLATED_LYRICS = [
    "The city folds the night into transparent waves",
    "Along the glass starline, sing the name alight",
    "The beat crosses rooftops and falls through every window",
    "If the future is far, let the chorus arrive first",
    "Inside the next beam, we keep singing together",
  ];

  const state = {
    current: 0,
    playing: false,
    elapsed: 84,
    queue: TRACKS.map((_, index) => index),
    shuffle: false,
    repeat: 0,
    muted: false,
    previousVolume: 72,
    provider: "全部",
    playlist: "starlight",
    lyricsMode: "original",
    liked: new Set([0]),
    mvEnabled: true,
  };

  const body = document.body;
  const playButton = $("#playButton");
  const miniPlay = $("#miniPlay");
  const theaterPlay = $("#theaterPlay");
  const seekRange = $("#seekRange");
  const theaterSeek = $("#theaterSeek");
  const volumeRange = $("#volumeRange");
  const currentTime = $("#currentTime");
  const durationTime = $("#durationTime");
  const theaterCurrentTime = $("#theaterCurrentTime");
  const theaterDurationTime = $("#theaterDurationTime");
  const lyricsTheater = $("#lyricsTheater");
  const theaterMv = $("#theaterMv");
  const theaterFlow = $("#theaterFlow");
  const tweaksTrigger = $("#tweaksTrigger");
  const tweaksPanel = $("#tweaksPanel");
  const globalDrawer = $("#globalDrawer");
  const toast = $("#toast");
  let toastTimer = 0;
  let searchTimer = 0;
  let lastTheaterFocus = null;
  let lastLyricIndex = -1;
  let playbackTimer = 0;
  let lastDrawerFocus = null;

  const escapeHtml = (value) =>
    String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[character]);

  const formatTime = (seconds) => {
    const safe = Math.max(0, Math.floor(Number(seconds) || 0));
    return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
  };

  const updateRange = (input) => {
    if (!input) return;
    const min = Number(input.min) || 0;
    const max = Number(input.max) || 100;
    const percent = max === min ? 0 : ((Number(input.value) - min) / (max - min)) * 100;
    input.style.setProperty("--value", `${percent}%`);
  };

  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2400);
  };

  const toneAttribute = (tone) => tone ? ` data-tone="${escapeHtml(tone)}"` : "";

  const coverMarkup = (track, index) => `
    <span class="signal-cover"${toneAttribute(track.tone)}>
      <b>DEMO / ${String(index + 1).padStart(2, "0")}</b>
    </span>
  `;

  const sourceBadgeClass = (source) => source === "本地" ? "source-badge local" : "source-badge";

  const trackRowMarkup = (trackIndex, displayIndex = trackIndex) => {
    const track = TRACKS[trackIndex];
    return `
      <button
        class="result-row${trackIndex === state.current ? " is-current" : ""}"
        type="button"
        data-play-track="${trackIndex}"
        aria-label="播放 ${escapeHtml(track.shortTitle)}"
      >
        <span class="duration">${String(displayIndex + 1).padStart(2, "0")}</span>
        ${coverMarkup(track, trackIndex)}
        <span class="result-copy"><strong>${escapeHtml(track.title)}</strong><small>${escapeHtml(track.artist)} · ${escapeHtml(track.album)}</small></span>
        <span class="cell-ellipsis">${escapeHtml(track.artist)}</span>
        <span class="cell-ellipsis">${escapeHtml(track.album)}</span>
        <span class="${sourceBadgeClass(track.source)}">${escapeHtml(track.source)}</span>
        <span class="duration">${formatTime(track.duration)}</span>
      </button>
    `;
  };

  const renderRows = (container, indexes) => {
    if (!container) return;
    container.innerHTML = indexes.map((trackIndex, displayIndex) => trackRowMarkup(trackIndex, displayIndex)).join("");
  };

  const queueItemMarkup = (trackIndex, position) => {
    const track = TRACKS[trackIndex];
    return `
      <button
        class="queue-item${trackIndex === state.current ? " is-current" : ""}"
        type="button"
        data-play-track="${trackIndex}"
        aria-label="切换至 ${escapeHtml(track.shortTitle)}"
      >
        <span>${String(position + 1).padStart(2, "0")}</span>
        <span class="queue-copy"><strong>${escapeHtml(track.shortTitle)}</strong><small>${escapeHtml(track.artist)} · ${escapeHtml(track.album)}</small></span>
        <span class="duration">${formatTime(track.duration)}</span>
      </button>
    `;
  };

  const renderQueue = () => {
    const stageQueue = $("#queueList");
    const drawerQueue = $("#globalQueueList");
    if (stageQueue) {
      stageQueue.innerHTML = state.queue.slice(0, 3).map(queueItemMarkup).join("") ||
        '<div class="state-panel is-visible" style="min-height:160px"><div class="state-copy"><div class="state-code">Ø</div><h2>队列为空</h2><p>从搜索、曲库或歌单添加一首演示曲目。</p></div></div>';
    }
    if (drawerQueue) {
      drawerQueue.innerHTML = state.queue.map(queueItemMarkup).join("") ||
        '<div class="state-panel is-visible"><div class="state-copy"><div class="state-code">Ø</div><h2>队列为空</h2><p>选择任意演示曲目即可重建播放队列。</p></div></div>';
    }
  };

  const syncMvPlayback = () => {
    if (!theaterMv || !state.mvEnabled || !body.classList.contains("lyrics-theater-open")) return;
    if (state.playing) {
      const playPromise = theaterMv.play();
      if (playPromise && typeof playPromise.catch === "function") playPromise.catch(() => {});
    } else {
      theaterMv.pause();
    }
  };

  const syncTheaterMv = () => {
    if (!theaterMv || !lyricsTheater) return;
    const track = TRACKS[state.current];
    lyricsTheater.classList.toggle("mv-on", state.mvEnabled);
    theaterMv.classList.remove("is-ready");
    if (!state.mvEnabled) {
      theaterMv.pause();
      theaterMv.removeAttribute("src");
      theaterMv.load();
      return;
    }
    if (theaterMv.dataset.trackIndex === String(state.current) && theaterMv.getAttribute("src")) {
      theaterMv.classList.add("is-ready");
      syncMvPlayback();
      return;
    }
    theaterMv.dataset.trackIndex = String(state.current);
    theaterMv.src = track.mv || DEMO_MV[state.current % DEMO_MV.length];
    theaterMv.load();
  };

  const setPlaying = (playing, announce = false) => {
    state.playing = playing;
    body.classList.toggle("is-playing", playing);
    [playButton, miniPlay, theaterPlay].forEach((button) => {
      if (!button) return;
      button.setAttribute("aria-pressed", String(playing));
      button.setAttribute("aria-label", playing ? "暂停" : "播放");
    });
    syncMvPlayback();
    if (announce) showToast(playing ? "正在播放原型时间线 · 未连接真实音频" : "播放已暂停");
  };

  const seekToLyricIndex = (lyricIndex) => {
    const track = TRACKS[state.current];
    const safeIndex = Math.max(0, Math.min(ORIGINAL_LYRICS.length - 1, Number(lyricIndex) || 0));
    state.elapsed = Math.floor((safeIndex / ORIGINAL_LYRICS.length) * track.duration);
    updateProgress();
  };

  const updateLyricsFromProgress = () => {
    const track = TRACKS[state.current];
    const progress = track.duration ? state.elapsed / track.duration : 0;
    const lyricIndex = Math.max(0, Math.min(ORIGINAL_LYRICS.length - 1, Math.floor(progress * ORIGINAL_LYRICS.length)));
    const withinLine = (progress * ORIGINAL_LYRICS.length - lyricIndex) * 100;

    $$(".lyric-line").forEach((line, index) => line.classList.toggle("is-active", index === lyricIndex));
    $$("#drawerLyric p").forEach((line, index) => line.classList.toggle("is-active", index === lyricIndex));
    $$(".theater-lyric").forEach((line, index) => line.classList.toggle("is-active", index === lyricIndex));
    const lyricProgress = $("#lyricProgress");
    if (lyricProgress) lyricProgress.style.width = `${Math.max(6, Math.min(100, withinLine))}%`;

    if (body.classList.contains("lyrics-theater-open") && theaterFlow && lyricIndex !== lastLyricIndex) {
      const activeLine = theaterFlow.querySelector(".theater-lyric.is-active");
      if (activeLine) {
        activeLine.scrollIntoView({ block: "center", behavior: body.classList.contains("motion-off") ? "auto" : "smooth" });
      }
    }
    lastLyricIndex = lyricIndex;
  };

  const updateProgress = () => {
    const track = TRACKS[state.current];
    const elapsed = Math.min(state.elapsed, track.duration);
    seekRange.max = String(track.duration);
    seekRange.value = String(elapsed);
    currentTime.textContent = formatTime(state.elapsed);
    durationTime.textContent = formatTime(track.duration);
    updateRange(seekRange);
    if (theaterSeek) {
      theaterSeek.max = String(track.duration);
      theaterSeek.value = String(elapsed);
      updateRange(theaterSeek);
    }
    if (theaterCurrentTime) theaterCurrentTime.textContent = formatTime(state.elapsed);
    if (theaterDurationTime) theaterDurationTime.textContent = formatTime(track.duration);
    updateLyricsFromProgress();
  };

  const syncTrackText = () => {
    const track = TRACKS[state.current];
    [
      ["#stageTrackTitle", track.title],
      ["#stageTrackArtist", `${track.artist} · ${track.album} · ORIGINAL DEMO`],
      ["#playerTrackTitle", track.title],
      ["#playerTrackArtist", `${track.artist} · ${track.album}`],
      ["#miniTrackTitle", track.title],
      ["#miniTrackArtist", `${track.artist} · ${track.album}`],
      ["#theaterTrackTitle", track.title],
      ["#theaterTrackArtist", `${track.artist} · ${track.album}`],
    ].forEach(([selector, text]) => {
      const element = $(selector);
      if (element) element.textContent = text;
    });
    const stageLyricTitle = $(".lyrics-meta h1");
    const stageLyricArtist = $(".lyrics-meta p");
    if (stageLyricTitle) stageLyricTitle.textContent = track.shortTitle;
    if (stageLyricArtist) stageLyricArtist.textContent = `${track.artist} · ${track.album}`;
    $$(".demo-cover").forEach((cover) => {
      cover.textContent = String(state.current + 1).padStart(2, "0");
    });
    const favoriteButton = $("#favoriteButton");
    if (favoriteButton) {
      const liked = state.liked.has(state.current);
      favoriteButton.classList.toggle("is-active", liked);
      favoriteButton.setAttribute("aria-pressed", String(liked));
      favoriteButton.setAttribute("aria-label", liked ? "取消收藏当前曲目" : "收藏当前曲目");
    }
    if (body.classList.contains("lyrics-theater-open")) syncTheaterMv();
  };

  const syncCurrentRows = () => {
    $$("[data-play-track]").forEach((row) => {
      const current = Number(row.dataset.playTrack) === state.current;
      row.classList.toggle("is-current", current);
      if (current) row.setAttribute("aria-current", "true");
      else row.removeAttribute("aria-current");
    });
  };

  const setTrack = (trackIndex, options = {}) => {
    const { autoplay = true, announce = true } = options;
    const safeIndex = ((Number(trackIndex) % TRACKS.length) + TRACKS.length) % TRACKS.length;
    state.current = safeIndex;
    state.elapsed = 0;
    lastLyricIndex = -1;
    if (!state.queue.includes(safeIndex)) state.queue.push(safeIndex);
    syncTrackText();
    renderQueue();
    renderLibrary();
    renderSearch($("#globalSearch")?.value || "");
    renderPlaylist(state.playlist);
    updateProgress();
    syncCurrentRows();
    if (autoplay) setPlaying(true);
    if (announce) showToast(`已切换至「${TRACKS[safeIndex].shortTitle}」· 原型演示`);
  };

  const nextTrack = () => {
    if (!state.queue.length) {
      setPlaying(false);
      showToast("播放队列为空");
      return;
    }
    if (state.repeat === 2) {
      state.elapsed = 0;
      updateProgress();
      return;
    }
    if (state.shuffle) {
      let next = state.current;
      while (TRACKS.length > 1 && next === state.current) next = Math.floor(Math.random() * TRACKS.length);
      setTrack(next, { autoplay: state.playing });
      return;
    }
    const queuePosition = Math.max(0, state.queue.indexOf(state.current));
    const atEnd = queuePosition >= state.queue.length - 1;
    if (atEnd && state.repeat === 0) {
      setPlaying(false);
      state.elapsed = TRACKS[state.current].duration;
      updateProgress();
      showToast("队列播放完毕");
      return;
    }
    const nextPosition = atEnd ? 0 : queuePosition + 1;
    setTrack(state.queue[nextPosition], { autoplay: state.playing });
  };

  const previousTrack = () => {
    if (state.elapsed > 4) {
      state.elapsed = 0;
      updateProgress();
      return;
    }
    const queuePosition = Math.max(0, state.queue.indexOf(state.current));
    const previousPosition = queuePosition <= 0 ? state.queue.length - 1 : queuePosition - 1;
    setTrack(state.queue[previousPosition] ?? state.current, { autoplay: state.playing });
  };

  const switchView = (view, options = {}) => {
    const { focusSearch = false } = options;
    const navButton = $(`.nav-button[data-view="${view}"]`);
    if (!navButton) return;
    $$(".nav-button").forEach((button) => button.classList.toggle("is-active", button === navButton));
    $$(".view").forEach((panel) => panel.classList.toggle("is-active", panel.id === `view-${view}`));
    const viewNumber = Number(navButton.dataset.key);
    $("#routeCode").textContent = `${view === "stage" ? "LIVE DESK" : "MODULE"} / ${String(viewNumber).padStart(2, "0")}`;
    $("#routeTitle").textContent = `${navButton.dataset.route}${view === "stage" ? " · Virtual Stage" : ""}`;
    const canvas = $(".canvas");
    if (canvas) canvas.scrollTop = 0;
    if (focusSearch) window.setTimeout(() => $("#globalSearch")?.focus(), 80);
  };

  const setSearchState = (searchState) => {
    const resultsState = $("#searchResultsState");
    const statePanels = {
      loading: $("#searchLoading"),
      empty: $("#searchEmpty"),
      error: $("#searchError"),
    };
    if (resultsState) resultsState.hidden = searchState !== "results";
    Object.entries(statePanels).forEach(([name, panel]) => panel?.classList.toggle("is-visible", name === searchState));
    if ($("#searchStatePreview")) $("#searchStatePreview").value = searchState;
  };

  const filteredTrackIndexes = (query = "") => {
    const normalized = query.trim().toLowerCase();
    return TRACKS.map((track, index) => ({ track, index }))
      .filter(({ track }) => state.provider === "全部" || track.source === state.provider)
      .filter(({ track }) => !normalized ||
        `${track.title} ${track.artist} ${track.album} ${track.source}`.toLowerCase().includes(normalized))
      .map(({ index }) => index);
  };

  const renderSearch = (query = "") => {
    const normalized = query.trim().toLowerCase();
    if (normalized === "错误" || normalized === "error") {
      setSearchState("error");
      return;
    }
    const indexes = filteredTrackIndexes(query);
    renderRows($("#searchResultRows"), indexes);
    setSearchState(indexes.length ? "results" : "empty");
  };

  const runSearch = (query) => {
    window.clearTimeout(searchTimer);
    setSearchState("loading");
    searchTimer = window.setTimeout(() => renderSearch(query), 420);
  };

  const renderLibrary = () => {
    const query = ($("#libraryFilter")?.value || "").trim().toLowerCase();
    const sort = $("#librarySort")?.value || "recent";
    let indexes = TRACKS.map((_, index) => index).filter((index) => {
      const track = TRACKS[index];
      return !query || `${track.title} ${track.artist} ${track.album}`.toLowerCase().includes(query);
    });
    if (sort === "title") indexes.sort((a, b) => TRACKS[a].title.localeCompare(TRACKS[b].title, "zh-CN"));
    if (sort === "artist") indexes.sort((a, b) => TRACKS[a].artist.localeCompare(TRACKS[b].artist, "zh-CN"));
    if (sort === "duration") indexes.sort((a, b) => TRACKS[a].duration - TRACKS[b].duration);
    renderRows($("#libraryRows"), indexes);
  };

  const setLibraryTab = (tabName) => {
    $$("[data-library-tab]").forEach((tab) => {
      const active = tab.dataset.libraryTab === tabName;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
    });
    $$(".library-pane").forEach((pane) => pane.classList.toggle("is-active", pane.id === `library-${tabName}`));
  };

  const renderPlaylist = (playlistKey) => {
    const playlist = PLAYLISTS[playlistKey] || PLAYLISTS.starlight;
    state.playlist = playlistKey in PLAYLISTS ? playlistKey : "starlight";
    $("#playlistName").textContent = playlist.name;
    $("#playlistDescription").textContent = playlist.description;
    $("#playlistMeta").textContent = playlist.meta;
    $("#playlistCoverLabel").textContent = playlist.label;
    const cover = $("#playlistCover");
    if (cover) {
      if (playlist.tone) cover.dataset.tone = playlist.tone;
      else delete cover.dataset.tone;
    }
    $$(".collection-item").forEach((item) => item.classList.toggle("is-active", item.dataset.playlistKey === state.playlist));
    renderRows($("#playlistRows"), playlist.tracks);
  };

  const openPlaylist = (playlistKey) => {
    renderPlaylist(playlistKey);
    switchView("playlists");
  };

  const buildEqualizer = () => {
    const frequencies = ["32", "64", "125", "250", "500", "1k", "2k", "4k", "8k", "16k"];
    $("#eqGrid").innerHTML = frequencies.map((frequency, index) => `
      <label class="eq-band">
        <input type="range" min="-12" max="12" step="1" value="0" data-eq-band="${index}" aria-label="${frequency} Hz 增益" />
        <output>0dB</output>
        <span>${frequency}</span>
      </label>
    `).join("");
  };

  const EQ_PRESETS = {
    flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    vocal: [-2, -1, 0, 2, 4, 4, 3, 1, 0, -1],
    electronic: [5, 4, 2, 0, -1, 0, 2, 4, 5, 4],
    bass: [7, 6, 4, 2, 0, -1, -2, -2, -1, 0],
    bright: [-1, 0, 1, 2, 2, 1, 2, 3, 5, 6],
  };

  const setEqBandValue = (input, value) => {
    input.value = String(value);
    const output = input.parentElement.querySelector("output");
    output.textContent = `${value > 0 ? "+" : ""}${value}dB`;
  };

  const applyEqPreset = (presetName) => {
    const values = EQ_PRESETS[presetName] || EQ_PRESETS.flat;
    $$("[data-eq-band]").forEach((input, index) => setEqBandValue(input, values[index]));
    $$(".preset-button").forEach((button) => button.classList.toggle("is-active", button.dataset.preset === presetName));
  };

  const buildSpectrum = () => {
    const spectrum = $("#spectrum");
    if (!spectrum) return;
    spectrum.innerHTML = "";
    for (let index = 0; index < 28; index += 1) {
      const bar = document.createElement("i");
      bar.style.setProperty("--height", `${18 + ((index * 19) % 58)}%`);
      bar.style.setProperty("--scale", String(1.15 + ((index * 7) % 11) / 10));
      bar.style.setProperty("--speed", `${520 + (index % 6) * 90}ms`);
      bar.style.animationDelay = `${-index * 41}ms`;
      spectrum.appendChild(bar);
    }
  };

  const buildStageWave = () => {
    const waveDeck = $("#waveDeck");
    if (!waveDeck) return;
    waveDeck.innerHTML = "";
    for (let index = 0; index < 42; index += 1) {
      const bar = document.createElement("i");
      bar.style.setProperty("--duration", `${460 + (index % 7) * 85}ms`);
      bar.style.setProperty("--gain", String(1.4 + ((index * 11) % 24) / 6));
      bar.style.animationDelay = `${-index * 37}ms`;
      waveDeck.appendChild(bar);
    }
  };

  const setLyricsMode = (mode) => {
    state.lyricsMode = mode;
    $$("[data-lyrics-mode]").forEach((button) => button.classList.toggle("is-active", button.dataset.lyricsMode === mode));
    const lyrics = mode === "translation" ? TRANSLATED_LYRICS : ORIGINAL_LYRICS;
    $$(".lyric-line").forEach((line, index) => {
      line.textContent = lyrics[index] || "";
    });
    $$("#drawerLyric p").forEach((line, index) => {
      line.textContent = lyrics[index] || "";
    });
    $$(".theater-lyric").forEach((line, index) => {
      line.textContent = lyrics[index] || "";
    });
    updateLyricsFromProgress();
  };

  const setMvEnabled = (enabled, announce = false) => {
    state.mvEnabled = Boolean(enabled);
    const toggle = $("#theaterMvToggle");
    if (toggle) {
      toggle.classList.toggle("is-active", state.mvEnabled);
      toggle.setAttribute("aria-pressed", String(state.mvEnabled));
      toggle.textContent = state.mvEnabled ? "MV 背景" : "氛围背景";
    }
    if (lyricsTheater) lyricsTheater.classList.toggle("mv-on", state.mvEnabled);
    syncTheaterMv();
    if (announce) showToast(state.mvEnabled ? "已开启演示 MV 背景" : "已切换为氛围舞台背景");
  };

  const openLyricsTheater = () => {
    if (!lyricsTheater) return;
    if (body.classList.contains("drawer-open")) closeDrawer();
    lastTheaterFocus = document.activeElement;
    body.classList.add("lyrics-theater-open");
    body.classList.remove("mini-mode");
    lyricsTheater.hidden = false;
    lyricsTheater.setAttribute("aria-hidden", "false");
    $(".app")?.setAttribute("inert", "");
    tweaksTrigger?.setAttribute("inert", "");
    miniPlayerInert(true);
    lastLyricIndex = -1;
    syncTrackText();
    updateProgress();
    syncTheaterMv();
    $("#theaterClose")?.focus();
  };

  const closeLyricsTheater = () => {
    if (!lyricsTheater) return;
    body.classList.remove("lyrics-theater-open");
    lyricsTheater.hidden = true;
    lyricsTheater.setAttribute("aria-hidden", "true");
    $(".app")?.removeAttribute("inert");
    tweaksTrigger?.removeAttribute("inert");
    miniPlayerInert(false);
    if (theaterMv) {
      theaterMv.pause();
    }
    if (lastTheaterFocus instanceof HTMLElement) lastTheaterFocus.focus();
  };

  const miniPlayerInert = (inert) => {
    const mini = $("#miniPlayer");
    if (!mini) return;
    if (inert) mini.setAttribute("inert", "");
    else mini.removeAttribute("inert");
  };

  const openDrawer = (tabName = "queue") => {
    lastDrawerFocus = document.activeElement;
    body.classList.add("drawer-open");
    if (!body.classList.contains("lyrics-theater-open")) {
      $(".app").setAttribute("inert", "");
      tweaksTrigger.setAttribute("inert", "");
    }
    globalDrawer.setAttribute("aria-hidden", "false");
    globalDrawer.removeAttribute("inert");
    setDrawerTab(tabName);
    $("#drawerClose").focus();
  };

  const closeDrawer = () => {
    body.classList.remove("drawer-open");
    if (!body.classList.contains("lyrics-theater-open")) {
      $(".app").removeAttribute("inert");
      tweaksTrigger.removeAttribute("inert");
    }
    globalDrawer.setAttribute("aria-hidden", "true");
    globalDrawer.setAttribute("inert", "");
    if (lastDrawerFocus instanceof HTMLElement) lastDrawerFocus.focus();
  };

  const setDrawerTab = (tabName) => {
    $$(".drawer-tab").forEach((tab) => {
      const active = tab.dataset.drawerTab === tabName;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
    });
    $$(".drawer-pane").forEach((pane) => pane.classList.toggle("is-active", pane.id === `drawer-${tabName}`));
  };

  const closeTweaks = () => {
    tweaksPanel.hidden = true;
    tweaksTrigger.hidden = false;
    tweaksTrigger.setAttribute("aria-expanded", "false");
    tweaksTrigger.focus();
  };

  const applyStageVariant = (variant) => {
    body.dataset.stage = variant;
    $("#stageVariant").value = variant;
    $$("[data-stage-setting]").forEach((button) => button.classList.toggle("is-active", button.dataset.stageSetting === variant));
  };

  const applyMotionPreference = (reduced) => {
    body.classList.toggle("motion-off", reduced);
    $("#motionToggle").checked = !reduced;
    $("#reduceMotionSetting").checked = reduced;
  };

  const handlePrototypeAction = (action) => {
    if (action === "radio") {
      const next = (state.current + 3) % TRACKS.length;
      setTrack(next);
      showToast("私人电台已生成下一首演示曲目");
    }
    if (action === "daily-mix") {
      state.queue = TRACKS.map((_, index) => index).sort(() => Math.random() - .5);
      renderQueue();
      setTrack(state.queue[0]);
      showToast("今日混音已生成 · 8 首原型曲目");
    }
    if (action === "history") {
      switchView("library");
      showToast("已打开曲库 · 完整产品可在此切换收听历史");
    }
    if (action === "connect-server" || action === "connect-lastfm") {
      showToast("连接流程为设计占位，不会发送账户或服务器信息");
    }
  };

  const bindStaticEvents = () => {
    $$(".nav-button").forEach((button) => {
      button.addEventListener("click", () => switchView(button.dataset.view));
    });

    $("#searchAction").addEventListener("click", () => switchView("search", { focusSearch: true }));

    [playButton, miniPlay, theaterPlay].forEach((button) => {
      if (!button) return;
      button.addEventListener("click", () => setPlaying(!state.playing, true));
    });
    $("#prevButton").addEventListener("click", previousTrack);
    $("#miniPrev").addEventListener("click", previousTrack);
    $("#theaterPrev")?.addEventListener("click", previousTrack);
    $("#nextButton").addEventListener("click", nextTrack);
    $("#miniNext").addEventListener("click", nextTrack);
    $("#theaterNext")?.addEventListener("click", nextTrack);

    $("#shuffleButton").addEventListener("click", () => {
      state.shuffle = !state.shuffle;
      $("#shuffleButton").classList.toggle("is-active", state.shuffle);
      $("#shuffleButton").setAttribute("aria-pressed", String(state.shuffle));
      showToast(state.shuffle ? "随机播放已开启" : "随机播放已关闭");
    });

    $("#repeatButton").addEventListener("click", () => {
      state.repeat = (state.repeat + 1) % 3;
      const labels = ["循环关闭", "列表循环", "单曲循环"];
      $("#repeatButton").classList.toggle("is-active", state.repeat !== 0);
      $("#repeatButton").setAttribute("aria-pressed", String(state.repeat !== 0));
      $("#repeatButton").setAttribute("aria-label", labels[state.repeat]);
      showToast(labels[state.repeat]);
    });

    const onSeekInput = (event) => {
      state.elapsed = Number(event.target.value);
      updateProgress();
    };
    seekRange.addEventListener("input", onSeekInput);
    theaterSeek?.addEventListener("input", onSeekInput);

    volumeRange.addEventListener("input", () => {
      updateRange(volumeRange);
      if (Number(volumeRange.value) > 0) {
        state.muted = false;
        state.previousVolume = Number(volumeRange.value);
        $("#muteButton").setAttribute("aria-pressed", "false");
      }
    });

    $("#muteButton").addEventListener("click", () => {
      state.muted = !state.muted;
      if (state.muted) {
        state.previousVolume = Number(volumeRange.value) || state.previousVolume;
        volumeRange.value = "0";
      } else {
        volumeRange.value = String(state.previousVolume || 72);
      }
      updateRange(volumeRange);
      $("#muteButton").setAttribute("aria-pressed", String(state.muted));
      showToast(state.muted ? "已静音" : `音量 ${volumeRange.value}%`);
    });

    $("#favoriteButton").addEventListener("click", () => {
      if (state.liked.has(state.current)) state.liked.delete(state.current);
      else state.liked.add(state.current);
      syncTrackText();
      showToast(state.liked.has(state.current) ? "已加入收藏" : "已取消收藏");
    });

    $("#globalSearch").addEventListener("input", (event) => runSearch(event.target.value));
    $("#searchStatePreview").addEventListener("change", (event) => {
      if (event.target.value === "results") renderSearch($("#globalSearch").value);
      else setSearchState(event.target.value);
    });
    $("#clearSearch").addEventListener("click", () => {
      $("#globalSearch").value = "";
      state.provider = "全部";
      $$(".provider-chip").forEach((chip) => chip.classList.toggle("is-active", chip.dataset.provider === "全部"));
      renderSearch();
      $("#globalSearch").focus();
    });
    $("#retrySearch").addEventListener("click", () => {
      setSearchState("loading");
      window.setTimeout(() => {
        $("#globalSearch").value = "";
        renderSearch();
      }, 620);
    });
    $$(".provider-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        state.provider = chip.dataset.provider;
        $$(".provider-chip").forEach((item) => item.classList.toggle("is-active", item === chip));
        runSearch($("#globalSearch").value);
      });
    });

    $$("[data-library-tab]").forEach((tab) => {
      tab.addEventListener("click", () => setLibraryTab(tab.dataset.libraryTab));
    });
    $("#libraryFilter").addEventListener("input", renderLibrary);
    $("#librarySort").addEventListener("change", renderLibrary);
    $("#importLocal").addEventListener("click", () => {
      setLibraryTab("local");
      showToast("文件夹导入为交互占位，不会读取真实文件");
    });
    $("#localPermission").addEventListener("click", () => {
      const stateCopy = $("#library-local .state-copy");
      stateCopy.querySelector(".state-code").textContent = "03";
      stateCopy.querySelector("h2").textContent = "已发现 3 个演示文件";
      stateCopy.querySelector("p").textContent = "成功状态仅用于展示扫描结果；原型仍未访问真实文件系统。";
      $("#localPermission").textContent = "重新选择";
      showToast("演示扫描完成 · 3 个占位文件");
    });

    $$(".collection-item").forEach((item) => {
      item.addEventListener("click", () => renderPlaylist(item.dataset.playlistKey));
    });
    $("#playlistPlay").addEventListener("click", () => {
      state.queue = [...PLAYLISTS[state.playlist].tracks];
      renderQueue();
      setTrack(state.queue[0]);
    });
    $("#playlistShuffle").addEventListener("click", () => {
      state.queue = [...PLAYLISTS[state.playlist].tracks].sort(() => Math.random() - .5);
      renderQueue();
      setTrack(state.queue[0]);
    });
    $("#playlistDownload").addEventListener("click", () => showToast("已加入原型下载队列 · 不会产生真实文件"));
    $("#playlistShare").addEventListener("click", () => showToast("分享链接预览已生成 · 原型未写入剪贴板"));
    $("#newPlaylist").addEventListener("click", () => showToast("新建歌单弹窗将在产品实现中收集名称与可见性"));

    $$(".preset-button").forEach((button) => {
      button.addEventListener("click", () => {
        applyEqPreset(button.dataset.preset);
        showToast(`均衡器预设：${button.textContent}`);
      });
    });
    $("#eqGrid").addEventListener("input", (event) => {
      const input = event.target.closest("[data-eq-band]");
      if (!input) return;
      setEqBandValue(input, Number(input.value));
      $$(".preset-button").forEach((button) => button.classList.remove("is-active"));
    });
    $("#eqEnabled").addEventListener("change", (event) => {
      $$("[data-eq-band]").forEach((input) => { input.disabled = !event.target.checked; });
      showToast(event.target.checked ? "均衡器已启用（演示）" : "均衡器已旁路");
    });
    $("#eqReset").addEventListener("click", () => applyEqPreset("flat"));
    $("#savePreset").addEventListener("click", () => showToast("当前曲线已保存为「自定义 01」（原型）"));
    $("#crossfadeRange").addEventListener("input", () => {
      $("#crossfadeOutput").textContent = `${$("#crossfadeRange").value}s`;
      updateRange($("#crossfadeRange"));
    });

    $("#audioShortcut").addEventListener("click", () => switchView("audio"));
    $("#queueDrawerButton").addEventListener("click", () => openDrawer("queue"));
    $("#lyricsDrawerButton").addEventListener("click", openLyricsTheater);
    $("#openLyricsTheater")?.addEventListener("click", openLyricsTheater);
    $("#expandLyricsTheater")?.addEventListener("click", openLyricsTheater);
    $("#theaterClose")?.addEventListener("click", closeLyricsTheater);
    $("#theaterMvToggle")?.addEventListener("click", () => setMvEnabled(!state.mvEnabled, true));
    $("#theaterDrawerLink")?.addEventListener("click", () => openDrawer("lyrics"));
    theaterMv?.addEventListener("loadeddata", () => {
      theaterMv.classList.add("is-ready");
      syncMvPlayback();
    });
    theaterMv?.addEventListener("error", () => {
      theaterMv.classList.remove("is-ready");
      if (state.mvEnabled) showToast("演示 MV 暂不可用 · 已保留氛围背景");
    });
    $("#drawerClose").addEventListener("click", closeDrawer);
    $("#drawerScrim").addEventListener("click", closeDrawer);
    $$(".drawer-tab").forEach((tab) => tab.addEventListener("click", () => setDrawerTab(tab.dataset.drawerTab)));
    $("#clearQueue").addEventListener("click", () => {
      state.queue = [];
      renderQueue();
      showToast("播放队列已清空");
    });
    $("#queueToPlaylist").addEventListener("click", () => showToast("当前队列已保存为「未命名 01」（原型）"));
    $("#autoDj").addEventListener("click", () => {
      const next = $("#autoDj").getAttribute("aria-pressed") !== "true";
      $("#autoDj").setAttribute("aria-pressed", String(next));
      $("#autoDj").classList.toggle("is-active", next);
      showToast(next ? "自动续播已开启" : "自动续播已关闭");
    });
    $("#saveQueue").addEventListener("click", () => showToast("播放队列已保存为新歌单（原型）"));

    $("#miniButton").addEventListener("click", () => {
      closeDrawer();
      body.classList.add("mini-mode");
      $("#miniPlay").focus();
    });
    $("#miniClose").addEventListener("click", () => {
      body.classList.remove("mini-mode");
      $("#miniButton").focus();
    });

    tweaksTrigger.addEventListener("click", () => {
      tweaksPanel.hidden = false;
      tweaksTrigger.hidden = true;
      tweaksTrigger.setAttribute("aria-expanded", "true");
      $("#stageVariant").focus();
    });
    $("#tweaksClose").addEventListener("click", closeTweaks);
    $("#stageVariant").addEventListener("change", (event) => applyStageVariant(event.target.value));
    $("#motionToggle").addEventListener("change", (event) => applyMotionPreference(!event.target.checked));

    $$("[data-stage-setting]").forEach((button) => {
      button.addEventListener("click", () => applyStageVariant(button.dataset.stageSetting));
    });
    $("#reduceMotionSetting").addEventListener("change", (event) => applyMotionPreference(event.target.checked));
    $("#compactMode").addEventListener("change", (event) => body.classList.toggle("compact-mode", event.target.checked));
    $("#lyricSize").addEventListener("change", (event) => { body.dataset.lyricSize = event.target.value; });
    $("#sleepTimer").addEventListener("change", (event) => showToast(`睡眠定时：${event.target.value}`));
    $("#outputDevice").addEventListener("change", (event) => showToast(`输出设备：${event.target.value}（演示）`));
    $("#clearDownloads").addEventListener("click", () => showToast("没有已完成的下载任务"));

    $$("[data-lyrics-mode]").forEach((button) => {
      button.addEventListener("click", () => setLyricsMode(button.dataset.lyricsMode));
    });

    document.addEventListener("click", (event) => {
      const lyricTarget = event.target.closest(".lyric-line, .theater-lyric, #drawerLyric p");
      if (lyricTarget) {
        const container = lyricTarget.parentElement;
        const index = Array.from(container.children).indexOf(lyricTarget);
        if (index >= 0) seekToLyricIndex(index);
        return;
      }

      const trackTarget = event.target.closest("[data-play-track]");
      if (trackTarget) {
        setTrack(Number(trackTarget.dataset.playTrack));
        return;
      }

      const playlistTarget = event.target.closest("[data-open-playlist]");
      if (playlistTarget) {
        openPlaylist(playlistTarget.dataset.openPlaylist);
        return;
      }

      const routeTarget = event.target.closest("[data-route-target]");
      if (routeTarget) {
        switchView(routeTarget.dataset.routeTarget);
        return;
      }

      const actionTarget = event.target.closest("[data-action]");
      if (actionTarget) handlePrototypeAction(actionTarget.dataset.action);
    });

    document.addEventListener("keydown", (event) => {
      const typing = /^(INPUT|SELECT|TEXTAREA)$/.test(event.target.tagName);

      if (body.classList.contains("drawer-open") && event.key === "Tab") {
        const focusable = $$(
          "#globalDrawer button:not([disabled]), #globalDrawer input:not([disabled]), #globalDrawer select:not([disabled]), #globalDrawer a[href]"
        ).filter((element) => element.offsetParent !== null);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }

      if (body.classList.contains("lyrics-theater-open") && !body.classList.contains("drawer-open") && event.key === "Tab") {
        const focusable = $$(
          "#lyricsTheater button:not([disabled]), #lyricsTheater input:not([disabled]), #lyricsTheater a[href]"
        ).filter((element) => !element.hasAttribute("disabled"));
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (body.classList.contains("lyrics-theater-open")) closeLyricsTheater();
        switchView("search", { focusSearch: true });
        return;
      }

      if (event.key === "Escape") {
        if (body.classList.contains("drawer-open")) closeDrawer();
        else if (body.classList.contains("lyrics-theater-open")) closeLyricsTheater();
        else if (!tweaksPanel.hidden) closeTweaks();
        else if (body.classList.contains("mini-mode")) {
          body.classList.remove("mini-mode");
          $("#miniButton").focus();
        }
        return;
      }

      if (typing) return;

      if (event.code === "Space") {
        event.preventDefault();
        setPlaying(!state.playing, true);
      }
      if (event.key.toLowerCase() === "n") nextTrack();
      if (event.key.toLowerCase() === "p") previousTrack();
      if (event.key.toLowerCase() === "m") $("#muteButton").click();
      if (event.key.toLowerCase() === "l") {
        if (body.classList.contains("lyrics-theater-open")) closeLyricsTheater();
        else openLyricsTheater();
      }
      if (event.key.toLowerCase() === "q") {
        if (body.classList.contains("drawer-open")) closeDrawer();
        else openDrawer("queue");
      }
      if (/^[1-7]$/.test(event.key)) {
        const button = $(`.nav-button[data-key="${event.key}"]`);
        if (button) {
          if (body.classList.contains("lyrics-theater-open")) closeLyricsTheater();
          switchView(button.dataset.view);
        }
      }
    });
  };

  const initialize = () => {
    buildStageWave();
    buildSpectrum();
    buildEqualizer();
    renderSearch();
    renderLibrary();
    renderPlaylist("starlight");
    renderQueue();
    syncTrackText();
    updateProgress();
    updateRange(volumeRange);
    updateRange($("#crossfadeRange"));
    applyStageVariant("star-river");
    setLyricsMode("original");
    setMvEnabled(true);
    bindStaticEvents();
    setPlaying(false);

    playbackTimer = window.setInterval(() => {
      if (!state.playing) return;
      state.elapsed += 1;
      if (state.elapsed >= TRACKS[state.current].duration) nextTrack();
      else updateProgress();
    }, 1000);

    window.addEventListener("beforeunload", () => window.clearInterval(playbackTimer), { once: true });
  };

  initialize();
})();
