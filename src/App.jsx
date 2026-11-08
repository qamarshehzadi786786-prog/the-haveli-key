import { useEffect, useMemo, useRef, useState } from "react";

/* ================= STORY (edit here) =================
 a(m,sky1,sky2,glow,{rain,item}) = image
 sc(place,art,[text],[[label,next,clueToGive?,alt?]]) = scene (always 3 choices, always 5 steps)
 alt = [[[clues needed], endingId], ...]  -> the destination changes depending on clues collected earlier
 en(title,mood,art,text) = ending ================= */
const a = (m, s0, s1, c, x = {}) => ({ m, sky: [s0, s1], c, ...x });
const sc = (place, art, text, ch) => ({ place, art, text, choices: ch.map(([label, next, set, alt]) => ({ label, next, set, alt })) });
const en = (title, mood, art, text) => ({ end: { title, mood }, art, text });
const FLAG = { diary: "Amna's diary", girl: "the girl's trust", locket: "the silver locket" };

const S = {
  /* Step 1 */
  gate: sc("The Haveli Gate", a("house", "#06141a", "#12363c", "#f2b84b", { rain: 1, item: "key" }),
    ["Your grandmother Amna has died, and you have come to her haveli for the first time. Rain hammers the iron gate.", "A rusted key lies in the mud. Upstairs a light flickers, and footsteps cross the floor."],
    [["Pocket the key and walk in through the front door", "hall"], ["Pocket the key and look through the window", "window"], ["Pocket the key and circle round to the garden", "garden"]]),
  /* Step 2 */
  hall: sc("The Great Hall", a("room", "#1a1410", "#3a2a1c", "#f2b84b"),
    ["A lamp burns beside an open diary. Footsteps move above you."],
    [["Read the diary, then climb to the attic", "attic", "diary"], ["Walk through to the dusty library", "library"], ["Slip out the back door to the well", "well"]]),
  window: sc("Outside the Window", a("window", "#06141a", "#0f2a33", "#ffcf70", { rain: 1 }),
    ["Through the dusty glass, a girl who looks exactly like you presses her hand to the pane and mouths: please."],
    [["Trust her and follow her to the well", "well", "girl"], ["Break in and climb to the attic", "attic"], ["Break in and search the library", "library"]]),
  garden: sc("The Back Garden", a("well", "#07161a", "#0d3a34", "#9fe8c8", { rain: 1 }),
    ["Jasmine hangs over an old stone well, and something hums in the dark water."],
    [["Lean over the well and listen", "well"], ["Climb the ivy to the attic window", "attic"], ["Open the kitchen door to the library", "library"]]),
  /* Step 3 */
  attic: sc("The Attic", a("room", "#1b1012", "#4a2a22", "#ff9a3c"),
    ["A sandalwood chest, a cracked mirror, and a photograph of two sisters, one of whom looks just like you."],
    [["Take the silver locket from the chest", "cellar", "locket"], ["Look into the cracked mirror", "mirror"], ["Climb out onto the roof", "roof"]]),
  library: sc("The Library", a("room", "#14161a", "#2e3a3c", "#ffd27a"),
    ["Shelves of diaries. One book is warm to the touch, and a hidden shelf clicks behind it."],
    [["Read the warm diary", "roof", "diary"], ["Open the hidden shelf", "cellar"], ["Hold the book up to the old mirror", "mirror"]]),
  well: sc("The Old Well", a("well", "#0a1a22", "#1d4d4a", "#9fe8c8", { rain: 1 }),
    ["The water hums a lullaby. A girl's hand reaches from the shaft, and a rope ladder hangs beside it."],
    [["Take her hand and climb down", "cellar", "girl"], ["Drop the key into the water", "roof"], ["Sing the lullaby softly", "mirror"]]),
  /* Step 4 */
  cellar: sc("The Cellar", a("frame", "#12060a", "#2a0c14", "#ff5d5d"),
    ["A portrait of Amna hangs crooked, and something scratches behind it. Beyond it stands an iron door."],
    [["Call out: 'Zainab?'", "lastRoom", "girl"], ["Search the shelves with the lamp", "lastRoom", "locket"], ["Ignore it and go straight to the door", "lastRoom"]]),
  mirror: sc("The Mirror Room", a("frame", "#10101c", "#28304a", "#9fd0ff"),
    ["Your reflection moves a second too late, and behind it an iron door stands open a crack."],
    [["Whisper the name 'Zainab'", "lastRoom", "girl"], ["Open the music box beneath the mirror", "lastRoom", "locket"], ["Cover the mirror with your coat", "lastRoom"]]),
  roof: sc("The Rooftop", a("house", "#07101c", "#1d3350", "#ffd27a", { rain: 1 }),
    ["Rain and stars. One by one, every window below begins to glow, and a tower door stands ajar."],
    [["Wave to the glowing windows", "lastRoom", "girl"], ["Pick the glinting thing from the gutter", "lastRoom", "locket"], ["Go straight in through the tower door", "lastRoom"]]),
  /* Step 5: the ending depends on the clues you collected */
  lastRoom: sc("Zainab's Room", a("room", "#0c1014", "#1d2e36", "#7fd0ff"),
    ["The iron door opens on a child's room, frozen for fifty years. Zainab waits by the window for you to decide."],
    [["Open the window and let her go", "endFade", null, [[["girl"], "endPeace"], [["diary"], "endForgive"]]],
     ["Place what you found in her hand and say, 'You were never forgotten'", "endNothing", null, [[["locket", "diary", "girl"], "endTruth"], [["locket"], "endEmpty"]]],
     ["Lock the door again, as Grandmother did", "endSilence", null, [[["diary"], "endLocked"], [["girl"], "endBetrayed"]]]]),

  endPeace: en("Open Window", "good", a("house", "#13233a", "#f2a65a", "#ffd27a", { item: "lantern" }),
    "She trusted you, and the window opens at your touch. Zainab steps into the morning light and does not look back. The rain stops."),
  endForgive: en("Her Forgiveness", "good", a("room", "#1a2a33", "#e7b87a", "#ffd9a0", { item: "cup" }),
    "You read Amna's apology aloud as the window opens. Zainab listens, nods, and forgives the sister who can no longer ask."),
  endTruth: en("Two Sisters", "secret", a("room", "#1a2a33", "#e7b87a", "#ffd9a0", { item: "box" }),
    "The locket clicks shut in her hand, because you found everything. The family carves Zainab's name beside Amna's, and the haveli becomes a home."),
  endFade: en("The Girl Who Stayed", "mixed", a("window", "#14060a", "#3a0f16", "#ffcf70", { rain: 1 }),
    "You open the window, but she never trusted you. She drifts back to the glass, and the haveli keeps her."),
  endEmpty: en("Empty Hands", "mixed", a("well", "#06101a", "#0a2a3a", "#7fd0ff", { item: "ring" }),
    "She takes the locket and holds it, but you know too little to tell her why. She stays, quieter now. You promise to return with answers."),
  endSilence: en("The Quiet House", "mixed", a("house", "#14060a", "#3a0f16", "#ff9a3c", { rain: 1 }),
    "You lock the door without knowing what was behind it. The footsteps stop, and you never learn why you feel watched for the rest of your life."),
  endNothing: en("Nothing to Give", "bad", a("frame", "#12060a", "#2a0c14", "#ff5d5d", { item: "hand" }),
    "You have no locket and no answers. She looks at your empty hands, then at the closing door. The house keeps its secret, and keeps you."),
  endLocked: en("The Same Mistake", "bad", a("house", "#14060a", "#3a0f16", "#ff5d5d", { rain: 1, item: "key" }),
    "You read Amna's diary and still copy her. The key turns. Years later, someone else stands at the gate holding a rusted key."),
  endBetrayed: en("Betrayed", "bad", a("frame", "#12060a", "#2a0c14", "#ff5d5d", { item: "hand" }),
    "She trusted you, and you locked her in. The house shudders, and when the door opens again, you are the one it keeps."),
};

