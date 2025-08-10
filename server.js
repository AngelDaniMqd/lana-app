const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { testConnection } = require('./config/database');

// Solo importar rutas que existen
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de seguridad
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:8081', 
    'http://192.168.0.102:8081',
    'exp://192.168.0.102:8081',
    'exp://localhost:8081'
  ],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
});
app.use('/api/', limiter);

// Middleware de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Solo usar rutas que existen
app.use('/api/auth', authRoutes);

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API de Lana App funcionando correctamente',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: 'API de Lana App',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      register: '/api/auth/registro',
      login: '/api/auth/login'
    }
  });
});

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    path: req.originalUrl 
  });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Algo salió mal!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Error interno del servidor'
  });
});

// Iniciar servidor
const startServer = async () => {
  try {
    await testConnection();
    
    app.listen(PORT, '192.168.0.102', () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
      console.log(`📱 API URL: http://192.168.0.102:${PORT}/api`);
      console.log(`🌐 Red local: http:/192.168.0.102:${PORT}/api`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();
