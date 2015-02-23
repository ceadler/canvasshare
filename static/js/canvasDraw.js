//CANVAS SETUP
var canvas = document.getElementById("cvs")
var BGcanvas = document.getElementById("BGcvs")
var canvasContainer = canvas.parentNode;
var boundingRect = canvasContainer.getBoundingClientRect();

canvas.onselectstart = function () { return false; } // makes the canvas itself unselectable
BGcanvas.onselectstart = function () { return false; }
document.onselectstart = function () { if(isDrawing){return false;} }

canvas.position = BGcanvas.position = "absolute";
canvas.style.left = BGcanvas.style.left = boundingRect.left;
canvas.style.top = BGcanvas.style.top = boundingRect.top;

canvas.width = $("#cvs").parent().width();
canvas.height = canvas.width * (9/16)
BGcanvas.width = canvas.width;
BGcanvas.height = canvas.height;

//CONTEXT SETUP
var ctx = canvas.getContext('2d')
var BGctx = BGcanvas.getContext('2d')
ctx.strokeStyle = "black";
BGctx.strokeStyle = "red";
BGctx.fillStyle = "#fff";
BGctx.fillRect(0, 0, BGcanvas.width, BGcanvas.height);

//DATA OBJECTS
var canvasObjects = new Array(0);
var tools = new Array("freehand", "circle", "rect", "line", "text", "elipse");
var currentTool = tools[1];
var dataPts = new Array(0);
var initPt = new Point();
var initEvt;
var cvsLeft =  $('#cvs').offset().left //updated every time we start drawing
var cvsTop =  $('#cvs').offset().top
console.log(cvsLeft, cvsTop);
var isDrawing = false // a boolean that determines if things are currently being drawn

//CLASSES
function Point(x, y){
	this.x = x || 0;
	this.y = y || 0;
};

function drawing(tool, points, strokeColor, fillColor, strokeSize){
this.tool = tool; 
this.points = points;
this.stokeColor = strokeColor;
this.fillColor = fillColor;
this.stokeSize = strokeSize;
};




//HELPER FUNCTIONS
function clearSelection() { //clears the selection of any text. Having text
                            //selected gets in the way of drawing interactivity
    if (window.getSelection) window.getSelection().removeAllRanges();
    else if (document.selection) document.selection.empty();
}

function clearCanvas() {ctx.clearRect(0, 0, canvas.width, canvas.height);}
//function distE(e1, e2) {return Math.sqrt(Math.pow(e1.pageX-e2.pageX,2) + Math.pow(e1.pageY-e2.pageY,2));}
//function dist(x1, y1, x2, y2) { return Math.sqrt(Math.pow(x2-x1, 2) + Math.pow(y2-y1, 2))}
function distPt(p1, p2) { return Math.sqrt(Math.pow(p1.x-p2.x, 2) + Math.pow(p1.y-p2.y, 2))}

function addToolBtn(toolNum){ // adds a tool to the toolbar (Mostly dynamically generated) 
                              // Still need to work on getting images from a spritesheet
   var toolStr = toolNum.toString();
   var elementName = "toolBtn"+toolStr; //the ID of our new image
   
   var toolBtnImg = document.createElement('img'); //creates a new image
   toolBtnImg.setAttribute('id', elementName); // sets the name
   toolBtnImg.setAttribute('style', 'margin-right:3px');
   $('#canvas_toolbar').append(toolBtnImg); //adds the image to the toolbar div
   
   var jQueryElem = $("#"+elementName); //gets the element as a jQuery element
                                        //so we can use jQUery functions on it
   changeImage(jQueryElem, toolNum, false)(); //sets default image
   
   jQueryElem.click(changeTool(toolNum)); //adds listeners for these events
   jQueryElem.mouseenter(changeImage(jQueryElem, toolNum, true));
   jQueryElem.mouseleave(changeImage(jQueryElem, toolNum, false));
}

