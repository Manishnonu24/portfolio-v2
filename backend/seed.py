"""
seed.py — Create the demo MySQL database and populate it with sample data.

Usage:
    python seed.py                  # Uses settings from .env
    python seed.py --drop-existing  # Drops and recreates all tables

Creates database: sql_chatbot_db (configurable via DB_NAME in .env)

Tables created:
  - departments  (10 rows)
  - employees    (30 rows)
  - sales        (60 rows)

Sample questions you can ask the chatbot after seeding:
  - "Show all employees"
  - "Who earns the highest salary?"
  - "List employees in Delhi"
  - "Which department has the most employees?"
  - "Show total sales by region"
  - "Who are the top 5 salespeople this year?"
  - "What is the average salary by department?"
"""
import os
import sys
from datetime import date, timedelta
import random

from dotenv import load_dotenv

load_dotenv()

# ── Config from .env ──────────────────────────────────────────────────────────
DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_PORT = int(os.environ.get("DB_PORT", 3306))
DB_USER = os.environ.get("DB_USER", "root")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "")
DB_NAME = os.environ.get("DB_NAME", "sql_chatbot_db")

DROP_EXISTING = "--drop-existing" in sys.argv


# ── Schema ────────────────────────────────────────────────────────────────────

CREATE_DEPARTMENTS = """
CREATE TABLE IF NOT EXISTS departments (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    location    VARCHAR(100) NOT NULL,
    budget      DECIMAL(15, 2) NOT NULL,
    head_count  INT DEFAULT 0,
    created_at  DATE NOT NULL
);
"""

CREATE_EMPLOYEES = """
CREATE TABLE IF NOT EXISTS employees (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(150) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    city          VARCHAR(100) NOT NULL,
    salary        DECIMAL(12, 2) NOT NULL,
    department_id INT NOT NULL,
    role          VARCHAR(100) NOT NULL,
    joined_date   DATE NOT NULL,
    is_active     TINYINT(1) DEFAULT 1,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);
"""

CREATE_SALES = """
CREATE TABLE IF NOT EXISTS sales (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    product     VARCHAR(150) NOT NULL,
    amount      DECIMAL(12, 2) NOT NULL,
    region      VARCHAR(100) NOT NULL,
    sale_date   DATE NOT NULL,
    status      VARCHAR(50) DEFAULT 'completed',
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);
"""


# ── Seed data ─────────────────────────────────────────────────────────────────

DEPARTMENTS = [
    ("Engineering",   "Bangalore",  5_000_000.00,  "2020-01-15"),
    ("Sales",         "Mumbai",     3_500_000.00,  "2020-01-15"),
    ("Marketing",     "Delhi",      2_000_000.00,  "2020-03-01"),
    ("HR",            "Pune",       1_200_000.00,  "2020-03-01"),
    ("Finance",       "Hyderabad",  2_500_000.00,  "2020-06-01"),
    ("Operations",    "Chennai",    1_800_000.00,  "2021-01-10"),
    ("Data Science",  "Bangalore",  4_000_000.00,  "2021-04-01"),
    ("Customer Care", "Delhi",        900_000.00,  "2021-07-01"),
    ("Legal",         "Mumbai",       700_000.00,  "2022-01-01"),
    ("Design",        "Pune",       1_100_000.00,  "2022-03-15"),
]

