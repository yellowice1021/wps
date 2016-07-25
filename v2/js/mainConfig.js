require.config({
    paths: {        
        'jquery': 'lib/jquery.min',
        'avalon': 'lib/avalon.min',
        'login': 'controllers/login',
        'dataServices': 'resource/dataServices',
        'collect':'utils/collect',
        'main': 'controllers/main',
        'customOnekey': 'controllers/customOnekey',
        'customDesigner': 'controllers/customDesigner',
        'datepicker':'utils/datepicker',
        'xml2json': 'utils/jquery.xml2json',
        'webuploader': 'ui/webuploader/webuploader.noimage.min',
        'wpsLazyLoad' :'utils/wpsLazyLoad',
    },

    shim: {
        'avalon': {            
            exports: 'avalon'
        }
    }
})