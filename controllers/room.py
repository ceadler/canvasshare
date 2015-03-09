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
   arg = request.args(0) or ''
   ajaxRoom = arg;
   canvasRoom = db(db.room.keyAlphanum == ajaxRoom).select().first();
   latest_snap = db(db.drawing.roomref == canvasRoom.id).select(orderby=~db.drawing.date_created).first();
   data = latest_snap.drawing_stack;
   return data

def saveRecent():
   """a samle ajax call"""
   
   #def unicodeToAscii(str):
      #return unicodedata.normalize('NFKD', str).encode('ascii','ignore')
   ajaxAuthor = request.vars.author or 'no param!'
   ajaxRoom = request.vars.room or '';
   ajaxData = request.vars.objectStack or 'no param!'   
   
   if ajaxRoom is '':
      return ''#throw some other error instead actually
   canvasRoom = db(db.room.keyAlphanum == ajaxRoom).select().first();
   #content = db(db.room.keyAlphanum == ajaxRoom).count();
   logger.info(canvasRoom);
   if canvasRoom is None:
      missing = True
      roomID = db.room.insert(keyAlphanum = ajaxRoom)
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
   