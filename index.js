const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
//need mongoose for a little more structure over mongodb, npm i mongodb mongoose
//mongodb+srv://chungsy3:<pw>@freecodecampcluster.pnhxlif.mongodb.net/exercise_tracker?retryWrites=true&w=majority  addig the exercise tracker indicates the db

//GET MONGOOSE
const mongoose = require('mongoose')
//connect mongoose
mongoose.connect(process.env.DB_URL)
//touse schema out of mongoose
const { Schema } = mongoose

//create a mongoose schema, id gets created auto
const UserSchema = new Schema({
  username: String,
})

const ExerciseSchema = new Schema({
  user_id: { type: String, required: true },
  description: String,
  duration: Number,
  date: Date,
})

//convert schema to model to use
const Exercise = mongoose.model("Exercise", ExerciseSchema)
const User = mongoose.model("User", UserSchema)


app.use(cors())
app.use(express.static('public'))
//middleware to use requestbody
app.use(express.urlencoded({extended: true}))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
//need to post/api/user
app.post("/api/users", async (req,res)=>{
  //need to get username
  //to test your post is working console.log(req.body)
  //creating a new user using mongoose model
  const userObj = new User({
    username: req.body.username
  })

  try{
  //saving the new user to db
    const user = await userObj.save()
    console.log(user)
    res.json(user)
  }catch(err){
    console.log(err)
  }
})
//post exercises using user
app.post("/api/users/:_id/exercises", async (req,res)=>{
  //grabbing _id value from the route
  const id = req.params._id
  //new objects created by the request body
  const { description, duration, date } = req.body

  try{
    //fiding a user by the input grabbed _id
    const user = await User.findById(id)
    if(!user){
      res.send("could not find user")
    }else{
      //if there is a user, create new exercise post, the date checks if theres a date, if no date then use todays date
      const exerciseObj = new Exercise({
        user_id: user._id, //saving user_id as user's ._id, this vaule is auto generated within the mongo db
        description,
        duration,
        date: date ? new Date(date):new Date()
      })
      const exercise = await exerciseObj.save()
      //responding with our findings.
      res.json({
        id: user._id,
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: new Date(exercise.date).toDateString //have to format the date, so have to turn it into a date object first before formatting
      })
    }
  }catch(err){
    console.log(err)
    res.send("there was an error saving")
  }
})
//get all users
app.get("/api/users", async (req, res)=>{
  const users = await User.find({}).select("_id username") //selecting _id and username
  if(!users) {
    res.send("no users")
  }else{
    res.json(users)
  }  
})

//get logs
app.get("/api/users/:_id/logs", async (req,res)=>{
  const {from, to, limit} =req.query
  const id = req.params._id
  const user = await User.findById(id)
  if(!user){
    res.send("could not find user")
    return
  }
  //building a query from the from to limit 
  //need a date object to filter using the from to limit
  let dateObj ={}
  if(from){
    dateObj["$gte"] = new Date(from) 
  }
  if(to){
    dateObj["$lte"] = new Date(to) //less than equal
  }
  let filter = {//this sets the user_id as the filter
    user_id: id
  }
  if(from || to){
    filter.date = dateObj
  }

  const exercises = await Exercise.find(filter).limit(+limit ?? 500)  //limit is parsed using the +, if null then 500, the filter is the filter that was created by us in 114-123

  const log = exercises.map(e=>({ //mapping exercise values to log values
    description: e.description,
    duration: e.duration,
    date: e.date.toDateString(),
  }))
  res.json({
    username: user.username,
    count: exercises.length,
    _id: user._id,
    log
  })
})




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
