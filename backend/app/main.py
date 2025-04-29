import random
from flask import Flask, jsonify, redirect, request, send_from_directory, render_template, url_for
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor
from models import User, Vehicle, Owns, Establishment, Sectors, EstablishmentAdmin, SectorEstablishment

# MODULOS PARA LOGIN
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request
from werkzeug.security import check_password_hash 

# MODULOS PARA BASE DE DATOS
from sqlalchemy import text

# MAILpip
import string
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# MANEJO DEL RESTO DE REQUESTS
from config import config
from werkzeug.security import generate_password_hash
from models import *  
from flask_cors import CORS  # Importar CORS para permitir solicitudes del frontend

# Cargar variables de entorno desde el archivo .env
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../.env'))

def create_app(enviroment):
    app = Flask(__name__)

    jwt = JWTManager(app)

    # CONFIGURAR CORS
    CORS(app, resources={r"/api/*": {
        "origins": "http://localhost:3000",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "Cache-Control", "Pragma", "Expires"],
        "supports_credentials": True
    }})

    app.config.from_object(enviroment)
    
    # CONFIGURAR SMTPLIB
    app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER')
    app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
    app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS') == 'True'
    app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
    app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')

    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-fallback-secret-key')  
    app.config['JWT_VERIFY_SUB'] = False
    # INICIALIZAR LA BASE DE DATOS
    db.init_app(app)
    
    return app

enviroment = config['development']
app = create_app(enviroment)

# MAIL RECOVERY 

"""
print(f"MAIL_SERVER: {os.getenv('MAIL_SERVER')}")
print(f"MAIL_PORT: {os.getenv('MAIL_PORT')}")
print(f"MAIL_USE_TLS: {os.getenv('MAIL_USE_TLS')}")
print(f"MAIL_USERNAME: {os.getenv('MAIL_USERNAME')}")
print(f"MAIL_PASSWORD: {os.getenv('MAIL_PASSWORD')}")
"""

# POR AHORA MOCKEADO PARA NO IMPLEMENTAR TODO EL SISTEMA
def generate_recovery_code(length=6):
    letters_and_digits = string.ascii_letters + string.digits
    return ''.join(random.choice(letters_and_digits) for i in range(length))

@app.route('/api/send-recovery-email', methods=['POST'])
def send_recovery_email():
    try:

        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return jsonify({'success': False, 'message': 'Email no proporcionado'}), 400
            
        # VERIFICACION DE EXISTENCIA DEL MAIL
        existing_user = User.query.filter_by(email=email).first()
        if not existing_user:
            # MENSAJE GENERAL AL USUARIO
            return jsonify({'success': True, 'message': 'Si el email existe, recibirás un código de recuperación.'}), 200
        
        recovery_code = generate_recovery_code()
        
        # Aquí podrías almacenar el código en la base de datos asociado al usuario
        # existing_user.recovery_code = recovery_code
        # existing_user.recovery_expiry = datetime.now() + timedelta(minutes=15)
        # db.session.commit()
        
        # CONFIGURACION DEL SERVER SMTP
        smtp_server = os.getenv('MAIL_SERVER')
        smtp_port = int(os.getenv('MAIL_PORT', 587))
        smtp_username = os.getenv('MAIL_USERNAME')
        smtp_password = os.getenv('MAIL_PASSWORD')
        
        # CREA EL MENSAJE
        msg = MIMEMultipart()
        msg['From'] = smtp_username
        msg['To'] = email
        msg['Subject'] = 'Recuperación de Contraseña'
        
        # CUERPO DEL MENSAJE
        body = f'Hola,\n\nHas solicitado recuperar tu contraseña.\n\nTu código de recuperación es: {recovery_code}\n\nEste código expirará en 15 minutos.\n\nSi no solicitaste este cambio, ignora este mensaje.\n\nSaludos,\nEquipo de Soporte'
        msg.attach(MIMEText(body, 'plain'))
        
        # ENVIAR CORREO
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls() # INICIA TLS
            server.login(smtp_username, smtp_password)
            server.send_message(msg)
            
        print(f"Correo enviado a {email} con código {recovery_code}")  # DEPURACIÓN
        
        return jsonify({'success': True, 'message': 'Si el email existe, recibirás un código de recuperación.'}), 200
    except Exception as e:
        print(f'Error detallado: {str(e)}')  # LOG DE ERROR 
        return jsonify({'success': False, 'message': 'Ocurrió un error al enviar el email. Por favor intenta más tarde.'}), 500
    
# NUEVA RUTA PARA LOGIN
@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        # SI LOS CAMPOS NO ESTAN RELLENADOS
        if not email or not password:
            return jsonify({'success': False, 'message': 'Email y contraseña son requeridos'}), 400
        
        # BUSCA EL USUARIO EN LA BASE DE DATOS
        user = User.query.filter_by(email=email).first()
        
        if not user or not check_password_hash(user.password, password):
            return jsonify({'success': False, 'message': 'Credenciales inválidas'}), 401
        
        # CREA TOKEN JWT
        access_token = create_access_token(identity={
            'id': user.idUser,
            'username': user.username,
            'email': user.email,
            'userRole': user.userRole
        })
        
        return jsonify({
            'success': True,
            'message': 'Inicio de sesión exitoso',
            'token': access_token,
            'user': {
                'id': user.idUser,
                'username': user.username,
                'email': user.email,
                'userRole': user.userRole
            }
        }), 200
        
    except Exception as e:
        print(f'Error en login: {str(e)}')
        return jsonify({'success': False, 'message': 'Error en el servidor'}), 500

