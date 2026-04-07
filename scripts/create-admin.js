import "dotenv/config";
import db from "../src/database/index.js";
import memberService from "../src/services/member.service.js";

const createAdmin = async () => {
	try {
		console.log("Connecting to the database...");
		await db.sequelize.authenticate();
		console.log("Connection established successfully.");

		const email = "admin@admin.local";

		const existing = await db.Member.findOne({ where: { email } });
		if (existing) {
			console.log("Admin already exists, updating role to admin...");
			existing.role = "admin";
			await existing.save();
			console.log("Admin role restored.");
		} else {
			console.log("Creating admin member...");
			const admin = await memberService.create({
				username: "admin",
				email,
				password: "Test1234=",
				birthdate: "1980-01-01",
				gender: "O",
				elo: 1500,
			});
			admin.role = "admin";
			await admin.save();
			console.log("Admin created successfully.");
		}
	} catch (error) {
		console.error("Error:", error);
	} finally {
		await db.sequelize.close();
	}
};

createAdmin().then(() => process.exit(0));