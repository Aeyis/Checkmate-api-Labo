import dayjs from "dayjs";
import { MemberNotFoundError } from "../custom-errors/member.error.js";
import {
	PlayerAlreadyRegisteredError,
	PlayerIsOutOfEloRangeError,
	RegistrationClosedError,
	TournamentIsFullError,
	TournamentIsWomenOnlyError,
	TournamentNotFoundError,
} from "../custom-errors/tournament.error.js";
import db from "../database/index.js";
import { Op } from "sequelize";

export const isMemberRegisteredToTournament = async (
	tournamentId,
	memberId,
) => {
	const [result] = await db.sequelize.query(
		`SELECT 1 FROM "TournamentMembers" tm
        WHERE tm."tournamentId" = :tournamentId AND tm."memberId" = :userId`,
		{ replacements: { tournamentId, userId: memberId } },
	);
	return result.length > 0;
};

export const canMemberRegisterToTournament = async (tournamentId, memberId) => {
	const tournament = await db.Tournament.findByPk(tournamentId);
	if (!tournament) {
		throw new TournamentNotFoundError();
	}

	const player = await db.Member.findByPk(memberId);
	if (!player) {
		throw new MemberNotFoundError();
	}

	// check if the player is already registered in the tournament
	const isAlreadyRegistered = await tournament.hasPlayers(player);
	if (isAlreadyRegistered) {
		throw new PlayerAlreadyRegisteredError();
	}

	// check if the tournament is still open for registration
	if (dayjs().isAfter(dayjs(tournament.endRegistrationDate))) {
		throw new RegistrationClosedError();
	}

	// check if the tournament is women only and if the player is a woman
	if (tournament.womenOnly && player.gender !== "F") {
		throw new TournamentIsWomenOnlyError();
	}

	// check if the player have enough ELO to participate
	if (player.elo < tournament.minElo || player.elo > tournament.maxElo) {
		throw new PlayerIsOutOfEloRangeError();
	}

	// check if the player is in the tournament's category
	const tournamentCategories = await tournament.getCategories();
	// if the tournament has categories, check if the player belongs to at least one of them
	if (tournamentCategories.length) {
		// get the minimum and maximum age of the tournament's categories
		const minAge = Math.min(
			...tournamentCategories.map(category => category.minAge),
		);
		const maxAge = Math.max(
			...tournamentCategories.map(category => category.maxAge),
		);

		// compute the player's age
		const playerAge = dayjs().diff(dayjs(player.birthdate), "year");
		if (playerAge < minAge || playerAge > maxAge) {
			throw new PlayerIsOutOfTheCategoriesError();
		}
	}

	// check the number of players already registered in the tournament
	const nbrOfPlayers = await tournament.countPlayers();
	if (nbrOfPlayers >= tournament.maxPlayers) {
		throw new TournamentIsFullError();
	}
	return { tournament, player };
};

export const computePlayerScoreInATournament = async (
	tournamentId,
	playerId,
) => {
	const matches = await db.Match.findAll({
		where: {
			tournamentId: tournamentId,
			result: {
				[Op.ne]: null,
			},
			[Op.or]: [{ whitePlayerId: playerId }, { blackPlayerId: playerId }],
		},
	});

	console.log(matches);

	/*
        - Count the number of victory
        - Count the number of draw
        - Count the number of defeat
        - Compute the score: 1pt for a victory, 0.5pt for a draw, 0pt for a defeat and 0pt for a bye
    */

	let victory = 0;
	let draw = 0;
	let defeat = 0;
	let bye = 0;

	matches.forEach(match => {
		if (match.whitePlayerId === playerId) {
			if (match.result === "white_win") {
				victory++;
			} else if (match.result === "draw") {
				draw++;
			} else if (match.result === "black_win") {
				defeat++;
			} else if (match.result === "bye") {
				bye++;
			}
		} else if (match.blackPlayerId === playerId) {
			if (match.result === "black_win") {
				victory++;
			} else if (match.result === "draw") {
				draw++;
			} else if (match.result === "white_win") {
				defeat++;
			} else if (match.result === "bye") {
				bye++;
			}
		}
	});

	console.log({
		victory,
		draw,
		defeat,
		bye,
	});

	const score = victory * 1 + draw * 0.5 + defeat * 0 + bye * 0.5;

	return {
		victory,
		draw,
		defeat,
		bye,
		score,
	};
};
