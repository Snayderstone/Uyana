export type CreateUserInput = {
  email: string;
  full_name?: string;
  password: string;        // política fuerte
  roles: string[];         // ['investigador'] o ['admin']
};

export const userRepository = {
  async createUserAsAdmin(input: CreateUserInput) {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async assignRoles(user_id: string, roles: string[]) {
    const res = await fetch('/api/users/roles', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ user_id, roles })
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};
