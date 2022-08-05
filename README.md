# express-ez-405

[![Build Passing](https://img.shields.io/badge/build-passing-blue)](https://github.com/Justinlkirk/express-ez-405-tests)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/Justinlkirk/express-ez-405)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Release: 2.1](https://img.shields.io/badge/Release-2.1-orange)

## Table of Contents

- [Introduction](#introduction)
- [Setup](#setup)
- [Outputs](#outputs)
- [Example](#example)

## Introduction

Express Ez 405 provides a quick and dynamic means of generating 405 and 404 errors in Express routes with detailed error messages describing available routes. Unlike other similar solutions this package aims to be set it and forget it, with the error messages being built dynamically from the other methods on the route so that you should never have to update it regardless of how your routes change. Express Ez 405 is lightweight, easy to use, and comes with zero dependencies!

## Setup

Install with `npm i express-ez-405` and import into the file in which you determine your routing,

```
const { buildError } = require('express-ez-405');
```

then drop a catch all route after your last route

```
router.use('/', (req, _, next) => {
  const err = buildError(req, router);
  if (!err) return next();
  return next(err);
});
```

and then forget about it! You will now be able to add, remove, and update routes and the resulting errors will represent what is currently available, not what was available the last time you touched this.

## Outputs

There are three possible outputs of `buildError`:

1. `null` Method used was 'OPTIONS' (prevents handler from catching pre-flights)
2. Instance of `Error` with a status of `405` and a message of `'You attempted a GET request to /user/makead try POST.'`. Method didn't match any of the avialable methods.
3. Instance of `Error` with a status of `404` and a message of `'Could not find the appropriate endpoint for /user/notanendpoint in /user'`. No endpoints matched what you were looking for.
4. Instance of `Error` with a status of `400` and a message of `'Error with second argument (request). No method property on request.`. You passed invalid information. Check the arguments you provided and the order in which they were provided (This will only ever be an issue on initial setup, once everything is there it will be good regardless of how your application grows).

## Example

The only thing to watch out for here is to make sure you have an error handler middleware, and that express-easy-405 comes AFTER your last route.

```
const express = require('express');
const { buildError } = require('express-ez-405');

const app = express();
app.use(express.json());
const userRouter = require('./routes/user');
const mainRouter = require('./routes/main');
const nestedRouter = require('./routes/nested');

// Routes
app.use('/main', mainRouter);
app.use('/user', userRouter);
app.use('/nested/route', nestedRouter);
// Routes

// express-ez-405 handler
app.use('', (req, _, next) => {
  const err = buildError(app, req);
  if (!err) return next();
  return next(err);
});
// express-ez-405 handler

// Error handling
app.use((err, _, res, __) =>
  res.status(err.status).json({ message: err.message })
);
// Error handling

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}...`);
});
```
