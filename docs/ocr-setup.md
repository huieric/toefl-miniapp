# 本地 OCR（扫描版 PDF 解析）说明

> 作用：当上传的 PDF 没有文字层（扫描件/图片型）时，自动用本地 OCR 把图片转成文字，再走现有题目解析流程。
> 链路：PDF 页 → `pdftoppm` 渲染成 PNG → `tesseract.js` 识别 → 文字 → 解析题目。

## 需要安装什么

### 1. 系统依赖：poppler-utils（提供 `pdftoppm`）

**Ubuntu / Debian（云服务器）：**
```bash
sudo apt update
sudo apt install -y poppler-utils
```

**验证：**
```bash
pdftoppm -v   # 有版本输出即 OK
```

### 2. Node 依赖：tesseract.js

```bash
cd server
npm install tesseract.js
```
> 已写入 `server/package.json`，`npm install` 会自动装。

## 工作原理

1. 上传 PDF → 先尝试提取文字层（`pdf-parse`）；
2. 如果文字很少（< 100 字符）→ 判定为扫描件 → 调用 `server/src/services/ocr.js`；
3. `ocr.js` 用 `pdftoppm` 把 PDF 每一页渲染成 PNG（200 DPI）；
4. 用 `tesseract.js`（英文 `eng` 模型）逐页识别，拼接全文；
5. 识别出的文字回到原有解析流程（分段 → 题库）。

## 进度与体验

- 解析**逐段进行**：解析出一段就立即入库，前端列表会**逐步显示**新篇章；
- 解析期间前端提示「**已解析 X 篇，剩余题目后台继续解析中**」，用户可以先去练已解析的题；
- 解析完成后给出最终提示（含大文件/扫描件限制说明）。

## 常见问题

| 问题 | 解决 |
|---|---|
| `PDF 渲染失败（需安装 poppler-utils）` | 装 poppler-utils（见上） |
| `tesseract.js 未安装` | `npm install tesseract.js` |
| OCR 很慢（大 PDF） | 正常，后台批量跑；可调低渲染 DPI（`ocr.js` 里 `dpi=200` → 150）加快 |
| 识别不准（复杂排版/中英混排） | 后续可换 RapidOCR（Python，识别更强）：装 `rapidocr_onnxruntime`，把 `ocr.js` 的识别引擎替换即可（预留开关） |

## 云服务器注意

- 渲染 + OCR 是 **CPU 密集** 任务：2 核 VPS 上单页约 1–3 秒，一份几十页的扫描件需几分钟，属正常（后台批量跑）。
- 建议在**腾讯云轻量 ¥50/月（2核2G）**或更高配置上运行，避免 Render 免费版休眠中断长时间任务。
