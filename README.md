# express-ez-405
![Build Passing](https://img.shields.io/badge/build-passing-blue)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/Justinlkirk/express-ez-405)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Release: 1.0.2](https://img.shields.io/badge/Release-1.0.2-orange)

## Table of Contents
- [Introduction](#introduction)
- [Setup](#setup)
- [Output](#output)
- [Example](#example)
- [Optional Argument](#optional-arguments)
- [Conclusion](#conclusion)

## Introduction

Express Ez 405 provides a quick and dynamic means of generating 405 and 404 errors in Express routes. Unlike other similar solutions this package aims to be set it and forget it, with the error messages being built dynamically from the other methods on the route, so that you should never have to update it regardless of how your route changes. Express Ez 405 is a lightweight, easy to use, and comes with zero dependencies.

## Setup

Install with `npm i express-ez-405` and import into each of your routes with 
```
const { buildError } = require('express-ez-405');
```

Then drop a catch all route at the bottom of each of your routes like such

```
router.use('/', (req, _, next) => {
  const err = buildError(req, router);
  if (!err) return next();
  return next(err);
});
```

and then forget about it! You should now be able to add and remove routes and the resulting errors should represent what is currently available, not what was available the last time you touched this.

## Outputs

There are three possible outputs of `buildError`:

1. `null` Method used was 'OPTIONS' (prevents handler from catching pre-flights)
2. Instance of `Error` with a status of `405` and a message of `'You attempted a GET request to /user/makead try POST.'`. Method didn't match any of the avialable methods.
3. Instance of `Error` with a status of `404` and a message of `'Could not find the appropriate endpoint for /user/notanendpoint in /user'`. No endpoints matched what you were looking for.

## Example

Server
```
const express = require('express');

const app = express();
app.use(express.json());
const userRouter = require('./routes/user');

app.use('/user', userRouter);
/*
  ect. ect.
*/
```

Router
```
const express = require('express');
const { buildError } = require('express-ez-405');

const router = express.Router();

router.post(
  '/makeAD',
  // middleware
  (req, res) => res.status(200).send(res.locals.user)
);

router.use('/', (req, _, next) => {
  const err = buildError(req, router);
  if (!err) return next();
  return next(err);
});

module.exports = router;
```

## Optional Argument

In the event that your route is nested more than one layer deep you will need to provide a third argument noting how deep this particular route is nested. See examples below

No argument (or 1 if you're feeling frisky) `buildError(req, router);` or `buildError(req, router, 1);`

Server
```
const express = require('express');

const app = express();
app.use(express.json());
const userRouter = require('./routes/user');

app.use('/user', userRouter);
/*
  ect. ect.
*/
```

Nested 2 '/' deep `buildError(req, router, 2);`

Server
```
const express = require('express');

const app = express();
app.use(express.json());
const userRouter = require('./routes/user');

app.use('/user/prime', userRouter);
/*
  ect. ect.
*/
```