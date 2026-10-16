"use strict";

const { app, BrowserWindow, ipcMain, shell, Menu, nativeTheme } = require("electron");
const path = require("path");
const fs = require("fs");

/* ===================== 用户数据目录 =====================
   一切用户数据都放在「文档\识谱练习\」下面，不放在安装目录里：
   卸载重装不丢数据，也方便你自己备份和往 scores 里丢谱子。        */
const DIRS = {};

/* 装示例谱子用哪套语言：优先看用户存过的设置，没有就看系统语言 */
function pickLang(){
  const s = readJSON("settings", null);
  if(s && (s.lang === "zh" || s.lang === "en")) return s.lang;
  try { return /^zh/i.test(app.getLocale() || "") ? "zh" : "en"; } catch(e){ return "en"; }
}

function initDirs(){
  const docs = app.getPath("documents");
  DIRS.root = path.join(docs, "Sight Reading");

  // 1.9 及更早的数据在「识谱练习」下面。整个目录搬过来，别让人把练习记录丢了。
  const legacy = path.join(docs, "识谱练习");
  if(!fs.existsSync(DIRS.root) && fs.existsSync(legacy)){
    try { fs.renameSync(legacy, DIRS.root); }
    catch(e){ logError("could not migrate the old data folder, staying on it", e); DIRS.root = legacy; }
  }

  DIRS.data   = path.join(DIRS.root, "data");
  DIRS.scores = path.join(DIRS.root, "scores");
  for(const d of [DIRS.root, DIRS.data, DIRS.scores]){
    try { fs.mkdirSync(d, { recursive:true }); } catch(e){ logError("mkdir failed " + d, e); }
  }
  // 首次运行把内置示例谱子复制过去，让 scores 文件夹不是空的。
  // 用 读+写 而不是 copyFileSync —— 源文件在 asar 包里，copyFileSync 不一定支持。
  //
  // 升级规则：samples.json 里记着「上次我们写进去的那份长什么样」的哈希。
  // 盘上那份还是那个哈希 = 用户没动过，可以换成新版；对不上就是用户自己改过，一个字都不碰。
  try {
    const samples = path.join(__dirname, "samples", pickLang());
    if(!fs.existsSync(samples)) return;
    const stamp = readJSON("samples", {}) || {};
    let dirty = false;

    for(const f of fs.readdirSync(samples)){
      const src = path.join(samples, f), dst = path.join(DIRS.scores, f);
      const buf = fs.readFileSync(src), fresh = sha1(buf);

      if(!fs.existsSync(dst)){
        fs.writeFileSync(dst, buf); stamp[f] = fresh; dirty = true; continue;
      }
      const cur = sha1(fs.readFileSync(dst));
      if(cur === fresh){                              // 已经是最新的
        if(stamp[f] !== fresh){ stamp[f] = fresh; dirty = true; }
        continue;
      }
      if(stamp[f] === cur){                           // 用户没改过，升级
        fs.writeFileSync(dst, buf); stamp[f] = fresh; dirty = true; continue;
      }
      if(stamp[f] !== undefined) continue;            // 用户改过，不动

      // 还没有哈希记录的老用户：只认 1.1.0 那种「只有右手、旋律没动过」的旧示例
      try {
        const mine = JSON.parse(readText(dst)), now = JSON.parse(stripBom(buf.toString("utf8")));
        const untouchedOld = !mine.parts && Array.isArray(mine.measures) && now.parts &&
              JSON.stringify(mine.measures) === JSON.stringify(now.parts.treble);
        if(untouchedOld){ fs.writeFileSync(dst, buf); stamp[f] = fresh; dirty = true; }
      } catch(e){ /* 读不懂就别碰用户的文件 */ }
    }
    if(dirty) writeJSON("samples", stamp);
  } catch(e){ logError("copying sample scores failed", e); }
}

function sha1(buf){ return require("crypto").createHash("sha1").update(buf).digest("hex"); }

function logError(msg, err){
  try {
    const line = "[" + new Date().toISOString() + "] " + msg +
                 (err ? " :: " + (err.stack || err.message || err) : "") + "\n";
    fs.appendFileSync(path.join(DIRS.data || app.getPath("temp"), "log.txt"), line, "utf8");
  } catch(e){ /* 记日志失败就算了，不能因此崩溃 */ }
}

