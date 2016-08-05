define(function(require, exports, module) {
	//导航白名单
	var Navigate = function() {
		var whiteList = {};

		var domainName = ''; //域名字符串列表

		return {
			setWhiteList: function(wl) {
				if (wl) {
					domainName = wl;
					wl.replace(/[^; ]+/g, function(name) {
				        whiteList[name] = 1;
				    })
				}				
			},

			getWhiteList: function() {
				return domainName;
			},

			checkWhitelist: function(url) {
				if (url) {
					var domainNameArr = url.match(/^(https|http):\/\/([^\/]*)/);
					if (domainNameArr) {
						var domainName = domainNameArr[2],
							state = false;
						$.each(whiteList, function(dn) {							
							if (domainName.indexOf(dn) !== -1) {
								state = true;
								return false;						
							}
						})

						return state;
					}
				}

				return false;
			}
		}
	}()


	return Navigate;
})