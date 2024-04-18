const express = require("express")
const router = require("express").Router()
const userController = require("../controllers/user-controller")
const postController = require("../controllers/post-controller")

router.route("/create-post").post(userController.mustbeLoggedIn, postController.create)
router.route("/post/:id").get(postController.viewSinglePost)
router.route("/post/:id").delete(userController.mustbeLoggedIn, postController.postDelete)
router.route("/post/:id/edit").post(userController.mustbeLoggedIn, postController.updatePost)
module.exports = router
