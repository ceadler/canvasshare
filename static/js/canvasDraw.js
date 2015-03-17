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
canvas.height = canvas.width * (10/16)
BGcanvas.width = canvas.width;
BGcanvas.height = canvas.height;

$("#elemList").attr('style', 'width:98px; border:1px solid gray; overflow-y:scroll; \
                              height:'+(canvas.height-2)+'px; margin-left:0px;background-color:#1A1A1A');

$("#chatCont").attr('style', 'border:1px solid gray;\
                              height:'+(canvas.height-1)+'px;\
                              background-color:#1A1A1A; position:relative; color:white;');
$("#chatBody").attr('style', 'background-color:#1A1A1A;overflow-y:scroll;');
$("#chatBody").height(canvas.height-($("#chatTitle").height()+$("#chatInputCont").height())-4);
$(document).ready(function(){
    $("#chatBody").animate({
        scrollTop: $("#chatBody")[0].scrollHeight*$("#chatBody")[0].scrollHeight}, 2000);
});
$("#chatSend").attr('style', 'float:right;');
$("#chatSend").attr('class', 'btn btn-success');
                              
$("#clear_btn").click(function(e){clearEverything();})





//CONTEXT SETUP
var ctx = canvas.getContext('2d')
var BGctx = BGcanvas.getContext('2d')
ctx.strokeStyle = "#000";
ctx.lineWidth = 1
BGctx.strokeStyle = "#f00";
BGctx.fillStyle = "#fff";
BGctx.fillRect(0, 0, BGcanvas.width, BGcanvas.height);
ctx.lineJoin='round';
BGctx.lineJoin='round';
ctx.lineCap='round';
BGctx.lineCap='round';
ctx.miterLimit=1;
BGctx.miterLimit=1;






//DATA OBJECTS
var newDrawings = new Array(0);
var drawingStack = new Array(0);
var tools = new Array("freehand", "circle", "rect", "line", "ellipse", "text");
var currentTool = tools[1];
var dataPts = new Array(0);
var initPt = new Point();
var initEvt;
var cvsLeft =  $('#cvs').offset().left //updated every time we start drawing
var cvsTop =  $('#cvs').offset().top
console.log(cvsLeft, cvsTop);
var isDrawing = false // a boolean that determines if things are currently being drawn
var fontFace = "Lobster"
var fontSize = 36
var fillColor = 'ffffff'
var strokeColor = '000000'
var strokeSize = 1
var fillEnabled = false
var strokeEnabled = true




//CLASSES
function Point(x, y){
	this.x = x || 0;
	this.y = y || 0;
};

function Drawing(tool, points, 
                 strokingColor, strokingSize, strokingEnabled,
                 fillingColor, fillingEnabled, 
                 words, font){
   //console.log("Making new drawing.", tool, points);
   this.tool = tool || 'none'; 
   this.pts = points || [];
   this.sCol = strokingColor || '000000';
   this.fCol = fillingColor || '000000';
   this.sSiz = strokingSize || 1;
   this.text = words || '';
   this.font = font || '';
   this.fE = fillingEnabled || false;
   this.sE = strokingEnabled || true;
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
   toolBtnImg.setAttribute('style', 'margin-right:3px; float:left; position:relative;\
                                     top:1px');
   $('#canvas_toolbar').append(toolBtnImg); //adds the image to the toolbar div
   
   var jQueryElem = $("#"+elementName); //gets the element as a jQuery element
   //so we can use jQUery functions on it
   console.log(jQueryElem);
   changeToolImage(jQueryElem, toolNum, false)(); //sets default image
   jQueryElem.click(changeTool(toolNum)); //adds listeners for these events
   jQueryElem.mouseenter(changeToolImage(jQueryElem, toolNum, true));
   jQueryElem.mouseleave(changeToolImage(jQueryElem, toolNum, false));
}