//INIT
for (t in tools){
   addToolBtn((t-1)+2);
}
var myFirstPoint = new Point();
console.log(myFirstPoint.x, myFirstPoint.y, "These are the coords to my point.");

//MOUSE LISTENERS
$("#cvs").mousedown(startDrawing);
$(document).mousemove(updateDrawing);
//$("#cvs").mouseleave(cancelDrawing);
$(document).mouseup(finishDrawing);

//KEYBOARD LISTENERS
$(document).keydown(function(e){ 
   //console.log(e.which);
   if (e.keyCode == 27){ cancelDrawing();} // 27 = escape key
   if (e.keyCode == 74){ makeDatabaseEntry();} // 27 = escape key
   if (e.keyCode == 90 && e.ctrlKey){ cancelDrawing();} // 90 = z key //CHANGE FUNCTION TO undo() LATER
   console.log(e.keyCode);
});


//PRIMARY FUNCTIONS
function startDrawing(mouseEvt){
   clearSelection(); //deselects any selected text (Makes it feel more responsive)
   clearCanvas(); 
   isDrawing = true; //bool to start drawing
   initEvt = mouseEvt;
   cvsLeft =  $('#cvs').offset().left
   cvsTop =  $('#cvs').offset().top
   initPt.x = mouseEvt.pageX - cvsLeft;
   initPt.y = mouseEvt.pageY - cvsTop;
   ctx.moveTo(initPt.x, initPt.y); 
   ctx.beginPath();
   dataPts.push(initPt); //put this point as the initial point in the array
}

function updateDrawing(mouseEvt) {
   if (isDrawing){
      var here = new Point();
      here.x = mouseEvt.pageX - cvsLeft;
      here.y = mouseEvt.pageY - cvsTop;
      switch(currentTool){
         case "freehand":
            dataPts.push(here);
            ctx.lineTo(here.x, here.y);
            break;
         case "circle":
            clearCanvas();
            ctx.beginPath();
            ctx.arc(initPt.x, initPt.y, distPt(initPt, here), 0, 2*Math.PI);
            break;
         case "rect":
            clearCanvas();
            ctx.beginPath();
            ctx.rect(initPt.x, initPt.y, here.x - initPt.x, here.y - initPt.y);
            break;
         case "line":
            clearCanvas();
            ctx.beginPath();
            ctx.moveTo(initPt.x, initPt.y);
            ctx.lineTo(here.x, here.y);
            ctx.stroke();
            break;
         case "elipse":
            clearCanvas();
            ctx.beginPath();
            ctx.moveTo(initPt.x, initPt.y + (here.y - initPt.y) / 2);
            ctx.bezierCurveTo(initPt.x, initPt.y, here.x, initPt.y, here.x, initPt.y + (here.y - initPt.y) / 2);
            ctx.bezierCurveTo(here.x, here.y, initPt.x, here.y, initPt.x, initPt.y + (here.y - initPt.y) / 2);
            break;
         default: break;
      }
      ctx.stroke();
      //console.log(mouseEvt.pageX - cvsLeft, mouseEvt.pageY - cvsTop)
   }
}

function cancelDrawing(mouseEvt) {
   while(dataPts.length > 0) {dataPts.pop();}
   isDrawing = false;
   ctx.closePath();
   clearCanvas();
}

function finishDrawing(mouseEvt) {
   if (isDrawing){
      var here = new Point();
      here.x = mouseEvt.pageX - cvsLeft;
      here.y = mouseEvt.pageY - cvsTop;
      dataPts.push(here);
      var drawing = null;
      redraw(currentTool, dataPts);
   }
   ctx.closePath();
   clearCanvas();
   while(dataPts.length > 0) {dataPts.pop();}
   isDrawing = false;
}

