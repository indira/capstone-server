const userController = require("../controllers/user-controller")
const router = require("express").Router()
const express = require("express")

router.route("/").get(userController.user)

// Use POST method for user registration
router.route("/register").post(userController.register)

module.exports = router
