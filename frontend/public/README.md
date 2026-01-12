# Public templates & generated artifacts

This folder contains invoice templates and an official sample (`go.xlsx`).

Developer notes:
- Avoid committing generated XLSX files. If you generate invoices locally for testing, remove them before committing.
- Keep templates (e.g., `Template_bill_ambeservice.xlsx`, `Real-template.xlsx`, `Bills_real.xlsx`) and the official sample `go.xlsx` in this folder.
- If you need to generate official copies programmatically, prefer streaming the workbook via the backend endpoint or add a dedicated `scripts/*` utility.
