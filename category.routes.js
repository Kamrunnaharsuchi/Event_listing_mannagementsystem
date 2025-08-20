import { Router } from 'express';
import upload from '../middlewares/multerMeddleware.js';
import {
  deleteCategory,
  fetchAllCategory,
  insertCategory,
  updateCategory,
} from '../controllers/category.controller.js';

const catRoute = Router();

catRoute
  .route('/')
  .get(fetchAllCategory)
  .post(upload.single('categoryImg'), insertCategory);

catRoute.route('/:id').put(upload.single('editcategoryImg'),updateCategory).delete(deleteCategory);

export default catRoute;
