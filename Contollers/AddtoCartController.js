const mongoose = require('mongoose');
const Menu = require('../models/VegMenuModel');


module.exports.AddtoCart.get = async(req,res) => {
    var VegMenuId = req.params.id;
    var cart = new cart(req.session.cart ? req.session.cart : {});

    menubar.Menu(VegMenuId, function(err, menu) => {
        if(err){
            return res.redirect('/');
        }

    });
}