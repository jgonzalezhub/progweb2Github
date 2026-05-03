import mongoSanitize from 'express-mongo-sanitize';

// Express 5: req.query y req.params son getters read-only — solo sanitizamos body
export const sanitize = (req, res, next) => {
  if (req.body) {
    req.body = mongoSanitize.sanitize(req.body, { replaceWith: '_' });
  }
  next();
};
