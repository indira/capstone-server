const express = require("express")
const router = express.Router()
const userController = require("../controllers/user-controller")

router.route("/login").post(userController.login)

// Use POST method for user registration
router.route("/register").post(userController.register)

router.get("/profile/:username", userController.ifUserExists, userController.profileBasicData)
router.get("/profile/:username/posts", userController.ifUserExists, userController.getPosts)

module.exports = router