@app.route('/api/users', methods=['GET'])
@jwt_required()
def get_all_users():
    try:
        # Verificar que el usuario actual es administrador
        current_user = get_jwt_identity()
        if current_user['userRole'] != 'administrador':
            return jsonify({
                'success': False,
                'message': 'No tienes permisos de administrador'
            }), 403
        
        # Obtener usuarios con rol "usuario" de la base de datos
        users = User.query.filter_by(userRole='usuario').all()
        
        # Convertir la lista de usuarios a formato JSON
        users_list = []
        for user in users:
            users_list.append({
                'idUser': user.idUser,
                'username': user.username,
                'phone': user.phone,
                'email': user.email,
                'userRole': user.userRole
            })
        
        return jsonify({
            'success': True,
            'users': users_list
        }), 200
        
    except Exception as e:
        print(f'Error al obtener usuarios: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Error al obtener la lista de usuarios'
        }), 500
    
@app.route('/api/editarSector', methods=['POST'])
@jwt_required()
def editar_sector():
    try:
        id_sector = request.form.get('idSector')
        nuevo_nombre = request.form.get('nombreSec')
        nueva_disponibilidad = request.form.get('availableParkingSpots')
        nueva_desocupados = request.form.get('freeParkingSpots')
        nueva_apertura = request.form.get('openingHour')
        nuevo_cierre = request.form.get('closingHour')

        sector = Sectors.query.get(id_sector)

        if not sector:
            return jsonify({'message': 'Sector no encontrado', 'success': False}), 404

        # Actualizamos los datos
        sector.nameSec = nuevo_nombre
        sector.openingHour = nueva_apertura
        sector.closingHour = nuevo_cierre
        sector.availableParkingSpots = nueva_disponibilidad
        sector.freeParkingSpots = nueva_desocupados  # Actualiza también los espacios libres


        db.session.commit()

        return jsonify({'message': 'Sector actualizado correctamente', 'success': True}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error al editar sector: {str(e)}', 'success': False}), 500

@app.route('/api/editarParking', methods=['POST'])
@jwt_required()
def editar_parking():
    try:
        nombre_completo = request.form.get('nombrecompleto')
        num_sectores = request.form.get('numsectores')
        num_cocheras = request.form.get('numcocheras')
        ubicacion = request.form.get('ubicacion')
        nombre_anterior = request.form.get('nombre_anterior')

        establecimiento = Establishment.query.filter_by(name=nombre_anterior).first()

        if not establecimiento:
            return jsonify({'message': 'Establecimiento no encontrado', 'success': False}), 404

        establecimiento.name = nombre_completo
        establecimiento.num_sectores = num_sectores
        establecimiento.num_cocheras = num_cocheras
        establecimiento.ubicacion = ubicacion

        db.session.commit()

        return jsonify({'message': 'Establecimiento actualizado correctamente', 'success': True}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error al editar establecimiento: {str(e)}', 'success': False}), 500

# REGISTRO NORMAL
@app.route('/api/register', methods=['POST'])
def register_user():
    # OBTIENE LOS DATOS Y LOS ASIGNA A UNA VARIABLE
    data = request.get_json()
    username = data.get('username')
    phone = data.get('phone')
    email = data.get('email')
    password = data.get('password')
    userRole = data.get('rol', 'usuario')  # POR DEFECTO USUARIO
    
    # SI LOS CAMPOS NO ESTAN RELLENADOS
    if not username or not email or not password:
        return jsonify({'message': 'Todos los campos son obligatorios', 'success': False}), 400
    
    # VERIFICA LA EXISTENCIA DEL MAIL
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({'message': 'El correo electrónico ya está registrado', 'success': False}), 400
    
    # CREAR USUARIO
    try:
        # HASHEAR CONTRASEÑA
        hashed_password = generate_password_hash(password)
        
        # CREA OBJETO USUARIO
        new_user = User(

            username=username,
            email=email,
            phone=phone,
            password=hashed_password,
            userRole=userRole,
        )
        
        # GUARDA EN LA BASE DE DATOS
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'message': 'Registro exitoso',
            'success': True,
            'user_id': new_user.idUser 
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': f'Error en el registro: {str(e)}',
            'success': False
        }), 500

# REGISTRO ADMIN
@app.route('/api/register/admin', methods=['POST'])
def register_admin():
    # Obtener datos del request
    data = request.get_json()
    username = data.get('username')
    phone = data.get('phone')
    email = data.get('email')
    password = data.get('password')
    admin_code = data.get('adminCode')
    
    # Validar código de administrador (mejor tenerlo en una variable de entorno)
    ADMIN_CODE = 'admin123'  # En producción, usar variables de entorno
    
    if admin_code != ADMIN_CODE:
        return jsonify({
            'message': 'Código de administrador incorrecto',
            'success': False
        }), 403
    
    # Validaciones básicas
    if not username or not email or not password:
        return jsonify({'message': 'Todos los campos son obligatorios', 'success': False}), 400
    
    # Verificar si el email ya existe
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({'message': 'El correo electrónico ya está registrado', 'success': False}), 400
    
    # Crear nuevo administrador
    try:
        # Encriptar contraseña
        hashed_password = generate_password_hash(password)
        
        # Crear objeto de usuario administrador
        new_admin = User(
            username=username,
            email=email,
            phone = phone,
            password=hashed_password,
            userRole='administrador'
        )
        
        # Guardar en la base de datos
        db.session.add(new_admin)
        db.session.commit()
        
        return jsonify({
            'message': 'Registro como administrador exitoso',
            'success': True,
            'user_id': new_admin.idUser
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': f'Error en el registro: {str(e)}',
            'success': False
        }), 500

# CHEQUEA MAIL
@app.route('/api/check-email', methods=['POST'])
def check_email():
    data = request.get_json()
    email = data.get('email')
    
    if not email:
        return jsonify({'message': 'Email no proporcionado', 'success': False}), 400
        
    existing_user = User.query.filter_by(email=email).first()
    
    return jsonify({
        'exists': existing_user is not None,
        'success': True
    })

