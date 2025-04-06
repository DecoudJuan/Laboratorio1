from flask import Flask
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    
    app.config["SQLALCHEMY_DATABASE_URI"] = 'postgresql://postgres:qwerty@localhost:5432/postgres'
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)

    # Registro del blueprint
    from .main import main as main_blueprint
    app.register_blueprint(main_blueprint, url_prefix="/api")

    return app

