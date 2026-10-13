const { Client } = require('pg');
require('dotenv').config();

async function checkData() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  
  try {
    const res = await client.query('SELECT * FROM "RoomMapping"');
    console.log(`Found ${res.rows.length} RoomMapping records.`);
    console.log("Mappings:", res.rows);
    
    if (res.rows.length > 0) {
      const configRes = await client.query('SELECT * FROM "ChannelConfig"');
      console.log(`Found ${configRes.rows.length} ChannelConfig records.`);
      console.log("Configs:", configRes.rows);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

checkData();