function makeColorBox(elementName, colorCallback, checkCallback, defaultColor, defaultCheck, text, textSize){
   var cBox = document.createElement('div')
   cBox.setAttribute('id', elementName)
   cBox.setAttribute('style', 'display:table; background-color:#'+defaultColor+'; \
                               height:20px; width:28px; float:left; margin:1px; \
                               border:1px solid white; text-align:left; \
                               vertical-align:middle; overflow:hidden;\
                               margin-right:3px')
   
   var check= document.createElement('input')
   check.setAttribute('type', 'checkbox')
   check.setAttribute('id', elementName+'_cb')
   check.setAttribute('style', 'margin:auto; vertical-align:top; position:absolute')
   check.checked = defaultCheck;
   $(check).change(function(e){checkCallback(check)})
   cBox.appendChild(check);
   
   var letter = document.createElement('div')
   letter.setAttribute('style','cursor:default; font-size:'+textSize+'px; position:relative; \
                                top:7px; margin-left:-1px; float:left');
   letter.innerHTML=text;
   
   var letterbg = document.createElement('div');
   letterbg.setAttribute('style', 'background-color:white; width:28px; height:8px; \
                                   position:relative; border-top:1px solid #aaaaaa; \
                                   bottom:-20px;float:left');
   cBox.appendChild(letterbg);
   cBox.appendChild(letter);
   
   $('#canvas_toolbar').append(cBox)
   $(cBox).colpick({
      onSubmit:function(hsb, hex, rgb, element){
         $(element).css('background-color', '#'+hex);
         $(element).colpickHide();
         colorCallback(hex);
      }
   })
}

function makeSizeBox(elementName, callback, defaultVal, text, textSize){
   var cont = document.createElement('div')
   cont.setAttribute('style', 'height:22px; width:30px; float:left; margin-left:1px;\
                               position:relative; top:1px;')
   
   var sb = document.createElement('input')
   sb.setAttribute('id', elementName)
   $(sb).val(defaultVal)
   $(sb).keyup(function(e){callback($(sb).val())})
   sb.setAttribute('style', 'height:18px; width:26px; position:absolute; \
                              margin:auto; border:1px solid #aaa; text-align:left;\
                              vertical-align:top; text-align:right')
   cont.appendChild(sb);
      
   var letter = document.createElement('div')
   letter.setAttribute('style','cursor:default; font-size:'+textSize+'px; position:relative; \
                                top:5px;float:left; margin-left:1px');
   letter.innerHTML=text;
   
   var letterbg = document.createElement('div');
   letterbg.setAttribute('style', 'background-color:#fff; width:26px; height:9px; \
                                   position:relative; top:20px; float:left;\
                                   border:1px solid #aaaaaa');
   cont.appendChild(letterbg);
   cont.appendChild(letter);
   $('#canvas_toolbar').append(cont)
}

function makeSelectBox(id, options, style, callback){
   var selStyle = "border-radius:unset; -webkit-border-radius:unset; height:24px; \
                   padding:unset; margin-bottom:unset; position:relative; top:5px; \
                   float:left; margin-left:4px;"
   var selBox = document.createElement('select');
   selBox.setAttribute('id', id);
   selBox.setAttribute('style', selStyle+style);
   for (o in options){$(selBox).append(options[o])}
   $('#canvas_toolbar').append(selBox)
   $(selBox).change(function(e){callback($(selBox).val(), selStyle)})
}

String.prototype.format = function() {
    var s = this,
        i = arguments.length;

    while (i--) {
        s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
    }
    return s;
};





//INIT
makeColorBox('fillColorBox', 
             function(hex){fillColor = hex;}, 
             function(elem){fillEnabled = elem.checked;},
             fillColor,
             fillEnabled,
             "Fill", 10)
makeColorBox('strokeColorBox', 
             function(hex){strokeColor = hex;}, 
             function(elem){strokeEnabled = elem.checked;},
             strokeColor,
             strokeEnabled,
             "Stroke", 9)
makeSizeBox('strokeSizeBox', 
             function(size){
                strokeSize = (Math.abs(parseInt(size)) || 1);
                ctx.lineWidth = strokeSize;
             }, 
             strokeSize,
             "width", 10)
for (t in tools){
   addToolBtn((t-1)+2);
}
makeSizeBox('fontSizeBox', 
             function(size){
                fontSize = (Math.abs(parseInt(size)) || 36);
                ctx.font = fontSize+'px '+fontFace;
             }, 
             fontSize,
             "Size", 9)
var textBox = document.createElement('input');
textBox.setAttribute('id', "textToolBox");
textBox.setAttribute('style', 'margin-left:2px; float:left; vertical-align:bottom;\
                               position:relative; top:5px');
textBox.setAttribute('placeholder', 'Insert text here');
$('#canvas_toolbar').append(textBox)

