import datetime
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import pytz

db = SQLAlchemy()
from datetime import datetime
class User(db.Model):
    __tablename__ = 'user'

    idUser = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.Text, nullable=False)
    phone = db.Column(db.Text)
    email = db.Column(db.Text, unique=True, nullable=False)
    password = db.Column(db.Text, nullable=False)
    userRole = db.Column(db.Text, nullable=False)
    
    messages = db.relationship('Message', backref='user', cascade='all, delete-orphan')
    reported = db.relationship('Reported', foreign_keys='Reported.senderId', backref='reporting_user', cascade='all, delete-orphan')
    receivedReports = db.relationship('Reported', foreign_keys='Reported.reportedUserId', backref='reported_user', cascade='all, delete-orphan')
    

class Reported(db.Model):
    __tablename__ = 'reported'

    idReport = db.Column(db.Integer, primary_key=True)
    senderId = db.Column(db.Integer, db.ForeignKey('user.idUser', ondelete='CASCADE'))
    reportedUserId = db.Column(db.Integer, db.ForeignKey('user.idUser', ondelete='CASCADE'))
    reason = db.Column(db.Text, nullable=False)
    content = db.Column(db.Text)

class car_brands(db.Model):
    __tablename__ = 'car_brands'

    brand_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    brand_name = db.Column(db.String, nullable=False)

    models = db.relationship('car_models', backref='brand', cascade='all, delete-orphan')

class car_models(db.Model):
    __tablename__ = 'car_models'

    model_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    brand_id = db.Column(db.Integer, db.ForeignKey('car_brands.brand_id', ondelete='CASCADE'), nullable=False)
    model_name = db.Column(db.String, nullable=False)
    is_currently_sold = db.Column(db.Boolean, nullable=False)

class Vehicle(db.Model):
    __tablename__ = 'vehicle'

    idVehicle = db.Column(db.Text, primary_key=True)
    brand = db.Column(db.Text)
    model = db.Column(db.Text)
    checkInTime = db.Column(db.DateTime)
    checkOutTime = db.Column(db.DateTime)
    
class EstablishmentAdmin(db.Model):
    __tablename__ = 'establishment_admin'

    idAdmin = db.Column(db.Integer, db.ForeignKey('user.idUser', ondelete='CASCADE'), primary_key=True)
    idEstablishment = db.Column(db.Integer, db.ForeignKey('establishment.idEstablishment', ondelete='CASCADE'), primary_key=True)

class ParkingSpot(db.Model):
    __tablename__ = 'parking_spot'

    idSector = db.Column(db.Integer, db.ForeignKey('sectors.idSector', ondelete='CASCADE'), primary_key=True)
    spotNumber = db.Column(db.Integer, primary_key=True)

    isOccupied = db.Column(db.Boolean, nullable=False, default=False)
    idVehicle = db.Column(db.Text, db.ForeignKey('vehicle.idVehicle', ondelete='SET NULL'), nullable=True)

    sector = db.relationship('Sectors', backref='parking_spots')
    vehicle = db.relationship('Vehicle', backref='parking_spot', uselist=False)

class Owns(db.Model):
    __tablename__ = 'owns'

    idUser = db.Column(db.Integer, db.ForeignKey('user.idUser', ondelete='CASCADE'), primary_key=True)
    idVehicle = db.Column(db.Text, db.ForeignKey('vehicle.idVehicle', ondelete='CASCADE'), primary_key=True)
    is_primary = db.Column(db.Boolean, default=False)

class Sectors(db.Model):
    __tablename__ = 'sectors'

    idSector = db.Column(db.Integer, primary_key=True)
    idEstablishment = db.Column(db.Integer, db.ForeignKey('establishment.idEstablishment', ondelete='CASCADE'))
    nameSec = db.Column(db.Text, nullable=False)
    openingHour = db.Column(db.Time)
    closingHour = db.Column(db.Time)
    availableParkingSpots = db.Column(db.Integer, nullable=False)
    freeParkingSpots = db.Column(db.Integer, nullable=False)

class SectorEstablishment(db.Model):
    __tablename__ = 'sector_establishment'

    idSector = db.Column(db.Integer, db.ForeignKey('sectors.idSector', ondelete='CASCADE'), primary_key=True)
    idEstablishment = db.Column(db.Integer, db.ForeignKey('establishment.idEstablishment', ondelete='CASCADE'), primary_key=True)

class Establishment(db.Model):
    __tablename__ = 'establishment'

    idEstablishment = db.Column(db.Integer, primary_key=True)
    nameEst = db.Column(db.Text, nullable=False)
    totalParkingSpots = db.Column(db.Integer, nullable=False)
    totalSectors = db.Column(db.Integer, nullable=False)
    geographicLocation = db.Column(db.Text, nullable=False)
    
class Mensaje(db.Model):
    __tablename__ = 'mensajes'
    
    id = db.Column(db.Integer, primary_key=True)
    contenido = db.Column(db.String(500), nullable=False)
    usuario = db.Column(db.String(100), nullable=False)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    thumpsUp = db.Column(db.Integer, default=0)
    thumpsDown = db.Column(db.Integer, default=0)
    
    # Relación con la tabla de reacciones
    reacciones = db.relationship('UsuarioReaccion', backref='mensaje', lazy=True, cascade="all, delete-orphan")

class Message(db.Model):
    __tablename__ = 'message'

    idMessage = db.Column(db.Integer, primary_key=True)
    idUser = db.Column(db.Integer, db.ForeignKey('user.idUser', ondelete='CASCADE'))
    content = db.Column(db.Text, nullable=False)
    timeStamp = db.Column(db.DateTime, server_default=db.func.current_timestamp())

class UsuarioReaccion(db.Model):
    __tablename__ = 'usuario_reacciones'
    
    id = db.Column(db.Integer, primary_key=True)
    usuario = db.Column(db.String(100), nullable=False)
    mensaje_id = db.Column(db.Integer, db.ForeignKey('mensajes.id'), nullable=False)
    tipo_reaccion = db.Column(db.String(10), nullable=False)  # 'like' o 'dislike'
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Restricción única para evitar que un usuario tenga múltiples reacciones al mismo mensaje
    __table_args__ = (
        db.UniqueConstraint('usuario', 'mensaje_id', name='usuario_mensaje_unique'),
    )