import bcrypt from 'bcrypt';

const adminPassword = 'admin123';
const financePassword = 'finance123';
const saltRounds = 10;

Promise.all([
    bcrypt.hash(adminPassword, saltRounds),
    bcrypt.hash(financePassword, saltRounds)
]).then(([adminHash, financeHash]) => {
    console.log('Generated hash for admin password:', adminHash);
    console.log('Generated hash for finance password:', financeHash);
}); 