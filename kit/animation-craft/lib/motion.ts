/**
 * 動畫的時間與運動層。純函數，不依賴任何框架或風格。
 * t 一律是 0→1 的進度；回傳值也是 0→1（除非註明）。
 *
 * 為什麼需要這層：
 * 只用 opacity 0→1 和線性位移做出來的東西，不管美術多好都像投影片。
 * 真實的運動有預備、有過衝、有跟隨、有先後差，這些是規則，可以寫成程式。
 */

export const clamp = (x: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const inv = (t: number, a: number, b: number) => clamp((t - a) / (b - a));

// ── 緩動 ───────────────────────────────────────────────
// 選擇原則：進場用 out（快進慢停，像東西被放下）、
// 離場用 in（慢起快走，像被抽走）、移動用 inOut。
export const E = {
  linear: (t: number) => t,
  inQuad: (t: number) => t * t,
  outQuad: (t: number) => 1 - (1 - t) ** 2,
  inOutQuad: (t: number) => (t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
  inCubic: (t: number) => t ** 3,
  outCubic: (t: number) => 1 - (1 - t) ** 3,
  inOutCubic: (t: number) => (t < .5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2),
  outQuart: (t: number) => 1 - (1 - t) ** 4,
  outExpo: (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t)),
  inOutExpo: (t: number) =>
    t === 0 ? 0 : t === 1 ? 1 : t < .5 ? 2 ** (20 * t - 10) / 2 : (2 - 2 ** (-20 * t + 10)) / 2,
  /** 進場時先退一點再衝出去。amount 越大退得越多。 */
  outBack: (t: number, amount = 1.70158) =>
    1 + (amount + 1) * (t - 1) ** 3 + amount * (t - 1) ** 2,
  inBack: (t: number, amount = 1.70158) =>
    (amount + 1) * t ** 3 - amount * t ** 2,
  /** 彈性：過衝之後來回幾次才停。用在輕的東西。 */
  outElastic: (t: number, period = .3) =>
    t === 0 ? 0 : t === 1 ? 1 :
      2 ** (-10 * t) * Math.sin((t * 10 - .75) * ((2 * Math.PI) / period / 3.3)) + 1,
  /** 彈跳：落地反彈。用在重的東西掉下來。 */
  outBounce: (t: number): number => {
    const n = 7.5625, d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + .75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + .9375;
    return n * (t -= 2.625 / d) * t + .984375;
  },
};

// ── 彈簧 ───────────────────────────────────────────────
/**
 * 物理彈簧，比任何緩動曲線都自然，因為它有質量。
 * damping 低 = 晃很久；stiffness 高 = 衝很快。
 * 預設值是「有生命但不浮誇」。
 */
export const spring = (
  t: number,
  { stiffness = 170, damping = 22, mass = 1 }: { stiffness?: number; damping?: number; mass?: number } = {},
) => {
  const w0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    return 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t));
  }
  return 1 - (1 + w0 * t) * Math.exp(-w0 * t);
};

// ── 迪士尼十二原則裡可以程式化的那幾條 ─────────────────
/**
 * 預備動作：要往右走之前先往左縮一下。
 * 沒有這個，所有運動都像被瞬移。回傳位移倍率（會出現負值）。
 */
export const anticipate = (t: number, back = .18, backAt = .28) => {
  if (t < backAt) return -back * E.outQuad(t / backAt);
  return lerp(-back, 1, E.outBack(inv(t, backAt, 1), 1.4));
};

/**
 * 跟隨／過衝：到位之後繼續往前一點再退回來。
 * 布料、頭髮、尾巴、紙張邊緣都該有。
 */
export const overshoot = (t: number, amount = .12) =>
  t >= 1 ? 1 : 1 + amount * Math.sin(Math.PI * t) * (1 - t) ** 0.6 * E.outCubic(t) - (1 - E.outCubic(t));

/**
 * 次要運動：主體停了，附屬物還在晃。
 * freq 每秒振盪次數，decay 衰減速度。回傳 -1→1 的偏移。
 */
export const settle = (tSec: number, freq = 2.6, decay = 4.5) =>
  Math.sin(tSec * freq * Math.PI * 2) * Math.exp(-tSec * decay);

/**
 * 錯開：一群東西不要同時進場。
 * 回傳第 i 個的本地進度。overlap 0 = 完全接力，1 = 幾乎同時。
 */
export const stagger = (i: number, n: number, t: number, overlap = .65) => {
  const step = (1 - overlap) / Math.max(1, n - 1);
  return clamp((t - i * step) / Math.max(.001, 1 - (n - 1) * step));
};

/**
 * 弧線：真實的移動不走直線。height 是弧的高度（正值往上凸）。
 */
export const arc = (
  t: number, from: [number, number], to: [number, number], height = 60,
): [number, number] => {
  const x = lerp(from[0], to[0], t);
  const y = lerp(from[1], to[1], t) - Math.sin(Math.PI * t) * height;
  return [x, y];
};

/** 擠壓拉伸：快時拉長、撞擊時壓扁。回傳 [scaleX, scaleY]，體積守恆。 */
export const squash = (amount: number): [number, number] => {
  const k = 1 + amount;
  return [1 / Math.sqrt(k), k];
};

// ── 節奏 ───────────────────────────────────────────────
/**
 * 停留：進場、停住、離場。回傳 0→1→1→0。
 * 解說動畫最常用的形狀，但很多人只寫進場忘了離場。
 */
export const hold = (
  tSec: number, start: number, inDur: number, stay: number, outDur: number,
) => {
  if (tSec < start) return 0;
  if (tSec < start + inDur) return E.outCubic(inv(tSec, start, start + inDur));
  if (tSec < start + inDur + stay) return 1;
  return 1 - E.inCubic(inv(tSec, start + inDur + stay, start + inDur + stay + outDur));
};

/** 脈衝：在某個時間點閃一下（強調用）。回傳 0→1→0。 */
export const pulse = (tSec: number, at: number, width = .5) =>
  Math.max(0, 1 - Math.abs(tSec - at) / width);

/** 呼吸：永不停止的細微起伏，讓靜止的畫面不死。幅度要小。 */
export const breathe = (tSec: number, period = 4.5, amount = .012) =>
  1 + Math.sin((tSec / period) * Math.PI * 2) * amount;
