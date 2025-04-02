import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri, { 
    // Remove deprecated options
    // useNewUrlParser: true, 
    // useUnifiedTopology: true,
    
    // Add proper TLS settings
    ssl: true,
    tls: true,
    tlsAllowInvalidCertificates: false,
    tlsAllowInvalidHostnames: false,
    maxPoolSize: 10,
    minPoolSize: 5
  });

  try {
    await client.connect();
    console.log('Connected successfully to MongoDB Atlas');
    
    // Create or use "chat" database
    const chatDb = client.db('chat');
    
    // Create or use "user" collection
    const userCollection = chatDb.collection('user');
    
    // Insert a test document to verify
    const result = await userCollection.insertOne({
      username: 'testuser',
      email: 'test@example.com',
      createdAt: new Date()
    });
    
    console.log('Test document inserted:', result);
    
    // Verify by finding the document
    const users = await userCollection.find({}).toArray();
    console.log('Users in collection:', users);
    
  } catch (error) {
    console.error('Connection error:', error);
  } finally {
    await client.close();
  }
}

testConnection(); 