const START = "gate";
const ENDS = Object.keys(S).filter((k) => S[k].end);
const MOOD = {
  good: { t: "Peaceful ending", c: "#8ef0c0" },
  bad: { t: "Dark ending", c: "#ff7b7b" },
  secret: { t: "Secret ending", c: "#ffd27a" },
  mixed: { t: "Bittersweet ending", c: "#ffb15a" },
};
const load = () => { try { return (JSON.parse(localStorage.getItem("haveli-ends-v4")) || []).filter((e) => ENDS.includes(e)); } catch { return []; } };
const save = (v) => { try { localStorage.setItem("haveli-ends-v4", JSON.stringify(v)); } catch {} };

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Lora:wght@400;500&display=swap');
.fd{font-family:'Fraunces',Georgia,serif}.fs{font-family:'Lora',Georgia,serif}
@keyframes fall{from{transform:translateY(-15vh)}to{transform:translateY(115vh)}}
.drop{position:absolute;top:0;width:1px;background:linear-gradient(transparent,rgba(190,225,230,.55));animation:fall linear infinite}
@keyframes rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.rise{opacity:0;animation:rise .6s ease-out forwards}
@keyframes fade{from{opacity:0}to{opacity:1}}
.fade{animation:fade 1s ease-out}
@media(prefers-reduced-motion:reduce){.drop,.rise,.fade{animation:none!important;opacity:1}}
`;

function Rain() {
  const d = useMemo(() => Array.from({ length: 60 }, (_, i) => ({ i, l: Math.random() * 100, h: 40 + Math.random() * 50, s: 0.7 + Math.random() * 0.8, y: -Math.random() * 2, o: 0.25 + Math.random() * 0.5 })), []);
  return <div className="absolute inset-0 overflow-hidden">{d.map((x) => <span key={x.i} className="drop" style={{ left: x.l + "%", height: x.h, opacity: x.o, animationDuration: x.s + "s", animationDelay: x.y + "s" }} />)}</div>;
}

/* Har scene ki apni image – SVG mein bani hai, isliye foran load hoti hai (koi file/URL nahi chahiye) */
function Art({ a }) {
  const c = a.c;
  const glow = { filter: `drop-shadow(0 0 10px ${c})` };
  const M = {
    house: <>
      <rect x="-1200" y="470" width="3200" height="900" fill="#040e10" />
      <path d="M0 470V400q30-50 60 0 30-60 70 0v70Z M670 470V410q30-60 65 0 30-40 65 0v60Z" fill="#0a2024" />
      <g fill="#071a1e"><rect x="230" y="320" width="340" height="150" /><rect x="360" y="250" width="80" height="220" /><path d="M360 250Q400 190 440 250Z" /><rect x="396" y="165" width="8" height="30" /><rect x="238" y="290" width="26" height="40" /><rect x="536" y="290" width="26" height="40" /></g>
      {[270, 330, 470, 525].map((x) => <path key={x} d={`M${x} 400V372q0-14 14-14t14 14v28Z`} fill={c} style={glow} />)}
      <path d="M385 470v-40q15-18 30 0v40Z" fill="#020a0c" />
      <path d="M385 300v-24q15-18 30 0v24Z" fill={c} style={glow} />
      <g stroke="#030c0e" strokeWidth="5">{Array.from({ length: 14 }, (_, i) => <line key={i} x1={40 + i * 55} y1="470" x2={40 + i * 55} y2="535" />)}<line x1="0" y1="490" x2="800" y2="490" /></g>
    </>,
    room: <>
      <rect x="-1200" y="430" width="3200" height="900" fill="#0c0807" />
      <path d="M70 430V270q70-70 140 0v160Z" fill="#050303" />
      <g fill="#150e0a">{[0, 1, 2, 3, 4].map((i) => <rect key={i} x={540 + i * 34} y={430 - (i + 1) * 36} width="260" height="36" />)}</g>
      <rect x="320" y="400" width="160" height="12" fill="#2a1a10" /><rect x="335" y="412" width="12" height="60" fill="#2a1a10" /><rect x="453" y="412" width="12" height="60" fill="#2a1a10" />
      <path d="M385 400l8-45h14l8 45Z" fill="#3a2a1c" /><circle cx="400" cy="335" r="22" fill={c} style={glow} />
    </>,
    window: <>
      <rect x="170" y="70" width="460" height="470" rx="6" fill="#0a161a" stroke="#2c5258" strokeWidth="14" />
      <rect x="190" y="90" width="420" height="430" fill={c} opacity=".28" />
      <circle cx="400" cy="270" r="44" fill="#050e11" /><path d="M300 520q0-170 100-170t100 170Z" fill="#050e11" />
      <path d="M470 400q40-10 50-70" stroke="#050e11" strokeWidth="14" fill="none" strokeLinecap="round" />
      <g stroke="#2c5258" strokeWidth="8"><line x1="400" y1="90" x2="400" y2="520" /><line x1="190" y1="300" x2="610" y2="300" /></g>
    </>,
    well: <>
      <rect x="-1200" y="470" width="3200" height="900" fill="#050f0e" />
      <rect x="140" y="260" width="22" height="215" fill="#0a1a16" /><circle cx="150" cy="240" r="85" fill="#0a2420" /><circle cx="95" cy="290" r="55" fill="#0a2420" /><circle cx="215" cy="290" r="55" fill="#0a2420" />
      <rect x="290" y="400" width="220" height="80" fill="#14282a" /><ellipse cx="400" cy="400" rx="110" ry="30" fill="#1e3a3c" /><ellipse cx="400" cy="400" rx="92" ry="22" fill="#02080a" />
      <ellipse cx="400" cy="403" rx="60" ry="12" fill={c} opacity=".5" style={glow} />
      <path d="M300 400V320M500 400V320M290 320h220" stroke="#14282a" strokeWidth="10" />
    </>,
    frame: <>
      <rect x="-1200" y="470" width="3200" height="900" fill="#0a0305" />
      <rect x="250" y="90" width="300" height="390" fill="#05020a" stroke="#a07a30" strokeWidth="18" />
      <rect x="268" y="108" width="264" height="354" fill="#12050a" />
      <circle cx="350" cy="250" r="30" fill="#2a0c14" /><path d="M300 460q0-140 50-140t50 140Z" fill="#2a0c14" />
      <circle cx="450" cy="270" r="26" fill="#3a1018" /><path d="M410 460q0-120 40-120t40 120Z" fill="#3a1018" />
    </>,
  };
  const items = {
    key: <g transform="translate(360 520) rotate(-20)" style={glow} fill="none" stroke={c} strokeWidth="5"><circle cx="0" cy="0" r="12" /><path d="M12 0h50M48 0v14M60 0v10" /></g>,
    flame: <path d="M400 470q-45-40-10-90 10 30 30 20-5-30 25-50 30 60 5 120Z" fill={c} style={glow} />,
    cup: <g fill="#f6e4c6"><rect x="360" y="380" width="30" height="22" rx="4" /><rect x="410" y="380" width="30" height="22" rx="4" /><path d="M375 370q-6-14 0-24M425 370q-6-14 0-24" stroke="#fff" strokeWidth="3" fill="none" opacity=".6" /></g>,
    box: <g style={glow}><rect x="360" y="425" width="80" height="48" rx="4" fill={c} /><rect x="360" y="425" width="80" height="14" fill="#fff" opacity=".35" /></g>,
    lantern: <g style={glow}><path d="M560 250v40" stroke="#030c0e" strokeWidth="4" /><rect x="545" y="290" width="30" height="46" rx="6" fill={c} /><circle cx="560" cy="313" r="55" fill={c} opacity=".18" /></g>,
    hand: <g fill="#d8cfc8" opacity=".85"><path d="M300 520q20-70 40-80t4 80Z" /><path d="M460 520q-10-70 20-90t14 90Z" /></g>,
    ring: <g fill="none" stroke={c} strokeWidth="3" style={glow}><ellipse cx="400" cy="403" rx="30" ry="7" /><ellipse cx="400" cy="403" rx="50" ry="12" opacity=".6" /><ellipse cx="400" cy="403" rx="72" ry="17" opacity=".3" /></g>,
    phone: <g><rect x="340" y="400" width="120" height="190" rx="14" fill="#06090b" stroke="#8aa" strokeWidth="3" /><rect x="352" y="418" width="96" height="150" fill="#1a2a35" /><circle cx="400" cy="470" r="14" fill={c} /><circle cx="400" cy="440" r="7" fill="#fff" opacity=".8" /></g>,
  };
  const out = a.m !== "room" && a.m !== "frame";
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet" overflow="visible" aria-hidden="true">
      <defs>
        <linearGradient id="sk" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="600"><stop offset="0" stopColor={a.sky[0]} /><stop offset="1" stopColor={a.sky[1]} /></linearGradient>
        <radialGradient id="gl"><stop offset="0" stopColor={c} stopOpacity=".45" /><stop offset="1" stopColor={c} stopOpacity="0" /></radialGradient>
      </defs>
      <rect x="-1200" y="-900" width="3200" height="2400" fill="url(#sk)" />
      {out && <circle cx="640" cy="110" r="42" fill="#fdf6dc" opacity=".92" style={{ filter: "drop-shadow(0 0 30px rgba(253,246,220,.5))" }} />}
      <circle cx="400" cy="380" r="280" fill="url(#gl)" />
      {M[a.m]}
      {a.item && items[a.item]}
    </svg>
  );
}

const CHORD = { calm: [110, 130.8, 164.8], good: [130.8, 164.8, 196], bad: [110, 116.5, 164.8], secret: [146.8, 185, 220], mixed: [110, 138.6, 164.8] };

/* Background sound made in code (Web Audio): rain = filtered noise, music = soft pad that changes with the mood */
function makeAudio() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
  const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource(); noise.buffer = buf; noise.loop = true;
  const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 1400;
  const rain = ctx.createGain(); rain.gain.value = 0;
  noise.connect(hp); hp.connect(rain); rain.connect(master); noise.start();
  const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 650;
  const pad = ctx.createGain(); pad.gain.value = 0; lp.connect(pad); pad.connect(master);
  const oscs = CHORD.calm.map((f) => { const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = f; o.detune.value = (Math.random() - 0.5) * 12; o.connect(lp); o.start(); return o; });
  return { ctx, master, rain, pad, oscs };
}

const Btn = ({ children, onClick, disabled, primary }) => (
  <button onClick={onClick} disabled={disabled}
    className={`rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-[#f2b84b]/50 disabled:cursor-not-allowed disabled:opacity-35 ${primary ? "bg-[#f2b84b] text-[#0b1f22] hover:bg-[#ffd27a]" : "border border-[#2c5258] bg-[#0f2a2e]/80 text-[#dcefe8] hover:border-[#f2b84b]"}`}>
    {children}
  </button>
);
const Chip = ({ on, onClick, children }) => (
  <button onClick={onClick} aria-pressed={on}
    className={`rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur transition hover:border-[#f2b84b] ${on === false ? "border-white/15 bg-black/50 text-[#8fb2a7] line-through" : "border-white/25 bg-black/50 text-[#dcefe8]"}`}>
    {children}
  </button>
);

