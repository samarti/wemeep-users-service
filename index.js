
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var PORT = 8080;

var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase('http://neo4j:wemeep@db:7474');

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
  db.cypher({
    query: 'CREATE (n:User { username: \"' + data["username"] + '\"' +
                ', email: \"' + data["email"] + '\"' +
                 ', facebookId: \"' + data["facebookId"] + '\"' +
                 ', password: \"' + data["password"] + '\"' +
                 ', twitterId: \"' + data["twitterId"] + '\"' +
                 ', picture: \"' + data["epicturemail"] + '\"' +
                 ', gcmId: \"' + data["gcmId"] + '\"' +
                 '}) return ID(n)',
  }, function callback(err, results) {
      if (err) throw err;
      var result = results[0];
      if (!result) {
          console.log('No user found.');
          throwJsonResponse(res, "Error", "Unknown error");
      } else {
          var id = result['id'];
          throwJsonResponse(res, "Success", JSON.stringify(results));
      }
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
  return res.json({type:message});
}
