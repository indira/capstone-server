const userController = require("../controllers/user-controller")
const router = require("express").Router()
const express = require("express")

router.route("/login").post(userController.login)

// Use POST method for user registration
router.route("/register").post(userController.register)

router.route("/profile/:username").get(userController.ifUserExists, userController.profileBasicData)

module.exports = router
