import jwt from 'jsonwebtoken';

const SECRET = () => process.env.JWT_SECRET || 'insecure-dev-secret';
const TTL = '30d';

export function signToken(payload) {
  return jwt.sign(payload, SECRET(), { expiresIn: TTL });
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET());
}