EMPLOYEES = [
    # (name, email, city, salary, dept_id, role, joined_date, is_active)
    ("Rahul Sharma",     "rahul.sharma@company.com",     "Delhi",     180000, 1, "Senior Engineer",      "2021-03-01", 1),
    ("Priya Patel",      "priya.patel@company.com",      "Mumbai",    220000, 7, "Data Scientist",       "2021-05-15", 1),
    ("Ankit Gupta",      "ankit.gupta@company.com",      "Delhi",     145000, 3, "Marketing Manager",   "2021-07-01", 1),
    ("Sneha Reddy",      "sneha.reddy@company.com",      "Hyderabad", 130000, 5, "Financial Analyst",   "2022-01-10", 1),
    ("Vikram Singh",     "vikram.singh@company.com",     "Bangalore", 250000, 1, "Tech Lead",            "2020-06-01", 1),
    ("Meera Nair",       "meera.nair@company.com",       "Chennai",   115000, 6, "Operations Manager",  "2022-03-15", 1),
    ("Rohan Das",        "rohan.das@company.com",        "Kolkata",   160000, 2, "Sales Manager",        "2021-09-01", 1),
    ("Kavya Iyer",       "kavya.iyer@company.com",       "Bangalore", 190000, 7, "ML Engineer",          "2022-06-01", 1),
    ("Arjun Mehta",      "arjun.mehta@company.com",      "Mumbai",    210000, 2, "Senior Sales Exec",   "2020-11-01", 1),
    ("Divya Krishnan",   "divya.krishnan@company.com",   "Delhi",     125000, 8, "Customer Success",    "2022-08-01", 1),
    ("Sanjay Kumar",     "sanjay.kumar@company.com",     "Pune",      140000, 4, "HR Manager",           "2021-02-15", 1),
    ("Pooja Joshi",      "pooja.joshi@company.com",      "Bangalore", 175000, 1, "Backend Engineer",    "2022-01-20", 1),
    ("Amit Verma",       "amit.verma@company.com",       "Delhi",     155000, 3, "Content Lead",         "2022-05-01", 1),
    ("Ritu Agarwal",     "ritu.agarwal@company.com",     "Mumbai",    280000, 5, "CFO",                  "2020-01-15", 1),
    ("Kunal Saxena",     "kunal.saxena@company.com",     "Pune",      165000, 10, "UX Designer",         "2022-09-01", 1),
    ("Neha Bhatt",       "neha.bhatt@company.com",       "Hyderabad", 135000, 5, "Accountant",           "2022-11-01", 1),
    ("Suresh Pillai",    "suresh.pillai@company.com",    "Chennai",   120000, 6, "Logistics Lead",       "2023-01-15", 1),
    ("Alka Singh",       "alka.singh@company.com",       "Delhi",     100000, 8, "Support Agent",        "2023-03-01", 1),
    ("Deepak Rao",       "deepak.rao@company.com",       "Bangalore", 300000, 7, "Head of Data",         "2020-04-01", 1),
    ("Tanvi Shah",       "tanvi.shah@company.com",       "Mumbai",    148000, 2, "Account Manager",     "2022-07-01", 1),
    ("Manish Dubey",     "manish.dubey@company.com",     "Delhi",     138000, 3, "SEO Specialist",       "2023-01-01", 1),
    ("Anjali Desai",     "anjali.desai@company.com",     "Pune",      172000, 10, "Senior Designer",    "2021-10-15", 1),
    ("Pankaj Yadav",     "pankaj.yadav@company.com",     "Kolkata",   115000, 6, "Warehouse Manager",   "2023-04-01", 1),
    ("Lavanya Menon",    "lavanya.menon@company.com",    "Bangalore", 195000, 1, "Frontend Engineer",   "2022-02-01", 1),
    ("Rajesh Tiwari",    "rajesh.tiwari@company.com",    "Mumbai",    125000, 9, "Legal Advisor",        "2022-12-01", 1),
    ("Shruti Malhotra",  "shruti.malhotra@company.com",  "Delhi",     160000, 7, "Business Analyst",    "2021-08-15", 1),
    ("Varun Kapoor",     "varun.kapoor@company.com",     "Hyderabad", 145000, 2, "Regional Sales Rep",  "2023-02-01", 1),
    ("Ishaan Bose",      "ishaan.bose@company.com",      "Kolkata",   108000, 8, "Tech Support",         "2023-05-01", 0),  # inactive
    ("Rekha Pillai",     "rekha.pillai@company.com",     "Chennai",   142000, 4, "HR Executive",         "2022-10-01", 1),
    ("Nikhil Agrawal",   "nikhil.agrawal@company.com",   "Bangalore", 235000, 1, "DevOps Engineer",     "2021-06-01", 1),
]

PRODUCTS = [
    "Enterprise License", "Premium Plan", "Professional Suite",
    "Analytics Module", "Support Package", "Cloud Storage",
    "API Access", "Mobile License", "Custom Integration",
    "Training Program",
]

REGIONS = ["North", "South", "East", "West", "Central"]
STATUSES = ["completed", "completed", "completed", "pending", "refunded"]


