const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');
const { default: mongoose } = require('mongoose');
const { all } = require('express/lib/application');
require('dotenv').config()
app.use(bodyParser.urlencoded({extended:true}))
mongoose.connect(process.env.MONGO_URL)
const userSchma = mongoose.Schema({
  username:String,
})
const exerciseSchma =mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: Date,
  userId:mongoose.Types.ObjectId
})

const userModel = mongoose.model("User",userSchma)
const exerciseModel = mongoose.model("Exercise",exerciseSchma)

app.use(cors())

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post("/api/users", async(req,res)=>{
    const {username} = req.body
    try{
      const newUser = new userModel({username:username})
      await newUser.save()
      res.status(201).json({username:newUser.username , _id:newUser._id})
    }catch(err){
      console.log(err)
    }
})

app.post("/api/users/:_id/exercises", async(req,res)=>{

  const id = req.params._id;
  let {description ,duration,date} = req.body
  try{
    const findUser = await userModel.findById(id)
    if(findUser){
 const newExercise = new exerciseModel ({  username: findUser.userName,
  description,
  duration,
  date:date? new Date(date) : new Date().toLocaleDateString(),
  userId:id})
    await newExercise.save()
    return res.status(201).json(newExercise)
    }
    res.status(404).json({Error:"User Not Found"})
  }catch(err){
    res.status(500).json({ Error: "Internal Server Error" })  }
})


app.get("/api/users", async(req,res)=>{
    const allUser = await userModel.find().select("userName _id")
    res.status(200).send(allUser)
  
})

app.get("/api/users/:_id/logs", async(req,res)=>{
   const {from , to , limit}  = req.query
   const id = req.params._id;
   const user = await userModel.findById(id)
   if(!user){
    res.send("Could Not Find User")
    return
   }
   let dateObj = {}
  if(from){
    dateObj["$gte"]= new Date(from)
  }
  if(to){
    dateObj["$lte"]=new Date(to)
  }
  let filter = {
    userId:id
  }
  if(from || to){
    filter.date = dateObj
  }
  const exercise = await exerciseModel.find(filter).limit(+limit ?? 500)
  const log = exercise.map(e=>({
   description:e.description,
   duration :e.duration,
   date:e.date.toDateString()
  }))
  res.json({
    username : user.userName,
   _id:user._id,
   log
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
