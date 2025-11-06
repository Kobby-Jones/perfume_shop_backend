const bcrypt = require('bcrypt');

const password = 'admin123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, function(err, hash) {
    if (err) {
        console.error('Error generating hash:', err);
    } else {
        console.log(`\nPassword: "${password}"`);
        console.log(`Bcrypt Hash: "${hash}"\n`);
        console.log("-> COPY THE HASH ABOVE AND PASTE IT INTO src/auth/auth.model.ts\n");
    }
});
