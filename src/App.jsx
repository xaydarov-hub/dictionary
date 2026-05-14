// ════════════════════════════════════════════════════════════════
// KOREAN CENTER AI VOCABULARY — To'liq Yaxshilangan Versiya
// Yangiliklar:
//  • Login/Parol tizimi (ro'yxatdan o'tish + kirish)
//  • Reyting — hamma foydalanuvchilar, XP manbalari bilan
//  • Flash kartalar XP = 0
//  • Lug'atda so'zlarni TTS bilan o'qib berish
//  • Test xatolari tuzatildi
//  • Statistika batafsil
// ════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from "react";
// login
// ── REAL DATA IMPORT ─────────────────────────────────────────────
import data1A from "./data/1A";
import data1B from "./data/1B";
import data2A from "./data/2A";
import data2B from "./data/2B";
import data3A from "./data/3A";
import data3B from "./data/3B";

// ── BARCHA DATA ──────────────────────────────────────────────────
const ALL_DATA = {
  "1A": data1A,
  "1B": data1B,
  "2A": data2A,
  "2B": data2B,
  "3A": data3A,
  "3B": data3B,
};

// ── Fuzzy match ──────────────────────────────────────────────────
const fuzzyMatch = (a, b) => {
  const x = a.trim().toLowerCase();
  const y = b.trim().toLowerCase();

  if (x === y) return 100;
  if (!x || !y) return 0;

  let m = 0;

  const shorter = x.length < y.length ? x : y;
  const longer = x.length >= y.length ? x : y;

  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) m++;
  }

  return Math.round((m / longer.length) * 100);
};

// ── LocalStorage wrapper ─────────────────────────────────────────
const memStore = {};

const S = {
  get: (k, d = null) => {
    try {
      const v = localStorage.getItem(k);

      return v
        ? JSON.parse(v)
        : k in memStore
          ? memStore[k]
          : d;
    } catch {
      return k in memStore ? memStore[k] : d;
    }
  },

  set: (k, v) => {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch { }

    memStore[k] = v;
  },

  del: (k) => {
    try {
      localStorage.removeItem(k);
    } catch { }

    delete memStore[k];
  },
};

// ── Beep tovush ──────────────────────────────────────────────────
const beep = (t) => {
  try {
    const ctx = new (window.AudioContext ||
      window.webkitAudioContext)();

    const o = ctx.createOscillator();
    const g = ctx.createGain();

    o.connect(g);
    g.connect(ctx.destination);

    const now = ctx.currentTime;

    if (t === "ok") {
      o.frequency.setValueAtTime(523, now);
      o.frequency.setValueAtTime(784, now + 0.1);

      g.gain.setValueAtTime(0.3, now);
      g.gain.exponentialRampToValueAtTime(
        0.001,
        now + 0.4
      );

      o.start(now);
      o.stop(now + 0.4);
    } else {
      o.frequency.setValueAtTime(220, now);
      o.frequency.setValueAtTime(160, now + 0.15);

      g.gain.setValueAtTime(0.3, now);
      g.gain.exponentialRampToValueAtTime(
        0.001,
        now + 0.35
      );

      o.start(now);
      o.stop(now + 0.35);
    }
  } catch { }
};

// ── TTS — koreyscha o'qib berish ────────────────────────────────
const speak = (text, lang = "ko-KR") => {
  try {
    window.speechSynthesis?.cancel();

    const u = new SpeechSynthesisUtterance(text);

    u.lang = lang;
    u.rate = 0.85;
    u.pitch = 1;

    window.speechSynthesis?.speak(u);
  } catch { }
};

// ── CSS ──────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Noto+Sans+KR:wght@300;400;700&family=JetBrains+Mono:wght@400;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0f1419;--bg2:#1a1f26;--bg3:#252d35;
  --cyan:#00d9ff;--blue:#0099ff;--purple:#b344ff;--pink:#ff006e;
  --green:#00d26a;--red:#ff3838;--gold:#ffd60a;--orange:#ff8800;
  --text:#ffffff;--text2:#b0b8c1;
  --glass:rgba(255,255,255,0.05);--glass2:rgba(255,255,255,0.08);--glass3:rgba(255,255,255,0.12);
  --border:rgba(0,217,255,0.12);--border2:rgba(179,68,255,0.22);
  --glow-cyan:0 0 20px rgba(0,217,255,0.35),0 0 40px rgba(0,217,255,0.15);
  --glow-purple:0 0 20px rgba(179,68,255,0.35),0 0 40px rgba(179,68,255,0.15);
  --glow-green:0 0 18px rgba(0,210,106,0.4);
  --glow-red:0 0 18px rgba(255,56,56,0.4);
  --sidebar-w:220px;
}
html,body,#root{height:100%;min-height:100%}
body{
  background:linear-gradient(135deg,var(--bg) 0%,var(--bg2) 50%,var(--bg3) 100%);
  color:var(--text);
  font-family:-apple-system,BlinkMacSystemFont,'Noto Sans KR',sans-serif;
  overflow-x:hidden;min-height:100vh;
}

/* INTRO */
.intro-wrap{
  position:fixed;inset:0;background:linear-gradient(135deg,#000,#0a0f15);
  z-index:9999;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:20px;
  animation:introOut 0.5s 3.8s forwards;pointer-events:all;
}
.intro-logo{
  font-family:'Orbitron';font-size:clamp(28px,6vw,48px);font-weight:900;
  background:linear-gradient(135deg,var(--cyan),var(--purple),var(--pink));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;
  animation:logoFloat 1s ease-out;letter-spacing:4px;text-align:center;line-height:1.3;
}
.intro-sub{font-size:11px;letter-spacing:3px;color:var(--cyan);animation:fadeInUp 1s 0.3s ease-out backwards}
.intro-bar-wrap{width:min(400px,80vw);height:2px;background:rgba(255,255,255,0.1);overflow:hidden;animation:fadeInUp 1s 0.6s ease-out backwards}
.intro-bar{height:100%;background:linear-gradient(90deg,var(--cyan),var(--purple));animation:barFill 2s 0.8s ease-out forwards;width:0}
@keyframes logoFloat{from{opacity:0;transform:translateY(20px) scale(0.8)}to{opacity:1;transform:none}}
@keyframes fadeInUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes barFill{to{width:100%}}
@keyframes introOut{to{opacity:0;pointer-events:none;visibility:hidden}}

/* APP */
.app{display:flex;min-height:100vh;position:relative;z-index:1}

/* SIDEBAR */
.sidebar{
  position:fixed;top:0;left:0;width:var(--sidebar-w);height:100vh;
  background:rgba(15,20,25,0.97);border-right:1px solid var(--border);
  display:flex;flex-direction:column;z-index:200;padding:24px 0;
  backdrop-filter:blur(20px);transition:transform 0.3s cubic-bezier(0.4,0,0.2,1);
}
.sidebar-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:199;backdrop-filter:blur(4px)}
.sb-logo{padding:0 20px 24px;border-bottom:1px solid var(--border)}
.sb-logo-t{font-family:'Orbitron';font-size:13px;font-weight:700;background:linear-gradient(135deg,var(--cyan),var(--purple));-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:2px}
.sb-logo-s{color:var(--text2);font-size:10px;margin-top:2px;font-family:'JetBrains Mono'}
.nav-i{display:flex;align-items:center;gap:12px;padding:13px 20px;cursor:pointer;transition:all 0.25s;border-left:3px solid transparent;font-size:14px;color:var(--text2)}
.nav-i:hover{color:var(--text);background:var(--glass2);transform:translateX(4px)}
.nav-i.on{color:var(--cyan);border-left-color:var(--cyan);background:rgba(0,217,255,0.1)}
.nav-i .nic{font-size:18px;min-width:20px}
.sb-bot{margin-top:auto;padding:16px 20px;border-top:1px solid var(--border)}
.user-mini{display:flex;align-items:center;gap:10px;cursor:pointer;padding:10px;border-radius:12px;transition:all 0.25s;background:var(--glass)}
.user-mini:hover{background:var(--glass2);transform:translateY(-2px)}
.u-av{width:38px;height:38px;border-radius:50%;flex-shrink:0;background:linear-gradient(135deg,var(--cyan),var(--purple));display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;color:#000;box-shadow:var(--glow-cyan)}
.u-name{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.u-xp{font-size:11px;color:var(--cyan);font-family:'JetBrains Mono'}

/* MAIN */
.main{margin-left:var(--sidebar-w);min-height:100vh;padding:32px;flex:1;animation:mainIn 0.5s ease-out}
@keyframes mainIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:none}}

/* MOB */
.mob-topbar{display:none;position:sticky;top:0;z-index:150;background:rgba(15,20,25,0.97);border-bottom:1px solid var(--border);padding:0 16px;height:56px;align-items:center;justify-content:space-between;backdrop-filter:blur(20px)}
.mob-menu-btn{width:40px;height:40px;border-radius:10px;border:1px solid var(--border);background:var(--glass);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:20px;color:var(--text2);transition:all 0.2s}
.mob-logo{font-family:'Orbitron';font-size:14px;font-weight:700;background:linear-gradient(135deg,var(--cyan),var(--purple));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.mob-xp{font-size:12px;color:var(--gold);font-family:'JetBrains Mono'}
.mob-nav{display:none;position:sticky;bottom:0;z-index:150;background:rgba(15,20,25,0.98);border-top:1px solid var(--border);padding:6px 0 max(6px,env(safe-area-inset-bottom));backdrop-filter:blur(20px)}
.mob-nav-row{display:flex;justify-content:space-around}
.mob-ni{display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 10px;cursor:pointer;color:var(--text2);font-size:10px;transition:all 0.2s;min-width:48px}
.mob-ni.on{color:var(--cyan)}
.mob-ni .nic{font-size:22px}

/* TIPOGRAFIYA */
.ptitle{font-family:'Orbitron';font-size:clamp(24px,5vw,36px);font-weight:900;background:linear-gradient(135deg,var(--cyan),var(--purple));-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:8px;letter-spacing:2px;animation:titleIn 0.5s cubic-bezier(0.34,1.56,0.64,1)}
@keyframes titleIn{from{opacity:0;transform:translateY(-16px)}to{opacity:1;transform:none}}
.psub{color:var(--text2);font-size:14px;margin-bottom:28px;animation:fadeInUp 0.7s 0.15s ease-out backwards}

/* KARTALAR */
.gc{background:var(--glass);border:1px solid var(--border);border-radius:20px;padding:22px;transition:all 0.3s;position:relative;overflow:hidden;animation:cardIn 0.5s cubic-bezier(0.34,1.56,0.64,1) backwards}
.gc::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(0,217,255,0.08),transparent);opacity:0;transition:opacity 0.3s;pointer-events:none}
.gc:hover{border-color:rgba(0,217,255,0.28);box-shadow:var(--glow-cyan);transform:translateY(-3px)}
.gc:hover::before{opacity:1}
@keyframes cardIn{from{opacity:0;transform:scale(0.96) translateY(8px)}to{opacity:1;transform:none}}

.g3{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px}

.lc{background:var(--glass);border:1px solid var(--border);border-radius:22px;padding:24px;cursor:pointer;transition:all 0.35s cubic-bezier(0.34,1.56,0.64,1);text-align:center;position:relative;overflow:hidden;animation:cardIn 0.5s ease-out backwards}
.lc:hover{transform:translateY(-10px) scale(1.02);box-shadow:0 20px 50px rgba(0,217,255,0.25),var(--glow-cyan);border-color:var(--cyan)}
.lc-badge{font-family:'Orbitron';font-size:36px;font-weight:900;background:linear-gradient(135deg,var(--cyan),var(--purple));-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:10px}

.kc{background:var(--glass);border:1px solid var(--border);border-radius:14px;padding:16px 18px;cursor:pointer;transition:all 0.25s;display:flex;align-items:center;gap:14px;margin-bottom:8px;animation:cardIn 0.5s ease-out backwards}
.kc:hover{border-color:rgba(179,68,255,0.35);background:var(--glass2);transform:translateX(6px)}
.kc.sel{border-color:var(--cyan);background:rgba(0,217,255,0.09);box-shadow:var(--glow-cyan)}
.kc-num{width:42px;height:42px;border-radius:11px;flex-shrink:0;background:linear-gradient(135deg,rgba(0,217,255,0.1),rgba(179,68,255,0.1));border:1px solid rgba(0,217,255,0.18);display:flex;align-items:center;justify-content:center;font-family:'Orbitron';font-size:13px;color:var(--cyan);font-weight:700}

/* So'z kartasi */
.wc{background:var(--glass);border:1px solid var(--border);border-radius:14px;padding:18px;transition:all 0.25s;animation:cardIn 0.5s ease-out backwards;position:relative}
.wc:hover{border-color:rgba(179,68,255,0.28);box-shadow:var(--glow-purple);transform:translateY(-3px)}
.wc-kr{font-size:28px;font-weight:700;color:var(--cyan);margin-bottom:5px;cursor:pointer;display:flex;align-items:center;gap:8px}
.wc-kr:hover{opacity:0.8}
.wc-uz{font-size:15px;color:var(--text)}
.tts-btn{background:none;border:none;cursor:pointer;font-size:20px;padding:2px 4px;opacity:0.7;transition:opacity 0.2s}
.tts-btn:hover{opacity:1}

.sc{background:var(--glass);border:1px solid var(--border);border-radius:18px;padding:20px;display:flex;flex-direction:column;gap:8px;animation:cardIn 0.5s ease-out backwards}
.sc-lbl{color:var(--text2);font-size:11px;text-transform:uppercase;letter-spacing:2px;font-weight:600}
.sc-val{font-family:'Orbitron';font-size:28px;font-weight:900;background:linear-gradient(135deg,var(--cyan),var(--purple));-webkit-background-clip:text;-webkit-text-fill-color:transparent}

