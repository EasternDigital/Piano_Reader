# Sight Reading · 识谱练习

A small desktop app for practising note reading on the grand staff.
Left hand reads the bass clef, right hand the treble clef, accidentals included.
Import your own MIDI files and practise them. English / 中文.

一个练五线谱视奏的桌面小程序。左手低音谱号、右手高音谱号，含升降记号。
可以把自己的 MIDI 拖进来转成谱子练。中英文双语。

![Windows](https://img.shields.io/badge/Windows-x64-blue) ![License](https://img.shields.io/badge/license-MIT-green)

---

## What it does / 功能

- **Random drills** — a note appears, you play it on the on-screen keyboard. Judged the
  instant you press, not when you release, so there is no lag.
  **随机出题** —— 出一个音，在屏幕钢琴上按出来。按下去那一刻就判对错，不等松手，没有延迟感。

- **Realistic ranges** — notes are weighted the way they actually appear in sheet music:
  common near middle C, rarer as the ledger lines pile up. Right hand E3–C7, left hand A0–A4.
  **实战音域** —— 按真实乐谱的疏密加权出题，越靠近中央 C 越常出现，加线越多越少见。
  右手 E3–C7，左手 A0–A4。

- **One octave at a time** — drill a single octave's seven notes until they stick.
  **专项训练** —— 一次只练一个八度组的七个音。

- **Play from a score** — drop a `.mid` into the window and it is converted and kept in
  your library. Chords are played bottom to top, one note at a time.
  **照着琴谱练** —— 把 `.mid` 拖进窗口就自动转成谱子存进库里。和弦从下往上一个一个弹。

- **Sound** — each key you press sounds. Synthesised, no sample files.
  **声音** —— 按键发声，纯合成，不带采样文件。

- **Note chart** — the whole 88-key keyboard lined up against the grand staff.
  **音符对照表** —— 整台 88 键钢琴对着大谱表。

Statistics are deliberately minimal: a lifetime count of correct answers per hand, and a
play count per piece per hand. No accuracy percentages, no charts, no timers.
统计故意做得很少：左右手各自的累计答对数，以及每首谱子分手的练习次数。不记准确率、不画图表、不限时。

---

## Install / 安装

Download the installer from [Releases](../../releases) and run it. Windows x64.
从 [Releases](../../releases) 下载安装包运行即可。Windows x64。

Your data lives in `Documents\Sight Reading\` and survives uninstalling:
你的数据在「文档\Sight Reading\」下面，卸载不会删：

```
Documents\Sight Reading\
├─ data\     stats.json · scorestats.json · settings.json · samples.json · window.json · log.txt
└─ scores\   your pieces (.json) — drop files here / 谱子放这儿
```

---

## Score file format / 谱子文件格式

Scientific pitch notation (C4 = middle C). Each array is one bar. Rhythm is not recorded —
this app trains note recognition, so everything is drawn as whole notes.
音名用科学音高记法（C4 = 中央 C），每个数组是一小节，不记节奏 —— 这里练的是认音，全画成全音符。

```json
{
  "title": "Example",
  "composer": "Someone",
  "parts": {
    "treble": [["E4","E4","F4","G4"], ["G4","F4","E4","D4"]],
    "bass":   [["C3+E3+G3","G3"],     ["G2+B2+D3", ["C3","E3"]]]
  }
}
```

- `parts.treble` = right hand (treble clef), `parts.bass` = left hand (bass clef). Either may be omitted.
- Accidentals: `F#4` / `Bb3` (`Fs4`, `F♯4`, `B♭3` are also accepted).
- **Chords** — notes sounded together — are written `"C3+E3+G3"` or as an array `["C3","E3","G3"]`.
  In practice you play a chord **bottom to top**, and it only counts once every note is right.
  The order you write them in does not matter; the app sorts by pitch.
- The old `"measures": [...]` + `"clef"` shape still loads, as a single-hand piece.
- Save as UTF-8, with or without a BOM.

---

## Importing MIDI / 导入 MIDI

Drag a `.mid` into the window (or use the Import MIDI button). Parsing happens in the
renderer (`renderer/midi.js`); the main process decides the filename and writes the file.

Conversion keeps **pitch and order only**. Note lengths are used for exactly two things:

- notes starting within a 32nd note of each other become one **chord**;
- the time signature (`FF 58`) decides which **bar** a note lands in. Bars with no notes
  in that hand are skipped.

Hands are split by trying, in order:

1. a track named `right` / `rh` / `treble` / `melody` / `upper` (or `left` / `lh` / `bass` / `lower`);
2. exactly two groups (track + channel) — the one with the higher mean pitch is the right hand;
3. one group spanning more than 28 semitones — split at middle C; a narrower one stays as a single hand;
4. more than two groups — each goes to whichever side of middle C its mean pitch falls on.

Sharps or flats follow the key signature (`FF 59`): flats if the signature has any, sharps
otherwise. Notes outside A0–C8 are dropped. SMPTE timing is not supported and reports an error.

**Check the result before you practise.** Open the piece and the Check page lists every note
the program read, next to the staff. 开练之前先去校对页对一眼。

---

## Building / 自己编译

Needs Node.js (for development only — the built `.exe` does not need it).

```bash
npm install
npm start          # run it
npm run dist       # build dist/Sight-Reading-Setup-x.y.z.exe
```

`.npmrc` points at the npmmirror mirror, which helps if you are in mainland China.

```
main.js                主进程：开窗口、读写数据目录、扫描和写入谱子
preload.js             安全桥：启动时同步读好存档交给界面
renderer/index.html    整个界面（HTML + CSS + JS）
renderer/i18n.js       中英文文案表
renderer/midi.js       MIDI 解析与转谱子
renderer/fonts/        Bravura（制谱字体）、Silkscreen（像素字体）
samples/zh|en/         内置示例谱子，首次运行按语言复制一份过去
build/icon.ico         程序图标
```

---

## Notes for anyone changing the code / 改代码前先看这几条

These are all mistakes that were made and fixed once already.
下面每一条都是踩过一次的坑。

1. **Music symbols must come from Bravura, never a system font's ♭ ♯.** Those are text
   symbols and the shapes are simply wrong. Bravura follows SMuFL: font-size = 4 staff
   spaces, and clef and accidental baselines land on the right line by themselves — no
   manual offsets needed.
   **乐谱符号必须用 Bravura，不能用系统字体的 ♭ ♯**，那些是文本符号，形状根本不对。

2. **Objects passed through `contextBridge` are frozen.** `Store.get` has to deep-copy
   before anything writes to them.
   **contextBridge 传过来的对象是冻结的**，`Store.get` 必须深拷贝。

3. **Environment variables get mangled under a non-ASCII username.** Derive paths from
   `__dirname`, do not pass them through `process.env`.
   **环境变量在中文用户名下会变乱码**，路径用 `__dirname` 推。

4. **Strip the BOM when reading files**, or JSON saved by some editors fails to parse.
   **读文件要去掉 BOM。**

5. **A key's `:active` style will cover the right/wrong colour**, so the hit classes are
   excluded with `:not(.hit-ok):not(.hit-bad):active`. Otherwise the colour only shows up
   after you let go.
   **琴键的 `:active` 按压色会压住对错色。**

6. **Clear `held` the moment the last note is played**, or a stray click on the result page
   counts as another run through the piece.
   **弹完最后一个音要立刻清掉 `held`。**

7. **Chord engraving:** two noteheads a second apart overlap, so the upper one shifts right
   by one notehead and the ledger lines stretch to cover it; in a run of three seconds only
   the middle one shifts (`chordLayout`). Accidentals stack into columns, at least 6 scale
   degrees apart within a column. A chord occupying two columns shifts left by half a
   notehead so it stays centred in its slot.
   **和弦里相邻二度的符头必须错开**，升降记号要分列，整个和弦占两列时要往左挪半个符头。

8. **The sound is synthesised, there are no samples**: a few sine partials, exponential
   decay, and a lowpass sweeping downwards. The `AudioContext` is created on the first
   keypress (it needs a user gesture) and if that fails the app goes silent rather than
   throwing and blocking the judgement.
   **声音是合成的**，`AudioContext` 第一次按键时才建，建不出来就静音，不能抛异常挡住判定。

9. **Every string the user can see goes through `T()` and must exist in both languages**
   of `renderer/i18n.js`. Static markup uses `data-i18n`; anything dynamic is repainted by
   `repaint()` when the language changes. The main process returns error *codes*, not
   sentences, because it does not know which language the UI is in.
   **所有用户看得见的字都要走 `T()`，两种语言都得有。** 主进程返回错误代号而不是句子。

10. **`plural` and anything else the menu needs must be defined before the menu builds.**
    A `const` further down the file is in the temporal dead zone and the app opens blank.
    **菜单初始化用到的东西必须定义在它前面**，否则撞上暂时性死区，程序一开就白屏。

---

## Fonts / 字体

- **Bravura** — SIL Open Font License 1.1, Steinberg Media Technologies.
- **Silkscreen** — SIL Open Font License 1.1, Jason Kottke.

Licence texts are in `renderer/fonts/`. 授权原文在 `renderer/fonts/` 里。

## Licence

MIT — see [LICENSE](LICENSE).
