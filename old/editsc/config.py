class Config:
	pass


class DevelopmentConfig(Config):
	ENV = 'development'
	MINIFY_HTML = False
	SECRET_KEY = 'aaaaaaaa'


class ProductionConfig(Config):
	ENV = 'production'
	MINIFY_HTML = True
	SECRET_KEY = '40aa3aaaa737e3fd0716deff010aafe8178034f3eb56129b740e497581daaaaa'
