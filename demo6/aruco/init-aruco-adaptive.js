
function initArucoAdaptive(app) {
	var obj, posit, detector, ctx2;
	var scale, scaledWidth, scaledHeight, marginLeft, marginTop;
	var ctx2, canvas2;

	var debug = true; // Draw rectangles
	var modelSize = 1; // for Poser

	var container = document.getElementById("container");
	var v3dCanvas = document.getElementsByClassName("v3d-canvas")[0];

	var w = v3dCanvas.width;
	var h = v3dCanvas.height;
	var vw, vh;

if(debug) {
	var canvas = document.createElement("canvas");
	canvas.width = w;
	canvas.height = h;
	canvas.style.width = w+"px";
	canvas.style.height = h+"px";
	canvas.style.position = "absolute";
	canvas.style.top = "0px";
	canvas.style.left = "0px";
	container.insertBefore( canvas, container.firstChild );
	var ctx = canvas.getContext("2d");
}

	var video = document.createElement("video");
//	video.autoplay = "true";
    video.setAttribute('autoplay', '');
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
	// video.style.position = "absolute";
	// video.style.top = "0px";
	// video.style.left = "0px";
//	video.style.width = "812px";
//	video.style.height = "375px";

//	container.insertBefore( video, container.firstChild );

	window.addEventListener('resize',Resize);

	if (navigator.mediaDevices.getUserMedia) {       
		navigator.mediaDevices.getUserMedia({audio:false, video: {facingMode: "environment" }})
		.then(function(stream) {
			video.srcObject = stream;
			video.oncanplay = function() {

				Resize();

			}
		})
		.catch(function(err0r) {
			console.log("Something went wrong!");
		});
	}

	function nx(x) {
		return x*scale+marginLeft;
	}

	function ny(y) {
		return y*scale+marginTop;
	}

function Resize() {
//	console.log('resize');
				w = v3dCanvas.width;
				h = v3dCanvas.height;
				canvas.width = w;
				canvas.height = h;
				canvas.style.width = w+"px";
				canvas.style.height = h+"px";

				vw = video.videoWidth;
				vh = video.videoHeight;
//console.log(w,h,vw,vh);
				canvas2 = document.createElement("canvas");
				canvas2.width = vw;
				canvas2.height = vh;
				ctx2 = canvas2.getContext("2d");

				// Prepare obj and camera
				obj = new THREE.Object3D();
				obj.matrixAutoUpdate = false;

			//	app.camera.matrixAutoUpdate = false;


				if(w/vw > h/vh) {
					scale = w/vw;
				} else {
					scale = h/vh;
				}
				scaledHeight = vh * scale; 
				scaledWidth = vw * scale; 
				marginLeft = (w-scaledWidth)/2;
				marginTop = (h-scaledHeight)/2;

				// console.log(71,scale,w/vw,h/vh, w,h,vw,vh);
				// console.log(scaledWidth,scaledHeight,marginLeft,marginTop);

//				console.log(scale, marginLeft, marginTop);

				modelSize = modelSize;

				detector = new AR.Detector();
				posit = new POS.Posit(modelSize, w);

				follow();				

}


function follow() {

	// Change controls
    var trials = 0;
	var originalUpdate = app.controls.update;

	var last = 0;

	app.controls.update = function(delta) {
		var res;
		res = process();
		if(res) {
			var mat = new THREE.Matrix4().getInverse(obj.matrix);
			this.object.position.set(0,0,0);
			this.object.rotation.set(0,0,0);
			this.object.updateMatrix();
		    this.object.applyMatrix(mat);
		} else {
			res = originalUpdate.apply(this,arguments);
		}
		return res;
	}

	function process() {
	// Change render function to insert detect
		if(debug) {
			ctx.drawImage(video,marginLeft,marginTop, scaledWidth,scaledHeight);
		}

		ctx2.drawImage(video,0,0, vw,vh);
		var imageData = ctx2.getImageData(0, 0, vw, vh);
		var markers = detector.detectAdaptive(imageData);

		if(markers.length > 0) {
			drawScene(markers);
	        trials = 20;
	        return 1;
		} else {
	        if(trials>0) {
	            trials--;
	            return 1;
	        } else {
				app.renderer.setClearColor( 0x303030, 0);
				app.renderer.clear();
				return 0;
	        }
		}

    }

	function drawScene(markers) {
		if(markers.length==0) return;

	    if(debug) {

// Convert corners positions to new coordinates

	    	var marker = markers[0];
	        corners = marker.corners;

	    if(debug) {
	        // Draw strokes
	    	ctx.lineWidth = 5;

	    	ctx.beginPath();
	    	ctx.strokeStyle = '#FF0000';
	        ctx.moveTo(nx(corners[0].x), ny(corners[0].y));
	        ctx.lineTo(nx(corners[1].x), ny(corners[1].y));
	        ctx.stroke();

	        ctx.beginPath();
	        ctx.strokeStyle = '#FFFF00';
	        ctx.moveTo(nx(corners[1].x), ny(corners[1].y));
	    	ctx.lineTo(nx(corners[2].x), ny(corners[2].y));
	        ctx.stroke();

	        ctx.beginPath();
	        ctx.strokeStyle = '#00FF00';
	    	ctx.moveTo(nx(corners[2].x), ny(corners[2].y));
	        ctx.lineTo(nx(corners[3].x), ny(corners[3].y));
	        ctx.stroke();

	        ctx.beginPath();
	        ctx.strokeStyle = '#0000FF';
	        ctx.moveTo(nx(corners[3].x), ny(corners[3].y));
	        ctx.lineTo(nx(corners[0].x), ny(corners[0].y));
	        ctx.stroke();
	    }
	}

	    for (i = 0; i < corners.length; ++ i){
	      corner = corners[i];
	      
	      corner.x = (corner.x - (vw / 2))*scale;
	      corner.y = ((vh / 2) - corner.y)*scale;

	      // corner.x = nx(corner.x) - (scaledWidth / 2);
	      // corner.y = (scaledHeight / 2) - ny(corner.y);


	    }

	    var pose = posit.smoothPose(corners);
	    var bt = pose.bestTranslation;
	    var br = pose.bestRotation;


	    // Convert positions to new coordinates

	    // Calculate virtual object
		obj.position.x =  bt[0];
	    obj.position.y =  bt[1];
	    obj.position.z = -bt[2];
	    obj.rotation.x = -Math.asin(-br[1][2]);
	    obj.rotation.y = -Math.atan2(br[0][2], br[2][2]);
	    obj.rotation.z = Math.atan2(br[1][0], br[1][1]);
	    obj.scale.x = 1;
	    obj.scale.y = 1;
	    obj.scale.z = 1;
	    obj.updateMatrix();


	}
}
}

//		if (video.videoWidth > video.videoHeight) {
		// if(w > h) {
		// 	var scaleH = h/w;
		// 	var scaleW = 
		// 	var scaledHeight = h;
		// 	var scaledWidth = w*scale;
		// 	var marginTop = ( h - scaledHeight)/2;

		// 	ctx.drawImage(video,0,marginTop, scaledWidth, scaledHeight);
		// } else {
		// 	ctx.clearRect(0, 0, w, h);
		// 	var scale = h / w;
		// 	var scaledHeight = w*scale;
		// 	var scaledWidth = h*scale;
		// 	var marginLeft = ( w - scaledWidth)/2;
		// 	ctx.drawImage(video, marginLeft, 0, scaledWidth, scaledHeight); // draw video			
		// }
