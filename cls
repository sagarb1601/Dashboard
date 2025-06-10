[1mdiff --git a/backend/src/db/check-staff-tables.ts b/backend/src/db/check-staff-tables.ts[m
[1mindex 66a886a..42fb53f 100644[m
[1m--- a/backend/src/db/check-staff-tables.ts[m
[1m+++ b/backend/src/db/check-staff-tables.ts[m
[36m@@ -1,7 +1,4 @@[m
 import { Pool } from 'pg';[m
[31m-import dotenv from 'dotenv';[m
[31m-[m
[31m-dotenv.config();[m
 [m
 const pool = new Pool({[m
   host: process.env.PGHOST || 'localhost',[m
[1mdiff --git a/backend/src/db/check-tables.ts b/backend/src/db/check-tables.ts[m
[1mindex af74bbe..73d2208 100644[m
[1m--- a/backend/src/db/check-tables.ts[m
[1m+++ b/backend/src/db/check-tables.ts[m
[36m@@ -1,7 +1,4 @@[m
 import { Pool } from 'pg';[m
[31m-import dotenv from 'dotenv';[m
[31m-[m
[31m-dotenv.config();[m
 [m
 const pool = new Pool({[m
   host: process.env.PGHOST || 'localhost',[m
[1mdiff --git a/backend/src/db/db.ts b/backend/src/db/db.ts[m
[1mindex 8224bf3..18df66f 100644[m
[1m--- a/backend/src/db/db.ts[m
[1m+++ b/backend/src/db/db.ts[m
[36m@@ -1,7 +1,4 @@[m
 import { Pool } from 'pg';[m
[31m-import dotenv from 'dotenv';[m
[31m-[m
[31m-dotenv.config();[m
 [m
 // Create a new Pool instance with connection details[m
 export const pool = new Pool({[m
[1mdiff --git a/backend/src/db/index.ts b/backend/src/db/index.ts[m
[1mindex 05efa14..b347e6c 100644[m
[1m--- a/backend/src/db/index.ts[m
[1m+++ b/backend/src/db/index.ts[m
[36m@@ -1,7 +1,4 @@[m
 import { Pool } from 'pg';[m
[31m-import dotenv from 'dotenv';[m
[31m-[m
[31m-dotenv.config();[m
 [m
 // Create a single pool instance that will be shared across the application[m
 const pool = new Pool({[m
[1mdiff --git a/backend/src/db/migrate.ts b/backend/src/db/migrate.ts[m
[1mindex d8f2499..eed7cec 100644[m
[1m--- a/backend/src/db/migrate.ts[m
[1m+++ b/backend/src/db/migrate.ts[m
[36m@@ -2,9 +2,6 @@[m [mimport { Pool } from 'pg';[m
 import * as fs from 'fs';[m
 import * as path from 'path';[m
 import 'dotenv/config';[m
[31m-import dotenv from 'dotenv';[m
[31m-[m
[31m-dotenv.config();[m
 [m
 const pool = new Pool();[m
 [m
[1mdiff --git a/backend/src/db/reset-db.ts b/backend/src/db/reset-db.ts[m
[1mindex 3ecbfe9..94f53a9 100644[m
[1m--- a/backend/src/db/reset-db.ts[m
[1m+++ b/backend/src/db/reset-db.ts[m
[36m@@ -1,9 +1,6 @@[m
 import { Pool } from 'pg';[m
 import fs from 'fs';[m
 import path from 'path';[m
[31m-import dotenv from 'dotenv';[m
[31m-[m
[31m-dotenv.config();[m
 [m
 // First connect to postgres database to create our database if it doesn't exist[m
 const initPool = new Pool({[m
[1mdiff --git a/backend/src/db/setup.ts b/backend/src/db/setup.ts[m
[1mindex 757f8fa..805a614 100644[m
[1m--- a/backend/src/db/setup.ts[m
[1m+++ b/backend/src/db/setup.ts[m
[36m@@ -2,9 +2,6 @@[m [mimport { Pool } from 'pg';[m
 import * as fs from 'fs';[m
 import * as path from 'path';[m
 import { runMigrations } from './migrations';[m
[31m-import dotenv from 'dotenv';[m
[31m-[m
[31m-dotenv.config();[m
 [m
 // Create a single pool instance that will be shared across the application[m
 export const pool = new Pool({[m
[1mdiff --git a/backend/src/migrations/022_remove_date_order_validation.sql b/backend/src/migrations/022_remove_date_order_validation.sql[m
[1mnew file mode 100644[m
[1mindex 0000000..c5ded2e[m
[1m--- /dev/null[m
[1m+++ b/backend/src/migrations/022_remove_date_order_validation.sql[m
[36m@@ -0,0 +1,67 @@[m
[32m+[m[32m-- Drop existing triggers and functions[m
[32m+[m[32mDROP TRIGGER IF EXISTS validate_promotion_changes ON hr_employee_promotions;[m
[32m+[m[32mDROP FUNCTION IF EXISTS validate_promotion();[m
[32m+[m
[32m+[m[32m-- Create improved validation function without date order checks[m
[32m+[m[32mCREATE OR REPLACE FUNCTION validate_promotion()[m
[32m+[m[32mRETURNS TRIGGER AS $$[m
[32m+[m[32mDECLARE[m
[32m+[m[32m    emp_initial_designation INTEGER;[m
[32m+[m[32m    emp_join_date DATE;[m
[32m+[m[32m    prev_designation INTEGER;[m
[32m+[m[32mBEGIN[m
[3