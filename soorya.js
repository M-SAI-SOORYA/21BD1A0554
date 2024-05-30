const express = require('express');
const axios = require('axios');

const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // Enable CORS

const eCommAPIs = [
    'http://20.244.56.144/test/companies/AMZ/categories/Laptop/products?id=1&top=10&n=10&sortBy=price&order=asc&minPrice=1&maxPrice=10000',
    
    // Add URLs for other companies
];

// Helper function to fetch products from all companies
async function fetchProducts(category) {
    try {
        const requests = eCommAPIs.map(url => axios.get(`${url}?category=${category}`));
        const responses = await Promise.all(requests);
        return responses.flatMap(response => response.data.products);
    } catch (error) {
        console.error('Error fetching products:', error);
        throw new Error('Error fetching products');
    }
}

const sortProducts = (products, sortBy, order) => {
    return products.sort((a, b) => {
        if (order === 'asc') {
            return a[sortBy] - b[sortBy];
        } else {
            return b[sortBy] - a[sortBy];
        }
    });
};

app.get('/categories/:categoryname/products', async (req, res) => {
    const { categoryname } = req.params;
    const { n = 10, page = 1, sortBy, order = 'asc', minPrice, maxPrice } = req.query;

    try {
        let products = await fetchProducts(categoryname);

        // Apply filtering by price range
        if (minPrice !== undefined && maxPrice !== undefined) {
            products = products.filter(product => product.price >= minPrice && product.price <= maxPrice);
        }

        // Apply sorting if sortBy parameter is provided
        if (sortBy) {
            products = sortProducts(products, sortBy, order);
        }

        // Apply pagination
        const startIndex = (page - 1) * n;
        const paginatedProducts = products.slice(startIndex, startIndex + parseInt(n, 10));

        // Add unique IDs to products
        const response = paginatedProducts.map(product => ({
            ...product,
            id: uuidv4(),
        }));

        res.json(response);
        console.log(response);
    } catch (err) {
        res.status(500).json({ error: 'Error occurred while fetching products' });
    }
});

// GET /categories/:categoryname/products/:productid
app.get('/categories/:categoryname/products/:productid', async (req, res) => {
    const { categoryname, productid } = req.params;

    try {
        const products = await fetchProducts(categoryname);
        const product = products.find(p => p.id === productid);

        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Error occurred while fetching the product' });
    }
});

app.listen(PORT, () => {
    console.log(`Running on Port: ${PORT}`);
});
