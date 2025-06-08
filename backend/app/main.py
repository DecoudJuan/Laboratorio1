import random
from flask import Flask, jsonify, redirect, request, send_from_directory, render_template, url_for, session
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor
from models import User, Vehicle, Owns, Establishment, Sectors, EstablishmentAdmin, SectorEstablishment, Reports
# MODULOS PARA LOGIN
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request
from werkzeug.security import check_password_hash   

# MODULOS PARA BASE DE DATOS
from sqlalchemy import text
from pytz import timezone, utc
from datetime import datetime


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
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "Cache-Control", "Pragma", "Expires", "x-iduser", "X-User-Email"],
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

@app.route('/api/usuario/<username>')
def obtener_datos_usuario_por_username(username):
    try:
        # Debug: Imprimir el username recibido
        print(f"Buscando usuario con username: '{username}'")
        
        # Buscar al usuario por su username
        user = User.query.filter_by(username=username).first()
        
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
        
        # Para administradores, buscar también información de parkings y sectores
        parkings_data = []
        sectores_data = []
        
        if user.userRole == 'administrador':
            # Obtener parkings asociados al administrador
            admin_parkings = EstablishmentAdmin.query.filter_by(idUser=user.idUser).all()
            
            for admin_parking in admin_parkings:
                # Obtener detalles del parking
                parking = Establishment.query.filter_by(idParking=admin_parking.idParking).first()
                if parking:
                    parkings_data.append({
                        'id': parking.idParking,
                        'name': parking.name,
                        'address': parking.address
                    })
                    
                    # Obtener sectores de este parking
                    sectores = Sectors.query.filter_by(idParking=parking.idParking).all()
                    for sector in sectores:
                        sectores_data.append({
                            'id': sector.idSector,
                            'name': sector.name,
                            'capacity': sector.capacity,
                            'parking_name': parking.name
                        })
        
        # Construir y devolver la respuesta
        return jsonify({
            'id': user.idUser,
            'success': True,
            'email': user.email,
            'phone': user.phone,
            'vehiculo_principal': user.main_vehicle if hasattr(user, 'main_vehicle') else '',
            'vehiculos_secundarios': vehiculos_secundarios,
            'is_admin': user.userRole == 'administrador',
            'parkings': parkings_data,
            'sectores': sectores_data
        }), 200
    
    except Exception as e:
        print(f"Error al obtener datos del usuario: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error al obtener datos del usuario: {str(e)}'
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
    
def get_db_connection():
    conn = psycopg2.connect(
    host="localhost",
    database="postgres",
    user="postgres",
    password="qwerty"
    )
    conn.cursor_factory = RealDictCursor
    return conn

# SECTORES

@app.route('/api/datos_Sector', methods=['POST'])
def datos_Sector():
    try:
        # Obtener valores desde el formulario
        nombre = request.form.get('name')
        horario_apertura = request.form.get('HorarioApertura')
        horario_cierre = request.form.get('HorarioCierre')
        cocheras_disponibles = request.form.get('CocherasDisponibles')
        cocheras_libres = request.form.get('CocherasLibres')
        nombre_anterior = request.form.get('nombre_anterior')

        if not nombre or not nombre_anterior:
            return jsonify({'message': 'El nombre del sector es requerido', 'success': False}), 400

        # Verificar si los valores numéricos son válidos
        try:
            horario_apertura = int(horario_apertura) if horario_apertura else None
            horario_cierre = int(horario_cierre) if horario_cierre else None
            cocheras_disponibles = int(cocheras_disponibles) if cocheras_disponibles else 0
            cocheras_libres = int(cocheras_libres) if cocheras_libres else 0
        except ValueError:
            return jsonify({'message': 'Los valores numéricos son inválidos', 'success': False}), 400

        # Buscar el sector por el nombre anterior
        sector = Sectors.query.filter_by(nameSec=nombre_anterior).first()

        if not sector:
            return jsonify({'message': 'Sector no encontrado', 'success': False}), 404

        # Guardar el ID del sector y establecimiento antes de cualquier modificación
        sector_id = sector.idSector
        establishment_id = sector.idEstablishment
        
        # Obtener el establecimiento
        establecimiento = Establishment.query.get(establishment_id)
        if not establecimiento:
            return jsonify({'message': 'Establecimiento no encontrado', 'success': False}), 404
        
        # Obtener el número actual de cocheras disponibles antes de actualizar
        old_available_spots = sector.availableParkingSpots
        
        # Actualizar datos del sector
        sector.nameSec = nombre
        sector.openingHour = horario_apertura
        sector.closingHour = horario_cierre
        sector.availableParkingSpots = cocheras_disponibles
        sector.freeParkingSpots = abs(cocheras_libres)

        # Obtener todas las cocheras existentes para este sector
        existing_spots = ParkingSpot.query.filter_by(idSector=sector_id).all()
        existing_spot_numbers = [spot.spotNumber for spot in existing_spots]
        
        # Si el número de cocheras disponibles es mayor que antes, crear nuevas cocheras
        if cocheras_disponibles > old_available_spots:
            # Crear nuevas cocheras para los números que no existen
            for spot_number in range(1, cocheras_disponibles + 1):
                if spot_number not in existing_spot_numbers:
                    # Crear nueva cochera como libre (estado=False)
                    new_spot = ParkingSpot(
                        idSector=sector_id,
                        spotNumber=spot_number,
                        isOccupied=False,  # Cochera libre por defecto
                        idVehicle=None  # Sin vehículo asignado
                    )
                    db.session.add(new_spot)
                    print(f"Creando nueva cochera: {spot_number} en sector {sector_id}")
        
        # Si el número de cocheras disponibles es menor que antes, eliminar las cocheras sobrantes
        elif cocheras_disponibles < old_available_spots:
            # Obtener las cocheras a eliminar (las que tienen número mayor al nuevo límite)
            spots_to_remove = [spot for spot in existing_spots if spot.spotNumber > cocheras_disponibles]
            
            # Solo eliminar cocheras que no estén ocupadas
            for spot in spots_to_remove:
                if not spot.isOccupied:  # Si la cochera está libre
                    db.session.delete(spot)
                    print(f"Eliminando cochera: {spot.spotNumber} en sector {sector_id}")
                else:
                    # Si hay cocheras ocupadas que deberían eliminarse, notificar pero mantenerlas
                    print(f"No se puede eliminar cochera ocupada: {spot.spotNumber}")
        
        # Recalcular plazas libres para asegurar consistencia
        occupied_spots = ParkingSpot.query.filter_by(idSector=sector_id, isOccupied=True).count()
        total_spots = min(cocheras_disponibles, len(existing_spots))
        sector.freeParkingSpots = total_spots - occupied_spots
        
        # Actualizar el total de cocheras en el establecimiento
        # Calculamos la diferencia entre el nuevo y el antiguo valor
        spots_difference = cocheras_disponibles - old_available_spots
        establecimiento.totalParkingSpots += spots_difference
        
        # Guardar cambios en la base de datos
        db.session.commit()

        return jsonify({
            'message': 'Datos del sector actualizados correctamente',
            'success': True
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error en datos_Sector: {str(e)}")
        return jsonify({
            'message': f'Error al actualizar datos del sector: {str(e)}',
            'success': False
        }), 500

@app.route('/api/crear_sector', methods=['POST'])
def crear_sector():
    try:
        # Obtener datos del cuerpo de la petición (puede ser JSON o form-data)
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form
            
        # Obtener valores
        sector_name = data.get('sector')
        establecimiento_name = data.get('establecimiento')
        opening_hour = data.get('horarioApertura')
        closing_hour = data.get('horarioCierre')
        available_spots = data.get('cocherasDisponibles', 0)
        
        # Validación básica
        if not sector_name or not establecimiento_name:
            return jsonify({
                'success': False,
                'message': 'Nombre de sector y establecimiento son obligatorios'
            }), 400
            
        # Convertir a entero si es necesario
        try:
            available_spots = int(available_spots)
        except (ValueError, TypeError):
            available_spots = 0
            
        # Buscar el establecimiento
        establecimiento_obj = Establishment.query.filter_by(nameEst=establecimiento_name).first()
        
        # Verificar si el establecimiento existe
        if not establecimiento_obj:
            return jsonify({
                'success': False,
                'message': f'El establecimiento "{establecimiento_name}" no existe'
            }), 404
            
        # Comprobar si el sector ya existe
        existing_sector = Sectors.query.filter_by(
            nameSec=sector_name,
            idEstablishment=establecimiento_obj.idEstablishment
        ).first()
        
        if existing_sector:
            return jsonify({
                'success': False,
                'message': f'Ya existe un sector con el nombre "{sector_name}" en este establecimiento'
            }), 409
            
        # Crear nuevo sector
        new_sector = Sectors(
            nameSec=sector_name,
            idEstablishment=establecimiento_obj.idEstablishment,
            openingHour=opening_hour,
            closingHour=closing_hour,
            availableParkingSpots=available_spots,
            freeParkingSpots=available_spots  # Cocheras libres igual a disponibles
        )
        
        db.session.add(new_sector)
        db.session.flush()  # Para obtener el ID asignado
        
        # Crear la relación en SectorEstablishment
        sector_est = SectorEstablishment(
            idSector=new_sector.idSector,
            idEstablishment=establecimiento_obj.idEstablishment
        )
        db.session.add(sector_est)
        
        # CORRECCIÓN: Actualizar contador de sectores en el establecimiento
        # En lugar de contar y sumar 1, incrementamos directamente el contador
        establecimiento_obj.totalSectors += 1
        
        # NUEVO: Actualizar el total de cocheras disponibles en el establecimiento
        establecimiento_obj.totalParkingSpots += available_spots
        
        # Crear las plazas de estacionamiento para este sector
        for spot_number in range(1, available_spots + 1):
            new_spot = ParkingSpot(
                idSector=new_sector.idSector,
                spotNumber=spot_number,
                isOccupied=False,  # Cochera libre por defecto
                idVehicle=None  # Sin vehículo asignado
            )
            db.session.add(new_spot)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Sector creado correctamente',
            'sectorId': new_sector.idSector
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error al crear sector: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error al crear sector: {str(e)}'
        }), 500  
       
@app.route('/api/actualizar_sector/<string:nombre_sector>', methods=['PUT'])
@jwt_required()
def actualizar_sector(nombre_sector):
    try:
        # Obtener los datos del cuerpo de la solicitud
        datos = request.json
        
        # Verificar que todos los campos necesarios estén presentes
        if not all(key in datos for key in ['nameSec', 'availableParkingSpots', 'openingHour', 'closingHour']):
            return jsonify({
                'success': False,
                'message': 'Faltan campos requeridos'
            }), 400
        
        # Buscar el sector por su nombre actual
        sector = Sectors.query.filter_by(nameSec=nombre_sector).first()
        
        if not sector:
            return jsonify({
                'success': False,
                'message': f'No se encontró el sector con nombre: {nombre_sector}'
            }), 404
        
        # Obtener el establecimiento asociado
        establecimiento = Establishment.query.get(sector.idEstablishment)
        if not establecimiento:
            return jsonify({
                'success': False,
                'message': 'Establecimiento asociado no encontrado'
            }), 404
        
        # Calcular la diferencia de cocheras para actualizar el establecimiento
        spots_difference = int(datos['availableParkingSpots']) - sector.availableParkingSpots
        
        # Actualizar los campos del sector
        sector.nameSec = datos['nameSec']
        sector.availableParkingSpots = int(datos['availableParkingSpots'])
        sector.freeParkingSpots = int(datos['availableParkingSpots'])  # Asumimos que todas son libres inicialmente
        sector.openingHour = datos['openingHour']
        sector.closingHour = datos['closingHour']
        
        # Actualizar el total de cocheras en el establecimiento
        establecimiento.totalParkingSpots += spots_difference
        
        # Actualizar las plazas de estacionamiento
        old_spots = ParkingSpot.query.filter_by(idSector=sector.idSector).all()
        old_spot_count = len(old_spots)
        new_spot_count = int(datos['availableParkingSpots'])
        
        # Si necesitamos más plazas
        if new_spot_count > old_spot_count:
            for spot_number in range(old_spot_count + 1, new_spot_count + 1):
                new_spot = ParkingSpot(
                    idSector=sector.idSector,
                    spotNumber=spot_number,
                    isOccupied=False,
                    idVehicle=None
                )
                db.session.add(new_spot)
        
        # Si necesitamos menos plazas, eliminar las que sobran (solo si no están ocupadas)
        elif new_spot_count < old_spot_count:
            spots_to_remove = [spot for spot in old_spots if spot.spotNumber > new_spot_count]
            for spot in spots_to_remove:
                if not spot.isOccupied:
                    db.session.delete(spot)
        
        # Guardar los cambios en la base de datos
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Sector actualizado correctamente'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error en actualizar_sector: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error al actualizar el sector: {str(e)}'
        }), 500
    
