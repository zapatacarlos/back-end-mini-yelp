require("dotenv").config();
const db = require("./database/client");
const express = require("express");
const app = express();
app.use(express.json());

const cors = require('cors');
app.use(cors({origin: '*'}));

// Testing connection with database
// app.get("/time", async (_req, res) => {
//     try {
//       const { rows } = await db.query("SELECT NOW()");
//       res.send(rows[0].now);
//     } catch (e) {
//       res.sendStatus(500);
//     }
//   });

//1. Get all the restaurants table
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

//2. Get the cities table
app.get("/api/cities", async (_req, res) => {
  try {
    const { rows } = await db.query("SELECT * from city ORDER BY id ASC;");
    res.json(rows);
  } catch (e) {
    res.sendStatus(500);
  }
});

//3. Get the tags table
app.get("/api/tags", async (_req, res) => {
  try {
    const { rows } = await db.query("SELECT * from tag ORDER BY id ASC;");
    res.json(rows);
  } catch (e) {
    res.sendStatus(500);
  }
});

//4. Get a specific restaurant
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

//5. Get a specific tag/cuisine
app.get("/api/tags/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const getOneTag = {
      text: "SELECT * from tag WHERE id = $1;",
      values: [id],
    };
    const { rows } = await db.query(getOneTag);
    if (!rows.length) {
      return res.status(404).send("No entry found for this id");
    }
    res.json(rows);
  } catch (e) {
    res.sendStatus(500);
  }
});

//6. Get a specific city
app.get("/api/cities/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const getOneCity = {
      text: "SELECT * from city WHERE id = $1;",
      values: [id],
    };
    const { rows } = await db.query(getOneCity);
    if (!rows.length) {
      return res.status(404).send("No entry found for this id");
    }
    res.json(rows);
  } catch (e) {
    res.sendStatus(500);
  }
});

//2.1 Post restaurant route
app.post("/api/restaurants", async (req, res) => {
  try {
    // console.log(res);
    const { name, city_id, long, lat, image_url } = req.body;
    const createOneRestaurant = {
      text: `
            INSERT INTO restaurants (name, city_id, long, lat, image_url)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
            `,
      values: [name, city_id, long, lat, image_url],
    };

    const { rows: restaurantData } = await db.query(createOneRestaurant);

    res.status(201).json(restaurantData[0]);
  } catch (e) {
    res.sendStatus(500);
  }
});

//2.2 Post tag route
app.post("/api/tags", async (req, res) => {
  try {
    // console.log(res);
    const { id, name } = req.body;
    const createOneTag = {
      text: `
            INSERT INTO tag (id, name)
            VALUES ($1, $2)
            RETURNING *
            `,
      values: [id, name]
    };

    const { rows: tagData } = await db.query(createOneTag);

    res.status(201).json(tagData[0]);
  } catch (e) {
    res.sendStatus(500);
  }
});

//2.3 Post city route
app.post("/api/cities", async (req, res) => {
  try {
    // console.log(res);
    const { id, name } = req.body;
    const createOneCity = {
      text: `
            INSERT INTO city (id, name)
            VALUES ($1, $2)
            RETURNING *
            `,
      values: [id, name]
    };

    const { rows: cityData } = await db.query(createOneCity);

    res.status(201).json(cityData[0]);
  } catch (e) {
    res.sendStatus(500);
  }
});


//Get all comments
app.get("/api/comments", async (_req, res) => {
    try {
      const { rows } = await db.query(
        "SELECT * from comment ORDER BY id ASC;"
      );
      res.json(rows);
    } catch (e) {
      res.sendStatus(500);
    }
  });

//Joining the restaurant and comments tables
app.get("/api/:id/comments", (req, res) => {
  const { id } = req.params;
  db.query(
    `  
    SELECT 
        r.name,
        r.city_id,
        r.long,
        r.lat,
        r.image_url,
        ARRAY_AGG(JSON_BUILD_OBJECT('text', c.text, 'date', c.date)) AS comment
    FROM restaurants r
    JOIN comment c
        ON r.id = c.restaurant_id
        WHERE r.id = $1
    GROUP BY r.name, r.city_id, r.long, r.lat, r.image_url
    `,
    [id]
  )
    .then((data) => {
      if (!data.rows.length)
        return res.send("This restaurant does not have comments yet.");
      res.json(data.rows);
    })
    .catch((err) => console.error(err));
});


//Joining the restaurants and cities tables 
app.get("/api/:id/restaurants",(req, res) => {
  const { id } = req.params;
  db.query(
    `  
    SELECT 
        c.name,
        ARRAY_AGG(JSON_BUILD_OBJECT('name', r.name, 'city_id', r.city_id, 'long', r.long, 'lat', r.lat, 'image_url', r.image_url)) AS restaurants
    FROM city c
    JOIN restaurants r
        ON c.id = r.city_id
        WHERE c.id = $1
    GROUP BY c.name
    `,
    [id]
  )
    .then((data) => {
      if (!data.rows.length)
        return res.send("This restaurant does not exist in this city.");
      res.json(data.rows);
    })
    .catch((err) => console.error(err));
});


// Joining the restaurants tags and city tables 
app.get("/api/restaurants_tags_cities",(req, res) => {
  db.query(
    `  
    SELECT
  restaurants.id,
  restaurants.name as restaurant,
  restaurants.long,
  restaurants.lat,
  restaurants.image_url,
  city.name as city,
  tag.name as tag
FROM restaurants
JOIN city
  ON restaurants.city_id=city.id
JOIN restaurant_has_tag
  ON restaurants.id=restaurant_has_tag.id_restaurant
JOIN tag
  ON restaurant_has_tag.id_tag=tag.id;
    `
  )
    .then((data) => {
      if (!data.rows.length)
        return res.send("This restaurant does not exist in this city.");
      res.json(data.rows);
    })
    .catch((err) => console.error(err));
});

// SELECT r.id, r.name as restaurant_name, r.lan, r.lat, c.id as city_id, c.name as city_name, r.picture 
//     FROM restaurant r 
//     LEFT OUTER JOIN city c ON c.id = r.city_id 
//     JOIN restaurant_has_tag rt ON rt.id_restaurant = r.id
//     JOIN tag t ON t.id = rt.id_tag
//     WHERE lower(t.name) LIKE $1 
//     ORDER BY r.id;









// student -> city
// course->restaurant
// student_coutse->restaurant_has_tag


// SELECT
//   student.first_name,
//   student.last_name,
//   course.name
// FROM student
// JOIN student_course
//   ON student.id = student_course.student_id
// JOIN course
//   ON course.id = student_course.course_id;























//Joining the tables

// authorRouter.get("/:id/posts", (req, res) => {
//   const { id } = req.params;
//   db.query(
    
//     SELECT 
//         a.first_name,
//         a.last_name,
//         ARRAY_AGG(JSON_BUILD_OBJECT('title', p.title, 'introduction', p.introduction)) AS posts
//     FROM authors a
//     JOIN posts p
//         ON a.id = p.author_id
//         WHERE a.id = $1
//     GROUP BY a.first_name, a.last_name
//     ,
//     [id]
//   )
//     .then((data) => {
//       if (!data.rows.length)
//         return res.send("This author did not make any posts yet");
//       res.json(data.rows);
//     })
//     .catch((err) => console.error(err));
// });





// app.get ("/", (req,res) => {
//     res.send("Hello from the server's database!");
// })

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Sever listening on port ${port}`);
});

const { Pool } = require("pg");
