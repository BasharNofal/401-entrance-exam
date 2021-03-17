DROP TABLE IF EXISTS covid;
CREATE TABLE covid(
    id SERIAL PRIMARY KEY,
    country_name VARCHAR(255),
    total_confirmed VARCHAR(255),
    total_deaths VARCHAR(255),
    total_recovered VARCHAR(255),
    date VARCHAR(255)
)