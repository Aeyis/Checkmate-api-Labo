import { DataTypes } from "sequelize";
import sequelize from "../config.js";

const Tournament = sequelize.define(
	"Tournament",
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		location: {
			type: DataTypes.STRING,
			allowNull: true, // Location can be null when the tournament is planned but we don't know where it will take place yet
		},
		minPlayers: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		maxPlayers: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		minElo: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		maxElo: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 3000,
		},
		status: {
			type: DataTypes.ENUM("waiting", "started", "finished", "canceled"),
			allowNull: false,
			defaultValue: "waiting",
		},
		currentRound: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		womenOnly: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
		},
		endRegistrationDate: {
			type: DataTypes.DATE,
			allowNull: false,
		},
		image : { type: DataTypes.STRING, allowNull: true
		},
	},
	{
		timestamps: true,
		paranoid: true,
	},
);

export default Tournament;
