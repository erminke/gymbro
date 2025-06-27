const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

class DatabaseManager {
  constructor() {
    // Set up database path
    // For local development, use ./database/gymbro.db
    // For Vercel, we need to use a persistent database (SQLite isn't suitable for production)
    let dbPath;
    
    if (process.env.VERCEL) {
      // For Vercel, still use /tmp but warn about limitations
      console.warn('WARNING: Running on Vercel with SQLite. Data will not persist between deployments.');
      console.warn('Consider using a managed database service for production.');
      dbPath = '/tmp/gymbro.db';
      
      // Initialize with demo user if on Vercel
      this.shouldCreateDemoUsers = true;
    } else {
      // Local development
      dbPath = process.env.DB_PATH || './database/gymbro.db';
      const dbDir = path.dirname(dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
    }
    
    this.db = new sqlite3.Database(dbPath);
    this.init();
  }

  init() {
    return new Promise((resolve, reject) => {
      // Enable foreign keys
      this.db.run('PRAGMA foreign_keys = ON');
      
      // Create users table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating users table:', err);
        } else if (this.shouldCreateDemoUsers) {
          // Create demo users after table is created
          this.createDemoUsers();
        }
      });

      // Create user_data table (stores all app data as JSON)
      this.db.run(`
        CREATE TABLE IF NOT EXISTS user_data (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          data_type TEXT NOT NULL,
          data TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          UNIQUE(user_id, data_type)
        )
      `, (err) => {
        if (err) reject(err);
        else {
          console.log('📁 Database initialized successfully');
          resolve();
        }
      });
    });
  }

  createDemoUsers() {
    console.log('Creating demo users...');
    // Create a demo user that always exists
    this.getUserByEmail('erminke@gmail.com')
      .then(user => {
        if (!user) {
          // Hash the password
          const hashedPassword = bcrypt.hashSync('Password123', 10);
          
          // Insert the user
          this.db.run(
            'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
            ['erminke@gmail.com', hashedPassword, 'Ermin'],
            function(err) {
              if (err) {
                console.error('Error creating demo user:', err);
              } else {
                console.log('Demo user created successfully!');
              }
            }
          );
        } else {
          console.log('Demo user already exists');
        }
      })
      .catch(err => {
        console.error('Error checking for demo user:', err);
      });
      
    // Create second test user
    this.getUserByEmail('test@example.com')
      .then(user => {
        if (!user) {
          const hashedPassword = bcrypt.hashSync('password123', 10);
          this.db.run(
            'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
            ['test@example.com', hashedPassword, 'Test User'],
            function(err) {
              if (err) {
                console.error('Error creating test user:', err);
              } else {
                console.log('Test user created successfully!');
              }
            }
          );
        }
      });
  }

  // User methods
  createUser(email, password, name = null) {
    return new Promise((resolve, reject) => {
      const hashedPassword = bcrypt.hashSync(password, 10);
      this.db.run(
        'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
        [email, hashedPassword, name],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  getUserByEmail(email) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM users WHERE email = ?',
        [email],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  getUserById(id) {
    console.log(`Retrieving user with ID: ${id}`);
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT id, email, name, created_at FROM users WHERE id = ?',
        [id],
        (err, row) => {
          if (err) {
            console.error(`Error retrieving user with ID ${id}:`, err);
            reject(err);
          }
          else {
            if (row) {
              console.log(`Found user with ID ${id}:`, row.email);
            } else {
              console.warn(`No user found with ID: ${id}`);
            }
            resolve(row);
          }
        }
      );
    });
  }

  verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compareSync(plainPassword, hashedPassword);
  }

  // Data methods
  saveUserData(userId, dataType, data) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT OR REPLACE INTO user_data (user_id, data_type, data, updated_at) 
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        [userId, dataType, JSON.stringify(data)],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }

  getUserData(userId, dataType = null) {
    return new Promise((resolve, reject) => {
      if (dataType) {
        this.db.get(
          'SELECT * FROM user_data WHERE user_id = ? AND data_type = ?',
          [userId, dataType],
          (err, row) => {
            if (err) reject(err);
            else resolve(row ? JSON.parse(row.data) : null);
          }
        );
      } else {
        this.db.all(
          'SELECT * FROM user_data WHERE user_id = ?',
          [userId],
          (err, rows) => {
            if (err) reject(err);
            else {
              const userData = {};
              rows.forEach(row => {
                userData[row.data_type] = JSON.parse(row.data);
              });
              resolve(userData);
            }
          }
        );
      }
    });
  }

  deleteUserData(userId, dataType) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM user_data WHERE user_id = ? AND data_type = ?',
        [userId, dataType],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }

  // Utility methods
  close() {
    this.db.close();
  }
}

module.exports = new DatabaseManager();
