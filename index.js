const express = require("express")
const app = express()
require("dotenv").config()
const cors = require("cors") // This will cross origin: differ domains
const bodyParser = require("body-parser") // Add this line
const PORT = process.env.PORT || 5050

/*
 * Middleware
 * -----------------------------------
 */
app.use(express.json()) // adds req.body
app.use(express.static("public")) // adds public folder to serve images
app.use(cors()) // allows sharing cross-origin requests
app.use(bodyParser.json()) // Add this line

const userRoutes = require("./routes/user-routes")
const postRoutes = require("./routes/post-routes")

// Register user routes
app.use("/", userRoutes) // Mount userRouter at the root
app.use("/", postRoutes)

app.get("/", (req, res) => {
  res.send("Welcome to my API")
})

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`)
})
