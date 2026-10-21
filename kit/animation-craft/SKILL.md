---
name: animation-craft
description: 做動畫的底層能力：運動原理、揭露技法、鏡頭、節奏。不綁任何視覺風格。TRIGGER：要做動畫、解說影片、動態圖形，或畫面「像投影片」「不會動」「只是淡入淡出」時。SKIP：純剪輯現成素材、只要靜態圖。
---

# 動畫能力庫

風格可以換，這層不會換。手繪、水墨、拼貼、扁平向量、檔案桌面——底下都是同一套運動原理與揭露技法。

## 為什麼需要這層

只用 `opacity 0→1` 和線性位移做出來的東西，不管美術多好都像投影片。這不是美術問題，是運動問題。
實際踩過的坑：連續四次改畫面風格（拼貼→檔案桌面→手繪→生圖），每次都被同一個理由否定「這也只是投影片」。原因是**畫面上沒有任何東西自己在動**，只有整張圖在淡入和推拉。

## 先讀 craft-rules.md
`craft-rules.md` 是判例式準則：規則＋判例＋自檢問題。動手之前讀一遍，交片之前再過一遍。
多數條目改寫自 [video-shotcraft](https://github.com/Vincentwei1021/video-shotcraft)（Apache-2.0）
的實戰沉澱，只收與題材無關的部分。

## 在五層之上：整支片的結構

五層講的是「一個東西怎麼動」。但畫面像不像投影片，更早在這之前就決定了。

**整支片是一段連續的運動，不是一疊獨立畫面。** 選 1–2 個**主角元素（hero element）**從開頭存在到結尾，每一幕是它的**狀態改變**（位置、大小、顏色、形態），而不是換一個新東西進來。

- 講光合作用：主角＝一片葉子。全景 → 推近到葉綠體 → 拉回整株植物。
- 講吸入器：主角＝一支吸入器。外觀 → 剖面 → 藥霧路徑 → 回到手上。

幕與幕之間不硬切：上一幕的元素**變形成**下一幕的主角（共享元素），或用該風格指定的轉場。整頁 opacity 1→0、下一頁 0→1 是最後手段。

**任一幀都有運動。** 隨便暫停在非重點時刻，畫面也不該完全靜止——至少有一個底層運動在跑（主角呼吸 scale 1↔1.02／5 秒週期、背景極慢漂移、圖片 Ken Burns）。用 `breathe()`。注意：逐格渲染要能任意 seek，所以重複次數要寫死，不要無限循環。

自我檢查——給沒看過的人看，第一反應是什麼：

| 反應 | 診斷 |
|---|---|
| 「像簡報」 | 重做 |
| 「畫面跟著聲音在換」 | 主角沒有貫穿 |
| 「這段我想截圖」 | 做到了 |

改寫自 [code-animation-explainer](https://github.com/FW1201/code-animation-explainer)（MIT）的 `motion-language.md`。

## 五層架構

| 層 | 內容 | 在哪 |
|---|---|---|
| ⑤ 風格 | 手繪／水墨／拼貼／檔案／扁平 | 每個專案自己定 |
| ④ 鏡頭 | 推拉搖移、長卷平移、視差、焦點引導 | `lib/camera.ts` |
| ③ 揭露 | 遮罩推進、路徑描繪、錯開、形變、溶接 | `lib/reveal.tsx` |
| ② 運動 | 預備、跟隨、重疊、弧線、擠壓、次要運動 | `lib/motion.ts` |
| ① 時間 | 緩動、彈簧、節奏、與旁白同步 | `lib/motion.ts` |

**第②③層是最常被跳過、也最決定成敗的兩層。**

## lib/motion.ts — 時間與運動

純函數，不依賴框架。`t` 一律是 0→1 的進度。

| 函數 | 用途 | 什麼時候用 |
|---|---|---|
| `E.*` | 緩動曲線 | 進場用 `out`（快進慢停），離場用 `in`，移動用 `inOut` |
| `spring(t, {stiffness, damping, mass})` | 物理彈簧 | 比任何曲線都自然，因為有質量。預設值是「有生命但不浮誇」 |
| `anticipate(t, back)` | 預備動作 | 要往右走之前先往左縮。**沒有這個，所有運動都像瞬移** |
| `overshoot(t, amount)` | 過衝回彈 | 到位之後繼續往前一點再退回 |
| `settle(tSec, freq, decay)` | 次要運動 | 主體停了，布料／頭髮／尾巴／紙張邊緣還在晃 |
| `stagger(i, n, t, overlap)` | 錯開 | 一群東西不要同時進場 |
| `arc(t, from, to, height)` | 弧線路徑 | 真實的移動不走直線 |
| `squash(amount)` | 擠壓拉伸 | 快時拉長、撞擊時壓扁，體積守恆 |
| `hold(tSec, start, in, stay, out)` | 進場→停留→離場 | 解說動畫最常用的形狀，**很多人只寫進場忘了離場** |
| `pulse(tSec, at, width)` | 瞬間強調 | 配合旁白的重音 |
| `breathe(tSec, period, amount)` | 永不停止的細微起伏 | 讓靜止的畫面不死。幅度要小（1–2%） |

## lib/camera.ts — 鏡頭

**把所有章節排在同一張長卷上，讓鏡頭滑過去。** 一張一張切是翻投影片；鏡頭在同一個世界裡移動，觀眾才有「我們在前進」的感覺。

| 函數 | 用途 | 什麼時候用 |
|---|---|---|
| `lane(i)` / `laneY(i)` | 長卷佈局 | 第 i 章的中心點。gap 必須大於畫面寬，否則相鄰章節穿幫 |
| `track(keys)` | 關鍵影格→連續鏡頭 | 省略的欄位沿用前一格，只想改 zoom 就只寫 zoom |
| `handoff(endA, startB, xA, xB)` | 章節交接 | **直接平移像在拖一張大圖**；中間先拉遠再推回，才像鏡頭飛過去 |
| `parallax(shot, depth)` | 視差 | 背景 .85、中景 .5、主體 0。**沒有視差的橫移不管畫多好都是平的** |
| `stageTransform(shot)` | 鏡頭→SVG transform | 順序寫反會繞左上角縮放，一推進畫面就飛掉 |
| `drift(tSec)` | 整段緩慢推進 | 久停在同一章時讓畫面不死，幅度要小 |
| `favor(shot, to, .3)` | 焦點引導 | 旁白在講左邊那個東西時，鏡頭偏一點過去就夠，不必整個飛過去 |

出處：作者 GINA 指引動畫專案的鏡頭實作抽象化而來（原版把九個章節並排在同一條水平線上，間隔 2200px，鏡頭沿線滑動並在重點處推進）。

## lib/reveal.tsx — 揭露

**這層比美術風格更決定動畫感。** 同一張圖，淡入進來是投影片；被一道遮罩從左往右推開、筆尖跟著走，就是手繪動畫。

| 元件 | 做什麼 |
|---|---|
| `<Wipe>` | 遮罩推進。`feather` 0 = 硬邊（紙被撕開），大 = 柔邊（顯影） |
| `<Pen>` | 筆尖跟著遮罩邊走。**沒有筆尖的遮罩推進看起來像擦窗戶** |
| `<DrawPath>` | 路徑描繪（stroke-dashoffset）。箭頭、底線、輪廓、圈選 |
| `<RegionReveal>` | 把一張完整的圖切成區域依序露出。**不是程式畫圖，是控制圖的出現順序** |
| `<Stagger>` | 錯開進場 |
| `<Dissolve>` | 溶接。`through` 模式中間有一瞬空白 |
| `<SlideOver>` | 下一個畫面像紙一樣蓋上來 |

### 最重要的一個觀念
手繪動畫**不是用程式畫出來的**。做法是：先準備一張完整的圖（AI 生圖或手繪皆可），再用遮罩控制它出現的順序與方向，筆尖跟著遮罩邊緣走。
這解開了「程式畫不出細節」的死結——細節在圖裡，動畫在遮罩上。
參考：[geeklee/srt-whiteboard-animation](https://github.com/geeklee/srt-whiteboard-animation)（4.2k⭐）

## 踩過的坑

- **rough.js 必須固定 seed**。它預設每次繪製都重新亂數，逐格渲染會變成每一幀都在抖，整個畫面閃爍。
- **Remotion 4.0.534 有 bug**，root component 永遠載不進來（28 秒逾時）。降到 4.0.533 正常。
- **resvg 不讀 SVG 裡的外部 `<image href>`**，Sharp 渲染路徑只會畫出空白。要先轉成 data URI。Chrome 路徑沒這問題。
- **Songti.ttc 預設子字型是 Songti SC（簡體）**，沒有「豐」「貯」的字形，PIL 會畫成空白。要指定 `index=7`（Songti TC Regular）。
- **系統內建 Noto Sans Egyptian Hieroglyphs**（U+13000–U+1342F，1071 字），真埃及文不用畫。同理可查其他古文字字型。
- **破損／剝落效果要「小、多、邊緣碎」**。做成大色塊會像貼紙。
- **精細不等於擁擠**。畫面上每個元素都要有理由，純裝飾的一律刪掉。

## 工具選擇

| 工具 | ⭐ | 什麼時候選 |
|---|---|---|
| [Remotion](https://github.com/remotion-dev/remotion) | 58k | React 逐格渲染，最自由，生態最大。**預設選這個** |
| [Motion Canvas](https://github.com/motion-canvas/motion-canvas) | 19.3k | 專門做資訊型向量動畫並與旁白同步，有即時預覽編輯器 |
| [srt-whiteboard-animation](https://github.com/geeklee/srt-whiteboard-animation) | 4.2k | 手繪白板風，流程完整，風格固定 |
| [Excalimate](https://github.com/excalimate/excalimate) | 87 | Excalidraw 手繪風＋MCP，但作者自承程式碼大半 AI 寫、還在修 bug |
| [Manim](https://github.com/ManimCommunity/manim) | — | 數學／幾何／技術圖解 |

## 怎麼用

複製 `lib/` 進專案，在 Remotion 的元件裡 import。時間由上層用 `hold`／`stagger` 算好，傳 0→1 的進度給 `reveal` 的元件，它們不自己管時間。

驗證用的對照 demo 在 `examples/Demo.tsx`：左邊只有淡入，右邊同一件事加上運動原理。**靜態截圖看不出差別，一定要渲染成影片看。**
