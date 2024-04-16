const knex = require("knex")(require("../knexfile"))
const md5 = require("md5")
require("dotenv").config()
const sanitizeHTML = require("sanitize-html")
const express = require("express")

const jwt = require("jsonwebtoken")
const { JWT_SECRET_KEY } = process.env

const app = express()
app.use(express.json())
//Senitize the input from the user
function sanitizeInput(input) {
  if (typeof input !== "string") {
    return ""
  }
  return sanitizeHTML(input.trim())
}
//Create post code
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
    await knex("posts").insert({
      user_id: userId,
      title: title,
      body: body
    })
    res.json("Data inserted into posts table successfully.")
  } catch (error) {
    return res.status(500).json({
      message: `Unable to create new user: ${error.message}`
    })
  }
}

const updatePost = async (req, res) => {
  let title = sanitizeInput(req.body.title)
  let body = sanitizeInput(req.body.body)
  let token = sanitizeInput(req.body.token)

  // Verify the token and decode it
  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY)
    const userId = decodedToken.userId

    // Extract post ID from request parameters
    const postId = req.params.id

    if (title === "") {
      return res.status(400).json({ message: "You must provide a title" })
    }

    if (body === "") {
      return res.status(400).json({ message: "You must provide a body" })
    }

    // Check if the post exists and belongs to the user
    const post = await knex("posts").where({ id: postId, user_id: userId }).first()

    if (!post) {
      return res.status(404).json({ message: "Post not found or you don't have permission to update it" })
    }

    // Update the post
    await knex("posts").where({ id: postId }).update({ title, body })

    res.json("Post updated successfully")
  } catch (error) {
    return res.status(500).json({ message: `Unable to update post: ${error.message}` })
  }
}

//View single post
const viewSinglePost = async function (req, res) {
  const postId = req.params.id
  try {
    const post = await knex("posts").where("id", postId).first()
    if (!post) {
      res.json(null)
      return
    }
    // Fetch user information related to this post
    const user = await knex("users").where("id", post.user_id).first()
    if (!user) {
      res.json(null)
      return
    }
    // Include user's username and email in the post object
    post.username = user.username
    post.avatar = `https://gravatar.com/avatar/${md5(user.email)}?s=128`

    res.json(post)
  } catch (e) {
    res.json(false)
  }
}
//Delete the post
const postDelete = async function (req, res) {
  const postId = req.params.id
  try {
    const post = await knex("posts").where("id", postId).first()
    if (!post) {
      return res.status(404).json({ message: "Post not found" })
    }
    await knex("posts").where("id", postId).delete()
    res.json("Success")
  } catch (e) {
    res.json("You do not have permission to perform that action.")
  }
}

module.exports = {
  create,
  viewSinglePost,
  postDelete,
  updatePost
}
