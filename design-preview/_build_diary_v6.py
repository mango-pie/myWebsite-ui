# -*- coding: utf-8 -*-
"""Build Diary v6 polish from actual Diary v5 (UTF-8)."""
from pathlib import Path

SRC = Path(__file__).with_name("Diary v5.html")
DST = Path(__file__).with_name("Diary v6.html")
text = SRC.read_text(encoding="utf-8")

# --- meta ---
text = text.replace("日记设计预览 v5", "日记设计预览 v6", 1)
text = text.replace(
    "Diary v5 — calendar natural size; leftover space = diary deco\n   Feedback on v4: don't vertically stretch calendar cells;\n   fill blanks with non-functional journal decorations",
    "Diary v6 — polish: diary-native deco craft + interaction UX\n   From v5: reactive scrapbook props, mood craft, keys, autosave, transitions",
    1,
)
text = text.replace(
    "Diary v5 · 日历自然高度 · 空白用手账装饰填 · 不纵向拉格",
    "Diary v6 · 手账特色装饰 · 选日联动 · 键盘与自动存草稿",
    1,
)

# --- CSS extras: insert before toast or at end of style before </style> ---
CSS_EXTRAS = r"""
/* ===== v6 polish: reactive craft + interaction ===== */
.cal-top{flex-wrap:wrap}
.today-link{
  margin-left:auto;border:0;background:transparent;cursor:pointer;
  font-size:11px;letter-spacing:1px;color:var(--c-lilac);padding:4px 8px;border-radius:8px;
  transition:background .2s, transform .25s var(--ease-spring);
}
.today-link:hover{background:var(--c-lilac-soft);transform:translateY(-1px)}
.cal-cell{position:relative;cursor:pointer}
.cal-cell:hover:not(.mute){background:rgba(199,154,224,.12);color:var(--ink)}
.cal-cell:active:not(.mute){transform:scale(.94)}
.cal-nav button:active{transform:scale(.92)}
.hint-keys{
  margin-top:6px;font-size:10px;letter-spacing:1px;color:var(--ink-faint);line-height:1.5;
}

/* left craft: mood meter beside polaroid */
.mood-meter{
  margin:0 auto;width:148px;padding:8px 10px 10px;border-radius:12px;
  background:rgba(255,255,255,.72);border:1.5px solid rgba(255,255,255,.95);
  box-shadow:var(--shadow-1);transform:rotate(2deg);
}
.mood-meter .mm-title{font-size:10px;letter-spacing:2px;color:var(--ink-faint)}
.mood-meter .mm-fill{
  margin-top:6px;height:6px;border-radius:999px;overflow:hidden;
  background:rgba(165,172,196,.25);
}
.mood-meter .mm-fill > i{
  display:block;height:100%;width:40%;border-radius:inherit;
  background:linear-gradient(90deg, var(--c-lilac), var(--c-sakura));
  transition:width .4s var(--ease-out), background .35s;
}
.mood-meter .mm-name{
  margin-top:5px;font-size:13px;letter-spacing:1px;color:var(--ink);
}
.deco-corner .polaroid .frame{
  transition:background .45s var(--ease-out), border-color .35s;
}

/* journal scrapbook — richer, date-reactive */
.journal-deco{
  background:
    radial-gradient(ellipse 90% 60% at 10% 15%, rgba(199,154,224,.12), transparent 55%),
    radial-gradient(ellipse 70% 50% at 95% 90%, rgba(244,144,173,.08), transparent 50%),
    rgba(255,255,255,.55);
}
.jd-open-book{
  display:flex;gap:3px;width:112px;height:64px;
  transform:rotate(-5deg);filter:drop-shadow(0 4px 8px rgba(90,100,150,.1));
  flex:none;
}
.jd-page{
  flex:1;border-radius:3px 7px 7px 3px;
  background:
    repeating-linear-gradient(transparent, transparent 8px, rgba(199,154,224,.08) 8px, rgba(199,154,224,.08) 9px),
    linear-gradient(180deg, #fffdfb, #f3ebe3);
  border:1px solid rgba(165,172,196,.35);position:relative;
}
.jd-page:first-child{border-radius:7px 3px 3px 7px}
.jd-page::after{
  content:"";position:absolute;left:5px;right:5px;top:12px;height:1px;
  background:rgba(199,154,224,.3);
}
.jd-page:nth-child(2)::after{top:22px;width:50%;right:auto}
.jd-pressed-flower{
  width:26px;height:26px;border-radius:50% 50% 48% 52%;flex:none;
  background:
    radial-gradient(circle at 40% 40%, rgba(244,144,173,.55), transparent 55%),
    radial-gradient(circle at 62% 58%, rgba(199,154,224,.4), transparent 50%);
  transform:rotate(18deg);opacity:.9;
  box-shadow:inset 0 0 0 1px rgba(199,154,224,.2);
}
.jd-craft-row{display:flex;align-items:center;gap:12px;margin-top:4px}
.jd-date-stamp{
  width:64px;height:64px;border-radius:50%;flex:none;
  display:grid;place-items:center;text-align:center;line-height:1.05;
  border:2px solid rgba(154,111,184,.55);color:rgba(120,80,140,.9);
  transform:rotate(8deg);opacity:.82;
  background:radial-gradient(circle, rgba(255,252,248,.5), transparent 70%);
  transition:border-color .35s, color .35s, opacity .35s;
}
.jd-date-stamp .m{font-size:8px;letter-spacing:.14em;opacity:.75}
.jd-date-stamp .d{font-size:20px;letter-spacing:.04em}
.jd-date-stamp .y{font-size:8px;letter-spacing:.08em;opacity:.65}
.jd-mood-ribbon{
  display:inline-flex;align-items:center;gap:6px;
  padding:5px 10px;border-radius:999px;
  background:rgba(255,252,248,.85);border:1px solid rgba(165,172,196,.35);
  font-size:10px;letter-spacing:2px;color:var(--ink-soft);
}
.jd-mood-ribbon .dots{display:flex;gap:4px}
.jd-mood-ribbon .dot{
  width:7px;height:7px;border-radius:50%;
  border:1.5px solid rgba(165,172,196,.45);background:transparent;
  transition:background .25s, border-color .25s, transform .25s;
}
.jd-mood-ribbon .dot.on{
  background:var(--c-lilac);border-color:var(--c-lilac);transform:scale(1.15);
}
.jd-labels{display:flex;gap:8px;flex-wrap:wrap;margin-top:2px}
.jd-label{
  padding:4px 9px;font-size:11px;letter-spacing:1px;color:var(--ink-soft);
  background:rgba(242,226,250,.65);border:1px solid rgba(199,154,224,.28);
  box-shadow:0 2px 6px rgba(90,100,150,.06);border-radius:6px;
  transform:rotate(-3deg);transition:background .3s, color .3s;
}
.jd-label.b{transform:rotate(4deg);background:rgba(255,217,228,.55);border-color:rgba(244,144,173,.35)}
.jd-wax{
  transition:background .4s, box-shadow .35s, transform .35s var(--ease-spring);
}
.jd-ticket .v{transition:opacity .2s}
.jd-tab{transition:filter .3s, transform .3s var(--ease-spring)}
.jd-tab.dim{filter:saturate(.45) brightness(1.05);opacity:.65}
.jd-tab.lit{filter:none;opacity:1;transform:rotate(0deg) translateY(1px);z-index:4}

/* day page motion + actions */
.day-page{transition:opacity .2s ease, transform .2s ease}
.day-page.is-switching{opacity:0;transform:translateY(6px)}
.day-page .day-title-hit{cursor:pointer}
.day-page .day-title-hit:hover{color:var(--c-lilac)}
.day-actions{
  flex:none;padding:10px 24px 14px 36px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;
  border-top:1px dashed rgba(165,172,196,.28);
}
.day-foot-deco{border-top:none}

/* draft autosave status */
.draft-status{
  font-size:10px;letter-spacing:1px;color:var(--ink-faint);transition:color .25s;
}
.draft-status.dirty{color:var(--c-lilac)}
.draft-status.saved{color:var(--c-mint)}
.draft-pad .tools{align-items:center}

/* detail foot hint */
.detail-keys{
  font-size:10px;letter-spacing:1px;color:var(--ink-faint);text-align:center;margin-top:6px;
}
"""