def build_sales_rows(employee_count: int, count: int = 60):
    rows = []
    base_date = date(2024, 1, 1)
    for _ in range(count):
        emp_id = random.randint(1, employee_count)
        product = random.choice(PRODUCTS)
        amount = round(random.uniform(10_000, 500_000), 2)
        region = random.choice(REGIONS)
        days_ago = random.randint(0, 540)
        sale_date = base_date + timedelta(days=days_ago)
        status = random.choice(STATUSES)
        rows.append((emp_id, product, amount, region, sale_date.isoformat(), status))
    return rows


# ── Runner ────────────────────────────────────────────────────────────────────

def main():
    try:
        import pymysql
    except ImportError:
        print("ERROR: pymysql is not installed. Run: pip install pymysql")
        sys.exit(1)

    print(f"\n[Seed] Connecting to MySQL at {DB_HOST}:{DB_PORT} as '{DB_USER}'...")

    conn = pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        charset="utf8mb4",
    )
    cursor = conn.cursor()

    # Create / select database
    print(f"[Seed] Creating database '{DB_NAME}' if not exists...")
    if DROP_EXISTING:
        cursor.execute(f"DROP DATABASE IF EXISTS `{DB_NAME}`")
        print(f"[Seed] Dropped existing database '{DB_NAME}'")
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
    cursor.execute(f"USE `{DB_NAME}`")

    # Drop tables (in FK order) if requested
    if DROP_EXISTING:
        for tbl in ("sales", "employees", "departments"):
            cursor.execute(f"DROP TABLE IF EXISTS `{tbl}`")

    # Create tables
    print("[Seed] Creating tables...")
    cursor.execute(CREATE_DEPARTMENTS)
    cursor.execute(CREATE_EMPLOYEES)
    cursor.execute(CREATE_SALES)
    conn.commit()

    # Seed departments
    cursor.execute("SELECT COUNT(*) FROM departments")
    if cursor.fetchone()[0] == 0:
        print(f"[Seed] Inserting {len(DEPARTMENTS)} departments...")
        cursor.executemany(
            "INSERT INTO departments (name, location, budget, created_at) VALUES (%s, %s, %s, %s)",
            DEPARTMENTS,
        )
        conn.commit()
    else:
        print("[Seed] Departments already seeded — skipping.")

    # Seed employees
    cursor.execute("SELECT COUNT(*) FROM employees")
    if cursor.fetchone()[0] == 0:
        print(f"[Seed] Inserting {len(EMPLOYEES)} employees...")
        cursor.executemany(
            """INSERT INTO employees
               (name, email, city, salary, department_id, role, joined_date, is_active)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
            EMPLOYEES,
        )
        conn.commit()
    else:
        print("[Seed] Employees already seeded — skipping.")

    # Update department head_count
    cursor.execute("""
        UPDATE departments d
        SET head_count = (
            SELECT COUNT(*) FROM employees e WHERE e.department_id = d.id
        )
    """)
    conn.commit()

    # Seed sales
    cursor.execute("SELECT COUNT(*) FROM sales")
    if cursor.fetchone()[0] == 0:
        cursor.execute("SELECT COUNT(*) FROM employees")
        emp_count = cursor.fetchone()[0]
        sales_rows = build_sales_rows(emp_count, count=80)
        print(f"[Seed] Inserting {len(sales_rows)} sales records...")
        cursor.executemany(
            """INSERT INTO sales
               (employee_id, product, amount, region, sale_date, status)
               VALUES (%s, %s, %s, %s, %s, %s)""",
            sales_rows,
        )
        conn.commit()
    else:
        print("[Seed] Sales already seeded — skipping.")

    # Summary
    cursor.execute("SELECT COUNT(*) FROM departments")
    d_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM employees")
    e_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM sales")
    s_count = cursor.fetchone()[0]

    cursor.close()
    conn.close()

    print("\n" + "=" * 50)
    print(f"  Database '{DB_NAME}' is ready!")
    print(f"  Departments : {d_count} rows")
    print(f"  Employees   : {e_count} rows")
    print(f"  Sales       : {s_count} rows")
    print("=" * 50)
    print("\nSample questions to try:")
    print("  - Show all employees")
    print("  - Who earns the highest salary?")
    print("  - List employees from Delhi")
    print("  - Which department has the most employees?")
    print("  - Show total sales by region")
    print("  - Who are the top 5 salespeople?")
    print("  - What is the average salary by department?")
    print()


if __name__ == "__main__":
    random.seed(42)  # Reproducible data
    main()
