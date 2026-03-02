# Portfolio details — please fill in

---

## Basic

- name: "Shivam Dubey"
- title: "Data Engineering Student"
- short_bio: "Data Engineering student focused on data pipelines, ETL, and cloud-native systems. Skilled in Python, SQL, and modern data engineering tools."
- location: "Indore, India"
- email: "shivamdubey2310711@gmail.com"
- linkedin: "https://www.linkedin.com/in/shivamdubey-20"
- github: "https://github.com/shivamdubey2310"
- website: "https://yourwebsite.example (optional)"
- resume: "ShivamDubey.pdf"
- profile_image: "images/profile.jpg"

## About (longer)

Write a 3–6 sentence paragraph describing your background, interests, and what kinds of data engineering work you enjoy.

about: |
Hi, I’m Shivam Dubey, an M.Tech student in Artificial Intelligence & Data Science (Dual Degree) at SDSF, DAVV, Indore.

I’m passionate about Data Engineering, focused on building scalable data pipelines, optimizing workflows, and creating clean data foundations that power AI/ML systems.

Former Cloud Lead at GDG-SDSF, where I worked on cloud platforms, data infrastructure, and collaborative technical initiatives.

I work with SQL, Python, Apache Spark, Airflow, PostgreSQL, Docker, and Azure, applying them in hands-on projects centered on performance and scalability.

Always learning and open to opportunities in data engineering, cloud, and real-time data systems.
Let’s connect and build data-driven systems that scale.

## Projects

Provide 1–6 projects. For each project include a short description, tech stack, repo or live link, and 1–2 measurable outcomes if available.

- projects:
  Project Name: Automated Weather Monitoring in Microsoft Fabric

Tools/Tech Used: Microsoft Fabric, Fabric Eventstreams, Fabric Eventhouse, Fabric Real-time Dashboard, Fabric Activator

What problem it solves (1 line): Eliminates data-to-insight latency by replacing batch processing with a unified streaming architecture for immediate environmental monitoring and automated response.

What YOU built/did (2–3 lines): Engineered a seamless real-time pipeline using Microsoft Fabric, orchestrating live data ingestion via Eventstream and low-latency storage in Eventhouse. Developed automated event-driven logic using Fabric Activators to trigger instant alerts and built a Real-Time Dashboard for continuous trend visualization. Optimized data transformation and routing within the unified ecosystem to ensure high-speed processing of streaming weather telemetry.


Project Name: End-to-End Medallion ETL Pipeline via Microsoft Fabric

Tools/Tech Used: Microsoft Fabric, Fabric Lakehouse, Spark Notebooks, PowerBI, pySpark, Delta Lake, Python

What problem it solves (1 line): Automates the transition from raw, API data to structured, business-ready insights by implementing a scalable Medallion Architecture for reliable AQI forecasting.

What YOU built/did (2–3 lines): Developed a multi-stage ETL pipeline in Microsoft Fabric, orchestrating daily AirNow API ingestion into a Lakehouse via Fabric Data Pipelines. Engineered data transformation layers using PySpark, converting raw JSON into optimized Delta tables across Bronze, Silver, and Gold zones. Integrated the curated Gold layer with Power BI to deliver interactive dashboards, enabling automated daily tracking of air quality metrics.


Project Name: Automated E-commerce Data Warehouse & Star Schema Design

Tools/Tech Used: Dimensional Modeling, Python, Pandas, MySQL

What problem it solves (1 line): Converts fragmented transactional databases into an optimized, analytics-ready warehouse, enabling high-performance business intelligence and cross-functional sales reporting.

What YOU built/did (2–3 lines): Designed a robust Star Schema with dimension and fact tables in MySQL, optimizing complex join performance for large-scale e-commerce datasets. Built a custom ETL framework using Python (Pandas & SQLAlchemy) to automate data extraction, cleaning, and loading from synthetic sources generated via the Faker library. Implemented data integrity constraints and optimized indexing strategies to ensure reliable, high-speed querying for business-critical sales and customer metrics.


Project Name: Enterprise University Management System & Relational Database Design

Tools/Tech Used: Database Design, SQL, Postgres, DBMS

What problem it solves (1 line): Centralizes academic operations into a robust, ACID-compliant PostgreSQL system that prevents scheduling conflicts, manages student records, and enforces complex institutional business rules.