# Ruta para servir archivos estáticos
@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('../../frontend/static', path)

# Ruta para servir la página de recuperación de contraseña
@app.route('/passwordrecup.html')
def password_recovery_page():
    return send_from_directory('../../frontend/templates', 'passwordrecup.html')

# Ruta para servir la página de registro
@app.route('/api/mis_datos', methods=['GET'])
def mis_datos():
    try:
        # Suponiendo que el usuario está autenticado y tienes el ID del usuario
        user = User.query.filter_by(username=user.username).first()  # Suponiendo que usas Flask-Login
        
        if user:
            # Obtener los vehículos del usuario
            vehicles = db.session.query(Vehicle).join(Owns).filter(Owns.idUser == user.idUser).all()

            # Formatear los datos para enviarlos como respuesta JSON
            data = {
                'username': user.username,
                'email': user.email,
                'vehiculo_principal': vehicles[0].idVehicle if vehicles else None,  # Asumimos que el primer vehículo es el principal
                'vehiculos_secundarios': [v.idVehicle for v in vehicles[1:]]  # Los demás vehículos son secundarios
            }

            return jsonify(data), 200
        else:
            return jsonify({'message': 'Usuario no encontrado', 'success': False}), 404

    except Exception as e:
        return jsonify({'message': str(e), 'success': False}), 500

# BORRADO DE USUARIO
@app.route('/api/borrar_usuario/<username>', methods=['DELETE'])
@jwt_required()
def borrar_usuario(username):
    try:
        print(username)
        # Obtener usuario actual desde el token JWT
        current_user = get_jwt_identity()
        
        # Buscar usuario a borrar (case sensitive)
        usuario = User.query.filter_by(username=username).first()
        
        if not usuario:
            return jsonify({
                'success': False,
                'message': 'Usuario no encontrado'
            }), 404

        # Verificar que el usuario que borra es el mismo o es admin
        if current_user['email'] != usuario.email and current_user['userRole'] != 'administrador':
            return jsonify({
                'success': False,
                'message': 'No tienes permiso para borrar este usuario'
            }), 403

        # Primero, obtener los vehículos del usuario
        vehiculos = db.session.query(Vehicle).join(Owns).filter(Owns.idUser == usuario.idUser).all()
        
        # Eliminar relaciones en la tabla Owns
        Owns.query.filter_by(idUser=usuario.idUser).delete()
        
        # Eliminar vehículos de la tabla vehicles
        for v in vehiculos:
            db.session.delete(v)
        
        # Finalmente, eliminar al usuario
        db.session.delete(usuario)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Usuario {username} borrado exitosamente'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error al borrar usuario: {str(e)}'
        }), 500
       
@app.route('/api/borrar_sector/<nameSec>', methods=['DELETE'])
def borrar_sector(nameSec):
    try:
        # No JWT check, just verify the sector exists
        sector = Sectors.query.filter_by(nameSec=nameSec).first()

        if not sector:
            return jsonify({
                'success': False,
                'message': f'Sector con nombre "{nameSec}" no encontrado'
            }), 404

        # Borrar el sector
        db.session.delete(sector)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': f'Sector "{nameSec}" borrado exitosamente'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error al borrar sector: {str(e)}'
        }), 500

@app.route('/api/usuario/<int:user_id>')
def obtener_datos_usuario(user_id):
    try:
        # Debug: Imprimir el ID de usuario recibido
        print(f"Buscando usuario con ID: '{user_id}'")
        
        # Buscar al usuario por su ID
        user = User.query.get(user_id)
        
        # Debug: Imprimir el resultado de la búsqueda
        print(f"Usuario encontrado: {user}")
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'Usuario no encontrado'
            }), 404
        
        # Obtener los vehículos del usuario usando el username del usuario encontrado
        owns = Owns.query.filter_by(username=user.username).all()
        
        # Preparar la lista de vehículos secundarios
        vehiculos_secundarios = []
        if owns:
            for o in owns:
                if o.vehicle != user.main_vehicle and o.vehicle:
                    vehiculos_secundarios.append(o.vehicle)
        
        # Construir y devolver la respuesta
        return jsonify({
            'id': user.idUser,
            'success': True,
            'email': user.email,
            'vehiculo_principal': user.main_vehicle if hasattr(user, 'main_vehicle') else '',
            'vehiculos_secundarios': vehiculos_secundarios
        }), 200
    
    except Exception as e:
        print(f"Error al obtener datos del usuario: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Error al obtener datos del usuario'
        }), 500

@app.route('/api/usuario/id/<int:user_id>')
def obtener_datos_usuario_por_id(user_id):
    try:
        # Debug: Imprimir el ID de usuario recibido
        print(f"Buscando usuario con ID: '{user_id}'")
        
        # Buscar al usuario por su ID
        user = User.query.filter_by(idUser=user_id).first()
        
        # Debug: Imprimir el resultado de la búsqueda
        print(f"Usuario encontrado: {user}")
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'Usuario no encontrado'
            }), 404
        
        # Obtener los vehículos del usuario
        owns = Owns.query.filter_by(idUser=user.idUser).all()
        
        # Obtener los datos de los vehículos
        vehiculos = []
        for o in owns:
            vehicle = Vehicle.query.filter_by(idVehicle=o.idVehicle).first()
            if vehicle:
                vehiculos.append({
                    'idVehicle': vehicle.idVehicle,
                    'brand': vehicle.brand,
                    'model': vehicle.model
                })
        
        # Construir y devolver la respuesta
        return jsonify({
            'id': user.idUser,
            'success': True,
            'username': user.username,
            'email': user.email,
            'phone': user.phone,
            'vehiculos': vehiculos
        }), 200
    
    except Exception as e:
        print(f"Error al obtener datos del usuario por ID: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error al obtener datos del usuario: {str(e)}'
        }), 500
    
