const knex = require("knex")(require("../knexfile"))
require("dotenv").config() // load env variables from .env file, adds to process.env
const sanitizeHTML = require("sanitize-html")
const express = require("express")

const jwt = require("jsonwebtoken")
const { JWT_SECRET_KEY } = process.env

const app = express()
app.use(express.json())

function sanitizeInput(input) {
  if (typeof input !== "string") {
    return ""
  }
  return sanitizeHTML(input.trim())
}

const create = async (req, res) => {
  let title = sanitizeInput(req.body.title)
  let body = sanitizeInput(req.body.body)
  let token = sanitizeInput(req.body.token)
  // Verify the token and decode it
  const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY)

  // Extract the user_id from the decoded token
  const userId = decodedToken.userId

  if (title === "") {
    return res.status(500).json({
      message: "You must provide a title"
    })
  }
  if (body === "") {
    return res.status(500).json({
      message: "You must provide a body"
    })
  }

  try {
    // Add your database logic here
    // Insert data into the posts table
    await knex("posts").insert({
      user_id: userId,
      title: title,
      body: body
    })
    console.log("Data inserted into posts table successfully.")
  } catch (error) {
    console.error("Error creating user:", error)
    return res.status(500).json({
      message: `Unable to create new user: ${error.message}`
    })
  }
}

module.exports = {
  create
}