@app.route('/api/borrar_sector/<nameSec>', methods=['DELETE'])
def borrar_sector(nameSec):
    try:
        # Buscar el sector
        sector = Sectors.query.filter_by(nameSec=nameSec).first()

        if not sector:
            return jsonify({
                'success': False,
                'message': f'Sector con nombre "{nameSec}" no encontrado'
            }), 404
        
        # Obtener datos importantes antes de borrar
        sector_id = sector.idSector
        establishment_id = sector.idEstablishment
        available_spots = sector.availableParkingSpots
        
        # Buscar el establecimiento
        establecimiento = Establishment.query.get(establishment_id)
        
        # IMPORTANTE: Eliminar primero todas las cocheras asociadas al sector
        # porque idSector es parte de la clave primaria de parking_spot
        parking_spots = ParkingSpot.query.filter_by(idSector=sector_id).all()
        for spot in parking_spots:
            db.session.delete(spot)
        
        # Eliminar registros de SectorEstablishment relacionados
        sector_est = SectorEstablishment.query.filter_by(idSector=sector_id).first()
        if sector_est:
            db.session.delete(sector_est)
        
        # Ahora borrar el sector
        db.session.delete(sector)
        
        # Actualizar los contadores del establecimiento si existe
        if establecimiento:
            establecimiento.totalSectors -= 1
            establecimiento.totalParkingSpots -= available_spots
        
        # Guardar los cambios
        db.session.commit()

        return jsonify({
            'success': True,
            'message': f'Sector "{nameSec}" borrado exitosamente'
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error al borrar sector: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error al borrar sector: {str(e)}'
        }), 500
    
@app.route('/api/sectores', methods=['GET'])
def listar_sectores():
    try:
        # Utilizar join para obtener la información del establecimiento junto con los sectores
        sectores = db.session.query(Sectors, Establishment.nameEst)\
            .join(Establishment, Sectors.idEstablishment == Establishment.idEstablishment)\
            .all()
        
        resultado = []
        
        for sector, nombre_establecimiento in sectores:
            # Convertimos los objetos time a strings en formato HH:MM
            opening_hour_str = sector.openingHour.strftime('%H:%M') if hasattr(sector.openingHour, 'strftime') else str(sector.openingHour)
            closing_hour_str = sector.closingHour.strftime('%H:%M') if hasattr(sector.closingHour, 'strftime') else str(sector.closingHour)
            
            resultado.append({
                "idSector": sector.idSector,
                "nameSec": sector.nameSec,
                "openingHour": opening_hour_str,
                "closingHour": closing_hour_str,
                "availableParkingSpots": sector.availableParkingSpots,
                "freeParkingSpots": sector.freeParkingSpots,
                "establishmentName": nombre_establecimiento  # Añadir el nombre del establecimiento
            })
        
        return jsonify({
            "sectors": resultado,
            "success": True
        })
    except Exception as e:
        print(f"Error al listar sectores: {str(e)}")
        return jsonify({
            "error": f"Error interno del servidor: {str(e)}",
            "success": False
        }), 500
    