conn = psycopg2.connect(
    host="localhost",
    database="postgres",
    user="postgres",
    password="qwerty"
)

# EDICION DE DATOS

@app.route('/api/guardar_datos', methods=['POST'])
def guardar_datos():
    try:
        # Obtener valores desde el formulario
        username = request.form.get('username')
        email = request.form.get('email')
        phone = request.form.get('phone')  # Nuevo campo para teléfono
        VP = request.form.get('VP')  # Vehículo Principal
        VP2 = request.form.get('VP2')  # Vehículo Secundario
        nombre_anterior = request.form.get('nombre_anterior')
        
        if not username or not nombre_anterior:
            return jsonify({'message': 'El nombre de usuario es requerido', 'success': False}), 400

        # Validar formato de teléfono si se proporciona
        if phone and not phone.isdigit():
            return jsonify({'message': 'El teléfono debe contener solo números', 'success': False}), 400
            
        # Buscar si existe un usuario con el nombre anterior
        user = User.query.filter_by(username=nombre_anterior).first()

        if user:
            # Actualizamos los datos del usuario
            user.username = username
            user.email = email
            
            # Actualizamos el teléfono sólo si se proporcionó uno nuevo
            if phone:
                user.phone = phone

            # Si se proporciona el VP, buscamos o creamos el vehículo
            if VP:
                vehiculo = Vehicle.query.filter_by(idVehicle=VP).first()
                if not vehiculo:
                    vehiculo = Vehicle(idVehicle=VP, brand='Marca Ejemplo', model='Modelo Ejemplo')
                    db.session.add(vehiculo)
                if not db.session.query(Owns).filter_by(idUser=user.idUser, idVehicle=vehiculo.idVehicle).first():
                    new_own = Owns(idUser=user.idUser, idVehicle=vehiculo.idVehicle)
                    db.session.add(new_own)

            # Si se proporciona el VP2, buscamos o creamos el vehículo
            if VP2:
                vehiculo2 = Vehicle.query.filter_by(idVehicle=VP2).first()
                if not vehiculo2:
                    vehiculo2 = Vehicle(idVehicle=VP2, brand='Marca Ejemplo', model='Modelo Ejemplo')
                    db.session.add(vehiculo2)
                if not db.session.query(Owns).filter_by(idUser=user.idUser, idVehicle=vehiculo2.idVehicle).first():
                    new_own2 = Owns(idUser=user.idUser, idVehicle=vehiculo2.idVehicle)
                    db.session.add(new_own2)

            db.session.commit()

            return jsonify({
                'message': 'Datos actualizados correctamente',
                'success': True,
                'user': {
                    'idUser': user.idUser,
                    'username': user.username,
                    'email': user.email,
                    'phone': user.phone,  # Incluir teléfono en la respuesta
                    'VP2': VP2
                }
            }), 200
        else:
            return jsonify({
                'message': 'Usuario no encontrado',
                'success': False
            }), 404

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': f'Error al guardar datos: {str(e)}',
            'success': False
        }), 500
     
@app.route('/api/guardar_datosEstablecimiento', methods=['POST'])
def guardar_datosEstablecimiento():
    try:
        # Obtener valores desde el formulario
        nombreCompleto = request.form.get('nombrecompleto')
        numsectores = request.form.get('numsectores')
        numcocheras = request.form.get('numcocheras')  # Vehículo Principal
        ubicacion = request.form.get('ubicacion')  # Vehículo Secundario
        nombre_anterior = request.form.get('nombre_anterior')
        
        if not nombreCompleto or not nombre_anterior:
            return jsonify({'message': 'El nombre del parking es requerido', 'success': False}), 400

        # Buscar si existe un usuario con el nombre anterior
        parking = Establishment.query.filter_by(nameEst=nombre_anterior).first()

        if parking:
            # Actualizamos los datos del usuario
            parking.nameEst = nombreCompleto
            parking.totalSectors = numsectores
            parking.totalParkingSpots = numcocheras
            parking.geographicLocation = ubicacion

            db.session.commit()

            return jsonify({
                'message': 'Datos actualizados correctamente',
                'success': True
            }), 200
        else:
            # Si no existe el usuario
            return jsonify({
                'message': 'Usuario no encontrado',
                'success': False
            }), 404

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': f'Error al guardar datos: {str(e)}',
            'success': False
        }), 500

