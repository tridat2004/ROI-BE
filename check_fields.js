const { Client } = require('pg');
const fs = require('fs');

async function checkFieldDefs() {
  const client = new Client({
    host: 'localhost',
    port: 5433,
    user: 'postgres',
    password: 'admin',
    database: 'roi_calculation',
  });

  try {
    await client.connect();
    const res = await client.query('SELECT id, code, display_name, min_value, max_value FROM roi_field_definitions ORDER BY id');
    let output = 'ID | Code | Display Name | Min | Max\n';
    output += '---|------|--------------|-----|----\n';
    res.rows.forEach(row => {
      output += `${row.id} | ${row.code} | ${row.display_name} | ${row.min_value} | ${row.max_value}\n`;
    });
    fs.writeFileSync('d:\\JOB\\ROI_Calculation-Backend\\fields_output_v2.txt', output);
    console.log('Saved to fields_output_v2.txt');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

checkFieldDefs();