//function redraw(drawing){//Later implementation
function redraw(tool, pts, strokeColor, fillColor, strokeSize){
   //Takes a list of parameters (--later, convert to a single object)
   //and redraws them on the background canvas to allow a staic image there
   //while the foreground canvas can be used for animations in drawing.
   
   if (pts.length >= 2){
      switch(tool){
         case "freehand":
            BGctx.beginPath();
            BGctx.moveTo(pts[0].x, pts[0].y);
            for (p in pts){
               //console.log("drawing:", pts[p][0], pts[p][1]); //WORK ON CHANGING THIS NOTATION BY MAKING A POINT CLASS
               BGctx.lineTo(pts[p].x, pts[p].y);
            }
            break;
         case "circle":
            BGctx.beginPath();
            BGctx.arc(pts[0].x, pts[0].y, distPt(pts[0], pts[1]), 0, 2*Math.PI);
            break;
         case "rect":
            BGctx.beginPath();
            BGctx.rect(pts[0].x, pts[0].y, pts[1].x -pts[0].x, pts[1].y -pts[0].y);
            break;
         case "line":
            BGctx.beginPath();
            BGctx.moveTo(pts[0].x, pts[0].y);
            BGctx.lineTo(pts[1].x, pts[1].y);
            break;
         case "elipse":
            clearCanvas();
            BGctx.beginPath();
            BGctx.moveTo(pts[0].x, pts[0].y + (pts[1].y - pts[0].y) / 2);
            BGctx.bezierCurveTo(pts[0].x, pts[0].y, pts[1].x, pts[0].y, pts[1].x, pts[0].y + (pts[1].y - pts[0].y) / 2);
            BGctx.bezierCurveTo(pts[1].x, pts[1].y, pts[0].x, pts[1].y, pts[0].x, pts[0].y + (pts[1].y - pts[0].y) / 2);
            break;
         default: break;
      }
      BGctx.stroke();
      BGctx.closePath();
   }
};

function redrawStack(){
   //clears the background canvas and redraws every element on the drawing stack
   ;
}

//function makeDatabaseEntry(tool, pts, strokeColor, fillColor, strokeSize){;//COMPLETE ME LATER
function makeDatabaseEntry(drawings){;//COMPLETE ME LATER
   //drawings should be a list of drawing objects
   //most commonly used via ajax
   //a snapshot will use this, but will create a new 'revision' whereas
   //a normal call to this will update the most recent version
   //probably convert to JSON
   //local to canvas room
   var varh = "hello!";
   //ajax('/CanvasShare/room/testAjax', ['varh'], 'chatbox')
   $.ajax({
     type: 'POST',
     url: '/'+app_name+'/room/testAjax',
     data: { author: 'blank',
             //add more information here
             objectStack: 'implement later'}
   }).done(function( msg ) {
    alert( "Data Saved: " + msg );
  });
   }
function loadDrawings(args){ //COMLETE ME LATER
   //loads old drawings from the database somehow, or refreshes a list of them
;}

function drawgrid(){//use some global information about the BGctx canvas
   //to draw a grid (squares)
;}

function changeImage(object, toolNum, isOver){
   return (function(mouseEvent){
      overState = (isOver? "over" : "out");
      toolStr = toolNum.toString();
      object.attr('src', '/'+app_name+'/static/images/btn' + toolStr + overState + '.png');
      //console.log("Changing image:", object, overState, toolStr);
   });
}

function changeTool(toolNum){
   return (function(mouseEvent){
      currentTool = tools[toolNum-1];
   });
}

function paramaterizedDrawing(xFunc, yFunc, tStart, tEnd, tStep){
   for(var t = tStart; t < tEnd; t += tStep){
      //lineTo(xFunc(t), yFunc(t));
   };
}

// Points Class Prototype Code
// Here's the points class, not sure where you would like us to implement this
// or which methods will be needed other than the distance functions.

