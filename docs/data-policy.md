# Demo Data Policy

This repository is a public portfolio project.

All customers, invoices, payments, PIX/Boleto-like records, transaction IDs, emails, names, dates, amounts, and documents used in this project are synthetic.

This project must not contain:
- real employer or ex-employer data
- real customer data
- real payment payloads
- real credentials
- real logs
- real screenshots
- production database dumps
- anonymized data derived from a real private source

The Azure PostgreSQL database used for development/demo must contain only synthetic data.

Private credentials must remain outside Git and must be stored only in local environment variables or private secret managers.
