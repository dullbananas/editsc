import flask


editor = flask.Blueprint('editor', __name__, url_prefix='/editor')


@editor.route('/')
def main():
	return flask.render_template('editor.html')
