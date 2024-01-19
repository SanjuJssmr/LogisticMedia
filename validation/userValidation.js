//Imports
const { check, validationResult } = require('express-validator')

//User Validation
module.exports = function () {
    let data = { status: 0, response: 'Invalid Request' }, validator = {} 

    validator.checkChangePassword = [
        check('data').notEmpty().withMessage('Data cannot be empty'),
        check('data.*.fullname').trim().notEmpty().withMessage('Password cannot be empty'),
        check('data.*.email').trim().notEmpty().withMessage('email cannot be empty').isEmail().withMessage("Invalid Email"),
        check('data.*.password').trim().notEmpty().withMessage('Password cannot be empty'),
        check('data.*.password').trim().notEmpty().withMessage('Password cannot be empty'),
        check('data.*.password').trim().notEmpty().withMessage('Password cannot be empty'),
        check('data.*.password').matches(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-.,_]).{8,}$/).withMessage('Invalid Password format'),
        (req, res, next) => {
            const errors = validationResult(req).array();
            if (errors.length > 0) {
                data.response = errors[0].msg;

                return res.send(data);
            }

            return next();
        }
    ]
    validator.edituser =
        [
            check('data').notEmpty().withMessage('Data cannot be empty'),
            check('data.*.id').notEmpty().withMessage('id cannot be empty').isMongoId().withMessage('invalid id'),
            check('data.*.fullName').trim().notEmpty().withMessage('fullName cannot be empty').matches(/^[A-Za-z\s]+$/).withMessage('Fullname should be only letters'),
            check('data.*.designation').trim().notEmpty().withMessage('Designation cannot be empty'),
            check('data.*.mobileCode').trim().notEmpty().withMessage('Mobile Code cannot be empty').matches(/^(\+)(\d)*$/).withMessage('Invalid MobileCode Format'),
            check('data.*.mobileNumber').trim().notEmpty().isNumeric().withMessage('Mobile Number cannot be empty & should be Numeric'),
            check('data.*.email').trim().notEmpty().withMessage('email cannot be empty').isEmail().withMessage('Enter Valid emailID'),
            check('data.*.password').trim().notEmpty().withMessage('Password cannot be empty'),
            check('data.*.password').matches(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-.,_]).{8,}$/).withMessage('Invalid Password format'),
            (req, res, next) => {
                const errors = validationResult(req).array()
                if (errors.length > 0) {

                    return res.send({ status: 0, response: errors[0].msg })
                }

                return next()
            }
        ]

    return validator;
}
