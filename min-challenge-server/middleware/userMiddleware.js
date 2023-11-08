import { body, validationResult } from 'express-validator';
import db from '../models/db.js'

export const validateUserSignUp = [
  (req, res, next) => {
    // Trim spaces from the input data
    req.body.username = req.body.username.trim();
    req.body.email = req.body.email.trim();
    req.body.password = req.body.password.trim();
    next();
  },
  // Define validation rules for each field
  body('username')
    .isLength({ min: 5 })
    .withMessage('Username must be at least 5 characters long'),
  body('email')
    .isEmail()
    .withMessage('Invalid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next(); // No validation errors, proceed to the next middleware or route
  },
];

export const checkExistentAccount = async (req, res, next) => {
    const { username, email } = req.body;
    // Check username
    const checkUserQuery = 'SELECT * FROM account WHERE username = ?'
    db.query(checkUserQuery, [username], async (usernameError, usernameResults) => {
        if (usernameError) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (usernameResults.length > 0) {
            return res.status(400).json({ error: 'Username already in use' });
        }
        // Check email
        const checkEmailQuery = 'SELECT * FROM account WHERE email = ?'
        db.query(checkEmailQuery, [email], async (emailError, emailResults) => {
            if (emailError) {
                return res.status(500).json({ error: 'Database error' });
            }
            if (emailResults.length > 0) {
                return res.status(400).json({ error: 'Email already in use' });
            }
            // If neither username nor email exists, call next() to proceed
            next();
        });
    });
};

// Middleware to validate email or username
export const validateEmailOrUsername = (req, res, next) => {
    const { signinName } = req.body;
    // Check if the inputString matches either email or username
    db.query(
        'SELECT * FROM account WHERE email = ? OR username = ?',
        [signinName, signinName],
        (error, results) => {
            if (error) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (results.length === 0) {
                return res.status(401).json({ error: 'User not found' });
            }
            // Attach the user object to the request for later use in the handleSignIn
            req.user = results[0];
            next();
        }
    );
}