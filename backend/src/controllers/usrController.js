// import usrService from '../services/usrService.js';
import * as usrService from '../services/usrService.js';
import { generateToken } from '../utils/jwt.js';
import { upsertUserProfile, getUserByEmail } from '../models/usrModel.js';

const register = async (req, res) => {
    try {
        const { email, password } = req.body;
        await usrService.register(email, password);
        res.json({ message: 'registered' });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const usr = await usrService.login(email, password);
        const token = generateToken(usr.id);
        res.json({ token });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
};

const saveProfile = async (req, res) => {
    try {
        const { email, lastName, firstName, dob, gender } = req.body;
        if (!email) return res.status(400).json({ error: 'email is required' });
        const profile = { lastName, firstName, dob, gender };
        const saved = await upsertUserProfile(email, profile);
        res.json(saved);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
};

const me = async (req, res) => {
    try {
        const email = req.query.email;
        if (!email) return res.status(400).json({ error: 'email query required' });
        const usr = await getUserByEmail(email);
        if (!usr) return res.status(404).json({ error: 'not found' });
        res.json(usr);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
};

export default { register, login, saveProfile, me };
