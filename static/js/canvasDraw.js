//CANVAS SETUP
var canvas = document.getElementById("cvs")
var BGcanvas = document.getElementById("BGcvs")
var canvasContainer = canvas.parentNode;
var boundingRect = canvasContainer.getBoundingClientRect();

canvas.onselectstart = function () { return false; } // makes the canvas itself unselectable
BGcanvas.onselectstart = function () { return false; }

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
var toolPts = new Array(0);
var initX = 0; // just a smaller name for toolPts[0][0] and toolPts [0][1]
var initY = 0;
var initE;
var drawing = false // a boolean that determines if things are currently being drawn


//HELPER FUNCTIONS
function clearSelection() { //clears the selection of any text. Having text
                            //selected gets in the way of drawing interactivity
    if (window.getSelection) window.getSelection().removeAllRanges();
    else if (document.selection) document.selection.empty();
}

function clearCanvas() {ctx.clearRect(0, 0, canvas.width, canvas.height);}
function distE(e1, e2) {return Math.sqrt(Math.pow(e1.offsetX-e2.offsetX,2) + Math.pow(e1.offsetY-e2.offsetY,2));}
function dist(x1, y1, x2, y2) { return Math.sqrt(Math.pow(x2-x1, 2) + Math.pow(y2-y1, 2))}

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

//MOUSE LISTENERS
$("#cvs").mousedown(startDrawing);
$("#cvs").mousemove(updateDrawing);
$("#cvs").mouseleave(cancelDrawing);
$("#cvs" ).mouseup(finishDrawing);

//KEYBOARD LISTENERS
$(document).keydown(function(e){ 
   //console.log(e.which);
   if (e.keyCode == 27){ cancelDrawing();} // 27 = escape key
   if (e.keyCode == 90 && e.ctrlKey){ cancelDrawing();} // 90 = z key //CHANGE FUNCTION TO undo() LATER
});


//PRIMARY FUNCTIONS
function startDrawing(mouseEvt){
   clearSelection(); //deselects any selected text (Makes it feel more responsive)
   clearCanvas(); 
   drawing = true; //bool to start drawing
   initE = mouseEvt;
   initX = mouseEvt.offsetX;
   initY = mouseEvt.offsetY;
   ctx.moveTo(initX, initY); 
   ctx.beginPath();
   toolPts.push([initX, initY]); //put this point as the initial point in the array
}

function updateDrawing(mouseEvt) {
   if (drawing){
      switch(currentTool){
         case "freehand": 
            toolPts.push([mouseEvt.offsetX, mouseEvt.offsetY]);
            ctx.lineTo(mouseEvt.offsetX, mouseEvt.offsetY);
            break;
         case "circle": clearCanvas(); ctx.beginPath(); ctx.arc(initX, initY, distE(initE, mouseEvt), 0, 2*Math.PI); break;
         case "rect": clearCanvas(); break;
         case "line": clearCanvas(); break;
         default: break;
      }
      ctx.stroke();
      //console.log(mouseEvt.offsetX, mouseEvt.offsetY)
   }
}

function cancelDrawing(mouseEvt) {
   while(toolPts.length > 0) {toolPts.pop();}
   drawing = false;
   ctx.closePath();
   clearCanvas();
}

function finishDrawing(mouseEvt) { 
   if (drawing){ 
      toolPts.push([mouseEvt.offsetX, mouseEvt.offsetY]);
      redraw(currentTool, toolPts);
   }
   ctx.closePath();
   clearCanvas();
   while(toolPts.length > 0) {toolPts.pop();}
   drawing = false;
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
            BGctx.moveTo(pts[0][0], pts[0][1]);
            for (p in pts){
               //console.log("drawing:", pts[p][0], pts[p][1]); //WORK ON CHANGING THIS NOTATION BY MAKING A POINT CLASS
               BGctx.lineTo(pts[p][0], pts[p][1]);
            }
            BGctx.stroke();
            BGctx.closePath();
            break;
         case "circle":
            BGctx.beginPath(); 
            BGctx.arc(pts[0][0], pts[0][1], 
                      dist(pts[0][0], pts[0][1], pts[1][0], pts[1][1]),
                      0, 2*Math.PI); 
            BGctx.stroke();
            break;
         case "rect": break;
         case "line": break;
         default: break;
      }
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
      object.attr('src', "/CanvasShare/static/images/btn" + toolStr + overState + ".png");
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