@app.route('/api/sector/<string:nombre_sector>', methods=['GET'])
def obtener_sector_por_nombre(nombre_sector):
    try:
        # Buscar el sector por su nombre
        sector = Sectors.query.filter_by(nameSec=nombre_sector).first()
        
        if not sector:
            return jsonify({
                'success': False,
                'message': f'Sector con nombre "{nombre_sector}" no encontrado'
            }), 404
        
        # Convertimos los objetos time a strings en formato HH:MM
        opening_hour_str = sector.openingHour.strftime('%H:%M') if hasattr(sector.openingHour, 'strftime') else str(sector.openingHour)
        closing_hour_str = sector.closingHour.strftime('%H:%M') if hasattr(sector.closingHour, 'strftime') else str(sector.closingHour)
        
        # Construir el objeto de respuesta usando los nombres exactos de las columnas
        sector_data = {
            'idSector': sector.idSector,
            'idEstablishment': sector.idEstablishment,
            'nameSec': sector.nameSec,
            'openingHour': opening_hour_str,
            'closingHour': closing_hour_str,
            'availableParkingSpots': sector.availableParkingSpots,
            'freeParkingSpots': sector.freeParkingSpots
        }
        
        return jsonify({
            'success': True,
            'sector': sector_data,
            'message': 'Sector obtenido exitosamente'
        }), 200
        
    except Exception as e:
        print(f"Error al obtener el sector: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error al obtener el sector: {str(e)}'
        }), 500

#-----------------------#
# ESTABLECIMIENTOS      #
#-----------------------#

# Mejorar la ruta para crear establecimiento
@app.route('/api/crear_establecimiento', methods=['POST'])
@jwt_required()
def crear_establecimiento():
    try:
        # Comprobar si los datos vienen como JSON o como formulario
        if request.is_json:
            datos = request.get_json()
            nombre_establecimiento = datos.get('nameEst')
            total_sectors = datos.get('totalSectors', 3)
            total_parking_spots = datos.get('totalParkingSpots', 3)
            geographic_location = datos.get('geographicLocation', 'unknown')
        else:
            nombre_establecimiento = request.form.get('establecimiento')
            total_sectors = request.form.get('totalSectors', 3)
            total_parking_spots = request.form.get('totalParkingSpots', 3)
            geographic_location = request.form.get('geographicLocation', 'unknown')
        
        # Convertir a enteros si es necesario
        try:
            total_sectors = int(total_sectors)
            total_parking_spots = int(total_parking_spots)
        except (ValueError, TypeError):
            total_sectors = 3
            total_parking_spots = 3
        
        if nombre_establecimiento:
            # Verificar si el establecimiento ya existe
            establecimiento_existente = Establishment.query.filter_by(nameEst=nombre_establecimiento).first()
            
            if establecimiento_existente:
                return jsonify({
                    'success': False,
                    'message': 'Ya existe un establecimiento con ese nombre'
                }), 400
            
            # Crear el nuevo establecimiento
            nuevo_establecimiento = Establishment(
                nameEst=nombre_establecimiento,
                totalParkingSpots=total_parking_spots,
                totalSectors=total_sectors,
                geographicLocation=geographic_location
            )
            
            db.session.add(nuevo_establecimiento)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Establecimiento creado correctamente',
                'establishment': {
                    'idEst': nuevo_establecimiento.idEstablishment,
                    'nameEst': nuevo_establecimiento.nameEst,
                    'totalSectors': nuevo_establecimiento.totalSectors,
                    'totalParkingSpots': nuevo_establecimiento.totalParkingSpots,
                    'geographicLocation': nuevo_establecimiento.geographicLocation
                }
            }), 201
        else:
            return jsonify({
                'success': False,
                'message': 'Nombre de establecimiento no proporcionado'
            }), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error al crear establecimiento: {str(e)}'
        }), 500

@app.route('/api/establecimientos', methods=['GET'])
@jwt_required()
def obtener_establecimientos():
    try:
        # Obtener todos los establecimientos
        establecimientos = Establishment.query.all()
        
        # Formatear la respuesta
        establecimientos_data = []
        for est in establecimientos:
            establecimientos_data.append({
                'idEst': est.idEstablishment,
                'nameEst': est.nameEst,
                'totalSectors': est.totalSectors,
                'totalParkingSpots': est.totalParkingSpots,
                'geographicLocation': est.geographicLocation
            })
        
        return jsonify({
            'success': True,
            'establishments': establecimientos_data
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error al obtener establecimientos: {str(e)}'
        }), 500

# Ruta para obtener un establecimiento específico
@app.route('/api/establecimiento/<string:nombre>', methods=['GET'])
@jwt_required()
def obtener_establecimiento(nombre):
    try:
        # Buscar el establecimiento por nombre
        establecimiento = Establishment.query.filter_by(nameEst=nombre).first()
        
        if not establecimiento:
            return jsonify({
                'success': False,
                'message': 'Establecimiento no encontrado'
            }), 404
        
        # Formatear la respuesta
        establecimiento_data = {
            'idEst': establecimiento.idEstablishment,
            'nameEst': establecimiento.nameEst,
            'totalSectors': establecimiento.totalSectors,
            'totalParkingSpots': establecimiento.totalParkingSpots,
            'geographicLocation': establecimiento.geographicLocation
        }
        
        return jsonify({
            'success': True,
            'establishment': establecimiento_data
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error al obtener establecimiento: {str(e)}'
        }), 500

# Ruta para actualizar un establecimiento
@app.route('/api/actualizar_establecimiento/<string:nombre>', methods=['PUT'])
@jwt_required()
def actualizar_establecimiento(nombre):
    try:
        # Obtener los datos del cuerpo de la solicitud
        datos = request.get_json()
        
        if not datos:
            return jsonify({
                'success': False,
                'message': 'No se recibieron datos para actualizar'
            }), 400
        
        # Buscar el establecimiento por nombre
        establecimiento = Establishment.query.filter_by(nameEst=nombre).first()
        
        if not establecimiento:
            return jsonify({
                'success': False,
                'message': 'Establecimiento no encontrado'
            }), 404
        
        # Actualizar los campos del establecimiento
        if 'nameEst' in datos:
            establecimiento.nameEst = datos['nameEst']
        if 'totalSectors' in datos:
            establecimiento.totalSectors = datos['totalSectors']
        if 'totalParkingSpots' in datos:
            establecimiento.totalParkingSpots = datos['totalParkingSpots']
        if 'geographicLocation' in datos:
            establecimiento.geographicLocation = datos['geographicLocation']
        
        # Guardar los cambios en la base de datos
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Establecimiento actualizado correctamente'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error al actualizar establecimiento: {str(e)}'
        }), 500

# Ruta para eliminar un establecimiento
@app.route('/api/borrar_establecimiento/<string:nombre>', methods=['DELETE'])
@jwt_required()
def borrar_establecimiento(nombre):
    try:
        # Buscar el establecimiento por nombre
        establecimiento = Establishment.query.filter_by(nameEst=nombre).first()
        
        if not establecimiento:
            return jsonify({
                'success': False,
                'message': 'Establecimiento no encontrado'
            }), 404
        
        # Eliminar relaciones primero (sectores asociados)
        SectorEstablishment.query.filter_by(idEstablishment=establecimiento.idEstablishment).delete()
        
        # Eliminar el establecimiento
        db.session.delete(establecimiento)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Establecimiento eliminado correctamente'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error al eliminar establecimiento: {str(e)}'
        }), 500

