import bcrypt from 'bcrypt';

const password = 'finance123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds).then(hash => {
    console.log('Finance hash:', hash);
}); 