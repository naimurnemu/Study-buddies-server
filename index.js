const express = require("express");
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// Http Middleware
app.use(cors());
app.use(express.json());

// Parses text as url and json
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
app.use(bodyParser.json({ limit: "10mb", extended: true }));

// Database connecting URL
const uri = `mongodb+srv://${process.env.MEMORY_DB_USER}:${process.env.MEMORY_DB_PASS}@cluster0.amqnd.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Async Database
async function run() {
    try {
        await client.connect();
        const studyGroup = client.db("studyBuddies");
        const userBase = studyGroup.collection("users");
        const blogCollection = studyGroup.collection("blogs");
        console.log("Mongo is Connected to Server!");

        // user data store to database
        app.put("/users", async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await userBase.updateOne(filter, updateDoc, options);
            res.send(result);
        });

        // Verify Admin
        app.get("/users/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await userBase.findOne(query);
            let isAdmin = false;
            if (user?.role === "admin") {
                isAdmin = true;
            }
            res.send({ admin: isAdmin });
        });

        // admin make
        app.put("/users/admin", async (req, res) => {
            const user = req.body;
            const options = { upsert: false };
            const filter = { email: user.email };
            const updateDoc = {
                $set: {
                    role: "admin",
                },
            };
            const result = await userBase.updateOne(filter, updateDoc, options);
            res.send(result);
            console.log(result);
        });

        // get all blogs
        app.get("/blogs", async (req, res) => {
            const cursor = blogCollection.find({});
            const blogs = await cursor.toArray();
            res.send(blogs);
        });

        // get user Blog
        app.get("/blogs/:email", async (req, res) => {
            const email = req.params.email;
            const cursor = blogCollection.find({ email: email });
            const userBlogs = await cursor.toArray();
            res.send(userBlogs);
        });

        // add a blog
        app.post("/blogs", async (req, res) => {
            const blog = req.body;
            const result = await blogCollection.insertOne(blog);
            res.send(result);
        });

        // update a blog
        app.put("/blogs/:id", async (req, res) => {
            const id = req.params.id;
            const blog = req.body;
            const filter = { _id: ObjectId(id) };
            const updateDoc = { $set: blog };
            const options = { upsert: true };
            const result = await userBase.updateOne(filter, updateDoc, options);
            res.send(result);
        });

        // Delete a blog
        app.delete("/blogs/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await blogCollection.deleteOne(query);
            res.send(result);
        });
    } finally {
        // await client.close();
    }
}

run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("Hello, Server! Good Morning");
});

app.listen(port, () => {
    console.log("This server run by port:", port);
});
