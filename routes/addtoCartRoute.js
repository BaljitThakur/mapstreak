const express = require('express');
const router = express.Router();
const AddtoCart = require('../Controllers/AddtoCartController');

router.get('/add-to-cart/:id', AddtoCart.get);