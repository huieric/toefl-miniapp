// pages/upload/index.js
const api = require('../../utils/api');

Page({
  data: {
    uploading: false,
    parsing: false,
    progress: 0,
    statusText: '',
    parseResult: null,
  },

  chooseFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['pdf'],
      success: (res) => {
        const file = res.tempFiles[0];
        if (file.size > 50 * 1024 * 1024) {
          wx.showToast({ title: '文件不能超过50MB', icon: 'none' });
          return;
        }
        this.uploadFile(file.path, file.name);
      },
    });
  },

  uploadFile(filePath, fileName) {
    this.setData({ uploading: true, parsing: false, progress: 0, statusText: '正在上传...' });
    const uploadTask = wx.uploadFile({
      url: `${api.BASE_URL}/questions/upload`,
      filePath,
      name: 'file',
      header: { Authorization: `Bearer ${wx.getStorageSync('token')}` },
      success: (res) => {
        try {
          const data = JSON.parse(res.data);
          if (res.statusCode < 200 || res.statusCode >= 300 || data.code !== 200) {
            throw new Error(data.message || '上传失败');
          }
          const uploadId = data.data && data.data.uploadId;
          this.setData({
            uploading: false,
            parsing: true,
            progress: 100,
            statusText: '上传完成，正在解析题目...',
          });
          if (uploadId) {
            this.pollStatus(uploadId, fileName);
          } else {
            this.setData({
              parsing: false,
              parseResult: { fileName, questionCount: '-', subject: '阅读', status: '解析已提交' },
            });
          }
        } catch (err) {
          this.setData({ uploading: false, parsing: false });
          wx.showToast({ title: err.message || '上传失败', icon: 'none' });
        }
      },
      fail: () => {
        this.setData({ uploading: false, parsing: false });
        wx.showToast({ title: '上传失败', icon: 'none' });
      },
    });

    uploadTask.onProgressUpdate((res) => {
      this.setData({ progress: res.progress });
    });
  },

  pollStatus(uploadId, fileName) {
    let attempts = 0;
    const tick = () => {
      attempts += 1;
      api.get(`/questions/upload/${uploadId}/status`)
        .then((res) => {
          const data = res.data && res.data.data;
          if (!data) throw new Error('状态异常');

          if (data.status === 'completed') {
            const meta = data.meta || {};
            this.setData({
              parsing: false,
              statusText: '',
              parseResult: {
                fileName,
                questionCount: data.parsedCount || 0,
                subject: '阅读',
                status: meta.truncated
                  ? `已解析前 ${meta.parsedPages || '-'} 页`
                  : '已入库',
              },
            });
            return;
          }

          if (data.status === 'failed') {
            this.setData({ parsing: false, statusText: '' });
            wx.showToast({ title: data.error || '解析失败', icon: 'none' });
            return;
          }

          if (attempts < 20) {
            this.setData({ statusText: data.message || '正在解析中...' });
            setTimeout(tick, 3000);
          } else {
            this.setData({
              parsing: false,
              parseResult: { fileName, questionCount: '-', subject: '阅读', status: '解析中，请稍后刷新题库' },
            });
          }
        })
        .catch(() => {
          if (attempts < 20) setTimeout(tick, 3000);
          else this.setData({ parsing: false, statusText: '' });
        });
    };
    tick();
  },

  resetUpload() {
    this.setData({ parseResult: null, progress: 0, parsing: false, statusText: '' });
  },
});