@app.route('/api/datos_Admin', methods=['POST'])
def datos_Admin():
    try:
        # Obtener valores desde el formulario
        username = request.form.get('username')
        email = request.form.get('email')
        sectorName = request.form.get('sector')
        establecimientoName = request.form.get('establecimiento')
        nombre_anterior = request.form.get('nombre_anterior')

        if not username or not nombre_anterior:
            return jsonify({'message': 'El nombre de usuario es requerido', 'success': False}), 400

        # Buscar el usuario por el nombre anterior
        user = User.query.filter_by(username=nombre_anterior).first()

        if user:
            # Actualizar datos del usuario
            user.username = username
            user.email = email

            establecimiento_obj = None

            if establecimientoName:
                # Buscar establecimiento por nombre
                establecimiento_obj = Establishment.query.filter_by(nameEst=establecimientoName).first()
    
                if not establecimiento_obj:
                    # Crear nuevo establecimiento si no existe
                    establecimiento_obj = Establishment(
                        nameEst=establecimientoName,
                        totalParkingSpots=3,
                        totalSectors=3,
                        geographicLocation='unknown'
                    )
                    db.session.add(establecimiento_obj)
                    db.session.flush()  # Para obtener el ID asignado

                # Crear relación con EstablishmentAdmin si no existe
                if not db.session.query(EstablishmentAdmin).filter_by(
                    idAdmin=user.idUser,
                    idEstablishment=establecimiento_obj.idEstablishment
                ).first():
                    new_EstAdmin = EstablishmentAdmin(
                        idAdmin=user.idUser,
                        idEstablishment=establecimiento_obj.idEstablishment
                    )
                    db.session.add(new_EstAdmin)

        if sectorName and establecimiento_obj:
            # Buscar sector por nombre dentro del establecimiento
            sector_obj = Sectors.query.filter_by(
                nameSec=sectorName,
                idEstablishment=establecimiento_obj.idEstablishment
            ).first()

            if not sector_obj:
                # Crear nuevo sector si no existe
                sector_obj = Sectors(
                    nameSec=sectorName,
                    idEstablishment=establecimiento_obj.idEstablishment,
                    openingHour=1,
                    closingHour=0,
                    availableParkingSpots=0,
                    freeParkingSpots=0
                )
                db.session.add(sector_obj)
                db.session.flush()

            # Crear relación con SectorEstablishment si no existe
            if not db.session.query(SectorEstablishment).filter_by(
                idSector=sector_obj.idSector,
                idEstablishment=establecimiento_obj.idEstablishment
            ).first():
                new_secEst = SectorEstablishment(
                    idSector=sector_obj.idSector,
                    idEstablishment=establecimiento_obj.idEstablishment
                )
                db.session.add(new_secEst)

            db.session.commit()

            return jsonify({
                'message': 'Datos actualizados correctamente',
                'success': True
            }), 200

        else:
            return jsonify({'message': 'Usuario no encontrado', 'success': False}), 404

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': f'Error al guardar datos: {str(e)}',
            'success': False
        }), 500
    
@app.route('/api/datos_Sector', methods=['POST'])
def datos_Sector():
    try:
        # Obtener valores desde el formulario
        nombre = request.form.get('name')
        horario_apertura = request.form.get('HorarioApertura')
        horario_cierre = request.form.get('Horariocierre')
        cocheras_disponibles = request.form.get('CocherasDisponibles')
        cocheras_libres = request.form.get('CocherasLibres')
        nombre_anterior = request.form.get('nombre_anterior')

        if not nombre or not nombre_anterior:
            return jsonify({'message': 'El nombre del sector es requerido', 'success': False}), 400

        # Buscar el sector por el nombre anterior
        sector = Sectors.query.filter_by(nameSec=nombre_anterior).first()

        if sector:
            # Actualizar datos del sector
            sector.nameSec = nombre
            sector.openingHour = horario_apertura
            sector.closingHour = horario_cierre
            sector.availableParkingSpots = cocheras_disponibles
            sector.freeParkingSpots = cocheras_libres

            db.session.commit()

            return jsonify({
                'message': 'Datos del sector actualizados correctamente',
                'success': True
            }), 200
        else:
            return jsonify({'message': 'Sector no encontrado', 'success': False}), 404

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': f'Error al actualizar datos del sector: {str(e)}',
            'success': False
        }), 500

@app.route('/api/datos_SectorBorrar/<string:nombre>', methods=['DELETE'])
def eliminar_sector(nombre):
    try:
        # Buscar el sector por el nombre
        sector = Sectors.query.filter_by(nameSec=nombre).first()

        if sector:
            # Eliminar el sector
            db.session.delete(sector)
            db.session.commit()

            return jsonify({
                'message': 'Sector eliminado correctamente',
                'success': True
            }), 200
        else:
            return jsonify({'message': 'Sector no encontrado', 'success': False}), 404

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': f'Error al eliminar el sector: {str(e)}',
            'success': False
        }), 500

def get_db_connection():
    conn = psycopg2.connect(
    host="localhost",
    database="postgres",
    user="postgres",
    password="qwerty"
    )
    conn.cursor_factory = RealDictCursor
    return conn

# Endpoints para marcas y modelos

@app.route('/api/cocheras/<string:nombre_sector>', methods=['GET'])
def obtener_cocheras(nombre_sector):
    try:
        print(f"Solicitando información para el sector: {nombre_sector}")
        
        # Buscar el sector en la base de datos
        sector = Sectors.query.filter_by(nameSec=nombre_sector).first()
        
        if sector:
            print(f"Sector encontrado: {sector.nameSec}, Cocheras disponibles: {sector.freeParkingSpots}")
            return jsonify({
                "cocheras": sector.freeParkingSpots,
                "nombre": sector.nameSec,
                "success": True
            })
        else:
            print(f"Sector no encontrado: {nombre_sector}")
            # Fallback para desarrollo - datos de prueba si no se encuentra el sector
            fallback_data = {
                "Comedor": 12,
                "IAE": 8,
                "Medicina": 10,
                "Olivo": 5,
                "Profesores": 7
            }
            
            if nombre_sector in fallback_data:
                print(f"Usando datos de fallback para: {nombre_sector}")
                return jsonify({
                    "cocheras": fallback_data[nombre_sector],
                    "nombre": nombre_sector,
                    "success": True,
                    "note": "Datos de respaldo (el sector no existe en la base de datos)"
                })
            
            return jsonify({
                "error": f"Sector '{nombre_sector}' no encontrado",
                "success": False
            }), 404
    except Exception as e:
        print(f"Error al obtener información del sector: {str(e)}")
        return jsonify({
            "error": f"Error interno del servidor: {str(e)}",
            "success": False
        }), 500

