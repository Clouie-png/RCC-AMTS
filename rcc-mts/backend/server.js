require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors'); // Import cors
const path = require('path'); // Import path for serving static files

const app = express();
const PORT = process.env.PORT || 3001;

// IMPORTANT: Set a strong, secret key in your environment variables
const SECRET_KEY = process.env.SECRET_KEY;

if (!SECRET_KEY) {
  console.error('CRITICAL ERROR: SECRET_KEY is not set. Please set a strong secret key in your environment variables.');
  process.exit(1);
}

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
          // Check if department_id column exists and log a warning if it does
          db.all("PRAGMA table_info(categories)", (err, columns) => {
            if (err) {
              console.error("Error checking categories table columns:", err);
              return;
            }
            const departmentIdColumn = columns.find(c => c.name === 'department_id');
            if (departmentIdColumn) {
              console.log("WARNING: The 'categories' table has an unexpected 'department_id' column. This may cause issues.");
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
          // Check if department_id column exists and log a warning if it doesn't
          db.all("PRAGMA table_info(assets)", (err, columns) => {
            if (err) {
              console.error("Error checking assets table columns:", err);
              return;
            }
            const departmentIdColumn = columns.find(c => c.name === 'department_id');
            if (!departmentIdColumn) {
              console.log("WARNING: The 'assets' table is missing the 'department_id' column. This may cause issues.");
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

      // Create statuses table
      db.run(`CREATE TABLE IF NOT EXISTS statuses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      )`, (err) => {
        if (err) {
          console.error('Error creating statuses table:', err.message);
        } else {
          // Add default statuses if the table is empty
          db.get("SELECT COUNT(*) as count FROM statuses", (err, row) => {
            if (err) {
              console.error("Error checking statuses count:", err.message);
              return;
            }
            if (row.count === 0) {
              const statuses = ['Open', 'In Progress', 'Closed', 'For Approval'];
              const stmt = db.prepare("INSERT INTO statuses (name) VALUES (?)");
              statuses.forEach(status => stmt.run(status));
              stmt.finalize(err => {
                if (err) {
                  console.error('Error inserting default statuses:', err.message);
                } else {
                  console.log('Default statuses created.');
                }
              });
            }
          });
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
        status_id INTEGER NOT NULL,
        technician_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
        FOREIGN KEY (subcategory_id) REFERENCES sub_categories(id) ON DELETE SET NULL,
        FOREIGN KEY (status_id) REFERENCES statuses(id) ON DELETE CASCADE,
        FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE SET NULL
      )`, (err) => {
        if (err) {
          console.error('Error creating tickets table:', err.message);
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

const canUpdateTicket = (req, res, next) => {
  const ticketId = req.params.id;
  const requestingUser = req.user;

  db.get('SELECT user_id FROM tickets WHERE id = ?', [ticketId], (err, ticket) => {
    if (err || !ticket) {
      return res.status(404).json({ message: 'Ticket not found.' });
    }

    // Allow if admin or maintenance
    if (requestingUser.role === 'admin' || requestingUser.role === 'maintenance') {
      return next();
    }

    // Allow if they are the owner of the ticket
    if (requestingUser.id === ticket.user_id) {
      return next();
    }

    return res.status(403).json({ message: 'Forbidden.' });
  });
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

// Status Management Endpoints
app.get('/statuses', authenticateToken, (req, res) => {
  db.all('SELECT * FROM statuses', [], (err, rows) => {
    if (err) {
      res.status(500).json({ message: 'Error fetching statuses.' });
    } else {
      res.json(rows);
    }
  });
});

app.post('/statuses', authenticateToken, isAdmin, (req, res) => {
  const { name } = req.body;
  db.run('INSERT INTO statuses (name) VALUES (?)', [name], function(err) {
    if (err) {
      if (err.errno === 19) { // SQLITE_CONSTRAINT error code
        return res.status(409).json({ message: 'Status with this name already exists.' });
      }
      res.status(500).json({ message: 'Error adding status.' });
    } else {
      res.status(201).json({ statusId: this.lastID });
    }
  });
});

app.put('/statuses/:id', authenticateToken, isAdmin, (req, res) => {
  const { name } = req.body;
  db.run('UPDATE statuses SET name = ? WHERE id = ?', [name, req.params.id], function(err) {
    if (err) {
      res.status(500).json({ message: 'Error updating status.' });
    } else if (this.changes === 0) {
      res.status(404).json({ message: 'Status not found.' });
    } else {
      res.json({ message: 'Status updated successfully.' });
    }
  });
});

app.delete('/statuses/:id', authenticateToken, isAdmin, (req, res) => {
  db.run('DELETE FROM statuses WHERE id = ?', req.params.id, function(err) {
    if (err) {
      res.status(500).json({ message: 'Error deleting status.' });
    } else if (this.changes === 0) {
      res.status(404).json({ message: 'Status not found.' });
    } else {
      res.json({ message: 'Status deleted successfully.' });
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
      t.status_id,
      s.name as status_name,
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
    LEFT JOIN statuses s ON t.status_id = s.id
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

app.get('/tickets/count', authenticateToken, (req, res) => {
  const query = `
    SELECT s.name, COUNT(t.id) as count
    FROM statuses s
    LEFT JOIN tickets t ON s.id = t.status_id
    GROUP BY s.name
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching ticket counts:', err.message);
      res.status(500).json({ message: 'Error fetching ticket counts.' });
    } else {
      const counts = rows.reduce((acc, row) => {
        acc[row.name] = row.count;
        return acc;
      }, {});
      res.json(counts);
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

const validateId = (res, id, fieldName) => {
  if (id !== undefined && id !== null && isNaN(id)) {
    res.status(400).json({ message: `Invalid ${fieldName} value.` });
    return false;
  }
  return true;
};

app.post('/tickets', authenticateToken, isAdmin, (req, res) => {
  const { department_id, category_id, subcategory_id, user_id, asset_id, pc_part_id, description, resolution, status_id, technician_id } = req.body;
  
  // Validate required fields
  if (!department_id || !category_id || !status_id) {
    return res.status(400).json({ message: 'Department, category and status are required.' });
  }
  
  // Validate IDs if provided
  if (!validateId(res, technician_id, 'technician_id')) return;
  if (!validateId(res, user_id, 'user_id')) return;
  if (!validateId(res, asset_id, 'asset_id')) return;
  if (!validateId(res, pc_part_id, 'pc_part_id')) return;
  if (!validateId(res, subcategory_id, 'subcategory_id')) return;
  if (!validateId(res, status_id, 'status_id')) return;
  
  const query = `
    INSERT INTO tickets (department_id, category_id, subcategory_id, user_id, asset_id, pc_part_id, description, resolution, status_id, technician_id)
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
    status_id,
    technician_id || null
  ];
  
  db.run(query, values, function(err) {
    if (err) {
      console.error('Error creating ticket:', err.message);
      return res.status(500).json({ message: 'Error creating ticket.' });
    } else {
      const ticketId = this.lastID;
      
      // Create notifications
      // 1. Notify the ticket creator (faculty/staff)
      if (user_id) {
        createNotification(user_id, ticketId, 
          `Your ticket #${ticketId} has been created.`, 
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
      
      return res.status(201).json({ 
        message: 'Ticket created successfully.', 
        ticketId: ticketId
      });
    }
  });
});

const getCurrentTicket = (ticketId) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM tickets WHERE id = ?', [ticketId], (err, row) => {
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

app.put('/tickets/:id', authenticateToken, canUpdateTicket, async (req, res) => {
  const { department_id, category_id, subcategory_id, user_id, asset_id, pc_part_id, description, resolution, status_id, technician_id } = req.body;
  const ticketId = req.params.id;

  try {
    const currentTicket = await getCurrentTicket(ticketId);

    // Validate IDs if provided
    if (!validateId(res, technician_id, 'technician_id')) return;
    if (!validateId(res, user_id, 'user_id')) return;
    if (!validateId(res, asset_id, 'asset_id')) return;
    if (!validateId(res, pc_part_id, 'pc_part_id')) return;
    if (!validateId(res, subcategory_id, 'subcategory_id')) return;
    if (!validateId(res, department_id, 'department_id')) return;
    if (!validateId(res, category_id, 'category_id')) return;
    if (!validateId(res, status_id, 'status_id')) return;
    
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
    
    if (status_id !== undefined) {
      fields.push('status_id = ?');
      values.push(status_id);
    }
    
    if (technician_id !== undefined) {
      fields.push('technician_id = ?');
      values.push(technician_id);
    }
    
    // Always update the updated_at timestamp
    fields.push('updated_at = CURRENT_TIMESTAMP');
    
    if (fields.length === 1) { // Only updated_at
      return res.status(400).json({ message: 'No fields to update.' });
    }
    
    const query = `UPDATE tickets SET ${fields.join(', ')} WHERE id = ?`;
    values.push(ticketId);
    
    db.run(query, values, function(err) {
      if (err) {
        console.error('Error updating ticket:', err.message);
        return res.status(500).json({ message: 'Error updating ticket.' });
      } else if (this.changes === 0) {
        return res.status(404).json({ message: 'Ticket not found.' });
      } else {
        // NOTIFICATION LOGIC
        // Status change
        if (status_id !== undefined && status_id !== currentTicket.status_id) {
          db.get('SELECT name FROM statuses WHERE id = ?', [status_id], (err, status) => {
            if (err) return;
            const statusName = status ? status.name : 'updated';
            const message = `Status of your ticket #${ticketId} has been updated to ${statusName}.`;
            if (currentTicket.user_id) {
              createNotification(currentTicket.user_id, ticketId, message, (err) => {
                if (err) console.error(`Failed to notify user ${currentTicket.user_id}:`, err.message);
              });
            }
          });
        }

        // Technician change
        if (technician_id !== undefined && technician_id !== currentTicket.technician_id) {
          if (currentTicket.technician_id) {
            const message = `You have been unassigned from ticket #${ticketId}.`;
            createNotification(currentTicket.technician_id, ticketId, message, (err) => {
              if (err) console.error(`Failed to notify user ${currentTicket.technician_id}:`, err.message);
            });
          }
          if (technician_id) {
            const message = `You have been assigned to ticket #${ticketId}.`;
            createNotification(technician_id, ticketId, message, (err) => {
              if (err) console.error(`Failed to notify user ${technician_id}:`, err.message);
            });
          }
        }

        return res.json({ message: 'Ticket updated successfully.' });
      }
    });
  } catch (error) {
    if (error.message === 'Ticket not found') {
      return res.status(404).json({ message: 'Ticket not found.' });
    } else {
      console.error('Error updating ticket:', error.message);
      return res.status(500).json({ message: 'Error updating ticket.' });
    }
  }
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
