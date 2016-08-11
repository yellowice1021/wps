define(function(require, exports, module) {
	var MiniApi = require('MiniApi');

	'use strict';
	//收集管理模块
	var CollectHandler = function() {
		var guid = '',
			distnum = '',
			version = '',
			apiversion = '',
			hdid = '',
			mode = MiniApi.readSetting('minisitemode', '') || 'web',
			modeParam = {auto: '0', tray: '0'}[mode] || 1,							
			showError = false,
			miniVersion = document.getElementById('version').value,
			miniType = '1',
			p = '';		
		
		//获取mini置顶展示的情况类型：未关闭wps/mini
		function getMiniTopType() {
			return MiniApi.getOvernightType();	
		}

		function replaceUrl(url) {
			return url.replace(/\?/g, '**').replace(/\&/g, '*').replace(/\=/g, '$')
		}

		return {
			init: function() {								
				guid = MiniApi.readSetting('guid', 'true');
				hdid = MiniApi.readSetting('hdid', '');
				distnum = MiniApi.readSetting('distnum', '');
				version = MiniApi.readSetting('version', '');
				apiversion = MiniApi.readSetting('apiversion', '');		
				miniType = MiniApi.getMiniType();
				//购物版和普通版区分收集数据
				var _P8 = ';' + (mode === 'tray' ? 0 : 1) + ';' + {1:2,2:3}[miniType] + ';';

				p = 'dm=/wps/client/minisite&p0=' + guid + '&p1=' + distnum + '&p2=' + version + '&p7=' + apiversion + '&p8=' + _P8 + '&p9=' + miniVersion + '&p10=' + hdid + '&';
			},

			getGuid: function() {
				return guid;
			},

			getDistnum: function() {
				return distnum;
			},

			getVersion: function() {
				return version;
			},

			getParam: function() {
				return p;
			},

			getApiversion: function() {
				return apiversion;
			},

			//内部信息上报系统
			sendCollect: function(action) {		
				var param = 'action=' + action,
					arg = arguments;

				param += '&pnum=' + (5 + arg.length);

				setTimeout(function() {
					for (var i = 1, j = arg.length; i < j; i++) {
						param = param + '&p' + (i + 2) + '=' + arg[i];
					}				
					
					MiniApi.jsRequest('http://info.wps.cn/wpsv6internet/infos.ads', 'v=D1S1E1&d=' + MiniApi.enCodeString(p + param), '1000', '');											

					//同时发送一份数据到推荐系统
					var msg = {};
					var recommendParam = (p + param).split('&');

					for (var i = recommendParam.length - 1; i >= 0; i--) {
						var arr = recommendParam[i].split('=');
						var pkey = (arr[0] + '').toUpperCase();
						msg[pkey] = (arr[1] + '');
					};

					CollectHandler.sendRecommendCollect($.extend({"MES_TYPE":"21"}, msg));

				}, 50)				
			},

			//推荐系统的上报模块
			sendRecommendCollect: function(msgobj) {
			    setTimeout(function() {

			        var templet = {"MES_TYPE":"","HDID": hdid,"TIME":(+new Date() + ''),"IP":""};
			        var param = $.extend(true,  {}, templet, msgobj);

			        MiniApi.jsPost('http://pixiu.shangshufang.ksosoft.com/', '', '3000', '', 'Content-Type:application/json\r\n', JSON.stringify(param));

			    }, 50)
			},

			//推荐系统的回传模块
			getRecommendContent: function(callback) {
			    var param = {"MES_TYPE":"31", "HDID": hdid, "TIME": (+new Date() + ''), "COUNT":"", "TYPE":""};
			    MiniApi.jsPost('http://bole.shangshufang.ksosoft.com', '', '3000', callback, 'Content-Type:application/json\r\n', JSON.stringify(param));
			},

			/**
			*	弹出判断
			* 	@param n: 0为正常，1为断网，2为第一个页签打不开，3为超过上限，4服务器返回代码解析错误
			*		   type: 断网类型 0为超时，1为返回undefined			
			*		   errorCode: 断网返回undefined情况下，发送错误码
			*/
			showCollect: function(n, type, errorCode) {
				var action = 'show',					
					p4 = n;
				
				var p3 = modeParam,
				    pMap = {'wps': 2,'mini': 3},
				    topType = getMiniTopType();
				if (topType in pMap) {
				    p3 = pMap[topType];
				}

				if (n !== 1) {																
					this.sendCollect(action, p3, p4);
				}

				if (n === 1 && !showError) {																
					showError = true;
					//当断网类型返回undefined时，发送错误码
					if (type === 1) {						
						this.sendCollect(action, p3, p4, type, errorCode);						
					} else {
						this.sendCollect(action, p3, p4, type);												
					}				
				}

				this.sendRecommendCollect({"MES_TYPE":"14","ACTION":"show","TYPE":p3});

			},

			/**
			*	获取接口错误
			*	@param url:接口地址
			*
			*/
			getDataError: function(url) {				
				this.sendCollect('getdataerror', replaceUrl(url));
			},

			/**
			*	窗口停留时间
			*	@param time: 停留时间
			*
			*/
			closeCollect: function(time, notTb) {		
				if(notTb !== void 0) {
					this.sendCollect('close', time, modeParam, notTb);	
				} else {
					this.sendCollect('close', time, modeParam);	
				}		
				//整个mini页停留时间
				this.sendRecommendCollect({"MES_TYPE":"12","ACTION":"close","DURATION":time * 1000});
			},

			/**
			*	设置不再弹出方式
			*	@param type: 0不再弹出，1 为一周内不弹出 4 当天显示
			*
			*/
			setShowTimecollect: function(type, isSelect, pos) {			
				var p3 = type + modeParam * 2,
				    pMap = {'wps': 9,'mini': 7},
				    topType = getMiniTopType();
				if (topType in pMap) {
				    p3 = type + pMap[topType];
				}	
				this.sendCollect('setshowtime', p3, isSelect, pos);
			},

			/**
			*	标签点击
			*	@param name: 标签名
			*		   cityName: 城市名
			*/
			clickModule: function(name, cityName) {				
				this.sendCollect('clickmodule', name, modeParam, cityName);
			},

			/**
			*	教育频道选择子页签
			*	@param name: 子页签名
			*/
			eduSelectTag: function(name) {						
				this.sendCollect('eduselecttag', name);
			},

			/**
			*	关闭按钮或最小化按钮
			*	@param type: 0为关闭按钮，1为最小化按钮，8 设置按钮并且是窗口展示的情况，9 创建桌面快捷方式
			*/
			clickButton: function(type) {
				var p3 = type + modeParam * 2,
				    pMap = {'wps': 3,'mini': 2},
				    topType = getMiniTopType();
				if(topType in pMap) {
					p3 = type + pMap[topType] * 2;	
				}							
				this.sendCollect('clickbutton', p3);

				//发送超过12点未关mini第二天置顶mini的show收集，通过关闭时判断来侧面反应
				if(type == 0 && topType === 'mini') {
					this.showCollect(0);
				}
			},

			/**
			*	点击底部广告
			*	@param name: 广告名
			*/
			clickBottom: function(name) {							
				this.sendCollect('clickbottom', name);
			},

			/*
			*	点击超链接
			*	@param url: 超链接地址
			*		   name: 页签名
			*/
			clickLink: function(url, name) {
				var p5 = modeParam,
				    pMap = {'wps': 3,'mini': 2},
				    topType = getMiniTopType();
				if(topType in pMap) {
					p5 = pMap[topType];	
				}												
				this.sendCollect('clicklink', replaceUrl(url), name, p5);
				
				//获取新闻的ID
				var urlId = url.split("/").pop().replace('.html', '');
				//收集新闻的点击量
				this.sendRecommendCollect({"MES_TYPE":"11","ACTION":"clicklink","URLID":urlId,"TAB":name,"ISPIC":"","CLICKTYPE":p5});
				
			},

			/**
			*	加载页签
			*	@param url: 页签名
			*/
			loadModule: function(name) {				
				this.sendCollect('loadmodule', name);
			},

			/**
			*	禁止淘宝
			*	@param passUrl: 通过的url
			*		   noPassurl: 不通过的url	
			*/
			banbusinessweb: function(passUrl, noPassurl) {
				this.sendCollect('banbusinessweb', passUrl, noPassurl);				
			},

			/**
			*	贴片广告
			*	@param type: 0/1  自动消失/点击关闭按钮消失
			*/
			pasterad: function(type) {
				this.sendCollect('pasterad', type);
			},

			/**
			*	头部广告
			*	@param type: 1  点击关闭按钮消失
			*/
			topad: function(type) {
				this.sendCollect('topad', type);
			},

			/**
			*	校验md5
			*
			*/
			verification: function(p) {
				this.sendCollect('verification', p);
			},

			/**
			*	不在白名单列表中的url地址
			*	@参数 url: url地址
			*/
			wrongurl: function(url) {
				this.sendCollect('wrongurl', replaceUrl(url));
			},

			/**
			*	切换第另一行频道
			*	@参数 line: 行数
			*/
			switchChannel: function(line) {
				this.sendCollect('changetab', line);
			},

			/**
			*	卡页内容切换(只有多屏时才统计)
			*	@参数 page: 页码 1 / 2 代表 第 一/二 页
			*         name: 页签名
			*/
			changeChannelPage: function(page, name) {
				this.sendCollect('tabcontentpaging', page, name);
			},

			/**
			*	百度搜索次数统计
			*	@参数 word: 关键词
			*         
			*/
			baidusearch: function(word) {
				this.sendCollect('baidusearch', replaceUrl(word));
			},

			/**
			*	礼包广告统计
			*	@参数 type: 1=点击礼包 2=15天未点击礼包 3=唤醒提示气泡
			*		  id: 礼包id
			*         
			*/
			present: function(type, id) {
				this.sendCollect('present', type, id);
			}

		}
	}();
	
	CollectHandler.init();

	return CollectHandler;
})