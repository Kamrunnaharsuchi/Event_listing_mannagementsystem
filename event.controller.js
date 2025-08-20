import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { extractThumbnail } from '../utils/extractThumbnail.js';

const filePath = path.join(process.cwd(), 'src/data', 'events.json');
const catFilePath = path.join(process.cwd(), 'src/data', 'categories.json');
const galleryFilePath = path.join(process.cwd(), 'src/data', 'gallery.json');
const userFilePath = path.join(process.cwd(), 'src/data', 'users.json');

const uploadImage = async (req, res) => {
  try {
    const imageFile = req.file;
    if (!imageFile) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded.',
      });
    }

    res.status(200).json({
      success: true,
      imageUrl: `${process.env.BACKEND_SITE_URL}api/uploads/${imageFile.filename}`,
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const insertEvent = async (req, res) => {
  try {
    const { event_name, event_category, event_type, event_date, event_desc } =
      req.body;

    if (!event_name || !event_desc) {
      return res
        .status(400)
        .json({ message: 'Title and description are required.' });
    }

    const thumbnail = extractThumbnail(event_desc);

    const newEvent = {
      id: uuidv4(),
      thumbnail,
      title: event_name,
      description: event_desc,
      category: event_category,
      type: event_type,
      date: event_date,
    };

    const dataDir = path.dirname(filePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    let eventData = [];
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      eventData = JSON.parse(fileContent);
    }

    eventData.push(newEvent);

    fs.writeFileSync(filePath, JSON.stringify(eventData, null, 2));

    res.status(201).json({
      success: true,
      message: 'Event inserted successfully.',
      data: newEvent,
    });
  } catch (error) {
    console.error('Error inserting event:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const fetchAllEvents = (req, res) => {
  try {
    if (!fs.existsSync(filePath)) {
      return res.status(200).json({ success: true, data: [] });
    }

    const eventData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const categoryData = fs.existsSync(catFilePath)
      ? JSON.parse(fs.readFileSync(catFilePath, 'utf-8'))
      : [];

    // Reverse the array to show latest posts first
    const reversedEvents = [...eventData].reverse();

    const eventsWithCategoryName = reversedEvents.map((event) => {
      const category = categoryData.find((cat) => cat.id === event.category);
      return {
        ...event,
        category_name: category ? category.name : 'Unknown',
      };
    });

    res.status(200).json({ success: true, data: eventsWithCategoryName });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const fetchSingleEvent = (req, res) => {
  try {
    const { id } = req.params;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'No events found.' });
    }

    const eventData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const categoryData = fs.existsSync(catFilePath)
      ? JSON.parse(fs.readFileSync(catFilePath, 'utf-8'))
      : [];

    const event = eventData.find((e) => e.id === id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const category = categoryData.find((cat) => cat.id === event.category);
    const eventWithCategory = {
      ...event,
      category_name: category ? category.name : 'Unknown',
    };

    // Top 5 upcoming events - reverse to show latest first
    const upcomingEventsRaw = [...eventData]
      .filter((e) => e.type === 'Up Coming' && e.id !== id)
      .reverse()
      .slice(0, 5);

    const upcomingEvents = upcomingEventsRaw.map((event) => {
      const cat = categoryData.find((c) => c.id === event.category);
      return {
        ...event,
        category_name: cat ? cat.name : 'Unknown',
      };
    });

    // Top 5 most recent events - reverse to show latest first
    const mostRecentEventsRaw = [...eventData]
      .filter((e) => e.id !== id)
      .reverse()
      .slice(0, 5);

    const mostRecentEvents = mostRecentEventsRaw.map((event) => {
      const cat = categoryData.find((c) => c.id === event.category);
      return {
        ...event,
        category_name: cat ? cat.name : 'Unknown',
      };
    });

    // 3 related events by same category, excluding current one, randomly
    const relatedEventsPool = eventData.filter(
      (e) => e.category === event.category && e.id !== id,
    );

    const shuffled = relatedEventsPool.sort(() => 0.5 - Math.random());
    const relatedEvents = shuffled.slice(0, 3).map((event) => {
      const cat = categoryData.find((c) => c.id === event.category);
      return {
        ...event,
        category_name: cat ? cat.name : 'Unknown',
      };
    });

    res.status(200).json({
      success: true,
      data: {
        main: eventWithCategory,
        upcomingEvents,
        mostRecentEvents,
        relatedEvents,
      },
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateEvent = (req, res) => {
  try {
    const { id } = req.params;
    const { event_name, event_category, event_type, event_date, event_desc } =
      req.body;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'No events found.' });
    }

    const eventData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const eventIndex = eventData.findIndex((e) => e.id === id);

    if (eventIndex === -1) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const updatedEvent = {
      ...eventData[eventIndex],
      title: event_name || eventData[eventIndex].title,
      description: event_desc || eventData[eventIndex].description,
      category: event_category || eventData[eventIndex].category,
      type: event_type || eventData[eventIndex].type,
      date: event_date || eventData[eventIndex].date,
      thumbnail: event_desc
        ? extractThumbnail(event_desc)
        : eventData[eventIndex].thumbnail,
    };

    eventData[eventIndex] = updatedEvent;

    fs.writeFileSync(filePath, JSON.stringify(eventData, null, 2));

    res.status(200).json({
      success: true,
      message: 'Event updated successfully.',
      data: updatedEvent,
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteEvent = (req, res) => {
  try {
    const { id } = req.params;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'No events found.' });
    }

    const eventData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const filteredEvents = eventData.filter((e) => e.id !== id);

    if (eventData.length === filteredEvents.length) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    fs.writeFileSync(filePath, JSON.stringify(filteredEvents, null, 2));

    res
      .status(200)
      .json({ success: true, message: 'Event deleted successfully.' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const fetchSummery = (req, res) => {
  try {
    const eventData = fs.existsSync(filePath)
      ? JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      : [];

    const categoryData = fs.existsSync(catFilePath)
      ? JSON.parse(fs.readFileSync(catFilePath, 'utf-8'))
      : [];

    const galleryData = fs.existsSync(galleryFilePath)
      ? JSON.parse(fs.readFileSync(galleryFilePath, 'utf-8'))
      : [];
    const userData = fs.existsSync(userFilePath)
      ? JSON.parse(fs.readFileSync(userFilePath, 'utf-8'))
      : [];

    const totalEvents = eventData.length;
    const totalCategories = categoryData.length;
    const totalGalleryItems = galleryData.length;
    const totalUsers = userData.length;

    // Group events by category
    const eventsByCategory = {};
    eventData.forEach((event) => {
      const category = categoryData.find((cat) => cat.id === event.category);
      const categoryName = category ? category.name : 'Unknown';
      eventsByCategory[categoryName] =
        (eventsByCategory[categoryName] || 0) + 1;
    });

    // Group events by type
    const eventsByType = {};
    eventData.forEach((event) => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
    });

    const today = new Date();

    // Reverse upcoming events to show latest first
    const upcomingEvents = [...eventData]
      .filter((event) => new Date(event.date) >= today)
      .reverse()
      .slice(0, 5);

    // Reverse recent events to show latest first
    const mostRecentEvents = [...eventData]
      .reverse()
      .slice(0, 5);

    res.status(200).json({
      success: true,
      data: {
        totalEvents,
        totalCategories,
        totalUsers,
        totalGalleryItems,
        eventsByCategory,
        eventsByType,
        upcomingEvents,
        mostRecentEvents,
      },
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const fetchAllEventsOrderedById = (req, res) => {
  try {
    if (!fs.existsSync(filePath)) {
      return res.status(200).json({ success: true, data: [] });
    }

    const eventData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const categoryData = fs.existsSync(catFilePath)
      ? JSON.parse(fs.readFileSync(catFilePath, 'utf-8'))
      : [];

    const filteredEvents = eventData.filter(
      (event) => event.type !== 'Up Coming',
    );

    // Reverse the filtered events to show latest first
    const reversedEvents = [...filteredEvents].reverse();

    const eventsWithCategoryName = reversedEvents.map((event) => {
      const category = categoryData.find((cat) => cat.id === event.category);
      return {
        ...event,
        category_name: category ? category.name : 'Unknown',
      };
    });

    res.status(200).json({ success: true, data: eventsWithCategoryName });
  } catch (error) {
    console.error('Error fetching events ordered by date:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const fetchEventsByCategory = (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Category ID is required.',
      });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(200).json({ success: true, data: [] });
    }

    const eventData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const categoryData = fs.existsSync(catFilePath)
      ? JSON.parse(fs.readFileSync(catFilePath, 'utf-8'))
      : [];

    const category = categoryData.find((cat) => cat.id === categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    // Filter events by the specified category and reverse to show latest first
    const filteredEvents = eventData
      .filter((event) => event.category === categoryId)
      .reverse();

    // Add category name to each event
    const eventsWithCategoryName = filteredEvents.map((event) => {
      return {
        ...event,
        category_name: category.name,
      };
    });

    res.status(200).json({
      success: true,
      data: eventsWithCategoryName,
      category: category,
    });
  } catch (error) {
    console.error('Error fetching events by category:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const fetchEventsByType = (req, res) => {
  try {
    const { type } = req.params;

    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Event type is required.',
      });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(200).json({ success: true, data: [] });
    }

    const eventData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const categoryData = fs.existsSync(catFilePath)
      ? JSON.parse(fs.readFileSync(catFilePath, 'utf-8'))
      : [];

    // Filter events by the specified type and reverse to show latest first
    const filteredEvents = eventData
      .filter((event) => event.type === type)
      .reverse();

    if (filteredEvents.length === 0) {
      return res.status(200).json({
        success: true,
        message: `No events found with type: ${type}`,
        data: [],
      });
    }

    // Add category name to each event
    const eventsWithCategoryName = filteredEvents.map((event) => {
      const category = categoryData.find((cat) => cat.id === event.category);
      return {
        ...event,
        category_name: category ? category.name : 'Unknown',
      };
    });

    res.status(200).json({
      success: true,
      data: eventsWithCategoryName,
      type: type,
    });
  } catch (error) {
    console.error('Error fetching events by type:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const searchEventsByTitle = (req, res) => {
  try {
    const { title } = req.query;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Search title is required.',
      });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(200).json({ success: true, data: [] });
    }

    const eventData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const categoryData = fs.existsSync(catFilePath)
      ? JSON.parse(fs.readFileSync(catFilePath, 'utf-8'))
      : [];

    const searchTerm = title.toLowerCase();
    
    // Filter events by title and reverse to show latest first
    const filteredEvents = eventData
      .filter((event) => event.title.toLowerCase().includes(searchTerm))
      .reverse();

    const eventsWithCategoryName = filteredEvents.map((event) => {
      const category = categoryData.find((cat) => cat.id === event.category);
      return {
        ...event,
        category_name: category ? category.name : 'Unknown',
      };
    });

    res.status(200).json({
      success: true,
      data: eventsWithCategoryName,
    });
  } catch (error) {
    console.error('Error searching events by title:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export {
  uploadImage,
  insertEvent,
  searchEventsByTitle,
  fetchAllEvents,
  fetchSingleEvent,
  updateEvent,
  deleteEvent,
  fetchSummery,
  fetchAllEventsOrderedById,
  fetchEventsByCategory,
  fetchEventsByType,
};