#-----------------------#
# VEHICULOS             #
#-----------------------#

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
   
# VEHICULOS - DETALLES

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

# COCHERAS  

@app.route('/api/cocheras/<sector>', methods=['GET'])
def get_cocheras_by_sector(sector):
    try:
        # Normalizar el nombre del sector (primera letra mayúscula, resto minúsculas)
        sector_name = sector.capitalize()
        
        # Obtener el sector de la base de datos
        sector_obj = Sectors.query.filter_by(nameSec=sector_name).first()
        
        if not sector_obj:
            return jsonify({
                'success': False,
                'message': f'El sector {sector_name} no existe'
            }), 404
        
        # Obtener todas las cocheras (parking spots) del sector
        parking_spots = ParkingSpot.query.filter_by(idSector=sector_obj.idSector).all()
        
        # Si no hay cocheras, devolver una lista vacía
        if not parking_spots:
            return jsonify({
                'success': True,
                'cocheras': [],
                'total': 0
            })
        
        # Crear una lista con todas las cocheras disponibles para el sector
        cocheras = []
        
        # Para cada cochera existente, agregamos su información
        for spot in parking_spots:
            cocheras.append({
                'numero': spot.spotNumber,
                'ocupado': spot.isOccupied
            })
        
        # Si hay menos cocheras que plazas disponibles, agregar las que faltan como libres
        total_spots = sector_obj.availableParkingSpots
        existing_spots = [spot['numero'] for spot in cocheras]
        
        for i in range(1, total_spots + 1):
            if i not in existing_spots:
                cocheras.append({
                    'numero': i,
                    'ocupado': False
                })
        
        # Ordenar las cocheras por número
        cocheras = sorted(cocheras, key=lambda x: int(x['numero']))
        
        return jsonify({
            'success': True,
            'cocheras': cocheras,
            'total': len(cocheras)
        })
        
    except Exception as e:
        # Agregar más detalles del error para depuración
        app.logger.error(f"Error en get_cocheras_by_sector: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error al obtener cocheras: {str(e)}'
        }), 500

# Ruta para obtener información de una cochera específica
@app.route('/api/cocheras/<sector>/<cochera>', methods=['GET'])
def get_cochera_info(sector, cochera):
    try:
        # Normalizar el nombre del sector
        sector_name = sector.capitalize()
        
        # Obtener el sector de la base de datos
        sector_obj = Sectors.query.filter_by(nameSec=sector_name).first()
        
        if not sector_obj:
            return jsonify({
                'success': False,
                'message': f'El sector {sector_name} no existe'
            }), 404
        
        # Convertir cochera a int
        cochera_num = int(cochera)
        
        # Buscar la cochera específica
        parking_spot = ParkingSpot.query.filter_by(
            idSector=sector_obj.idSector,
            spotNumber=cochera_num
        ).first()
        
        # Si la cochera no existe en la base de datos, considerarla como libre
        if not parking_spot:
            return jsonify({
                'success': False,
                'message': 'Cochera no encontrada en la base de datos',
                'ocupado': False
            })
        
        # Si la cochera existe, devolver su estado
        return jsonify({
            'success': True,
            'sector': sector_name,
            'cochera': cochera,
            'ocupado': parking_spot.isOccupied,
            'id_vehicle': parking_spot.idVehicle if parking_spot.isOccupied else None
        })
        
    except Exception as e:
        app.logger.error(f"Error en get_cochera_info: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error al obtener información de la cochera: {str(e)}'
        }), 500

# Ruta para registrar una cochera nueva
@app.route('/api/registrar_cochera', methods=['POST'])
def registrar_cochera():
    try:
        sector = request.form.get('sector')
        cochera = request.form.get('cochera')
        user_id = request.form.get('user_id')  # Añadido: obtener el ID del usuario
        
        if not sector or not cochera:
            return jsonify({
                'success': False,
                'message': 'Faltan datos requeridos'
            }), 400
        
        # Normalizar el nombre del sector
        sector_name = sector.capitalize()
        
        # Obtener el sector
        sector_obj = Sectors.query.filter_by(nameSec=sector_name).first()
        
        if not sector_obj:
            return jsonify({
                'success': False,
                'message': f'El sector {sector_name} no existe'
            }), 404
        
        # Convertir cochera a int
        cochera_num = int(cochera)
        
        # Verificar si la cochera ya existe
        existing_spot = ParkingSpot.query.filter_by(
            idSector=sector_obj.idSector,
            spotNumber=cochera_num
        ).first()
        
        if existing_spot:
            return jsonify({
                'success': False,
                'message': 'La cochera ya existe'
            }), 400
        
        # Crear la cochera como no ocupada
        new_spot = ParkingSpot(
            spotNumber=cochera_num,
            isOccupied=False,
            idSector=sector_obj.idSector,
            idVehicle=None
        )
        
        db.session.add(new_spot)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Cochera registrada correctamente'
        })
        
    except Exception as e:
        app.logger.error(f"Error al registrar cochera: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error al registrar cochera: {str(e)}'
        }), 500
    
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
                "Comedor": 0,
                "IAE": 0,
                "Medicina": 0,
                "Olivo": 0,
                "Profesores": 0
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

@app.route('/api/vehiculo/<patente>', methods=['GET'])
def get_vehiculo_by_patente(patente):
    try:
        # Normalizar patente (mayúsculas y sin espacios)
        patente_normalizada = patente.strip().upper()
        
        # Buscar vehículo por patente (que es el idVehicle)
        vehiculo = Vehicle.query.filter_by(idVehicle=patente_normalizada).first()
        
        if not vehiculo:
            return jsonify({
                'success': False,
                'message': f'Vehículo con patente {patente_normalizada} no encontrado'
            }), 404
        
        return jsonify({
            'success': True,
            'vehiculo': {
                'idVehicle': vehiculo.idVehicle,
                'brand': vehiculo.brand,
                'model': vehiculo.model
            }
        })
        
    except Exception as e:
        app.logger.error(f"Error al buscar vehículo: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error al buscar vehículo: {str(e)}'
        }), 500 

