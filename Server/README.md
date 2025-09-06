# User Registration Documentation

## Overview
This document describes the user registration process for the EcoFare backend, including the involved files, API endpoint, required fields, and the flow of registration.

---

## Files Involved
- **routes/auth.js**: Defines the registration route and applies validation.
- **controllers/user.controller.js**: Contains the registration logic (hashing password, saving user, issuing JWT).
- **models/user.js**: Defines the user schema and helper methods for password hashing and JWT generation.

---

## Registration API Endpoint
- **URL:** `/api/auth/register`
- **Method:** `POST`
- **Content-Type:** `application/json`

### Required Fields
| Field           | Type     | Required | Notes                                  |
|-----------------|----------|----------|----------------------------------------|
| name            | String   | Yes      | User's full name                       |
| username        | String   | Yes      | Unique username (acts as login ID)     |
| password        | String   | Yes      | User's password                        |
| phone           | String   | Yes      | User's phone number                    |
| role            | String   | Yes      | 'user' or 'rider'                      |
| vehicleType     | String   | If rider | Only for role 'rider'                  |
| vehicleNumber   | String   | If rider | Only for role 'rider'                  |
| experienceYears | Number   | If rider | Only for role 'rider'                  |
| ecoFriendly     | Boolean  | If rider | Only for role 'rider'                  |

---

## Registration Flow
1. **Client** sends a POST request to `/api/auth/register` with the required fields in the JSON body.
2. **auth.js** route validates the input using `express-validator`.
3. If validation passes, the request is forwarded to `userController.registerUser`.
4. **user.controller.js**:
    - Extracts and checks required fields.
    - Hashes the password using bcrypt.
    - Creates a new user document and saves it to MongoDB.
    - Generates a JWT token for the new user.
    - Responds with a success message, the JWT token, and the user data.
5. **Client** receives the response and can use the JWT token for authenticated requests.

---

## Example Request (Postman/Frontend)
```
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "username": "johndoe123",
  "password": "yourpassword",
  "phone": "9876543210",
  "role": "rider",
  "vehicleType": "ev_bike",
  "vehicleNumber": "DL01AB1234",
  "experienceYears": 2,
  "ecoFriendly": true
}
```

---

## Example Success Response
```
{
  "message": "User registered successfully",
  "token": "<JWT_TOKEN>",
  "user": {
    "_id": "...",
    "name": "John Doe",
    "username": "johndoe123",
    "phone": "9876543210",
    "role": "rider",
    "vehicleType": "ev_bike",
    "vehicleNumber": "DL01AB1234",
    "experienceYears": 2,
    "ecoFriendly": true,
    "__v": 0
  }
}
```

---

## Notes
- Rider-specific fields are only required if `role` is set to `rider`.
- Passwords are securely hashed using bcrypt before storage.
- A JWT token is returned on successful registration for use in authenticated requests. 

---

# User Login Documentation

## Overview
This section describes the user login process for the EcoFare backend, including the involved files, API endpoint, required fields, and the flow of login.

---

## Files Involved
- **routes/auth.js**: Defines the login route and applies validation.
- **models/user.js**: Defines the user schema and helper methods for password comparison and JWT generation.

---

## Login API Endpoint
- **URL:** `/api/auth/login`
- **Method:** `POST`
- **Content-Type:** `application/json`

### Required Fields
| Field     | Type   | Required | Notes                      |
|-----------|--------|----------|----------------------------|
| username  | String | Yes      | User's username/login ID   |
| password  | String | Yes      | User's password            |

---

## Login Flow
1. **Client** sends a POST request to `/api/auth/login` with the required fields in the JSON body.
2. **auth.js** route forwards the request to the login logic.
3. **Login logic**:
    - Finds the user by username.
    - Compares the provided password with the stored hashed password using bcrypt.
    - If valid, generates a JWT token for the user.
    - Responds with a success message, the JWT token, and the user data.
    - If invalid, responds with an error message.
4. **Client** receives the response and can use the JWT token for authenticated requests.

---

## Example Request (Postman/Frontend)
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "username": "khushi123",
  "password": "yourpassword"
}
```

---

## Example Success Response
```
{
  "message": "Successfully Logged In!",
  "token": "<JWT_TOKEN>",
  "user": {
    "_id": "...",
    "name": "John Doe",
    "username": "johndoe123",
    "phone": "9876543210",
    "role": "rider",
    "vehicleType": "ev_bike",
    "vehicleNumber": "DL01AB1234",
    "experienceYears": 2,
    "ecoFriendly": true,
    "__v": 0
  }
}
```

---

## Notes
- The JWT token should be included in the `Authorization` header as `Bearer <token>` for all protected API requests.
- If the credentials are invalid, the response will contain an error message and no token. 