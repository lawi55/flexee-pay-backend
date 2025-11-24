const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FinancialVideo = sequelize.define('FinancialVideo', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },

  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  category: {
    type: DataTypes.ENUM(
      'budgeting',
      'saving',
      'earning',
      'investing',
      'banking',
      'digital_money'
    ),
    allowNull: false,
  },

  // Cloudinary URL to mp4 (or m3u8 later if you want streaming)
  videoUrl: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  // Optional: if not provided, frontend can auto-generate from videoUrl
  thumbnailUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  // in minutes (keeps UI simple)
  estimatedDuration: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  // optional: ordering inside a category
  orderIndex: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },

}, {
  tableName: 'financial_videos',
  timestamps: true,
});

module.exports = FinancialVideo;
