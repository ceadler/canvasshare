from datetime import datetime

db.define_table('room',
    Field('roomIdentifier'),
    Field('isPublic', 'boolean')
    )
    
db.define_table('drawing',
    Field('date_created', 'datetime'),
    Field('roomref', 'reference room'),
    Field('drawing_stack', 'text'),
    )