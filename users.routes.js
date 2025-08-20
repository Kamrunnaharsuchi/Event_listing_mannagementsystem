import express from 'express';
import userController from '../controllers/users.controller.js';

const userRoute = express.Router();

userRoute.get('/', userController.getAllUsers);
userRoute.get('/:id', userController.getUserById);
userRoute.post('/', userController.createUser);
userRoute.put('/:id', userController.updateUser);
userRoute.delete('/:id', userController.deleteUser);

userRoute.post('/login', userController.loginUser);

userRoute.post('/migrate', userController.migrateUsers);

export default userRoute;