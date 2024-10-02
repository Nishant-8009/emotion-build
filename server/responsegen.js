import dotenv from 'dotenv';
import MemoryManager from './memory.js';
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import mysql from 'mysql2';
import util from 'util';
import fs from 'fs';

// Load API key from .env file
dotenv.config(); 

// Initialize GoogleGenerativeAI with proper configurations
const apiKey = process.env.GEMINI_API_KEY;


const genAI = new GoogleGenerativeAI(apiKey, [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_SOME,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_SOME,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_SOME,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_SOME,
  },
]);

// Error if API key is not set
if (!apiKey) {
  console.error('Error: Please set GEMINI_API_KEY environment variable');
  process.exit(1);
}

// Attributes definitions
/*const maleAttributes = {
  Weirdness: 9,
  AngerIssues: 5,
  Insecurity: 4,
  Sarcasm: 10,
  jealousy: 5
};

const femaleAttributes = {
  Weirdness: 6,
  AngerIssues: 8,
  Insecurity: 8,
  Sarcasm: 10,
  jealousy: 8
}; // removed for the time being
Your personality is a unique blend(score out of 10):
${JSON.stringify(attributes, null, 2)};*/

const caCertBase64 = process.env.CA_CERT_BASE64;

// Convert Base64 string back to binary data
const caCert = Buffer.from(caCertBase64, 'base64');

let count_block = 0; // Counting to block the user

class ResponseGenerator {
  constructor(userId) {
    this.userId = userId;
    this.initMemoryManager();

    try {
      this.db = mysql.createConnection({
        host: process.env.SQLHOST ||'localhost',      
        user: process.env.SQLUSER ||'root',           
        password: process.env.SQLPassword ||'',           
        database: process.env.SQLDatabase || 'chatuser' ,
        port: process.env.SQLPORT || 3306,
        ssl: {
          rejectUnauthorized: true,
          ca: caCert,
        }
      });

      this.db.connect((err) => {
        if (err) {
          console.error('Error connecting to MySQL database:', err);
          throw err;
        }
        console.log('Connected to MySQL database');
      });
    } catch (error) {
      console.error('Failed to initialize MySQL connection:', error);
      throw error;
    }
  }
  async initMemoryManager() {
    this.memoryManager = await MemoryManager.getInstance();
}


  async generateResponseSource(message) {
    try {
      console.log('Generating empathetic response for message:', message);
      
      const [userDetails, concernInfo] = await Promise.all([
        this.fetchUserInfo(),
        this.fetchRecentConerns()
      ]);

      console.log("Fetched userDetails:", userDetails);
      console.log("Fetched Conerns:", concernInfo);
      const recentChatHistory = await this.memoryManager.readLatestHistory(this.userId);

      const userInput = `${message}`;
      // const attributes = companionInfo.companionGender === 'male' ? maleAttributes : femaleAttributes;

      const sentimentPrompt = `Analyze the following text for emotional sentiment and return whether it is positive, negative, or neutral:
      ${userInput}
      do the sentiment analysis and also tell the wieght of diffenrent emotions
      `;
      const preamble = `"You are an empathetic virtual assistant dedicated to providing emotional support and guidance. Your primary goal is to listen and respond with care to the feelings and concerns of the user. You understand that discussing feelings can be difficult, and you aim to create a safe space for open dialogue. 

You are aware of the following about the user:
- User's name: ${userDetails.name}
-User Sentiment can be seen by his input : ${userInput}
- Recent topics of concern can be seen by user queries in recent chats: ${recentChatHistory || 'not specified'}

Your role is to validate their feelings, encourage them, and offer helpful insights or coping strategies. You can ask open-ended questions to invite them to share more if they feel comfortable.

Whenever the user shares a concern, respond with empathy and understanding. Recognize their feelings and suggest ways to cope or improve their situation while being supportive and non-judgmental.`;

      const finalPrompt = `You are currently talking to ${userDetails.name}. Here is some important context:
      ${preamble}\n
      Below is the user's message:
      ${userInput}\n
      Based on your previous conversations, here is a summary of their recent interactions (take context, don’t copy-paste):
      ${recentChatHistory}\n
      Now, respond with empathy and understanding.`;
      
      const promptInput = `${finalPrompt}\nRespond to the user in a supportive manner, validating their feelings and offering encouragement.`;
            const gptResponse = await this.generateResponse(promptInput);

      if (gptResponse.trim() === '') {
        count_block++;
      } else {
        count_block = 0;
      }
      
      return gptResponse;

    } catch (error) {
      console.error('Error generating response:', error);
      return 'Sorry, I am busy right now will talk you later!!';
    }
  }

