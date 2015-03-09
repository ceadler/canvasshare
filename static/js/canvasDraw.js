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
ctx.strokeStyle = "#000";
BGctx.strokeStyle = "#f00";
BGctx.fillStyle = "#fff";
BGctx.fillRect(0, 0, BGcanvas.width, BGcanvas.height);






//DATA OBJECTS
var newDrawings = new Array(0);
var drawingStack = new Array(0);
var tools = new Array("freehand", "circle", "rect", "line", "text", "ellipse");
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

function Drawing(tool, points, strokeColor, fillColor, strokeSize, words, textSize){
   //console.log("Making new drawing.", tool, points);
   this.tool = tool || 'none'; 
   this.pts = points || [];
   this.sCol = strokeColor || '#000';
   this.fCol = fillColor || null;
   this.sSiz = strokeSize || 1;
   this.text = words;
   this.tSize = textSize;
};






//HELPER FUNCTIONS
function clearSelection() { //clears the selection of any text. Having text
   //selected gets in the way of drawing interactivity
   if (window.getSelection) window.getSelection().removeAllRanges();
   else if (document.selection) document.selection.empty();
}

function clearCanvas(context) {context.clearRect(0, 0, canvas.width, canvas.height);}
function fillBackground(context, color) {
   context.fillStyle = color || '#fff';
   context.fillRect(0, 0, canvas.width, canvas.height);
}
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
var textBox = document.createElement('input');
textBox.setAttribute('id', "textToolBox");
textBox.setAttribute('style', 'margin-right:3px');
$('#canvas_toolbar').append(textBox)
setInterval(function(){loadDrawings(function(m){clearAndReloadDS(m);
            redrawStack()})}, 2000)
   
   
   
   
   
   
   

//MOUSE LISTENERS
$("#cvs").mousedown(startDrawing);
$(document).mousemove(updateDrawing);
//$("#cvs").mouseleave(cancelDrawing);
$(document).mouseup(finishDrawing);

//KEYBOARD LISTENERS
$(document).keydown(function(e){ 
   //console.log(e.which);
   if (e.keyCode == 27){ cancelDrawing();}              // 27 = escape key
   //if (e.keyCode == 82){ redrawStack();}                // 82 = R
   //if (e.keyCode == 76){ loadDrawings();}                // 76 = L
   //if (e.keyCode == 80){ console.log(drawingStack);}    // 80 = P
   //if (e.keyCode == 67){ clearCanvas(BGctx);            // 67 = C
   //                      fillBackground(BGctx, "#fff");}
   //if (e.keyCode == 74){ makeDatabaseEntry();}          // 74 = J
   if (e.keyCode == 90 && e.ctrlKey){ cancelDrawing();} // 90 = z key //CHANGE FUNCTION TO undo() LATER
   console.log(e.keyCode);
});


//PRIMARY FUNCTIONS
function startDrawing(mouseEvt){
   loadDrawings(function(m){clearAndReloadDS(m);
                            redrawStack();
                           });
   clearSelection(); //deselects any selected text (Makes it feel more responsive)
   clearCanvas(ctx);
   isDrawing = true; //bool to start drawing
   initEvt = mouseEvt;
   cvsLeft =  $('#cvs').offset().left
   cvsTop =  $('#cvs').offset().top
   var here = new Point();
   here.x = mouseEvt.pageX - cvsLeft;
   here.y = mouseEvt.pageY - cvsTop;
   initPt = here;
   ctx.moveTo(here.x, here.y); 
   ctx.beginPath();
   dataPts.push(here); //put this point as the initial point in the array
}

function updateDrawing(mouseEvt) {
   if (isDrawing || currentTool=='text'){
      var here = new Point();
      here.x = mouseEvt.pageX - cvsLeft;
      here.y = mouseEvt.pageY - cvsTop;
      ctx.setLineDash([1, 1]);
      switch(currentTool){
         case "freehand":
            dataPts.push(here);
            ctx.lineTo(here.x, here.y);
            break;
         case "circle":
            clearCanvas(ctx);
            ctx.beginPath();
            ctx.arc(initPt.x, initPt.y, distPt(initPt, here), 0, 2*Math.PI);
            break;
         case "rect":
            clearCanvas(ctx);
            ctx.beginPath();
            ctx.rect(initPt.x, initPt.y, here.x - initPt.x, here.y - initPt.y);
            break;
         case "line":
            clearCanvas(ctx);
            ctx.beginPath();
            ctx.moveTo(initPt.x, initPt.y);
            ctx.lineTo(here.x, here.y);
            ctx.stroke();
            break;
         case "text":
            clearCanvas(ctx);
            ctx.font = "36px serif";
            ctx.fillText($("#textToolBox").val(), here.x, here.y);
            break;
         case "ellipse":
            clearCanvas(ctx);
            drawEllipseFirst(initPt.x, initPt.y, here.x, here.y);
            ctx.strokeRect(initPt.x, initPt.y, here.x-initPt.x, here.y-initPt.y);
            ctx.closePath();
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
   clearCanvas(ctx);
}

function finishDrawing(mouseEvt) {
   if (isDrawing){
      var here = new Point();
      here.x = mouseEvt.pageX - cvsLeft;
      here.y = mouseEvt.pageY - cvsTop;
      dataPts.push(here);
      if(currentTool == 'text'){
         var thisDrawing = new Drawing(currentTool, $.extend(true, new Array(0), dataPts), null, null, null, $("#textToolBox").val(), 36);
      }
      else{
         var thisDrawing = new Drawing(currentTool, $.extend(true, new Array(0), dataPts)/*, thisStrkColor, thisFillColor, strokeThickness*/);
      }
      loadDrawings(function(m){clearAndReloadDS(m);
                               drawingStack.push(thisDrawing);
                               redrawStack();
                               makeDatabaseEntry(drawingStack);
                               });
   }
   ctx.closePath();
   clearCanvas(ctx);
   while(dataPts.length > 0) {dataPts.pop();}
   isDrawing = false;
}

function redraw(drawing){//Later implementation
   //function redraw(tool, pts, strokeColor, fillColor, strokeSize){
   //Takes a list of parameters (--later, convert to a single object)
   //and redraws them on the background canvas to allow a staic image there
   //while the foreground canvas can be used for animations in drawing.
   var pts = drawing.pts;
   var tool = drawing.tool;
   //console.log("in redraw!", tool, pts);

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
         case "text":
            BGctx.fillStyle = "#f00";
            clearCanvas(ctx);
            BGctx.beginPath()
            BGctx.font = "36px serif";
            BGctx.fillText(drawing.text, pts[1].x, pts[1].y);
            BGctx.fillStyle = "#fff";
            break;
         case "ellipse":
            clearCanvas(ctx);
            drawEllipseFinal(pts[0].x, pts[0].y, pts[1].x, pts[1].y);
            BGctx.closePath();
            break;
         default: break;
      }
      BGctx.stroke();
   }
};

