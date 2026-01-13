-- This script defines the complete database structure for the AI Business Dashboard.
-- It creates all necessary tables with columns that perfectly match your imported CSV data.

-- Creates the 'projects' table to store project information.
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT,
  client TEXT,
  start_date DATE,
  deadline DATE,
  completion_pct INT,
  status TEXT,
  budget INT,
  owner TEXT
);

-- Creates the 'leads' table to store sales and lead information.
CREATE TABLE leads (
  id TEXT PRIMARY KEY,
  name TEXT,
  source TEXT,
  stage TEXT,
  value INT,
  status TEXT,
  owner TEXT
);

-- Creates the 'employees' table to store employee information and performance metrics.
CREATE TABLE employees (
  id TEXT PRIMARY KEY,
  name TEXT,
  role TEXT,
  tasks_completed INT,
  efficiency FLOAT,
  availability TEXT,
  email TEXT,
  manager TEXT
);

-- Creates the 'reports' table to act as a log for all generated reports.
CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  name TEXT,
  type TEXT,
  generated_on DATE,
  generated_by TEXT,
  status TEXT,
  download_url TEXT
);

