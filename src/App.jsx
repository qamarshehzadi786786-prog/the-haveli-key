import { useMemo, useState } from "react";

/* ================= STORY (edit here) =================
 a(m,sky1,sky2,glow,{rain,item}) = image | sc(place,art,[text],[[label,next] x3]) = scene | en(title,mood,art,text) = ending ================= */
const a = (m, s0, s1, c, x = {}) => ({ m, sky: [s0, s1], c, ...x });
const sc = (place, art, text, ch) => ({ place, art, text, choices: ch.map(([label, next]) => ({ label, next })) });
const en = (title, mood, art, text) => ({ end: { title, mood }, art, text });

const S = {
  /* Step 1 */
  gate: sc("The Haveli Gate", a("house", "#06141a", "#12363c", "#f2b84b", { rain: 1, item: "key" }),
    ["You stand outside your late grandmother's haveli. Rain taps the old iron gate.", "A rusted key lies in the mud. Upstairs, a light flickers and footsteps cross the floor."],
    [["Take the key and walk inside", "hall"], ["Look through the window first", "window"], ["Circle round to the back garden", "garden"]]),

  /* Step 2 */
  hall: sc("The Great Hall", a("room", "#1a1410", "#3a2a1c", "#f2b84b"),
    ["The door groans open. One lamp burns in the hall.", "Footsteps move above you, and a small cellar door waits beside the stairs."],
    [["Climb the stairs to the attic", "attic"], ["Open the small cellar door", "cellar"], ["Search the dusty library", "library"]]),
  window: sc("Outside the Window", a("window", "#06141a", "#0f2a33", "#ffcf70", { rain: 1 }),
    ["You wipe the dusty glass and see a girl inside who looks exactly like you.", "She waves, then points toward the back of the house."],
    [["Follow her round to the garden well", "well"], ["Climb in and head for the library", "library"], ["Use the key on the side door to the attic stairs", "attic"]]),
  garden: sc("The Back Garden", a("well", "#07161a", "#0d3a34", "#9fe8c8", { rain: 1 }),
    ["Jasmine hangs over an old stone well. Something hums in the dark water.", "A kitchen door and a vine-covered balcony wait nearby."],
    [["Peer into the well", "well"], ["Slip through the kitchen door to the cellar", "cellar"], ["Climb the ivy to the library balcony", "library"]]),

  /* Step 3 */
  attic: sc("The Attic", a("room", "#1b1012", "#4a2a22", "#ff9a3c"),
    ["Dust, a sandalwood chest, and a cracked mirror lean against the beams.", "The footsteps stop right behind you."],
    [["Open the chest and look into the mirror", "mirror"], ["Climb out onto the roof", "rooftop"], ["Pull back the rug and open the trapdoor", "tunnel"]]),
  cellar: sc("The Cellar", a("frame", "#12060a", "#2a0c14", "#ff5d5d"),
    ["Cold air. A portrait of your grandmother hangs crooked, and something scratches behind it."],
    [["Move the painting aside", "tunnel"], ["Follow the scratching with the lamp", "mirror"], ["Run up the back stairs to the roof", "rooftop"]]),
  library: sc("The Library", a("room", "#14161a", "#2e3a3c", "#ffd27a"),
    ["Shelves of diaries line the walls. One book is warm to the touch."],
    [["Read the warm diary", "rooftop"], ["Pull the book out and open the hidden shelf", "tunnel"], ["Hold the book up to the old mirror", "mirror"]]),
  well: sc("The Well", a("well", "#0a1a22", "#1d4d4a", "#9fe8c8"),
    ["The water hums your grandmother's lullaby. A rope ladder hangs down the shaft."],
    [["Climb down the ladder", "tunnel"], ["Drop the key into the water", "rooftop"], ["Sing along softly", "mirror"]]),

  /* Step 4 */
  tunnel: sc("The Secret Passage", a("room", "#0c0a10", "#2a2236", "#b8a4ff"),
    ["A narrow passage smells of jasmine and old smoke. Ahead, the walls whisper."],
    [["Follow the whispers", "whisper"], ["Light a match and read the carvings", "lastDoor"], ["Turn back toward the light", "dawn"]]),
  mirror: sc("The Mirror Room", a("frame", "#10101c", "#28304a", "#9fd0ff"),
    ["A tall mirror shows your reflection moving a second too late."],
    [["Step through the mirror", "lastDoor"], ["Smile at your reflection", "whisper"], ["Cover the mirror with your coat", "dawn"]]),
  rooftop: sc("The Rooftop", a("house", "#07101c", "#1d3350", "#ffd27a", { rain: 1 }),
    ["The roof opens to rain and stars. One by one, every window below begins to glow."],
    [["Lean over the edge and listen", "whisper"], ["Wave to the glowing windows", "dawn"], ["Use the key on the tower door", "lastDoor"]]),

  /* Step 5 */
  lastDoor: sc("The Last Door", a("frame", "#12060a", "#3a1a10", "#ffb15a"),
    ["A tall door has a keyhole shaped exactly like your key. Behind it, someone is breathing."],
    [["Unlock it and step inside", "endRoom"], ["Knock and say your grandmother's name", "endKnock"], ["Throw the key away", "endThrow"]]),
  whisper: sc("The Whisper", a("room", "#0c1014", "#1d2e36", "#7fd0ff"),
    ["The whisper becomes a voice: 'Choose carefully, little one.'"],
    [["Promise to stay", "endStay"], ["Ask who she is", "endTruth"], ["Cover your ears and run", "endRun"]]),
  dawn: sc("The First Light", a("house", "#13233a", "#e08a5a", "#ffd27a"),
    ["Grey light spreads across the courtyard. The footsteps are close and slow."],
    [["Stand still and face them", "endWait"], ["Light the old lamp", "endLamp"], ["Walk out through the gate", "endLeave"]]),

  /* Endings: good x3, bad x3, secret x3 */
  endKnock: en("Grandmother's Name", "good", a("house", "#13233a", "#f2a65a", "#ffd27a", { item: "lantern" }),
    "The door swings open on its own. A warm hand rests on your head, and a voice says, 'Thank you for coming home.' The haveli exhales, and the rain stops."),
  endLamp: en("Lamp of Return", "good", a("room", "#1b1012", "#4a2a22", "#ff9a3c", { item: "flame" }),
    "The lamp lights and a soft shape rises from the shadows. It touches your cheek, then drifts into the flame. The footsteps never return."),
  endLeave: en("The Long Walk Home", "good", a("house", "#2b2140", "#e08a5a", "#ffd9a0"),
    "You leave the gate behind you. Next week you return with family, open every window, and the haveli becomes a home again."),
  endThrow: en("The Lost Key", "bad", a("house", "#14060a", "#3a0f16", "#ff5d5d", { rain: 1, item: "key" }),
    "The key vanishes into the dark. Every door in the haveli slams shut, and none of them open again. Villagers hear knocking from inside for days."),
  endStay: en("A Promise Kept", "bad", a("frame", "#12060a", "#2a0c14", "#ff5d5d", { item: "hand" }),
    "'Stay,' you say, and the house never forgets. At dawn, villagers see a new figure standing beside your grandmother in the old portrait."),
  endRun: en("Echo", "bad", a("well", "#06101a", "#0a2a3a", "#7fd0ff", { item: "ring" }),
    "You run, but the whisper keeps pace with you, repeating your name in your own voice. You hear it all the way home, and every night after."),
  endRoom: en("The Hidden Nursery", "secret", a("room", "#1a2a33", "#e7b87a", "#ffd9a0", { item: "box" }),
    "Inside is a child's room, untouched for sixty years, and a box of letters. The haveli was waiting to be yours."),
  endTruth: en("Her Real Name", "secret", a("well", "#0a1a22", "#1d4d4a", "#ffd27a", { item: "box" }),
    "The girl was your grandmother's lost sister, hidden away and forgotten. Saying her name frees her, and she leaves you the family gold in the well."),
  endWait: en("Tea for Two", "secret", a("room", "#1a2a33", "#e7b87a", "#ffd9a0", { item: "cup" }),
    "The footsteps belong to Noor, your grandmother's oldest friend, who kept the house alive for years. Over tea she hands you the deed and the whole family story."),
};

