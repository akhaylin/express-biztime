const express = require("express");
const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const router = express.Router();

/**Route queries db and gets a list of the code and name of all companies
 * returns the list to the client as JSON: {copanies: [{code, name},...]}
 */
router.get("/", async function (req, res) {
  const results = await db.query(
    `SELECT code, name
      FROM companies`);

  console.log(results);
  const companies = results.rows;
  return res.json({ companies });
});

router.get("/:code", async function (req, res) {
  const code = req.params.code;
  const result = await db.query(
    `SELECT * FROM companies
    WHERE code = $1`, [code]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError(`${code} not found.`);
  }

  const company = result.rows[0];

  return res.json({ company });
});

router.post("/", async function (res, req) {
  debugger;
  console.log("req.body:", req.body);
  if (!req.body) throw new BadRequestError();

  const { code, name, description } = req.body;
  const result = await db.query(
    `INSERT INTO companies (code, name, description)
           VALUES ($1, $2, $3)
           RETURNING code, name, description`,
    [code, name, description],
  );

  const company = result.rows[0];

  return res.status(201).json({ company });

});



module.exports = router;