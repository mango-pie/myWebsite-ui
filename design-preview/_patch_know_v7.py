# -*- coding: utf-8 -*-
"""Knowledge v7: fill leftover space with content-derived modules (no prop cosplay)."""
from pathlib import Path

p = Path(r"e:\java_demo\Ai-scene\AI-backend\design-preview\Knowledge v7.html")
t = p.read_text(encoding="utf-8")


def sub(old, new, count=1):
    global t
    if old not in t:
        raise SystemExit("MISSING:\n" + old[:160])
    t = t.replace(old, new, count)


sub("<title>某某の小站 · 知识库设计预览 v4</title>", "<title>某某の小站 · 知识库设计预览 v7</title>")
sub(
    '<div class="note-chip">Knowledge v4 · 左目录 · 中书脊+摘要 · 右数字/问答 · 站内蓝玻璃 · 无木纹</div>',
    '<div class="note-chip">Knowledge v7 · v4 排版 + 内容型模块（摘录卡 / 解析健康 / 入库流水 / 书脊预览），装饰即信息</div>',
)

# catalog no longer eats the whole column
sub(
    """.catalog{
  flex:1;min-height:0;padding:14px 12px;display:flex;flex-direction:column;gap:6px;overflow:auto;
}""",
    """.catalog{
  flex:none;max-height:262px;padding:14px 12px;display:flex;flex-direction:column;gap:6px;overflow:auto;
}""",
)

