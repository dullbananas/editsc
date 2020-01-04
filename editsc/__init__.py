import flask
import flask_assets
from flask_htmlmin import HTMLMIN
from .config import DevelopmentConfig, ProductionConfig


def create_app(production, root='/'):
	'''Returns the ``flask.Flask`` object'''

	# Initialize application object
	# -----------------------------
	app = flask.Flask(
		__name__,
	)

	# load config
	if production:
		cfg = ProductionConfig()
	else:
		cfg = DevelopmentConfig()
	app.config.from_object(cfg)
	app.config['APPLICATION_ROOT'] = root

	# Define URL routes
	# -----------------
	@app.route('/')
	def root():
		return flask.redirect(flask.url_for('editor.main'))

	# Register blueprints
	# -------------------
	from .editor import editor
	app.register_blueprint(editor)


	# Initialize extensions
	# ---------------------
	htmlmin = HTMLMIN(app)


	# Initialize Flask-Assets
	# -----------------------
	assets = flask_assets.Environment(app)

	bootstrap = flask_assets.Bundle('custom.scss', filters='libsass,cssmin', output='gen/style.css')
	assets.register('bootstrap', bootstrap)


	# Return the object
	# -----------------
	return app


__all__ = [
	'create_app',
]
