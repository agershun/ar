'use strict';


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

    app.ExternalInterface.initAR = function() {
        //console.log('Init AR');
    }


}

function runCode(app) {
    // add your code here, e.g. console.log('Hello, World!');
    initPOS();
    initAR(app);

}

function initAR(app) { 
    var arToolkitSource, arToolkitContext, markerControls, status;
    var trials = 0;
    var cvnew, cvold;
    var o, o1;


    var arToolkitSource = new THREEx.ArToolkitSource({
        sourceType : 'webcam',
//        sourceType : 'image',
//        sourceUrl: '1001.png'

    });

    arToolkitSource.init(function onReady(){
        onResize();
    })

    window.addEventListener('resize', function(){
        onResize();
    });

    var arToolkitContext = new THREEx.ArToolkitContext({
        trackingBackend:'aruco',
        cameraParametersUrl: THREEx.ArToolkitContext.baseURL + 'camera_para.dat',
        detectionMode: 'mono',
        
    });
    // initialize it
    arToolkitContext.init(function onCompleted(){

        setTimeout(function(){

            // copy projection matrix to camera
            if(app.camera) {
               // app.camera.projectionMatrix.copy( arToolkitContext.getProjectionMatrix() );

                markerControls = new THREEx.ArMarkerControls(arToolkitContext, app.camera, {
                   type : 'barcode',
                   barcodeValue: 1001,
//                    type : 'pattern',
//                    patternUrl : THREEx.ArToolkitContext.baseURL + 'aruco1001.patt',

                    // patternUrl : THREEx.ArToolkitContext.baseURL + 'patt.hiro',

                    // patternUrl : THREEx.ArToolkitContext.baseURL + '../data/data/patt.kanji',
                    // as we controls the camera, set changeMatrixMode: 'cameraTransformMatrix'
                   changeMatrixMode: 'cameraTransformMatrix'
                    // changeMatrixMode: 'modelViewMatrix'
                });

                markerControls.addEventListener('markerFound',function(e){
//                    console.log('marker found!');
                });
                status = true;
            }
        },100);

    });


    function onResize(){
        arToolkitSource.onResize(); 
//        arToolkitSource.copySizeFrom(app.renderer.domElement) 
        if(arToolkitContext.arController !== null ){
            arToolkitSource.copySizeTo(arToolkitContext.arController.canvas);    
        }   
    }


//console.log(app);
    var oldRender = app.renderer.render;

    app.renderer.render = function (scene, camera) {
        if(arToolkitContext && arToolkitSource) {
             if(arToolkitSource.ready) {
                arToolkitContext.update( arToolkitSource.domElement );        
            }
        }

//console.log(this);
//console.log(arguments);
        if(status && arToolkitContext && arToolkitSource &&  arToolkitSource.ready) {
            if(camera.visible) {

                var smooth = false;

                if(smooth) {
                    var p = camera.position;
                    var r = camera.rotation;
                    if(o && o1) {
                        // if(Math.abs(p.x - o.x) > 0.01) p.x = (p.x+o.x*2)/3;
                        // if(Math.abs(p.y - o.y) > 0.01) p.y = (p.y+o.y*2)/3;
                        // if(Math.abs(p.z - o.z) > 0.01) p.z = (p.z+o.z*2)/3;

                        // if(Math.abs(r._x - o._x) > 0.01) r._x = (r._x+o._x*2)/3;
                        // if(Math.abs(r._y - o._y) > 0.01) r._y = (r._y+o._y*2)/3;
                        // if(Math.abs(r._z - o._z) > 0.01) r._z = (r._z+o._z*2)/3;


                        console.log(p.x,o.px, o1.px);


                        var px = (p.x+o.px*2+o1.px*33)/36;
                        var py = (p.y+o.py*2+o1.py*33)/36;
                        var pz = (p.z+o.pz*2+o1.pz*33)/36;

                        camera.position.set(px,py,pz);

                        var rx = (r.x+o.rx*2+o1.rx*33)/36;
                        var ry = (r.y+o.ry*2+o1.ry*33)/36;
                        var rz = (r.z+o.rz*2+o1.rz*33)/36;

                        camera.rotation.set(rx,ry,rz);

                        console.log('=',px);


                    }
                    if(o) {
                        o1 = o;
                    }
    //                o = {px:p.x, py:p.y, pz:p.z, rx:r.x, ry:r.y, rz:r.z };
                    o = {px:p.x, py:p.y, pz:p.z, rx:r.x, ry:r.y, rz:r.z };
                }

//                camera.position.set(1,1,1);


                // camera.position.x = 10;
                // camera.position.y = 10;
                // camera.position.z = 10;

//                camera.updateProjectionMatrix();
//
//                console.log(camera.position.x);

                oldRender.apply(this,arguments);
                trials = 40;
//                cvold = app.camera.projectionMatrix;
            } else {
                window.POS.smooth();
                if(trials>0) {
                    oldRender.apply(this,arguments);
                    trials--;
                } else {
                    app.renderer.clear();
                }
            }
        }

//debugger;
    }

    // Instead requestAnimationFrame
    // setInterval(function(){
    //     if( arToolkitSource.ready === false ) return;
    //     arToolkitContext.update( arToolkitSource.domElement );        
    // },30);


}

