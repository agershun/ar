'use strict';

var arToolkitSource, arToolkitContext, markerControls, scene, camera;

/* __V3D_TEMPLATE__ - template-based file; delete this line to prevent this file from being updated */

window.addEventListener('load', function() {

(function() {

    var params = v3d.AppUtils.getPageParams();

    var PUZZLES_DIR = '../../puzzles/';
    var logicURL = params.logic ? params.logic : '__LOGIC__visual_logic.js'.replace('__LOGIC__', '');
    var sceneURL = params.load ? params.load : '__URL__my_awesome_app.gltf'.replace('__URL__', '');
    if (!sceneURL) {
        console.log('No scene URL specified');
        return;
    }

    // some puzzles can benefit from cache
    v3d.Cache.enabled = true;

    if (v3d.AppUtils.isXML(logicURL)) {
        var logicURLJS = logicURL.match(/(.*)\.xml$/)[1] + '.js';
        new v3d.PuzzlesLoader().loadEditorWithLogic(PUZZLES_DIR, logicURLJS, 
            function() {
                var initOptions = v3d.PL ? v3d.PL.execInitPuzzles().initOptions 
                        : { useFullscreen: true };
                loadScene(sceneURL, initOptions);
            }
        );
    } else if (v3d.AppUtils.isJS(logicURL)) {
        new v3d.PuzzlesLoader().loadLogic(logicURL, function() {
            var initOptions = v3d.PL ? v3d.PL.execInitPuzzles().initOptions 
                    : { useFullscreen: true };
            loadScene(sceneURL, initOptions);
        });
    } else {
        loadScene(sceneURL, { useFullscreen: true});
    }
})();

function loadScene(sceneURL, initOptions) {

    initOptions = initOptions || {};

    initOptions.useBkgTransp = true;


    var ctxSettings = {};
    if (initOptions.useBkgTransp) ctxSettings.alpha = true;
    if (initOptions.preserveDrawBuf) ctxSettings.preserveDrawingBuffer = true;

    var preloader = initOptions.useCustomPreloader 
            ? createCustomPreloader(initOptions.preloaderProgressCb, 
            initOptions.preloaderEndCb) 
            : new v3d.SimplePreloader({ container: 'container' });
    
    var app = new v3d.App('container', ctxSettings, preloader);
    
    if (initOptions.useBkgTransp) {
        app.clearBkgOnLoad = true;
        app.renderer.setClearColor(0x000000, 0);
    }


    initAR(app);


    // namespace for communicating with code generated by Puzzles 
    app.ExternalInterface = {};
    prepareExternalInterface(app);
    
    if (initOptions.preloaderStartCb) initOptions.preloaderStartCb();
    if (initOptions.useFullscreen) {
        initFullScreen();
    } else {
        var fsButton = document.getElementById('fullscreen_button');
        if (fsButton) fsButton.style.display = 'none';
    }

    sceneURL = initOptions.useCompAssets ? sceneURL + '.xz' : sceneURL;
    app.loadScene(sceneURL, function() {
        app.enableControls();
        app.run();

        if (v3d.PE) v3d.PE.updateAppInstance(app);
        if (v3d.PL) v3d.PL.init(app, initOptions);


console.log(91,app);

        runCode(app);
    }, null, function() {
        console.log('Can\'t load the scene ' + sceneURL);
    });

    return app;
}

function createCustomPreloader(updateCb, finishCb) {
    function CustomPreloader() { 
        v3d.Preloader.call(this); 
    }

    CustomPreloader.prototype = Object.assign(Object.create(v3d.Preloader.prototype), {
        onUpdate: function(percentage) { 
            v3d.Preloader.prototype.onUpdate.call(this, percentage);
            if (updateCb) updateCb(percentage);
        },
        onFinish: function() {
            v3d.Preloader.prototype.onFinish.call(this);
            if (finishCb) finishCb();
        }
    });
        
    return new CustomPreloader();
}

function initFullScreen() {

    var fsButton = document.getElementById('fullscreen_button');
    if (!fsButton) return;

    if (document.fullscreenEnabled || 
            document.webkitFullscreenEnabled ||
            document.mozFullScreenEnabled ||
            document.msFullscreenEnabled)
        fullscreen_button.style.display = 'inline';

    fullscreen_button.addEventListener('click', function(event) {
        event.stopPropagation();
        if (document.fullscreenElement || 
                document.webkitFullscreenElement ||
                document.mozFullScreenElement ||
                document.msFullscreenElement) {
            exitFullscreen();
        } else
            requestFullscreen(document.body);
    });

    function changeFullscreen() {
        if (document.fullscreenElement || 
                document.webkitFullscreenElement ||
                document.mozFullScreenElement ||
                document.msFullscreenElement)
            fullscreen_button.className = 'fullscreen-close';
        else
            fullscreen_button.className = 'fullscreen-open';
    }

    document.addEventListener('webkitfullscreenchange', changeFullscreen);
    document.addEventListener('mozfullscreenchange', changeFullscreen);
    document.addEventListener('msfullscreenchange', changeFullscreen);
    document.addEventListener('fullscreenchange', changeFullscreen);

    function requestFullscreen(elem) {
        if (elem.requestFullscreen)
            elem.requestFullscreen();
        else if (elem.mozRequestFullScreen)
            elem.mozRequestFullScreen();
        else if (elem.webkitRequestFullscreen) 
            elem.webkitRequestFullscreen();
        else if (elem.msRequestFullscreen)
            elem.msRequestFullscreen();
    }
    
    function exitFullscreen() {
        if (document.exitFullscreen)
            document.exitFullscreen();
        else if (document.mozCancelFullScreen)
            document.mozCancelFullScreen();
        else if (document.webkitExitFullscreen)
            document.webkitExitFullscreen();
        else if (document.msExitFullscreen)
            document.msExitFullscreen();
    }
}

function prepareExternalInterface(app) {
    // register functions in the app.ExternalInterface to call them from Puzzles, e.g:
    // app.ExternalInterface.myJSFunction = function() {
    //     console.log('Hello, World!');
    // }

}

function runCode(app) {
    // add your code here, e.g. console.log('Hello, World!');

}

function initAR(app) {
    console.log('init AR');

    var arToolkitSource = new THREEx.ArToolkitSource({
        sourceType : 'webcam',
    });

    arToolkitSource.init(function onReady(){
        onResize()
    })

    window.addEventListener('resize', function(){
        onResize()
    })

    var arToolkitContext = new THREEx.ArToolkitContext({
        cameraParametersUrl: THREEx.ArToolkitContext.baseURL + 'camera_para.dat',
        detectionMode: 'mono',
    });
    // initialize it
    arToolkitContext.init(function onCompleted(){
        console.log('ar completed');

        setTimeout(function(){

            // copy projection matrix to camera
            if(app.camera) {
                app.camera.projectionMatrix.copy( arToolkitContext.getProjectionMatrix() );

                markerControls = new THREEx.ArMarkerControls(arToolkitContext, app.camera, {
                    type : 'pattern',
                    patternUrl : THREEx.ArToolkitContext.baseURL + 'patt.hiro',
                    // patternUrl : THREEx.ArToolkitContext.baseURL + '../data/data/patt.kanji',
                    // as we controls the camera, set changeMatrixMode: 'cameraTransformMatrix'
                   changeMatrixMode: 'cameraTransformMatrix'
                    // changeMatrixMode: 'modelViewMatrix'
                });

                markerControls.addEventListener('markerFound',function(e){
                    console.log('marker found!');
                });
            }
        },1000);

    });



    function onResize(){
        arToolkitSource.onResize()  
//        arToolkitSource.copySizeTo(app.renderer.domElement) 
        if( arToolkitContext.arController !== null ){
            arToolkitSource.copySizeTo(arToolkitContext.arController.canvas)    
        }   
    }

    requestAnimationFrame(function animate() {
        if( arToolkitSource.ready === false ) return;
        arToolkitContext.update( arToolkitSource.domElement );        
    });

    animate();




}



});

