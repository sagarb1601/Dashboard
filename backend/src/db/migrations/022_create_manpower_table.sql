CREATE TABLE manpower_counts (
    id SERIAL PRIMARY KEY,
    on_rolls integer NOT NULL,
    cocp integer NOT NULL,
    regular integer NOT NULL,
    cc integer NOT NULL,
    gbc integer NOT NULL,
    ka integer NOT NULL,
    spe integer NOT NULL,
    pe integer NOT NULL,
    pa integer NOT NULL,
    total_employees integer GENERATED ALWAYS AS (((((((((on_rolls + cocp) + regular) + cc) + gbc) + ka) + spe) + pe) + pa)) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 