# También podemos agregar un endpoint para listar todos los sectores disponibles
@app.route('/api/sectores', methods=['GET'])
def listar_sectores():
    try:
        sectores = Sectors.query.all()
        resultado = []
        
        for sector in sectores:
            resultado.append({
                "id": sector.idSector,
                "nombre": sector.nameSec,
                "cocheras_disponibles": sector.availableParkingSpots,
                "horario_apertura": sector.openingHour,
                "horario_cierre": sector.closingHour
            })
        
        return jsonify({
            "sectores": resultado,
            "total": len(resultado),
            "success": True
        })
    except Exception as e:
        print(f"Error al listar sectores: {str(e)}")
        return jsonify({
            "error": f"Error interno del servidor: {str(e)}",
            "success": False
        }), 500

@app.route('/api/actualizar_freeParkingSpots', methods=['POST'])
def actualizar_freeParkingSpots():
    try:
        nombre_sector = request.form.get('name')
        cocheras_libres = request.form.get('CocherasLibres')

        if not nombre_sector or cocheras_libres is None:
            return jsonify({'success': False, 'message': 'Faltan datos.'}), 400

        sector = Sectors.query.filter_by(nameSec=nombre_sector).first()

        if sector:
            sector.freeParkingSpots = cocheras_libres
            db.session.commit()
            return jsonify({'success': True, 'message': 'Cocheras libres actualizadas correctamente'})
        else:
            return jsonify({'success': False, 'message': 'Sector no encontrado'}), 404

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/api/registrar_actualizar_cochera', methods=['POST'])
def registrar_actualizar_cochera():
    try:
        numero = request.form.get('numero')  # Número de cochera
        nombre_sector = request.form.get('sector')  # Nombre del sector
        ocupado = request.form.get('ocupado') == 'true'  # Estado: ocupado o no

        if not numero or not nombre_sector:
            return jsonify({'success': False, 'message': 'Datos incompletos.'}), 400

        # Buscar sector
        sector = Sectors.query.filter_by(nameSec=nombre_sector).first()
        if not sector:
            return jsonify({'success': False, 'message': 'Sector no encontrado.'}), 404

        # Buscar cochera
        cochera = ParkingSpot.query.filter_by(idParkingSpot=numero).first()

        if not cochera:
            # Crear nueva cochera si no existe
            cochera = ParkingSpot(idParkingSpot=numero, estado=True)
            db.session.add(cochera)
            db.session.flush()  # Para obtener idParkingSpot
        else:
            # Actualizar estado si ya existe
            cochera.estado = ocupado

        # Buscar relación en ParkingSpotSector
        relacion = ParkingSpotSector.query.filter_by(
            idParkingSpot=cochera.idParkingSpot
        ).first()

        if not relacion:
            # Crear la relación sector - cochera
            nueva_relacion = ParkingSpotSector(
                idParkingSpot=cochera.idParkingSpot,
                idVehicle=None  # Inicialmente ninguna relación a vehículo
            )
            db.session.add(nueva_relacion)

        db.session.commit()

        return jsonify({'success': True, 'message': 'Cochera actualizada correctamente'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500   

@app.route('/api/crear_sector', methods=['POST'])
def crear_sector():
    try:
        # Obtener valores desde el formulario
        sectorName = request.form.get('sector')
        establecimientoName = request.form.get('establecimiento')

        if establecimientoName:
            # Buscar establecimiento por nombre
            establecimiento_obj = Establishment.query.filter_by(nameEst=establecimientoName).first()

            if not establecimiento_obj:
                # Crear nuevo establecimiento si no existe
                establecimiento_obj = Establishment(
                    nameEst=establecimientoName,
                    totalParkingSpots=3,
                    totalSectors=3,
                    geographicLocation='unknown'
                )
            db.session.add(establecimiento_obj)
            db.session.flush()  # Para obtener el ID asignado

        if sectorName and establecimiento_obj:
            # Buscar sector por nombre dentro del establecimiento
            sector_obj = Sectors.query.filter_by(
                nameSec=sectorName,
                idEstablishment=establecimiento_obj.idEstablishment
            ).first()

            if not sector_obj:
                # Crear nuevo sector si no existe
                sector_obj = Sectors(
                    nameSec=sectorName,
                    idEstablishment=establecimiento_obj.idEstablishment,
                    openingHour=1,
                    closingHour=0,
                    availableParkingSpots=0,
                    freeParkingSpots=0
                )
                db.session.add(sector_obj)
                db.session.flush()

            # Crear relación con SectorEstablishment si no existe
            if not db.session.query(SectorEstablishment).filter_by(
                idSector=sector_obj.idSector,
                idEstablishment=establecimiento_obj.idEstablishment
            ).first():
                new_secEst = SectorEstablishment(
                    idSector=sector_obj.idSector,
                    idEstablishment=establecimiento_obj.idEstablishment
                )
                db.session.add(new_secEst)

            db.session.commit()

            return jsonify({
                'message': 'Datos actualizados correctamente',
                'success': True
            }), 200

        else:
            return jsonify({'message': 'Usuario no encontrado', 'success': False}), 404

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': f'Error al guardar datos: {str(e)}',
            'success': False
        }), 500
    
@app.route('/api/crear_establecimiento', methods=['POST'])
def crear_establecimiento():
    try:
        # Obtener el nombre del establecimiento
        establecimientoName = request.form.get('establecimiento')

        if establecimientoName:
            # Buscar si el establecimiento ya existe
            establecimiento_obj = Establishment.query.filter_by(nameEst=establecimientoName).first()

            if not establecimiento_obj:
                # Si no existe, crear uno nuevo
                establecimiento_obj = Establishment(
                    nameEst=establecimientoName,
                    totalParkingSpots=3,
                    totalSectors=3,
                    geographicLocation='unknown'
                )
                db.session.add(establecimiento_obj)
                db.session.flush()  # Para obtener el ID asignado

            db.session.commit()

            return jsonify({
                'message': 'Establecimiento creado correctamente',
                'success': True
            }), 200
        else:
            return jsonify({'message': 'Establecimiento no encontrado', 'success': False}), 404
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': f'Error al guardar datos: {str(e)}',
            'success': False
        }), 500
        
