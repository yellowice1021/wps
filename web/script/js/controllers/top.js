define(function(require, exports, module) {
	'use strict';	

	//var jScrollPane = require('jScrollPane'),
	var	MiniApi = require('MiniApi'),
		CollectHandler = require('collect'),
		util = require('util'),		
		WeatherApi = require('weather'),
		dataServices = require('dataServices'),
		pagerscreen = require('pagerscreen'),
		Navigate = require('navigate');

	var mode = MiniApi.readSetting('minisitemode', '') || 'web',
		apiVersion = MiniApi.readSetting('apiversion', ''),
		stateMode = (mode === 'auto' || (mode === 'tray' && apiVersion > '4.0')) ? 0 : 1;	

	//读取展示哪套wps mini (普通版/电商版)
	var miniType = MiniApi.getMiniType();

	//弹窗模块
	var openTimeHandler = function() {		
		var timebucket = MiniApi.readRegSetting('timebucket'),
			arr = timebucket.split(','),
			intervalTime = '',
			date = new Date();
		
		//判断时间是否在要求之内
		var checkTime = function(d, i, arr) {			
			var t = arr[i],
				nTime = arr[i + 1],
				timeArr = t.split('-'),
				startTime = new Date(d + ' ' + timeArr[0]),
				endTime = new Date(d + ' ' + timeArr[1]);
			
			//如果时间在下个时间段之前，或者在当前时间段之内，都返回true
			if (+date < +startTime) {
				return i;
			}
			if ((nTime && +date < new Date(d + ' ' + nTime.split('-')[0])) || (+startTime < +date && +endTime > +date)) {
				return i + 1;
			} else {
				return false;
			}
		}

		//获取明天凌晨时间
		var tomorrow = function(seg, flag) {
			var d = new Date();
			d.setHours(0);
			d.setMinutes(0);
			d.setSeconds(0);
			return util.secondsToDate(+d + 86400000, seg ? seg : '-', flag);
		}

		// 根据inervalTime返回随机区间时间
		var randomTime = function() {	
			var arr = intervalTime.split('-');			
			return Math.ceil(Math.random() * (arr[1] - arr[0]) * 1000 + arr[0] * 1000)			
		}		

		/**
		*	获取下次弹窗时间
		*	@参数 nextTime: 返回下次时间规则
		*		  interval: 随机时间间隔
		*
		*/
		var get = function(nextTime, interval){
			intervalTime = interval || '0-3600';
			//如果只有一个时间段，则返回下次时间为当前时间段的第一个时间
			if (arr.length === 1) {
				return util.secondsToDate(+new Date(tomorrow('/') + ' ' + arr[0].split('-')[0])　+ randomTime(), '-', true);
			}

			//如果存在时间段弹出，则需判断下次弹出时间，没有则为第一个时间段第一个时间弹出
			if (arr.length > 1) {				
				var d = util.secondsToDate(+date, '/'),
					index = -1;
				if (nextTime) {
					for (var i = 0, j = arr.length; i < j; i++) {
						var nextIndex = checkTime(d, i, arr)
						if (nextIndex !== false) {
							index = nextIndex;						
							break;
						}
					}
				}
								
				
				if (index === -1 || index === arr.length) {															
					//返回明天第一个时间段时间
					return util.secondsToDate(+new Date(tomorrow('/') + ' ' + arr[0].split('-')[0]) + randomTime(), '-', true);					
				} else {
					//返回下次时间段	
					return util.secondsToDate(+new Date(d + ' ' + arr[index].split('-')[0]) + randomTime(), '-', true);
				}

			}
			
			return tomorrow('-', true);				
		}

		return {
			get: get
		}
		
	}()		

	var date = openTimeHandler.get(),
		navData = [],
		navDataObj = {},
		pingTimer = -1,
		dataObj = {};



	//获取页签数据
	var getTab = function() {
		var setData = function(data, code, cityName) {
			try {										
				//校验md5是否匹配，不匹配就发送信息收集
				if (mode !== 'web' && MiniApi.readSetting('md5string', data.tab[0].key + 'mini').toLocaleUpperCase() !== data.mini) {
					miniError();
					return;
				}	
			} catch(_) {
				miniError();
				return;
			}				

			date = openTimeHandler.get(data.nexttime, data.interval);		

			dataObj = data;
			
			//标题栏跳转链接
			if(miniType == 1){
				TopCtrl.logoHref = data.hot_logo_url;	
			}else{
				TopCtrl.logoHref = data.shop_logo_url;
			}

			//每个页签加载时间
			TopCtrl.loadTime = (data.loadtime || 7) * 1000;						

			//预加载多少个卡签
			TopCtrl.prevLoadCount = data.prevloadcount || 0;
				
			//需要ping的url地址
			TopCtrl.hosts = data.hostsad_urls || 'www.taobao.com';
			
			//ping缓存的时间
			TopCtrl.hostsLimitTime = (data.hostsad_expire || 21600) * 1000;

			//中央广告隐藏世家
			TopCtrl.centerTime = (data.center_ad_time || 5) * 1000;

			//中央广告隐藏方式
			TopCtrl.centerAdway = ~~data.center_ad_way || 0;

			//设置白名单
			Navigate.setWhiteList(data.domain_whitelist);

			//城市名
			TopCtrl.cityName = cityName || '默认';

			//默认卡页停留时间
			TopCtrl.showTime = (data.show_time === undefined ? 5 : data.show_time) * 1000;						

			//如果存在贴片广告
			if (data.center_ad) {
				TopCtrl.floatadMark = true;
				TopCtrl.floatadUrl = TopCtrl.getAdUrl('floatad', 1);
			}

			TopCtrl.miniData = data;

			TopCtrl.pingHosts();
													
			pingTimer = setTimeout(function() {
				window.pingHostsCallback('', 'timeout');						
			}, stateMode === 0 ? data.hostsad_timeout * 1000 : 1000);	
		}

		var _getTab = function(code, cityName) {
			var d = new Date(),
				path = $('#path').val(),
				_code = util.getQueryStringRegExp('_cityCode'),
				cityCode = _code || code,								
				url = '',
				distnum = CollectHandler.getDistnum(),
				genderDefer = $.Deferred(),
				genderTime = +new Date(MiniApi.readRegSetting('genderTime'));
			
			function setUrl(gender) {	
				url = (path ? path : (TopCtrl.getPath() + TopCtrl.miniVersion)) + '/' + gender + '/'+TopCtrl.miniType+'/tab' + (cityCode ? '_' + cityCode : '') + '.js';				
			}	

			if (window.gender === '1') {				
				//判断是否存在缓存
				if (isNaN(genderTime) || genderTime < +new Date()) {						
					if (window.pipenum === '' || distnum && window.pipenum && window.pipenum.indexOf(distnum) !== -1) {
						genderDefer = dataServices.get('gender').query({data: {pipe: distnum, guid: CollectHandler.getGuid()}}).done(function(result) {							
							MiniApi.writeRegSetting('gender', result);
							MiniApi.writeRegSetting('genderTime', util.secondsToDate(+new Date() + 86400000, '/', true));
						})							
					} else {					
						genderDefer.reject();
					}	
				} else {
					genderDefer.resolve(MiniApi.readRegSetting('gender'));
				}	
			} else {
				genderDefer.reject();
			}					
			
			genderDefer.done(function(result) {	
				if ((result + '').match('^[0-3]$')) {
					setUrl(result)
				} else {
					setUrl(3)
				}
			}).fail(function() {							
				setUrl(3)
			}).always(function() {
				function sendError() {
					CollectHandler.getDataError(url);
					//TopCtrl.loading = false;
					//TopCtrl.networkError = true;
					setData(window.defaultMinisiteData, code, cityName);
					TopCtrl.isErrorShow = true;					
				}

				function miniError() {
					CollectHandler.verification(0);
					//TopCtrl.loading = false;
					//TopCtrl.networkError = true;
					setData(window.defaultMinisiteData, code, cityName);
					TopCtrl.isErrorShow = true;					
				}
				
				$.ajax({
					url: url,
					data: {_t: '' + d.getFullYear() + (d.getMonth() + 1) + d.getDate() + d.getHours()},
					dataType: 'script',
					cache: true,
					timeout: 5000,
					success: function(result, textStatus, xhr) {											
						var data = window.minisiteData;
						if (!data) {					
							sendError();
							return;
						}		

						setData(data);
					},
					error: function(XMLHttpRequest, textStatus, errorThrown) {				
						sendError();
					}
				})
			})				
				
		}

		var defer = $.when(
						//获取需要分区域推送的城市代码列表
						$.ajax({
							url: TopCtrl.getPath() + '/config.js',
							dataType: 'script',
							cache: true,
							timeout: 5000
						}), 
						//获取当前城市代码
						WeatherApi.getCityCode()
					);
		
		defer.done(function(cityCodeDefer, result) {			
			var code = result[0],
				cityName = result[1];
			try {
				//判断当前城市代码是否在区域推送列表中			
				if (window.citycode.indexOf(code) !== -1) {				
					_getTab(code, cityName);	
				} else {
					_getTab();	
				}
			} catch(_e) {
				TopCtrl.loading = false;
				TopCtrl.networkError = true;
			}
		}).fail(function() {			
			_getTab();
		})	
		
	}	
	
	//页面会错回调函数
	window.OnNavigateError = function(url, b, c, d, e, f) {			
		//如果url为_index,则为接口错误
		// if (url === '__index_') {
		// 	setTimeout(function() {
		// 		TopCtrl.loading = false;
		// 		TopCtrl.networkError = true;	
		// 	}, 3000)
		// 	if (b === 'timeout') {
		// 		CollectHandler.showCollect(1, 0);			
		// 	} else if(b === void 0) {				
		// 		CollectHandler.showCollect(1, 1, c);			
		// 	}
		// 	if (stateMode === 0) {
		// 		MiniApi.close();
		// 	}
		// 	return;
		// }
		
		//判断url是否为页签url，如果是，显示网络中断		
		var index = navDataObj[url.replace(/&__t=[0-9]*/, '')]	
		

		if (index !== void 0) {			
			if (stateMode === 0 && index === 0) {	
				CollectHandler.showCollect(2);							
				MiniApi.close();				
			}		

			var num = index - TopCtrl.navData.length + 1; 
			if (num >= 0) {
				MutTabCtrl.mutTabData[num].iframeError = true;
			} else {
				TopCtrl.navData[index].iframeError = true;				
			}
			//$('#content iframe').eq(index).hide().prev().show();
		}		
	}

	//超链接回调函数，兼容旧版本，不做白名单控制
	window.needNavigate = function(url) {		
		setTimeout(function() {
			TopCtrl.sendSelectCount(url);
			CollectHandler.clickLink(url, TopCtrl.navData[TopCtrl.tag].name);			
		}, 50)

		return true;
	}	

	//新的超链接回调函数，需要做白名单控制
	window.newNeedNavigate = function(url) {		
		var state = Navigate.checkWhitelist(url);
		
		setTimeout(function() {
			if (state) {
				//会员去广告/百度搜索 链接不发送收集
				if(url.indexOf('//vip.wps.cn/zt/qingtong') === -1 && url.indexOf('//www.baidu.com/s') === -1 && url.indexOf('//www.baidu.com/index.php') === -1 ) {
					TopCtrl.sendSelectCount(url);
					CollectHandler.clickLink(url, TopCtrl.navData[TopCtrl.tag].name);
				}
			} else {
				CollectHandler.wrongurl(url);
			}			
		}, 50)

		return state;
	}

	//窗口点击回调
	window.MouseDownNotify = function(x, y) {
		//坐标落在设置图标时，禁止相应
		if (x > 657 && y > 8 && x < 677 && y < 19) {
				return;
		}
		//当设置菜单显示时，菜单区域禁止相应
		if (TopCtrl.setting) {	
			if (x > 611 && y > 27 && x < 729 && y < 97) {
				return;
			}
		}
		TopCtrl.closeSetting();		
	}		

	//ping域名回调函数
	window.pingHostsCallback = function(id, result, w) {		
		clearTimeout(pingTimer);
		var flag = true,
			passUrl = '',
			noPassurl = '';
		
		if (result === 'timeout' && mode !== 'web') {						
			flag = false;
			//如果是电商版，并且用户环境ping不通电商网站，则直接关闭mini
			if(TopCtrl.miniType == '2') {
				CollectHandler.closeCollect(Math.ceil((new Date() - TopCtrl.openTime) / 1000), 1);
				MiniApi.closeInitiat();
				return; 	
			}
			
		} else {			
			var arr = result.split('&'),
				obj = {},				
				flag = true;

			//生成没有屏蔽的电商网站与屏蔽的网站
			for (var i = 0, j = arr.length; i < j; i++) {
				var dArr = arr[i].split('=');
				obj[dArr[0]] = dArr[1];
				if (dArr[1] === '0') {
					noPassurl = noPassurl + dArr[0] + ';';
					flag = false;
				} else {
					passUrl = passUrl + dArr[0] + ';';
				}
			}			
			if (w === void 0) {
				MiniApi.writeRegSetting('hosts', result, true);
				MiniApi.writeRegSetting('hostsTime', +new Date())
			}
		}
		
		CollectHandler.banbusinessweb(passUrl.substring(0, passUrl.length - 1), noPassurl.substring(0, noPassurl.length - 1));
		
		TopCtrl.showAd = flag;


		var tabData = [], //页签数据		
			mutTabData = [], //子页签数据
			param = TopCtrl.getIframeParam(),
			_param = param.replace(/&__t=[0-9]*/, '');

		dataObj.currenttab = +dataObj.tablist[new Date().getHours()];

		function formatData(d) {
			d.iframeLoading = true;
			d.iframeError = false;	
			
			d.timer = 0;
			d.isLoad = false;
			//如果该页签需要传参数。则加参数
			if (d.isparam) {
				d.url += _param;					
			}
			
			d.isTwoScreen = d.screen === '2'			
			
			d.hasAd = !!d.isad;
			
			return d;
		}

		for (var i = 0, j = dataObj.tab.length, cur = dataObj.currenttab; i < j; i++) {
			var d = dataObj.tab[i];
			
			if (d.ishidden !== 1 || flag) {											
				//如果存在子页签模式，则对子页签也进行格式化
				if (d.type === 3) {
					continue;
				}
				// 	for (var n = 0, m = d.data.length; n < m; n++) {
				// 		var _d = d.data[n];

				// 		if (_d.ishidden !== 1 || flag) {
							var _d = formatData(d);
							//如果一级页签小于12个，则使用二级页签补上
							if (tabData.length < 12) {
								tabData.push(_d)
							} else {
								mutTabData.push(_d);								
							}
							// navDataObj[_d.url] = i + n;	
						// }						
					// }

				// 	if (mutTabData.length) {
				// 		tabData.push(formatData(d));
				// 	}			
				// } else {
				// 	tabData.push(formatData(d));
				// }


				navDataObj[d.url] = i;
			} else {
				//如果当前索引小于需要显示的页签索引，则需显示页签索引减去1
				if (i < cur) {
					--cur;
				}
				//如果原需要显示的页签索引存在，则设置为0
				if (dataObj.currenttab === i) {
					dataObj.currenttab = 0;
				}				
			}			
		}
		tabData = tabData.slice(0, 12);
		dataObj.currenttab = dataObj.currenttab ? cur : dataObj.currenttab;

		TopCtrl.adUrl =  TopCtrl.path[0] + TopCtrl.miniVersion +  '/bottom_ad.html'//dataObj.bottomad;
		
		TopCtrl.navData = tabData;

		//从推荐系统获取新闻卡页的内容
		CollectHandler.getRecommendContent(function(a, b, c) {
			if(c) {
				var _navArray = TopCtrl.navData.$model;
				for(var w= 0, len = _navArray.length; w < len; w++ ) {
					if(_navArray[w].key === 'mini_news') {
						TopCtrl.navData[w].data = c;
						break;
					}
				}
			}
		});
		
		TopCtrl.logoUrl = dataObj.logo;		

		//头部广告
		if (~~dataObj.top_ad) {
			TopCtrl.topadMark = true;
			TopCtrl.topadUrl = TopCtrl.getAdUrl('topad', 1);
		}

		if (~~dataObj.aside_ad) {
			TopCtrl.getAsideAdData(~~dataObj.aside_ad);
		}
		
		MutTabCtrl.mutTabData = mutTabData;
		
		MutTabCtrl.init();
		
		setTimeout(function() {	
			var nv = +dataObj.currenttab;
			var showMore = false;
			if(nv + 1 > TopCtrl.navData.length) {
				var mulIndex = nv - TopCtrl.navData.length;
				if(MutTabCtrl.mutTabData[mulIndex]) {	
					showMore = true;
					MutTabCtrl.selectMark = mulIndex;
					TopCtrl.enterMoreBtn();
				}
				nv = dataObj.currenttab = 0;
			}
			TopCtrl.tag = nv;
				
			if (stateMode === 0) {
				TopCtrl.checkAutoOpen();
			} else {
				if (!showMore && dataObj.tab[TopCtrl.tag].type === 1) {
					TopCtrl.startTrans();
				}
			}

			if (dataObj.is_get_weather) {
				TopCtrl.updateWeather();							
			}
		}, 100)

		setTimeout(function() {
			TopCtrl.networkError = false;

			TopCtrl.loading = false;	
			if (stateMode !== 0) {
				CollectHandler.showCollect(TopCtrl.isErrorShow ? 5 : 0);
			}				
			
		}, 10)		
		
		window.pingHostsCallback = function() {
			
		}
	}

	var TopCtrl = avalon.define('TopCtrl', function(vm) {
		//页签索引
		vm.tag = -1;	

		vm.num = 0;
		
		//标题栏logo跳转链接
		vm.logoHref = '';
		
		//标题栏小红点
		vm.redDot = true;
		
		//标题栏是否显示天气tip
		vm.weatherTip = false;
		
		//标题栏是否显示礼包tip
		vm.giftBagShow = false;
		
		//天气图标序号
		vm.weatherIconNum = '22';
		
		//天气图标png gif
		vm.weatherIconType = '.png';

		//自动加载时，每个图片的加载时间
		vm.loadTime = 7000;

		//托盘模式时，预加载卡页个数
		vm.prevLoadCount = 0;

		//logo地址
		vm.logoUrl = '';

		//底部广告地址
		vm.adUrl = '';

		//页签滚动计时器
		vm.timer = 0;
		
		//显示客户端时间
		vm.openTime = 0;

		vm.iframeLoadTime = 0;

		//天气数据
		vm.weather = '';		

		//loading标识
		vm.loading = true;

		//网络错误标识
		vm.networkError = false;

		//导航数据
		vm.navData = [];

		//显示loading
		vm.showLoading = true;

		//显示网络错误
		vm.showNetError = false;

		//显示设置
		vm.setting = false;

		//一周内不再弹出
		vm.notShowWeek = false;

		//是否以后不再弹出
		vm.notShow = false;

		//客户端是否已显示标志
		vm.isShow = false;

		//停止轮换标志
		vm.neverTrans = false;

		//超时计时器
		vm.autoTimer = 0;

		//是否显示广告
		vm.showAd = true;

		//需要ping的域名
		vm.hosts = '';

		//ping域名结果缓存时间
		vm.hostsLimitTime = 21600000;

		//信息收集参数
		vm.collectParam = '';

		//自动模式下需要加载的iframe标签
		//vm.autoNavData = [];

		vm.miniVersion = '1.0.1';

		//鼠标移动切换页签计时器
		vm.selectTimer = 0;

		//vm.loadCtrl = [];

		//头部广告显示标识
		vm.topadMark = false;

		//头部广告地址
		vm.topadUrl = '';

		//中央广告显示标识
		vm.floatadMark = false;

		//中央广告消失计时器
		vm.floatadTimer = 0;

		//中央广告地址
		vm.floatadUrl = '';

		//右侧广告显示标识
		vm.asideAdMask = false;

		//右侧广告数据
		vm.asideAdData = [];

		//头部广告关闭按钮显示标识
		vm.closeTopadMark = false;

		//中央广告隐藏方式
		vm.centerAdway = 0;

		//cdn地址
		vm.path = ['http://img1.mini.cache.wps.cn/wpsmini/script/', 'http://img2.mini.cache.wps.cn/wpsmini/script/'];

		vm.loadType = false;

		//贴片广告消失时间
		vm.centerTime = 0;

		vm.cityName = '默认';

		//默认卡页默认显示时间
		vm.showTime = 5000;

		//当天显示
		vm.showToday = false;

		//是否错误显示
		vm.isErrorShow = false;

		vm.pagerscreenModel = '';

		vm.bdSearchKey = '';

		//频道初始数据
		vm.miniData = {};

		//是否不选择频道
		vm.notSelectTag = false;
		//穿衣指数
		vm.dressNum = 4;

		//天气情况 1晴 2云 3雨
		vm.weatherFlag = 1;

		vm.searchBaidu = function(event) {
			if (event.keyCode == 13 || event.target.nodeName === 'A'){  
				CollectHandler.baidusearch($.trim(TopCtrl.bdSearchKey));
				document.getElementById('bdSeachForm').submit();
		    }
		}

		vm.pagerscreen = {
			onInit: function(element, pagerscreenModel) {
				TopCtrl.pagerscreenModel = pagerscreenModel;
			},

			onUp: function() {				
				if (TopCtrl.isTwoScreen) {
					TopCtrl.parterEffect();
				}
			},

			onDown: function() {
				if (TopCtrl.isTwoScreen) {
					TopCtrl.parterEffect();
				}
			}
		}

		//判断是否双屏卡页
		vm.isTwoScreen = true;

		//是否显示更多按钮
		vm.isMore = true;

		//更多按钮文案
		vm.moreBtnText = '更多';

		//锁定更多按钮状态
		vm.lockMoreBtn = false;

		//指定显示哪套wps mini (普通版或电商版)
		vm.miniType = miniType;  

		vm.$skipArray = ['num', 'loadTime', 'autoTimer', 'hosts', 'hostsLimitTime', 'collectParam', 'miniVersion', 'neverTrans', 'selectTimer', 'path', 'loadType', 'floatadTimer', 'centerTime', 'cityName', 'centerAdway', 'showTime', 'pagerscreen', 'lockMoreBtn', 'pagerscreenModel', 'miniData']

		//初始化
		vm.init = function() {						
			var p = CollectHandler.getParam();
			vm.miniVersion = $('#version').val();						
			vm.collectParam = MiniApi.enCodeString(p.substring(0, p.length - 1));
			vm.getNavData();	

			if (stateMode !== 0) {
				vm.showMiniSite();
			} else {
				vm.iframeLoadTime = new Date();	
				vm.autoTimer = setTimeout(function() {						
					CollectHandler.showCollect(6); 
					MiniApi.close();
				}, 900000);		
				//vm.checkAutoOpen();									
			}			
			
		}

		vm.pingHosts = function() {
			MiniApi.jsPingHosts(vm.hosts, 'pingHostsCallback', vm.hostsLimitTime);
		}

		//选择页签时发送点击计数
		vm.sendSelectCount = function(url) {
			var guid = CollectHandler.getGuid(),
				data = vm.navData[vm.tag],
				_url = url.match('^(http|https)://[^/]*')[0],
				channel = data.key;				

			//如果为子页签则使用子页签的key
			if (data.type === 3) {
				channel = MutTabCtrl.mutTabData[MutTabCtrl.selectMark].key;				
			}			

			MiniApi.jsRequest('http://mini.wps.cn/v2.php/api/counter/incrclick', 'guid=' + guid + '&url=' + _url + '&channel=' + channel + '&sig=' + MiniApi.enCodeString(guid + channel + _url), '1000', '');
		}

		vm.select = function(e, i, name) {			
			if(TopCtrl.notSelectTag) {
				TopCtrl.notSelectTag = false;
				return;
			}
			vm.selectTimer = setTimeout(function() {
				vm.tag = i;			
				vm.neverTrans = true;
				vm.stopTrans();				
				CollectHandler.clickModule(name, vm.cityName);
			}, 200)

			e.preventDefault();
		}

		vm.stopSelect = function() {
			clearTimeout(vm.selectTimer);
		}

		vm.showTag = function(i, m) {			
			return vm.tag === i && m;
		}

		//获取传入iframe的参数
		vm.getIframeParam = function() {
			return '#param=' + MiniApi.enCodeString(CollectHandler.getParam()) + '&showAd=' + (vm.showAd ? 0 : 1) + '&version=' + vm.miniVersion;
		}

		//获取参数
		vm.getParam = function() {			 
			//return '?param=' + MiniApi.enCodeString(CollectHandler.getParam()) + '&showAd=' + (vm.showAd ? 1 : 0)// + '&__t=' + +new Date();
			return '';
		}

		//开始轮播
		vm.startTrans = function() {
			if (!vm.neverTrans) {
				clearInterval(vm.timer);
				vm.timer = setTimeout(function() {
					vm.tag++;
					vm.timer = setInterval(function() {
						vm.tag++;
					}, 5000)				
				}, vm.showTime)
				
			}
			
		}

		//停止轮播
		vm.stopTrans = function() {			
			clearInterval(vm.timer);
		}		

		//获取页签数据
		vm.getNavData = function() {	
			getTab();
		}

		//更新天气
		vm.updateWeather = function() {			
			WeatherApi.getWeather(TopCtrl);
		}	

		//添加快捷方式到桌面
		vm.addDesktop = function() {			
			CollectHandler.clickButton(15);
			MiniApi.adddesktoplink();
		}	

		//iframe加载完毕回调函数
		vm.iframeLoad = function(e, i) {														
			vm.loadType = true;
			var _target = e.target,
				$target = $(_target),
				state = _target.readyState,
				_src = $target.attr('src'),
				data = vm.navData[i];
			//若对象模型已加载，则认为页面正常

			if (state === 'interactive') {
				if (_src !== 'about:blank') {
					data.timer = setTimeout(function() {
						vm.showIframe(i);
					}, 3000)
					//CollectHandler.loadModule(data.name);
				}				
			} else if(state === 'complete'){
				if (_src !== 'about:blank') {
					clearTimeout(data.timer);
					vm.showIframe(i);
				}
			}
		}

		/**
		*	兼容无readystatechange事件的浏览器
		*
		*
		*/
		vm.iframeOnLoad = function(e, i) {
			if (!vm.loadType) {
				var $target = $(e.target),
					_src = $target.attr('src'),
					data = vm.navData[i];
				if (_src !== 'about:blank') {										
					vm.showIframe(i);
				}
			}			
		}

		/**
		* 	显示iframe
		*	@参数 i: iframe索引
		*/
		vm.showIframe = function(i) {			
			var data = vm.navData[i];

			data.iframeLoading = false;			
			
			if (stateMode !== 0 && i === dataObj.currenttab) {
				vm.startTrans();
			}
		}		

		//关闭窗口
		vm.closeWindow = function(e) {
			CollectHandler.closeCollect(Math.ceil((new Date() - vm.openTime) / 1000));
			CollectHandler.clickButton(0);
			MiniApi.closeInitiat(); 
			e.preventDefault();
		}

		//移动窗口
		vm.moveWindow = function(e) {
			MiniApi.move();
			e.preventDefault();
		}

		//最小化窗口
		vm.minisize = function() {
			CollectHandler.clickButton(1);
			MiniApi.mini();
		}

		//打开窗口设置
		vm.toggleSetting = function(e) {			
			vm.setting = !vm.setting;
			e.preventDefault();
			e.stopPropagation();

			//收集设置窗口的展示量
			if(vm.setting) {
				CollectHandler.clickButton(8);
			}
		}

		//关闭窗口设置
		vm.closeSetting = function(e) {			
			vm.setting = false;
			//e && e.preventDefault();
		}

		//当前显示
		vm.toggleOpenToday = function(e, isClick, pos) {			
			vm.showToday = true;
			
			if (vm.showToday) {				
				vm.notShow = false;					
				vm.notShowWeek = false;
			}
			
			MiniApi.clickNotify('delayshow', 'cancel');			

			if (isClick) {
				CollectHandler.setShowTimecollect(4, 1, pos);
			}
			vm.writeNextTime(date);

			e.preventDefault();
			e.stopPropagation();
		}

		//一周不再弹出
		vm.toggleOpenWeek = function(e, isClick, pos) {
			var t = date;
			vm.notShowWeek = !vm.notShowWeek;
			
			if (vm.notShowWeek) {
				t = util.secondsToDate(+new Date() + 604800000, '-', true);
				vm.notShow = false;		
				vm.showToday = false;		
			} else {
				vm.showToday = true;
			}
			
			MiniApi.clickNotify('delayshow', vm.notShowWeek ? 'aweeklater' : 'cancel');
			

			if (isClick) {
				CollectHandler.setShowTimecollect(1, vm.notShowWeek ? 1 : 0, pos);
			}
			vm.writeNextTime(t)
			//MiniApi.writeRegSetting('nextpoupuptime', t);						
			e.preventDefault();
			e.stopPropagation();
		}

		//以后都不再弹出
		vm.toggleOpen = function(e, isClick, pos) {
			var t = date;
			vm.notShow = !vm.notShow;	

			if (vm.notShow) {
				t = util.secondsToDate(+new Date() + 100604800000, '-', true)
				vm.notShowWeek = false;	
				vm.showToday = false;						
			} else {
				vm.showToday = true;
			}
			
			MiniApi.clickNotify('delayshow', vm.notShow ? 'never' : 'cancel');
			

			if (isClick) {
				CollectHandler.setShowTimecollect(0, vm.notShow ? 1 : 0, pos);
			}
			vm.writeNextTime(t)
			//MiniApi.writeRegSetting('nextpoupuptime', t);		
			e.preventDefault();
			e.stopPropagation();
		}

		//不再弹出(用于点击引导青铜链接,只发信息收集)
		vm.toggleOpen4Link = function(e, isClick, pos) {
			if (isClick) {
				CollectHandler.setShowTimecollect(0, vm.notShow ? 1 : 0, pos);
			}
			e.stopPropagation();
		}

		//显示minisite
		vm.showMiniSite = function() {			
			if (!vm.isShow) {				
				vm.openTime = new Date();
				vm.isShow = true;
				vm.initVersion();
				setTimeout(function() {
					//当为web模式时，定时关闭贴片广告
					if (mode === 'web') {
						vm.setFloatTimeout();

						TopCtrl.initGiftBagAd();
						TopCtrl.checkBdAdTop();
					}

					if (MiniApi.setSize(751, 541, 5) === 0) {						
						if (mode !== 'tray') {
							vm.setFloatTimeout();
							//vm.writeNextTime(date);
						}			

						if (mode === 'auto') {
							vm.writeNextTime(date);
						}
						
						if (stateMode === 0) {
							MiniApi.clickNotify('delayshow', 'cancel');
							if (mode === 'auto' || CollectHandler.getApiversion() <= '4.0') {								
								CollectHandler.showCollect(TopCtrl.isErrorShow ? 5 : 0);
								vm.startTrans();
							}
							clearTimeout(vm.autoTimer);
						}

						TopCtrl.checkDelayshow(MiniApi.readRegSetting('delayshow', false));
					} else {
						CollectHandler.showCollect(7); //设置mini大小失败发送收集	
						MiniApi.close();						
					}							
				}, 1000);
				
			}			 
		}		
		
		//判断版本号是否更新(更新则显示标题栏小红点)
		vm.initVersion = function() {

			var nowVersion = CollectHandler.getVersion();				// 获取客户端版本号
			var oldVersion = MiniApi.readRegSetting("wpsVersion");		// 读取缓存中客户端版本号
			
			if(oldVersion){
				// 缓存存在
				if(nowVersion === oldVersion){	//版本号不变
					vm.redDot = true;
				}else{							//版本号改变
					vm.redDot = true;
				}
				MiniApi.writeRegSetting('wpsVersion', nowVersion);			// 更新缓存
			}else{
				// 缓存不存在则写入缓存
				MiniApi.writeRegSetting('wpsVersion', nowVersion);
				vm.redDot = true;
			}
			
		}
		
		//点击标题栏
		vm.setRedDot = function() {
			if(vm.redDot){
				vm.redDot = false;
			}
		}
		
		vm.setValue = function(key, value) {
			vm[key] = value;	
		}

		//整体刷新
		vm.refreshTop = function(e) {
			vm.loading = true;
			vm.networkError = false;
			vm.getNavData();			
			e.preventDefault();
		}		

		//刷新iframe
		vm.refreshIframe = function(e, i) {
			var data = vm.navData[i],
				el = $('#' + data.key).attr('src', data.url);			

			el[0].src = el.attr('src')//.replace(/(&__t=)[0-9]*/, '$1' + +new Date())

			data.iframeError = false;
			data.iframeLoading = true;			
			e.preventDefault();
		}

		//自动模式下定时加载iframe
		vm.checkAutoOpen = function() {			
			vm.loadUrl(vm.num);

			//使用配置的预加载卡页个数
			var navCount = vm.navData.length,
				loadCount = +vm.prevLoadCount;

			if(loadCount > 0 && loadCount < navCount) {
				navCount = loadCount;
			}

			var timer = setInterval(function() {				
				if (++vm.num === navCount) {					
					clearInterval(timer);
					vm.showMiniSite();
					return;
				}				
				vm.loadUrl(vm.num);
			}, vm.loadTime)			

			//seajs.use(vm.loadCtrl);
		}

		vm.seajsUse = function(key) {
			seajs.use('http://img1.mini.cache.wps.cn/wpsmini/script/' + vm.miniVersion + '/js/' + key);
		}

		vm.getUrl = function(i) {
			var url = 'about:blank';
			if (stateMode === 0) {
				url = vm.navData[i].url;
			}				
			
			return url !== 'about:blank' ? url + vm.getParam() : url;
			
		}

		//自动模式下加载iframe url
		vm.loadUrl = function(i) {		
			//$('#content iframe').eq(i).attr('src', vm.navData[i].url + vm.getParam());
			var data = vm.navData[i];
			if (!data.type) {
				$('#' + data.key).attr('src', data.url);
			} else {
				TopCtrl.seajsUse(data.key);
			}
			//vm.navData[i].trueUrl = vm.navData[i].url + vm.getParam();			
		}

		vm.openUrl = function(url) {
			MiniApi.openUrl(url);
		}

		/**
		*	获取cdn随机地址
		*
		*/
		vm.getPath = function() {
			return vm.path[Math.round(Math.random())];
		}

		/**
		*	获取广告地址
		*	@参数 name:广告页签名
		*		  pos: 广告位
		*/
		vm.getAdUrl = function(name, pos) {
			var s = vm.showAd ? 0 : 1;					
			return vm.getPath() + vm.miniVersion + '/ad_' + name + '_' + pos + '_' + s +'.html';
		}

		vm.clickBottom = function(e) {			
			CollectHandler.clickBottom($(e.target).text());							
		}

		/**
		*	发送信息收集
		*	@参数 collectName: 信息收集名
		*/
		vm.collect = function() {
			CollectHandler.sendCollect.apply(CollectHandler, arguments);
		}

		//关闭中央广告
		vm.closeFloatad = function() {						
			vm.hideFloatad();
			CollectHandler.pasterad(1);
			clearTimeout(vm.floatadTimer);			
		}

		//隐藏中央广告
		vm.hideFloatad = function() {
			if (vm.centerAdway === 1) {
				//如果消失方式为1时，自动隐藏到右下角广告
				$('#floatAd').animate({right: 20, height: 0, width: 0}, 500, function() {
					vm.floatadMark = false;	
				})
			} else {
				vm.floatadMark = false;				
			}
		}

		//关闭头部广告
		vm.closeTopad = function() {
			vm.topadMark = false;
			CollectHandler.topad(1);
		}

		//获取右侧广告数据
		vm.getAsideAdData = function(num) {
			var data = [];

			for (var i = 0; i < num; i++) {
				var _i = i;
				if (num > 1) {
					_i = i + 1;
				}
				data.push({url: vm.getAdUrl('aside' + _i, 1)})
			}

			vm.asideAdData = data;
		}

		/**
		*	写入下次弹出时间
		*/
		vm.writeNextTime = function(date) {
			MiniApi.writeRegSetting('validatetime', MiniApi.readSetting('digest', date));			

			MiniApi.writeRegSetting('nextpoupuptime', date);
		}

		//切换更多按钮
		vm.enterMoreBtn = function() {
			if (!TopCtrl.lockMoreBtn) {
				TopCtrl.isMore = !TopCtrl.isMore;
				//切换第一/二行频道后,右侧双屏区域的显示隐藏
				if(TopCtrl.isMore) {
					TopCtrl.$fire('tag', TopCtrl.tag);
				} else {
					MutTabCtrl.$fire('selectMark', MutTabCtrl.selectMark);
				}
				MutTabCtrl.isMoreMuit = !MutTabCtrl.isMoreMuit;
				TopCtrl.navTagEffect(TopCtrl.isMore);				
			}
			TopCtrl.stopTrans();
		}

		//切换更多按钮
		vm.leaveMoreBtn = function() {
			TopCtrl.lockMoreBtn = false;
		}

		//页签滑动效果
		vm.navTagEffect = function(flag) {
			$('#nav').animate({top: TopCtrl.isMore ? 0 : -40}, 1000, function() {
				//切换到第二行页签时发送信息收集
				if(!flag) {
					CollectHandler.switchChannel(2);
				}
			});			
		}

		vm.$watch('isMore', function(nv) {
			TopCtrl.moreBtnText = nv ? '更多' : '返回';
		})

		//tag索引超过页签数则归零
		vm.$watch('tag', function(nv) {
			if (nv === vm.navData.length) {				
				vm.tag = 0;
				vm.asideAdMask = vm.navData[vm.tag].hasAd;
			} else {
				var data = vm.navData[nv]; 
				vm.asideAdMask = data.hasAd;
				if (stateMode !== 0 && data.type === 1 && !data.isLoad) {
					data.isLoad = true
					TopCtrl.seajsUse(data.key);
				}

				if (data.type === 3) {
					if (!data.isLoad) {
						data.isLoad = true;						
						avalon.scan($('#MutTabCtrl')[0], MutTabCtrl);
					}
					MutTabCtrl.checkAsideAd();
					$('#MutTabCtrl').show();
				} else {
					$('#MutTabCtrl').hide();
				}
				
				if (data.type == 0) {				
					var el = $('#' + vm.navData[nv].key);
					if (el.attr('src') === 'about:blank') {								
						el.attr('src', vm.navData[nv].url + vm.getParam())
					}				
				}				
			}

			TopCtrl.isTwoScreen = TopCtrl.navData[vm.tag].isTwoScreen;

			TopCtrl.resetParter();
		})

		//贴片广告自动隐藏
		vm.setFloatTimeout = function() {
			if (vm.floatadMark && !vm.floatadTimer) {
				vm.floatadTimer = setTimeout(function() {
					vm.hideFloatad();
					CollectHandler.pasterad(0);
				}, vm.centerTime)
			}
		}

		vm.showCloseTopad = function() {
			vm.closeTopadMark = true;
		}

		vm.hideCloseTopad = function() {
			vm.closeTopadMark = false;
		}

		//检测delayshow状态
		vm.checkDelayshow = function(delayshow) {				
			if (delayshow) {
				if (delayshow === 'never') {
					TopCtrl.notShow = true;
				} else {
					if (delayshow.match(/^[0-9]{4}\-[0-9]{2}-[0-9]{2}\s[0-9]{2}:[0-9]{2}:[0-9]{2}$/)) {				
						var date = delayshow.match(/^[0-9]{4}\-[0-9]{2}-[0-9]{2}/)[0],
							nowDate = util.secondsToDate(+new Date());						
						
						if (date > nowDate) {
							TopCtrl.notShowWeek = true;
						} else {
							MiniApi.clickNotify('delayshow', 'cancel');
							vm.showToday = true;	
						}
					} else {
						MiniApi.clickNotify('delayshow', 'cancel');
						vm.showToday = true;
					}
				}
			} else {
				vm.showToday = true;
			}
		}	

		//是否显示子页签下拉图标
		vm.isShowMutTabClass = function(isLast) {
			if (isLast) {
				return !MutTabCtrl.mutTabData.length;
			}
			return false;
		}	

		vm.resetParter = function() {
			//如果只有一个 tab时，不重置内容页的页码
			if(vm.navData.length !== 1) {
				$('#parterWeb').css('top', 0);
				TopCtrl.pagerscreenModel.reset && (TopCtrl.pagerscreenModel.reset());
			}
		}

		//分页效果
		vm.parterEffect = function() {
			$('#parterWeb').stop().animate({top: TopCtrl.pagerscreenModel.isUp ? 0 : '-450'}, 250, function() {
				var tabName = TopCtrl.isMore ? TopCtrl.navData[TopCtrl.tag].name : MutTabCtrl.mutTabData[MutTabCtrl.selectMark].name;
				CollectHandler.changeChannelPage(TopCtrl.pagerscreenModel.isUp ? 1 : 2, tabName);
			})
		}

		vm.$watch('loading', function(nv) {
			vm.showLoading = nv && !vm.networkError;
			vm.showNetError = vm.networkError && !nv;
		})

		vm.$watch('networkError', function(nv) {
			vm.showNetError = nv && !vm.loading;
			vm.showLoading = !nv && vm.loading;			
		})		

		vm.$watch('isErrorShow', function(nv) {
			if (nv) {
				vm.path = ['http://img3.mini.cache.wps.cn/wpsmini/script/', 'http://img4.mini.cache.wps.cn/wpsmini/script/'];
			} else {
				vm.path = ['http://img1.mini.cache.wps.cn/wpsmini/script/', 'http://img2.mini.cache.wps.cn/wpsmini/script/'];
			}
		})


		vm.giftBagAd = {};

		// 初始化右上角礼包广告
		vm.initGiftBagAd = function() {
			var data = TopCtrl.miniData;

			//礼包是否关闭
			if(data.giftbag_switch == '0' || !data.giftbag_id) {
				return;
			}
			var giftAd = {url: data.giftbag_link, img: (miniType == '2' ? data.giftbag_img_shop_new:data.giftbag_img_hot_new), id: data.giftbag_id, notify_text: data.giftbag_warn_msg, giftNotifytime: data.giftbag_warn_days, hoverTips: data.giftbag_hover_tips};
			var lastGift = MiniApi.readRegSetting('giftBagAd');

			if(lastGift) {
				lastGift = JSON3.parse(lastGift);
				//服务端没更新广告
				if(lastGift.giftid === giftAd.id) {
					//15天没点击唤醒提示 
					var expire = +lastGift.clicktime;
					if(expire == 0) {
						expire = +new Date();
					}

					var popNotice = expire - +lastGift.showtime > giftAd.giftNotifytime * 24 * 60 * 60 * 1000;
					if(!lastGift.notifyShow && popNotice) {
						giftAd.showNotifyText = true;
						CollectHandler.present(3, giftAd.id);
						CollectHandler.present(4, giftAd.id);
						TopCtrl.updateGiftBagCache('notifyShow', true);
					}
					giftAd.showAd = true;
					TopCtrl.giftBagAd = giftAd;
					CollectHandler.present(1, giftAd.id);
				} else {
					TopCtrl.showGiftAd(giftAd);
				}
			} else {
				TopCtrl.showGiftAd(giftAd);
			}
			
		}

		vm.showGiftAd = function(gift) {
			gift.showAd = true;
			gift.showNotifyText = false;
			TopCtrl.giftBagAd = gift;
			//计算零点天数
			var now = new Date();
			var y = now.getFullYear();
			var m = now.getMonth() + 1;
			var d = now.getDate();
			now = new Date(y+'/'+m+'/'+d +' 00:00:00');

			TopCtrl.updateGiftBagCache({giftid: gift.id, showtime: now.getTime(), clicktime: 0, notifyShow: false});
			CollectHandler.present(1, gift.id);
		}

		//点击礼包广告
		vm.clickGiftAd = function(gift) {
			TopCtrl.updateGiftBagCache('clicktime', +new Date());
			CollectHandler.present(2, gift.id);
		}

		//点击礼包唤醒气泡
		vm.clickGiftNotify = function(gift) {
			TopCtrl.notSelectTag = true;
			gift.showNotifyText = false;
			CollectHandler.present(6, gift.id);
		}

		//关闭礼包的唤醒提示
		vm.closeGiftNotify = function(gift) {
			TopCtrl.notSelectTag = true;
			gift.showNotifyText = false;
			CollectHandler.present(5, gift.id);
		}

		//更新礼包运行情况的缓存
		vm.updateGiftBagCache = function(key, value) {
			if($.isPlainObject(key)) {
				var giftad = key;
			} else {
				var giftad = MiniApi.readRegSetting('giftBagAd');
				try {
					giftad = JSON3.parse(giftad);
				} catch(_e) {
					giftad = {};
				}
				giftad[key] = value;	
			}
			MiniApi.writeRegSetting('giftBagAd', JSON.stringify(giftad));
		}

		//右上角百度文字链广告 是否展示
		vm.bdAdTopVisible = false;

		vm.bdAdCloseBtnVisible = false;

		vm.showBdAdCloseBtn = function() {
			TopCtrl.bdAdCloseBtnVisible = true;
		}

		vm.hideBdAdCloseBtn = function() {
			TopCtrl.bdAdCloseBtnVisible = false;
		}

		//关闭右上角百度文字链广告
		vm.closeBdAdTop = function() {
			TopCtrl.bdAdTopVisible = false;
			var date = new Date();
			MiniApi.writeRegSetting('lastCloseBdAdTopTime', date.getFullYear() + '-'+date.getMonth() + '-' + date.getDate());
		}

		//检查右上角百度文字链广告是否当天已展示过
		vm.checkBdAdTop = function() {
			var lastCloseBdAdTopTime = MiniApi.readRegSetting('lastCloseBdAdTopTime');
			if(lastCloseBdAdTopTime) {
				var date = new Date();
				if(lastCloseBdAdTopTime !== (date.getFullYear() + '-'+date.getMonth() + '-' + date.getDate())) {
					TopCtrl.bdAdTopVisible = true;
				}
			} else {
				TopCtrl.bdAdTopVisible = true;
			}
		}
	})	
	

	TopCtrl.init();	

	var MutTabCtrl = avalon.define('MutTabCtrl', function(vm) {
		vm.mutTabData = [];

		vm.loadType = false;

		vm.selectMark = -1;

		vm.jsp = '';

		vm.timer = '';

		//vm.jspHeight = 0;

		vm.isMoreMuit = false;

		vm.$skipArray = ['loadType', 'jsp', 'timer'];


		vm.init = function() {
			if (vm.mutTabData.length) {
				vm.selectMark = vm.countWeight();
				var data = vm.mutTabData[vm.selectMark]; 
				//当索引为第一个时，执行该页面对应的js代码
				if (vm.selectMark === 0 && !data.type) {
					TopCtrl.seajsUse(data.key);
				}				

				//$('#mutNavScroll').jScrollPane({contentHeight: 57.5 * vm.mutTabData.length, contentWidth: 24, mouseoutHide: false}).data('jsp').scrollToY((vm.selectMark - 1) * 58)
			}			
		}

		//鼠标移入标签栏，选择标签
		vm.select = function(e, i, name) {
			vm.timer = setTimeout(function() {
				vm.selectMark = ~~i;
				//TopCtrl.navData[TopCtrl.navData.length - 1].name = vm.mutTabData[vm.selectMark].name;				
				CollectHandler.sendCollect('clicksecmodule', name);
			}, 200)						
		}

		//鼠标移出标签栏
		vm.stopSelect = function() {
			clearTimeout(vm.timer);
		}

		vm.showTag = function(i, m) {
			return vm.selectMark === i && m;
		}

		//iframe加载完毕回调函数
		vm.iframeLoadMut = function(e, i) {														
			vm.loadType = true;
			var _target = e.target,
				$target = $(_target),
				state = _target.readyState,
				_src = $target.attr('src'),
				data = vm.mutTabData[i];

			//若对象模型已加载，则认为页面正常
			if (state === 'interactive') {
				if (_src !== 'about:blank') {
					data.timer = setTimeout(function() {
						vm.showIframe(i);
					}, 3000)					
				}				
			} else if(state === 'complete'){
				if (_src !== 'about:blank') {
					clearTimeout(data.timer);
					vm.showIframe(i);
				}
			}
		}

		/**
		*	兼容无readystatechange事件的浏览器
		*
		*
		*/
		vm.iframeOnLoadMut = function(e, i) {
			if (!vm.loadType) {
				var $target = $(e.target),
					_src = $target.attr('src');
					
				if (_src !== 'about:blank') {										
					vm.showIframe(i);
				}
			}			
		}

		/**
		* 	显示iframe
		*	@参数 i: iframe索引
		*/
		vm.showIframe = function(i) {			
			vm.mutTabData[i].iframeLoading = false;					
		}	

		//刷新iframe
		vm.refreshIframeMut = function(e, i) {
			var data = vm.mutTabData[i],
				el = $('#' + data.key).attr('src', data.url);			
			
			el[0].src = el.attr('src')//.replace(/(&__t=)[0-9]*/, '$1' + +new Date())

			data.iframeError = false;
			data.iframeLoading = true;			
			e.preventDefault();
		}	

		//贴片广告自动隐藏
		vm.setFloatTimeout = function() {
			if (vm.floatadMark && !vm.floatadTimer) {
				vm.floatadTimer = setTimeout(function() {
					vm.hideFloatad();
					CollectHandler.pasterad(0);
				}, vm.centerTime)
			}
		}

		//根据权重计算出默认显示页签
		vm.countWeight = function() {
			var data = vm.mutTabData.$model,
				num = 0,
				randomNum = 0,
				curIndex = 0,
				d;
			for (var i = 0, j = data.length; i < j; i++) {
				d = data[i];
				randomNum = Math.random() * d.weight;
				if (randomNum > num) {
					num = randomNum;
					curIndex = i;
				}
			}

			return curIndex;
		}

		vm.checkAsideAd = function() {
			TopCtrl.asideAdMask = vm.mutTabData[vm.selectMark].hasAd; 	
		}


		vm.checkNavigate = function() {

		}

		/*vm.tabDataRendered = function(type, i) {
			if (i === vm.mutTabData.length) {				
				//$('#mutNavScroll').jScrollPane({contentHeight: $('#scrollbarTav').height()}).data('jsp')
			}			
		}*/
		
		//监听
		vm.$watch('selectMark', function(nv, ov) {			
			var data = vm.mutTabData[nv]; 			

			if (!data.isLoad) {
				if (data.type === 1) {
					data.isLoad = true
					TopCtrl.seajsUse(data.key);
				} else {
					var el = $('#' + data.key);
					if (el.attr('src') === 'about:blank') {								
						el.attr('src', data.url);
					}
				}				
			}		

			TopCtrl.isTwoScreen = data.isTwoScreen;			

			TopCtrl.resetParter();

			vm.checkAsideAd();
		})
	})

	window.showMinisite = function() {	
		TopCtrl.tag = dataObj.currenttab;	
		if (mode === 'tray') {
			TopCtrl.writeNextTime(date);
			CollectHandler.showCollect(TopCtrl.isErrorShow ? 5 : 0);
			TopCtrl.startTrans();
		}
		TopCtrl.setFloatTimeout();
		TopCtrl.initGiftBagAd();
		TopCtrl.checkBdAdTop();
	}

	//提供给客户端的接口，返回当前展示卡页的信息
	window.getTabInfo = function() {	
		var tabObj = {};
		if(TopCtrl.isMore) {
			tabObj = TopCtrl.navData[TopCtrl.tag];
		} else {
			tabObj = MutTabCtrl.mutTabData[MutTabCtrl.selectMark];
		}
		return 'miniVersion='+TopCtrl.miniVersion +'&tabKey=' + tabObj.key + '&tabName=' + tabObj.name + '&tabUrl=' + (tabObj.type === 0 ? tabObj.url : '');
	}

	//提供给客户端的接口，返回白名单列表
	window.getWhiteList = function() {
		return Navigate.getWhiteList();
	}

	var filterSelect = {'INPUT':true, 'TEXTAREA': true};
	//屏蔽右键菜单
	document.oncontextmenu = function(e){
		var e = e || event
	    e.returnValue = false;
    };
    
    //屏蔽选中
    document.onselectstart = function(e) {	 
    	var e = e || event,
        	element = e.srcElement;
		if(e) {
			if (filterSelect[element.tagName]) {
				return true;
			}				
		}
		return false;
    };

    //屏蔽图片拖动
    document.ondragstart = function(e){
    	var e = e || event,
        	element = e.srcElement;
		if(e) {
			if (filterSelect[element.tagName]) {
				return true;
			}				
		}
		return false;
	};		

	avalon.scan();

	return TopCtrl;
});