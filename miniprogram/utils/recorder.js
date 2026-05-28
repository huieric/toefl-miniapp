// utils/recorder.js - 录音管理器封装

const recorderManager = wx.getRecorderManager();
let currentOptions = null;

recorderManager.onStart(() => {
  console.log('录音开始');
});

recorderManager.onStop((res) => {
  if (currentOptions && currentOptions.success) {
    currentOptions.success(res.tempFilePath);
  }
});

recorderManager.onError((err) => {
  if (currentOptions && currentOptions.fail) {
    currentOptions.fail(err);
  }
});

/**
 * 开始录音
 * @param {object} options
 * @param {number} options.duration - 最大录音时长(ms)，默认 45000
 * @param {string} options.format - 格式，默认 'mp3'
 */
const start = (options = {}) => {
  recorderManager.start({
    duration: options.duration || 45000,
    sampleRate: 16000,
    numberOfChannels: 1,
    encodeBitRate: 48000,
    format: options.format || 'mp3',
    frameSize: 50,
  });
};

/**
 * 停止录音
 * @param {object} callbacks
 * @param {function} callbacks.success - 成功回调，参数为 filePath
 * @param {function} callbacks.fail - 失败回调
 */
const stop = (callbacks = {}) => {
  currentOptions = callbacks;
  recorderManager.stop();
};

/**
 * 暂停录音
 */
const pause = () => recorderManager.pause();

/**
 * 恢复录音
 */
const resume = () => recorderManager.resume();

module.exports = { start, stop, pause, resume };