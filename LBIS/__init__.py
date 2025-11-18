from flask import Flask
from .config import Config


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # 注册蓝图
    from .routes.views import bp as views_bp
    from .routes.api import bp as api_bp
    from .routes.diagnosis_api import bp as diagnosis_bp
    from .routes.prognosis_api import bp as prognosis_bp
    from .routes.medical_record_api import bp as medical_record_bp
    from .routes.research_api import bp as research_bp
    
    app.register_blueprint(views_bp)
    app.register_blueprint(api_bp, url_prefix='/api/v1')
    app.register_blueprint(diagnosis_bp)
    app.register_blueprint(prognosis_bp)
    app.register_blueprint(medical_record_bp)
    app.register_blueprint(research_bp)

    return app