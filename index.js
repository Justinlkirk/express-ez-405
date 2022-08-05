const validateLayer = (layer) => {
  if (!('handle' in layer))
    return `Error with first argument (app). Layer in app._router.stack does not have a handle property.`;
  if (typeof layer.handle !== 'function')
    return `Error with first argument (app). layer.handle in app._router.stack is not a function.`;
  if (!('stack' in layer.handle))
    return `Error with first argument (app). layer.handle in app._router.stack does not have a stack property.`;
  if (!(layer.handle.stack instanceof Array))
    return `Error with first argument (app). layer.handle.stack in app._router.stack is not an array.`;
  if (!('regexp' in layer))
    return `Error with first argument (app). layer in app._router.stack does not have a regexp property.`;
  if (!(layer.regexp instanceof RegExp))
    return `Error with first argument (app). layer.regexp in app._router.stack is not an instance of regexp.`;
  if (typeof `${layer.regexp}`.split('\\')[1] !== 'string')
    return `Error with first argument (app). layer.regexp in app._router.stack did not properly break down into a string.`;
  return null;
};

const validateSubLayer = (subLayer) => {
  if (!('regexp' in subLayer))
    return `Error with first argument (app). subLayer in layer.handle.stack in app._route.stack does not have a regexp property.`;
  if (!(subLayer.regexp instanceof RegExp))
    return `Error with first argument (app). subLayer in layer.handle.stack in app._router.stack is not an instance of regexp.`;
  if (typeof `${subLayer.regexp}`.split('\\')[1] !== 'string')
    return `Error with first argument (app). subLayer in layer.handle.stack in app._router.stack did not properly break down into a string.`;
  if (!('route' in subLayer))
    return `Error with first argument (app). subLayer in layer.handle.stack in app._route.stack does not have a route property.`;
  if (!('methods' in subLayer.route))
    return `Error with first argument (app). subLayer.route in layer.handle.stack in app._route.stack does not have a methods property.`;
  if (!(subLayer.route.methods instanceof Object))
    return `Error with first argument (app). subLayer.route.methods in layer.handle.stack in app._route.stack is not an Object.`;

  return null;
};

const determinePossibleMethods = (stack, attemptedUrl) => {
  const possibleMethods = [];
  for (const layer of stack) {
    if (layer.name === 'router') {
      const errMess = validateLayer(layer);
      if (errMess) return errMess;
      const routeInServer = `${layer.regexp}`
        .split('\\') // Seperates the string at every '\'
        .slice(1, -2) // Gets rid of the first index and last two indexes (the regex)
        .join(''); // Puts the string back together so that all the remains is the route
      for (const subLayer of layer.handle.stack) {
        const subErrMess = validateSubLayer(subLayer);
        if (subErrMess) return subErrMess;

        const routeInRouter = `${subLayer.regexp}`
          .split('\\') // Seperates the string at every '\'
          .slice(1, -1) // Gets rid of the first index and last two indexes (the regex)
          .join(''); // Puts the string back together so that all the remains is the route
        const completeRoute = (
          routeInServer + routeInRouter
        ).toLocaleLowerCase();
        if (completeRoute === attemptedUrl) {
          Object.keys(subLayer.route.methods).forEach((method) =>
            possibleMethods.push(method)
          );
        }
      }
    }
  }
  return possibleMethods;
};

const cleanUrl = (url) => {
  return url
    .match('[^?]*')[0] // grabs everything up to but NOT including the first '?'
    .replace(/\/$/, '') // gets rid of trailing '/'
    .toLowerCase();
};

const determineErrorAndBuildIt = (possibleMethods, attemptedUrl, method) => {
  if (typeof possibleMethods === 'string') {
    const error = new Error(possibleMethods, {
      cause: possibleMethods,
    });
    error.status = 400;
    return error;
  }
  if (!possibleMethods.length) {
    const cause = `Could not find the appropriate endpoint for ${attemptedUrl}`;
    const error = new Error(cause, { cause });
    error.status = 404;
    return error;
  }
  let cause = `You attempted a ${method} request to ${attemptedUrl} try `;
  for (let ind = 0; ind < possibleMethods.length; ind++) {
    const lastMethodInd = possibleMethods.length - 1;
    const possMeth = possibleMethods[ind];
    if (ind === lastMethodInd) cause += `${possMeth.toUpperCase()}.`;
    else cause += `${possMeth.toUpperCase()} or `;
  }
  const error = new Error(cause, { cause });
  error.status = 405;
  return error;
};

const validateInputs = (app, req) => {
  try {
    if (typeof app !== 'function')
      throw 'Error with first argument (app). app is not a function.';
    if (!('_router' in app))
      throw 'Error with first argument (app). No _router property.';
    if (typeof app._router !== 'function')
      throw 'Error with first argument (app). app._router is not a function.';
    if (!(app._router.stack instanceof Array))
      throw 'Error with first argument (app). app._router.stack is not an array.';
    if (!('originalUrl' in req))
      throw 'Error with second argument (request). No originalUrl property on request.';
    if (typeof req.originalUrl !== 'string')
      throw 'Error with second argument (request). req.originalUrl is not a string.';
    if (!('method' in req))
      throw 'Error with second argument (request). No method property on request.';
    if (typeof req.method !== 'string')
      throw 'Error with second argument (request). req.method is not a string.';
  } catch (cause) {
    const error = new Error(cause, {
      cause,
    });
    error.status = 400;
    return error;
  }

  return null;
};

//

const buildError = (app, request) => {
  const inputError = validateInputs(app, request);
  if (inputError) return inputError;

  const { originalUrl, method } = request;
  const { stack } = app._router;
  if (method === 'OPTIONS') return null;

  const attemptedUrl = cleanUrl(originalUrl);
  const possiblePaths = determinePossibleMethods(stack, attemptedUrl);
  return determineErrorAndBuildIt(possiblePaths, attemptedUrl, method);
};

module.exports = { buildError };
