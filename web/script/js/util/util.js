define(function(require, exports, module) {
	'use strict';
	
	/**
	* 模拟页面跳转
	* @param url: 跳转地址
	*		 target: 跳转方式_self, _blank等
	*/
	function imitateLink(url, target) {
		var shareTempa = $('#shareTempa');
		if (!shareTempa.length) {
			$('body').append('<a href="javascript:void(0)" id="shareTempa"></a>');
			shareTempa = $('#shareTempa');
		}
		
		shareTempa.attr({href: url, target: target ? target : '_blank'});

		
		if (navigator.appVersion.match(/\bMSIE\b/)) {
			shareTempa[0].click(); 
		} else {
			var evt = document.createEvent('HTMLEvents');
			evt.initEvent('click', true, true);
			shareTempa[0].dispatchEvent(evt);
		}
	}

	function getQueryStringRegExp(name) {
	    var reg = new RegExp("(^|\\?|&)" + name + "=([^&^#]*)(\\s|&|$|#)", "i");
	    if (reg.test(location.href)) {
	        return unescape(RegExp.$2.replace(/\+/g, " "));
	    }
	    return "";
	}

	/**
	*	获取双显绑定忽略数组
	*	@参数 data: 输入数据
	*		  arr: 数组	
	*
	*/
	function getSkipArray(data, arr) {
		var _arr = [],
			x;
		if (arr.length) {
			for (x in data) {
				if (arr.indexOf(x) === -1) {
					_arr.push(x);
				}
			}
		} else {
			for (x in data) {
				_arr.push(x);				
			}
		}
		
		return _arr;
	}


	/**
	* 获取字符长度，中文与圆角为2字节
	* @param str: 字符
	*	
	* @return 返回字符长度
	*/
	function strLength(str) {
	    return str.replace(/[^\x00-\xff]/g, '**').length;
	}

	function getPath() {
		return $('#path').val();
	}

	/**
	* 根据毫秒数转换成 yyyy-mm-dd日期格式
	* @param b: 毫秒数	
	*		 seg: 分隔符， 默认'-'
	* @return 返回yyyy-mm-dd日期格式
	*/
	function secondsToDate(b, seg, flag){
		seg = seg ? seg : '-';
		var c = new Date();
		c.setTime(b);//转成时间型

		//拆解格式
		var y = c.getFullYear();
		var m = c.getMonth()+1;//0-11代表月份,0是一月
		var mstr = m.toString();
		if(mstr.length < 2){//不足两位加零
			mstr = '0' + mstr;
		}
		var d = c.getDate();
		var dstr = d.toString();//不足两位加零

		if(dstr.length < 2){
			dstr = '0' + dstr;
		}

		if (flag) {
			var hour = c.getHours(),
				min = c.getMinutes(),
				sec = c.getSeconds();

			hour = hour < 10 ? ('0' + hour) : hour;
			min = min < 10 ? ('0' + min) : min;
			sec = sec < 10 ? ('0' + sec) : sec;

			return y + seg + mstr + seg + dstr + ' ' + hour + ':' + min + ':' + sec;
		} else {
			return y + seg + mstr + seg + dstr;			
		}
	}

	/**
	* 根据毫秒数转换成 yyyy-mm-dd日期格式
	* @param b: 毫秒数	
	*		 seg: 分隔符， 默认'-'
	* @return 返回yyyy-mm-dd日期格式
	*/
	function secondsToTime(b){		
		var c = new Date();
		c.setTime(b);//转成时间型

		var hour = c.getHours(),
			min = c.getMinutes();
			hour = hour < 10 ? ('0' + hour) : hour;
			min = min < 10 ? ('0' + min) : min;
		return hour + ':' + min;
	}

	var base64 = function() {			
		var BASE64_MAPPING = [
			'A','B','C','D','E','F','G','H',
			'I','J','K','L','M','N','O','P',
			'Q','R','S','T','U','V','W','X',
			'Y','Z','a','b','c','d','e','f',
			'g','h','i','j','k','l','m','n',
			'o','p','q','r','s','t','u','v',
			'w','x','y','z','0','1','2','3',
			'4','5','6','7','8','9','+','/'
		];

		var base64DecodeChars = new Array(
		    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63,
		    52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1,
		    -1,  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14,
		    15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1,
		    -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
		    41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1);

		/**
		 *ascii convert to binary
		 */
		var _toBinary = function(ascii){
			var binary = new Array();
			while(ascii > 0){
				var b = ascii%2;
				ascii = Math.floor(ascii/2);
				binary.push(b);
			}
			/*
			var len = binary.length;
			if(6-len > 0){
				for(var i = 6-len ; i > 0 ; --i){
					binary.push(0);
				}
			}*/
			binary.reverse();
			return binary;
		};

		/**
		 *binary convert to decimal
		 */
		var _toDecimal  = function(binary){
			var dec = 0;
			var p = 0;
			for(var i = binary.length-1 ; i >= 0 ; --i){
				var b = binary[i];
				if(b == 1){
					dec += Math.pow(2 , p);
				}
				++p;
			}
			return dec;
		};

		/**
		 *unicode convert to utf-8
		 */
		var _toUTF8Binary = function(c , binaryArray){
			var mustLen = (8-(c+1)) + ((c-1)*6);
			var fatLen = binaryArray.length;
			var diff = mustLen - fatLen;
			while(--diff >= 0){
				binaryArray.unshift(0);
			}
			var binary = [];
			var _c = c;
			while(--_c >= 0){
				binary.push(1);
			}
			binary.push(0);
			var i = 0 , len = 8 - (c+1);
			for(; i < len ; ++i){
				binary.push(binaryArray[i]);
			}

			for(var j = 0 ; j < c-1 ; ++j){
				binary.push(1);
				binary.push(0);
				var sum = 6;
				while(--sum >= 0){
					binary.push(binaryArray[i++]);
				}
			}
			return binary;
		};

		var __BASE64 = {
				/**
				 *BASE64 Encode
				 */
				encode:function(str){
					var base64_Index = [];
					var binaryArray = [];
					for(var i = 0 , len = str.length ; i < len ; ++i){
						var unicode = str.charCodeAt(i);
						var _tmpBinary = _toBinary(unicode);
						if(unicode < 0x80){
							var _tmpdiff = 8 - _tmpBinary.length;
							while(--_tmpdiff >= 0){
								_tmpBinary.unshift(0);
							}
							binaryArray = binaryArray.concat(_tmpBinary);
						}else if(unicode >= 0x80 && unicode <= 0x7FF){
							binaryArray = binaryArray.concat(_toUTF8Binary(2 , _tmpBinary));
						}else if(unicode >= 0x800 && unicode <= 0xFFFF){//UTF-8 3byte
							binaryArray = binaryArray.concat(_toUTF8Binary(3 , _tmpBinary));
						}else if(unicode >= 0x10000 && unicode <= 0x1FFFFF){//UTF-8 4byte
							binaryArray = binaryArray.concat(_toUTF8Binary(4 , _tmpBinary));	
						}else if(unicode >= 0x200000 && unicode <= 0x3FFFFFF){//UTF-8 5byte
							binaryArray = binaryArray.concat(_toUTF8Binary(5 , _tmpBinary));
						}else if(unicode >= 4000000 && unicode <= 0x7FFFFFFF){//UTF-8 6byte
							binaryArray = binaryArray.concat(_toUTF8Binary(6 , _tmpBinary));
						}
					}

					var extra_Zero_Count = 0;
					for(var i = 0 , len = binaryArray.length ; i < len ; i+=6){
						var diff = (i+6)-len;
						if(diff == 2){
							extra_Zero_Count = 2;
						}else if(diff == 4){
							extra_Zero_Count = 4;
						}
						//if(extra_Zero_Count > 0){
						//	len += extra_Zero_Count+1;
						//}
						var _tmpExtra_Zero_Count = extra_Zero_Count;
						while(--_tmpExtra_Zero_Count >= 0){
							binaryArray.push(0);
						}
						base64_Index.push(_toDecimal(binaryArray.slice(i , i+6)));
					}

					var base64 = '';
					for(var i = 0 , len = base64_Index.length ; i < len ; ++i){
						base64 += BASE64_MAPPING[base64_Index[i]];
					}

					for(var i = 0 , len = extra_Zero_Count/2 ; i < len ; ++i){
						base64 += '=';
					}
					return base64;
				},
				/**
				 *BASE64  Decode for UTF-8 
				 */
				// decode : function(_base64Str){
				// 	var _len = _base64Str.length;
				// 	var extra_Zero_Count = 0;
				// 	/**
				// 	 *计算在进行BASE64编码的时候，补了几个0
				// 	 */
				// 	if(_base64Str.charAt(_len-1) == '='){
				// 		//alert(_base64Str.charAt(_len-1));
				// 		//alert(_base64Str.charAt(_len-2));
				// 		if(_base64Str.charAt(_len-2) == '='){//两个等号说明补了4个0
				// 			extra_Zero_Count = 4;
				// 			_base64Str = _base64Str.substring(0 , _len-2);
				// 		}else{//一个等号说明补了2个0
				// 			extra_Zero_Count = 2;
				// 			_base64Str = _base64Str.substring(0 , _len - 1);
				// 		}
				// 	}

				// 	var binaryArray = [];
				// 	for(var i = 0 , len = _base64Str.length; i < len ; ++i){
				// 		var c = _base64Str.charAt(i);
				// 		for(var j = 0 , size = BASE64_MAPPING.length ; j < size ; ++j){
				// 			if(c == BASE64_MAPPING[j]){
				// 				var _tmp = _toBinary(j);
				// 				/*不足6位的补0*/
				// 				var _tmpLen = _tmp.length;
				// 				if(6-_tmpLen > 0){
				// 					for(var k = 6-_tmpLen ; k > 0 ; --k){
				// 						_tmp.unshift(0);
				// 					}
				// 				}
				// 				binaryArray = binaryArray.concat(_tmp);
				// 				break;
				// 			}
				// 		}
				// 	}

				// 	if(extra_Zero_Count > 0){
				// 		binaryArray = binaryArray.slice(0 , binaryArray.length - extra_Zero_Count);
				// 	}

				// 	var unicode = [];
				// 	var unicodeBinary = [];
				// 	for(var i = 0 , len = binaryArray.length ; i < len ; ){
				// 		if(binaryArray[i] == 0){
				// 			unicode=unicode.concat(_toDecimal(binaryArray.slice(i,i+8)));
				// 			i += 8;
				// 		}else{
				// 			var sum = 0;
				// 			while(i < len){
				// 				if(binaryArray[i] == 1){
				// 					++sum;
				// 				}else{
				// 					break;
				// 				}
				// 				++i;
				// 			}
				// 			unicodeBinary = unicodeBinary.concat(binaryArray.slice(i+1 , i+8-sum));
				// 			i += 8 - sum;
				// 			while(sum > 1){
				// 				unicodeBinary = unicodeBinary.concat(binaryArray.slice(i+2 , i+8));
				// 				i += 8;
				// 				--sum;
				// 			}
				// 			unicode = unicode.concat(_toDecimal(unicodeBinary));
				// 			unicodeBinary = [];
				// 		}
				// 	}
				// 	return unicode;
				// }

				decode: function(str) {
				    var c1, c2, c3, c4;
				    var i, len, out;
					    len = str.length;
					    i = 0;
					    out = "";
					    while(i < len) {
					 /* c1 */
					 do {
					     c1 = base64DecodeChars[str.charCodeAt(i++) & 0xff];
					 } while(i < len && c1 == -1);
					 if(c1 == -1)
					     break;
					 /* c2 */
					 do {
					     c2 = base64DecodeChars[str.charCodeAt(i++) & 0xff];
					 } while(i < len && c2 == -1);
					 if(c2 == -1)
					     break;
					 out += String.fromCharCode((c1 << 2) | ((c2 & 0x30) >> 4));
					 /* c3 */
					 do {
					     c3 = str.charCodeAt(i++) & 0xff;
					     if(c3 == 61)
					  return out;
					     c3 = base64DecodeChars[c3];
					 } while(i < len && c3 == -1);
					 if(c3 == -1)
					     break;
					 out += String.fromCharCode(((c2 & 0XF) << 4) | ((c3 & 0x3C) >> 2));
					 /* c4 */
					 do {
					     c4 = str.charCodeAt(i++) & 0xff;
					     if(c4 == 61)
					  return out;
					     c4 = base64DecodeChars[c4];
					 } while(i < len && c4 == -1);
					 if(c4 == -1)
					     break;
					 out += String.fromCharCode(((c3 & 0x03) << 6) | c4);
					    }
					    return out;
					}
		};

		return __BASE64;
	}()

	function replaceUrl(url) {
		return url.replace(/\?/g, '**').replace(/\&/g, '*').replace(/\=/g, '$')
	}

	return {
		imitateLink: imitateLink,
		getQueryStringRegExp: getQueryStringRegExp,
		getSkipArray: getSkipArray,
		strLength: strLength,
		getPath: getPath,
		secondsToDate: secondsToDate,
		secondsToTime: secondsToTime,
		base64: base64,
		replaceUrl: replaceUrl
	};
});
