// 1. Import required modules
const express = require('express');
const { Pool } = require('pg');
const path = require('path');

// 2. Initialize Express app
const app = express();
const port = 3000;

// 3. PostgreSQL Connection Pool
// IMPORTANT: Replace with your actual PostgreSQL connection details
const pool = new Pool({
    user: 'postgres',           // Your PostgreSQL username
    host: 'localhost',
    database: 'appraisal_db',   // The database we created
    password: '1234',  // The password you set for the user
    port: 5432,
});

// 4. Middleware to parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 5. Function to create the 'appraisals' table if it doesn't exist
const createTable = async () => {
    const queryText = `
        CREATE TABLE IF NOT EXISTS appraisals (
            id SERIAL PRIMARY KEY,
            employee_name VARCHAR(100) NOT NULL,
            employee_id VARCHAR(50) NOT NULL,
            task_name VARCHAR(100) NOT NULL,
            feedback TEXT,
            rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `;
    try {
        await pool.query(queryText);
        console.log('"appraisals" table is ready.');
    } catch (err) {
        console.error('Error creating table:', err.stack);
    }
};

// 6. Define API Routes

// GET /api/appraisals - Fetch all appraisals
app.get('/api/appraisals', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM appraisals ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching appraisals:', err.message);
        res.status(500).send('Server Error');
    }
});

// POST /api/appraisals - Submit a new appraisal
app.post('/api/appraisals', async (req, res) => {
    try {
        const { employee_name, employee_id, task_name, feedback, rating } = req.body;

        // Simple validation
        if (!employee_name || !employee_id || !task_name || !rating) {
            return res.status(400).json({ msg: 'Please fill out all required fields.' });
        }

        const newAppraisal = await pool.query(
            'INSERT INTO appraisals (employee_name, employee_id, task_name, feedback, rating) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [employee_name, employee_id, task_name, feedback, rating]
        );
        res.status(201).json(newAppraisal.rows[0]);
    } catch (err) {
        console.error('Error submitting appraisal:', err.message);
        res.status(500).send('Server Error');
    }
});

// 7. Serve the frontend HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 8. Start the server
app.listen(port, () => {
    // Create the DB table on server start
    createTable();
    console.log(`Server is running on http://localhost:${port}`);
});