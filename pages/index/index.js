//index.js
//获取应用实例
const app = getApp();
var API = require('../../utils/API.js');
var consoleUtil = require('../../utils/consoleUtil.js');
var coordtransform = require('../../utils/coordtransform.js');
var constant = require('../../utils/constant.js');
var bmap = require('../../libs/bmap-wx.min.js');
//定义全局变量
var wxMarkerData = [];
var topHeight = 0;
var bottomHeight = 0; 
var windowHeight = 0;

Page({
  data: {
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    longitude: '',
    latitude: '',
    markers: [],
    warningText: '东滨路有狗！18:23',
    showUpload: true,
    showConfirm: false,
    //地图高度
    mapHeight: 0,
  },

  onLoad: function () {
    var that = this;
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse){
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
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

  onShow: function(){
    var that = this;
    that.changeMapHeight();
  },

  changeMapHeight: function(){
    var that = this;
    var count = 0;
    wx.getSystemInfo({
      success: function(res) {
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
          topHeight = res[0].height;
          that.setMapHeight(count);
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

  setMapHeight: function(params){
    var that = this;
    if(params == 2){
      that.setData({
        mapHeight: (windowHeight - topHeight - bottomHeight) + 'px'
      })
      consoleUtil.log('mapHeight------------>' + that.data.mapHeight);
    }
  },

  scopeSetting: function(){
    var that = this;
    wx.getSetting({
      success(res) {
        //地理位置
        if (!res.authSetting['scope.userLocation']) {
          wx.showModal({
            title: '提示',
            content: '你未同意定位权限，确认开启定位权限吗',
            success: function(res){
              if(res.confirm){
                wx.openSetting({
                  success: function (res) {
                    if(res.authSetting['scope.userLocation']){
                      that.initMap();
                    }else{
                      consoleUtil.log('用户未同意地理位置权限')
                    }
                  }
                })
              }
            }
          })
        }else{
          that.initMap();
        }
      }
    })
  },

  userLogin: function(){
    wx.login({

    })
  },

  /** 初始化地图 */
  initMap: function(){
    var that = this;
    console.log(constant.bdAK);
    var BMap = new bmap.BMapWX({
      ak: constant.bdAK
    });
    var fail = function (data) {
      console.log(data)
    };
    var success = function (data) {
      wxMarkerData = data.wxMarkerData;
      that.setData({
        markers: wxMarkerData
      });
      that.setData({
        latitude: wxMarkerData[0].latitude
      });
      that.setData({
        longitude: wxMarkerData[0].longitude
      });
    }
    BMap.regeocoding({
      fail: fail,
      success: success,
      iconPath: '../../img/dog-yellow.png',
      iconTapPath: '../../img/dog-select.png'
    });
  },

  makertap: function(e){
    wx.showModal({
      title: '提示',
      content: '你点击了marker',
    })
  },

  uploadInfoClick: function(){
    var that = this;
    that.setData({
      showUpload: false,
      showConfirm: true,
    })
    that.changeMapHeight();
  },

  selfLocationClick: function(){
    wx.showModal({
      title: '提示',
      content: '回到当前位置',
      showCancel: true,
    })
  },

  getUserInfo: function(e) {
    console.log(e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  }
})
