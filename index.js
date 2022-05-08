const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bisex.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
// verify token function
function verifyToken(req, res, next) {
  //getting token from header
  const tokenInfo = req.headers.authorization;
  const token = tokenInfo?.split(" ")[1];
  if (!tokenInfo) {
    return res
      .status(401)
      .send({ message: "Hey! Its an Unauthorized Request" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({
        message: "Bruhh, You are forbidden!",
      });
    }
    req.decoded = decoded;
    next();
  });
}
async function run() {
  try {
    await client.connect();
    const productCollection = client.db("Nextron").collection("products");
    // const myProductsCollection = client.db("Nextron").collection("myproducts");

    app.get("/product", async (req, res) => {
      const query = {};
      const cursor = productCollection.find(query);
      const products = await cursor.toArray();
      res.send(products);
    });

    app.get("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const product = await productCollection.findOne(query);
      res.send(product);
    });
    // Add
    app.post("/product", async (req, res) => {
      const newProduct = req.body;
      const result = await productCollection.insertOne(newProduct);
      res.send(result);
    });
    // Delete
    app.delete("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productCollection.deleteOne(query);
      res.send(result);
    });
    // Update Quantity
    app.put("/updateproduct/:id", async (req, res) => {
      const id = req.params.id;
      const newQuantity = await req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };

      const updateQuantity = {
        $set: {
          quantity: newQuantity.quantity,
        },
      };
      const result = await productCollection.updateOne(
        filter,
        updateQuantity,
        options
      );
      res.send(result);
    });
    // JWT
    // token while logging in
    app.post("/login", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
      res.send({ token });
    });
    //product list, when token is verified
    app.get("/productlist", verifyToken, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const email = req.query.email;
      if (decodedEmail === email) {
        const products = await productCollection.find({ email }).toArray();
        res.send(products);
      } else {
        res.status(403).send({
          message: "Oops! You are forbidden, bruhhhhhhh",
        });
      }
    });
    app.post("/addproduct", async (req, res) => {
      const productInfo = req.body;
      const result = await productCollection.insertOne(productInfo);
      res.send({ success: "Mission complete" });
    });
  } finally {
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Yaa! Running Our Server");
});

app.listen(port, () => {
  console.log("Listening to port", port);
});
