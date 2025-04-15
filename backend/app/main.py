import random
from flask import Flask, jsonify, redirect, request, send_from_directory, render_template, url_for
from dotenv import load_dotenv
import psycopg2
from models import User, Owns
# MODULOS PARA LOGIN
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import check_password_hash

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

    # CONFIGURAR CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}})

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


jwt = JWTManager(app)

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

# RUTAS PREDEFINIDAS

@app.route('/api/v1/users', methods=['GET'])
def get_users():
    response = {'message': 'success'}
    return jsonify(response)

@app.route('/api/v1/users/<id>', methods=['GET'])
def get_user(id):
    response = {'message': 'success'}
    return jsonify(response)

@app.route('/api/v1/users/', methods=['POST'])
def create_user():
    response = {'message': 'success'}
    return jsonify(response)

@app.route('/api/v1/users/<id>', methods=['PUT'])
def update_user(id):
    response = {'message': 'success'}
    return jsonify(response)


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

        # Proceder con el borrado
        db.session.delete(usuario)
        db.session.commit()

        vehiculos = db.session.query(Vehicle).join(Owns).filter(Owns.idUser == usuario.idUser).all()

        # Eliminar vehículos
        for v in vehiculos:
            db.session.delete(v)
        
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
def obtener_datos_usuario(username):
    try:
        # Debug: Imprimir el nombre de usuario recibido
        print(f"Buscando usuario: '{username}'")
        
        # Buscar al usuario por su nombre de usuario
        user = User.query.filter_by(username=username).first()
        
        # Debug: Imprimir el resultado de la búsqueda
        print(f"Usuario encontrado: {user}")
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'Usuario no encontrado'
            }), 404
            
        # Obtener los vehículos del usuario
        owns = Owns.query.filter_by(username=username).all()
        
        # Preparar la lista de vehículos secundarios
        vehiculos_secundarios = []
        if owns:
            for o in owns:
                if o.vehicle != user.main_vehicle and o.vehicle:
                    vehiculos_secundarios.append(o.vehicle)
        
        # Construir y devolver la respuesta
        return jsonify({
            'success': True,
            'nombre_completo': user.full_name if hasattr(user, 'full_name') else user.username,
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
        VP = request.form.get('VP')  # Vehículo Principal
        VP2 = request.form.get('VP2')  # Vehículo Secundario
        nombre_anterior = request.form.get('nombre_anterior')
        
        if not username or not nombre_anterior:
            return jsonify({'message': 'El nombre de usuario es requerido', 'success': False}), 400

        # Buscar si existe un usuario con el nombre anterior
        user = User.query.filter_by(username=nombre_anterior).first()

        if user:
            # Actualizamos los datos del usuario
            user.username = username
            user.email = email

            # Si se proporciona el VP, buscamos o creamos el vehículo
            if VP:
                vehiculo = Vehicle.query.filter_by(idVehicle=VP).first()
                if not vehiculo:
                    vehiculo = Vehicle(idVehicle=VP, brand='Marca Ejemplo', model='Modelo Ejemplo')
                    db.session.add(vehiculo)
                # Relacionamos el vehículo con el usuario
                # Verificamos si la relación ya existe en 'Owns'
                if not db.session.query(Owns).filter_by(idUser=user.idUser, idVehicle=vehiculo.idVehicle).first():
                    new_own = Owns(idUser=user.idUser, idVehicle=vehiculo.idVehicle)
                    db.session.add(new_own)

            # Si se proporciona el VP2, buscamos o creamos el vehículo
            if VP2:
                vehiculo2 = Vehicle.query.filter_by(idVehicle=VP2).first()
                if not vehiculo2:
                    vehiculo2 = Vehicle(idVehicle=VP2, brand='Marca Ejemplo', model='Modelo Ejemplo')
                    db.session.add(vehiculo2)
                # Relacionamos el vehículo con el usuario
                # Verificamos si la relación ya existe en 'Owns'
                if not db.session.query(Owns).filter_by(idUser=user.idUser, idVehicle=vehiculo2.idVehicle).first():
                    new_own2 = Owns(idUser=user.idUser, idVehicle=vehiculo2.idVehicle)
                    db.session.add(new_own2)

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
        sector_id = request.form.get('establecimiento')       # ID del sector
        establecimiento_id = request.form.get('sector')       # ID del establecimiento
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

            if establecimiento_id:
                # Buscar establecimiento por ID
                establecimiento_obj = Establishment.query.filter_by(idEstablishment=establecimiento_id).first()

                if not establecimiento_obj:
                    # Crear nuevo establecimiento si no existe
                    establecimiento_obj = Establishment(
                        idEstablishment=establecimiento_id,
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

            if sector_id and establecimiento_obj:
                # Buscar sector por ID
                sector_obj = Sectors.query.filter_by(idSector=sector_id).first()

                if not sector_obj:
                    # Crear nuevo sector si no existe
                    sector_obj = Sectors(
                        idSector=sector_id,
                        idEstablishment=establecimiento_obj.idEstablishment,
                        name='unknown',
                        openingHour=1,
                        closingHour=0,
                        availableParkingSpots=0
                    )
                    db.session.add(sector_obj)
                    db.session.flush()  # Para obtener el ID asignado

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



@app.route('/api/guardar_datos_vehiculo', methods=['POST'])
def guardar_datos_vehiculo():
    try:
        # Obtener valores desde el formulario
        marca = request.form.get('marca')
        modelo = request.form.get('modelo')
        patente = request.form.get('patente')
        patenteActual = request.form.get('patenteActual')
        
        # Validar campos requeridos
        if not patenteActual:
            return jsonify({'message': 'La patente actual es requerida', 'success': False}), 400
            
        if not patente:
            return jsonify({'message': 'La nueva patente es requerida', 'success': False}), 400

        # Buscar si existe un vehículo con la patente actual
        vehiculo = Vehicle.query.filter_by(idVehicle=patenteActual).first()

        if vehiculo:
            # Si se está cambiando la patente, verificar que la nueva no exista ya
            if patente != patenteActual:
                vehiculo_existente = Vehicle.query.filter_by(idVehicle=patente).first()
                if vehiculo_existente:
                    return jsonify({
                        'message': 'Ya existe un vehículo con esa patente',
                        'success': False
                    }), 400
            
            # Si existe, actualiza los datos del vehículo
            vehiculo.idVehicle = patente
            if marca:  # Solo actualiza si se proporciona un valor
                vehiculo.brand = marca
            if modelo:  # Solo actualiza si se proporciona un valor
                vehiculo.model = modelo
      
            db.session.commit()
        
            # También actualizar cualquier referencia al vehículo en la tabla Owns
            if patente != patenteActual:
                owns_registros = Owns.query.filter_by(idVehicle=patenteActual).all()
                for registro in owns_registros:
                    registro.vehicle = patente
                db.session.commit()
              
            
            return jsonify({
                'message': 'Datos del vehículo actualizados correctamente',
                'success': True
            }), 200
        else:
            # Si no existe, crear un nuevo vehículo
            nuevo_vehiculo = Vehicle(
                idVehicle=patente,
                brand=marca if marca else "",
                model=modelo if modelo else ""
            )
            db.session.add(nuevo_vehiculo)
            db.session.commit()
            
            return jsonify({
                'message': 'Nuevo vehículo creado correctamente',
                'success': True
            }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error en guardar_datos_vehiculo: {str(e)}")  # Para debugging
        return jsonify({
            'message': f'Error al guardar datos del vehículo: {str(e)}',
            'success': False
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)