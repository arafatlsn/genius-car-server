const express = require('express');
const cors = require('cors');
const ObjectId = require('mongodb').ObjectId
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken')

require('dotenv').config();

// midleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('running server...')
})

console.log('genius',process.env.DB_USER)

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.moy4n.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run () {
  try{
    await client.connect();
    const serviceCollection = client.db('geniusCar').collection('services');
    // load all data 
    app.get('/service', async(req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services)
    })
    // load single id 
    app.get('/service/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: ObjectId(id)};
      const service = await serviceCollection.findOne(query);
      res.send(service)
    })
    // secret token 
    app.post('/signin', async(req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: '1d'
      });
      res.send(token)
    })

    function verifyJwt(req, res, next){
      const authHeader = req.headers.authorization;
      if(!authHeader){
        return res.status(401).send({message: 'unauthorized access'})
      }
      const token = authHeader.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN, (error, decoded) => {
        if(error){
          return res.status(403).send({message: 'forbidden access'})
        }
        req.decoded = decoded;
        next()
      })
    }

    app.post('/order', async(req, res) => {
      const cartCollection = client.db('geniusCar').collection('cart');
      const prod = req.body;
      const result = await cartCollection.insertOne(prod);
      res.send(result)
    })

    app.get('/order',verifyJwt, async(req, res) => {
      const cartCollection = client.db('geniusCar').collection('cart');
      const email = req.query.email;
      const decodedEmail = req.decoded.email;
      if(decodedEmail === email){
        const query = {email: email};
        const cursor = cartCollection.find(query);
        const result = await cursor.toArray();
        res.send(result)
      }
      else{
        res.status(403).send({message: 'forbidden access'})
      }
    })

  }

  finally{

  }
}

run().catch(console.dir)

app.listen(port, () => {
  console.log('server running...')
})