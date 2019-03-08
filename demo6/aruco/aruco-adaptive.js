/*
  Modification to original ArUco.js library
  (c) Andrey Gershun, 2019

*/

AR.Detector.prototype.detectAdaptive = function(image){
  if(!this.priority) {
      this.priority = [[6,15],[2,5],[2,11],[2,7],[6,7],[3,4],[4,7]];
  }

  CV.grayscale(image, this.grey);

  var markers = [];
  
  // Calibration
  for(var i=0;i<this.priority.length;i++) {
    CV.adaptiveThreshold(this.grey, this.thres, this.priority[i][0], this.priority[i][1]);

    this.contours = CV.findContours(this.thres, this.binary);
    this.candidates = this.findCandidates(this.contours, image.width * 0.20, 0.05, 10);
    this.candidates = this.clockwiseCorners(this.candidates);
    this.candidates = this.notTooNear(this.candidates, 10);
    markers = this.findMarkers(this.grey, this.candidates, 49);

    if(markers.length > 0 ) {
      var bestParams = this.priority.splice(i,1);
      this.priority.unshift(bestParams[0]);
      break;          
    }
  }

  return markers;
};

// Smoothing pose

POS.Posit.prototype.smoothPose = function(imagePoints) {
  var ret = this.pose(imagePoints);
  if(!this.o) this.o = [];
  var o = this.o;
  o.unshift({
      t:ret.bestTranslation,
      r:ret.bestRotation
  });
  
  o.length = 4;

  if(o[1] && o[2] && o[3]) {
      for(var i=0;i<3;i++) {
          o[0].t[i] = (o[0].t[i] + o[1].t[i] + o[2].t[i] + o[3].t[i]) / 4;
          for(var j=0;j<3;j++) {
              o[0].r[i][j] = (o[0].r[i][j] + o[1].r[i][j] + o[2].r[i][j] + o[3].r[i][j]) / 4;
          }
      }
  }

  return { bestTranslation:o[0].t, bestRotation:o[0].r };
}
