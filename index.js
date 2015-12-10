
var express = require('express');
var ObjectID = require('mongodb').ObjectID
var app = express();
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');
var url = 'mongodb://db:27017/local';
var PORT = 8080;
var theDb;
var usersCollection;

MongoClient.connect(url, function(err, db) {
  // Create a capped collection with a maximum of 1000 documents
  theDb = db;
  theDb.createCollection("users", {w:1}, function(err, collection) {
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

//Get a user with `GET` at
app.get('/users/:id', function(req, res){
  getUser(res, req.params.id);
});
//Get a user followers with `GET` at
app.get('/users/:id/followers', function(req, res){
  getFollowers(res, req.params.id);
});

//Get a user followees with `GET` at
app.get('/users/:id/followees', function(req, res){
  getFollowees(res, req.params.id);
});

//Add a followee with `POST` at
app.post('/users/:id/followees', function(req, res){
  addFollowee(res, req.params.id, req.body.id);
});

//Remove a followee with `DELETE` at
app.delete('/users/:id/followees', function(req, res){
  removeFollowee(res, req.params.id, req.body.id);
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
  usersCollection.bulkWrite( [ {insertOne : {document :{
                    "username":data["username"]
                  , "email":data["email"]
                  , "password":data["password"]
                  , "twitterId":data["twitterId"]
                  , "facebookId":data["facebookId"]
                  , "picture":data["picture"]
                  , "gcmId":data["gcmId"]
                  , "followees":[]
                  , "followers":[]} } } ] ,
                  {ordered:true, w:1}, function(err, r) {
    return res.json({"id":JSON.parse(JSON.stringify(r.insertedIds))['0']});
  });
}

function getUser(res, id){
  try {
    var objID = ObjectID.createFromHexString(id);
    usersCollection.findOne( {"_id":objID}, { fields:{"password":0} }, function(err, item) {
      if(item === null)
        res.json({"Error":"User not found"});
      else {
        res.json(item);
      }
    });
  } catch (err){
    res.json({"Error":"Invalid parameters"});
  }
}

function getFollowers(res, id){
  try {
    var objID = ObjectID.createFromHexString(id);
    usersCollection.findOne( {"_id":objID}, { fields:{ "followers":1 } }, function(err, item) {
      if(item === null)
        res.json({"Error":"User not found"});
      else
        res.json(item);
    });
  } catch (err){
    res.json({"Error":err.toString()});
  }
}

function getFollowees(res, id){
  try {
    var objID = ObjectID.createFromHexString(id);
    usersCollection.findOne( {"_id":objID}, { fields:{ "followees":1 } }, function(err, item) {
      if(item === null)
        res.json({"Error":"User not found"});
      else
        res.json(item);
    });
  } catch (err){
    res.json({"Error":err.toString()});
  }
}
//Buscamos los usuarios y lo actualizamos. Tomaría menos tiempo si usáramos sólo findOneAndUpdate 2 veces en vez de buscarlos y luego hacer el update
//Agregar restricción de qe no se repitan valores en los followers y followees
function addFollowee(res, idUser, idFollowee){
  try {
    var objIdUser = ObjectID.createFromHexString(idUser);
    var objIdFollowee = ObjectID.createFromHexString(idFollowee);
    usersCollection.findOne( {"_id":objIdFollowee}, { fields:{ "followees":1 } }, function(err, followee) {
      if(followee === null)
        res.json({"Error":"Followee not found"});
      else
        usersCollection.findOne( {"_id":objIdUser}, { fields:{ "followees":1 } }, function(err, user) {
          if(user === null)
            res.json({"Error":"User not found"});
          else {
            usersCollection.findOneAndUpdate({"_id":objIdUser}, { $push :{ followees : { "_id":objIdFollowee}} }, function(err, user){
              if(err === null)
                usersCollection.findOneAndUpdate({"_id":objIdFollowee}, { $push :{ followers : { "_id":objIdUser}} }, function(err, user){
                  if(err === null)
                    res.json({"Success":"Relationship created"});
                  else
                    res.json({"Error":err.toString()});
                });
              else
                res.json({"Error":err.toString()});
            });
          }
        });
    });
  } catch (err){
    res.json({"Error":err.toString()});
  }
}

function removeFollowee(res, idUser, idFollowee){
  try {
    var objIdUser = ObjectID.createFromHexString(idUser);
    var objIdFollowee = ObjectID.createFromHexString(idFollowee);
    usersCollection.findOne( {"_id":objIdFollowee}, { fields:{ "followees":1 } }, function(err, followee) {
      if(followee === null)
        res.json({"Error":"Followee not found"});
      else
        usersCollection.findOne( {"_id":objIdUser}, { fields:{ "followees":1 } }, function(err, user) {
          if(user === null)
            res.json({"Error":"User not found"});
          else {
            usersCollection.findOneAndUpdate({"_id":objIdUser}, { $pull :{ followees : { "_id":objIdFollowee}} }, function(err, user){
              if(err === null)
                usersCollection.findOneAndUpdate({"_id":objIdFollowee}, { $pull :{ followers : { "_id":objIdUser}} }, function(err, user){
                  if(err === null)
                    res.json({"Success":"Relationship eliminated"});
                  else
                    res.json({"Error":err.toString()});
                });
              else
                res.json({"Error":err.toString()});
            });
          }
        });
    });
  } catch (err){
    res.json({"Error":err.toString()});
  }
}

function throwJsonResponse(res, type, message){
  return res.json({id:message});
}
