const express = require("express");
const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const router = express.Router();

/**gets a list of all companies
 * returns the list to the client as JSON: {companies: [{code, name},...]}
 */
router.get("/", async function (req, res) {
  const results = await db.query(`
    SELECT code, name
    FROM companies`);

  const companies = results.rows;
  return res.json({ companies });
});


/**gets a company and associated invoices using company code
 * returns the company to the client as JSON:
 * {company: {code, name, description, invoices: [id,...]}}
 */
router.get("/:code", async function (req, res) {
  const code = req.params.code;
  
  const cResult = await db.query(`
    SELECT code, name, description FROM companies
    WHERE code = $1`, [code]
  );
  const company = cResult.rows[0];

  if (!company) throw new NotFoundError(`${code} not found.`);

  const iResults = await db.query(`
    SELECT id
    FROM invoices
    WHERE comp_code=$1`, [code]
  );

  company.invoices = iResults.rows.map(i => i.id);

  return res.json({ company });
});


/**Route to add a company to the db,
 * returns the added company in JSON {company: {code, name, description}}
 */
router.post("/", async function (req, res) {
  if (!req.body) throw new BadRequestError();

  const { code, name, description } = req.body;

  const result = await db.query(`
    INSERT INTO companies (code, name, description)
    VALUES ($1, $2, $3)
    RETURNING code, name, description`,
    [code, name, description]
  );

  const company = result.rows[0];

  return res.status(201).json({ company });
});


/**Route for editing an existing company in the db
 * throws a 404 if company does not exist
 * returns the edited company in JSON {company: {code, name, description}}
 */
router.put("/:code", async function (req, res) {
  const code = req.params.code;

  if (!req.body) throw new BadRequestError();

  const { name, description } = req.body;

  const result = await db.query(`
    UPDATE companies
    SET name=$1,
        description=$2
    WHERE code = $3
    RETURNING code, name, description`,
    [name, description, code]
  );

  const company = result.rows[0];

  if (!company) throw new NotFoundError(`${code} not found.`);

  return res.json({ company });
});


/**Route for deleting an existing company in the db
 * throws a 404 if company does not exist
 * returns a message indicating successful deletion
 */
router.delete("/:code", async function (req, res) {
  const code = req.params.code;

  const result = await db.query(`
    DELETE FROM companies
    WHERE code = $1
    RETURNING code`, [code]
  );

  const deletedCompany = result.rows[0];

  if (!deletedCompany) throw new NotFoundError(`${code} not found.`);

  return res.json({ status: "deleted" });
});


module.exports = router;
