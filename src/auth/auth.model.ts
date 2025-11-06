// src/auth/auth.model.ts

/**
 * Interface representing the data structure for a User in the database.
 */
export interface User {
    id: number;
    name: string;
    email: string;
    passwordHash: string; // Stored hashed password
    role: 'user' | 'admin';
  }
  
  // In-memory array to simulate a database table.
  export const mockUsers: User[] = [
    { 
      id: 100, 
      name: "Admin Jane", 
      email: "admin@scentia.com", 
      passwordHash: "$2b$10$TvrT7EfrNHct5KWT4W.xE.36cJy7fmNDMUw6ZpgRYt3yQXuuK.lai", 
      role: "admin" 
    },
  ];
  
  
  /**
   * Mock function to find a user by email.
   */
  export const findUserByEmail = async (email: string): Promise<User | undefined> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return mockUsers.find(user => user.email === email);
  };
  
  /**
   * Mock function to save a new user to the database.
   */
  export const saveUser = async (user: Omit<User, 'id' | 'role'> & { id?: number }): Promise<User> => {
    const newUser: User = {
        ...user,
        id: mockUsers.length + 1,
        role: 'user', // Default new users to 'user'
    };
    mockUsers.push(newUser);
    return newUser;
};