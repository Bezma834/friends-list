async function run() {
  console.log('Altering friends table...');
  try {
    const response = await fetch('http://localhost:8080/v1/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hasura-Admin-Secret': 'myadminsecretkey'
      },
      body: JSON.stringify({
        type: 'run_sql',
        args: {
          source: 'default',
          sql: `
            ALTER TABLE friends ADD COLUMN IF NOT EXISTS friendship_type VARCHAR(50) DEFAULT 'friend';
            ALTER TABLE friends ADD COLUMN IF NOT EXISTS gender VARCHAR(50) DEFAULT 'female';
          `
        }
      })
    });

    const data = await response.json();
    console.log('Response Status:', response.status);
    console.log('Response Body:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error sending request:', err);
  }
}

run();