CSS = r"""
/* ===== v7: modules grown from the room's own content ===== */
@keyframes pickIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes barGrow{from{transform:scaleX(.2);opacity:.4}to{transform:scaleX(1);opacity:1}}

/* excerpt of the day — decorative because it is a quoted page, useful because it is real chunk text */
.pick-card{
  flex:1;min-height:0;position:relative;overflow:hidden;
  padding:16px 18px 14px;display:flex;flex-direction:column;gap:8px;
}
.pick-card::before{
  content:"";position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(ellipse 80% 55% at 100% 0%, var(--craft-mist), transparent 60%);
  transition:background 1.2s var(--ease-out);
}
.pick-card > *{position:relative;z-index:1}
.pick-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px}
.pick-head .cap{font-size:11px;letter-spacing:2px;color:var(--craft-c);font-weight:600}
.pick-head .idx{font-size:10px;letter-spacing:1px;color:var(--ink-faint);font-variant-numeric:tabular-nums}
.pick-quote{
  font-family:"ZCOOL KuaiLe",sans-serif;font-size:30px;line-height:.8;
  color:color-mix(in srgb, var(--craft-c) 45%, #fff);
}
.pick-body{
  flex:1;min-height:0;overflow:auto;
  font-size:13px;line-height:1.95;color:var(--ink-soft);
  padding-right:2px;
  animation:pickIn .4s var(--ease-out);
}
.pick-src{
  flex:none;padding-top:9px;margin-top:2px;
  border-top:1px dashed rgba(165,172,196,.32);
  display:flex;align-items:center;justify-content:space-between;gap:8px;
}
.pick-src .doc{font-size:11px;letter-spacing:1px;color:var(--craft-c);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* parse health — the four contract states as one readable strip */
.health-bar{
  display:flex;height:16px;border-radius:99px;overflow:hidden;margin-top:10px;
  background:rgba(165,172,196,.16);box-shadow:inset 0 1px 2px rgba(90,110,150,.12);
}
.health-bar i{display:block;height:100%;transform-origin:left center;animation:barGrow .5s var(--ease-out)}
.health-bar i.ok{background:linear-gradient(90deg,#a8e0cd,var(--c-mint))}
.health-bar i.parsing{background:linear-gradient(90deg,#a8d4f0,var(--c-blue))}
.health-bar i.pending{background:linear-gradient(90deg,#ffe6b8,var(--c-sun))}
.health-bar i.failed{background:linear-gradient(90deg,#f8ccd8,var(--c-sakura))}
.health-legend{display:flex;flex-wrap:wrap;gap:8px 12px;margin-top:10px}
.health-legend span{
  font-size:11px;letter-spacing:1px;color:var(--ink-soft);
  display:inline-flex;align-items:center;gap:5px;
}
.health-legend i{width:8px;height:8px;border-radius:3px;display:inline-block}
.health-legend i.ok{background:var(--c-mint)}
.health-legend i.parsing{background:var(--c-blue)}
.health-legend i.pending{background:var(--c-sun)}
.health-legend i.failed{background:var(--c-sakura)}
.health-legend b{color:var(--ink);font-weight:600;font-variant-numeric:tabular-nums}

/* intake flow — recent documents, doubles as texture on empty sides */
.intake{display:flex;flex-direction:column;gap:8px;margin-top:8px;min-height:0;overflow:auto}
.intake-row{
  display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;
  padding:10px 12px;border-radius:12px;
  background:rgba(255,255,255,.72);border:1px solid rgba(255,255,255,.95);
  transition:transform .3s var(--ease-spring), background .2s;
}
.intake-row:hover{transform:translateX(3px);background:rgba(255,255,255,.9)}
.intake-row .t{font-size:10px;letter-spacing:1px;color:var(--ink-faint);font-variant-numeric:tabular-nums}
.intake-row .n{font-size:12px;letter-spacing:.5px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.intake-row .d{width:8px;height:8px;border-radius:50%;background:var(--ink-faint)}
.intake-row .d.SUCCESS{background:var(--c-mint)}
.intake-row .d.PARSING{background:var(--c-blue)}
.intake-row .d.PENDING{background:var(--c-sun)}
.intake-row .d.FAILED{background:var(--c-sakura)}

/* shelf: bay label + fill meter, both read from the shelf itself */
.shelf-board{padding-top:30px}
.shelf-tag{
  position:absolute;top:12px;left:22px;z-index:2;
  display:inline-flex;align-items:center;gap:8px;
  padding:4px 12px;border-radius:999px;
  font-size:11px;letter-spacing:2px;color:var(--craft-c);
  background:rgba(255,255,255,.82);
  border:1px dashed color-mix(in srgb, var(--craft-c) 28%, transparent);
}
.shelf-tag b{font-family:"ZCOOL KuaiLe",sans-serif;font-weight:400;font-size:13px}
.shelf-fill{
  position:absolute;top:16px;right:22px;z-index:2;
  display:flex;align-items:center;gap:7px;
  font-size:10px;letter-spacing:1px;color:var(--ink-faint);
}
.shelf-fill .track{
  width:86px;height:6px;border-radius:99px;overflow:hidden;
  background:rgba(255,255,255,.7);box-shadow:inset 0 1px 2px rgba(90,110,150,.14);
}
.shelf-fill .track i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--craft-a),var(--craft-c));transition:width .6s var(--ease-out)}

/* excerpt card gets a paper fore-edge instead of a pasted prop */
.excerpt-glass::after{
  content:"";position:absolute;top:16px;bottom:16px;right:0;width:9px;pointer-events:none;
  border-left:1px solid rgba(255,255,255,.95);
  border-radius:0 var(--r-md) var(--r-md) 0;
  background:repeating-linear-gradient(180deg,
    rgba(255,255,255,.95) 0 3px,
    color-mix(in srgb, var(--craft-c) 13%, transparent) 3px 5px);
}
.excerpt-body{padding-right:34px !important}
.spine-chip{
  display:inline-flex;align-items:center;gap:6px;
  height:26px;padding:0 11px;border-radius:999px;font-size:11px;letter-spacing:1px;
  background:color-mix(in srgb, var(--craft-c) 10%, #fff);color:var(--craft-c);
  border:1px solid color-mix(in srgb, var(--craft-c) 26%, transparent);
}
.spine-chip i{width:7px;height:14px;border-radius:2px;background:var(--craft-c);display:inline-block}

/* create page: live preview of the spine that will land on the shelf */
.spine-stage{
  flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;
  padding:14px 0 6px;
}
.spine-ghost{
  width:46px;min-height:156px;border-radius:5px 10px 8px 5px;
  writing-mode:vertical-rl;text-orientation:mixed;
  display:flex;align-items:center;justify-content:center;gap:8px;
  padding:14px 0;font-size:14px;letter-spacing:3px;color:#fff;
  font-family:"ZCOOL KuaiLe",sans-serif;
  background:linear-gradient(180deg,#9fd0f2,var(--c-blue));
  box-shadow:inset -3px 0 0 rgba(255,255,255,.25), 3px 8px 18px rgba(70,90,130,.22);
  transition:box-shadow .3s;
}
.spine-ghost em{font-style:normal;font-size:10px;letter-spacing:1px;opacity:.8;writing-mode:horizontal-tb}
.spine-ghost.is-empty{
  background:repeating-linear-gradient(135deg, rgba(255,255,255,.75) 0 7px, color-mix(in srgb, var(--craft-c) 14%, #fff) 7px 14px);
  color:var(--ink-faint);box-shadow:inset 0 0 0 1.5px color-mix(in srgb, var(--craft-c) 25%, transparent);
}
.spine-base{
  width:120px;height:9px;border-radius:6px;
  background:linear-gradient(180deg, color-mix(in srgb,#c5d6e8 70%,#fff), color-mix(in srgb,#a8bdd4 55%,rgba(255,255,255,.7)));
  box-shadow:0 3px 10px rgba(90,120,160,.16);
}
"""

