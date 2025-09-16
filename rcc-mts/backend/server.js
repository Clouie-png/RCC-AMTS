const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors'); // Import cors
const path = require('path'); // Import path for serving static files

const app = express();
const PORT = process.env.PORT || 3001;
const SECRET_KEY = 'your_secret_key'; // Replace with a strong, secret key in production

app.use(express.json());
const corsOptions = {
  origin: ['http://localhost:5173', 'http://192.168.100.76:5173'],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions)); // Use cors middleware with options

// Serve static files from the frontend build directory
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Initialize SQLite database
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    db.serialize(() => {
      // Create users table
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        department TEXT NOT NULL,
        role TEXT NOT NULL
      )`, (err) => {
        if (err) {
          console.error('Error creating users table:', err.message);
        } else {
          // Add a default admin user if the table is empty
          db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
            if (err) {
              console.error("Error checking user count:", err.message);
              return;
            }
            if (row.count === 0) {
              bcrypt.hash('adminpassword', 10, (err, hash) => {
                if (err) {
                  console.error('Error hashing password:', err.message);
                  return;
                }
                db.run(`INSERT INTO users (name, password, department, role) VALUES (?, ?, ?, ?)`, ['admin', hash, 'ITS', 'admin'], (err) => {
                  if (err) {
                    console.error('Error inserting default admin:', err.message);
                  } else {
                    console.log('Default admin user created.');
                  }
                });
              });
            }
          });
        }
      });

      // Create categories table (independent of departments)
      db.run(`CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        ticketCount INTEGER DEFAULT 0
      )`, (err) => {
        if (err) {
          console.error('Error creating categories table:', err.message);
        } else {
          // Check if department_id column exists and remove it if it does
          db.all("PRAGMA table_info(categories)", (err, columns) => {
            if (err) {
              console.error("Error checking categories table columns:", err);
              return;
            }
            const departmentIdColumn = columns.find(c => c.name === 'department_id');
            if (departmentIdColumn) {
              console.log("department_id column found in categories table, will recreate table");
              // Since there's no data in the categories table, we can safely recreate it
              db.serialize(() => {
                db.run("ALTER TABLE categories RENAME TO categories_old");
                db.run(`CREATE TABLE categories (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name TEXT NOT NULL,
                  ticketCount INTEGER DEFAULT 0
                )`);
                db.run("DROP TABLE categories_old");
                console.log("Categories table recreated without department_id column");
              });
            }
          });
        }
      });

      // Create departments table
      db.run(`CREATE TABLE IF NOT EXISTS departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        location TEXT NOT NULL,
        head TEXT NOT NULL,
        status TEXT NOT NULL
      )`, (err) => {
        if (err) {
          console.error('Error creating departments table:', err.message);
        }
      });

      // Create sub_categories table
      db.run(`CREATE TABLE IF NOT EXISTS sub_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category_id INTEGER NOT NULL,
        ticketCount INTEGER DEFAULT 0,
        UNIQUE(name, category_id),
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      )`, (err) => {
        if (err) {
          console.error('Error creating sub_categories table:', err.message);
        }
      });

      // Create assets table
      db.run(`CREATE TABLE IF NOT EXISTS assets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_code TEXT NOT NULL UNIQUE,
        date_acquired TEXT NOT NULL,
        serial_no TEXT NOT NULL UNIQUE,
        unit_price REAL NOT NULL,
        description TEXT,
        supplier TEXT,
        sub_category_id INTEGER NOT NULL,
        department_id INTEGER NOT NULL,
        FOREIGN KEY (sub_category_id) REFERENCES sub_categories(id) ON DELETE CASCADE,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
      )`, (err) => {
        if (err) {
          console.error('Error creating assets table:', err.message);
        } else {
          // Check if department_id column exists and add it if it doesn't
          db.all("PRAGMA table_info(assets)", (err, columns) => {
            if (err) {
              console.error("Error checking assets table columns:", err);
              return;
            }
            const departmentIdColumn = columns.find(c => c.name === 'department_id');
            if (!departmentIdColumn) {
              console.log("department_id column not found in assets table, will recreate table");
              // Check if there's any data in the assets table
              db.get("SELECT COUNT(*) as count FROM assets", (err, row) => {
                if (err) {
                  console.error("Error checking assets count:", err);
                  return;
                }
                if (row.count > 0) {
                  console.log("WARNING: Assets table has data that will be lost during migration");
                }
                // Recreate the assets table with the department_id column
                db.serialize(() => {
                  db.run("ALTER TABLE assets RENAME TO assets_old");
                  db.run(`CREATE TABLE assets (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    item_code TEXT NOT NULL UNIQUE,
                    date_acquired TEXT NOT NULL,
                    serial_no TEXT NOT NULL UNIQUE,
                    unit_price REAL NOT NULL,
                    description TEXT,
                    supplier TEXT,
                    sub_category_id INTEGER NOT NULL,
                    department_id INTEGER NOT NULL,
                    FOREIGN KEY (sub_category_id) REFERENCES sub_categories(id) ON DELETE CASCADE,
                    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
                  )`);
                  // In a production environment, we would migrate the data here
                  // For now, we'll just drop the old table
                  db.run("DROP TABLE assets_old");
                  console.log("Assets table recreated with department_id column");
                });
              });
            }
          });
        }
      });

      // Create pc_parts table
      db.run(`CREATE TABLE IF NOT EXISTS pc_parts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        department_id INTEGER NOT NULL,
        asset_item_code TEXT NOT NULL,
        part_name TEXT NOT NULL,
        date_acquired TEXT NOT NULL,
        serial_no TEXT NOT NULL,
        unit_price REAL NOT NULL,
        description TEXT,
        supplier TEXT,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
        FOREIGN KEY (asset_item_code) REFERENCES assets(item_code) ON DELETE CASCADE
      )`, (err) => {
        if (err) {
          console.error('Error creating pc_parts table:', err.message);
        }
      });

      // Create tickets table
      db.run(`CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        department_id INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        subcategory_id INTEGER,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        asset_id INTEGER REFERENCES assets(id) ON DELETE SET NULL,
        pc_part_id INTEGER REFERENCES pc_parts(id) ON DELETE SET NULL,
        description TEXT,
        resolution TEXT,
        status TEXT NOT NULL DEFAULT 'Open',
        technician_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
        FOREIGN KEY (subcategory_id) REFERENCES sub_categories(id) ON DELETE SET NULL,
        FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE SET NULL
      )`, (err) => {
        if (err) {
          console.error('Error creating tickets table:', err.message);
        } else {
          // Check for resolution column and add if it doesn't exist (for existing databases)
          db.all("PRAGMA table_info(tickets)", (err, columns) => {
            if (err) {
              console.error("Error checking tickets table columns:", err);
              return;
            }
            const resolutionColumn = columns.find(c => c.name === 'resolution');
            if (!resolutionColumn) {
              db.run("ALTER TABLE tickets ADD COLUMN resolution TEXT", (err) => {
                if (err) {
                  console.error("Error adding resolution column to tickets table:", err);
                } else {
                  console.log("Successfully added resolution column to tickets table.");
                }
              });
            }
          });
        }
      });

      // Create notifications table
      db.run(`CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        ticket_id INTEGER,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
      )`, (err) => {
        if (err) {
          console.error('Error creating notifications table:', err.message);
        }
      });
    });
  }
});

// Middleware to protect routes
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401); // No token
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.sendStatus(403); // Invalid token
    }
    req.user = user;
    next();
  });
};

// Middleware for admin-only routes
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Admins only.' });
  }
  next();
};

// Middleware for admin or maintenance routes
const isAdminOrMaintenance = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'maintenance') {
    return res.status(403).json({ message: 'Forbidden: Admins or maintenance staff only.' });
  }
  next();
};

// Login endpoint
app.post('/login', (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ message: 'Name and password are required.' });
  }

  db.get('SELECT * FROM users WHERE name = ?', [name], async (err, user) => {
    if (err) {
      console.error('Error during login:', err.message);
      return res.status(500).json({ message: 'Internal server error.' });
    }
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    console.log("User role during login:", user.role); // Add this line
    const token = jwt.sign({ id: user.id, name: user.name, department: user.department, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ message: 'Login successful!', token, department: user.department, role: user.role, name: user.name });
  });
});

// User Management Endpoints (Admin Only)
app.get('/users', authenticateToken, isAdmin, (req, res) => {
  db.all('SELECT id, name, department, role FROM users', [], (err, rows) => {
    if (err) {
      res.status(500).json({ message: 'Error fetching users.' });
    } else {
      res.json(rows);
    }
  });
});

app.post('/users', authenticateToken, isAdmin, async (req, res) => {
  const { name, password, department, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  db.run('INSERT INTO users (name, password, department, role) VALUES (?, ?, ?, ?)', [name, hashedPassword, department, role], function(err) {
    if (err) {
      res.status(500).json({ message: 'Error adding user.' });
    } else {
      res.status(201).json({ userId: this.lastID });
    }
  });
});

app.put('/users/:id', authenticateToken, isAdmin, (req, res) => {
  const { name, department, role } = req.body;
  db.run('UPDATE users SET name = ?, department = ?, role = ? WHERE id = ?', [name, department, role, req.params.id], function(err) {
    if (err) {
      res.status(500).json({ message: 'Error updating user.' });
    } else if (this.changes === 0) {
      res.status(404).json({ message: 'User not found.' });
    } else {
      res.json({ message: 'User updated successfully.' });
    }
  });
});

app.delete('/users/:id', authenticateToken, isAdmin, (req, res) => {
  db.run('DELETE FROM users WHERE id = ?', req.params.id, function(err) {
    if (err) {
      res.status(500).json({ message: 'Error deleting user.' });
    } else if (this.changes === 0) {
      res.status(404).json({ message: 'User not found.' });
    } else {
      res.json({ message: 'User deleted successfully.' });
    }
  });
});


// Category Management Endpoints
app.get('/categories', authenticateToken, (req, res) => {
  db.all('SELECT * FROM categories', [], (err, rows) => {
    if (err) {
      res.status(500).json({ message: 'Error fetching categories.' });
    } else {
      res.json(rows);
    }
  });
});

app.post('/categories', authenticateToken, isAdmin, (req, res) => {
  const { name } = req.body;
  db.run('INSERT INTO categories (name) VALUES (?)', [name], function(err) {
    if (err) {
      console.error('Error adding category:', err.message);
      res.status(500).json({ message: 'Error adding category.' });
    } else {
      res.status(201).json({ categoryId: this.lastID });
    }
  });
});

app.put('/categories/:id', authenticateToken, isAdmin, (req, res) => {
  const { name } = req.body;
  // Removed department_id from update. Only update the category name.
  db.run('UPDATE categories SET name = ? WHERE id = ?', [name, req.params.id], function(err) {
    if (err) {
      res.status(500).json({ message: 'Error updating category.' });
    } else if (this.changes === 0) {
      res.status(404).json({ message: 'Category not found.' });
    } else {
      res.json({ message: 'Category updated successfully.' });
    }
  });
});

app.delete('/categories/:id', authenticateToken, isAdmin, (req, res) => {
  db.run('DELETE FROM categories WHERE id = ?', req.params.id, function(err) {
    if (err) {
      res.status(500).json({ message: 'Error deleting category.' });
    } else if (this.changes === 0) {
      res.status(404).json({ message: 'Category not found.' });
    } else {
      res.json({ message: 'Category deleted successfully.' });
    }
  });
});

// Department Management Endpoints
app.get('/departments', authenticateToken, (req, res) => {
  db.all('SELECT * FROM departments', [], (err, rows) => {
    if (err) {
      res.status(500).json({ message: 'Error fetching departments.' });
    } else {
      res.json(rows);
    }
  });
});

app.post('/departments', authenticateToken, isAdmin, (req, res) => {
  const { name, location, head, status } = req.body;
  db.run('INSERT INTO departments (name, location, head, status) VALUES (?, ?, ?, ?)', [name, location, head, status], function(err) {
    if (err) {
      if (err.errno === 19) { // SQLITE_CONSTRAINT error code
        return res.status(409).json({ message: 'Department with this name already exists.' });
      }
      res.status(500).json({ message: 'Error adding department.' });
    } else {
      res.status(201).json({ departmentId: this.lastID });
    }
  });
});

app.put('/departments/:id', authenticateToken, isAdmin, (req, res) => {
  const { name, location, head, status } = req.body;
  db.run('UPDATE departments SET name = ?, location = ?, head = ?, status = ? WHERE id = ?', [name, location, head, status, req.params.id], function(err) {
    if (err) {
      res.status(500).json({ message: 'Error updating department.' });
    } else if (this.changes === 0) {
      res.status(404).json({ message: 'Department not found.' });
    } else {
      res.json({ message: 'Department updated successfully.' });
    }
  });
});

app.delete('/departments/:id', authenticateToken, isAdmin, (req, res) => {
  db.run('DELETE FROM departments WHERE id = ?', req.params.id, function(err) {
    if (err) {
      res.status(500).json({ message: 'Error deleting department.' });
    } else if (this.changes === 0) {
      res.status(404).json({ message: 'Department not found.' });
    } else {
      res.json({ message: 'Department deleted successfully.' });
    }
  });
});

// Sub-Category Management Endpoints
app.get('/sub-categories', authenticateToken, (req, res) => {
  db.all('SELECT * FROM sub_categories', [], (err, rows) => {
    if (err) {
      res.status(500).json({ message: 'Error fetching sub-categories.' });
    } else {
      res.json(rows);
    }
  });
});

app.post('/sub-categories', authenticateToken, isAdmin, (req, res) => {
  const { name, category_id } = req.body;
  db.run('INSERT INTO sub_categories (name, category_id) VALUES (?, ?)', [name, category_id], function(err) {
    if (err) {
      if (err.errno === 19) { // SQLITE_CONSTRAINT error code
        return res.status(409).json({ message: 'Sub-category with this name already exists for the selected category.' });
      }
      res.status(500).json({ message: 'Error adding sub-category.' });
    } else {
      res.status(201).json({ subCategoryId: this.lastID });
    }
  });
});

app.put('/sub-categories/:id', authenticateToken, isAdmin, (req, res) => {
  const { name } = req.body;
  db.run('UPDATE sub_categories SET name = ? WHERE id = ?', [name, req.params.id], function(err) {
    if (err) {
      res.status(500).json({ message: 'Error updating sub-category.' });
    } else if (this.changes === 0) {
      res.status(404).json({ message: 'Sub-category not found.' });
    } else {
      res.json({ message: 'Sub-category updated successfully.' });
    }
  });
});

app.delete('/sub-categories/:id', authenticateToken, isAdmin, (req, res) => {
  db.run('DELETE FROM sub_categories WHERE id = ?', req.params.id, function(err) {
    if (err) {
      res.status(500).json({ message: 'Error deleting sub-category.' });
    } else if (this.changes === 0) {
      res.status(404).json({ message: 'Sub-category not found.' });
    } else {
      res.json({ message: 'Sub-category deleted successfully.' });
    }
  });
});

// Asset Management Endpoints
app.get('/assets', authenticateToken, (req, res) => {
  db.all('SELECT * FROM assets', [], (err, rows) => {
    if (err) {
      res.status(500).json({ message: 'Error fetching assets.' });
    } else {
      res.json(rows);
    }
  });
});

app.post('/assets', authenticateToken, isAdmin, (req, res) => {
  const { item_code, date_acquired, serial_no, unit_price, description, supplier, sub_category_id, department_id } = req.body;
  db.run(
    'INSERT INTO assets (item_code, date_acquired, serial_no, unit_price, description, supplier, sub_category_id, department_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [item_code, date_acquired, serial_no, unit_price, description, supplier, sub_category_id, department_id],
    function(err) {
      if (err) {
        res.status(500).json({ message: 'Error adding asset.' });
      } else {
        res.status(201).json({ assetId: this.lastID });
      }
    }
  );
});

app.put('/assets/:id', authenticateToken, isAdmin, (req, res) => {
  const { item_code, date_acquired, serial_no, unit_price, description, supplier, sub_category_id, department_id } = req.body;
  db.run(
    'UPDATE assets SET item_code = ?, date_acquired = ?, serial_no = ?, unit_price = ?, description = ?, supplier = ?, sub_category_id = ?, department_id = ? WHERE id = ?',
    [item_code, date_acquired, serial_no, unit_price, description, supplier, sub_category_id, department_id, req.params.id],
    function(err) {
      if (err) {
        res.status(500).json({ message: 'Error updating asset.' });
      } else if (this.changes === 0) {
        res.status(404).json({ message: 'Asset not found.' });
      } else {
        res.json({ message: 'Asset updated successfully.' });
      }
    }
  );
});

app.delete('/assets/:id', authenticateToken, isAdmin, (req, res) => {
  db.run('DELETE FROM assets WHERE id = ?', req.params.id, function(err) {
    if (err) {
      res.status(500).json({ message: 'Error deleting asset.' });
    } else if (this.changes === 0) {
      res.status(404).json({ message: 'Asset not found.' });
    } else {
      res.json({ message: 'Asset deleted successfully.' });
    }
  });
});

// PC Parts Management Endpoints
app.get('/pc-parts', authenticateToken, (req, res) => {
  db.all('SELECT * FROM pc_parts', [], (err, rows) => {
    if (err) {
      res.status(500).json({ message: 'Error fetching PC parts.' });
    } else {
      res.json(rows);
    }
  });
});

// PC Parts by Asset
app.get('/pc-parts/asset/:item_code', authenticateToken, (req, res) => {
  const { item_code } = req.params;
  db.all('SELECT * FROM pc_parts WHERE asset_item_code = ?', [item_code], (err, rows) => {
    if (err) {
      res.status(500).json({ message: 'Error fetching PC parts for the asset.' });
    } else {
      res.json(rows);
    }
  });
});

app.post('/pc-parts', authenticateToken, isAdmin, (req, res) => {
  const { department_id, asset_item_code, part_name, date_acquired, serial_no, unit_price, description, supplier } = req.body;
  db.run(
    'INSERT INTO pc_parts (department_id, asset_item_code, part_name, date_acquired, serial_no, unit_price, description, supplier) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [department_id, asset_item_code, part_name, date_acquired, serial_no, unit_price, description, supplier],
    function(err) {
      if (err) {
        res.status(500).json({ message: 'Error adding PC part.' });
      } else {
        res.status(201).json({ pcPartId: this.lastID });
      }
    }
  );
});

app.put('/pc-parts/:id', authenticateToken, isAdmin, (req, res) => {
  const { department_id, asset_item_code, part_name, date_acquired, serial_no, unit_price, description, supplier } = req.body;
  db.run(
    'UPDATE pc_parts SET department_id = ?, asset_item_code = ?, part_name = ?, date_acquired = ?, serial_no = ?, unit_price = ?, description = ?, supplier = ? WHERE id = ?',
    [department_id, asset_item_code, part_name, date_acquired, serial_no, unit_price, description, supplier, req.params.id],
    function(err) {
      if (err) {
        res.status(500).json({ message: 'Error updating PC part.' });
      } else if (this.changes === 0) {
        res.status(404).json({ message: 'PC part not found.' });
      } else {
        res.json({ message: 'PC part updated successfully.' });
      }
    }
  );
});

app.delete('/pc-parts/:id', authenticateToken, isAdmin, (req, res) => {
  db.run('DELETE FROM pc_parts WHERE id = ?', req.params.id, function(err) {
    if (err) {
      res.status(500).json({ message: 'Error deleting PC part.' });
    } else if (this.changes === 0) {
      res.status(404).json({ message: 'PC part not found.' });
    } else {
      res.json({ message: 'PC part deleted successfully.' });
    }
  });
});

// Ticket Management Endpoints
app.get('/tickets', authenticateToken, (req, res) => {
  const query = `
    SELECT 
      t.id,
      t.department_id,
      d.name AS department_name,
      t.category_id,
      c.name AS category_name,
      t.subcategory_id,
      sc.name AS subcategory_name,
      t.user_id,
      u.name AS user_name,
      t.asset_id,
      a.item_code AS asset_item_code,
      t.pc_part_id,
      p.part_name AS pc_part_name,
      t.description,
      t.resolution,
      t.status,
      t.technician_id,
      tech.name AS technician_name,
      t.created_at,
      t.updated_at
    FROM tickets t
    LEFT JOIN departments d ON t.department_id = d.id
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN sub_categories sc ON t.subcategory_id = sc.id
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN users tech ON t.technician_id = tech.id
    LEFT JOIN assets a ON t.asset_id = a.id
    LEFT JOIN pc_parts p ON t.pc_part_id = p.id
    ORDER BY t.created_at DESC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching tickets:', err.message);
      res.status(500).json({ message: 'Error fetching tickets.' });
    } else {
      res.json(rows);
    }
  });
});

