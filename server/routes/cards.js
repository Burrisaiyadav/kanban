const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Card = require('../models/Card');

// In-memory fallback if MongoDB is not connected
let mockCards = [
    { _id: '1', title: "Look into render bug in dashboard", column: "backlog", order: 0, createdAt: new Date().toISOString() },
    { _id: '2', title: "SOX compliance checklist", column: "backlog", order: 1, createdAt: new Date().toISOString() },
    { _id: '3', title: "[SPIKE] Migrate to Azure", column: "backlog", order: 2, createdAt: new Date().toISOString() },
    { _id: '4', title: "Document Notifications service", column: "backlog", order: 3, createdAt: new Date().toISOString() },
    { _id: '5', title: "Research DB options for new microservice", column: "todo", order: 0, createdAt: new Date().toISOString() },
    { _id: '6', title: "Postmortem for outage", column: "todo", order: 1, createdAt: new Date().toISOString() },
    { _id: '7', title: "Sync with product on Q3 roadmap", column: "todo", order: 2, createdAt: new Date().toISOString() },
    { _id: '8', title: "Refactor context providers to use Zustand", column: "doing", order: 0, createdAt: new Date().toISOString() },
    { _id: '9', title: "Add logging to daily CRON", column: "doing", order: 1, createdAt: new Date().toISOString() },
    { _id: '10', title: "Set up DD dashboards for Lambda listener", column: "done", order: 0, createdAt: new Date().toISOString() },
];

const isDbConnected = () => mongoose.connection.readyState === 1;

// Get all cards
router.get('/', async (req, res) => {
    if (!isDbConnected()) {
        console.log('Using in-memory mock cards (MongoDB not connected)');
        return res.json(mockCards);
    }
    try {
        const cards = await Card.find().sort('order');
        res.json(cards);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a card
router.post('/', async (req, res) => {
    if (!isDbConnected()) {
        const newCard = {
            _id: Math.random().toString(36).substr(2, 9),
            title: req.body.title,
            column: req.body.column,
            order: req.body.order || 0,
            createdAt: new Date().toISOString()
        };
        mockCards.push(newCard);
        return res.status(201).json(newCard);
    }
    const card = new Card({
        title: req.body.title,
        column: req.body.column,
        order: req.body.order
    });

    try {
        const newCard = await card.save();
        res.status(201).json(newCard);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update card (position or column)
router.patch('/:id', async (req, res) => {
    if (!isDbConnected()) {
        const index = mockCards.findIndex(c => c._id === req.params.id);
        if (index === -1) return res.status(404).json({ message: 'Card not found' });

        if (req.body.column) mockCards[index].column = req.body.column;
        if (req.body.order !== undefined) mockCards[index].order = req.body.order;
        if (req.body.title) mockCards[index].title = req.body.title;

        return res.json(mockCards[index]);
    }
    try {
        const card = await Card.findById(req.params.id);
        if (!card) return res.status(404).json({ message: 'Card not found' });

        if (req.body.column) card.column = req.body.column;
        if (req.body.order !== undefined) card.order = req.body.order;
        if (req.body.title) card.title = req.body.title;

        const updatedCard = await card.save();
        res.json(updatedCard);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a card
router.delete('/:id', async (req, res) => {
    if (!isDbConnected()) {
        const initialLength = mockCards.length;
        mockCards = mockCards.filter(c => c._id !== req.params.id);
        if (mockCards.length === initialLength) return res.status(404).json({ message: 'Card not found' });
        return res.json({ message: 'Card deleted' });
    }
    try {
        const card = await Card.findById(req.params.id);
        if (!card) return res.status(404).json({ message: 'Card not found' });

        await card.deleteOne();
        res.json({ message: 'Card deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
