const express = require('express')
const cors = require('cors')
const app = express()
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()

const port = process.env.PORT || 5000

// middleware
app.use(cors(
    {
        origin: [
            "http://localhost:5173",
            "https://frozen-cpu.web.app",
            "https://frozen-cpu.firebaseapp.com"
        ]
    }
))
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vl4b2tk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const productCollection = client.db('fansDB').collection('fans')

        app.get('/fans', async (req, res) => {
            const result = await productCollection.find().toArray()
            res.send(result)
        })

        // search filter
        // app.get('/search', async (req, res) => {
        //     res.send(items)

        // })

        //   pagination

        app.get('/count', async (req, res) => {
            const { brand, category, minPrice, maxPrice } = req.query;

            const query = {};

            if (brand) {
                query.brand_name = { $in: brand.split(',') };
            }
            if (category) {
                query.category_name = { $in: category.split(',') };
            }
            if (minPrice && maxPrice) {
                query.price = { $gte: parseInt(minPrice), $lte: parseInt(maxPrice) };
            }

 
                const count = await productCollection.countDocuments(query);
                res.send({ count });
         
        });

        // Route to get paginated and filtered products
        app.get('/pagination', async (req, res) => {
            const size = parseInt(req.query.size);
            const page = parseInt(req.query.page) - 1;

            // Filters
            const { brand, category, minPrice, maxPrice, filter } = req.query;

            const query = {};

            if (brand) {
                query.brand_name = { $in: brand.split(',') };
            }

            if (category) {
                query.category_name = { $in: category.split(',') };
            }

            if (minPrice && maxPrice) {
                query.price = { $gte: parseInt(minPrice), $lte: parseInt(maxPrice) };
            }

            if (filter) {
                query.name = { $regex: filter, $options: 'i' }; // Case-insensitive searc
            }

      
                // Fetch paginated and filtered data
                const items = await productCollection.find(query)
                    .skip(page * size)
                    .limit(size)
                    .toArray();

                // Get the total count for pagination
                const totalCount = await productCollection.countDocuments(query);

                // Send both items and totalCount as a response
                res.send({ products: items, totalCount });
           
        });



        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('forzen cpu is running')
})

app.listen(port, () => {
    console.log(`Frozen Cpu is running on port ${port}`)
})