What YOU built/did (2–3 lines): Designed a normalized relational schema with 11+ core entities and 25+ foreign key relationships, ensuring data integrity and eliminating redundancy across the student lifecycle. Developed advanced database logic using PostgreSQL Triggers and Functions to automate conflict detection for classroom scheduling and enrollment capacity. Implemented complex analytical views and performance-optimized queries to generate real-time administrative reports on student performance (GPA) and departmental statistics.


Project Name: Automated PokeAPI ETL Pipeline with Apache Airflow & MySQL

Tools/Tech Used: Python, Pandas, Apache Airflow, MySQL

What problem it solves (1 line): Automates the conversion of complex, nested JSON data from public APIs into a structured relational database, ensuring data consistency and pipeline reliability through scheduled orchestration.

What YOU built/did (2–3 lines): Architected a multi-stage ETL pipeline using Apache Airflow, automating the daily extraction of semi-structured data from the PokeAPI using Dockerized environments. Developed advanced transformation logic in Python (Pandas) to flatten nested JSON structures, handle missing values, and map complex many-to-many relationships. Engineered a robust MySQL schema and automated the loading process via SQLAlchemy, maintaining high data integrity through foreign key constraints and custom logging.


Project Name: Orchestrated NoSQL ETL Pipeline for Studio Ghibli Analytics

Tools/Tech Used: Python, Pandas, Mongodb, Apache Airflow (Astro CLI)

What problem it solves (1 line): Automates the ingestion and normalization of diverse, semi-structured API endpoints into a scalable NoSQL environment, enabling flexible schema-on-read analysis for media metadata.

What YOU built/did (2–3 lines): Architected a dual-mode ETL system featuring both standalone Python scripts and Apache Airflow DAGs orchestrated via the Astro CLI. Developed a high-performance transformation layer using Pandas to normalize relationships between films, characters, and locations before loading into MongoDB. Implemented a robust caching and logging strategy that captures raw API responses for offline processing and monitors pipeline health through detailed execution logs.


Project Name: Real-Time Delta Lake Streaming Pipeline with Spark Structured Streaming

Tools/Tech Used: PySpark, Spark Structured Streaming, Delta Lake, Python

What problem it solves (1 line): Eliminates manual file processing by automating the ingestion, validation, and ACID-compliant storage of high-velocity CSV data using a scalable streaming architecture.

What YOU built/did (2–3 lines): Architected a real-time ingestion engine using Spark Structured Streaming to monitor directory arrival and process micro-batches of CSV data with low latency. Implemented a dynamic schema enforcement and cleaning layer, allowing for multi-schema support via JSON-based schema definitions and automated validation. Optimized storage reliability by integrating Delta Lake, leveraging checkpointing for fault tolerance and transaction logs for data consistency.


Project Name: Containerized Web-Scraping ETL Pipeline with Airflow & PostgreSQL

Tools/Tech Used: Python, Web Scraping (BeautifulSoup4), Postgresql, Apache Airflow (Astro CLI), Docker (Astro CLI)

What problem it solves (1 line): Automates the collection and structuring of fragmented job market data from non-API web sources into a centralized relational database for trend analysis and job tracking.

What YOU built/did (2–3 lines): Engineered an automated ETL pipeline using Apache Airflow and Docker (Astro CLI) to scrape and process multi-page job listings from Python.org daily. Developed advanced scraping logic with BeautifulSoup to handle pagination and unstructured HTML, transforming raw data into normalized PostgreSQL schemas. Implemented a robust data processing layer using Pandas and SQLAlchemy to clean, merge, and validate records while ensuring idempotency and duplicate prevention.


Project Name: Automated Linux-Native ETL Pipeline with Bash, Python, & PostgreSQL

Tools/Tech Used: Python, Pandas, Bash Scripts, Postgres, CronJobs(Orchestration)

What problem it solves (1 line): Provides a lightweight, cost-effective automation framework for API data ingestion by replacing heavy orchestration tools with native Linux shell scripting and scheduled cron jobs.

What YOU built/did (2–3 lines): Developed a modular ETL orchestrator using Bash (Shell Scripting) to manage end-to-end data flow, including API extraction via curl and multi-stage loading. Engineered a Python-based transformation engine using Pandas to normalize nested API responses into a 3rd Normal Form (3NF) relational schema in PostgreSQL. Automated the entire lifecycle by configuring Cron jobs for daily execution, incorporating robust error handling and comprehensive pipeline logging.