# PARKING SPOTS

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
        relacion = ParkingSpot.query.filter_by(
            idParkingSpot=cochera.idParkingSpot
        ).first()

        if not relacion:
            # Crear la relación sector - cochera
            nueva_relacion = ParkingSpot(
                idParkingSpot=cochera.idParkingSpot,
                idVehicle=None  # Inicialmente ninguna relación a vehículo
            )
            db.session.add(nueva_relacion)

        db.session.commit()

        return jsonify({'success': True, 'message': 'Cochera actualizada correctamente'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500   

@app.route('/api/user-parked-vehicle', methods=['GET'])
def get_user_parked_vehicle():
    """
    Obtiene la información de dónde está estacionado el vehículo principal del usuario
    """
    try:
        # Obtener el user_id de los parámetros de la query
        user_id = request.args.get('user_id')
        
        if not user_id:
            return jsonify({
                'success': False,
                'message': 'ID de usuario requerido'
            }), 400
        
        # Convertir user_id a entero
        try:
            user_id = int(user_id)
        except ValueError:
            return jsonify({
                'success': False,
                'message': 'ID de usuario inválido'
            }), 400
        
        # Obtener el vehículo principal del usuario
        primary_vehicle = db.session.query(Vehicle).join(
            Owns, Vehicle.idVehicle == Owns.idVehicle
        ).filter(
            Owns.idUser == user_id,
            Owns.is_primary == True
        ).first()
        
        if not primary_vehicle:
            return jsonify({
                'success': False,
                'message': 'El usuario no tiene un vehículo principal registrado',
                'has_vehicle': False
            }), 404
        
        # Buscar si el vehículo está estacionado en alguna cochera
        occupied_spot = ParkingSpot.query.filter_by(
            idVehicle=primary_vehicle.idVehicle,
            isOccupied=True
        ).first()
        
        if not occupied_spot:
            return jsonify({
                'success': False,
                'message': 'El vehículo no está estacionado en ninguna cochera',
                'has_vehicle': True,
                'is_parked': False
            })
        
        # Obtener información del sector
        sector_info = Sectors.query.filter_by(idSector=occupied_spot.idSector).first()
        
        if not sector_info:
            return jsonify({
                'success': False,
                'message': 'Error: sector no encontrado',
                'has_vehicle': True,
                'is_parked': True
            }), 500
        
        return jsonify({
            'success': True,
            'message': 'Vehículo encontrado',
            'has_vehicle': True,
            'is_parked': True,
            'parking_info': {
                'sector': sector_info.nameSec,
                'cochera': occupied_spot.spotNumber,
                'vehicle_info': {
                    'idVehicle': primary_vehicle.idVehicle,
                    'brand': primary_vehicle.brand,
                    'model': primary_vehicle.model,
                    'checkInTime': primary_vehicle.checkInTime.isoformat() if primary_vehicle.checkInTime else None
                }
            }
        })
        
    except Exception as e:
        app.logger.error(f"Error en get_user_parked_vehicle: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error al obtener información del vehículo: {str(e)}'
        }), 500

# Ruta para marcar llegada (ocupar cochera)
@app.route('/api/marcar_llegada', methods=['POST'])
def marcar_llegada():
    try:
        sector = request.form.get('sector')
        cochera = request.form.get('numero')
        user_id = request.form.get('user_id')
        
        if not sector or not cochera or not user_id:
            return jsonify({
                'success': False,
                'message': 'Faltan datos requeridos: sector, número de cochera y/o ID de usuario'
            }), 400
        
        # Convertir user_id a entero
        try:
            user_id = int(user_id)
        except ValueError:
            return jsonify({
                'success': False,
                'message': 'ID de usuario inválido'
            }), 400
        
        # Normalizar el nombre del sector
        sector_name = sector.capitalize()
        
        # Obtener el sector
        sector_obj = Sectors.query.filter_by(nameSec=sector_name).first()
        
        if not sector_obj:
            return jsonify({
                'success': False,
                'message': f'El sector {sector_name} no existe'
            }), 404
        
        # Convertir cochera a int
        cochera_num = int(cochera)
        
        # Obtener el vehículo principal del usuario
        primary_vehicle = db.session.query(Vehicle).join(
            Owns, Vehicle.idVehicle == Owns.idVehicle
        ).filter(
            Owns.idUser == user_id,
            Owns.is_primary == True
        ).first()
        
        if not primary_vehicle:
            return jsonify({
                'success': False,
                'message': 'El usuario no tiene un vehículo principal registrado'
            }), 404
        
        # *** NUEVA VERIFICACIÓN: Comprobar si el vehículo ya está estacionado en cualquier sector ***
        occupied_spot = ParkingSpot.query.filter_by(
            idVehicle=primary_vehicle.idVehicle,
            isOccupied=True
        ).first()
        
        if occupied_spot:
            # Obtener información del sector donde está estacionado
            occupied_sector = Sectors.query.filter_by(idSector=occupied_spot.idSector).first()
            sector_name_occupied = occupied_sector.nameSec if occupied_sector else "Desconocido"
            
            return jsonify({
                'success': False,
                'message': f'Tu vehículo ya está estacionado en el sector {sector_name_occupied}, cochera {occupied_spot.spotNumber}. Debes registrar la salida primero.'
            }), 400
        
        # Verificar si la cochera específica existe
        parking_spot = ParkingSpot.query.filter_by(
            idSector=sector_obj.idSector,
            spotNumber=cochera_num
        ).first()
        
        # Iniciar transacción
        try:
            # Si la cochera no existe, crearla
            if not parking_spot:
                # Verificar disponibilidad antes de crear
                if sector_obj.freeParkingSpots <= 0:
                    return jsonify({
                        'success': False,
                        'message': 'No hay plazas disponibles en este sector'
                    }), 400
                
                # Crear la cochera como ocupada con el vehículo del usuario
                parking_spot = ParkingSpot(
                    spotNumber=cochera_num,
                    isOccupied=True,
                    idSector=sector_obj.idSector,
                    idVehicle=primary_vehicle.idVehicle
                )
                
                db.session.add(parking_spot)
                
                # Actualizar contador de plazas libres en el sector
                sector_obj.freeParkingSpots = sector_obj.freeParkingSpots - 1
                
            else:
                # Si la cochera ya existe y está ocupada, error
                if parking_spot.isOccupied:
                    return jsonify({
                        'success': False,
                        'message': 'La cochera ya está ocupada'
                    }), 400
                
                # Verificar disponibilidad antes de ocupar
                if sector_obj.freeParkingSpots <= 0:
                    return jsonify({
                        'success': False,
                        'message': 'No hay plazas disponibles en este sector'
                    }), 400
                
                # Si la cochera existe pero está libre, marcarla como ocupada
                parking_spot.isOccupied = True
                parking_spot.idVehicle = primary_vehicle.idVehicle
                
                # Actualizar contador de plazas libres en el sector
                sector_obj.freeParkingSpots = sector_obj.freeParkingSpots - 1
            
            # Actualizar el tiempo de check-in del vehículo
            primary_vehicle.checkInTime = db.func.current_timestamp()
            primary_vehicle.checkOutTime = None  # Resetear el tiempo de salida
            
            # Confirmar cambios
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Llegada registrada correctamente'
            })
            
        except Exception as inner_e:
            db.session.rollback()
            app.logger.error(f"Error en transacción marcar_llegada: {str(inner_e)}")
            return jsonify({
                'success': False,
                'message': f'Error al procesar la transacción: {str(inner_e)}'
            }), 500
        
    except Exception as e:
        app.logger.error(f"Error general en marcar_llegada: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error al marcar llegada: {str(e)}'
        }), 500

