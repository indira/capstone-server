const express = require("express")
const app = express()
require("dotenv").config()
const cors = require("cors")
const bodyParser = require("body-parser") // Add this line
const { PORT } = process.env

/*
 * Middleware
 * -----------------------------------
 */
app.use(express.json()) // adds req.body
app.use(express.static("public")) // adds public folder to serve images
app.use(cors()) // allows sharing cross-origin requests
app.use(bodyParser.json()) // Add this line

const userRoutes = require("./routes/user-routes")

// Register user routes
app.use("/", userRoutes) // Mount userRouter at the root

app.get("/", (req, res) => {
  res.send("Hello world")
})

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`)
})
