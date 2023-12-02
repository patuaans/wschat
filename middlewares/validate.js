const { check } = require('express-validator')

const registerValidator = [
    check('username')
        .exists().withMessage('Please enter a username')
        .notEmpty().withMessage('Username cannot be empty')
        .isLength({ min: 6 }).withMessage('Username must be at least 6 characters long')
        .matches(/^[a-zA-ZÀ-ỹ\s]*$/).withMessage('Username cannot contain special characters'),

    check('password')
        .exists().withMessage('Please enter a password')
        .notEmpty().withMessage('Password cannot be empty')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),

    check('confirmPassword')
        .exists().withMessage('Please confirm your password')
        .notEmpty().withMessage('Confirmation password cannot be empty')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords do not match');
            }
            return true;
        })
]

const loginValidator = [
    check('username').exists().withMessage('Please enter username')
        .notEmpty().withMessage('Please enter username'),

    check('password').exists().withMessage('Please enter password')
        .notEmpty().withMessage('Please enter password')
        .isLength({ min: 6 }).withMessage('Password must be atleast 6 character'),
]

module.exports = {
    registerValidator,
    loginValidator
};
