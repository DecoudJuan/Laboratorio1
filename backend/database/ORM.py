from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey, TIMESTAMP, UniqueConstraint
from sqlalchemy.orm import relationship, declarative_base, sessionmaker
from datetime import datetime

Base = declarative_base()

class Usuario(Base):
    __tablename__ = 'Usuario'
    idUser = Column(Integer, primary_key=True, autoincrement=True)
    NombreCompleto = Column(Text, nullable=False)
    Celular = Column(Text)
    Mail = Column(Text, unique=True, nullable=False)
    tipoUsuario = Column(Text)
    Contraseña = Column(Text, nullable=False)
    rolUsuario = Column(Text, nullable=False)
    mensajes = relationship("Mensaje", back_populates="usuario")
    vehiculos = relationship("Posee", back_populates="usuario")

class Mensaje(Base):
    __tablename__ = 'Mensaje'
    idMensaje = Column(Integer, primary_key=True, autoincrement=True)
    idUser = Column(Integer, ForeignKey('Usuario.idUser', ondelete="CASCADE"))
    Contenido = Column(Text, nullable=False)
    FechaHora = Column(TIMESTAMP, default=datetime.utcnow)
    usuario = relationship("Usuario", back_populates="mensajes")

class Reportados(Base):
    __tablename__ = 'Reportados'
    idReporte = Column(Integer, primary_key=True, autoincrement=True)
    IdUserEnvia = Column(Integer, ForeignKey('Usuario.idUser', ondelete="CASCADE"))
    IdUserReporta = Column(Integer, ForeignKey('Usuario.idUser', ondelete="CASCADE"))
    Motivo = Column(Text, nullable=False)
    Contenido = Column(Text)

class Vehiculo(Base):
    __tablename__ = 'Vehiculo'
    idVehiculo = Column(Integer, primary_key=True, autoincrement=True)
    Patente = Column(Text)
    Marca = Column(Text)
    Modelo = Column(Text)
    HoraIngreso = Column(TIMESTAMP)
    HoraEgreso = Column(TIMESTAMP)
    CocheraOcupada = Column(Integer)

class Cochera(Base):
    __tablename__ = 'Cochera'
    idCochera = Column(Integer, primary_key=True, autoincrement=True)

class Posee(Base):
    __tablename__ = 'Posee'
    idUser = Column(Integer, ForeignKey('Usuario.idUser', ondelete="CASCADE"), primary_key=True)
    idVehiculo = Column(Integer, ForeignKey('Vehiculo.idVehiculo', ondelete="CASCADE"), primary_key=True)
    usuario = relationship("Usuario", back_populates="vehiculos")
    vehiculo = relationship("Vehiculo")

class Ocupa(Base):
    __tablename__ = 'Ocupa'
    idCochera = Column(Integer, ForeignKey('Cochera.idCochera', ondelete="CASCADE"), primary_key=True)
    idVehiculo = Column(Integer, ForeignKey('Vehiculo.idVehiculo', ondelete="CASCADE"), primary_key=True)

class Establecimiento(Base):
    __tablename__ = 'Establecimiento'
    idEstablecimiento = Column(Integer, primary_key=True, autoincrement=True)
    CantidadCocheras = Column(Integer, nullable=False)
    CantidadSectores = Column(Integer, nullable=False)
    UbicacionGeografica = Column(Text, nullable=False)

class AdministradorParking(Base):
    __tablename__ = 'AdministradorParking'
    idAdministrador = Column(Integer, ForeignKey('Usuario.idUser', ondelete="CASCADE"), primary_key=True)
    idParking = Column(Integer, ForeignKey('Establecimiento.idEstablecimiento', ondelete="CASCADE"), primary_key=True)

# Configuración de la base de datos
DATABASE_URL = "sqlite:///parking.db"  # Puedes cambiar esto por tu base de datos real
engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(bind=engine)
Base.metadata.create_all(engine)
