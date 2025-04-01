from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'user'

    idUser = db.Column(db.Integer, primary_key=True)
    FullName = db.Column(db.Text, nullable=False)
    Phone = db.Column(db.Text)
    Email = db.Column(db.Text, unique=True, nullable=False)
    UserType = db.Column(db.Text)
    Password = db.Column(db.Text, nullable=False)
    UserRole = db.Column(db.Text, nullable=False)

    messages = db.relationship('Message', backref='user', cascade='all, delete-orphan')
    reported = db.relationship('Reported', foreign_keys='Reported.SenderId', backref='reporting_user', cascade='all, delete-orphan')
    received_reports = db.relationship('Reported', foreign_keys='Reported.ReportedUserId', backref='reported_user', cascade='all, delete-orphan')



class Message(db.Model):
    __tablename__ = 'message'

    idMessage = db.Column(db.Integer, primary_key=True)
    idUser = db.Column(db.Integer, db.ForeignKey('user.idUser', ondelete='CASCADE'))
    Content = db.Column(db.Text, nullable=False)
    Timestamp = db.Column(db.DateTime, server_default=db.func.current_timestamp())


class Reported(db.Model):
    __tablename__ = 'reported'

    idReport = db.Column(db.Integer, primary_key=True)
    SenderId = db.Column(db.Integer, db.ForeignKey('user.idUser', ondelete='CASCADE'))
    ReportedUserId = db.Column(db.Integer, db.ForeignKey('user.idUser', ondelete='CASCADE'))
    Reason = db.Column(db.Text, nullable=False)
    Content = db.Column(db.Text)


class Vehicle(db.Model):
    __tablename__ = 'vehicle'

    idVehicle = db.Column(db.Integer, primary_key=True)
    LicensePlate = db.Column(db.Text)
    Brand = db.Column(db.Text)
    Model = db.Column(db.Text)
    CheckInTime = db.Column(db.DateTime)
    CheckOutTime = db.Column(db.DateTime)
    OccupiedParkingSpot = db.Column(db.Integer)


class EstablishmentAdmin(db.Model):
    __tablename__ = 'establishment_admin'

    idAdmin = db.Column(db.Integer, db.ForeignKey('user.idUser', ondelete='CASCADE'), primary_key=True)
    idEstablishment = db.Column(db.Integer, db.ForeignKey('establishment.idEstablishment', ondelete='CASCADE'), primary_key=True)


class ParkingSpot(db.Model):
    __tablename__ = 'parking_spot'

    idParkingSpot = db.Column(db.Integer, primary_key=True)


class Owns(db.Model):
    __tablename__ = 'owns'

    idUser = db.Column(db.Integer, db.ForeignKey('user.idUser', ondelete='CASCADE'), primary_key=True)
    idVehicle = db.Column(db.Integer, db.ForeignKey('vehicle.idVehicle', ondelete='CASCADE'), primary_key=True)


class Occupies(db.Model):
    __tablename__ = 'occupies'

    idParkingSpot = db.Column(db.Integer, db.ForeignKey('parking_spot.idParkingSpot', ondelete='CASCADE'), primary_key=True)
    idVehicle = db.Column(db.Integer, db.ForeignKey('vehicle.idVehicle', ondelete='CASCADE'), primary_key=True)


class Sectors(db.Model):
    __tablename__ = 'sectors'

    idSector = db.Column(db.Integer, primary_key=True)
    idEstablishment = db.Column(db.Integer, db.ForeignKey('establishment.idEstablishment', ondelete='CASCADE'))
    Name = db.Column(db.Text, nullable=False)
    OpeningHour = db.Column(db.Integer)
    ClosingHour = db.Column(db.Integer)
    AvailableParkingSpots = db.Column(db.Integer)


class ParkingSpotSector(db.Model):
    __tablename__ = 'parking_spot_sector'

    idParkingSpot = db.Column(db.Integer, db.ForeignKey('parking_spot.idParkingSpot', ondelete='CASCADE'), primary_key=True)
    idVehicle = db.Column(db.Integer, db.ForeignKey('vehicle.idVehicle', ondelete='CASCADE'), primary_key=True)


class SectorEstablishment(db.Model):
    __tablename__ = 'sector_establishment'

    idSector = db.Column(db.Integer, db.ForeignKey('sectors.idSector', ondelete='CASCADE'), primary_key=True)
    idEstablishment = db.Column(db.Integer, db.ForeignKey('establishment.idEstablishment', ondelete='CASCADE'), primary_key=True)


class Establishment(db.Model):
    __tablename__ = 'establishment'

    idEstablishment = db.Column(db.Integer, primary_key=True)
    TotalParkingSpots = db.Column(db.Integer, nullable=False)
    TotalSectors = db.Column(db.Integer, nullable=False)
    GeographicLocation = db.Column(db.Text, nullable=False)
