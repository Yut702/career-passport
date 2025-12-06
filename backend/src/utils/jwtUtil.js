import jwt from 'jsonwebtoken';

const SECRET = 'secret-key';

function sign(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '1d' });
}

function verify(token) {
  return jwt.verify(token, SECRET);
}

export default { sign, verify };