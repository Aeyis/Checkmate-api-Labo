import db from "../database/index.js";
import {
	RoundMatchesDto,
	PlayerScoreDto,
	TournamentDetailsDto,
	TournamentListingDto,
} from "../dtos/tournament.dto.js";
import tournamentService from "../services/tournament.service.js";

const tournamentController = {
	create: async (req, res) => {
		const newTournament = await tournamentService.create(req.data);

		res.status(201).json({
			data: new TournamentListingDto(newTournament),
		});
	},

	delete: async (req, res) => {
		const tournamentId = +req.params.id;

		const players = await tournamentService.delete(tournamentId);

		// TODO send email to the members registered to the tournament to inform them that the tournament has been canceled

		res.status(204).send();
	},

	getAll: async (req, res) => {
		const {
			name,
			location,
			minElo,
			maxElo,
			fitElo,
			womenOnly,
			fromDate,
			offset,
			limit,
			sortBy,
			sortOrder,
		} = req.validatedQuery || {};
		const filter = {
			name,
			location,
			minElo,
			maxElo,
			fitElo,
			womenOnly,
			fromDate,
		};
		const pagination = { offset, limit, sortBy, sortOrder };

		const { tournaments, count } = await tournamentService.getAll(
			filter,
			pagination,
			req.user,
		);
		const tournamentDtos = tournaments.map(
			tournament => new TournamentListingDto(tournament),
		);

		res.json({
			total: count,
			data: tournamentDtos,
		});
	},

	getById: async (req, res) => {
		const tournamentId = +req.params.id;
		const tournament = await tournamentService.getById(
			tournamentId,
			req.user,
		);

		if (!tournament) {
			return res.status(404).json({ message: "Tournament not found" });
		}

		res.status(200).json({
			data: new TournamentDetailsDto(tournament),
		});
	},

	participate: async (req, res) => {
		const tournamentId = +req.params.id;
		let { memberId } = req.data || {};

		// if memberId is not provided, use the id of the connected user
		if (!memberId) {
			memberId = req.user.id;
		}

		await tournamentService.participate(tournamentId, memberId);

		// TODO send email to the member to confirm his participation

		res.status(204).send();
	},

	unparticipate: async (req, res) => {
		const tournamentId = +req.params.id;
		let { memberId } = req.data || {};

		// if memberId is not provided, use the id of the connected user
		if (!memberId) {
			memberId = req.user.id;
		}

		await tournamentService.unparticipate(tournamentId, memberId);

		// TODO send email to the member to confirm his unparticipation

		res.status(204).send();
	},

	start: async (req, res) => {
		const tournamentId = +req.params.id;

		await tournamentService.start(tournamentId);

		// TODO send email to the members registered to the tournament to inform them that the tournament has started

		res.status(204).send();
	},

	nextRound: async (req, res) => {
		const tournamentId = +req.params.id;

		await tournamentService.nextRound(tournamentId);

		// TODO send email to the members registered to the tournament to inform them that the next round has started

		res.status(204).send();
	},

	scoreOfPlayer: async (req, res) => {
		const tournamentId = +req.params.id;
		const playerId = req.params.playerId;

		const score = await tournamentService.scoreOfPlayer(
			tournamentId,
			playerId,
		);

		res.status(200).json({
			data: new PlayerScoreDto(score),
		});
	},

	allPlayersScores: async (req, res) => {
		const tournamentId = +req.params.id;

		const scores = await tournamentService.allPlayersScores(tournamentId);

		res.status(200).json({
			data: scores.map(score => new PlayerScoreDto(score)),
		});
	},

	getCurrentRoundMatches: async (req, res) => {
		const tournamentId = +req.params.id;

		const { round, matches } =
			await tournamentService.getRoundMatches(tournamentId);

		res.status(200).json({
			data: new RoundMatchesDto(round, matches),
		});
	},

	getRoundMatches: async (req, res) => {
		const tournamentId = +req.params.id;
		const round = +req.params.round;

		const matches = await tournamentService.getRoundMatches(
			tournamentId,
			round,
		);

		res.status(200).json({
			data: new RoundMatchesDto(round, matches),
		});
	},
};
export const uploadImage = async (req, res, next) => {
	try {
		const tournament = await db.Tournament.findByPk(req.params.id);
		tournament.image = `/uploads/${req.file.filename}`;
		await tournament.save();
		res.json({ image: tournament.image });
	} catch (e) {
		next(e);
	}
};

export default tournamentController;
