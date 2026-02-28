const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const cardRoutes = require('./routes/cards');
app.use('/api/cards', cardRoutes);

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kanban';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => {
        console.error('❌ Could not connect to MongoDB:', err.message);
        console.log('⚠️  Falling back to in-memory data store for this session.');
    });

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
