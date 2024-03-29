const knex = require("knex")(require("../knexfile"))
require("dotenv").config() // load env variables from .env file, adds to process.env
const md5 = require("md5")
const bcrypt = require("bcryptjs")
const validator = require("validator")
const jwt = require("jsonwebtoken")
const { JWT_SECRET_KEY } = process.env
const express = require("express")
const app = express()
app.use(express.json())

function sanitizeInput(input) {
  if (typeof input !== "string") {
    return ""
  }
  return input.trim().toLowerCase()
}

const login = async (req, res) => {
  const username = sanitizeInput(req.body.username)
  const password = req.body.password

  try {
    // Check if the username exists in the database
    const existingUser = await knex("users").where({ username }).first()

    if (!existingUser) {
      return res.status(404).json({
        message: "User not found. Please check your username."
      })
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, existingUser.password)

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid password. Please try again."
      })
    }

    // Construct Gravatar URL if email exists
    const avatarUrl = existingUser.email ? `https://gravatar.com/avatar/${md5(existingUser.email)}?s=128` : null

    // Generate JWT token
    const token = jwt.sign({ userId: existingUser.id, username: existingUser.username }, JWT_SECRET_KEY, { expiresIn: "5h" })

    // Return JWT token along with user details
    res.status(200).json({
      token,
      username: existingUser.username,
      avatar: avatarUrl
    })
  } catch (error) {
    console.error("Error during login:", error)
    res.status(500).json({
      message: `An error occurred during login: ${error.message}`
    })
  }
}
const register = async (req, res) => {
  const username = sanitizeInput(req.body.username)
  const password = sanitizeInput(req.body.password)
  const email = sanitizeInput(req.body.email)

  try {
    // Check if the username length is at least two characters
    if (username.length < 2) {
      return res.status(400).json({
        message: "Username must be at least two characters long."
      })
    }

    // Check if the email is valid
    if (!validator.isEmail(email)) {
      return res.status(400).json({
        message: "Please provide a valid email address."
      })
    }

    // Check if username or email already exist in the database
    const existingUser = await knex("users").where({ username }).orWhere({ email }).first()

    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({
          message: "That username is already taken."
        })
      } else {
        return res.status(400).json({
          message: "Email already exists. Please use a different email address."
        })
      }
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least six characters long."
      })
    }

    // Hash the password
    const hashedPassword = bcrypt.hashSync(password, 10)

    // Insert user into the database
    const [userId] = await knex("users").insert({
      username: username,
      email: email,
      password: hashedPassword // Store hashed password in the database
    })

    // Construct Gravatar URL
    const avatarUrl = `https://gravatar.com/avatar/${md5(email)}?s=128`

    // Generate AWS token
    const token = jwt.sign({ userId: userId, username: username }, JWT_SECRET_KEY, { expiresIn: "5h" })

    // Return AWS token along with user details
    res.status(200).json({
      token: token,
      username: username,
      avatar: avatarUrl
    })
  } catch (error) {
    console.error("Error creating user:", error)
    res.status(500).json({
      message: `Unable to create new user: ${error.message}`
    })
  }
}

const mustbeLoggedIn = async (req, res, next) => {
  const token = req.body.token

  try {
    const token = req.body.token
    if (!token) {
      return res.status(401).send("Unauthorized: Missing token")
    }

    const decodedToken = jwt.verify(token, JWT_SECRET_KEY)
    if (!decodedToken) {
      return res.status(401).send("Unauthorized: Invalid token")
    }

    // Optionally, you can attach the decoded token to the request object for further processing
    req.user = decodedToken
    console.log(decodedToken, "decodetoken")
    next()
  } catch (error) {
    console.error("Error verifying token:", error)
    return res.status(500).send("Internal Server Error")
  }
}

module.exports = {
  register,
  login,
  mustbeLoggedIn
}
