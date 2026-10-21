import React from 'react';
import { E, clamp, inv, lerp, stagger } from './motion';

/**
 * 揭露層：東西「怎麼出現」。
 *
 * 這層比美術風格更決定動畫感。同一張圖，淡入進來是投影片，
 * 被一道遮罩從左往右推開、筆尖跟著走，就是手繪動畫。
 *
 * 所有元件都接受 p（0→1 的進度），不自己管時間，
 * 時間由上層用 motion.ts 的 hold/stagger 算好傳進來。
 */

let uid = 0;
const nextId = (prefix: string) => `${prefix}-${uid++}`;

export type Dir = 'left' | 'right' | 'up' | 'down';

/** 遮罩推進：一道邊沿著方向掃過，露出底下的東西。
 *  feather 是邊緣羽化寬度，0 = 硬邊（像紙被撕開），大 = 柔邊（像顯影）。 */
export const Wipe: React.FC<{
  p: number; dir?: Dir; feather?: number;
  x?: number; y?: number; w: number; h: number;
  children: React.ReactNode;
}> = ({ p, dir = 'left', feather = 40, x = 0, y = 0, w, h, children }) => {
  const id = React.useMemo(() => nextId('wipe'), []);
  const horiz = dir === 'left' || dir === 'right';
  const span = horiz ? w : h;
  const edge = lerp(-feather, span + feather, clamp(p));
  const grad = {
    left:  { x1: x, y1: 0, x2: x + span, y2: 0 },
    right: { x1: x + span, y1: 0, x2: x, y2: 0 },
    up:    { x1: 0, y1: y, x2: 0, y2: y + span },
    down:  { x1: 0, y1: y + span, x2: 0, y2: y },
  }[dir];
  const stop = clamp(edge / span);
  const soft = clamp(feather / span, 0.001, 0.5);
  return (
    <>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" {...grad}>
          <stop offset={clamp(stop - soft)} stopColor="#fff" stopOpacity="1" />
          <stop offset={stop} stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`${id}-m`}>
          <rect x={x} y={y} width={w} height={h} fill={`url(#${id})`} />
        </mask>
      </defs>
      <g mask={`url(#${id}-m)`}>{children}</g>
    </>
  );
};

/** 筆尖：跟著遮罩的邊走。沒有筆尖的遮罩推進看起來像擦窗戶，有了才像在畫。 */
export const Pen: React.FC<{
  p: number; dir?: Dir; x?: number; y?: number; w: number; h: number;
  size?: number; colour?: string; show?: boolean;
}> = ({ p, dir = 'left', x = 0, y = 0, w, h, size = 26, colour = '#2a2a2a', show = true }) => {
  if (!show || p <= 0 || p >= 1) return null;
  const horiz = dir === 'left' || dir === 'right';
  const along = lerp(0, horiz ? w : h, dir === 'right' || dir === 'down' ? 1 - p : p);
  // 筆尖在邊上下擺動，模擬手寫的游移
  const wobble = Math.sin(p * Math.PI * 9) * (horiz ? h : w) * .16;
  const px = horiz ? x + along : x + w / 2 + wobble;
  const py = horiz ? y + h / 2 + wobble : y + along;
  return (
    <g transform={`translate(${px} ${py}) rotate(-38)`}>
      <path d={`M 0 0 L ${size * .34} ${-size * 1.5} L ${-size * .34} ${-size * 1.5} Z`} fill={colour} />
      <rect x={-size * .34} y={-size * 4.2} width={size * .68} height={size * 2.8} fill={colour} opacity={.88} />
    </g>
  );
};

/** 路徑描繪：線條一筆畫出來。用在箭頭、底線、輪廓、圈選。 */
export const DrawPath: React.FC<{
  p: number; d: string; stroke?: string; width?: number;
  cap?: 'round' | 'butt'; length?: number;
}> = ({ p, d, stroke = '#2a2a2a', width = 4, cap = 'round', length = 2400 }) => (
  <path d={d} fill="none" stroke={stroke} strokeWidth={width} strokeLinecap={cap}
    strokeDasharray={length} strokeDashoffset={length * (1 - clamp(p))} />
);

/** 區域揭露：把一張完整的圖切成區域，依順序一塊一塊露出來。
 *  這是 srt-whiteboard 那類專案的核心做法——不是程式畫圖，是控制圖的出現順序。 */
export type Region = { x: number; y: number; w: number; h: number; dir?: Dir; at: number; dur: number };

export const RegionReveal: React.FC<{
  tSec: number; regions: Region[]; feather?: number; pen?: boolean;
  children: React.ReactNode;
}> = ({ tSec, regions, feather = 34, pen = true, children }) => {
  const id = React.useMemo(() => nextId('rg'), []);
  return (
    <>
      <defs>
        <mask id={id}>
          <rect width="100%" height="100%" fill="black" />
          {regions.map((r, i) => {
            const p = clamp(inv(tSec, r.at, r.at + r.dur));
            if (p <= 0) return null;
            const horiz = (r.dir ?? 'left') === 'left' || (r.dir ?? 'left') === 'right';
            const grown = (horiz ? r.w : r.h) * E.outCubic(p) + feather;
            const dir = r.dir ?? 'left';
            return (
              <rect key={i}
                x={dir === 'right' ? r.x + r.w - grown : r.x}
                y={dir === 'down' ? r.y + r.h - grown : r.y}
                width={horiz ? grown : r.w}
                height={horiz ? r.h : grown}
                fill="white" />
            );
          })}
        </mask>
      </defs>
      <g mask={`url(#${id})`}>{children}</g>
      {pen && regions.map((r, i) => {
        const p = clamp(inv(tSec, r.at, r.at + r.dur));
        return <Pen key={i} p={p} dir={r.dir ?? 'left'} x={r.x} y={r.y} w={r.w} h={r.h} />;
      })}
    </>
  );
};

/** 錯開進場：一群子元素依序出現，不要同時。 */
export const Stagger: React.FC<{
  p: number; overlap?: number;
  render: (childP: number, i: number) => React.ReactNode;
  count: number;
}> = ({ p, overlap = .62, render, count }) => (
  <>{Array.from({ length: count }, (_, i) => (
    <React.Fragment key={i}>{render(stagger(i, count, p, overlap), i)}</React.Fragment>
  ))}</>
);

/** 溶接：兩個畫面交疊過渡。用在風格切換、場景轉換。 */
export const Dissolve: React.FC<{
  p: number; from: React.ReactNode; to: React.ReactNode; mode?: 'cross' | 'through';
}> = ({ p, from, to, mode = 'cross' }) => {
  const q = clamp(p);
  if (mode === 'through') {   // 先全部淡出到底再淡入，中間有一瞬的空白
    return <>
      <g opacity={1 - clamp(q * 2)}>{from}</g>
      <g opacity={clamp(q * 2 - 1)}>{to}</g>
    </>;
  }
  return <>
    <g opacity={1 - q}>{from}</g>
    <g opacity={q}>{to}</g>
  </>;
};

/** 擦除轉場：下一個畫面像紙一樣蓋上來。 */
export const SlideOver: React.FC<{
  p: number; dir?: Dir; w: number; h: number; children: React.ReactNode;
}> = ({ p, dir = 'left', w, h, children }) => {
  const q = E.outQuart(clamp(p));
  const off = {
    left:  [lerp(-w, 0, q), 0], right: [lerp(w, 0, q), 0],
    up:    [0, lerp(-h, 0, q)], down:  [0, lerp(h, 0, q)],
  }[dir] as [number, number];
  return <g transform={`translate(${off[0]} ${off[1]})`}>{children}</g>;
};