sub(
    ".catalog-item .ok{font-size:10px;color:var(--ink-faint);letter-spacing:1px}",
    ".catalog-item .ok{font-size:10px;color:var(--ink-faint);letter-spacing:1px}\n" + CSS,
)

# ---------- list page: left column ----------
sub(
    """          <button type="button" class="catalog-item" data-kb="5" role="option" aria-selected="false">
            <span class="num">05</span><span class="name">实验摘录</span><span class="ok">4 篇</span>
          </button>
        </div>
      </aside>""",
    """          <button type="button" class="catalog-item" data-kb="5" role="option" aria-selected="false">
            <span class="num">05</span><span class="name">实验摘录</span><span class="ok">4 篇</span>
          </button>
        </div>
        <article class="pick-card glass anim" style="animation-delay:.22s" id="pickCard">
          <div class="pick-head">
            <span class="cap">库中一段</span>
            <span class="idx" id="pickIdx">1 / 3</span>
          </div>
          <div class="pick-quote" aria-hidden="true">「</div>
          <p class="pick-body text-pretty" id="pickText">向量检索的 topK 控制召回条数：调大能提高覆盖，也更容易带进噪声段落。</p>
          <div class="pick-src">
            <span class="doc" id="pickSrc">architecture.md · chunk #12</span>
            <button class="chip-btn sm" type="button" id="btnPick">换一段</button>
          </div>
        </article>
      </aside>""",
)

# ---------- list page: shelf tag + fill ----------
sub(
    """        <div class="shelf-board anim" style="animation-delay:.16s">
          <div class="shelf-row" id="shelf" role="listbox" aria-label="知识库书脊">""",
    """        <div class="shelf-board anim" style="animation-delay:.16s">
          <div class="shelf-tag" aria-hidden="true">架位 <b id="shelfBay">01</b></div>
          <div class="shelf-fill" aria-hidden="true">
            <span>架位占用</span>
            <span class="track"><i id="shelfFill" style="width:83%"></i></span>
            <span id="shelfFillNum">5 / 6</span>
          </div>
          <div class="shelf-row" id="shelf" role="listbox" aria-label="知识库书脊">""",
)

