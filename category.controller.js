import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const filePath = path.join(process.cwd(), 'src/data', 'categories.json');

const fetchAllCategory = async (req, res) => {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const insertCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const imageFile = req.file;

    if (!imageFile) {
      return res
        .status(400)
        .json({ success: false, message: 'No image file uploaded.' });
    }

    if (!name) {
      return res.status(400).json({ message: 'Category name is required.' });
    }

    let data = [];
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      data = JSON.parse(fileContent);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }

    const isDuplicate = data.some(
      (cat) => cat.name.toLowerCase() === name.toLowerCase(),
    );
    if (isDuplicate) {
      return res.status(409).json({ message: 'Category already exists.' });
    }

    const newCategory = {
      id: uuidv4(),
      name: name.trim(),
      img: imageFile.filename,
    };

    data.push(newCategory);

    await fs.writeFile(filePath, JSON.stringify(data, null, 2));

    res.status(201).json({
      success: true,
      message: 'Category added successfully.',
      category: newCategory,
    });
  } catch (error) {
    console.error('Error inserting category:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required.',
      });
    }

    let data = [];
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      data = JSON.parse(fileContent);
    } catch (err) {
      return res.status(404).json({
        success: false,
        message: 'Categories file not found.',
      });
    }

    // Find the category by ID
    const categoryIndex = data.findIndex((cat) => cat.id === id);
    if (categoryIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    // Check for duplicate names (excluding the current category)
    const isDuplicate = data.some(
      (cat, index) =>
        index !== categoryIndex &&
        cat.name.toLowerCase() === name.toLowerCase(),
    );
    if (isDuplicate) {
      return res.status(409).json({
        success: false,
        message: 'A category with this name already exists.',
      });
    }

    data[categoryIndex].name = name.trim();
    if(req.file){
      data[categoryIndex].img = req.file.filename;
    }

    // Write back to the file
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));

    res.status(200).json({
      success: true,
      message: 'Category updated successfully.',
      category: data[categoryIndex],
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Read the current data
    let data = [];
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      data = JSON.parse(fileContent);
    } catch (err) {
      return res.status(404).json({
        success: false,
        message: 'Categories file not found.',
      });
    }

    // Find the category by ID
    const categoryIndex = data.findIndex((cat) => cat.id === id);
    if (categoryIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    // Remove the category
    const deletedCategory = data[categoryIndex];
    data.splice(categoryIndex, 1);

    // Write back to the file
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully.',
      category: deletedCategory,
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    // Read the current data
    let data = [];
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      data = JSON.parse(fileContent);
    } catch (err) {
      return res.status(404).json({
        success: false,
        message: 'Categories file not found.',
      });
    }

    // Find the category by ID
    const category = data.find((cat) => cat.id === id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

export {
  insertCategory,
  fetchAllCategory,
  updateCategory,
  deleteCategory,
  getCategoryById,
};
