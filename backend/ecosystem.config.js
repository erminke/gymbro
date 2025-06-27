module.exports = {
  apps: [{
    name: 'gymbro-backend',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || 3000
    }
  }]
};
