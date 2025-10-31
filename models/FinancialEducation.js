const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FinancialEducation = sequelize.define('FinancialEducation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: DataTypes.ENUM('budgeting', 'saving', 'earning', 'investing', 'banking', 'digital_money'),
    allowNull: false,
  },
  coverImage: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'financial_educations',
  timestamps: true,
});

module.exports = FinancialEducation;