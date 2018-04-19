//index.js
//获取应用实例
const app = getApp();
var API = require('../../utils/API.js');
var consoleUtil = require('../../utils/consoleUtil.js');
var coordtransform = require('../../utils/coordtransform.js');
var constant = require('../../utils/constant.js');
var bdMapSdk = require('../../libs/bmap-wx.min.js');
//定义全局变量
var wxMarkerData = [];
var topHeight = 0;
var bottomHeight = 0;
var windowHeight = 0;
var mapId = 'myMap';
var BMap;
var sourceType = [
  ['camera'],
  ['album'],
  ['camera', 'album']
]
var sizeType = [
  ['compressed'],
  ['original'],
  ['compressed', 'original']
]

Page({
  data: {
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    longitude: '',
    latitude: '',
    markers: [],
    showTopTip: false,
    warningText: '',
    showUpload: true,
    showConfirm: false,
    showComment: false,
    //地图高度
    mapHeight: 0,
    infoAddress: '深圳市福田区购物公园腾讯大厦1126室',
    commentCount: 0,
    praiseCount: 0,
    commentList: [1, 1, , 1, , 1, , 1, 1,],
    selectAddress: '',
    uploadLongitude: '',
    uploadLatitude: '',
    uploadImagePath: '',
    showUploadImage: false,
  },

  onLoad: function () {
    var that = this;
    if (app.globalData.userInfo) {
      consoleUtil.log(1);
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse) {
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      consoleUtil.log(2);
      app.userInfoReadyCallback = res => {
        consoleUtil.log(3);
        app.globalData.userInfo = res.userInfo;
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      consoleUtil.log(4);
      wx.getUserInfo({
        success: res => {
          consoleUtil.log(5);
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
    that.userLogin();
    that.scopeSetting();
  },

  onShow: function () {
    var that = this;
    that.changeMapHeight();
  },

  userLogin: function () {
    wx.login({
      success: res => {
        //var that = this;
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        if (res.code) {
          app.globalData.code = res.code
          console.log(app.globalData.userInfo)
          if (app.globalData.userInfo) {
            var avatarUrl = app.globalData.userInfo.avatarUrl;
            var nickname = app.globalData.userInfo.nickName;
            var gender = app.globalData.userInfo.gender
          } else {
            var avatarUrl = '';
            var nickname = '';
            var gender = 0;
          }
          //console.log(res.code)
          //发起网络请求
          wx.request({
            url: API.obtainUrl(API.loginUrl),
            data: {
              wx_code: res.code,
              avatar: avatarUrl,
              nickname: nickname,
              gender: gender
            },
            header: {
              'content-type': 'application/json'
            },
            success: res => {
              //console.log(res.data.data)
              if (res.data.code == 1000) {
                app.globalData.header.Cookie = 'sessionid=' + res.data.data.session_id;
                app.globalData.checkStaus = res.data.data.status;
              } else if (res.data.code == 20001) {
                app.globalData.header.Cookie = 'sessionid=' + res.data.data.session_id;
              }
            },
            fail: res => {

            }
          })
        } else {
          console.log('获取用户登录态失败！' + res.errMsg)
        }
      }
    })
  },

  changeMapHeight: function () {
    var that = this;
    var count = 0;
    wx.getSystemInfo({
      success: function (res) {
        consoleUtil.log(res);
        windowHeight = res.windowHeight;
        //创建节点选择器
        var query = wx.createSelectorQuery();
        //选择id
        query.select('#top-tips').boundingClientRect()
        query.exec(function (res) {
          //res就是 所有标签为mjltest的元素的信息 的数组
          consoleUtil.log(res);
          count += 1;
          if (that.data.showTopTip){
            topHeight = res[0].height;
            that.setMapHeight(count);
          }
        })

        var query = wx.createSelectorQuery();
        query.select('#bottom-layout').boundingClientRect()
        query.exec(function (res) {
          consoleUtil.log(res);
          bottomHeight = res[0].height;
          count += 1;
          that.setMapHeight(count);
        })
      },
    })
  },

  setMapHeight: function (params) {
    var that = this;
    if (params == 2) {
      that.setData({
        mapHeight: (windowHeight - topHeight - bottomHeight) + 'px'
      })
      consoleUtil.log('mapHeight------------>' + that.data.mapHeight);
    }
  },

  scopeSetting: function () {
    var that = this;
    wx.getSetting({
      success(res) {
        //地理位置
        if (!res.authSetting['scope.userLocation']) {
          wx.authorize({
            scope: 'scope.userLocation',
            success(res) {
              that.initMap();
            },
            fail() {
              wx.showModal({
                title: '提示',
                content: '定位失败，你未开启定位权限，点击开启定位权限',
                success: function (res) {
                  if (res.confirm) {
                    wx.openSetting({
                      success: function (res) {
                        if (res.authSetting['scope.userLocation']) {
                          that.initMap();
                        } else {
                          consoleUtil.log('用户未同意地理位置权限')
                        }
                      }
                    })
                  }
                }
              })
            }
          })
        } else {
          that.initMap();
        }
      }
    })
  },

  /** 初始化地图 */
  initMap: function () {
    var that = this;
    console.log(constant.bdAK);
    BMap = new bdMapSdk.BMapWX({
      ak: constant.bdAK
    });

    that.getCenterLocation();
    that.requestLocation();
    // var markers = [{
    //   id: 1,
    //   latitude: '22.525204',
    //   longitude: '113.93042',
    //   iconPath: '../../img/dog-yellow.png',
    //   width: 40,
    //   height: 40,
    // }]

    // that.setData({
    //   markers: markers
    // })
  },

  //请求地理位置
  requestLocation: function () {
    var that = this;
    wx.getLocation({
      success: function (res) {
        that.setData({
          latitude: res.latitude,
          longitude: res.longitude,
        })
        //初始化后由于未知原因默认不在当前位置，先处理
        //that.selfLocationClick();
      },
    })
  },

  //点击marker
  makertap: function (e) {
    consoleUtil.log('点击了marker');
    consoleUtil.log(e);
    //点击了中心点 mraker, 不做处理
    if (e.markerId == -1){
      return;
    }
    var that = this;
    that.adjustViewStatus(false, false, true);
  },

  //上传情报
  uploadInfoClick: function () {
    var that = this;
    that.adjustViewStatus(false, true, false);
    that.setUploadLocation(that.data.latitude, that.data.longitude);
    that.regeocoding(that.data.latitude, that.data.longitude);
  },

  //更新上传坐标点
  setUploadLocation: function (latitude, longitude) {
    var that = this;
    that.setData({
      uploadLatitude: latitude,
      uploadLongitude: longitude
    })
  },

  //回到中心点
  selfLocationClick: function () {
    var that = this;
    var mapCtx = wx.createMapContext(mapId);
    mapCtx.moveToLocation();
  },

  cancelClick: function () {
    var that = this;
    that.resetPhoto();
    that.adjustViewStatus(true, false, false);
  },

  //确认上传
  confirmClick: function (res) {
    var that = this;
    consoleUtil.log(res);
    var message = res.detail.value.message.trim();
    if (!that.data.uploadLatitude || !that.data.uploadLongitude) {
      wx.showModal({
        title: '提示',
        content: '请选择上传地点',
        showCancel: false,
      })
      return;
    }
    if (!message) {
      wx.showModal({
        title: '提示',
        content: '请说点什么吧',
        showCancel: false,
      })
      return;
    }
    //成功
    var success = function(res){
      consoleUtil.log(res.data);
      var data = res.data;
      if (typeof (data) == 'string'){
        data = JSON.parse(data);
      }
      consoleUtil.log(data);
      if (data.code == 1000) {
        wx.showModal({
          title: '提示',
          content: '上传成功',
          showCancel: false
        });
        that.resetPhoto();
        that.adjustViewStatus(true, false, false);
      } else {
        wx.showModal({
          title: '提示',
          content: res.msg,
          showCancel: false
        });
      }
    }
    var fail = function (res) {
      consoleUtil.log('fail---------->' + res.data.code);
      wx.showModal({
        title: '提示',
        content: res.msg,
        showCancel: false
      });
    }

    var complete = function(res){
      wx.hideLoading();
    }
    wx.showLoading({
      title: '提交中...',
    })
    //有图用uploadFile
    if (that.data.uploadImagePath){
      consoleUtil.log('uploadFile----------->');
      wx.uploadFile({
        url: API.obtainUrl(API.uploadInfoUrl),
        header: app.globalData.header,
        filePath: that.data.uploadImagePath,
        name: 'image',
        formData: {
          lat: that.data.uploadLatitude,
          lng: that.data.uploadLongitude,
          address: that.data.selectAddress,
          message: message
        },
        success: success,
        fail: fail,
        complete: complete
      })
    }else{
      wx.request({
        url: API.obtainUrl(API.uploadInfoUrl),
        header: app.globalData.header,
        data: {
          lat: that.data.uploadLatitude,
          lng: that.data.uploadLongitude,
          address: that.data.selectAddress,
          message: message
        },
        success: success,
        fail: fail,
        complete: complete
      })
    }
  },

  //根据经纬度获取周围情报
  queryMarkerInfo: function () {
    wx.request({
      url: API.obtainUrl(API.queryInfoUrl),
      header: app.globalData.header,
      data: {
        lat: that.data.latitude,
        lng: that.data.longitude
      },
      success: function (res) {
        if (res.data.code == 1000) {
          consoleUtil.log('请求marker点成功');
        } else {
          wx.showModal({
            title: '提示',
            content: res.msg,
            showCancel: false
          });
        }
      },
      fail: function (res) {
        wx.showModal({
          title: '提示',
          content: res.msg,
          showCancel: false
        });
      }
    })
  },

  //点击控件时触发
  controlTap: function () {

  },

  //关闭评论
  colseCommentClick: function () {
    var that = this;
    that.adjustViewStatus(true, false, false);
  },

  adjustViewStatus: function (uploadStatus, confirmStatus, commentStatus) {
    var that = this;
    that.setData({
      showUpload: uploadStatus,
      showConfirm: confirmStatus,
      showComment: commentStatus,
    })
    that.changeMapHeight();
  },

  //点赞
  praiseClick: function () {

  },

  onShareAppMessage: function (res) {

  },

  //预览图片
  previewImage: function () {
    wx.previewImage({
      urls: ['https://images.unsplash.com/photo-1497163326116-446ff9cbfe51?ixlib=rb-0.3.5&ixid=eyJhcHBfaWQiOjEyMDd9&s=d398dd52d108a4bb45776fb82b1329e6&auto=format&fit=crop&w=800&q=60'],
    })
  },

  //选择照片
  takePhoto: function () {
    var that = this;
    consoleUtil.log('takePhoto');
    wx.chooseImage({
      sizeType: sizeType[1],
      count: 1,
      success: function (res) {
        consoleUtil.log(res.tempFilePaths[0]);
        that.setData({
          uploadImagePath: res.tempFilePaths[0],
          showUploadImage: true
        })
        that.adjustViewStatus(false, true, false);
      },
    })
  },

  //重置照片
  resetPhoto: function () {
    var that = this;
    that.setData({
      uploadImagePath: '',
      showUploadImage: false
    })
  },

  previewSelectImage: function () {
    var that = this;
    wx.previewImage({
      urls: [that.data.uploadImagePath],
    })
  },

  //拖动地图回调
  regionChange: function (res) {
    var that = this;
    // 改变中心点位置  
    if (res.type == "end") {
      that.getCenterLocation();
    }
  },

  //得到中心点坐标，并设置中心点 marker
  getCenterLocation: function(){
    var that = this;
    var mapCtx = wx.createMapContext(mapId);
    mapCtx.getCenterLocation({
      success: function (res) {
        console.log(res);
        that.setData({
          'markers[0]': {
            iconPath: "../../img/drag-icon.png",
            id: -1,
            latitude: res.latitude,
            longitude: res.longitude,
            width: 40,
            height: 40,
          }
        })
        that.regeocoding(res.latitude, res.longitude);
        that.setUploadLocation(res.latitude, res.longitude);
      }
    })
  },

  //地址解析
  regeocoding: function (lat, lng) {
    var that = this;
    var location = lat + "," + lng;
    var fail = function (data) {
      consoleUtil.log(data);
    };
    var success = function (data) {
      consoleUtil.log(data);
      var address = data.originalData.result.formatted_address + '\n\r' + data.originalData.result.sematic_description;
      consoleUtil.log(address);
      that.setData({
        selectAddress: address
      })
    }
    consoleUtil.log('location---------------->' + location);
    BMap.regeocoding({
      location: location,
      fail: fail,
      success: success,
    });
  },

  //选择地址
  chooseAddress: function(){
    var that = this;
    // wx.navigateTo({
    //   url: '../chooseAddress/chooseAddress',
    // })
  },

  getUserInfo: function (e) {
    console.log(e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  }
})
