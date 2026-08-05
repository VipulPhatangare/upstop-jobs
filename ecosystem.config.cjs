module.exports = {
  apps: [
    {
      name: 'unstop-backend-api',
      script: './backend/server.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '1024M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        MONGODB_URI: 'mongodb://localhost:27017/unstop_jobs'
      }
    }
  ]
};
