require('dotenv').config();
const app = require('./src/app.js');
const connectdb = require('./src/config/db.js');

connectdb();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});