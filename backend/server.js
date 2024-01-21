const express = require("express");
const cors = require("cors");
const multer = require("multer");
const bodyParser = require("body-parser");
const app = express();

app.use(cors());
app.use(bodyParser.json());

const MongoClient = require("mongodb").MongoClient;
const port = 3001;
const uri = ``; //insert mongoDB url
const client = new MongoClient(uri);

app.post("/admin_login", (req, res) => {
  client.connect();
  console.log("Connected", req.body);
  const collection = client.db("Authentication-App").collection("Admin");
  collection.findOne({ username: req.body.username }).then((user) => {
    if (user && user.password == req.body.password) {
      res.json({ message: "Authentication Successful", status: 200 });
    } else {
      res.json({ message: "Authentication Failed", status: 400 });
    }
  });
});

app.post("/user_login", (req, res) => {
  const collection = client.db("Authentication-App").collection("Users");
  collection.findOne({ userID: req.body.userID }).then((user) => {
    console.log(user);
    if (user && user.password == req.body.password) {
      res.json({ message: "Authentication Successful", status: 200 });
    } else if (user) {
      res.json({ message: "Authentication Failed", status: 400 });
    } else {
      res.json({ message: "No such user exists", status: 400 });
    }
  });
});

app.post("/new_user", (req, res) => {
  const collection = client.db("Authentication-App").collection("Users");
  collection.findOne({ userID: req.body.userID }).then((user) => {
    if (user) {
      res.json({ message: "Already Exists", status: 400 });
    } else {
      collection.insertOne({
        userID: req.body.userID,
        password: req.body.password,
        name: "-",
        photo: "NA",
        status: 0,
      });
      res.json({ message: "User inserted", status: 200 });
    }
  });
});

app.get("/get_users", async (req, res) => {
  const collection = client.db("Authentication-App").collection("Users");
  var result = (await collection.find({}).toArray()).reverse();
  if (result.length > 2) {
    result = result.slice(0, 2);
  }
  res.send(result);
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post("/user_details", upload.single("photo"), async (req, res) => {
  const collection = client.db("Authentication-App").collection("Users");
  try {
    const name = req.body.name;
    const photoBuffer = Buffer.from(req.body.photo.slice(22), "base64");

    const result = await collection.updateOne(
      { userID: req.body.userID },
      { $set: { name: name, photo: photoBuffer, status: 1 } }
    );

    res.send({
      message: "Data received and image saved to MongoDB successfully!",
      status: 200,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/all_users", async (req, res) => {
  const collection = client.db("Authentication-App").collection("Users");
  const result = await collection.find({}).toArray();
  res.send(result);
});

app.post("/status", async (req, res) => {
  const collection = client.db("Authentication-App").collection("Users");
  const result = await collection.find({ userID: req.body.userID }).toArray();
  res.send(result);
});

app.post("/action", async (req, res) => {
  const collection = client.db("Authentication-App").collection("Users");
  let result;
  if (req.body.action == "accept") {
    result = await collection.updateOne(
      { userID: req.body.userID },
      { $set: { status: 2 } }
    );
  } else if (req.body.action == "reject") {
    result = await collection.updateOne(
      { userID: req.body.userID },
      { $set: { status: -1 } }
    );
  } else if (req.body.action == "delete") {
    collection.deleteOne({ userID: req.body.userID });
  }
  console.log(result);
  res.send(result);
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
