"use strict";

/* preload 在页面脚本之前运行，而且能用 Node。
   这里同步把存档读出来挂到 window.srHost 上，界面那边就能像以前用
   localStorage 一样同步取值，不用把整个程序改成异步启动。        */

const { contextBridge, ipcRenderer } = require("electron");
const fs = require("fs");
const path = require("path");

const DATA   = process.env.SR_DIR_DATA   || "";
const SCORES = process.env.SR_DIR_SCORES || "";
const ROOT   = process.env.SR_DIR_ROOT   || "";

function stripBom(s){ return s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s; }

function loadSync(kind, fallback){
  try {
    const p = path.join(DATA, kind + ".json");
    if(!fs.existsSync(p)) return fallback;
    // 去掉 BOM：有些编辑器存 UTF-8 时会在开头加一个，JSON.parse 不认
    const v = JSON.parse(stripBom(fs.readFileSync(p, "utf8")));
    return (v && typeof v === "object") ? v : fallback;
  } catch(e){ return fallback; }
}

contextBridge.exposeInMainWorld("srHost", {
  desktop: true,
  dirs: { root: ROOT, data: DATA, scores: SCORES },

  // 启动时已经读好的存档，界面直接同步用
  initial: {
    settings:   loadSync("settings", {}),
    stats:      loadSync("stats", null),
    scorestats: loadSync("scorestats", {})
  },

  // 存档：发出去就不管了，主进程负责原子写盘
  save(kind, obj){ ipcRenderer.send("store:save", kind, obj); },

  listScores(){ return ipcRenderer.invoke("scores:list"); },
  readScore(file){ return ipcRenderer.invoke("scores:read", file); },
  // 导入：文件名最终由主进程清洗决定，这里给的只是建议
  saveScore(name, obj){ return ipcRenderer.invoke("scores:write", String(name || ""), obj); },
  openScoresFolder(){ return ipcRenderer.invoke("open:scores"); },
  openDataFolder(){ return ipcRenderer.invoke("open:data"); }
});
