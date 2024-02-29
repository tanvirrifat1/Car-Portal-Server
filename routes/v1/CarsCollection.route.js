const express = require('express');
const carsController = require('../../Controller/CarsCollection.controler');
const limiter = require('../../middleware/limiter');
const viewCount = require('../../middleware/viewCount');

const router = express.Router();

// router.get('/', (req, res) => {
//     res.send('CarsCollection found');
// })

// router.post('/CarsCollection', (req, res) => {
//     res.send('CarsCollection added')
// })

router.route('/').get(viewCount, limiter, carsController.getAllCars)
    .post(carsController.saveCars)

module.exports = router;