# VEHICULOS 

@app.route('/api/brands')
def get_brands():
    """Endpoint para obtener todas las marcas de autos."""
    try:
        conn = get_db_connection()  # Asegúrate de tener esta función definida en tu app
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute("SELECT brand_id, brand_name FROM car_brands ORDER BY brand_name")
        brands = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(brands)
    except Exception as e:
        print(f"Error al obtener marcas: {e}")
        return jsonify([]), 500

@app.route('/api/models/<int:brand_id>')
def get_models(brand_id):
    """Endpoint para obtener modelos de una marca específica."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute(
            "SELECT model_id, model_name FROM car_models WHERE brand_id = %s AND is_currently_sold = TRUE ORDER BY model_name",
            (brand_id,)
        )
        models = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(models)
    except Exception as e:
        print(f"Error al obtener modelos: {e}")
        return jsonify([]), 500
    
@app.route('/api/register_vehicle', methods=['POST'])
@jwt_required()
def register_vehicle():
    try:
        # Obtener el usuario actual desde el token JWT
        current_user = get_jwt_identity()


        user_id = current_user['id']

        # Obtener datos del vehículo del formulario
        data = request.get_json()
        vehicle_id = data.get('patent')  # La patente sirve como ID del vehículo
        brand_id = data.get('brand')     # Actualmente recibe el ID de la marca
        model_id = data.get('model')     # Actualmente recibe el ID del modelo

        # Validar datos requeridos
        if not vehicle_id or not brand_id or not model_id:
            return jsonify({
                'success': False,
                'message': 'Todos los campos son obligatorios'
            }), 400
        
        # Obtener el nombre de la marca y modelo desde la base de datos
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Obtener nombre de la marca
        cursor.execute("SELECT brand_name FROM car_brands WHERE brand_id = %s", (brand_id,))
        brand_result = cursor.fetchone()
        if not brand_result:
            return jsonify({
                'success': False,
                'message': 'Marca no encontrada'
            }), 400
        brand_name = brand_result['brand_name']
        
        # Obtener nombre del modelo
        cursor.execute("SELECT model_name FROM car_models WHERE model_id = %s", (model_id,))
        model_result = cursor.fetchone()
        if not model_result:
            return jsonify({
                'success': False,
                'message': 'Modelo no encontrado'
            }), 400
        model_name = model_result['model_name']
        
        cursor.close()
        conn.close()

        # Verificar si el vehículo ya existe
        existing_vehicle = Vehicle.query.filter_by(idVehicle=vehicle_id).first()
        if existing_vehicle:
            # Si ya existe, verificar si ya pertenece a este usuario
            existing_ownership = Owns.query.filter_by(
                idUser=user_id, idVehicle=vehicle_id
            ).first()
            
            if existing_ownership:
                return jsonify({
                    'success': False,
                    'message': 'Este vehículo ya está registrado a tu nombre'
                }), 400
            else:
                # Si el vehículo existe pero no pertenece al usuario, crear la relación
                new_ownership = Owns(idUser=user_id, idVehicle=vehicle_id)
                db.session.add(new_ownership)
                db.session.commit()
                
                return jsonify({
                    'success': True,
                    'message': 'Vehículo asociado correctamente a tu cuenta'
                }), 200
        
        # Si el vehículo no existe, crearlo con los nombres en lugar de los IDs
        new_vehicle = Vehicle(
            idVehicle=vehicle_id,
            brand=brand_name,  # Guardamos el nombre de la marca
            model=model_name   # Guardamos el nombre del modelo
        )
        
        # Guardar el vehículo
        db.session.add(new_vehicle)
        db.session.flush()  # Para obtener el ID antes de crear la relación
        
        # Crear la relación de propiedad
        new_ownership = Owns(idUser=user_id, idVehicle=vehicle_id)
        db.session.add(new_ownership)
        
        # Guardar todos los cambios
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Vehículo registrado correctamente',
            'vehicle_id': vehicle_id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error al registrar vehículo: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error al registrar el vehículo: {str(e)}'
        }), 500
    
@app.route('/api/user-vehicles/<int:id_user>', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_user_vehicles(id_user):
    if request.method == 'OPTIONS':
        response = app.make_default_options_response()
        return response
    
    try:
        current_user = get_jwt_identity()
        print(f"Usuario actual: {current_user}, solicitando vehículos para usuario ID: {id_user}")
        
        if current_user['userRole'] != 'administrador' and current_user['id'] != id_user:
            print(f"Permiso denegado: Usuario {current_user['id']} intentando acceder a vehículos de {id_user}")
            return jsonify({
                'success': False,
                'message': 'No tienes permisos para ver estos vehículos'
            }), 403
        
        vehicles = db.session.query(Vehicle).\
            join(Owns, Owns.idVehicle == Vehicle.idVehicle).\
            filter(Owns.idUser == id_user).\
            all()

        vehicles_list = []
        for vehicle in vehicles:
            vehicle_data = {
                'idVehicle': vehicle.idVehicle,
                'brand': vehicle.brand,
                'model': vehicle.model,
                'licensePlate': getattr(vehicle, 'licensePlate', vehicle.idVehicle)
            }
            vehicles_list.append(vehicle_data)
        
        return jsonify({
            'success': True,
            'vehicles': vehicles_list
        }), 200
        
    except Exception as e:
        print(f'Error detallado al obtener vehículos del usuario: {str(e)}')
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error al obtener la lista de vehículos: {str(e)}'
            
        }), 500
   
# Ruta para eliminar un vehículo específico
@app.route('/api/vehicles/<string:id_vehicle>', methods=['GET'])
@jwt_required()
def get_vehicle(id_vehicle):
    try:
        # Obtener detalles del vehículo
        vehicle = db.session.query(
            Vehicle.idVehicle,
            car_brands.brand_id,
            car_brands.brand_name.label('brand'),
            car_brands.model_id,
            car_models.model_name.label('model')
        ).join(
            car_models, Vehicle.model == car_models.model_id
        ).join(
            car_brands, car_models.brand_id == car_brands.brand_id
        ).filter(
            Vehicle.idVehicle == id_vehicle
        ).first()
        
        if not vehicle:
            return jsonify({
                'success': False,
                'message': 'Vehículo no encontrado'
            }), 404
        
        # Verificar permisos (opcional - elimina esto si cualquier usuario puede ver los detalles)
        current_user = get_jwt_identity()
        vehicle_owner = db.session.query(Owns).filter(
            Owns.idVehicle == id_vehicle
        ).first()
        
        if (current_user['userRole'] != 'administrador' and 
            vehicle_owner and current_user['id'] != vehicle_owner.idUser):
            return jsonify({
                'success': False,
                'message': 'No tienes permisos para ver este vehículo'
            }), 403
        
        # Convertir a diccionario para poder serializar a JSON
        vehicle_data = {
            'idVehicle': vehicle.idVehicle,
            'brand_id': vehicle.brand_id,
            'brand': vehicle.brand,
            'model_id': vehicle.model_id,
            'model': vehicle.model
        }
        
        return jsonify({
            'success': True,
            'vehicle': vehicle_data
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error al obtener el vehículo'
        }), 500  
    
@app.route('/api/vehicles/<string:id_vehicle>', methods=['DELETE'])
@jwt_required()
def delete_vehicle(id_vehicle):
    try:
        # Verificar que el usuario actual es el propietario o un administrador
        current_user = get_jwt_identity()

        # Obtener datos del vehículo actual para verificar propiedad
        vehicle_owner = db.session.query(Owns).filter(
            Owns.idVehicle == id_vehicle
        ).first()

        if not vehicle_owner:
            return jsonify({
                'success': False,
                'message': 'Vehículo no encontrado'
            }), 404

        # Si el usuario no es administrador y no es el propietario
        if current_user['id'] != vehicle_owner.idUser:
            return jsonify({
                'success': False,
                'message': 'No tienes permisos para eliminar este vehículo'
            }), 403
        
        # Eliminar la relación de propiedad primero
        owns_deleted = db.session.query(Owns).filter(
            Owns.idVehicle == id_vehicle
        ).delete()
        print(f"Registros eliminados de Owns: {owns_deleted}")
        
        # Luego eliminar el vehículo
        vehicle_deleted = db.session.query(Vehicle).filter(
            Vehicle.idVehicle == id_vehicle
        ).delete()
        print(f"Registros eliminados de Vehicle: {vehicle_deleted}")
        
        # Commit de la transacción
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Vehículo eliminado correctamente'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f'Error detallado al eliminar vehículo: {str(e)}')
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error al eliminar el vehículo: {str(e)}'
        }), 500


@app.route('/api/set-primary-vehicle', methods=['POST'])
@jwt_required()
def set_primary_vehicle():
    try:
        # Obtener el usuario actual desde el token JWT
        current_user = get_jwt_identity()
        user_id = current_user['id']
        
        # Obtener el ID del vehículo del cuerpo de la solicitud
        data = request.get_json()
        vehicle_id = data.get('idVehicle')
        
        if not vehicle_id:
            return jsonify({
                'success': False,
                'message': 'ID de vehículo no proporcionado'
            }), 400
        
        # Verificar que el vehículo pertenece al usuario
        ownership = db.session.query(Owns).filter(
            Owns.idUser == user_id,
            Owns.idVehicle == vehicle_id
        ).first()
        
        if not ownership:
            return jsonify({
                'success': False,
                'message': 'Este vehículo no te pertenece'
            }), 403
        
        # Iniciar una transacción
        try:
            # Primero, establecer todos los vehículos del usuario como no principales
            db.session.query(Owns).filter(
                Owns.idUser == user_id
            ).update({Owns.is_primary: False})
            
            # Luego, establecer el vehículo seleccionado como principal
            db.session.query(Owns).filter(
                Owns.idUser == user_id,
                Owns.idVehicle == vehicle_id
            ).update({Owns.is_primary: True})
            
            # Confirmar los cambios
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Vehículo principal actualizado correctamente'
            }), 200
            
        except Exception as e:
            db.session.rollback()
            raise e
        
    except Exception as e:
        print(f'Error al establecer vehículo principal: {str(e)}')
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error al establecer vehículo principal: {str(e)}'
        }), 500

@app.route('/api/user-primary-vehicle', methods=['GET'])
@jwt_required()
def get_user_primary_vehicle():
    try:
        # Obtener el usuario actual desde el token JWT
        current_user = get_jwt_identity()
        user_id = current_user['id']
        
        # Buscar el vehículo principal del usuario
        vehicle = db.session.query(Vehicle).\
            join(Owns, Owns.idVehicle == Vehicle.idVehicle).\
            filter(Owns.idUser == user_id, Owns.is_primary == True).\
            first()
        
        if not vehicle:
            return jsonify({
                'success': True,
                'has_primary': False,
                'message': 'No tienes un vehículo principal establecido'
            }), 200
        
        vehicle_data = {
            'idVehicle': vehicle.idVehicle,
            'brand': vehicle.brand,
            'model': vehicle.model,
            'licensePlate': getattr(vehicle, 'licensePlate', vehicle.idVehicle)
        }
        
        return jsonify({
            'success': True,
            'has_primary': True,
            'vehicle': vehicle_data
        }), 200
        
    except Exception as e:
        print(f'Error al obtener vehículo principal: {str(e)}')
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error al obtener vehículo principal: {str(e)}'
        }), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)