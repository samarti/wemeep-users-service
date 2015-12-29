# WeMeep Users Service
### Description
This service handles all the user info and their relations, like who they follow and who follows them, their favorite content and so on. It's built over Docker containers and uses NodeJS-ExpressJS and Neo4J for storage.
### Setup
#### Docker
Simply:
```
docker-compose up -d
```
#### Environment variables
Set:
```
- SESSION_SERVICE_URL
```

#### Exposed ports
```
- API: 8080
- DB: 27017, 28017
- Genghis: 5000
```

### WebService
The web service exposes the following methods:

- Create a user with `POST` at

```
http://host:8080/users/

Data: { body: { username:<someUsername>, email:<someEmail>, ... } }
Returns the user id if registration was successful
```
- Get a user with `GET` at

```
http://host:8080/users/{id}

Returns the user data
```
- Get a user followers with `GET` at

```
http://host:8080/users/{id}/followers
```
- Get a user followees with `GET` at

```
http://host:8080/users/{id}/followees
```
- Add a followee with `POST` at

```
http://host:8080/users/{id}/followees

Data: { body: { id:<someUserId> } }
```

- Remove a followee with `DELETE` at

```
http://host:8080/users/{id}/followees

Data: { body: { id:<someUserId> } }
```
- Login a User with `POST` at

```
http://host:8080/users/login

Data: { body: { username:<someUsername>, email:<someEmail>, ... }}

Returns a token or an error
```

- Validate a User credentials with `POST`

```
http://host:8080/users/validate

Data: { body: { username:<someUsername>, email:<someEmail>, ... }}

Returns true or false
```
### Data model
#### Objects

##### User
|Field   |Values   |
|---|---|
| username  | String  |
| email  | String  |
| id  | String  |
| password | String |
| twitterId | Number|
| facebookId | Number |
| gcmId | String |
| isPublic | Boolean |
| picture | URL |
| salt | String |
| updatedAt | Timestamp |
| createdAt | Timestamp |
| followers    | Array<User> |
| followees    | Array<User> |

## TODO
- Add authentication to the database
- Protect the API
- Check for SQLInjection
