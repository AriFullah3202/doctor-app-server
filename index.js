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
        app.get('/appointmentOptions', async (req, res) => {
            const query = {};
            const options = await AppointmentCollection.find(query).toArray()

            res.send(options);
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