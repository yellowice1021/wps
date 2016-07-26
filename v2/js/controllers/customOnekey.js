define(['jquery', 'avalon', 'dataServices',
'collect','datepicker','webuploader', 'xml2json',],   
    function($, avalon, dataServices,
    collect,datepicker1,webuploader,xml2json) {
        'use strict';
    //var token = datamodel.csrf_token;
    //各类型文件对应的mineType
    var mineType = {
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'ppt': 'application/vnd.ms-powerpoint',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'dot': 'application/msword',
        'dotx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
        'xlt': 'application/vnd.ms-excel',
        'xltx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
        'pot': 'application/vnd.ms-powerpoint',
        'potx': 'application/vnd.openxmlformats-officedocument.presentationml.template',
        'pps': 'application/vnd.ms-powerpoint',
        'wps': 'application/kswps',
        'dps': 'application/octet-stream',
        'et': 'application/octet-stream',
        'wpt': 'application/kswps',
        'dpt': 'application/octet-stream',
        'ett': 'application/octet-stream',
        'jpg': 'image/jpeg',
        'ai': 'application/postscript',
        'eps': 'application/postscript',
        'cdr': 'application/octet-stream',
        'pdf': 'application/pdf',
        //2015-08-10新增上传类型
        'pptm': 'application/vnd.ms-powerpoint.presentation.macroEnabled.12',
        'xlsm': 'application/vnd.ms-excel.sheet.macroEnabled.12',
        'csv' : 'application/vnd.ms-excel',
        'rar': 'application/octet-stream',
        'zip': 'application/octet-stream',
        //'7z': 'application/octet-stream',
        'png':'image/png'

        /*
        获取文件类型方法
        1.在本配置列表不要出现相应配置项
        2.选择你要上传的测试文件，文件不能空0kb大小
        3.vm.work_validate = function(type, s, d) {
        断点查看s.type值即可.
         */

    }

    var mtArr = [],
        ft = [];
    avalon.each(mineType, function(k, v) {
        ft.push(k);
        mtArr.push(v);
    });

    mtArr = mtArr.join(',');
    //上传作品指定的文件类型
    var fileType = ft.join(',');
    //上传公用的初始配置
    var uploadDefault = {
        // 自动上传。
        auto: true,
        // swf文件路径
        swf: '/application/partner/views/custom/js/ui/webuploader/Uploader.swf',
        fileVal: 'file',
        method: 'POST',
        formData: {}
    }
    //公用设置上传的头部信息
    var setHeader = function(object, data, headers) {
        headers['Access-Control-Allow-Origin'] = '*';
        headers['Access-Control-Request-Headers'] = 'content-type';
        headers['Access-Control-Request-Method'] = 'POST';
        delete data.id;
        delete data.name;
        delete data.type;
        delete data.lastModifiedDate;
        delete data.size;
    }
    //Hook 每次上传作品前先请求 金山云 的授权信息
    webuploader.Uploader.register({
        'before-send-file': 'getToken'
    }, {
        getToken: function() {
            var deferred = webuploader.Base.Deferred();
            var currentUploader = this.owner;
            var ut = currentUploader.option('upType');
            var overUp = currentUploader.option('overUp');
            var tokenData = {
                filename: arguments[0].name,
                filetype: ut
            }
            vm.fileName=arguments[0].name;
            vm.data.fileName=arguments[0].name;
            dataServices.get('custom').upload_token({
                data: tokenData
            }).done(function(resp) {
                if (resp.result === 'ok') {
                    currentUploader.option('formData', resp.data);
                    currentUploader.option('server', resp.data.host);
                    deferred.resolve();
                }else{
                    deferred.resolve(false);
                }
            })
            return deferred.promise();
        }
    });

    var customOnekey={
            tag:'',//定制类型
            tagName:'',//定制类型名称
            content:'',//需求(一句话)
            occupation:'其他',//职业
            fileForm:'WORD',//文件格式
            et_purpose:'其他',//et定制用途
            fileName:'',//文件名称
            fileUrl:'',//文件地址
            detail:'',//需求详情
            qq:'',//用户qq号
            email:'',//用户email
            tel:'',//用户名称
            price:'',//用户预算
            need_invoice:false,//是否开具发票
            receiptTitle:'',//发票抬头
            purpose:[],//定制作用
            profession:'其他',//定制用于行业
            style:'其他',//风格
            viewOutput:'其他',//可视化输出
            scale:'其他',//比例 1普屏2宽屏
            effect:'其他效果',//效果 1静态2动态
            date:'',//计划完成时间
            is_urgent:false//是否加急的
        };
    var vm = avalon.define({
        $id:"customOnekeyCtrl",          
        customMap:{word:'个性简历',ppt:'演示PPT',et:'数据表格'},
        showMe:false,
        designerTag:'ppt',//ppt word et
        fileName:'',
        showCustomCase:false,//显示ppt案例
        data:customOnekey,
        showMoreInfo:false,
        showServieInfo:true,//联系客服
        payState:0,//1支付成功 2支付失败 
        submit_btn_name:"为我定制",
        checkState:false,//检查
        baseData:{
            /*用途：产品推介，节日庆典，计划总结，创业融资，产品发布，述职汇报，年会颁奖，结婚庆典，公司介绍，简历竞聘。
            行业：科技，教育，党政，金融，文艺，运动，交通，物流，广告，旅游，能源，通讯，生物，制造，工业，农牧业，互联网，电子商务，房地产，医疗制药，影视传媒，新闻媒体，通用性。
            选择风格：商务，简约，复古，淡雅，中国风，韩范，欧美，可爱，创意，卡通，扁平，梦幻，酷炫，另类，清新，杂志风，科技，工业，生物，环保。
            可视化输出：  柱状图、折线图、条形图、饼图、面积图、圆环图，其他。*/
            occupation:['应届生','职场新人','跳槽','企业高管','行业专家','其他'],//职业
            et_purpose:['购销发货','办公常用','市场销售','人力资源','其他'],//et定制用途
            purpose:['产品推介','节日庆典','计划总结','创业融资','产品发布','述职汇报','年会颁奖','结婚庆典','公司介绍','简历竞聘','其他'],//作用
            profession:['科技','教育','党政','金融','文艺','运动','交通','物流','广告','旅游','能源','通讯','生物','制造','工业','农牧业','互联网','电子商务','房地产','医疗制药','影视传媒','新闻媒体','通用性'],//用于行业
            style:['商务','简约','复古','淡雅','中国风','韩范','欧美','可爱','创意','卡通','扁平','梦幻','酷炫','另类','清新','杂志风','科技','工业','生物','环保','其他'],//用于行业
            viewOutput:['柱状图','折线图','条形图','饼图','面积图','圆环图','其他'],//可视化输出
            effect:['动态(动画效果)','静态(图片展示)','其他效果'],//效果
            scale:['宽屏(16:9)','普屏(4:3)','竖屏','其他'],//比例
        },
        show:{
            purpose:false,//作用
            profession:false,//用于行业
            style:false,//用于行业
            viewOutput:false,//可视化输出
            effect:false,//效果
            scale:false//比例
        },
        setDesignerTag:function(name){
            vm.designerTag=name;
            vm.data=customOnekey;
            vm.data.tag=name;
            vm.checkState=false;
            vm.fileError="";
            if(vm.designerTag=='word'){
                vm.data.price=68;
            }
            //vm.createUploadButton();
        },
        init : function() {
            //初始化需要填写的地址数据
            vm.data=customOnekey;
            //初始化更多信息
            vm.showMoreInfo=false;
            //显示自己
            vm.showMe=true;
            var app=vm.getQueryStringRegExp("app")||'wps';
            var appJson={wps:'word',wpp:'ppt',et:'et'};
            vm.setDesignerTag(appJson[app]?appJson[app]:'ppt');
            vm.checkState=false;
            vm.createDateUI();
            vm.createUploadButton();
        },
        /*
        ----------------------------------------------
            word
            custom_type     设计类型-制作格式
            use_for         用户类型
            attachements    文件地址
            date            期望的完成时间
            price
            qq
            phone
            email
            is_urgent       是否加急
            ----------------------------------------------
            ppt
            custom_type     设计类型        （制定类型）
            name            需求名称
            use_for         所属行业和用途（文字：用户类型）
            style           期望的设计风格(表格：可视化输出)
            detail          详细描述需求
            attachements    attachements
            date            期望的完成时间
            price
            qq
            phone
            email
            need_invoice    是否需要发票
            animation       动画
            screen_size     屏幕尺寸
            is_urgent       是否加急
            ----------------------------------------------
            et
            custom_type     设计类型        （制定类型-定制格式）
            use_for         所属行业和用途（文字：用户类型）
            style           期望的设计风格(表格：可视化输出)
            detail          详细描述需求
            attachements    attachements
            date            期望的完成时间
            price
            qq
            phone
            email
            need_invoice    是否需要发票
            is_urgent       是否加急
         */
        submit_order:function(){
            vm.checkState=true;
            if(!vm.check_order_data()||vm.submit_btn_name!="为我定制"){
                return;
            }
            vm.submit_btn_name="提交中...";
            var data={
                    custom_type     :'',//设计类型    （制定类型-word(制作格式)|et(制定什么表格)）
                    name            :vm.data.content,//需求名称
                    use_for         :'',//所属ppt&et行业和用途|文字：用户类型
                    style           :'',//期望的ppt：设计风格|表格：可视化输出
                    detail          :vm.data.detail,//详细描述需求
                    attachements    :vm.data.fileUrl,//attachements
                    date            :vm.data.date,//期望的完成时间
                    price           :vm.data.price,//价格
                    qq              :vm.data.qq,//qq
                    phone           :vm.data.tel,//电话
                    email           :vm.data.email,//邮件
                    need_invoice    :vm.data.need_invoice?1:0,//是否需要发票
                    animation       :vm.data.effect,//动画
                    screen_size     :vm.data.scale,//屏幕尺寸
                    is_urgent       :vm.data.is_urgent?1:0//是否加急
                };
            var custom_type={word:"个性简历",ppt:"演示PPT",et:"数据表格"};
            if(vm.designerTag=='word'){
                data.custom_type=custom_type[vm.designerTag]+(vm.showMoreInfo?"-"+vm.data.fileForm:'');
                data.use_for=vm.data.occupation;
            }else{
                data.custom_type=custom_type[vm.designerTag]+(vm.designerTag=='et'?"-"+vm.data.et_purpose:'');
                if(vm.showMoreInfo){
                    data.use_for=vm.data.profession+","+vm.data.purpose.toString();
                }
                data.style=vm.designerTag=='ppt'?vm.data.style:vm.data.viewOutput;
            }
            var baseData={
                word:["custom_type","use_for","attachements","price","qq","phone","email","is_urgent","need_invoice"],
                wordMore:["date"],
                ppt:["custom_type","name","detail","attachements","price","qq","phone","email","need_invoice","is_urgent"],
                pptMore:["use_for","style","date","animation","screen_size"],
                et:["custom_type","detail","attachements","price","qq","phone","email","need_invoice","is_urgent"],
                etMore:["use_for","style","date"]
            }
            var submitData={},arrayList=baseData[vm.designerTag].concat(vm.showMoreInfo?baseData[vm.designerTag+"More"]:[]);
            $.each(arrayList,function(i,v){//装载需要提交的数据
                submitData[v]=data[v];
            })
            //submitData["csrf_token"]="";
            submitData["source"]="wps_client";            
            dataServices.get('custom').submit_oneKey({data:submitData}).done(function(resp) {
                if(resp.result=='ok'){
                    vm.payState=1;//提交成功
                    if(vm.designerTag=="word"){
                        vm.payState=2;//设置支付中状态
                        vm.openlink("https://vip.wps.cn/pay/custom_resume/?dsid=203283058&csource=docercustom&money="+vm.data.price+"&from=&email="+vm.data.email+"&quick="+(vm.data.is_urgent?1:0));
                    }
                }
            }).always(function(){
                vm.submit_btn_name="为我定制";
            });
        },
        check_order_data:function(){
            //通用检查项 电话|电话格式 邮件|邮件格式 qq 价格|价格格式
            if(!vm.data.tel||!vm.data.email||!vm.data.qq||!vm.data.price
                ||!vm.checkPhone()||!vm.checkEmail()||!vm.checkPrice()){
                return false;
            }
            if(vm.designerTag=='word'){
                //完成日期
                if(!vm.data.fileUrl||vm.showMoreInfo&&!vm.data.date){
                    return false;
                }
            }else if(vm.designerTag=='et'||vm.designerTag=='ppt'){
                if(!vm.data.detail||(!vm.data.content&&vm.designerTag=='ppt')){
                    return false;
                }
                //完成日期 定制作用
                if(vm.showMoreInfo&&(!vm.data.date||!vm.data.purpose.length)){
                    return false;
                }
            }
            return true;
        },
        goCustomPrice:function(){
            var url='http://chn.docer.com/custom/';
            if(vm.designerTag=='word'){
                url+="resume.html";
            }else if(vm.designerTag=='ppt'){
                url+="ppt.html";
            }else if(vm.designerTag=='et'){
                url+="chart.html";
            }
            url+="#3";
            vm.openlink(url);
        },
        createUploadButton:function(){
            vm.createUpload("idUploadFile","",50);
            vm.createUpload("idUploadFile2","",50);
            vm.createUpload("idUploadFile3","",50);
            vm.createUpload("idUploadFile4","",50);
            vm.createUpload("idUploadFile5","",50);
            vm.createUpload("idUploadFile6","",50);
            vm.createUpload("idUploadFile7","",50);
            vm.createUpload("idUploadFile8","",50);
            vm.createUpload("idUploadFile9","",50);
        },
        applyCase:function(){
            var content="项目标题：XXX公司报表设计\n"+
                        "公司名称：XXX珠光宝器\n"+
                        "经营范围：黄金、白银、钻石、翡翠、彩色宝石等珠宝\n"+
                        "公司网址：www.XXX.com\n"+
                        "\n"+
                        "主要用途：介绍实体店、网店、柜台、名片和产品等介绍。\n"+
                        "\n"+
                        "设计要求：\n"+
                        "1、设计要求主题突出、寓意深刻。\n"+
                        "2、表现要求简约大气、突显雍容华贵。\n"+
                        "3、作品风格、形式不限，但必须原创。\n"+
                        "4、设计PPT规格均为16：9宽屏显示。\n"+
                        "5、必须是彩色原稿，能以不同的比例尺寸清晰显示。\n"+
                        "6、标识应为平面形式，可用于各类广告、宣传商务推介用途。\n"+
                        "7、内容显示的方式，可以添加少量的动画效果。\n"+
                        "\n"+
                        "知识产权说明：\n"+
                        "1、设计要求主题突出、寓意深刻。\n"+
                        "2、表现要求简约大气、突显雍容华贵。\n"+
                        "3、作品风格、形式不限，但必须原创。\n"+
                        "4、设计PPT规格均为16：9宽屏显示。\n"+
                        "5、必须是彩色原稿，能以不同的比例尺寸清晰显示。\n"+
                        "6、标识应为平面形式，可用于各类广告、宣传商务推介用途。\n"+
                        "7、内容显示的方式，可以添加少量的动画效果。"
            vm.data.detail=content;
        },
        backIndex:function(){
        	$("#mainBox").animate({
        		scrollTop:0
        	},0);
            vm.payState=0;
            vm.showMe=false;
            avalon.vmodels.mainCtrl.showMe=true;
        },
        choose:function(tag,value){
            if(tag=='purpose'){//最多可以选择三个
                if(~$.inArray(value, vm.data[tag])){                    
                    var array=[];
                    $.each(vm.data[tag],function(i,v){
                        if(v!=value){
                            array.push(v);
                        }
                    })
                    vm.data[tag]=array;
                    return;
                }
                if(vm.data.purpose.length<3){
                    vm.data.purpose.push(value);
                }
                return;
            }
            vm.data[tag]=value;
        },
        check:function(tag,checkValue,v2){
            if(tag=='purpose'){
                return ~$.inArray(checkValue, vm.data[tag]);
            }
            return checkValue==vm.data[tag];
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
        //构造日期控件
        createDateUI : function() {
            $('[clazz="date"]').datepicker({
                dateFormat: 'yy-mm-dd',
                //maxDate: new Date(),
                minDate: new Date(),
                showOn: "both",
                buttonImage: 'http://img1.template.cache.wps.cn/wpsweb/script/docer/partner/custom/css/img/date.png',
                buttonImageOnly: true,
                selectOtherMonths: true,
                changeMonth: true,
                changeYear: true,
                onSelect: function(date, init) {
                    vm.data.date = date;
                }
            })
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
        //电话号码检查函数，true表示邮件正确，false 邮箱错误
        checkPrice:function(){
            var telReg = !!vm.data.price.match(/^[0-9]*$/);
            if(vm.data.price==0||vm.data.price&&!telReg){
                return false;
            }
            return true;
        },
        //电话号码检查函数，true表示邮件正确，false 邮箱错误
        checkPhone:function(){
            var telReg = !!vm.data.tel.match(/^(1\d{10})$/);            
            if(vm.data.tel&&!telReg){
                return false;
            }
            return true;
        },
        //邮箱检查函数，true表示邮件正确，false 邮箱错误
        checkEmail:function(){
            //var re= /\w@\w*\.\w/
            var re=/^([a-zA-Z0-9_-])+((\.)?([a-zA-Z0-9_-])+)+@([a-zA-Z0-9_-])+(\.([a-zA-Z0-9_-])+)+$/;
            var re2=/^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+(\.([a-zA-Z0-9_-])+)+$/;
            if(vm.data.email&&(!re.test(vm.data.email)&&!re2.test(vm.data.email))){
                return false;
            }
            return true;
        },
        getQueryStringRegExp:function(name) {
            var reg = new RegExp("(^|\\?|&)" + name + "=([^&^#]*)(\\s|&|$|#)", "i");
            if (reg.test(location.href)) {
                return unescape(RegExp.$2.replace(/\+/g, " "));
            }
            return "";
        },
        //上传进度
        process:"",
        //上传错误信息
        fileError:"",
        // 构造上传作品按钮
        // 上传控件ID，上传成功之后填充url变量名,大小M单位
        createUpload : function(btn_upload_img_name,pro_name,size) {
            var newOpt = $.extend(true, {}, uploadDefault, {
                // 选择文件的按钮。可选。
                // 内部根据当前运行是创建，可能是input元素，也可能是flash.
                pick: '#'+btn_upload_img_name,
                fileNumLimit: 1,
                upType: 'file',//'custom_img',//'file',
                overUp: 'work',
                fileSingleSizeLimit: 1048576 * size,
                // 只允许选择文件，可选。
                accept: {
                    title: '上传文件',
                    extensions: fileType,
                    mimeTypes: mtArr
                }
            });

            // 初始化Web Uploader
            var uploader = webuploader.create(newOpt);            
            uploader.on('uploadBeforeSend', setHeader);
            uploader.on('beforeFileQueued', function(file) {
                vm.fileError="";
                vm.data.fileUrl="";
            })
            //开始上传事件
            uploader.on('startUpload', function() {
                
            });
            // 文件上传过程中返回进度
            uploader.on('uploadProgress', function(file, percentage) {
                vm.process = Math.floor(percentage * 100);
            });
            // 文件上传成功
            uploader.on('uploadSuccess', function(file, result) {
                var obj = $.xml2json(result._raw);                
                //vm.attachements.push({name:vm.fileName,url:obj.Location});
                vm.data.fileUrl=obj.Location;
            });
            // 完成上传完了，成功或者失败
            uploader.on('uploadComplete', function(file) {
                uploader.reset();
                vm.process="";
                //vm.createUploadButton();
            });
            // 文件上传失败
            uploader.on('uploadError', function(file, reason){
                vm.fileError="服务器繁忙请重试上传";
            });
            uploader.on('error', vm.work_validate);
        },
        //上传作品|验证不通过
        work_validate : function(type, s, d) {
            var validateMap = {
                //你上传的文档，格式不符合稻壳网的要求，请重新上传！
                //你上传的文档，已超过10M大小，建议你提供文档大纲或直接联系稻壳网站QQ：2853732716
                Q_EXCEED_NUM_LIMIT: '每次只能上传' + s + '个作品',
                Q_TYPE_DENIED: '你上传的文档，格式不符合的要求，请重新上传！',
                F_EXCEED_SIZE: '你上传的文档，已超过50M大小，建议你提供文档大纲或直接联系QQ：2853732716'
            }
            vm.fileError=validateMap[type];
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
    return vm;
})