// Helper function to create notifications
const createNotification = (userId, ticketId, message, callback) => {
  db.run('INSERT INTO notifications (user_id, ticket_id, message) VALUES (?, ?, ?)', 
    [userId, ticketId, message], 
    function(err) {
      if (err) {
        console.error(`Error creating notification for user ${userId}:`, err.message);
      }
      if (callback) callback(err, this ? this.lastID : null);
    }
  );
};

// Helper function to get all admin users
const getAdminUsers = (callback) => {
  db.all("SELECT id FROM users WHERE role = 'admin'", [], (err, rows) => {
    if (err) {
      console.error('Error fetching admin users:', err.message);
      callback(err, []);
    } else {
      callback(null, rows.map(row => row.id));
    }
  });
};

app.post('/tickets', authenticateToken, isAdmin, (req, res) => {
  const { department_id, category_id, subcategory_id, user_id, asset_id, pc_part_id, description, resolution, status, technician_id } = req.body;
  const validStatuses = ['Open', 'In Progress', 'Closed'];
  
  // Validate required fields
  if (!department_id || !category_id) {
    return res.status(400).json({ message: 'Department and category are required.' });
  }
  
  // Validate status
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status value.' });
  }
  
  // Validate IDs if provided
  const validateId = (id, fieldName) => {
    if (id !== undefined && id !== null && isNaN(id)) {
      return res.status(400).json({ message: `Invalid ${fieldName} value.` });
    }
  };
  
  validateId(technician_id, 'technician_id');
  validateId(user_id, 'user_id');
  validateId(asset_id, 'asset_id');
  validateId(pc_part_id, 'pc_part_id');
  validateId(subcategory_id, 'subcategory_id');
  
  const query = `
    INSERT INTO tickets (department_id, category_id, subcategory_id, user_id, asset_id, pc_part_id, description, resolution, status, technician_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const values = [
    department_id,
    category_id,
    subcategory_id || null,
    user_id || null,
    asset_id || null,
    pc_part_id || null,
    description || null,
    resolution || null,
    status || 'Open', // Default to 'Open' if not provided
    technician_id || null
  ];
  
  db.run(query, values, function(err) {
    if (err) {
      console.error('Error creating ticket:', err.message);
      res.status(500).json({ message: 'Error creating ticket.' });
    } else {
      const ticketId = this.lastID;
      
      // Create notifications
      // 1. Notify the ticket creator (faculty/staff)
      if (user_id) {
        createNotification(user_id, ticketId, 
          `Your ticket #${ticketId} has been created and is now ${status || 'Open'}.`, 
          (err) => {
            if (err) console.error('Failed to notify ticket creator:', err.message);
          }
        );
      }
      
      // 2. Notify all admins
      getAdminUsers((err, adminIds) => {
        if (!err && adminIds.length > 0) {
          adminIds.forEach(adminId => {
            createNotification(adminId, ticketId, 
              `A new ticket #${ticketId} has been created by ${user_id ? 'a user' : 'an admin'}.`, 
              (err) => {
                if (err) console.error(`Failed to notify admin ${adminId}:`, err.message);
              }
            );
          });
        }
      });
      
      // 3. Notify assigned technician if any
      if (technician_id) {
        createNotification(technician_id, ticketId, 
          `You have been assigned to ticket #${ticketId}.`, 
          (err) => {
            if (err) console.error('Failed to notify technician:', err.message);
          }
        );
      }
      
      res.status(201).json({ 
        message: 'Ticket created successfully.', 
        ticketId: ticketId
      });
    }
  });
});

