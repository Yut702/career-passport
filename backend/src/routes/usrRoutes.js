import express from 'express';
import usrController from '../controllers/usrController.js';
import { verify } from '../utils/jwt.js';

const router = express.Router();

const auth = (req, res, next) => {
    const header = req.headers.authorization;
    if (!header) return res.status(401).end();
    try {
        req.usr = verify(header.split(' ')[1]);
        next();
    } catch (e) {
        res.status(401).json({ error: 'invalid token' });
    }
};

router.post('/register', usrController.register);
router.post('/login', usrController.login);
// allow profile creation immediately after signup (no auth required)
router.post('/profile', usrController.saveProfile);
router.get('/me', auth, usrController.me);

export default router;
