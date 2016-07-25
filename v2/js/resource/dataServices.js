define(['jquery'], function($) {
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
			this.dataServices = [];
			this.dataModel = window.datamodel || {};			
		},

		add: function(name, url, dataMap, action) {
			this.dataServices[name] = new CURD(url, dataMap, action);
		},

		get: function(name) {
			return this.dataServices[name];
		},

		getDataModel: function() {
			return this.dataModel;
		}
	};

	
	var CURD = function(url, dataMap, action) {
		this.action = $.extend(true, {
			query: {},
			create: {},
			update: {},
			remove: {}
		}, action);
		this.params = {url: url};
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
			var _params = $.extend(true, {}, this.params, this.action[type], params);

			for (var x in this.dataMap) {
				if (_params.hasOwnProperty(x)) {
					var reg = new RegExp(':\\b' + x + '\\b');
					_params.url = _params.url.replace(reg, _params[x]);
				}
			}

			var httpHandler = $.ajax({
				type: _params.method || 'POST',
				cache: _params.cache,
				url: _params.url,
				dataType: _params.dataType || 'json',
				timeout: _params.timeout || 5000,
				data: _params.data || {}
			});		
			

			return httpHandler;
		}
	};
	var ins = new DataServices();
	//定制相关接口
	ins.add('custom', '/v3.php/:_method_', {_method_: '@_method_'}, {
		// 获取全部设计师列表
		queryAllDesignerData: {method: 'POST', _method_: 'proxy', data: {wps_proxy: 'docer', wps_act: 'api/custom/designer/overview'},cache:false},
		// 按标签或分类搜索设计师
		queryOneTypeDesignerData: {method: 'POST', _method_: 'proxy', data: {wps_proxy: 'docer', wps_act: 'api/custom/designer/search'},cache:false},
		//获取设计师列表
		queryDesignerData: {method: 'POST', _method_: 'proxy', data: {wps_proxy: 'docer', wps_act: 'api/custom/designer/'},cache:false},
		//一键提单(定制订单)
		submit_oneKey:{method: 'POST', _method_: 'proxy', data: {wps_proxy: 'docer', wps_act: 'custom/onekey'},cache:false},
		//获取金山云上传token
		upload_token: {method: 'POST', _method_: 'proxy', data: {wps_proxy: 'docer', wps_act: 'vip_upload/token'},cache:false},
		//docer站获取token函数
		upload_token_docer: {method: 'POST', _method_: 'proxy', data: {wps_proxy: 'docer', wps_act: 'api/upload_token'},cache:false}
	})

	//设计师商铺
	ins.add('designer_shop', '/v3.php/:_method_', {_method_: '@_method_'}, {
		//获取商铺销量
		queryOrderList: {method: 'POST', _method_: 'proxy', data: {wps_proxy: 'vip', wps_act: 'order_dingzhi/order',cache:false}},
		//获取商铺评价
		queryEvaluationList: {method: 'POST', _method_: 'proxy', data: {wps_proxy: 'vip', wps_act: 'dingzhi_evaluation/eva',cache:false}},
		//获取设计师基础信息
		queryDesignerBaseData: {method: 'POST', _method_: 'proxy', data: {wps_proxy: 'docer', wps_act: 'api/custom/designer/client_base'}, cache:false},
		//获取设计师案例数据 支持分页 limit=2&offset=0&author_id=55000006
		queryDesignerCaseData: {method: 'POST', _method_: 'proxy', data: {wps_proxy: 'docer', wps_act: 'api/custom/works/'}, cache:false},
		//获取案例图片  ?case_id=1
		queryCaseImageList: {method: 'POST', _method_: 'proxy', data: {wps_proxy: 'docer', wps_act: 'api/custom/works/preview'},cache:false}
	})


	return ins;
})