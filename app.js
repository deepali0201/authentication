const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')

const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'userData.db')

let db = null

const intialize = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('Server is Running at http://localhost:3000/'),
    )
  } catch (e) {
    console.log(`db error ${e.message}`)
    process.exit(1)
  }
}
intialize()

const validatePassword = password => {
  return password.length > 4
}

//Register user
app.post('/register', async (request, response) => {
  let {username, name, password, gender, location} = request.body //Destructuring the data from the API call

  let hashedPassword = await bcrypt.hash(password, 10) //Hashing the given password

  let checkTheUsername = `
            SELECT *
            FROM user
            WHERE username = '${username}';`
  let userData = await db.get(checkTheUsername) //Getting the user details from the database
  if (userData === undefined) {
    //checks the condition if user is already registered or not in the database
    /*If userData is not present in the database then this condition executes*/
    let postNewUserQuery = `
            INSERT INTO
            user (username,name,password,gender,location)
            VALUES (
                '${username}',
                '${name}',
                '${hashedPassword}',
                '${gender}',
                '${location}'
            );`
    if (password.length < 5) {
      //checking the  length of the password
      response.status(400)
      response.send('Password is too short')
    } else {
      /*If password length is greater than 5 then this block will execute*/
      let newUserDetails = await db.run(postNewUserQuery) //Updating data to the database
      response.status(200)
      response.send('User created successfully')
    }
  } else {
    /*If the userData is already registered in the database then this block will execute*/
    response.status(400)
    response.send('User already exists')
  }
})

// app.post('/register', async (request, response) => {
//   const {username, name, password, gender, location} = request.body
//   const hashedPassword = await bcrypt.hash(request.body.password, 10)
//   const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`
//   const dbUser = await db.get(selectUserQuery)
//   if (dbUser === undefined) {
//     const createUserQuery = `
//       INSERT INTO
//         user (username, name, password, gender, location)
//       VALUES
//         (
//           '${username}',
//           '${name}',
//           '${hashedPassword}',
//           '${gender}',
//           '${location}'
//         )`
//     if (validatePassword(password)) {
//       await db.run(createUserQuery)
//       response.status = 200
//       response.send(`User created successfully`)
//     } else {
//       response.status = 400
//       response.send(`Password is too short`)
//     }
//   } else {
//     response.status = 400
//     response.send('User already exists')
//   }
// })

//Login user
app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid User')
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMatched === true) {
      response.send('Login Success!')
    } else {
      response.status(400)
      response.send('Invalid Password')
    }
  }
})

//change password

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid User')
  } else {
    const isPasswordMatched = await bcrypt.compare(oldPassword, dbUser.password)
    if (isPasswordMatched === true) {
      if (validatePassword(password)) {
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        const updatePasswordQuery = `
        UPDATE 
        user
        SET 
        password='${hashedPassword}'
        where username='${username}'; `
        const user = await db.run(updatePasswordQuery)
        response.send(`Password updated`)
      } else {
        response.status(400)
        response.send(`Password is too short`)
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})

module.exports = app