# Ruta para marcar salida (liberar cochera)
@app.route('/api/marcar_salida', methods=['POST'])
def marcar_salida():
    try:
        sector = request.form.get('sector')
        cochera = request.form.get('numero')
        user_id = request.form.get('user_id')  # Añadido: obtener el ID del usuario
        
        if not sector or not cochera:
            return jsonify({
                'success': False,
                'message': 'Faltan datos requeridos'
            }), 400
        
        # Normalizar el nombre del sector
        sector_name = sector.capitalize()
        
        # Obtener el sector
        sector_obj = Sectors.query.filter_by(nameSec=sector_name).first()
        
        if not sector_obj:
            return jsonify({
                'success': False,
                'message': f'El sector {sector_name} no existe'
            }), 404
        
        # Convertir cochera a int
        cochera_num = int(cochera)
        
        # Verificar si la cochera existe
        parking_spot = ParkingSpot.query.filter_by(
            idSector=sector_obj.idSector,
            spotNumber=cochera_num
        ).first()
        
        if not parking_spot:
            return jsonify({
                'success': False,
                'message': 'La cochera no existe'
            }), 404
        
        # Si la cochera no está ocupada, error
        if not parking_spot.isOccupied:
            return jsonify({
                'success': False,
                'message': 'La cochera no está ocupada'
            }), 400
        
        # Si el user_id está presente, verificar que el vehículo le pertenezca
        if user_id:
            try:
                user_id = int(user_id)
                
                # Verificar si el vehículo de la cochera es del usuario
                is_users_vehicle = db.session.query(Owns).filter(
                    Owns.idUser == user_id, 
                    Owns.idVehicle == parking_spot.idVehicle
                ).first()
                
                if not is_users_vehicle:
                    return jsonify({
                        'success': False,
                        'message': 'Este vehículo no pertenece al usuario'
                    }), 403
            except ValueError:
                return jsonify({
                    'success': False,
                    'message': 'ID de usuario inválido'
                }), 400
        
        # Iniciar transacción
        try:
            # Obtener el vehículo asociado
            vehicle = Vehicle.query.filter_by(idVehicle=parking_spot.idVehicle).first()
            
            if vehicle:
                # Registrar la hora de salida
                vehicle.checkOutTime = db.func.current_timestamp()
            
            # Liberar la cochera
            parking_spot.isOccupied = False
            parking_spot.idVehicle = None
            
            # Actualizar contador de plazas libres en el sector
            sector_obj.freeParkingSpots = sector_obj.freeParkingSpots + 1
            
            # Confirmar cambios
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Salida registrada correctamente'
            })
            
        except Exception as inner_e:
            db.session.rollback()
            app.logger.error(f"Error en transacción marcar_salida: {str(inner_e)}")
            return jsonify({
                'success': False,
                'message': f'Error al procesar la transacción: {str(inner_e)}'
            }), 500
        
    except Exception as e:
        app.logger.error(f"Error general en marcar_salida: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error al marcar salida: {str(e)}'
        }), 500

@app.route('/api/marcar_llegada_patente', methods=['POST'])
@jwt_required()
def marcar_llegada_patente():

    current_user = get_jwt_identity()
    if current_user['userRole'] != 'administrador':
        return jsonify({
            'success': False,
            'message': 'No tienes permisos de administrador'
        }), 403
    
    try:
        sector = request.form.get('sector')
        cochera = request.form.get('cochera')
        patente = request.form.get('patente')
        
        if not sector or not cochera or not patente:
            return jsonify({
                'success': False,
                'message': 'Faltan datos requeridos'
            }), 400
        
        # Normalizar datos
        sector_name = sector.capitalize()
        cochera_num = int(cochera)
        patente_normalizada = patente.strip().upper()
        
        # Verificar que el sector existe
        sector_obj = Sectors.query.filter_by(nameSec=sector_name).first()
        if not sector_obj:
            return jsonify({
                'success': False,
                'message': f'El sector {sector_name} no existe'
            }), 404
        
        # Verificar que el vehículo existe
        vehiculo = Vehicle.query.filter_by(idVehicle=patente_normalizada).first()
        if not vehiculo:
            return jsonify({
                'success': False,
                'message': f'Vehículo con patente {patente_normalizada} no encontrado'
            }), 404
        
        # Verificar si el vehículo ya está en alguna cochera
        cochera_ocupada = ParkingSpot.query.filter_by(idVehicle=patente_normalizada).first()
        if cochera_ocupada:
            return jsonify({
                'success': False,
                'message': f'El vehículo {patente_normalizada} ya está ocupando la cochera {cochera_ocupada.spotNumber} en sector {cochera_ocupada.sector.nameSec}'
            }), 400
        
        # Buscar o crear la cochera específica
        parking_spot = ParkingSpot.query.filter_by(
            idSector=sector_obj.idSector,
            spotNumber=cochera_num
        ).first()
        
        if not parking_spot:
            # Crear la cochera si no existe
            parking_spot = ParkingSpot(
                spotNumber=cochera_num,
                isOccupied=False,
                idSector=sector_obj.idSector,
                idVehicle=None
            )
            db.session.add(parking_spot)
        
        # Verificar si la cochera ya está ocupada
        if parking_spot.isOccupied:
            return jsonify({
                'success': False,
                'message': f'La cochera {cochera_num} ya está ocupada'
            }), 400
        
        # Marcar la cochera como ocupada
        parking_spot.isOccupied = True
        parking_spot.idVehicle = patente_normalizada
        
        # Actualizar tiempo de entrada del vehículo
        vehiculo.checkInTime = datetime.now()
        vehiculo.checkOutTime = None
        
        # Actualizar contador de cocheras libres del sector
        if sector_obj.freeParkingSpots > 0:
            sector_obj.freeParkingSpots -= 1
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Llegada registrada: {patente_normalizada} en cochera {cochera_num}, sector {sector_name}'
        })
        
    except Exception as e:
        app.logger.error(f"Error al marcar llegada: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error al marcar llegada: {str(e)}'
        }), 500

@app.route('/api/marcar_salida_admin', methods=['POST'])
@jwt_required()

def marcar_salida_admin():

    current_user = get_jwt_identity()
    if current_user['userRole'] != 'administrador':
        return jsonify({
            'success': False,
            'message': 'No tienes permisos de administrador'
        }), 403
    
    try:
        sector = request.form.get('sector')
        cochera = request.form.get('cochera')
        
        if not sector or not cochera:
            return jsonify({
                'success': False,
                'message': 'Faltan datos requeridos'
            }), 400
        
        # Normalizar el nombre del sector
        sector_name = sector.capitalize()
        
        # Obtener el sector
        sector_obj = Sectors.query.filter_by(nameSec=sector_name).first()
        
        if not sector_obj:
            return jsonify({
                'success': False,
                'message': f'El sector {sector_name} no existe'
            }), 404
        
        # Convertir cochera a int
        cochera_num = int(cochera)
        
        # Verificar si la cochera existe
        parking_spot = ParkingSpot.query.filter_by(
            idSector=sector_obj.idSector,
            spotNumber=cochera_num
        ).first()
        
        if not parking_spot:
            return jsonify({
                'success': False,
                'message': 'La cochera no existe'
            }), 404
        
        # Si la cochera no está ocupada, error
        if not parking_spot.isOccupied:
            return jsonify({
                'success': False,
                'message': 'La cochera no está ocupada'
            }), 400
        
        # Iniciar transacción
        try:
            # Obtener el vehículo asociado para registrar información
            vehicle = Vehicle.query.filter_by(idVehicle=parking_spot.idVehicle).first()
            patente_liberada = parking_spot.idVehicle  # Guardar para el mensaje
            
            if vehicle:
                # Registrar la hora de salida
                vehicle.checkOutTime = datetime.now()
            
            # Liberar la cochera
            parking_spot.isOccupied = False
            parking_spot.idVehicle = None
            
            # Actualizar contador de plazas libres en el sector
            sector_obj.freeParkingSpots = sector_obj.freeParkingSpots + 1
            
            # Confirmar cambios
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': f'Salida registrada correctamente. Vehículo {patente_liberada} liberado de cochera {cochera_num}, sector {sector_name}'
            })
            
        except Exception as inner_e:
            db.session.rollback()
            app.logger.error(f"Error en transacción marcar_salida_admin: {str(inner_e)}")
            return jsonify({
                'success': False,
                'message': f'Error al procesar la transacción: {str(inner_e)}'
            }), 500
        
    except Exception as e:
        app.logger.error(f"Error general en marcar_salida_admin: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error al marcar salida: {str(e)}'
        }), 500

# Ruta para validar si una patente existe
@app.route('/api/vehiculo/<patente>', methods=['GET'])
def obtener_vehiculo(patente):
    try:
        # Normalizar la patente (mayúsculas y sin espacios)
        patente_normalizada = patente.strip().upper()
        
        # Buscar el vehículo por patente
        vehicle = Vehicle.query.filter_by(licensePlate=patente_normalizada).first()
        
        if vehicle:
            return jsonify({
                'success': True,
                'vehicle': {
                    'idVehicle': vehicle.idVehicle,
                    'licensePlate': vehicle.licensePlate,
                    'brand': vehicle.brand,
                    'model': vehicle.model,
                    'color': vehicle.color
                }
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Vehículo no encontrado'
            }), 404
            
    except Exception as e:
        app.logger.error(f"Error al obtener vehículo: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error al buscar el vehículo: {str(e)}'
        }), 500

