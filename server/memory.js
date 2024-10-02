import { Redis } from '@upstash/redis';
import { PineconeClient } from 'pinecone-client';
import { Pinecone } from '@pinecone-database/pinecone';

import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
dotenv.config();
const apiKey = process.env.GEMINI_API_KEY;
// Initialize the Generative AI client with the API key
const genAI = new GoogleGenerativeAI(apiKey);

if (!apiKey) {
    console.error('Error: Please set HUGGINGFACE_API_KEY environment variable');
    process.exit(1);
  }


  

class MemoryManager {
    static instance;
    history;
    pineconeClient;
    pineconeIndexName;

    constructor() {
        this.history = Redis.fromEnv();

       // Initialize Pinecone client
       this.pineconeClient = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY
    });

    this.pineconeIndex = this.pineconeClient.index(process.env.PINECONE_INDEX_NAME || 'chat-bot');

    }

    async init() {
        try {
            // Connect to Pinecone: no explicit `init` method, just ensure it's ready.
            await this.pineconeClient.updateConfig({ dimension: 768 });
            // console.log('Pinecone client initialized successfully.');
        } catch (error) {
            console.error('Failed to initialize Pinecone client:', error.message);
            throw error;
        }
    }

    
    static async getInstance() {
        if (!MemoryManager.instance) {
            MemoryManager.instance = new MemoryManager();
        }
        return MemoryManager.instance;
    }

    generateRedisKey(userId) {
        return `user-${userId}`;
    }

    async writeToHistory(text, userId) {
        if (!userId) {
            console.log("User ID is required");
            return "";
        }
    
        const key = this.generateRedisKey(userId);
    
        // Remove old messages past 10 messages
        await this.history.zremrangebyrank(key, 0, -11);
    
        const result = await this.history.zadd(key, {
            score: Date.now(),
            member: text,
        });
    
        return result;
    }
    async readLatestHistory(userId) {
        if (!userId) {
            console.log("User ID is required");
            return "";
        }
    
        const key = this.generateRedisKey(userId);
        //console.log("Reading history from key:", key);
    
        // Retrieve the latest 2 messages by index-based range
        let result = await this.history.zrange(key,-20,-1);
    
       // console.log("Result from Redis:", result);
    
        const recentChats = result.join("\n");
        //console.log("Recent chats:", recentChats);
    
        return recentChats;
    }
        
    async seedChatHistory(seedContent, delimiter = "\n", userId) {
        const key = this.generateRedisKey(userId);
        if (await this.history.exists(key)) {
            console.log("User already has chat history");
            return;
        }

        const content = seedContent.split(delimiter);
        let counter = 0;
        for (const line of content) {
            await this.history.zadd(key, { score: counter, member: line });
            counter += 1;
        }
    }

    // New Methods for Pinecone Integration

    /**
     * Store conversation embedding in Pinecone
     * @param {string} userInput - The user's input text.
     * @param {string} botResponse - The bot's response text.
     * @param {Array} inputEmbedding - The embedding vector of the user's input.
     * @param {Array} responseEmbedding - The embedding vector of the bot's response.
     */
    async storeEmbeddingInPinecone(userInput, botResponse, inputEmbedding, responseEmbedding, userId) {
        try {
            // Prepare the vector entry
            const vector = {
                id: `${userId}_${Date.now()}`, // Unique identifier for the vector
                values: inputEmbedding, // Use input embedding as the main vector for search
                metadata: {
                    userInput,
                    botResponse,
                    responseEmbedding: JSON.stringify(responseEmbedding),
                    userId,
                },
            };

            // Upsert the vector into Pinecone, passing an array of vectors
        await this.pineconeIndex.upsert( [vector]);

            // console.log('Stored conversation embedding in Pinecone:', vector.id);
        } catch (error) {
            console.error('Error storing embedding in Pinecone:', error.message);
            throw error;
        }
    }

    /**
     * Query Pinecone to find the most relevant conversation based on the input embedding
     * @param {Array} inputEmbedding - The embedding vector of the user's input.
     * @returns {string} - The bot response of the most relevant conversation found.
     */
    async findMostRelevantResponseFromPinecone(inputEmbedding, userId) {
        try {

            // Construct the query object
        const query = {
            topK: 1, // Number of top similar results to retrieve
            includeMetadata: true, // Include metadata in the results
            vector: inputEmbedding, // The query vector to search with
            filter: {
                userId: userId // Use metadata filter for userId
            }
        };

            // Query Pinecone for the most similar vectors
        const results = await this.pineconeIndex.query(query);

        // Check if there are matches and return the bot response from metadata
        if (results.matches && results.matches.length > 0) {
            const mostSimilar = results.matches[0];
            return mostSimilar.metadata.botResponse || 'No response found in metadata.';
        } else {
            return 'No similar conversation found.';
        }
        } catch (error) {
            console.error('Error finding relevant response in Pinecone:', error.message);
            return 'Error finding response.';
        }
    }
    // Function to get embedding using genAI library
    async  getEmbedding(text) {
        try {
          const model = genAI.getGenerativeModel({ model: "embedding-001" }); // Adjust model name if needed
          const result = await model.embedContent(text);
          const embedding = result.embedding;
        //   console.log(embedding.values)
        //   console.log(`Embedding computed successfully for text: ${text}`);
          return embedding.values;
          
        } catch (error) {
          console.error(`Error embedding text: ${text}`);
          console.error(error);
          throw error; // Rethrow the error to handle it upstream
        }
  }
}

export default MemoryManager;