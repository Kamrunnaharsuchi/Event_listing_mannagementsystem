import { Router } from 'express';
import upload from '../middlewares/multerMeddleware.js';
import {
  deleteEvent,
  fetchAllEvents,
  fetchAllEventsOrderedById,
  fetchEventsByCategory,
  fetchEventsByType,
  fetchSingleEvent,
  fetchSummery,
  insertEvent,
  searchEventsByTitle,
  updateEvent,
  uploadImage,
} from '../controllers/event.controller.js';

const eventRoute = Router();

eventRoute
  .route('/upload-event-image')
  .post(upload.single('image'), uploadImage);

eventRoute.route('/').post(insertEvent).get(fetchAllEvents);
eventRoute.route('/summery').get(fetchSummery);
eventRoute.route('/events-by-category/:categoryId').get(fetchEventsByCategory);
eventRoute.route('/latest').get(fetchAllEventsOrderedById);
eventRoute.route('/type/:type').get(fetchEventsByType);
eventRoute.route('/search').get(searchEventsByTitle);
eventRoute
  .route('/:id')
  .put(updateEvent)
  .get(fetchSingleEvent)
  .delete(deleteEvent);



export default eventRoute;