app.put('/tickets/:id', authenticateToken, isAdminOrMaintenance, (req, res) => {
  const { department_id, category_id, subcategory_id, user_id, asset_id, pc_part_id, description, resolution, status, technician_id } = req.body;
  const validStatuses = ['Open', 'In Progress', 'Closed'];
  const ticketId = req.params.id;
  
  // Validate status
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status value.' });
  }
  
  // Validate IDs if provided
  const validateId = (id, fieldName) => {
    if (id !== undefined && id !== null && isNaN(id)) {
      return res.status(400).json({ message: `Invalid ${fieldName} value.` });
    }
  };
  
  validateId(technician_id, 'technician_id');
  validateId(user_id, 'user_id');
  validateId(asset_id, 'asset_id');
  validateId(pc_part_id, 'pc_part_id');
  validateId(subcategory_id, 'subcategory_id');
  validateId(department_id, 'department_id');
  validateId(category_id, 'category_id');
  
  // First, get the current ticket information to check for changes
  const getCurrentTicket = () => {
    return new Promise((resolve, reject) => {
      db.get('SELECT user_id, technician_id, status FROM tickets WHERE id = ?', [ticketId], (err, row) => {
        if (err) {
          reject(err);
        } else if (!row) {
          reject(new Error('Ticket not found'));
        } else {
          resolve(row);
        }
      });
    });
  };
  
  // Build the query dynamically based on provided fields
  let fields = [];
  let values = [];
  
  if (department_id !== undefined) {
    fields.push('department_id = ?');
    values.push(department_id);
  }
  
  if (category_id !== undefined) {
    fields.push('category_id = ?');
    values.push(category_id);
  }
  
  if (subcategory_id !== undefined) {
    fields.push('subcategory_id = ?');
    values.push(subcategory_id);
  }
  
  if (user_id !== undefined) {
    fields.push('user_id = ?');
    values.push(user_id);
  }
  
  if (asset_id !== undefined) {
    fields.push('asset_id = ?');
    values.push(asset_id);
  }
  
  if (pc_part_id !== undefined) {
    fields.push('pc_part_id = ?');
    values.push(pc_part_id);
  }
  
  if (description !== undefined) {
    fields.push('description = ?');
    values.push(description);
  }
  
  if (resolution !== undefined) {
    fields.push('resolution = ?');
    values.push(resolution);
  }
  
  if (status !== undefined) {
    fields.push('status = ?');
    values.push(status);
  }
  
  if (technician_id !== undefined) {
    fields.push('technician_id = ?');
    values.push(technician_id);
  }
  
  // Always update the updated_at timestamp
  fields.push('updated_at = CURRENT_TIMESTAMP');
  
  if (fields.length === 0) {
    return res.status(400).json({ message: 'No fields to update.' });
  }
  
  const query = `UPDATE tickets SET ${fields.join(', ')} WHERE id = ?`;
  values.push(ticketId);
  
  // Process the ticket update and send notifications
  getCurrentTicket()
    .then(currentTicket => {
      db.run(query, values, function(err) {
        if (err) {
          console.error('Error updating ticket:', err.message);
          res.status(500).json({ message: 'Error updating ticket.' });
        } else if (this.changes === 0) {
          res.status(404).json({ message: 'Ticket not found.' });
        } else {
          // Check for changes that require notifications
          const notifications = [];
          
          // Notify ticket creator if status changed
          if (status !== undefined && status !== currentTicket.status) {
            const statusChangeMessage = `Status of your ticket #${ticketId} has been updated to ${status}.`;
            if (currentTicket.user_id) {
              notifications.push({
                userId: currentTicket.user_id,
                message: statusChangeMessage
              });
            }
            
            // Notify all admins about status change
            getAdminUsers((err, adminIds) => {
              if (!err && adminIds.length > 0) {
                adminIds.forEach(adminId => {
                  // Don't notify the admin who made the change (if it's an admin)
                  if (adminId !== currentTicket.user_id) {
                    createNotification(adminId, ticketId, 
                      `Status of ticket #${ticketId} has been updated to ${status}.`, 
                      (err) => {
                        if (err) console.error(`Failed to notify admin ${adminId}:`, err.message);
                      }
                    );
                  }
                });
              }
            });
          }
          
          // Notify new technician if assigned
          if (technician_id !== undefined && technician_id !== currentTicket.technician_id) {
            notifications.push({
              userId: technician_id,
              message: `You have been assigned to ticket #${ticketId}.`
            });
          }
          
          // Send all notifications
          notifications.forEach(notification => {
            createNotification(notification.userId, ticketId, notification.message, (err) => {
              if (err) console.error(`Failed to notify user ${notification.userId}:`, err.message);
            });
          });
          
          res.json({ message: 'Ticket updated successfully.' });
        }
      });
    })
    .catch(err => {
      if (err.message === 'Ticket not found') {
        res.status(404).json({ message: 'Ticket not found.' });
      } else {
        console.error('Error getting current ticket:', err.message);
        res.status(500).json({ message: 'Error updating ticket.' });
      }
    });
});

