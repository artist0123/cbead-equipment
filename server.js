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

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const tableName = "equipments";

app.get('/equipments', async (req, res) => {
  const params = {
      TableName: tableName,  // Replace with your actual DynamoDB table name
  };

  try {
      const data = await dynamoDB.scan(params).promise();
      res.json(data.Items);
  } catch (err) {
      res.status(500).json({ error: err.toString() });
  }
});

app.get('/equipment', async (req, res) => {
  const equipmentId = req.query.id;

  const params = {
      TableName: tableName,  // Replace with your actual DynamoDB table name
      Key: {
          id: equipmentId,
      },
  };

  try {
      const data = await dynamoDB.get(params).promise();
      res.json(data.Item);
  } catch (err) {
      res.status(500).json({ error: err.toString() });
  }
});

app.get('/equipments/ids', async (req, res) => {
  const ids = req.query.ids.split(',');

  const keys = ids.map(id => ({ id }));

  const params = {
      RequestItems: {
          'EquipmentTable': {  // Replace with your actual DynamoDB table name
              Keys: keys,
          },
      },
  };

  try {
      const data = await dynamoDB.batchGet(params).promise();
      res.json(data.Responses.EquipmentTable);
  } catch (err) {
      res.status(500).json({ error: err.toString() });
  }
});

app.post("/equipment", async (req, res) => {
  const item = req.body;
  item.id = item._id;
  delete item._id;

  const params = {
    TableName: tableName,
    Item: item,
  };

  try {
    await dynamoDB.put(params).promise();
    res.status(200).send(item.id);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post("/equipment/onReserveWorkspace", async (req, res) => {
  const model = req.body;
  let isDone = false;

  const ids = Array.from(new Set(model.equipmentsId));
  if (ids.length === 0) {
    isDone = true;
    res.status(200).send(isDone);
    return;
  }

  for (let id of ids) {
    const decrease = model.equipmentsId.filter((eid) => eid === id).length;

    const params = {
      TableName: tableName,
      Key: { id: id },
      UpdateExpression: "set quantity = quantity - :q",
      ExpressionAttributeValues: {
        ":q": decrease,
      },
      ReturnValues: "UPDATED_NEW",
    };

    try {
      await dynamoDB.update(params).promise();
      isDone = true;
    } catch (error) {
      res.status(500).send(error.message);
      return;
    }
  }

  res.status(200).send(isDone);
});

app.post("/equipment/onCancelReserve", async (req, res) => {
  const model = req.body;
  let isDone = false;

  const ids = Array.from(new Set(model.equipmentsId));
  if (ids.length === 0) {
    isDone = true;
    res.status(200).send(isDone);
    return;
  }

  for (let id of ids) {
    const increase = model.equipmentsId.filter((eid) => eid === id).length;

    const params = {
      TableName: tableName,
      Key: { id: id },
      UpdateExpression: "set quantity = quantity + :q",
      ExpressionAttributeValues: {
        ":q": increase,
      },
      ReturnValues: "UPDATED_NEW",
    };

    try {
      await dynamoDB.update(params).promise();
      isDone = true;
    } catch (error) {
      res.status(500).send(error.message);
      return;
    }
  }

  res.status(200).send(isDone);
});

app.put("/equipment", async (req, res) => {
  const item = req.body;
  item.id = item._id;
  delete item._id;

  const params = {
    TableName: tableName,
    Key: { id: item.id },
    UpdateExpression:
      "set name=:name, desc=:desc, price=:price, quantity=:quantity",
    ExpressionAttributeValues: {
      ":name": item.name,
      ":desc": item.desc,
      ":price": item.price,
      ":quantity": item.quantity,
    },
    ReturnValues: "UPDATED_NEW",
  };

  try {
    await dynamoDB.update(params).promise();
    res.status(200).send(item.id);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.delete("/equipment/:id", async (req, res) => {
  const params = {
    TableName: tableName,
    Key: {
      id: req.params.id,
    },
  };

  try {
    await dynamoDB.delete(params).promise();
    res.status(200).send(req.params.id);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.listen(port, () => console.log(`Server is running on port ${port}`));
