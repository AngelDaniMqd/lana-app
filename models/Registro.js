const { pool } = require('../config/database');

class Registro {
  
  // Crear un nuevo registro
  static async crear(registroData) {
    const { usuarios_id, lista_cuentas_id, subCategorias_id, monto, categori_metodos_id } = registroData;
    
    try {
      const [result] = await pool.execute(
        `INSERT INTO registros (usuarios_id, lista_cuentas_id, subCategorias_id, monto, fecha_registro, categori_metodos_id) 
         VALUES (?, ?, ?, ?, NOW(), ?)`,
        [usuarios_id, lista_cuentas_id, subCategorias_id, monto, categori_metodos_id]
      );
      
      return await this.obtenerPorId(result.insertId);
    } catch (error) {
      throw new Error(`Error al crear registro: ${error.message}`);
    }
  }

  // Obtener registros por usuario
  static async obtenerPorUsuario(usuarios_id, limite = 50, offset = 0) {
    try {
      const [rows] = await pool.execute(
        `SELECT r.*, 
                lc.nombre as cuenta_nombre,
                s.descripcion as subcategoria,
                c.descripcion as categoria,
                cm.nombre as metodo_pago
         FROM registros r
         LEFT JOIN lista_cuentas lc ON r.lista_cuentas_id = lc.id
         LEFT JOIN subcategorias s ON r.subCategorias_id = s.id
         LEFT JOIN categorias c ON s.categorias_id = c.id
         LEFT JOIN categori_metodos cm ON r.categori_metodos_id = cm.id
         WHERE r.usuarios_id = ?
         ORDER BY r.fecha_registro DESC
         LIMIT ? OFFSET ?`,
        [usuarios_id, limite, offset]
      );
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener registros: ${error.message}`);
    }
  }

  // Obtener registro por ID
  static async obtenerPorId(id) {
    try {
      const [rows] = await pool.execute(
        `SELECT r.*, 
                lc.nombre as cuenta_nombre,
                s.descripcion as subcategoria,
                c.descripcion as categoria,
                cm.nombre as metodo_pago
         FROM registros r
         LEFT JOIN lista_cuentas lc ON r.lista_cuentas_id = lc.id
         LEFT JOIN subcategorias s ON r.subCategorias_id = s.id
         LEFT JOIN categorias c ON s.categorias_id = c.id
         LEFT JOIN categori_metodos cm ON r.categori_metodos_id = cm.id
         WHERE r.id = ?`,
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener registro: ${error.message}`);
    }
  }

  // Obtener registros por rango de fechas
  static async obtenerPorFechas(usuarios_id, fechaInicio, fechaFin) {
    try {
      const [rows] = await pool.execute(
        `SELECT r.*, 
                lc.nombre as cuenta_nombre,
                s.descripcion as subcategoria,
                c.descripcion as categoria,
                cm.nombre as metodo_pago
         FROM registros r
         LEFT JOIN lista_cuentas lc ON r.lista_cuentas_id = lc.id
         LEFT JOIN subcategorias s ON r.subCategorias_id = s.id
         LEFT JOIN categorias c ON s.categorias_id = c.id
         LEFT JOIN categori_metodos cm ON r.categori_metodos_id = cm.id
         WHERE r.usuarios_id = ? AND r.fecha_registro BETWEEN ? AND ?
         ORDER BY r.fecha_registro DESC`,
        [usuarios_id, fechaInicio, fechaFin]
      );
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener registros por fechas: ${error.message}`);
    }
  }

  // Eliminar registro
  static async eliminar(id, usuarios_id) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM registros WHERE id = ? AND usuarios_id = ?',
        [id, usuarios_id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar registro: ${error.message}`);
    }
  }
}

module.exports = Registro;