# ---------- list page: excerpt foot chip ----------
sub(
    """          <div class="excerpt-foot">
            <span class="cap">←→ 换库 · Enter 进馆藏</span>
            <span class="mark"></span>
            <span class="cap">双击书脊亦可</span>
          </div>""",
    """          <div class="excerpt-foot">
            <span class="cap">←→ 换库 · Enter 进馆藏</span>
            <span class="mark"></span>
            <span class="spine-chip"><i id="exSpine" aria-hidden="true"></i><span id="exSpineText">书脊 01 · 12 篇</span></span>
          </div>""",
)

# ---------- list page: deck health panel ----------
sub(
    """        <div class="panel glass anim" style="flex:1;display:flex;flex-direction:column;animation-delay:.2s">
          <div class="eyebrow">最近问答</div>""",
    """        <div class="panel glass anim" style="animation-delay:.16s">
          <div class="eyebrow">解析健康 · <span id="healthKb">产品手册</span></div>
          <div class="health-bar" id="healthBar" role="img" aria-label="解析状态占比">
            <i class="ok" style="width:75%"></i><i class="parsing" style="width:8%"></i><i class="pending" style="width:9%"></i><i class="failed" style="width:8%"></i>
          </div>
          <div class="health-legend">
            <span><i class="ok"></i>SUCCESS <b id="hOk">9</b></span>
            <span><i class="parsing"></i>PARSING <b id="hParsing">1</b></span>
            <span><i class="pending"></i>PENDING <b id="hPending">1</b></span>
            <span><i class="failed"></i>FAILED <b id="hFailed">1</b></span>
          </div>
        </div>
        <div class="panel glass anim" style="flex:1;display:flex;flex-direction:column;animation-delay:.2s">
          <div class="eyebrow">最近问答</div>""",
)

# ---------- detail page: left intake ----------
sub(
    """        <div class="panel glass" style="flex:1">
          <div class="eyebrow">馆藏提示</div>
          <p class="about">至少一份 SUCCESS 才适合进 RAG。精读另开房间。</p>
          <div class="hint-box">契约态：PENDING · PARSING · SUCCESS · FAILED</div>
        </div>
      </aside>""",
    """        <div class="panel glass">
          <div class="eyebrow">馆藏提示</div>
          <p class="about">至少一份 SUCCESS 才适合进 RAG。精读另开房间。</p>
          <div class="hint-box">契约态：PENDING · PARSING · SUCCESS · FAILED</div>
        </div>
        <div class="panel glass" style="flex:1;display:flex;flex-direction:column;min-height:0">
          <div class="eyebrow">入库流水</div>
          <div class="intake" id="detailIntake"></div>
          <p class="meta" style="margin-top:10px">按 createTime 倒序（预览占位）</p>
        </div>
      </aside>""",
)

# ---------- create page: spine preview ----------
sub(
    """        <div class="panel glass" style="flex:1">
          <div class="eyebrow">建库须知</div>
          <div class="hint-box">
            1. 先建空库，再上传文档<br>
            2. 解析 SUCCESS 后才适合问答<br>
            3. 不在此房做 AI 精读
          </div>
        </div>
      </aside>""",
    """        <div class="panel glass">
          <div class="eyebrow">建库须知</div>
          <div class="hint-box">
            1. 先建空库，再上传文档<br>
            2. 解析 SUCCESS 后才适合问答<br>
            3. 不在此房做 AI 精读
          </div>
        </div>
        <div class="panel glass" style="flex:1;display:flex;flex-direction:column;min-height:0">
          <div class="eyebrow">上架预览</div>
          <div class="spine-stage">
            <div class="spine-ghost is-empty" id="spineGhost">待命名<em>06</em></div>
            <div class="spine-base" aria-hidden="true"></div>
          </div>
          <p class="meta">输入库名即可看到它在架上的样子</p>
        </div>
      </aside>""",
)

