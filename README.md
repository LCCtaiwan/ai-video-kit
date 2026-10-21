# AI 動畫製作手冊與規則檔

作者：藥師 李承洲
配合演講「從民間故事到醫療指引：一套你也可以複製的 AI 動畫流程」。

- **網頁版手冊**：本 repo 的 `index.html`，開啟 GitHub Pages 後就是網址首頁。
- **規則檔（skills）**：[`kit/`](kit/) 資料夾，給你的 AI agent 開工前讀的工作規則。先讀 [`kit/README.md`](kit/README.md)。

## 怎麼帶回去用

1. 按右上角綠色的 **Code → Download ZIP** 下載整包，或 `git clone` 這個 repo。
2. 把 `kit/make-video` 和 `kit/animation-craft` 兩個資料夾：
   - **Claude Code**：放進 `~/.claude/skills/`，之後說「幫我做一支○○動畫」就會啟用。
   - **其他 agent（Codex、Gemini CLI 等）**：開工時說「先完整讀過這兩個資料夾的 SKILL.md，照裡面的規則做」。

## 裡面有什麼

| 資料夾 | 內容 |
|---|---|
| `kit/make-video/` | 整套流程：開工先提案、內容查證、腳本、配音、時間軸、分鏡、檢查、看片修改；六個風格包；腳本、音效表、分鏡表的格式範本 |
| `kit/animation-craft/` | 動畫五層：時間、運動、揭露、鏡頭、風格；判例準則 `craft-rules.md`；TypeScript 小函式庫與對照範例 |

## 一定要自己做的三件事

1. **資料自己給**：原始來源、寫明版本、先看授權。
2. **內容自己審**：醫療內容正式使用前，請第二位藥師或醫師審過。
3. **聲音自己聽**：每次改配音都戴耳機聽一遍。

## 授權

- 部分內容改寫自 MIT 與 Apache-2.0 授權的開源專案，原作聲明見 [`kit/THIRD_PARTY_NOTICES.md`](kit/THIRD_PARTY_NOTICES.md)。
- 作者撰寫的部分：授權條款待定；在那之前歡迎個人學習使用，轉載或修改後再發佈請先聯絡作者。
