import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const notes = ['도', '레', '미', '파', '솔', '라', '시'];
const frequencies = [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88];

function App() {
  const [target, setTarget] = useState(5);
  const [current, setCurrent] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [held, setHeld] = useState(0);
  const audioRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const timerRef = useRef<number | null>(null);

  const playNote = () => {
    const ctx = audioRef.current ?? new AudioContext(); audioRef.current = ctx;
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.frequency.value = frequencies[target]; osc.type = 'sine'; gain.gain.value = 0.18;
    osc.connect(gain).connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 1.2);
  };

  const togglePractice = async () => {
    if (running) { setRunning(false); setCurrent(null); if (timerRef.current) window.clearInterval(timerRef.current); return; }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const ctx = new AudioContext(); audioRef.current = ctx; const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser(); analyser.fftSize = 2048; source.connect(analyser);
    const data = new Float32Array(analyser.fftSize); setRunning(true); setHeld(0);
    timerRef.current = window.setInterval(() => {
      analyser.getFloatTimeDomainData(data); let crossings = 0;
      for (let i = 1; i < data.length; i++) if (data[i - 1] < 0 && data[i] >= 0) crossings++;
      const hz = crossings * ctx.sampleRate / data.length;
      if (hz > 80 && hz < 1000) { const midi = 69 + 12 * Math.log2(hz / 440); const note = Math.round(midi); setCurrent(note); if (Math.abs(midi - (69 + 12 * Math.log2(frequencies[target] / 440))) < 0.5) setHeld(v => Math.min(v + 0.1, 3)); else setHeld(0); }
    }, 100);
  };
  useEffect(() => () => { if (timerRef.current) window.clearInterval(timerRef.current); oscillatorRef.current?.stop(); }, []);
  const currentName = current === null ? '—' : notes[(current - 60) % 12] ?? `MIDI ${current}`;
  const success = held >= 2;
  return <main><section className="card"><p className="eyebrow">DAILY PITCH · MVP</p><h1>오늘의 음정 연습</h1><p className="sub">소리를 듣고, 내 목소리로 정확하게 찾아보세요.</p><div className="target"><span>목표음</span><strong>{notes[target]} <small>{['C4','D4','E4','F4','G4','A4','B4'][target]}</small></strong></div><div className="meter"><div className="meter-fill" style={{width: `${Math.min(held / 2 * 100, 100)}%`}} /></div><div className="readout"><span>현재 감지음</span><b>{currentName}</b><span>{success ? '정답! 유지 성공' : running ? `${held.toFixed(1)}초 유지 중` : '마이크를 시작하세요'}</span></div><div className="actions"><button onClick={playNote}>▶ 목표음 듣기</button><button className={running ? 'stop' : 'primary'} onClick={togglePractice}>{running ? '■ 연습 중지' : '🎙 따라 부르기 시작'}</button></div><div className="notes">{notes.map((n, i) => <button className={i === target ? 'selected' : ''} onClick={() => setTarget(i)} key={n}>{n}</button>)}</div></section></main>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