# ---------- upload page: current library intake ----------
sub(
    """        <div class="panel glass" style="flex:1">
          <div class="eyebrow">解析流水线</div>
          <div class="pipeline">
            <div class="step s1"><span class="dot"></span>PENDING · 待解析</div>
            <div class="step s2"><span class="dot"></span>PARSING · 解析中</div>
            <div class="step s3"><span class="dot"></span>SUCCESS · 可问答</div>
            <div class="step s4"><span class="dot"></span>FAILED · 可重试</div>
          </div>
        </div>
      </aside>""",
    """        <div class="panel glass">
          <div class="eyebrow">解析流水线</div>
          <div class="pipeline">
            <div class="step s1"><span class="dot"></span>PENDING · 待解析</div>
            <div class="step s2"><span class="dot"></span>PARSING · 解析中</div>
            <div class="step s3"><span class="dot"></span>SUCCESS · 可问答</div>
            <div class="step s4"><span class="dot"></span>FAILED · 可重试</div>
          </div>
        </div>
        <div class="panel glass" style="flex:1;display:flex;flex-direction:column;min-height:0">
          <div class="eyebrow">本库已有</div>
          <div class="intake" id="uploadIntake"></div>
          <p class="meta" style="margin-top:10px">新文件排在队首，状态 PENDING</p>
        </div>
      </aside>""",
)

# ---------- chat deck: citation count line (fills the thin side) ----------
sub(
    """        <div class="panel glass" style="flex:1;overflow:auto">
          <div class="eyebrow">引用 / 出处</div>""",
    """        <div class="panel glass" style="flex:1;overflow:auto">
          <div class="eyebrow">引用 / 出处</div>
          <p class="meta" style="margin-top:-2px">本轮回答引用 2 段 · 均来自 SUCCESS 文档</p>""",
)

# ---------- data ----------
OLD_KBS_START = "const KBS = {"
OLD_KBS_END = "};\nlet selectedKb = 1;"
i0 = t.find(OLD_KBS_START)
i1 = t.find(OLD_KBS_END)
if i0 < 0 or i1 < 0:
    raise SystemExit("KBS block missing")