const START = "gate";
const ENDS = Object.keys(S).filter((k) => S[k].end);
const MOOD = {
  good: { t: "Peaceful ending", c: "#8ef0c0" },
  bad: { t: "Dark ending", c: "#ff7b7b" },
  secret: { t: "Secret ending", c: "#ffd27a" },
};
const load = () => { try { return (JSON.parse(localStorage.getItem("haveli-ends-v2")) || []).filter((e) => ENDS.includes(e)); } catch { return []; } };
const save = (v) => { try { localStorage.setItem("haveli-ends-v2", JSON.stringify(v)); } catch {} };

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
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMax slice" overflow="visible" aria-hidden="true">
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

const Btn = ({ children, onClick, disabled, primary }) => (
  <button onClick={onClick} disabled={disabled}
    className={`rounded-full px-5 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-[#f2b84b]/50 disabled:cursor-not-allowed disabled:opacity-35 ${primary ? "bg-[#f2b84b] text-[#0b1f22] hover:bg-[#ffd27a]" : "border border-[#2c5258] bg-[#0f2a2e]/80 text-[#dcefe8] hover:border-[#f2b84b]"}`}>
    {children}
  </button>
);

export default function App() {
  const [started, setStarted] = useState(false);
  const [id, setId] = useState(START);
  const [hist, setHist] = useState([]);
  const [pick, setPick] = useState(null);
  const [found, setFound] = useState(load);

  const sc = S[id];
  const end = sc.end;
  const previewId = pick !== null && !end ? sc.choices[pick].next : id; // selected option's scene
  const shown = started ? S[previewId] : sc;
  const step = Math.min(hist.length + 1, 5); // dots filled so far

  const next = () => {
    if (pick === null) return;
    const to = sc.choices[pick].next;
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

  return (
    <div className="relative isolate min-h-screen w-full overflow-x-hidden bg-[#06141a] text-[#dcefe8]" style={{ textAlign: "left" }}>
      <style>{CSS}</style>
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div key={started ? previewId : "start"} className="fade absolute inset-0"><Art a={shown.art} />{shown.art.rain && <Rain />}</div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#040e10]/80 via-transparent to-[#040e10]/30" />
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen max-w-2xl flex-col justify-end px-5 pb-8 pt-8">
        {!started ? (
          <div className="rounded-2xl border border-white/10 bg-[#071a1e]/75 p-8 backdrop-blur-md">
            <h1 className="fd rise text-4xl font-semibold leading-tight sm:text-5xl">The Haveli Key</h1>
            <p className="fs rise mt-4 text-lg leading-8 text-[#b7d3ca]" style={{ animationDelay: "200ms" }}>One rainy night, one rusted key, and five decisions. Nine different endings are hidden in the haveli.</p>
            <div className="rise mt-6 flex items-center gap-4" style={{ animationDelay: "400ms" }}>
              <Btn primary onClick={() => setStarted(true)}>Start the story</Btn>
              <span className="text-sm text-[#8fb2a7]">Endings found: {found.length} of {ENDS.length}</span>
              {found.length > 0 && <button onClick={() => { setFound([]); save([]); }} className="text-sm text-[#8fb2a7] underline hover:text-[#f2b84b]">Reset</button>}
            </div>
          </div>
        ) : (
          <section key={id} className="rounded-2xl border border-white/10 bg-[#071a1e]/75 p-6 shadow-2xl backdrop-blur-md sm:p-8">
            <div className="flex items-center justify-between text-sm">
              <span className="rise italic text-[#f2b84b]">{end ? MOOD[end.mood].t : `Step ${hist.length + 1} of 5: ${sc.place}`}</span>
              <span className="flex gap-2" role="img" aria-label={`Step ${step} of 5`}>
                {[0, 1, 2, 3, 4].map((n) => (
                  <i key={n} className="h-3 w-3 rounded-full border transition-all duration-500"
                    style={n < step ? { background: end ? MOOD[end.mood].c : "#f2b84b", borderColor: "transparent", boxShadow: "0 0 10px rgba(242,184,75,.5)" } : { borderColor: "#5f8c88" }} />
                ))}
              </span>
            </div>

            {end ? (
              <>
                <h2 className="fd rise mt-4 text-3xl font-semibold sm:text-4xl" style={{ color: MOOD[end.mood].c, animationDelay: "100ms" }}>{end.title}</h2>
                <p className="fs rise mt-4 text-lg leading-8" style={{ animationDelay: "300ms" }}>{sc.text}</p>
                <p className="rise mt-4 text-sm text-[#8fb2a7]" style={{ animationDelay: "500ms" }}>Endings found: {found.length} of {ENDS.length}</p>
              </>
            ) : (
              <>
                <div className="fs mt-4 space-y-3">
                  {sc.text.map((p, i) => <p key={i} className="rise text-lg leading-8" style={{ animationDelay: `${100 + i * 250}ms` }}>{p}</p>)}
                </div>
                <div className="mt-6 flex flex-col gap-2.5">
                  {sc.choices.map((c, i) => (
                    <button key={c.label} onClick={() => setPick(i)} aria-pressed={pick === i}
                      className={`rise rounded-xl border px-5 py-3.5 text-left transition focus:outline-none focus-visible:ring-4 focus-visible:ring-[#f2b84b]/40 ${pick === i ? "border-[#f2b84b] bg-[#1d4047]" : "border-[#2c5258] bg-[#0f2a2e]/80 hover:border-[#f2b84b]/70"}`}
                      style={{ animationDelay: `${450 + i * 120}ms` }}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <Btn onClick={() => back(true)} disabled={!hist.length}>← Previous</Btn>
              <Btn onClick={change} disabled={!end && pick === null}>Change decision</Btn>
              {end ? <Btn primary onClick={restart}>Play again</Btn> : <Btn primary onClick={next} disabled={pick === null}>Next →</Btn>}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}