export default function App() {
  const [started, setStarted] = useState(false);
  const [id, setId] = useState(START);
  const [hist, setHist] = useState([]);
  const [pick, setPick] = useState(null);
  const [found, setFound] = useState(load);
  const [voice, setVoice] = useState(true);
  const [sound, setSound] = useState(true);
  const au = useRef(null);

  const sc = S[id];
  const end = sc.end;
  const flags = hist.flatMap((h) => { const f = S[h.id].choices[h.pick].set; return f ? [f] : []; }); // clues collected so far
  const go = (c) => (c.alt?.find(([n]) => n.every((f) => flags.includes(f))) || [0, c.next])[1]; // where this choice leads, given your clues
  const previewId = pick !== null && !end ? go(sc.choices[pick]) : id;
  const shown = started ? S[previewId] : sc;
  const step = end ? 5 : Math.min(hist.length + 1, 5);

  const begin = () => { try { if (!au.current) au.current = makeAudio(); au.current.ctx.resume(); } catch {} setStarted(true); };

  useEffect(() => () => { window.speechSynthesis?.cancel(); au.current?.ctx.close?.(); }, []);

  // narration: reads each new scene aloud
  useEffect(() => {
    const s = window.speechSynthesis;
    if (!s) return;
    s.cancel();
    if (!started || !voice) return;
    const u = new SpeechSynthesisUtterance(end ? `${end.title}. ${sc.text}` : sc.text.join(" "));
    u.lang = "en-GB"; u.rate = 0.92; u.pitch = 0.95;
    s.speak(u);
    return () => s.cancel();
  }, [id, started, voice]);

  // ambience: rain outdoors, music mood changes with the ending type
  useEffect(() => {
    const A = au.current;
    if (!A) return;
    const t = A.ctx.currentTime;
    A.master.gain.setTargetAtTime(sound ? 0.5 : 0, t, 0.3);
    CHORD[end ? end.mood : "calm"].forEach((f, i) => A.oscs[i].frequency.setTargetAtTime(f, t, 0.8));
    A.rain.gain.setTargetAtTime(sc.art.rain ? 0.2 : 0.03, t, 0.6);
    A.pad.gain.setTargetAtTime(started ? 0.05 : 0, t, 0.6);
  }, [sound, started, id]);

  const next = () => {
    if (pick === null) return;
    const to = go(sc.choices[pick]);
    setHist([...hist, { id, pick }]);
    setId(to);
    setPick(null);
    if (S[to].end && !found.includes(to)) { const f = [...found, to]; setFound(f); save(f); }
  };
  const back = (keep) => {
    const h = hist[hist.length - 1];
    if (!h) return;
    setHist(hist.slice(0, -1));
    setId(h.id);
    setPick(keep ? h.pick : null);
  };
  const change = () => (end ? back(false) : setPick(null));
  const restart = () => { setId(START); setHist([]); setPick(null); };

  const info = !started ? (
    <>
      <h1 className="fd rise text-3xl font-semibold leading-tight sm:text-4xl">The Haveli Key</h1>
      <p className="fs rise mt-3 text-lg leading-8 text-[#b7d3ca]" style={{ animationDelay: "200ms" }}>A rainy night, a rusted key, and a secret your grandmother kept for fifty years. Five decisions, nine endings, and what you find along the way changes how it ends.</p>
      <p className="mt-3 text-sm text-[#8fb2a7]">Endings found: {found.length} of {ENDS.length}{found.length > 0 && <button onClick={() => { setFound([]); save([]); }} className="ml-3 underline hover:text-[#f2b84b]">Reset</button>}</p>
    </>
  ) : end ? (
    <>
      <h2 className="fd rise text-3xl font-semibold" style={{ color: MOOD[end.mood].c }}>{end.title}</h2>
      <p className="fs rise mt-3 text-lg leading-8" style={{ animationDelay: "250ms" }}>{sc.text}</p>
      <p className="rise mt-3 text-sm text-[#8fb2a7]" style={{ animationDelay: "450ms" }}>Endings found: {found.length} of {ENDS.length}</p>
    </>
  ) : (
    <>
      <div className="fs space-y-2">
        {sc.text.map((p, i) => <p key={i} className="rise text-[17px] leading-7" style={{ animationDelay: `${100 + i * 250}ms` }}>{p}</p>)}
      </div>
      {flags.length > 0 && <p className="mt-3 text-xs text-[#8fb2a7]">Clues found: {[...new Set(flags)].map((f) => FLAG[f]).join(", ")}</p>}
    </>
  );

  const options = started && !end && (
    <div className="flex flex-col gap-2">
      {sc.choices.map((c, i) => (
        <button key={c.label} onClick={() => setPick(i)} aria-pressed={pick === i}
          className={`rise rounded-xl border px-4 py-3 text-left text-[15px] transition focus:outline-none focus-visible:ring-4 focus-visible:ring-[#f2b84b]/40 ${pick === i ? "border-[#f2b84b] bg-[#1d4047]" : "border-[#2c5258] bg-[#0f2a2e] hover:border-[#f2b84b]/70"}`}
          style={{ animationDelay: `${400 + i * 120}ms` }}>
          {c.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-[#040e10] text-[#dcefe8]" style={{ textAlign: "left" }}>
      <style>{CSS}</style>

      {/* TOP: picture only. BOTTOM: text and choices, so nothing covers the art */}
      <div className="relative min-h-[40vh] flex-1 overflow-hidden">
        <div key={started ? previewId : "start"} className="fade absolute inset-0"><Art a={shown.art} />{shown.art.rain && <Rain />}</div>
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#071a1e] to-transparent" />
        <div className="absolute left-3 top-3 z-20 flex gap-2">
          <Chip on={voice} onClick={() => setVoice(!voice)}>Voice</Chip>
          <Chip on={sound} onClick={() => setSound(!sound)}>Sound</Chip>
        </div>
      </div>

      <section className="relative z-10 flex max-h-[48vh] shrink-0 flex-col border-t border-[#2c5258] bg-[#071a1e]">
        <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-5 pt-3">
          {started && (
            <div className="flex items-center justify-between pb-2" role="img" aria-label={`Step ${step} of 5`}>
              <span className="text-sm italic" style={{ color: end ? MOOD[end.mood].c : "#f2b84b" }}>{end ? MOOD[end.mood].t : `Step ${step} of 5: ${sc.place}`}</span>
              <span className="flex gap-2">
                {[0, 1, 2, 3, 4].map((n) => (
                  <i key={n} className="h-3 w-3 rounded-full border transition-all duration-500"
                    style={n < step ? { background: end ? MOOD[end.mood].c : "#f2b84b", borderColor: "transparent", boxShadow: "0 0 10px rgba(242,184,75,.5)" } : { borderColor: "#5f8c88" }} />
                ))}
              </span>
            </div>
          )}
          <div key={id + started} className="min-h-0 flex-1 gap-8 overflow-y-auto pb-3 md:grid md:grid-cols-2">
            <div>{info}</div>
            {options && <div className="mt-3 md:mt-0">{options}</div>}
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-white/10 py-3">
            {!started ? <Btn primary onClick={begin}>Start the story</Btn> : (
              <>
                <Btn onClick={() => back(true)} disabled={!hist.length}>← Previous</Btn>
                <Btn onClick={change} disabled={!end && pick === null}>Change decision</Btn>
                {end ? <Btn primary onClick={restart}>Play again</Btn> : <Btn primary onClick={next} disabled={pick === null}>Next →</Btn>}
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}