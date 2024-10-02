import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid'; // Import uuidv4 from uuid package
import otpGenerator from 'otp-generator';
import jwt from 'jsonwebtoken'; // Import JWT
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer'
import ResponseGenerator from './responsegen.js';
import fs from 'fs';
import multer from 'multer';
import db from './db.js';
import User from './models/User.js';
import BotInfo from './models/BotInfo.js';
import UserInfo from './models/UserInfo.js';
import Message from './models/Message.js';
dotenv.config(); // Load API key from .env file

const app = express();
const PORT = process.env.PORT || 5000;
// Set up Multer storage configuration
const storage = multer.memoryStorage();
const upload = multer({storage: storage,
  limits: {
      fieldSize: 10 * 1024 * 1024, // Increase the limit as needed (10 MB here)
  }});

// const corsOptions = {
//   origin: '*',
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
// };
// app.use(cors(corsOptions));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://emotion-build.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', true); // If using credentials like cookies
  if (req.method === 'OPTIONS') {
    res.sendStatus(200); // Respond to OPTIONS requests
  } else {
    next(); // Continue with other routes
  }
});
app.use(bodyParser.json());

// JWT Secret Key (this should be a secure, random string in production)
const JWT_SECRET = process.env.JWT_SECRET ;

const caCertBase64 = process.env.CA_CERT_BASE64;

// Convert Base64 string back to binary data
const caCert = Buffer.from(caCertBase64, 'base64');

const saltRounds = 10; // Number of salt rounds for bcrypt hashing

// Database connection configuration using createPool for connection pooling
const pool = mysql.createPool({
  host: process.env.SQLHOST ||'localhost',      
        user: process.env.SQLUSER ||'root',           
        password: process.env.SQLPassword ||'',           
        database: process.env.SQLDatabase || 'chatuser' ,
        port: process.env.SQLPORT || 3306,
        ssl: {
          rejectUnauthorized: true,
          ca: caCert,
        },
  waitForConnections: true, 
  connectionLimit: 10,
  queueLimit: 0,
});
app.get("/", (req, res) => {
  res.send("server started");
});
// Function to execute queries
async function executeQuery(sql, values = []) {
  const connection = await pool.getConnection();
  try {
    const [rows, fields] = await connection.execute(sql, values);
    return rows;
  } finally {
    connection.release();
  }
}
  // Temporary storage for OTP and email
let tempUserDetails = {};


// Function to send OTP email
async function sendOtpEmail(email, subject, message) {
  // Create a transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
          user: process.env.GMAIL_USER, // Your Gmail address
          pass: process.env.GMAIL_APP_PASSWORD // Your Gmail App Password
      }
  });

  // Email options
  let mailOptions = {
      from: `"ByteBond" <${process.env.GMAIL_USER}>`, // Sender address
      to: email, // List of recipients
      subject: subject, // Subject line
      text: message, // Plain text body
  };

  // Send mail
  let info = await transporter.sendMail(mailOptions);
  console.log(`Message sent: ${info.messageId}`);
}

// Mock database
let userData = {};

app.post('/api/send-otp', async(req,res)=>{
  const {email} = req.body;
  const otp = otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false });

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
}

    
    try {
     const  subject = 'Reset Your ByteBond Password';
   const  messageforgot = `
Dear User,
        
We received a request to reset your password for your ByteBond account. To proceed with resetting your password, please use the following One-Time Password (OTP):

${otp}
If you did not request to reset your password, please ignore this email. If you have any concerns or need further assistance, feel free to contact our support team at jmimp45@gmail.com.

Thank you for being a valued member of ByteBond!

Best regards,

ByteBond Team
`;
      await sendOtpEmail(email, subject, messageforgot);
      userData[email] = { otp, password: null };
      console.log(`Sending OTP ${otp} to ${email}`);
      res.status(200).send('OTP sent successfully');
    } catch (error) {
        console.error('Error sending OTP email:', error);
        res.status(500).send('Error sending OTP email');
    }
});

