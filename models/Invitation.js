const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Parent = require("./Parent");
const Jeune = require("./Jeune");

const Invitation = sequelize.define("Invitation", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  senderId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  recipientPhone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM("pending", "accepted", "rejected"),
    defaultValue: "pending",
  },
}, {
  timestamps: true,
  tableName: "invitations",
});

Parent.hasMany(Invitation, { foreignKey: "senderId" });
Jeune.hasMany(Invitation, { foreignKey: "senderId" });

module.exports = Invitation;