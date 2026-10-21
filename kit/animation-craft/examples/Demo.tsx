import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { E, spring, anticipate, settle, stagger, arc, hold, pulse, breathe, clamp, inv, lerp } from '../lib/motion';
import { Wipe, Pen, DrawPath, RegionReveal, Stagger, Dissolve } from '../lib/reveal';

/** 能力庫對照 demo：左邊是「只有淡入」，右邊是同一件事加上運動原理。
 *  不是成品，是用來驗證每個函數都對、而且看得出差別。 */

const W = 1920, H = 1080;
const INK = '#2a2520', PAPER = '#f2ece0', RED = '#b4442e', BLUE = '#3b6b84';

const Label: React.FC<{x:number;y:number;s:string;size?:number;fill?:string}> =
({x,y,s,size=26,fill='#6b655c'}) => (
  <text x={x} y={y} fill={fill} fontSize={size} fontFamily="'PingFang TC',system-ui,sans-serif">{s}</text>
);

export const Demo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const naive = clamp(inv(t, .6, 1.6));                    // 只有淡入
  const good = spring(Math.max(0, t - .6), { stiffness: 150, damping: 14 });
  const ant = anticipate(clamp(inv(t, 2.2, 3.4)));          // 預備動作
  const wobble = settle(Math.max(0, t - 3.4));              // 次要運動
  const [ax, ay] = arc(clamp(inv(t, 4.4, 5.8)), [250, 760], [620, 760], 150);
  const wipeP = clamp(inv(t, 6.0, 7.6));
  const drawP = clamp(inv(t, 6.4, 8.0));
  const staggerP = clamp(inv(t, 8.2, 10.0));
  const breath = breathe(t);

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <rect width={W} height={H} fill={PAPER} />
      <line x1={W/2} y1={60} x2={W/2} y2={H-60} stroke="#d8d1c4" strokeWidth={2} />
      <Label x={60} y={70} s="只有 opacity 0→1（我之前做的）" size={30} fill="#9a9288" />
      <Label x={W/2+60} y={70} s="加上運動原理" size={30} fill={RED} />

      {/* ① 進場：淡入 vs 彈簧 */}
      <g opacity={naive}>
        <rect x={140} y={150} width={200} height={130} rx={10} fill={BLUE} />
      </g>
      <Label x={140} y={320} s="淡入" />
      <g transform={`translate(${W/2+240} ${215}) scale(${lerp(.6, 1, good)})`} opacity={clamp(good*1.6)}>
        <rect x={-100} y={-65} width={200} height={130} rx={10} fill={BLUE} />
      </g>
      <Label x={W/2+140} y={320} s="彈簧：有質量、會過衝" fill={RED} />

      {/* ② 位移：線性 vs 預備動作 */}
      <g transform={`translate(${lerp(140, 400, clamp(inv(t,2.2,3.4)))} 420)`}>
        <circle r={44} fill={INK} />
      </g>
      <Label x={140} y={520} s="線性位移" />
      <g transform={`translate(${W/2+140 + ant*260} 420)`}>
        <circle r={44} fill={INK} />
      </g>
      <Label x={W/2+140} y={520} s="預備：先退一點再衝出去" fill={RED} />

      {/* ③ 停下來之後：死的 vs 還在晃 */}
      <g transform={`translate(400 620)`}>
        <rect x={-14} y={-70} width={28} height={140} fill={INK} />
      </g>
      <Label x={140} y={720} s="到位就停" />
      <g transform={`translate(${W/2+400} 620) rotate(${wobble*13})`}>
        <rect x={-14} y={-70} width={28} height={140} fill={INK} />
      </g>
      <Label x={W/2+140} y={720} s="次要運動：主體停了還在晃" fill={RED} />

      {/* ④ 弧線 */}
      <g opacity={.25}>
        <line x1={250} y1={810} x2={620} y2={810} stroke={INK} strokeWidth={2} strokeDasharray="8 8" />
      </g>
      <circle cx={lerp(250,620,clamp(inv(t,4.4,5.8)))} cy={810} r={26} fill={BLUE} opacity={.5} />
      <Label x={140} y={880} s="直線" />
      <circle cx={ax + W/2 - 100} cy={ay + 50} r={26} fill={RED} />
      <Label x={W/2+140} y={880} s="弧線：真實的移動不走直線" fill={RED} />

      {/* ⑤ 揭露：遮罩推進＋筆尖 */}
      <g transform="translate(0 0)">
        <Wipe p={wipeP} dir="left" x={140} y={930} w={420} h={100} feather={50}>
          <rect x={140} y={930} width={420} height={100} rx={8} fill={BLUE} opacity={.85} />
          <text x={350} y={995} textAnchor="middle" fill="#fff" fontSize={40}
            fontFamily="'PingFang TC',sans-serif">遮罩推進</text>
        </Wipe>
        <Pen p={wipeP} dir="left" x={140} y={930} w={420} h={100} />
      </g>
      {/* ⑥ 路徑描繪 */}
      <DrawPath p={drawP} d={`M ${W/2+140} 1000 Q ${W/2+330} 920 ${W/2+520} 1000`}
        stroke={RED} width={7} length={500} />
      <Label x={W/2+140} y={940} s="路徑描繪：一筆畫出來" fill={RED} />

      {/* ⑦ 錯開進場 */}
      <Stagger p={staggerP} count={6} overlap={.55} render={(cp, i) => (
        <g opacity={cp} transform={`translate(${1180 + i*92} ${lerp(200, 160, E.outBack(cp))}) scale(${breath})`}>
          <rect x={-32} y={-32} width={64} height={64} rx={8} fill={i % 2 ? RED : BLUE} />
        </g>
      )} />
      <Label x={1180} y={280} s="錯開：一群東西不要同時進場" fill={RED} />
    </svg>
  );
};