app.post('/api/verify-otp', async (req, res) => {
  const { email, otp, password } = req.body;

  if (!email || !otp || !password) {
      return res.status(400).json({ message: 'Email, OTP, and password are required' });
  }
  
  const user = userData[email];
  
  if (user && user.otp === otp) {
      try {
          // Get a connection from the pool
          const connection = await pool.getConnection();

          try {
              // Hash the password (use a proper hashing library like bcrypt in real applications)
              const hashedPassword = await bcrypt.hash(password, saltRounds); // Placeholder: replace with hashing function

              // Update query to change the user's password
              const query = 'UPDATE users SET password = ? WHERE email = ?';
              const [results] = await connection.execute(query, [hashedPassword, email]);
              const result = await User.findOneAndUpdate(
                { email: email }, // Find user by email
                { password: password }, // Update the password
                { new: true } // Return the updated document
              );
              if (results.affectedRows > 0) {
                  // Respond with success message if the update was successful
                  res.status(200).json({ message: 'Password updated successfully' });
              } else {
                  // Respond with an error if no rows were affected
                  res.status(400).json({ message: 'Failed to update password. User not found.' });
              }
          } finally {
              // Release the connection back to the pool
              connection.release();
          }
      } catch (error) {
        const subject ='Database error';
        const message =`
Dear Nishant,

Error arrised to userId ${email}

${error}
`;
await sendOtpEmail('nishantmalhotra8009@gmail.com', subject, message);
          console.error('Database error:', error);
          res.status(500).json({ message: 'Server Error' });
      }
  } else {
      res.status(400).json({ message: 'Invalid OTP or email' });
  }
});

app.post('/api/clearchat',verifyToken, async (req,res)=> {
  const userId = req.authData.userId;
  
  try {
   // Get a connection from the pool
   const connection = await pool.getConnection();
    
    // Execute SQL query to delete messages for the given userId
    const [result] = await connection.execute('DELETE FROM messages WHERE userId = ?', [userId]);
    
    // Check if any rows were affected (i.e., messages were deleted)
    if (result.affectedRows > 0) {
      res.json({ message: 'Chat cleared successfully', deletedMessages: result.affectedRows });
    } else {
      res.json({ message: 'No messages found to clear' });
    }
  } catch (error) {
    const subject ='Internal Server Error';
      const message =`
Dear Nishant,

Error arrised to userId ${userId}

${error}
`;
await sendOtpEmail('nishantmalhotra8009@gmail.com', subject, message);
    console.error('Error clearing chat:', error);
    res.status(500).json({ message: 'Error clearing chat', error: error.message });
  }
});

// Endpoint to handle user signup and OTP generation
app.post('/signup', async (req, res) => {
    console.log(req.body);
    const { username,fullName, email, password, phoneNumber } = req.body;
    const otp = otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false });
    const userId = uuidv4();
    const [existingUsers] = await pool.query(
      'SELECT * FROM users WHERE email = ? OR phoneNumber = ?',
      [email, phoneNumber]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'User with this email or phone number already exists' });
    }
    // Hash password using bcrypt
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Store temporarily in memory
    tempUserDetails = { userId, username,fullName, email, password: hashedPassword, phoneNumber, otp , nonhash: password};
    // Send OTP to email
  const subject = 'Your ByteBond OTP Verification Code';
    const message = `
Dear User,

Welcome to ByteBond!

To complete your registration and verify your email address, please use the following One-Time Password (OTP):

${otp}

If you did not request to reset your password, please ignore this email. If you have any concerns or need further assistance, feel free to contact our support team at jmimp45@gmail.com.

Thank you for being a valued member of ByteBond!

Best regards,

ByteBond Team
`;
    try {
      await sendOtpEmail(email, subject, message);
      console.log(`Sending OTP ${otp} to ${email}`);
      res.status(200).send('OTP sent successfully');
  } catch (error) {
      console.error('Error sending OTP email:', error);
      res.status(500).send('Error sending OTP email');
  }
    
});

