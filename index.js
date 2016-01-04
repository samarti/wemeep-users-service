
var express = require('express');
var ObjectID = require('mongodb').ObjectID
var app = express();
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');
var bcrypt = require('bcrypt');
var request = require("request");
var querystring = require('querystring');
var http = require('http');
var fs = require('fs');

var sessionServiceUrl = process.env.SESSION_SERVICE_URL;
//var sessionServiceUrl = "http://ec2-54-233-116-227.sa-east-1.compute.amazonaws.com:4567/generatetoken"
var url = 'mongodb://db:27017/local';
//var url = 'mongodb://ec2-54-233-116-255.sa-east-1.compute.amazonaws.com:27017/local'
var PORT = 8080;
var theDb;
var usersCollection;

MongoClient.connect(url, function(err, db) {
  // Create a capped collection with a maximum of 1000 documents
  theDb = db;
  theDb.createCollection("users", {w:1}, function(err, collection) {
    console.log("Users collection created");
    usersCollection = collection;
  });
});

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

app.get('/searchuser', function(req, res){
  searchUser(res, req.query.username);
});
app.listen(PORT);

app.get('/', function(req, res){
  res.send("WeMeep User Service. If you are reading this, we suck at securing API's.");
});

//Create a user with `POST` at
app.post('/users/', function(req, res){
  var data = {
    "username":req.body.username ,
    "email": req.body.email,
    "password":req.body.password,
    "twitterId":req.body.twitterId ,
    "facebookId":req.body.facebookId ,
    "picture": req.body.picture,
    "gcmId":req.body.gcmId
  }

  if(typeof data.username === "undefined" || typeof data.password === "undefined"){
    res.json({"Error":"Missing fields."});
    return;
  }

  usersCollection.findOne( {username:req.body.username}, { fields:{"password":0, "salt":0} }, function(err, item) {
    if(item === null){
      usersCollection.findOne( {email:req.body.email}, { fields:{"password":0, "salt":0} }, function(err, item) {
        if(item === null)
          saveUser(res, data);
        else
          res.json({"Error":"Email exists"});
      });
    } else
      res.json({"Error":"Username exists"});
  });
});

//Get a user with `GET` at
app.get('/users/:id', function(req, res){
  getUser(res, req.params.id);
});

//Get a user followers with `GET` at
app.get('/users/:id/followers', function(req, res){
  getFollowers(res, req.params.id);
});

//Delete a user
app.delete('/users/:id', function(req, res){
  deleteUser(res, req.params.id);
});

//Get a user followees with `GET` at
app.get('/users/:id/followees', function(req, res){
  getFollowees(res, req.params.id);
});

//Update a following relation
app.put('/users/:id/followees', function(req, res){
  var type = req.body.type;
  if(type === "add")
    addFollowee(res, req.params.id, req.body.id);
  else if (type === "remove")
    removeFollowee(res, req.params.id, req.body.id);
  else res.json({"Error":"Unrecognized type. Choose add or remove"});
});

//Validates user credentials for the Session Service
app.post('/users/validate', function(req, res){
  areCredentialsValid(res, req.body.username, req.body.password);
});

//Logs in a user using the Session Service and returns a token
app.post('/users/login', function(req, res){
  generateToken(res, req.body.username, req.body.password, req.body.deviceid);
});

function saveUser(res, data){
  var salt = bcrypt.genSaltSync(10);
  usersCollection.bulkWrite( [ {insertOne : {document :{
                    "username":data["username"]
                  , "email":data["email"]
                  , "password":hashPassword(salt, data["password"])
                  , "twitterId":data["twitterId"]
                  , "facebookId":data["facebookId"]
                  , "picture":data["picture"]
                  , "gcmId":data["gcmId"]
                  , "salt":salt
                  , "followees":[]
                  , "followers":[]} } } ] ,
                  {ordered:true, w:1}, function(err, r) {
    return res.json({"id":JSON.parse(JSON.stringify(r.insertedIds))['0']});
  });
}

function getUser(res, id){
  try {
    var objID = ObjectID.createFromHexString(id);
    usersCollection.findOne( {"_id":objID}, { fields:{"password":0, "salt":0, "followees": 0, "followers": 0} }, function(err, item) {
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

function deleteUser(res, id){
  var objID = ObjectID.createFromHexString(id);
  usersCollection.deleteOne( {"_id":objID}, function(err, results) {
    if(err !== null)
      res.json({"Error":err.toString()});
    else {
      res.json({"Success":results.toString()});
    }
  });
}

function searchUser(res, username){
  var cursor = usersCollection.find({"username":{$regex: "^" + username, $options:"i"}}, { fields:{"username":1, "_id":1} });
  var ret = [];
  var i = 0;
  cursor.each(function(err, doc) {
    if(i > 9)
      return;

    if (doc != null) {
       ret[i] = doc;
       i++;
    } else {
       res.json(JSON.parse(JSON.stringify(ret)));
    }
   });
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

function areCredentialsValid(res, username, password){
  usersCollection.findOne( {"username":username}, function(err, user) {
    if(user === null)
      res.json({"Error":"User not found"});
    else {
      if(hashPassword(user.salt, password) === user.password)
        res.json({"id":user["_id"]});
      else
        res.json({"Error":"Bad credentials"});
    }
  });
}

function generateToken(res, username, password, deviceid){
  usersCollection.findOne( {"username":username}, function(err, user) {
    if(user === null)
      res.json({"Error":"User not found"});
    else if(user.password !== hashPassword(user.salt, password)){
      res.json({"Error":"Wrong password"});
    } else {
      var post_data = {};
      post_data.userId = user["_id"];
      post_data.username = username;
      post_data.deviceId = deviceid;

      request({
        uri: sessionServiceUrl,
        method: "POST",
        timeout: 10000,
        followRedirect: true,
        maxRedirects: 10,
        json: post_data,
        body: post_data
      }, function(error, response, body) {
        if(error === null)
          res.json({"token":body["token"]});
        else
          res.json({"Error":error});
      });
    }
  });
}

function hashPassword(salt, password){
  var hash = bcrypt.hashSync(password, salt);
  return hash;
}

function throwJsonResponse(res, type, message){
  return res.json({id:message});
}
