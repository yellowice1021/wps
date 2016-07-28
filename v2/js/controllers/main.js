define(['jquery', 'avalon', 'dataServices',
'collect','customOnekey','customDesigner','wpsLazyLoad'
],
    function($, avalon, dataServices,
    collect,customOnekey,customDesigner,wpsLazyLoad
    ) {
    var customdataServices = dataServices.get("custom");
    var vm = avalon.define({
        isLoadDone:false,
        $id:"mainCtrl",
        $skipArray : ['bannerTime', 'timer', 'bannerMaxNum', 'activeLi', 'liListEls'],
        hideTask:false,//是否是小屏需要隐藏部分任务 //没用
        hideMaxNum:8,//大屏4个小屏6个
        pageIndex:1,//
        showMaxDesigner:8,//未启用
        isLogin:false,//是否已经登录   //没用
        wps_sid:'',
        scrollNum:0,//完成任务之后需要滚动条的位置   //没用
        pageDesigner:{pageIndex:1,totalCount:0,pageCount:150,totalNum:0},//用于排行榜分页
        //pageTask:{pageIndex:1,totalCount:0,pageCount:12,totalNum:0},//用于稻米任务分页
        $cacheData:{},
        desingerData:{wpp:[],word:[],et:[]},//设计师列表
        desingerList:[],
        showBuyButton:false,		//显示发布需求
        showMe:true,				//显示自己窗口
        showMoreDesigner:false,		//显示更多设计师
        selectIndex:-1,
        
        topBannerIndex: 1,			// 上方轮播图索引号
        topBannerTimer: "",			// 上方轮播图计时器
        topBannerAminated: false,	// 上方轮播图是否处在动画中     
        topBannerBox:[],			// 存放上方轮播图图片
        topBannerNum:2,				// 上方轮播图图片数量，默认为2
        
        designersData: {			 // 页面显示的设计师列表数据
        	// wpp分类设计师
        	wpp: {
        		detailData:[],		// 设计师具体信息资料
				tagData:[],			// 设计师右上方标签
				tagId:'',			// 当前选中的右上方标签id
        	},
        	//word 分类设计师
        	word: {detailData:[],tagData:[],tagId:''},
        	// et分类设计师
        	et: {detailData:[],tagData:[],tagId:''},
        	// law分类设计师
        	law: {detailData:[],tagData:[],tagId:''},
        	// graphic分类设计师
        	graphic: {detailData:[],tagData:[],tagId:''}
        },
        clientName:"wpp",												// 客户端进来类型
        designerTag:"ppt",												// 上方固定栏选中类型 all ppt wps et law graphic
        
        init : function() {
        	 
            var app=vm.getQueryStringRegExp("app")||'wpp';			// 判断从哪个客户端进来   
            var appJson={wps:'word',wpp:'ppt',et:'et'};
            vm.setValue("clientName",appJson[app]?appJson[app]:'ppt');
            vm.setValue("designerTag",'all');						// 设置一开始进入的是展示全部的页面

            vm.controlUserStatus();
            //加载设计师列表数据
            vm.queryAllDesignerDatas(1);
            vm.pageResize('frist');
            $(window.parent.window).resize(function(){
                vm.pageResize();
            })
            setTimeout(function(){
                vm.isLoadDone=true;
                //更新
//              vm.initCaseBanner();
                vm.topBannerStart();
            },300);

        },
        
        // 点击上方轮播图小圆点
        clickTopBanner: function(inIndex, outIndex){
        	if(vm.topBannerAminated){
        		return;
        	}
        	vm.topBannerAminated = true;
        	vm.topBannerStop();
        	vm.topBannerMove(inIndex, outIndex);
        	vm.topBannerStart();
        },               
        // 上方轮播图淡入淡出
        topBannerMove: function(inIndex, outIndex){
        	var topBannerBox = $(".csm_banner_ul li");
        	$(topBannerBox[outIndex - 1]).fadeOut(200, function(){
        		vm.topBannerAminated = false;
        		$(topBannerBox[inIndex - 1]).fadeIn(200);
        	});       	
        	vm.topBannerIndex = inIndex;       	
        },        
        // 上方轮播图开始轮播
        topBannerStart: function(){
        	vm.topBannerTimer = setInterval(function(){
        		if(vm.topBannerIndex == vm.topBannerNum){
        			vm.topBannerMove(1, vm.topBannerIndex);
        		}else{
        			vm.topBannerMove(vm.topBannerIndex + 1, vm.topBannerIndex);
        		}
        	}, 6000);
        },       
        // 上方轮播图停止轮播
        topBannerStop: function(){
        	clearInterval(vm.topBannerTimer);
        },
        
        // 加载所有设计师数据
        queryAllDesignerDatas: function(flag){
        	// 调用获取所有设计师列表数据的接口
        	customdataServices.queryAllDesignerData({}).done(function(resp) {
                if (resp.result === 'ok') {
                    var data=resp.data.data||resp.data;
                    
                    if(flag){
	                    // 保存上方轮播图图片(flag为0时不需要再次保存)
	                    vm.topBannerBox = data.banner;
	                    vm.topBannerNum = vm.topBannerBox.length;	
                    }
                    
					var designerType={wpp:'ppt',word:'jianli',et:'baobiao',law:'law',graphic:'graphic'};					
					$.each(designerType,function(key,value){
						// 保存设计师列表数据
						vm.designersData[key].detailData = data[value].designer;					
	                    vm.designersData[key].tagData = data[value].rec_tags;						
	                    vm.designersData[key].tagId = data[value].rec_tags[0].id;				
					});
                }
            });
        },       
        // 点击查看全部或上方导航栏时查看具体类型时加载相应设计师数据
        clickOneTypeAllDesigners: function(type){
        	vm.pageIndex = 1;
        	var idType = type=="ppt"? "wpp": type;
        	
        	vm.designerTag = type;
        	vm.designersData[idType]['tagId']= 0;  
        	$("#mainBox").animate({scrollTop:0},0);
        	// 重新初始化下方轮播图
        	if(type == 'ppt'){
        		vm.initCaseBanner(1);
        	}else if(type == 'word'){
        		$("#cstTurnUl_word")[0].style.left = "0px";
        		vm.stopBannerAutoMove();
        		vm.bannerIndex = 0;
        		vm.initCaseBanner();
        	}else if(type == 'et'){
        		vm.initCaseBanner();
        	}
        },       
        // 点击相应类型设计师右上方标签,显示相应标签下的设计师
        clickDesignerTag: function(id, types){
        	vm.pageIndex = 1;
        	var tagType = {jianli:'word',ppt:'wpp',baobiao:'et'}
        	var selectType = tagType[types]?tagType[types]:types; 
        	vm.designersData[selectType].tagId = id;
        	vm.queryOneTypeDesigner(id, types, selectType);
        },      
        // 点击分类或标签时加载设计师列表数据
        queryOneTypeDesigner: function(id, types, selectType){
        	var limits;												// 设置翻页偏移量，ppt为8，其它为4     
        	if(vm.designerTag == 'all'){
        		limits = types=='ppt'? 8: 4;						// 首页时显示ppt设计师数量为8，其它为4
        	}else{
        		limits = 50;										// 具体显示某分类设计师时设置为50
        	}

            var datas = {
            	tagid: id,											// 标签id,为0时只搜分类
                type: types,										// 设计师类型
                offset: (vm.pageDesigner.pageIndex-1)*limits,		// （当前页数-1）*偏移量
                limit: limits										// 翻页偏移ppt为8，其它为4
            }
            customdataServices.queryOneTypeDesignerData({data:datas}).done(function(resp) {
                if (resp.result === 'ok') {
                    var data=[];
                    if(resp.data.data){
                        data=resp.data.data;
                    }else{
                        data=resp.data;
                    }
                    vm.designersData[selectType].detailData = data;
                    //wpsLazyLoad.init();
                }
            });
        },
        
        submitTask:function(){
        	vm.setValue("designerTag", "all");	// 重新初始化上方导航，使返回时显示“全部”分类下所有数据
        	vm.queryAllDesignerDatas(0);
        	$("#mainBox").animate({
        		scrollTop:0
        	},0);
            if(window.parent&&window.parent.$&&window.parent.$.subscribe){
                if(vm.isLogin){
                    vm.showMe=false;
                    customOnekey.init();
                 }else{vm.login();}
             }else{
                vm.showMe=false;
                customOnekey.init();
             }
        },
        designerShop:function(indexNo, type){
            vm.showMe=false;
            var designerInfo=vm.designersData[type]['detailData'][indexNo];	// 获取当前点击的设计师数据
            customDesigner.designerInfo=designerInfo;
            customDesigner.init(designerInfo.id);
            customDesigner.designerTag=vm.designerTag;
            $("#mainBox").animate({
        		scrollTop:0
        	},0);
        },
        //显示更多设计师
        moreDesigner:function(){
            vm.pageIndex+=1;
            //vm.showMoreDesigner=true;
        },
        setDesignerTag:function(name){
            vm.pageIndex=1;
            vm.designerTag=name;
//          vm.queryDesignerData();
        },
        mouseenter:function(indexNo){
            $("#dgrEmploy_1"+indexNo).hide();
            $("#dgrEmploy_2"+indexNo).show();            
        },
        mouseleave:function(indexNo){
            $("#dgrEmploy_2"+indexNo).hide();
            $("#dgrEmploy_1"+indexNo).show();
        },
        //查看定制案例
        goCustomCase:function(){
            var url='http://chn.docer.com/custom/';
            if(vm.designerTag=='word'){
                url+="resume.html";
            }else if(vm.designerTag=='ppt'){
                url+="ppt.html";
            }else if(vm.designerTag=='et'){
                url+="chart.html";
            }
            url+="#1";
            vm.openlink(url);
        },
        //定制下单
        customPay:function(designerId){
            var url='https://vip.wps.cn/pay/custom_';
            if(vm.designerTag=='word'){
                url+="resume";
            }else if(vm.designerTag=='ppt'){
                url+="ppt";
            }else if(vm.designerTag=='et'){
                url+="chart";
            }
            url+="/?csource=docercustom";
            if(typeof(designerId)!='undefined'){
                url+="&dsid="+designerId;
            }
            vm.openlink(url);
        },
        //弹出登录框
        login:function(){
            window.parent.$.wpsApi.qingLogin();
        },
        //设置通用属性
        setValue:function(key,value){
            if(key.indexOf(".")==-1){
                vm[key]=value;
            }else{
                vm[key.split(".")[0]][key.split(".")[1]]=value;
            }
        },
        //上一页
        pageRankPrev:function(id,functionName){
            if(vm[id].pageIndex==1){return;}
            vm[id].pageIndex=vm[id].pageIndex-1;
            //加载数据函数
            vm[functionName]();
        },
        //下一页
        pageRankNext:function(id,functionName){
            if(vm[id].pageIndex==vm[id].totalCount||vm[id].totalCount==0){return;}
            vm[id].pageIndex=vm[id].pageIndex+1;
            //加载数据函数
            vm[functionName]();
        },
        //设置分页总量
        setPageTotalCount:function(id,totalNum){
            var count=vm[id].pageCount;
            vm[id].totalNum=totalNum;
            vm[id].totalCount=totalNum%count?parseInt(totalNum/count)+1:parseInt(totalNum/count);
        },
        //滚动到抢购模块
        scroll : function(num,inputName) {
            if(inputName){
                num=($('[name=' + part + ']').offset().top+num);
            }
            $('#body').animate({
                scrollTop: num
            }, 'fast');
        },
        openlink:function(url){
            if(!url){return;}
            if(window.parent&&window.parent.$.wpsApi.getApi()){
                window.parent.$.wpsApi.qingOpenVipUrl(url);
            }else{open(url);}
        },
        //通知主页面更新稻米值
        updateRice:function(){
            window.parent.$.publish('updateUser');
        },
        controlUserStatus:function(){
            if(window.parent&&window.parent.$&&window.parent.$.subscribe){
                var userinfo = window.parent.$.getWpsUser?window.parent.$.getWpsUser():"";
                /*Info 格式：{
                    wps_sid: '',    //用户的 wps_sid， 如果返回null/undefined 则为未登录
                    user: {}       //用户信息object, 属性包括用户名、头像、稻米值等
                }*/
                if(userinfo&&userinfo.user&&userinfo.user.userid){
                    vm.userid=userinfo.user.userid;
                    vm.wps_sid=userinfo.wps_sid;
                    vm.isLogin=true;
                }
                //用户登录，登录成功和载入首页，都会触发
                window.parent.$.subscribe('loginSuccess', function(a, info) {
                    vm.isLogin=true;
                    vm.userid=info.user.userid;
                    vm.wps_sid=a;
                });
                //用户退出
                window.parent.$.subscribe('logoutSuccess', function(a) {
                    vm.isLogin=false;
                    vm.userid="";
                    vm.wps_sid="";
                    if(customOnekey.showMe){
                        customOnekey.showMe=false;
                        vm.showMe=true;
                    }
                })
            }
        },
        pageResize:function(type){
            if(window.parent&&window.parent.window){
                //判断是否属于小屏机器
                if(($(window.parent.window).width()-360)<1239){
                    vm.hideTask=true;
                    vm.hideMaxNum=6;
                }else{
                    vm.hideTask=false;
                    vm.hideMaxNum=8;
                }
            }
        },getQueryStringRegExp:function(name) {
            var reg = new RegExp("(^|\\?|&)" + name + "=([^&^#]*)(\\s|&|$|#)", "i");
            if (reg.test(location.href)) {
                return unescape(RegExp.$2.replace(/\+/g, " "));
            }
            return "";
        },
        //轮播间隔时间
        bannerTime : 5000,
        //轮播时间id
        timer : '',
        //广告最大个数
        bannerMaxNum : 0,
        //当前显示li元素
        activeLi : '',
        //li元素集合
        liListEls : '',
        //广告索引
        bannerIndex : 0,
        //小图效果准备状态
        smallImgReady : true,
        initCaseBanner:function(deferred){
            if(deferred&&deferred==1){
                setTimeout(function(){vm.initCaseBanner();},1000);
                return;
            }
            $('#resumePrev').length&&vm.bannerAutoMove();//简历定制页 专用
            vm.liListEls = $('#cstTurnUl_'+vm.designerTag).find('li');
            vm.activeLi = vm.liListEls.eq(0);
            vm.updateBtnState();
            vm.bannerMaxNum = vm.liListEls.length;
            vm.bannerIndex=0;
        },
        //点击广告索引
        clickBannerIndex : function(e) {         
            var target = e.target;
            if (target.tagName === 'A') {
                vm.bannerIndex = ~~$(target).attr('bannerIndex');
                vm.stopBannerAutoMove();
                vm.bannerAutoMove();
            }
        },
        //广告滑动效果
        bannerMove : function() {
            if(vm.designerTag=='ppt'){
                return;
            }
            $('#cstTurnUl_'+vm.designerTag).stop().animate({
                left: '-' + (vm.designerTag == 'ppt' ? 749 : (vm.hideTask?820:1080)) * vm.bannerIndex
            }, 500, function() {})
        },
        //广告自动轮播
        bannerAutoMove : function() {
            vm.stopBannerAutoMove();
            vm.timer = setInterval(function() {
                if (vm.bannerIndex !== vm.bannerMaxNum - 1) {
                    ++vm.bannerIndex;
                } else {
                    vm.bannerIndex = 0;
                }
            }, vm.bannerTime)
        },
        //停止广告轮播
        stopBannerAutoMove : function() {
            clearInterval(vm.timer);
        },
        //简历页专用 点击上/下 一页
        clickResumePage : function(s) {
            var len = $('#cstTurnUl_'+vm.designerTag).children().length;
            var n = +vm.bannerIndex + s;
            if(n >= 0) {
                vm.bannerIndex = (+vm.bannerIndex + s) % len;
            }
        },
        //点击上一页
        clickPrevBtn : function(e) {
            if (vm.smallImgReady) {
                var visibleEl = vm.activeLi.find('img:visible'),
                    el = visibleEl.prev('img');
                if (el.length) {
                    vm.smallImgReady = false;
                    visibleEl.fadeOut(200, function() {
                        vm.showPic(el);
                    })
                }   
            }
            e.preventDefault();
        },
        //点击下一页
        clickNextBtn : function(e) {
            if (vm.smallImgReady) {
                var visibleEl = vm.activeLi.find('img:visible'),
                    el = visibleEl.next('img');
                if (el.length) {
                    vm.smallImgReady = false;
                    visibleEl.fadeOut(200, function() {
                        vm.showPic(el);
                    })
                }   
            }
            e.preventDefault();
        },
        //显示图片
        showPic : function(element) {
            var defer = $.Deferred()
                src = element.attr('lazySrc');
            if (src) {
                element.load(function() {
                    defer.resolve();
                }).attr('src', src);            
            } else {
                element.fadeIn(200, function() {
                    defer.resolve();
                })
            }
            defer.done(function() {
                element.fadeIn(200, function() {
                    vm.updateBtnState();
                    vm.smallImgReady = true;
                }).removeAttr('lazySrc');
            })
        },
        //更新按钮状态
        updateBtnState : function() {            
            //ppt
            var el = vm.activeLi.find('img:visible');
            //vm.designerTag=='ppt'&&alert('vm.designerTag:'+vm.designerTag+","+el.prev().length+","+el.next().length)
            //$('#prevBtn').toggle(!!el.prev().length);
            if(!!el.prev().length){
                $('#prevBtn').show();
            }else{
                $('#prevBtn').hide();
            }
            //$('#nextBtn').toggle(!!el.next().length);
            if(!!el.next().length){
                $('#nextBtn').show();
            }else{
                $('#nextBtn').hide();
            }
            
            //简历页面专用
            $('#resumePrev').toggle(vm.bannerIndex !== 0);
            var maxIndex = $('#cstTurnUl_'+vm.designerTag).children().length - 1;
            $('#resumeNext').toggle(vm.bannerIndex !== maxIndex);
        },
        sendCollect:function(p3,p4){
            /*
            1=版头免费发布    
            2=立即发布  
            3=洽谈需求点 
            4=支付佣金  
            5=更多设计师 
            6=设计师类型 设计师类型1=wps，2=wpp，3=et
            7=设计师页洽谈需求  
            8=设计师页支付佣金  
            9=预览    
            10=预览页洽谈需求  
            11=服务评价 
            12=交易记录*/

            collect.sendCollect(p3,p4)
        }
    })
    
    vm.init();
    avalon.scan();
    //监听bannerIndex
    vm.$watch('bannerIndex', function(nv, ov) {
        vm.bannerMove();
        vm.activeLi = vm.liListEls.eq(nv);
        vm.updateBtnState();
    })
    return vm;
})
