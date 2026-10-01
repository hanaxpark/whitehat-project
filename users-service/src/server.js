require('dotenv').config();
const express=require('express');
const db=require('./config/db');
const app=express();
app.use(express.json());
app.get('/health',async(req,res)=>{try{await db.query('SELECT 1');res.json({ok:true,service:'users'})}catch{res.status(503).json({ok:false,service:'users'})}});
app.use('/api/auth',require('./routes/auth.routes'));
app.use('/api/users',require('./routes/users.routes'));
app.use('/api/users/admin',require('./routes/admin.routes'));
const port=Number(process.env.PORT||3000);
app.listen(port,'0.0.0.0',()=>console.log(`users-service listening on ${port}`));


