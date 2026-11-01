module.exports = {
  apps: [
    {
      name: "dunkelmann",
      script: "dist/index.js",
      cwd: __dirname,
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: "10s",
      watch: false,
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      merge_logs: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
