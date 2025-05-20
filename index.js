const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const { User, Connection } = require("./config"); // Import User and Connection models

const app = express();

app.use(session({
    secret: "BMRB",
    resave: false,
    saveUninitialized: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.set("view engine", 'ejs');
app.use('/public', express.static("public"));
app.use('/views', express.static("views"));
app.use('/src', express.static("src"));

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/signup", (req, res) => {
    res.render("signup");
});

app.get("/match", (req, res) => {
    res.render("match");
});

app.get("/results", (req, res) => {
    res.render("results");
});

app.get("/connections", (req, res) => {
    res.render("connections");
});

app.get("/success", (req, res) => {
    res.render("success");
});

app.get("/home", (req, res) => {
    res.render("home");
});

app.post("/signup", async (req, res) => {
    try {
        const { username, password } = req.body;
        const existingUser = await User.findOne({ username: username }); // Use User model

        if (existingUser) {
            return res.status(400).send("User   already exists. Please use a different username.");
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ username: username, password: hashedPassword }); // Use User model

        res.redirect('/success');
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Login route
app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username: username }); // Use User model

        if (!user) {
            return res.status(400).send("User   Name Cannot be Found");
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (isPasswordMatch) {
            req.session.userId = user._id;
            res.redirect("/home");
        } else {
            res.status(400).send("Wrong Password");
        }
    } catch (error) {
        res.status(500).send("Internal Server Error");
    }
});

app.get("/home", (req, res) => {
    if (!req.session.userId) {
        return res.redirect("/login");
    }
    res.render("home");
});

// Profile route
app.get("/profile", async (req, res) => {
    if (!req.session.userId) {
        return res.redirect("/login");
    }

    try {
        const user = await User.findById(req.session.userId); // Use User model
        res.render("profile", { user });
    } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).send("Error fetching profile");
    }
});

// Update profile
app.post("/updateProfile", async (req, res) => {
    if (!req.session.userId) {
        return res.redirect("/login");
    }

    try {
        const { username, email, semester, strongsub, strongtop, modeofstudy } = req.body;

        // Update the user's profile in the database
        await User.updateOne(
            { _id: req.session.userId }, // Use User model
            {
                $set: {
                    username: username,
                    profile: {
                        email: email,
                        semester: semester,
                        strongsub: strongsub,
                        strongtop: strongtop,
                        modeofstudy: modeofstudy
                    }
                }
            }
        );

        res.redirect("/profile");
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).send("Error updating profile");
    }
});

// Route to handle match form submission and display results
app.post("/findMatches", async (req, res) => {
    const { strugglingSubject, strugglingSubtopic, modeOfStudy } = req.body;

    try {
        // Query the database for matching users
        const matches = await User.find({
            "profile.strongsub": strugglingSubject,
            "profile.strongtop": strugglingSubtopic,
            "profile.modeofstudy": modeOfStudy
        });

        res.render("results", { matches, userId: req.session.userId });
    } catch (error) {
        console.error("Error finding matches:", error);
        res.status(500).send("Error finding matches");
    }
});

// Connection request handling
app.post("/connect", async (req, res) => {
    const { userIdToConnect } = req.body;

    try {
        const connection = new Connection({
            requesterId: req.session.userId, // Use the logged-in user's ID
            recipientId: userIdToConnect // Corrected property name
        });

        await connection.save();
        res.redirect("/connections");
    } catch (error) {
        console.error("Error creating connection:", error);
        res.status(500).send("Error creating connection");
    }
});

// Route for connections
app.post('/api/connections/request', (req, res) => {
    console.log("Received connection request:", req.body);
    const { recipientId, goal, subName, requesterId } = req.body;

    const connectionRequest = new Connection({
        requesterId,
        recipientId,
        goal,
        subName,
        status: 'pending',
    });

    connectionRequest.save()
        .then(() => res.json({ success: true }))
        .catch(err => res.status(500).json({ success: false, error: err.message }));
});

app.post('/api/connections/accept', (req, res) => {
    const { requestId } = req.body;

    Connection.findByIdAndUpdate(requestId, { status: 'accepted' })
        .then(() => res.json({ success: true }))
        .catch(err => res.status(500).json({ success: false, error: err.message }));
});

app.get('/connections/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;

        // Fetch pending connection requests
        const requests = await Connection.find({ recipientId: userId, status: 'pending' })
            .populate('requesterId', 'username goal subName')
            .lean(); // Ensures we get a plain object

        // Fetch accepted connections
        const connectedUsers = await Connection.find({
            $or: [
                { requesterId: userId, status: 'accepted' },
                { recipientId: userId, status: 'accepted' }
            ]
        })
        .populate('requesterId', 'username goal subName')
        .populate('recipientId', 'username goal subName')
        .lean(); 

        // Ensure both variables are defined when rendering
        res.render('connections', { 
            requests: requests || [], 
            connectedUsers: connectedUsers || [], // ✅ Ensure connectedUsers is always an array
            userId 
        });
    } catch (err) {
        console.error("Error fetching connections:", err);
        res.status(500).send("Internal Server Error");
    }
});



// Start the server

const port = 5000;
app.listen(port, () => {
    console.log(`Server running on Port: ${port}`);
});