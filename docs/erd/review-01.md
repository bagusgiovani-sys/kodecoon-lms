## Database relationships & ownership

REVIEW DRAFT / 28 OCT 2026 / No live database changes

### Purpose

For the KodeHub and analytics builders to agree which records are shared, which application changes them, and how to avoid another Tracker-versus-OClass split. An ERD shows relationships; the ownership matrix assigns responsibility.

### Two models, clearly separated

CURRENT pages describe the local schema.sql at commit 65c0a85 (38 application tables). PROPOSED pages reflect the academy-wide workflow confirmed on 28 October. They are discussion designs, not implemented tables or approved migration SQL. The colleague's migrated schema has not been supplied.

### Main design correction

Students in the same class/time slot may study completely different modules and lessons. A student-module record must own learning progress independently of a class timetable. Moving a student must preserve their module, documentation, assignments and reports.

### How to read this document

Blue boxes show existing concepts; green boxes show proposed concepts. PK identifies a row; FK links it to another row. 1:N means one parent may have zero or many children. Diagrams show selected keys and relationships; the inventory lists all 38 existing tables. Editable schema-reference files contain their CREATE and later ALTER statements.

### Evidence and scope

Sources: schema.sql and forward migrations, PRODUCTION-PARITY.md, route guards, confirmed product discussion, and the three-page teacher checklist supplied by Gio. No student records, credentials or payment data are included. Local schema existence does not establish deployment or live verification.
