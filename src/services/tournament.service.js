import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore.js";
import db from "../database/index.js";
import {
	InvalidEloError,
	InvalidEndRegistrationDateError,
	InvalidNumberOfPlayerError,
	NotAllMatchesHaveAResultError,
	PlayerNotRegisteredToTournamentError,
	TournamentAlreadyStartedError,
	TournamentNotFoundError,
	TournamentNotStartedError,
} from "../custom-errors/tournament.error.js";
import { CategoryNotFoundError } from "../custom-errors/category.error.js";
import { MemberNotFoundError } from "../custom-errors/member.error.js";
import { Op } from "sequelize";
import { shuffle } from "../utils/array.utils.js";
import {
	canMemberRegisterToTournament,
	computePlayerScoreInATournament,
	isMemberRegisteredToTournament,
} from "../utils/tournament.utils.js";
import { includes } from "zod";

dayjs.extend(isSameOrBefore);

const tournamentService = {
	create: async data => {
		// check number of players
		if (data.minPlayers > data.maxPlayers) {
			throw new InvalidNumberOfPlayerError();
		}

		// check ELO range
		if (data.minElo > data.maxElo) {
			throw new InvalidEloError();
		}

		// check end registration date
		const validEndRegistrationDate = dayjs()
			.startOf("day")
			.isSameOrBefore(dayjs(data.endRegistrationDate));
		if (!validEndRegistrationDate) {
			throw new InvalidEndRegistrationDateError();
		}

		// find all the categories
		const promises = data.categories.map(categoryId =>
			db.Category.findByPk(categoryId),
		);
		const categories = await Promise.all(promises);
		// check if all categories exist
		if (categories.includes(null)) {
			throw new CategoryNotFoundError();
		}

		// create the tournament
		const newTournament = await db.Tournament.create(data);

		// associate the tournament with the categories
		await newTournament.addCategories(categories);

		newTournament.categories = categories;

		return newTournament;
	},

	delete: async tournamentId => {
		const tournament = await db.Tournament.findByPk(tournamentId);
		if (!tournament) {
			throw new TournamentNotFoundError();
		}

		if (tournament.status !== "waiting") {
			throw new TournamentAlreadyStartedError();
		}

		const players = await tournament.getPlayers();

		await tournament.destroy();
		return players;
	},

	getAll: async (filter, pagination, requester = null) => {
		const where = {};

		if (filter) {
			if (filter.name) {
				where.name = { [Op.iLike]: `%${filter.name}%` };
			}

			if (filter.location) {
				where.location = { [Op.iLike]: `%${filter.location}%` };
			}

			if (filter.minElo) {
				where.minElo = { [Op.gte]: filter.minElo };
			}

			if (filter.maxElo) {
				where.maxElo = { [Op.lte]: filter.maxElo };
			}

			if (filter.fitElo) {
				if (filter.fitElo && !where.minElo && !where.maxElo) {
					where.minElo = { [Op.lte]: filter.fitElo };
					where.maxElo = { [Op.gte]: filter.fitElo };
				} else {
					const fitEloAnd = [
						{
							minElo: { [Op.lte]: filter.fitElo },
							maxElo: { [Op.gte]: filter.fitElo },
						},
					];
					if (where.minElo) {
						fitEloAnd.push({ minElo: where.minElo });
						delete where.minElo;
					}
					if (where.maxElo) {
						fitEloAnd.push({ maxElo: where.maxElo });
						delete where.maxElo;
					}
					where[Op.and] = fitEloAnd;
				}
			}

			if (filter.womenOnly) {
				where.womenOnly = true;
			}

			if (filter.fromDate) {
				where.endRegistrationDate = { [Op.gte]: filter.fromDate };
			}
		}

		const order = [];
		if (pagination) {
			if (pagination.sortBy) {
				order.push([pagination.sortBy, pagination.sortOrder || "ASC"]);
			}
		} else {
			order.push(["registrationDate", "DESC"]);
		}

		// find all tournaments with the specified filters and pagination
		let { rows: tournaments, count } = await db.Tournament.findAndCountAll({
			where,
			order,
			include: [
				{
					model: db.Category,
					as: "categories",
				},
			],
			limit: pagination?.limit || 20,
			offset: pagination?.offset || 0,
			distinct: true, // to avoid counting duplicates when a tournament has multiple categories
		});

		// count the number of players for each tournament and add it to the tournament object
		const nbrOfPlayersPromises = tournaments.map(async tournament => {
			tournament.nbrOfPlayers = await tournament.countPlayers();
			return tournament;
		});
		tournaments = await Promise.all(nbrOfPlayersPromises);


		//boucle qui vérifie que pour chaque tournoi est en waiting et la date est passée = 'finished'
		for (const tournament of tournaments) {
			if (tournament.status === "waiting" && dayjs().isAfter(dayjs(tournament.endRegistrationDate))) {
				tournament.status = 'finished';
				await tournament.save();
			}
		}
		if (requester) {
			// check if the user is registered to each tournament
			const isUserRegisteredPromises = tournaments.map(
				async tournament => {
					tournament.isRegistered =
						await isMemberRegisteredToTournament(
							tournament.id,
							requester.id,
						);
					return tournament;
				},
			);
			tournaments = await Promise.all(isUserRegisteredPromises);

			// check if the user can register to each tournament
			const canUserRegisterPromises = tournaments.map(
				async tournament => {
					try {
						await canMemberRegisterToTournament(
							tournament.id,
							requester.id,
						);
						tournament.canRegister = true;
					} catch (error) {
						tournament.canRegister = false;
					}
					return tournament;
				},
			);
			tournaments = await Promise.all(canUserRegisterPromises);
		}

		return { tournaments, count };
	},

	getById: async (tournamentId, requester = null) => {
		const tournament = await db.Tournament.findByPk(tournamentId, {
			include: [
				{
					model: db.Category,
					as: "categories",
				},
				{
					model: db.Member,

					as: "players",
					through: { attributes: [] }, // to exclude the join table attributes
				},

			],
		});
		if (!tournament) {
			throw new TournamentNotFoundError();
		}

		if (tournament.status === 'waiting' && dayjs().isAfter(dayjs(tournament.endRegistrationDate))) {
			tournament.status = 'finished';
			await tournament.save();
		}

		if (requester) {
			// check if the user is registered to the tournament
			tournament.isRegistered = await isMemberRegisteredToTournament(
				tournament.id,
				requester.id,
			);

			// check if the requester can register
			try {
				await canMemberRegisterToTournament(
					tournament.id,
					requester.id,
				);
				tournament.canRegister = true;
			} catch (error) {
				tournament.canRegister = false;
			}
		}

		return tournament;
	},

	participate: async (tournamentId, playerId) => {
		const { tournament, player } = await canMemberRegisterToTournament(
			tournamentId,
			playerId,
		);

		await tournament.addPlayers(player);
	},

	unparticipate: async (tournamentId, playerId) => {
		const tournament = await db.Tournament.findByPk(tournamentId);
		if (!tournament) {
			throw new TournamentNotFoundError();
		}

		const player = await db.Member.findByPk(playerId);
		if (!player) {
			throw new MemberNotFoundError();
		}

		// check if the player is registered in the tournament
		const isRegistered = await tournament.hasPlayers(player);
		if (!isRegistered) {
			throw new PlayerNotRegisteredToTournamentError();
		}

		// check if the tournament has already started
		if (tournament.status !== "waiting") {
			throw new TournamentAlreadyStartedError();
		}

		await tournament.removePlayers(player);
	},

	start: async tournamentId => {
		const tournament = await db.Tournament.findByPk(tournamentId);
		if (!tournament) {
			throw new TournamentNotFoundError();
		}

		// check if the tournament is already started
		if (tournament.status !== "waiting") {
			throw new TournamentAlreadyStartedError();
		}

		// check if the tournament has enough players to start
		const players = await tournament.getPlayers();
		if (players.length < tournament.minPlayers) {
			throw new InvalidNumberOfPlayerError();
		}

		// check if the number of players is even
		if (players.length % 2 !== 0) {
			throw new InvalidNumberOfPlayerError();
		}

		tournament.status = "started";
		tournament.currentRound = 1;

		// generate Round Robin matches

		// shuffle players
		shuffle(players);

		const n = players.length;
		const totalRoundsPerLeg = n - 1;
		let playerList = [...players]; // create a copy of the players array to manipulate
		const matches = [];

		// generate HOME matches
		for (let round = 0; round < totalRoundsPerLeg; round++) {
			for (let i = 0; i < n / 2; i++) {
				const whitePlayer = playerList[i];
				const blackPlayer = playerList[n - 1 - i];

				matches.push({
					tournamentId: tournament.id,
					round: round + 1,
					whitePlayerId: whitePlayer.id,
					blackPlayerId: blackPlayer.id,
				});
			}
			// rotate players for the next round
			playerList.splice(1, 0, playerList.pop());
		}

		// generate the return matches and inverse the 2 players
		const returnMatches = matches.map(match => ({
			tournamentId: match.tournamentId,
			round: match.round + totalRoundsPerLeg,
			whitePlayerId: match.blackPlayerId,
			blackPlayerId: match.whitePlayerId,
		}));

		await db.Match.bulkCreate([...matches, ...returnMatches]);
		await tournament.save();
	},

	nextRound: async tournamentId => {
		const tournament = await db.Tournament.findByPk(tournamentId);
		if (!tournament) {
			throw new TournamentNotFoundError();
		}

		// check if the tournament is running (so if the status is something else than started)
		if (tournament.status !== "started") {
			throw new TournamentAlreadyStartedError();
		}

		const matches = await tournament.getMatches({
			where: { round: tournament.currentRound },
		});

		// check if all round has a result
		if (matches.some(match => match.result === null)) {
			throw new NotAllMatchesHaveAResultError();
		}

		tournament.currentRound++;

		//ajout fonction pointe round suivant, recup matches, et si aucuns match n'existe = terminé
		const nextRoundMatches = await tournament.getMatches({
			where:{ round: tournament.currentRound },
		});
		if (nextRoundMatches.length === 0) {
			tournament.status = 'finished';
		}
		await tournament.save();
	},

	scoreOfPlayer: async (tournamentId, playerId) => {
		const player = await db.Member.findByPk(playerId);
		if (!player) {
			throw new MemberNotFoundError();
		}

		const tournament = await db.Tournament.findByPk(tournamentId);
		if (!tournament) {
			throw new TournamentNotFoundError();
		}

		if (tournament.status === "waiting") {
			throw new TournamentNotStartedError();
		}

		const score = await computePlayerScoreInATournament(
			tournamentId,
			playerId,
		);

		score.player = player;

		return score;
	},

	allPlayersScores: async tournamentId => {
		const tournament = await db.Tournament.findByPk(tournamentId);
		if (!tournament) {
			throw new TournamentNotFoundError();
		}

		if (tournament.status === "waiting") {
			throw new TournamentNotStartedError();
		}

		const players = await tournament.getPlayers();
		const scorePromises = players.map(async player => {
			const score = await computePlayerScoreInATournament(
				tournamentId,
				player.id,
			);

			score.player = player;

			return score;
		});

		const scores = await Promise.all(scorePromises);

		return scores.sort((a, b) => b.score - a.score);
	},

	getRoundMatches: async (tournamentId, round = null) => {
		const tournament = await db.Tournament.findByPk(tournamentId);
		if (!tournament) {
			throw new TournamentNotFoundError();
		}

		if (tournament.status === "waiting") {
			throw new TournamentNotStartedError();
		}

		const targetRound = round || tournament.currentRound;

		const matches = await tournament.getMatches({
			where: { round: targetRound },
			include: [
				{
					model: db.Member,
					as: "whitePlayer",
				},
				{
					model: db.Member,
					as: "blackPlayer",
				},
			],
		});

		return { round: targetRound, matches };
	},
};

export default tournamentService;