# season tabs: v5 had 3; v6 has 4
text = text.replace(
    """.jd-tab{
  width:52px;height:22px;margin-left:-6px;border-radius:0 0 8px 8px;
  font-size:10px;letter-spacing:1px;color:#fff;
  display:grid;place-items:center;
  box-shadow:0 4px 8px rgba(90,100,150,.12);
  transform-origin:top center;
}
.jd-tab:nth-child(1){background:var(--c-lilac);transform:rotate(-2deg);z-index:3}
.jd-tab:nth-child(2){background:var(--c-sakura);transform:rotate(1deg);z-index:2}
.jd-tab:nth-child(3){background:var(--c-mint);transform:rotate(-1deg);z-index:1}""",
    """.jd-tab{
  width:44px;height:22px;margin-left:-6px;border-radius:0 0 8px 8px;
  font-size:10px;letter-spacing:1px;color:#fff;
  display:grid;place-items:center;
  box-shadow:0 4px 8px rgba(90,100,150,.12);
  transform-origin:top center;
}
.jd-tab:nth-child(1){background:var(--c-lilac);transform:rotate(-2deg);z-index:4}
.jd-tab:nth-child(2){background:var(--c-sakura);transform:rotate(1deg);z-index:3}
.jd-tab:nth-child(3){background:var(--c-sun);transform:rotate(-1deg);z-index:2;color:var(--ink)}
.jd-tab:nth-child(4){background:var(--c-blue);transform:rotate(2deg);z-index:1}""",
    1,
)

if "</style>" not in text:
    raise SystemExit("no </style>")
text = text.replace("</style>", CSS_EXTRAS + "\n</style>", 1)

# --- HTML: left deco corner upgrade ---
old_corner = """        <div class="deco-corner glass">
          <span class="tape sun"></span>
          <h3 class="font-display" style="font-size:15px;letter-spacing:2px">手账角</h3>
          <div class="polaroid">
            <div class="frame">[image] 1:1</div>
            <div class="cap font-display">JUL · 手账</div>
          </div>
          <div class="stamp-row">
            <div class="stamp font-display">私密</div>
            <div class="stamp b font-display">一日</div>
          </div>
          <div class="deco-quote">
            <div class="q font-display">「</div>
            <p class="text-pretty">先写给自己看的句子，不必发给任何人。</p>
          </div>
        </div>"""

new_corner = """        <div class="deco-corner glass">
          <span class="tape sun"></span>
          <h3 class="font-display" style="font-size:15px;letter-spacing:2px">私密手账</h3>
          <div class="polaroid">
            <div class="frame" id="polaroidFrame">[image] 1:1</div>
            <div class="cap font-display" id="polaroidCap">JUL · 手账</div>
          </div>
          <div class="mood-meter" title="选中日心情">
            <div class="mm-title">MOOD</div>
            <div class="mm-fill"><i id="moodFill" style="width:40%"></i></div>
            <div class="mm-name font-display" id="moodName">—</div>
          </div>
          <div class="stamp-row">
            <div class="stamp font-display">私密</div>
            <div class="stamp b font-display">一日</div>
          </div>
          <div class="deco-quote">
            <div class="q font-display">「</div>
            <p class="text-pretty">选日子 · 读正文 · 草稿落笔。一日一篇，先写给自己。</p>
          </div>
        </div>"""

