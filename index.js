const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = (express())
const port = process.env.PORT || 5000
//middleware
app.use(cors())
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wg8wdsp.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
console.log(uri)


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    const token = authHeader.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
    })

}

async function run() {
    try {
        const AppointmentCollection = client.db('doctors-site-db').collection('AppointmentOptions')
        const bookingsCollection = client.db('doctors-site-db').collection('Bookings')
        const usersCollection = client.db('doctors-site-db').collection('User')

        app.get('/users', async (req, res) => {
            const query = {}
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        })
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query)
            res.send({ isAdmin: user ?.role === 'admin'})
        })
        app.put('/users/admin/:id', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query)
            if (user ?.role !== 'admin') {
                return res.status(403).send({ message: 'forbidden access' })
            }

            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const option = { upsert: true }
            const updateDoc = {
                $set: {
                    role: "admin"
                }
            }
            const result = await usersCollection.updateOne(filter, updateDoc, option)
            res.send(result);
        })

        app.get('/jwt', async (req, res) => {
            const email = req.query.email
            const query = { email: email };
            const user = await usersCollection.findOne(query)
            console.log(user)
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '5h' })
                return res.send({ accessToken: token })
            }

            res.status(403).send({ accessToken: '' })
        })

        app.post("/user", async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result)
        })


        app.get('/bookings', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ messsge: 'forbidden access' })
            }
            console.log(req.headers.authorization)
            const query = { email: email }
            const bookings = await bookingsCollection.find(query).toArray()
            console.log(bookings)
            res.send(bookings);
        })


        //use Aggregation to query multiple collection and then merge data
        app.get('/appointmentOptions', async (req, res) => {
            const query = {};
            const date = req.query.date
            console.log(date)
            const options = await AppointmentCollection.find(query).toArray()
            // amara chai perticular date e and perticular appiontment e booking time ekta hoye gele available booking time koita ache dekhno
            // eijonno prothome amra booking collection er moddhe data take nibo and database theke query nite hbe
            // prothome date query korlam 
            const bookingQuery = { appointmentDate: date }
            //ekhane date k pelam
            const alreadyBooked = await bookingsCollection.find(bookingQuery).toArray()
            options.forEach(option => {
                const optionBooked = alreadyBooked.filter(book => book.treatment === option.name)
                console.log(optionBooked)
                const bookedSlots = optionBooked.map(book => book.slot)
                const remainingSlots = option.slots.filter(slot => !bookedSlots.includes(slot));
                option.slots = remainingSlots;
            })

            res.send(options);
        })
        app.get('/appointmentSpeciality', async (req, res) => {
            const query = {}
            const result = await AppointmentCollection.find(query).project({ name: 1 }).toArray();
            res.send(result);
        })
        app.post('/bookings', async (req, res) => {
            const bookings = req.body;
            const query = {
                appointmentDate: bookings.appointmentDate,
                treatment: bookings.treatment
            }
            const alreadyBooked = await bookingsCollection.find(query).toArray();
            // ekhane 0 er upore hbe
            if (alreadyBooked.length) {
                const message = `You already have a booking on ${bookings.appointmentDate}`
                // ei block e return kore dile niche r jabe na
                return res.send({ acknowledged: false, message })
            }
            console.log(bookings)
            const result = await bookingsCollection.insertOne(bookings);
            res.send(result)

        })

    }
    catch (err) {
        console.log(err)
    }
    finally {

    }
}
run().catch(console.log)

app.get("/", async (req, res) => {
    res.send("doctors potal is running")
})

app.listen(port, () => { console.log(`server is running the port ${port}`) })