/*

function Point(x, y){
	this.x = x || 0;
	this.y = y || 0;
};


Point.prototype.x = null;
Point.prototype.y = null;
Point.prototype.add = function(v){
	return new Point(this.x + v.x, this.y + v.y);
};
Point.prototype.clone = function(){
	return new Point(this.x, this.y);
};
Point.prototype.degreesTo = function(v){
	var dx = this.x - v.x;
	var dy = this.y - v.y;
	var angle = Math.atan2(dy, dx); // radians
	return angle * (180 / Math.PI); // degrees
};
Point.prototype.distance = function(v){
	var x = this.x - v.x;
	var y = this.y - v.y;
	return Math.sqrt(x * x + y * y);
};
Point.prototype.equals = function(toCompare){
	return this.x == toCompare.x && this.y == toCompare.y;
};
Point.prototype.interpolate = function(v, f){
	return new Point((this.x + v.x) * f, (this.y + v.y) * f);
};
Point.prototype.length = function(){
	return Math.sqrt(this.x * this.x + this.y * this.y);
};
Point.prototype.normalize = function(thickness){
	var l = this.length();
	this.x = this.x / l * thickness;
	this.y = this.y / l * thickness;
};
Point.prototype.orbit = function(origin, arcWidth, arcHeight, degrees){
	var radians = degrees * (Math.PI / 180);
	this.x = origin.x + arcWidth * Math.cos(radians);
	this.y = origin.y + arcHeight * Math.sin(radians);
};
Point.prototype.offset = function(dx, dy){
	this.x += dx;
	this.y += dy;
};
Point.prototype.subtract = function(v){
	return new Point(this.x - v.x, this.y - v.y);
};
Point.prototype.toString = function(){
	return "(x=" + this.x + ", y=" + this.y + ")";
};

Point.interpolate = function(pt1, pt2, f){
	return new Point((pt1.x + pt2.x) * f, (pt1.y + pt2.y) * f);
};
Point.polar = function(len, angle){
	return new Point(len * Math.cos(angle), len * Math.sin(angle));
};
Point.distance = function(pt1, pt2){
	var x = pt1.x - pt2.x;
	var y = pt1.y - pt2.y;
	return Math.sqrt(x * x + y * y);
};


// Extras

P.prototype.Add = function (p) {this.x += p.x;this.y += p.y;};
P.prototype.Sub = function (p) {this.x -= p.x;this.y -= p.y;};
P.prototype.Dev = function (p) {this.x /= p.x;this.y /= p.y;};
P.prototype.Mul = function (p) {this.x *= p.x;this.y *= p.y;};
P.prototype.Match = function (p) {return this.x == p.x || this.y == p.y;};
P.prototype.Greater = function (p) {return this.x > p.x && this.y > p.y;};
P.prototype.Above = function (p) {return this.x > p.x || this.y > p.y;};
P.prototype.Less = function (p) {return this.x < p.x || this.y < p.y;};
P.prototype.Beneath = function (p) {return this.x < p.x && this.y < p.y;};
P.prototype.Set = function (p) {this.x = p.x;this.y = p.y;};
*/

//OTHER IDEAS / TO DO
// - !points as a class
//     -redefine dist() function 
// - !drawing objects as a class
//     -redefine functions in terms of objects instead of parameters
// - !basic database interaction
// - !absolute coordinates
// - !work on making tools work (rects, lines, text, elipses)
// - !Find out how to push updates to the user

// - Make a list of images of tools as HTML elements 
//   and when you click on one, it switches to that tool
//   (and alters image to reflect choice?)
// - work on loading button images from sprite sheets instead of individually by button
// - Work on the chat box (different JS file though)
// - work on snapshots
// - personalized rooms
// - draw a grid
// - null for lack of color
// - add transformations (translations, zoom in, zoom out)
// - add snap-to-grid function, 
// - ability to press shift to make elipses and rects into circles and squares
// - ability to change whether rects and elipses come from corner or from center
//    -(alt + click?)
// - allow users to upload their custom background images
// - ctrl+z to undo last change
// - esc to cancel drawing
// - customizable cursor
// - guidelines for cursor

// - some kind of nice border for the canvas element

//GENERAL
// - get everyone on the github

//GIT COMMANDS
// git init
// git remote add <url>
// git add .
// git commit -m "message"
// git push something something
// git branch? something like that