# Función para registrar este blueprint en la aplicación Flask
def register_api_routes(app):
    app.register_blueprint(app)

@app.route('/api/get_establishments', methods=['GET'])
@jwt_required()
def get_establishments():
    try:
        # Obtener el ID del usuario autenticado (si es necesario para filtrar por usuario)
        current_user_id = get_jwt_identity()
        
        establecimientos = Establishment.query.all()
        
        # Formatear los resultados según tu estructura de base de datos
        establecimientos_list = []
        for establecimiento in establecimientos:
            # Imprimir todos los atributos para debug
            app.logger.debug(f"Atributos del establecimiento: {establecimiento.__dict__}")
            
            # Intentar acceder al nombre del establecimiento usando diferentes posibles nombres de campo
            nombre_establecimiento = None
            campos_posibles = ['nameEst', 'nameEstablishment', 'name', 'nombreEstablecimiento', 'establishmentName']
            
            for campo in campos_posibles:
                if hasattr(establecimiento, campo) and getattr(establecimiento, campo):
                    nombre_establecimiento = getattr(establecimiento, campo)
                    break
            
            # Si no se encontró ningún nombre, usar el id como último recurso
            if not nombre_establecimiento:
                # Añadir log para depuración
                app.logger.warning(f"No se encontró nombre para el establecimiento ID: {establecimiento.idEstablishment}")
                app.logger.warning(f"Campos disponibles: {', '.join(establecimiento.__dict__.keys())}")
                nombre_establecimiento = f'Establecimiento {establecimiento.idEstablishment}'
            
            establecimiento_data = {
                'id': establecimiento.idEstablishment,
                'nombre': nombre_establecimiento,
                # Información adicional: número de sectores relacionados
                'sectores': len(getattr(establecimiento, 'sectors', [])) if hasattr(establecimiento, 'sectors') else 
                           Sectors.query.filter_by(idEstablishment=establecimiento.idEstablishment).count()
            }
            establecimientos_list.append(establecimiento_data)
        
        return jsonify({
            'success': True,
            'establecimientos': establecimientos_list
        }), 200
    except Exception as e:
        app.logger.error(f"Error al obtener establecimientos: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Error al obtener establecimientos',
            'error': str(e)
        }), 500

# CHAT 

@app.route('/api/chat', methods=['GET', 'POST'])
@jwt_required()
def chat():
    # Obtener el ID del usuario actual del token JWT
    usuario_actual = get_jwt_identity()
    usuario_actual_id = usuario_actual.get('id') if isinstance(usuario_actual, dict) else usuario_actual
    
    if request.method == 'GET':
        try:
            # Obtener el email del usuario desde los headers o parámetros de la solicitud
            usuario_email = request.args.get('email') or request.headers.get('X-User-Email')
            
            # Si no se proporciona el email en la solicitud, intentar obtenerlo del frontend
            if not usuario_email:
                # Fallback al ID del usuario si no podemos obtener el email
                usuario_email = str(usuario_actual_id)
            
            # Obtener los mensajes que NO sean del usuario actual (por email)
            mensajes = Mensaje.query.filter(Mensaje.usuario != usuario_email).order_by(Mensaje.fecha_creacion.asc()).all()
            
            argentina_tz = pytz.timezone('America/Argentina/Buenos_Aires')
            
            mensajes_json = []
            for m in mensajes:
                fecha = m.fecha_creacion
                fecha_formateada = fecha.replace(tzinfo=pytz.utc).astimezone(argentina_tz).strftime('%Y-%m-%d %H:%M:%S') if fecha else None
                
                mensajes_json.append({
                    'id': m.id,
                    'usuario': m.usuario,
                    'contenido': m.contenido,
                    'fecha_creacion': fecha_formateada,
                    'thumpsUp': m.thumpsUp,
                    'thumpsDown': m.thumpsDown
                })
            
            return jsonify({'success': True, 'mensajes': mensajes_json}), 200
        
        except Exception as e:
            print(f"Error al obtener mensajes: {str(e)}")
            return jsonify({'success': False, 'message': f'Error al obtener mensajes: {str(e)}'}), 500
    
    elif request.method == 'POST':
        try:
            data = request.get_json()
            contenido = data.get('mensaje')
            email_usuario = data.get('usuario', '')  # Obtener el email enviado desde el frontend
            
            if not contenido:
                return jsonify({'success': False, 'message': 'Mensaje vacío'}), 400
            
            # Crear y guardar nuevo mensaje usando el email del usuario
            nuevo_mensaje = Mensaje(
                usuario=email_usuario,  # Usar el email en lugar del ID
                contenido=contenido
            )
            
            db.session.add(nuevo_mensaje)
            db.session.commit()
            
            # Obtener todos los mensajes que NO son del usuario actual (comparando por email)
            mensajes = Mensaje.query.filter(Mensaje.usuario != email_usuario).order_by(Mensaje.fecha_creacion.asc()).all()
            
            argentina_tz = pytz.timezone('America/Argentina/Buenos_Aires')
            
            mensajes_json = []
            for m in mensajes:
                fecha = m.fecha_creacion
                fecha_formateada = fecha.replace(tzinfo=pytz.utc).astimezone(argentina_tz).strftime('%Y-%m-%d %H:%M:%S') if fecha else None
                
                mensajes_json.append({
                    'id': m.id,
                    'usuario': m.usuario,
                    'contenido': m.contenido,
                    'fecha_creacion': fecha_formateada,
                    'thumpsUp': m.thumpsUp,
                    'thumpsDown': m.thumpsDown
                })
            
            return jsonify({'success': True, 'mensajes': mensajes_json}), 200
        
        except Exception as e:
            # En caso de error, hacer rollback
            db.session.rollback()
            print(f"Error al enviar mensaje: {str(e)}")
            return jsonify({'success': False, 'message': f'Error al enviar mensaje: {str(e)}'}), 500        

# Función auxiliar para verificar si el usuario ya reaccionó
def usuario_reacciono_previamente(usuario, mensaje_id):
    return UsuarioReaccion.query.filter_by(usuario=usuario, mensaje_id=mensaje_id).first()

# Ruta para manejar reacciones de usuario
@app.route('/api/chat/reaction', methods=['POST'])
def update_reaction():      
    data = request.json
    print(data)
    message_id = request.json.get('id')
    print(message_id)
    mensajes = Mensaje.query.all()
    for mensaje in mensajes:
        print(f"ID: {mensaje.id}, Contenido: {mensaje.contenido}")
        reaction_type = data.get('reaction')
        usuario = data.get('usuario')

    mensaje = Mensaje.query.get(message_id)
    
    if not mensaje:
        return jsonify({"success": False, "message": "Mensaje no encontrado"}), 404

    reaccion_existente = usuario_reacciono_previamente(usuario, message_id)

    if reaccion_existente:
        if reaccion_existente.tipo_reaccion == reaction_type:
            db.session.delete(reaccion_existente)
            if reaction_type == "like":
                mensaje.thumpsUp -= 1
            else:
                mensaje.thumpsDown -= 1
        else:
            reaccion_existente.tipo_reaccion = reaction_type
            if reaction_type == "like":
                mensaje.thumpsUp += 1
                mensaje.thumpsDown -= 1
            else:
                mensaje.thumpsDown += 1
                mensaje.thumpsUp -= 1
    else:
        nueva_reaccion = UsuarioReaccion(usuario=usuario, mensaje_id=message_id, tipo_reaccion=reaction_type)
        db.session.add(nueva_reaccion)
        if reaction_type == "like":
            mensaje.thumpsUp += 1
        else:
            mensaje.thumpsDown += 1

    db.session.commit()
    return jsonify({"success": True, "thumpsUp": mensaje.thumpsUp, "thumpsDown": mensaje.thumpsDown}), 200

