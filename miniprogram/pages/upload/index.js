// pages/upload/index.js
const api = require('../../utils/api');

Page({
  data: { uploading: false, progress: 0, parseResult: null },

  chooseFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['pdf'],
      success: (res) => {
        const file = res.tempFiles[0];
        if (file.size > 20 * 1024 * 1024) {
          wx.showToast({ title: '文件不能超过20MB', icon: 'none' });
          return;
        }
        this.uploadFile(file.path, file.name);
      },
    });
  },

  uploadFile(filePath, fileName) {
    this.setData({ uploading: true, progress: 0 });
    const uploadTask = wx.uploadFile({
      url: 'https://your-api-domain.com/api/questions/upload',
      filePath,
      name: 'file',
      header: { Authorization: `Bearer ${wx.getStorageSync('token')}` },
      success: (res) => {
        try {
          const data = JSON.parse(res.data);
          this.setData({
            uploading: false,
            progress: 100,
            parseResult: { fileName, questionCount: data.count || 5, subject: data.subject || '阅读' },
          });
        } catch (err) {
          this.setData({ uploading: false, parseResult: { fileName, questionCount: '-', subject: '-' } });
        }
      },
      fail: () => {
        this.setData({ uploading: false });
        wx.showToast({ title: '上传失败', icon: 'none' });
      },
    });

    uploadTask.onProgressUpdate((res) => {
      this.setData({ progress: res.progress });
    });
  },

  resetUpload() {
    this.setData({ parseResult: null, progress: 0 });
  },
});