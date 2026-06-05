const makeRequest = async (type, args) => {
  const response = await fetch('http://localhost:8080/v1/metadata', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Hasura-Admin-Secret': 'myadminsecretkey'
    },
    body: JSON.stringify({ type, args })
  });
  return { status: response.status, data: await response.json() };
};

async function run() {
  console.log('Updating Hasura permissions for friendship_type and gender...');

  // 1. Drop existing insert permission (ignore errors if it doesn't exist)
  console.log('Dropping old insert permission...');
  await makeRequest('pg_drop_insert_permission', {
    source: 'default',
    table: { name: 'friends', schema: 'public' },
    role: 'user'
  });

  // 2. Drop existing select permission
  console.log('Dropping old select permission...');
  await makeRequest('pg_drop_select_permission', {
    source: 'default',
    table: { name: 'friends', schema: 'public' },
    role: 'user'
  });

  // 3. Create new insert permission with new columns
  console.log('Creating new insert permission...');
  const insertRes = await makeRequest('pg_create_insert_permission', {
    source: 'default',
    table: { name: 'friends', schema: 'public' },
    role: 'user',
    permission: {
      check: {
        user_id: { _eq: 'X-Hasura-User-Id' }
      },
      columns: [
        'name',
        'email',
        'phone',
        'user_id',
        'friendship_type',
        'gender'
      ]
    }
  });
  console.log('Insert Perm Status:', insertRes.status, JSON.stringify(insertRes.data));

  // 4. Create new select permission with new columns
  console.log('Creating new select permission...');
  const selectRes = await makeRequest('pg_create_select_permission', {
    source: 'default',
    table: { name: 'friends', schema: 'public' },
    role: 'user',
    permission: {
      filter: {
        user_id: { _eq: 'X-Hasura-User-Id' }
      },
      columns: [
        'id',
        'name',
        'email',
        'phone',
        'created_at',
        'user_id',
        'friendship_type',
        'gender'
      ]
    }
  });
  console.log('Select Perm Status:', selectRes.status, JSON.stringify(selectRes.data));
}

run();
