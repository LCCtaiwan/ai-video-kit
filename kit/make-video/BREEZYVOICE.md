# BreezyVoice（台灣華語本機語音）安裝與使用

聯發科開源、以台灣華語為主的語音模型，比 Edge TTS 自然，免費在本機執行。需要一段參考聲音；可用 Edge 生成的台灣聲音當參考（非真人，不涉及他人聲音授權）。

## 安裝（Mac，約 20 分鐘＋模型下載）
```bash
mkdir -p ~/tools && cd ~/tools && GIT_LFS_SKIP_SMUDGE=1 git clone https://github.com/mtkresearch/BreezyVoice.git && cd BreezyVoice
uv venv -p 3.10 .venv && source .venv/bin/activate
grep -v -E "deepspeed|onnxruntime-gpu|ttsfrd|extra-index-url|WeTextProcessing" requirements.txt | sed 's/openai-whisper==20231117/openai-whisper/' > req_mac.txt && echo onnxruntime >> req_mac.txt
uv pip install "setuptools<70" wheel && uv pip install --no-build-isolation -r req_mac.txt
uv pip install "ruamel.yaml<0.18" "transformers<4.46" && uv pip install --force-reinstall "scipy==1.11.4" "numpy<2"
# WeTextProcessing（需 pynini）在 Mac 難裝：用原樣輸出的替代模組
mkdir -p stub/tn/chinese stub/tn/english && touch stub/tn/__init__.py stub/tn/chinese/__init__.py stub/tn/english/__init__.py
printf 'class Normalizer:\n    def __init__(self, *a, **k):\n        pass\n    def normalize(self, text):\n        return text\n' | tee stub/tn/chinese/normalizer.py > stub/tn/english/normalizer.py
# 官方 batch 版在 Mac 會因多行程失敗：請 agent 改寫成逐句迴圈的 loop_inference.py（作者的版本未收錄於公開版）
```

## 使用
- 參考聲音放 `assets/tts/_breezy_ref/narrator.wav`，逐字稿填在 `voices.py` 的 `BREEZY_REF_TEXT`。
- `python3 scripts/voices.py --narr breezy`：只生成缺少的句子（快取含文字雜湊），每句約 1 分鐘（CPU）。
- 破音字可在文字中加注音修正，例如 `好[:ㄏㄠ3]`。
- 生成後用 whisper 抽查幾句是否與字幕一致（同音字誤判可忽略）。
- 流程用 `&&` 串接：配音失敗就停，避免用舊旁白產出成品。
