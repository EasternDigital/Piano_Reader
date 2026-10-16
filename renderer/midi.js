"use strict";
/* =====================================================================
   MIDI 导入
   把一个标准 MIDI 文件（.mid）变成本程序的谱子格式。

   只取「音高」和「先后顺序」—— 本程序不记节奏，时值只用来做两件事：
     1. 判断哪几个音是同时按下的（归成一个和弦）
     2. 算这个音落在第几小节

   解析的是 Standard MIDI File 1.0：MThd 头 + 若干 MTrk 块，
   块里是「变长的时间间隔 + 事件」，支持 running status。
   ===================================================================== */
window.MidiImport = (function(){

// 报错文案跟界面共用一套；万一 i18n 还没挂上就把键名原样抛出来，至少不会崩
const TX = (k, a) => (window.T ? window.T(k, a) : k);


const LETTERS = ["C","D","E","F","G","A","B"];
// 半音 -> [音名序号, 变音]。两张表都绕开了 B♯ / C♭ 这类别扭写法
const SHARP = [[0,0],[0,1],[1,0],[1,1],[2,0],[3,0],[3,1],[4,0],[4,1],[5,0],[5,1],[6,0]];
const FLAT  = [[0,0],[1,-1],[1,0],[2,-1],[2,0],[3,0],[4,-1],[4,0],[5,-1],[5,0],[6,-1],[6,0]];

const MIDI_LO = 21, MIDI_HI = 108;     // A0 – C8，钢琴之外的音直接丢掉
const MAX_CHORD = 6;                   // 一只手同时按超过 6 个音的谱子不存在，多半是分解和弦被归错
const MAX_BARS  = 4000;                // 防止畸形文件把小节表撑爆

function spell(midi, useFlats){
  const pc = ((midi % 12) + 12) % 12;
  const e  = (useFlats ? FLAT : SHARP)[pc];
  // 上面两张表不会产生 B♯ / C♭，所以八度直接按半音数算就是对的
  return LETTERS[e[0]] + (e[1] > 0 ? "#" : e[1] < 0 ? "b" : "") + (Math.floor(midi / 12) - 1);
}

/* ===================== 解析 ===================== */

function parse(buffer){
  const u8 = new Uint8Array(buffer), d = new DataView(buffer);
  const tag = (o) => String.fromCharCode(u8[o], u8[o+1], u8[o+2], u8[o+3]);

  if(u8.length < 14 || tag(0) !== "MThd")
    throw new Error(TX("midiNotMidi"));

  const headLen = d.getUint32(4);
  const format  = d.getUint16(8);
  const ntrk    = d.getUint16(10);
  const division = d.getInt16(12);
  if(division <= 0) throw new Error(TX("midiSmpte"));

  const meta = { timeSigs:[], keySigs:[] };
  const tracks = [];
  let p = 8 + headLen;

  for(let t = 0; t < ntrk && p + 8 <= u8.length; t++){
    const id = tag(p), len = d.getUint32(p + 4);
    p += 8;
    const end = Math.min(u8.length, p + len);
    if(id === "MTrk") tracks.push(parseTrack(u8, p, end, t, meta));
    p = end;
  }
  if(!tracks.length) throw new Error(TX("midiNoTrack"));
  return { division, format, tracks, timeSigs:meta.timeSigs, keySigs:meta.keySigs };
}

function parseTrack(u8, p, end, index, meta){
  const notes = [];
  const sounding = new Map();          // 通道*128+音高 -> 还没收到 note off 的那些音
  let tick = 0, status = 0, name = "";

  const varlen = () => {
    let v = 0, c, n = 0;
    do { c = u8[p++]; v = (v << 7) | (c & 0x7f); } while((c & 0x80) && p < end && ++n < 4);
    return v;
  };
  const latin1 = (at, len) => {
    let s = "";
    for(let i = 0; i < len; i++){ const c = u8[at+i]; if(c >= 32 && c < 127) s += String.fromCharCode(c); }
    return s.trim();
  };

  while(p < end){
    tick += varlen();
    if(p >= end) break;

    if(u8[p] & 0x80) status = u8[p++];         // 否则沿用上一个状态字节（running status）
    if(!status) break;

    if(status === 0xff){                        // 元事件
      const type = u8[p++], len = varlen();
      if(type === 0x03 && !name) name = latin1(p, len);
      else if(type === 0x58 && len >= 2) meta.timeSigs.push({ t:tick, num:u8[p] || 4, den:Math.pow(2, u8[p+1]) || 4 });
      else if(type === 0x59 && len >= 1) meta.keySigs.push({ t:tick, sf:(u8[p] << 24) >> 24 });
      p += len;
      if(type === 0x2f) break;                  // 轨道结束
    } else if(status === 0xf0 || status === 0xf7){
      p += varlen();                            // SysEx，跳过
    } else {
      const type = status & 0xf0, ch = status & 0x0f;
      if(type === 0x80 || type === 0x90){
        const pitch = u8[p], vel = u8[p+1]; p += 2;
        const key = ch * 128 + pitch;
        if(type === 0x90 && vel > 0){
          let a = sounding.get(key); if(!a) sounding.set(key, a = []);
          a.push({ midi:pitch, t:tick, ch });
        } else {
          const a = sounding.get(key);
          if(a && a.length) notes.push(a.shift());
        }
      }
      else if(type === 0xc0 || type === 0xd0) p += 1;
      else p += 2;                              // 0xa0 / 0xb0 / 0xe0
    }
  }
  // 有些文件最后几个音不给 note off，照样算数
  sounding.forEach(a => a.forEach(n => notes.push(n)));
  notes.sort((a, b) => a.t - b.t || a.midi - b.midi);
  return { index, name, notes };
}

/* ===================== 转成谱子 ===================== */

// 轨道名里的提示词，比按音高猜更靠谱
const RE_RIGHT = /\b(right|r\.?h\.?|treble|melody|soprano|upper)\b/i;
const RE_LEFT  = /\b(left|l\.?h\.?|bass|lower)\b/i;

function convert(smf, opts){
  opts = opts || {};
  const div = smf.division;

  // —— 按「音轨 + 通道」分组，一组通常就是一只手或一个声部 ——
  const groups = new Map();
  smf.tracks.forEach(tr => tr.notes.forEach(n => {
    if(n.midi < MIDI_LO || n.midi > MIDI_HI) return;
    const k = tr.index + ":" + n.ch;
    let g = groups.get(k);
    if(!g) groups.set(k, g = { name:tr.name || "", notes:[] });
    g.notes.push(n);
  }));
  const gs = [...groups.values()].filter(g => g.notes.length);
  if(!gs.length) throw new Error(TX("midiNoNotes"));

  const mean = g => g.notes.reduce((s, n) => s + n.midi, 0) / g.notes.length;
  const hands = { treble:[], bass:[] };

  if(gs.length === 1){
    const ns = gs[0].notes;
    let lo = 999, hi = 0;
    ns.forEach(n => { if(n.midi < lo) lo = n.midi; if(n.midi > hi) hi = n.midi; });
    const hint = RE_RIGHT.test(gs[0].name) ? "treble" : RE_LEFT.test(gs[0].name) ? "bass" : null;
    if(hint)            hands[hint] = ns.slice();
    else if(hi - lo <= 28) hands[mean(gs[0]) >= 60 ? "treble" : "bass"] = ns.slice();
    else ns.forEach(n => hands[n.midi >= 60 ? "treble" : "bass"].push(n));   // 音域太宽，当成双手谱从中央 C 劈开
  } else {
    const named = gs.filter(g => RE_RIGHT.test(g.name) || RE_LEFT.test(g.name));
    if(named.length === gs.length){
      gs.forEach(g => hands[RE_RIGHT.test(g.name) ? "treble" : "bass"].push(...g.notes));
    } else if(gs.length === 2){
      const s = gs.slice().sort((a, b) => mean(b) - mean(a));
      hands.treble = s[0].notes.slice();
      hands.bass   = s[1].notes.slice();
    } else {
      gs.forEach(g => (mean(g) >= 60 ? hands.treble : hands.bass).push(...g.notes));
    }
  }

  let endTick = 0;
  for(const h of ["treble", "bass"]) hands[h].forEach(n => { if(n.t > endTick) endTick = n.t; });

  const barOf = barIndexer(div, smf.timeSigs, endTick);
  const flatsAt = keyLookup(smf.keySigs);

  const parts = {}, stat = {};
  for(const h of ["treble", "bass"]){
    const part = buildPart(hands[h], div, barOf, flatsAt);
    if(part){ parts[h] = part.measures; stat[h] = { bars:part.measures.length, notes:part.notes }; }
  }
  if(!Object.keys(parts).length) throw new Error(TX("midiEmpty"));

  const untitled = TX("midiUntitled");
  const title = (opts.title || untitled).trim() || untitled;
  return {
    title, stat,
    score: {
      title,
      composer: "",
      source: TX("midiSource", opts.file),
      parts
    }
  };
}

/* 小节表：从 0 开始按拍号往后排，拍号中途变了就换新的小节长度 */
function barIndexer(div, timeSigs, endTick){
  const ts = (timeSigs && timeSigs.length ? timeSigs.slice() : []).sort((a, b) => a.t - b.t);
  if(!ts.length || ts[0].t > 0) ts.unshift({ t:0, num:4, den:4 });

  const starts = [0];
  for(let i = 0; i < ts.length && starts.length < MAX_BARS; i++){
    const len = Math.max(1, Math.round(div * 4 * ts[i].num / ts[i].den));
    // 排到下一次换拍号为止；最后一段排到最后一个音所在的小节（上限兜着，别被畸形文件卡死）
    const to  = (i + 1 < ts.length) ? ts[i+1].t : (endTick || 0) + 1;
    let t = Math.max(ts[i].t, starts[starts.length - 1] + len);
    while(t < to && starts.length < MAX_BARS){ starts.push(t); t += len; }
  }
  const tail = starts[starts.length - 1];
  const step = starts.length > 1 ? tail - starts[starts.length - 2] : Math.max(1, div * 4);

  return function(t){
    if(t >= tail) return starts.length - 1 + Math.floor((t - tail) / step);
    let lo = 0, hi = starts.length - 1;
    while(lo < hi){ const m = (lo + hi + 1) >> 1; if(starts[m] <= t) lo = m; else hi = m - 1; }
    return lo;
  };
}

/* 调号决定升号还是降号记谱；没写调号就按升号来 */
function keyLookup(keySigs){
  const ks = (keySigs && keySigs.length ? keySigs.slice() : []).sort((a, b) => a.t - b.t);
  if(!ks.length) return () => false;
  return function(t){
    let sf = ks[0].sf;
    for(let i = 0; i < ks.length && ks[i].t <= t; i++) sf = ks[i].sf;
    return sf < 0;
  };
}

function buildPart(notes, div, barOf, flatsAt){
  if(!notes || !notes.length) return null;
  notes = notes.slice().sort((a, b) => a.t - b.t || a.midi - b.midi);

  // 起始时间挨得足够近（三十二分音符以内）就算同时按下，归成一个和弦
  const tol = Math.max(1, Math.round(div / 8));
  const events = [];
  let cur = null;
  notes.forEach(n => {
    if(cur && n.t - cur.t <= tol){
      if(cur.midis.indexOf(n.midi) < 0) cur.midis.push(n.midi);
    } else {
      events.push(cur = { t:n.t, midis:[n.midi] });
    }
  });

  const measures = [];
  let lastBar = -1, total = 0;
  events.forEach(ev => {
    const b = barOf(ev.t);
    if(b !== lastBar){ measures.push([]); lastBar = b; }   // 整小节没音就不生成空小节
    let ms = ev.midis.slice().sort((a, b) => a - b);
    if(ms.length > MAX_CHORD) ms = ms.slice(0, 3).concat(ms.slice(-3));
    const flats = flatsAt(ev.t);
    total += ms.length;
    measures[measures.length - 1].push(ms.map(m => spell(m, flats)).join("+"));
  });

  return { measures, notes: total };
}

return { parse, convert, spell };
})();
