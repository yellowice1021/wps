define(['jquery', 'avalon', 'dataServices',
'collect','customOnekey'],
    function($, avalon, dataServices,
    collect,customOnekey) {
        'use strict';
    var customdataServices = dataServices.get("custom");
    var dataService=dataServices.get("designer_shop");
    var vm = avalon.define({
        $id:"customDesignerCtrl",
        $skipArray : ['desingerData'],
        page_evaluation:{pageIndex:1,totalCount:0,pageCount:20,totalNum:0,functionName:'queryDesignerData'},//用于评价分页
        page_order:{pageIndex:1,totalCount:0,pageCount:20,totalNum:0,functionName:'queryDesignerData'},//用于订单分页
        showMe:false,
        designerTag:"word",//设计师类型 word ppt et
        cacheData:{},
        shopData : {work:[],evaluation:[],order:[]},//模板数据
        select_type:"evaluation",//order
        loading:false,
        designerInfo:{},//设计师信息
        queryMark:'all',//查询设计师数据
        arrayFive:[1,2,3,4,5],
        caseData:[],//案例数据
        caseImageList:[],//案例图片列表
        hideTask:true,
        hideMaxNum:12,
        previewID:'',//当前预览id
        baseData:{
                author_info: {},
                every_total: {},
                impress: [],
                score: {
                    "attitude": 0,
                    "rtime": 0,
                    "quality": 0,
                    "attitude_scale": "0",
                    "rtime_scale": "0",
                    "quality_scale": "0",
                    "sell": 0,
                    "customizing": 0
                },
                works: {}
            },
        init : function(desingerId) {
            vm.showMe=true;
            vm.shopData={work:[],evaluation:[],order:[]};
            //获取设计师基础信息
            vm.queryBaseData();
            vm.queryDesignerData();

            vm.pageResize('frist');
            $(window.parent.window).resize(function(){
                vm.pageResize();
            })
        },
        //预览
        preview:function(indexNo,caseId,author_Id){
            dataService.queryCaseImageList({data: {case_id:caseId}}).done(function(resp) {
                if (resp.result === 'ok') {
                    vm.caseImageList=resp.data;
                    var jsUrl='http://img1.template.cache.wps.cn/'
                    +'wpsweb/script/docer/partner/component/js/publish/ui/photoview.js';
                    var moban_app={word:1,ppt:3,et:2};
                    require([jsUrl], function(PHOTOVIEW) {
                        var caseInfo=vm.caseData[indexNo].$model;
                        var data = [
                            {
                                name: caseInfo.title,
                                id: caseId,
                                author: vm.baseData.author_info.name,
                                publish_time: '',
                                //1文字 、2表格、3ppt
                                moban_app: moban_app[vm.designerTag],
                                //尺寸
                                scale: caseInfo.scale,
                                //效果
                                effect: caseInfo.effect,
                                previewImg: [
                                    //{ "image_url": "url" },
                                ]
                            }
                        ]
                        $.each(vm.caseImageList,function(i,v) {
                            data[0].previewImg.push({image_url:v.img_url});
                        })
                        //data 数据 0data索引 3案例预览固定值
                        PHOTOVIEW.show(data, 0, 3);  
                    })
		            //调用建祥接口执行预览功能
                }
            }).fail(function() {
            }).always(function() {
            })
            
        },
        callDesigner:function(argument) {
            vm.sendCollect(10);
            vm.openlink("tencent://message/?uin="+vm.designerInfo.qq+"&site=qq&menu=yes");
        },
        //获取设计师基础信息
        queryBaseData:function(){
            dataService.queryDesignerBaseData({data: {did:vm.designerInfo.id}}).done(function(resp) {
                if (resp.result === 'ok') {
                    vm.baseData=resp.data;
                    if(resp.data.works&&resp.data.works.data){
                        vm.caseData=resp.data.works.data;    
                    }
                }
            }).fail(function() {
            }).always(function() {
            })
        },
        set_select_type:function(tag,key){
            vm[tag]=key;
            if(!vm.shopData[key].length){
                vm.queryDesignerData();
            }
        },
        set_query_mark:function(tag,queryMark){
            vm.queryMark=queryMark;
            vm["page_"+tag].pageIndex=1;
            vm.queryDesignerData();
        },
        //获取设计师案例数据 支持分页 
        queryDesignerCaseData:function (argument) {
            //limit=2&offset=0&author_id=55000006
            // body...
        },

        //获取模板数据
        queryDesignerData : function() {
            vm.loading = true;
            vm.shopData[vm.select_type] = [];
            var json={};
            var defer;
            var key=vm.select_type;
            if(vm.select_type=='work'){//案例
                
            }else if(vm.select_type=='order'){//成交订单
                json={designer_id:vm.designerInfo.id,
                    offset: (vm['page_'+vm.select_type].pageIndex-1)*vm['page_'+vm.select_type].pageCount, 
                    limit: vm['page_'+vm.select_type].pageCount};
            }else if(vm.select_type=='evaluation'){//评价
                json={designer_id:vm.designerInfo.id,
                    level:vm.queryMark,
                    offset: (vm['page_'+vm.select_type].pageIndex-1)*vm['page_'+vm.select_type].pageCount, 
                    limit: vm['page_'+vm.select_type].pageCount};
            }
            $.each(json,function(_key,value){key=''+key+value;});
            /*if(vm.cacheData[key]&&vm.cacheData[key].list&&vm.cacheData[key].list.length>0){
                vm.shopData[vm.select_type]=vm.cacheData[key].list;                
                vm.loading = false;
                if(vm.select_type=='work'){
                    $("[lazyLoadSrc]").each(function(i, element) {
                        wpsLazyLoad.add($(element), {                   
                            callback: function() {
                                //this.css(util.getSize(163, 222, this[0]));
                            }
                        });
                    });
                }
                return;
            }*/
            if(vm.select_type=='work'){//作品
                //defer=dataService.queryProductList({data: json});
            }else if(vm.select_type=='order'){//成交订单
                defer=dataService.queryOrderList({data: json});
            }else if(vm.select_type=='evaluation'){//评价
                defer=dataService.queryEvaluationList({data: json});
            }
            defer.done(function(result) {
                if (result.result === 'ok') {
                    var temp=[];
                    if(vm.select_type=='work'){
                        temp = result.data.moban;
                    }else if(vm.select_type=='order'){
                        temp = result.data.data;
                    }else if(vm.select_type=='evaluation'){
                        for (var i = 0; i < result.data.data.length; i++) {
                            temp.push(result.data.data[i]);
                            var _t={"isreply":true,'reply':(result.data.data[i].reply?result.data.data[i].reply:"")};
                            temp.push(_t);
                        };
                    }
                    vm.shopData[vm.select_type]=temp;
                    vm.setPageTotalCount('page_'+vm.select_type,result.data.total);
                    //vm.cacheData[key]={data:resp.data.data,total:resp.data.total};
                    /*if(vm.select_type=='work'){
                        $("[lazyLoadSrc]").each(function(i, element) {
                            wpsLazyLoad.add($(element), {                   
                                callback: function() {
                                    //this.css(util.getSize(163, 222, this[0]));
                                }
                            });
                        });
                    }*/
                }
            }).fail(function() {

            }).always(function() {
                vm.loading = false;
            })
        },
        avg_class:function(num,type){
            if(typeof(num)=='undefined'){return;}
            var txt="";
            if(type==2){
                txt="_text";
            }else if(type==3){
                txt="_logo";
            }
            return ((num==0?"equally":(num>0?"high":"low"))+txt);
        },
        avg_txt:function(num){
            if(typeof(num)=='undefined'){return;}
            return num==0?"持平平均值":(num>0?"比平均值高":"比平均值低");
        },
        backIndex:function(){
            vm.showMe=false;
            avalon.vmodels.mainCtrl.showMe=true;
        },
        //查看定制案例
        goCustomCase:function(){
            var url='http://chn.docer.com/custom/';
            if(vm.baseData.author_info.type=='word'){
                url+="resume.html";
            }else if(vm.baseData.author_info.type=='ppt'){
                url+="ppt.html";
            }else if(vm.baseData.author_info.type=='et'){
                url+="chart.html";
            }else{
                url+="ppt.html";
            }
            url+="#1";
            vm.openlink(url);
        },
        //定制下单
        customPay:function(designerId){
            var url='https://vip.wps.cn/pay/custom_';
            if(vm.baseData.author_info.type=='word'){
                url+="resume";
            }else if(vm.baseData.author_info.type=='ppt'){
                url+="ppt";
            }else if(vm.baseData.author_info.type=='et'){
                url+="chart";
            }else{
                url+="resume";
            }
            url+="/?csource=docercustom";
            if(typeof(designerId)!='undefined'){
                url+="&dsid="+designerId;
            }
            vm.openlink(url);
        },
        //查看定制案例
        goCustomPrice:function(){
            var url='http://chn.docer.com/custom/';
            if(vm.designerTag=='word'){
                url+="resume.html";
            }else if(vm.designerTag=='ppt'){
                url+="ppt.html";
            }else if(vm.designerTag=='et'){
                url+="chart.html";
            }else{
                url+="resume.html";
            }
            url+="#2";
            vm.openlink(url);
        },
        
        //弹出登录框
        login:function(){
            window.parent.$.wpsApi.qingLogin();
        },
        //设置通用属性
        setValue:function(key,value){
            vm[key]=value;
        },        
        //获取热门任务
        queryTask:function(type){
            /*
            limit   可选 限制返回条数 默认10
            offset  可选 限制返回条数 默认0
            sort    可选 排序方式     desc asc，默认desc 
            order   可选 筛选类型     rec：默认，level：推荐等级，rice：稻米， join：参加人数
            source  可选 默认 vip   cli_home_list：客户端列表任务 cli_home_rec：顶部推荐任务（限制数量6）
            */
            type=type?type:'Hot';
            var data={};
            if(type=='Top'){
                data={source:'cli_home_rec',order:'rec',sort:'desc',offset:0,limit:6};
            }else if(type=='Hot'){
                data={source:'cli_home_list',
                    order:vm.taskType,
                    sort:vm["task"+vm.taskType+"OrderBy"],
                    offset:(vm.pageTask.pageIndex-1)*vm.pageTask.pageCount,
                    limit:vm.pageTask.pageCount
                };
            }
            var key=""+data.source+data.order+data.sort+'offset'+data.offset+'limit'+data.limit;
            var cache=vm.cacheData[key];
            if(cache){
                if(vm.pageTask.pageIndex==1){
                    vm["data"+type+"Task"]=cache.data;
                }else{
                    //vm["data"+type+"Task"]=vm["data"+type+"Task"].concat(cache.data);
                    $.each(cache.data,function(index,v){
                        vm["data"+type+"Task"].push(v);
                    })
                }
                vm.setPageTotalCount('pageTask',cache.total);
                return;
            }
            taskDataServices.queryHotTask({data:data}).done(function(resp) {
                if (resp.result === 'ok') {
                    if(vm.pageTask.pageIndex==1){
                        vm["data"+type+"Task"]=resp.data.data;
                    }else{
                        //vm["data"+type+"Task"]=vm["data"+type+"Task"].concat(resp.data.data);
                        $.each(resp.data.data,function(index,v){
                            vm["data"+type+"Task"].push(v);
                        })
                    }
                    if(type=='Hot'){
                        vm.setPageTotalCount('pageTask',resp.data.count);
                    }
                    vm.cacheData[key]={data:resp.data.data,total:resp.data.count};
                }
            })
        },        
        //上一页
        pageRankPrev:function(id,functionName){
            if(vm[id].pageIndex==1){return;}
            vm[id].pageIndex=vm[id].pageIndex-1;
            //加载数据函数
            vm[functionName||vm[id].functionName]();
        },
        //下一页
        pageRankNext:function(id,functionName){
            if(vm[id].pageIndex==vm[id].totalCount||vm[id].totalCount==0){return;}
            vm[id].pageIndex=vm[id].pageIndex+1;
            //加载数据函数
            vm[functionName||vm[id].functionName]();
        },
        gotoPageNumber:function (id,functionName) {
            if(!vm[id].pageNumber||vm[id].totalCount<=1){return;}
            if(!/^[0-9]*$/.test(vm[id].pageNumber)){
                vm[id].pageNumber="";
                return;
            }
            if (vm[id].pageNumber >= vm[id].totalCount) {
                vm[id].pageIndex = vm[id].totalCount;
            } else if(vm[id].pageNumber<1){
                vm[id].pageIndex =1;
            }else{
                vm[id].pageIndex = vm[id].pageNumber;
            }
            //加载数据函数
            vm[functionName||vm[id].functionName]();
        },
        //设置分页总量
        setPageTotalCount:function(id,totalNum){
            var count=vm[id].pageCount;
            vm[id].totalNum=totalNum;
            vm[id].totalCount=totalNum%count?parseInt(totalNum/count)+1:parseInt(totalNum/count);
        },
        
        selectBannerImg:function(a1,a2,a3){
            window._ms_active_continue(a1,a2,a3);
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
            if(!url){
                return;
            }
            if(window.parent&&window.parent.$.wpsApi.getApi()){
                window.parent.$.wpsApi.qingOpenVipUrl(url);
            }else{
                open(url);
            }
        },
        pageResize:function(type){
            if(window.parent&&window.parent.window){
                //判断是否属于小屏机器
                if(($(window.parent.window).width()-360)<1239){
                    vm.hideTask=true;                    
                    vm.hideMaxNum=8;
                }else{
                    vm.hideTask=false;
                    if(vm.designerTag=='word'){
                        vm.hideMaxNum=12;
                    }else{
                        vm.hideMaxNum=10;
                    }                    
                }
            }
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
            collect.sendCollect(p3,p4);
        }
    })
    if(window.parent&&window.parent.$&&window.parent.$.subscribe){
        window.parent.$.subscribe('callDesigner',function(argument) {
            vm.callDesigner();
        });
    }    
    return vm;
})
