const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FinancialSlide = sequelize.define('FinancialSlide', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  educationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'financial_educations',
      key: 'id'
    }
  },
  slideNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  slideType: {
    type: DataTypes.ENUM('content', 'quiz', 'interactive', 'summary'),
    defaultValue: 'content',
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'financial_slides',
  timestamps: true,
});

module.exports = FinancialSlide;