/* TUGMALAR */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:12px 24px;border-radius:13px;border:none;cursor:pointer;font-family:-apple-system,'Noto Sans KR',sans-serif;font-size:14px;font-weight:600;transition:all 0.25s;position:relative;overflow:hidden;animation:cardIn 0.5s ease-out backwards;white-space:nowrap}
.btn::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,0.18),transparent);opacity:0;transition:opacity 0.25s;pointer-events:none}
.btn:hover::before{opacity:1}
.btn:active{transform:scale(0.95)}
.btn:disabled{opacity:0.4;cursor:not-allowed;transform:none!important}
.bp{background:linear-gradient(135deg,var(--cyan),var(--blue));color:#000;font-weight:700;box-shadow:0 6px 20px rgba(0,217,255,0.28)}
.bp:hover:not(:disabled){box-shadow:0 10px 30px rgba(0,217,255,0.45);transform:translateY(-2px)}
.bs{background:var(--glass2);border:1px solid var(--border);color:var(--text)}
.bs:hover:not(:disabled){border-color:var(--cyan);color:var(--cyan)}
.bd{background:rgba(255,56,56,0.13);border:1px solid rgba(255,56,56,0.28);color:var(--red)}
.bg{background:linear-gradient(135deg,var(--green),#00a84a);color:#000;font-weight:700;box-shadow:0 6px 20px rgba(0,210,106,0.28)}
.bg:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 10px 30px rgba(0,210,106,0.4)}
.bpurp{background:linear-gradient(135deg,var(--purple),var(--pink));color:#fff;font-weight:700;box-shadow:0 6px 20px rgba(179,68,255,0.28)}
.bpurp:hover:not(:disabled){box-shadow:0 10px 30px rgba(179,68,255,0.45);transform:translateY(-2px)}
.bgold{background:linear-gradient(135deg,var(--gold),var(--orange));color:#000;font-weight:700}

/* INPUT */
.inp{width:100%;background:var(--glass);border:1px solid var(--border);border-radius:13px;padding:14px 18px;color:var(--text);font-family:-apple-system,'Noto Sans KR',sans-serif;font-size:16px;outline:none;transition:all 0.25s}
.inp:focus{border-color:var(--cyan);box-shadow:0 0 0 3px rgba(0,217,255,0.1);transform:translateY(-2px)}
.inp::placeholder{color:var(--text2)}
.inp.ok{border-color:var(--green);box-shadow:var(--glow-green)}
.inp.err{border-color:var(--red);box-shadow:var(--glow-red);animation:shake 0.4s}
@keyframes shake{0%,100%{transform:translateX(0)}15%,45%,75%{transform:translateX(-7px)}30%,60%,90%{transform:translateX(7px)}}

/* MODAL */
.ov{position:fixed;inset:0;background:rgba(0,0,0,0.72);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(10px);animation:ovIn 0.25s}
@keyframes ovIn{from{opacity:0}to{opacity:1}}
.modal{background:linear-gradient(135deg,var(--bg2),var(--bg3));border:1px solid var(--border2);border-radius:26px;padding:28px;width:100%;max-width:440px;box-shadow:0 40px 80px rgba(0,0,0,0.5),var(--glow-purple);animation:modalPop 0.35s cubic-bezier(0.34,1.56,0.64,1)}
@keyframes modalPop{from{opacity:0;transform:scale(0.9) translateY(20px)}to{opacity:1;transform:none}}

/* TEST */
.qcard{background:var(--glass);border:2px solid var(--border);border-radius:22px;padding:28px;text-align:center;margin-bottom:20px;transition:border-color 0.2s,box-shadow 0.2s;animation:cardIn 0.5s ease-out}
.qcard.ok{border-color:var(--green);background:rgba(0,210,106,0.04);box-shadow:var(--glow-green)}
.qcard.err{border-color:var(--red);background:rgba(255,56,56,0.04);box-shadow:var(--glow-red)}

.tmr-bg{height:4px;background:rgba(255,255,255,0.06);border-radius:2px;overflow:hidden;margin-bottom:18px}
.tmr-fill{height:100%;background:linear-gradient(90deg,var(--cyan),var(--purple));transition:width 1s linear;box-shadow:0 0 8px var(--cyan)}
.tmr-fill.hot{background:linear-gradient(90deg,var(--red),var(--orange));box-shadow:0 0 12px var(--red)}

.mic-btn{width:130px;height:130px;border-radius:50%;background:radial-gradient(circle,rgba(0,217,255,0.08),transparent);border:2px solid var(--cyan);display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative;transition:all 0.25s;font-size:44px;box-shadow:inset 0 0 18px rgba(0,217,255,0.08)}
.mic-btn:hover{transform:scale(1.05);box-shadow:var(--glow-cyan)}
.mic-btn.listening{border-color:var(--red);animation:micPulse 1s infinite;box-shadow:0 0 28px rgba(255,56,56,0.45)}
@keyframes micPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
.mic-ring{position:absolute;inset:-12px;border:1px solid rgba(0,217,255,0.25);border-radius:50%;animation:ringEx 2s infinite}
.mic-ring2{position:absolute;inset:-24px;border:1px solid rgba(0,217,255,0.12);border-radius:50%;animation:ringEx 2s 0.5s infinite}
@keyframes ringEx{0%{opacity:1;transform:scale(0.8)}100%{opacity:0;transform:scale(1.35)}}

.res-score{font-family:'Orbitron';font-size:clamp(56px,12vw,80px);font-weight:900;background:linear-gradient(135deg,var(--cyan),var(--purple));-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:scorePop 0.7s cubic-bezier(0.34,1.56,0.64,1)}
@keyframes scorePop{from{opacity:0;transform:scale(0.5)}to{opacity:1;transform:none}}

/* REYTING */
.rk-item{display:flex;align-items:center;gap:14px;padding:16px 18px;border-radius:14px;background:var(--glass);border:1px solid var(--border);margin-bottom:8px;transition:all 0.25s;animation:cardIn 0.5s ease-out backwards;cursor:pointer}
.rk-item:hover{border-color:rgba(0,217,255,0.28);transform:translateX(6px) scale(1.01)}
.rk-item.me{border-color:rgba(0,217,255,0.45);background:rgba(0,217,255,0.09);box-shadow:var(--glow-cyan)}
.rk-num{font-family:'Orbitron';font-size:18px;font-weight:900;min-width:38px;text-align:center}
.rk-av{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:17px;color:#000;flex-shrink:0}
.rk-xp{font-family:'Orbitron';font-size:17px;font-weight:700;color:var(--gold)}

/* XP popup */
.xp-popup-wrap{position:relative;height:0;overflow:visible;pointer-events:none}
.xp-popup{position:absolute;pointer-events:none;font-family:'Orbitron';font-size:18px;font-weight:900;color:var(--gold);text-shadow:0 0 16px var(--gold);animation:xpFloat 1.5s ease-out forwards;white-space:nowrap}
@keyframes xpFloat{0%{opacity:0;transform:translateY(0) scale(0.6)}20%{opacity:1;transform:translateY(-10px) scale(1)}80%{opacity:1;transform:translateY(-55px)}100%{opacity:0;transform:translateY(-90px) scale(0.7)}}

/* NOTIF */
.notif-container{position:fixed;top:20px;right:20px;z-index:9000;display:flex;flex-direction:column;gap:10px;pointer-events:none}
.notif{background:linear-gradient(135deg,var(--bg2),var(--bg3));border:1px solid var(--border2);border-radius:14px;padding:14px 18px;min-width:260px;max-width:320px;box-shadow:var(--glow-purple);animation:notifIn 0.35s ease-out,notifOut 0.35s 3s forwards;display:flex;align-items:center;gap:10px;pointer-events:all}
@keyframes notifIn{from{opacity:0;transform:translateX(80px)}to{opacity:1;transform:none}}
@keyframes notifOut{to{opacity:0;transform:translateX(80px)}}

/* BADGE */
.bdg{display:inline-flex;align-items:center;gap:5px;padding:7px 13px;border-radius:18px;font-size:12px;font-weight:700;border:1px solid;animation:cardIn 0.5s ease-out backwards}
.bdg-c{background:rgba(0,217,255,0.09);border-color:rgba(0,217,255,0.28);color:var(--cyan)}
.bdg-g{background:rgba(0,210,106,0.09);border-color:rgba(0,210,106,0.28);color:var(--green)}
.bdg-p{background:rgba(179,68,255,0.09);border-color:rgba(179,68,255,0.28);color:var(--purple)}
.bdg-r{background:rgba(255,56,56,0.09);border-color:rgba(255,56,56,0.28);color:var(--red)}
.bdg-gold{background:rgba(255,214,10,0.09);border-color:rgba(255,214,10,0.28);color:var(--gold)}

.back{display:inline-flex;align-items:center;gap:7px;color:var(--text2);cursor:pointer;font-size:14px;margin-bottom:22px;transition:all 0.2s}
.back:hover{color:var(--cyan);transform:translateX(-4px)}

/* TEST mode cards */
.test-mode-card{background:var(--glass);border:2px solid var(--border);border-radius:20px;padding:22px;cursor:pointer;transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1);text-align:center;position:relative;overflow:hidden;animation:cardIn 0.5s ease-out backwards}
.test-mode-card:hover{transform:translateY(-8px) scale(1.02);border-color:var(--cyan);box-shadow:var(--glow-cyan)}
.test-mode-card.active{border-color:var(--cyan);background:rgba(0,217,255,0.09);box-shadow:var(--glow-cyan)}
.test-mode-card.active-purple{border-color:var(--purple);background:rgba(179,68,255,0.09);box-shadow:var(--glow-purple)}
.test-mode-card.active-green{border-color:var(--green);background:rgba(0,210,106,0.09);box-shadow:var(--glow-green)}
.test-mode-card.active-gold{border-color:var(--gold);background:rgba(255,214,10,0.09);box-shadow:0 0 18px rgba(255,214,10,0.3)}
.test-mode-icon{font-size:38px;margin-bottom:12px}
.test-mode-title{font-family:'Orbitron';font-size:14px;font-weight:700;color:var(--text);margin-bottom:6px;letter-spacing:1px}
.test-mode-desc{font-size:12px;color:var(--text2);line-height:1.5}

/* Multiple choice */
.mc-opt{background:var(--glass);border:2px solid var(--border);border-radius:14px;padding:16px 20px;cursor:pointer;transition:all 0.25s;display:flex;align-items:center;gap:14px;animation:cardIn 0.4s ease-out backwards;font-size:18px;font-weight:600}
.mc-opt:hover:not(.disabled){border-color:rgba(0,217,255,0.4);background:var(--glass2);transform:translateX(8px)}
.mc-opt.correct{border-color:var(--green);background:rgba(0,210,106,0.12);box-shadow:var(--glow-green);transform:none}
.mc-opt.wrong{border-color:var(--red);background:rgba(255,56,56,0.12);box-shadow:var(--glow-red)}
.mc-opt.disabled{cursor:default;opacity:0.55}
.mc-num{width:36px;height:36px;border-radius:10px;flex-shrink:0;background:linear-gradient(135deg,rgba(0,217,255,0.15),rgba(179,68,255,0.15));border:1px solid rgba(0,217,255,0.2);display:flex;align-items:center;justify-content:center;font-family:'Orbitron';font-size:12px;color:var(--cyan);font-weight:700}

/* Flash */
.flash-card{background:linear-gradient(135deg,var(--bg2),var(--bg3));border:2px solid var(--border);border-radius:24px;padding:40px 32px;text-align:center;cursor:pointer;min-height:220px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;transition:all 0.35s cubic-bezier(0.34,1.56,0.64,1);position:relative;overflow:hidden;animation:cardIn 0.5s ease-out}
.flash-card:hover{border-color:var(--cyan);box-shadow:var(--glow-cyan);transform:translateY(-4px)}
.flash-hint{font-size:11px;color:var(--text2);letter-spacing:2px;text-transform:uppercase}

/* Matching */
.match-col{display:flex;flex-direction:column;gap:10px}
.match-item{padding:14px 18px;border-radius:13px;cursor:pointer;border:2px solid var(--border);background:var(--glass);font-size:15px;font-weight:600;text-align:center;transition:all 0.25s;min-height:56px;display:flex;align-items:center;justify-content:center;animation:cardIn 0.4s ease-out backwards}
.match-item:hover:not(.matched):not(.disabled){border-color:var(--cyan);background:var(--glass2);transform:scale(1.03)}
.match-item.selected{border-color:var(--purple);background:rgba(179,68,255,0.12);box-shadow:var(--glow-purple);transform:scale(1.03)}
.match-item.matched{border-color:var(--green);background:rgba(0,210,106,0.1);cursor:default;opacity:0.6}
.match-item.wrong-flash{border-color:var(--red);background:rgba(255,56,56,0.12);animation:shake 0.4s}
.match-item.disabled{cursor:default}

/* Progress dots */
.prog-dots{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px}
.prog-dot{width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,0.12);transition:all 0.3s;flex-shrink:0}
.prog-dot.done-ok{background:var(--green);box-shadow:0 0 6px var(--green)}
.prog-dot.done-err{background:var(--red);box-shadow:0 0 6px var(--red)}
.prog-dot.current{background:var(--cyan);box-shadow:0 0 8px var(--cyan);transform:scale(1.3)}

.streak-fire{font-family:'Orbitron';font-size:15px;font-weight:700;color:var(--orange);display:flex;align-items:center;gap:5px}

/* AUTH */
.auth-tabs{display:flex;gap:0;border-radius:14px;overflow:hidden;border:1px solid var(--border);margin-bottom:24px}
.auth-tab{flex:1;padding:12px;text-align:center;cursor:pointer;font-weight:600;font-size:14px;transition:all 0.2s;color:var(--text2)}
.auth-tab.on{background:linear-gradient(135deg,var(--cyan),var(--blue));color:#000}

/* Reyting detail */
.rk-detail-row{display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:8px;background:var(--glass);margin-bottom:4px;font-size:12px}
.rk-source-badge{padding:3px 8px;border-radius:6px;font-size:10px;font-weight:700;font-family:'JetBrains Mono'}

/* UTILITIES */
.f{display:flex}.fc{flex-direction:column}.fw{flex-wrap:wrap}
.ic{align-items:center}.jb{justify-content:space-between}.jc{justify-content:center}
.f1{flex:1;min-width:0}.w100{width:100%}.tc{text-align:center}
.mb8{margin-bottom:8px}.mb12{margin-bottom:12px}.mb16{margin-bottom:16px}
.mb20{margin-bottom:20px}.mb22{margin-bottom:22px}.mb24{margin-bottom:24px}
.mt8{margin-top:8px}.mt12{margin-top:12px}.mt16{margin-top:16px}.mt24{margin-top:24px}
.gap8{gap:8px}.gap10{gap:10px}.gap12{gap:12px}.gap14{gap:14px}.gap16{gap:16px}.gap18{gap:18px}.gap20{gap:20px}.gap24{gap:24px}
.sm{font-size:12px}.muted{color:var(--text2)}.fw7{font-weight:700}
.sep{height:1px;background:var(--border);margin:20px 0}

@media(max-width:768px){
  :root{--sidebar-w:0px}
  .sidebar{transform:translateX(-100%);width:260px}
  .sidebar.open{transform:none}
  .sidebar-overlay.open{display:block}
  .main{margin-left:0;padding:16px 14px 80px;animation:none}
  .mob-topbar{display:flex}
  .mob-nav{display:block}
  .g3{grid-template-columns:repeat(auto-fill,minmax(140px,1fr))}
  .ptitle{font-size:28px}
  .notif-container{top:auto;bottom:90px;right:12px;left:12px}
  .notif{min-width:0;width:100%;max-width:100%}
  .gc{padding:16px}
  .modal{padding:20px}
}
@media(min-width:769px){
  .mob-topbar{display:none}
  .mob-nav{display:none}
}
`;
// REYTING
// ════════════════════════════════════════
// KICHIK KOMPONENTLAR
// ════════════════════════════════════════

function PR({ pct = 0, sz = 80 }) {
  const r = (sz - 6) / 2, c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: sz, height: sz }}>
      <svg width={sz} height={sz} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={sz / 2} cy={sz / 2} r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="6" />
        <circle cx={sz / 2} cy={sz / 2} r={r} fill="none" stroke="var(--cyan)" strokeWidth="6"
          strokeDasharray={`${(pct / 100) * c} ${c}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray .8s ease-out" }} />
      </svg>
      <span style={{ position: "absolute", fontFamily: "'Orbitron'", fontSize: sz * 0.2, fontWeight: 700, color: "var(--cyan)" }}>{pct}%</span>
    </div>
  );
}

function XPPop({ amt, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 1600); return () => clearTimeout(t); }, []);
  return (
    <div className="xp-popup-wrap">
      <div className="xp-popup" style={{ left: "50%", transform: "translateX(-50%)" }}>+{amt} XP</div>
    </div>
  );
}