// Endpoint to handle OTP verification and store user details
app.post('/verifyotp', async (req, res) => {
  const { email, otp } = req.body;

  if (tempUserDetails.email === email && tempUserDetails.otp === otp) {
    const { userId, username, fullName, password, phoneNumber, nonhash } = tempUserDetails;

    try {
      // Get connection from pool
      const connection = await pool.getConnection();

      // Begin transaction
      await connection.beginTransaction();

      try {
        // Insert user details
        const sql = 'INSERT INTO users (userId, username, fullName, email, password, phoneNumber) VALUES (?, ?, ?, ?, ?, ?)';
        const values = [userId, username, fullName, email, password, phoneNumber];
        await connection.execute(sql, values);

        // Commit transaction
        await connection.commit();
        const newUser = new User({ userId, username, fullName, email, password: nonhash, phoneNumber, otp });
        await newUser.save();
        // Issue JWT token
        const token = jwt.sign({ userId, username, fullName, email }, JWT_SECRET, { expiresIn: '1w' });
        
        // Clear tempUserDetails after successful registration
        tempUserDetails = {};

        // Respond with success message and token
        res.status(200).json({ message: 'User registered successfully', token });
      } catch (error) {
        // Rollback transaction on error
        await connection.rollback();
        console.error('Error storing user:', error);
        res.status(500).send('Error storing user');
      } finally {
        // Release connection back to the pool
        connection.release();
      }
    } catch (error) {
      const subject ='Database error';
        const message =`
Dear Nishant,

Error arrised to userId ${email}

${error}
`;
await sendOtpEmail('nishantmalhotra8009@gmail.com', subject, message);
      console.error('Error establishing database connection:', error);
      res.status(500).send('Error establishing database connection');
    }
  } else {
    res.status(400).send('Invalid OTP');
  }
});


