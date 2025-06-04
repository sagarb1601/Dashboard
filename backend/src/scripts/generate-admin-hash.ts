import bcrypt from 'bcrypt';

const password = 'admin123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds).then(hash => {
    console.log('Admin hash:', hash);
}); 