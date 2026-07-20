const SUPABASE_URL = 'https://dcmbfeammfoagarfejsf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_diY2UT6oSYW_7sgNzNE-UA_tY0SQz1s';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function saveScore({ codename, totalTime, roomsCompleted, hintsUsed, commandsUsed }) {
  const { error } = await sb.from('scores').insert({
    codename,
    total_time:      totalTime,
    rooms_completed: roomsCompleted,
    hints_used:      hintsUsed,
    commands_used:   JSON.stringify(commandsUsed),
    completed_at:    new Date().toISOString()
  });
  return !error;
}

async function getLeaderboard() {
  const { data } = await sb
    .from('scores')
    .select('codename, total_time, rooms_completed')
    .order('rooms_completed', { ascending: false })
    .order('total_time',      { ascending: true })
    .limit(10);
  return data || [];
}
