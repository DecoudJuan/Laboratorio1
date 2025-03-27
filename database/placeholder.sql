CREATE TABLE Usuario (
    idUser INTEGER PRIMARY KEY AUTOINCREMENT,
    Nombre TEXT NOT NULL,
    Apellido TEXT NOT NULL,
    Celular TEXT,
    Mail TEXT UNIQUE NOT NULL,
    DNI_Pasaporte TEXT UNIQUE NOT NULL,
    tipoUsuario TEXT,
    Contraseña TEXT NOT NULL
);

CREATE TABLE Mensaje (
    idMensaje INTEGER PRIMARY KEY AUTOINCREMENT,
    idUser INTEGER,
    Contenido TEXT NOT NULL,
    FechaHora TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (idUser) REFERENCES Usuario(idUser) ON DELETE CASCADE
);

CREATE TABLE Reportados (
    idReporte INTEGER PRIMARY KEY AUTOINCREMENT,
    IdUserEnvia INTEGER,
    IdUserReporta INTEGER,
    Motivo TEXT NOT NULL,
    Contenido TEXT,
    FOREIGN KEY (IdUserEnvia) REFERENCES Usuario(idUser) ON DELETE CASCADE,
    FOREIGN KEY (IdUserReporta) REFERENCES Usuario(idUser) ON DELETE CASCADE
);

-- Tabla Vehículo
CREATE TABLE Vehiculo (
    idVehiculo TEXT PRIMARY KEY, -- Patente del vehículo
    Marca TEXT,
    Modelo TEXT,
    HoraIngreso TEXT,
    HoraEgreso TEXT,
    CocheraOcupada INTEGER
);

CREATE TABLE SuperUsuarioParking (
    idSuperUsuario INTEGER,
    idParking INTEGER,
    PRIMARY KEY (idSuperUsuario, idParking),
    FOREIGN KEY (idSuperUsuario) REFERENCES Usuario(idUser) ON DELETE CASCADE,
    FOREIGN KEY (idParking) REFERENCES Parking(idParking) ON DELETE CASCADE
);

CREATE TABLE Cochera (
    idCochera INTEGER PRIMARY KEY AUTOINCREMENT
);

CREATE TABLE Posee (
    idUser INTEGER,
    idVehiculo TEXT,
    PRIMARY KEY (idUser, idVehiculo),
    FOREIGN KEY (idUser) REFERENCES Usuario(idUser) ON DELETE CASCADE,
    FOREIGN KEY (idVehiculo) REFERENCES Vehiculo(idVehiculo) ON DELETE CASCADE
);

CREATE TABLE Ocupa (
    idCochera INTEGER,
    idVehiculo TEXT,
    PRIMARY KEY (idCochera, idVehiculo),
    FOREIGN KEY (idCochera) REFERENCES Usuario(idUser) ON DELETE CASCADE,
    FOREIGN KEY (idVehiculo) REFERENCES Vehiculo(idVehiculo) ON DELETE CASCADE
);

CREATE TABLE Sectores (
    idSector INTEGER PRIMARY KEY AUTOINCREMENT,
    idParking INTEGER,
    Nombre TEXT NOT NULL,
    Apertura INTEGER,
    Cierre INTEGER,
    CocherasDisponibles INTEGER,
    FOREIGN KEY (idParking) REFERENCES Parking(idParking) ON DELETE CASCADE
);

CREATE TABLE CocheraSector (
    idCochera INTEGER,
    idVehiculo TEXT,
    PRIMARY KEY (idCochera, idVehiculo),
    FOREIGN KEY (idCochera) REFERENCES Usuario(idUser) ON DELETE CASCADE,
    FOREIGN KEY (idVehiculo) REFERENCES Vehiculo(idVehiculo) ON DELETE CASCADE
);

CREATE TABLE SectorParking (
    idSector INTEGER,
    idParking INTEGER,
    PRIMARY KEY (idParking, idSector),
    FOREIGN KEY (idParking) REFERENCES Parking(idParking) ON DELETE CASCADE,
    FOREIGN KEY (idSector) REFERENCES Sectores(idSector) ON DELETE CASCADE
);

CREATE TABLE Parking (
    idParking INTEGER PRIMARY KEY AUTOINCREMENT,
    CantidadCocheras INTEGER NOT NULL,
    CantidadSectores INTEGER NOT NULL,
    UbicacionGeografica TEXT NOT NULL
);
