const knex = require("knex")(require("../knexfile"))
require("dotenv").config() // load env variables from .env file, adds to process.env
const md5 = require("md5")
const bcrypt = require("bcryptjs")
const validator = require("validator")
const jwt = require("jsonwebtoken")
const { JWT_SECRET_KEY } = process.env
const express = require("express")
const app = express()
app.use(express.json()) // adds req.body
// Function to clean up and validate user inputs
const cleanAndValidateUserInput = (username, password) => {
  // Clean up and validate username
  const cleanedUsername = validator.trim(validator.escape(username)).toLowerCase()

  // Clean up and validate password
  const cleanedPassword = validator.trim(password)
  if (!validator.isStrongPassword(cleanedPassword, { minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1 })) {
    throw new Error("Please provide a password with at least 8 characters, including at least one lowercase letter, one uppercase letter, and one number.")
  }

  return { username: cleanedUsername, password: cleanedPassword }
}

const login = async (req, res) => {
  const { username, password } = req.body

  try {
    // Clean up and validate user input
    const { username: cleanedUsername, password: cleanedPassword } = cleanAndValidateUserInput(req.body.username, req.body.password)
    // Check if the username exists in the database
    const existingUser = await knex("users").where({ username: cleanedUsername }).first()
    if (!existingUser) {
      return res.status(404).json({
        message: "User not found. Please check your username."
      })
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(cleanedPassword, existingUser.password)
    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid password. Please try again."
      })
    }

    // Construct Gravatar URL
    const avatarUrl = existingUser.email ? `https://gravatar.com/avatar/${md5(existingUser.email)}?s=128` : null

    // Generate JWT token
    const token = jwt.sign({ userId: existingUser.id, username: existingUser.username }, JWT_SECRET_KEY, { expiresIn: "5h" })

    // Return JWT token along with user details
    res.status(200).json({
      token: token,
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
  const { username, email, password } = req.body
  try {
    // Clean up and validate user input
    const cleanedUserData = cleanAndValidateUserInput(username, password)
    // Destructure cleaned data
    const { username: cleanedUsername, password: cleanedPassword } = cleanedUserData

    // Check if the username length is at least two characters
    if (cleanedUsername.length < 2) {
      return res.status(400).json({
        message: "Username must be at least two characters long."
      })
    }

    // Clean up and validate email
    const cleanedEmail = validator.trim(validator.escape(email)).toLowerCase()
    if (!validator.isEmail(cleanedEmail)) {
      return res.status(400).json({
        message: "Please provide a valid email address."
      })
    }

    // Check if username or email already exist in the database
    const existingUser = await knex("users").where({ username: cleanedUsername }).orWhere({ email: cleanedEmail }).first()

    if (existingUser) {
      if (existingUser.username === cleanedUsername) {
        return res.status(400).json({
          message: "That username is already taken."
        })
      } else {
        return res.status(400).json({
          message: "Email already exists. Please use a different email address."
        })
      }
    }

    // Hash the password
    const hashedPassword = bcrypt.hashSync(cleanedPassword, 10)

    // Insert user into the database
    const [userId] = await knex("users").insert({
      username: cleanedUsername,
      email: cleanedEmail,
      password: hashedPassword // Store hashed password in the database
    })

    // Construct Gravatar URL
    const avatarUrl = `https://gravatar.com/avatar/${md5(cleanedEmail)}?s=128`

    // Generate AWS token
    const token = jwt.sign({ userId: userId, username: cleanedUsername }, JWT_SECRET_KEY, { expiresIn: "5h" })

    // Return AWS token along with user details
    res.status(200).json({
      token: token,
      username: cleanedUsername,
      avatar: avatarUrl
    })
  } catch (error) {
    console.error("Error creating user:", error)
    res.status(500).json({
      message: `Unable to create new user: ${error.message}`
    })
  }
}

module.exports = {
  register,
  login
}
