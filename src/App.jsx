import { useState, useEffect, useRef, useCallback } from "react";

import data1A from "./data/1A";
import data1B from "./data/1B";
import data2A from "./data/2A";
import data2B from "./data/2B";
import data3A from "./data/3A";
import data3B from "./data/3B";

const ALL_DATA = { "1A": data1A, "1B": data1B, "2A": data2A, "2B": data2B, "3A": data3A, "3B": data3B };

const fuzzyMatch = (a, b) => {
  const x = a.trim().toLowerCase();
  const y = b.trim().toLowerCase();
  if (x === y) return 100;
  let m = 0;
  const shorter = x.length < y.length ? x : y;
  const longer = x.length >= y.length ? x : y;
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) m++;
  }
  return Math.round((m / longer.length) * 100);
};

// ── Storage: localStorage bilan ishlaydi, xato bo'lsa in-memory fallback
const memStore = {};
const S = {
  get: (k, d = null) => {
    try {
      const v = localStorage.getItem(k);
      return v ? JSON.parse(v) : (k in memStore ? memStore[k] : d);
    } catch {
      return k in memStore ? memStore[k] : d;
    }
  },
  set: (k, v) => {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
    memStore[k] = v;
  },
};

const beep = (t) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    const now = ctx.currentTime;
    if (t === "ok") {
      o.frequency.setValueAtTime(523, now);
      o.frequency.setValueAtTime(784, now + 0.1);
      g.gain.setValueAtTime(0.3, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      o.start(now); o.stop(now + 0.4);
    } else {
      o.frequency.setValueAtTime(220, now);
      o.frequency.setValueAtTime(160, now + 0.15);
      g.gain.setValueAtTime(0.3, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      o.start(now); o.stop(now + 0.35);
    }
  } catch {}
};

// ── CSS: position:fixed olib tashlandi, responsive to'g'rilandi
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
  overflow-x:hidden;
  min-height:100vh;
}

/* ── Intro: fixed → absolute wrapper ichida */
.intro-wrap{
  position:fixed;inset:0;
  background:linear-gradient(135deg,#000,#0a0f15);
  z-index:9999;
  display:flex;align-items:center;justify-content:center;flex-direction:column;gap:20px;
  animation:introOut 0.5s 3.8s forwards;
  pointer-events:all;
}
.intro-logo{
  font-family:'Orbitron';font-size:clamp(28px,6vw,48px);font-weight:900;
  background:linear-gradient(135deg,var(--cyan),var(--purple),var(--pink));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;
  animation:logoFloat 1s ease-out;letter-spacing:4px;text-align:center;
  line-height:1.3;
}
.intro-sub{font-size:11px;letter-spacing:3px;color:var(--cyan);animation:fadeInUp 1s 0.3s ease-out backwards}
.intro-bar-wrap{width:min(400px,80vw);height:2px;background:rgba(255,255,255,0.1);overflow:hidden;animation:fadeInUp 1s 0.6s ease-out backwards}
.intro-bar{height:100%;background:linear-gradient(90deg,var(--cyan),var(--purple));animation:barFill 2s 0.8s ease-out forwards;width:0}
@keyframes logoFloat{from{opacity:0;transform:translateY(20px) scale(0.8)}to{opacity:1;transform:none}}
@keyframes fadeInUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes barFill{to{width:100%}}
@keyframes introOut{to{opacity:0;pointer-events:none;visibility:hidden}}

/* ── Layout */
.app{display:flex;min-height:100vh;position:relative;z-index:1}

.sidebar{
  position:fixed;top:0;left:0;width:var(--sidebar-w);height:100vh;
  background:rgba(15,20,25,0.97);border-right:1px solid var(--border);
  display:flex;flex-direction:column;z-index:200;
  padding:24px 0;backdrop-filter:blur(20px);
  transition:transform 0.3s cubic-bezier(0.4,0,0.2,1);
  will-change:transform;
}
.sidebar-overlay{
  display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);
  z-index:199;backdrop-filter:blur(4px);
}
.sb-logo{padding:0 20px 24px;border-bottom:1px solid var(--border)}
.sb-logo-t{
  font-family:'Orbitron';font-size:13px;font-weight:700;
  background:linear-gradient(135deg,var(--cyan),var(--purple));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;
  letter-spacing:2px;
}
.sb-logo-s{color:var(--text2);font-size:10px;margin-top:2px;font-family:'JetBrains Mono'}
.nav-i{
  display:flex;align-items:center;gap:12px;padding:13px 20px;
  cursor:pointer;transition:all 0.25s cubic-bezier(0.4,0,0.2,1);
  border-left:3px solid transparent;font-size:14px;color:var(--text2);
}
.nav-i:hover{color:var(--text);background:var(--glass2);transform:translateX(4px)}
.nav-i.on{
  color:var(--cyan);border-left-color:var(--cyan);
  background:rgba(0,217,255,0.1);
  box-shadow:inset 0 0 20px rgba(0,217,255,0.05);
}
.nav-i .nic{font-size:18px;min-width:20px}
.sb-bot{margin-top:auto;padding:16px 20px;border-top:1px solid var(--border)}
.user-mini{
  display:flex;align-items:center;gap:10px;cursor:pointer;
  padding:10px;border-radius:12px;transition:all 0.25s;background:var(--glass);
}
.user-mini:hover{background:var(--glass2);transform:translateY(-2px)}
.u-av{
  width:38px;height:38px;border-radius:50%;flex-shrink:0;
  background:linear-gradient(135deg,var(--cyan),var(--purple));
  display:flex;align-items:center;justify-content:center;
  font-weight:700;font-size:15px;color:#000;
  box-shadow:var(--glow-cyan);
}
.u-name{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.u-xp{font-size:11px;color:var(--cyan);font-family:'JetBrains Mono'}

.main{
  margin-left:var(--sidebar-w);min-height:100vh;padding:32px;
  flex:1;animation:mainIn 0.5s ease-out;
}
@keyframes mainIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:none}}