NEW_KBS = """const KBS = {
  1: {
    title:'产品手册', color:'linear-gradient(180deg,#9fd0f2,var(--c-blue))',
    lead:'收录产品说明、架构笔记与 FAQ。解析成功的文档可进入 RAG 问答；失败项展示 errorMessage，可重试 parse。',
    docs:12, ok:9, parsing:1, pending:1, failed:1, ses:3,
    picks:[
      {text:'向量检索的 topK 控制召回条数：调大能提高覆盖，也更容易带进噪声段落。', src:'architecture.md · chunk #12'},
      {text:'解析失败的文档不参与检索，需要先展示 errorMessage，再允许重试 parse。', src:'faq.md · chunk #3'},
      {text:'一份文档会切成若干 chunk，chunkCount 决定这本书在库里占多少页。', src:'guide.pdf · chunk #7'}
    ],
    intake:[
      {t:'今天 14:20', n:'guide.pdf', s:'PENDING'},
      {t:'今天 11:05', n:'faq.md', s:'PARSING'},
      {t:'昨天 19:42', n:'architecture.md', s:'SUCCESS'},
      {t:'昨天 09:18', n:'scan.bin', s:'FAILED'}
    ]
  },
  2: {
    title:'运维手册', color:'linear-gradient(180deg,#b8e0d4,var(--c-mint))',
    lead:'部署、观测与排障笔记。左目录与书脊同步选中，摘要只讲这一库。',
    docs:8, ok:7, parsing:0, pending:1, failed:0, ses:2,
    picks:[
      {text:'观测先看四个信号：延迟、流量、错误、饱和度；日志只在这四个之外补充细节。', src:'observability.md · chunk #4'},
      {text:'回滚脚本要能单独执行，不依赖发布流水线里的临时变量。', src:'deploy.md · chunk #9'}
    ],
    intake:[
      {t:'今天 10:02', n:'deploy.md', s:'SUCCESS'},
      {t:'昨天 16:30', n:'observability.md', s:'SUCCESS'},
      {t:'07-24 08:55', n:'runbook.pdf', s:'PENDING'}
    ]
  },
  3: {
    title:'面试题库', color:'linear-gradient(180deg,#d4c4f0,var(--c-lilac))',
    lead:'Java / 系统 / 行为题整理。问答走 /kb chat stream，不接 /api/chat。',
    docs:20, ok:18, parsing:1, pending:1, failed:0, ses:5,
    picks:[
      {text:'讲项目时先给约束，再给取舍：没有约束的方案听起来都成立。', src:'behavior.md · chunk #21'},
      {text:'HashMap 的扩容与树化阈值经常一起问，答之前先确认 JDK 版本。', src:'java-core.md · chunk #5'},
      {text:'系统设计题先把读写比例问清楚，缓存策略才有依据。', src:'system-design.md · chunk #14'}
    ],
    intake:[
      {t:'今天 08:40', n:'system-design.md', s:'PARSING'},
      {t:'昨天 21:12', n:'java-core.md', s:'SUCCESS'},
      {t:'07-23 13:07', n:'behavior.md', s:'SUCCESS'}
    ]
  },
  4: {
    title:'草稿箱', color:'linear-gradient(180deg,#ffe2a8,var(--c-sun))',
    lead:'尚未整理的原始材料。可上传，但建议解析成功后再作为主问答库。',
    docs:4, ok:1, parsing:0, pending:2, failed:1, ses:0,
    picks:[
      {text:'这里的材料还没编目，检索质量不稳定，先当草稿看。', src:'inbox.md · chunk #1'},
      {text:'扫描件缺少文本层，解析多半会失败，需要先做 OCR。', src:'scan-notes.md · chunk #2'}
    ],
    intake:[
      {t:'今天 12:31', n:'inbox.md', s:'PENDING'},
      {t:'今天 09:00', n:'clip-2026.txt', s:'PENDING'},
      {t:'昨天 22:48', n:'scan-notes.md', s:'FAILED'}
    ]
  },
  5: {
    title:'实验摘录', color:'linear-gradient(180deg,#f8c4d4,var(--c-sakura))',
    lead:'临时实验笔记与片段。站内蓝玻璃书架，不用木纹或阅览灯。',
    docs:6, ok:4, parsing:1, pending:0, failed:1, ses:1,
    picks:[
      {text:'切块大小和重叠率一起调：重叠太小，跨段落的答案会被切断。', src:'chunking.md · chunk #6'},
      {text:'同一问题换三种问法再看召回，比只看一次准确得多。', src:'eval-notes.md · chunk #11'}
    ],
    intake:[
      {t:'今天 15:55', n:'chunking.md', s:'PARSING'},
      {t:'昨天 18:03', n:'eval-notes.md', s:'SUCCESS'},
      {t:'07-22 10:26', n:'draft-embed.md', s:'FAILED'}
    ]
  }
"""

t = t[:i0] + NEW_KBS + t[i1:]

# selectKb rewrite
sub(
    """  document.getElementById('fDocs').textContent = kb.docs;
  document.getElementById('fOk').textContent = kb.ok;
  document.getElementById('fSes').textContent = kb.ses;
  document.getElementById('readyOk').textContent = kb.ok;""",
    """  document.getElementById('fDocs').textContent = kb.docs;
  document.getElementById('fOk').textContent = kb.ok;
  document.getElementById('fSes').textContent = kb.ses;
  document.getElementById('readyOk').textContent = kb.ok;
  renderHealth(kb);
  renderShelfMeta(id, kb);
  renderIntake(kb);
  pickIndex = 0;
  renderPick(kb);""",
)

