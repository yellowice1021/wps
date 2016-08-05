define(function(require, exports, module) {
	var mousewheel = require('mousewheel');		

	var widget = avalon.ui.pagerscreen = function(element, data, vmodels) {
		var options = data.pagerscreenOptions,
			html = '<div class="screen_toggle" ms-visible="mark">\
						<div class="status_1" ms-visible="isUp">\
							<a href="#" ms-click="clickToggle" class="mouse"></a>\
							<a href="#" title="1" class="num_1 current" ms-click="clickUp">1</a>\
							<a href="#" title="2" class="num_2" ms-click="clickDown">2</a>\
							<a href="#" ms-click="clickToggle" class="arrow"></a>\
						</div>\
						<div class="status_2" ms-visible="!isUp">\
							<a href="#" ms-click="clickToggle" class="mouse"></a>\
							<a href="#" title="1" class="num_1" ms-click="clickUp">1</a>\
							<a href="#" title="2" class="num_2 current" ms-click="clickDown">2</a>\
							<a href="#" ms-click="clickToggle" class="arrow"></a>\
						</div>\
					</div>'

		var vmodel = avalon.define(data.pagerscreenId, function(vm) {
			avalon.mix(vm, options);				

			vm.$skipArray = [];

			vm.$init = function() {			
				element.innerHTML = html;	

				$(document).mousewheel(function(e, delta) {					
					if (delta > 0) {
						vm.isUp = true;
					} else {
						vm.isUp = false;						
					}
				});

				// avalon.nextTick(function() {
					avalon.scan(element, [vmodel].concat(vmodels));	
					
					options.onInit(element, vmodel);
				// })	
			}	

			vm.clickUp = function(e) {
				e.preventDefault();
				vmodel.isUp = true;
			}

			vm.clickDown = function(e) {
				e.preventDefault();
				vmodel.isUp = false;
			}

			vm.clickToggle = function(e) {
				e.preventDefault();
				vmodel.isUp = !vmodel.isUp;
			}

			vm.reset = function() {
				vmodel.isUp = true;
			}

			vm.$watch('isUp', function(nv) {
				if (nv) {
					vmodel.onUp(element, vmodel);
				} else {
					vmodel.onDown(element, vmodel);
				}
			})					
		})

		vmodel.$init();

		return vmodel;
	}

	widget.defaults = {		
		mark: true,

		isUp: true,
		
		onInit: avalon.noop,
		onUp: avalon.noop,
		onDown: avalon.noop
	}

	return {};
})