/* ── Mobile top bar */
.mob-topbar{
  display:none;position:sticky;top:0;z-index:150;
  background:rgba(15,20,25,0.97);border-bottom:1px solid var(--border);
  padding:0 16px;height:56px;
  align-items:center;justify-content:space-between;
  backdrop-filter:blur(20px);
}
.mob-menu-btn{
  width:40px;height:40px;border-radius:10px;border:1px solid var(--border);
  background:var(--glass);display:flex;align-items:center;justify-content:center;
  cursor:pointer;font-size:20px;color:var(--text2);transition:all 0.2s;
}
.mob-menu-btn:hover{color:var(--cyan);border-color:rgba(0,217,255,0.3)}
.mob-logo{
  font-family:'Orbitron';font-size:14px;font-weight:700;
  background:linear-gradient(135deg,var(--cyan),var(--purple));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;
}
.mob-xp{font-size:12px;color:var(--gold);font-family:'JetBrains Mono'}

/* ── Bottom nav (mobile) */
.mob-nav{
  display:none;position:sticky;bottom:0;z-index:150;
  background:rgba(15,20,25,0.98);border-top:1px solid var(--border);
  padding:6px 0 max(6px,env(safe-area-inset-bottom));
  backdrop-filter:blur(20px);
}
.mob-nav-row{display:flex;justify-content:space-around}
.mob-ni{
  display:flex;flex-direction:column;align-items:center;gap:3px;
  padding:6px 10px;cursor:pointer;color:var(--text2);font-size:10px;
  transition:all 0.2s;min-width:48px;
}
.mob-ni.on{color:var(--cyan)}
.mob-ni .nic{font-size:22px}

/* ── Page titles */
.ptitle{
  font-family:'Orbitron';font-size:clamp(24px,5vw,36px);font-weight:900;
  background:linear-gradient(135deg,var(--cyan),var(--purple));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;
  margin-bottom:8px;letter-spacing:2px;
  animation:titleIn 0.5s cubic-bezier(0.34,1.56,0.64,1);
}
@keyframes titleIn{from{opacity:0;transform:translateY(-16px)}to{opacity:1;transform:none}}
.psub{color:var(--text2);font-size:14px;margin-bottom:28px;animation:fadeInUp 0.7s 0.15s ease-out backwards}

/* ── Cards */
.gc{
  background:var(--glass);border:1px solid var(--border);
  border-radius:20px;padding:22px;transition:all 0.3s;
  position:relative;overflow:hidden;
  animation:cardIn 0.5s cubic-bezier(0.34,1.56,0.64,1) backwards;
}
.gc::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(0,217,255,0.08),transparent);opacity:0;transition:opacity 0.3s;pointer-events:none}
.gc:hover{border-color:rgba(0,217,255,0.28);box-shadow:var(--glow-cyan);transform:translateY(-3px)}
.gc:hover::before{opacity:1}
@keyframes cardIn{from{opacity:0;transform:scale(0.96) translateY(8px)}to{opacity:1;transform:none}}

.g3{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px}

.lc{
  background:var(--glass);border:1px solid var(--border);
  border-radius:22px;padding:24px;cursor:pointer;
  transition:all 0.35s cubic-bezier(0.34,1.56,0.64,1);
  text-align:center;position:relative;overflow:hidden;
  animation:cardIn 0.5s ease-out backwards;
}
.lc::after{content:'';position:absolute;inset:0;background:radial-gradient(circle at 50% 0%,rgba(0,217,255,0.08),transparent);opacity:0;transition:opacity 0.3s;pointer-events:none}
.lc:hover{transform:translateY(-10px) scale(1.02);box-shadow:0 20px 50px rgba(0,217,255,0.25),var(--glow-cyan);border-color:var(--cyan)}
.lc:hover::after{opacity:1}
.lc-badge{
  font-family:'Orbitron';font-size:36px;font-weight:900;
  background:linear-gradient(135deg,var(--cyan),var(--purple));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;
  margin-bottom:10px;position:relative;z-index:1;
}

.kc{
  background:var(--glass);border:1px solid var(--border);
  border-radius:14px;padding:16px 18px;cursor:pointer;
  transition:all 0.25s cubic-bezier(0.34,1.56,0.64,1);
  display:flex;align-items:center;gap:14px;margin-bottom:8px;
  animation:cardIn 0.5s ease-out backwards;
}
.kc:hover{border-color:rgba(179,68,255,0.35);background:var(--glass2);transform:translateX(6px)}
.kc.sel{border-color:var(--cyan);background:rgba(0,217,255,0.09);box-shadow:inset 0 0 20px rgba(0,217,255,0.04),var(--glow-cyan)}
.kc-num{
  width:42px;height:42px;border-radius:11px;flex-shrink:0;
  background:linear-gradient(135deg,rgba(0,217,255,0.1),rgba(179,68,255,0.1));
  border:1px solid rgba(0,217,255,0.18);
  display:flex;align-items:center;justify-content:center;
  font-family:'Orbitron';font-size:13px;color:var(--cyan);font-weight:700;
}

