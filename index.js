const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()
const app = (express())
const port = process.env.PORT || 5000
//middleware
app.use(cors())
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wg8wdsp.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
console.log(uri)

async function run() {
    try {
        const AppointmentCollection = client.db('doctors-site-db').collection('AppointmentOptions')
        const bookingsCollection = client.db('doctors-site-db').collection('Bookings')

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
            console.log(alreadyBooked)
            options.forEach(option => {
                const optionBooked = alreadyBooked.filter(book => book.treatment === option.name)
                console.log(optionBooked)
                const bookedSlots = optionBooked.map(book => book.slot)
                const remainingSlots = option.slots.filter(slot => !bookedSlots.includes(slot));
                option.slots = remainingSlots;
                console.log(date, option.name, remainingSlots.length)
            })

            res.send(options);
        })
        app.post('/bookings', async (req, res) => {
            const bookings = req.body;
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