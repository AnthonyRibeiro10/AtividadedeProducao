const express = require("express");
const mongoose = require('mongoose');
const Ajv = require("ajv");
const cors = require('cors');

const ajv = new Ajv();
const app = express();

app.use(express.json());
app.use(cors()); // Habilitar CORS para todas as origens

const port = 3000;

// Conexão com o MongoDB
mongoose.connect('mongodb+srv://atvd:teste@atvdproducao.rbwqbk7.mongodb.net/?retryWrites=true&w=majority&appName=AtvdProducao');

// Modelo de tipos de combustíveis
const FuelType = mongoose.model('FuelType', {
    name: String
});

// Modelo de carro com referência aos tipos de combustíveis
const Car = mongoose.model('Car', {
    name: String,
    brand: String,
    fuelTypes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FuelType' }]
});

// Schema de validação para os carros
const carSchema = {
    type: "object",
    properties: {
        name: { type: "string" },
        brand: { type: "string" },
        fuelTypes: {
            type: "array",
            items: { type: "string" } // Agora é uma referência aos IDs dos tipos de combustíveis
        }
    },
    required: ["name", "brand", "fuelTypes"],
    additionalProperties: false
};

// Middleware para validação dos dados de entrada
function validateData(schema) {
    return (req, res, next) => {
        const valid = ajv.validate(schema, req.body);
        if (!valid) {
            return res.status(400).json({ error: ajv.errorsText() });
        }
        next();
    };
}

// Rota para adicionar um novo tipo de combustível
app.post("/fuelTypes", validateData({ type: "object", properties: { name: { type: "string" } }, required: ["name"], additionalProperties: false }), async (req, res) => {
    const fuelType = new FuelType({ name: req.body.name });
    await fuelType.save();
    res.send(fuelType);
});

// Rota para adicionar um novo carro
app.post("/", validateData(carSchema), async (req, res) => {
    const { name, brand, fuelTypes } = req.body;
    const car = new Car({ name, brand, fuelTypes });
    await car.save();
    res.send(car);
});

// Rota para editar um carro pelo id do carro na URL.
app.put("/:id", validateData(carSchema), async (req, res) => {
    try {
        const { name, brand, fuelTypes } = req.body;
        const car = await Car.findByIdAndUpdate(req.params.id, { name, brand, fuelTypes }, { new: true });
        if (!car) {
            return res.status(404).json({ error: "Car not found" });
        }
        res.send(car);
    } catch (error) {
        console.error("An error occurred while updating car:", error);
        res.status(500).send("Internal Server Error");
    }
});


// Rota para buscar um carro por ID
app.get("/cars/:id", async (req, res) => {
    try {
        const car = await Car.findById(req.params.id).populate('fuelTypes');
        if (!car) {
            return res.status(404).json({ error: "Car not found" });
        }
        res.json(car);
    } catch (error) {
        console.error("An error occurred:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Rota para buscar carros por marca
app.get("/cars", async (req, res) => {
    try {
        const { id, brand } = req.query;
        let cars;
        if (id) {
            // Se o ID foi fornecido, buscar por ID
            const car = await Car.findById(id).populate('fuelTypes');
            if (!car) {
                return res.status(404).json({ error: "Car not found" });
            }
            return res.json(car);
        } else if (brand) {
            // Se a marca foi fornecida, buscar por marca
            cars = await Car.find({ brand }).populate('fuelTypes');
        } else {
            // Se nenhum filtro foi fornecido, retornar todos os carros
            cars = await Car.find().populate('fuelTypes');
        }
        res.json(cars);
    } catch (error) {
        console.error("An error occurred:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


// Rota para deletar um carro pelo ID
app.delete('/:id', async (req, res) => {
    const car = await Car.findByIdAndDelete(req.params.id);
    return res.send(car);
});

// Rota para deletar vários carros pelos IDs
app.delete('/', async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
        return res.status(400).send({ error: 'IDs must be provided in an array.' });
    }
    const deletedCars = [];
    for (const id of ids) {
        const car = await Car.findByIdAndDelete(id);
        if (car) {
            deletedCars.push(car);
        }
    }
    res.send(deletedCars);
});

// Rota para listar todos os tipos de combustíveis
app.get('/fuelTypes', async (req, res) => {
    try {
        const fuelTypes = await FuelType.find();
        res.json(fuelTypes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// Iniciar o servidor
app.listen(port, () => {
    console.log('App running on port ' + port);
});
