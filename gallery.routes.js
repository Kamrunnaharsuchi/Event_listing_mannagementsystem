import { Router } from 'express';
import upload from '../middlewares/multerMeddleware.js';
import {
  deleteGallery,
  fetchAllGallery,
  fetchSingleGallery,
  insertGallery,
  updateGallery,
} from '../controllers/gallery.controller.js';

const galleryRoute = Router();

galleryRoute
  .route('/')
  .post(upload.single('imageFile'), insertGallery)
  .get(fetchAllGallery);

galleryRoute
  .route('/:id')
  .get(fetchSingleGallery)
  .delete(deleteGallery)
  .put(upload.single('imageFile'), updateGallery);

export default galleryRoute;
