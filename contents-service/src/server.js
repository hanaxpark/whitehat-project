require('dotenv').config();
const express=require('express');
const db=require('./config/db');
const app=express();
app.use(express.json());
app.get('/health',async(req,res)=>{try{await db.query('SELECT 1');res.json({ok:true,service:'contents'})}catch{res.status(503).json({ok:false,service:'contents'})}});
app.use('/api/posts',require('./routes/posts.routes'));
app.use('/api',require('./routes/comments.routes'));
app.use('/api',require('./routes/likes.routes'));
app.use('/api/admin',require('./routes/admin.routes'));
const port=Number(process.env.PORT||3000);
app.listen(port,'0.0.0.0',()=>console.log(`contents-service listening on ${port}`));

