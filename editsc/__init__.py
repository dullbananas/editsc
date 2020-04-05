import flask
import flask_assets
from flask_htmlmin import HTMLMIN
from .config import DevelopmentConfig, ProductionConfig


def create_app(production, root='/'):
	'''Returns the ``flask.Flask`` object'''

	# Initialize application object

	app = flask.Flask(
		__name__,
	)

	# Load config

	app.config.from_object(
		ProductionConfig() if production else DevelopmentConfig()
	)
	app.config['APPLICATION_ROOT'] = root

	# Define URL routes

	@app.route('/')
	def root():
		return flask.redirect(flask.url_for('editor.main'))

	# Register blueprints

	from .editor import editor
	app.register_blueprint(editor)

	# Initialize extensions

	htmlmin = HTMLMIN(app)

	# Initialize Flask-Assets

	assets = flask_assets.Environment(app)

	bootstrap = flask_assets.Bundle('custom.scss', filters='libsass,cssmin', output='gen/style.css')
	assets.register('bootstrap', bootstrap)

	# Prevent caching

	@app.after_request
	def prevent_cache(r):
		r.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
		r.headers["Pragma"] = "no-cache"
		r.headers["Expires"] = "0"
		r.headers['Cache-Control'] = 'public, max-age=0'
		return r

	return app


__all__ = [
	'create_app',
]
