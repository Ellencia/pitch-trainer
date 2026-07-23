import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const names = ['도','레','미','파','솔','라','시'];
const codes = ['C4','D4','E4','F4','G4','A4','B4'];
const hz = [261.63,293.66,329.63,349.23,392,440,493.88];
type Mode = 'identify'|'sing'|'scale'|'sequence';

function App() {
  const [mode,setMode] = useState<Mode>('identify'); const [target,setTarget] = useState(5);
  const [answer,setAnswer] = useState<number|null>(null); const [continuous,setContinuous] = useState(true);
  const [speech,setSpeech] = useState('음성 대기 중'); const [score,setScore] = useState(0); const [streak,setStreak] = useState(0);
  const newQuestion = () => { setTarget(Math.floor(Math.random()*7)); setAnswer(null); setSpeech('음성 대기 중'); };
  const play = () => { const c=new AudioContext(),o=c.createOscillator(),g=c.createGain();o.type='triangle';o.frequency.value=hz[target];g.gain.setValueAtTime(.25,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+1.5);o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+1.6); };
  const choose = (n:number) => { const ok=n===target;setAnswer(n);setScore(v=>v+(ok?1:0));setStreak(v=>ok?v+1:0);if(ok&&continuous)window.setTimeout(newQuestion,1000); };
  const voiceAnswer = () => { const Recognition=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;if(!Recognition){setSpeech('Chrome 계열 브라우저에서 사용해 주세요');return;}const r=new Recognition();r.lang='ko-KR';r.interimResults=false;r.maxAlternatives=3;setSpeech('듣는 중… 도, 레, 미처럼 말하세요');r.onresult=(e:any)=>{const text=e.results[0][0].transcript.replace(/\s/g,'');const words=[['도','c','씨'],['레','d','디'],['미','e','이'],['파','f','에프'],['솔','소','g','지'],['라','a','에이'],['시','b','비']];const n=words.findIndex(w=>w.some(x=>text.includes(x)));if(n<0)setSpeech(`“${text}”을 음 이름으로 인식하지 못했어요`);else{setSpeech(n===target?'정답입니다!':'다시 시도해 보세요');choose(n);}};r.onerror=()=>setSpeech('다시 시도해 보세요');r.start(); };
  return <main><section className="card"><header><div><p className="eyebrow">DAILY PITCH · HANDS FREE</p><h1>음정 연습</h1></div><div className="stats">정답 {score}<br/>연속 {streak}</div></header><label className="continuous"><input type="checkbox" checked={continuous} onChange={e=>setContinuous(e.target.checked)}/><b>연속모드</b><span>정답 후 자동 진행</span></label><nav>{([['identify','음 맞히기'],['sing','따라 부르기'],['scale','스케일'],['sequence','청음']] as [Mode,string][]).map(([m,n])=><button className={mode===m?'active':''} onClick={()=>{setMode(m);newQuestion()}} key={m}>{n}</button>)}</nav>{mode==='identify'?<><p className="sub">소리를 듣고 음 이름을 말해보세요.</p><div className="target"><span>목표음</span><strong>?</strong></div><button className="listen" onClick={play}>▶ 목표음 듣기</button><button className="voice" onClick={voiceAnswer}>🎙 음성으로 답하기</button><p className="speech-status">{speech}</p><div className="options">{names.map((n,i)=><button className={answer!==null&&i===target?'correct':''} onClick={()=>choose(i)} key={n}>{n}<small>{codes[i]}</small></button>)}</div><p className="feedback">{answer===null?'':answer===target?'정답입니다!':`정답은 ${names[target]}입니다`}</p></>:<div className="placeholder"><b>{mode==='sing'?'따라 부르기':mode==='scale'?'스케일 훈련':'청음 훈련'}</b><p>이 모드는 다음 단계에서 운전용 음성 흐름으로 연결합니다.</p></div>}<button className="next" onClick={newQuestion}>새 문제 ↻</button></section></main>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><App/></StrictMode>);
