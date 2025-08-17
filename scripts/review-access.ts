import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(url, key);

async function listUsers() {
  const { data, error } = await supabase.from('user_profiles').select('user_id,email,role,panels,is_active');
  if (error) {
    console.error('Error fetching users', error);
    return;
  }
  console.table(data);
}

async function setActive(id: string, active: boolean) {
  const { error } = await supabase.from('user_profiles').update({ is_active: active }).eq('user_id', id);
  if (error) console.error('Update failed', error);
  else console.log('Updated', id, active);
}

const [,, cmd, id, action] = process.argv;
if (cmd === 'review' && id) {
  await setActive(id, action !== 'revoke');
} else {
  await listUsers();
}