// Endpoint to handle user login
app.post('/login', async (req, res) => {
  const { usernameOrEmail, password } = req.body;

  try {
    // Get connection from pool
    const connection = await pool.getConnection();


    try {
      // Query to find user by username or email
      const sql = 'SELECT * FROM users WHERE phoneNumber = ? OR email = ?';
      const [results] = await connection.execute(sql, [usernameOrEmail, usernameOrEmail]);
      if (results.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // User found, compare passwords using bcrypt
      const user = results[0];
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return res.status(401).json({ error: 'Incorrect password' });
      }

      // Passwords match, generate JWT token
      const token = jwt.sign(
        { userId: user.userId, username: user.username, fullName: user.fullName, email: user.email },
        JWT_SECRET,
        { expiresIn: '1w' }
      );

      // Check if userId exists in bot-info and user-info tables
      const botInfoSql = 'SELECT * FROM `bot-info` WHERE userId = ?';
      const userInfoSql = 'SELECT * FROM `user-info` WHERE userId = ?';

      const [botResults] = await connection.execute(botInfoSql, [user.userId]);
      const [userResults] = await connection.execute(userInfoSql, [user.userId]);

      // Determine navigation based on results
      if (botResults.length === 0 && userResults.length === 0) {
        // Neither in bot-info nor user-info
        return res.status(200).json({ message: 'Login successful', token, navigate: '/chatbot-details' });
      } else {
        // Found in bot-info or user-info
        return res.status(200).json({ message: 'Login successful', token, navigate: '/chat' });
      }
    } catch (error) {
      const subject ='Internal Server Error';
      const message =`
Dear Nishant,

Error arrised to userId ${usernameOrEmail}

${error}
`;
await sendOtpEmail('nishantmalhotra8009@gmail.com', subject, message);
      console.error('Error retrieving user:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } finally {
      // Release connection back to the pool
      connection.release();
    }
  } catch (error) {
    const subject ='Database error';
        const message =`
Dear Nishant,

Error arrised to userId ${usernameOrEmail}

${error}
`;
await sendOtpEmail('nishantmalhotra8009@gmail.com', subject, message);
    console.error('Error establishing database connection:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/logout', verifyToken, async (req, res) => {
  try {
    const token = req.token; // The JWT token from the request header
    console.log(`User logged out. Token: ${token}`);

    // If you want to implement token blacklisting, add token to a blacklist here
    // For simplicity, we'll assume the client handles token removal

    // Respond with a success message
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Endpoint to handle fetching previous messages
app.get('/api/fetch_messages', verifyToken, async (req, res) => {
  const userId = req.authData.userId;
  const lastOnlineTime = new Date().toISOString();
        
  
  try {
    const userfilter = { userId: userId };
    const userupdate = {
      lastOnlineTime,
    };
    const useroptions = { new: true, upsert: true }; // Create if doesn't exist and return the new updated document

    // Perform the upsert operation for bot-info
     await User.findOneAndUpdate(userfilter, userupdate, useroptions);
    
    await User.findOneAndUpdate({ userId: userId }, { lastOnlineTime: lastOnlineTime });
    // Fetch messages from MySQL
    const sql = 'SELECT * FROM messages WHERE userId = ? ORDER BY timestamp ASC';
    const messages = await executeQuery(sql, [userId]);

    res.status(200).json(messages);
  } catch (error) {
    const subject ='Internal Server Error';
      const message =`
Dear Nishant,

Error arrised to userId ${userId}

${error}
`;
await sendOtpEmail('nishantmalhotra8009@gmail.com', subject, message);
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Endpoint to check user access to the chat page
app.get('/check-access', verifyToken, async (req, res) => {
  const userId = req.authData.userId; // Extract userId from the verified token

  try {
    // Get connection from pool
    const connection = await pool.getConnection();

    try {
      // Query to check if userId exists in bot-info table
      const botInfoSql = 'SELECT * FROM `bot-info` WHERE userId = ?';
      const [botResults] = await connection.execute(botInfoSql, [userId]);

      if (botResults.length > 0) {
        // User found in bot-info
        return res.status(200).json({ accessGranted: true });
      }

      // Query to check if userId exists in user-info table
      const userInfoSql = 'SELECT * FROM `user-info` WHERE userId = ?';
      const [userResults] = await connection.execute(userInfoSql, [userId]);

      if (userResults.length > 0) {
        // User found in user-info
        return res.status(200).json({ accessGranted: true });
      } else {
        // User not found in either table
        return res.status(403).json({ accessGranted: false });
      }
    } catch (error) {
      const subject ='Internal Server Error';
      const message =`
Dear Nishant,

Error arrised to userId ${userId}

${error}
`;
await sendOtpEmail('nishantmalhotra8009@gmail.com', subject, message);
      console.error('Error checking user access:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } finally {
      // Release connection back to the pool
      connection.release();
    }
  } catch (error) {
    const subject ='Database Error';
      const message =`
Dear Nishant,

Error arrised to userId ${userId}

${error}
`;
await sendOtpEmail('nishantmalhotra8009@gmail.com', subject, message);
    console.error('Error establishing database connection:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Verify JWT middleware function
function verifyToken(req, res, next) {
  const bearerHeader = req.headers['authorization'];

  if (typeof bearerHeader !== 'undefined') {
    const bearerToken = bearerHeader.split(' ')[1];
    req.token = bearerToken;
    jwt.verify(req.token, JWT_SECRET, (err, authData) => {
      if (err) {
        res.sendStatus(403); // Forbidden
      } else {
        req.authData = authData;
        next();
      }
    });
  } else {
    res.sendStatus(403); // Forbidden if no token
  }
}

// Middleware to check access to chat
async function checkChatAccess(req, res, next) {
  const userId = req.authData.userId;

  try {
    // Get connection from pool
    const connection = await pool.getConnection();

    try {
      // Query to check if userId exists in bot-info table
      const botInfoSql = 'SELECT * FROM `bot-info` WHERE userId = ?';
      const [botResults] = await connection.execute(botInfoSql, [userId]);

      if (botResults.length > 0) {
        // User found in bot-info, grant access
        next();
        return;
      }

      // Query to check if userId exists in user-info table
      const userInfoSql = 'SELECT * FROM `user-info` WHERE userId = ?';
      const [userResults] = await connection.execute(userInfoSql, [userId]);

      if (userResults.length > 0) {
        // User found in user-info, grant access
        next();
        return;
      }

      // No records found in either table, deny access
      res.status(403).json({ message: 'Access to chat page denied' });
    } catch (error) {
      const subject ='Internal Server Error';
      const message =`
Dear Nishant,

Error arrised to userId ${userId}

${error}
`;
await sendOtpEmail('nishantmalhotra8009@gmail.com', subject, message);
      console.error('Error checking user access:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } finally {
      // Release connection back to the pool
      connection.release();
    }
  } catch (error) {
    const subject ='Internal Server Error';
      const message =`
Dear Nishant,

Error arrised to userId ${userId}

${error}
`;
await sendOtpEmail('nishantmalhotra8009@gmail.com', subject, message);
    console.error('Error establishing database connection:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}


// Protect /chat route with checkChatAccess middleware
app.get('/chat', verifyToken, checkChatAccess, (req, res) => {
  // Render chat page or send chat page content
  res.send('Welcome to the chat page!');
});

app.get('/api/get_bot_name', verifyToken, async(req, res) =>{
  const userId = req.authData.userId;

  try {
    // Get connection from pool
    const connection = await pool.getConnection();

    try {
      // Query to fetch bot name from bot-info table based on userId
      const sql = 'SELECT * FROM `bot-info` WHERE userId = ?';
      const [results] = await connection.execute(sql, [userId]);

      if (results.length > 0) {
        const botName = results[0].chatbotName;
        const botImage = results[0].image;
        const base64Image = botImage ? Buffer.from(botImage).toString('base64') : null;
        res.status(200).json({botName, base64Image});
      } else {
        res.status(404).json({ error: 'Bot name not found for the user' });
      }
    } catch (error) {
      const subject ='Internal Server Error';
      const message =`
Dear Nishant,

Error arrised to userId ${userId}

${error}
`;
await sendOtpEmail('nishantmalhotra8009@gmail.com', subject, message);
      console.error('Error fetching bot name:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } finally {
      // Release connection back to the pool
      connection.release();
    }
  } catch (error) {
    const subject ='Database Error';
      const message =`
Dear Nishant,

Error arrised to userId ${userId}

${error}
`;
await sendOtpEmail('nishantmalhotra8009@gmail.com', subject, message);
    console.error('Error establishing database connection:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API to handle saving details to bot-info and user-info
app.post('/save-details', verifyToken, async (req, res) => {
  const userId = req.authData.userId;
  const { chatbotName, chatbotGender,chatbotAge, chatbotCountry,chatbotIsStudying,chatbotDegree,chatbotCompany, userAge, userGender, userInterests, userIsStudying,userDegree,userCompany, specialDates } = req.body;

  try {
    // Get connection from pool
    const connection = await pool.getConnection();

    try {
      // Begin transaction
      await connection.beginTransaction();

      // Query to insert/update bot-info
      const botInfoSql = `
        INSERT INTO \`bot-info\` (userId, chatbotName, chatbotGender, age, country, isStudying, degree, companyName)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE chatbotName = VALUES(chatbotName), chatbotGender = VALUES(chatbotGender), age= VALUES(age), country = VALUES(country), isStudying = VALUES(isStudying), degree = VALUES(degree), companyName = VALUES(companyName)  
      `;
      await connection.execute(botInfoSql, [userId, chatbotName, chatbotGender, chatbotAge, chatbotCountry, chatbotIsStudying, chatbotDegree, chatbotCompany]);

      
      // Query to insert/update user-info
      const userInfoSql = `
        INSERT INTO \`user-info\` (userId, userAge, userGender, userHobbies, isStudying , degree, companyName, specialDates)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE userAge = VALUES(userAge), userGender = VALUES(userGender),
                                userHobbies = VALUES(userHobbies), isStudying = VALUES(isStudying), degree= VALUES(degree) , companyName= VALUES(companyName),specialDates = VALUES(specialDates)
      `;
      await connection.execute(userInfoSql, [userId, userAge, userGender, userInterests, userIsStudying, userDegree, userCompany, specialDates]);

      // Commit transaction
      await connection.commit();

      // Release connection back to the pool
      connection.release();

      // Upsert bot-info in MongoDB
    const botFilter = { userId: userId };
    const botUpdate = {
      chatbotName,
      chatbotGender,
      age: chatbotAge,
      country: chatbotCountry,
      isStudying: chatbotIsStudying,
      degree: chatbotDegree,
      companyName: chatbotCompany,
    };
    const botOptions = { new: true, upsert: true }; // Create if doesn't exist and return the new updated document

    // Perform the upsert operation for bot-info
    const botInfoResult = await BotInfo.findOneAndUpdate(botFilter, botUpdate, botOptions);

    // Upsert user-info in MongoDB
    const userFilter = { userId: userId };
    const userUpdate = {
      userAge,
      userGender,
      userHobbies: userInterests, // Assuming `userInterests` is an array of strings
      isStudying: userIsStudying,
      degree: userDegree,
      companyName: userCompany,
      specialDates, // Assuming `specialDates` is an array of dates or strings
    };
    const userOptions = { new: true, upsert: true };

    // Perform the upsert operation for user-info
    const userInfoResult = await UserInfo.findOneAndUpdate(userFilter, userUpdate, userOptions);

      // Send success response
      res.status(200).json({ message: 'Details saved successfully' });
    } catch (error) {
      // Rollback transaction if any error occurs
      await connection.rollback();
      const subject ='Internal Server Error';
      const message =`
Dear Nishant,

Error arrised to userId ${userId}

${error}
`;
await sendOtpEmail('nishantmalhotra8009@gmail.com', subject, message);
      console.error('Error saving details:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } finally {
      // Release connection back to the pool in all cases
      connection.release();
    }
  } catch (error) {
    const subject ='Database Error';
      const message =`
Dear Nishant,

Error arrised to userId ${userId}

${error}
`;
await sendOtpEmail('nishantmalhotra8009@gmail.com', subject, message);
    console.error('Error establishing database connection:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//fetching existing bot data
app.get('/api/bot-info/' ,verifyToken, async(req,res) => {
  const userId = req.authData.userId;
  try {
    // Fetch messages from MySQL
    const sql = 'SELECT * FROM `bot-info` WHERE userId = ?';
    const botdata = await executeQuery(sql, [userId]);
    // Assuming `image` is stored as a Buffer in the database
    const bot = botdata[0];
    const base64Image = bot.image ? Buffer.from(bot.image).toString('base64') : null;

    // Construct response object including image if available
    const response = {
        ...bot,
        image: base64Image,
    };

    res.status(200).json(response);
  } catch (error) {
    const subject ='Internal Server Error';
      const message =`
Dear Nishant,

Error arrised to userId ${userId}

${error}
`;
await sendOtpEmail('nishantmalhotra8009@gmail.com', subject, message);
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }

});
//fetching existing user data
app.get('/api/user-info/' ,verifyToken, async(req,res) => {
  const userId = req.authData.userId;
  try {
    // Fetch messages from MySQL
    const sql = 'SELECT * FROM `user-info` WHERE userId = ?';
    const userdata = await executeQuery(sql, [userId]);
    res.status(200).json(userdata[0]);
  } catch (error) {
    const subject ='Internal Server Error';
      const message =`
Dear Nishant,

Error arrised to userId ${userId}

${error}
`;
await sendOtpEmail('nishantmalhotra8009@gmail.com', subject, message);
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }

});
app.post('/api/user-details-update/', verifyToken, async (req, res) => {
  const userId = req.authData.userId;
  const { 
      userAge, 
      userGender, 
      userHobbies, 
      specialDates, 
      companyName, 
      isStudying, 
      degree, 
      favouriteTopics, 
      preferredCommunicationTimes, 
      healthWellbeingDetails, 
      institution, 
      dailyRoutinePreferences, 
      goalAspirations 
  } = req.body;

  try {
      // Get connection from pool
      const connection = await pool.getConnection();
      
      // SQL query to update user details
      const sqlQuery = `
          UPDATE \`user-info\` 
          SET 
              userAge = ?, 
              userGender = ?, 
              userHobbies = ?, 
              specialDates = ?, 
              companyName = ?, 
              isStudying = ?, 
              degree = ?, 
              favoriteTopics = ?, 
              preferredCommunicationTimes = ?, 
              healthWellbeingDetails = ?, 
              institution = ?, 
              dailyRoutinePreferences = ?, 
              goalsAspirations = ? 
          WHERE userId = ?
      `;

      // Execute the query with the data
      const [result] = await connection.query(sqlQuery, [
          userAge,
          userGender,
          userHobbies,
          specialDates,
          companyName,
          isStudying,
          degree,
          favouriteTopics,
          preferredCommunicationTimes,
          healthWellbeingDetails,
          institution,
          dailyRoutinePreferences,
          goalAspirations,
          userId
      ]);

      // Release the connection back to the pool
      connection.release();
// Define the update object
const update = {
  userAge,
  userGender,
  userHobbies,
  specialDates,
  companyName,
  isStudying,
  degree,
  favoriteTopics: favouriteTopics,
  preferredCommunicationTimes,
  healthWellbeingDetails,
  institution,
  dailyRoutinePreferences,
  goalsAspirations: goalAspirations,
};

// Upsert user-info in MongoDB
const filter = { userId: userId };
const options = { new: true, upsert: true }; // Create if doesn't exist and return the new updated document

// Perform the upsert operation for user-info
const userInfoResult = await UserInfo.findOneAndUpdate(filter, update, options);

      if (result.affectedRows > 0) {
          res.status(200).json({ message: 'User details updated successfully.' });
      } else {
          res.status(404).json({ message: 'User ID not found or no changes made.' });
      }
  } catch (error) {
    const subject ='Internal Server Error';
      const message =`
Dear Nishant,

Error arrised to userId ${userId}

${error}
`;
await sendOtpEmail('nishantmalhotra8009@gmail.com', subject, message);
      console.error('Error updating user details:', error);
      res.status(500).json({ message: 'Server Error' });
  }
});


//upadting bot data 
app.post('/api/bot-details-update/', verifyToken, upload.single('botImage'), async (req,res)=>{
  const userId = req.authData.userId;
  const { botName, botGender, chatbotAge,chatbotDegree,chatbotIsStudying,chatbotCompany,chatbotCountry, hobbies,skills,Personality,Institution } = req.body;
  const botImage = req.file;
  try {
    // Get connection from pool
    const connection = await pool.getConnection();
    // const data = fs.readFileSync(botImage.path);
     // If botImage is available, use its buffer
     const imageBuffer = botImage ? botImage.buffer : null;
    // SQL query to update bot info
    const sqlQuery = 'UPDATE `bot-info` SET chatbotName = ?, chatbotGender = ?,age =?,country =?,companyName =?,isStudying =?,degree =?,institution= ?,hobbies =?,skills =?,personality =?, image = ? WHERE userId = ?';

    
    // Execute the query with the data
    const [result] = await connection.query(sqlQuery, [
      botName,
      botGender,
      chatbotAge,
      chatbotCountry,
      chatbotCompany,
      chatbotIsStudying,
      chatbotDegree, 
      Institution,
      hobbies,
      skills,
      Personality,
      imageBuffer, // botImage.buffer contains the image as a BLOB
      userId
    ]);

    // Release the connection back to the pool
    connection.release();

     // Define the update object
     const update = {
      chatbotName: botName,
      chatbotGender: botGender,
      age: chatbotAge,
      country: chatbotCountry,
      companyName: chatbotCompany,
      isStudying: chatbotIsStudying,
      degree: chatbotDegree,
      institution: Institution,
      hobbies: hobbies.split(',').map(item => item.trim()), // Assuming hobbies is a comma-separated string
      skills: skills.split(',').map(item => item.trim()), // Assuming skills is a comma-separated string
      personality: Personality,
      image: botImage ? botImage.buffer.toString('base64') : null, // Convert buffer to base64 string
    };

    // Upsert bot-info in MongoDB
    const filter = { userId: userId };
    const options = { new: true, upsert: true }; // Create if doesn't exist and return the new updated document

    // Perform the upsert operation for bot-info
    const botInfoResult = await BotInfo.findOneAndUpdate(filter, update, options);

    if (result.affectedRows > 0) {
      res.status(200).json({ message: 'Bot details updated successfully.' });
    } else {
      res.status(404).json({ message: 'User ID not found or no changes made.' });
    }
  } catch (error) {
    const subject ='Internal Server Error';
      const message =`
Dear Nishant,

Error arrised to userId ${userId}

${error}
`;
await sendOtpEmail('nishantmalhotra8009@gmail.com', subject, message);
    console.error('Error updating bot details:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});
// Endpoint to handle messages and generate bot response
app.post('/api/messages', verifyToken, async (req, res) => {
  const { sender, text, timestamp, botName } = req.body;
  const userId = req.authData.userId;

  // Check if required fields are present
  if (!sender || !text || !timestamp || !userId || !botName) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  

  try {
    // Save the message to MySQL database using mysql2/promise
    const connection = await pool.getConnection();
    const sqluser = `
      INSERT INTO messages (userId, sender, text, timestamp)
      VALUES (?, ?, ?, ?)
    `;
    const date = new Date();
    const valuesuser = [userId, sender, text, date];

   
    await connection.execute(sqluser, valuesuser);
      // Save the message to MongoDB using Mongoose
      const newMessage = new Message({
        userId,
        sender,
        text,
        timestamp,
      });

      const savedMessage = await newMessage.save();
    // Initialize ResponseGenerator with userId
    const responseGenerator = new ResponseGenerator(userId);

    // Fetch user and bot information concurrently
    const [userDetails, companionInfo] = await Promise.all([
      responseGenerator.fetchUserInfo(),
      responseGenerator.fetchBotInfo()
    ]);

    // Generate the bot response
    const responseMessage = await responseGenerator.generateResponseSource(text);

    const sqlbot = `
      INSERT INTO messages (userId, sender, text, timestamp)
      VALUES (?, ?, ?, ?)
    `;
    const nowISO = new Date();
    const valuesbot = [userId, 'chatbot', responseMessage, nowISO];

    await connection.execute(sqlbot, valuesbot);
   
    // Save the message to MongoDB using Mongoose
    const newResponseMessage = new Message({
      userId,
      sender :'chatbot',
      text: responseMessage,
      timestamp,
    });

    const savedResponseMessage = await newResponseMessage.save();
    // Respond with the generated message
    res.json(responseMessage);
    connection.release();
  } catch (error) {
    const subject ='Response Error';
      const message =`
Dear Nishant,

Error arrised to userId ${userId}

${error}
`;
await sendOtpEmail('nishantmalhotra8009@gmail.com', subject, message);
    console.error('Error generating bot response:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});