/* 一小节里有几个音。一个元素可能是单音 "C4"，也可能是和弦 "C4+E4+G4" 或 ["C4","E4"] */
function countNotes(measure){
  if(!Array.isArray(measure)) return 0;
  return measure.reduce((n, ev) =>
    n + (Array.isArray(ev) ? ev.length : typeof ev === "string" ? ev.split("+").length : 0), 0);
}

/* 一首谱子里的左右手：新格式 parts.treble / parts.bass，旧格式 measures + clef 当单手 */
function partsOf(s){
  const out = {};
  if(s && s.parts && typeof s.parts === "object"){
    for(const h of ["treble","bass"])
      if(Array.isArray(s.parts[h]) && s.parts[h].length) out[h] = s.parts[h];
  } else if(s && Array.isArray(s.measures)){
    out[(s.clef === "bass" || s.hand === "bass") ? "bass" : "treble"] = s.measures;
  }
  return out;
}

/* ===================== JSON 读写 ===================== */
// 读文本时去掉 BOM：记事本等编辑器存 UTF-8 可能带 BOM，JSON.parse 不认
function stripBom(s){ return s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s; }
function readText(p){ return stripBom(fs.readFileSync(p, "utf8")); }
function jsonPath(kind){ return path.join(DIRS.data, kind + ".json"); }
function readJSON(kind, fallback){
  try {
    const p = jsonPath(kind);
    if(!fs.existsSync(p)) return fallback;
    return JSON.parse(readText(p));
  } catch(e){ logError("reading " + kind + ".json failed", e); return fallback; }
}
function writeJSON(kind, obj){
  try {
    // 先写临时文件再改名，避免写一半断电把存档写坏
    const p = jsonPath(kind), tmp = p + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), "utf8");
    fs.renameSync(tmp, p);
    return true;
  } catch(e){ logError("writing " + kind + ".json failed", e); return false; }
}

/* ===================== 窗口 ===================== */
let win = null;

function restoreBounds(){
  const b = readJSON("window", null);
  if(!b || !Number.isFinite(b.width) || !Number.isFinite(b.height)) return {};
  const out = { width:Math.max(700, b.width|0), height:Math.max(620, b.height|0) };
  if(Number.isFinite(b.x) && Number.isFinite(b.y)){ out.x = b.x|0; out.y = b.y|0; }
  return out;
}
function saveBounds(){
  if(!win || win.isDestroyed() || win.isMinimized()) return;
  const b = win.getNormalBounds ? win.getNormalBounds() : win.getBounds();
  writeJSON("window", { x:b.x, y:b.y, width:b.width, height:b.height, maximized:win.isMaximized() });
}

