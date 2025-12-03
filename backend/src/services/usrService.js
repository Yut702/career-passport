import bcrypt from 'bcrypt';

const usrs = [];

async function register(email, password) {
    if (usrs.find((u) => u.email === email)) throw new Error('already exists');
    const passwordHash = await bcrypt.hash(password, 10);
    const newusr = { id: usrs.length + 1, email, passwordHash, name: null, age: null };
    usrs.push(newusr);
    return newusr;
}

async function login(email, password) {
    const usr = usrs.find((u) => u.email === email);
    if (!usr) throw new Error('not found');
    const ok = await bcrypt.compare(password, usr.passwordHash);
    if (!ok) throw new Error('invalid password');
    return usr;
}

function saveProfile(id, name, age) {
    const usr = usrs.find((u) => u.id === id);
    if (!usr) throw new Error('not found');
    usr.name = name;
    usr.age = age;
    return usr;
}

function getMe(id) {
    return usrs.find((u) => u.id === id);
}

export default { register, login, saveProfile, getMe };