function redrawStack(){
   //console.log("Starting!")
   //clears the background canvas and redraws every element on the drawing stack
   clearCanvas(BGctx);
   fillBackground(BGctx, '#fff');
   for (d in drawingStack){
      //console.log("Drawing!", (parseInt(d)+1) +'/'+drawingStack.length);
      redraw(drawingStack[d])
   };
   //console.log("STOPPING!!!!")
}

//function makeDatabaseEntry(tool, pts, strokeColor, fillColor, strokeSize){;//COMPLETE ME LATER
function makeDatabaseEntry(drawings){
   //drawings should be a list of drawing objects
   //most commonly used via ajax
   //a snapshot will use this, but will create a new 'revision' whereas
   //a normal call to this will update the most recent version
   //probably convert to JSON
   //local to canvas room
   var varh = "hello!";
   //ajax('/CanvasShare/room/testAjax', ['varh'], 'chatbox')
   $.ajax(
   {
      type: 'POST',
      url: '/'+app_name+'/room/saveRecent',
      data: 
      { 
         author: 'Carl Eadler',
         room: roomID,
         objectStack: JSON.stringify(drawings)
      }
   }).done(function( msg ) {/*alert( "Data Saved: " + msg );*/});
}

function clearAndReloadDS(jsonData){
   //console.log("Before!", jsonData)
   if (jsonData != ''){
      obj = JSON.parse(jsonData);
      //console.log("after!")
      drawingStack.splice(0,drawingStack.length);
      drawingStack= obj;
   }
}


function loadDrawings(callbackFunc){
   //loads old drawings from the database somehow, or refreshes a list of them
   $.ajax(
   {
      type: 'GET',
      url: '/'+app_name+'/room/getRecent/'+roomID,
   }).done(callbackFunc);
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

// Ellipse Tool Helper Function for ctx
function drawEllipseFirst(x1, y1, x2, y2) {
    var radiusX = (x2 - x1) * 0.5,
        radiusY = (y2 - y1) * 0.5,
        centerX = x1 + radiusX,
        centerY = y1 + radiusY,
        step = 0.01,
        a = step,
        pi2 = Math.PI * 2 - step;

    ctx.beginPath();
    ctx.moveTo(centerX + radiusX * Math.cos(0),
               centerY + radiusY * Math.sin(0));

    for(; a < pi2; a += step) {
        ctx.lineTo(centerX + radiusX * Math.cos(a),
                   centerY + radiusY * Math.sin(a));
    }
}

// Ellipse Helper Function for BGctx
function drawEllipseFinal(x1, y1, x2, y2) {
    var radiusX = (x2 - x1) * 0.5,
        radiusY = (y2 - y1) * 0.5,
        centerX = x1 + radiusX,
        centerY = y1 + radiusY,
        step = 0.01,
        a = step,
        pi2 = Math.PI * 2 - step;

    BGctx.beginPath();
    BGctx.moveTo(centerX + radiusX * Math.cos(0),
               centerY + radiusY * Math.sin(0));

    for(; a < pi2; a += step) {
        BGctx.lineTo(centerX + radiusX * Math.cos(a),
                   centerY + radiusY * Math.sin(a));
    }
}

// Points Class Prototype Code
// Here's the points class, not sure where you would like us to implement this
// or which methods will be needed other than the distance functions.

/*
   
   function Point(x, y){
   this.x = x || 0;
   this.y = y || 0;
   };
   function ptCopy(point)
   {
   var newPoint = new Point();
   newPoint.x = point.x;
   newPoint.y = point.y;
   return newPoint;
   }
   
   
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
