from flask import Flask
from flask_sqlalchemy import SQLAlchemy


app = Flask(__name__)

from models import db
# Usar directamente la cadena sin variables de entorno
app.config["SQLALCHEMY_DATABASE_URI"] = 'postgresql://postgres:qwerty@localhost:5432/postgres'
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)

with app.app_context():
    print(db.engine)
    # Crear las tablas
    db.create_all()
    print("Tablas creadas correctamente")
    print(f"Base de datos actual: {db.engine.url.database}")
    print(f"Esquema actual: {db.engine.url.query.get('schema', 'public')}")

