define(function(require, exports, module) {
	'use strict';
	var MiniApi = function() {
		var	api = window.external || {_notApi_: true},
			isFinish = false,					
			_settingPath = 'HKEY_CURRENT_USER\\Software\\Kingsoft\\Office\\6.0\\plugins\\minisite\\',
			reqObj = {};

		var method = function(m) {
			try {							
				m();
			} catch(_) {						
			}
		}

		return {
			check: function() {				
				return !!MiniApi.readSetting('minisitemode', '');
			},

			//设置窗口大小
			setSize: function(width, height, circle) {
				var i = '';
				method(function() {					
					i = api.ClickNotify('adjustcontainer', width + ':' + height + ':minisite:' + circle);
				})					
				return i;
			},

			documentComplete: function() {
				method(function() {
					api.ClickNotify('DocumentComplete');
				})
			},

			//编码
			enCodeString: function(value) {
				var res = ''
				method(function() {					
					res = api.EnCodeString(value);
				})
				return res;				
			},	

			//解码
			deCodeString: function(value) {
				var res = ''
				method(function() {					
					res = api.DeCodeString(value);
				})
				return res;				
			},		
			
			//AES编码
			JsEnCodeString: function(value){
				var res = ''
				method(function() {					
					res = api.JsEnCodeString(value);
				})
				return res;
			},
			
			//AES解码
			JsDeCodeString: function(value){
				var res = ''
				method(function() {					
					res = api.JsDeCodeString(value);
				})
				return res;	
			},

			//关闭窗口
			close: function() {																		
				setTimeout(function() {
					method(function() {					
						api.ClickNotify('windowClose', '')
					})					
				}, 100)
				
			},

			//关闭窗口(主动式，用于点击右上角关闭按钮)
			closeInitiat: function() {																		
				setTimeout(function() {
					method(function() {				
						api.ClickNotify('clickclosebtn', '')
					})					
				}, 100)
				
			},

			//创建桌面快捷方式
			adddesktoplink: function() {																		
				setTimeout(function() {
					method(function() {				
						api.ClickNotify('adddesktoplink', '')
					})					
				}, 100)
				
			},

			//移动窗口
			move: function() {
				method(function() {
					api.ClickNotify('hitcaption', '')
				})				
			},

			//最小化窗口
			mini: function() {
				method(function() {
					api.ClickNotify('minisize', '')
				})
				
			},	

			//使用默认浏览器打开超链接
			openUrl: function(url) {
				method(function() {
					api.ClickNotify('gotourl', url)					
				})
			},	

			//JS GET请求
			jsRequest: function(url, param, time, cb, timeout) {							
				method(function() {					
					var id = api.JsRequest(url, param, time, cb);
					if (timeout) {						
						reqObj[id] = setTimeout(function() {
							window[cb](id, '', 'timeout');
							delete reqObj[id];
						}, timeout)												
					}					
				})
			},

			//新版JS POST请求 接口, 支持设置Header 
			// 参数headers为字符串
			// 格式为"key1: value1\r\nkey2: value2\r\n......keyn:valuen\r\n"
			jsPost: function(url, param, time, cb, headers, body) {							
				method(function() {					
					var funcName = 'minipost_' + Math.ceil(Math.random()*10E5);
					window[funcName] = cb;
					api.JsPost(url, param, time, funcName, headers, body);					
				})
			},

			//ping 域名
			jsPingHosts: function(url, cb, _time) {
				var time = this.readRegSetting('hostsTime');								
				if (new Date() - time > _time) {					
					method(function() {					
						api.JsPingHosts(url, cb);											
					})
				} else {					
					window[cb]('', this.readRegSetting('hosts', true), true)					
				}
				
			},										

			//写数据
			writeSetting: function(a, b) {				
				method(function() {							
					api.WriteSetting(a, b)
				})
			},

			//读取数据
			readSetting: function(a, b) {
				var res = '';
				
				method(function() {					
					res = api.ReadSetting(a, b)
				})

				return res;
			},
			
			//写入cookie
			setCookie: function(host, name, data){
				method(function() {							
					api.JsSetCookie(host,name,data);
				})
			},
			
			//读取cookie
			getCookie: function(host, name){
				var res = '';
				
				method(function() {					
					res = api.JsGetCookie(host,name);
				})

				return res;
			},

			//写入注册表数据
			writeRegSetting: function(key, value, enCode) {
				this.writeSetting('wreg', _settingPath + key + ';sz;' + (enCode ? this.enCodeString(value) : value));					
			},

			//读取注册表数据
			readRegSetting: function(key, deCode) {		
				var res = this.readSetting('rreg', _settingPath + key);
				
				return deCode ? this.deCodeString(res) : res;
			},

			iframeFinish: function() {
				if (!isFinish) {
					method(function() {					
						api.JsAllIFramOnfinished();
					})
					isFinish = true;
				}
				
			},

			//直接调用ClickNotify函数
			clickNotify: function() {
				var arg = arguments;
				method(function() {
					api.ClickNotify(arg[0], arg[1]);
				})
			},

			//返回超过12点后未关闭wps/min时，mini置顶弹出的方式
			getOvernightType: function(a, b) {
				var res = '';
				
				method(function() {					
					res = api.GetOvernightType();
				})

				return res;
			},

			//获取mini的版本，1 普通版 2 电商版
			getMiniType: function() {
				var miniType = '';
				if(!this.check()) {
					var getQuery = function (name) {
					    var reg = new RegExp("(^|\\?|&)" + name + "=([^&^#]*)(\\s|&|$|#)", "i");
					    if (reg.test(location.href)) {
					        return unescape(RegExp.$2.replace(/\+/g, " "));
					    }
					    return "";
					}
					miniType = getQuery('mini_type') || ''
				} else {
					miniType = this.readRegSetting('type');									
				}
				miniType = {'1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6'}[miniType] || '1';
				return miniType;
			},

			checkReq: function(id) {
				return reqObj[id]
			},

			method: function(m) {
				method(m);
			}
		}
	}();	

	return MiniApi;
})