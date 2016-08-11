define(function(require, exports, module) {
	var MiniApi = require('MiniApi');		
	'use strict';	
	/**
	* 创建模板服务模块
	*
	*/
	
	var DataServices = function() {
		this.init();
	};

	DataServices.prototype = {
		constructor: DataServices,

		init: function() {
			this.dataModel = {};
			this.dataServices = [];			
			this.config = {
				app: $('#app').val(),
				version: '1.1.0'//$('#version').val()
			};			
		},

		add: function(name, url, dataMap, action) {
			this.dataServices[name] = new CURD(url, dataMap, action);
		},

		get: function(name) {
			return this.dataServices[name];
		},

		getDataModel: function() {
			return this.dataModel;
		},
		
		setDataModel: function(model) {
			this.dataModel = model;
		},

		getConfig: function() {
			return this.config;
		}
	};
	var ins = new DataServices();
	
	var CURD = function(url, dataMap, action) {
		this.action = $.extend(true, {
			query: {},
			create: {},
			update: {},
			remove: {}
		}, action);
		this.params = {url: url, timeout: 5000, data: {}};
		this.dataMap = dataMap;		
		this.init();
	};

	CURD.prototype = {
		constructor: CURD,

		init: function() {
			for (var x in this.action) {
				this[x] = function(type) {
					return function(params){
						return this.send(params, type);	
					}; 
				}(x);
			}
		},

		//发送信息
		send: function(params, type) {		
			var _params = $.extend(true, {}, this.params, this.action[type], params),
				callback = 'fontCallback' + setTimeout('1'),
				cookie = '',//'wps_sid=' + PanelApi.getCookie('wps_sid') + ';',
				defer = $.Deferred();
			
			for (var x in this.dataMap) {
				if (_params.hasOwnProperty(x)) {
					var reg = new RegExp(':\\b' + x + '\\b');
					_params.url = _params.url.replace(reg, _params[x]);
				}
			}			

			if (!MiniApi.check()) {				
				defer = $.ajax({
					type: _params.method || 'POST',
					cache: _params.cache,
					url: _params.url,
					dataType: _params.dataType || 'json',
					data: _params.data || {}
				});						
				
			} else {
				window[callback] = function(id, a, result) {					
					if (result !== undefined && result !== 'timeout') {						
						defer.resolve(result);
					} else {						
						defer.reject(result);
					}					
				}				
				
				//get方法根据传参拼接url
				
				if (!$.isEmptyObject(_params.data)) {
					_params.dataUrl = '';
					$.each(_params.data, function(k, v) {
						_params.dataUrl += k + '=' + v + '&';
					})
					_params.dataUrl = _params.dataUrl.substring(0, _params.dataUrl.length - 1);
				}	
				
				MiniApi.jsRequest(_params.url, _params.dataUrl, _params.timeout + '', callback);				
			}

			return defer;
		}
	};		
	
    //字体操作接口
	ins.add('gender', 'http://mini.wps.cn/v2.php/api/analysis/:_method_', {_method_: '@_method_'}, {
		query: {method: 'GET', _method_: 'gender'}		
	})	
	
	return ins;
});