if old_corner not in text:
    raise SystemExit("old deco-corner HTML not found")
text = text.replace(old_corner, new_corner, 1)

# --- calendar today link ---
old_cal_top = """              <div class="cal-top">
                <div class="ym font-display" id="calTitle">2026 · 七月</div>
                <div class="cal-nav">
                  <button type="button" id="calPrev" aria-label="上月"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M15 6l-6 6 6 6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
                  <button type="button" id="calNext" aria-label="下月"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M9 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
                </div>
              </div>
              <div class="cal-grid" id="calGrid"></div>
              <div class="cal-foot">
                <span class="leg"><span class="swatch"></span>有日记</span>
                <span>点日期阅读</span>
              </div>"""

new_cal_top = """              <div class="cal-top">
                <div class="ym font-display" id="calTitle">2026 · 七月</div>
                <div class="cal-nav">
                  <button type="button" id="calPrev" aria-label="上月"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M15 6l-6 6 6 6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
                  <button type="button" id="calNext" aria-label="下月"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M9 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
                </div>
                <button type="button" class="today-link" id="btnJumpToday">回到今日</button>
              </div>
              <div class="cal-grid" id="calGrid"></div>
              <div class="cal-foot">
                <span class="leg"><span class="swatch"></span>有日记</span>
                <span>单击阅读 · 双击编辑</span>
              </div>
              <div class="hint-keys">← → 换日 · Enter 编辑 · T 今日 · Esc 列表</div>"""

if old_cal_top not in text:
    raise SystemExit("old cal top not found")
text = text.replace(old_cal_top, new_cal_top, 1)

# --- journal deco HTML ---
old_jd = """            <div class="journal-deco glass" aria-hidden="true">
              <span class="tape sakura"></span>
              <h3 class="font-display">手账道具</h3>
              <div class="jd-bookmarks">
                <div class="jd-tab font-display">春</div>
                <div class="jd-tab font-display">夏</div>
                <div class="jd-tab font-display">记</div>
              </div>
              <div class="jd-row">
                <div class="jd-ticket">
                  <div class="k">TICKET · DAY</div>
                  <div class="v font-display" id="decoTicket">给这一天留一张票根</div>
                </div>
                <div class="jd-wax font-display">封</div>
              </div>
              <div class="jd-washi"></div>
              <p class="jd-note text-pretty">空白不靠拉长控件填，用手账元素占位：书签、票根、火漆、胶带与钢笔。</p>
              <div class="jd-tools">
                <div class="jd-clip" title="回形针"></div>
                <div class="jd-pen" title="钢笔"></div>
              </div>
            </div>"""

new_jd = """            <div class="journal-deco glass" aria-hidden="true">
              <span class="tape sakura"></span>
              <h3 class="font-display">手账页</h3>
              <div class="jd-bookmarks" id="jdBookmarks">
                <div class="jd-tab font-display" data-season="0">春</div>
                <div class="jd-tab font-display" data-season="1">夏</div>
                <div class="jd-tab font-display" data-season="2">秋</div>
                <div class="jd-tab font-display" data-season="3">冬</div>
              </div>
              <div class="jd-craft-row">
                <div class="jd-open-book">
                  <div class="jd-page"></div>
                  <div class="jd-page"></div>
                </div>
                <div class="jd-pressed-flower" title="压花"></div>
                <div class="jd-date-stamp font-display" id="jdStamp">
                  <div>
                    <div class="m" id="jdStampM">JUL</div>
                    <div class="d" id="jdStampD">26</div>
                    <div class="y" id="jdStampY">2026</div>
                  </div>
                </div>
              </div>
              <div class="jd-row">
                <div class="jd-ticket">
                  <div class="k">TICKET · DAY</div>
                  <div class="v font-display" id="decoTicket">给这一天留一张票根</div>
                </div>
                <div class="jd-wax font-display" id="jdWax">封</div>
              </div>
              <div class="jd-mood-ribbon">
                <span>MOOD</span>
                <span class="dots" id="jdMoodDots">
                  <i class="dot"></i><i class="dot"></i><i class="dot"></i><i class="dot"></i><i class="dot"></i>
                </span>
              </div>
              <div class="jd-labels">
                <span class="jd-label font-display" id="jdLabelA">手账页</span>
                <span class="jd-label b font-display" id="jdLabelB">一日一篇</span>
              </div>
              <div class="jd-washi"></div>
              <div class="jd-tools">
                <div class="jd-clip" title="回形针"></div>
                <div class="jd-pen" title="钢笔"></div>
              </div>
            </div>"""

if old_jd not in text:
    raise SystemExit("old journal deco HTML not found")
text = text.replace(old_jd, new_jd, 1)

# --- draft status ---
old_draft_tools = """            <div class="tools">
              <span class="count"><span id="draftCount">0</span>/280</span>
              <div class="tools-btns">
                <button type="button" class="chip-btn sm" id="draftClear">清空</button>
                <button type="button" class="chip-btn sm primary" id="draftSave">保存</button>
              </div>
            </div>"""

new_draft_tools = """            <div class="tools">
              <span class="count"><span id="draftCount">0</span>/280 · <span class="draft-status saved" id="draftStatus">已同步</span></span>
              <div class="tools-btns">
                <button type="button" class="chip-btn sm" id="draftClear">清空</button>
                <button type="button" class="chip-btn sm primary" id="draftSave" title="Ctrl+S">保存</button>
              </div>
            </div>"""

if old_draft_tools not in text:
    raise SystemExit("old draft tools not found")
text = text.replace(old_draft_tools, new_draft_tools, 1)

