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
  const email = sanitizeInput(req.body.email)
  const password = req.body.password

  if (typeof password !== "string") {
    return ""
  }

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

// Middleware function for getting user posts
const getPosts = async (req, res) => {
  try {
    const user = req.profileUser
    const posts = await knex("posts").where("user_id", user.id)
    // Add user avatar URL to each post object
    const postsWithAvatar = await Promise.all(
      posts.map(async post => {
        const gravatarURL = `https://gravatar.com/avatar/${md5(user.email)}?s=128`
        return {
          ...post,
          user_avatar: gravatarURL
        }
      })
    )

    req.posts = postsWithAvatar
    res.status(200).json(postsWithAvatar)
  } catch (error) {
    console.error("Error getting user posts:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

const mustbeLoggedIn = async (req, res, next) => {
  const token = req.body.token

  try {
    const token = req.body.token
    if (!token) {
      return res.status(401).send("You are not LoggedIn.")
    }

    const decodedToken = jwt.verify(token, JWT_SECRET_KEY)
    if (!decodedToken) {
      return res.status(401).send("You are not LoggedIn")
    }
    req.user = decodedToken
    next()
  } catch (error) {
    console.error("Error verifying token:", error)
    return res.status(500).send("Internal Server Error")
  }
}

const ifUserExists = async function (req, res, next) {
  const username = req.params.username
  try {
    const user = await knex("users").where("username", username).first()
    req.profileUser = user
    const postCount = await knex("posts").count("* as count").where("user_id", user.id).first()
    req.postCount = postCount.count
    const posts = await knex("posts").where("user_id", user.id)
    req.posts = posts
    next()
  } catch (error) {
    res.status(500).json({ error: "Internal server error" })
  }
}

const profileBasicData = function (req, res) {
  res.json({
    profileUsername: req.profileUser.username,
    profileAvatar: `https://gravatar.com/avatar/${md5(req.profileUser.email)}?s=128`,
    counts: { postCount: req.postCount }
  })
}

module.exports = {
  register,
  login,
  getPosts,
  mustbeLoggedIn,
  ifUserExists,
  profileBasicData
}
