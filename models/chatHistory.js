const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Utilisateur = require("./Utilisateur");

const ChatHistory = sequelize.define('chat_history', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: Utilisateur,
            key: "id",
        },
    },
    userMessage: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    aiResponse: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    context: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
}, {
    tableName: 'chathistory',
    timestamps: true,
});

Utilisateur.hasMany(ChatHistory, { foreignKey: 'userId' });
ChatHistory.belongsTo(Utilisateur, { foreignKey: 'userId' });

module.exports = ChatHistory;
