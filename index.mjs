import express from 'express';
import cors from 'cors';
import documentsRoutes from './src/Routes/documentsRoutes.mjs'
import documents from './src/Metadata/documentData.mjs';
import mongoose from 'mongoose';
import  Document  from './src/Schemas/documentSchema.mjs';
const app=express();
const port=5000;
app.use(express.json());
app.use(cors())

// MongoDB connection

mongoose.connect('mongodb://127.0.0.1:27017/documents', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async () => {
    try {
        await Document.deleteMany({}); // Clear existing documents
        await Document.insertMany(documents); // Insert default documents
        console.log('Default documents inserted successfully!');
    } catch (error) {
        console.error('Error inserting documents:', error);
    }
})

app.use('/api/documents',documentsRoutes)
app.listen(port,()=>{
    console.log(`Server is running on port ${port}`)
});
