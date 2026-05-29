import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'node:crypto';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

export let supabase;
export let isMockDb = false;

// Shared in-memory data store for offline development
export const MOCK_STORAGE = {
  users: [
    { id: 'mock-user-id', email: 'dev@nexo.ai', full_name: 'Developer Mode', avatar_url: '' }
  ],
  projects: [],
  files: [],
  messages: [],
  deployments: [],
  memories: [],
  agents: [],
  logs: [],
  conversations: [],
  attachments: [],
  chat_branches: []
};

class MockSupabaseQueryBuilder {
  constructor(table) {
    this.table = table;
    this.filters = [];
    this.isSingle = false;
    this.orderBy = null;
  }

  select(columns = '*') {
    return this;
  }

  insert(data) {
    const list = Array.isArray(data) ? data : [data];
    if (!MOCK_STORAGE[this.table]) {
      MOCK_STORAGE[this.table] = [];
    }
    const inserted = list.map(item => {
      const record = {
        id: item.id || crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...item
      };
      MOCK_STORAGE[this.table].push(record);
      return record;
    });

    const res = Array.isArray(data) ? inserted : inserted[0];
    const promise = Promise.resolve({ data: res, error: null });
    // Allow chaining .select() and .single() after insert
    promise.select = () => promise;
    promise.single = () => Promise.resolve({ data: inserted[0], error: null });
    return promise;
  }

  upsert(data, options = {}) {
    const list = Array.isArray(data) ? data : [data];
    if (!MOCK_STORAGE[this.table]) {
      MOCK_STORAGE[this.table] = [];
    }
    const tableList = MOCK_STORAGE[this.table];
    const upserted = list.map(item => {
      let existingIndex = -1;
      if (item.id) {
        existingIndex = tableList.findIndex(x => x.id === item.id);
      } else if (this.table === 'agents' && item.project_id) {
        existingIndex = tableList.findIndex(x => x.project_id === item.project_id);
      }

      const record = {
        created_at: new Date().toISOString(),
        ...item,
        updated_at: new Date().toISOString()
      };

      if (existingIndex > -1) {
        record.created_at = tableList[existingIndex].created_at || record.created_at;
        tableList[existingIndex] = { ...tableList[existingIndex], ...record };
      } else {
        if (!record.id) {
          record.id = crypto.randomUUID();
        }
        tableList.push(record);
      }
      return record;
    });

    const res = Array.isArray(data) ? upserted : upserted[0];
    const promise = Promise.resolve({ data: res, error: null });
    promise.select = () => promise;
    promise.single = () => Promise.resolve({ data: upserted[0], error: null });
    return promise;
  }

  update(data) {
    const tableList = MOCK_STORAGE[this.table] || [];
    const filtered = tableList.filter(item => {
      return this.filters.every(f => {
        if (f.type === 'eq') return item[f.column] === f.value;
        return true;
      });
    });
    filtered.forEach(item => {
      Object.assign(item, data, { updated_at: new Date().toISOString() });
    });
    const res = this.isSingle ? filtered[0] : filtered;
    const promise = Promise.resolve({ data: res, error: null });
    promise.select = () => promise;
    promise.single = () => Promise.resolve({ data: filtered[0] || null, error: null });
    return promise;
  }

  delete() {
    const tableList = MOCK_STORAGE[this.table] || [];
    const toKeep = [];
    const toDelete = [];
    tableList.forEach(item => {
      const match = this.filters.every(f => {
        if (f.type === 'eq') return item[f.column] === f.value;
        return true;
      });
      if (match) {
        toDelete.push(item);
      } else {
        toKeep.push(item);
      }
    });
    MOCK_STORAGE[this.table] = toKeep;
    const promise = Promise.resolve({ data: toDelete, error: null });
    promise.select = () => promise;
    promise.single = () => Promise.resolve({ data: toDelete[0] || null, error: null });
    return promise;
  }

  eq(column, value) {
    this.filters.push({ type: 'eq', column, value });
    return this;
  }

  order(column, options = {}) {
    this.orderBy = { column, ascending: options.ascending !== false };
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  match(query_embedding, layers, count) {
    return Promise.resolve({ data: [], error: null });
  }

  async then(onfulfilled, onrejected) {
    try {
      const tableList = MOCK_STORAGE[this.table] || [];
      let filtered = tableList.filter(item => {
        return this.filters.every(f => {
          if (f.type === 'eq') return item[f.column] === f.value;
          return true;
        });
      });
      if (this.orderBy) {
        const { column, ascending } = this.orderBy;
        filtered.sort((a, b) => {
          const valA = a[column];
          const valB = b[column];
          if (valA < valB) return ascending ? -1 : 1;
          if (valA > valB) return ascending ? 1 : -1;
          return 0;
        });
      }
      let res;
      if (this.isSingle) {
        res = filtered[0];
        if (!res) {
          return onfulfilled({ data: null, error: { message: 'Row not found' } });
        }
      } else {
        res = filtered;
      }
      return onfulfilled({ data: res, error: null });
    } catch (err) {
      if (onrejected) return onrejected(err);
      return onfulfilled({ data: null, error: { message: err.message } });
    }
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

