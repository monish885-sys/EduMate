const mongoose = require("mongoose");

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/EduMateUsers", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("Database connected successfully");
}).catch((error) => {
    console.error("Database connection failed:", error.message);
});

// Define Profile Schema
const profileSchema = new mongoose.Schema({
    email: { type: String, default: '' },
    semester: { type: String, default: '' },
    strongsub: { type: String, default: '' },
    strongtop: { type: String, default: '' },
    modeofstudy: { type: String, default: '' }
});

// Define User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    profile: { type: profileSchema, default: () => ({}) }
});

// Define Connection Schema
const connectionSchema = new mongoose.Schema({
    requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    goal: { type: String, required: true },
    subName: { type: String, required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
}, { timestamps: true });

// Create Models
const User = mongoose.model('User', userSchema);
const Connection = mongoose.model('Connection', connectionSchema);

// Export Models
module.exports = {
    User,
    Connection,
};