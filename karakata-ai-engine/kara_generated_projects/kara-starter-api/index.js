const express = require('express');
const app = express();
app.use(express.json());
let todos = [];
app.get('/todos', (req,res)=>res.json(todos));
app.post('/todos', (req,res)=>{ todos.push(req.body); res.status(201).json(req.body); });
app.listen(4000, ()=>console.log('Kara starter running on 4000'));
