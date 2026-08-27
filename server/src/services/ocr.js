/**
 * 本地 OCR 服务（扫描版 PDF → 文字）
 *
 * 链路：PDF 页 → 渲染成 PNG（poppler pdftoppm）→ tesseract.js 识别 → 拼接文字
 *
 * 依赖：
 *   - 系统：poppler-utils（提供 pdftoppm）  Ubuntu/Debian: apt install poppler-utils
 *   - npm：tesseract.js
 *
 * 如需更高识别质量可换 RapidOCR（Python），见 docs/ocr-setup.md。
 */

const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * 用 poppler 的 pdftoppm 把 PDF 渲染成 PNG 列表
 * @param {string} pdfPath
 * @param {string} outDir
 * @param {number} dpi 渲染分辨率，扫描件建议 200-300
 * @returns {Promise<string[]>} PNG 绝对路径数组（按页码排序）
 */
function renderPdfToImages(pdfPath, outDir, dpi = 200) {
  return new Promise((resolve, reject) => {
    const prefix = path.join(outDir, 'page');
    execFile(
      'pdftoppm',
      ['-png', '-r', String(dpi), pdfPath, prefix],
      { maxBuffer: 16 * 1024 * 1024 },
      (err, _stdout, stderr) => {
        if (err) {
          return reject(new Error(`PDF 渲染失败（需安装 poppler-utils）：${(stderr || err.message).trim()}`));
        }
        const images = fs
          .readdirSync(outDir)
          .filter((f) => /^page-.*\.png$/i.test(f))
          .map((f) => path.join(outDir, f))
          .sort((a, b) => {
            const na = parseInt(a.match(/page-(\d+)/)?.[1] || '0', 10);
            const nb = parseInt(b.match(/page-(\d+)/)?.[1] || '0', 10);
            return na - nb;
          });
        if (images.length === 0) return reject(new Error('PDF 渲染后未生成任何图片'));
        resolve(images);
      }
    );
  });
}

/**
 * 用 tesseract.js 批量识别图片，返回拼接后的全文
 * @param {string[]} images
 * @param {object} [opts]
 * @param {(done:number,total:number)=>void} [opts.onProgress] - 页级进度回调
 * @returns {Promise<string>}
 */
async function ocrImagesWithTesseract(images, { onProgress } = {}) {
  let Tesseract;
  try {
    Tesseract = require('tesseract.js');
  } catch (e) {
    throw new Error('tesseract.js 未安装：npm install tesseract.js');
  }

  const worker = await Tesseract.createWorker('eng', 1, {
    logger: () => {}, // 静默
  });

  const parts = [];
  try {
    for (let i = 0; i < images.length; i++) {
      const { data } = await worker.recognize(images[i]);
      parts.push(data.text || '');
      if (onProgress) onProgress(i + 1, images.length);
    }
  } finally {
    await worker.terminate();
  }
  return parts.join('\n\n');
}

/**
 * 对扫描版 PDF 做整本 OCR，返回识别出的全文
 * @param {string} pdfPath
 * @param {object} [opts]
 * @param {(done:number,total:number)=>void} [opts.onProgress] - OCR 页级进度
 * @returns {Promise<string>}
 */
async function extractTextViaOCR(pdfPath, { onProgress } = {}) {
  if (!fs.existsSync(pdfPath)) throw new Error('PDF 文件不存在');

  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'toefl-ocr-'));
  try {
    const images = await renderPdfToImages(pdfPath, outDir);
    const text = await ocrImagesWithTesseract(images, { onProgress });
    if (!text.trim()) throw new Error('OCR 识别结果为空');
    return text;
  } finally {
    try { fs.rmSync(outDir, { recursive: true, force: true }); } catch (_) {}
  }
}

module.exports = {
  extractTextViaOCR,
  renderPdfToImages,
  ocrImagesWithTesseract,
};
