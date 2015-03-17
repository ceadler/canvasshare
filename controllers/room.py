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
   if arg is '':
      redirect(URL('default', 'index'))
   return dict(arg=arg)
   
def exists():
   '''Ajax call for finding out if the room exists'''
   ajaxRoom = request.args(0) or ''
   return (db(db.room.roomIdentifier == ajaxRoom).select().first() is not None)
   
def getRecent():
   '''Gets a copy of the most recent data'''
   ajaxRoom = request.args(0) or ''
   canvasRoom = db(db.room.roomIdentifier == ajaxRoom).select().first();
   if canvasRoom is None:
       raise HTTP(204, 'no content');
   latest_snap = db(db.drawing.roomref == canvasRoom.id).select(orderby=~db.drawing.date_created).first();
   if latest_snap is None:
       raise HTTP(204, 'no content');
   data = latest_snap.drawing_stack or ''
   if data is '':
      raise HTTP(204, 'no-content');
   return data
   
   
   
   
def submitData():
   '''Function for saving a new artifact of data'''
   ajaxRoom = request.vars.room or '';
   ajaxData = request.vars.objectStack or ''   
   canvasRoom = db(db.room.roomIdentifier == ajaxRoom).select().first();
   
   if not (ajaxRoom is '' or canvasRoom is None):
      latest_snap = db(db.drawing.roomref == canvasRoom.id).select(orderby=~db.drawing.date_created).first();
      oldDataSplit = latest_snap.drawing_stack[1:-1].split(',')
      if latest_snap.drawing_stack[1:-1] is '':
         newData = '['+ajaxData+']';
      else:
         newData = '['+(','.join(oldDataSplit +ajaxData.split(',')))+']';
      latest_snap.update_record(drawing_stack = newData);
      return latest_snap.drawing_stack[1:-1]
   #else:
   
   
   
def delete():
   '''a samle ajax call'''
   #ajaxAuthor = request.vars.author or 'no param!'
   ajaxRoom = request.vars.room or '';
   delID = request.vars.drawingIndex or '';
   
   if ajaxRoom is '':
      return "Error:"+ajaxRoom+'; '+ajaxData
      
   canvasRoom = db(db.room.roomIdentifier == ajaxRoom).select().first();
   logger.info(canvasRoom);
   if canvasRoom is None:
      return 'Does not exist.'
      
   else:
      latest_snap = db(db.drawing.roomref == canvasRoom.id).select(orderby=~db.drawing.date_created).first();
      JSONData = json.loads(latest_snap.drawing_stack);
      del JSONData[min(int(delID), (len(JSONData))-1)]
      newData = json.dumps(JSONData)
      latest_snap.update_record(drawing_stack = newData);
      return "Deleted!"+delID

   
   
   
def saveSnapshot():
   '''a samle ajax call'''
   #ajaxAuthor = request.vars.author or 'no param!'
   ajaxRoom = request.vars.room or '';
   ajaxData = request.vars.objectStack or '';
   
   if ajaxRoom is '':
      return "Error:"+ajaxRoom+'; '+ajaxData
       #raise HTTP(204, 'no content');#throw some other error instead actually
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
      
   else:
      latest_snap = db(db.drawing.roomref == canvasRoom.id).select(orderby=~db.drawing.date_created).first();
      latest_snap.update_record(drawing_stack = ajaxData);
      return "data saved!" + latest_snap.drawing_stack
   
   #objs = []
   #objectStack = json.loads(ajaxData)
   #for obj in objectStack:
   #   objs.append(unicodeToAscii(obj['tool']))
   return "Echo: " + repr(content)
   
def getMessages():
   '''Returns all messages in the Chat'''
   room = request.args(0) or ''
   canvasRoom = db(db.room.roomIdentifier == room).select().first();
   if canvasRoom is None:
       raise HTTP(204, 'no content');
   if canvasRoom.chat is None:
      canvasRoom.update_record(chat='')
   return canvasRoom.chat

#@auth.requires_signature()  
def sendMessage():
   '''submits a message into the database'''
   room = request.vars.room or '';
   message = XML(request.vars.message, sanitize=True) or ''
   canvasRoom = db(db.room.roomIdentifier == room).select().first();
   if canvasRoom is None:
       raise HTTP(204, 'no content');
   if canvasRoom.chat is None:
      canvasRoom.update_record(chat=message)
   else:
      if message == 'clear':
         canvasRoom.update_record(chat='')
      else:
         if (canvasRoom.chat == '') and auth.user is not None:
            data = '<span style="font-family:Lobster;color:#cc2c18;font-size:large;">' + auth.user.first_name +'</span>: ' + message
         elif (canvasRoom.chat == ''):
            data = '<strong style="color:#cac8c4;">Anonymous</strong>: ' +message
         elif auth.user is not None:
            data = (canvasRoom.chat+'<br><span style="font-family:Lobster;color:#cc2c18;font-size:large;">' + auth.user.first_name +'</span>: ' + message)
         else:
            data = (canvasRoom.chat+'<br><strong style="color:#cac8c4;">Anonymous</strong>: ' +message)
         canvasRoom.update_record(chat=data)
   return ''
   
def createRoom():
   '''an ajax? call for creating a new room'''
   return ''
