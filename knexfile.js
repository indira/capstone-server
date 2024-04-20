// Update with your config settings.
/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
const knexConfig = {
  client: "mysql2",
  connection: {}
}

if (process.env.NODE_ENV === "production" || process.env.DATABASE_URL) {
  // Connect to JAWSDB on Heroku
  knexConfig.connection = process.env.JAWSDB_URL || process.env.DATABASE_URL
} else {
  // Load local environment variables
  require("dotenv").config()
  knexConfig.connection = {
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  }
}

module.exports = knexConfig
