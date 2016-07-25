define(['avalon', 'DataServices'], function(avalon, dataServices) {
    'use strict';

    var userinfo = dataServices.getDataModel().userinfo;
    userinfo = userinfo === '' ? {} : userinfo;

    var LoginCtrl = avalon.define('LoginCtrl', function() {
        userInfo = userinfo;
        autoLogin = true;
        loginDisplay = false;
        isLogin = false;
        vm.$skinArray = ['isLogin'];
        init = function() {
            isLogin = !!userInfo.nickname;
        }
        showLogin = function() {
            loginDisplay = true;
        }
        hideLogin = function() {
            loginDisplay = false;
        }
        jumpLogin = function(type, cb) {
            var h = '',
                cu = cb || window.location.href.replace('http://', 'https://');
            if (type === 'wps') {
                h = 'http://account.wps.cn/?cb=' + cu;
            } else {
                h = 'https://vip.wps.cn/login/third_party?utype=' + type + '&keeponline=' + (autoLogin ? 1 : 0) + '&cb=' + cu;
            }
            window.location.href = h;
        }
        checkLogin = function(flag) {
            if (flag && !isLogin) {
                showLogin();
            }
            return isLogin;
        }
        getUser = function() {
            return userInfo.$model;
        }
    })
    LoginCtrl.init();
    return LoginCtrl;
})