// Notification Endpoints
// Endpoint to broadcast a notification to all users
app.post('/notifications/broadcast', authenticateToken, (req, res) => {
  const { ticket_id, message } = req.body;

  if (!message) {
    return res.status(400).json({ message: 'Notification message is required.' });
  }

  // Get the ticket's creator (user_id) from the tickets table
  const getTicketQuery = 'SELECT user_id FROM tickets WHERE id = ?';
  db.get(getTicketQuery, [ticket_id], (err, ticket) => {
    if (err) {
      console.error('Error fetching ticket for notification:', err.message);
      return res.status(500).json({ message: 'Error fetching ticket.' });
    }

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found.' });
    }

    // Only send notification to the ticket's creator
    const stmt = db.prepare('INSERT INTO notifications (user_id, ticket_id, message) VALUES (?, ?, ?)');
    stmt.run(ticket.user_id, ticket_id, message, (err) => {
      if (err) {
        console.error(`Error inserting notification for user ${ticket.user_id}:`, err.message);
        return res.status(500).json({ message: 'Failed to create notification.' });
      }
      stmt.finalize();
      res.status(201).json({ message: 'Notification sent successfully.' });
    });
  });
});

// Endpoint to get notifications for a specific user
app.get('/notifications/user/:userId', authenticateToken, (req, res) => {
  const { userId } = req.params;

  // Ensure the authenticated user is requesting their own notifications
  if (req.user.id !== parseInt(userId, 10)) {
    return res.status(403).json({ message: 'Forbidden: You can only access your own notifications.' });
  }

  const query = `
    SELECT * FROM notifications 
    WHERE user_id = ? 
    ORDER BY created_at DESC
  `;

  db.all(query, [userId], (err, rows) => {
    if (err) {
      console.error(`Error fetching notifications for user ${userId}:`, err.message);
      return res.status(500).json({ message: 'Error fetching notifications.' });
    }
    res.json(rows);
  });
});

