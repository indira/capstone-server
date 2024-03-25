const knex = require("knex")(require("../knexfile"))
const md5 = require("md5")
const bcrypt = require("bcryptjs")

const user = (req, res) => {
  res.send("This is a test")
}

const register = async (req, res) => {
  console.log("body", req.body)
  const { username, email, password } = req.body

  // Check if all required fields are provided
  if (!username || !email || !password) {
    return res.status(400).json({
      message: "Please provide username, email, and password to register."
    })
  }

  try {
    // Hash the password
    const hashedPassword = bcrypt.hashSync(password, 10)

    // Construct Gravatar URL
    const avatarUrl = `https://gravatar.com/avatar/${md5(email)}?s=128`
    console.log("Avatar URL:", avatarUrl)

    // Insert user into the database
    const [userId] = await knex("user").insert({
      username,
      email,
      password: hashedPassword // Store hashed password in the database
    })

    const createdUser = { id: userId, username, email, avatarUrl }
    console.log("result", createdUser)

    res.status(201).json(createdUser)
  } catch (error) {
    console.error("Error creating user:", error)
    res.status(500).json({
      message: `Unable to create new user: ${error.message}`
    })
  }
}

module.exports = {
  register,
  user
}
