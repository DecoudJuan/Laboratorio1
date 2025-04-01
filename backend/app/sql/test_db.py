import psycopg2
import sys

# Imprime la versión de Python
print(f"Versión de Python: {sys.version}")

# Prueba de conexión básica
try:
    print("Intentando conectar a PostgreSQL...")
    conn = psycopg2.connect(
        dbname="postgres",
        user="postgres",
        password="qwerty",
        host="localhost",
        port="5432"
    )
    print("¡Conexión exitosa!")
    
    # Probar una consulta simple
    cursor = conn.cursor()
    cursor.execute("SELECT version();")
    version = cursor.fetchone()
    print(f"Versión de PostgreSQL: {version[0]}")
    
    cursor.close()
    conn.close()
    print("Conexión cerrada correctamente")
    
except Exception as e:
    print(f"Ocurrió un error: {type(e).__name__}: {e}")
    
print("Fin del programa")