const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const e = require('express');
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);


const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.afkplob.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access')
    }

    const token = authHeader.split(' ')[1];
    // console.log(authHeader)
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next()
    })
}


async function run() {
    try {
        const carCategoryCollection = client.db('CarsPortal').collection('CarsCollection')
        const CetagoryCollection = client.db('CarsPortal').collection('Category');
        const ordersCollection = client.db('CarsPortal').collection('orders');
        const usersCollection = client.db('CarsPortal').collection('users');
        const productsCollection = client.db('CarsPortal').collection('products');
        const paymentsCollection = client.db('CarsPortal').collection('payments');


        app.get('/CarsCollection', async (req, res) => {
            const date = req.query.date;
            const query = {};
            const options = await carCategoryCollection.find(query).toArray();
            res.send(options)
        });

        app.get('/category', async (req, res) => {
            const query = {};
            const cursor = await CetagoryCollection.find(query).toArray();
            res.send(cursor);
        });
        //-----------//
        app.get('/allcar/:id', async (req, res) => {
            const id = req.params.id;

            const query = { categoryId: id };
            const service = await carCategoryCollection.find(query).toArray();
            res.send(service)
        });
        //--------------//
        app.get('/addProduct', async (req, res) => {
            const query = {};
            const result = await CetagoryCollection.find(query).project({ name: 1 }).toArray();
            res.send(result)
        })


        app.get('/orders', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;

            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' })
            }

            const query = { email: email };
            const orders = await ordersCollection.find(query).toArray();
            res.send(orders)
        })
        //---------payment--------------//
        app.get('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const booking = await ordersCollection.findOne(query);
            res.send(booking)
        })
        //--------------//s
        app.post('/orders', async (req, res) => {
            const orders = req.body;
            const result = await ordersCollection.insertOne(orders);
            res.send(result);
        });

        //------paymentCart---------//
        app.post('/create-payment-intent', async (req, res) => {
            const booking = req.body;
            const originalPrice = booking.originalPrice;
            const amount = originalPrice * 100;


            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });
        //---------paymentApi----------//
        app.post('/payments', async (req, res) => {
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);

            const id = payment.bookingId
            const filter = { _id: ObjectId(id) }
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updatedResult = await ordersCollection.updateOne(filter, updatedDoc)

            res.send(result)
        })

        //------------//
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '7d' })
                return res.send({ accessToken: token })
            }
            res.status(403).send({ accessToken: '' })
        });
        //--------------//
        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users)
        })

        //--------------//
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result)
        });
        //---------//
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' });
        })

        //---------//
        app.put('/users/admin/:id', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);

            if (user?.role !== 'admin') {
                return res.status(403).send({ message: 'forbidden access' })
            }

            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result)
        });

        //-----------//
        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isSeller: user?.role === 'seller' });
        });
        //------deleteUser-----------//
        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const result = await usersCollection.deleteOne(filter);
            res.send(result)
        })
        //------------------//
        app.get('/products', async (req, res) => {
            const query = {};
            const product = await productsCollection.find(query).toArray();
            res.send(product)
        })

        //----------//
        app.post('/products', async (req, res) => {
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            res.send(result)
        })
        //------------//
        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await carCategoryCollection.deleteOne(filter);
            res.send(result)
        })


        //  get all car......
        app.put('/addcar', async (req, res) => {
            const query = req.body;
            const result = await carCategoryCollection.insertOne(query);
            res.send(result);
        });

        //  get all car......
        app.get('/myproduct', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            console.log(query);
            const result = await carCategoryCollection.find(query).toArray();
            res.send(result);
        })

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