function createWindow(){
  const saved = readJSON("window", null);
  win = new BrowserWindow(Object.assign({
    width: 1000, height: 880, minWidth: 700, minHeight: 620,
    title: "Sight Reading",
    icon: path.join(__dirname, "build", "icon.ico"),
    backgroundColor: "#efe9dc",        // 和界面同色，开窗不闪白（界面只有浅色一套）
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,            // preload 需要用 fs 同步读存档
      spellcheck: false
    }
  }, restoreBounds()));

  Menu.setApplicationMenu(null);           // 不要浏览器那套菜单
  win.loadFile(path.join(__dirname, "renderer", "index.html"));

  win.once("ready-to-show", () => {
    if(saved && saved.maximized) win.maximize();
    win.show();
  });

  // 外部链接交给系统浏览器，不在程序窗口里打开
  win.webContents.setWindowOpenHandler(({ url }) => {
    if(/^https?:/.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (e, url) => {
    if(!url.startsWith("file://")) { e.preventDefault(); shell.openExternal(url); }
  });

  let saveTimer = null;
  const queueSave = () => { clearTimeout(saveTimer); saveTimer = setTimeout(saveBounds, 400); };
  win.on("resize", queueSave);
  win.on("move", queueSave);
  win.on("close", saveBounds);
  win.on("closed", () => { win = null; });
}

/* ===================== 与界面通信 ===================== */
ipcMain.on("store:save", (e, kind, obj) => {
  if(!/^[a-z]+$/.test(kind)) return;                   // 只允许写我们自己的几个文件
  writeJSON(kind, obj);
});

ipcMain.handle("scores:list", () => {
  const out = [];
  try {
    for(const f of fs.readdirSync(DIRS.scores)){
      if(!/\.json$/i.test(f)) continue;
      const full = path.join(DIRS.scores, f);
      try {
        const s = JSON.parse(readText(full));
        const parts = partsOf(s), hands = Object.keys(parts);
        const noteCounts = {};
        for(const h of hands)
          noteCounts[h] = parts[h].reduce((n, m) => n + countNotes(m), 0);
        out.push({
          file: f,
          id: f.replace(/\.json$/i, ""),
          title: s.title || f.replace(/\.json$/i, ""),
          composer: s.composer || "",
          hands,
          noteCounts,
          measures: Math.max(0, ...hands.map(h => parts[h].length))
        });
      } catch(err){
        out.push({ file:f, id:f.replace(/\.json$/i,""), title:f, broken:true,
                   error:(err.message || String(err)) });
        logError("could not parse score " + f, err);
      }
    }
  } catch(e){ logError("scanning the scores folder failed", e); }
  out.sort((a,b) => a.title.localeCompare(b.title));
  return out;
});

ipcMain.handle("scores:read", (e, file) => {
  try {
    if(typeof file !== "string" || file.includes("..") || path.isAbsolute(file)) return null;
    return JSON.parse(readText(path.join(DIRS.scores, file)));
  } catch(err){ logError("reading score failed " + file, err); return null; }
});

/* 导入进来的谱子（MIDI 转换结果，或者直接拖进来的 .json）写进 scores 文件夹。
   文件名完全由主进程决定：界面只能给个建议名，里面的路径字符全部剔掉。 */
ipcMain.handle("scores:write", (e, name, obj) => {
  try {
    if(!obj || typeof obj !== "object" || Array.isArray(obj)) return { ok:false, code:"errNotScore" };
    if(!Object.keys(partsOf(obj)).length) return { ok:false, code:"errNoNotes" };

    const text = JSON.stringify(obj, null, 2);
    if(text.length > 8 * 1024 * 1024) return { ok:false, code:"errTooBig" };

    // 路径分隔符、Windows 保留字符、控制字符一律去掉，只留下一个干净的文件名
    let base = String(name || "")
      .replace(/[\\/:*?"<>|]/g, "")
      .replace(/[\u0000-\u001f\u007f]/g, "")
      .replace(/^[.\s]+|[.\s]+$/g, "");
    if(!base) base = "Imported";
    if(base.length > 60) base = base.slice(0, 60).trim();
    if(/^(con|prn|aux|nul|com\d|lpt\d)$/i.test(base)) base = "_" + base;   // Windows 保留文件名

    let file = base + ".json";
    for(let i = 2; fs.existsSync(path.join(DIRS.scores, file)) && i < 1000; i++)
      file = base + " (" + i + ").json";

    const full = path.join(DIRS.scores, file), tmp = full + ".tmp";
    fs.writeFileSync(tmp, text, "utf8");
    fs.renameSync(tmp, full);
    return { ok:true, file };
  } catch(err){
    logError("writing score failed " + name, err);
    return { ok:false, error: err.message || String(err) };
  }
});

ipcMain.handle("open:scores", async () => {
  try { await shell.openPath(DIRS.scores); return true; }
  catch(e){ logError("opening the scores folder failed", e); return false; }
});

ipcMain.handle("open:data", async () => {
  try { await shell.openPath(DIRS.data); return true; } catch(e){ return false; }
});

/* ===================== 启动 ===================== */
if(!app.requestSingleInstanceLock()){
  app.quit();                                    // 已经开着一个了，不要开第二个
} else {
  app.on("second-instance", () => {
    if(win){ if(win.isMinimized()) win.restore(); win.focus(); }
  });

  app.whenReady().then(() => {
    nativeTheme.themeSource = "light";   // 界面只有浅色一套，别让系统深色把滚动条之类染黑
    initDirs();
    // 让 preload 能同步拿到路径
    process.env.SR_DIR_DATA   = DIRS.data;
    process.env.SR_DIR_SCORES = DIRS.scores;
    process.env.SR_DIR_ROOT   = DIRS.root;
    createWindow();
    app.on("activate", () => { if(BrowserWindow.getAllWindows().length === 0) createWindow(); });
  });

  app.on("window-all-closed", () => app.quit());
  process.on("uncaughtException", (e) => logError("uncaught exception", e));
}