function initPOS() {
    var oldPose = window.POS.Posit.prototype.pose;


    window.POS.Posit.prototype.pose = function() {
        var ret = oldPose.apply(this,arguments);
        var o = {
            t:ret.bestTranslation,
            r:ret.bestRotation
        };
        window.POS.smooth(o);

        return ret;
    }

}

var o1, o2, o3, o4;

window.POS.smooth = function(o) {
            if(!o) {
                // Prediction
                if(o1) {
                    if(o2) {
                        o = {t:[],r:[[],[],[]]}
                        if(o3) {
//                            console.log('prediction 3');
                            for(var i=0;i<3;i++) {
                                var a2 = (o2.t[i]-o3.t[i]);
                                var a1 = (o1.t[i]-o2.t[i]);
                                if(a2 > 0.1) {
                                    a1 = a1*a1/a2;
                                }
                                o.t[i] = o1.t[i] + a1;

                                for(var j=0;j<3;j++) {
                                    var a2 = (o2.r[i][j]-o3.r[i][j]);
                                    var a1 = (o1.r[i][j]-o2.r[i][j]);
                                    if(a2 > 0.1) {
                                        a1 = a1*a1/a2;
                                    }
                                    o.r[i][j] = o1.r[i][j]+a1;
                                    //o.r[i][j] = o1.r[i][j]+ o2.r[i][j]-o3.r[i][j];
                                }
                            }

// 4+3-2 = 5

// 1,3,4 = 4.5

// 4 + (4-3)=1 + (3-1)=2 = 7

// 4 + (4-3)*(4-3)/(3-1) = 4.5

// 1,3,6 = 6 + 3*3/2 = 10.5


// 8-3 = 4
// 4+(3-2)
// 12-6-2                        
                        } else {
//                            console.log('prediction 2');
                            for(var i=0;i<3;i++) {
                                o.t[i] = 2*o1.t[i] - o2.t[i];
                                for(var j=0;j<3;j++) {
                                    o.r[i][j] = 2*o1.r[i][j]-o2.r[i][j];
                                }
                            }
                        }

                    } else {
//                            console.log('prediction 1');
                        o = o1;
                    }
                }

            } else {
                // Smoothing
//                console.log('smoothing');
//                if(o1 && o2 && o3 && o4) {
                if(o1 && o2 && o3) {
                    for(var i=0;i<3;i++) {
//                        o.t[i] = (o.t[i] + o1.t[i] + o2.t[i] + o3.t[i] + o4.t[i]) / 5;
                        o.t[i] = (o.t[i] + o1.t[i] + o2.t[i] + o3.t[i]) / 4;
                        for(var j=0;j<3;j++) {
//                            o.r[i][j] = (o.r[i][j] + o1.r[i][j] + o2.r[i][j] + o3.r[i][j] + o4.r[i][j]) / 5;
                            o.r[i][j] = (o.r[i][j] + o1.r[i][j] + o2.r[i][j] + o3.r[i][j]) / 4;
                        }
                    }
                }
            }

            if(o3) {
                o4 = o3;
            }
            if(o2) {
                o3 = o2;
            }
            if(o1) {
                o2 = o1;
            }
            if(o) {
                o1 = o;
            }
            return o;
}


});

