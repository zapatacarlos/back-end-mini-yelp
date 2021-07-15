require("dotenv").config();
const db = require("./database/client");
const express = require("express");
const app = express();
app.use(express.json());

// Testing connection with database
// app.get("/time", async (_req, res) => {
//     try {
//       const { rows } = await db.query("SELECT NOW()");
//       res.send(rows[0].now);
//     } catch (e) {
//       res.sendStatus(500);
//     }
//   });

// Get all the restaurants table
app.get("/api/restaurants", async (_req, res) => {
    try {
      const { rows } = await db.query(
        "SELECT * from restaurants ORDER BY id ASC;"
      );
      res.json(rows);
    } catch (e) {
      res.sendStatus(500);
    }
  });

// Get the cities table  
app.get("/api/cities", async (_req, res) => {
    try {
      const { rows } = await db.query(
        "SELECT * from city ORDER BY id ASC;"
      );
      res.json(rows);
    } catch (e) {
      res.sendStatus(500);
    }
});

// Get the tags table
app.get("/api/tags", async (_req, res) => {
    try {
      const { rows } = await db.query(
        "SELECT * from tag ORDER BY id ASC;"
      );
      res.json(rows);
    } catch (e) {
      res.sendStatus(500);
    }
});

// Get a specific restaurant
app.get("/api/restaurants/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const getOneRestaurant = {
        text: "SELECT * from restaurants WHERE id = $1;",
        values: [id],
      };
      const { rows } = await db.query(getOneRestaurant);
      if (!rows.length) {
        return res.status(404).send("No entry found for this id");
      }
      res.json(rows);
    } catch (e) {
      res.sendStatus(500);
    }
  });
  
// app.get ("/", (req,res) => {
//     res.send("Hello from the server's database!");
// })

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Sever listening on port ${port}`);
});

const {Pool} = require('pg')

