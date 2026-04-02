import db from "../database/index.js";
import { MatchNotFoundError } from "../custom-errors/match.error.js";
import { TournamentIsNotRunningError } from "../custom-errors/tournament.error.js";

const matchService = {
	setResult: async (matchId, result) => {
		const match = await db.Match.findByPk(matchId, {
			include: [
				{
					model: db.Tournament,
					as: "tournament",
				},
			],
		});
		if (!match) {
			throw new MatchNotFoundError();
		}

		if (match.tournament.status !== "started") {
			throw new TournamentIsNotRunningError();
		}

		match.result = result;
		await match.save();
	},

	getMyMatches: async (memberId) => {
		return await db.Match.findAll({
			where: {
				[db.Sequelize.Op.or]: [
					{ whitePlayerId: memberId },
					{ blackPlayerId: memberId },
				],
			},
			include: [
				{ model: db.Member, as: "whitePlayer" },
				{ model: db.Member, as: "blackPlayer" },
				{ model: db.Tournament, as: "tournament" },
			],
		});
	},
};

export default matchService;