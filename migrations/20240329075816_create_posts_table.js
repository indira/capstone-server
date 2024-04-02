exports.up = function (knex) {
  return knex.schema.createTable("posts", function (table) {
    table.increments("id").primary()
    table.integer("user_id").unsigned().notNullable()
    table.string("title").notNullable()
    table.text("body").notNullable()
    table.timestamp("created_at").defaultTo(knex.fn.now())
    table.timestamp("updated_at").defaultTo(knex.fn.now())
    table.foreign("user_id").references("id").inTable("users").onUpdate("CASCADE").onDelete("CASCADE")
  })
}

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("posts")
}
