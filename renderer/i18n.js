"use strict";
/* =====================================================================
   界面文案 / UI strings

   每个键要么是一个字符串，要么是一个返回字符串的函数（带参数的那些）。
   取值一律走 index.html 里的 T("key", ...args)。

   加新文案时：两种语言都要加，漏一个会在启动自检里报出来。
   英文的单复数直接写在函数里，中文不需要。
   ===================================================================== */
window.I18N = {

/* ========================== 中文 ========================== */
zh: {
  appTitle:   "识谱练习",
  htmlLang:   "zh-CN",
  langTip:    "切换界面语言 / Switch language",
  soundTip:   "按键发声开关",
  soundOn:    "🔊 声音",
  soundOff:   "🔇 静音",
  back:       "‹ 返回",

  // 音名与术语
  solfege:    ["Do","Re","Mi","Fa","Sol","La","Si"],
  clefTreble: "高音谱号（右手）",
  clefBass:   "低音谱号（左手）",
  clefTrebleShort: "高音谱号",
  clefBassShort:   "低音谱号",
  handRight:  "右手",
  handLeft:   "左手",
  handRightShort: "右手",
  handLeftShort:  "左手",
  octaveNames: ["大字二组","大字一组","大字组","小字组",
                "小字一组","小字二组","小字三组","小字四组","小字五组"],
  screenTitles: { menu:"识谱练习", play:"练习中", result:"本次结果", review:"错题回顾",
                  stats:"累计答对", ref:"音符对照表", scores:"我的琴谱", proof:"校对" },

  // 菜单
  heroSub:    "看谱按键 · 左手低音谱号 / 右手高音谱号 · 含升降记号",
  labHand:    "练习范围",
  labAcc:     "升降记号",
  labRange:   "出题音域",
  accOff:     "不含",      accOffSub:  "只有白键",
  accSome:    "少量",      accSomeSub: "约 1/3 带记号",
  accMany:    "较多",      accManySub: "约 2/3 带记号",
  rangeFull:  "全音域",    rangePick:  "专项",
  start:      "开 始 练 习",
  toStats:    "📊 累计答对",
  toRef:      "📖 音符对照表",
  playPiece:  "🎼 练 琴 谱",
  playPieceN:     (n, bad) => "🎼 练 琴 谱（" + n + " 首" + (bad ? "，" + bad + " 首有问题" : "") + "）",
  playPieceEmpty: "🎼 练 琴 谱（还没有谱子）",
  footBrowser: "不限时，练到按「结束」为止 · <kbd>空格</kbd> 开始<br>成绩保存在本机浏览器中",
  footDesktop: "不限时，练到按「结束」为止 · <kbd>空格</kbd> 开始<br>数据保存在「文档\\识谱练习\\」",
  groupSub:    (lo, hi, n) => lo + "–" + hi + "（" + n + " 个音）",
  groupHintPick: (lo, hi, n) =>
    "只练 " + lo + "–" + hi + " 这 " + n + " 个音，组内平均出题。练熟了切回「全音域」跑一遍确认。",
  groupHintAll: (lo, hi) =>
    "按真实乐谱的疏密加权出题，越靠近中央 C 越常出现（" + lo + "–" + hi + "）。",

  // 练习
  hudTime:     "时间",
  hudCorrect:  "本次答对",
  hudTotal:    "累计答对",
  hudTotalHand: h => (h === "treble" ? "右手" : "左手") + "累计",
  askNote:     "这个音是什么？",
  padPiano:    "钢琴键",
  padNames:    "音名",
  stopSession: "结束本次练习",
  verdictOk:   name => "✓ " + name,
  verdictBad:  (right, given) => "✗ 正确答案是 " + right + "，你按的是 " + given,

  // 结果
  correctThis: "本次答对",
  again:       "再来一次",
  backMenu:    "返回主菜单",
  reviewBtn:   "查看错题",
  reviewN:     n => "查看错题 (" + n + ")",
  noMistakes:  "没有错题 🎉",
  rowRightTotal: "右手 · 累计答对",
  rowLeftTotal:  "左手 · 累计答对",
  rowTime:       "本次用时",

  // 错题
  answerIs:   "正确答案是",
  youPlayed:  "你按的是",
  prev:       "上一题",
  next:       "下一题",

  // 累计
  statTreble: "右手 · 高音谱号",
  statBass:   "左手 · 低音谱号",
  statsHint:  "每次练习答对的次数都会累加进去，永不清零（除非手动清空）",
  resetBtn:   "清空累计答对",
  resetAsk:   "确定把左右手的累计答对数都归零？此操作无法撤销。",

  // 对照表
  chartHeader: "88 键 ↔ 大谱表 · 左右滑动查看全部",
  middleC:     "中央C",
  refNote:
    "整张表就是一台 88 键钢琴（A0–C8）和它对应的大谱表，虚线把每个白键连到它在谱上的位置。<br>" +
    "<span class=\"swatch\"></span> 每个 <b>Do（C）</b>都用红色标出并带组号，<b>中央 C（Do4 / C4）</b>的琴键单独高亮，用它们定位最快。<br>" +
    "上排是每组的名称，例如「小字一组」就是 C4–B4 这七个音。<br>" +
    "高音谱号（𝄞，G 谱号）通常记右手，低音谱号（𝄢，F 谱号）通常记左手。<br>" +
    "五线之外用来记高低音的短线叫<b>加线</b>；♯ 升高半音（右邻的键），♭ 降低半音（左邻的键）。<br>" +
    "同一个黑键有两种写法，例如 F♯ 与 G♭ 是同一个键。",

  // 琴谱列表
  importMidi:  "🎹 导入 MIDI",
  scoresFolder:"📁 谱子文件夹",
  rescan:      "🔄 重新扫描",
  scoresFoot:
    "把 .mid 文件<b>直接拖进窗口</b>就会自动转成谱子存进库里，以后一直都能练<br>" +
    "现成的 .json 谱子拖进来、或者丢进「文档\\识谱练习\\scores\\」也行",
  scanning:    "正在扫描…",
  emptyFolder: "scores 文件夹还是空的。<br>把谱子文件丢进去，回来点「重新扫描」。",
  unreadable:  e => "这个文件读不出来：" + e,
  wrongFormat: "格式不对",
  scanError:   e => "扫描出错：" + e,
  nBars:       n => n + " 小节",
  nNotes:      n => n + " 个音",
  nPlays:      n => n + " 次",
  cannotRead:  f => "这个谱子读不出来：" + f,

  // 校对
  proofHint:
    "<b>开练之前先对一遍。</b>下面是程序读到的每一个音，对着你手上的原谱扫一眼。" +
    "发现错的直接改 scores 里那个 .json 文件，改完回来点「重新扫描」。",
  whichHand:   "练哪只手",
  playedTimes: n => " · 已练 " + n + " 次",
  notWritten:  "这首没有写",
  barsNotes:   (b, n) => b + " 小节 / " + n + " 个音",
  chordNote:   n =>
    "这首里有 " + n + " 处和弦（下面用 + 连起来的）。练的时候一个和弦<b>从下往上</b>依次弹，" +
    "几个音全弹对才算过。",
  proofStart:  "对过了，开始练",
  proofStartH: hand => "对过了，开始练" + hand,
  badNote:     (bar, pos, s) => "第 " + bar + " 小节第 " + pos + " 个「" + s + "」看不懂",

  // 照着琴谱练
  noNotes:        "这个谱子里没有音。",
  hudProgress:    "进度",
  hudBar:         "小节",
  hudMistakes:    "本次弹错",
  leavePiece:     "退出这首",
  playHighlighted:"按出高亮的那个音",
  chordStep:      (total, j) => "和弦 " + total + " 个音，从下往上弹 · 第 " + j + " 个",
  scoreBad:       (right, given) => "✗ 这个音是 " + right + "，你按的是 " + given + "（再按一次正确的）",
  pieceLabel:     (title, hand) => "《" + title + "》" + hand + "已练",
  rowWrongThis:   "本次弹错",
  rowBestWrong:   "最少弹错纪录",
  rowTotalNotes:  "音符总数",
  nTimesWrong:    n => n + " 次",
  withChords:     n => "（含 " + n + " 处和弦）",
  playItAgain:    "再练一遍",
  backToList:     "返回琴谱列表",

  // 导入
  dropTitle: "松手就开始转",
  dropLine:  ".mid / .midi 自动转成谱子存进库里<br>现成的 .json 谱子也认",
  dropSmall: "转完去「校对」页对一眼，程序读到的音都在那儿",
  importedOk:   (title, detail) => "✓ 已存进库：<b>" + title + "</b> &nbsp;" + detail,
  importedBad:  (name, err) => "✗ " + name + "：" + err,
  importNote:   "开练之前先点进去，在校对页对一眼转出来的音。MIDI 转谱子是按音高和先后顺序来的，不记节奏。",
  importedPiece:"导入的谱子",
  notAScore:    "这个 json 里没有 parts / measures，不是谱子文件",
  cantSave:     "存不进 scores 文件夹",
  errNotScore:  "内容不是一首谱子",
  errNoNotes:   "这里面没有任何音符",
  errTooBig:    "谱子太大了（超过 8 MB）",
  otherFiles:   n => "其它 " + n + " 个文件",
  skipped:      "只认 .mid / .midi / .json，已跳过",

  // MIDI 转换里抛出来的错
  midiNotMidi:  "这不是 MIDI 文件（开头没有 MThd）",
  midiSmpte:    "这个 MIDI 用的是 SMPTE 时间格式，暂时不支持",
  midiNoTrack:  "这个 MIDI 里一个音轨都没有",
  midiNoNotes:  "这个 MIDI 里没有能用的音符",
  midiEmpty:    "转出来是空的，这个 MIDI 里没有音符",
  midiUntitled: "未命名",
  midiSource:   f => "从 MIDI 导入" + (f ? "：" + f : "")
},

/* ========================== English ========================== */
en: {
  appTitle:   "Sight Reading",
  htmlLang:   "en",
  langTip:    "Switch language / 切换界面语言",
  soundTip:   "Turn key sounds on or off",
  soundOn:    "🔊 Sound",
  soundOff:   "🔇 Muted",
  back:       "‹ Back",

  // 英语国家的唱名第七音是 Ti，不是 Si
  solfege:    ["Do","Re","Mi","Fa","Sol","La","Ti"],
  clefTreble: "Treble clef (right hand)",
  clefBass:   "Bass clef (left hand)",
  clefTrebleShort: "Treble clef",
  clefBassShort:   "Bass clef",
  handRight:  "Right hand",
  handLeft:   "Left hand",
  handRightShort: "Right",
  handLeftShort:  "Left",
  octaveNames: ["Octave 0","Octave 1","Octave 2","Octave 3",
                "Octave 4","Octave 5","Octave 6","Octave 7","Octave 8"],
  screenTitles: { menu:"Sight Reading", play:"Practising", result:"Result", review:"Mistakes",
                  stats:"Total correct", ref:"Note chart", scores:"My pieces", proof:"Check" },

  heroSub:    "Read a note, play it · Left hand bass clef / right hand treble clef · Accidentals included",
  labHand:    "WHICH HAND",
  labAcc:     "ACCIDENTALS",
  labRange:   "NOTE RANGE",
  accOff:     "None",   accOffSub:  "white keys only",
  accSome:    "Some",   accSomeSub: "about 1 note in 3",
  accMany:    "Lots",   accManySub: "about 2 notes in 3",
  rangeFull:  "Full",   rangePick:  "One octave",
  start:      "S T A R T",
  toStats:    "📊 Total correct",
  toRef:      "📖 Note chart",
  playPiece:  "🎼 PLAY A PIECE",
  playPieceN:     (n, bad) => "🎼 PLAY A PIECE (" + n + (bad ? ", " + bad + " broken" : "") + ")",
  playPieceEmpty: "🎼 PLAY A PIECE (nothing yet)",
  footBrowser: "No timer — practise until you hit Stop · <kbd>Space</kbd> to start<br>Your score is saved in this browser",
  footDesktop: "No timer — practise until you hit Stop · <kbd>Space</kbd> to start<br>Your data lives in Documents\\Sight Reading\\",
  groupSub:    (lo, hi, n) => lo + "–" + hi + " (" + n + " note" + (n === 1 ? "" : "s") + ")",
  groupHintPick: (lo, hi, n) =>
    "Just " + n + " note" + (n === 1 ? "" : "s") + ", " + lo + "–" + hi +
    ", each as likely as the next. Once they stick, switch back to Full and check yourself.",
  groupHintAll: (lo, hi) =>
    "Notes turn up as unevenly as they do in real music — the closer to middle C, the more often (" +
    lo + "–" + hi + ").",

  hudTime:     "Time",
  hudCorrect:  "Correct",
  hudTotal:    "Total",
  hudTotalHand: h => "Total (" + (h === "treble" ? "RH" : "LH") + ")",
  askNote:     "What note is this?",
  padPiano:    "Keyboard",
  padNames:    "Note names",
  stopSession: "Stop this session",
  verdictOk:   name => "✓ " + name,
  verdictBad:  (right, given) => "✗ That was " + right + " — you played " + given,

  correctThis: "Correct this session",
  again:       "Again",
  backMenu:    "Back to menu",
  reviewBtn:   "Review mistakes",
  reviewN:     n => "Review mistakes (" + n + ")",
  noMistakes:  "No mistakes 🎉",
  rowRightTotal: "Right hand · total correct",
  rowLeftTotal:  "Left hand · total correct",
  rowTime:       "Time this session",

  answerIs:   "The answer is",
  youPlayed:  "You played",
  prev:       "Previous",
  next:       "Next",

  statTreble: "Right hand · treble clef",
  statBass:   "Left hand · bass clef",
  statsHint:  "Every correct answer gets added here. It never resets on its own — only when you clear it.",
  resetBtn:   "Clear totals",
  resetAsk:   "Reset the total-correct count for both hands to zero? This cannot be undone.",

  chartHeader: "88 keys and the grand staff · scroll sideways for the rest",
  middleC:     "Middle C",
  refNote:
    "This is a whole 88-key piano (A0–C8) beside its grand staff; the dotted lines join each white key to its place on the staff.<br>" +
    "<span class=\"swatch\"></span> Every <b>Do (C)</b> is marked in red with its octave number, and the <b>middle C (Do4 / C4)</b> key is highlighted on its own — those are the quickest landmarks.<br>" +
    "The row along the top names the octaves: \"Octave 4\", for instance, is the seven notes C4–B4.<br>" +
    "The treble clef (𝄞, the G clef) usually carries the right hand; the bass clef (𝄢, the F clef) the left.<br>" +
    "The short strokes above and below the staff are <b>ledger lines</b>; ♯ raises a semitone (the key to its right), ♭ lowers one (the key to its left).<br>" +
    "One black key has two spellings: F♯ and G♭ are the same key.",

  importMidi:  "🎹 Import MIDI",
  scoresFolder:"📁 Scores folder",
  rescan:      "🔄 Rescan",
  scoresFoot:
    "<b>Drag a .mid file straight into this window</b> and it becomes a piece in your library, there for good<br>" +
    "Ready-made .json scores work too — drop them in, or put them in Documents\\Sight Reading\\scores\\",
  scanning:    "Scanning…",
  emptyFolder: "The scores folder is still empty.<br>Drop some score files in, then come back and hit Rescan.",
  unreadable:  e => "Could not read this file: " + e,
  wrongFormat: "wrong format",
  scanError:   e => "Scan failed: " + e,
  nBars:       n => n + " bar" + (n === 1 ? "" : "s"),
  nNotes:      n => n + " note" + (n === 1 ? "" : "s"),
  nPlays:      n => String(n),
  cannotRead:  f => "Could not read this piece: " + f,

  proofHint:
    "<b>Check it before you play.</b> Below is every note the program read — run your eye down it against the original. " +
    "Spot a mistake? Edit that .json in the scores folder, come back and hit Rescan.",
  whichHand:   "WHICH HAND",
  playedTimes: n => " · played " + n + "x",
  notWritten:  "not written for this piece",
  barsNotes:   (b, n) => b + " bar" + (b === 1 ? "" : "s") + " / " + n + " note" + (n === 1 ? "" : "s"),
  chordNote:   n =>
    "This piece has " + n + " chord" + (n === 1 ? "" : "s") + " (joined by + below). " +
    "You play a chord <b>bottom to top</b>, one note at a time, and it only counts once every note is right.",
  proofStart:  "Checked — start playing",
  proofStartH: hand => "Checked — play the " + hand.toLowerCase(),
  badNote:     (bar, pos, s) => "Bar " + bar + ", position " + pos + ": cannot read \"" + s + "\"",

  noNotes:        "There are no notes in this piece.",
  hudProgress:    "Progress",
  hudBar:         "Bar",
  hudMistakes:    "Mistakes",
  leavePiece:     "Leave this piece",
  playHighlighted:"Play the highlighted note",
  chordStep:      (total, j) => "Chord of " + total + ", bottom to top · note " + j,
  scoreBad:       (right, given) => "✗ This one is " + right + ", you played " + given + " — try again",
  pieceLabel:     (title, hand) => "“" + title + "” · " + hand.toLowerCase() + " · times played",
  rowWrongThis:   "Mistakes this time",
  rowBestWrong:   "Best run so far",
  rowTotalNotes:  "Notes in total",
  nTimesWrong:    n => n + (n === 1 ? " mistake" : " mistakes"),
  withChords:     n => " (incl. " + n + " chord" + (n === 1 ? "" : "s") + ")",
  playItAgain:    "Play it again",
  backToList:     "Back to the list",

  dropTitle: "Let go and it converts",
  dropLine:  ".mid / .midi turns into a piece and stays in your library<br>Ready-made .json scores work too",
  dropSmall: "Afterwards open Check — every note it read is listed there",
  importedOk:   (title, detail) => "✓ Added to your library: <b>" + title + "</b> &nbsp;" + detail,
  importedBad:  (name, err) => "✗ " + name + ": " + err,
  importNote:   "Open it and look over the notes on the Check page before you play. " +
                "Converting MIDI keeps pitch and order only — rhythm is not recorded.",
  importedPiece:"Imported piece",
  notAScore:    "This json has no parts / measures — it is not a score file",
  cantSave:     "could not be saved into the scores folder",
  errNotScore:  "that is not a score",
  errNoNotes:   "there are no notes in it",
  errTooBig:    "the score is too big (over 8 MB)",
  otherFiles:   n => n + " other file" + (n === 1 ? "" : "s"),
  skipped:      "only .mid / .midi / .json are understood — skipped",

  midiNotMidi:  "This is not a MIDI file (no MThd header)",
  midiSmpte:    "This MIDI uses SMPTE timing, which is not supported yet",
  midiNoTrack:  "This MIDI has no tracks at all",
  midiNoNotes:  "This MIDI has no usable notes",
  midiEmpty:    "Came out empty — this MIDI has no notes",
  midiUntitled: "Untitled",
  midiSource:   f => "Imported from MIDI" + (f ? ": " + f : "")
}

};
