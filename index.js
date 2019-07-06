// Import Packages
var mongodb = require('mongodb');
var ObjectID = mongodb.ObjectID;
var crypto = require('crypto');
var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var fs = require('fs');

// Password Utils
// Create Function to Random Salt
var genRandomString = function(length) {
   return crypto.randomBytes(Math.ceil(length / 2))
      .toString('hex') // Convert to hex format
      .slice(0, length);
};

var sha512 = function(password, salt) {
   var hash = crypto.createHmac('sha512', salt);
   hash.update(password);
   var value = hash.digest('hex');
   return {
      salt:salt,
      passwordHash:value
   };
};

function saltHashPassword(userPassword) {
   var salt = genRandomString(16); // Create 16 Random Character
   var passwordData = sha512(userPassword, salt);
   return passwordData;
}

function checkHashPassword(userPassword, salt){
   var passwordData = sha512(userPassword, salt);
   return    passwordData;
}

// Create Express Service
var app = express();
app.use(bodyParser.urlencoded({extended: false})); 
app.use(bodyParser.json());


// Create MongoDB Client
var mongoClient = mongodb.MongoClient;

// Connection URL
var url = 'mongodb+srv://123456:11235813@madcamp-2sfzi.mongodb.net'

// Node.js Script has been connected to MongoDB
mongoClient.connect(url, {useNewUrlParser: true}, function(err, client) {
   if(err) {
      console.log('Unable to connect to the mongoDB server.Error', err);
   } else {
      // Register
      console.log("connected");

      app.use(session({
         secret: '@#@$MYSIGN#@$#$',
         resave: false,
         saveUninitialized: true
      }));

      app.post('/register', (request, response, next) => {
         var post_data = request.body;
         var _id = post_data.id;
         var rawPassword = post_data.password;
         var hashData = saltHashPassword(rawPassword);
         var _salt = hashData.salt;
         var _password = hashData.passwordHash;
         var name = post_data.name;
         var phoneNumber = post_data.phoneNumber;
         var email = post_data.email;
         var token = post_data.token;

         var db = client.db('madcamp');
         db.collection('users').find({_id: _id}).count(function(err,number){
            if(number != 0) {
               response.json({result: "FAIL", data: "Email Already Exists"});
               console.log('Email Already Exists');
            } else {
               // Insert Data
               db.collection('users')
                  .insertOne({_id:_id, _password:_password, _salt: _salt, account:{_id:_id, name:name, email:email, token:token}}, function(error, res) {
                     response.json({result: "OK", data: "Registration Success"});
                     console.log('Registration Success');
               });
            }            
         });
      });

      // Login
      app.post('/login', (request, response, next) => {
         var post_data = request.body;
         
         var _id = post_data.id;
         var rawPassword = post_data.password;
         var db = client.db('madcamp');
         
         // Check Whether Exist Email
         db.collection('users')
            .findOne({_id: _id}, function (err, user){
               if(user == null){
                  response.json({result:"FAIL", data:'WRONG_ID'});
                  console.log('Wrong ID');
               }
               var salt = user._salt;
               var hashedPassword = checkHashPassword(rawPassword, salt).passwordHash;
               var rhs = user._password;
               request.session.account = user.account
               if(hashedPassword==rhs) {
                  request.session.account = user.account;
                  response.json({result:"OK", data:"Login Success"});
                  console.log('Login Success');
               } else {
                  response.json({result:"FAIL", data:'WRONG_PASSWORD'});
                  console.log('Wrong Password');
               }
            })
      });
      
      app.use((req,res,next)=>{
         if (req.session.account == null){
            res.json({result:"FAIL", data:"UNKNOWN_ACCESS"})
         }
         else{
            next();
         }
      })

      app.post('/crud/*', (req,res,next)=>{
         console.log('enter crud');
         require('./router/crud.js')(app, client);
         console.log('?');
         next();
      });
            // Start Web Server
   }
   app.listen(3000, () => {
      console.log('Connected to MongoDB Server , Webservice running on port 3000');
   })
});