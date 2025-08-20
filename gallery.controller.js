import fs from 'fs';
import path from 'path';

import { v4 as uuidv4 } from 'uuid';

const galleryFilePath = path.join(process.cwd(), 'src/data', 'gallery.json');

const insertGallery = async (req, res) => {
  try {
    const { categoryName, imageTitle } = req.body;
    const imageFile = req.file;

    if (!imageFile) {
      return res
        .status(400)
        .json({ success: false, message: 'No image file uploaded.' });
    }

    if (!categoryName) {
      return res
        .status(400)
        .json({ success: false, message: 'Category Name is required.' });
    }
    if (!imageTitle) {
      return res
        .status(400)
        .json({ success: false, message: 'Image title is required.' });
    }

    const newGalleryItem = {
      id: uuidv4(),
      image: imageFile.filename,
      imageTitle,
      categoryName,
    };

    const dataDir = path.dirname(galleryFilePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    let galleryData = [];
    if (fs.existsSync(galleryFilePath)) {
      const fileContent = fs.readFileSync(galleryFilePath, 'utf-8');
      galleryData = JSON.parse(fileContent);
    }
    galleryData.push(newGalleryItem);

    fs.writeFileSync(galleryFilePath, JSON.stringify(galleryData, null, 2));

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully.',
      data: newGalleryItem,
    });
  } catch (err) {
    console.error('Insert gallery error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const fetchAllGallery = async (req, res) => {
  try {
    const fileContent = fs.readFileSync(galleryFilePath, 'utf-8');
    const data = JSON.parse(fileContent);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateGallery = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryName, imageTitle } = req.body;
    const imageFile = req.file;

    if (!categoryName) {
      return res
        .status(400)
        .json({ success: false, message: 'Category Name is required.' });
    }
    if (!imageTitle) {
      return res
        .status(400)
        .json({ success: false, message: 'Image title is required.' });
    }

    // Read existing data
    let galleryData = [];
    if (fs.existsSync(galleryFilePath)) {
      const fileContent = fs.readFileSync(galleryFilePath, 'utf-8');
      galleryData = JSON.parse(fileContent);
    } else {
      return res.status(404).json({
        success: false,
        message: 'Gallery data not found.',
      });
    }

    // Find the gallery item by ID
    const galleryIndex = galleryData.findIndex((item) => item.id === id);
    if (galleryIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found.',
      });
    }

    const oldItem = galleryData[galleryIndex];
    let updatedItem = {
      ...oldItem,
      imageTitle,
      categoryName,
    };

    if (imageFile) {
      // Delete the old image if it exists
      const uploadsDir = path.join(process.cwd(), 'public/uploads');
      const oldImagePath = path.join(uploadsDir, oldItem.image);

      if (fs.existsSync(oldImagePath)) {
        try {
          fs.unlinkSync(oldImagePath);
        } catch (error) {
          console.error('Error deleting old image:', error);
        }
      }

      updatedItem.image = imageFile.filename;
    }

    galleryData[galleryIndex] = updatedItem;

    fs.writeFileSync(galleryFilePath, JSON.stringify(galleryData, null, 2));

    res.status(200).json({
      success: true,
      message: 'Gallery item updated successfully.',
      data: updatedItem,
    });
  } catch (err) {
    console.error('Update gallery error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
const fetchSingleGallery = async (req, res) => {
  try {
    const { id } = req.params;

    const fileContent = fs.readFileSync(galleryFilePath, 'utf-8');
    const data = JSON.parse(fileContent);

    const galleryItem = data.find((item) => item.id === id);

    if (!galleryItem) {
      return res
        .status(404)
        .json({ success: false, message: 'Gallery item not found' });
    }

    return res.status(200).json(galleryItem);
  } catch (error) {
    console.error('Error fetching gallery item:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Internal server error' });
  }
};
const deleteGallery = async (req, res) => {
  try {
    const { id } = req.params;

    let data = [];
    try {
      const fileContent = fs.readFileSync(galleryFilePath, 'utf-8');
      data = JSON.parse(fileContent);
    } catch (err) {
      return res.status(404).json({
        success: false,
        message: 'Gallery data file not found.',
      });
    }

    const galleryIndex = data.findIndex((item) => item.id === id);
    if (galleryIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found.',
      });
    }

    const deletedItem = data[galleryIndex];

    const uploadsDir = path.join(process.cwd(), 'public/uploads');
    const imagePath = path.join(uploadsDir, deletedItem.image);

    if (fs.existsSync(imagePath)) {
      try {
        fs.unlinkSync(imagePath);
      } catch (error) {
        console.error('Error deleting image file:', error);
      }
    }

    data.splice(galleryIndex, 1);

    fs.writeFileSync(galleryFilePath, JSON.stringify(data, null, 2));

    res.status(200).json({
      success: true,
      message: 'Gallery item deleted successfully.',
      data: deletedItem,
    });
  } catch (error) {
    console.error('Error deleting gallery item:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

export {
  insertGallery,
  fetchAllGallery,
  fetchSingleGallery,
  updateGallery,
  deleteGallery,
};
