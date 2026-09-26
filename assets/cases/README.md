# Folio case screenshots

Captured on 26 September 2026 from the actual Folio mail-detail and calendar-approval components in an isolated, read-only presentation build. The cases use entirely fictional messages and prepared assessments. These images demonstrate the UI; they are **not** new model-evaluation results or evidence that a live workflow has run end to end.

- `invoice`: annual electricity statement, EUR 48 credit announced, EUR 62 new monthly instalment. The message is not proof of receipt of payment.
- `invoice-voices`: the same case with the four prepared assessments expanded (one heuristic and three model examples).
- `appointment`: maintenance appointment on 30 September 2026, 10–11 a.m.
- `calendar-approval`: the corresponding prepared proposal, before approval. The screenshot performs no calendar action.
- `contract`: mobile plan offer, EUR 39 instead of EUR 29, with a twelve-month term. The decision remains open.

Each view has a desktop PNG and a `-mobile.png` capture of the responsive component. No real messages, accounts, calendar entries or documents were queried. The browser served only static fixture responses and intercepted API writes. The production Folio configuration was not changed.

Existing Ledger evidence remains under `assets/folio-v0.6.0-preview.1/ledger-evidence-detail.png` and uses the existing fictional release dataset.
