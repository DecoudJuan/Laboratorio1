import random
from flask import Flask, jsonify, request, send_from_directory
from dotenv import load_dotenv

# MODULOS PARA LOGIN
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import check_password_hash

# MAIL
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
            
        # Verificar si el email existe en la base de datos
        existing_user = User.query.filter_by(email=email).first()
        if not existing_user:
            # Por seguridad, no indicamos si el email existe o no
            return jsonify({'success': True, 'message': 'Si el email existe, recibirás un código de recuperación.'}), 200
        
        recovery_code = generate_recovery_code()
        
        # Aquí podrías almacenar el código en la base de datos asociado al usuario
        # existing_user.recovery_code = recovery_code
        # existing_user.recovery_expiry = datetime.now() + timedelta(minutes=15)
        # db.session.commit()
        
        # Configuración del servidor SMTP
        smtp_server = os.getenv('MAIL_SERVER')
        smtp_port = int(os.getenv('MAIL_PORT', 587))
        smtp_username = os.getenv('MAIL_USERNAME')
        smtp_password = os.getenv('MAIL_PASSWORD')
        
        # Crear el mensaje
        msg = MIMEMultipart()
        msg['From'] = smtp_username
        msg['To'] = email
        msg['Subject'] = 'Recuperación de Contraseña'
        
        # Cuerpo del mensaje
        body = f'Hola,\n\nHas solicitado recuperar tu contraseña.\n\nTu código de recuperación es: {recovery_code}\n\nEste código expirará en 15 minutos.\n\nSi no solicitaste este cambio, ignora este mensaje.\n\nSaludos,\nEquipo de Soporte'
        msg.attach(MIMEText(body, 'plain'))
        
        # ENVIAR CORREO
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()  # Activar el modo seguro
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
        
        # Validaciones básicas
        if not email or not password:
            return jsonify({'success': False, 'message': 'Email y contraseña son requeridos'}), 400
        
        # Buscar usuario en la base de datos
        user = User.query.filter_by(email=email).first()
        
        if not user or not check_password_hash(user.password, password):
            return jsonify({'success': False, 'message': 'Credenciales inválidas'}), 401
        
        # Crear token JWT
        access_token = create_access_token(identity={
            'id': user.idUser,
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

@app.route('/api/v1/users/<id>', methods=['DELETE'])
def delete_user(id):
    response = {'message': 'success'}
    return jsonify(response)

# REGISTRO NORMAL
@app.route('/api/register', methods=['POST'])
def register_user():
    # Obtener datos del request
    data = request.get_json()
    username = data.get('username')
    phone = data.get('phone')
    email = data.get('email')
    password = data.get('password')
    userRole = data.get('rol', 'usuario')  # Valor por defecto: usuario
    
    # Validaciones básicas
    if not username or not email or not password:
        return jsonify({'message': 'Todos los campos son obligatorios', 'success': False}), 400
    
    # Verificar si el email ya existe
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({'message': 'El correo electrónico ya está registrado', 'success': False}), 400
    
    # Crear nuevo usuario
    try:
        # Encriptar contraseña
        hashed_password = generate_password_hash(password)
        
        # Crear objeto de usuario según tu modelo
        new_user = User(
            username=username,
            email=email,
            phone=phone,
            password=hashed_password,
            userRole=userRole,
        )
        
        # Guardar en la base de datos
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'message': 'Registro exitoso',
            'success': True,
            'user_id': new_user.idUser  # Nota el cambio a idUser
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


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)