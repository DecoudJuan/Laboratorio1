from flask import Flask, request, jsonify, send_from_directory
from flask_mail import Mail, Message
from flask_cors import CORS
import random
import string
import os
from dotenv import load_dotenv

# Cargar variables de entorno desde el archivo .env
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../../.env'))

app = Flask(__name__)
CORS(app)  # Habilitar CORS para todas las rutas

# Configuración de Flask-Mail usando variables de entorno
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT'))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS') == 'True'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')

mail = Mail(app)

def generate_recovery_code(length=6):
    letters_and_digits = string.ascii_letters + string.digits
    return ''.join(random.choice(letters_and_digits) for i in range(length))

@app.route('/send-recovery-email', methods=['POST'])
def send_recovery_email():
    try:
        data = request.get_json()
        email = data['email']
        recovery_code = generate_recovery_code()

        msg = Message('Recuperación de Contraseña',
                      sender=os.getenv('MAIL_USERNAME'),
                      recipients=[email])
        msg.body = f'Aquí tienes tu código de recuperación: {recovery_code}'

        mail.send(msg)
        print(f"Correo enviado a {email} con código {recovery_code}")  # Log para depuración
        return jsonify({'success': True, 'message': 'Correo enviado.'}), 200
    except Exception as e:
        print(f'Error detallado: {str(e)}')  # Log de error detallado
        return jsonify({'success': False, 'message': str(e)}), 500

# Ruta para servir archivos estáticos
@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('../frontend/static', path)

# Ruta para servir la página de recuperación de contraseña
@app.route('/passwordrecup.html')
def password_recovery_page():
    return send_from_directory('../frontend/templates', 'passwordrecup.html')

@app.route('/test')
def test():
    return "Ruta de prueba funcionando correctamente"

if __name__ == '__main__':
    app.run(debug=True, port=3000, host='0.0.0.0')  # Cambia el puerto a 3000