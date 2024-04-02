const express = require("express")
const router = require("express").Router()
const userController = require("../controllers/user-controller")
const postController = require("../controllers/post-controller")

router.route("/create-post").post(userController.mustbeLoggedIn, postController.create)

module.exports = router
