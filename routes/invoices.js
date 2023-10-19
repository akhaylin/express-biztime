"use strict";

const express = require("express");
const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const router = express.Router();

/**gets a list of the id, comp_code for all invoices
 * returns the list to the client as JSON: {invoices: [{code, name},...]}
 */
router.get("/", async function (req, res) {
  const results = await db.query(`
    SELECT id, comp_code
    FROM invoices`);

  const invoices = results.rows;

  return res.json({ invoices });
});


/**gets an invoice and issuing company using invoice code
 * Throws a 404 if no invoice found
 * returns the invoice to the client as JSON:
 * {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}
 */
router.get("/:id", async function (req, res) {
  const id = req.params.id;

  const iResult = await db.query(`
    SELECT id, comp_code, amt, paid, add_date, paid_date FROM invoices
    WHERE id=$1`, [id]
  );
  let invoice = iResult.rows[0];

  if (!invoice) throw new NotFoundError(`${id} not found.`);

  const cResult = await db.query(`
    SELECT code, name, description FROM companies
    WHERE code=$1`, [invoice.comp_code]
  );
  const company = cResult.rows[0];

  delete invoice.comp_code;
  invoice.company = company;

  return res.json({ invoice });
});

//TODO:Show what user input must be
/**add an invoice to the db,
 * returns the added invoice in JSON:
 *  {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */
router.post("/", async function (req, res) {
  if (!req.body) throw new BadRequestError();

  const { comp_code, amt } = req.body;
  console.log('amount', typeof amt)
  const result = await db.query(`
    INSERT INTO invoices (comp_code, amt)
    VALUES ($1, $2)
    RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [comp_code, amt]
  );

  const invoice = result.rows[0];

  return res.status(201).json({ invoice });
});

//TODO:mention user input
/**Route for editing an existing invoice in the db
 * throws a 404 if the invoice does not exist
 * returns the edited invoice in JSON:
 *  {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */
router.put("/:id", async function (req, res) {
  const id = req.params.id;

  if (!req.body) throw new BadRequestError();

  const { amt } = req.body;

  const result = await db.query(`
    UPDATE invoices
    SET amt=$1
    WHERE id=$2
    RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [amt, id]
  );

  const invoice = result.rows[0];

  if (!invoice) throw new NotFoundError(`${id} not found.`);

  return res.json({ invoice });
});


/**Route for deleting an existing invoice in the db
 * throws a 404 if invoice does not exist
 * returns a message indicating successful deletion
 */
router.delete("/:id", async function (req, res) {
  const id = req.params.id;

  const result = await db.query(`
    DELETE FROM invoices
    WHERE id=$1
    RETURNING id`, [id]
  );

  const deletedInvoice = result.rows[0];

  if (!deletedInvoice) throw new NotFoundError(`${id} not found.`);

  return res.json({ status: "deleted" });
});

module.exports = router;