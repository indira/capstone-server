/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.hasTable("users").then(function (exists) {
    if (!exists) {
      return knex.schema.createTable("users", function (table) {
        table.increments("id").primary()
        table.string("username").notNullable()
        table.string("email").notNullable()
        table.string("password").notNullable()
        table.timestamp("created_at").defaultTo(knex.fn.now())
        table.timestamp("updated_at").defaultTo(knex.fn.now())
      })
    } else {
      console.log("Users table already exists. Skipping creation.")
    }
  })
}
exports.down = function (knex) {
  return knex.schema.dropTable("users")
}
