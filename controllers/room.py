#########################################################################
## This is a the controller for all of the functions that deal with rooms
#########################################################################
import logging  
import json
import unicodedata
from datetime import datetime

logger = logging.getLogger("web2py.app.canvasshare")
def index():
   """blank room for now"""
   arg = request.args(0) or ''
   return dict(arg=arg)
   
def getRecent():
   '''Gets a copy of the most recent data'''
   arg = request.args(0) or ''
   ajaxRoom = arg;
   canvasRoom = db(db.room.roomIdentifier == ajaxRoom).select().first();
   if canvasRoom is None:
       raise HTTP(204, 'no content');
   latest_snap = db(db.drawing.roomref == canvasRoom.id).select(orderby=~db.drawing.date_created).first();
   if latest_snap is None:
       raise HTTP(204, 'no content');
   data = latest_snap.drawing_stack;
   return data
   
   
   
   
def submitData():
   '''Function for saving a new artifact of data'''
   ajaxRoom = request.vars.room or '';
   ajaxData = request.vars.objectStack or ''   
   canvasRoom = db(db.room.roomIdentifier == ajaxRoom).select().first();
   
   if not (ajaxRoom is '' or canvasRoom is None):
      #return ''#fail silently
      latest_snap = db(db.drawing.roomref == canvasRoom.id).select(orderby=~db.drawing.date_created).first();
      newData = latest_snap.drawing_stack + ajaxData
      latest_snap.update_record(drawing_stack = ajaxData);
      #return ''
   #else:
   
   
   
   
def saveSnapshot():
   '''a samle ajax call'''
   #ajaxAuthor = request.vars.author or 'no param!'
   ajaxRoom = request.vars.room or '';
   ajaxData = request.vars.objectStack or '';
   
   if ajaxRoom is '':
       raise HTTP(204, 'no content');#throw some other error instead actually
   canvasRoom = db(db.room.roomIdentifier == ajaxRoom).select().first();
   #content = db(db.room.roomIdentifier == ajaxRoom).count();
   logger.info(canvasRoom);
   if canvasRoom is None:
      missing = True
      roomID = db.room.insert(roomIdentifier = ajaxRoom)
      snapID = db.drawing.insert(date_created = datetime.utcnow(),
                         roomref = roomID,
                         drawing_stack = ajaxData,
                        )
      return 'The page did not previously exist. It has been newly created!' + db(db.drawing.id == snapID).select().first().drawing_stack
      
      #logger.info("called1!");
   else:
      #db.drawing.insert(date_created = datetime.utcnow(),
      #                  roomref = canvasRoom.id,
      #                  drawing_stack = "",
      #                  )
      latest_snap = db(db.drawing.roomref == canvasRoom.id).select(orderby=~db.drawing.date_created).first();
      #oldData = latest_snap.drawing_stack;
      latest_snap.update_record(drawing_stack = ajaxData);
      #recent_rev = db(db.drawing.roomref == canvasRoom).select(orderby=~db.drawing.date_created).first()
      #recent_rev.drawing_stack = ajaxData;
      #content = "count = " + repr(db(db.drawing.roomref == canvasRoom.id).count()) +"saved!          Old data!" + oldData +"                                            New data!" +  latest_snap.drawing_stack;
      #logger.info("called2!");
      return "data saved!" + latest_snap.drawing_stack
   
   #objs = []
   #objectStack = json.loads(ajaxData)
   #for obj in objectStack:
   #   objs.append(unicodeToAscii(obj['tool']))
   return "Echo: " + repr(content)
   
def createRoom():
   '''an ajax? call for creating a new room'''
   return ''
   