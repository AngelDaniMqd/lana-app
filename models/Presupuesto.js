const { pool } = require('../config/database');

class Presupuesto {
  
  // Crear un nuevo presupuesto
  static async crear(presupuestoData) {
    const { usuarios_id, categorias_id, monto_limite, mes, ano } = presupuestoData;
    
    try {
      const [result] = await pool.execute(
        `INSERT INTO presupuestos (usuarios_id, categorias_id, monto_limite, mes, ano, fecha_creacion) 
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [usuarios_id, categorias_id, monto_limite, mes, ano]
      );
      
      return await this.obtenerPorId(result.insertId);
    } catch (error) {
      throw new Error(`Error al crear presupuesto: ${error.message}`);
    }
  }

  // Obtener presupuestos por usuario
  static async obtenerPorUsuario(usuarios_id) {
    try {
      const [rows] = await pool.execute(
        `SELECT p.*, c.descripcion as categoria_nombre
         FROM presupuestos p
         LEFT JOIN categorias c ON p.categorias_id = c.id
         WHERE p.usuarios_id = ?
         ORDER BY p.ano DESC, p.mes DESC`,
        [usuarios_id]
      );
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener presupuestos: ${error.message}`);
    }
  }

  // Obtener presupuesto por mes y año
  static async obtenerPorMesAno(usuarios_id, mes, ano) {
    try {
      const [rows] = await pool.execute(
        `SELECT p.*, c.descripcion as categoria_nombre
         FROM presupuestos p
         LEFT JOIN categorias c ON p.categorias_id = c.id
         WHERE p.usuarios_id = ? AND p.mes = ? AND p.ano = ?`,
        [usuarios_id, mes, ano]
      );
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener presupuestos por mes/año: ${error.message}`);
    }
  }

  // Obtener por ID
  static async obtenerPorId(id) {
    try {
      const [rows] = await pool.execute(
        `SELECT p.*, c.descripcion as categoria_nombre
         FROM presupuestos p
         LEFT JOIN categorias c ON p.categorias_id = c.id
         WHERE p.id = ?`,
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener presupuesto: ${error.message}`);
    }
  }

  // Actualizar presupuesto
  static async actualizar(id, presupuestoData) {
    const { monto_limite } = presupuestoData;
    
    try {
      await pool.execute(
        'UPDATE presupuestos SET monto_limite = ? WHERE id = ?',
        [monto_limite, id]
      );
      
      return await this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al actualizar presupuesto: ${error.message}`);
    }
  }

  // Eliminar presupuesto
  static async eliminar(id, usuarios_id) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM presupuestos WHERE id = ? AND usuarios_id = ?',
        [id, usuarios_id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar presupuesto: ${error.message}`);
    }
  }
}

module.exports = Presupuesto;