.wc{
  background:var(--glass);border:1px solid var(--border);
  border-radius:14px;padding:18px;transition:all 0.25s;
  animation:cardIn 0.5s ease-out backwards;
}
.wc:hover{border-color:rgba(179,68,255,0.28);box-shadow:var(--glow-purple);transform:translateY(-3px)}
.wc-kr{font-size:28px;font-weight:700;color:var(--cyan);margin-bottom:5px}
.wc-uz{font-size:15px;color:var(--text)}

.sc{
  background:var(--glass);border:1px solid var(--border);
  border-radius:18px;padding:20px;
  display:flex;flex-direction:column;gap:8px;
  animation:cardIn 0.5s ease-out backwards;
}
.sc-lbl{color:var(--text2);font-size:11px;text-transform:uppercase;letter-spacing:2px;font-weight:600}
.sc-val{
  font-family:'Orbitron';font-size:28px;font-weight:900;
  background:linear-gradient(135deg,var(--cyan),var(--purple));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;
}

/* ── Buttons */
.btn{
  display:inline-flex;align-items:center;justify-content:center;gap:7px;
  padding:12px 24px;border-radius:13px;border:none;cursor:pointer;
  font-family:-apple-system,'Noto Sans KR',sans-serif;
  font-size:14px;font-weight:600;transition:all 0.25s;
  position:relative;overflow:hidden;
  animation:cardIn 0.5s ease-out backwards;
  white-space:nowrap;
}
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

/* ── Input */
.inp{
  width:100%;background:var(--glass);border:1px solid var(--border);
  border-radius:13px;padding:14px 18px;color:var(--text);
  font-family:-apple-system,'Noto Sans KR',sans-serif;font-size:16px;outline:none;
  transition:all 0.25s;
}
.inp:focus{border-color:var(--cyan);box-shadow:0 0 0 3px rgba(0,217,255,0.1);transform:translateY(-2px)}
.inp::placeholder{color:var(--text2)}
.inp.ok{border-color:var(--green);box-shadow:var(--glow-green)}
.inp.err{border-color:var(--red);box-shadow:var(--glow-red);animation:shake 0.4s}
@keyframes shake{0%,100%{transform:translateX(0)}15%,45%,75%{transform:translateX(-7px)}30%,60%,90%{transform:translateX(7px)}}

/* ── Overlay / Modal */
.ov{
  position:fixed;inset:0;background:rgba(0,0,0,0.72);
  z-index:1000;display:flex;align-items:center;justify-content:center;
  padding:20px;backdrop-filter:blur(10px);
  animation:ovIn 0.25s;
}
@keyframes ovIn{from{opacity:0}to{opacity:1}}
.modal{
  background:linear-gradient(135deg,var(--bg2),var(--bg3));
  border:1px solid var(--border2);border-radius:26px;padding:28px;
  width:100%;max-width:440px;
  box-shadow:0 40px 80px rgba(0,0,0,0.5),var(--glow-purple);
  animation:modalPop 0.35s cubic-bezier(0.34,1.56,0.64,1);
}
@keyframes modalPop{from{opacity:0;transform:scale(0.9) translateY(20px)}to{opacity:1;transform:none}}

/* ── Quiz card */
.qcard{
  background:var(--glass);border:2px solid var(--border);
  border-radius:22px;padding:28px;text-align:center;
  margin-bottom:20px;transition:border-color 0.2s,box-shadow 0.2s;
  animation:cardIn 0.5s ease-out;
}
.qcard.ok{border-color:var(--green);background:rgba(0,210,106,0.04);box-shadow:var(--glow-green)}
.qcard.err{border-color:var(--red);background:rgba(255,56,56,0.04);box-shadow:var(--glow-red);animation:shake 0.4s}

/* ── Timer bar */
.tmr-bg{height:4px;background:rgba(255,255,255,0.06);border-radius:2px;overflow:hidden;margin-bottom:18px}
.tmr-fill{height:100%;background:linear-gradient(90deg,var(--cyan),var(--purple));transition:width 1s linear;box-shadow:0 0 8px var(--cyan)}
.tmr-fill.hot{background:linear-gradient(90deg,var(--red),var(--orange));box-shadow:0 0 12px var(--red)}

/* ── Mic button */
.mic-btn{
  width:130px;height:130px;border-radius:50%;
  background:radial-gradient(circle,rgba(0,217,255,0.08),transparent);
  border:2px solid var(--cyan);
  display:flex;align-items:center;justify-content:center;
  cursor:pointer;position:relative;transition:all 0.25s;font-size:44px;
  box-shadow:inset 0 0 18px rgba(0,217,255,0.08);
}
.mic-btn:hover{transform:scale(1.05);box-shadow:var(--glow-cyan)}
.mic-btn.listening{border-color:var(--red);animation:micPulse 1s infinite;box-shadow:0 0 28px rgba(255,56,56,0.45)}
@keyframes micPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
.mic-ring{position:absolute;inset:-12px;border:1px solid rgba(0,217,255,0.25);border-radius:50%;animation:ringEx 2s infinite}
.mic-ring2{position:absolute;inset:-24px;border:1px solid rgba(0,217,255,0.12);border-radius:50%;animation:ringEx 2s 0.5s infinite}
@keyframes ringEx{0%{opacity:1;transform:scale(0.8)}100%{opacity:0;transform:scale(1.35)}}

/* ── Result score */
.res-score{
  font-family:'Orbitron';font-size:clamp(56px,12vw,80px);font-weight:900;
  background:linear-gradient(135deg,var(--cyan),var(--purple));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;
  animation:scorePop 0.7s cubic-bezier(0.34,1.56,0.64,1);
}
@keyframes scorePop{from{opacity:0;transform:scale(0.5)}to{opacity:1;transform:none}}

