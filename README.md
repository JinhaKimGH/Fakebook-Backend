# Facebook-Backend

This is the backend component of the [Fakebook App](https://github.com/JinhaKimGH/Fakebook-App).

The frontend utilizes NodeJS, ExpressJS, [BcryptJS](https://www.npmjs.com/package/bcrypt) [MongooseJS](https://mongoosejs.com/docs/), and [PassportJS](https://www.passportjs.org/).

## Environment Variables

To run this project, you will need to add the following variables to a .env file.

`MONGODBURI` -> [MongoDBURI for database](https://www.mongodb.com/docs/manual/reference/connection-string/)
`ORIGINLINK` -> Link to the frontend
`FACEBOOK_APP_ID` -> [Facebook App URL](https://developers.facebook.com/)
`FACEBOOK_SECRET` -> [Facebook App Secret](https://developers.facebook.com/)

## Run Locally

Clone the project

```bash
  git clone git@github.com:JinhaKimGH/Fakebook-Backend.git
```

Go to the project directory

```bash
  cd backend/server
```

Install dependencies

```bash
  npm install
```

Start the server

```bash
  npm run dev
```

## License

[MIT](https://choosealicense.com/licenses/mit/)
