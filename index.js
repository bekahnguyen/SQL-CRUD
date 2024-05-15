const express = require("express");
const pg = require("pg");
const app = express();

const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/the_acme_icecream_db"
);
//parse incoming requests from json
app.use(express.json());
// log requests as they come in
app.use(require("morgan")("dev"));

//ROUTES:

//read
app.get("/api/flavor", async (req, res, next) => {
  try {
    const SQL = `SELECT * 
    FROM flavor 
    ORDER BY name ASC`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});
app.get("/api/flavor/:id", async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM flavor WHERE
    id=$1`;
    const response = await client.query(SQL, [req.params.id]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

//create
app.post("/api/flavor", async (req, res, next) => {
  try {
    const SQL = `
      INSERT INTO flavor(name, is_favorite)
      VALUES($1, $2)
      RETURNING *
      `;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.is_favorite,
    ]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

//delete
app.delete("/api/flavor/:id", async (req, res, next) => {
  try {
    const SQL = `
  DELETE from flavor
  WHERE id= $1`;
    const response = await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (error) {
    next.log(error);
  }
});
//update
app.put("/api/flavor/:id", async (req, res, next) => {
  try {
    const SQL = `
    UPDATE flavor
    SET name=$1, is_favorite=$2
    where id=$3 RETURNING *
    `;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.is_favorite,
      req.params.id,
    ]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

const init = async () => {
  await client.connect();
  console.log("connected to the database");
  let SQL = `
  DROP TABLE IF EXISTS flavor;
  CREATE TABLE flavor(
    id SERIAL PRIMARY KEY,
    name VARCHAR(50),
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
  );
`;
  await client.query(SQL);
  console.log("tables created");
  SQL = `
   INSERT INTO flavor(name, is_favorite) VALUES('Chocolate Chip Cookie Dough', True);
  INSERT INTO flavor(name, is_favorite) VALUES('Fudge Brownie', true);
  INSERT into flavor(name) VALUES('Hot Chocolate');
  INSERT into flavor(name) VALUES('Butter Pecan')
  `;
  await client.query(SQL);
  console.log("data seeded");
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`listening on port ${port}`));
};

init();
