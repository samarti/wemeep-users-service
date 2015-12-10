
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');
var url = 'mongodb://192.168.99.100:27017/local';
var PORT = 8080;
var theDb;
var usersCollection;

MongoClient.connect(url, function(err, db) {
  // Create a capped collection with a maximum of 1000 documents
  theDb = db;
  theDb.createCollection("users", {capped:true, size:10000, max:1000, w:1}, function(err, collection) {
    console.log("Users collection created")
    usersCollection = collection;
  });
});

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

app.get('/', function(req, res){
  res.send("WeMeep User Service. If you are reading this, we suck at securing API's.");
});
app.listen(PORT);

//Create a user with `POST` at
app.post('/users/', function(req, res){
  var data = {
    "username":req.body.username ,
    "email": req.body.email,
    "password":req.body.password ,
    "twitterId":req.body.twitterId ,
    "facebookId":req.body.facebookId ,
    "picture": req.body.picture,
    "gcmId":req.body.gcmId
  }

  if(usernameExists(data["username"])){
    throwJsonResponse(res, "Error", "Username exists");
  }
  if(emailExists(data["email"])){
    throwJsonResponse(res, "Error", "Email exists");
  }
  if(!validEmail(data["username"])){
    throwJsonResponse(res, "Error", "Invalid email");
  }
  saveUser(res, data);
});

function usernameExists(username){
    return false;
}

function emailExists(email){
  return false;
}

function validEmail(email){
  return true;
}

function saveUser(res, data){
  usersCollection.bulkWrite( [ {insertOne : {document :{"username":data["username"]
                  , "email":data["email"]
                  , "password":data["password"]
                  , "twitterId":data["twitterId"]
                  , "facebookId":data["facebookId"]
                  , "picture":data["picture"]
                  , "gcmId":data["gcmId"]} } } ] , 
                  {ordered:true, w:1}, function(err, r) {
    return res.json({"id":JSON.parse(JSON.stringify(r.insertedIds))['0']});
  });
}

//Get a user with `GET` at
app.get('/users/:id', function(req, res){

});
//Get a user followers with `GET` at
app.get('/users/:id/followers', function(req, res){
  res.send('user ' + req.params.id);
});

//Get a user followees with `GET` at
app.get('/users/:id/followees', function(req, res){
  res.send('user ' + req.params.id);
});

//Add a followee with `POST` at
app.post('/users/:id/followees', function(req, res){
  res.send('user ' + req.params.id);
});

//Remove a followee with `DELETE` at
app.delete('/users/:id/followees', function(req, res){
  res.send('user ' + req.params.id);
});

function throwJsonResponse(res, type, message){
  return res.json({id:message});
}