function Notif({ ic, tx, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, []);
  return (
    <div className="notif">
      <span style={{ fontSize: 22 }}>{ic}</span>
      <span style={{ fontSize: 13, fontWeight: 600 }}>{tx}</span>
    </div>
  );
}

// ════════════════════════════════════════
// AUTH SAHIFASI — Login / Ro'yxat
// ════════════════════════════════════════
function AuthPage({ onLogin }) {

  const [tab, setTab] = useState("login");

  const [name, setName] = useState("");

  const [user, setUser] = useState("");

  const [pass, setPass] = useState("");

  const [pass2, setPass2] = useState("");

  const [err, setErr] = useState("");

  const [loading, setLoading] = useState(false);

  // LOGIN
  const doLogin = async () => {

    try {

      setLoading(true);
      setErr("");

      if (!user.trim() || !pass.trim()) {

        setErr("Login va parolni kiriting");

        return;
      }

      const login = user.trim().toLowerCase();

      const ref = doc(db, "users", login);

      const snap = await getDoc(ref);

      if (!snap.exists()) {

        setErr("Foydalanuvchi topilmadi");

        return;
      }

      const u = snap.data();

      if (u.pass !== pass) {

        setErr("Parol noto'g'ri");

        return;
      }

      S.set("kc_logged_user", u);

      onLogin(u);

    } catch (e) {

      console.log(e);

      setErr("Server xatosi");

    } finally {

      setLoading(false);

    }

  };

  // REGISTER
  const doRegister = async () => {

    try {

      setLoading(true);
      setErr("");

      if (
        !name.trim() ||
        !user.trim() ||
        !pass.trim()
      ) {

        setErr(
          "Barcha maydonlarni to'ldiring"
        );

        return;
      }

      if (pass.length < 4) {

        setErr(
          "Parol kamida 4 ta belgi bo'lishi kerak"
        );

        return;
      }

      if (pass !== pass2) {

        setErr(
          "Parollar mos kelmadi"
        );

        return;
      }

      const login =
        user.trim().toLowerCase();

      const ref = doc(
        db,
        "users",
        login
      );

      const exist = await getDoc(ref);

      if (exist.exists()) {

        setErr(
          "Bu login band"
        );

        return;
      }

      const newUser = {

        id: login,

        name: name.trim(),

        login,

        pass,

        xp: 0,

        testsCompleted: 0,

        correctAnswers: 0,

        totalAnswers: 0,

        completedWords: 0,

        history: [],

        createdAt: Date.now(),

      };

      await setDoc(ref, newUser);

      S.set(
        "kc_logged_user",
        newUser
      );

      onLogin(newUser);

    } catch (e) {

      console.log(e);

      setErr(
        "Ro'yxatdan o'tishda xato"
      );

    } finally {

      setLoading(false);

    }

  };

  return (

    <div className="ov">

      <div
        className="modal"
        style={{
          maxWidth: 430,
          overflow: "hidden",
          position: "relative"
        }}
      >

        {/* BG EFFECT */}
        <div
          style={{
            position: "absolute",
            inset: -100,
            background:
              "radial-gradient(circle at top left, rgba(0,255,255,0.12), transparent 40%), radial-gradient(circle at bottom right, rgba(168,85,247,0.14), transparent 40%)",
            pointerEvents: "none"
          }}
        />

        <div style={{ position: "relative", zIndex: 2 }}>

          {/* HEADER */}
          <div className="tc mb20">

            <div
              style={{
                fontSize: 58,
                marginBottom: 10,
                filter:
                  "drop-shadow(0 0 20px rgba(0,255,255,.5))"
              }}
            >
              🇰🇷
            </div>

            <div
              style={{
                fontFamily: "'Orbitron'",
                fontSize: 28,
                fontWeight: 900,
                letterSpacing: 1,
                background:
                  "linear-gradient(135deg,var(--cyan),var(--purple))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}
            >
              Korean Center
            </div>

            <div className="muted sm mt8">
              Premium AI Vocabulary Platform
            </div>

          </div>

          {/* TABS */}
          <div className="auth-tabs">

            <div
              className={`auth-tab ${tab === "login"
                  ? " on"
                  : ""
                }`}
              onClick={() => {

                setTab("login");
                setErr("");

              }}
            >
              🔑 Kirish
            </div>

            <div
              className={`auth-tab ${tab === "register"
                  ? " on"
                  : ""
                }`}
              onClick={() => {

                setTab("register");
                setErr("");

              }}
            >
              ✨ Registratsiya
            </div>

          </div>

          {/* FORM */}
          <div className="f fc gap12">

            {tab === "register" && (

              <input
                className="inp"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                placeholder="To'liq ism"
              />

            )}

            <input
              className="inp"
              value={user}
              onChange={(e) =>
                setUser(e.target.value)
              }
              placeholder="Login"
              onKeyDown={(e) => {

                if (
                  e.key === "Enter" &&
                  tab === "login"
                ) {

                  doLogin();

                }

              }}
            />

            <input
              className="inp"
              type="password"
              value={pass}
              onChange={(e) =>
                setPass(e.target.value)
              }
              placeholder="Parol"
              onKeyDown={(e) => {

                if (
                  e.key === "Enter" &&
                  tab === "login"
                ) {

                  doLogin();

                }

              }}
            />

            {tab === "register" && (

              <input
                className="inp"
                type="password"
                value={pass2}
                onChange={(e) =>
                  setPass2(e.target.value)
                }
                placeholder="Parolni tasdiqlang"
                onKeyDown={(e) => {

                  if (
                    e.key === "Enter"
                  ) {

                    doRegister();

                  }

                }}
              />

            )}

            {/* ERROR */}
            {err && (

              <div
                style={{
                  color: "var(--red)",
                  fontSize: 13,
                  fontWeight: 700,
                  padding: "12px 14px",
                  background:
                    "rgba(255,56,56,0.08)",
                  borderRadius: 14,
                  border:
                    "1px solid rgba(255,56,56,.25)",
                  animation:
                    "shake .25s linear"
                }}
              >
                ⚠️ {err}
              </div>

            )}

            {/* BUTTON */}
            <button
              className="btn bp w100"
              style={{
                padding: 16,
                fontSize: 15,
                marginTop: 6,
                position: "relative",
                overflow: "hidden"
              }}
              disabled={loading}
              onClick={
                tab === "login"
                  ? doLogin
                  : doRegister
              }
            >

              {loading ? (

                "Yuklanmoqda..."

              ) : tab === "login" ? (

                "→ Kirish"

              ) : (

                "✨ Ro'yxatdan o'tish"

              )}

            </button>

          </div>

        </div>

      </div>

    </div>

  );

}
import {
  doc,
  setDoc,
  getDoc
} from "firebase/firestore";

import { db } from "./firebase";
// ════════════════════════════════════════
// TEST KOMPONENTLARI
// ════════════════════════════════════════

// ── Yozma test ───────────────────────────────────────
function WrittenTest({ words, onFinish, onXP }) {
  const [idx, setIdx] = useState(0);
  const [inp, setInp] = useState("");
  const [sts, setSts] = useState(null);
  const [tmr, setTmr] = useState(30);
  const [results, setResults] = useState([]);
  const [xpPops, setXpPops] = useState([]);
  const [streak, setStreak] = useState(0);
  const [progDots, setProgDots] = useState(words.map(() => "pending"));
  const inpRef = useRef();
  const tmrRef = useRef();
  const stsRef = useRef(null);
  const xpEarned = useRef(0);
  const score = useRef(0);

  useEffect(() => {
    if (sts !== null) return;
    clearInterval(tmrRef.current);
    setTmr(30);
    tmrRef.current = setInterval(() => {
      setTmr(t => {
        if (t <= 1) { clearInterval(tmrRef.current); if (stsRef.current === null) submit("", true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(tmrRef.current);
  }, [idx, sts]);

  const submit = useCallback((answer) => {
    clearInterval(tmrRef.current);
    if (stsRef.current !== null) return;
    const w = words[idx];
    const m = fuzzyMatch(answer, w.kr);
    const ok = m >= 78;
    const xp = ok ? 10 : 0;
    stsRef.current = ok ? "ok" : "err";
    setSts(ok ? "ok" : "err");
    setProgDots(d => { const nd = [...d]; nd[idx] = ok ? "done-ok" : "done-err"; return nd; });
    const newRes = [...results, { w, a: answer, ok, m }];
    setResults(newRes);
    if (ok) {
      score.current++; xpEarned.current += xp; setStreak(s => s + 1); beep("ok"); onXP(xp, "written", w);
      const pid = Date.now();
      setXpPops(p => [...p, { id: pid, amt: xp }]);
      setTimeout(() => setXpPops(p => p.filter(x => x.id !== pid)), 1700);
    } else { setStreak(0); beep("fail"); }
    setTimeout(() => {
      const next = idx + 1;
      if (next >= words.length) { onFinish({ results: newRes, score: score.current, xp: xpEarned.current }); return; }
      stsRef.current = null; setSts(null); setInp(""); setTmr(30); setIdx(next);
      setTimeout(() => inpRef.current?.focus(), 60);
    }, 1200);
  }, [idx, words, results, onFinish, onXP]);

  const w = words[idx]; const hot = tmr <= 5;
  return (
    <div>
      {xpPops.map(p => <XPPop key={p.id} amt={p.amt} onDone={() => setXpPops(v => v.filter(x => x.id !== p.id))} />)}
      <div className="f ic jb mb16">
        <div className="prog-dots">{progDots.map((d, i) => <div key={i} className={`prog-dot${d === "pending" ? (i === idx ? " current" : "") : " " + d}`} />)}</div>
        <div className="streak-fire">🔥 {streak}</div>
      </div>
      <div className="f ic jb mb10">
        <span className="muted sm">{idx + 1} / {words.length}</span>
        <span className="fw7" style={{ color: hot ? "var(--red)" : "var(--cyan)", fontSize: 17, fontFamily: "'JetBrains Mono'" }}>{tmr}s</span>
      </div>
      <div className="tmr-bg"><div className={`tmr-fill${hot ? " hot" : ""}`} style={{ width: (tmr / 30) * 100 + "%" }} /></div>
      <div className={`qcard${sts === "ok" ? " ok" : sts === "err" ? " err" : ""}`}>
        <div className="muted sm mb10">Koreyschasini yozing:</div>
        <div style={{ fontSize: 38, fontWeight: 700, color: "var(--cyan)", margin: "14px 0" }}>{w.uz}</div>
        {sts === "ok" && <div style={{ color: "var(--green)", fontWeight: 700, marginTop: 10, fontSize: 22 }}>✅ {w.kr}</div>}
        {sts === "err" && <div style={{ marginTop: 10 }}><div style={{ color: "var(--red)", fontWeight: 600 }}>❌ Xato</div><div style={{ color: "var(--cyan)", fontSize: 24, fontWeight: 700, marginTop: 6 }}>{w.kr}</div></div>}
      </div>
      <input ref={inpRef} className={`inp mb14${sts === "ok" ? " ok" : sts === "err" ? " err" : ""}`}
        value={inp} onChange={e => setInp(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" && !sts && inp.trim()) submit(inp); }}
        placeholder="한국어로 쓰세요..." disabled={sts !== null}
        autoComplete="off" autoCapitalize="off" spellCheck={false}
        style={{ fontSize: 20, textAlign: "center", marginTop: 14 }} />
      <button className="btn bp w100" style={{ padding: 15, fontSize: 15 }}
        disabled={sts !== null || !inp.trim()} onClick={() => submit(inp)}>Tekshirish ✓</button>
    </div>
  );
}

// ── Ikki tomonlama test ───────────────────────────────
function BidirectionalTest({ words, onFinish, onXP }) {
  const [questions] = useState(() => {
    const q = [];
    words.forEach(w => { q.push({ w, dir: "uz2kr" }); q.push({ w, dir: "kr2uz" }); });
    return q.sort(() => Math.random() - 0.5).slice(0, Math.min(words.length * 2, 30));
  });
  const [idx, setIdx] = useState(0);
  const [inp, setInp] = useState("");
  const [sts, setSts] = useState(null);
  const [results, setResults] = useState([]);
  const [xpPops, setXpPops] = useState([]);
  const [streak, setStreak] = useState(0);
  const [progDots, setProgDots] = useState(() => questions.map(() => "pending"));
  const inpRef = useRef();
  const stsRef = useRef(null);
  const xpEarned = useRef(0);
  const score = useRef(0);

  const submit = useCallback((answer) => {
    if (stsRef.current !== null) return;
    const { w, dir } = questions[idx];
    const correct = dir === "uz2kr" ? w.kr : w.uz;
    const m = fuzzyMatch(answer, correct);
    const ok = m >= 75;
    const xp = ok ? 12 : 0;
    stsRef.current = ok ? "ok" : "err";
    setSts(ok ? "ok" : "err");
    setProgDots(d => { const nd = [...d]; nd[idx] = ok ? "done-ok" : "done-err"; return nd; });
    const newRes = [...results, { w, dir, a: answer, ok, m }];
    setResults(newRes);
    if (ok) {
      score.current++; xpEarned.current += xp; setStreak(s => s + 1); beep("ok"); onXP(xp, "bidirectional", w);
      const pid = Date.now();
      setXpPops(p => [...p, { id: pid, amt: xp }]);
      setTimeout(() => setXpPops(p => p.filter(x => x.id !== pid)), 1700);
    } else { setStreak(0); beep("fail"); }
    setTimeout(() => {
      const next = idx + 1;
      if (next >= questions.length) { onFinish({ results: newRes, score: score.current, xp: xpEarned.current }); return; }
      stsRef.current = null; setSts(null); setInp(""); setIdx(next);
      setTimeout(() => inpRef.current?.focus(), 60);
    }, 1300);
  }, [idx, questions, results, onFinish, onXP]);

  const { w, dir } = questions[idx];
  const question = dir === "uz2kr" ? w.uz : w.kr;
  const answer = dir === "uz2kr" ? w.kr : w.uz;
  const placeholder = dir === "uz2kr" ? "한국어로 쓰세요..." : "O'zbekcha yozing...";
  const label = dir === "uz2kr" ? "🇰🇷 Koreyschasini yozing:" : "🇺🇿 O'zbekcha tarjimasi:";

  return (
    <div>
      {xpPops.map(p => <XPPop key={p.id} amt={p.amt} onDone={() => setXpPops(v => v.filter(x => x.id !== p.id))} />)}
      <div className="f ic jb mb16">
        <div className="prog-dots">{progDots.map((d, i) => <div key={i} className={`prog-dot${d === "pending" ? (i === idx ? " current" : "") : " " + d}`} />)}</div>
        <div className="streak-fire">🔥 {streak}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span className="muted sm">{idx + 1} / {questions.length}</span>
        <span className="bdg" style={{ background: dir === "uz2kr" ? "rgba(0,217,255,0.09)" : "rgba(179,68,255,0.09)", borderColor: dir === "uz2kr" ? "rgba(0,217,255,0.28)" : "rgba(179,68,255,0.28)", color: dir === "uz2kr" ? "var(--cyan)" : "var(--purple)", fontSize: 11 }}>
          {dir === "uz2kr" ? "🇺🇿→🇰🇷" : "🇰🇷→🇺🇿"}
        </span>
      </div>
      <div className={`qcard${sts === "ok" ? " ok" : sts === "err" ? " err" : ""}`}>
        <div className="muted sm mb10">{label}</div>
        <div style={{ fontSize: 34, fontWeight: 700, color: "var(--cyan)", margin: "14px 0" }}>{question}</div>
        {sts === "ok" && <div style={{ color: "var(--green)", fontWeight: 700, marginTop: 10, fontSize: 20 }}>✅ {answer}</div>}
        {sts === "err" && <div style={{ marginTop: 10 }}><div style={{ color: "var(--red)", fontWeight: 600 }}>❌ Xato</div><div style={{ color: "var(--cyan)", fontSize: 22, fontWeight: 700, marginTop: 6 }}>{answer}</div></div>}
      </div>
      <input ref={inpRef} className={`inp mb14${sts === "ok" ? " ok" : sts === "err" ? " err" : ""}`}
        value={inp} onChange={e => setInp(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" && !sts && inp.trim()) submit(inp); }}
        placeholder={placeholder} disabled={sts !== null}
        autoComplete="off" autoCapitalize="off" spellCheck={false}
        style={{ fontSize: 20, textAlign: "center", marginTop: 14 }} />
      <button className="btn bpurp w100" style={{ padding: 15, fontSize: 15 }}
        disabled={sts !== null || !inp.trim()} onClick={() => submit(inp)}>Tekshirish ✓</button>
    </div>
  );
}

// ── Ko'p tanlovli ────────────────────────────────────
function MultipleChoiceTest({ words, allWords, onFinish, onXP }) {
  const [questions] = useState(() =>
    words.map(w => {
      const pool = allWords.filter(x => x.id !== w.id).sort(() => Math.random() - 0.5).slice(0, 3);
      const opts = [...pool, w].sort(() => Math.random() - 0.5);
      return { w, opts };
    })
  );
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState(null);
  const [results, setResults] = useState([]);
  const [xpPops, setXpPops] = useState([]);
  const [streak, setStreak] = useState(0);
  const [progDots, setProgDots] = useState(words.map(() => "pending"));
  const xpEarned = useRef(0);
  const score = useRef(0);

  const choose = useCallback((opt) => {
    if (chosen !== null) return;
    const { w } = questions[idx];
    const ok = opt.id === w.id;
    const xp = ok ? 8 : 0;
    setChosen(opt.id);
    setProgDots(d => { const nd = [...d]; nd[idx] = ok ? "done-ok" : "done-err"; return nd; });
    const newRes = [...results, { w, chosen: opt, ok }];
    setResults(newRes);
    if (ok) {
      score.current++; xpEarned.current += xp; setStreak(s => s + 1); beep("ok"); onXP(xp, "choice", w);
      const pid = Date.now();
      setXpPops(p => [...p, { id: pid, amt: xp }]);
      setTimeout(() => setXpPops(p => p.filter(x => x.id !== pid)), 1700);
    } else { setStreak(0); beep("fail"); }
    setTimeout(() => {
      const next = idx + 1;
      if (next >= questions.length) { onFinish({ results: newRes, score: score.current, xp: xpEarned.current }); return; }
      setChosen(null); setIdx(next);
    }, 1500);
  }, [chosen, idx, questions, results, onFinish, onXP]);

  const { w, opts } = questions[idx];
  const labels = ["A", "B", "C", "D"];

  return (
    <div>
      {xpPops.map(p => <XPPop key={p.id} amt={p.amt} onDone={() => setXpPops(v => v.filter(x => x.id !== p.id))} />)}
      <div className="f ic jb mb16">
        <div className="prog-dots">{progDots.map((d, i) => <div key={i} className={`prog-dot${d === "pending" ? (i === idx ? " current" : "") : " " + d}`} />)}</div>
        <div className="streak-fire">🔥 {streak}</div>
      </div>
      <div className="f ic jb mb12">
        <span className="muted sm">{idx + 1} / {questions.length}</span>
        <span className="bdg bdg-g">Ko'p tanlov</span>
      </div>
      <div className="qcard" style={{ marginBottom: 24 }}>
        <div className="muted sm mb10">Bu so'zning koreyschasini toping:</div>
        <div style={{ fontSize: 38, fontWeight: 700, color: "var(--cyan)", margin: "14px 0" }}>{w.uz}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {opts.map((opt, i) => {
          let cls = "mc-opt";
          if (chosen !== null) {
            if (opt.id === w.id) cls += " correct";
            else if (opt.id === chosen) cls += " wrong";
            else cls += " disabled";
          }
          return (
            <div key={opt.id} className={cls} style={{ animationDelay: (i * 0.07) + "s" }}
              onClick={() => choose(opt)}>
              <div className="mc-num">{labels[i]}</div>
              <span style={{ flex: 1, fontSize: 20 }}>{opt.kr}</span>
              {chosen !== null && opt.id === w.id && <span style={{ fontSize: 20 }}>✅</span>}
              {chosen !== null && opt.id === chosen && opt.id !== w.id && <span style={{ fontSize: 20 }}>❌</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Flash Cards — XP = 0 ─────────────────────────────
function FlashCardTest({ words, onFinish }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState([]);
  const [progDots, setProgDots] = useState(words.map(() => "pending"));
  const [streak, setStreak] = useState(0);
  const score = useRef(0);

  const judge = useCallback((ok) => {
    const w = words[idx];
    // Flash kartalar XP = 0 (talabga ko'ra)
    setProgDots(d => { const nd = [...d]; nd[idx] = ok ? "done-ok" : "done-err"; return nd; });
    const newRes = [...results, { w, ok }];
    setResults(newRes);
    if (ok) { score.current++; setStreak(s => s + 1); beep("ok"); }
    else { setStreak(0); beep("fail"); }
    const next = idx + 1;
    if (next >= words.length) { onFinish({ results: newRes, score: score.current, xp: 0 }); return; }
    setFlipped(false); setIdx(next);
  }, [idx, words, results, onFinish]);

  const w = words[idx];
  return (
    <div>
      <div className="f ic jb mb16">
        <div className="prog-dots">{progDots.map((d, i) => <div key={i} className={`prog-dot${d === "pending" ? (i === idx ? " current" : "") : " " + d}`} />)}</div>
        <div className="streak-fire">🔥 {streak}</div>
      </div>
      <div className="f ic jb mb12">
        <span className="muted sm">{idx + 1} / {words.length}</span>
        <span className="bdg bdg-c">Flash kartalar</span>
        <span className="bdg bdg-gold">XP yo'q</span>
      </div>
      <div className="flash-card" onClick={() => setFlipped(f => !f)}
        style={{
          background: flipped ? "linear-gradient(135deg,rgba(0,217,255,0.08),rgba(179,68,255,0.08))" : "linear-gradient(135deg,var(--bg2),var(--bg3))",
          borderColor: flipped ? "var(--cyan)" : "var(--border)",
        }}>
        <div className="flash-hint">{flipped ? "✨ Tarjima" : "👆 Bosing — pastini ko'ring"}</div>
        {!flipped ? (
          <div style={{ fontSize: 42, fontWeight: 700, color: "var(--cyan)" }}>
            {w.uz}
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 42, fontWeight: 700, color: "var(--cyan)" }}>{w.kr}</div>
              <button className="tts-btn" onClick={e => { e.stopPropagation(); speak(w.kr); }}>🔊</button>
            </div>
            <div style={{ fontSize: 20, color: "var(--text2)" }}>{w.uz}</div>
          </>
        )}
        {!flipped && <div className="muted sm" style={{ fontSize: 11 }}>Javobni ko'rish uchun bosing</div>}
      </div>
      {flipped ? (
        <div className="f gap12 mt16">
          <button className="btn bd f1" style={{ padding: 15, fontSize: 14 }} onClick={() => judge(false)}>❌ Bilmadim</button>
          <button className="btn bg f1" style={{ padding: 15, fontSize: 14 }} onClick={() => judge(true)}>✅ Bildim!</button>
        </div>
      ) : (
        <div className="f gap12 mt16">
          <button className="btn bs w100" style={{ padding: 14 }} onClick={() => setFlipped(true)}>Javobni ko'rish 👁</button>
        </div>
      )}
    </div>
  );
}

// ── Moslashtirish ────────────────────────────────────
function MatchingTest({ words, onFinish, onXP }) {
  const BATCH = 6;
  const [batchIdx, setBatchIdx] = useState(0);
  const [batchState, setBatchState] = useState(null);
  const [selLeft, setSelLeft] = useState(null);
  const [selRight, setSelRight] = useState(null);
  const [wrongPair, setWrongPair] = useState(null);
  const [totalScore, setTotalScore] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [xpPops, setXpPops] = useState([]);
  const [allResults, setAllResults] = useState([]);
  const wrongRef = useRef(false);

  const batches = [];
  for (let i = 0; i < words.length; i += BATCH) batches.push(words.slice(i, i + BATCH));

  useEffect(() => {
    const b = batches[batchIdx] || [];
    setBatchState({
      left: b.map(w => ({ id: w.id, text: w.uz, wid: w.id })),
      right: [...b].sort(() => Math.random() - 0.5).map(w => ({ id: "r" + w.id, text: w.kr, wid: w.id })),
      matched: [],
    });
    setSelLeft(null); setSelRight(null); setWrongPair(null);
  }, [batchIdx]);

  const tryMatch = useCallback((side, item) => {
    if (!batchState) return;
    if (batchState.matched.includes(item.wid)) return;
    if (wrongRef.current) return;

    if (side === "left") {
      if (selRight) {
        const ok = item.wid === selRight.wid;
        if (ok) {
          handleCorrect(item.wid);
        } else {
          handleWrong(item.id, selRight.id);
        }
      } else {
        setSelLeft(item);
      }
    } else {
      if (selLeft) {
        const ok = selLeft.wid === item.wid;
        if (ok) {
          handleCorrect(item.wid);
        } else {
          handleWrong(selLeft.id, item.id);
        }
      } else {
        setSelRight(item);
      }
    }
  }, [batchState, selLeft, selRight, totalXP, allResults, batchIdx]);

  const handleCorrect = (wid) => {
    beep("ok");
    const xp = 5;
    onXP(xp, "matching", null);
    setTotalXP(x => x + xp);
    setTotalScore(s => s + 1);
    const pid = Date.now();
    setXpPops(p => [...p, { id: pid, amt: xp }]);
    setTimeout(() => setXpPops(p => p.filter(x => x.id !== pid)), 1700);
    setBatchState(bs => {
      const newMatched = [...bs.matched, wid];
      const isDone = newMatched.length >= bs.left.length;
      if (isDone) {
        const newRes = [...allResults, ...bs.left.map(l => ({ w: batches[batchIdx].find(w => w.id === l.wid), ok: true }))];
        setAllResults(newRes);
        setTimeout(() => {
          if (batchIdx + 1 >= batches.length) {
            onFinish({ results: newRes, score: newRes.filter(r => r.ok).length, xp: totalXP + xp });
          } else {
            setBatchIdx(b => b + 1);
          }
        }, 600);
      }
      return { ...bs, matched: newMatched };
    });
    setSelLeft(null); setSelRight(null);
  };

  const handleWrong = (lid, rid) => {
    beep("fail");
    wrongRef.current = true;
    setWrongPair({ l: lid, r: rid });
    setTimeout(() => {
      setWrongPair(null); setSelLeft(null); setSelRight(null);
      wrongRef.current = false;
    }, 700);
  };

  if (!batchState) return null;
  const { left, right, matched: matchedIds } = batchState;
  const pct = batches.length > 0 ? Math.round((batchIdx / batches.length) * 100) : 0;

  return (
    <div>
      {xpPops.map(p => <XPPop key={p.id} amt={p.amt} onDone={() => setXpPops(v => v.filter(x => x.id !== p.id))} />)}
      <div className="f ic jb mb14">
        <span className="muted sm">Guruh {batchIdx + 1} / {batches.length}</span>
        <span className="bdg bdg-p">Moslashtirish</span>
      </div>
      <div className="tmr-bg mb16"><div className="tmr-fill" style={{ width: pct + "%" }} /></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="match-col">
          <div className="muted sm mb8 tc">🇺🇿 O'zbek</div>
          {left.map((item, i) => {
            const isMatched = matchedIds.includes(item.wid);
            const isSel = selLeft?.id === item.id;
            const isWrong = wrongPair?.l === item.id;
            let cls = "match-item";
            if (isMatched) cls += " matched";
            else if (isWrong) cls += " wrong-flash";
            else if (isSel) cls += " selected";
            return (
              <div key={item.id} className={cls} style={{ animationDelay: (i * 0.06) + "s" }}
                onClick={() => !isMatched && tryMatch("left", item)}>
                {item.text}
              </div>
            );
          })}
        </div>
        <div className="match-col">
          <div className="muted sm mb8 tc">🇰🇷 Koreys</div>
          {right.map((item, i) => {
            const isMatched = matchedIds.includes(item.wid);
            const isSel = selRight?.id === item.id;
            const isWrong = wrongPair?.r === item.id;
            let cls = "match-item";
            if (isMatched) cls += " matched";
            else if (isWrong) cls += " wrong-flash";
            else if (isSel) cls += " selected";
            return (
              <div key={item.id} className={cls} style={{ animationDelay: (i * 0.06) + "s" }}
                onClick={() => !isMatched && tryMatch("right", item)}>
                {item.text}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Ovozli test ───────────────────────────────────────
function VoiceTest({ words, onFinish, onXP, onNotif }) {
  const [idx, setIdx] = useState(0);
  const [listening, setListening] = useState(false);
  const [voiceTx, setVoiceTx] = useState(null);
  const [voiceScore, setVoiceScore] = useState(null);
  const [sts, setSts] = useState(null);
  const [results, setResults] = useState([]);
  const [xpPops, setXpPops] = useState([]);
  const [streak, setStreak] = useState(0);
  const [progDots, setProgDots] = useState(words.map(() => "pending"));
  const stsRef = useRef(null);
  const xpEarned = useRef(0);
  const score = useRef(0);

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { onNotif("❌", "Brauzer ovozni qo'llab-quvvatlamaydi"); return; }
    const rec = new SR();
    rec.lang = "ko-KR"; rec.interimResults = false;
    setListening(true); setVoiceTx(null); setVoiceScore(null);
    rec.onresult = e => {
      const tx = e.results[0][0].transcript;
      const sc = fuzzyMatch(tx, words[idx]?.kr || "");
      setVoiceTx(tx); setVoiceScore(sc); setListening(false);
    };
    rec.onerror = () => { setListening(false); onNotif("❌", "Mikrofon xatosi"); };
    rec.onend = () => setListening(false);
    try { rec.start(); } catch { onNotif("❌", "Mikrofon ochilmadi"); }
  };

  const submitVoice = useCallback((tx) => {
    if (stsRef.current !== null) return;
    const w = words[idx];
    const m = fuzzyMatch(tx, w.kr);
    const ok = m >= 70;
    const xp = ok ? 10 : 0;
    stsRef.current = ok ? "ok" : "err";
    setSts(ok ? "ok" : "err");
    setProgDots(d => { const nd = [...d]; nd[idx] = ok ? "done-ok" : "done-err"; return nd; });
    const newRes = [...results, { w, a: tx, ok, m }];
    setResults(newRes);
    if (ok) {
      score.current++; xpEarned.current += xp; setStreak(s => s + 1); beep("ok"); onXP(xp, "voice", w);
      const pid = Date.now();
      setXpPops(p => [...p, { id: pid, amt: xp }]);
      setTimeout(() => setXpPops(p => p.filter(x => x.id !== pid)), 1700);
    } else { setStreak(0); beep("fail"); }
    setTimeout(() => {
      const next = idx + 1;
      if (next >= words.length) { onFinish({ results: newRes, score: score.current, xp: xpEarned.current }); return; }
      stsRef.current = null; setSts(null); setVoiceTx(null); setVoiceScore(null); setIdx(next);
    }, 1400);
  }, [idx, words, results, onFinish, onXP]);

  const w = words[idx];
  return (
    <div>
      {xpPops.map(p => <XPPop key={p.id} amt={p.amt} onDone={() => setXpPops(v => v.filter(x => x.id !== p.id))} />)}
      <div className="f ic jb mb16">
        <div className="prog-dots">{progDots.map((d, i) => <div key={i} className={`prog-dot${d === "pending" ? (i === idx ? " current" : "") : " " + d}`} />)}</div>
        <div className="streak-fire">🔥 {streak}</div>
      </div>
      <div className="f ic jb mb12">
        <span className="muted sm">{idx + 1} / {words.length}</span>
        <span className="bdg bdg-c">Ovozli</span>
      </div>
      <div className={`qcard${sts === "ok" ? " ok" : sts === "err" ? " err" : ""}`}>
        <div className="muted sm mb10">Bu so'zni koreyscha ayting:</div>
        <div style={{ fontSize: 38, fontWeight: 700, color: "var(--cyan)", margin: "16px 0" }}>{w.uz}</div>
        <button className="btn bs" style={{ padding: "6px 16px", fontSize: 12 }} onClick={() => speak(w.kr)}>
          🔊 Namuna eshiting
        </button>
        {sts === "ok" && <div style={{ color: "var(--green)", fontWeight: 700, fontSize: 20, marginTop: 10 }}>✅ {w.kr}</div>}
        {sts === "err" && <div style={{ color: "var(--red)", fontWeight: 600, marginTop: 10 }}>❌ To'g'risi: <span style={{ color: "var(--cyan)" }}>{w.kr}</span></div>}
      </div>
      <div className="f fc ic gap16" style={{ padding: "24px 0" }}>
        <div className={`mic-btn${listening ? " listening" : ""}`}
          onClick={!listening && !voiceTx && !sts ? startVoice : undefined}>
          <div className="mic-ring" /><div className="mic-ring2" />
          <span style={{ position: "relative", zIndex: 1 }}>{listening ? "🔴" : "🎤"}</span>
        </div>
        {listening && <div className="muted sm">Eshitilmoqda...</div>}
        {voiceTx && !sts && (
          <div className="gc" style={{ width: "100%", maxWidth: 380 }}>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 10, color: "var(--cyan)" }}>{voiceTx}</div>
            <div className="muted sm mb10">Moslik: {voiceScore}%</div>
            <div className="tmr-bg">
              <div className="tmr-fill" style={{ width: voiceScore + "%", background: voiceScore >= 70 ? "linear-gradient(90deg,var(--green),#00a84a)" : "linear-gradient(90deg,var(--red),#ff6b6b)" }} />
            </div>
            <div style={{ color: voiceScore >= 70 ? "var(--green)" : "var(--red)", fontWeight: 600, marginBottom: 14 }}>
              {voiceScore >= 90 ? "🌟 Mukammal!" : voiceScore >= 70 ? "👍 Yaxshi" : "❌ Qayta urinib ko'ring"}
            </div>
            <div className="f gap10 fw">
              <button className="btn bg f1" onClick={() => submitVoice(voiceTx)}>Tasdiqlash ✓</button>
              <button className="btn bs f1" onClick={() => { setVoiceTx(null); setVoiceScore(null); }}>Qayta 🔄</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Test natijasi ────────────────────────────────────
function TestResult({ results, score, xp, total, mode, onRetry, onBack }) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const grade = pct >= 90 ? { l: "🌟 Ajoyib!", c: "var(--gold)" } : pct >= 75 ? { l: "🎉 A'lo", c: "var(--green)" } : pct >= 60 ? { l: "👍 Yaxshi", c: "var(--cyan)" } : { l: "💪 Davom et", c: "var(--orange)" };
  return (
    <div>
      <div className="ptitle">Natija</div>
      <div className="gc mb20 tc" style={{ padding: "36px 0" }}>
        <div className="res-score">{pct}%</div>
        <div className="muted sm mt12">{score} / {total} to'g'ri javob</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: grade.c, marginTop: 12 }}>{grade.l}</div>
        <div className="f jc gap12 mt16 fw">
          <span className="bdg bdg-g">+{xp} XP</span>
          <span className="bdg bdg-c">{mode}</span>
        </div>
        <div style={{ marginTop: 24 }}><PR pct={pct} sz={90} /></div>
      </div>
      {results && results.length > 0 && (
        <div className="gc mb20">
          <div className="fw7 mb14">Batafsil natijalar</div>
          {results.slice(0, 20).map((r, i) => (
            <div key={i} className="f ic gap10 mb8" style={{
              padding: "10px 14px", borderRadius: 11,
              background: r.ok ? "rgba(0,210,106,.07)" : "rgba(255,56,56,.07)",
              border: `1px solid ${r.ok ? "rgba(0,210,106,.2)" : "rgba(255,56,56,.2)"}`,
              animation: "cardIn 0.5s ease-out backwards",
              animationDelay: (i * 0.03) + "s",
            }}>
              <span style={{ fontSize: 16 }}>{r.ok ? "✅" : "❌"}</span>
              <span className="f1 sm">{r.w?.uz}</span>
              <span className="fw7" style={{ color: "var(--cyan)", fontSize: 13 }}>{r.w?.kr}</span>
              {!r.ok && r.a && <span className="muted sm">→ {r.a}</span>}
            </div>
          ))}
        </div>
      )}
      <div className="f gap12">
        <button className="btn bp f1" onClick={onRetry}>🔄 Qaytadan</button>
        <button className="btn bs f1" onClick={onBack}>← Ortga</button>
      </div>
    </div>
  );
}

// ── Test sahifasi ────────────────────────────────────
function TestPage({ stats, onUpdateStats, onXP, onNotif }) {
  const [phase, setPhase] = useState("setup");
  const [lvl, setLvl] = useState("1A");
  const [kva, setKva] = useState(null);
  const [mode, setMode] = useState(null);
  const [words, setWords] = useState([]);
  const [result, setResult] = useState(null);

  const MODES = [
    { id: "written", icon: "✍️", title: "Yozma", desc: "So'z tarjimasini koreyscha yozing", color: "active", xp: "10 XP/to'g'ri" },
    { id: "bidirectional", icon: "🔄", title: "Ikki tomoni", desc: "UZ→KR va KR→UZ aralash savolar", color: "active-purple", xp: "12 XP/to'g'ri" },
    { id: "choice", icon: "🎯", title: "Ko'p tanlov", desc: "4 variant ichidan to'g'risini toping", color: "active-green", xp: "8 XP/to'g'ri" },
    { id: "flash", icon: "⚡", title: "Flash kartalar", desc: "Kartani aylantirib o'zingizni baholang", color: "active-gold", xp: "0 XP (mashq)" },
    { id: "matching", icon: "🧩", title: "Moslashtirish", desc: "O'zbek va koreys so'zlarni juftlang", color: "active-purple", xp: "5 XP/juft" },
    { id: "voice", icon: "🎤", title: "Ovozli", desc: "So'zni koreyscha aytib bering", color: "active", xp: "10 XP/to'g'ri" },
  ];

  const getAllWords = () => {
    const arr = [];
    Object.values(ALL_DATA).forEach(lvlData => lvlData.forEach(k => arr.push(...k.words)));
    return arr;
  };

  const startTest = () => {
    if (!lvl || kva === null || !mode) return;
    const kData = ALL_DATA[lvl]?.find(k => k.kva === kva);
    if (!kData || kData.words.length === 0) { onNotif("❌", "Bu kvada so'z yo'q"); return; }
    const shuf = [...kData.words].sort(() => Math.random() - 0.5);
    setWords(shuf); setResult(null); setPhase("running");
  };

  const handleFinish = useCallback((res) => {
    setResult(res);
    onUpdateStats(prev => {
      const ns = { ...prev };
      ns.xp = (ns.xp || 0) + res.xp;
      ns.testsCompleted = (ns.testsCompleted || 0) + 1;
      ns.totalAnswers = (ns.totalAnswers || 0) + res.results.length;
      ns.correctAnswers = (ns.correctAnswers || 0) + res.score;
      ns.completedWords = (ns.completedWords || 0) + res.score;
      return ns;
    });
    onNotif("🎉", `Test yakunlandi! +${res.xp} XP`);
    setPhase("result");
  }, [onUpdateStats, onNotif]);

  const handleXP = useCallback((xp, source, word) => { onXP(xp, source, word); }, [onXP]);

  if (phase === "result" && result) {
    return (
      <TestResult
        results={result.results} score={result.score} xp={result.xp}
        total={words.length}
        mode={MODES.find(m => m.id === mode)?.title || mode}
        onRetry={() => { setResult(null); startTest(); }}
        onBack={() => { setResult(null); setPhase("setup"); }}
      />
    );
  }

  if (phase === "running") {
    const commonProps = { words, onFinish: handleFinish, onXP: handleXP, onNotif };
    return (
      <div>
        <div className="back" onClick={() => setPhase("setup")}>← Test sozlamalari</div>
        <div className="ptitle">{MODES.find(m => m.id === mode)?.icon} {MODES.find(m => m.id === mode)?.title} Test</div>
        <p className="psub">{lvl} · {kva}-kva · {words.length} so'z</p>
        {mode === "written" && <WrittenTest       {...commonProps} />}
        {mode === "bidirectional" && <BidirectionalTest {...commonProps} />}
        {mode === "choice" && <MultipleChoiceTest {...commonProps} allWords={getAllWords()} />}
        {mode === "flash" && <FlashCardTest      {...commonProps} />}
        {mode === "matching" && <MatchingTest       {...commonProps} />}
        {mode === "voice" && <VoiceTest          {...commonProps} />}
      </div>
    );
  }

  return (
    <div>
      <div className="ptitle">🧪 Test</div>
      <p className="psub">Daraja, kva va test turini tanlang</p>
      <div className="gc mb20">
        <div className="fw7 mb14">📍 Daraja tanlang</div>
        <div className="f gap8 fw">
          {Object.keys(ALL_DATA).map((l, i) => (
            <button key={l} className={`btn ${lvl === l ? "bp" : "bs"}`}
              style={{ padding: "9px 18px", fontSize: 13, animationDelay: (i * 0.05) + "s" }}
              onClick={() => { setLvl(l); setKva(null); }}>{l}</button>
          ))}
        </div>
      </div>
      {lvl && (
        <div className="gc mb20">
          <div className="fw7 mb14">📖 Kva (Dars) tanlang</div>
          <div style={{ maxHeight: 280, overflowY: "auto", paddingRight: 4 }}>
            {(ALL_DATA[lvl] || []).map((k, i) => (
              <div key={k.kva} className={`kc${kva === k.kva ? " sel" : ""}`}
                style={{ animationDelay: (i * 0.04) + "s" }} onClick={() => setKva(k.kva)}>
                <div className="kc-num">{k.kva}</div>
                <div className="f1">
                  <div className="fw7 sm">{k.kva}-kva</div>
                  <div className="muted sm mt8">{k.words.length} ta so'z</div>
                </div>
                <span className="muted">{kva === k.kva ? "✓" : "→"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="gc mb20">
        <div className="fw7 mb16">🎯 Test turini tanlang</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12 }}>
          {MODES.map((m, i) => (
            <div key={m.id}
              className={`test-mode-card${mode === m.id ? " " + m.color : ""}`}
              style={{ animationDelay: (i * 0.06) + "s" }}
              onClick={() => setMode(m.id)}>
              <div className="test-mode-icon">{m.icon}</div>
              <div className="test-mode-title">{m.title}</div>
              <div className="test-mode-desc">{m.desc}</div>
              <div style={{ marginTop: 10, fontSize: 11, color: "var(--gold)", fontFamily: "'JetBrains Mono'", fontWeight: 700 }}>{m.xp}</div>
              {mode === m.id && <div style={{ position: "absolute", top: 12, right: 12, fontSize: 16 }}>✓</div>}
            </div>
          ))}
        </div>
      </div>
      <div className="gc">
        <div className="f ic jb mb16 fw" style={{ gap: 8 }}>
          <div>
            <div className="fw7 mb8">Tanlangan:</div>
            <div className="f gap8 fw">
              <span className="bdg bdg-c">{lvl || "—"}</span>
              {kva !== null && <span className="bdg bdg-c">{kva}-kva</span>}
              {mode && <span className="bdg bdg-p">{MODES.find(m => m.id === mode)?.icon} {MODES.find(m => m.id === mode)?.title}</span>}
            </div>
          </div>
          <div className="tc">
            <div className="muted sm">So'zlar soni</div>
            <div style={{ fontFamily: "'Orbitron'", fontSize: 24, fontWeight: 900, color: "var(--cyan)" }}>
              {(ALL_DATA[lvl]?.find(k => k.kva === kva)?.words.length) || 0}
            </div>
          </div>
        </div>
        <button className="btn bp w100" style={{ padding: 16, fontSize: 16 }}
          disabled={!lvl || kva === null || !mode}
          onClick={startTest}>
          ⚡ Testni Boshlash
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════
// LUGAT SAHIFASI — TTS bilan
// ════════════════════════════════════════
function VocabularyPage() {
  const [view, setView] = useState("levels");
  const [lvl, setLvl] = useState(null);
  const [kva, setKva] = useState(null);
  const [search, setSearch] = useState("");
  const [playing, setPlaying] = useState(null);

  const playWord = (word, id) => {
    setPlaying(id);
    window.speechSynthesis?.cancel();
    const u = new SpeechSynthesisUtterance(word);
    u.lang = "ko-KR"; u.rate = 0.85;
    u.onend = () => setPlaying(null);
    window.speechSynthesis?.speak(u);
  };

  if (view === "words" && lvl && kva !== null) {
    const kData = ALL_DATA[lvl]?.find(k => k.kva === kva);
    if (!kData) return null;
    const filtered = search.trim()
      ? kData.words.filter(w => w.kr.includes(search) || w.uz.toLowerCase().includes(search.toLowerCase()))
      : kData.words;
    return (
      <div>
        <div className="back" onClick={() => setView("kvas")}>← {lvl} darajasi</div>
        <div className="ptitle">{lvl} · {kva}-kva</div>
        <p className="psub">{kData.words.length} ta so'z</p>
        <input className="inp mb20" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 So'z qidiring..." />
        <div className="g3">
          {filtered.map((w, i) => (
            <div key={w.id} className="wc" style={{ animationDelay: (i * 0.04) + "s" }}>
              <div className="wc-kr">
                <span>{w.kr}</span>
                <button className="tts-btn"
                  onClick={() => playWord(w.kr, w.id)}
                  style={{ color: playing === w.id ? "var(--cyan)" : "var(--text2)" }}>
                  {playing === w.id ? "🔊" : "🔈"}
                </button>
              </div>
              <div className="wc-uz">{w.uz}</div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="muted tc" style={{ gridColumn: "1/-1", padding: 32 }}>Hech narsa topilmadi</div>
          )}
        </div>
      </div>
    );
  }

  if (view === "kvas" && lvl) {
    const kvas = ALL_DATA[lvl] || [];
    return (
      <div>
        <div className="back" onClick={() => setView("levels")}>← Darajalar</div>
        <div className="ptitle">Daraja {lvl}</div>
        <p className="psub">{kvas.length} ta kva</p>
        {kvas.map((k, i) => (
          <div key={k.kva} className="kc" style={{ animationDelay: (i * 0.06) + "s" }}
            onClick={() => { setKva(k.kva); setView("words"); setSearch(""); }}>
            <div className="kc-num">{k.kva}</div>
            <div className="f1">
              <div className="fw7 sm">{k.kva}-kva</div>
              <div className="muted sm mt8">{k.words.length} ta so'z</div>
            </div>
            <span className="muted">→</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="ptitle">Lug'atlar</div>
      <p className="psub">Daraja tanlang</p>
      <div className="g3">
        {Object.keys(ALL_DATA).map((l, i) => {
          const kvas = ALL_DATA[l] || [];
          const tot = kvas.reduce((s, k) => s + k.words.length, 0);
          return (
            <div key={l} className="lc" style={{ animationDelay: (i * 0.08) + "s" }}
              onClick={() => { setLvl(l); setView("kvas"); }}>
              <div className="lc-badge">{l}</div>
              <div className="muted sm mb12">{kvas.length} kva · {tot} so'z</div>
              <PR pct={Math.min(100, Math.round((tot / 50) * 10))} sz={56} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════
// BOSH SAHIFA
// ════════════════════════════════════════
function HomePage({ user, stats, go }) {
  const xp = stats.xp || 0;
  const tests = stats.testsCompleted || 0;
  const words = stats.completedWords || 0;
  const lvl = Math.floor(xp / 200) + 1;
  const xpToNext = 200 - (xp % 200);
  return (
    <div>
      <div className="ptitle">Bosh Sahifa</div>
      <p className="psub">Assalomu alaykum, <b>{user.name}</b>! 👋</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 14, marginBottom: 28 }}>
        {[
          { l: "XP", v: xp, ic: "⚡", col: "var(--gold)" },
          { l: "Daraja", v: lvl, ic: "🏆", col: "var(--cyan)" },
          { l: "Testlar", v: tests, ic: "📝", col: "var(--purple)" },
          { l: "So'zlar", v: words, ic: "📖", col: "var(--blue)" },
        ].map((s, i) => (
          <div key={i} className="sc" style={{ animationDelay: (i * 0.08) + "s" }}>
            <div style={{ fontSize: 24 }}>{s.ic}</div>
            <div className="sc-lbl">{s.l}</div>
            <div className="sc-val" style={{ fontSize: 26, color: s.col, WebkitTextFillColor: s.col, background: "none" }}>{s.v}</div>
          </div>
        ))}
      </div>
      <div className="gc mb20">
        <div className="f ic jb mb12">
          <div>
            <div className="fw7">{lvl}-daraja</div>
            <div className="muted sm mt8">Keyingi darajaga: {xpToNext} XP</div>
          </div>
          <PR pct={Math.round(((xp % 200) / 200) * 100)} sz={58} />
        </div>
        <div className="tmr-bg" style={{ height: 6, borderRadius: 3, marginBottom: 0 }}>
          <div className="tmr-fill" style={{ width: Math.round(((xp % 200) / 200) * 100) + "%" }} />
        </div>
      </div>
      <div className="f gap16 mb16 fw">
        {[
          { t: "Test", ic: "🧪", d: "6 xil test rejimi", p: "test" },
          { t: "Uyga Vazifa", ic: "📚", d: "Kva tanlang", p: "homework" },
          { t: "Statistika", ic: "📊", d: "Natijalarni ko'rish", p: "statistics" },
        ].map((c, i) => (
          <div key={i} className="gc f1" style={{ minWidth: 180, animationDelay: (i * 0.1) + "s" }}>
            <div className="f ic jb mb10">
              <div className="fw7">{c.t}</div>
              <span style={{ fontSize: 26 }}>{c.ic}</span>
            </div>
            <div className="muted sm mb14">{c.d}</div>
            <button className="btn bp w100" onClick={() => go(c.p)}>Boshlash →</button>
          </div>
        ))}
      </div>
    </div>
  );
}
import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "./firebase";
// ════════════════════════════════════════
// REYTING SAHIFASI — To'liq
// ════════════════════════════════════════
function RankingPage({ user }) {

  const [selected, setSelected] = useState(null);

  const [ranking, setRanking] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  // FIREBASE RANKING LOAD
  const loadRanking = async () => {

    try {

      setRefreshing(true);

      const snapshot = await getDocs(
        collection(db, "users")
      );

      const arr = snapshot.docs.map((doc) => ({

        id: doc.id,

        xp: 0,
        testsCompleted: 0,
        correctAnswers: 0,
        totalAnswers: 0,
        completedWords: 0,
        history: [],

        ...doc.data(),

      }));

      arr.sort((a, b) => b.xp - a.xp);

      setRanking(arr);

    } catch (err) {

      console.log("RANK ERROR:", err);

    } finally {

      setLoading(false);
      setRefreshing(false);

    }

  };

  useEffect(() => {

    loadRanking();

  }, []);

  const cols = [
    "#ffd60a",
    "#c0c7d1",
    "#cd7f32"
  ];

  const medals = [
    "🥇",
    "🥈",
    "🥉"
  ];

  const SOURCE_LABELS = {

    written: {
      l: "✍️ Yozma",
      col: "var(--cyan)"
    },

    bidirectional: {
      l: "🔄 Ikki tomon",
      col: "var(--purple)"
    },

    choice: {
      l: "🎯 Tanlov",
      col: "var(--green)"
    },

    matching: {
      l: "🧩 Matching",
      col: "var(--pink)"
    },

    voice: {
      l: "🎤 Ovoz",
      col: "var(--blue)"
    },

    homework: {
      l: "📚 Homework",
      col: "var(--gold)"
    },

  };

  const acc = (u) => {

    if (!u.totalAnswers) return 0;

    return Math.round(
      (u.correctAnswers / u.totalAnswers) * 100
    );

  };

  // LEVEL SYSTEM
  const getLevel = (xp) => {

    if (xp >= 10000) return "👑 Master";
    if (xp >= 7000) return "🔥 Legend";
    if (xp >= 5000) return "💎 Diamond";
    if (xp >= 3000) return "🚀 Platinum";
    if (xp >= 1500) return "⚡ Gold";
    if (xp >= 700) return "🥈 Silver";

    return "🥉 Bronze";

  };

  // DETAIL MODAL
  const DetailModal = ({ u, onClose }) => {

    const bySource = {};

    (u.history || []).forEach((h) => {

      if (!bySource[h.source]) {

        bySource[h.source] = {
          xp: 0,
          count: 0
        };

      }

      bySource[h.source].xp += h.xp || 0;
      bySource[h.source].count += 1;

    });

    return (

      <div className="ov" onClick={onClose}>

        <div
          className="modal"
          style={{
            maxWidth: 520,
            maxHeight: "90vh",
            overflow: "auto"
          }}
          onClick={(e) => e.stopPropagation()}
        >

          <div className="f ic jb mb20">

            <div>

              <div
                style={{
                  fontFamily: "'Orbitron'",
                  fontSize: 22,
                  fontWeight: 900,
                  color: "var(--cyan)"
                }}
              >
                {u.name}
              </div>

              <div className="muted sm mt8">
                @{u.login}
              </div>

            </div>

            <button
              className="btn bs"
              style={{
                padding: "8px 15px"
              }}
              onClick={onClose}
            >
              ✕
            </button>

          </div>

          {/* PROFILE */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 20
            }}
          >

            <div
              className="rk-av"
              style={{
                width: 70,
                height: 70,
                fontSize: 28,
                background:
                  "linear-gradient(135deg,var(--cyan),var(--purple))"
              }}
            >
              {u.name?.charAt(0)?.toUpperCase()}
            </div>

            <div>

              <div
                style={{
                  fontWeight: 800,
                  fontSize: 18
                }}
              >
                {getLevel(u.xp)}
              </div>

              <div className="muted sm mt8">
                {u.completedWords || 0} ta so'z tugatilgan
              </div>

            </div>

          </div>

          {/* STATS */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2,1fr)",
              gap: 12,
              marginBottom: 24
            }}
          >

            {[
              {
                l: "XP",
                v: u.xp || 0,
                ic: "⚡"
              },

              {
                l: "Testlar",
                v: u.testsCompleted || 0,
                ic: "📝"
              },

              {
                l: "Aniqlik",
                v: acc(u) + "%",
                ic: "🎯"
              },

              {
                l: "So'zlar",
                v: u.completedWords || 0,
                ic: "📚"
              },

            ].map((s, i) => (

              <div
                key={i}
                className="sc"
                style={{
                  padding: "18px 14px"
                }}
              >

                <div style={{ fontSize: 24 }}>
                  {s.ic}
                </div>

                <div
                  className="sc-lbl"
                  style={{
                    fontSize: 11
                  }}
                >
                  {s.l}
                </div>

                <div
                  className="sc-val"
                  style={{
                    fontSize: 22
                  }}
                >
                  {s.v}
                </div>

              </div>

            ))}

          </div>

          {/* XP SOURCE */}
          <div className="fw7 mb12">
            📊 XP manbalari
          </div>

          {Object.keys(bySource).length === 0 ? (

            <div
              className="muted sm tc"
              style={{
                padding: "20px 0"
              }}
            >
              Ma'lumot yo'q
            </div>

          ) : (

            Object.entries(bySource).map(([src, data]) => {

              const sl =
                SOURCE_LABELS[src] || {
                  l: src,
                  col: "var(--text2)"
                };

              const pct =
                u.xp > 0
                  ? Math.round(
                    (data.xp / u.xp) * 100
                  )
                  : 0;

              return (

                <div
                  key={src}
                  style={{
                    marginBottom: 14
                  }}
                >

                  <div className="f ic jb mb6">

                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: sl.col
                      }}
                    >
                      {sl.l}
                    </span>

                    <span
                      style={{
                        fontFamily:
                          "'JetBrains Mono'",
                        fontSize: 12,
                        color: "var(--gold)"
                      }}
                    >
                      +{data.xp} XP
                    </span>

                  </div>

                  <div className="tmr-bg">

                    <div
                      className="tmr-fill"
                      style={{
                        width: pct + "%",
                        background: sl.col
                      }}
                    />

                  </div>

                </div>

              );

            })

          )}

        </div>

      </div>

    );

  };

  return (

    <div>

      <div className="f ic jb mb20">

        <div>

          <div className="ptitle">
            🏆 Global Reyting
          </div>

          <p className="psub">
            Barcha o'quvchilar
          </p>

        </div>

        <button
          className="btn pri"
          onClick={loadRanking}
        >
          {refreshing
            ? "..."
            : "⟳ Yangilash"}
        </button>

      </div>

      {loading ? (

        <div
          className="tc"
          style={{
            padding: "60px 0"
          }}
        >
          Yuklanmoqda...
        </div>

      ) : ranking.length === 0 ? (

        <div
          className="gc tc"
          style={{
            padding: "70px 0"
          }}
        >

          <div
            style={{
              fontSize: 70,
              opacity: 0.25
            }}
          >
            🏆
          </div>

          <div className="fw7 muted">
            Reyting bo'sh
          </div>

        </div>

      ) : (

        ranking.map((u, i) => (

          <div
            key={u.id}
            className={`rk-item ${u.id === user?.id
                ? " me"
                : ""
              }`}
            style={{
              animationDelay:
                (i * 0.05) + "s"
            }}
            onClick={() =>
              setSelected(u)
            }
          >

            <div
              className="rk-num"
              style={{
                color:
                  cols[i] ||
                  "var(--text2)"
              }}
            >
              {i < 3
                ? medals[i]
                : "#" + (i + 1)}
            </div>

            <div
              className="rk-av"
              style={{
                background:
                  [
                    "linear-gradient(135deg,var(--cyan),var(--blue))",

                    "linear-gradient(135deg,var(--purple),var(--pink))",

                    "linear-gradient(135deg,var(--green),#00a84a)"
                  ][i % 3]
              }}
            >
              {u.name
                ?.charAt(0)
                ?.toUpperCase()}
            </div>

            <div className="f1">

              <div className="fw7 sm">

                {u.name}

                {u.id === user?.id
                  ? " (Sen)"
                  : ""}

              </div>

              <div className="muted sm">

                @{u.login}

                {" · "}

                {getLevel(u.xp)}

                {" · "}

                {acc(u)}%

              </div>

            </div>

            <div
              className="f fc ic"
              style={{
                gap: 3
              }}
            >

              <div className="rk-xp">
                {u.xp || 0}
              </div>

              <div
                className="muted sm"
                style={{
                  fontSize: 10
                }}
              >
                XP
              </div>

            </div>

          </div>

        ))

      )}

      {selected && (

        <DetailModal
          u={selected}
          onClose={() =>
            setSelected(null)
          }
        />

      )}

    </div>

  );

}

// ════════════════════════════════════════
// STATISTIKA SAHIFASI
// ════════════════════════════════════════
function StatisticsPage({ stats, user }) {
  const xp = stats.xp || 0;
  const tests = stats.testsCompleted || 0;
  const lvl = Math.floor(xp / 200) + 1;
  const acc = stats.totalAnswers ? Math.round((stats.correctAnswers / stats.totalAnswers) * 100) : 0;
  const history = S.get("kc_history_" + (user?.id || ""), []);

  const bySource = {};
  history.forEach(h => {
    if (!bySource[h.source]) bySource[h.source] = { xp: 0, count: 0 };
    bySource[h.source].xp += h.xp;
    bySource[h.source].count += 1;
  });

  const SOURCE_LABELS = {
    written: { l: "✍️ Yozma", col: "var(--cyan)" },
    bidirectional: { l: "🔄 Ikki tomoni", col: "var(--purple)" },
    choice: { l: "🎯 Ko'p tanlov", col: "var(--green)" },
    matching: { l: "🧩 Moslashtirish", col: "var(--pink)" },
    voice: { l: "🎤 Ovozli", col: "var(--blue)" },
    homework: { l: "📚 Uyga vazifa", col: "var(--gold)" },
  };

  return (
    <div>
      <div className="ptitle">Statistika</div>
      <p className="psub">Sizning natijalaringiz</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { l: "XP", v: xp, i: "⚡" },
          { l: "Daraja", v: lvl, i: "🏆" },
          { l: "Testlar", v: tests, i: "📝" },
          { l: "Aniqlik", v: acc + "%", i: "🎯" },
          { l: "To'g'ri", v: stats.correctAnswers || 0, i: "✅" },
          { l: "So'zlar", v: stats.completedWords || 0, i: "📖" },
        ].map((s, i) => (
          <div key={i} className="sc" style={{ animationDelay: (i * 0.07) + "s" }}>
            <div style={{ fontSize: 22 }}>{s.i}</div>
            <div className="sc-lbl">{s.l}</div>
            <div className="sc-val" style={{ fontSize: 22 }}>{s.v}</div>
          </div>
        ))}
      </div>

      {Object.keys(bySource).length > 0 && (
        <div className="gc mb20">
          <div className="fw7 mb16">📊 Test turlari bo'yicha XP:</div>
          {Object.entries(bySource).map(([src, data]) => {
            const sl = SOURCE_LABELS[src] || { l: src, col: "var(--text2)" };
            const pct = xp > 0 ? Math.round((data.xp / xp) * 100) : 0;
            return (
              <div key={src} style={{ marginBottom: 14 }}>
                <div className="f ic jb mb8">
                  <span style={{ fontWeight: 600, color: sl.col }}>{sl.l}</span>
                  <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 13, color: "var(--gold)" }}>+{data.xp} XP ({data.count}✕)</span>
                </div>
                <div className="tmr-bg" style={{ marginBottom: 0 }}>
                  <div className="tmr-fill" style={{ width: pct + "%", background: sl.col }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {history.length > 0 && (
        <div className="gc">
          <div className="fw7 mb14">🕐 So'nggi 10 ta faollik:</div>
          {history.slice(-10).reverse().map((h, i) => {
            const sl = SOURCE_LABELS[h.source] || { l: h.source, col: "var(--text2)" };
            return (
              <div key={i} className="rk-detail-row" style={{ animationDelay: (i * 0.05) + "s" }}>
                <span style={{ color: sl.col }}>{sl.l}</span>
                <span className="f1" style={{ fontSize: 13 }}>{h.word || "—"}</span>
                <span style={{ color: "var(--gold)", fontFamily: "'JetBrains Mono'", fontSize: 12 }}>+{h.xp} XP</span>
                <span className="muted sm">{new Date(h.ts).toLocaleDateString("uz")}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════
// UYGA VAZIFA SAHIFASI
// ════════════════════════════════════════
function HomeworkPage({ stats, onUpdateStats, onXP, onNotif }) {
  const [phase, setPhase] = useState("setup");
  const [lvl, setLvl] = useState("1A");
  const [kva, setKva] = useState(null);
  const [typ, setTyp] = useState("written");
  const [wrds, setWrds] = useState([]);
  const [idx, setIdx] = useState(0);
  const [inp, setInp] = useState("");
  const [sts, setSts] = useState(null);
  const [tmr, setTmr] = useState(30);
  const [res, setRes] = useState([]);
  const [listening, setListening] = useState(false);
  const [voiceTx, setVoiceTx] = useState(null);
  const [voiceScore, setVoiceScore] = useState(null);
  const [xpPops, setXpPops] = useState([]);

  const inpRef = useRef();
  const tmrRef = useRef();
  const wrdsRef = useRef([]);
  const idxRef = useRef(0);
  const resRef = useRef([]);
  const stsRef = useRef(null);
  const scoreRef = useRef(0);
  const xpEarnedRef = useRef(0);
  const strRef = useRef(0);

  const resetRefs = () => {
    resRef.current = []; stsRef.current = null; scoreRef.current = 0;
    xpEarnedRef.current = 0; strRef.current = 0; idxRef.current = 0;
  };

  const startTest = () => {
    if (!lvl || kva === null) return;
    const kData = ALL_DATA[lvl]?.find(k => k.kva === kva);
    if (!kData || kData.words.length === 0) { onNotif("❌", "Bu kvada so'z yo'q"); return; }
    const shuf = [...kData.words].sort(() => Math.random() - 0.5);
    resetRefs(); wrdsRef.current = shuf;
    setWrds(shuf); setIdx(0); setInp(""); setSts(null);
    setTmr(30); setRes([]); setVoiceTx(null); setVoiceScore(null);
    setPhase(typ === "voice" ? "voice" : "test");
    setTimeout(() => inpRef.current?.focus(), 80);
  };

  useEffect(() => {
    if (phase !== "test") return;
    clearInterval(tmrRef.current);
    if (stsRef.current !== null) return;
    setTmr(30);
    tmrRef.current = setInterval(() => {
      setTmr(t => {
        if (t <= 1) { clearInterval(tmrRef.current); if (stsRef.current === null) submitAnswer("", true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(tmrRef.current);
  }, [phase, idx]);

  const finishTest = useCallback(() => {
    const total = resRef.current.length;
    const correct = resRef.current.filter(r => r.ok).length;
    const totalXP = xpEarnedRef.current;
    onUpdateStats(prev => {
      const ns = { ...prev };
      ns.xp = (ns.xp || 0) + totalXP;
      ns.testsCompleted = (ns.testsCompleted || 0) + 1;
      ns.totalAnswers = (ns.totalAnswers || 0) + total;
      ns.correctAnswers = (ns.correctAnswers || 0) + correct;
      ns.completedWords = (ns.completedWords || 0) + correct;
      return ns;
    });
    onNotif("🎉", `Vazifa topshirildi! +${totalXP} XP`);
    setPhase("result");
  }, [onUpdateStats, onNotif]);

  const submitAnswer = useCallback((answer) => {
    clearInterval(tmrRef.current);
    if (stsRef.current !== null) return;
    const words = wrdsRef.current, i = idxRef.current, w = words[i];
    const m = fuzzyMatch(answer, w.kr);
    const ok = m >= 78;
    const xp = ok ? 10 : 0;
    stsRef.current = ok ? "ok" : "err";
    setSts(ok ? "ok" : "err");
    const newRes = [...resRef.current, { w, a: answer, ok, m }];
    resRef.current = newRes; setRes([...newRes]);
    if (ok) {
      scoreRef.current++; xpEarnedRef.current += xp; strRef.current++;
      beep("ok"); onXP(xp, "homework", w);
      const pid = Date.now();
      setXpPops(p => [...p, { id: pid, amt: xp }]);
      setTimeout(() => setXpPops(p => p.filter(x => x.id !== pid)), 1700);
    } else { strRef.current = 0; beep("fail"); }
    setTimeout(() => {
      const nextIdx = i + 1;
      if (nextIdx >= words.length) { finishTest(); }
      else {
        idxRef.current = nextIdx; setIdx(nextIdx); stsRef.current = null;
        setSts(null); setInp(""); setTmr(30); setVoiceTx(null); setVoiceScore(null);
        setTimeout(() => inpRef.current?.focus(), 60);
      }
    }, 1200);
  }, [finishTest, onXP]);

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { onNotif("❌", "Brauzer ovozni qo'llab-quvvatlamaydi"); return; }
    const rec = new SR(); rec.lang = "ko-KR"; rec.interimResults = false;
    setListening(true); setVoiceTx(null); setVoiceScore(null);
    rec.onresult = e => { const tx = e.results[0][0].transcript; const sc = fuzzyMatch(tx, wrdsRef.current[idxRef.current]?.kr || ""); setVoiceTx(tx); setVoiceScore(sc); setListening(false); };
    rec.onerror = () => { setListening(false); onNotif("❌", "Mikrofon xatosi"); };
    rec.onend = () => setListening(false);
    try { rec.start(); } catch { onNotif("❌", "Mikrofon ochilmadi"); }
  };

  if (phase === "result") {
    const pct = wrds.length > 0 ? Math.round((scoreRef.current / wrds.length) * 100) : 0;
    return (
      <div>
        <div className="ptitle">Natija</div>
        <div className="gc mb20 tc" style={{ padding: "32px 0" }}>
          <div className="res-score">{pct}%</div>
          <div className="muted sm mt12">{scoreRef.current} / {wrds.length} to'g'ri</div>
          <div className="f jc gap12 mt16 fw">
            <span className="bdg bdg-g">+{xpEarnedRef.current} XP</span>
            <span className="bdg bdg-c">{pct >= 80 ? "🌟 A'lo" : pct >= 60 ? "👍 Yaxshi" : "💪 Davom et"}</span>
          </div>
        </div>
        <div className="gc mb20">
          <div className="fw7 mb14">Natijalar</div>
          {res.map((r, i) => (
            <div key={i} className="f ic gap10 mb8" style={{ padding: "10px 14px", borderRadius: 11, background: r.ok ? "rgba(0,210,106,.07)" : "rgba(255,56,56,.07)", border: `1px solid ${r.ok ? "rgba(0,210,106,.2)" : "rgba(255,56,56,.2)"}`, animation: "cardIn 0.5s ease-out backwards", animationDelay: (i * 0.04) + "s" }}>
              <span style={{ fontSize: 16 }}>{r.ok ? "✅" : "❌"}</span>
              <span className="f1 sm">{r.w.uz}</span>
              <span className="fw7" style={{ color: "var(--cyan)", fontSize: 13 }}>{r.w.kr}</span>
              {!r.ok && <span className="muted sm">→ {r.a || "—"}</span>}
            </div>
          ))}
        </div>
        <div className="f gap12">
          <button className="btn bp f1" onClick={() => { setPhase("setup"); setRes([]); }}>Qaytadan</button>
          <button className="btn bs f1" onClick={() => { setPhase("setup"); setRes([]); }}>Boshqa</button>
        </div>
      </div>
    );
  }

  if (phase === "voice") {
    const w = wrds[idx]; if (!w) return null;
    return (
      <div>
        <div className="ptitle">🎤 Ovozli Vazifa</div>
        {xpPops.map(p => <XPPop key={p.id} amt={p.amt} onDone={() => setXpPops(v => v.filter(x => x.id !== p.id))} />)}
        <div className="f ic jb mb16"><span className="muted sm">{idx + 1} / {wrds.length}</span><span className="fw7" style={{ color: "var(--cyan)" }}>🔥 {strRef.current}</span></div>
        <div className="qcard">
          <div className="muted sm mb10">Bu so'zni koreyscha ayting:</div>
          <div style={{ fontSize: 36, fontWeight: 700, color: "var(--cyan)", margin: "16px 0" }}>{w.uz}</div>
        </div>
        <div className="f fc ic gap18" style={{ padding: "32px 0" }}>
          <div className={`mic-btn${listening ? " listening" : ""}`} onClick={!listening && !voiceTx ? startVoice : undefined}>
            <div className="mic-ring" /><div className="mic-ring2" />
            <span style={{ position: "relative", zIndex: 1 }}>{listening ? "🔴" : "🎤"}</span>
          </div>
          {listening && <div className="muted sm">Eshitilmoqda...</div>}
          {voiceTx && !sts && (
            <div className="gc" style={{ width: "100%", maxWidth: 380 }}>
              <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 10, color: "var(--cyan)" }}>{voiceTx}</div>
              <div className="muted sm mb10">Talaffuz: {voiceScore}%</div>
              <div className="tmr-bg"><div className="tmr-fill" style={{ width: voiceScore + "%", background: voiceScore >= 70 ? "linear-gradient(90deg,var(--green),#00a84a)" : "linear-gradient(90deg,var(--red),#ff6b6b)" }} /></div>
              <div style={{ color: voiceScore >= 70 ? "var(--green)" : "var(--red)", fontWeight: 600, marginBottom: 14 }}>
                {voiceScore >= 90 ? "🌟 Mukammal!" : voiceScore >= 70 ? "👍 Yaxshi" : "❌ Qayta urinib ko'ring"}
              </div>
              <div className="f gap10 jc fw">
                <button className="btn bg f1" onClick={() => submitAnswer(voiceTx)}>Tasdiqlash ✓</button>
                <button className="btn bs f1" onClick={() => { setVoiceTx(null); setVoiceScore(null); }}>Qayta 🔄</button>
              </div>
            </div>
          )}
          {sts && <div style={{ textAlign: "center" }}>{sts === "ok" ? <div style={{ color: "var(--green)", fontWeight: 700, fontSize: 18 }}>✅ To'g'ri! {w.kr}</div> : <div style={{ color: "var(--red)", fontWeight: 700, fontSize: 18 }}>❌ Xato — {w.kr}</div>}</div>}
        </div>
      </div>
    );
  }

  if (phase === "test") {
    const w = wrds[idx]; if (!w) return null; const hot = tmr <= 5;
    return (
      <div>
        <div className="ptitle">✍️ Yozma Vazifa</div>
        {xpPops.map(p => <XPPop key={p.id} amt={p.amt} onDone={() => setXpPops(v => v.filter(x => x.id !== p.id))} />)}
        <div className="f ic jb mb14"><span className="muted sm">{idx + 1} / {wrds.length}</span><span className="fw7" style={{ color: hot ? "var(--red)" : "var(--cyan)", fontSize: 17 }}>{tmr}s</span></div>
        <div className="tmr-bg mb16"><div className={`tmr-fill${hot ? " hot" : ""}`} style={{ width: (tmr / 30) * 100 + "%" }} /></div>
        <div className={`qcard${sts === "ok" ? " ok" : sts === "err" ? " err" : ""}`}>
          <div className="muted sm mb10">Koreyschasini yozing:</div>
          <div style={{ fontSize: 36, fontWeight: 700, color: "var(--cyan)", margin: "14px 0" }}>{w.uz}</div>
          {sts === "ok" && <div style={{ color: "var(--green)", fontWeight: 700, marginTop: 10 }}>✅ To'g'ri! {w.kr}</div>}
          {sts === "err" && <div style={{ marginTop: 10 }}><div style={{ color: "var(--red)", fontWeight: 600 }}>❌ Xato</div><div style={{ color: "var(--cyan)", fontSize: 22, fontWeight: 700, marginTop: 6 }}>{w.kr}</div></div>}
        </div>
        <input ref={inpRef} className={`inp mb14${sts === "ok" ? " ok" : sts === "err" ? " err" : ""}`}
          value={inp} onChange={e => setInp(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !sts && inp.trim()) submitAnswer(inp); }}
          placeholder="Koreyscha yozing..." disabled={sts !== null}
          autoComplete="off" autoCapitalize="off" spellCheck={false}
          style={{ fontSize: 18, textAlign: "center", marginTop: 14 }} />
        <button className="btn bp w100" style={{ padding: "15px", fontSize: 15 }}
          disabled={sts !== null || !inp.trim()} onClick={() => submitAnswer(inp)}>Tekshirish ✓</button>
      </div>
    );
  }

  return (
    <div>
      <div className="ptitle">Uyga Vazifa</div>
      <p className="psub">Daraja, kva va turi tanlang</p>
      <div className="gc" style={{ maxWidth: 520 }}>
        <div className="mb22">
          <label className="sm muted mb10" style={{ display: "block", marginBottom: 10 }}>📍 Daraja</label>
          <div className="f gap8 fw">
            {Object.keys(ALL_DATA).map((l, i) => (
              <button key={l} className={`btn ${lvl === l ? "bp" : "bs"}`}
                style={{ padding: "9px 16px", fontSize: 13, animationDelay: (i * 0.05) + "s" }}
                onClick={() => { setLvl(l); setKva(null); }}>{l}</button>
            ))}
          </div>
        </div>
        {lvl && (
          <div className="mb22">
            <label className="sm muted" style={{ display: "block", marginBottom: 10 }}>📖 Kva</label>
            <div style={{ maxHeight: 260, overflowY: "auto", paddingRight: 4 }}>
              {(ALL_DATA[lvl] || []).map((k, i) => (
                <div key={k.kva} className={`kc${kva === k.kva ? " sel" : ""}`}
                  style={{ animationDelay: (i * 0.05) + "s" }} onClick={() => setKva(k.kva)}>
                  <div className="kc-num">{k.kva}</div>
                  <div className="f1"><div className="fw7 sm">{k.kva}-kva</div><div className="muted sm mt8">{k.words.length} ta so'z</div></div>
                  <span className="muted">{kva === k.kva ? "✓" : "→"}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="mb22">
          <label className="sm muted" style={{ display: "block", marginBottom: 10 }}>🎯 Test turi</label>
          <div className="f gap8 fw">
            {[{ v: "written", l: "✍️ Yozma" }, { v: "voice", l: "🎤 Ovozli" }].map((t, i) => (
              <button key={t.v} className={`btn ${typ === t.v ? "bp" : "bs"}`}
                style={{ padding: "9px 16px", fontSize: 13, animationDelay: (0.1 + i * 0.05) + "s" }}
                onClick={() => setTyp(t.v)}>{t.l}</button>
            ))}
          </div>
        </div>
        <div className="sep" />
        <div className="f ic jb mb14">
          <span className="muted sm">Daraja: <span style={{ color: "var(--cyan)", fontWeight: 700 }}>{lvl}</span></span>
          <span className="muted sm">So'z: <span style={{ color: "var(--cyan)", fontWeight: 700 }}>{(ALL_DATA[lvl]?.find(k => k.kva === kva)?.words.length || 0)} ta</span></span>
        </div>
        <button className="btn bp w100" style={{ padding: 15, fontSize: 15 }}
          disabled={!lvl || kva === null} onClick={startTest}>⚡ Boshlash</button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════
// PROFIL SAHIFASI
// ════════════════════════════════════════
function ProfilePage({ user, stats, onUpdateStats, onUpdateUser, onLogout }) {
  const [ed, setEd] = useState(false);
  const [en, setEn] = useState(user.name);
  const [sh, setSh] = useState(false);
  const xp = stats.xp || 0;
  const lvl = Math.floor(xp / 200) + 1;

  return (
    <div>
      <div className="ptitle">Profil</div>
      <div className="gc mb20 f ic gap20 fw">
        <div className="u-av" style={{ width: 70, height: 70, fontSize: 28, flexShrink: 0 }}>
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="f1" style={{ minWidth: 0 }}>
          {ed ? (
            <div className="f fc gap10">
              <input className="inp" value={en} onChange={e => setEn(e.target.value)} placeholder="Ismingiz" />
              <div className="f gap8">
                <button className="btn bp f1" onClick={() => { onUpdateUser({ ...user, name: en }); setEd(false); }}>Saqlash</button>
                <button className="btn bs f1" onClick={() => setEd(false)}>Bekor</button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{user.name}</div>
              <div className="muted sm mt8">@{user.login}</div>
              <div className="muted sm mt8">⚡ {xp} XP · 🏆 {lvl}-daraja</div>
            </>
          )}
        </div>
        {!ed && <button className="btn bs" style={{ flexShrink: 0 }} onClick={() => setEd(true)}>✏️</button>}
      </div>
      <div className="gc">
        <div className="fw7 mb14">⚠️ Xavfli Zona</div>
        <div className="f gap12 fw">
          <button className="btn bd f1" onClick={() => setSh(true)}>🔄 Statistikani tozalash</button>
          <button className="btn bd f1" onClick={onLogout}>🚪 Chiqish</button>
        </div>
      </div>
      {sh && (
        <div className="ov" onClick={() => setSh(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="tc mb18">
              <div style={{ fontSize: 46, marginBottom: 10 }}>⚠️</div>
              <div className="fw7" style={{ fontSize: 18 }}>Statistikani tozalash</div>
              <div className="muted sm mt8">Barcha ma'lumotlar o'chadi</div>
            </div>
            <div className="f gap12">
              <button className="btn bd f1" onClick={() => {
                const empty = { xp: 0, testsCompleted: 0, completedWords: 0, correctAnswers: 0, totalAnswers: 0 };
                onUpdateStats(() => empty);
                S.set("kc_stats_" + user.id, empty);
                S.set("kc_history_" + user.id, []);
                setSh(false);
              }}>Ha, tozalayman</button>
              <button className="btn bs f1" onClick={() => setSh(false)}>Bekor</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════
// MAIN APP
// ════════════════════════════════════════
export default function App() {
  const [intro, setIntro] = useState(true);
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("home");
  const [stats, setStats] = useState({});
  const [notifs, setNotifs] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIntro(false), 4200);
    return () => clearTimeout(t);
  }, []);

  const addNotif = (ic, tx) => {
    const id = Date.now() + Math.random();
    setNotifs(n => [...n, { id, ic, tx }]);
  };

  // XP qo'shish + tarixga yozish
  const addXP = useCallback((xp, source = "unknown", word = null) => {
    if (!xp || xp <= 0 || !user) return;
    const entry = { xp, source, word: word?.uz || null, ts: Date.now() };
    const histKey = "kc_history_" + user.id;
    const hist = S.get(histKey, []);
    hist.push(entry);
    S.set(histKey, hist);
  }, [user]);

  const updateStats = useCallback((updater) => {
    setStats(prev => {
      const ns = typeof updater === "function" ? updater(prev) : updater;
      if (user) S.set("kc_stats_" + user.id, ns);
      return ns;
    });
  }, [user]);

  const updateUser = (u) => {
    setUser(u);
    const users = S.get("kc_users", {});
    users[u.login] = u;
    S.set("kc_users", users);
  };

  const handleLogin = (u) => {
    setUser(u);
    const st = S.get("kc_stats_" + u.id, {});
    setStats(st);
    setPage("home");
    addNotif("👋", `Xush kelibsiz, ${u.name}!`);
  };

  const logout = () => {
    setUser(null); setStats({}); setPage("home"); setSidebarOpen(false);
  };

  const nav = [
    { id: "home", ic: "🏠", l: "Bosh sahifa" },
    { id: "vocabulary", ic: "📖", l: "Lug'atlar" },
    { id: "test", ic: "🧪", l: "Test" },
    { id: "homework", ic: "📚", l: "Uyga Vazifa" },
    { id: "statistics", ic: "📊", l: "Statistika" },
    { id: "ranking", ic: "🏆", l: "Reyting" },
    { id: "profile", ic: "👤", l: "Profil" },
  ];

  const goPage = (p) => { setPage(p); setSidebarOpen(false); };

  const renderPage = () => {
    if (!user) return null;
    const shared = { stats, onUpdateStats: updateStats, onXP: addXP, onNotif: addNotif };
    switch (page) {
      case "home": return <HomePage user={user} stats={stats} go={goPage} />;
      case "vocabulary": return <VocabularyPage />;
      case "test": return <TestPage       {...shared} />;
      case "homework": return <HomeworkPage   {...shared} />;
      case "statistics": return <StatisticsPage stats={stats} user={user} />;
      case "ranking": return <RankingPage user={user} />;
      case "profile": return <ProfilePage user={user} stats={stats} onUpdateStats={updateStats} onUpdateUser={updateUser} onLogout={logout} />;
      default: return null;
    }
  };

  return (
    <>
      <style>{CSS}</style>

      {/* INTRO */}
      {intro && (
        <div className="intro-wrap">
          <div className="intro-logo">Korean Center<br />AI Vocabulary</div>
          <div className="intro-sub">SUN'IY INTELLEKT PLATFORMASI</div>
          <div className="intro-bar-wrap"><div className="intro-bar" /></div>
        </div>
      )}

      {/* AUTH */}
      {!user && !intro && <AuthPage onLogin={handleLogin} />}

      {/* APP */}
      {user && (
        <div className="app">
          <div className={`sidebar-overlay${sidebarOpen ? " open" : ""}`} onClick={() => setSidebarOpen(false)} />
          <div className={`sidebar${sidebarOpen ? " open" : ""}`}>
            <div className="sb-logo">
              <div className="sb-logo-t">KC AI</div>
              <div className="sb-logo-s">VOCABULARY</div>
            </div>
            {nav.map((n, i) => (
              <div key={n.id} className={`nav-i${page === n.id ? " on" : ""}`}
                style={{ animationDelay: (i * 0.07) + "s" }}
                onClick={() => goPage(n.id)}>
                <span className="nic">{n.ic}</span><span>{n.l}</span>
              </div>
            ))}
            <div className="sb-bot">
              <div className="user-mini" onClick={() => goPage("profile")}>
                <div className="u-av">{user.name.charAt(0).toUpperCase()}</div>
                <div style={{ minWidth: 0 }}>
                  <div className="u-name">{user.name}</div>
                  <div className="u-xp">⚡ {stats.xp || 0} XP</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
            <div className="mob-topbar">
              <div className="mob-menu-btn" onClick={() => setSidebarOpen(v => !v)}>☰</div>
              <div className="mob-logo">KC AI</div>
              <div className="mob-xp">⚡ {stats.xp || 0}</div>
            </div>
            <div className="main">{renderPage()}</div>
            <div className="mob-nav">
              <div className="mob-nav-row">
                {[nav[0], nav[1], nav[2], nav[4], nav[6]].map(n => (
                  <div key={n.id} className={`mob-ni${page === n.id ? " on" : ""}`}
                    onClick={() => goPage(n.id)}>
                    <span className="nic">{n.ic}</span>
                    <span>{n.l.split(" ")[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="notif-container">
        {notifs.slice(-3).map(n => (
          <Notif key={n.id} ic={n.ic} tx={n.tx}
            onDone={() => setNotifs(v => v.filter(x => x.id !== n.id))} />
        ))}
      </div>
    </>
  );
}