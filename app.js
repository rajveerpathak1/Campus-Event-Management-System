const express = require("express");
const session = require("./config/session");

const event = require('./routes/eventRoutes');
const auth  = require('./routes/authRoutes');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session);



app.get("/",(req,res)=>{
console.log("someone hit on the server !!!!!");
res.status(200).send("Welcome to our event management system !!!");
});



app.use('/events', event);

app.use('/auth',auth);



module.exports = app;
