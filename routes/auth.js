const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { pool } = require('../config/database');

const router = express.Router();

// Esquemas de validación
const registroSchema = Joi.object({
  nombre: Joi.string().required().min(2).max(100),
  apellidos: Joi.string().required().min(2).max(45),
  telefono: Joi.string().required().min(10).max(10),
  correo: Joi.string().email().required().max(100),
  contrasena: Joi.string().required().min(6).max(255)
});

const loginSchema = Joi.object({
  correo: Joi.string().email().required(),
  contrasena: Joi.string().required()
});

// Registro de usuario
router.post('/registro', async (req, res) => {
  try {
    // Validar datos
    const { error, value } = registroSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: error.details[0].message
      });
    }

    const { nombre, apellidos, telefono, correo, contrasena } = value;

    // Verificar si el usuario ya existe
    const [existingUser] = await pool.execute(
      'SELECT correo FROM usuarios WHERE correo = ?',
      [correo]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        error: 'El correo ya está registrado'
      });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(contrasena, 12);

    // Insertar usuario
    const [result] = await pool.execute(
      `INSERT INTO usuarios (nombre, apellidos, telefono, correo, contrasena, fecha_creacion) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [nombre, apellidos, telefono, correo, hashedPassword]
    );

    // Generar token
    const token = jwt.sign(
      { userId: result.insertId, correo },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      user: {
        id: result.insertId,
        nombre,
        apellidos,
        correo
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// Login de usuario
router.post('/login', async (req, res) => {
  try {
    // Validar datos
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: error.details[0].message
      });
    }

    const { correo, contrasena } = value;

    // Buscar usuario
    const [users] = await pool.execute(
      'SELECT id, nombre, apellidos, correo, contrasena FROM usuarios WHERE correo = ?',
      [correo]
    );

    if (users.length === 0) {
      return res.status(401).json({
        error: 'Credenciales inválidas'
      });
    }

    const user = users[0];

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(contrasena, user.contrasena);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Credenciales inválidas'
      });
    }

    // Generar token
    const token = jwt.sign(
      { userId: user.id, correo: user.correo },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        apellidos: user.apellidos,
        correo: user.correo
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;