makeSelectBox('fontSelectBox', 
               fonts.map(function(font){
                  return ('<optgroup style="font-family:'+font+'"><option>'+font+'</option></optgorup>')
               }),
               "background-color:#ffffff",
               function(newFont, selStyle){
                  $("#fontSelectBox").attr('style', selStyle+'font-family:'+newFont)
                  fontFace = newFont;
                  console.log
               })
roomExists(function(exists){
   if (!exists){
      makeSnapshot(drawingStack);
   }
})
$("#chatSend").click(function(e){
    sendChat($("#chatInput").val());
    $("#chatInput").val("");
    $("#chatBody").animate({
        scrollTop: $("#chatBody")[0].scrollHeight*$("#chatBody")[0].scrollHeight}, 2000);
                                });
$("#chatInput").keydown(function(e){
   if(e.which == 13){
      sendChat($("#chatInput").val());
      $("#chatInput").val("");
      $("#chatBody").animate({
        scrollTop: $("#chatBody")[0].scrollHeight*$("#chatBody")[0].scrollHeight}, 2000);
   }
});
                  
setInterval(function(){
   loadDrawings(function(m){
      clearAndReloadDS(m);
      redrawStack();
   });
   getChat();
}, 1000)

   
   
   
   
   
   

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
   //if (e.keyCode == 74){ submitData();}          // 74 = J
   else if (e.keyCode == 90 && e.ctrlKey){ cancelDrawing();} // 90 = z key //CHANGE FUNCTION TO undo() LATER
   else{return true}
   //console.log(e.keyCode);
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
   dataPts.push(here);//put this point as the initial point in the array
   ctx.lineWidth = strokeSize;
   ctx.fillStyle = '#'+fillColor;
   ctx.strokeStyle = '#'+strokeColor
}

function updateDrawing(mouseEvt) {
   if (isDrawing || currentTool=='text'){
      var here = new Point();
      here.x = mouseEvt.pageX - cvsLeft;
      here.y = mouseEvt.pageY - cvsTop;
      //ctx.setLineDash([1, 1]);
      switch(currentTool){
         case "freehand":
            dataPts.push(here);
            ctx.lineTo(here.x, here.y);
            ctx.stroke();
            break;
         case "circle":
            clearCanvas(ctx);
            ctx.beginPath();
            ctx.arc(initPt.x, initPt.y, distPt(initPt, here), 0, 2*Math.PI);
            ctx.stroke();
            break;
         case "rect":
            clearCanvas(ctx);
            ctx.beginPath();
            ctx.rect(initPt.x, initPt.y, here.x - initPt.x, here.y - initPt.y);
            ctx.stroke();
            break;
         case "line":
            clearCanvas(ctx);
            ctx.beginPath();
            ctx.moveTo(initPt.x, initPt.y);
            ctx.lineTo(here.x, here.y);
            ctx.stroke();
            break;
         case "text":
            ctx.beginPath();
            clearCanvas(ctx);
            var textHeight = 36;
            ctx.font = textHeight + "px "+fontFace;
            var textStr = $("#textToolBox").val()
            ctx.fillText(textStr, here.x, here.y);
            ctx.strokeText(textStr, here.x, here.y);
            var textWidth = ctx.measureText(textStr).width;
            ctx.rect(here.x, here.y, textWidth, -textHeight);
            ctx.stroke();
            break;
         case "ellipse":
            clearCanvas(ctx);
            drawEllipseFirst(initPt.x, initPt.y, here.x, here.y);
            //ctx.strokeRect(initPt.x, initPt.y, here.x-initPt.x, here.y-initPt.y);
            ctx.closePath();
            ctx.stroke();
            break;
         default: break;
      }
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
      console.log(fillEnabled, strokeEnabled);
      dataPts.push(here);
      var thisDrawing = 
         new Drawing(currentTool, 
                     $.extend(true, new Array(0), dataPts), 
                     (strokeEnabled? strokeColor:''), 
                     (strokeEnabled? strokeSize :0), 
                     strokeEnabled,
                     (fillEnabled? fillColor:''),
                     fillEnabled,
                     ((currentTool == 'text')? 
                        $("#textToolBox").val() : ''),
                     ((currentTool == 'text')?
                        ctx.font:''))
      drawingStack.push(thisDrawing);
      redraw(BGctx, thisDrawing);
      submitData(thisDrawing);
      loadDrawings(function(m){clearAndReloadDS(m); redrawStack(); });
   }
   ctx.closePath();
   clearCanvas(ctx);
   while(dataPts.length > 0) {dataPts.pop();}
   isDrawing = false;
}