@app.route('/api/report', methods=['GET', 'POST'])
def manejar_reportes():
    if request.method == 'POST':
        # Lógica para crear un nuevo reporte
        try:
            data = request.get_json()
            idUser = data.get('idUser')
            sector = data.get('sector')
            content = data.get('content')

            if not idUser or not sector or not content:
                return jsonify({"success": False, "message": "Datos incompletos"}), 400

            nuevo_reporte = Reports(idUser=idUser, sector=sector, content=content)
            db.session.add(nuevo_reporte)
            db.session.commit()

            return jsonify({"success": True, "message": "Reporte guardado"})
        
        except Exception as e:
            print("🔥 Error en POST /api/report:", e)
            return jsonify({"success": False, "message": "Error interno"}), 500

    elif request.method == 'GET':
        # Lógica para obtener todos los reportes
        try:
            reportes = Reports.query.all()
            lista_reportes = [{
                'idReport': r.idReport,
                'idUser': r.idUser,
                'sector': r.sector,
                'content': r.content,
                'solucionado': r.solucionado
            } for r in reportes]

            return jsonify({"success": True, "reportes": lista_reportes})
        
        except Exception as e:
            print("🔥 Error en GET /api/report:", e)
            return jsonify({"success": False, "message": "Error al obtener reportes"}), 500
@app.route('/api/report/<int:idReport>/solucionar', methods=['POST'])

def marcar_como_solucionado(idReport):
    try:
        # Buscar el reporte por su ID
        reporte = Reports.query.get(idReport)
        
        if not reporte:
            return jsonify({"success": False, "message": "Reporte no encontrado"}), 404

        # Marcar el reporte como solucionado
        reporte.solucionado = True
        db.session.commit()

        return jsonify({"success": True, "message": "Reporte marcado como solucionado"})
    
    except Exception as e:
        print("Error al marcar como solucionado:", e)
        return jsonify({"success": False, "message": "Error interno"}), 500

@app.route('/api/vehiculos', methods=['GET'])
def obtener_vehiculos():
    try:
        vehiculos = Vehicle.query.all()
        print("Vehículos obtenidos desde la base de datos:", vehiculos)  # Debugging
        
        vehicles_json = [{"idVehicle": v.idVehicle} for v in vehiculos]
        print("Respuesta JSON:", vehicles_json)  # Debugging
        
        return jsonify({"success": True, "vehicles": vehicles_json}), 200
    except Exception as e:
        print("Error al obtener vehículos:", e)  # Debugging
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/denuncia', methods=['GET', 'POST'])
def manejar_quejas():
    if request.method == 'POST':
        try:
            data = request.get_json()
            idSuperUser = data.get('idSuperUser')  # Coordinado con JS
            idVehiculo = data.get('idVehiculo')    # Coordinado con JS
            sector = data.get('sector')
            content = data.get('content')

            if not idSuperUser or not idVehiculo or not sector or not content:
                return jsonify({"success": False, "message": "Datos incompletos"}), 400

            nueva_queja = Complaints(
                idSuperUser=idSuperUser,
                idVehiculo=idVehiculo,
                sector=sector,
                content=content
            )
            db.session.add(nueva_queja)
            db.session.commit()

            return jsonify({"success": True, "message": "Queja guardada"}), 200

        except Exception as e:
            print("🔥 Error en POST /api/complaint:", e)
            return jsonify({"success": False, "message": "Error interno"}), 500

    elif request.method == 'GET':
        try:
            quejas = Complaints.query.all()
            lista_quejas = [{
                'idComplaint': q.idComplaint,
                'idSuperUser': q.idSuperUser,
                'idVehiculo': q.idVehiculo,
                'sector': q.sector,
                'content': q.content
            } for q in quejas]

            return jsonify({"success": True, "complaints": lista_quejas}), 200

        except Exception as e:
            print("🔥 Error en GET /api/complaint:", e)
            return jsonify({"success": False, "message": "Error al obtener quejas"}), 500

@app.route('/api/propietario/<string:id_vehicle>', methods=['GET'])
def obtener_propietario(id_vehicle):
    try:
        print(f"Buscando propietario para el vehículo: {id_vehicle}")
        
        # Buscar el dueño del vehículo
        propietario = db.session.query(User.phone).join(Owns, User.idUser == Owns.idUser) \
            .filter(Owns.idVehicle == id_vehicle).first()

        if not propietario:
            return jsonify({"success": False, "message": "Propietario no encontrado"}), 404

        print(f"Celular encontrado: {propietario.phone}")
        
        return jsonify({"success": True, "phone": propietario.phone}), 200
    
    except Exception as e:
        print("Error al obtener propietario:", e)
        return jsonify({"success": False, "message": "Error interno"}), 500
    
@app.route('/api/complaint', methods=['GET', 'POST'])
def manejar_denuncias():
    if request.method == 'POST':
        # Lógica para crear una nueva denuncia
        try:
            data = request.get_json()
            idSuperUser = data.get('idSuperUser')
            idVehiculo = data.get('idVehiculo')
            sector = data.get('sector')
            content = data.get('content')

            if not idSuperUser or not idVehiculo or not sector or not content:
                return jsonify({"success": False, "message": "Datos incompletos"}), 400

            nueva_denuncia = Complaints(idSuperUser=idSuperUser, idVehiculo=idVehiculo, sector=sector, content=content)
            db.session.add(nueva_denuncia)
            db.session.commit()

            return jsonify({"success": True, "message": "Denuncia guardada"})

        except Exception as e:
            print("🔥 Error en POST /api/complaint:", e)
            return jsonify({"success": False, "message": "Error interno"}), 500

    elif request.method == 'GET':
        # Lógica para obtener todas las denuncias
        try:
            denuncias = Complaints.query.all()
            lista_denuncias = [{
                'idComplaint': d.idComplaint,
                'idSuperUser': d.idSuperUser,
                'idVehiculo': d.idVehiculo,
                'sector': d.sector,
                'content': d.content,
                'solucionado': d.solucionado
            } for d in denuncias]

            return jsonify({"success": True, "denuncias": lista_denuncias})

        except Exception as e:
            print("🔥 Error en GET /api/complaint:", e)
            return jsonify({"success": False, "message": "Error al obtener denuncias"}), 500


@app.route('/api/complaint/<int:idComplaint>/solucionar', methods=['POST'])
def marcar_denuncia_solucionada(idComplaint):
    try:
        # Buscar la denuncia por su ID
        denuncia = Complaints.query.get(idComplaint)

        if not denuncia:
            return jsonify({"success": False, "message": "Denuncia no encontrada"}), 404

        # Marcar la denuncia como solucionada
        denuncia.solucionado = True
        db.session.commit()

        return jsonify({"success": True, "message": "Denuncia marcada como solucionada"})

    except Exception as e:
        print("Error al marcar como solucionado:", e)
        return jsonify({"success": False, "message": "Error interno"}), 500

# Agrega este endpoint a tu backend

@app.route('/api/owns', methods=['GET'])
def get_owns():
    owns = Owns.query.all()
    owns_list = []
    for own in owns:
        owns_list.append({
            'idUser': own.idUser,
            'idVehicle': own.idVehicle,
            'is_primary': own.is_primary
        })
    return jsonify({
        'owns': owns_list,
        'success': True
    })


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)