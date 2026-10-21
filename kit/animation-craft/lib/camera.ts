/**
 * 動畫的鏡頭層。純函數，不依賴任何框架或風格。
 * 時間單位是秒（跟旁白時間軸同一套），不是 0→1 進度。
 *
 * 為什麼需要這層：
 * 一張一張切畫面，觀眾感覺是在翻投影片；
 * 把所有章節排在同一張長卷上、讓鏡頭滑過去，觀眾感覺是在同一個世界裡前進。
 * 推進帶出細節、拉開交代全貌、視差給出景深——這些都是鏡頭做的，不是畫面裡的東西做的。
 *
 * 用法：
 *   const shot = track([
 *     {time: 0,    x: lane(0), y: 540, zoom: 1},
 *     {time: 12.4, x: lane(0) + 140, zoom: 1.08},   // 推進看細節
 *     {time: 15.0, x: lane(0), zoom: .78},          // 拉開
 *     {time: 15.6, x: lane(1), zoom: 1},            // 滑到下一章
 *   ]);
 *   const {x, y, zoom} = shot(t);
 *   <g transform={stageTransform({x, y, zoom})}>…整張長卷…</g>
 */

import {E, clamp, lerp} from './motion';

export type Shot = {time: number; x: number; y: number; zoom: number};
export type Keyframe = {time: number; x?: number; y?: number; zoom?: number};

/** 畫面尺寸預設 1920×1080；專案不同請自己傳。 */
export const STAGE = {w: 1920, h: 1080};

/**
 * 長卷佈局：把第 i 個章節的中心點算出來。
 * 所有章節並排在同一條水平線上，鏡頭在上面滑動。
 * gap 要大於畫面寬度，否則相鄰章節會互相穿幫。
 */
export const lane = (i: number, gap = STAGE.w * 1.15, x0 = STAGE.w / 2) => x0 + i * gap;

/** 直向長卷（講時間軸、清單、流程時好用）。 */
export const laneY = (i: number, gap = STAGE.h * 1.15, y0 = STAGE.h / 2) => y0 + i * gap;

/**
 * 關鍵影格 → 連續鏡頭。
 * 省略的欄位沿用前一格（只想改 zoom 就只寫 zoom）。
 * 預設用 inOutCubic：起步和停止都是軟的，鏡頭才不會像被拉扯。
 */
export function track(keys: Keyframe[], easing: (t: number) => number = E.inOutCubic) {
  if (!keys.length) throw new Error('camera track 至少要一個關鍵影格');
  const pts: Shot[] = [];
  for (const k of keys) {
    const prev = pts.at(-1);
    pts.push({
      time: k.time,
      x: k.x ?? prev?.x ?? STAGE.w / 2,
      y: k.y ?? prev?.y ?? STAGE.h / 2,
      zoom: k.zoom ?? prev?.zoom ?? 1,
    });
  }
  pts.sort((a, b) => a.time - b.time);
  return (t: number): Shot => {
    let i = pts.findIndex((q) => q.time > t);
    if (i < 0) return {...pts[pts.length - 1], time: t};
    if (i === 0) return {...pts[0], time: t};
    const a = pts[i - 1], b = pts[i];
    const r = easing(clamp((t - a.time) / (b.time - a.time || 1)));
    return {time: t, x: lerp(a.x, b.x, r), y: lerp(a.y, b.y, r), zoom: lerp(a.zoom, b.zoom, r)};
  };
}

/**
 * 章節邊界的「拉開再靠近」。
 * 直接從 A 章平移到 B 章，會像在拖一張大圖；
 * 中間先拉遠一點再推回去，才像鏡頭真的飛過去。
 * out 是離開前拉遠到多少（0.78 ≈ 退三成），at 是在空檔的第幾成做這件事。
 */
export function handoff(
  endA: number, startB: number, xA: number, xB: number,
  {out = .78, at = .35, y = STAGE.h / 2}: {out?: number; at?: number; y?: number} = {},
): Keyframe[] {
  return [
    {time: endA, x: xA, y, zoom: 1},
    {time: endA + (startB - endA) * at, x: lerp(xA, xB, .5), y, zoom: out},
    {time: startB, x: xB, y, zoom: 1},
  ];
}

/**
 * 視差：鏡頭移動時，近景移得多、遠景移得少。
 * depth 0 = 貼在鏡頭上（跟著全移），1 = 無限遠（完全不動）。
 * 背景 .85、中景 .5、主體 0 是堪用的起點。
 * 沒有視差的橫移，不管畫得多好都是平的。
 */
export const parallax = (shot: Shot, depth: number) => ({
  x: shot.x * (1 - depth),
  y: shot.y * (1 - depth),
});

/**
 * 把鏡頭換成 SVG／CSS 的 transform。
 * 注意順序：先平移到畫面中心，再縮放，最後把鏡頭位置移到原點。
 * 寫反了會變成繞著左上角縮放，鏡頭一推進畫面就飛掉。
 */
export const stageTransform = (shot: Shot, stage = STAGE) =>
  `translate(${stage.w / 2} ${stage.h / 2}) scale(${shot.zoom}) translate(${-shot.x} ${-shot.y})`;

/** CSS 版（給 div 用，單位是 px）。 */
export const stageStyle = (shot: Shot, stage = STAGE) => ({
  transform: `translate(${stage.w / 2}px, ${stage.h / 2}px) scale(${shot.zoom}) translate(${-shot.x}px, ${-shot.y}px)`,
  transformOrigin: '0 0' as const,
});

/**
 * 緩慢的推進／拉開，整段鏡頭都在做。
 * 用來讓「一直停在同一章」的段落不死——幅度要小，大了觀眾會暈。
 */
export const drift = (tSec: number, from = 1, to = 1.04, span = 8) =>
  lerp(from, to, E.inOutQuad(clamp(tSec / span)));

/**
 * 焦點引導：把鏡頭對到某個座標，但只走一部分。
 * amount 1 = 完全對準，.3 = 只是「偏頭看一下」。
 * 整段旁白都在講左邊那個東西時，鏡頭偏一點過去就夠，不必整個飛過去。
 */
export const favor = (shot: Shot, to: {x: number; y: number}, amount = .3): Shot => ({
  ...shot,
  x: lerp(shot.x, to.x, amount),
  y: lerp(shot.y, to.y, amount),
});
