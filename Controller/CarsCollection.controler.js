const tools = [
    { id: 1, name: 'kaiser' },
    { id: 2, name: 'kaiser2' },
    { id: 3, name: 'kaiser3' },
]

module.exports.getAllCars = (req, res, next) => {
    const { limit, page } = req.query
    console.log(limit, page);
    res.json(tools)
}

module.exports.saveCars = (req, res) => {

}