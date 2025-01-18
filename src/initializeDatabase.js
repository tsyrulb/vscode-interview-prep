import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import JSONStream from 'JSONStream';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the database path
const dbPath = path.resolve(__dirname, '../data/problems.db');

// Initialize SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err.message);
    process.exit(1);
  }
  console.log(`Connected to SQLite database at ${dbPath}`);
});

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(
        `
        CREATE TABLE IF NOT EXISTS problems (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          problem_id TEXT,
          question TEXT,
          solutions TEXT,
          input_output TEXT,
          difficulty TEXT,
          url TEXT,
          starter_code TEXT
        )
        `,
        (err) => {
          if (err) {
            console.error('Error initializing database:', err.message);
            return reject(err);
          }
          console.log('Table initialized.');
          resolve();
        }
      );
    });
  });
}

function insertProblemsFromJsonInChunks(jsonPath, chunkSize = 100) {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(jsonPath, { encoding: 'utf-8' });
    const jsonStream = JSONStream.parse('*');
    let buffer = [];
    let insertedCount = 0;

    readStream
      .pipe(jsonStream)
      .on('data', (problem) => {
        buffer.push(problem);

        if (buffer.length >= chunkSize) {
          readStream.pause(); // Pause reading while processing
          db.serialize(() => {
            db.run('BEGIN TRANSACTION;');
            const stmt = db.prepare(
              `
              INSERT INTO problems (problem_id, question, solutions, input_output, difficulty, url, starter_code)
              VALUES (?, ?, ?, ?, ?, ?, ?)
              `
            );

            for (const item of buffer) {
              stmt.run(
                item.problem_id,
                item.question,
                item.solutions,
                item.input_output,
                item.difficulty,
                item.url,
                item.starter_code
              );
              insertedCount++;
            }

            stmt.finalize();
            db.run('COMMIT;', (err) => {
              if (err) {
                console.error('Error committing transaction:', err.message);
                reject(err);
              }
              console.log(`Inserted ${insertedCount} problems so far...`);
              buffer = [];
              readStream.resume(); // Resume reading
            });
          });
        }
      })
      .on('end', () => {
        // Insert any remaining problems
        if (buffer.length > 0) {
          db.serialize(() => {
            db.run('BEGIN TRANSACTION;');
            const stmt = db.prepare(
              `
              INSERT INTO problems (problem_id, question, solutions, input_output, difficulty, url, starter_code)
              VALUES (?, ?, ?, ?, ?, ?, ?)
              `
            );

            for (const item of buffer) {
              stmt.run(
                item.problem_id,
                item.question,
                item.solutions,
                item.input_output,
                item.difficulty,
                item.url,
                item.starter_code
              );
              insertedCount++;
            }

            stmt.finalize();
            db.run('COMMIT;', (err) => {
              if (err) {
                console.error('Error committing final transaction:', err.message);
                return reject(err);
              }
              console.log(`Final insert completed. Total: ${insertedCount} problems.`);
              resolve();
            });
          });
        } else {
          console.log(`All data inserted. Total: ${insertedCount} problems.`);
          resolve();
        }
      })
      .on('error', (err) => {
        console.error('Error reading JSON file:', err.message);
        reject(err);
      });
  });
}

// Run the script
(async () => {
  try {
    const jsonPath = path.resolve(__dirname, '../data/coding_questions.json');
    console.log(`Reading problems from JSON file at ${jsonPath}`);
    await initializeDatabase();
    await insertProblemsFromJsonInChunks(jsonPath);
    console.log('Database initialization and data insertion completed.');
  } catch (error) {
    console.error('Error during script execution:', error.message);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('Error closing the database:', err.message);
      } else {
        console.log('Database connection closed.');
      }
    });
  }
})();
