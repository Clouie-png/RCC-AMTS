const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

console.log('Checking pc_parts in database:');

db.all('SELECT * FROM pc_parts', [], (err, rows) => {
  if (err) {
    console.error('Error fetching pc_parts:', err.message);
  } else {
    console.log('PC Parts found:');
    rows.forEach(row => {
      console.log(`ID: ${row.id}, Name: "${row.part_name}", Asset Item Code: ${row.asset_item_code}`);
    });
  }
  
  db.close();
});
