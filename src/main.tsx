import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

type Mode = 'identify' | 'sing' | 'scale' | 'sequence';
const noteNames = ['도', '레', '미', '파', '솔', '라', '시'];
const noteCodes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'];
const frequencies = [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88];
const scaleNames = ['메이저', '내추럴 마이너', '하모닉 마이너'];
const scaleSteps = [[0, 2, 4, 5, 7, 9, 11, 12], [0, 2, 3, 5, 7, 8, 10, 12], [0, 2, 3, 5, 7, 8, 11, 12]];

function App() {
  const [mode, setMode] = useState<Mode>('sing'); const [target, setTarget] = useState(5);
  const [answer, setAnswer] = useState<number | null>(null); const [scaleTarget, setScaleTarget] = useState(0); const [scaleAnswer, setScaleAnswer] = useState<number | null>(null);
  const [sequence, setSequence] = useState<number[]>([]); const [sequenceAnswer, setSequenceAnswer] = useState<number[]>([]);
  const [running, setRunning] = useState(false); const [current, setCurrent] = useState<number | null>(null); const [held, setHeld] = useState(0);
  const [score, setScore] = useState(0); const [streak, setStreak] = useState(0); const audioRef = useRef<AudioContext | null>(null); const timerRef = useRef<number | null>(null);
  const ctx = () => audioRef.current ?? (audioRef.current = new AudioContext());
  const piano = (hz: number, seconds = 1.1) => { const c = ctx(); const now = c.currentTime; [{r:1,l:.22,t:'triangle' as OscillatorType},{r:2,l:.1,t:'sine' as OscillatorType},{r:3,l:.045,t:'sine' as OscillatorType},{r:4,l:.018,t:'sine' as OscillatorType}].forEach(p => { const o=c.createOscillator(), g=c.createGain(); o.type=p.t;o.frequency.value=hz*p.r;g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(p.l,now+.008);g.gain.exponentialRampToValueAtTime(p.l*.3,now+.18);g.gain.exponentialRampToValueAtTime(.0001,now+seconds);o.connect(g).connect(c.destination);o.start(now);o.stop(now+seconds+.05); }); };
  const playTarget = () => piano(frequencies[target]);
  const newQuestion = () => { setAnswer(null); setScaleAnswer(null); setSequenceAnswer([]); if (mode === 'sequence') setSequence(Array.from({length: 4}, () => Math.floor(Math.random()*7))); else { setTarget(Math.floor(Math.random()*7)); setScaleTarget(Math.floor(Math.random()*3)); } };
  const playScale = () => { const root = frequencies[target]; scaleSteps[scaleTarget].forEach((s,i) => window.setTimeout(() => piano(root * Math.pow(2,s/12), .75), i*500)); };
  const playSequence = () => sequence.forEach((n,i) => window.setTimeout(() => piano(frequencies[n], .7), i*750));
  const chooseNote = (n: number) => { setAnswer(n); const ok=n===target; setScore(s=>s+(ok?1:0));setStreak(s=>ok?s+1:0); };
  const chooseScale = (n: number) => { setScaleAnswer(n); const ok=n===scaleTarget;setScore(s=>s+(ok?1:0));setStreak(s=>ok?s+1:0); };
  const addSequence = (n: number) => { const next=[...sequenceAnswer,n];setSequenceAnswer(next); if(next.length===sequence.length){const ok=next.every((v,i)=>v===sequence[i]);setScore(s=>s+(ok?1:0));setStreak(s=>ok?s+1:0);} };
  const toggleMic = async () => { if(running){setRunning(false);if(timerRef.current)clearInterval(timerRef.current);return;} const stream=await navigator.mediaDevices.getUserMedia({audio:true});const c=new AudioContext();audioRef.current=c;const source=c.createMediaStreamSource(stream),a=c.createAnalyser();a.fftSize=2048;source.connect(a);const data=new Float32Array(a.fftSize);setRunning(true);setHeld(0);timerRef.current=window.setInterval(()=>{a.getFloatTimeDomainData(data);let cross=0;for(let i=1;i<data.length;i++)if(data[i-1]<0&&data[i]>=0)cross++;const hz=cross*c.sampleRate/data.length;if(hz>80&&hz<1000){const midi=69+12*Math.log2(hz/440);setCurrent(Math.round(midi));const targetMidi=69+12*Math.log2(frequencies[target]/440);setHeld(v=>Math.abs(midi-targetMidi)<.5?Math.min(v+.1,2):0);}},100); };
  useEffect(()=>()=>{if(timerRef.current)clearInterval(timerRef.current)},[]);
  const result = answer === null ? '' : answer === target ? '정답입니다!' : `정답: ${noteNames[target]}`;
  return <main><section className="card"><header><div><p className="eyebrow">DAILY PITCH · MVP</p><h1>오늘의 음정 연습</h1></div><div className="stats">정답 {score} · 연속 {streak}</div></header><nav>{([['identify','음 맞히기'],['sing','따라 부르기'],['scale','스케일'],['sequence','청음 훈련']] as [Mode,string][]).map(([m,n])=><button className={mode===m?'active':''} onClick={()=>{setMode(m);newQuestion()}} key={m}>{n}</button>)}</nav>
    {mode==='identify'&&<><p className="sub">소리를 듣고 어떤 음인지 선택하세요.</p><button className="listen" onClick={playTarget}>▶ 목표음 듣기</button><div className="options">{noteNames.map((n,i)=><button className={answer!==null&&i===target?'correct':''} onClick={()=>chooseNote(i)} key={n}>{n}<small>{noteCodes[i]}</small></button>)}</div><p className="feedback">{result}</p></>}
    {mode==='sing'&&<><p className="sub">{noteNames[target]}({noteCodes[target]})를 보고 따라 불러보세요.</p><div className="target"><span>목표음</span><strong>{noteNames[target]} <small>{noteCodes[target]}</small></strong></div><div className="meter"><div className="meter-fill" style={{width:`${held/2*100}%`}}/></div><div className="readout"><span>현재 감지음</span><b>{current===null?'—':`MIDI ${current}`}</b><span>{held>=2?'정답! 유지 성공':running?`${held.toFixed(1)}초 유지 중`:'마이크를 시작하세요'}</span></div><div className="actions"><button onClick={playTarget}>▶ 목표음 듣기</button><button className="primary" onClick={toggleMic}>{running?'■ 연습 중지':'🎙 따라 부르기 시작'}</button></div></>}
    {mode==='scale'&&<><p className="sub">스케일을 듣고 종류를 선택하세요.</p><button className="listen" onClick={playScale}>▶ 스케일 듣기</button><div className="options three">{scaleNames.map((n,i)=><button className={scaleAnswer!==null&&i===scaleTarget?'correct':''} onClick={()=>chooseScale(i)} key={n}>{n}</button>)}</div><p className="feedback">{scaleAnswer!==null?(scaleAnswer===scaleTarget?'정답입니다!':`정답: ${scaleNames[scaleTarget]}`):''}</p></>}
    {mode==='sequence'&&<><p className="sub">4개의 음을 듣고, 같은 순서로 입력하세요.</p><button className="listen" onClick={playSequence}>▶ 무작위 음 듣기</button><div className="sequence-read">{sequenceAnswer.length?sequenceAnswer.map(n=>noteNames[n]).join(' - '):'입력 대기 중'}</div><div className="options">{noteNames.map((n,i)=><button onClick={()=>sequenceAnswer.length<sequence.length&&addSequence(i)} key={n}>{n}</button>)}</div>{sequenceAnswer.length===sequence.length&&<p className="feedback">{sequenceAnswer.every((v,i)=>v===sequence[i])?'정답입니다!':'다시 도전해보세요.'}</p>}</>}
    <button className="next" onClick={newQuestion}>새 문제 만들기 ↻</button></section></main>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><App/></StrictMode>);
