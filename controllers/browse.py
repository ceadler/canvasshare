# -*- coding: utf-8 -*-
# try something like
def index():
    AllCanvas_ = db().select(db.room.roomIdentifier);
    AllCanvas = db().select(db.room.roomIdentifier, orderby=db.room.roomIdentifier);
    return dict(AllCanvas=AllCanvas);
