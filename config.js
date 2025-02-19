const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/EduMateUsers", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("Database connected successfully");
}).catch((error) => {
    console.error("Database connection failed:", error.message);
});

// Define schemas
const profileSchema = new mongoose.Schema({
    email: { type: String, default: '' },
    semester: { type: String, default: '' },
    strongsub: { type: String, default: '' },
    strongtop: { type: String, default: '' },
    modeofstudy: {type: String, default: ''}
});

const loginSchema = new mongoose.Schema({
    name: { type: String, required: true },
    password: { type: String, required: true },
    profile: { type: profileSchema, default: () => ({}) }
});

const collection = mongoose.model('users', loginSchema);

module.exports = collection;