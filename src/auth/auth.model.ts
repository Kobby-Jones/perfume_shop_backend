// src/auth/auth.model.ts

/**
 * Interface representing the data structure for a User in the database.
 */
export interface User {
    id: number;
    name: string;
    email: string;
    passwordHash: string; // Stored hashed password
  }
  
  // In-memory array to simulate a database table.
  const mockUsers: User[] = [];
  
  /**
   * Mock function to find a user by email.
   */
  export const findUserByEmail = async (email: string): Promise<User | undefined> => {
    // Simulate asynchronous database lookup
    await new Promise(resolve => setTimeout(resolve, 100));
    return mockUsers.find(user => user.email === email);
  };
  
  /**
   * Mock function to save a new user to the database.
   */
  export const saveUser = async (user: Omit<User, 'id'> & { id?: number }): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const newUser: User = {
      ...user,
      id: mockUsers.length + 1, // Simple auto-increment ID
    } as User;
    mockUsers.push(newUser);
    return newUser;
  };