// Endpoint to mark a notification as read
app.put('/notifications/:notificationId/read', authenticateToken, (req, res) => {
  const { notificationId } = req.params;

  // First, verify the notification belongs to the user making the request
  const verifyQuery = 'SELECT user_id FROM notifications WHERE id = ?';
  db.get(verifyQuery, [notificationId], (err, notification) => {
    if (err) {
      console.error(`Error verifying notification ${notificationId}:`, err.message);
      return res.status(500).json({ message: 'Error verifying notification.' });
    }
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }
    if (notification.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You cannot modify this notification.' });
    }

    // If verification passes, update the notification
    const updateQuery = 'UPDATE notifications SET is_read = 1 WHERE id = ?';
    db.run(updateQuery, [notificationId], function(err) {
      if (err) {
        console.error(`Error marking notification ${notificationId} as read:`, err.message);
        return res.status(500).json({ message: 'Error updating notification.' });
      }
      if (this.changes === 0) {
        // This case should ideally be caught by the verification step
        return res.status(404).json({ message: 'Notification not found.' });
      }
      res.json({ message: 'Notification marked as read.' });
    });
  });
});


// For all other routes, serve the index.html file (SPA fallback)
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
// });

// Listen on all network interfaces (0.0.0.0) to make it accessible on the network
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