text = text.replace(
    'placeholder="随手记下灵感、句子、待写进日记的碎片…"',
    'placeholder="随手记下灵感、句子… 自动保存 · Ctrl+S"',
    1,
)

# --- detail: keyboard hint ---
text = text.replace(
    """        <div class="nav-pair">
          <button type="button" class="chip-btn" style="width:100%" id="btnPrevStub">上一篇</button>
          <button type="button" class="chip-btn" style="width:100%" id="btnNextStub">下一篇</button>
        </div>""",
    """        <div class="nav-pair">
          <button type="button" class="chip-btn" style="width:100%" id="btnPrevStub">上一篇</button>
          <button type="button" class="chip-btn" style="width:100%" id="btnNextStub">下一篇</button>
        </div>
        <div class="detail-keys">← → 相邻日记 · Esc 返回</div>""",
    1,
)

# --- brand title ---
text = text.replace('title="回到日记列表"', 'title="回到日记列表 · Esc"', 1)

# --- Replace script section ---
script_start = text.index("<script>")
script_end = text.index("</script>") + len("</script>")

NEW_SCRIPT = r'''<script>
const STAGE_W = 1920, STAGE_H = 1080;
const stageWrap = document.getElementById('stageWrap');
const stage = document.getElementById('stage');
const WEEK = ['周日','周一','周二','周三','周四','周五','周六'];
const MOOD_LABEL = {happy:'开心',calm:'平静',tired:'疲惫',sad:'低落',excited:'兴奋'};
const MOOD_LEVEL = {happy:72,calm:40,tired:22,sad:18,excited:88};
const MOOD_COLOR = {
  happy:'var(--c-sun)', calm:'var(--c-mint)', tired:'var(--c-blue)',
  sad:'var(--c-violet)', excited:'var(--c-sakura)'
};
const MOOD_HEX = {happy:'#ffcf6e',calm:'#5fc4a5',tired:'#6aaee8',sad:'#9b8ce8',excited:'#f490ad'};
const MO_SHORT = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const MO_CN = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];
const DRAFT_KEY = 'diary-v6-draft';
const TODAY = '2026-07-26';

const ENTRIES = [
  {id:1,date:'2026-07-26',title:'把房间感写进日记页',mood:'calm',body:'一日一篇。中间不再铺一堆被拉长的卡片，而是直接读这一天的正文。\n\n月历只做选日控件，宽度收住；正文像一页手账纸，有装订线与淡格线，但不做成通栏长条。\n\n右栏草稿本是通用的——先随手写，再点「编辑选中日」落进正式日记。'},
  {id:2,date:'2026-07-24',title:'薄雾比色块更轻',mood:'happy',body:'不靠大面积单色撑气氛。径向薄雾跟主页同一套，克制就好。\n\n开心的小事：组件终于不再被横向拉满。'},
  {id:3,date:'2026-07-21',title:'右栏不能空',mood:'excited',body:'印章、日期徽章、草稿本、编辑入口——空白由侧栏消化。'},
  {id:4,date:'2026-07-18',title:'组件别拉成通栏',mood:'calm',body:'筛选进侧栏或干脆做成装饰；主区只保留日历与阅读。'},
  {id:5,date:'2026-07-12',title:'午后一杯茶与调试',mood:'tired',body:'先写清复现，再打断点。疲惫也值得记一笔。'},
  {id:6,date:'2026-07-07',title:'封面占位比假图诚实',mood:'sad',body:'没有摄影时，比例标注更专业。占位用 [image]。'},
  {id:7,date:'2026-07-03',title:'第一页手账',mood:'excited',body:'七月开头，先把壳搭稳。'},
  {id:8,date:'2026-06-28',title:'六月收尾',mood:'calm',body:'把未完成的想法先丢进草稿本。'}
];

const STATE = {
  year: 2026,
  month: 6,
  selectedDate: TODAY,
  detailId: 1,
  writeDate: TODAY,
  draftTimer: null,
  switching: false
};

let draftText = '';
try { draftText = localStorage.getItem(DRAFT_KEY) || localStorage.getItem('diary-v5-draft') || ''; } catch { draftText = ''; }

function fit(){
  const s = Math.min(innerWidth / STAGE_W, innerHeight / STAGE_H, 1.15);
  stage.style.transform = `scale(${s})`;
  stageWrap.style.width = STAGE_W * s + 'px';
  stageWrap.style.height = STAGE_H * s + 'px';
}
addEventListener('resize', fit);

function toast(msg){
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 1600);
}

function pad(n){ return String(n).padStart(2,'0'); }
function dateKey(y,m,d){ return `${y}-${pad(m+1)}-${pad(d)}`; }
function parseDate(s){ const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d); }
function formatCN(s){ const dt=parseDate(s); return `${dt.getFullYear()}年${dt.getMonth()+1}月${dt.getDate()}日 · ${WEEK[dt.getDay()]}`; }
function formatMD(s){ const dt=parseDate(s); return `${pad(dt.getMonth()+1)}.${pad(dt.getDate())}`; }
function entryByDate(date){ return ENTRIES.find(e => e.date === date) || null; }
function entryById(id){ return ENTRIES.find(e => e.id === id) || null; }
function monthEntries(){
  const prefix = `${STATE.year}-${pad(STATE.month+1)}`;
  return ENTRIES.filter(e => e.date.startsWith(prefix));
}
function streakCount(){
  const dates = new Set(ENTRIES.map(e => e.date));
  let cur = parseDate(TODAY), n = 0;
  while(dates.has(dateKey(cur.getFullYear(), cur.getMonth(), cur.getDate()))){
    n++; cur.setDate(cur.getDate()-1);
  }
  return n;
}
function shiftDate(dateStr, delta){
  const dt = parseDate(dateStr);
  dt.setDate(dt.getDate() + delta);
  return dateKey(dt.getFullYear(), dt.getMonth(), dt.getDate());
}
function seasonOf(month){ return Math.floor(month / 3) % 4; }

function setPage(name){
  const prev = stage.dataset.page;
  stage.dataset.page = name;
  document.querySelectorAll('.page').forEach(p => {
    const on = p.id === 'page-' + name;
    if(on && prev !== name){ p.classList.remove('on'); void p.offsetWidth; p.classList.add('on'); }
    else p.classList.toggle('on', on);
  });
  document.querySelectorAll('#pageSeg button').forEach(b => b.classList.toggle('on', b.dataset.page === name));
  if(name === 'list') renderList();
  if(name === 'detail') renderDetail();
  if(name === 'write'){
    renderWrite();
    requestAnimationFrame(() => {
      const t = document.getElementById('writeTitle');
      t.focus();
      const len = t.value.length;
      t.setSelectionRange(len, len);
    });
  }
}
function setTheme(name){
  document.documentElement.dataset.theme = name;
  document.querySelectorAll('#themeSeg button').forEach(b => b.classList.toggle('on', b.dataset.theme === name));
}
function placeNavPill(){
  const nav = document.getElementById('mainnav');
  const pill = document.getElementById('navPill');
  const active = nav.querySelector('button.active');
  if(!active) return;
  pill.style.opacity = '1';
  pill.style.left = active.offsetLeft + 'px';
  pill.style.width = active.offsetWidth + 'px';
}
function tickClock(){
  const now = new Date();
  document.getElementById('clockTime').innerHTML =
    `${pad(now.getHours())}<span class="colon">:</span>${pad(now.getMinutes())}<span class="sec"> ${pad(now.getSeconds())}</span>`;
  document.getElementById('clockDate').textContent =
    `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日 ${WEEK[now.getDay()]}`;
}

function selectDate(date, {animate=true}={}){
  const dt = parseDate(date);
  STATE.selectedDate = date;
  STATE.year = dt.getFullYear();
  STATE.month = dt.getMonth();

  if(animate && stage.dataset.page === 'list'){
    const page = document.getElementById('dayPage');
    page.classList.add('is-switching');
    STATE.switching = true;
    setTimeout(() => {
      renderList();
      page.classList.remove('is-switching');
      STATE.switching = false;
    }, 150);
  } else {
    renderList();
  }
}

function buildCalendar(){
  const grid = document.getElementById('calGrid');
  const y = STATE.year, m = STATE.month;
  const first = new Date(y, m, 1);
  const days = new Date(y, m+1, 0).getDate();
  const offset = (first.getDay() + 6) % 7;
  const weeks = Math.ceil((offset + days) / 7);
  const total = weeks * 7;
  const has = new Set(monthEntries().map(e => +e.date.split('-')[2]));
  let html = ['一','二','三','四','五','六','日'].map(d => `<div class="cal-dow">${d}</div>`).join('');
  for(let i=0;i<total;i++){
    const d = i - offset + 1;
    if(d < 1 || d > days){
      html += `<div class="cal-cell mute"></div>`;
      continue;
    }
    const key = dateKey(y,m,d);
    const entry = entryByDate(key);
    const cls = ['cal-cell'];
    if(has.has(d)) cls.push('has');
    if(key === TODAY) cls.push('today');
    if(STATE.selectedDate === key) cls.push('selected');
    const tip = entry
      ? `${key} · ${MOOD_LABEL[entry.mood]} · ${entry.title}（双击编辑）`
      : `${key} · 尚无日记（双击开始写）`;
    html += `<button type="button" class="${cls.join(' ')}" data-date="${key}" title="${tip.replace(/"/g,'&quot;')}">${d}${has.has(d)?'<span class="mark"></span>':''}</button>`;
  }
  grid.innerHTML = html;
  document.getElementById('calTitle').textContent = `${y} · ${MO_CN[m]}`;
  document.getElementById('monthSticker').textContent = MO_SHORT[m];
}

function renderJournalDeco(){
  const date = STATE.selectedDate || TODAY;
  const dt = parseDate(date);
  const e = entryByDate(date);
  const ticket = document.getElementById('decoTicket');
  if(ticket) ticket.textContent = e ? e.title : `${formatMD(date)} · 空白票根`;

  document.getElementById('jdStampM').textContent = MO_SHORT[dt.getMonth()];
  document.getElementById('jdStampD').textContent = pad(dt.getDate());
  document.getElementById('jdStampY').textContent = String(dt.getFullYear());
  const stamp = document.getElementById('jdStamp');
  stamp.style.opacity = e ? '.9' : '.55';
  if(e){
    stamp.style.borderColor = MOOD_HEX[e.mood];
    stamp.style.color = MOOD_HEX[e.mood];
  } else {
    stamp.style.borderColor = '';
    stamp.style.color = '';
  }

  const wax = document.getElementById('jdWax');
  if(e){
    wax.textContent = MOOD_LABEL[e.mood].slice(0,1);
    wax.style.background = `radial-gradient(circle at 35% 30%, #fff8, ${MOOD_HEX[e.mood]} 55%, #9a6fb8)`;
    wax.style.transform = 'rotate(12deg) scale(1.05)';
  } else {
    wax.textContent = '空';
    wax.style.background = '';
    wax.style.transform = 'rotate(12deg)';
  }

  const dots = [...document.querySelectorAll('#jdMoodDots .dot')];
  const level = e ? MOOD_LEVEL[e.mood] : 0;
  const lit = e ? Math.max(1, Math.round(level / 20)) : 0;
  dots.forEach((d,i) => {
    d.classList.toggle('on', i < lit);
    d.style.background = (i < lit && e) ? MOOD_HEX[e.mood] : '';
    d.style.borderColor = (i < lit && e) ? MOOD_HEX[e.mood] : '';
  });

  document.getElementById('jdLabelA').textContent = e ? MOOD_LABEL[e.mood] : '空白页';
  document.getElementById('jdLabelB').textContent = e ? '已落笔' : (date === TODAY ? '写今日' : '可补记');

  const season = seasonOf(dt.getMonth());
  document.querySelectorAll('#jdBookmarks .jd-tab').forEach(tab => {
    const s = +tab.dataset.season;
    tab.classList.toggle('lit', s === season);
    tab.classList.toggle('dim', s !== season);
  });
}

function renderLeftCraft(){
  const date = STATE.selectedDate || TODAY;
  const dt = parseDate(date);
  const e = entryByDate(date);
  document.getElementById('polaroidCap').textContent = `${MO_SHORT[dt.getMonth()]} · 手账`;
  const frame = document.getElementById('polaroidFrame');
  const fill = document.getElementById('moodFill');
  const name = document.getElementById('moodName');
  if(e){
    const hex = MOOD_HEX[e.mood];
    fill.style.width = MOOD_LEVEL[e.mood] + '%';
    fill.style.background = `linear-gradient(90deg, ${hex}, color-mix(in srgb, ${hex} 55%, #f490ad))`;
    name.textContent = MOOD_LABEL[e.mood];
    frame.style.background =
      `radial-gradient(80px 50px at 30% 40%, ${hex}55, transparent 70%), linear-gradient(160deg, #f7f0fa, #eef6f8)`;
    frame.style.borderColor = hex + '66';
  } else {
    fill.style.width = '8%';
    fill.style.background = '';
    name.textContent = '未记';
    frame.style.background = '';
    frame.style.borderColor = '';
  }
}

function renderDayPage(){
  const date = STATE.selectedDate || TODAY;
  const e = entryByDate(date);
  const page = document.getElementById('dayPage');

  if(e){
    page.innerHTML = `
      <span class="page-tape"></span>
      <header class="day-head">
        <div class="when"><span class="mood-dot ${e.mood}"></span>${formatCN(e.date)}</div>
        <h2 class="font-display day-title-hit" id="dayTitleHit" title="打开详情">${e.title}</h2>
        <div class="meta">
          <span class="meta-pill"><span class="mood-dot ${e.mood}"></span>${MOOD_LABEL[e.mood]}</span>
          <span class="meta-pill" style="background:var(--c-violet-soft);color:var(--c-violet)">私密</span>
        </div>
      </header>
      <div class="day-body text-pretty">${e.body.split(/\n\n+/).map(p => `<p>${p.replace(/\n/g,'<br>')}</p>`).join('')}</div>
      <div class="day-actions">
        <button type="button" class="chip-btn" id="btnRead">阅读详情</button>
        <button type="button" class="chip-btn primary font-display" id="btnEditDay">编辑这一天</button>
      </div>
      <footer class="day-foot-deco" aria-hidden="true">
        <div class="seal-sm font-display">完</div>
        <div class="mark-line"></div>
        <div class="cap">PAGE · END</div>
      </footer>`;
    document.getElementById('dayTitleHit').onclick = () => openDetail(e.id);
    document.getElementById('btnRead').onclick = () => openDetail(e.id);
    document.getElementById('btnEditDay').onclick = () => openWrite(date);
  } else {
    page.innerHTML = `
      <span class="page-tape"></span>
      <div class="day-empty">
        <div class="t font-display">这一天还是空白</div>
        <div class="s text-pretty">${formatCN(date)} · 一日一篇，点右下角开始写</div>
        <div class="empty-deco" aria-hidden="true">
          <div class="env"></div>
          <div class="stamp-idle font-display">待写</div>
        </div>
        <button type="button" class="chip-btn primary font-display" id="emptyEdit">编辑这一天</button>
      </div>`;
    document.getElementById('emptyEdit').onclick = () => openWrite(date);
  }
}

function setDraftStatus(kind){
  const el = document.getElementById('draftStatus');
  if(!el) return;
  el.classList.remove('dirty','saved');
  if(kind === 'dirty'){ el.classList.add('dirty'); el.textContent = '未保存'; }
  else if(kind === 'saving'){ el.textContent = '保存中…'; }
  else { el.classList.add('saved'); el.textContent = '已同步'; }
}

function queueDraftSave(){
  const ta = document.getElementById('draftPad');
  draftText = ta.value.slice(0,280);
  document.getElementById('draftCount').textContent = String(draftText.length);
  setDraftStatus('dirty');
  clearTimeout(STATE.draftTimer);
  STATE.draftTimer = setTimeout(() => {
    try {
      localStorage.setItem(DRAFT_KEY, draftText);
      setDraftStatus('saved');
    } catch {
      setDraftStatus('dirty');
      toast('草稿未能写入本地');
    }
  }, 450);
}

function renderDeck(){
  const date = STATE.selectedDate || TODAY;
  const dt = parseDate(date);
  const e = entryByDate(date);
  document.getElementById('deckDay').textContent = pad(dt.getDate());
  document.getElementById('deckMo').textContent = MO_SHORT[dt.getMonth()];
  document.getElementById('deckWeek').textContent = WEEK[dt.getDay()];
  document.getElementById('statMonth').textContent = String(monthEntries().length);
  document.getElementById('statStreak').textContent = String(streakCount());
  document.getElementById('deckFootV').textContent = e ? '编辑这篇' : '写这一天';

  const ta = document.getElementById('draftPad');
  if(document.activeElement !== ta){
    ta.value = draftText;
    document.getElementById('draftCount').textContent = String(draftText.length);
  }
}

function renderList(){
  buildCalendar();
  renderDayPage();
  renderDeck();
  renderJournalDeco();
  renderLeftCraft();
}

function openDetail(id){
  const e = entryById(id); if(!e) return;
  STATE.detailId = id;
  STATE.selectedDate = e.date;
  setPage('detail');
}
function openWrite(date){
  STATE.writeDate = date || STATE.selectedDate || TODAY;
  STATE.selectedDate = STATE.writeDate;
  setPage('write');
}

function renderDetail(){
  const e = entryById(STATE.detailId) || entryByDate(STATE.selectedDate) || ENTRIES[0];
  STATE.detailId = e.id;
  document.getElementById('dDate').textContent = formatCN(e.date);
  document.getElementById('dTitle').textContent = e.title;
  document.getElementById('dMeta').innerHTML =
    `<span class="meta-pill"><span class="mood-dot ${e.mood}"></span>${MOOD_LABEL[e.mood]}</span>
     <span class="meta-pill" style="background:var(--c-violet-soft);color:var(--c-violet)">私密</span>`;
  document.getElementById('dBody').innerHTML = e.body.split(/\n\n+/).map(p => `<p>${p.replace(/\n/g,'<br>')}</p>`).join('');
  document.getElementById('dMoodBig').textContent = MOOD_LABEL[e.mood];
  const sorted = ENTRIES.slice().sort((a,b)=> b.date.localeCompare(a.date));
  const idx = sorted.findIndex(x => x.id === e.id);
  const next = sorted[idx+1] || null;
  const prev = sorted[idx-1] || null;
  const spine = document.getElementById('nextSpine');
  if(next){
    document.getElementById('nextTitle').textContent = next.title;
    document.getElementById('nextEx').textContent = next.body.slice(0,48) + '…';
    document.getElementById('nextDate').textContent = formatMD(next.date);
    spine.dataset.id = next.id;
    spine.style.opacity = '1';
  } else {
    document.getElementById('nextTitle').textContent = '没有更早的日记';
    document.getElementById('nextEx').textContent = '这是时间线尽头。';
    document.getElementById('nextDate').textContent = '—';
    delete spine.dataset.id;
    spine.style.opacity = '.55';
  }
  document.getElementById('btnPrevStub').disabled = !prev;
  document.getElementById('btnNextStub').disabled = !next;
  document.getElementById('btnPrevStub').style.opacity = prev ? '1' : '.4';
  document.getElementById('btnNextStub').style.opacity = next ? '1' : '.4';
}

function renderWrite(){
  const date = STATE.writeDate;
  const e = entryByDate(date);
  document.getElementById('writeDateLine').textContent = formatCN(date);
  document.getElementById('writeTitle').value = e ? e.title : '';
  document.getElementById('writeBody').value = e ? e.body : '';
  const mood = e ? e.mood : 'calm';
  document.querySelectorAll('#writeMood .mood-chip').forEach(b => b.classList.toggle('on', b.dataset.mood === mood));
  document.getElementById('draftMirror').textContent = draftText.trim() || '暂无草稿 · 可在列表右栏书写';
  updateWriteChecks();
  document.getElementById('writeDirty').textContent = '就绪';
}

function updateWriteChecks(){
  const title = document.getElementById('writeTitle').value.trim();
  const body = document.getElementById('writeBody').value.trim();
  const items = [
    {ok:true, label:'已选日期'},
    {ok:!!title, label:'已写标题'},
    {ok:body.length > 0, label:'正文不少于一行'}
  ];
  document.getElementById('writeChecks').innerHTML = items.map(it =>
    `<div class="check-item ${it.ok?'done':''}"><span class="box">${it.ok?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12l5 5L20 7" stroke-linecap="round" stroke-linejoin="round"/></svg>':''}</span>${it.label}</div>`
  ).join('');
}

function saveDraft(silent){
  draftText = document.getElementById('draftPad').value.slice(0,280);
  try { localStorage.setItem(DRAFT_KEY, draftText); } catch {}
  document.getElementById('draftCount').textContent = String(draftText.length);
  setDraftStatus('saved');
  if(!silent) toast('草稿已保存');
}

/* events */
document.getElementById('brandHome').addEventListener('click', () => {
  selectDate(TODAY, {animate:false});
  setPage('list');
});
document.getElementById('calPrev').addEventListener('click', () => {
  STATE.month--; if(STATE.month < 0){ STATE.month = 11; STATE.year--; }
  buildCalendar();
});
document.getElementById('calNext').addEventListener('click', () => {
  STATE.month++; if(STATE.month > 11){ STATE.month = 0; STATE.year++; }
  buildCalendar();
});
document.getElementById('btnJumpToday').addEventListener('click', () => selectDate(TODAY));

document.getElementById('calGrid').addEventListener('click', e => {
  const btn = e.target.closest('[data-date]'); if(!btn) return;
  selectDate(btn.dataset.date);
});
document.getElementById('calGrid').addEventListener('dblclick', e => {
  const btn = e.target.closest('[data-date]'); if(!btn) return;
  selectDate(btn.dataset.date, {animate:false});
  openWrite(btn.dataset.date);
});

document.getElementById('btnWriteToday').addEventListener('click', () => openWrite(TODAY));
document.getElementById('btnWriteToday2').addEventListener('click', () => openWrite(TODAY));
document.getElementById('deckFoot').addEventListener('click', () => openWrite(STATE.selectedDate || TODAY));
document.getElementById('deckFoot').addEventListener('keydown', e => {
  if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openWrite(STATE.selectedDate || TODAY); }
});

document.getElementById('draftPad').addEventListener('input', queueDraftSave);
document.getElementById('draftSave').addEventListener('click', () => saveDraft(false));
document.getElementById('draftClear').addEventListener('click', () => {
  document.getElementById('draftPad').value = '';
  queueDraftSave();
  toast('草稿已清空');
});

document.body.addEventListener('click', e => {
  const go = e.target.closest('[data-go]');
  if(go) setPage(go.dataset.go);
});

document.getElementById('detailEdit').addEventListener('click', () => {
  const e = entryById(STATE.detailId);
  openWrite(e ? e.date : STATE.selectedDate);
});
document.getElementById('btnDeleteStub').addEventListener('click', () => toast('删除（stub）'));
document.getElementById('btnPrevStub').addEventListener('click', () => {
  const sorted = ENTRIES.slice().sort((a,b)=> b.date.localeCompare(a.date));
  const idx = sorted.findIndex(x => x.id === STATE.detailId);
  if(sorted[idx-1]) openDetail(sorted[idx-1].id); else toast('没有上一篇');
});
document.getElementById('btnNextStub').addEventListener('click', () => {
  const sorted = ENTRIES.slice().sort((a,b)=> b.date.localeCompare(a.date));
  const idx = sorted.findIndex(x => x.id === STATE.detailId);
  if(sorted[idx+1]) openDetail(sorted[idx+1].id); else toast('没有下一篇');
});
document.getElementById('nextSpine').addEventListener('click', function(){
  if(this.dataset.id) openDetail(+this.dataset.id);
});
document.getElementById('nextSpine').addEventListener('keydown', function(e){
  if((e.key === 'Enter' || e.key === ' ') && this.dataset.id){ e.preventDefault(); openDetail(+this.dataset.id); }
});

document.getElementById('writeMood').addEventListener('click', e => {
  const btn = e.target.closest('.mood-chip'); if(!btn) return;
  document.querySelectorAll('#writeMood .mood-chip').forEach(b => b.classList.toggle('on', b === btn));
});
document.getElementById('statusSeg').addEventListener('click', e => {
  const btn = e.target.closest('button'); if(!btn) return;
  document.querySelectorAll('#statusSeg button').forEach(b => b.classList.toggle('on', b === btn));
});
document.getElementById('btnInsertDraft').addEventListener('click', () => {
  if(!draftText.trim()){ toast('草稿本是空的'); return; }
  const ta = document.getElementById('writeBody');
  ta.value = (ta.value ? ta.value + '\n\n' : '') + draftText.trim();
  updateWriteChecks();
  document.getElementById('writeDirty').textContent = '未保存';
  toast('已插入草稿');
});
document.getElementById('btnSave').addEventListener('click', () => {
  updateWriteChecks();
  document.getElementById('writeDirty').textContent = '已保存';
  toast('已保存（demo）');
});
['writeTitle','writeBody'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => {
    document.getElementById('writeDirty').textContent = '未保存';
    updateWriteChecks();
  });
});

document.addEventListener('keydown', e => {
  const tag = (e.target && e.target.tagName) || '';
  const typing = tag === 'TEXTAREA' || tag === 'INPUT';
  const page = stage.dataset.page;

  if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's'){
    e.preventDefault();
    if(page === 'write'){
      updateWriteChecks();
      document.getElementById('writeDirty').textContent = '已保存';
      toast('已保存（demo）');
    } else if(typing && e.target.id === 'draftPad'){
      clearTimeout(STATE.draftTimer);
      saveDraft(false);
    } else if(page === 'list'){
      saveDraft(false);
    }
    return;
  }

  if(e.key === 'Escape'){
    if(page !== 'list'){ e.preventDefault(); setPage('list'); }
    return;
  }

  if(typing) return;

  if(page === 'list'){
    if(e.key === 'ArrowLeft'){ e.preventDefault(); selectDate(shiftDate(STATE.selectedDate, -1)); }
    if(e.key === 'ArrowRight'){ e.preventDefault(); selectDate(shiftDate(STATE.selectedDate, 1)); }
    if(e.key === 'Enter'){ e.preventDefault(); openWrite(STATE.selectedDate); }
    if(e.key.toLowerCase() === 't'){ e.preventDefault(); selectDate(TODAY); }
  }

  if(page === 'detail'){
    const sorted = ENTRIES.slice().sort((a,b)=> b.date.localeCompare(a.date));
    const idx = sorted.findIndex(x => x.id === STATE.detailId);
    if(e.key === 'ArrowLeft' && sorted[idx-1]){ e.preventDefault(); openDetail(sorted[idx-1].id); }
    if(e.key === 'ArrowRight' && sorted[idx+1]){ e.preventDefault(); openDetail(sorted[idx+1].id); }
  }
});

const tweaks = document.getElementById('tweaks');
document.getElementById('tweaksFab').addEventListener('click', () => tweaks.classList.add('open'));
document.addEventListener('click', e => { if(!tweaks.contains(e.target)) tweaks.classList.remove('open'); });
document.getElementById('pageSeg').addEventListener('click', e => {
  const btn = e.target.closest('button'); if(btn) setPage(btn.dataset.page);
});
document.getElementById('themeSeg').addEventListener('click', e => {
  const btn = e.target.closest('button'); if(btn) setTheme(btn.dataset.theme);
});

placeNavPill();
tickClock();
setInterval(tickClock, 1000);
addEventListener('load', placeNavPill);
setDraftStatus('saved');
renderList();
fit();
</script>'''

text = text[:script_start] + NEW_SCRIPT + text[script_end:]

DST.write_text(text, encoding="utf-8", newline="\n")
print(f"OK {DST.name} ({DST.stat().st_size} bytes)")

# quick checks
checks = ["回到今日", "私密手账", "jdStamp", "moodFill", "queueDraftSave", "btnJumpToday", "日记设计预览 v6"]
body = DST.read_text(encoding="utf-8")
for c in checks:
    print(f"  {'OK' if c in body else 'MISSING'}: {c}")