Project Name: Automated Tech-News ETL Pipeline with PySpark & MongoDB Atlas

Tools/Tech Used: Python, PySpark, MongoDB Atlas, CronJobs(Orchestration),

What problem it solves (1 line): Automates the aggregation and normalization of global technology news into a scalable NoSQL environment, enabling efficient downstream text analytics and trend monitoring.

What YOU built/did (2–3 lines): Engineered an end-to-end pipeline that extracts real-time headlines from NewsAPI, performing data cleaning and schema standardization using PySpark. Optimized the storage layer by implementing intermediate Parquet formatting for columnar compression and final loading into a cloud-hosted MongoDB Atlas cluster. Streamlined production deployment by orchestrating the workflow through Bash scripts and Cron automation, ensuring daily data freshness with a lightweight footprint.


Project Name: Self-Service API Data Ingestion Utility via Streamlit

Tools/Tech Used: Python, requests, streamlit

What problem it solves (1 line): Simplifies data acquisition for non-technical users by providing a centralized web interface to extract, preview, and download semi-structured JSON data from public endpoints.

What YOU built/did (2–3 lines): Developed a responsive web application using Streamlit, enabling on-demand data extraction and real-time JSON previews from diverse public API sources. Architected a modular backend using Python to handle URL parsing, automated domain mapping, and timestamped file storage logic. Implemented comprehensive error-handling and status-reporting mechanisms to ensure a seamless user experience during data fetch and export operations.


Project Name: End-to-End Sales Analytics & Data Quality Dashboard

Tools/Tech Used: PowerBI

What problem it solves (1 line): Transforms raw, inconsistent transactional data into high-fidelity business intelligence by implementing rigorous data-cleansing protocols and interactive KPI tracking.

What YOU built/did (2–3 lines): Engineered a robust data preprocessing workflow in Power Query, automating the removal of nulls, duplicates, and type-errors to ensure a 100% clean dataset. Designed an optimized analytical model by performing advanced transformations, including column splitting for temporal and customer granularity and data normalization. Developed an interactive Power BI Dashboard featuring custom KPIs for Profit/Sales and trend visualizations, enabling stakeholder deep-dives via dynamic slicers and regional analysis.



Project Name: Scalable Spotify Hit Predictor using PySpark MLlib & Streamlit

Tools/Tech Used: Python, PySpark, Spark MLlib, Streamlit

What problem it solves (1 line): Identifies key audio drivers of commercial success by processing massive music datasets and providing an interactive tool for artists to simulate a track's popularity before release.

What YOU built/did (2–3 lines): Architected an end-to-end Machine Learning pipeline using PySpark MLlib, incorporating VectorAssembler and StringIndexer for high-performance feature engineering on large datasets. Developed and trained a Linear Regression model to predict song popularity scores based on Spotify audio telemetry, optimizing Spark memory configurations for efficient distributed training. Deployed an interactive web application using Streamlit, enabling real-time model inference and "what-if" scenario analysis for various musical attributes.


## Skills

List your skills grouped by category. Keep concise.

- skills:
  Programming Languages: Python, SQL, Bash
• Databases: MySQL, PostgreSQL, MongoDB, Azure SQL Database, Azure Cosmos DB
• Cloud Platforms (Azure): Microsoft Fabric, Azure Data Factory, Synapse Analytics, Databricks, Key Vault, Stream Analytics,
Event Hubs
• Tools & Methodologies: Git, GitHub, Docker, Linux, Dimensional Data Modelling, BeautifulSoup4
• Big Data & ETL: PySpark, Apache Airflow

## Stats (optional)

- stats:
  projects_count: 13
  _Use some other stats from the given data_

## Preferences & Theme

- accent_color: "#0F2854", #1C4D8D, #4988C4, #BDE8F5  # optional hex color if you want a custom accent
- theme: "light"  # or "light"

## Availability

- looking_for: "Internship"
- timezone: "GMT+5:30"

---

Notes & tips
- Put images in `Portfolio/images/` and reference them by relative path (e.g. `images/project1.png`).
- For project images, 800x450 (landscape) or a 4:3/16:9 thumbnail works well.
- If you prefer, paste a small Markdown-formatted project writeup for any project and I will render it into the project detail page.

Once you fill this file, tell me and I'll update `index.html` (and optionally add project pages or thumbnails) using your real content.

