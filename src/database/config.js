import { Sequelize } from "sequelize";

const { PG_USER, PG_PASSWORD, PG_HOST, PG_PORT, PG_DATABASE } = process.env;

const sequelize = new Sequelize(PG_DATABASE, PG_USER, PG_PASSWORD, {
	host: PG_HOST,
	port: PG_PORT,
	dialect: "postgres",
});

export default sequelize;
