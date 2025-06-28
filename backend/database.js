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
      
      // Always create demo users on Vercel to ensure they exist
      this.shouldCreateDemoUsers = true;
      console.log('Database will be initialized in /tmp with demo users for Vercel deployment');
    } else {
      // Local development
      dbPath = process.env.DB_PATH || './database/gymbro.db';
      const dbDir = path.dirname(dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
    }
    
    try {
      this.db = new sqlite3.Database(dbPath);
      console.log(`Connected to database at: ${dbPath}`);
      this.init();
    } catch (error) {
      console.error('Failed to connect to database:', error);
      // In case of database connection failure, create an in-memory database as fallback
      console.warn('⚠️ Using in-memory database as fallback');
      this.db = new sqlite3.Database(':memory:');
      this.shouldCreateDemoUsers = true;
      this.init();
    }
  }

  async init() {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('Initializing database...');
        // Enable foreign keys
        await new Promise((resolveRun, rejectRun) => {
          this.db.run('PRAGMA foreign_keys = ON', (err) => {
            if (err) rejectRun(err);
            else resolveRun();
          });
        });
        
        // Create users table
        await new Promise((resolveUsers, rejectUsers) => {
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
              rejectUsers(err);
            } else {
              console.log('✅ Users table ready');
              resolveUsers();
            }
          });
        });

        // Create user_data table (stores all app data as JSON)
        await new Promise((resolveData, rejectData) => {
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
            if (err) {
              console.error('Error creating user_data table:', err);
              rejectData(err);
            } else {
              console.log('✅ User data table ready');
              resolveData();
            }
          });
        });
        
        console.log('📁 Database tables initialized successfully');
        
        // Create demo users if needed (in Vercel environment)
        if (this.shouldCreateDemoUsers) {
          console.log('Creating demo users for Vercel environment...');
          await this.createDemoUsers();
          console.log('Demo users setup completed');
        }
        
        resolve();
      } catch (error) {
        console.error('Database initialization error:', error);
        reject(error);
      }
    });
  }

  async createDemoUsers() {
    console.log('Creating demo users for Vercel...');
    
    try {
      // Force-create the primary demo user (recreate even if exists to ensure password is correct)
      // Use plain SQL with direct execution for more reliable behavior on Vercel
      console.log('Creating/ensuring primary demo user exists...');
      const hashedPassword = bcrypt.hashSync('Password123', 10);
      
      // First try to delete if exists to ensure we have a fresh user
      try {
        await new Promise((resolve, reject) => {
          this.db.run('DELETE FROM users WHERE email = ?', ['erminke@gmail.com'], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        console.log('Cleared existing demo user');
      } catch (error) {
        console.warn('Could not clear existing demo user:', error.message);
      }
      
      // Insert the user with fresh credentials
      try {
        await new Promise((resolve, reject) => {
          this.db.run(
            'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
            ['erminke@gmail.com', hashedPassword, 'Ermin'],
            function(err) {
              if (err) reject(err);
              else {
                console.log(`Demo user created successfully with ID: ${this.lastID}!`);
                resolve(this.lastID);
              }
            }
          );
        });
      } catch (error) {
        console.error('Error force-creating demo user:', error);
        // Fallback attempt with INSERT OR REPLACE
        try {
          await new Promise((resolve, reject) => {
            this.db.run(
              'INSERT OR REPLACE INTO users (email, password, name) VALUES (?, ?, ?)',
              ['erminke@gmail.com', hashedPassword, 'Ermin'],
              function(err) {
                if (err) reject(err);
                else {
                  console.log(`Demo user created with fallback method, ID: ${this.lastID}`);
                  resolve(this.lastID);
                }
              }
            );
          });
        } catch (secondError) {
          console.error('Fatal error creating demo user:', secondError);
        }
      }
      
      // Create second test user (less critical)
      try {
        const user = await this.getUserByEmail('test@example.com');
        if (!user) {
          const hashedTestPassword = bcrypt.hashSync('password123', 10);
          await new Promise((resolve, reject) => {
            this.db.run(
              'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
              ['test@example.com', hashedTestPassword, 'Test User'],
              function(err) {
                if (err) reject(err);
                else {
                  console.log('Second test user created successfully!');
                  resolve();
                }
              }
            );
          });
        }
      } catch (error) {
        console.warn('Could not create second test user:', error.message);
      }
    } catch (mainError) {
      console.error('Error in createDemoUsers:', mainError);
    }
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
