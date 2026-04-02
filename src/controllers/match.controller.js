import matchService from "../services/match.service.js";

const matchController = {
	setResult: async (req, res) => {
		const matchId = req.params.matchId;
		const result = req.data.result;

		await matchService.setResult(matchId, result);

		res.status(204).send();
	},
	getMyMatches: async (req, res) => {
		const matches = await matchService.getMyMatches(req.user.id);
		res.json(matches);
	},
};

export default matchController;
