define(['jquery'], function($) {
	'use strict';
	function base64_encode(str){var c1,c2,c3;var base64EncodeChars="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";var i=0,len=str.length,string='';while(i<len){c1=str.charCodeAt(i++)&0xff;if(i==len){string+=base64EncodeChars.charAt(c1>>2);string+=base64EncodeChars.charAt((c1&0x3)<<4);string+="==";break;}c2=str.charCodeAt(i++);if(i==len){string+=base64EncodeChars.charAt(c1>>2);string+=base64EncodeChars.charAt(((c1&0x3)<<4)|((c2&0xF0)>>4));string+=base64EncodeChars.charAt((c2&0xF)<<2);string+="=";break;}c3=str.charCodeAt(i++);string+=base64EncodeChars.charAt(c1>>2);string+=base64EncodeChars.charAt(((c1&0x3)<<4)|((c2&0xF0)>>4));string+=base64EncodeChars.charAt(((c2&0xF)<<2)|((c3&0xC0)>>6));string+=base64EncodeChars.charAt(c3&0x3F)}return string}
	function getQueryStringRegExp(name) {
            var reg = new RegExp("(^|\\?|&)" + name + "=([^&^#]*)(\\s|&|$|#)", "i");
            if (reg.test(location.href)) {
                return unescape(RegExp.$2.replace(/\+/g, " "));
            }
            return "";
        }
	var CollectApi = function($) {
			//客户端版本号
		var version = "",//PanelApi.getClientInfo('version'),
			//用户guid
			guid = "",//PanelApi.getClientInfo('guid'),
			//客户端通道号
			disnum = "",//PanelApi.getClientInfo('disnum'),
			//wps/wpp/et
			app = getQueryStringRegExp("app")?getQueryStringRegExp("app"):'wps',
			tempImg = new Image(),
			pn = 'dm=/wps/web/docer&action=docerclient&P0=' + guid 
			+ '&P1=5&P2='+app;

			if(window.parent.$.wpsApi) {
				window.parent.$.wpsApi.getWpsVersionInfo().done(function(result) {
		            if(result.callstatus === 'ok') {
		                //客户端版本号
						version = result.version;
						//用户guid
						guid = result.guid;
						//客户端通道号
						disnum = result.channelid;
		            }

		            pn = 'dm=/wps/web/docer&action=docerclient&P0=' + guid + '&P1=5&P2='+app;
				})
			}

		return {
			/**
			*	发送信息收集			
			*/
			sendCollect: function(P3,P4) {
				tempImg.src = 'http://wpsweb-dc.wps.cn/dc.gif?v=D1S1E1&d=' + base64_encode(pn + '&P3='+P3+'&P4='+(typeof(P4)!='undefined'?P4:'')+'&_t='+new Date().getTime());				
			},
			
			_addArg: function(args, p) {
				var arr = Array.prototype.slice.apply(args);
				if(p){
					arr.unshift(p);
				}
				return arr;
			},
			/**
			*	点击我的云字体
			*/
			clickmyfont: function(pos) {
				this.sendCollect(this._addArg(arguments, 'clickmyfont'));
			}
		}
	}($)

	return CollectApi;
})
