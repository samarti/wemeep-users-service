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
- NEO4J_PASS
- NEO4J_USER
```
### WebService
The web service exposes the following methods:

- Create a user with `POST` at

```
http://host:8080/users/

Data: { body: { username:<someUsername>, email:<someEmail>, ... } }
Returns the user id registration was successful
```
- Get a user with `GET` at

```
http://host:8080/users?id=<someId>

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
- Add a follower with `POST` at

```
http://host:8080/users/{id}/followers

Data: { body: { id:<someUserId> } }
```

- Remove a follower with `DELETE` at

```
http://host:8080/users/{id}/followers

Data: { body: { id:<someUserId> } }
```
### Data model
#### Objects
##### User
|Field   |Values   |
|---|---|
| username  | String  |
| email  | String  |
| id  | Number  |
| password | String |
| twitterId | Number|
| facebookId | Number |
| gcmId | String |
| public | Boolean |
| picture | URL |
| updatedAt | Timestamp |
| createdAt | Timestamp |
##### Meep
|Field   |Values   |
|---|---|
| sender  | String  |
| message  | String  |
| id  | Number  |
| type | String |
| receipts | Number|
| facebookId | Number |
| public | Boolean |
| isRoot | Boolean |
| picture | URL |
| updatedAt | Timestamp |
| createdAt | Timestamp |
