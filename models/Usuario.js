const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class Usuario {
  
  // Crear un nuevo usuario
  static async crear(userData) {
    const { nombre, apellidos, telefono, correo, contrasena } = userData;
    
    try {
      // Encriptar contraseña
      const hashedPassword = await bcrypt.hash(contrasena, 10);
      
      const [result] = await pool.execute(
        `INSERT INTO usuarios (nombre, apellidos, telefono, correo, contrasena, fecha_creacion) 
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [nombre, apellidos, telefono, correo, hashedPassword]
      );
      
      return { id: result.insertId, ...userData };
    } catch (error) {
      throw new Error(`Error al crear usuario: ${error.message}`);
    }
  }

  // Buscar usuario por email
  static async buscarPorEmail(correo) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM usuarios WHERE correo = ?',
        [correo]
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al buscar usuario: ${error.message}`);
    }
  }

  // Verificar contraseña
  static async verificarContrasena(contrasenaTexto, contrasenaHash) {
    return await bcrypt.compare(contrasenaTexto, contrasenaHash);
  }

  // Obtener usuario por ID
  static async obtenerPorId(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT id, nombre, apellidos, telefono, correo, fecha_creacion FROM usuarios WHERE id = ?',
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener usuario: ${error.message}`);
    }
  }

  // Actualizar usuario
  static async actualizar(id, userData) {
    const { nombre, apellidos, telefono } = userData;
    
    try {
      await pool.execute(
        'UPDATE usuarios SET nombre = ?, apellidos = ?, telefono = ? WHERE id = ?',
        [nombre, apellidos, telefono, id]
      );
      
      return await this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al actualizar usuario: ${error.message}`);
    }
  }
}

module.exports = Usuario;
