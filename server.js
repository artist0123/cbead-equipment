require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const AWS = require("aws-sdk");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN,
  region: "us-east-1",
});

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const tableName = "equipments";

// Define your API routes here
// ... (previous code)

// List all equipment
app.get("/equipment", (req, res) => {
  const params = {
    TableName: tableName,
  };

  dynamoDb.scan(params, (error, data) => {
    if (error) {
      res.status(500).json({ error: "Error fetching equipment" + error });
    } else {
      res.json(data.Items);
    }
  });
});

// Get a single equipment item by ID
app.get("/equipment/:id", (req, res) => {
  const params = {
    TableName: tableName,
    Key: {
      id: req.params.id,
    },
  };

  dynamoDb.get(params, (error, data) => {
    if (error) {
      res.status(500).json({ error: "Error fetching equipment" });
    } else {
      res.json(data.Item);
    }
  });
});

// Add a new equipment item
app.post("/equipment", (req, res) => {
  const { id, name, available, price } = req.body;

  const params = {
    TableName: tableName,
    Item: {
      id,
      name,
      available,
      price,
    },
  };

  dynamoDb.put(params, (error) => {
    if (error) {
      res.status(500).json({ error: "Error adding equipment" });
    } else {
      res.json(params.Item);
    }
  });
});

// Update an equipment item
app.put("/equipment/:id", (req, res) => {
  const { name, price, available } = req.body;

  const params = {
    TableName: tableName,
    Key: {
      id: req.params.id,
    },
    UpdateExpression:
      "SET name = :name, price = :price, available = :available",
    ExpressionAttributeValues: {
      ":name": name,
      ":price": price,
      ":available": available,
    },
    ReturnValues: "ALL_NEW",
  };

  dynamoDb.update(params, (error, data) => {
    if (error) {
      res.status(500).json({ error: "Error updating equipment" });
    } else {
      res.json(data.Attributes);
    }
  });
});

// Delete an equipment item
app.delete("/equipment/:id", (req, res) => {
  const params = {
    TableName: tableName,
    Key: {
      id: req.params.id,
    },
  };

  dynamoDb.delete(params, (error) => {
    if (error) {
      res.status(500).json({ error: "Error deleting equipment" });
    } else {
      res.json({ success: true });
    }
  });
});

// ... (previous code)

app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
});
