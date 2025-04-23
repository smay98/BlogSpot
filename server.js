require('dotenv').config(); // Load ENV vars form .env file

const express = require('express');
const path = require('path');
const AWS = require('aws-sdk');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure AWS DynamoDB
AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const getParams = {
    TableName: process.env.USERS_TABLE, 
    Key: {
      username: username 
    }
  };

  try {
    const data = await dynamoDB.get(getParams).promise();

    if (data.Item) {
      // If user exists ==> check password
      if (data.Item.password === password) {
        // Fetch all messages
        const scanParams = {
          TableName: process.env.MESSAGES_TABLE
        };
        const messagesData = await dynamoDB.scan(scanParams).promise();
        res.status(200).send({ success: true, messages: messagesData.Items });
      } else {
        res.status(401).send({ success: false, message: 'Invalid credentials' });
      }
    } else {
      // If User doesn't exist ==> create a new user
      const putParams = {
        TableName: process.env.USERS_TABLE,
        Item: {
          username: username,
          password: password
        }
      };

      await dynamoDB.put(putParams).promise();
      res.status(201).send({ success: true, message: 'User created', messages: [] });
    }
  } catch (error) {
    console.error('Error handling login:', error);
    res.status(500).send({ success: false, message: 'Server error' });
  }
});

// Save message
app.post('/message', async (req, res) => {
  const { username, message } = req.body;
  const timeStamp = new Date().toISOString(); // Use ISO string for unique timestamp

  const putParams = {
    TableName: process.env.MESSAGES_TABLE,
    Item: {
      time: timeStamp,
      username: username,
      message: message
    }
  };

  try {
    // Save the new message
    await dynamoDB.put(putParams).promise();

    // Fetch all messages
    const scanParams = {
      TableName: process.env.MESSAGES_TABLE
    };
    const messagesData = await dynamoDB.scan(scanParams).promise();

    // Return all messages
    res.status(201).send({ success: true, messages: messagesData.Items });
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).send({ success: false, message: 'Server error' });
  }
});

// Fetch all messages
app.get('/messages', async (req, res) => {
  const { username } = req.query;

  const params = {
    TableName: process.env.TABLENAME,
    Key: {
      username: username // Partition key
    }
  };

  try {
    const data = await dynamoDB.get(params).promise();
    if (data.Item && data.Item.messages) {
      res.status(200).send({ success: true, messages: data.Item.messages });
    } else {
      res.status(200).send({ success: true, messages: [] }); 
    }
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).send({ success: false, message: 'Server error' });
  }
});

// Fetch all chats 
app.get('/all-chats', async (req, res) => {
  const params = {
    TableName: process.env.TABLENAME 
  };

  try {
    const data = await dynamoDB.scan(params).promise(); // Scan the table 
    const chats = data.Items.map((item) => ({
      username: item.username,
      messages: item.messages || [] // Empty array if no messages
    }));

    res.status(200).send({ success: true, chats });
  } catch (error) {
    console.error('Error fetching all chats:', error);
    res.status(500).send({ success: false, message: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
