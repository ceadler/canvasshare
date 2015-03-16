function redraw(context, drawing){
   var pts = drawing.pts;
   var tool = drawing.tool;

   if (pts.length >= 2){
      context.fillStyle = '#'+drawing.fCol;
      context.strokeStyle = '#'+drawing.sCol;
      context.lineWidth = drawing.sSiz;
      switch(tool){
         case "freehand":
            context.beginPath();
            context.moveTo(pts[0].x, pts[0].y);
            for (p in pts){
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


function distPt(p1, p2) { return Math.sqrt(Math.pow(p1.x-p2.x, 2) + Math.pow(p1.y-p2.y, 2))}


function loadDrawings(callbackFunc, roomID){
   $.ajax(
   {
      type: 'GET',
      url: '/'+app_name+'/room/getRecent/'+roomID,
   }).done(function(data){callbackFunc(data); console.log(data)});
;}


function redrawStack(context, stack){
   for (d in stack){
      redraw(context, stack[d]);
   };
}

function loadPreview(roomID){
   if(roomID != null && roomID != undefined){
      console.log(roomID)
      var context = document.getElementById(roomID).getContext('2d')
      context.transform(.33, 0, 0, .33, 0, 0)
      console.log("after")
      loadDrawings(function(data){
         if (data != '' && data != undefined){
            var obj = JSON.parse(data);
            redrawStack(context, obj);
         }
      }, roomID)
   }
}