const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const collection = require("./config");

const app = express();

app.use(session({
    secret: "BMRB",
    resave: false,
    saveUninitialized: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.set("view engine", 'ejs');
app.use('/public',express.static("public"));
app.use('/views',express.static("views"));
app.use('/src',express.static("src"));

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

app.get("/success",(req,res) =>{
    res.render("success")
})

app.get("/home",(req,res) =>{
    res.render("home")
})

app.post("/signup", async (req, res) => {
    try {
        const { username, password } = req.body;
        const existingUser = await collection.findOne({ name: username });

        if (existingUser) {
            return res.status(400).send("User already exists. Please use a different username.");
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await collection.create({ name: username, password: hashedPassword });

        res.redirect('/success')
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).send("Internal Server Error");
    }
});
//login route
app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await collection.findOne({ name: username });

        if (!user) {
            return res.status(400).send("User Name Cannot be Found");
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
//profile route
app.get("/profile", async (req, res) => {
    if (!req.session.userId) {
        return res.redirect("/login");
    }

    try {
        const user = await collection.findById(req.session.userId);
        res.render("profile", { user });
    } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).send("Error fetching profile");
    }
});

//upprofile
app.post("/updateProfile", async (req, res) => {
    if (!req.session.userId) {
        return res.redirect("/login");
    }

    try {
        const { name, email, semester, strongsub, strongtop,modeofstudy } = req.body;

        // Update the user's profile in the database
        await collection.updateOne(
            { _id: req.session.userId },
            {
                $set: {
                    name: name,
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

        // Redirect to the profile page or home page after update
        res.redirect("/profile");
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Route to handle match form submission and display results
app.post("/findMatches", async (req, res) => {
    const { strugglingSubject, strugglingSubtopic, modeOfStudy } = req.body;

    try {
        // Query the database for matching users
        const matches = await collection.find({
            "profile.strongsub": strugglingSubject,
            "profile.strongtop": strugglingSubtopic,
            "profile.modeofstudy": modeOfStudy
        });

        // Render the results page with the matching users
        res.render("results", { matches });
    } catch (error) {
        console.error("Error finding matches:", error);
        res.status(500).send("Internal Server Error");
    }
});
const port = 5000;
app.listen(port, () => {
    console.log(`Server running on Port: ${port}`);
});