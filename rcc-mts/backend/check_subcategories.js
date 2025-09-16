const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

console.log('Checking sub-categories in database:');

db.all('SELECT * FROM sub_categories', [], (err, rows) => {
  if (err) {
    console.error('Error fetching sub-categories:', err.message);
  } else {
    console.log('Sub-categories found:');
    rows.forEach(row => {
      console.log(`ID: ${row.id}, Name: "${row.name}", Category ID: ${row.category_id}`);
    });
  }
  
  console.log('\nChecking assets and their sub-categories:');
  
  db.all(`
    SELECT a.id, a.item_code, a.sub_category_id, s.name as sub_category_name
    FROM assets a
    LEFT JOIN sub_categories s ON a.sub_category_id = s.id
  `, [], (err, rows) => {
    if (err) {
      console.error('Error fetching assets:', err.message);
    } else {
      console.log('Assets found:');
      rows.forEach(row => {
        console.log(`ID: ${row.id}, Item Code: ${row.item_code}, Sub-category ID: ${row.sub_category_id}, Sub-category Name: "${row.sub_category_name}"`);
      });
    }
    
    db.close();
  });
});