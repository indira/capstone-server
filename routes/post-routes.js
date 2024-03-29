const userController = require("../controllers/user-controller")
const postController = require("../controllers/post-controller")
const router = require("express").Router()
const express = require("express")

router.route("/create-post").post(userController.mustbeLoggedIn, postController.create)

module.exports = router
