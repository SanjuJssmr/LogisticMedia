// // validation.js
// const koa = require("koa")
// const validate = require('koa-validate');

// validate(koa);

// const userValidation = (ctx, next) => {
//   ctx.checkBody('data').notEmpty().withMessage('Data cannot be empty');
//   ctx.checkBody('data.*.fullname').trim().notEmpty().withMessage('Fullname cannot be empty');
//   ctx.checkBody('data.*.email').trim().notEmpty().withMessage('Email cannot be empty').isEmail().withMessage('Invalid Email');
//   ctx.checkBody('data.*.designation').trim().notEmpty().withMessage('Designation cannot be empty');
//   ctx.checkBody('data.*.state').trim().notEmpty().withMessage('State cannot be empty');
//   ctx.checkBody('data.*.country').trim().notEmpty().withMessage('Country cannot be empty');
//   ctx.checkBody('data.*.password').trim().notEmpty().withMessage('Password cannot be empty');
//   ctx.checkBody('data.*.password').matches(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-.,_]).{8,}$/).withMessage('Invalid Password format');

//   const errors = ctx.validationErrors();

//   if (errors) {
//     ctx.response.body = { response: errors[0].msg };
//   } else {
//     return next();
//   }
// };

// module.exports = {
//   userValidation,
// };
