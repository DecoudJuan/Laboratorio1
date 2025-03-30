const db = require('../config/db.config');
const fs = require('fs');
const path = require('path');

async function initializeDb() {
  try {
    // Leer el script SQL
    const setupSql = fs.readFileSync(
      path.join(__dirname, 'migrations', 'setup.sql'),
      'utf8'
    );
    
    // Ejecutar el script
    await db.query(setupSql);
    console.log('Base de datos inicializada correctamente');
  } catch (err) {
    console.error('Error inicializando la base de datos:', err);
  } finally {
    db.pool.end();
  }
}

initializeDb();