sub(
    """  ['detailKbTitle','chatKbName','uploadKbTitle','uploadBadge'].forEach(idEl => {
    const el = document.getElementById(idEl); if(el) el.textContent = kb.title;
  });
  if(toastMsg) toast(`选中 · ${kb.title}`);
}""",
    """  ['detailKbTitle','chatKbName','uploadKbTitle','uploadBadge'].forEach(idEl => {
    const el = document.getElementById(idEl); if(el) el.textContent = kb.title;
  });
  if(toastMsg) toast(`选中 · ${kb.title}`);
}

let pickIndex = 0;

function renderPick(kb){
  const body = document.getElementById('pickText');
  const src = document.getElementById('pickSrc');
  const idx = document.getElementById('pickIdx');
  if(!body || !kb.picks || !kb.picks.length) return;
  const item = kb.picks[pickIndex % kb.picks.length];
  body.textContent = item.text;
  src.textContent = item.src;
  idx.textContent = `${(pickIndex % kb.picks.length) + 1} / ${kb.picks.length}`;
  body.style.animation = 'none'; void body.offsetWidth; body.style.animation = '';
}

function renderHealth(kb){
  const total = Math.max(1, kb.ok + kb.parsing + kb.pending + kb.failed);
  const bar = document.getElementById('healthBar');
  if(bar){
    const seg = {ok:kb.ok, parsing:kb.parsing, pending:kb.pending, failed:kb.failed};
    Object.keys(seg).forEach(k => {
      const el = bar.querySelector('i.' + k);
      if(el) el.style.width = (seg[k] / total * 100).toFixed(1) + '%';
    });
  }
  const name = document.getElementById('healthKb');
  if(name) name.textContent = kb.title;
  const map = {hOk:kb.ok, hParsing:kb.parsing, hPending:kb.pending, hFailed:kb.failed};
  Object.keys(map).forEach(k => {
    const el = document.getElementById(k); if(el) el.textContent = map[k];
  });
}

function renderShelfMeta(id, kb){
  const pad = String(id).padStart(2, '0');
  const bay = document.getElementById('shelfBay');
  if(bay) bay.textContent = pad;
  const chip = document.getElementById('exSpineText');
  if(chip) chip.textContent = `书脊 ${pad} · ${kb.docs} 篇`;
  const swatch = document.getElementById('exSpine');
  if(swatch) swatch.style.background = kb.color;
}

function intakeRows(list){
  return list.map(row => `
    <div class="intake-row">
      <span class="t">${row.t}</span>
      <span class="n">${row.n}</span>
      <span class="d ${row.s}" title="${row.s}"></span>
    </div>`).join('');
}

function renderIntake(kb){
  const rows = intakeRows(kb.intake || []);
  ['detailIntake','uploadIntake'].forEach(idEl => {
    const el = document.getElementById(idEl); if(el) el.innerHTML = rows;
  });
}

function renderSpineGhost(){
  const input = document.getElementById('createName');
  const ghost = document.getElementById('spineGhost');
  if(!input || !ghost) return;
  const name = input.value.trim();
  ghost.classList.toggle('is-empty', !name);
  ghost.innerHTML = `${name || '待命名'}<em>06</em>`;
  ghost.style.background = name ? 'linear-gradient(180deg,#9fd0f2,var(--c-blue))' : '';
}""",
)

sub(
    """document.getElementById('btnCreateSubmit')?.addEventListener('click', () => {""",
    """document.getElementById('btnPick')?.addEventListener('click', () => {
  const kb = KBS[selectedKb]; if(!kb || !kb.picks) return;
  pickIndex = (pickIndex + 1) % kb.picks.length;
  renderPick(kb);
});
document.getElementById('createName')?.addEventListener('input', renderSpineGhost);
document.getElementById('btnCreateSubmit')?.addEventListener('click', () => {""",
)

p.write_text(t, encoding="utf-8", newline="\n")
print("wrote", p.name, p.stat().st_size)
for c in ["pickCard", "healthBar", "detailIntake", "spineGhost", "shelfFill", "exSpineText", "renderIntake"]:
    print(c, c in t)
