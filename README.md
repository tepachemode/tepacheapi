# tepacheapi

![The Tepache Mode mascot](/public/tepache-for-docs.png 'Rotting pineapple')

_Rotting pineapple by Kelsey Clarke_

API midtier for orchestrating gameplay for Tepache Mode platform
_This is a work in progress with high churn_

## Running Node Application

### Prerequisites

You will need the following things properly installed on your computer.

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) (with npm)
- [Firebase CLI](https://cli.emberjs.com/release/)

### Installation

- `git clone https://github.com/manufacturedba/tepacheweb` this repository
- `cd tepacheweb`
- `npm install`

#### Firebase Emulators

This application makes use of Firebase's authentication, firestore, and storage.
Instructions are not provided here for how to setup.

- `firebase init`

### Running / Development

- `firebase emulators:start`
- `node run emulate`

_Server code is mid-migration from proof of concept file, index.js_

### Running / Production

- `npm start`


#### Environment parameters

`FIREBASE_STORAGE_EMULATOR_HOST="localhost:9199"`
`FIRESTORE_EMULATOR_HOST="localhost:8080"`
`FIREBASE_AUTH_EMULATOR_HOST="localhost:9099"`

#### Running Tests

- Definitely TODO

#### Linting

- `npm run lint`
- `npm run lint:fix`

### Further Reading / Useful Links

- [hapi](https://hapi.dev/)
- Development
  - [postman](https://www.postman.com/)
