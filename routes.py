routes_in = (
  ('/room/$anything', '/CanvasShare/room/index/$anything'),
  ('/welcome', '/CanvasShare/default/index'),
)
routes_out = (

  ('/CanvasShare/room/index/$anything', '/room/$anything'),
  ('/CanvasShare/default/index', '/welcome'),
)

routes_onerror = [
  ('.*CanvasShare.*/404', '/CanvasShare/default/inexistent')
]