import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

export let supabase;
export let isMockDb = false;

class MockSupabaseQueryBuilder {
  constructor(table) {
    this.table = table;
    this.filters = [];
  }

  select(columns = '*') {
    return this;
  }

  insert(data) {
    return Promise.resolve({ data: Array.isArray(data) ? data : [data], error: null });
  }

  update(data) {
    return Promise.resolve({ data: [data], error: null });
  }

  delete() {
    return Promise.resolve({ data: [], error: null });
  }

  eq(column, value) {
    this.filters.push({ column, value });
    return this;
  }

  match(query_embedding, layers, count) {
    return Promise.resolve({ data: [], error: null });
  }

  async then(onfulfilled) {
    // Basic mock response to avoid breaking client routing chains
    const mockData = [];
    return onfulfilled({ data: mockData, error: null });
  }
}

class MockSupabaseClient {
  auth = {
    signUp: (credentials) => Promise.resolve({ data: { user: { id: 'mock-user-id', email: credentials.email } }, error: null }),
    signInWithOtp: (credentials) => Promise.resolve({ data: { message: 'Mock OTP Sent' }, error: null }),
    verifyOtp: (credentials) => Promise.resolve({ data: { session: { access_token: 'mock-token', user: { id: 'mock-user-id' } } }, error: null }),
    getUser: () => Promise.resolve({ data: { user: { id: 'mock-user-id', email: 'dev@nexo.ai' } }, error: null }),
  };

  from(table) {
    return new MockSupabaseQueryBuilder(table);
  }

  rpc(fn, args) {
    if (fn === 'match_memories' || fn === 'match_nexo_memory') {
      return Promise.resolve({ data: [], error: null });
    }
    return Promise.resolve({ data: {}, error: null });
  }
}

if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false,
      },
    });
    console.log('[Database] Supabase connected successfully.');
  } catch (error) {
    console.error('[Database] Failed to initialize Supabase client:', error.message);
    console.log('[Database] Booting up in Mock DB mode...');
    supabase = new MockSupabaseClient();
    isMockDb = true;
  }
} else {
  console.log('[Database] SUPABASE_URL or keys not defined. Booting up in Mock DB mode...');
  supabase = new MockSupabaseClient();
  isMockDb = true;
}
