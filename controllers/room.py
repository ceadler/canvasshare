#########################################################################
## This is a the controller for all of the functions that deal with rooms
#########################################################################
import logging  
import json
import unicodedata
logger = logging.getLogger("web2py.app.canvasshare")
def index():
   """blank room for now"""
   arg = request.args(0) or ''
   return dict(arg=arg)
   
def testAjax():
   """a samle ajax call"""
   
   #def unicodeToAscii(str):
      #return unicodedata.normalize('NFKD', str).encode('ascii','ignore')
   ajaxAuthor = request.vars.author or 'no param!'
   ajaxData = request.vars.objectStack or 'no param!'
   
   #objs = []
   #objectStack = json.loads(ajaxData)
   #for obj in objectStack:
   #   objs.append(unicodeToAscii(obj['tool']))
   return "Echo: " + ajaxAuthor +';\n'+ajaxData
   