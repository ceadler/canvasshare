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
   
   def unicodeToAscii(str):
      return unicodedata.normalize('NFKD', str).encode('ascii','ignore')
   ajaxAuthor = request.vars.author or 'no param!'
   ajaxData = request.vars.objectStack or 'no param!'
   
   objs = []
   sample  = ('[ {"tool":"circle", "dataPts":[{"x":1.95, "y":8.23}, {"x":2.34, "y":6.29}]},\
                 {"tool":"line", "dataPts":[{"x":1.95, "y":8.23}, {"x":2.34, "y":6.29}]} ]')
   objectStack = json.loads(sample)
   for obj in objectStack:
      objs.append(unicodeToAscii(obj['tool']))
   return "Reply: " + ajaxAuthor +';'+ajaxData+';'+repr(objs)
   