  async generateResponse(prompt, maxRetries = 7) {
    let retries = 0;
    while (retries < maxRetries) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);

        if (result && result.response) {
          const candidates = result.response.candidates;
          if (candidates && candidates.length > 0) {
            const firstCandidate = candidates[0];

            if (firstCandidate.content && firstCandidate.content.parts && firstCandidate.content.parts.length > 0) {
              const textPart = firstCandidate.content.parts[0];
              if (typeof textPart === 'string') {
                return textPart;
              } else if (textPart.text) {
                return textPart.text;
              } else {
                return JSON.stringify(textPart);
              }
            } else {
              console.log('No response content available. Retrying...');
            }
          } else {
            console.log('No response candidates available. Retrying...');
          }
        } else {
          console.log('No response generated. Retrying...');
        }
      } catch (error) {
        console.error('Error generating text:', error);
        console.log('Retrying...');
      }
      retries++;
    }
    return ' ';
  }

  async fetchUserInfo() {
    try {
        console.log('Fetching user info for userId:', this.userId);
        const queryPromise = util.promisify(this.db.query).bind(this.db); // Promisify the query method

        const userRows = await queryPromise('SELECT * FROM users WHERE userId = ?', [this.userId]);

        if (userRows.length > 0) {
            const user = userRows[0];
            const detailsRows = await queryPromise('SELECT * FROM `user-info` WHERE userId = ?', [this.userId]);

            if (detailsRows.length > 0) {
                const userInfo = {
                    name: user.username,
                    age: detailsRows[0].userAge,
                    gender: detailsRows[0].userGender,
                    hobbies: detailsRows[0].userHobbies,
                    companyName: detailsRows[0].companyName,
                    isStudying: detailsRows[0].isStudying,
                    degree: detailsRows[0].degree,
                    institution: detailsRows[0].institution,
                    companyLocation: detailsRows[0].companyLocation,
                    relationshipStatusContext: detailsRows[0].relationshipStatusContext,
                    favoriteTopicsDiscuss: detailsRows[0].favoriteTopics,
                    dailyRoutinePreferences: detailsRows[0].dailyRoutinePreferences,
                    healthWellbeingDetails: detailsRows[0].healthWellbeingDetails,
                    goalsAspirations: detailsRows[0].goalsAspirations,
                    preferredCommunicationTimes: detailsRows[0].preferredCommunicationTimes,
                    specialDatesAnniversaries: detailsRows[0].specialDates
                };
                // console.log('Fetched userInfo:', userInfo);
                return userInfo;
            } else {
                throw new Error('User details not found');
            }
        } else {
            throw new Error('User not found');
        }
    } catch (error) {
        console.error('Error fetching user info:', error);
        throw error;
    }
}

async fetchRecentConerns(limit = 5) { // Added limit parameter
  try {
      console.log('Fetching recent concerns for userId:', this.userId);
      const queryPromise = util.promisify(this.db.query).bind(this.db); // Promisify the query method

      // Fetch recent concerns with a specified limit
      const rows = await queryPromise('SELECT * FROM `concern-info` WHERE userId = ? ORDER BY createdAt DESC LIMIT ?', [this.userId, limit]);

      if (rows.length > 0) {
          return rows.map(row => ({
              concern: row.concern, // Assuming the concern is stored in a column named 'concern'
              timestamp: row.createdAt // Assuming there's a timestamp column to track when it was created
          }));
      } else {
          return []; // Return an empty array if no concerns found
      }
  } catch (error) {
      console.error('Error fetching recent concerns:', error);
      throw error;
  }
}

async storeConcern(concern){
  try {
    console.log('Fetching bot info for userId:', this.userId);
    const queryPromise = util.promisify(this.db.query).bind(this.db); // Promisify the query method

    const result = await queryPromise('INSERT INTO `concern-info` (userId, concern) VALUES (?, ?)', [this.userId, concern]);

    if (result.affectedRows > 0) {
      console.log('Concern stored successfully:', concern);
    } else {
      throw new Error('Failed to store concern');
    }
} catch (error) {
    console.error('Error fetching bot info:', error);
    throw error;
}
}
}

export default ResponseGenerator;