function redraw(context, drawing){//Later implementation
   //function redraw(tool, pts, strokeColor, fillColor, strokeSize){
   //Takes a list of parameters (--later, convert to a single object)
   //and redraws them on the background canvas to allow a staic image there
   //while the foreground canvas can be used for animations in drawing.
   var pts = drawing.pts;
   var tool = drawing.tool;
   //console.log("in redraw!", tool, pts);

   if (pts.length >= 2){
      context.fillStyle = '#'+drawing.fCol;
      context.strokeStyle = '#'+drawing.sCol;
      context.lineWidth = drawing.sSiz;
      //console.log("Making drawing: fill:{0}|{3}, stroke:{1}px {2}".format(context.fillStyle, BGctx.strokeStyle, BGctx.lineWidth, drawing.fE));
      switch(tool){
         case "freehand":
            context.beginPath();
            context.moveTo(pts[0].x, pts[0].y);
            for (p in pts){
               //console.log("drawing:", pts[p][0], pts[p][1]); //WORK ON CHANGING THIS NOTATION BY MAKING A POINT CLASS
               context.lineTo(pts[p].x, pts[p].y);
            }
            break;
         case "circle":
            context.beginPath();
            context.arc(pts[0].x, pts[0].y, distPt(pts[0], pts[1]), 0, 2*Math.PI);
            break;
         case "rect":
            context.beginPath();
            context.rect(pts[0].x, pts[0].y, pts[1].x -pts[0].x, pts[1].y -pts[0].y);
            break;
         case "line":
            context.beginPath();
            context.moveTo(pts[0].x, pts[0].y);
            context.lineTo(pts[1].x, pts[1].y);
            break;
         case "text":
            //clearCanvas(ctx);
            context.beginPath()
            context.font = drawing.font || '36px serif'
            if(drawing.fE){context.fillText(drawing.text, pts[1].x, pts[1].y);}
            if(drawing.sE){context.strokeText(drawing.text, pts[1].x, pts[1].y);}
            break;
         case "ellipse":
            //clearCanvas(ctx);
            drawEllipseFinal(pts[0].x, pts[0].y, pts[1].x, pts[1].y);
            context.closePath();
            break;
         default: break;
      }
      if(drawing.fE){context.closePath(); context.fill();}
      if(drawing.sE){context.stroke();}
   }
};

function prependToSidebar(drawing){
   var block = document.createElement('p');
   block.setAttribute('style', 'color:red');
   block.setAttribute('class', 'btn');
   var pos = drawingStack.map(function(e) { return (e === drawing); }).indexOf(true);
   $(block).click(function(e){drawingStack.splice(pos, 1);
                              deleteData(pos);
                              redrawStack();});
   $(block).mouseover(function(e){
                             var exaggerate = drawing;
                             exaggerate.sE = true;
                             exaggerate.sSiz += 5;
                             exaggerate.sCol = "ff0000"
                             redraw(ctx, exaggerate);
   })
   $(block).mouseout(function(e){clearCanvas(ctx)});
   block.innerHTML = drawing.tool
   $("#elemList").prepend(block);
}
   
function clearSidebar(){
   $("#elemList").empty();
}

function redrawStack(){
   //console.log("Starting!")
   //clears the background canvas and redraws every element on the drawing stack
   clearCanvas(BGctx);
   fillBackground(BGctx, '#fff');
   clearSidebar();
   for (d in drawingStack){
      //console.log("Drawing!", (parseInt(d)+1) +'/'+drawingStack.length);
      redraw(BGctx, drawingStack[d]);
      prependToSidebar(drawingStack[d]);
   };
   //console.log("STOPPING!!!!")
}

function clearEverything(){
   clearStack();
   redrawStack();
   clearCanvas(ctx);
   clearCanvas(BGctx);
   fillBackground(BGctx, '#ffffff')
   $.ajax(
   {
      type: 'POST',
      url: '/'+app_name+'/room/saveSnapshot',
      data: 
      { 
         author: 'Carl Eadler',
         room: roomID,
         objectStack: "[]"
      }
   }).done(function( msg ) {/*alert( "Data Saved: " + msg );*/});
}

