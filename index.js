const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.afkplob.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {
        const carCategoryCollection = client.db('CarsPortal').collection('CarsCollection')
        const CetagoryCollection = client.db('CarsPortal').collection('Category');


        app.get('/CarsCollection', async (req, res) => {
            const query = {};
            const options = await carCategoryCollection.find(query).limit(3).toArray();
            res.send(options)
        });

        app.get('/category', async (req, res) => {
            const query = {};
            const cursor = await CetagoryCollection.find(query).toArray();
            res.send(cursor);
        });

        app.get('/allcar/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { categoryName: id };
            const service = await carCategoryCollection.find(query).toArray();
            res.send(service)
        });

    }
    finally {

    }
}

run().catch(err => console.log(err))

app.get('/', async (req, res) => {
    res.send('Cars Portal server is running ')
})

app.listen(port, () => {
    console.log(`Cars Portal running on ${port}`)
})

//CarsPortal

//CarsCollection