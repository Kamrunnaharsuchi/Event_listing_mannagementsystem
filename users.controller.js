import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const filePath = path.join(process.cwd(), 'src/data', 'users.json');

const getUsers = () => {
  try {
    if (!fs.existsSync(filePath)) {
      const dirPath = path.dirname(filePath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      fs.writeFileSync(filePath, JSON.stringify([], null, 2));
      return [];
    }

    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading users file:', error);
    return [];
  }
};

const saveUsers = (users) => {
  try {
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing users file:', error);
    return false;
  }
};

export const userController = {
  getAllUsers: (req, res) => {
    try {
      const users = getUsers();

      const sanitizedUsers = users.map((user) => ({
        id: user.id,
        email: user.email,
        phone: user.phone,
      }));

      return res.status(200).json(sanitizedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Get a single user by ID
  getUserById: (req, res) => {
    try {
      const { id } = req.params;
      const users = getUsers();

      const user = users.find((user) => user.id === id);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Return user data without password
      const { pwd, ...sanitizedUser } = user;

      return res.status(200).json(sanitizedUser);
    } catch (error) {
      console.error('Error fetching user:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Create a new user
  createUser: async (req, res) => {
    try {
      const { email, phone, password } = req.body;

      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }

      // Get existing users
      const users = getUsers();

      // Check if user with this email already exists
      const existingUser = users.find((user) => user.email === email);
      if (existingUser) {
        return res
          .status(409)
          .json({ message: 'User with this email already exists' });
      }
      const pwd = password || '1234';

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(pwd, salt);

      // Create new user
      const newUser = {
        id: uuidv4(),
        email,
        phone: phone || '',
        pwd: hashedPassword,
        createdAt: new Date().toISOString(),
      };

      // Add to users array and save
      users.push(newUser);

      if (saveUsers(users)) {
        const { pwd, ...sanitizedUser } = newUser;
        return res.status(201).json(sanitizedUser);
      } else {
        return res.status(500).json({ message: 'Failed to save user' });
      }
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Update an existing user
  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { email, phone, password } = req.body;

      // Get existing users
      const users = getUsers();

      // Find the user to update
      const userIndex = users.findIndex((user) => user.id === id);

      if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if email is valid
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ message: 'Invalid email format' });
        }

        // Check if another user already has this email
        const emailExists = users.some(
          (user, index) => user.email === email && index !== userIndex,
        );

        if (emailExists) {
          return res.status(409).json({ message: 'Email already in use' });
        }
      }

      // Update user
      const updatedUser = {
        ...users[userIndex],
        email: email || users[userIndex].email,
        phone: phone !== undefined ? phone : users[userIndex].phone,
        updatedAt: new Date().toISOString(),
      };

      // Update password if provided
      if (password) {
        const salt = await bcrypt.genSalt(10);
        updatedUser.pwd = await bcrypt.hash(password, salt);
      }

      // Save updated user
      users[userIndex] = updatedUser;

      if (saveUsers(users)) {
        // Return user data without password
        const { pwd, ...sanitizedUser } = updatedUser;
        return res.status(200).json(sanitizedUser);
      } else {
        return res.status(500).json({ message: 'Failed to update user' });
      }
    } catch (error) {
      console.error('Error updating user:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Delete a user
  deleteUser: (req, res) => {
    try {
      const { id } = req.params;

      // Get existing users
      const users = getUsers();

      // Find the user to delete
      const userIndex = users.findIndex((user) => user.id === id);

      if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Remove user from array
      users.splice(userIndex, 1);

      if (saveUsers(users)) {
        return res.status(200).json({ message: 'User deleted successfully' });
      } else {
        return res.status(500).json({ message: 'Failed to delete user' });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  // User authentication
  loginUser: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ message: 'Email and password are required' });
      }

      const users = getUsers();

      const user = users.find((user) => user.email === email);

      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Compare passwords
      const isMatch = await bcrypt.compare(password, user.pwd);

      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const { pwd, ...sanitizedUser } = user;
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        user: sanitizedUser,
      });
    } catch (error) {
      console.error('Error authenticating user:', error);
      return res
        .status(500)
        .json({ success: false, message: 'Internal server error' });
    }
  },

  // Migrate old data and hash passwords
  migrateUsers: async (req, res) => {
    try {
      const users = getUsers();
      let modified = false;

      for (let i = 0; i < users.length; i++) {
        if (!users[i].id) {
          users[i].id = uuidv4();
          modified = true;
        }

        if (users[i].pwd && users[i].pwd.length < 30) {
          // It's likely not hashed, so hash it
          const salt = await bcrypt.genSalt(10);
          users[i].pwd = await bcrypt.hash(users[i].pwd, salt);
          modified = true;
        }
      }

      // Save if modified
      if (modified) {
        saveUsers(users);
        return res.status(200).json({ message: 'Users migrated successfully' });
      } else {
        return res.status(200).json({ message: 'No migration needed' });
      }
    } catch (error) {
      console.error('Error migrating users:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },
};

export default userController;