function clearStack(){
   drawingStack.splice(0,drawingStack.length);
}

function deleteData(dIndex){
   console.log("del!");
   $.ajax(
   {
      type: 'POST',
      url: '/'+app_name+'/room/delete',
      data: 
      { 
         room: roomID,
         drawingIndex: dIndex
      }
   }).done(function( msg ) {console.log( "Delete: " + msg );});
}


   
function submitData(drawing){
   //console.log("Saving!", JSON.stringify(drawing));
   $.ajax(
   {
      type: 'POST',
      url: '/'+app_name+'/room/submitData',
      data: 
      { 
         room: roomID,
         objectStack: JSON.stringify(drawing)
      }
   }).done(function( msg ) {/*alert( "Data Saved: " + msg )*/;});
}


function makeSnapshot(drawings){
   console.log("Snapshot!");
   $.ajax(
   {
      type: 'POST',
      url: '/'+app_name+'/room/saveSnapshot',
      data: 
      { 
         room: roomID,
         objectStack: JSON.stringify(drawings)
      }
   }).done(function( msg ) {console.log( "Data Saved: " + msg );});
}

function roomExists(callback){
   $.ajax(
   {
      type: 'GET',
      url: '/'+app_name+'/room/exists/'+roomID,
   }).done(function( bool ) {callback((bool.toLowerCase()=="true"?true:false)); console.log( "Room exists?: " ,bool,  (bool=="true"?true:false) );});
}


function clearAndReloadDS(jsonData){
   //console.log("JSONData:", jsonData)
   if (jsonData != '' && jsonData != undefined){
      var obj = JSON.parse(jsonData);
      clearStack();
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

function changeToolImage(tool, toolNum, isOver){
   return (function(mouseEvent){
      if(currentTool != tools[toolNum-1]){
         //Don't change the image if it's the one we're using.
         overState = (isOver? "over" : "out");
         toolStr = toolNum.toString();
         tool.attr('src', '/'+app_name+'/static/images/btn' + toolStr + overState + '.png');
      }
      else{
         toolStr = toolNum.toString();
         tool.attr('src', '/'+app_name+'/static/images/btn' + toolStr + 'sel.png');
      }
   });
}

function changeTool(toolNum){
   changeToolImage($("#toolBtn"+toolNum.toString()), toolNum);
   return (function(mouseEvent){
      var thisToolID = (tools.indexOf(currentTool))+1;
      currentTool = tools[toolNum-1];
      changeToolImage($("#toolBtn"+thisToolID.toString()), thisToolID, false)();
      changeToolImage($("#toolBtn"+toolNum.toString()), toolNum)();
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

// Button to export the canvas as a PNG image
var link = document.createElement('a');
    link.className = 'btn btn-success';
    link.innerHTML = 'Export to PNG';
link.addEventListener('click', function(ev) {
    link.href = BGcanvas.toDataURL();
    link.download = "mypainting.png";
}, false);
$('#belowCanvas').attr('style', 'margin:0px;');
$('#belowCanvas').append(link);


function sendChat(msg){
   $.ajax(
   {
      type:"POST",
      url: '/'+app_name+'/room/sendMessage',
      data: 
      { 
         room: roomID,
         message: msg
      }
   }).done(function(msg){console.log(msg)})
}

function getChat(){
   $.ajax(
   {
      type:"GET",
      url: '/'+app_name+'/room/getMessages/'+roomID
   }).done(function(messages){$("#chatBody").html(messages);
                              console.log(messages)})
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



//GIT COMMANDS
// git init
// git remote add <url>
// git add .
// git commit -m "message"
// git push something something
// git branch? something like that


//DONE 
// - !points as a class
//     -redefine dist() function 
// - !drawing objects as a class
//     -redefine functions in terms of objects instead of parameters
// - !basic database interaction
// - !work on making tools work (rects, lines, text, elipses)

// - Make a list of images of tools as HTML elements 
//   and when you click on one, it switches to that tool
//   (and alters image to reflect choice?)
// - lack of color
// - get everyone on the github



//OTHER IDEAS / TO DO
// - !absolute coordinates
// - !push updates to the user
// - !Side list of elements
// - !Clear button

// - work on loading button images from sprite sheets instead of individually by button
// - Work on the chat box (different JS file though)
// - work on snapshots
// - personalized rooms
// - draw a grid
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