/* ── Ranking */
.rk-item{
  display:flex;align-items:center;gap:14px;padding:16px 18px;
  border-radius:14px;background:var(--glass);border:1px solid var(--border);
  margin-bottom:8px;transition:all 0.25s;
  animation:cardIn 0.5s ease-out backwards;
}
.rk-item:hover{border-color:rgba(0,217,255,0.28);transform:translateX(6px) scale(1.01)}
.rk-item.me{border-color:rgba(0,217,255,0.35);background:rgba(0,217,255,0.07);box-shadow:var(--glow-cyan)}
.rk-num{font-family:'Orbitron';font-size:18px;font-weight:900;min-width:38px;text-align:center}
.rk-av{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:17px;color:#000;flex-shrink:0}
.rk-xp{font-family:'Orbitron';font-size:17px;font-weight:700;color:var(--gold)}

/* ── Badges */
.bdg{display:inline-flex;align-items:center;gap:5px;padding:7px 13px;border-radius:18px;font-size:12px;font-weight:700;border:1px solid;animation:cardIn 0.5s ease-out backwards}
.bdg-c{background:rgba(0,217,255,0.09);border-color:rgba(0,217,255,0.28);color:var(--cyan)}
.bdg-g{background:rgba(0,210,106,0.09);border-color:rgba(0,210,106,0.28);color:var(--green)}

/* ── Back btn */
.back{display:inline-flex;align-items:center;gap:7px;color:var(--text2);cursor:pointer;font-size:14px;margin-bottom:22px;transition:all 0.2s}
.back:hover{color:var(--cyan);transform:translateX(-4px)}

/* ── XP Popup — absolute not fixed */
.xp-popup-wrap{position:relative;height:0;overflow:visible;pointer-events:none}
.xp-popup{
  position:absolute;pointer-events:none;
  font-family:'Orbitron';font-size:18px;font-weight:900;
  color:var(--gold);text-shadow:0 0 16px var(--gold);
  animation:xpFloat 1.5s ease-out forwards;
  white-space:nowrap;
}
@keyframes xpFloat{0%{opacity:0;transform:translateY(0) scale(0.6)}20%{opacity:1;transform:translateY(-10px) scale(1)}80%{opacity:1;transform:translateY(-55px)}100%{opacity:0;transform:translateY(-90px) scale(0.7)}}

/* ── Notification — relative in a container */
.notif-container{position:fixed;top:20px;right:20px;z-index:9000;display:flex;flex-direction:column;gap:10px;pointer-events:none}
.notif{
  background:linear-gradient(135deg,var(--bg2),var(--bg3));
  border:1px solid var(--border2);border-radius:14px;padding:14px 18px;
  min-width:260px;max-width:320px;box-shadow:var(--glow-purple);
  animation:notifIn 0.35s ease-out,notifOut 0.35s 3s forwards;
  display:flex;align-items:center;gap:10px;
  pointer-events:all;
}
@keyframes notifIn{from{opacity:0;transform:translateX(80px)}to{opacity:1;transform:none}}
@keyframes notifOut{to{opacity:0;transform:translateX(80px)}}

/* ── Utility */
.f{display:flex}.fc{flex-direction:column}.fw{flex-wrap:wrap}
.ic{align-items:center}.jb{justify-content:space-between}.jc{justify-content:center}
.f1{flex:1;min-width:0}.w100{width:100%}.tc{text-align:center}
.mb8{margin-bottom:8px}.mb12{margin-bottom:12px}.mb16{margin-bottom:16px}
.mb20{margin-bottom:20px}.mb24{margin-bottom:24px}
.mt8{margin-top:8px}.mt12{margin-top:12px}.mt16{margin-top:16px}
.gap8{gap:8px}.gap12{gap:12px}.gap16{gap:16px}.gap20{gap:20px}.gap24{gap:24px}
.sm{font-size:12px}.muted{color:var(--text2)}.fw7{font-weight:700}
.sep{height:1px;background:var(--border);margin:20px 0}

/* ── Responsive */
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

// ── Progress ring
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

// ══════════════ PAGES ══════════════

function HomePage({ user, stats, go }) {
  const xp = stats.xp || 0, tests = stats.testsCompleted || 0, words = stats.completedWords || 0;
  const lvl = Math.floor(xp / 200) + 1;
  return (
    <div>
      <div className="ptitle">Bosh Sahifa</div>
      <p className="psub">Assalomu alaykum, <b>{user.name}</b>! 🎌</p>
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
      <div className="f gap16 mb16 fw">
        <div className="gc f1" style={{ minWidth: 200 }}>
          <div className="f ic jb mb10">
            <div className="fw7">Uyga Vazifa</div><span style={{ fontSize: 26 }}>📚</span>
          </div>
          <div className="muted sm mb14">Kva tanlang va topshiring</div>
          <button className="btn bp w100" onClick={() => go("homework")}>Boshlash →</button>
        </div>
        <div className="gc f1" style={{ minWidth: 200 }}>
          <div className="f ic jb mb10">
            <div className="fw7">Statistika</div><span style={{ fontSize: 26 }}>📊</span>
          </div>
          <div className="muted sm mb14">Natijalarni ko'rish</div>
          <button className="btn bp w100" onClick={() => go("statistics")}>Ko'rish →</button>
        </div>
      </div>
    </div>
  );
}

function VocabularyPage() {
  const [view, setView] = useState("levels");
  const [lvl, setLvl] = useState(null);
  const [kva, setKva] = useState(null);

  if (view === "words" && lvl && kva !== null) {
    const kData = ALL_DATA[lvl]?.find(k => k.kva === kva);
    if (!kData) return null;
    return (
      <div>
        <div className="back" onClick={() => setView("kvas")}>← {lvl}</div>
        <div className="ptitle">{lvl} · {kva}-kva</div>
        <p className="psub">{kData.words.length} ta so'z</p>
        <div className="g3">
          {kData.words.map((w, i) => (
            <div key={w.id} className="wc" style={{ animationDelay: (i * 0.04) + "s" }}>
              <div className="wc-kr">{w.kr}</div>
              <div className="wc-uz">{w.uz}</div>
            </div>
          ))}
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
            onClick={() => { setKva(k.kva); setView("words"); }}>
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

// ── HomeworkPage: barcha state bug'lari to'g'irlandi
function HomeworkPage({ stats, onUpdateStats, onXP, onNotif }) {
  const [phase, setPhase] = useState("setup");
  const [lvl, setLvl] = useState("1A");
  const [kva, setKva] = useState(null);
  const [typ, setTyp] = useState("written");

  // Test state — ref bilan manage qilamiz (stale closure muammosidan qochish uchun)
  const [wrds, setWrds] = useState([]);
  const [idx, setIdx] = useState(0);
  const [inp, setInp] = useState("");
  const [sts, setSts] = useState(null); // null | "ok" | "err"
  const [tmr, setTmr] = useState(30);
  const [res, setRes] = useState([]);
  const [listening, setListening] = useState(false);
  const [voiceTx, setVoiceTx] = useState(null);
  const [voiceScore, setVoiceScore] = useState(null);
  const [xpPops, setXpPops] = useState([]);

  const inpRef = useRef();
  const tmrRef = useRef();
  // Stale closure'dan qochish uchun ref'lar
  const wrdsRef = useRef([]);
  const idxRef = useRef(0);
  const resRef = useRef([]);
  const stsRef = useRef(null);
  const scoreRef = useRef(0);
  const xpEarnedRef = useRef(0);
  const strRef = useRef(0);

  const resetRefs = () => {
    resRef.current = [];
    stsRef.current = null;
    scoreRef.current = 0;
    xpEarnedRef.current = 0;
    strRef.current = 0;
    idxRef.current = 0;
  };

  const startTest = () => {
    if (!lvl || kva === null) return;
    const kData = ALL_DATA[lvl]?.find(k => k.kva === kva);
    if (!kData || kData.words.length === 0) { onNotif("❌", "Bu kvada so'z yo'q"); return; }
    const shuf = [...kData.words].sort(() => Math.random() - 0.5);
    resetRefs();
    wrdsRef.current = shuf;
    setWrds(shuf);
    setIdx(0); setInp(""); setSts(null);
    setTmr(30); setRes([]); setVoiceTx(null); setVoiceScore(null);
    setPhase(typ === "voice" ? "voice" : "test");
    setTimeout(() => inpRef.current?.focus(), 80);
  };

  // Timer: sts va phase'ni ref orqali o'qiymiz
  useEffect(() => {
    if (phase !== "test") return;
    clearInterval(tmrRef.current);
    if (stsRef.current !== null) return;
    setTmr(30);
    tmrRef.current = setInterval(() => {
      setTmr(t => {
        if (t <= 1) {
          clearInterval(tmrRef.current);
          if (stsRef.current === null) submitAnswer("", true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(tmrRef.current);
  }, [phase, idx]); // idx o'zgarganda qayta ishga tushadi

  const finishTest = useCallback(() => {
    const total = resRef.current.length;
    const correct = resRef.current.filter(r => r.ok).length;
    const totalXP = xpEarnedRef.current;

    const ns = { ...stats };
    ns.xp = (ns.xp || 0) + totalXP;
    ns.testsCompleted = (ns.testsCompleted || 0) + 1;
    ns.totalAnswers = (ns.totalAnswers || 0) + total;
    ns.correctAnswers = (ns.correctAnswers || 0) + correct;
    ns.completedWords = (ns.completedWords || 0) + correct;

    const rk = S.get("kc_ranking", []);
    rk.push({ name: S.get("kc_user")?.name || "?", xp: totalXP, date: Date.now() });
    S.set("kc_ranking", rk);

    onUpdateStats(ns);
    onNotif("🎉", `Vazifa topshirildi! +${totalXP} XP`);
    setPhase("result");
  }, [stats, onUpdateStats, onNotif]);

  const submitAnswer = useCallback((answer, fromTimer = false) => {
    clearInterval(tmrRef.current);
    if (stsRef.current !== null) return; // double-submit himoya

    const words = wrdsRef.current;
    const i = idxRef.current;
    const w = words[i];
    const m = fuzzyMatch(answer, w.kr);
    const ok = m >= 78;
    const xp = ok ? 10 : 0;

    stsRef.current = ok ? "ok" : "err";
    setSts(ok ? "ok" : "err");

    const newRes = [...resRef.current, { w, a: answer, ok, m }];
    resRef.current = newRes;
    setRes([...newRes]);

    if (ok) {
      scoreRef.current += 1;
      xpEarnedRef.current += xp;
      strRef.current += 1;
      beep("ok");
      onXP(xp);
      const pid = Date.now();
      setXpPops(p => [...p, { id: pid, amt: xp }]);
      setTimeout(() => setXpPops(p => p.filter(x => x.id !== pid)), 1700);
    } else {
      strRef.current = 0;
      beep("fail");
    }

    setTimeout(() => {
      const nextIdx = i + 1;
      if (nextIdx >= words.length) {
        finishTest();
      } else {
        idxRef.current = nextIdx;
        setIdx(nextIdx);
        stsRef.current = null;
        setSts(null);
        setInp("");
        setTmr(30);
        setVoiceTx(null);
        setVoiceScore(null);
        setTimeout(() => inpRef.current?.focus(), 60);
      }
    }, 1200);
  }, [finishTest, onXP]);

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { onNotif("❌", "Brauzer ovozni qo'llab-quvvatlamaydi"); return; }
    const rec = new SR();
    rec.lang = "ko-KR"; rec.interimResults = false;
    setListening(true); setVoiceTx(null); setVoiceScore(null);
    rec.onresult = e => {
      const tx = e.results[0][0].transcript;
      const sc = fuzzyMatch(tx, wrdsRef.current[idxRef.current]?.kr || "");
      setVoiceTx(tx); setVoiceScore(sc); setListening(false);
    };
    rec.onerror = () => { setListening(false); onNotif("❌", "Mikrofon xatosi"); };
    rec.onend = () => setListening(false);
    try { rec.start(); } catch { onNotif("❌", "Mikrofon ochilmadi"); }
  };

  // ── Result view
  if (phase === "result") {
    const pct = wrds.length > 0 ? Math.round((scoreRef.current / wrds.length) * 100) : 0;
    return (
      <div>
        <div className="ptitle">Natija</div>
        <div className="gc mb20">
          <div className="tc" style={{ padding: "32px 0" }}>
            <div className="res-score">{pct}%</div>
            <div className="muted sm mt12">{scoreRef.current} / {wrds.length} to'g'ri javob</div>
            <div className="f jc gap12 mt16 fw">
              <span className="bdg bdg-g">+{xpEarnedRef.current} XP</span>
              <span className="bdg bdg-c">{pct >= 80 ? "🌟 A'lo" : pct >= 60 ? "👍 Yaxshi" : "💪 Davom et"}</span>
            </div>
          </div>
        </div>
        <div className="gc mb20">
          <div className="fw7 mb14">Natijalar</div>
          {res.map((r, i) => (
            <div key={i} className="f ic gap10 mb8" style={{
              padding: "10px 14px", borderRadius: 11,
              background: r.ok ? "rgba(0,210,106,.07)" : "rgba(255,56,56,.07)",
              border: `1px solid ${r.ok ? "rgba(0,210,106,.2)" : "rgba(255,56,56,.2)"}`,
              animation: "cardIn 0.5s ease-out backwards",
              animationDelay: (i * 0.04) + "s",
            }}>
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

  // ── Voice test view
  if (phase === "voice") {
    const w = wrds[idx];
    if (!w) return null;
    return (
      <div>
        <div className="ptitle">🎤 Ovozli Test</div>
        {xpPops.map(p => <XPPop key={p.id} amt={p.amt} onDone={() => setXpPops(v => v.filter(x => x.id !== p.id))} />)}
        <div className="f ic jb mb16" style={{ padding: "8px 0" }}>
          <span className="muted sm">{idx + 1} / {wrds.length}</span>
          <span className="fw7" style={{ color: "var(--cyan)", fontSize: 15 }}>🔥 {strRef.current}</span>
        </div>
        <div className="qcard">
          <div className="muted sm mb10">Bu so'zni koreyscha ayting:</div>
          <div style={{ fontSize: 36, fontWeight: 700, color: "var(--cyan)", margin: "16px 0" }}>{w.uz}</div>
        </div>
        <div className="f fc ic gap18" style={{ padding: "32px 0" }}>
          <div className={`mic-btn${listening ? " listening" : ""}`}
            onClick={!listening && !voiceTx ? startVoice : undefined}>
            <div className="mic-ring" /><div className="mic-ring2" />
            <span style={{ position: "relative", zIndex: 1 }}>{listening ? "🔴" : "🎤"}</span>
          </div>
          {listening && <div className="muted sm">Eshitilmoqda...</div>}
          {voiceTx && !sts && (
            <div className="gc" style={{ width: "100%", maxWidth: 380 }}>
              <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 10, color: "var(--cyan)" }}>{voiceTx}</div>
              <div className="muted sm mb10">Talaffuz: {voiceScore}%</div>
              <div className="tmr-bg">
                <div className="tmr-fill" style={{
                  width: voiceScore + "%",
                  background: voiceScore >= 70 ? "linear-gradient(90deg,var(--green),#00a84a)" : "linear-gradient(90deg,var(--red),#ff6b6b)"
                }} />
              </div>
              <div style={{ color: voiceScore >= 70 ? "var(--green)" : "var(--red)", fontWeight: 600, marginBottom: 14 }}>
                {voiceScore >= 90 ? "🌟 Mukammal!" : voiceScore >= 70 ? "👍 Yaxshi" : "❌ Qayta urinib ko'ring"}
              </div>
              <div className="f gap10 jc fw">
                <button className="btn bg f1" onClick={() => submitAnswer(voiceTx)}>Tasdiqlash ✓</button>
                <button className="btn bs f1" onClick={() => { setVoiceTx(null); setVoiceScore(null); }}>Qayta 🔄</button>
              </div>
            </div>
          )}
          {sts && (
            <div style={{ textAlign: "center" }}>
              {sts === "ok"
                ? <div style={{ color: "var(--green)", fontWeight: 700, fontSize: 18 }}>✅ To'g'ri! {w.kr}</div>
                : <div style={{ color: "var(--red)", fontWeight: 700, fontSize: 18 }}>❌ Xato — {w.kr}</div>
              }
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Written test view
  if (phase === "test") {
    const w = wrds[idx];
    if (!w) return null;
    const hot = tmr <= 5;
    return (
      <div>
        <div className="ptitle">✍️ Yozma Test</div>
        {xpPops.map(p => <XPPop key={p.id} amt={p.amt} onDone={() => setXpPops(v => v.filter(x => x.id !== p.id))} />)}
        <div className="f ic jb mb14" style={{ padding: "8px 0" }}>
          <span className="muted sm">{idx + 1} / {wrds.length}</span>
          <span className="fw7" style={{ color: hot ? "var(--red)" : "var(--cyan)", fontSize: 17 }}>{tmr}s</span>
        </div>
        <div className="tmr-bg" style={{ marginBottom: 16 }}>
          <div className={`tmr-fill${hot ? " hot" : ""}`} style={{ width: (tmr / 30) * 100 + "%" }} />
        </div>
        <div className={`qcard${sts === "ok" ? " ok" : sts === "err" ? " err" : ""}`}>
          <div className="muted sm mb10">Koreyschasini yozing:</div>
          <div style={{ fontSize: 36, fontWeight: 700, color: "var(--cyan)", margin: "14px 0" }}>{w.uz}</div>
          {sts === "ok" && <div style={{ color: "var(--green)", fontWeight: 700, marginTop: 10 }}>✅ To'g'ri! {w.kr}</div>}
          {sts === "err" && (
            <div style={{ marginTop: 10 }}>
              <div style={{ color: "var(--red)", fontWeight: 600 }}>❌ Xato</div>
              <div style={{ color: "var(--cyan)", fontSize: 22, fontWeight: 700, marginTop: 6 }}>{w.kr}</div>
            </div>
          )}
        </div>
        <input ref={inpRef}
          className={`inp mb14${sts === "ok" ? " ok" : sts === "err" ? " err" : ""}`}
          value={inp}
          onChange={e => setInp(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !sts && inp.trim()) submitAnswer(inp); }}
          placeholder="Koreyscha yozing..."
          disabled={sts !== null}
          autoComplete="off" autoCapitalize="off" spellCheck={false}
          style={{ fontSize: 18, textAlign: "center", marginTop: 14 }}
        />
        <button className="btn bp w100" style={{ padding: "15px", fontSize: 15 }}
          disabled={sts !== null || !inp.trim()}
          onClick={() => submitAnswer(inp)}>
          Tekshirish ✓
        </button>
      </div>
    );
  }

  // ── Setup view
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
            <label className="sm muted" style={{ display: "block", marginBottom: 10 }}>📖 Kva (Dars)</label>
            <div style={{ maxHeight: 260, overflowY: "auto", paddingRight: 4 }}>
              {(ALL_DATA[lvl] || []).map((k, i) => (
                <div key={k.kva} className={`kc${kva === k.kva ? " sel" : ""}`}
                  style={{ animationDelay: (i * 0.05) + "s" }}
                  onClick={() => setKva(k.kva)}>
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
          <span className="muted sm">So'z: <span style={{ color: "var(--cyan)", fontWeight: 700 }}>
            {(ALL_DATA[lvl]?.find(k => k.kva === kva)?.words.length || 0)} ta
          </span></span>
        </div>
        <button className="btn bp w100" style={{ padding: 15, fontSize: 15 }}
          disabled={!lvl || kva === null}
          onClick={startTest}>
          ⚡ Boshlash
        </button>
      </div>
    </div>
  );
}

function StatisticsPage({ stats }) {
  const xp = stats.xp || 0, tests = stats.testsCompleted || 0;
  const lvl = Math.floor(xp / 200) + 1;
  const acc = stats.totalAnswers ? Math.round((stats.correctAnswers / stats.totalAnswers) * 100) : 0;
  return (
    <div>
      <div className="ptitle">Statistika</div>
      <p className="psub">Sizning natijalaringiz</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 14 }}>
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
    </div>
  );
}

function RankingPage({ user, stats }) {
  const rk = S.get("kc_ranking", []);
  const byU = {};
  rk.forEach(e => {
    if (!byU[e.name]) byU[e.name] = { name: e.name, xp: 0 };
    byU[e.name].xp += e.xp;
  });
  if (user?.name && !byU[user.name]) byU[user.name] = { name: user.name, xp: stats.xp || 0 };
  const sort = Object.values(byU).sort((a, b) => b.xp - a.xp);
  const cols = ["#fbbf24", "#94a3b8", "#cd7c2f"];
  const med = ["🥇", "🥈", "🥉"];
  return (
    <div>
      <div className="ptitle">Reyting</div>
      <p className="psub">Top o'quvchilar</p>
      {sort.length === 0 ? (
        <div className="gc tc" style={{ padding: "50px 0" }}>
          <div style={{ fontSize: 52, opacity: 0.3, marginBottom: 14 }}>🏆</div>
          <div className="fw7 muted">Hali hech kim test topshirmagan</div>
        </div>
      ) : (
        sort.map((u, i) => (
          <div key={u.name} className={`rk-item${u.name === user?.name ? " me" : ""}`}
            style={{ animationDelay: (i * 0.07) + "s" }}>
            <div className="rk-num" style={{ color: cols[i] || "var(--text2)" }}>
              {i < 3 ? med[i] : "#" + (i + 1)}
            </div>
            <div className="rk-av" style={{
              background: ["linear-gradient(135deg,var(--cyan),var(--blue))", "linear-gradient(135deg,var(--purple),var(--pink))", "linear-gradient(135deg,var(--green),#00a84a)"][i % 3]
            }}>{u.name.charAt(0).toUpperCase()}</div>
            <div className="f1">
              <div className="fw7 sm">{u.name}{u.name === user?.name ? " (Sen)" : ""}</div>
            </div>
            <div className="rk-xp">{u.xp} XP</div>
          </div>
        ))
      )}
    </div>
  );
}

function ProfilePage({ user, stats, onUpdateStats, onUpdateUser, onLogout }) {
  const [ed, setEd] = useState(false);
  const [en, setEn] = useState(user.name);
  const [sh, setSh] = useState(false);
  const xp = stats.xp || 0, lvl = Math.floor(xp / 200) + 1;

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
              <div style={{ fontSize: 22, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
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
                onUpdateStats({ xp: 0, testsCompleted: 0, completedWords: 0, correctAnswers: 0, totalAnswers: 0 });
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

// ══════════════ MAIN APP ══════════════

export default function App() {
  const [intro, setIntro] = useState(true);
  const [user, setUser] = useState(null);
  const [modal, setModal] = useState(false);
  const [page, setPage] = useState("home");
  const [stats, setStats] = useState({});
  const [notifs, setNotifs] = useState([]);
  const [nameIn, setNameIn] = useState("");
  const [nickIn, setNickIn] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const u = S.get("kc_user");
    const st = S.get("kc_stats", {});
    setStats(st);
    if (u) setUser(u);
    else setModal(true);
    const t = setTimeout(() => setIntro(false), 4200);
    return () => clearTimeout(t);
  }, []);

  const addNotif = (ic, tx) => {
    const id = Date.now() + Math.random();
    setNotifs(n => [...n, { id, ic, tx }]);
  };

  const addXP = () => {}; // XP popup HomeworkPage ichida boshqariladi

  const updateStats = (ns) => { setStats(ns); S.set("kc_stats", ns); };
  const updateUser = (u) => { setUser(u); S.set("kc_user", u); };

  const login = () => {
    if (!nameIn.trim()) return;
    const u = { name: nameIn.trim(), nick: nickIn.trim() || nameIn.trim().toLowerCase() };
    setUser(u); S.set("kc_user", u); setModal(false);
    addNotif("🎌", `Xush kelibsiz, ${u.name}!`);
  };

  const logout = () => { setUser(null); setModal(true); setPage("home"); setSidebarOpen(false); };

  const nav = [
    { id: "home", ic: "🏠", l: "Bosh sahifa" },
    { id: "vocabulary", ic: "📖", l: "Lug'atlar" },
    { id: "homework", ic: "📚", l: "Uyga Vazifa" },
    { id: "statistics", ic: "📊", l: "Statistika" },
    { id: "ranking", ic: "🏆", l: "Reyting" },
    { id: "profile", ic: "👤", l: "Profil" },
  ];

  const goPage = (p) => { setPage(p); setSidebarOpen(false); };

  const renderPage = () => {
    if (!user) return null;
    switch (page) {
      case "home": return <HomePage user={user} stats={stats} go={goPage} />;
      case "vocabulary": return <VocabularyPage />;
      case "homework": return <HomeworkPage stats={stats} onUpdateStats={updateStats} onXP={addXP} onNotif={addNotif} />;
      case "statistics": return <StatisticsPage stats={stats} />;
      case "ranking": return <RankingPage user={user} stats={stats} />;
      case "profile": return <ProfilePage user={user} stats={stats} onUpdateStats={updateStats} onUpdateUser={updateUser} onLogout={logout} />;
      default: return null;
    }
  };

  return (
    <>
      <style>{CSS}</style>

      {/* Intro */}
      {intro && (
        <div className="intro-wrap">
          <div className="intro-logo">Korean Center<br />AI Vocabulary</div>
          <div className="intro-sub">SUN'IY INTELLEKT PLATFORMASI</div>
          <div className="intro-bar-wrap"><div className="intro-bar" /></div>
        </div>
      )}

      {/* Login modal */}
      {modal && (
        <div className="ov">
          <div className="modal">
            <div className="tc mb22">
              <div style={{ fontSize: 48, marginBottom: 10 }}>🎌</div>
              <div style={{
                fontFamily: "'Orbitron'", fontSize: 20, fontWeight: 900,
                background: "linear-gradient(135deg,var(--cyan),var(--purple))",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>Xush Kelibsiz!</div>
            </div>
            <div className="f fc gap14">
              <input className="inp" value={nameIn} onChange={e => setNameIn(e.target.value)}
                placeholder="Ismingiz *" onKeyDown={e => e.key === "Enter" && login()} autoFocus />
              <input className="inp" value={nickIn} onChange={e => setNickIn(e.target.value)}
                placeholder="Nickname (ixtiyoriy)" onKeyDown={e => e.key === "Enter" && login()} />
              <button className="btn bp w100" style={{ padding: 15 }}
                onClick={login} disabled={!nameIn.trim()}>
                Davom etish →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main app */}
      {user && (
        <div className="app">
          {/* Mobile sidebar overlay */}
          <div className={`sidebar-overlay${sidebarOpen ? " open" : ""}`} onClick={() => setSidebarOpen(false)} />

          {/* Sidebar */}
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

          {/* Content area */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
            {/* Mobile top bar */}
            <div className="mob-topbar">
              <div className="mob-menu-btn" onClick={() => setSidebarOpen(v => !v)}>☰</div>
              <div className="mob-logo">KC AI</div>
              <div className="mob-xp">⚡ {stats.xp || 0}</div>
            </div>

            {/* Page content */}
            <div className="main">{renderPage()}</div>

            {/* Mobile bottom nav */}
            <div className="mob-nav">
              <div className="mob-nav-row">
                {nav.slice(0, 5).map(n => (
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

      {/* Notifications */}
      <div className="notif-container">
        {notifs.slice(-3).map(n => (
          <Notif key={n.id} ic={n.ic} tx={n.tx}
            onDone={() => setNotifs(v => v.filter(x => x.id !== n.id))} />
        ))}
      </div>
    </>
  );
}